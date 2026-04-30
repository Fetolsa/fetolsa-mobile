# Fetolsa Mobile — Architecture

> **For new contributors and AI assistants:** Read this document before touching code. It captures the structural decisions and the gotchas we've already hit so you don't re-discover them painfully. When you make a new architectural decision, update this doc in the same commit.

## What this is

Native mobile customer app for hospitality clients of Fetolsa Systems. First and currently only tenant: **Village Chief** (Nigerian restaurant in Abuja). Architecture is **multi-tenant by config** — additional tenants come online by adding a config file and assets, not by forking code.

Companion apps (rider, dispatch) live in this same monorepo and share the tenant infrastructure.

## Tech stack

- **Frontend**: React 18 + TypeScript + Vite
- **Mobile shell**: Capacitor 6 (Android first; iOS scaffolded but not built out)
- **Styling**: Tailwind CSS + custom CSS vars for tenant theming
- **Animation**: framer-motion
- **Routing**: react-router-dom HashRouter
- **State**: React Context (BranchContext, CartContext, CustomerContext) — no Redux/Zustand yet, hasnt been needed
- **Build**: pnpm 10.x + Turborepo monorepo
- **Backend**: ERPNext/Frappe app `fetolsa_api` on Hetzner, custom doctypes (Delivery Order, Customer, Branch, etc.)

## Repo layout
## Multi-tenancy model

This is the most important architectural decision. **Tenants are config-only**, no per-tenant code branches.

A new tenant comes online by:

1. Creating `tenants/<code>/config.json` (schema-validated against `packages/tenant-loader/src/schema.ts`)
2. Dropping 4 PNG assets in `tenants/<code>/assets/`
3. Adding the API token to `.env` as `<CODE_UPPER>_API_TOKEN=key:secret`
4. Optionally a `google-services.json` for push notifications
5. Running `pnpm build:android:<code>:customer`

