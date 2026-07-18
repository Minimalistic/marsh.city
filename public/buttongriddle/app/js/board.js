// Board rendering + the unified pointer handler. Owns tap-vs-hold,
// debounce, and edit-mode tile controls. Android tablets are the
// reference target: Pointer Events only, context menu suppressed so
// press-and-hold always means hold-to-activate.

const lastFired = new Map(); // button id → timestamp, for repeat-tap debounce

// ctx.board is the active board (layout + buttons); ctx.settings is the
// device-global settings (hold, debounce) — layout became per-board in v2.
export function renderBoard(ctx) {
  const { board, editing, container } = ctx;
  container.textContent = '';
  container.oncontextmenu = (e) => e.preventDefault();

  const sorted = [...board.buttons].sort((a, b) => a.slot - b.slot);
  const visible = sorted.filter((b) => b.visible);
  const shown = editing ? sorted : visible;

  // Undo the picker's list layout (home.js sets these).
  container.classList.remove('picker');
  container.style.alignContent = '';

  if (board.fillMode) {
    // Column count is computed, not auto-fit: packing minmax(160px) columns
    // made wide screens sprout 7 skinny tiles plus an orphan row. Editing
    // adds one add-tile to the count.
    const cols = bestFillCols(shown.length + (editing ? 1 : 0),
      container.clientWidth, container.clientHeight);
    container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    container.style.gridTemplateRows = '';
    container.style.gridAutoRows = '1fr';
  } else {
    container.style.gridTemplateColumns = `repeat(${board.gridCols}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${board.gridRows}, 1fr)`;
    container.style.gridAutoRows = '';
  }

  for (const button of shown) {
    const tile = buildTile(button, ctx);
    tile.dataset.slot = button.slot;
    if (!board.fillMode) placeInGrid(tile, button.slot, board);
    container.appendChild(tile);
  }

  if (editing) {
    if (board.fillMode) {
      container.appendChild(buildAddTile(ctx, nextSlot(board)));
    } else {
      // Fixed mode: every empty slot becomes an add-here tile.
      const taken = new Set(sorted.map((b) => b.slot));
      const total = board.gridCols * board.gridRows;
      for (let slot = 0; slot < total; slot++) {
        if (taken.has(slot)) continue;
        const tile = buildAddTile(ctx, slot);
        tile.dataset.slot = slot;
        placeInGrid(tile, slot, board);
        container.appendChild(tile);
      }
    }
  }
}

// Pick the column count that maximizes tile size for the container's
// aspect ratio. Pure so tests can pin the layout choices.
export function bestFillCols(count, width, height) {
  if (count < 1) return 1;
  if (width <= 0 || height <= 0) return Math.ceil(Math.sqrt(count));
  let best = 1;
  let bestSize = 0;
  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    const size = Math.min(width / cols, height / rows);
    if (size > bestSize) {
      best = cols;
      bestSize = size;
    }
  }
  return best;
}

export function nextSlot(board) {
  return board.buttons.reduce((max, b) => Math.max(max, b.slot), -1) + 1;
}

function placeInGrid(tile, slot, board) {
  const row = Math.floor(slot / board.gridCols) + 1;
  const col = (slot % board.gridCols) + 1;
  // Slots past the grid would overlap slot 0's row math — let them auto-flow.
  if (row <= board.gridRows) tile.style.gridArea = `${row} / ${col}`;
}

