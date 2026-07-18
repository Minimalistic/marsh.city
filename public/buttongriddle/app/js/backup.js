// Board packages: the export/import format, and (later) the contract a
// provisioning portal will emit. Images travel inline as base64 data URLs.
import { validatePackage, imageKeysInConfig } from './schema.js';
import * as db from './db.js';

// Pure package assembly, exported for tests: this shape IS the backup file
// format, and the pinHash strip is a contract — PIN stays on the device.
export function buildPackage(config, images) {
  return {
    schemaVersion: config.schemaVersion,
    settings: { ...config.settings, pinHash: null },
    boards: config.boards,
    images,
  };
}

export async function exportBoard(config) {
  const images = {};
  for (const key of imageKeysInConfig(config)) {
    const blob = await db.getImage(key);
    if (blob) images[key] = await blobToDataURL(blob);
  }
  const pkg = buildPackage(config, images);
  const file = new Blob([JSON.stringify(pkg)], { type: 'application/json' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = `griddle-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

// Parses + validates a package file. Returns { ok, config, errors }.
// On success the images are already written to IndexedDB, but the config
// is NOT applied — the caller owns snapshotting and replacing the board.
export async function parsePackageFile(file) {
  let pkg;
  try {
    pkg = JSON.parse(await file.text());
  } catch {
    return { ok: false, errors: ['That file is not a readable backup (invalid JSON).'] };
  }
  const result = validatePackage(pkg);
  if (!result.ok) return result;

  for (const [key, dataURL] of Object.entries(result.images)) {
    const blob = dataURLToBlob(dataURL);
    if (!blob) return { ok: false, errors: [`Photo "${key}" in the backup is corrupted.`] };
    await db.putImage(key, blob);
  }
  return { ok: true, config: result.config };
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Manual decode instead of fetch(dataURL) — keeps CSP connect-src tight.
// Exported for tests only; app code goes through parsePackageFile.
export function dataURLToBlob(dataURL) {
  const match = /^data:([^;,]+);base64,(.*)$/s.exec(dataURL);
  if (!match) return null;
  try {
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: match[1] });
  } catch {
    return null;
  }
}
