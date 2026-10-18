#!/usr/bin/env bash
# Calls one scheduled-job route of the API: run-job.sh <job-name> [max-seconds] [retries]
#
# The scheduled workflow runs from the default branch (development), which can list a new
# job before production (main) has it. The API then answers 404 "Unknown job": that is a
# warning, not a failure. Any other non-2xx answer, or no answer at all, fails the step.
set -uo pipefail

name="$1"
max_time="${2:-120}"
retries="${3:-2}"
body="$(mktemp)"

status="$(curl --silent --show-error --max-time "$max_time" --retry "$retries" --retry-delay 15 \
  -o "$body" -w '%{http_code}' -X POST -H "Authorization: Bearer $CRON_SECRET" \
  "$API_BASE_URL/api/v1/internal/jobs/$name")" || {
  echo "::error::$name: no answer from the API"
  exit 1
}
cat "$body"
echo

if [ "$status" = "404" ] && grep -q '"Unknown job"' "$body"; then
  echo "::warning::$name is not deployed on production yet (it ships with the next release); skipped"
  exit 0
fi
if [ "$status" -lt 200 ] || [ "$status" -ge 300 ]; then
  echo "::error::$name answered HTTP $status"
  exit 1
fi
