// App orchestrator: owns state, wires modules, handles PWA plumbing
// (wake lock, persistent storage, service worker).
import { defaultConfig, migrate, imageKeysInConfig } from './js/schema.js';
import * as db from './js/db.js';
import { initSpeech, speak } from './js/speech.js';
import { renderBoard } from './js/board.js';
import { renderHome } from './js/home.js';
import { initStrip } from './js/strip.js';
import { initCheck } from './js/check.js';
import { initEdit } from './js/edit.js';

const boardEl = document.getElementById('board');
const navBar = document.getElementById('nav-bar');
const navTitle = document.getElementById('nav-title');
const checkBtn = document.getElementById('check-btn');

const state = {
  config: null,
  editing: false,
  activeBoardId: null, // null = home screen (board picker)
  imageURLs: new Map(), // imageKey → object URL, session-lived
};

function activeBoard() {
  return state.config.boards.find((b) => b.id === state.activeBoardId) ?? null;
}

// A lone board opens directly and the picker never exists for the user —
// the multi-board module "disappears completely" until a second board does.
function defaultBoardId() {
  return state.config.boards.length === 1 ? state.config.boards[0].id : null;
}

const app = {
  getConfig: () => state.config,
  getActiveBoard: activeBoard,
  isEditing: () => state.editing,
  imageURL: (key) => state.imageURLs.get(key) ?? null,
  // Editor saves register new blobs here so render sees them immediately —
  // preloadImages only runs on whole-config replacements.
  addImageURL(key, blob) {
    state.imageURLs.set(key, URL.createObjectURL(blob));
  },
  async save() {
    await db.putBoard('config', state.config);
  },
  async setConfig(config) {
    state.config = config;
    state.activeBoardId = defaultBoardId();
    await db.putBoard('config', config);
    await preloadImages();
    render();
  },
  setEditing(editing) {
    state.editing = editing;
    document.body.classList.toggle('editing', editing);
    document.getElementById('edit-toolbar').hidden = !editing;
    render();
  },
  // Deliberate updates: edit.js subscribes to show the Settings update
  // section; applyUpdate() releases the waiting worker (reload follows on
  // controllerchange below).
  onUpdateReady(cb) {
    onUpdateReadyCb = cb;
    if (waitingWorker) cb();
  },
  applyUpdate() {
    expectingReload = true;
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
  },
  openBoard(id) {
    state.activeBoardId = id;
    render();
  },
  goHome() {
    state.activeBoardId = null;
    render();
  },
  render,
};

let strip;
let check;
let edit;

// ----- deliberate updates: a new version waits until applied from Settings -----
let waitingWorker = null;
let onUpdateReadyCb = null;
let expectingReload = false;

function updateReady(worker) {
  waitingWorker = worker;
  onUpdateReadyCb?.();
}

function render() {
  const board = activeBoard();
  if (state.activeBoardId && !board) {
    // Active board was deleted out from under us — fall back gracefully.
    state.activeBoardId = defaultBoardId();
    return render();
  }
  const { settings } = state.config;
  const multiBoard = state.config.boards.length > 1;

  // Nav shows when there's somewhere to go: any multi-board view, or edit
  // mode (caregivers need Home to reach board management even with one board).
  navBar.hidden = !(board && (multiBoard || state.editing));
  navTitle.textContent = board?.name ?? '';
  checkBtn.hidden = state.editing || !settings.checkScreen;

  if (board) {
    boardEl.setAttribute('aria-label', `${board.name} board`);
    renderBoard({
      board,
      settings,
      editing: state.editing,
      container: boardEl,
      imageURL: app.imageURL,
      onActivate(button) {
        const text = button.spokenText || button.label;
        speak(text, settings);
        if (settings.sentenceStrip) {
          strip.add(button, button.imageKey ? app.imageURL(button.imageKey) : null);
        }
      },
      onEdit: (button) => edit.openEditor(button, button.slot),
      onAddAt: (slot) => edit.openEditor(null, slot),
      onReorder: (orderedIds) => edit.reorderButtons(orderedIds),
      onMoveToSlot: (button, slot) => edit.moveToSlot(button, slot),
      onToggleVisible: (button) => edit.toggleVisible(button),
      render,
    });
  } else {
    boardEl.setAttribute('aria-label', 'Choose a board');
    renderHome({
      config: state.config,
      editing: state.editing,
      container: boardEl,
      onOpen: (b) => app.openBoard(b.id),
      onEditBoard: (b) => edit.openBoardEditor(b),
      onAddBoard: () => edit.openBoardEditor(null),
    });
  }
  // Strip shows only on a user-facing board — edit mode and home hide it.
  strip.setVisible(settings.sentenceStrip && !state.editing && !!board);
}

async function preloadImages() {
  const keys = imageKeysInConfig(state.config);
  for (const [key, url] of state.imageURLs) {
    if (!keys.has(key)) {
      URL.revokeObjectURL(url);
      state.imageURLs.delete(key);
    }
  }
  for (const key of keys) {
    if (state.imageURLs.has(key)) continue;
    const blob = await db.getImage(key);
    if (blob) state.imageURLs.set(key, URL.createObjectURL(blob));
  }
}

// ----- wake lock: keep the screen on while the board is visible -----
let wakeLock = null;
async function acquireWakeLock() {
  try {
    wakeLock = await navigator.wakeLock?.request('screen');
  } catch {
    // Denied (battery saver, unfocused tab) — harmless, retried on visibility.
  }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') acquireWakeLock();
});

async function boot() {
  initSpeech();

  let config = await db.getBoard('config');
  if (config) {
    const stored = config.schemaVersion;
    config = migrate(config);
    if (config.schemaVersion !== stored) await db.putBoard('config', config);
  } else {
    config = defaultConfig();
    await db.putBoard('config', config);
  }
  // Every boot, not just first run: persist() is idempotent, and Chrome may
  // grant later (e.g. after install) what it declined on first launch.
  navigator.storage?.persist?.().catch(() => {});
  state.config = config;
  state.activeBoardId = defaultBoardId();

  strip = initStrip({
    elements: {
      bar: document.getElementById('strip-bar'),
      chips: document.getElementById('strip-chips'),
      speakBtn: document.getElementById('strip-speak'),
      backBtn: document.getElementById('strip-back'),
      clearBtn: document.getElementById('strip-clear'),
    },
    speakAll: (text) => speak(text, state.config.settings),
  });
  check = initCheck({
    elements: {
      screen: document.getElementById('check-screen'),
      closeBtn: document.getElementById('check-close'),
      options: [...document.querySelectorAll('.check-opt')],
    },
    speakOption: (text) => speak(text, state.config.settings),
  });
  checkBtn.addEventListener('click', () => check.open());
  document.getElementById('nav-home').addEventListener('click', () => app.goHome());
  edit = initEdit(app);

  await preloadImages();
  render();
  acquireWakeLock();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then((reg) => {
      if (reg.waiting) updateReady(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        // controller check: on the very first install there's no old version
        // to replace — that's not an "update ready" state.
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) updateReady(worker);
        });
      });
    }).catch((err) => {
      console.warn('[ButtonGriddle] service worker registration failed', err);
    });
    // Reload only for the update we initiated — never on first-install claim.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (expectingReload) location.reload();
    });
  }
}

boot();
