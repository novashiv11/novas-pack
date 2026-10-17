// What's due, medicine schedules and the "Call your vet" rules (poop and symptoms). No DOM here.

import { S, eventsOf, forPet } from "./state.js";
import { isoDate, addDays, addMonths, daysBetween, startOfDay, dayStart, DAY } from "./util.js";

const HOUR = 3600000;

// Extra things owners can tick with a poop. The spec's red flags include vomiting and tiredness,
// which aren't poop properties, so they live here rather than in the content file.
export const ALSO_NOTICED = [
  { id: "vomiting", label: "Vomiting" },
  { id: "tired", label: "Tired or low energy" },
  { id: "not-eating", label: "Off their food or water" },
];

// ---------- vaccines and preventives ----------

/** The latest record for each vaccine or preventive name (older ones are history). */
export function currentRecords(petId) {
  const map = new Map();
  for (const r of forPet("records", petId)) {
    const k = `${r.kind}|${r.name.trim().toLowerCase()}`;
    const p = map.get(k);
    if (!p || (r.given || "") > (p.given || "") || ((r.given || "") === (p.given || "") && (r.nextDue || "") > (p.nextDue || ""))) map.set(k, r);
  }
  return [...map.values()].sort((a, b) => (a.nextDue || "9999").localeCompare(b.nextDue || "9999"));
}
export function historyOf(rec) {
  const k = rec.name.trim().toLowerCase();
  return forPet("records", rec.petId).filter((r) => r.kind === rec.kind && r.name.trim().toLowerCase() === k)
    .sort((a, b) => (b.given || "").localeCompare(a.given || ""));
}
/** { state: overdue | today | soon | later | none, days } */
export function recordStatus(r, today = isoDate()) {
  if (!r.nextDue) return { state: "none", days: null };
  const d = daysBetween(today, r.nextDue);
  if (d < 0) return { state: "overdue", days: -d };
  if (d === 0) return { state: "today", days: 0 };
  if (d <= 14) return { state: "soon", days: d };
  return { state: "later", days: d };
}
export function dueText(st) {
  if (st.state === "overdue") return st.days === 1 ? "Overdue by 1 day" : `Overdue by ${st.days} days`;
  if (st.state === "today") return "Due today";
  if (st.state === "soon" || st.state === "later") return st.days === 1 ? "Due tomorrow" : `Due in ${st.days} days`;
  return "No next date";
}

/**
 * Before "Mark done" on a vaccine: was it late, or is it part of a puppy or kitten course?
 * Returns { ask, late, course, note }. When `ask` is true the UI shows `note` (never a schedule of its own).
 */
export const COURSE_NOTE = "Late, or part of a puppy/kitten course? Ask your vet whether to restart the course.";
export function recordDoneCheck(rec, p, today = isoDate()) {
  const none = { ask: false, late: false, course: false, note: "" };
  if (!rec || rec.kind !== "vaccine") return none;
  const late = recordStatus(rec, today).state === "overdue";
  const days = p && p.birthday ? daysBetween(p.birthday, today) : null;
  const course = !!p && (p.species === "dog" || p.species === "cat") &&
    ((days !== null && days >= 0 && days < 183) || /puppy|kitten|primary/i.test(`${rec.name} ${rec.note || ""}`));
  return late || course ? { ask: true, late, course, note: COURSE_NOTE } : none;
}

// ---------- backup timing ----------
export const BACKUP_EVERY_DAYS = 14;
/** Offer "Back up now" after the 3rd real log, then every 14 days after a backup or a "Not now". */
export function backupDue(now = Date.now()) {
  const real = new Set(S.pets.filter((x) => !x.sample).map((x) => x.id));
  if (!real.size || S.events.filter((e) => real.has(e.petId)).length < 3) return false;
  const last = Math.max(S.settings.lastBackup || 0, S.settings.backupSnooze || 0);
  return !last || now - last >= BACKUP_EVERY_DAYS * DAY;
}

// ---------- medicines ----------
export const FREQ = { once: "Once a day", twice: "Twice a day", weekly: "Once a week", monthly: "Once a month", custom: "Every few days" };
export function freqText(m) {
  if (m.freq === "custom") return `Every ${m.everyDays || 1} day${(m.everyDays || 1) === 1 ? "" : "s"}`;
  return FREQ[m.freq] || FREQ.once;
}
export function medIsActive(m, today = isoDate()) {
  return (!m.start || m.start <= today) && (!m.end || m.end >= today);
}
export function dosesOf(m) {
  return S.events.filter((e) => e.type === "med" && e.medId === m.id).sort((a, b) => b.at - a.at);
}
/**
 * Daily medicines: { due, given, need, next }. Others: { due, overdue, dueDate, days }.
 * `due` means it should show on Today.
 */
