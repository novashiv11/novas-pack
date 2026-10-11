// Nova's Pack: on-device storage (IndexedDB). Nothing here ever leaves the device.
//
// Stores (all keyed by `id`, except settings which is keyed by `key`):
//   pets      { id, name, species, birthday?, photo?, allergies?, conditions?, sex?, vet?, insurer?, microchip?,
//               neutered?, lastSeason?, training?, sample?, createdAt }
//   events    { id, petId, type, at, ... }  type: poop | meal | treat | med | walk | training | weight | vet | symptom | care
//               symptom: { symptoms: [ids] } (ids in js/logic.js SYMPTOM_IDS); care: { task } (an id from CARE_TASKS)
//   records   { id, petId, kind: vaccine|preventive, name, given, nextDue?, note? }
//   meds      { id, petId, name, dose, freq, times, everyDays?, start, end?, note? }
//   foods     { id, petId, kind: food|treat, brand?, product?, name?, amount?, since?, until?, inUse?, note? }
//   settings  { key, value }   (v2 adds settings.trainerName: what Nova calls you)
// v2 "Level up together" (game XP is derived from the stores above and below, never stored):
//   adventures  { id: "<petId>:<stampId>", petId, stampId, date, at, photo?, note? }   one row per stamp per partner
//   skillChecks { id: "<petId>:<skillId>:<level>", petId, skillId, level 1-5, at }     an honest "yes" self-check
//   academy     { id: lessonId, lessonId, doneAt }                                      a lesson passed (once)
//   journal     { id: date, date, text, at }                                            Growth Journal, one line a day
//   daily       { id: date, date, dogDone, youDone }                                    the "1% today" ticks
//
// SCHEMA is the shape of the data; bump it (and add a migration in `upgrade`) if the shape changes.

export const DB_NAME = "novas-pack";
export const SCHEMA = 2;
export const STORES = ["pets", "events", "records", "meds", "foods", "settings", "adventures", "skillChecks", "academy", "journal", "daily"];
/** Stores whose rows belong to one pet (they have a petId index and go when the pet is deleted). */
const PET_STORES = ["events", "records", "meds", "foods", "adventures", "skillChecks"];
const EVENT_TYPES = ["poop", "meal", "treat", "med", "walk", "training", "weight", "vet", "symptom", "care"];

// ---------- storage health ----------

export const QUOTA_MESSAGE = "Phone storage is full. Try a smaller photo or free some space.";
/** True for "the device is out of space" errors (each browser names it differently). */
export function isQuotaError(err) {
  if (!err) return false;
  return err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED" || err.code === 22 || err.code === 1014 ||
    /quota/i.test(String(err.message || ""));
}
/** A friendly line for a failed save. */
export function saveErrorText(err, fallback = "Couldn't save on this device.") {
  return isQuotaError(err) ? QUOTA_MESSAGE : fallback;
}
let quotaHandler = null;
/** app.js registers a toast here, so every "storage full" failure is explained, whoever made the save. */
export function onQuotaError(fn) { quotaHandler = fn; }
function failed(err) {
  if (isQuotaError(err) && quotaHandler) { try { quotaHandler(err); } catch { /* ignore */ } }
  return err;
}

/**
 * Ask the browser to keep this site's storage when space runs low. Silent in Chrome and Safari.
 * `quiet` skips Firefox, which shows a permission prompt, so it's only asked there after a real action.
 */
export async function persist({ quiet = false } = {}) {
  try {
    const st = typeof navigator !== "undefined" && navigator.storage;
    if (!st || !st.persist) return false;
    if (st.persisted && await st.persisted()) return true;
    if (quiet && /Firefox\//.test(navigator.userAgent || "")) return false;
    return await st.persist();
  } catch { return false; }
}

let dbp = null;

export function open() {
  if (dbp) return dbp;
  const p = new Promise((resolve, reject) => {
    const fail = (err) => { if (dbp === p) dbp = null; reject(failed(err)); };
    let req;
    try {
      if (!("indexedDB" in self) || !self.indexedDB) throw new Error("no-indexeddb");
      req = indexedDB.open(DB_NAME, SCHEMA);
    } catch (err) { Promise.resolve().then(() => fail(err)); return; } // after `dbp = p` below
    req.onupgradeneeded = (e) => upgrade(req.result, e.oldVersion || 0);
    req.onsuccess = () => {
      const db = req.result;
      // Another tab is upgrading, or the browser closed the database: open a fresh connection next time.
      db.onversionchange = () => { db.close(); if (dbp === p) dbp = null; };
      db.onclose = () => { if (dbp === p) dbp = null; };
      resolve(db);
      persist({ quiet: true });
    };
    req.onerror = () => fail(req.error);
    req.onblocked = () => fail(new Error("blocked"));
  });
  dbp = p;
  return p;
}

/**
 * Migrations. Existing stores and rows are never touched, so a v1.1 diary keeps everything:
 *   v1 (from nothing): pets, events, records, meds, foods, settings
 *   v2 (Level up together): adds adventures, skillChecks, academy, journal, daily
 */
function upgrade(db, old) {
  const make = (name) => {
    if (db.objectStoreNames.contains(name)) return;
    const s = db.createObjectStore(name, { keyPath: name === "settings" ? "key" : "id" });
    if (PET_STORES.includes(name)) s.createIndex("petId", "petId");
    if (name === "events") s.createIndex("at", "at");
  };
  if (old < 1) ["pets", "events", "records", "meds", "foods", "settings"].forEach(make);
  if (old < 2) ["adventures", "skillChecks", "academy", "journal", "daily"].forEach(make);
  STORES.forEach(make); // belt and braces: anything still missing
}

/** db.transaction(), but a closed connection (Safari can drop it) resets so the next call reopens. */
function txn(db, stores, mode) {
  try { return db.transaction(stores, mode); } catch (err) { dbp = null; throw failed(err); }
}
function done(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(failed(tx.error));
    tx.onabort = () => reject(failed(tx.error || new Error("aborted")));
  });
}
function reqP(r) {
  return new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(failed(r.error)); });
}

