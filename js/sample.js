// "No pet yet? Explore with Nova's sample data." Everything here is marked sample: true,
// shows a SAMPLE label in the app, and goes away with "Delete sample".

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
  const skills = S.content.SKILLS.filter((s) => s.species.includes("dog"));
  if (skills[0]) pet.training[skills[0].id] = "got";
  if (skills[1]) pet.training[skills[1].id] = "practising";
  if (skills[2]) pet.training[skills[2].id] = "practising";

  const ev = (type, a, extra = {}) => ({ id: uid(), petId, type, at: a, sample: true, ...extra });
  const nowH = new Date(now).getHours();
  const events = [
    // today (only things that have already happened)
    ...(nowH >= 8 ? [ev("poop", at(0, 7, 10), { score: 3 }), ev("meal", at(0, 7, 30), { name: "Example kibble", amount: "150 g" }), ev("walk", at(0, 7, 45), { minutes: 40 })] : []),
    ...(nowH >= 13 ? [ev("treat", at(0, 12, 15), { name: "Dental chew" }), ev("training", at(0, 12, 30), { skillId: skills[1] && skills[1].id, minutes: 5 })] : []),
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
  // training practice on 6 of the last 7 weeks, so the streak has something to show
  for (const w of [1, 2, 3, 5, 6, 7]) events.push(ev("training", at(w * 7 - 2, 17), { skillId: skills[(w % 3)] && skills[w % 3].id, minutes: 5 }));

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
  await setSetting("currentPet", petId);
  return pet;
}