export function medStatus(m, now = Date.now()) {
  const today = isoDate(new Date(now));
  if (!medIsActive(m, today)) return { active: false, due: false };
  const doses = dosesOf(m);
  if (m.freq === "once" || m.freq === "twice" || !m.freq) {
    const need = m.freq === "twice" ? 2 : 1;
    const given = doses.filter((e) => e.at >= startOfDay(now)).length;
    const times = (m.times || []).slice(0, need).sort();
    return { active: true, daily: true, due: given < need, given, need, next: times[given] || "" };
  }
  const last = doses[0];
  let dueDate;
  if (!last) dueDate = m.start || today;
  else {
    const lastDay = isoDate(new Date(last.at));
    dueDate = m.freq === "weekly" ? addDays(lastDay, 7) : m.freq === "monthly" ? addMonths(lastDay, 1) : addDays(lastDay, Math.max(1, m.everyDays || 1));
  }
  if (m.end && dueDate > m.end) return { active: true, due: false, dueDate: null };
  const days = daysBetween(today, dueDate);
  return { active: true, daily: false, due: days <= 0, overdue: days < 0, dueDate, days };
}

/** Everything that belongs on Today's "Due" list for a pet. */
export function dueItems(petId) {
  const today = isoDate();
  const out = [];
  for (const r of currentRecords(petId)) {
    const st = recordStatus(r, today);
    if (st.state === "overdue" || st.state === "today" || (st.state === "soon" && st.days <= 7)) out.push({ kind: "record", rec: r, st });
  }
  for (const m of forPet("meds", petId)) {
    const st = medStatus(m);
    if (st.due) out.push({ kind: "med", med: m, st });
  }
  const rank = (x) => (x.kind === "record" ? (x.st.state === "overdue" ? 0 : x.st.state === "today" ? 1 : 3) : x.st.overdue ? 0 : 2);
  return out.sort((a, b) => rank(a) - rank(b));
}

// ---------- poop ----------
/** The poop scale for a pet (rabbits have their own words on the same 1 to 5 steps). */
export function poopScale(petId) {
  const p = S.pets.find((x) => x.id === (petId || S.settings.currentPet));
  return p && p.species === "rabbit" && S.content.POOP_SCALE_RABBIT ? S.content.POOP_SCALE_RABBIT : S.content.POOP_SCALE;
}
export function scaleFor(score, petId) { return poopScale(petId).find((s) => s.score === score); }
export function flagLabel(id) {
  const f = S.content.POOP_FLAGS.find((x) => x.id === id) || ALSO_NOTICED.find((x) => x.id === id);
  return f ? f.label : id;
}
// Scores 4 and 5 are soft-to-watery on the content scale ("Diarrhoea (loose or watery poop)").
const RUNNY_FROM = 4;
export const isRunny = (p) => typeof p.score === "number" && p.score >= RUNNY_FROM;

// ---------- "Call your vet" rules ----------

export const SYMPTOM_IDS = ["not-eating", "vomiting", "lethargy", "breathing", "no-droppings", "maggots", "bloat", "toxin", "straining-urine", "diarrhoea",
  "collapse", "heat", "bleeding", "swelling", "eye", "limping", "coughing", "egg-bound", "crop", "comb", "laying"];
export const LEVELS = ["emergency", "today", "watch"];
const RANK = { emergency: 0, today: 1, watch: 2 };
// Used only if data/care.js didn't load: every alert still says what to do.
const FALLBACK = {
  emergency: "Call your vet or an emergency vet now.",
  today: "Call your vet today for advice.",
  watch: "Keep an eye on it, and call your vet if it gets worse, keeps happening or you're worried.",
};
const guide = (id) => (id && S.content.RED_FLAGS.find((x) => x.id === id)) || null;

