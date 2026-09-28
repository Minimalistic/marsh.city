# Ship Driftglass to marsh.city

Driftglass lives in its own repo (`../Driftglass`), but GitHub Pages only serves this one, so the page is copied into `public/driftglass/index.html`. Pushing the Driftglass repo alone deploys nothing.

## Precondition
- Driftglass changes are committed on `main` in `../Driftglass`, and Jason has said to ship.
- This repo's working tree is clean (`git status`), on `main`.

## Commands
```sh
git -C ../Driftglass push origin main
scripts/sync-driftglass.sh                      # prints "Copied Driftglass <sha> …"
git add public/driftglass/index.html
git commit -m "content(playground): sync Driftglass <sha> (<what changed, a few words>)"
git push origin main                            # triggers "Deploy to GitHub Pages"
gh run watch "$(gh run list --limit 1 --json databaseId --jq '.[0].databaseId')" --exit-status
```
`gh` and `git push` need to run outside the Claude sandbox (TLS verification fails inside it).

If the sync script refuses, `public/driftglass/index.html` was edited in this repo and those edits aren't in Driftglass. Fix it at the source: apply `git diff <last sync commit> HEAD -- public/driftglass/index.html` to `../Driftglass/index.html` (`git apply -p3`), commit there, then sync. Use `--force` only after confirming the live copy holds nothing Driftglass lacks.

## Postcondition check
```sh
curl -s "https://marsh.city/driftglass/?cb=$(date +%s)" | grep -c "<a string only the new build has>"
```
Non-zero means the new build is live. Browsers may hold the old copy; a hard refresh picks it up.
