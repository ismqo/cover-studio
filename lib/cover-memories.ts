import type { CoverSettings } from "./render-cover";

/** How many saved cover versions the editor keeps. */
export const MAX_MEMORIES = 3;

/** One saved cover version: its settings, its photos (if any), and a small preview image. */
export type CoverMemory = {
  id: string;
  savedAt: number;
  settings: CoverSettings;
  photo: Blob | null;
  photoName: string;
  /** Similar Artist Radio's second and third artists; absent in versions saved before that style existed. */
  artistPhotos?: { photo: Blob | null; name: string }[];
  thumbnail: Blob;
};

/** Sort newest first and split into the versions to keep and the older ones to delete. */
export function keepLatestMemories<T extends { savedAt: number }>(memories: readonly T[], max = MAX_MEMORIES): { kept: T[]; dropped: T[] } {
  const sorted = [...memories].sort((a, b) => b.savedAt - a.savedAt);
  return { kept: sorted.slice(0, max), dropped: sorted.slice(max) };
}

// IndexedDB stores the photo and preview as Blobs, which cookies (about 4 KB) and localStorage (text only) can't hold.
const DB_NAME = "cover-studio";
const STORE = "memories";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => { request.result.createObjectStore(STORE, { keyPath: "id" }); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function finish(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = transaction.onabort = () => reject(transaction.error);
  });
}

/** Read every saved version, newest first. */
export async function loadMemories(): Promise<CoverMemory[]> {
  const db = await openDatabase();
  try {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    const memories = await new Promise<CoverMemory[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as CoverMemory[]);
      request.onerror = () => reject(request.error);
    });
    return keepLatestMemories(memories).kept;
  } finally { db.close(); }
}

/** Save a version, delete anything beyond the newest three, and return the versions that remain, newest first. */
export async function saveMemory(memory: CoverMemory): Promise<CoverMemory[]> {
  const existing = await loadMemories();
  const { kept, dropped } = keepLatestMemories([memory, ...existing]);
  const db = await openDatabase();
  try {
    const transaction = db.transaction(STORE, "readwrite");
    const store = transaction.objectStore(STORE);
    store.put(memory);
    for (const old of dropped) store.delete(old.id);
    await finish(transaction);
    return kept;
  } finally { db.close(); }
}

/** Delete every saved version. */
export async function clearMemories(): Promise<void> {
  const db = await openDatabase();
  try {
    const transaction = db.transaction(STORE, "readwrite");
    transaction.objectStore(STORE).clear();
    await finish(transaction);
  } finally { db.close(); }
}
