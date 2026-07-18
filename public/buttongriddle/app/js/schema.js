// Pure config/schema logic — no DOM, no IndexedDB. Node-testable on purpose:
// this file is the product's data contract, everything else hangs off it.

export const SCHEMA_VERSION = 2;

// User-facing product version, shown in Settings — the answer to "what
// version is the tablet on?" in field-test bug reports. Semver, bumped
// deliberately; unrelated to SCHEMA_VERSION (data shape) or the service
// worker CACHE string (cache-bust counter).
export const APP_VERSION = '0.9.4';

// Soft, high-contrast-with-dark-text swatches. Visual aid only — no semantics.
export const PALETTE = [
  '#f28b82', '#fbbc04', '#fff475', '#ccff90',
  '#a7ffeb', '#aecbfa', '#d7aefb', '#fdcfe8',
];

export function newButton(partial = {}) {
  return {
    id: crypto.randomUUID(),
    type: 'speak',
    label: '',
    spokenText: '',
    imageKey: null,
    slot: 0,
    visible: true,
    color: null,
    ...partial,
  };
}

// v2: boards are the unit of context (meals, activities, clothing…). Grid
// layout is per-board — a 2×2 meals board and a 3×3 activities board coexist.
export function newBoard(partial = {}) {
  return {
    id: crypto.randomUUID(),
    name: '',
    color: null,
    fillMode: true,
    gridCols: 3,
    gridRows: 3,
    buttons: [],
    ...partial,
  };
}

// Curated starter content. Single source of truth for the first-run board,
// the demo package, and the editor's "Add from library" picker. A library
// pick becomes an ordinary copied button — copies, never links, so editing
// it on one board can't silently change another.
export const BUTTON_LIBRARY = [
  {
    category: 'Core',
    items: [
      { label: 'yes', spokenText: 'Yes', color: PALETTE[3] },
      { label: 'no', spokenText: 'No', color: PALETTE[0] },
      { label: 'help', spokenText: 'I need help', color: PALETTE[1] },
      { label: 'more', spokenText: 'I want more', color: PALETTE[5] },
      { label: 'stop', spokenText: 'Stop, please', color: PALETTE[6] },
      { label: 'drink', spokenText: 'I want a drink', color: PALETTE[4] },
    ],
  },
  {
    category: 'Meals',
    items: [
      { label: 'sandwich', spokenText: 'I want a sandwich', color: PALETTE[0] },
      { label: 'pizza', spokenText: 'I want pizza', color: PALETTE[3] },
      { label: 'soup', spokenText: 'I want soup', color: PALETTE[6] },
      { label: 'pasta', spokenText: 'I want pasta', color: PALETTE[1] },
      { label: 'cereal', spokenText: 'I want cereal', color: PALETTE[4] },
      { label: 'yogurt', spokenText: 'I want yogurt', color: PALETTE[7] },
      { label: 'eggs', spokenText: 'I want eggs', color: PALETTE[2] },
      { label: 'salad', spokenText: 'I want salad', color: PALETTE[5] },
    ],
  },
  {
    category: 'Drinks & Snacks',
    items: [
      { label: 'water', spokenText: 'I want water', color: PALETTE[0] },
      { label: 'juice', spokenText: 'I want juice', color: PALETTE[3] },
      { label: 'milk', spokenText: 'I want milk', color: PALETTE[6] },
      { label: 'coffee', spokenText: 'I want coffee', color: PALETTE[1] },
      { label: 'crackers', spokenText: 'I want crackers', color: PALETTE[4] },
      { label: 'apple', spokenText: 'I want an apple', color: PALETTE[7] },
      { label: 'cookies', spokenText: 'I want a cookie', color: PALETTE[2] },
      { label: 'cheese', spokenText: 'I want cheese', color: PALETTE[5] },
    ],
  },
  {
    category: 'Activities',
    items: [
      { label: 'music', spokenText: 'I want to listen to music', color: PALETTE[0] },
      { label: 'TV', spokenText: 'I want to watch TV', color: PALETTE[3] },
      { label: 'walk', spokenText: 'I want to go for a walk', color: PALETTE[6] },
      { label: 'puzzle', spokenText: 'I want to do a puzzle', color: PALETTE[1] },
      { label: 'coloring', spokenText: 'I want to color', color: PALETTE[4] },
      { label: 'game', spokenText: 'I want to play a game', color: PALETTE[7] },
      { label: 'outside', spokenText: 'I want to go outside', color: PALETTE[2] },
      { label: 'rest', spokenText: 'I want to rest', color: PALETTE[5] },
    ],
  },
  {
    category: 'Comfort',
    items: [
      { label: 'too loud', spokenText: "It's too loud", color: PALETTE[0] },
      { label: 'too hot', spokenText: "I'm too hot", color: PALETTE[3] },
      { label: 'too cold', spokenText: "I'm too cold", color: PALETTE[6] },
      { label: 'tired', spokenText: "I'm tired", color: PALETTE[1] },
      { label: 'hurts', spokenText: 'Something hurts', color: PALETTE[4] },
      { label: 'break', spokenText: 'I need a break', color: PALETTE[7] },
    ],
  },
];

