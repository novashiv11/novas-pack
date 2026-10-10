// "No dog yet? Explore Nova's sample." Nova as a sample partner with some progress: skills at different levels
// (with their self-checks), walks, adventure stamps, care tasks and the diary. Everything here is marked
// sample: true, shows a SAMPLE label in the app, never counts towards your real trainer rank, and goes away with
// "Delete sample".

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
  const nowH = new Date(now).getHours();
  const events = [
    // today (only things that have already happened)
    ...(nowH >= 8 ? [ev("poop", at(0, 7, 10), { score: 3 }), ev("meal", at(0, 7, 30), { name: "Example kibble", amount: "150 g" }), ev("walk", at(0, 7, 45), { minutes: 40 })] : []),
    ...(nowH >= 13 ? [ev("treat", at(0, 12, 15), { name: "Dental chew" })] : []),
    // the last few days
    ev("poop", at(1, 18, 20), { score: 3 }), ev("poop", at(1, 7, 5), { score: 2 }), ev("meal", at(1, 18, 0), { name: "Example kibble", amount: "150 g" }),
    ev("meal", at(1, 7, 30), { name: "Example kibble", amount: "150 g" }), ev("walk", at(1, 18, 30), { minutes: 50 }),
    ev("poop", at(2, 19, 0), { score: 4 }), ev("poop", at(2, 7, 30), { score: 3 }), ev("poop", at(3, 8, 0), { score: 3 }),
    ev("poop", at(4, 8, 15), { score: 3 }), ev("poop", at(5, 7, 50), { score: 3 }), ev("poop", at(6, 18, 40), { score: 3 }),
    // vet visit and weights
    ev("vet", at(40, 10, 30), { clinic: "Example Vet Clinic", note: "Example: annual check. All good. Booster due in October." }),
    ...[[180, 21.5], [140, 25.2], [100, 28.0], [70, 29.6], [40, 30.8], [10, 31.4]].map(([d, kg]) => ev("weight", at(d, 9), { kg })),
    // care routine: brushing and a nail trim
    ev("care", at(5, 19), { task: "brush" }), ev("care", at(20, 19), { task: "nails" }),
  ];
  // Training: sessions on these days ago, and the levels Nova has passed her self-checks for.
  const PLAN = {
    recall: { days: [41, 39, 37, 35, 33, 31, 29, 27, 24, 22, 20, 17, 14, 11, 8, 5, 2], levels: 3 },
    "loose-lead": { days: [40, 36, 32, 28, 25, 21, 16, 12, 7, 3], levels: 2 },
    settle: { days: [38, 34, 30, 26, 23, 19, 15, 10, 4], levels: 2 },
    muzzle: { days: [26, 21, 16, 11, 6], levels: 1 },
    "wait-doors": { days: [18, 13, 9, 6], levels: 1 },
    "leave-it": { days: [9, 5, 1], levels: 0 }, // ready for her level 1 self-check: try it
    greetings: { days: [12, 4], levels: 0 },
  };
  const REQ = [0, 3, 8, 15];
  const checks = [];
  let mood = 0;
  for (const [skillId, plan] of Object.entries(PLAN)) {
    if (!has.has(skillId)) continue;
    const sess = plan.days.map((d, i) => ev("training", at(d, 17, i % 40), { skillId, minutes: 5, mood: [3, 2, 3, 1, 2][mood++ % 5] }));
    events.push(...sess);
    for (let L = 1; L <= plan.levels; L++) {
      checks.push({ id: `${petId}:${skillId}:${L}`, petId, skillId, level: L, at: sess[REQ[L] - 1].at + 10 * 60000, sample: true });
    }
  }
  // Walks: most mornings for 5 weeks, some evenings too (the 10-walk stamp comes from these).
  for (let d = 2; d <= 34; d++) {
    events.push(ev("walk", at(d, 7, 40), { minutes: 35 }));
    if (d % 3 === 0) events.push(ev("walk", at(d, 18, 45), { minutes: 25 }));
  }
  // Care routine: teeth weekly.
  for (const d of [2, 9, 16, 23, 30]) events.push(ev("care", at(d, 20), { task: "teeth" }));
  // Adventure Book: 9 stamps by hand (+ the 10-walk one from walking) = the Adventurer badge.
  const STAMP_DAYS = { beach: 33, car: 30, forest: 25, stairs: 19, "calm-dog": 15, rain: 12, cafe: 9, "muzzle-walk": 6, leaves: 3 };
  const adventures = Object.entries(STAMP_DAYS).filter(([id]) => (S.content.STAMPS || []).some((s) => s.id === id))
    .map(([stampId, d]) => ({ id: `${petId}:${stampId}`, petId, stampId, date: addDays(today, -d), at: at(d, 15), sample: true,
      note: stampId === "beach" ? "Example: barked at a wave. The wave lost." : undefined }));
  adventures.forEach((a) => { if (!a.note) delete a.note; });

  const V = (S.content.VACCINES.dog || []).map((v) => v.name);
  const P = (S.content.PREVENTIVES.dog || []).map((v) => v.name);
  const rec = (kind, name, given, nextDue) => ({ id: uid(), petId, kind, name, given, nextDue, sample: true });
  const records = [
    rec("vaccine", V[0] || "Core vaccine", addDays(today, -372), addDays(today, -7)),
    rec("vaccine", V[1] || "Second vaccine", addDays(today, -330), addDays(today, 35)),
    rec("preventive", P[0] || "Flea treatment", addDays(today, -30), today),
    rec("preventive", P[2] || "Worming", addDays(today, -70), addDays(today, 20)),
  ];
  const meds = [{
    id: uid(), petId, name: "Example ear drops", dose: "Example only: copy the dose from your vet's label",
    freq: "twice", times: ["08:00", "20:00"], start: addDays(today, -3), end: addDays(today, 4), sample: true,
  }];
  const medGiven = [ev("med", at(1, 8), { medId: meds[0].id, name: meds[0].name }), ev("med", at(1, 20), { medId: meds[0].id, name: meds[0].name })];
  if (nowH >= 9) medGiven.push(ev("med", at(0, 8, 5), { medId: meds[0].id, name: meds[0].name }));
  const foods = [
    { id: uid(), petId, kind: "food", brand: "Example Brand", product: "Junior large-breed kibble", amount: "300 g, split in 2 meals", since: addDays(today, -200), until: addDays(today, -60), sample: true },
    { id: uid(), petId, kind: "food", brand: "Example Brand", product: "Adult large-breed kibble", amount: "320 g, split in 2 meals", since: addDays(today, -60), sample: true },
    { id: uid(), petId, kind: "treat", name: "Dental chew", inUse: true, sample: true },
    { id: uid(), petId, kind: "treat", name: "Dried fish skins", inUse: true, sample: true },
    { id: uid(), petId, kind: "treat", name: "Cheese cubes", inUse: false, note: "Example: stopped, upset tummy.", sample: true },
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