export async function all(store) {
  const db = await open();
  return reqP(txn(db, store).objectStore(store).getAll());
}
export async function put(store, value) {
  const db = await open();
  const tx = txn(db, store, "readwrite");
  tx.objectStore(store).put(value);
  await done(tx);
  return value;
}
export async function del(store, id) {
  const db = await open();
  const tx = txn(db, store, "readwrite");
  tx.objectStore(store).delete(id);
  await done(tx);
}

/** Read everything into plain arrays: { pets, events, …, journal, daily }. */
export async function loadAll() {
  const db = await open();
  const tx = txn(db, STORES);
  const out = {};
  await Promise.all(STORES.map(async (s) => { out[s] = await reqP(tx.objectStore(s).getAll()); }));
  return out;
}

/** Delete one pet and everything that belongs to it, in one transaction. */
export async function deletePet(petId) {
  const db = await open();
  const names = PET_STORES;
  const tx = txn(db, ["pets", ...names], "readwrite");
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
  const tx = txn(db, STORES, "readwrite");
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
/** A small nested object (vet, insurer, …) with only known fields, or undefined if nothing is left. */
function obj(v, fields) {
  if (!v || typeof v !== "object" || Array.isArray(v)) return undefined;
  const o = clean(Object.fromEntries(Object.entries(fields).map(([k, f]) => [k, f(v[k])])));
  return Object.keys(o).length ? o : undefined;
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
      birthday: date(r.birthday), photo: photo(r.photo), allergies: str(r.allergies, 1000), conditions: str(r.conditions, 1000),
      sex: r.sex === "male" || r.sex === "female" ? r.sex : undefined,
      vet: obj(r.vet, { name: (v) => str(v, 120), phone: (v) => str(v, 40), emergencyPhone: (v) => str(v, 40) }),
      insurer: obj(r.insurer, { name: (v) => str(v, 120), policy: (v) => str(v, 80), renewal: date }),
      microchip: obj(r.microchip, { number: (v) => str(v, 40), registry: (v) => str(v, 120), checkedOn: date }),
      neutered: obj(r.neutered, { yes: (v) => (typeof v === "boolean" ? v : undefined), date }),
      lastSeason: date(r.lastSeason), icon: str(r.icon, 16),
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
      symptoms: Array.isArray(r.symptoms) ? r.symptoms.filter((f) => id(f)).slice(0, 20) : undefined, task: id(r.task),
      mood: [1, 2, 3].includes(r.mood) ? r.mood : undefined,
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
  adventures(r) {
    if (!id(r.id) || !id(r.petId) || !id(r.stampId)) return null;
    const d = date(r.date);
    const at = num(r.at) ?? (d ? new Date(`${d}T12:00`).getTime() : undefined);
    if (at === undefined) return null;
    return clean({ id: r.id, petId: r.petId, stampId: r.stampId, date: d, at, photo: photo(r.photo), note: str(r.note, 280), sample: r.sample === true || undefined });
  },
  skillChecks(r) {
    if (!id(r.id) || !id(r.petId) || !id(r.skillId) || ![1, 2, 3, 4, 5].includes(r.level) || num(r.at) === undefined) return null;
    return clean({ id: r.id, petId: r.petId, skillId: r.skillId, level: r.level, at: r.at, sample: r.sample === true || undefined });
  },
  academy(r) {
    if (!id(r.id) || !id(r.lessonId)) return null;
    return clean({ id: r.id, lessonId: r.lessonId, doneAt: num(r.doneAt) });
  },
  journal(r) {
    const d = date(r.date);
    const text = str(r.text, 280);
    if (!d || !text || !text.trim()) return null;
    return clean({ id: d, date: d, text, at: num(r.at) });
  },
  daily(r) {
    const d = date(r.date);
    if (!d) return null;
    return { id: d, date: d, dogDone: r.dogDone === true, youDone: r.youDone === true };
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
  const tx = txn(db, STORES, "readwrite");
  for (const s of STORES) {
    const st = tx.objectStore(s);
    if (mode === "replace") st.clear();
    for (const row of data[s]) st.put(row);
  }
  await done(tx);
}
