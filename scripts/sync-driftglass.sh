#!/bin/sh
# Driftglass lives in its own repo; GitHub Pages only serves this one, so the page is copied in.
set -eu
here="$(cd "$(dirname "$0")/.." && pwd)"
cp "$here/../Driftglass/index.html" "$here/public/driftglass/index.html"
echo "Copied Driftglass $(git -C "$here/../Driftglass" rev-parse --short HEAD) into public/driftglass/"
