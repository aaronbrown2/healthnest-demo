# HealthNest Cloudflare Demo Deployment

This branch deploys the portfolio demo as a Cloudflare Pages app with D1-backed
session state.

## Architecture

- React builds to `code/frontend/dist`.
- Cloudflare Pages serves the static app.
- Pages Functions under `code/frontend/functions/api` provide the demo API.
- D1 stores fictional demo data.
- Each browser gets a random `X-Demo-Session-Id`; mutable data is copied from
  the `template` seed rows into that session on first use.
- Sessions older than seven days are cleaned opportunistically by API requests.

## Cloudflare Setup

Create a D1 database:

```bash
npx wrangler d1 create healthnest-demo
```

Copy the returned `database_id` into `code/frontend/wrangler.toml`.

Apply migrations locally while developing:

```bash
npx wrangler d1 migrations apply healthnest-demo --local
```

Apply migrations to Cloudflare before production deploys:

```bash
npx wrangler d1 migrations apply healthnest-demo --remote
```

Configure Cloudflare Pages:

```text
Root directory: code/frontend
Build command: npm ci && npm run build
Build output directory: dist
Environment variable: VITE_HEALTHNEST_DEMO=true
D1 binding: DB -> healthnest-demo
```

For local Cloudflare testing:

```bash
cd code/frontend
VITE_HEALTHNEST_DEMO=true npm run build
npx wrangler pages dev dist
```