function buildTile(button, ctx) {
  const tile = document.createElement('button');
  tile.type = 'button';
  tile.className = 'tile';
  tile.dataset.id = button.id;
  if (button.color) tile.style.background = button.color;
  if (!button.visible) tile.classList.add('hidden-btn');

  const imageURL = button.imageKey ? ctx.imageURL(button.imageKey) : null;
  if (imageURL) {
    const img = document.createElement('img');
    img.src = imageURL;
    img.alt = '';
    tile.appendChild(img);
  } else {
    tile.classList.add('text-only');
  }

  const label = document.createElement('span');
  label.className = 'tile-label';
  label.textContent = button.label;
  tile.appendChild(label);

  if (ctx.editing) {
    tile.setAttribute('aria-label', `Edit ${button.label}`);
    tile.appendChild(buildTileControls(button, ctx));
    tile.addEventListener('click', (e) => {
      // A completed drag emits a click on release — swallow that one.
      if (tile.dataset.suppressClick) {
        delete tile.dataset.suppressClick;
        return;
      }
      if (!e.target.closest('.tile-controls')) ctx.onEdit(button);
    });
    attachEditDrag(tile, button, ctx);
  } else {
    tile.setAttribute('aria-label', button.spokenText || button.label);
    const holdFill = document.createElement('span');
    holdFill.className = 'hold-fill';
    tile.appendChild(holdFill);
    attachPointerHandler(tile, button, ctx);
  }
  return tile;
}

function buildTileControls(button, ctx) {
  const controls = document.createElement('span');
  controls.className = 'tile-controls';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'hide-toggle';
  toggle.textContent = button.visible ? 'Hide' : 'Show';
  toggle.setAttribute('aria-label', `${button.visible ? 'Hide' : 'Show'} ${button.label}`);
  toggle.addEventListener('click', (e) => { e.stopPropagation(); ctx.onToggleVisible(button); });
  controls.appendChild(toggle);
  return controls;
}

// Press-and-hold (300ms) lifts a tile, then it follows the pointer.
// Fill mode: siblings reflow live, iPhone-style — the dragged tile's DOM
// position moves while a transform keeps its visual under the finger.
// Fixed mode: drop on a cell — occupied swaps, empty (add-tile) moves.
const DRAG_HOLD_MS = 300;
const DRAG_SLOP_PX = 8;

function attachEditDrag(tile, button, ctx) {
  const container = ctx.container;
  let holdTimer = null;
  let dragging = false;
  let pointerId = null;
  let grabDX = 0;
  let grabDY = 0;
  let baseLeft = 0;
  let baseTop = 0;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let dropTarget = null;

  // Transform is relative to the tile's layout box, which moves on every
  // DOM reflow — re-measure the box, then re-anchor under the pointer.
  const measureBase = () => {
    tile.style.transform = '';
    const rect = tile.getBoundingClientRect();
    baseLeft = rect.left;
    baseTop = rect.top;
  };
  const follow = () => {
    tile.style.transform =
      `translate(${lastX - grabDX - baseLeft}px, ${lastY - grabDY - baseTop}px) scale(1.04)`;
  };

  const siblingAt = (x, y, selector) => {
    for (const el of container.querySelectorAll(selector)) {
      if (el === tile) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return el;
    }
    return null;
  };

  const clearDropTarget = () => {
    dropTarget?.classList.remove('drop-target');
    dropTarget = null;
  };

  const abort = () => {
    clearTimeout(holdTimer);
    holdTimer = null;
    pointerId = null;
    if (dragging) {
      dragging = false;
      tile.classList.remove('dragging');
      tile.style.transform = '';
      clearDropTarget();
      ctx.render(); // restore true order after an abandoned drag
    }
  };

  tile.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.tile-controls')) return;
    if (pointerId !== null) return;
    pointerId = e.pointerId;
    startX = lastX = e.clientX;
    startY = lastY = e.clientY;
    const rect = tile.getBoundingClientRect();
    grabDX = e.clientX - rect.left;
    grabDY = e.clientY - rect.top;
    holdTimer = setTimeout(() => {
      holdTimer = null;
      dragging = true;
      tile.classList.add('dragging');
      try {
        tile.setPointerCapture(pointerId);
      } catch {
        // Pointer already gone — up/cancel handlers still clean up.
      }
      measureBase();
      follow();
    }, DRAG_HOLD_MS);
  });

  tile.addEventListener('pointermove', (e) => {
    if (e.pointerId !== pointerId) return;
    lastX = e.clientX;
    lastY = e.clientY;
    if (!dragging) {
      // Moved too far before the hold matured: it's a tap/scroll, not a drag.
      if (Math.hypot(lastX - startX, lastY - startY) > DRAG_SLOP_PX) {
        clearTimeout(holdTimer);
        holdTimer = null;
        pointerId = null;
      }
      return;
    }
    if (ctx.board.fillMode) {
      const over = siblingAt(lastX, lastY, '.tile:not(.add-tile)');
      if (over) {
        const children = [...container.children];
        const from = children.indexOf(tile);
        const to = children.indexOf(over);
        container.insertBefore(tile, to < from ? over : over.nextSibling);
        measureBase();
      }
    } else {
      const over = siblingAt(lastX, lastY, '.tile');
      if (over !== dropTarget) {
        clearDropTarget();
        if (over) {
          dropTarget = over;
          dropTarget.classList.add('drop-target');
        }
      }
    }
    follow();
  });

  tile.addEventListener('pointerup', (e) => {
    if (e.pointerId !== pointerId) return;
    if (!dragging) {
      clearTimeout(holdTimer);
      holdTimer = null;
      pointerId = null;
      return; // short press → the click event opens the editor
    }
    tile.dataset.suppressClick = '1';
    dragging = false;
    pointerId = null;
    tile.classList.remove('dragging');
    tile.style.transform = '';
    if (ctx.board.fillMode) {
      const order = [...container.querySelectorAll('.tile:not(.add-tile)')]
        .map((el) => el.dataset.id);
      ctx.onReorder(order);
    } else {
      const target = dropTarget;
      clearDropTarget();
      if (target) ctx.onMoveToSlot(button, Number(target.dataset.slot));
      else ctx.render(); // dropped on nothing — snap back
    }
  });

  tile.addEventListener('pointercancel', abort);
}

