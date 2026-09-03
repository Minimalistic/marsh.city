# Vendored export libraries

Loaded on demand by `../export.js` (dynamic import), never on page load.
All MIT. Pinned by hand; bump by re-running the esbuild minify step.

| file | package | version | why |
|---|---|---|---|
| mp4-muxer.js | mp4-muxer | 5.2.2 | wraps WebCodecs H.264 chunks into a playable .mp4 |
| webm-muxer.js | webm-muxer | 5.1.4 | same for VP9, the fallback where H.264 encode is missing (Firefox) |
| gifenc.js | gifenc | 1.0.3 | palette quantize + LZW for GIF export |

mp4-muxer and webm-muxer are frozen in favour of the author's `mediabunny`,
which is ~10 MB unpacked. The container formats don't move, so the small
frozen libs are the right trade.
