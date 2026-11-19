# Great Read - Inspiration in Non-Fiction Books

![Cover Image](./client/public/Cover.jpg)

## Important Links

- **Production:** [https://greatread.himaiz.com/](https://greatread.himaiz.com/)
- **Admin:** [https://admin.greatread.himaiz.com/](https://admin.greatread.himaiz.com/)
- **API:** [https://api.greatread.himaiz.com/](https://api.greatread.himaiz.com/)
- **Development:** [https://great-read-dev.vercel.app/](https://great-read-dev.vercel.app/)

## Architecture

| Part | Code | Hosting |
|---|---|---|
| Frontend (React + Vite) | `client/` | Vercel project `great-read` (`great-read-maiz.vercel.app`) |
| Admin (React + Vite) | `admin/` | Vercel project `great-read-admin` |
| API (Express) | `server/` | Cloud Run service `great-read-maiz-portfolio`, project `maiz-portfolio`, `us-central1` |
| DNS | — | Cloudflare (`himaiz.com`), DNS only: `greatread` and `admin.greatread` → Vercel, `api.greatread` → Cloud Run domain mapping |

Integrations: MongoDB Atlas, Stripe Checkout + webhook (`/webhooks/stripe`), Google Cloud Storage
(`greatread-books` for public images, `greatread-purchases` for paid downloads via signed URLs; both in
`us-central1`, inside the free tier), and Gmail SMTP for password-reset emails. Purchased notes are generated as
DOCX and converted to PDF by LibreOffice inside the server image (`server/controllers/convertToPDF.js`; Manrope
and Liberation fonts are installed there).

## Deployment

- **CI:** `.github/workflows/ci.yml` lints and builds the client and admin apps and checks the server on every push and PR.
- **Frontends:** Vercel deploys `main` to production automatically (`client/` and `admin/` are separate projects).
  Optional build env vars: `VITE_API_BASE_URL` (both) and `VITE_SITE_URL` (client); defaults are the production hostnames above.
  Security headers (CSP, HSTS, framing) live in each app's `vercel.json`.
- **Backend:** a Cloud Build trigger in `maiz-portfolio` builds `server/Dockerfile` and deploys on every push to
  `main`, then deletes the image from Artifact Registry: Cloud Run keeps its own copy, so the registry stays empty
  and free (a cleanup policy deletes anything older than a day as a backstop). A rollback means redeploying an older
  commit. The service runs as `great-read-maiz-portfolio@maiz-portfolio.iam.gserviceaccount.com`, which also signs
  GCS URLs. `server/update-config.sh` rebuilds from source with the runtime config in the gitignored
  `server/.cloudrun-env.yaml` (a config change needs an image), then empties the registry again:
  `CLIENT_URL`, `ADMIN_URL`, `MONGO_DB_URL`, `SESSION_SECRET`, `BCRYPT_SALT`, `EMAIL_USER`, `EMAIL_PASS`,
  `STRIPE_PRIVATE_KEY`, `STRIPE_WEBHOOK_SECRET`
  (optional: `ALLOWED_ORIGINS`, `GCS_BUCKET`, `GCS_PURCHASE_BUCKET`).
- **Custom domains:** `greatread.himaiz.com` and `admin.greatread.himaiz.com` are domains on their Vercel projects
  (Cloudflare CNAMEs to Vercel, DNS only). `api.greatread.himaiz.com` is a Cloud Run domain mapping (Cloudflare
  CNAME to `ghs.googlehosted.com`, DNS only; `himaiz.com` is verified in Search Console for the deploying account).
  The Stripe webhook endpoint points at `https://api.greatread.himaiz.com/webhooks/stripe`.
- **Security:** sessions are HttpOnly, Secure, SameSite=Strict cookies on the API host; state-changing `/auth` and
  `/admin` requests must come from an allowed `Origin`. Every route except the Stripe webhook is rate limited per IP
  (login and password reset also per email), with counters shared across instances in MongoDB (`rateLimits`).
- **Google Cloud access:** the API's service account has only Storage Object Admin on the two buckets plus Token
  Creator on itself (to sign download URLs). It has no keys.
- **Images:** uploads are re-encoded with `sharp` (`server/utils/images.js`): covers become JPEG up to 600×900
  (react-pdf in the reading-list export needs JPEG or PNG), category icons PNG up to 512 px.
- **Bucket CORS:** `gcloud storage buckets update gs://greatread-books --cors-file=client/cors.json`.

## Local development

- Server: copy the env keys above into `server/.env`, run
  `gcloud auth application-default login --impersonate-service-account great-read-maiz-portfolio@maiz-portfolio.iam.gserviceaccount.com`
  (needs Token Creator on that account; there are no service account keys), then `npm run dev` in `server/`.
  PDF conversion needs LibreOffice: `soffice` on `PATH` or `SOFFICE_PATH` (or run the server image).
- Client: `npm run dev` in `client/`; admin: `npm run dev` in `admin/` (port 5174). Requests go through the Vite
  proxy to `VITE_API_PROXY_TARGET` (default: production API; use `http://localhost:8080` with a local server so the
  session cookie works).
