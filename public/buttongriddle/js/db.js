// IndexedDB layer. Four kinds of data:
//   boards    — 'config' (live board) and 'baseline' (as-provisioned snapshot)
//   snapshots — small ring buffer of pre-destructive-action configs
//   images    — photo blobs keyed by imageKey, shared by all of the above
import { imageKeysInConfig } from './schema.js';

const DB_NAME = 'buttongriddle';
const DB_VERSION = 1;
const SNAPSHOT_KEEP = 3;

let dbPromise = null;

function openDb() {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('boards')) db.createObjectStore('boards');
      if (!db.objectStoreNames.contains('snapshots')) {
        db.createObjectStore('snapshots', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('images')) db.createObjectStore('images');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

// Wraps one transaction; body receives the store(s) and queues requests,
// resolution happens on transaction complete so multi-step writes are atomic.
async function tx(storeNames, mode, body) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeNames, mode);
    let result;
    try {
      result = body(...storeNames.map((name) => transaction.objectStore(name)));
    } catch (err) {
      transaction.abort();
      reject(err);
      return;
    }
    // WebKit sometimes leaves transaction.error null on failure — never
    // reject with nothing, it makes the failure undebuggable.
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
  });
}

function reqToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getBoard(name) {
  const db = await openDb();
  return reqToPromise(db.transaction('boards').objectStore('boards').get(name));
}

export async function putBoard(name, config) {
  return tx(['boards'], 'readwrite', (boards) => {
    boards.put(config, name);
  });
}

// Images are stored as { buf, type } rather than Blobs: Safari/WebKit's
// IndexedDB rejects Blob puts with "Error preparing Blob/File data to be
// stored in object store". ArrayBuffers structured-clone reliably everywhere.
export async function putImage(key, blob) {
  const record = { buf: await blob.arrayBuffer(), type: blob.type };
  return tx(['images'], 'readwrite', (images) => {
    images.put(record, key);
  });
}

export async function getImage(key) {
  const db = await openDb();
  const record = await reqToPromise(db.transaction('images').objectStore('images').get(key));
  if (!record) return undefined;
  if (record instanceof Blob) return record; // pre-fix records (Chromium stored Blobs fine)
  return new Blob([record.buf], { type: record.type });
}

export async function allImageKeys() {
  const db = await openDb();
  return reqToPromise(db.transaction('images').objectStore('images').getAllKeys());
}

// Push current config onto the snapshot ring buffer, trimming to the newest
// SNAPSHOT_KEEP. Called before every destructive replace (reset, import).
export async function pushSnapshot(config, reason) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('snapshots', 'readwrite');
    const store = transaction.objectStore('snapshots');
    store.add({ takenAt: Date.now(), reason, config });
    const keysReq = store.getAllKeys();
    keysReq.onsuccess = () => {
      const keys = keysReq.result;
      keys.slice(0, Math.max(0, keys.length - SNAPSHOT_KEEP)).forEach((key) => store.delete(key));
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function latestSnapshot() {
  const db = await openDb();
  const all = await reqToPromise(db.transaction('snapshots').objectStore('snapshots').getAll());
  return all.length ? all[all.length - 1] : null;
}

// Delete image blobs referenced by nothing — not config, not baseline, not
// any snapshot. Run after destructive replaces; safe to run any time.
export async function gcImages() {
  const [config, baseline] = await Promise.all([getBoard('config'), getBoard('baseline')]);
  const db = await openDb();
  const snapshots = await reqToPromise(db.transaction('snapshots').objectStore('snapshots').getAll());
  const referenced = new Set();
  for (const cfg of [config, baseline, ...snapshots.map((s) => s.config)]) {
    if (cfg) imageKeysInConfig(cfg).forEach((key) => referenced.add(key));
  }
  const keys = await allImageKeys();
  const orphans = keys.filter((key) => !referenced.has(key));
  if (!orphans.length) return 0;
  await tx(['images'], 'readwrite', (images) => {
    orphans.forEach((key) => images.delete(key));
  });
  return orphans.length;
}
