export type OfflineSubmissionStatus = "PENDING" | "SYNCING" | "FAILED";

export type OfflineSubmission = {
  id: string;
  kind: "study" | "form";
  url: string;
  body: unknown;
  createdAt: string;
  formRevision?: string;
  status: OfflineSubmissionStatus;
  attempts: number;
  lastError?: string;
};

const DB_NAME = "tinat-offline";
const DB_VERSION = 1;
const SUBMISSIONS_STORE = "submissions";
const FORMS_STORE = "forms";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SUBMISSIONS_STORE)) db.createObjectStore(SUBMISSIONS_STORE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(FORMS_STORE)) db.createObjectStore(FORMS_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(storeName: string, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T | void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = action(store);
    tx.oncomplete = () => resolve(request ? (request as IDBRequest<T>).result : undefined);
    tx.onerror = () => reject(tx.error);
  });
}

export async function queueOfflineSubmission(submission: OfflineSubmission) {
  await withStore(SUBMISSIONS_STORE, "readwrite", (store) => store.put(submission));
}

export async function getOfflineSubmissions(): Promise<OfflineSubmission[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SUBMISSIONS_STORE, "readonly");
    const request = tx.objectStore(SUBMISSIONS_STORE).getAll();
    request.onsuccess = () => resolve(request.result as OfflineSubmission[]);
    request.onerror = () => reject(request.error);
  });
}

export async function updateOfflineSubmission(submission: OfflineSubmission) {
  await withStore(SUBMISSIONS_STORE, "readwrite", (store) => store.put(submission));
}

export async function deleteOfflineSubmission(id: string) {
  await withStore(SUBMISSIONS_STORE, "readwrite", (store) => store.delete(id));
}

export async function cacheOfflineForm(id: string, revision: string, data: unknown) {
  await withStore(FORMS_STORE, "readwrite", (store) => store.put({ id, revision, cachedAt: new Date().toISOString(), data }));
}

export async function getCachedOfflineForm(id: string): Promise<{ id: string; revision: string; cachedAt: string; data: unknown } | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FORMS_STORE, "readonly");
    const request = tx.objectStore(FORMS_STORE).get(id);
    request.onsuccess = () => resolve((request.result as { id: string; revision: string; cachedAt: string; data: unknown } | undefined) || null);
    request.onerror = () => reject(request.error);
  });
}
