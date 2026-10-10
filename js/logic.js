// What's due, medicine schedules and the poop "Call your vet" rules. No DOM here.

import { S, eventsOf, forPet } from "./state.js";
import { isoDate, addDays, addMonths, daysBetween, startOfDay, DAY } from "./util.js";

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
export function scaleFor(score) { return S.content.POOP_SCALE.find((s) => s.score === score); }
export function flagLabel(id) {
  const f = S.content.POOP_FLAGS.find((x) => x.id === id) || ALSO_NOTICED.find((x) => x.id === id);
  return f ? f.label : id;
}
// Scores 4 and 5 are soft-to-watery on the content scale ("Diarrhoea (loose or watery poop)").
const RUNNY_FROM = 4;
export const isRunny = (p) => typeof p.score === "number" && p.score >= RUNNY_FROM;

function guidance(re) {
  const r = S.content.RED_FLAGS.find((x) => re.test(x.when));
  return r || null;
}

/**
 * Calm "Call your vet" reasons for a pet right now. Never a diagnosis.
 * Returns [{ reason, guide: {when, advice} | null }] (empty if nothing to flag).
 */
export function poopAlerts(p, now = Date.now()) {
  if (!p) return [];
  const poops = eventsOf("poop", p.id);
  const out = [];
  const add = (reason, re) => { if (!out.some((o) => o.reason === reason)) out.push({ reason, guide: re ? guidance(re) : null }); };
  const recent = poops.filter((e) => now - e.at < DAY && e.at <= now + 60000);
  const has = (list, id) => list.some((e) => (e.flags || []).includes(id));
  const unwell = ALSO_NOTICED.filter((a) => has(recent, a.id)).map((a) => a.label.toLowerCase());

  if (has(recent, "black-tarry")) add("Black or tarry poop logged in the last 24 hours.", /black|tarry/i);
  if (has(recent, "blood")) {
    if (unwell.length) add(`Blood in the poop, plus ${unwell.join(" and ")}.`, /blood.*(vomit|tired|not eating)/i);
    else add("Blood in the poop logged in the last 24 hours.", /lot of blood/i);
  }
  if (has(recent, "straining")) add("Straining logged in the last 24 hours.", /strain/i);
  if (has(recent, "worms")) add("Worms or rice-like bits logged.", /worm/i);

  // Runny: the latest poop is soft or watery. How long has it been going on?
  const latest = poops[0];
  if (latest && isRunny(latest) && now - latest.at < DAY) {
    let first = latest;
    for (const e of poops) { if (isRunny(e)) first = e; else break; }
    const young = p.birthday && daysBetween(p.birthday, isoDate(new Date(now))) < 183;
    if (p.species === "rabbit") add("Runny poop logged for your rabbit.", /rabbit.*runny/i);
    if (unwell.length) add(`Loose poop, plus ${unwell.join(" and ")}.`, /diarrh\w* with/i);
    if (now - first.at > DAY) add("Loose or watery poop for more than 24 hours.", /more than 24 hours/i);
    else if (young) add("Loose poop in a young pet (under 6 months).", /puppy|kitten/i);
  } else if (unwell.length) {
    add(`You noted: ${unwell.join(", ")}.`, null);
  }

  // Mucus or an unusual colour that keeps coming back over more than 2 days.
  for (const id of ["mucus", "unusual-colour"]) {
    const hits = poops.filter((e) => (e.flags || []).includes(id) && now - e.at < 4 * DAY);
    if (hits.length >= 2 && now - hits[0].at < DAY && hits[0].at - hits[hits.length - 1].at > 2 * DAY) {
      add(`${flagLabel(id).split(" (")[0]} for more than 2 days.`, /more than 2 days/i);
    }
  }

  // No poop for over 48 hours, but only for people who log regularly (otherwise it's just a gap in the diary).
  if ((p.species === "dog" || p.species === "cat") && latest && now - latest.at > 2 * DAY) {
    const logged = poops.filter((e) => latest.at - e.at < 7 * DAY).length;
    if (logged >= 4) add("No poop logged for more than 48 hours. If they really haven't been:", /48 hours/i);
  }
  return out;
}

/** Poops per day for the last 7 days, oldest first: [{ day, label, count, worst, flagged }]. */
export function poopWeek(petId, now = Date.now()) {
  const poops = eventsOf("poop", petId);
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d0 = startOfDay(now - i * DAY), d1 = d0 + DAY;
    const day = poops.filter((e) => e.at >= d0 && e.at < d1);
    const worst = day.reduce((w, e) => (typeof e.score === "number" && Math.abs(e.score - 3) > Math.abs(w - 3) ? e.score : w), day.length ? 3 : 0);
    out.push({ day: d0, count: day.length, worst, flagged: day.some((e) => (e.flags || []).length) });
  }
  return out;
}

// ---------- weight ----------
export const toUnit = (kg, u) => (u === "lb" ? kg * 2.20462 : kg);
export const fromUnit = (v, u) => (u === "lb" ? v / 2.20462 : v);
export function fmtWeight(kg, u) {
  const v = toUnit(kg, u);
  return `${v >= 100 ? Math.round(v) : Math.round(v * 10) / 10} ${u}`;
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

