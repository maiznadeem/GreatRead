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
