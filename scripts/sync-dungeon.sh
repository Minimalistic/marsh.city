#!/bin/sh
# DailyDungeon lives in its own repo; GitHub Pages only serves this one, so the
# game's solo edition (Play only, no server) is built into public/dungeon/.
# DailyDungeon's tools/build-solo.js does the work: it builds from DailyDungeon's
# committed HEAD, refuses while DailyDungeon has uncommitted changes, and
# refuses to overwrite a live copy edited here (its solo-source.json records
# every file's hash). Pass --force to override either refusal.
set -eu
here="$(cd "$(dirname "$0")/.." && pwd)"
node "$here/../DailyDungeon/tools/build-solo.js" "$here/public/dungeon" "$@"
