# GreatRead admin

React 19 + Vite 8 + Tailwind 3 single-page app for managing books, categories and top picks.
Production: `https://admin.greatread.himaiz.com` (Cloudflare Worker `greatread-admin`), talking to `https://api.greatread.himaiz.com`.

## Scripts

- `npm run dev` starts Vite on port 5174. `/auth` and `/admin` are proxied to the API.
- `npm run build` writes the static site to `dist/`.
- `npm run preview` serves the build on port 5174.
- `npm run lint` runs ESLint with zero warnings allowed.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `https://api.greatread.himaiz.com` | API origin used by the browser. `.env.development` sets it to empty so dev requests go through the proxy. |
| `VITE_API_PROXY_TARGET` | `https://api.greatread.himaiz.com` | Dev-server proxy target (dev only). |

Note: the API session cookie is `SameSite=Strict` and host-only on the API host, so a dev server on `localhost`
only works against an API that allows it (for example a local server on the same proxy target).

## Deployment

Cloudflare Workers Builds deploys this folder on every push to `main` that touches `admin/*` (`npm run build`, then
`npx wrangler deploy` with `wrangler.toml`). Unknown routes fall back to `/index.html`, and `public/_headers` sets a
strict CSP and other security headers. If the API origin changes, update `connect-src` in `public/_headers` too.
Fonts are bundled (`@fontsource-variable/manrope`); there are no third-party requests besides cover images
from `https://storage.googleapis.com`.