/** Puppies and kittens under 6 months, dogs and cats aged 8 or over, and pets with a health condition get the sooner thresholds. */
export function vulnerability(p, now = Date.now()) {
  const today = isoDate(new Date(now));
  const days = p && p.birthday ? daysBetween(p.birthday, today) : null;
  const young = days !== null && days >= 0 && days < 183;
  const senior = !!p && (p.species === "dog" || p.species === "cat") && !!p.birthday && addMonths(p.birthday, 96) <= today;
  const c = p && p.conditions;
  const conditions = typeof c === "string" ? c.trim().length > 0 : Array.isArray(c) ? c.length > 0 : false;
  const who = young ? (p.species === "dog" ? "a puppy" : p.species === "cat" ? "a kitten" : "a young pet") + " (under 6 months)"
    : senior ? `an older ${p.species} (8 or over)` : conditions ? "a pet with a health condition" : "";
  return { young, senior, conditions, any: young || senior || conditions, who };
}

// The poop rules: [{ key, level, reason, guide, extra? }]. `events` defaults to the diary in memory.
function poopRules(p, now, events) {
  const poops = events.filter((e) => e.petId === p.id && e.type === "poop" && e.at <= now + 60000).sort((a, b) => b.at - a.at);
  const out = [];
  const add = (key, level, reason, gid, extra) => out.push({ key, level, reason, guide: guide(gid), extra });
  const recent = poops.filter((e) => now - e.at < DAY);
  const has = (list, id) => list.some((e) => (e.flags || []).includes(id));
  const unwell = ALSO_NOTICED.filter((a) => has(recent, a.id)).map((a) => a.label.toLowerCase());
  const vul = vulnerability(p, now);
  const catNotFemale = p.species === "cat" && p.sex !== "female" && !p.lastSeason;

  if (has(recent, "black-tarry")) add("black-tarry", "emergency", "Black or tarry poop logged in the last 24 hours.", "black-tarry");
  if (has(recent, "blood")) {
    if (unwell.length) add("blood-unwell", "emergency", `Blood in the poop, plus ${unwell.join(" and ")}.`, "blood-unwell");
    else if (has(recent, "black-tarry")) add("blood", "emergency", "Blood in the poop logged in the last 24 hours.", null);
    else add("blood", "today", "Blood in the poop logged in the last 24 hours.", null,
      "A small streak once can happen, but call your vet for advice, sooner if there's a lot, it keeps happening, or your pet seems unwell.");
  }
  if (has(recent, "straining")) add("straining", catNotFemale ? "emergency" : "today", "Straining logged in the last 24 hours.", "straining");
  if (has(recent, "worms")) add("worms", "watch", "Worms or rice-like bits logged.", "worms");

  // Runny: the latest poop is soft or watery. How long has it been going on?
  const latest = poops[0];
  if (latest && isRunny(latest) && now - latest.at < DAY) {
    let first = latest;
    for (const e of poops) { if (isRunny(e)) first = e; else break; }
    if (p.species === "rabbit") add("rabbit-runny", "today", "Runny poop logged for your rabbit.", "rabbit-runny");
    if (unwell.length) add("loose-unwell", "today", `Loose poop, plus ${unwell.join(" and ")}.`, "loose-unwell");
    if (now - first.at > DAY) add("loose-24h", "today", "Loose or watery poop for more than 24 hours.", "loose-24h");
    else if (vul.any) add("loose-vulnerable", "today", `Loose poop in ${vul.who}.`, "loose-vulnerable");
  } else if (unwell.length) {
    add("noted", "watch", `You noted: ${unwell.join(", ")}.`, null);
  }

  // Mucus or an unusual colour that keeps coming back over more than 2 days.
  for (const id of ["mucus", "unusual-colour"]) {
    const hits = poops.filter((e) => (e.flags || []).includes(id) && now - e.at < 4 * DAY);
    if (hits.length >= 2 && now - hits[0].at < DAY && hits[0].at - hits[hits.length - 1].at > 2 * DAY) {
      add(`change-${id}`, "watch", `${flagLabel(id).split(" (")[0]} for more than 2 days.`, "change-2-days");
    }
  }

  // No poop for over 48 hours, but only for people who log regularly (otherwise it's just a gap in the diary).
  if ((p.species === "dog" || p.species === "cat") && latest && now - latest.at > 2 * DAY) {
    const logged = poops.filter((e) => latest.at - e.at < 7 * DAY).length;
    // Only when you're clearly still logging (something else logged in the last day, after the last poop): a quiet
    // diary means you stopped logging, not that your pet stopped pooping.
    const stillLogging = events.some((e) => e.petId === p.id && e.type !== "poop" && e.type !== "symptom" && e.at > latest.at + DAY && now - e.at < DAY);
    if (logged >= 4 && stillLogging) add("no-poop-48h", "today", "No poop logged for more than 48 hours. If they really haven't been:", "no-poop-48h");
  }
  return out;
}

