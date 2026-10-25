---
title: DailyDungeon
description: A small pixel-art roguelike for phones. One floor at a time, every sprite drawn by hand.
---

I like old-school games, and Shattered Pixel Dungeon got me wanting to make my own spin on one. DailyDungeon is that: a dungeon crawl played one floor at a time, built so I can keep adding whatever I find interesting.

You pick a Warden or a Lamplighter and head down. Tap a tile to walk there, tap a monster next to you to fight it, touch and hold anything to see what it is. HP doesn't come back on its own, so supplies matter. Most floors have an omen that changes the rules a little. Die, and you can try the floor again, but what you found there waits in a grave sack where you fell.

<style>
.dungeon-frame { position:relative; width:100%; max-width:420px; aspect-ratio:9/16; margin:1.5rem auto; border-radius:var(--radius); overflow:hidden; background:#222323; }
.dungeon-frame iframe { position:absolute; inset:0; width:100%; height:100%; border:0; }
/* click-to-start: the game only loads when asked */
.dungeon-start { position:absolute; inset:0; width:100%; height:100%; border:0; padding:0; cursor:pointer; color:#fff;
  background:#222323 url(/images/dailydungeon/tile.webp) center/cover no-repeat;
  display:grid; place-items:center; font:inherit; }
.dungeon-start span { display:inline-flex; align-items:center; gap:.6em; padding:.7em 1.3em; border-radius:999px;
  background:rgba(0,0,0,.6); font-size:1.05rem; transition:background .2s; }
.dungeon-start:hover span, .dungeon-start:focus-visible span { background:rgba(0,0,0,.8); }
.dungeon-start:focus-visible { outline:3px solid var(--leaf, #fff); outline-offset:-6px; }
/* the way out of the frame, to the page a phone can add to its home screen */
.dungeon-open { text-align:center; margin:0 0 1rem; }
.dungeon-open .live-demo-btn { margin:0; padding:.85em 1.5em; min-height:44px; box-sizing:border-box; }
.dungeon-shots { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:1rem; align-items:start; margin:1.5rem 0; }
.dungeon-shots img { width:100%; height:auto; border-radius:var(--radius); display:block; }
@media (max-width: 600px) { .dungeon-shots { grid-template-columns:1fr; } }
</style>

<div class="dungeon-frame">
<button type="button" class="dungeon-start"><span><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>Start DailyDungeon</span></button>
</div>

<script>
document.querySelector('.dungeon-start')?.addEventListener('click', (e) => {
  // the game has its own sound; hold the site's ambient sound while it runs
  window.dispatchEvent(new Event('marsh:ambient-hold'));
  const iframe = document.createElement('iframe');
  iframe.src = '/dungeon/';
  iframe.title = 'DailyDungeon - a pixel-art roguelike';
  iframe.allow = 'fullscreen; autoplay';
  e.currentTarget.replaceWith(iframe);
  iframe.focus();
});
</script>

<p class="dungeon-open"><a class="live-demo-btn" href="/dungeon/">Open DailyDungeon full screen</a></p>

It's made for phones: open it full screen and use Add to Home Screen, and it plays like an app, offline too, with your saved game kept safer than in a browser tab.

## The daily version

The version here is single-player. The one I play with a friend is a daily floor: we both get the same floor, each of us plays it whenever it suits, and the next one opens once we've both finished. I wanted a roguelike to play low-pressure with a friend, and async because that's what fits around everything else.

## SpriteLab

Every sprite in the game is 8×8 pixels from one 19-color palette, with at most five colors in any one sprite. They're drawn in SpriteLab, a small editor I built for the game's art. It lists every sprite the game needs, lets me mark each one Keep or Redo with a note, and opens any of them for pixel editing. A save goes straight into the game, so a redrawn monster is there the next time the game loads.

<div class="dungeon-shots">
<img src="/images/dailydungeon/spritelab-review.webp" alt="SpriteLab's sprite list: filters for To review, Redo, Keep, Edited and Missing above the Player card, which shows the player's four facings with Keep, Redo and Edit pixels buttons and a note box." width="540" height="620" loading="lazy">
<img src="/images/dailydungeon/spritelab-editor.webp" alt="SpriteLab's pixel editor on the player's front view: an 8 by 8 grid, a line reading Colors: 4 of 5, the 19-color palette, and Pick color, Swap color, Mirror and Undo buttons." width="440" height="790" loading="lazy">
</div>

Give it a try. If you have any feedback, feel free to [email me](mailto:jason@marsh.city).
