# Village Chief

Anchor tenant. Lagos/Abuja restaurant chain.

## Files

- `config.json` - tenant config (validated against `@fetolsa/tenant-loader` schema)
- `assets/` - branded icons + splash (added in PR #3)
- `google-services.json` - Firebase config, gitignored, lives in build secrets

## Build

    pnpm build:android:villagechief:customer
    pnpm build:android:villagechief:rider

(scripts added in PR #4)