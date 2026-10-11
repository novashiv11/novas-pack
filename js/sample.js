// "No dog yet? Explore Nova's sample." Nova as a sample partner with ONE example in each place: one poop, meal,
// treat, walk, weight, vet visit, care task, vaccine, preventive, medicine, food, treat and adventure stamp, and one
// skill (Recall) at level 1, which takes 3 sessions and a self-check. Everything here is marked sample: true, shows a
// SAMPLE label in the app, never counts towards your real trainer rank, and goes away with "Delete sample" or
// "Make it mine" (which keeps the pet and clears every example).

import { S, save, setSetting } from "./state.js";
import { uid, isoDate, addDays, DAY, startOfDay } from "./util.js";

export async function addSample() {
  const now = Date.now(), today = isoDate();
  const at = (daysAgo, hh, mm = 0) => startOfDay(now - daysAgo * DAY) + (hh * 60 + mm) * 60000;
  const petId = uid();
  const pet = {
    id: petId, name: "Nova", species: "dog", sex: "female", birthday: addDays(today, -380), sample: true, createdAt: now,
    allergies: "Example: no grapes, raisins, onions or chocolate.", training: {},
    // Example profile: names only, no phone or microchip numbers that could belong to someone real.
    vet: { name: "Example Vet Clinic" },
    insurer: { name: "Example Insurer", policy: "EXAMPLE-0000", renewal: addDays(today, 120) },
    microchip: { registry: "Example registry", checkedOn: addDays(today, -90) },
  };
  const has = new Set(S.content.SKILLS.filter((s) => s.species.includes("dog")).map((s) => s.id));

  const ev = (type, a, extra = {}) => ({ id: uid(), petId, type, at: a, sample: true, ...extra });
  // One of each, all yesterday or earlier, so today is yours to log.
  const events = [
    ev("poop", at(1, 7, 5), { score: 3 }),
    ev("meal", at(1, 7, 30), { name: "Example kibble", amount: "150 g" }),
    ev("treat", at(1, 12, 15), { name: "Dental chew" }),
    ev("walk", at(1, 18, 30), { minutes: 40 }),
    ev("weight", at(10, 9), { kg: 31.4 }),
    ev("vet", at(40, 10, 30), { clinic: "Example Vet Clinic", note: "Example: annual check. All good." }),
    ev("care", at(5, 19), { task: "brush" }),
  ];
  // One skill at level 1: Recall, 3 sessions and a "yes" self-check.
  const checks = [];
  if (has.has("recall")) {
    const sess = [3, 2, 1].map((d, i) => ev("training", at(d, 17, i), { skillId: "recall", minutes: 5, mood: [2, 3, 3][i] }));
    events.push(...sess);
    checks.push({ id: `${petId}:recall:1`, petId, skillId: "recall", level: 1, at: sess[2].at + 10 * 60000, sample: true });
  }
  // One Adventure Book stamp.
  const adventures = (S.content.STAMPS || []).some((s) => s.id === "beach")
    ? [{ id: `${petId}:beach`, petId, stampId: "beach", date: addDays(today, -6), at: at(6, 15), sample: true, note: "Example: barked at a wave. The wave lost." }]
    : [];

  const V = (S.content.VACCINES.dog || []).map((v) => v.name);
  const P = (S.content.PREVENTIVES.dog || []).map((v) => v.name);
  const rec = (kind, name, given, nextDue) => ({ id: uid(), petId, kind, name, given, nextDue, sample: true });
  const records = [
    rec("vaccine", V[0] || "Core vaccine", addDays(today, -330), addDays(today, 35)),
    rec("preventive", P[0] || "Flea treatment", addDays(today, -30), today),
  ];
  const meds = [{
    id: uid(), petId, name: "Example ear drops", dose: "Example only: copy the dose from your vet's label",
    freq: "twice", times: ["08:00", "20:00"], start: addDays(today, -3), end: addDays(today, 4), sample: true,
  }];
  const medGiven = [ev("med", at(1, 8), { medId: meds[0].id, name: meds[0].name })];
  const foods = [
    { id: uid(), petId, kind: "food", brand: "Example Brand", product: "Adult large-breed kibble", amount: "320 g, split in 2 meals", since: addDays(today, -60), sample: true },
    { id: uid(), petId, kind: "treat", name: "Dental chew", inUse: true, sample: true },
  ];

  await save("pets", pet, { quiet: true });
  for (const e of [...events, ...medGiven]) await save("events", e, { quiet: true });
  for (const r of records) await save("records", r, { quiet: true });
  for (const m of meds) await save("meds", m, { quiet: true });
  for (const f of foods) await save("foods", f, { quiet: true });
  for (const c of checks) await save("skillChecks", c, { quiet: true });
  for (const a of adventures) await save("adventures", a, { quiet: true });
  await setSetting("currentPet", petId);
  return pet;
}