/**
 * Calm "Call your vet" reasons from the poop log. Never a diagnosis.
 * Returns [{ reason, guide: {when, advice} | null }] (empty if nothing to flag). Kept for older callers: use healthAlerts.
 */
export function poopAlerts(p, now = Date.now(), events = S.events) {
  if (!p) return [];
  return poopRules(p, now, events).map((r) => ({ reason: r.extra ? `${r.reason} ${r.extra}` : r.reason, guide: r.guide }));
}

// The symptom rules (event { type: "symptom", at, symptoms: [ids] }): [{ key, level, reason, gid, advice? }].
function symptomRules(p, now, events) {
  const mine = events.filter((e) => e.petId === p.id && e.at <= now + 60000);
  const logs = mine.filter((e) => e.type === "symptom" && Array.isArray(e.symptoms));
  const out = [];
  const add = (key, level, reason, gid, advice) => out.push({ key, level, reason, gid, advice });
  const in24 = (id) => logs.filter((e) => now - e.at < DAY && e.symptoms.includes(id));
  const vul = vulnerability(p, now);
  const sp = p.species === "chicken" ? "bird" : p.species; // hens follow the bird rules
  const small = sp === "bird" || sp === "other";

  // "Unresolved": logged within the last 14 days and nothing since that shows it's better (a meal for not eating, a poop for no droppings).
  const since = (id, isFix, alsoFlag) => {
    const fixed = Math.max(0, ...mine.filter((e) => isFix(e) && !(alsoFlag && (e.flags || []).includes(alsoFlag))).map((e) => e.at));
    const hits = logs.filter((e) => e.symptoms.includes(id))
      .concat(alsoFlag ? mine.filter((e) => e.type === "poop" && (e.flags || []).includes(alsoFlag)) : [])
      .filter((e) => e.at > fixed && now - e.at < 14 * DAY);
    return hits.length ? Math.min(...hits.map((e) => e.at)) : null;
  };

  // Emergencies, any species (logged in the last 24 hours).
  if (in24("breathing").length) add("breathing", "emergency", "Breathing trouble logged.", "breathing");
  if (in24("bloat").length) add("bloat", "emergency", "Swollen, hard belly or retching with nothing coming up.", "bloat");
  if (in24("toxin").length) add("toxin", "emergency", "May have eaten something poisonous.", "toxin",
    "Call your vet or an animal poison line now. Do not make your pet sick unless a vet tells you to. Keep the packaging.");
  // Hens: egg binding, crop problems and comb changes need a vet who sees poultry; laying changes are often moult or short days.
  if (in24("egg-bound").length) add("egg-bound", "today", "A hen straining or hunched, maybe egg-bound.", null, "Call a vet who treats poultry today. Keep her somewhere warm and quiet. If she's weak or it's been hours, it's an emergency.");
  if (in24("crop").length) add("crop", "today", "A crop that hasn't emptied overnight.", null, "Call a vet who treats poultry today. Don't try to empty the crop yourself.");
  if (in24("comb").length) add("comb", "today", "A comb that's suddenly pale, shrunken or purple.", null, "Call a vet who treats poultry today, especially if she's also quiet or not eating.");
  if (in24("laying").length) add("laying", "watch", "Laying has stopped or eggs are soft.", null, "Moulting, short winter days, stress and age often slow laying. Check her diet includes layers' feed and grit or oyster shell. Call your vet if she also seems unwell.");
  if (in24("maggots").length) add("maggots", "emergency", "Maggots or fly eggs seen.", "maggots", "Call an emergency vet now. Do not wait or treat at home.");
  if (in24("collapse").length) add("collapse", "emergency", "Collapse, a fit (seizure), or can't stand.", "collapse");
  if (in24("heat").length) add("heat", "emergency", "Signs of overheating.", "heat");
  if (in24("bleeding").length) add("bleeding", "emergency", "Bleeding, a deep wound, or an accident.", "bleeding");
  if (in24("swelling").length) add("swelling", "today", "Sudden swelling, hives or a sting.", "swelling");
  if (in24("eye").length) add("eye", "today", "An eye problem.", "eye");
  if (in24("limping").length) add("limping", "today", "Limping, stiffness or pain.", "limping");
  if (in24("coughing").length) add("coughing", "watch", "Coughing or gagging.", "coughing");
  if (in24("straining-urine").length) {
    if (sp === "cat" && p.sex !== "female" && !p.lastSeason) {
      add("straining-urine", "emergency", p.sex === "male" ? "A male cat straining to pee." : "A cat straining to pee (an emergency in male cats).", "straining-urine-cat");
    } else add("straining-urine", "today", "Straining to pee.", "straining-urine");
  }

  // Not eating, and (rabbits) no droppings.
  const noFood = since("not-eating", (e) => e.type === "meal" || e.type === "treat", "not-eating");
  if (sp === "rabbit") {
    const noPoop = since("no-droppings", (e) => e.type === "poop");
    const start = Math.min(noFood ?? Infinity, noPoop ?? Infinity);
    if (start !== Infinity) {
      const what = noFood !== null && noPoop !== null ? "Not eating and no droppings" : noFood !== null ? "Not eating" : "No droppings";
      if (now - start >= 12 * HOUR) add("rabbit-gut", "emergency", `${what} for 12 hours or more.`, "rabbit-gut");
      else add("rabbit-gut", "today", `${what} logged for your rabbit.`, null,
        "Call your vet today. If it reaches 12 hours, or they're hunched, bloated or grinding their teeth, it's an emergency. When they eat or poop again, log it and this note clears.");
    }
  } else if (noFood !== null) {
    const hrs = now - noFood;
    if (sp === "cat" || sp === "dog") {
      const gid = sp === "cat" ? "not-eating-cat" : "not-eating-dog";
      if (hrs >= DAY) add("not-eating", "today", "Not eating for 24 hours or more.", gid);
      else if (vul.any) add("not-eating", "today", `Not eating, in ${vul.who}.`, gid);
      else if (in24("vomiting").length) add("not-eating", "today", "Not eating, and vomiting too.", gid);
      else add("not-eating", "watch", "Off their food.", null, sp === "cat"
        ? "Call your vet if they still haven't eaten 24 hours after they stopped, and sooner for kittens, older or overweight cats, or if they're also vomiting or hiding. Log a meal when they eat and this note clears."
        : "Call your vet if they still haven't eaten 24 hours after they stopped, and sooner if they're also vomiting, have a swollen belly or seem unwell. Log a meal when they eat and this note clears.");
    } else add("not-eating", "today", "Not eating.", "not-eating-small");
  }
  if (sp !== "rabbit" && in24("no-droppings").length) {
    const st = since("no-droppings", (e) => e.type === "poop");
    if (st !== null) {
      if (small) add("no-droppings", "today", "No droppings logged.", null, "Call a vet who treats your kind of pet today. Small pets and birds can become ill quickly.");
      else if (now - st >= DAY) add("no-poop-48h", "today", "No poop for a day or more after you noted it.", "no-poop-48h");
      else add("no-droppings", "watch", "No poop noted.", null, "Call your vet if it's been more than 48 hours, and sooner for a kitten, or if they're straining, vomiting or off their food. Log a poop when they go and this note clears.");
    }
  }

  // Vomiting: twice in 24 hours, or once for vulnerable pets. Rabbits can't vomit, so anything like it needs a vet.
  const vom = in24("vomiting").length;
  if (vom) {
    if (sp === "rabbit") add("vomiting", "today", "Something like vomiting logged for your rabbit.", null, "Rabbits can't vomit, so call your vet today and describe what you saw.");
    else if (vom >= 2) add("vomiting", "today", "Vomiting twice or more in 24 hours.", "vomiting");
    else if (vul.any) add("vomiting", "today", `Vomiting in ${vul.who}.`, "vomiting");
    else add("vomiting", "watch", "Vomited once in the last 24 hours.", null,
      "One vomit can happen. Call your vet if it happens again, there's blood, they can't keep water down, or they seem unwell. Call straight away if they're retching with nothing coming up.");
  }

  // Diarrhoea (the symptom, as well as runny poop in the poop log).
  if (in24("diarrhoea").length) {
    const st = since("diarrhoea", (e) => e.type === "poop" && typeof e.score === "number" && !isRunny(e));
    const sick = in24("vomiting").length || in24("lethargy").length || noFood !== null;
    if (sp === "rabbit") add("rabbit-runny", "today", "Runny poop logged for your rabbit.", "rabbit-runny");
    if (sick) add("loose-unwell", "today", "Diarrhoea, plus other signs of being unwell.", "loose-unwell");
    if (st !== null && now - st >= DAY) add("loose-24h", "today", "Diarrhoea for more than 24 hours.", "loose-24h");
    else if (vul.any) add("loose-vulnerable", "today", `Diarrhoea in ${vul.who}.`, "loose-vulnerable");
    else if (sp !== "rabbit" && !sick) add("diarrhoea", "watch", "Diarrhoea logged.", null,
      "Call your vet if it lasts more than 24 hours, there's blood, or they're vomiting, off their food or tired.");
  }

  // Tired or low energy.
  if (in24("lethargy").length) {
    const other = in24("vomiting").length || in24("diarrhoea").length || noFood !== null;
    if (sp === "rabbit" || sp === "bird") add("lethargy", "today", sp === "rabbit" ? "Your rabbit seems quiet or tired." : "Your bird seems quiet or fluffed up.", "lethargy");
    else if (other) add("lethargy", "today", "Tired or low energy, plus other signs.", "lethargy");
    else if (vul.any) add("lethargy", "today", `Tired or low energy, in ${vul.who}.`, "lethargy");
    else add("lethargy", "today", "Very tired or low energy.", "lethargy");
  }
  return out;
}

