#!/bin/bash
# journal-check.sh — Fetches recent GitHub activity for tracked projects
# Called by Claude at session start to surface new commits for discussion.
#
# Reads project repos from frontmatter, checks GitHub API via gh CLI,
# compares against a state file to skip already-discussed commits.
# Outputs clean JSON for Claude to parse.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
PROJECTS_DIR="$REPO_ROOT/src/content/projects"
STATE_FILE="$REPO_ROOT/.journal-state.json"
GH_USER="Minimalistic"

# Initialize state file if missing
if [ ! -f "$STATE_FILE" ]; then
  echo '{"last_checked":"1970-01-01T00:00:00Z","discussed_shas":[]}' > "$STATE_FILE"
fi

LAST_CHECKED=$(jq -r '.last_checked' "$STATE_FILE")
DISCUSSED_SHAS_JSON=$(jq '.discussed_shas' "$STATE_FILE")

# Extract repo slugs from project frontmatter
REPO_SLUGS=()
for f in "$PROJECTS_DIR"/*.md; do
  repo_url=$(grep -m1 '^repo:' "$f" 2>/dev/null | sed 's/repo: *//' | tr -d '"' || true)
  if [ -n "$repo_url" ]; then
    slug=$(echo "$repo_url" | sed 's|https://github.com/||' | sed 's|/$||')
    REPO_SLUGS+=("$slug")
  fi
done

# Build JSON for tracked repos
TRACKED_JSON="[]"
for slug in "${REPO_SLUGS[@]}"; do
  # Fetch commits since last check, filter out discussed SHAs
  COMMITS=$(gh api "repos/$slug/commits?since=$LAST_CHECKED&per_page=20" \
    --jq '[.[] | {sha: .sha[0:7], message: (.commit.message | split("\n")[0]), date: .commit.author.date, author: .commit.author.name}]' 2>/dev/null || echo "[]")

  # Filter out already-discussed SHAs
  FILTERED=$(echo "$COMMITS" | jq --argjson discussed "$DISCUSSED_SHAS_JSON" \
    '[.[] | select(.sha as $s | $discussed | index($s) | not)]')

  TRACKED_JSON=$(echo "$TRACKED_JSON" | jq --arg repo "$slug" --argjson commits "$FILTERED" \
    '. + [{repo: $repo, commits: $commits}]')
done

# Fetch recent push events to catch unlisted repos
TRACKED_PATTERN=$(printf '%s\n' "${REPO_SLUGS[@]}" | sed 's|.*/||' | paste -sd'|' -)
OTHER_JSON=$(gh api "users/$GH_USER/events?per_page=30" \
  --jq "[.[] | select(.type == \"PushEvent\" and .created_at > \"$LAST_CHECKED\") | {repo: .repo.name, commits: [.payload.commits[]? | {sha: .sha[0:7], message: (.message | split(\"\n\")[0])}], date: .created_at}] | unique_by(.repo) | [.[] | select(.repo | test(\"$TRACKED_PATTERN\") | not)]" 2>/dev/null || echo "[]")

# Assemble final output
jq -n \
  --arg checked_at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --arg since "$LAST_CHECKED" \
  --argjson tracked "$TRACKED_JSON" \
  --argjson other "$OTHER_JSON" \
  '{
    checked_at: $checked_at,
    since: $since,
    tracked_repos: $tracked,
    other_recent_pushes: $other
  }'
