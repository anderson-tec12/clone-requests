import type { ClonedRequest } from './types';

const DB_NAME = 'clone-requests';
const STORE = 'requests';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('capturedAt', 'capturedAt');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveRequest(item: ClonedRequest): Promise<void> {
  const db = await openDb();
  try {
    await idbRequest(db.transaction(STORE, 'readwrite').objectStore(STORE).put(item));
  } finally {
    db.close();
  }
}

export async function listRequests(): Promise<ClonedRequest[]> {
  const db = await openDb();
  try {
    const items = await idbRequest(
      db.transaction(STORE, 'readonly').objectStore(STORE).getAll(),
    );
    return (items as ClonedRequest[]).sort((a, b) => b.capturedAt - a.capturedAt);
  } finally {
    db.close();
  }
}

export async function getRequest(id: string): Promise<ClonedRequest | undefined> {
  const db = await openDb();
  try {
    return await idbRequest(
      db.transaction(STORE, 'readonly').objectStore(STORE).get(id),
    );
  } finally {
    db.close();
  }
}

export async function deleteRequest(id: string): Promise<void> {
  const db = await openDb();
  try {
    await idbRequest(db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id));
  } finally {
    db.close();
  }
}

export async function clearRequests(): Promise<void> {
  const db = await openDb();
  try {
    await idbRequest(db.transaction(STORE, 'readwrite').objectStore(STORE).clear());
  } finally {
    db.close();
  }
}

export async function updateRequest(
  id: string,
  patch: Partial<ClonedRequest>,
): Promise<ClonedRequest | undefined> {
  const current = await getRequest(id);
  if (!current) return undefined;
  const next = { ...current, ...patch, id };
  await saveRequest(next);
  return next;
}
