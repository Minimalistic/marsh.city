// Caregiver layer: 7-tap entry, PIN gate, button editor, settings panel,
// and the baseline/reset/snapshot flows. All dialogs are <dialog> elements —
// no alert/confirm/prompt anywhere.
import { PALETTE, BUTTON_LIBRARY, APP_VERSION, newButton, newBoard, defaultConfig, migrate } from './schema.js';
import * as db from './db.js';
import { speak, onVoices } from './speech.js';
import { exportBoard, parsePackageFile } from './backup.js';

const TAP_COUNT = 7;
const TAP_WINDOW_MS = 3000;
const FORGOT = Symbol('forgot');
const PHOTO_NOTE_KEY = 'bg-photo-note-shown';

export function initEdit(app) {
  const $ = (id) => document.getElementById(id);

  // ----- 7-tap corner entry -----
  let taps = [];
  $('corner-logo').addEventListener('click', async () => {
    const now = performance.now();
    taps = taps.filter((t) => now - t < TAP_WINDOW_MS);
    taps.push(now);
    if (taps.length < TAP_COUNT) return;
    taps = [];
    if (app.isEditing()) return;
    if (await requirePin()) app.setEditing(true);
  });

  $('edit-done').addEventListener('click', () => app.setEditing(false));
  $('edit-settings').addEventListener('click', openSettings);
  $('app-version').textContent = `v${APP_VERSION}`;

  // ----- dialog plumbing -----
  function showDialog(dlg) {
    return new Promise((resolve) => {
      dlg.returnValue = 'cancel';
      dlg.showModal();
      dlg.addEventListener('close', () => resolve(dlg.returnValue), { once: true });
    });
  }

  async function confirmAction({ title, message, okLabel = 'OK', word = null }) {
    const dlg = $('dlg-confirm');
    $('confirm-title').textContent = title;
    $('confirm-message').textContent = message;
    $('confirm-ok').textContent = okLabel;
    const wordInput = $('confirm-word');
    const error = $('confirm-error');
    wordInput.hidden = !word;
    wordInput.value = '';
    error.hidden = true;
    if (word) wordInput.setAttribute('aria-label', `Type ${word} to confirm`);

    const guard = (e) => {
      if (e.submitter?.value === 'ok' && word && wordInput.value.trim().toUpperCase() !== word) {
        e.preventDefault();
        error.textContent = `Type ${word} to confirm.`;
        error.hidden = false;
      }
    };
    $('confirm-form').addEventListener('submit', guard);
    const result = await showDialog(dlg);
    $('confirm-form').removeEventListener('submit', guard);
    return result === 'ok';
  }

  async function infoDialog(title, message) {
    const dlg = $('dlg-confirm');
    $('confirm-title').textContent = title;
    $('confirm-message').textContent = message;
    $('confirm-ok').textContent = 'OK';
    $('confirm-word').hidden = true;
    $('confirm-error').hidden = true;
    await showDialog(dlg);
  }

  // ----- PIN -----
  async function sha256Hex(text) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // One round of the PIN dialog. Resolves to the typed PIN, FORGOT, or null.
  async function askPin({ title, hint = '', error = '', allowForgot = false }) {
    const dlg = $('dlg-pin');
    $('pin-title').textContent = title;
    $('pin-hint').textContent = hint;
    const errorEl = $('pin-error');
    errorEl.textContent = error;
    errorEl.hidden = !error;
    const input = $('pin-input');
    input.value = '';
    const forgotBtn = $('pin-forgot');
    forgotBtn.hidden = !allowForgot;
    const onForgot = () => dlg.close('forgot');
    forgotBtn.addEventListener('click', onForgot);
    const result = await showDialog(dlg);
    forgotBtn.removeEventListener('click', onForgot);
    if (result === 'forgot') return FORGOT;
    if (result !== 'ok') return null;
    return /^\d{4}$/.test(input.value) ? input.value : askPin({ title, hint, error: 'Enter 4 digits.', allowForgot });
  }

  async function askNewPin(hint = 'Choose a 4-digit passcode for caregiver access.') {
    let error = '';
    while (true) {
      const first = await askPin({ title: 'Set passcode', hint, error });
      if (first === null || first === FORGOT) return null;
      const second = await askPin({ title: 'Set passcode', hint: 'Enter it again to confirm.' });
      if (second === null || second === FORGOT) return null;
      if (first === second) return first;
      error = 'Passcodes did not match — try again.';
    }
  }

  async function requirePin() {
    const config = app.getConfig();
    if (!config.settings.pinHash) {
      const pin = await askNewPin();
      if (!pin) return false;
      config.settings.pinHash = await sha256Hex(pin);
      await app.save();
      return true;
    }
    let fails = 0;
    while (true) {
      const pin = await askPin({
        title: 'Enter passcode',
        error: fails ? 'Wrong passcode.' : '',
        allowForgot: fails >= 5,
      });
      if (pin === null) return false;
      if (pin === FORGOT) return forgotPinReset();
      if (await sha256Hex(pin) === config.settings.pinHash) return true;
      fails++;
    }
  }

  // Forgot-PIN path: never destroys data silently. Typed confirmation,
  // reverts to baseline (or starter board), current board saved as a
  // snapshot, and a fresh PIN is set as part of the flow.
  async function forgotPinReset() {
    const confirmed = await confirmAction({
      title: 'Reset board',
      message: 'This puts the board back to its original setup and clears the passcode. '
        + 'The current board is kept as a restorable snapshot.',
      okLabel: 'Reset',
      word: 'RESET',
    });
    if (!confirmed) return false;
    const pin = await askNewPin('First, choose a new 4-digit passcode.');
    if (!pin) return false;
    await applyReplacement(await baselineOrStarter(), 'forgot-pin reset', await sha256Hex(pin));
    return true;
  }

  async function baselineOrStarter() {
    return (await db.getBoard('baseline')) ?? defaultConfig();
  }

  // Snapshot current board, then replace it. pinHash is device-local:
  // restores and resets never resurrect an old PIN. migrate() because
  // baselines/snapshots written by older app versions may still be v1.
  async function applyReplacement(nextConfig, reason, pinHash = app.getConfig().settings.pinHash) {
    await db.pushSnapshot(app.getConfig(), reason);
    const config = migrate(structuredClone(nextConfig));
    config.settings.pinHash = pinHash;
    await app.setConfig(config);
    await db.gcImages();
  }

  // ----- button editor -----
  const swatchesEl = $('editor-swatches');
  const editorState = { button: null, slot: 0, color: null, image: null, removeImage: false };

  function buildSwatches() {
    swatchesEl.textContent = '';
    const none = document.createElement('button');
    none.type = 'button';
    none.className = 'swatch none';
    none.textContent = 'none';
    none.addEventListener('click', () => selectColor(null));
    swatchesEl.appendChild(none);
    for (const color of PALETTE) {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'swatch';
      swatch.style.background = color;
      swatch.dataset.color = color;
      swatch.setAttribute('aria-label', `Color ${color}`);
      swatch.addEventListener('click', () => selectColor(color));
      swatchesEl.appendChild(swatch);
    }
  }
  buildSwatches();

  function selectColor(color) {
    editorState.color = color;
    for (const swatch of swatchesEl.children) {
      swatch.classList.toggle('selected', (swatch.dataset.color ?? null) === color);
    }
    renderPreview();
  }

  function renderPreview() {
    const preview = $('editor-preview');
    preview.textContent = '';
    preview.style.background = editorState.color ?? 'var(--tile-bg)';
    let url = null;
    if (editorState.image) url = editorState.image.previewURL;
    else if (!editorState.removeImage && editorState.button?.imageKey) {
      url = app.imageURL(editorState.button.imageKey);
    }
    if (url) {
      const img = document.createElement('img');
      img.src = url;
      img.alt = '';
      preview.appendChild(img);
    }
    const label = document.createElement('span');
    label.className = 'tile-label';
    label.textContent = $('editor-label').value || '…';
    preview.appendChild(label);
    preview.classList.toggle('text-only', !url);
    $('editor-remove-photo').hidden = !url;
  }

  async function pickImage(file) {
    if (!file) return;
    if (!localStorage.getItem(PHOTO_NOTE_KEY)) {
      localStorage.setItem(PHOTO_NOTE_KEY, '1');
      await infoDialog('About photos',
        'Photos stay on this device only. They are included in backup files you '
        + 'export, so keep that in mind for sensitive images.');
    }
    try {
      const blob = await downscaleImage(file);
      if (editorState.image) URL.revokeObjectURL(editorState.image.previewURL);
      editorState.image = { blob, previewURL: URL.createObjectURL(blob) };
      editorState.removeImage = false;
      renderPreview();
    } catch {
      await infoDialog('Photo problem', 'That image could not be read. Try a different photo.');
    }
  }

  async function downscaleImage(file) {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, 800 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('encode failed'))), 'image/jpeg', 0.8);
    });
  }

  $('editor-camera').addEventListener('change', (e) => pickImage(e.target.files[0]));
  $('editor-gallery').addEventListener('change', (e) => pickImage(e.target.files[0]));
  $('editor-remove-photo').addEventListener('click', () => {
    if (editorState.image) URL.revokeObjectURL(editorState.image.previewURL);
    editorState.image = null;
    editorState.removeImage = true;
    renderPreview();
  });
  $('editor-label').addEventListener('input', renderPreview);
  $('editor-test').addEventListener('click', () => {
    speak($('editor-spoken').value || $('editor-label').value, app.getConfig().settings);
  });

  async function openEditor(button, slot) {
    editorState.button = button;
    editorState.slot = slot;
    editorState.image = null;
    editorState.removeImage = false;
    $('editor-title').textContent = button ? 'Edit button' : 'New button';
    $('editor-library').hidden = !!button; // library only makes sense for new buttons
    $('editor-label').value = button?.label ?? '';
    $('editor-spoken').value = button?.spokenText ?? '';
    $('editor-camera').value = '';
    $('editor-gallery').value = '';
    $('editor-delete').hidden = !button;
    selectColor(button?.color ?? null);

    const result = await showDialog($('dlg-editor'));
    const pendingImage = editorState.image;
    if (result !== 'ok') {
      if (pendingImage) URL.revokeObjectURL(pendingImage.previewURL);
      if (result === 'library') return openLibrary(slot);
      return;
    }

    const board = app.getActiveBoard();
    const label = $('editor-label').value.trim();
    if (!board || !label) return;
    const spokenText = $('editor-spoken').value.trim() || label;

    let imageKey = button?.imageKey ?? null;
    if (editorState.removeImage) imageKey = null;
    try {
      if (pendingImage) {
        // Revoke up front — addImageURL mints its own URL from the blob, and
        // revoking here can't leak if putImage throws below.
        URL.revokeObjectURL(pendingImage.previewURL);
        imageKey = `img-${crypto.randomUUID()}`;
        await db.putImage(imageKey, pendingImage.blob);
        app.addImageURL(imageKey, pendingImage.blob);
      }

      if (button) {
        Object.assign(button, { label, spokenText, color: editorState.color, imageKey });
      } else {
        board.buttons.push(newButton({
          label, spokenText, color: editorState.color, imageKey, slot,
        }));
      }
      await app.save();
      await db.gcImages();
      app.render();
    } catch (err) {
      // A caregiver's edit must never vanish silently (this bit us on iOS:
      // WebKit rejected Blob puts and the button was quietly dropped).
      console.error('[ButtonGriddle] button save failed', err);
      await infoDialog('Save problem',
        'The button could not be saved. Please try again — if it keeps failing, try without a photo.');
    }
  }

  // ----- library picker -----
  // Copies, never links: a pick becomes a fresh button on this board. Only
  // the photo blob is shared (same imageKey — gcImages refcounts across
  // boards), so duplicating a button costs metadata, not storage.
  $('editor-library').addEventListener('click', () => $('dlg-editor').close('library'));

  async function openLibrary(slot) {
    const list = $('library-list');
    list.textContent = '';
    let chosen = null;

    const makeItem = (source, hint) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'library-item';
      const url = source.imageKey ? app.imageURL(source.imageKey) : null;
      if (url) {
        const img = document.createElement('img');
        img.src = url;
        img.alt = '';
        item.appendChild(img);
      } else {
        const dot = document.createElement('span');
        dot.className = 'library-dot';
        if (source.color) dot.style.background = source.color;
        item.appendChild(dot);
      }
      const text = document.createElement('span');
      text.className = 'library-text';
      const label = document.createElement('span');
      label.className = 'library-label';
      label.textContent = source.label;
      const detail = document.createElement('span');
      detail.className = 'library-spoken';
      detail.textContent = hint;
      text.append(label, detail);
      item.appendChild(text);
      item.addEventListener('click', () => {
        chosen = source;
        $('dlg-library').close('ok');
      });
      return item;
    };

    const addSection = (title, entries) => {
      if (!entries.length) return;
      const heading = document.createElement('p');
      heading.className = 'section-label';
      heading.textContent = title;
      list.appendChild(heading);
      entries.forEach((entry) => list.appendChild(entry));
    };

    // Buttons already built on this device come first — they carry the
    // client's real photos and phrasing, which beats any curated text.
    addSection('On your boards', app.getConfig().boards.flatMap((board) =>
      board.buttons.map((b) => makeItem(b, `“${b.spokenText}” — ${board.name}`))));
    for (const { category, items } of BUTTON_LIBRARY) {
      addSection(category, items.map((item) => makeItem(item, `“${item.spokenText}”`)));
    }

    const result = await showDialog($('dlg-library'));
    if (result !== 'ok' || !chosen) return;
    const board = app.getActiveBoard();
    if (!board) return;
    board.buttons.push(newButton({
      label: chosen.label,
      spokenText: chosen.spokenText,
      color: chosen.color ?? null,
      imageKey: chosen.imageKey ?? null,
      slot,
    }));
    await app.save();
    app.render();
  }

  $('editor-delete').addEventListener('click', async () => {
    $('dlg-editor').close('cancel');
    const button = editorState.button;
    const confirmed = await confirmAction({
      title: 'Delete button',
      message: `Delete "${button.label}"? You can undo with Restore previous version in Settings.`,
      okLabel: 'Delete',
    });
    if (!confirmed) return;
    const board = app.getActiveBoard();
    await db.pushSnapshot(app.getConfig(), `delete ${button.label}`);
    board.buttons = board.buttons.filter((b) => b.id !== button.id);
    await app.save();
    await db.gcImages();
    app.render();
  });

  // ----- board edit callbacks (used by renderBoard via app) -----
  // Fill mode: drag ended — the DOM order is the new truth, slots follow it.
  function reorderButtons(orderedIds) {
    const byId = new Map(app.getActiveBoard().buttons.map((b) => [b.id, b]));
    orderedIds.forEach((id, index) => {
      const button = byId.get(id);
      if (button) button.slot = index;
    });
    app.save();
    app.render();
  }

  // Fixed mode: drop on a cell — occupied cells swap, empty cells just take it.
  function moveToSlot(button, slot) {
    if (!Number.isInteger(slot)) return app.render();
    const occupant = app.getActiveBoard().buttons.find((b) => b.slot === slot && b.id !== button.id);
    if (occupant) occupant.slot = button.slot;
    button.slot = slot;
    app.save();
    app.render();
  }

  function toggleVisible(button) {
    button.visible = !button.visible;
    app.save();
    app.render();
  }

  // ----- settings panel -----
  const rateEl = $('set-rate');
  const holdEl = $('set-hold');
  const debounceEl = $('set-debounce');

  onVoices((voices) => {
    const select = $('set-voice');
    const current = app.getConfig().settings.voiceURI;
    select.textContent = '';
    select.appendChild(new Option('Device default', ''));
    for (const voice of voices) {
      select.appendChild(new Option(`${voice.name} (${voice.lang})`, voice.voiceURI, false, voice.voiceURI === current));
    }
  });

  function syncSettingsPanel() {
    const { settings } = app.getConfig();
    // Layout is per-board since v2; the section only appears with a board open.
    const board = app.getActiveBoard();
    $('set-grid-wrap').hidden = !board;
    if (board) {
      $('set-fill').checked = board.fillMode;
      $('set-grid-size').style.display = board.fillMode ? 'none' : '';
      $('set-cols').value = board.gridCols;
      $('set-rows').value = board.gridRows;
    }
    $('set-strip').checked = settings.sentenceStrip;
    $('set-check').checked = settings.checkScreen;
    $('set-voice').value = settings.voiceURI ?? '';
    rateEl.value = settings.speechRate;
    holdEl.value = settings.holdMs;
    debounceEl.value = settings.debounceMs;
    $('set-rate-value').textContent = `${settings.speechRate}×`;
    $('set-hold-value').textContent = settings.holdMs ? `${settings.holdMs / 1000}s` : 'off';
    $('set-debounce-value').textContent = `${debounceEl.value} ms`;
  }

  function openSettings() {
    syncSettingsPanel();
    syncStorageNote();
    showDialog($('dlg-settings'));
  }

  // Deliberate updates: section appears only when a new version is waiting.
  // "Update now" stays disabled until a backup export succeeds this session —
  // the same lock-it-in habit as handing over the tablet.
  app.onUpdateReady(() => { $('update-section').hidden = false; });
  $('update-backup').addEventListener('click', async () => {
    if (await exportBackupWithFeedback()) $('update-apply').disabled = false;
  });
  $('update-apply').addEventListener('click', () => app.applyUpdate());

  // Storage health, refreshed each time Settings opens. Persisted storage is
  // the browser's promise not to auto-evict IndexedDB under disk pressure —
  // without it, an unused tablet can silently lose every board and photo.
  async function syncStorageNote() {
    const note = $('storage-note');
    if (!navigator.storage?.persisted) { note.hidden = true; return; }
    try {
      const persisted = await navigator.storage.persisted();
      const { usage } = await navigator.storage.estimate?.() ?? {};
      const size = usage ? ` Boards and photos use ${formatBytes(usage)}.` : '';
      note.classList.toggle('warning', !persisted);
      note.textContent = persisted
        ? `Storage protected: this device won't automatically clear boards.${size}`
        : `⚠ Storage not protected: if the tablet runs very low on space, the browser may erase boards and photos. Keep an exported backup somewhere safe.${size}`;
      note.hidden = false;
    } catch {
      note.hidden = true;
    }
  }

  function formatBytes(bytes) {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  // Settings apply live — the board behind the dialog is the preview.
  const applySetting = (mutate) => async () => {
    mutate(app.getConfig().settings);
    await app.save();
    syncSettingsPanel();
    app.render();
  };
  const applyBoardSetting = (mutate) => async () => {
    const board = app.getActiveBoard();
    if (!board) return;
    mutate(board);
    await app.save();
    syncSettingsPanel();
    app.render();
  };
  $('set-fill').addEventListener('change', applyBoardSetting((b) => { b.fillMode = $('set-fill').checked; }));
  $('set-cols').addEventListener('change', applyBoardSetting((b) => { b.gridCols = clamp($('set-cols').value, 1, 8); }));
  $('set-rows').addEventListener('change', applyBoardSetting((b) => { b.gridRows = clamp($('set-rows').value, 1, 8); }));
  $('set-strip').addEventListener('change', applySetting((s) => { s.sentenceStrip = $('set-strip').checked; }));
  $('set-check').addEventListener('change', applySetting((s) => { s.checkScreen = $('set-check').checked; }));
  $('set-voice').addEventListener('change', applySetting((s) => { s.voiceURI = $('set-voice').value || null; }));
  rateEl.addEventListener('change', applySetting((s) => { s.speechRate = Number(rateEl.value); }));
  holdEl.addEventListener('change', applySetting((s) => { s.holdMs = Number(holdEl.value); }));
  debounceEl.addEventListener('change', applySetting((s) => { s.debounceMs = Number(debounceEl.value); }));

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Number(value) || min));
  }

  $('set-change-pin').addEventListener('click', async () => {
    const pin = await askNewPin('Choose a new 4-digit passcode.');
    if (!pin) return;
    app.getConfig().settings.pinHash = await sha256Hex(pin);
    await app.save();
  });

  // Dev-only while field testing: wipe IndexedDB, localStorage, caches, and
  // the service worker so this device matches a first visit to the website.
  $('set-reset-app').addEventListener('click', async () => {
    const confirmed = await confirmAction({
      title: 'Reset app (development only)',
      message: 'This erases every board, photo, snapshot, and setting on this device — '
        + 'including the passcode — and reloads the app fresh from the website.',
      okLabel: 'Erase everything',
      word: 'ERASE',
    });
    if (!confirmed) return;
    try {
      await db.destroyDb();
      localStorage.clear();
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((reg) => reg.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch (err) {
      console.error('[ButtonGriddle] app reset failed', err);
      await infoDialog('Reset problem',
        'Something on this device refused to be erased. Reloading anyway — '
        + 'if the app is in a bad state, clear site data in Chrome settings.');
    }
    location.reload();
  });

  $('set-export').addEventListener('click', () => exportBackupWithFeedback());

  // Export must never fail silently — it's the safety net for updates and
  // resets, and a dead-looking button here means a caregiver skips the backup.
  async function exportBackupWithFeedback() {
    try {
      await exportBoard(app.getConfig());
      return true;
    } catch (err) {
      console.error('[ButtonGriddle] backup export failed', err);
      await infoDialog('Export problem',
        'The backup could not be created. Please try again — if it keeps failing, restart the app first.');
      return false;
    }
  }

  $('set-import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const result = await parsePackageFile(file);
    if (!result.ok) {
      await infoDialog('Import failed', result.errors.join(' '));
      return;
    }
    const confirmed = await confirmAction({
      title: 'Replace board',
      message: 'Replace the current board with the imported one? It also becomes the new '
        + '"original setup". The current board is kept as a restorable snapshot.',
      okLabel: 'Replace',
    });
    if (!confirmed) return;
    await db.putBoard('baseline', result.config);
    await applyReplacement(result.config, 'import');
    app.render();
  });

  $('set-save-baseline').addEventListener('click', async () => {
    const config = structuredClone(app.getConfig());
    config.settings.pinHash = null;
    await db.putBoard('baseline', config);
    await infoDialog('Saved', 'This board is now the "original setup" that Reset returns to.');
  });

  $('set-reset-baseline').addEventListener('click', async () => {
    const confirmed = await confirmAction({
      title: 'Reset to original setup',
      message: 'This puts the board back to its original setup. The current board is kept '
        + 'as a restorable snapshot.',
      okLabel: 'Reset',
      word: 'RESET',
    });
    if (!confirmed) return;
    await applyReplacement(await baselineOrStarter(), 'reset to baseline');
    app.render();
  });

  $('set-restore-snapshot').addEventListener('click', async () => {
    const snapshot = await db.latestSnapshot();
    if (!snapshot) {
      await infoDialog('Nothing to restore', 'No previous version has been saved yet.');
      return;
    }
    const confirmed = await confirmAction({
      title: 'Restore previous version',
      message: `Go back to the board as it was before "${snapshot.reason}"?`,
      okLabel: 'Restore',
    });
    if (!confirmed) return;
    await applyReplacement(snapshot.config, 'restore snapshot');
    app.render();
  });

  // ----- board editor (home screen: add / rename / color / delete) -----
  const boardSwatchesEl = $('board-swatches');
  const boardEditorState = { board: null, color: null };

  function buildBoardSwatches() {
    boardSwatchesEl.textContent = '';
    const none = document.createElement('button');
    none.type = 'button';
    none.className = 'swatch none';
    none.textContent = 'none';
    none.addEventListener('click', () => selectBoardColor(null));
    boardSwatchesEl.appendChild(none);
    for (const color of PALETTE) {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'swatch';
      swatch.style.background = color;
      swatch.dataset.color = color;
      swatch.setAttribute('aria-label', `Color ${color}`);
      swatch.addEventListener('click', () => selectBoardColor(color));
      boardSwatchesEl.appendChild(swatch);
    }
  }
  buildBoardSwatches();

  function selectBoardColor(color) {
    boardEditorState.color = color;
    for (const swatch of boardSwatchesEl.children) {
      swatch.classList.toggle('selected', (swatch.dataset.color ?? null) === color);
    }
  }

  async function openBoardEditor(board) {
    boardEditorState.board = board;
    $('board-title').textContent = board ? 'Board settings' : 'New board';
    $('board-name').value = board?.name ?? '';
    // Never orphan the device on zero boards — the last one can't be deleted.
    $('board-delete').hidden = !board || app.getConfig().boards.length <= 1;
    selectBoardColor(board?.color ?? null);

    const result = await showDialog($('dlg-board'));
    if (result !== 'ok') return;
    const name = $('board-name').value.trim();
    if (!name) return;

    if (board) {
      Object.assign(board, { name, color: boardEditorState.color });
      await app.save();
      app.render();
    } else {
      const created = newBoard({ name, color: boardEditorState.color });
      app.getConfig().boards.push(created);
      await app.save();
      app.openBoard(created.id); // straight into the empty board to add buttons
    }
  }

  $('board-delete').addEventListener('click', async () => {
    $('dlg-board').close('cancel');
    const board = boardEditorState.board;
    const confirmed = await confirmAction({
      title: 'Delete board',
      message: `Delete "${board.name}" and its ${board.buttons.length} buttons? `
        + 'You can undo with Restore previous version in Settings.',
      okLabel: 'Delete',
    });
    if (!confirmed) return;
    const config = app.getConfig();
    await db.pushSnapshot(config, `delete board ${board.name}`);
    config.boards = config.boards.filter((b) => b.id !== board.id);
    await app.save();
    await db.gcImages();
    app.render();
  });

  return { openEditor, openBoardEditor, reorderButtons, moveToSlot, toggleVisible };
}
