import type { CapacitorConfig } from "@capacitor/cli";
import { tenant } from "./src/tenant.generated";

const config: CapacitorConfig = {
  appId: tenant.customer.bundleId,
  appName: tenant.customer.appName,
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: tenant.theme.background,
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
    StatusBar: {
      style: "DEFAULT",
      backgroundColor: tenant.theme.background,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;