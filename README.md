# Great Read - Inspiration in Non-Fiction Books

![Cover Image](./client/public/Cover.jpg)

## Important Links

- **Production:** [https://greatread.himaiz.com/](https://greatread.himaiz.com/)
- **Backend (API + admin):** [https://admin.greatread.himaiz.com/](https://admin.greatread.himaiz.com/)
- **Development:** [https://great-read-dev.vercel.app/](https://great-read-dev.vercel.app/)

## Architecture

| Part | Code | Hosting |
|---|---|---|
| Frontend (React + Vite) | `client/` | Vercel project `great-read` (`great-read-maiz.vercel.app`) |
| API + admin pages (Express) | `server/` | Cloud Run service `great-read-image`, project `great-read-398408`, `us-central1` |
| Public hostnames | `infra/cloudflare/greatread-domain-proxy.js` | Cloudflare Worker `greatread-domain-proxy` with custom domains on `himaiz.com` |

Integrations: MongoDB Atlas, Stripe Checkout + webhook (`/webhooks/stripe`), Google Cloud Storage
(`great-read-bucket` for public images, `great-read-purchase` for paid downloads via signed URLs),
GroupDocs Conversion Cloud (docx to PDF) and Gmail SMTP for password-reset emails.

## Deployment

- **CI:** `.github/workflows/ci.yml` lints and builds the client and checks the server on every push and PR.
- **Frontend:** Vercel deploys `main` to production automatically. Optional build env vars:
  `VITE_API_BASE_URL` and `VITE_SITE_URL` (defaults are the production hostnames above).
- **Backend:** `server/deploy.sh` (needs `gcloud` access to the project). It builds from source with Cloud
  Build and runs as `great-read-service@great-read-398408.iam.gserviceaccount.com`, which also signs
  GCS URLs. Runtime config comes from the gitignored `server/.cloudrun-env.yaml`:
  `CLIENT_URL`, `SERVER_URL`, `MONGO_DB_URL`, `SESSION_SECRET`, `BCRYPT_SALT`, `EMAIL_USER`, `EMAIL_PASS`,
  `GROUPDOCS_CLIENT_ID`, `GROUPDOCS_CLIENT_SECRET`, `STRIPE_PRIVATE_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `PROXY_SECRET` (optional: `ALLOWED_ORIGINS`, `GCS_BUCKET`, `GCS_PURCHASE_BUCKET`).
- **Worker:** upload `infra/cloudflare/greatread-domain-proxy.js` to the `greatread-domain-proxy` Worker
  (dashboard or Workers API), keeping its `PROXY_SECRET` secret binding equal to the server's. With
  `PROXY_SECRET` set, the server answers 403 to anything that does not come through the Worker. The Stripe webhook endpoint points at
  `https://admin.greatread.himaiz.com/webhooks/stripe`.
- **Bucket CORS:** `gcloud storage buckets update gs://great-read-bucket --cors-file=client/cors.json`.

## Local development

- Server: copy the env keys above into `server/.env`, set `GOOGLE_APPLICATION_CREDENTIALS` to a service
  account key, then `npm run dev` in `server/`.
- Client: `npm run dev` in `client/`. Requests go through the Vite proxy to `VITE_API_PROXY_TARGET`
  (default: production API).
