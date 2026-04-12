#!/bin/bash
# Backfill historical daily totals for a date range
# Usage: ./backfill-daily-totals.sh 2025-04-01 2026-04-12

set -euo pipefail

API_BASE="https://api-tuboleto.cultura.pe"
DATA_DIR="$(dirname "$0")/../data"

START_DATE="${1:?Usage: $0 START_DATE END_DATE (e.g., 2025-04-01 2026-04-12)}"
END_DATE="${2:?Usage: $0 START_DATE END_DATE}"

# Iterate through dates
CURRENT="$START_DATE"
while [[ "$CURRENT" < "$END_DATE" || "$CURRENT" == "$END_DATE" ]]; do
  YEAR=$(echo "$CURRENT" | cut -d'-' -f1)
  MONTH=$(echo "$CURRENT" | cut -d'-' -f2)

  MONTH_DIR="${DATA_DIR}/daily-totals"
  mkdir -p "$MONTH_DIR"

  RESULT=$(curl -s "${API_BASE}/recaudador/ticket/tickets-por-fecha/${CURRENT}")
  TOTAL=$(echo "$RESULT" | jq -r '.totalticket // "error"')

  echo "${CURRENT}: ${TOTAL} tickets"

  # Append to monthly summary file
  echo "{\"date\":\"${CURRENT}\",\"total_tickets\":${TOTAL}}" >> "${MONTH_DIR}/${YEAR}-${MONTH}.jsonl"

  # Next day
  CURRENT=$(date -j -v+1d -f "%Y-%m-%d" "${CURRENT}" +%Y-%m-%d 2>/dev/null || date -d "${CURRENT} + 1 day" +%Y-%m-%d)

  # Rate limit
  sleep 0.3
done

echo "Done! Backfilled from ${START_DATE} to ${END_DATE}"
