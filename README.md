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
| API (Express) | `server/` | Cloud Run service `great-read-image`, project `great-read-398408`, `us-central1` |
| DNS | — | Cloudflare (`himaiz.com`), DNS only: `greatread` and `admin.greatread` → Vercel, `api.greatread` → Cloud Run domain mapping |

Integrations: MongoDB Atlas, Stripe Checkout + webhook (`/webhooks/stripe`), Google Cloud Storage
(`great-read-bucket` for public images, `great-read-purchase` for paid downloads via signed URLs),
GroupDocs Conversion Cloud (docx to PDF) and Gmail SMTP for password-reset emails.

## Deployment

- **CI:** `.github/workflows/ci.yml` lints and builds the client and admin apps and checks the server on every push and PR.
- **Frontends:** Vercel deploys `main` to production automatically (`client/` and `admin/` are separate projects).
  Optional build env vars: `VITE_API_BASE_URL` (both) and `VITE_SITE_URL` (client); defaults are the production hostnames above.
  Security headers (CSP, HSTS, framing) live in each app's `vercel.json`.
- **Backend:** `server/deploy.sh` (needs `gcloud` access to the project). It builds from source with Cloud
  Build and runs as `great-read-service@great-read-398408.iam.gserviceaccount.com`, which also signs
  GCS URLs. Runtime config comes from the gitignored `server/.cloudrun-env.yaml`:
  `CLIENT_URL`, `ADMIN_URL`, `MONGO_DB_URL`, `SESSION_SECRET`, `BCRYPT_SALT`, `EMAIL_USER`, `EMAIL_PASS`,
  `GROUPDOCS_CLIENT_ID`, `GROUPDOCS_CLIENT_SECRET`, `STRIPE_PRIVATE_KEY`, `STRIPE_WEBHOOK_SECRET`
  (optional: `ALLOWED_ORIGINS`, `GCS_BUCKET`, `GCS_PURCHASE_BUCKET`).
- **Custom domains:** `greatread.himaiz.com` and `admin.greatread.himaiz.com` are domains on their Vercel projects
  (Cloudflare CNAMEs to Vercel, DNS only). `api.greatread.himaiz.com` is a Cloud Run domain mapping (Cloudflare
  CNAME to `ghs.googlehosted.com`, DNS only; `himaiz.com` is verified in Search Console for the deploying account).
  The Stripe webhook endpoint points at `https://api.greatread.himaiz.com/webhooks/stripe`.
- **Security:** sessions are HttpOnly, Secure, SameSite=Strict cookies on the API host; state-changing `/auth` and
  `/admin` requests must come from an allowed `Origin`. Every route except the Stripe webhook is rate limited per IP
  (login and password reset also per email), with counters shared across instances in MongoDB (`rateLimits`).
- **Bucket CORS:** `gcloud storage buckets update gs://great-read-bucket --cors-file=client/cors.json`.

## Local development

- Server: copy the env keys above into `server/.env`, set `GOOGLE_APPLICATION_CREDENTIALS` to a service
  account key, then `npm run dev` in `server/`.
- Client: `npm run dev` in `client/`; admin: `npm run dev` in `admin/` (port 5174). Requests go through the Vite
  proxy to `VITE_API_PROXY_TARGET` (default: production API; use `http://localhost:8080` with a local server so the
  session cookie works).
