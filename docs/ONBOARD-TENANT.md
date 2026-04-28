# Onboarding a new tenant (target: under 1 day)

## 1. Generate keystore (one-time)

    cd C:\oyasync-keystores
    keytool -genkeypair -v -keystore <tenant>-customer.keystore -alias <tenant>-customer -keyalg RSA -keysize 2048 -validity 9125 -storetype PKCS12 -dname "CN=<Display Name>, OU=Fetolsa, O=OyaSync Holdings, L=Lagos, ST=Lagos, C=NG"

Save password in 1Password as "OyaSync Keystore - <tenant>-customer".
Back up keystore to 3 locations (cloud, USB, password manager).

## 2. Add tenant config

Create tenants/<tenant>/config.json based on the schema in
packages/tenant-loader/src/schema.ts. Reference tenants/villagechief/config.json
as the template.

Validate:

    pnpm verify:tenant <tenant>

## 3. Add tenant assets

Drop into tenants/<tenant>/assets/:
- icon.png         (1024x1024, master icon)
- adaptive-fg.png  (1024x1024, foreground in 66% safe zone, transparent bg)
- adaptive-bg.png  (1024x1024, solid background color)
- splash.png       (2732x2732, launch splash)

## 4. Set build env vars

In .env at repo root:

    OYASYNC_KEYSTORE_PATH=C:/oyasync-keystores
    OYASYNC_KEYSTORE_PASSWORD=<from password manager>
    OYASYNC_KEY_ALIAS=<tenant>-customer

## 5. Configure Android signing (one-time per app)

Create apps/customer/android/signing.gradle:

    android {
        signingConfigs {
            release {
                storeFile file(System.getenv("OYASYNC_KEYSTORE_PATH") + "/<tenant>-customer.keystore")
                storePassword System.getenv("OYASYNC_KEYSTORE_PASSWORD")
                keyAlias System.getenv("OYASYNC_KEY_ALIAS")
                keyPassword System.getenv("OYASYNC_KEYSTORE_PASSWORD")
            }
        }
        buildTypes {
            release {
                signingConfig signingConfigs.release
            }
        }
    }

Add `apply from: "signing.gradle"` to apps/customer/android/app/build.gradle (already done for VC).

## 6. Build the APK

    pnpm build:android:<tenant>:customer

Output: build/<tenant>-customer-<version>.apk

## 7. Test

    adb install build/<tenant>-customer-<version>.apk

## 8. Submit to Play

Upload the AAB (use `bundleRelease` instead of `assembleRelease` for store submission).
First listing setup in Play Console takes 30-60 min, screenshots and copy.