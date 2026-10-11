// App state: an in-memory copy of the on-device database, plus the few functions that change it.
// Every write goes to IndexedDB first, then updates memory, then redraws the screen.

import * as db from "./db.js";

/** Stores loaded into memory as arrays (settings is a map). */
const LISTS = ["pets", "events", "records", "meds", "foods", "adventures", "skillChecks", "academy", "journal", "daily"];
const PET_LISTS = ["events", "records", "meds", "foods", "adventures", "skillChecks"];

export const S = {
  pets: [], events: [], records: [], meds: [], foods: [],
  adventures: [], skillChecks: [], academy: [], journal: [], daily: [], // v2: Level up together
  rev: 0,                 // bumps on every change, so derived game numbers can be cached between changes
  settings: {},           // { units: "kg"|"lb", currentPet, lastBackup, firstUse, trainerName, ... }
  content: {              // filled from data/skills.js and data/care.js
    SKILLS: [], VACCINES: {}, PREVENTIVES: {}, POOP_SCALE: [], POOP_FLAGS: [], RED_FLAGS: [], VET_FIRST: "", SOURCES: [],
  },
};

let redraw = () => {};
export function onChange(fn) { redraw = fn; }
export function refresh() { redraw(); }

export async function load() {
  const d = await db.loadAll();
  for (const k of LISTS) S[k] = d[k] || [];
  S.rev++;
  S.settings = Object.fromEntries(d.settings.map((r) => [r.key, r.value]));
  S.pets.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}

/** The pet being looked at (the switcher at the top). */
export function pet() {
  return S.pets.find((p) => p.id === S.settings.currentPet) || S.pets[0] || null;
}
export function forPet(store, petId = pet() && pet().id) {
  return S[store].filter((r) => r.petId === petId);
}
export function eventsOf(type, petId = pet() && pet().id) {
  return S.events.filter((e) => e.petId === petId && e.type === type).sort((a, b) => b.at - a.at);
}
/** Weight unit: the user's kg/lb setting, except small pets (rabbits, birds) in grams when on kg. Always stored in kg. */
export function units(p) {
  const base = S.settings.units === "lb" ? "lb" : "kg";
  return base === "kg" && p && ["rabbit", "bird", "chicken"].includes(p.species) ? "g" : base;
}

export async function save(store, row, { quiet } = {}) {
  await db.put(store, row);
  S.rev++;
  const list = S[store];
  const i = list.findIndex((r) => r.id === row.id);
  if (i >= 0) list[i] = row; else list.push(row);
  if (store === "pets") list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  if (!quiet) redraw();
  return row;
}
export async function remove(store, id, { quiet } = {}) {
  await db.del(store, id);
  S.rev++;
  S[store] = S[store].filter((r) => r.id !== id);
  if (!quiet) redraw();
}
export async function setSetting(key, value, { quiet = true } = {}) {
  S.settings[key] = value;
  S.rev++;
  await db.put("settings", { key, value });
  if (!quiet) redraw();
}
export async function removePet(petId) {
  await db.deletePet(petId);
  S.rev++;
  for (const k of PET_LISTS) S[k] = S[k].filter((r) => r.petId !== petId);
  S.pets = S.pets.filter((p) => p.id !== petId);
  if (S.settings.currentPet === petId) await setSetting("currentPet", S.pets[0] ? S.pets[0].id : null);
}
/** Keep a sample pet as your own: the same name and basics, with every example (logs, records, food, training,
 * stamps and the example vet, insurer and microchip) cleared. It then counts like any pet you added yourself. */
export async function adoptSample(petId) {
  const p = S.pets.find((x) => x.id === petId);
  if (!p || !p.sample) return null;
  await db.deletePet(petId);
  S.rev++;
  for (const k of PET_LISTS) S[k] = S[k].filter((r) => r.petId !== petId);
  S.pets = S.pets.filter((x) => x.id !== petId);
  const mine = { id: p.id, name: p.name, species: p.species, photo: p.photo, icon: p.icon, training: {}, createdAt: Date.now() }; // the sample's birthday and sex were made up
  for (const k of Object.keys(mine)) if (mine[k] === undefined) delete mine[k];
  await save("pets", mine, { quiet: true });
  await setSetting("currentPet", mine.id);
  return mine;
}
export async function wipe() {
  await db.deleteAll();
  // The Pack Card maker keeps its choices and streak in localStorage ("np-…" keys): clear those too.
  try { Object.keys(localStorage).filter((k) => k.startsWith("np-")).forEach((k) => localStorage.removeItem(k)); } catch { /* blocked */ }
  for (const k of LISTS) S[k] = [];
  S.rev++;
  S.settings = {};
}

// ---------- v1.1 helpers ----------
/** Diary entries that count as "a log" for onboarding and nudges (not weights or vet visits). */
export const LOG_TYPES = ["poop", "meal", "treat", "med", "walk", "training", "symptom", "care", "eggs"];
export function realPets() { return S.pets.filter((p) => !p.sample); }
/** Logs for one pet, or for every real (non-sample) pet when petId is omitted. */
export function logsOf(petId) {
  const ids = petId ? new Set([petId]) : new Set(realPets().map((p) => p.id));
  return S.events.filter((e) => ids.has(e.petId) && LOG_TYPES.includes(e.type));
}
/** Session-only UI flags (not saved): e.g. which week just closed, an update waiting to apply. */
export const UI = { weekPulse: "", applyUpdate: null };