function buildAddTile(ctx, slot) {
  const tile = document.createElement('button');
  tile.type = 'button';
  tile.className = 'tile add-tile';
  tile.textContent = '+';
  tile.setAttribute('aria-label', 'Add button');
  tile.addEventListener('click', () => ctx.onAddAt(slot));
  return tile;
}

// One handler owns tap semantics: activate on release, only if held past
// holdMs (0 = instant), only if the pointer stayed on the tile, and only
// if this button hasn't fired within debounceMs.
function attachPointerHandler(tile, button, ctx) {
  let downAt = 0;
  let pointerId = null;

  tile.addEventListener('pointerdown', (e) => {
    if (pointerId !== null) return; // ignore second finger
    pointerId = e.pointerId;
    downAt = performance.now();
    const holdMs = ctx.settings.holdMs;
    if (holdMs > 0) {
      tile.style.setProperty('--hold-ms', `${holdMs}ms`);
      tile.classList.add('holding');
    }
    try {
      tile.setPointerCapture(e.pointerId);
    } catch {
      // Pointer already gone (or synthetic) — the up/cancel handlers still fire.
    }
  });

  const reset = () => {
    pointerId = null;
    tile.classList.remove('holding');
  };

  tile.addEventListener('pointerup', (e) => {
    if (e.pointerId !== pointerId) return;
    const heldMs = performance.now() - downAt;
    const { holdMs, debounceMs } = ctx.settings;
    reset();
    if (heldMs < holdMs) return;
    // Pointer capture routes the up event here even if the finger slid off
    // the tile — releasing outside the tile must not activate it.
    const rect = tile.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right
      || e.clientY < rect.top || e.clientY > rect.bottom) return;
    const now = performance.now();
    if (now - (lastFired.get(button.id) ?? -Infinity) < debounceMs) return;
    lastFired.set(button.id, now);
    ctx.onActivate(button);
  });

  tile.addEventListener('pointercancel', reset);
  tile.addEventListener('lostpointercapture', () => {
    // Capture lost without pointerup (scroll steal, etc.) — abandon the press.
    if (pointerId !== null) reset();
  });
}
