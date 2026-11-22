# Great Read - Inspiration in Non-Fiction Books

![Cover Image](./client/public/Cover.jpg)

## Important Links

- **Production:** [https://greatread.himaiz.com/](https://greatread.himaiz.com/)
- **Admin:** [https://admin.greatread.himaiz.com/](https://admin.greatread.himaiz.com/)
- **API:** [https://api.greatread.himaiz.com/](https://api.greatread.himaiz.com/)

## Architecture

| Part | Code | Hosting |
|---|---|---|
| Frontend (React + Vite) | `client/` | Cloudflare Worker `greatread-web` (static assets) |
| Admin (React + Vite) | `admin/` | Cloudflare Worker `greatread-admin` (static assets) |
| API edge | `edge/api/` | Cloudflare Worker `greatread-api-edge`, forwarding to Cloud Run |
| API (Express) | `server/` | Cloud Run service `great-read-maiz-portfolio`, project `maiz-portfolio`, `us-central1` |
| DNS and WAF | — | Cloudflare zone `himaiz.com`; all three hostnames are Worker custom domains behind the zone's WAF rules |

Integrations: MongoDB Atlas, Stripe Checkout + webhook (`/webhooks/stripe`), Google Cloud Storage
(`greatread-books` for public images, `greatread-purchases` for paid downloads via signed URLs; both in
`us-central1`, inside the free tier), and Gmail SMTP for password-reset emails. Purchased notes are generated as
DOCX and converted to PDF by LibreOffice inside the server image (`server/controllers/convertToPDF.js`; Manrope
and Liberation fonts are installed there).

## Deployment

- **CI:** `.github/workflows/ci.yml` lints and builds the client and admin apps and checks the server on every push and PR.
- **Frontends:** Cloudflare Workers Builds deploys each app on every push to `main` that touches its folder
  (`client/*` or `admin/*`), running `npm run build` and `npx wrangler deploy` from that folder (`wrangler.toml`).
  Preview builds are off. Optional build env vars: `VITE_API_BASE_URL` (both) and `VITE_SITE_URL` (client); defaults
  are the production hostnames above. Security headers (CSP, HSTS, framing) and asset caching live in each app's
  `public/_headers`.
- **API edge:** `edge/api` forwards every request to the Cloud Run URL with a shared secret (`X-Origin-Auth`) and the
  visitor's address (`X-Client-IP`); `server/utils/originAuth.js` rejects requests without the secret
  (`ORIGIN_AUTH_MODE=enforce`), so the `run.app` URL returns 403. The secret is the Worker secret `ORIGIN_AUTH` and the
  `ORIGIN_AUTH` key in `greatread-secrets`; both must match. Workers Builds deploys the edge on every push to `main`
  that touches `edge/api/*` (no build step, `npx wrangler deploy`); Worker secrets survive deploys.
- **Rollback (Workers):** Cloudflare dashboard → the Worker → Deployments → roll back to an earlier version, or
  `npx wrangler rollback` from the app's folder.
- **WAF:** the `himaiz.com` zone runs Cloudflare's Free Managed Ruleset plus shared custom rules (scanner paths and
  unused methods blocked; `api.greatread` skips the browser checks meant for people, so Stripe webhooks pass). The
  zone's rules are shared by every project and managed outside this repo; change them there, not per app.
- **Backend:** a Cloud Build trigger in `maiz-portfolio` builds `server/Dockerfile` and deploys on every push to
  `main` that touches `server/**` (its `includedFiles` filter; site, edge and docs changes don't redeploy the API),
  then deletes the image from Artifact Registry: Cloud Run keeps its own copy, so the registry stays empty
  and free (a cleanup policy deletes anything older than a day as a backstop). A rollback means redeploying an older
  commit. The service runs as `great-read-maiz-portfolio@maiz-portfolio.iam.gserviceaccount.com`, which also signs
  GCS URLs.
- **Runtime config:** secrets live in one Secret Manager secret, `greatread-secrets`: a JSON object with
  `MONGO_DB_URL`, `SESSION_SECRET`, `EMAIL_PASS`, `STRIPE_PRIVATE_KEY`, `STRIPE_WEBHOOK_SECRET` and `ORIGIN_AUTH`. Cloud Run mounts
  it as `APP_SECRETS`, and `server/index.js` copies its keys into `process.env` at startup. Only the service
  account can read it. Keep only the latest version: after adding one, destroy the old one
  (`gcloud secrets versions destroy`). Non-secret settings are plain env vars in the gitignored
  `server/.cloudrun-env.yaml`: `CLIENT_URL`, `ADMIN_URL`, `EMAIL_USER`, `BCRYPT_SALT` (optional: `ALLOWED_ORIGINS`,
  `GCS_BUCKET`, `GCS_PURCHASE_BUCKET`, `RECAPTCHA_*`). `server/update-config.sh` applies both and rebuilds from
  source, because a config change needs an image, then empties the registry again. Locally, `server/.env` holds
  everything as plain variables.
- **Custom domains:** `greatread.himaiz.com`, `admin.greatread.himaiz.com` and `api.greatread.himaiz.com` are
  custom domains of the three Workers (each `wrangler.toml` declares its own), so the zone's WAF runs in front of all
  of them. The Stripe webhook endpoint points at `https://api.greatread.himaiz.com/webhooks/stripe`.
- **Security:** sessions are HttpOnly, Secure, SameSite=Strict cookies on the API host; state-changing `/auth` and
  `/admin` requests must come from an allowed `Origin`. In production the API trusts only the two production sites
  (`CLIENT_URL` and `ADMIN_URL`) for CORS, that origin check and reCAPTCHA token hostnames; `localhost` is never
  trusted there.
  Server-to-server calls, such as the Stripe webhook, send no `Origin` and are unaffected. Every route except the Stripe webhook is rate limited per IP
  (login and password reset also per email), with counters shared across instances in MongoDB (`rateLimits`).
- **Bot protection:** reCAPTCHA Enterprise (score-based, no checkbox) guards admin login, forgot and reset password
  and the public purchase POST (`server/utils/recaptcha.js`): minimum score 0.3, tokens only from the production
  hostnames, fail-open on Google outages (logged). Kill switch: Cloud Run env `RECAPTCHA_ENABLED=false`.
- **Google Cloud access:** the API's service account has only Storage Object Admin on the two buckets plus Token
  Creator on itself (to sign download URLs). It has no keys.
- **Images:** uploads are re-encoded with `sharp` (`server/utils/images.js`): covers become JPEG up to 600×900
  (react-pdf in the reading-list export needs JPEG or PNG), category icons PNG up to 512 px.
- **Bucket CORS:** `gcloud storage buckets update gs://greatread-books --cors-file=client/cors.json` (production
  origins only).

## Local development

- Server: copy the env keys above into `server/.env`, plus `ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174`
  (local dev servers are trusted only through this) and `RECAPTCHA_ENABLED=false` (the reCAPTCHA key only works on
  the production domains). Then run
  `gcloud auth application-default login --impersonate-service-account great-read-maiz-portfolio@maiz-portfolio.iam.gserviceaccount.com`
  (needs Token Creator on that account; there are no service account keys), then `npm run dev` in `server/`.
  PDF conversion needs LibreOffice: `soffice` on `PATH` or `SOFFICE_PATH` (or run the server image).
- Client: `npm run dev` in `client/`; admin: `npm run dev` in `admin/` (port 5174). Requests go through the Vite
  proxy to `VITE_API_PROXY_TARGET` (default: production API, which works for browsing only; use
  `http://localhost:8080` with a local server for sign-in, admin and purchases).
