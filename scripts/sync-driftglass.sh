#!/bin/sh
# Driftglass lives in its own repo; GitHub Pages only serves this one, so the page is copied in.
# Refuses to overwrite a live copy that was edited here: if its exact contents were never committed in
# Driftglass, those edits would be lost. Back-port them to Driftglass first, or pass --force.
set -eu
here="$(cd "$(dirname "$0")/.." && pwd)"
src="$here/../Driftglass/index.html"
live="$here/public/driftglass/index.html"

if [ "${1:-}" != "--force" ] && [ -f "$live" ]; then
  blob="$(git hash-object "$live")"
  # a blob that exists in the Driftglass repo came from there; one that doesn't was edited in this repo
  if ! git -C "$here/../Driftglass" cat-file -e "$blob" 2>/dev/null; then
    echo "Refusing to sync: public/driftglass/index.html has changes that aren't in the Driftglass repo." >&2
    echo "Back-port them first (git log -- public/driftglass/index.html shows which commits), or rerun with --force." >&2
    exit 1
  fi
fi

cp "$src" "$live"
echo "Copied Driftglass $(git -C "$here/../Driftglass" rev-parse --short HEAD) into public/driftglass/"
