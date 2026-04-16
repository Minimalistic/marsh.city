#!/bin/bash
# journal-mark-discussed.sh — Marks commits as discussed and updates last_checked
# Usage: journal-mark-discussed.sh [sha1 sha2 ...]
# If no SHAs provided, just updates the last_checked timestamp.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
STATE_FILE="$REPO_ROOT/.journal-state.json"

NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)

if [ $# -eq 0 ]; then
  # Just update timestamp
  jq --arg now "$NOW" '.last_checked = $now' "$STATE_FILE" > "$STATE_FILE.tmp" \
    && mv "$STATE_FILE.tmp" "$STATE_FILE"
else
  # Add SHAs and update timestamp
  SHA_JSON=$(printf '%s\n' "$@" | jq -R . | jq -s .)
  jq --arg now "$NOW" --argjson shas "$SHA_JSON" \
    '.last_checked = $now | .discussed_shas = (.discussed_shas + $shas | unique)' \
    "$STATE_FILE" > "$STATE_FILE.tmp" \
    && mv "$STATE_FILE.tmp" "$STATE_FILE"
fi

echo "Updated state: last_checked=$NOW, discussed $(echo $@ | wc -w | tr -d ' ') new SHAs"
