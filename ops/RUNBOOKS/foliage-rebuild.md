# Rebuild the footer marsh scenery

The parallax footer is five painted layers (forest, back, mid, front, ground) composed from gpt-image-1 generations into `public/foliage/*.avif`. The source art isn't in git, so a rebuild on a fresh machine starts at step 1. To swap one layer, regenerate only that layer and pass its name to the compositor.

## Precondition
- `OPENAI_API_KEY` is in `.env` (only needed for step 1, and each call costs money).
- `art-src/foliage/` holds the source PNGs, their `-x4` upscales and `prompts/*.txt`. It's gitignored and about 220 MB, and only this Mac has it.
- The `realesrgan` upscaler is on PATH (`~/.local/bin/realesrgan`, a wrapper around `~/.local/share/realesrgan/`, shared by every project). On a fresh machine, unzip https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesrgan-ncnn-vulkan-20220424-macos.zip into `~/.local/share/realesrgan/` and recreate the wrapper, which runs the binary with `-m <that dir>/models -s 4`.
- The working tree is clean, on `main`.

## Commands
```sh
L=art-src/foliage

# 1. Generate (skip if keeping the current art). Writes e.g. strip3-4.png; keep the -N suffix.
node scripts/aux-image.mjs --out-dir $L --size 1536x1024 --quality high --background transparent \
  --prompt-file $L/prompts/strip3.txt --out strip3-4.png

# 2. Upscale 4x (Metal: run outside the Claude sandbox)
realesrgan -i $L/strip3-4.png -o $L/strip3-4-x4.png -n realesrgan-x4plus-anime

# 3. Compose. forest= and ground= pick a source; the others are fixed in the script.
#    Also rewrites the foliage-boxes block in src/styles/global.css.
node scripts/foliage-compose.mjs ground=strip3-4

# 4. Re-render the share card from the new layers (headless Chrome: run outside the sandbox)
node scripts/og-card.mjs

npm run build
```
The ground panorama also uses `strip3-1` and `strip3-3` as its left and right flanks, which are hardcoded in `foliage-compose.mjs`. The phone "-m" strips and the desktop files come out of the same run.

## Tuning without new art
All of these live in `src/styles/global.css` under `.foliage-frame--<layer> .foliage-layer`:
- `--end-band`: where the layer's painted edge lands at the bottom of the scroll, as a fraction of the band. Ground is 1.05 on desktop and 1.03 on phones, which tucks the soil fringe off-screen.
- `--layer-start` / `--layer-range-start`: how late the front and ground layers rise.

If you change any desktop `--end-band`, update the matching `LAYERS` entry in `scripts/og-card.mjs` and re-run it.

## Postcondition check
- `git status` shows only `public/foliage/*.avif`, the foliage-boxes block in `global.css` and `public/og-default.jpg`.
- `du -ch public/foliage/*.avif | tail -1` is about 1.3 MB for all files (a visitor fetches only their size's set, 280-780 KB). A big jump means a layer lost its alpha trim.
- In the preview, scroll to the bottom at 1280×800, 390×844 and 844×390 (landscape phone). Check for no seams or hard edges except each layer's bottom, and no gap under the ground strip. Do this in both light and dark mode.
- After the push, the live CSS should carry the new painted-row bounds (they match the foliage-boxes block):
  ```sh
  css=$(curl -s https://marsh.city/ | grep -o '/_astro/[^"]*\.css' | head -1)
  curl -s "https://marsh.city$css" | grep -o 'foliage-frame--ground \.foliage-layer{--content-top:[^;]*'
  ```
  Then hard-refresh the live site on a phone.
