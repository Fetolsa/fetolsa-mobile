import { execSync } from "node:child_process";
import { existsSync, mkdirSync, copyFileSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { injectTenantConfig } from "./inject-config.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const BUILD_OUT = join(REPO_ROOT, "build");

function loadDotenv() {
  const envPath = join(REPO_ROOT, ".env");
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, "utf-8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/i);
    if (!m) continue;
    if (process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2];
    }
  }
}

function autoDetectJavaHome(): string | null {
  if (process.env.JAVA_HOME && existsSync(join(process.env.JAVA_HOME, "bin", "java.exe"))) {
    return process.env.JAVA_HOME;
  }
  const candidates = [
    "C:\\Program Files\\Android\\Android Studio\\jbr",
    "C:\\Program Files\\Java\\jdk-21",
    "C:\\Program Files\\Java\\jdk-17",
    "C:\\Program Files\\Eclipse Adoptium\\jdk-21",
    "C:\\Program Files\\Eclipse Adoptium\\jdk-17",
  ];
  for (const c of candidates) {
    if (existsSync(join(c, "bin", "java.exe")) || existsSync(join(c, "bin", "java"))) {
      return c;
    }
  }
  return null;
}

function autoDetectAndroidSdk(): string | null {
  if (process.env.ANDROID_HOME && existsSync(process.env.ANDROID_HOME)) {
    return process.env.ANDROID_HOME;
  }
  const home = process.env.LOCALAPPDATA || process.env.HOME || "";
  const candidates = [
    join(home, "Android", "Sdk"),
    "C:\\Android\\Sdk",
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return null;
}

loadDotenv();

const javaHome = autoDetectJavaHome();
if (javaHome) {
  process.env.JAVA_HOME = javaHome;
  const javaBin = join(javaHome, "bin");
  process.env.Path = process.env.PATH ? `${javaBin};${process.env.PATH}` : javaBin;
  process.env.PATH = process.env.Path;
  console.log(`JAVA_HOME = ${javaHome}`);
}

const sdkRoot = autoDetectAndroidSdk();
if (sdkRoot) {
  process.env.ANDROID_HOME = sdkRoot;
  process.env.ANDROID_SDK_ROOT = sdkRoot;
  console.log(`ANDROID_HOME = ${sdkRoot}`);
}

interface Args {
  tenant: string;
  app: "customer" | "rider";
  buildType: "release" | "debug";
}

function parseArgs(): Args {
  const args: Record<string, string> = {};
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--(\w+)=(.+)$/);
    if (m) args[m[1]] = m[2];
  }
  if (!args.tenant) throw new Error("--tenant=<code> required");
  if (!args.app) throw new Error("--app=customer|rider required");
  if (args.app !== "customer" && args.app !== "rider") {
    throw new Error(`--app must be customer or rider, got: ${args.app}`);
  }
  return {
    tenant: args.tenant,
    app: args.app as "customer" | "rider",
    buildType: (args.buildType as "release" | "debug") || "release",
  };
}

function step(label: string, fn: () => void) {
  const start = Date.now();
  console.log(`\n>>> ${label}`);
  fn();
  console.log(`    ok (${((Date.now() - start) / 1000).toFixed(1)}s)`);
}

function run(cmd: string, cwd: string) {
  console.log(`    $ ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit", shell: process.platform === "win32" ? "powershell.exe" : "/bin/sh" });
}

function ensureLocalProperties(appDir: string) {
  const localProps = join(appDir, "android", "local.properties");
  const sdk = process.env.ANDROID_HOME;
  if (!sdk) {
    throw new Error("ANDROID_HOME not set and Android SDK not auto-detected. Install Android Studio + SDK first.");
  }
  const escaped = sdk.replace(/\\/g, "\\\\").replace(/:/g, "\\:");
  const content = `sdk.dir=${escaped}\n`;
  if (!existsSync(localProps) || readFileSync(localProps, "utf-8") !== content) {
    require("node:fs").writeFileSync(localProps, content, "utf-8");
  }
}

function main() {
  const { tenant, app, buildType } = parseArgs();
  console.log(`Building ${tenant}/${app} (${buildType})`);

  const appDir = join(REPO_ROOT, "apps", app);
  if (!existsSync(appDir)) {
    throw new Error(`App not found: apps/${app}`);
  }

  let config!: ReturnType<typeof injectTenantConfig>;
  step("Inject tenant config + assets", () => {
    config = injectTenantConfig({ tenantCode: tenant, appKind: app });
  });

  step("Capacitor asset generation", () => {
    run(`npx -y @capacitor/assets generate --android`, appDir);
  });

  step("Vite production build", () => {
    run(`pnpm build:web`, appDir);
  });

  step("Capacitor sync to native project", () => {
    run(`npx cap sync android`, appDir);
  });

  step("Write android/local.properties", () => {
    ensureLocalProperties(appDir);
  });

  if (buildType === "release") {
    step("Verify signing env vars", () => {
      const required = ["OYASYNC_KEYSTORE_PATH", "OYASYNC_KEYSTORE_PASSWORD", "OYASYNC_KEY_ALIAS"];
      for (const k of required) {
        if (!process.env[k]) {
          throw new Error(
            `Missing env var: ${k}\n` +
              `Set it in .env at repo root, or in current shell. See .env.example.`,
          );
        }
      }
    });
  }

  step(`Gradle ${buildType} build`, () => {
    const task = buildType === "release" ? "assembleRelease" : "assembleDebug";
    const gradleCmd = process.platform === "win32" ? ".\\gradlew.bat" : "./gradlew";
    run(`${gradleCmd} ${task}`, join(appDir, "android"));
  });

  step("Copy APK to build/", () => {
    if (!existsSync(BUILD_OUT)) mkdirSync(BUILD_OUT, { recursive: true });
    const subdir = buildType === "release" ? "release" : "debug";
    const apkSrcDir = join(appDir, "android", "app", "build", "outputs", "apk", subdir);
    const fs = require("node:fs");
    const found = fs.readdirSync(apkSrcDir).filter((f: string) => f.endsWith(".apk"));
    if (found.length === 0) throw new Error(`No APK in ${apkSrcDir}`);
    const apkPath = join(apkSrcDir, found[0]);

    const ver = config.customer.versionName + "-" + config.customer.versionCode;
    const outName = `${tenant}-${app}-${ver}${buildType === "release" ? "" : "-debug"}.apk`;
    const outPath = join(BUILD_OUT, outName);
    copyFileSync(apkPath, outPath);
    console.log(`    APK: ${outPath}`);
  });

  console.log(`\nDone. APK in build/`);
}

main();