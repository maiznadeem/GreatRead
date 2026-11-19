#!/usr/bin/env bash
# Deploys the API/admin server to Cloud Run (built remotely by Cloud Build; no local Docker needed).
# Runtime config is read from server/.cloudrun-env.yaml (gitignored); see README for the keys.
set -euo pipefail
cd "$(dirname "$0")"

[ -f .cloudrun-env.yaml ] || { echo "Missing server/.cloudrun-env.yaml" >&2; exit 1; }

gcloud run deploy great-read-image \
  --source . \
  --project great-read-398408 \
  --region us-central1 \
  --service-account great-read-service@great-read-398408.iam.gserviceaccount.com \
  --env-vars-file .cloudrun-env.yaml \
  --max-instances 2 \
  --quiet

# Keep only the last 3 deploys in Artifact Registry. Each source build writes 3-4 versions within a
# couple of minutes, so a gap of more than 2 minutes starts an older build. (The repository also has
# a cleanup policy keeping the 12 newest versions as a backstop.)
IMAGE=us-central1-docker.pkg.dev/great-read-398408/cloud-run-source-deploy/great-read-image
gcloud artifacts docker images list "$IMAGE" --sort-by=~UPDATE_TIME \
    --format='value(version,updateTime.date(format="%s"))' |
  awk -v keep=3 '{ if (prev && prev - $2 > 120) build++; prev = $2; if (build >= keep) print $1 }' |
  while read -r digest; do
    gcloud artifacts docker images delete "$IMAGE@$digest" --delete-tags --quiet || true
  done
