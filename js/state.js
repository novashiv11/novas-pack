// App state: an in-memory copy of the on-device database, plus the few functions that change it.
// Every write goes to IndexedDB first, then updates memory, then redraws the screen.

import * as db from "./db.js";

export const S = {
  pets: [], events: [], records: [], meds: [], foods: [],
  settings: {},           // { units: "kg"|"lb", currentPet, lastBackup, firstUse, ... }
  content: {              // filled from data/skills.js and data/care.js
    SKILLS: [], VACCINES: {}, PREVENTIVES: {}, POOP_SCALE: [], POOP_FLAGS: [], RED_FLAGS: [], VET_FIRST: "", SOURCES: [],
  },
};

let redraw = () => {};
export function onChange(fn) { redraw = fn; }
export function refresh() { redraw(); }

export async function load() {
  const d = await db.loadAll();
  for (const k of ["pets", "events", "records", "meds", "foods"]) S[k] = d[k];
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
export function units() { return S.settings.units === "lb" ? "lb" : "kg"; }

export async function save(store, row, { quiet } = {}) {
  await db.put(store, row);
  const list = S[store];
  const i = list.findIndex((r) => r.id === row.id);
  if (i >= 0) list[i] = row; else list.push(row);
  if (store === "pets") list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  if (!quiet) redraw();
  return row;
}
export async function remove(store, id, { quiet } = {}) {
  await db.del(store, id);
  S[store] = S[store].filter((r) => r.id !== id);
  if (!quiet) redraw();
}
export async function setSetting(key, value, { quiet = true } = {}) {
  S.settings[key] = value;
  await db.put("settings", { key, value });
  if (!quiet) redraw();
}
export async function removePet(petId) {
  await db.deletePet(petId);
  for (const k of ["events", "records", "meds", "foods"]) S[k] = S[k].filter((r) => r.petId !== petId);
  S.pets = S.pets.filter((p) => p.id !== petId);
  if (S.settings.currentPet === petId) await setSetting("currentPet", S.pets[0] ? S.pets[0].id : null);
}
export async function wipe() {
  await db.deleteAll();
  // The Pack Card maker keeps its choices and streak in localStorage ("np-…" keys): clear those too.
  try { Object.keys(localStorage).filter((k) => k.startsWith("np-")).forEach((k) => localStorage.removeItem(k)); } catch { /* blocked */ }
  for (const k of ["pets", "events", "records", "meds", "foods"]) S[k] = [];
  S.settings = {};
}
