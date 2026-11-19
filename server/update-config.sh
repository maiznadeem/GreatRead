#!/usr/bin/env bash
# Applies runtime config to the Cloud Run service. Code is deployed by the Cloud Build trigger on every push to
# main (Build, Push, Deploy, then Prune, which keeps only the deployed image). Config comes from the gitignored
# server/.cloudrun-env.yaml (see README) and replaces all env vars on the service.
set -euo pipefail
cd "$(dirname "$0")"

[ -f .cloudrun-env.yaml ] || { echo "Missing server/.cloudrun-env.yaml" >&2; exit 1; }

gcloud run services update great-read-maiz-portfolio \
  --project maiz-portfolio \
  --region us-central1 \
  --service-account great-read-maiz-portfolio@maiz-portfolio.iam.gserviceaccount.com \
  --env-vars-file .cloudrun-env.yaml \
  --max-instances 2 \
  --quiet
