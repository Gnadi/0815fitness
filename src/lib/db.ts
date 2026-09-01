import type { Activity, ActivitySamples } from '../types';

/** The training log lives in IndexedDB rather than `localStorage`.
 *
 *  `localStorage` holds one string per key, and the whole log was one of them: every
 *  save re-serialised every activity ever recorded, and the ~5 MB origin quota — which
 *  an hour of riding with a strap, a meter and a cadence sensor eats a tenth of — was a
 *  hard ceiling somewhere around ten hours of training, hit as an exception thrown in
 *  the middle of saving the session that crossed it. IndexedDB stores records, so a save
 *  writes one activity, samples are read only for the sessions that draw them, and the
 *  quota is the device's rather than a five-megabyte string. */
const DB_NAME = 'contour';
const DB_VERSION = 1;

export const STORE_ACTIVITIES = 'activities';
export const STORE_SAMPLES = 'samples';
export const STORE_KV = 'kv';

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_ACTIVITIES)) {
        const store = db.createObjectStore(STORE_ACTIVITIES, { keyPath: 'id' });
        store.createIndex('startedAt', 'startedAt');
      }
      if (!db.objectStoreNames.contains(STORE_SAMPLES)) db.createObjectStore(STORE_SAMPLES, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORE_KV)) db.createObjectStore(STORE_KV);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('contour: the database is blocked by another open tab'));
  });
  return dbPromise;
}

/** Test seam: drops the cached handle so a fresh database can be opened. */
export function resetDbHandle(): void {
  dbPromise = null;
}

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Runs `body` in one transaction and resolves when that transaction *commits*, not
 *  when the last request succeeds — a write that is never durable is not a save. */
async function tx<T>(stores: string[], mode: IDBTransactionMode, body: (t: IDBTransaction) => Promise<T> | T): Promise<T> {
  const db = await openDb();
  const transaction = db.transaction(stores, mode);
  const done = new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error ?? new Error('contour: the transaction was aborted'));
  });
  const result = await body(transaction);
  if (mode !== 'readonly') await done;
  return result;
}

// ── activities ────────────────────────────────────────────────────
export async function getAllActivities(): Promise<Activity[]> {
  const all = await tx([STORE_ACTIVITIES], 'readonly', (t) => promisify(t.objectStore(STORE_ACTIVITIES).getAll() as IDBRequest<Activity[]>));
  return all.sort((a, b) => b.startedAt - a.startedAt);
}

export async function putActivity(activity: Activity, samples: ActivitySamples | null): Promise<void> {
  await tx([STORE_ACTIVITIES, STORE_SAMPLES], 'readwrite', (t) => {
    t.objectStore(STORE_ACTIVITIES).put(activity);
    if (samples) t.objectStore(STORE_SAMPLES).put(samples);
  });
}

/** Updates the summary alone, leaving the samples untouched — what editing a title,
 *  a note or the gear on a saved activity is. */
export async function putActivitySummary(activity: Activity): Promise<void> {
  await tx([STORE_ACTIVITIES], 'readwrite', (t) => {
    t.objectStore(STORE_ACTIVITIES).put(activity);
  });
}

export async function putManyActivities(entries: { activity: Activity; samples: ActivitySamples | null }[]): Promise<void> {
  await tx([STORE_ACTIVITIES, STORE_SAMPLES], 'readwrite', (t) => {
    const activities = t.objectStore(STORE_ACTIVITIES);
    const samples = t.objectStore(STORE_SAMPLES);
    for (const entry of entries) {
      activities.put(entry.activity);
      if (entry.samples) samples.put(entry.samples);
    }
  });
}

export async function deleteActivity(id: string): Promise<void> {
  await tx([STORE_ACTIVITIES, STORE_SAMPLES], 'readwrite', (t) => {
    t.objectStore(STORE_ACTIVITIES).delete(id);
    t.objectStore(STORE_SAMPLES).delete(id);
  });
}

export async function deleteActivities(ids: string[]): Promise<void> {
  await tx([STORE_ACTIVITIES, STORE_SAMPLES], 'readwrite', (t) => {
    const activities = t.objectStore(STORE_ACTIVITIES);
    const samples = t.objectStore(STORE_SAMPLES);
    for (const id of ids) {
      activities.delete(id);
      samples.delete(id);
    }
  });
}

export async function clearActivities(): Promise<void> {
  await tx([STORE_ACTIVITIES, STORE_SAMPLES], 'readwrite', (t) => {
    t.objectStore(STORE_ACTIVITIES).clear();
    t.objectStore(STORE_SAMPLES).clear();
  });
}

// ── samples ───────────────────────────────────────────────────────
export async function getSamples(id: string): Promise<ActivitySamples | null> {
  const found = await tx([STORE_SAMPLES], 'readonly', (t) =>
    promisify(t.objectStore(STORE_SAMPLES).get(id) as IDBRequest<ActivitySamples | undefined>),
  );
  return found ?? null;
}

export async function getManySamples(ids: string[]): Promise<Map<string, ActivitySamples>> {
  const out = new Map<string, ActivitySamples>();
  if (ids.length === 0) return out;
  await tx([STORE_SAMPLES], 'readonly', async (t) => {
    const store = t.objectStore(STORE_SAMPLES);
    const found = await Promise.all(ids.map((id) => promisify(store.get(id) as IDBRequest<ActivitySamples | undefined>)));
    found.forEach((s) => {
      if (s) out.set(s.id, s);
    });
  });
  return out;
}

// ── key/value: settings, and the checkpoint of a session in progress ──
export async function getKv<T>(key: string): Promise<T | null> {
  const value = await tx([STORE_KV], 'readonly', (t) => promisify(t.objectStore(STORE_KV).get(key) as IDBRequest<T | undefined>));
  return value ?? null;
}

export async function setKv(key: string, value: unknown): Promise<void> {
  await tx([STORE_KV], 'readwrite', (t) => {
    t.objectStore(STORE_KV).put(value, key);
  });
}

export async function deleteKv(key: string): Promise<void> {
  await tx([STORE_KV], 'readwrite', (t) => {
    t.objectStore(STORE_KV).delete(key);
  });
}

// ── how much room is left ─────────────────────────────────────────
export interface StorageUsage {
  usedBytes: number | null;
  quotaBytes: number | null;
}

/** What the log is costing.
 *
 *  There is no `persisted` flag any more. In a browser the log was evictable cache and
 *  the app had to ask not to be cleared; inside the APK this database is app-private
 *  storage, which Android only removes when the app is uninstalled or the person clears
 *  its data deliberately. The question stopped being worth asking. */
export async function storageUsage(): Promise<StorageUsage> {
  let usedBytes: number | null = null;
  let quotaBytes: number | null = null;
  try {
    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate();
      usedBytes = estimate.usage ?? null;
      quotaBytes = estimate.quota ?? null;
    }
  } catch {
    // An estimate the WebView declines to give is not worth an error on a settings screen.
  }
  return { usedBytes, quotaBytes };
}