/**
 * Every "Call your vet" alert for a pet right now, from the poop log and logged symptoms, most urgent first.
 * Returns [{ level: "emergency"|"today"|"watch", reason, advice, id }]. Conservative wording, never a diagnosis or a dose.
 * Pure apart from reading content: pass `events` to test it without the app's state.
 */
export function healthAlerts(p, now = Date.now(), events = S.events) {
  if (!p) return [];
  const list = [
    ...symptomRules(p, now, events).map((r) => ({ key: r.key, level: r.level, reason: r.reason, advice: r.advice || (guide(r.gid) || {}).advice })),
    ...poopRules(p, now, events).map((r) => ({ key: r.key, level: r.level, reason: r.reason, advice: r.extra || (r.guide || {}).advice })),
  ];
  // One alert per rule (the most urgent wins), and the vague "You noted" line only when nothing more specific fired.
  const byKey = new Map();
  for (const a of list) {
    const old = byKey.get(a.key);
    if (!old || RANK[a.level] < RANK[old.level]) byKey.set(a.key, a);
  }
  if (byKey.size > 1) byKey.delete("noted");
  const seen = new Set();
  return [...byKey.values()]
    .filter((a) => (seen.has(a.reason) ? false : seen.add(a.reason)))
    .map((a) => ({ level: a.level, reason: a.reason, advice: a.advice || FALLBACK[a.level], id: a.key }))
    .sort((a, b) => RANK[a.level] - RANK[b.level]);
}

