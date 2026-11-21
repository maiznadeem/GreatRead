#!/usr/bin/env bash
# Applies runtime config to the Cloud Run service. Code is deployed by the Cloud Build trigger on every push to
# main, which deletes the image from Artifact Registry afterwards (Cloud Run keeps its own copy; the registry stays
# empty and free). A config change needs a new revision and therefore an image, so this script rebuilds from the
# local source together with the config, then empties the registry again. Run it from an up-to-date main checkout.
# Plain (non-secret) env vars come from the gitignored server/.cloudrun-env.yaml and replace all env vars on the
# service. Secrets come from the single Secret Manager secret greatread-secrets, mounted as APP_SECRETS (see README).
set -euo pipefail
cd "$(dirname "$0")"

PROJECT=maiz-portfolio
REGION=us-central1
REPO="$REGION-docker.pkg.dev/$PROJECT/cloud-run-source-deploy"

[ -f .cloudrun-env.yaml ] || { echo "Missing server/.cloudrun-env.yaml" >&2; exit 1; }
if grep -qE '^(MONGO_DB_URL|SESSION_SECRET|EMAIL_PASS|STRIPE_PRIVATE_KEY|STRIPE_WEBHOOK_SECRET):' .cloudrun-env.yaml; then
  echo "Secrets belong in Secret Manager (greatread-secrets), not server/.cloudrun-env.yaml" >&2; exit 1
fi

gcloud run deploy great-read-maiz-portfolio \
  --source . \
  --project "$PROJECT" \
  --region "$REGION" \
  --service-account "great-read-maiz-portfolio@$PROJECT.iam.gserviceaccount.com" \
  --env-vars-file .cloudrun-env.yaml \
  --set-secrets APP_SECRETS=greatread-secrets:latest \
  --max-instances 2 \
  --quiet

# Empty the registry: untagged attestations first (an image can't be deleted while they reference it), then the
# tagged images, one at a time. Some gcloud builds print digests as "s;h;a;..." (hence tr), and the synchronous
# delete can fail while polling its operation, so issue each delete --async and give it time to finish.
list() { gcloud artifacts docker images list "$REPO" --project "$PROJECT" --include-tags --filter="$1" \
           --format='value[separator=@](package,version)' 2>/dev/null | tr -d ';'; }
for ref in $(list '-tags:*') $(list 'tags:*'); do
  gcloud artifacts docker images delete "$ref" --delete-tags --quiet --async --project "$PROJECT" </dev/null >/dev/null || true
  sleep 15
done
sleep 10
echo "Registry images left: $(gcloud artifacts docker images list "$REPO" --project "$PROJECT" --format='value(version)' 2>/dev/null | wc -l)"
