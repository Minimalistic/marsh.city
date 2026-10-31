#!/bin/sh
# Tavela lives in its own repo (folder Tendwell/); GitHub Pages only serves this one, so its
# public test build is copied into public/tavela/. Only Tavela's committed app/ comes across:
# never its docs, specs or plans. Refuses while Tavela has uncommitted changes, and refuses to
# overwrite a live copy edited here (any file whose contents were never committed in Tavela).
# Pass --force to override the second refusal.
set -eu
here="$(cd "$(dirname "$0")/.." && pwd)"
src="$here/../Tendwell"
live="$here/public/tavela"

if [ -n "$(git -C "$src" status --porcelain)" ]; then
  echo "Refusing to sync: Tavela has uncommitted changes. Commit them there first." >&2
  exit 1
fi

if [ "${1:-}" != "--force" ] && [ -d "$live" ]; then
  # a blob that exists in the Tavela repo came from there; one that doesn't was edited here.
  # The loop runs in a pipeline subshell, so it reports and the check outside decides.
  edited="$(find "$live" -type f | while read -r file; do
    git -C "$src" cat-file -e "$(git hash-object "$file")" 2>/dev/null || echo "${file#"$here"/}"
  done)"
  if [ -n "$edited" ]; then
    echo "Refusing to sync: these files have changes that aren't in the Tavela repo:" >&2
    echo "$edited" >&2
    echo "Back-port them first, or rerun with --force." >&2
    exit 1
  fi
fi

tmp="$(mktemp -d "${TMPDIR:-/tmp}/tavela-sync.XXXXXX")"
trap 'rm -rf "$tmp"' EXIT
git -C "$src" archive HEAD app | tar -x -C "$tmp"
mkdir -p "$live"
rsync -a --delete "$tmp/app/" "$live/"
echo "Copied Tavela $(git -C "$src" rev-parse --short HEAD) into public/tavela/"