/** Poops per day for the last 7 days, oldest first: [{ day, label, count, worst, flagged }]. */
export function poopWeek(petId, now = Date.now()) {
  const poops = eventsOf("poop", petId);
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d0 = dayStart(now, -i), d1 = dayStart(now, -i + 1);
    const day = poops.filter((e) => e.at >= d0 && e.at < d1);
    const worst = day.reduce((w, e) => (typeof e.score === "number" && Math.abs(e.score - 3) > Math.abs(w - 3) ? e.score : w), day.length ? 3 : 0);
    out.push({ day: d0, count: day.length, worst, flagged: day.some((e) => (e.flags || []).length) });
  }
  return out;
}

// ---------- weight ----------
export const toUnit = (kg, u) => (u === "lb" ? kg * 2.20462 : u === "g" ? kg * 1000 : kg);
export const fromUnit = (v, u) => (u === "lb" ? v / 2.20462 : u === "g" ? v / 1000 : v);
export function fmtWeight(kg, u) {
  const v = toUnit(kg, u);
  return `${v >= 100 || u === "g" ? Math.round(v) : Math.round(v * 10) / 10} ${u}`;
}

// ---------- training ----------
export function skillsFor(p) {
  if (!p) return [];
  return S.content.SKILLS.filter((s) => Array.isArray(s.species) && s.species.includes(p.species));
}
export function progressOf(p, skillId) {
  const v = p && p.training ? p.training[skillId] : null;
  return v === "practising" || v === "got" ? v : "none";
}
export const PROGRESS = { none: "Not started", practising: "Practising", got: "Got it" };