// First-run board: the library's Core set. Text-only so it works with zero
// image weight, and shows text-only buttons are first-class. Fully
// editable/deletable like any other.
export function starterButtons() {
  const core = BUTTON_LIBRARY.find((c) => c.category === 'Core').items;
  return core.map((seed, slot) => newButton({ ...seed, slot }));
}

export function defaultConfig() {
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: {
      // Modules default off unless they're core choice support. The sentence
      // strip is an AAC feature, not core — off until someone turns it on.
      sentenceStrip: false,
      checkScreen: true,
      voiceURI: null,
      speechRate: 1.0,
      debounceMs: 500,
      holdMs: 0,
      pinHash: null,
    },
    boards: [newBoard({ name: 'Choices', buttons: starterButtons() })],
  };
}

// The one door every stored config passes through on read. Per-version steps
// live here, never inline elsewhere.
export function migrate(config) {
  if (!config || typeof config !== 'object') return defaultConfig();
  if (config.schemaVersion === 1) {
    // v1 had a single implicit board; grid settings lived in settings.
    const raw = config.settings ?? {};
    const defaults = defaultConfig().settings;
    config = {
      schemaVersion: 2,
      settings: {
        // Existing devices keep their strip choice; only new installs get
        // the off-by-default.
        sentenceStrip: typeof raw.sentenceStrip === 'boolean' ? raw.sentenceStrip : defaults.sentenceStrip,
        checkScreen: defaults.checkScreen,
        voiceURI: raw.voiceURI ?? null,
        speechRate: raw.speechRate ?? defaults.speechRate,
        debounceMs: raw.debounceMs ?? defaults.debounceMs,
        holdMs: raw.holdMs ?? defaults.holdMs,
        pinHash: raw.pinHash ?? null,
      },
      boards: [newBoard({
        name: 'Choices',
        fillMode: raw.fillMode ?? true,
        gridCols: raw.gridCols ?? 3,
        gridRows: raw.gridRows ?? 3,
        buttons: Array.isArray(config.buttons) ? config.buttons : [],
      })],
    };
  }
  return config;
}

const BUTTON_TYPES = ['speak'];

