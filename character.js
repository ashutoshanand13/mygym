// Your own 3D character, kept only in this browser (IndexedDB). It is never uploaded anywhere.
// Mixamo lets you use its characters in your own projects but not share the files, so this file
// is for your device only — the repo never contains it.
const DB_NAME = "firstrep-assets", STORE = "files", KEY = "character";

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Runs one request in a transaction and resolves with its result.
async function run(mode, makeRequest) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = makeRequest(tx.objectStore(STORE));
    tx.oncomplete = () => { db.close(); resolve(req.result); };
    tx.onerror = tx.onabort = () => { db.close(); reject(tx.error); };
  });
}

export const saveCharacter = (file) =>
  run("readwrite", (s) => s.put({ name: file.name, ext: file.name.split(".").pop().toLowerCase(), blob: file }, KEY));

export const clearCharacter = () => run("readwrite", (s) => s.delete(KEY));

// Returns { url, ext, name } for the saved character, or null when none is saved.
export async function getCharacterUrl() {
  try {
    const rec = await run("readonly", (s) => s.get(KEY));
    if (!rec || !rec.blob) return null;
    return { url: URL.createObjectURL(rec.blob), ext: rec.ext || "glb", name: rec.name };
  } catch {
    return null; // private windows or blocked storage: fall back to the default figure
  }
}