The tenant config drives:
- Bundle ID, app name, version (per-app: customer/rider have different bundles)
- API base URL pointing at the tenant's Frappe site
- Theme colors (primary/secondary/background — currently overridden by hardcoded VC palette in components, see Known Drift below)
- Feature flags (delivery, pickup, rooms, aiUpsell, etc.)
- Payment config (Paystack public key, currency, deep link scheme)
- Contact info (phone, address, social handles)
- **`branchAddresses`**: per-branch street addresses for pickup display (added in PR #7.7)
- `launchMode`: "waitlist" or "live" — controls whether the home route shows MenuPage or WaitlistPage

The schema is **`.strict()`** — unknown fields are rejected at load time. This is a feature: it forces you to update the schema when adding new config keys, which forces you to update this doc.

## Build pipeline

`scripts/build-tenant.ts` orchestrates a full build:

1. **inject-config.ts** runs first
   - Loads + validates `tenants/<code>/config.json`
   - Reads API token from `.env` (`<CODE_UPPER>_API_TOKEN`)
   - Writes `apps/<kind>/src/tenant.generated.ts` (gitignored, contains the apiToken)
   - Copies the 4 assets into `apps/<kind>/resources/`
   - Copies `google-services.json` if present
2. **Capacitor Assets** generates all platform-specific densities (mdpi → xxxhdpi for icons; portrait + landscape day + night for splash) from the 4 source PNGs
3. **`pnpm build:web`** runs `tsc -b && vite build` — produces `apps/<kind>/dist/`
4. **`npx cap sync android`** copies dist into the Android project
5. **`./gradlew assembleRelease`** produces the APK
6. The APK gets copied to `build/<tenant>-<kind>-<version>-<code>.apk` for distribution

`tenant.generated.ts` is **gitignored** (contains the apiToken). Re-generated every build. Don't hand-edit.

## Backend (fetolsa_api)

Located at `/home/frappe/fetolsa-bench/apps/fetolsa_api/` on the Hetzner server. Custom Frappe app providing the public API for delivery orders, menu fetch, customer management, payment integration.

**Key endpoints** (all under `/api/method/fetolsa_api.delivery.*`):

- `menu.get_delivery_menu` — returns menu items grouped by category, with the `image` field flowing through (currently empty, ready for HQ uploads)
- `menu.get_branches` — returns branch list. Branch names returned with " Branch" suffix where applicable (e.g. "Gudu Branch", not "Gudu") — see Gotcha #4
- `orders.place_delivery_order` — creates Delivery Order, initializes Paystack, returns `{order_id, payment_url}`. The `order_id` MUST be the real Frappe `doc.name` (`DO-2026-XXXXX`), not the legacy `VC-YYYYMMDD-XXXX` format. See Gotcha #1.
- `orders.get_order_status` — returns order details for TrackPage. Must include `item_name` per item.
- `geo.calculate_delivery_fee` — geocodes customer address, returns `{distance_km, fee, customer_lat, customer_lng, formatted_address, routing_branch}`
- `auth.request_otp` — Termii hosted-PIN flow (NOT bulk SMS — they use different cache shapes; see Gotcha #5)
- `auth.verify_otp_and_register` — returns `{token, customer_id, customer_name, phone, email}`
- `auth.get_customer_profile` — returns `{customer, orders[]}`
- `auth.update_email`, `auth.update_last_address` — profile updates

**Doctypes used**:
- `Delivery Order` — orders. autoname assigns `DO-2026-XXXXX`. Has `paystack_reference`, `order_type`, `pickup_branch`, `payment_status` etc.
- `Customer` — Frappe stock customer
- `Branch` — minimal, currently only has `name` column (no address/lat/lng — that's Path 1 future work)

**Deploy rule**: NEVER `sudo supervisorctl restart all`. Always scoped:
The trailing colons matter — they target only the bench-specific groups, not every supervisor process on the box (which would restart unrelated benches).

## Auth model

**Hybrid guest + token.** A user can fully check out and pay as a guest (PR #6 behavior). Logging in via OTP is optional but unlocks:

- Order history
- Reorder
- Saved address autofill
- Email persistence

Flow:
1. User enters phone → backend calls Termii hosted-PIN, returns `pin_id`, caches it
2. User receives SMS with 6-digit code (when carrier delivers — see Gotcha #5)
3. User enters code + optional name → backend verifies, creates Customer if new, returns `{token, customer_id, ...}`
4. Token stored in `localStorage` as `vc_auth_token`, validated on app boot (invalid → silently cleared)
5. CustomerContext exposes `isLoggedIn`, `customer`, `orders`, `effectiveInfo` (merged guest + logged-in for checkout pre-fill)

OTP delivery to specific Nigerian numbers (especially +2348183519829) sometimes fails at the carrier level — Termii dashboard shows the SMS but it never reaches the phone. This is a Termii / carrier configuration issue, not a code bug. Workaround during development: read the OTP from the Termii dashboard.

## Payment flow

Paystack live integration. Flow:

1. CheckoutModal collects info, calls `place_delivery_order` with `payment_callback_url: "vchief://payment/callback"`
2. Backend creates Delivery Order, calls Paystack init with the constructed callback URL `vchief://payment/callback?order_id=DO-2026-XXX`. Paystack will append `&reference=PSXXX` when it redirects after payment
3. Backend returns `{order_id, payment_url}`
4. Frontend opens `payment_url` in Capacitor Browser using `presentationStyle: "fullscreen"` (more reliable for deep-link auto-close than `popover`)
5. **Belt-and-suspenders post-payment routing** (PR #7.8):
   - Best case: Paystack redirects to `vchief://...`, Android intent filter catches it, App.tsx DeepLinkRouter navigates to `/order/<id>`
   - Fallback case: User taps X on Paystack success page → `Browser.addListener('browserFinished')` fires → frontend navigates manually
6. OrderCallbackPage polls `get_order_status` until `payment_status === "Paid"`, then auto-redirects to TrackPage

**Known issue:** Paystack live transactions show their own static success page that requires the user to tap X. The deep link doesn't auto-fire from that page. Real fix is at Paystack dashboard config level (some accounts can set "Skip success page" / "Auto-redirect after payment"). Until then, the browserFinished listener handles it.

## Order ID convention

**ALWAYS use the Frappe `doc.name` (`DO-2026-XXXXX`).** Never the legacy `VC-YYYYMMDD-XXXX` format.

Why: The Delivery Order doctype has an autoname rule that assigns `DO-2026-XXXXX` on insert. An older code path was generating local `VC-YYYYMMDD-XXXX` strings, setting them as `doc.name`, but the autoname overrode this on save. The local string was returned to the client; the client tried to look it up; backend 404'd because the order was actually saved under `DO-2026-XXXXX`. PR #7.9 fixed this by using `order_doc.name` (post-insert real name) everywhere.

If you see `VC-YYYYMMDD-XXXX` in a response, the bug is back.

## Image-ready architecture (PR #7.5)

The menu has 479 items, all with empty `image` field at time of writing. The mobile app handles this gracefully:

- Backend `get_delivery_menu` already returns `image` per item (empty string for now)
- Frontend `lib/placeholder.ts` generates a **stable hash-based pastel color** + first letter of item name
- `MenuItemRow` shows real image when present, letter-placeholder otherwise
- 10-color palette gives the menu visual rhythm even with zero photos
- When HQ uploads photos to Frappe `Item.image`, mobile picks them up next menu fetch — no app update needed
- `resolveImageUrl(image, siteBase)` in `lib/placeholder.ts` handles absolute URLs, site-relative paths, and relative paths

## Smart pickup addresses (Path 2 — current)

PR #7.7 ships per-branch addresses via tenant config:

```json
"branchAddresses": {
  "Gudu Branch": "57 Road, Lokogoma, Abuja",
  "Garki Area 8": "Bola Tinubu Way, off Mohammadu Buhari Way, Garki Area 8, Abuja",
  ...
}
```

CheckoutModal Pickup card looks up `tenant.branchAddresses?.[branch]` based on the user's selected branch. Falls back to `tenant.contact.address` if the branch isn't mapped.

This is **Path 2** — config-based. **Path 1** (real backend lat/lng on Branch doctype + Haversine distance + auto-pick nearest branch from customer location) is deferred. It needs:
- Backend doctype migration to add `address`, `latitude`, `longitude` to Branch
- Real geocoding of all 6 VC branches
- Frontend distance calc and "use nearest" logic
- A `pick_pickup_branch` endpoint

A parallel chat session attempted Path 1 (`pickup-api.ts` + CheckoutModal integration) but the work was incomplete. Reverted in PR #7.8 to keep main clean. Will be picked up in a future PR with full context.

## Brand assets

Source files live in `tenants/<code>/assets/`:
- `icon.png` (1024×1024) — full app icon
- `adaptive-fg.png` (1024×1024) — adaptive icon foreground (logo on transparent)
- `adaptive-bg.png` (1024×1024) — adaptive icon background (solid color/pattern)
- `splash.png` (2732×2732) — splash screen

`inject-config.ts` copies these into `apps/<kind>/resources/` (renaming `adaptive-fg` → `icon-foreground`, `adaptive-bg` → `icon-background`). Capacitor Assets generator runs during build and produces ~50 platform-specific PNGs in `apps/<kind>/android/app/src/main/res/`. Don't edit those generated files; edit the source.

To swap branding: replace the 4 source files, rebuild. `pm uninstall` the old version on test devices to force the launcher to pick up the new icon (Android caches them).

## Known drift / gotchas

These are real things that have bitten us. Don't re-discover them.

### 1. Order ID convention (PR #7.9)
See "Order ID convention" section above. Use `order_doc.name`, not local-generated IDs.

### 2. `bg-card` is semi-transparent in Capacitor WebView
Tailwind's `bg-card` (which we mapped to white) renders semi-transparent in some Capacitor 6 WebView versions on Android. This caused dropdown panels and modal backgrounds to bleed through to the menu underneath in PRs #7.5–#7.8. **Fix**: use inline `style={{ backgroundColor: "#ffffff" }}` for any modal/drawer/dropdown panel that must be fully opaque. Don't rely on Tailwind background utilities for opacity-critical surfaces.

### 3. Numeric keyboard hint not reliably honored on Android
`inputMode="numeric"` and `inputMode="tel"` don't consistently trigger the numeric keypad in Capacitor WebView 147. Belt-and-suspenders fix: keep the input hints AND filter non-digits on the JS side via `e.target.value.replace(/[^\d+]/g, "")`. Phone number entry stays correct even if the alphabetic keyboard shows up. A future PR can add `@capacitor-community/keyboard` for forced numeric keyboard if it remains a UX problem.

### 4. Branch names have " Branch" suffix
The `get_branches` endpoint returns names like `"Gudu Branch"`, `"Main Branch"`, `"Wuse Branch"`. NOT `"Gudu"`. When mapping these to `branchAddresses` in tenant config, use the full suffixed name. PR #7.7 had a hidden bug where the config used `"Gudu"` and the lookup failed silently — fixed by adding the suffix.

### 5. Termii has TWO different cache shapes — they don't interop
- Bulk SMS path: caches `{otp_code: "123456"}`
- Hosted-PIN path: caches `{pin_id: "abc123"}`
- The verify endpoint expects ONE specific shape. If `request_otp` uses bulk SMS while `verify_otp_and_register` expects hosted-PIN, every verification fails with "OTP expired" even though the OTP IS being sent.
- **Use hosted-PIN end-to-end** (PR #7 fixed this).

### 6. SCHEMA `.strict()` rejects unknown fields silently at build time
Adding a new tenant config field requires updating `packages/tenant-loader/src/schema.ts` FIRST. If you add `branchAddresses` to `tenants/villagechief/config.json` without updating the schema, the loader rejects the whole config and the build fails with a Zod error. PR #7.7 hit this.

### 7. `gradle build` caches aggressively
If the APK timestamp doesn't change after a code edit, the build cache is serving stale output. Nuclear fix:
Then rebuild. Verifying APK `LastWriteTime` is the canary — if it's not within the last minute of your rebuild, you're testing stale code.

### 8. Signing keystore changes break installs
Build script generates a debug keystore that occasionally regenerates (e.g. after deep cache clears). Android refuses to install over an existing app with a different signature: `INSTALL_FAILED_UPDATE_INCOMPATIBLE`. Fix: `adb uninstall <bundle>` then install fresh. Loses login session and cart state on the device.

### 9. The DOM has FOUR drawers and modals that all need opaque backgrounds
LoginModal, AccountDrawer, CartDrawer, EmailPrompt, MenuItemModal, CheckoutModal, CategorySheet, SearchSheet — all of them. When designing new sheets/modals, default to inline `style={{ backgroundColor: "#ffffff" }}` and `bg-black/70 backdrop-blur-md` for the backdrop. Don't trust `bg-card` for opacity.

### 10. `place_delivery_order` had a hardcoded `'delivery'` action (PR #7.9)
Even though the function correctly parsed `is_pickup` from the parameter, it called `create_order(session, 'delivery')` regardless. All Pickup orders saved as Delivery. Fixed by passing the actual action. Always verify pickup-vs-delivery flows end-to-end with real orders, not just unit tests.

## What's deferred (not done, with reasons)

- **Smart pickup Path 1** (lat/lng + Haversine). Requires backend doctype change + manual geocoding of 6 branches.
- **Paystack auto-redirect.** Requires Paystack dashboard config, not code.
- **Capacitor numeric keyboard plugin.** Belt-and-suspenders JS filter is sufficient for now.
- **Multiple saved addresses.** PR #6 decision: most-recent-only.
- **Push notifications.** FCM is wired in tenant config but no order-status hooks yet.
- **Image upload from HQ.** Backend supports it; frontend renders it. Operational task, not engineering.
- **Web app (chiefrestaurant.com) image-ready integration.** Same backend supports it; web app needs the same MenuItemRow refactor.
- **iOS build.** Capacitor scaffolded but never tested on iOS device.
- **Search history / recent searches.** Search works (PR #7.7); persistence is a polish item.
- **Tenant theme override.** Components currently hardcode VC's red/charcoal/cream. Real multi-tenant theming requires switching to CSS vars from the tenant config.
- **Backend git sync.** Server's `fetolsa_api` is 2,107 commits ahead of GitHub remote, 1,288 commits behind. Needs a careful merge session.
- **Anthropic API key rotation.** Pending mitigation:
- **Termii sender ID whitelist for +234 carriers.** OTP arrives in Termii dashboard but not the phone. Carrier-side issue.

## Local development

```powershell
# One-time setup
pnpm install
# Add VILLAGECHIEF_API_TOKEN to .env

# Build APK for Village Chief
Get-Content .env | ForEach-Object { if ($_ -match "^([^#=]+)=(.*)$") { Set-Item -Path "Env:$($matches[1])" -Value $matches[2] } }
pnpm build:android:vc:customer

# Install on connected device
& "$env:ANDROID_HOME\platform-tools\adb.exe" install -r "build\villagechief-customer-1.0.0-1.apk"

# Launch
& "$env:ANDROID_HOME\platform-tools\adb.exe" shell am start -n "app.oyasync.fetolsa.villagechief.customer/.MainActivity"
```

For testing pure code changes without a rebuild: `pnpm dev` runs Vite in browser. Capacitor-specific features (Browser, App URL, deep links) won't work — only useful for layout/state testing.

## Working agreements (for AI assistants and contributors)

- **Read this file before touching anything.**
- **One block of work at a time.** Wait for verification before moving to the next block.
- **Test against real data when possible.** A Paystack live test costs ₦100-500 and is worth more than ten unit tests.
- **Update this file when you make architectural decisions.** Add a Known Drift entry when you discover a new gotcha. Future-you (and future Claude) will thank you.
- **Don't `git push --force` to a remote you didn't set up yourself.** The server backend is currently in a sensitive divergent state.
- **PowerShell for local commands; bash for server.** The repo path on Windows is `C:\Projects\fetolsa-mobile`. Server bench is `/home/frappe/fetolsa-bench/`.

## Document maintenance

This file is canonical. When something here is wrong or stale, fix it in a commit. Drift between the doc and the code is a bug.

Last meaningful update: PR #7.9 (April 30, 2026 — order_id mismatch + pickup order_type + missing item_name backend fixes).