// Validates an imported board package (also the provisioning contract).
// Accepts v1 packages (single implicit board) and v2 packages (boards list).
// Returns { ok: true, config, images } or { ok: false, errors: [...] }.
// `images` is { imageKey: dataURL }; caller converts data URLs to blobs.
export function validatePackage(pkg) {
  const errors = [];
  if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg)) {
    return { ok: false, errors: ['Not a board package (expected a JSON object).'] };
  }
  if (typeof pkg.schemaVersion !== 'number') {
    errors.push('Missing schemaVersion.');
  } else if (pkg.schemaVersion > SCHEMA_VERSION) {
    errors.push(`This backup is from a newer app version (v${pkg.schemaVersion}). Update the app first.`);
  }
  if (!pkg.settings || typeof pkg.settings !== 'object') errors.push('Missing settings.');
  const isV1 = pkg.schemaVersion === 1;
  if (isV1) {
    if (!Array.isArray(pkg.buttons)) errors.push('Missing buttons list.');
  } else if (!Array.isArray(pkg.boards) || pkg.boards.length === 0) {
    errors.push('Missing boards list.');
  }
  if (errors.length) return { ok: false, errors };

  const images = (pkg.images && typeof pkg.images === 'object') ? pkg.images : {};

  const readButtons = (rawButtons, where) => {
    const buttons = [];
    rawButtons.forEach((raw, i) => {
      if (!raw || typeof raw !== 'object') { errors.push(`${where} button ${i + 1} is not an object.`); return; }
      if (typeof raw.label !== 'string' || typeof raw.spokenText !== 'string') {
        errors.push(`${where} button ${i + 1} ("${raw.label ?? '?'}") is missing label or spoken text.`);
        return;
      }
      if (raw.imageKey != null && !images[raw.imageKey]) {
        errors.push(`Button "${raw.label}" references a photo missing from the backup.`);
        return;
      }
      // Explicit field allowlist — never spread untrusted input into stored config.
      buttons.push(newButton({
        id: typeof raw.id === 'string' ? raw.id : undefined,
        type: BUTTON_TYPES.includes(raw.type) ? raw.type : 'speak',
        label: raw.label,
        spokenText: raw.spokenText,
        imageKey: raw.imageKey ?? null,
        slot: Number.isInteger(raw.slot) ? raw.slot : i,
        visible: raw.visible !== false,
        color: typeof raw.color === 'string' ? raw.color : null,
      }));
    });
    return buttons;
  };

  // Same allowlist rule for boards; clamp numbers so a hand-edited file
  // can't produce an unusable board (0 columns, 10x speech rate).
  const readBoard = (raw, index) => {
    if (!raw || typeof raw !== 'object') { errors.push(`Board ${index + 1} is not an object.`); return null; }
    if (!Array.isArray(raw.buttons)) { errors.push(`Board ${index + 1} is missing its buttons list.`); return null; }
    const name = (typeof raw.name === 'string' && raw.name.trim()) ? raw.name.trim() : `Board ${index + 1}`;
    return newBoard({
      id: typeof raw.id === 'string' ? raw.id : undefined,
      name,
      color: typeof raw.color === 'string' ? raw.color : null,
      fillMode: typeof raw.fillMode === 'boolean' ? raw.fillMode : true,
      gridCols: clampInt(raw.gridCols, 1, 8, 3),
      gridRows: clampInt(raw.gridRows, 1, 8, 3),
      buttons: readButtons(raw.buttons, name),
    });
  };

  const rawSettings = pkg.settings;
  const boards = isV1
    ? [readBoard({
        name: 'Choices',
        fillMode: rawSettings.fillMode,
        gridCols: rawSettings.gridCols,
        gridRows: rawSettings.gridRows,
        buttons: pkg.buttons,
      }, 0)]
    : pkg.boards.map(readBoard);
  if (errors.length) return { ok: false, errors };

  const defaults = defaultConfig().settings;
  const settings = {
    sentenceStrip: typeof rawSettings.sentenceStrip === 'boolean' ? rawSettings.sentenceStrip : defaults.sentenceStrip,
    checkScreen: typeof rawSettings.checkScreen === 'boolean' ? rawSettings.checkScreen : defaults.checkScreen,
    voiceURI: typeof rawSettings.voiceURI === 'string' ? rawSettings.voiceURI : null,
    speechRate: clampNumber(rawSettings.speechRate, 0.5, 2, defaults.speechRate),
    debounceMs: clampInt(rawSettings.debounceMs, 0, 3000, defaults.debounceMs),
    holdMs: clampInt(rawSettings.holdMs, 0, 2000, defaults.holdMs),
    pinHash: null, // PIN never travels in packages; the device keeps its own.
  };

  return { ok: true, config: { schemaVersion: SCHEMA_VERSION, settings, boards }, images };
}

// Works on v2 configs and on v1 configs still sitting in old snapshots.
export function allButtons(config) {
  if (Array.isArray(config?.boards)) return config.boards.flatMap((b) => b.buttons ?? []);
  return config?.buttons ?? [];
}

export function imageKeysInConfig(config) {
  const keys = new Set();
  for (const b of allButtons(config)) {
    if (b.imageKey) keys.add(b.imageKey);
  }
  return keys;
}

function clampInt(value, min, max, fallback) {
  return Number.isInteger(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function clampNumber(value, min, max, fallback) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
}
