# fetolsa-mobile

Multi-tenant native mobile apps (customer + rider) for Fetolsa Systems hospitality SaaS clients. Each tenant ships as a separately branded app under the OyaSync developer account, sharing one codebase.

## Stack

- Capacitor 6 (Android-first, iOS later) wrapping React/TS web
- pnpm workspaces + Turborepo
- Frappe/ERPNext backend via fetolsa_api endpoints
- FCM for push notifications, Claude Haiku for AI upsell

## Development

    pnpm install
    pnpm typecheck
    pnpm lint

## License

Proprietary - (c) OyaSync Holdings / Fetolsa Systems Limited.
