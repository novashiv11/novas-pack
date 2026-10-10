// Nova's Pack: on-device storage (IndexedDB). Nothing here ever leaves the device.
//
// Stores (all keyed by `id`, except settings which is keyed by `key`):
//   pets      { id, name, species, birthday?, photo?, allergies?, training?, sample?, createdAt }
//   events    { id, petId, type, at, ... }  type: poop | meal | treat | med | walk | training | weight | vet
//   records   { id, petId, kind: vaccine|preventive, name, given, nextDue?, note? }
//   meds      { id, petId, name, dose, freq, times, everyDays?, start, end?, note? }
//   foods     { id, petId, kind: food|treat, brand?, product?, name?, amount?, since?, until?, inUse?, note? }
//   settings  { key, value }
//
// SCHEMA is the shape of the data; bump it (and add a migration in `upgrade`) if the shape changes.

export const DB_NAME = "novas-pack";
export const SCHEMA = 1;
export const STORES = ["pets", "events", "records", "meds", "foods", "settings"];
const EVENT_TYPES = ["poop", "meal", "treat", "med", "walk", "training", "weight", "vet"];

let dbp = null;

export function open() {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    if (!("indexedDB" in self)) { reject(new Error("no-indexeddb")); return; }
    const req = indexedDB.open(DB_NAME, SCHEMA);
    req.onupgradeneeded = () => upgrade(req.result, req.transaction);
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error("blocked"));
  });
  return dbp;
}

function upgrade(db) {
  // Version 1: create everything. Later versions add steps below `if (old < N)`.
  for (const name of STORES) {
    if (db.objectStoreNames.contains(name)) continue;
    const s = db.createObjectStore(name, { keyPath: name === "settings" ? "key" : "id" });
    if (name !== "settings" && name !== "pets") s.createIndex("petId", "petId");
    if (name === "events") s.createIndex("at", "at");
  }
}

function done(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("aborted"));
  });
}
function reqP(r) {
  return new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
}

export async function all(store) {
  const db = await open();
  return reqP(db.transaction(store).objectStore(store).getAll());
}
export async function put(store, value) {
  const db = await open();
  const tx = db.transaction(store, "readwrite");
  tx.objectStore(store).put(value);
  await done(tx);
  return value;
}
export async function del(store, id) {
  const db = await open();
  const tx = db.transaction(store, "readwrite");
  tx.objectStore(store).delete(id);
  await done(tx);
}

/** Read everything into plain arrays: { pets, events, records, meds, foods, settings }. */
export async function loadAll() {
  const db = await open();
  const tx = db.transaction(STORES);
  const out = {};
  await Promise.all(STORES.map(async (s) => { out[s] = await reqP(tx.objectStore(s).getAll()); }));
  return out;
}

/** Delete one pet and everything that belongs to it, in one transaction. */
export async function deletePet(petId) {
  const db = await open();
  const names = ["events", "records", "meds", "foods"];
  const tx = db.transaction(["pets", ...names], "readwrite");
  tx.objectStore("pets").delete(petId);
  for (const n of names) {
    const idx = tx.objectStore(n).index("petId");
    idx.openCursor(IDBKeyRange.only(petId)).onsuccess = (e) => {
      const c = e.target.result;
      if (c) { c.delete(); c.continue(); }
    };
  }
  await done(tx);
}

export async function deleteAll() {
  const db = await open();
  const tx = db.transaction(STORES, "readwrite");
  STORES.forEach((s) => tx.objectStore(s).clear());
  await done(tx);
}

// ---------- backup ----------

export async function exportData() {
  const data = await loadAll();
  return { app: "novas-pack", schema: SCHEMA, exportedAt: new Date().toISOString(), data };
}

const str = (v, max = 2000) => (typeof v === "string" ? v.slice(0, max) : undefined);
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const date = (v) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);
const id = (v) => (typeof v === "string" && v.length > 0 && v.length <= 80 ? v : undefined);
const photo = (v) => (typeof v === "string" && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v) && v.length < 3e6 ? v : undefined);
function clean(o) {
  for (const k of Object.keys(o)) if (o[k] === undefined) delete o[k];
  return o;
}

// One cleaner per store. Each returns a safe copy, or null if the row is unusable.
const CLEAN = {
  pets(r) {
    if (!id(r.id) || !str(r.name, 40)) return null;
    const training = {};
    if (r.training && typeof r.training === "object") {
      for (const [k, v] of Object.entries(r.training)) if (id(k) && (v === "practising" || v === "got")) training[k] = v;
    }
    return clean({
      id: r.id, name: str(r.name, 40),
      species: ["dog", "cat", "rabbit", "bird", "other"].includes(r.species) ? r.species : "other",
      birthday: date(r.birthday), photo: photo(r.photo), allergies: str(r.allergies, 1000),
      training, sample: r.sample === true || undefined, createdAt: num(r.createdAt),
    });
  },
  events(r) {
    if (!id(r.id) || !id(r.petId) || !EVENT_TYPES.includes(r.type) || num(r.at) === undefined) return null;
    return clean({
      id: r.id, petId: r.petId, type: r.type, at: r.at,
      score: num(r.score), flags: Array.isArray(r.flags) ? r.flags.filter((f) => id(f)).slice(0, 20) : undefined,
      note: str(r.note, 1000), name: str(r.name, 120), amount: str(r.amount, 120), medId: id(r.medId),
      skillId: id(r.skillId), minutes: num(r.minutes), kg: num(r.kg), clinic: str(r.clinic, 120),
      sample: r.sample === true || undefined,
    });
  },
  records(r) {
    if (!id(r.id) || !id(r.petId) || !str(r.name, 120)) return null;
    return clean({
      id: r.id, petId: r.petId, kind: r.kind === "preventive" ? "preventive" : "vaccine", name: str(r.name, 120),
      given: date(r.given), nextDue: date(r.nextDue), note: str(r.note, 1000), sample: r.sample === true || undefined,
    });
  },
  meds(r) {
    if (!id(r.id) || !id(r.petId) || !str(r.name, 120)) return null;
    return clean({
      id: r.id, petId: r.petId, name: str(r.name, 120), dose: str(r.dose, 300),
      freq: ["once", "twice", "weekly", "monthly", "custom"].includes(r.freq) ? r.freq : "once",
      times: Array.isArray(r.times) ? r.times.filter((t) => typeof t === "string" && /^\d{2}:\d{2}$/.test(t)).slice(0, 2) : undefined,
      everyDays: num(r.everyDays), start: date(r.start), end: date(r.end), note: str(r.note, 1000),
      sample: r.sample === true || undefined,
    });
  },
  foods(r) {
    if (!id(r.id) || !id(r.petId)) return null;
    return clean({
      id: r.id, petId: r.petId, kind: r.kind === "treat" ? "treat" : "food",
      brand: str(r.brand, 120), product: str(r.product, 120), name: str(r.name, 120), amount: str(r.amount, 120),
      since: date(r.since), until: date(r.until), inUse: typeof r.inUse === "boolean" ? r.inUse : undefined,
      note: str(r.note, 1000), sample: r.sample === true || undefined,
    });
  },
  settings(r) {
    if (!id(r.key)) return null;
    const v = r.value;
    if (!(typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v === null)) return null;
    return { key: r.key, value: typeof v === "string" ? v.slice(0, 200) : v };
  },
};

/** Check a parsed backup file. Returns { ok, error?, data?, counts?, skipped? }. */
export function validateBackup(obj) {
  if (!obj || typeof obj !== "object" || obj.app !== "novas-pack") return { ok: false, error: "This isn't a Nova's Pack backup file." };
  if (typeof obj.schema !== "number" || obj.schema > SCHEMA) return { ok: false, error: "This backup is from a newer version of the app. Reload the app and try again." };
  if (!obj.data || typeof obj.data !== "object") return { ok: false, error: "The backup file is empty or damaged." };
  const data = {}, counts = {};
  let skipped = 0;
  for (const s of STORES) {
    const rows = Array.isArray(obj.data[s]) ? obj.data[s] : [];
    data[s] = [];
    for (const r of rows) {
      const c = r && typeof r === "object" ? CLEAN[s](r) : null;
      if (c) data[s].push(c); else skipped++;
    }
    counts[s] = data[s].length;
  }
  if (!data.pets.length) return { ok: false, error: "There are no pets in this backup." };
  return { ok: true, data, counts, skipped };
}

/** Write a validated backup. mode "replace" clears everything first; "merge" keeps existing rows (same id = backup wins). */
export async function importData(data, mode) {
  const db = await open();
  const tx = db.transaction(STORES, "readwrite");
  for (const s of STORES) {
    const st = tx.objectStore(s);
    if (mode === "replace") st.clear();
    for (const row of data[s]) st.put(row);
  }
  await done(tx);
}
