// Level up together: the game engine. Pure functions only: no DOM, no storage, no clock unless passed in.
//
// Everything here (XP, partner level, skill levels, stats, stamps, badges, quests, trainer rank) is DERIVED from what
// is already in the diary: training sessions, walks, care tasks, adventure stamps, skill self-checks and Academy
// lessons. Nothing is stored, so there's nothing to farm or get out of sync, and deleting a log takes its XP with it.
//
// Caps (spec v2, part B): max 3 counted sessions per skill per day (and 10 a day in total), max 2 counted walks a day, each stamp once ever,
// each lesson once, one care task of each kind a day (max 5 a day). Never XP for opening the app, likes or shares.

export const LEVEL_REQ = [0, 3, 8, 15, 25, 40]; // sessions needed for skill level 1..5
/** Where each skill level has to work. `where` goes in the self-check; `short` in the level-up line. */
export const LEVEL_PLACE = [
  null,
  { where: "at home, with no distractions", short: "getting the idea" },
  { where: "at home, with everyday life going on", short: "at home" },
  { where: "in the garden or a quiet place", short: "in the garden" },
  { where: "on the street", short: "on the street" },
  { where: "in the park or a busy place", short: "in the park" },
];
/** The practice place for the NEXT level, for quests ("5 min Recall at home"). */
export const QUEST_PLACE = ["at home", "at home", "at home", "in the garden", "on the street", "in the park"];

export const XP = { session: 10, levelUp: 50, walk: 5, stamp: 20, care: 5, lesson: 40, quest: 30, weekBonus: 50 };
/** Logs that mean time together (they count as showing up). Meals, treats, poop and medicines are care admin, not a minute together. */
export const TOGETHER = ["training", "walk", "care"];
export const CAPS = { sessions: 3, sessionsPerDay: 10, walks: 2, carePerDay: 5, stampsPerDay: 2 };
export const MAX_LEVEL = 50;
export const RANKS = [
  { id: "rookie", name: "Rookie", xp: 0 },
  { id: "handler", name: "Handler", xp: 300 },
  { id: "coach", name: "Coach", xp: 2500 },
  { id: "mentor", name: "Mentor", xp: 6000 },
];

/** The 5 partner stats and the skills that feed them (spec C.2). Confidence also gets a small adventure bonus. */
export const STATS = [
  { id: "focus", label: "Focus", skills: ["leave-it", "settle", "trick-spin", "toilet-training", "talk-buttons"] },
  { id: "recall", label: "Recall", skills: ["recall"] },
  { id: "lead", label: "Lead manners", skills: ["loose-lead", "wait-doors"] },
  { id: "calm", label: "Calm", skills: ["settle", "greetings", "handling", "alone-time"] },
  { id: "confidence", label: "Confidence", skills: ["muzzle", "handling", "cat-carrier", "cat-handling"], adventures: true },
];
/** Puppies (under 6 months) start with the basics that matter most at that age, lowest level first. */
const PUPPY_FIRST = ["toilet-training", "handling", "settle", "alone-time"];
function puppyPick(ctx, sess, at, skip) {
  const st = stageOf(ctx.pet, at);
  if (!st || st.id !== "puppy") return null;
  const ids = skillIds(ctx);
  const cands = PUPPY_FIRST.filter((id) => ids.has(id) && !skip.has(id)).map((id, i) => ({ i, p: skillProgress(id, sess, ctx.checks, at, placedOf(ctx, id)) }))
    .filter((c) => c.p.level < 3).sort((a, b) => a.p.level - b.p.level || a.p.sessions - b.p.sessions || a.i - b.i);
  return cands.length ? cands[0].p : null;
}

/** Skills that only become automatic quests once you've practised them (or picked them as this week's skill). */
const OPT_IN = ["muzzle", "talk-buttons"]; // need kit you may not have: only in quests once you start them or pick them
/** When stats tie, the quest goes to the most useful one first (recall keeps dogs safe). */
const QUEST_PRIORITY = ["recall", "lead", "calm", "focus", "confidence"];

export const SHORT = {
  recall: "Recall", "loose-lead": "Loose lead", settle: "Settle", greetings: "Calm greetings", "leave-it": "Leave it",
  "wait-doors": "Wait at doors", handling: "Handling", "trick-spin": "Spin", muzzle: "Muzzle", "toilet-training": "Toilet training",
  "alone-time": "Alone time", "cat-carrier": "Carrier", "cat-handling": "Handling", "talk-buttons": "Talk buttons",
};

export const SKILL_BADGES = [
  { id: "b-recall", skill: "recall", name: "Recall", emoji: "📣" },
  { id: "b-loose-lead", skill: "loose-lead", name: "Loose Lead", emoji: "🦮" },
  { id: "b-settle", skill: "settle", name: "Settle", emoji: "🛏️" },
  { id: "b-greetings", skill: "greetings", name: "Calm Greetings", emoji: "👋" },
  { id: "b-leave-it", skill: "leave-it", name: "Leave It", emoji: "✋" },
  { id: "b-wait-doors", skill: "wait-doors", name: "Doorway", emoji: "🚪" },
  { id: "b-handling", skill: "handling", name: "Handling", emoji: "🖐️" },
  { id: "b-muzzle", skill: "muzzle", name: "Muzzle", emoji: "🛡️" },
];
export const MILESTONE_BADGES = [
  { id: "m-adventurer", name: "Adventurer", emoji: "🧭", need: "Earn 10 stamps", stamps: 10 },
  { id: "m-explorer", name: "Explorer", emoji: "🗺️", need: "Earn 25 stamps", stamps: 25 },
  { id: "m-walker", name: "Walker", emoji: "👣", need: "Log 100 walks", walks: 100 },
  { id: "m-steady", name: "Steady", emoji: "📅", need: "Train in 8 weeks in a row (grace weeks allowed)", weeks: 8 },
];
export const SKILL_BADGE_LEVEL = 3;

// ---------- time ----------
const byAt = (a, b) => a.at - b.at;
export function dayKey(ms) { const d = new Date(ms); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
export function dayStartMs(ms, offset = 0) { const d = new Date(ms); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + offset); return d.getTime(); }
/** [Monday 00:00, next Monday 00:00) around ms, local time. */
export function weekBounds(ms) {
  const d = new Date(ms); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const a = d.getTime(); d.setDate(d.getDate() + 7);
  return [a, d.getTime()];
}

// ---------- capped logs ----------
/** Keep at most `cap` rows per key, earliest first. */
export function capped(rows, keyOf, cap) {
  const seen = new Map(), out = [];
  for (const r of [...rows].sort(byAt)) {
    const k = keyOf(r), n = seen.get(k) || 0;
    if (n < cap) { out.push(r); seen.set(k, n + 1); }
  }
  return out;
}
export const countedSessions = (events) => capped(capped(events.filter((e) => e.type === "training"), (e) => `${dayKey(e.at)}|${e.skillId || "general"}`, CAPS.sessions), (e) => dayKey(e.at), CAPS.sessionsPerDay);
export const countedWalks = (events) => capped(events.filter((e) => e.type === "walk"), (e) => dayKey(e.at), CAPS.walks);
export const countedCare = (events) => capped(capped(events.filter((e) => e.type === "care"), (e) => `${dayKey(e.at)}|${e.task}`, 1), (e) => dayKey(e.at), CAPS.carePerDay);

/** Is this new session within today's caps (per skill and per day)? (for the "only 3 count" message) */
export function sessionCounts(events, ev) {
  return countedSessions(events).some((e) => e.id === ev.id);
}

// ---------- skills ----------
/**
 * One skill's progress from counted sessions and self-checks (both only before `before`).
 * A level needs LEVEL_REQ sessions AND a "yes" self-check at that level, in order.
 */
/** The starting level for a skill from the level check (pet.placement), 0 if none. */
export const placedOf = (ctx, id) => Number((ctx.pet && ctx.pet.placement && ctx.pet.placement[id]) || 0);

export function skillProgress(skillId, sessions, checks, before = Infinity, placed = 0) {
  // `placed`: the starting level from the level check (0–4). It counts as done (its sessions are assumed), gives no XP,
  // and practice from today builds on it.
  const P = Math.max(0, Math.min(4, Math.floor(placed) || 0));
  const s = sessions.filter((e) => e.skillId === skillId && e.at < before).sort(byAt);
  const ch = checks.filter((c) => c.skillId === skillId && c.at < before);
  const n = s.length, nEff = n + LEVEL_REQ[P];
  const days = new Set(s.map((e) => dayKey(e.at))).size; // a level needs practice on at least 2 different days
  let level = P;
  const ups = [];
  for (let L = P + 1; L <= 5; L++) {
    if (nEff < LEVEL_REQ[L] || days < 2) break;
    const c = ch.filter((x) => x.level === L).sort(byAt)[0];
    if (!c) break;
    level = L;
    ups.push({ skillId, level: L, at: Math.max(c.at, s[LEVEL_REQ[L] - LEVEL_REQ[P] - 1].at) });
  }
  const next = level < 5 ? level + 1 : null;
  const need = next ? LEVEL_REQ[next] : LEVEL_REQ[5];
  const from = LEVEL_REQ[level];
  const frac = next ? Math.max(0, Math.min(1, (nEff - from) / (need - from))) : 1;
  return { skillId, sessions: n, placed: P, level, next, need, ready: !!next && nEff >= need && days >= 2, needDay: !!next && nEff >= need && days < 2, frac, ups, toGo: next ? Math.max(0, need - nEff) : 0 };
}
/** Points for stats: the level, plus up to half a level for sessions done towards the next one. */
const points = (pr) => (pr.level >= 5 ? 5 : pr.level + 0.5 * pr.frac);

// ---------- age ----------
export function monthsOld(birthday, now) {
  if (!birthday || !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) return null;
  const [y, m, d] = birthday.split("-").map(Number);
  const n = new Date(now);
  const months = (n.getFullYear() - y) * 12 + (n.getMonth() + 1 - m) - (n.getDate() < d ? 1 : 0);
  return months < 0 ? null : months;
}
/** Dogs: Puppy under 6 months, Teen 6 to 24 months, Adult, Senior from 8 years. Other species: no stage (just an age). */
export function stageOf(pet, now) {
  const mo = monthsOld(pet && pet.birthday, now);
  if (mo === null || !pet || pet.species !== "dog") return null;
  if (mo < 6) return { id: "puppy", label: "Puppy", months: mo };
  if (mo < 24) return { id: "teen", label: "Teen", months: mo };
  if (mo < 96) return { id: "adult", label: "Adult", months: mo };
  return { id: "senior", label: "Senior", months: mo };
}

// ---------- context ----------
// ctx = { pet, skills: [{ id, title, minutes }], events, adventures, checks, stamps, now }
// (events/adventures/checks for this pet only; stamps = the Adventure Book definitions)
function base(ctx) {
  if (!ctx._b) {
    ctx._b = { sessions: countedSessions(ctx.events), walks: countedWalks(ctx.events), care: countedCare(ctx.events) };
  }
  return ctx._b;
}
const skillIds = (ctx) => new Set(ctx.skills.map((s) => s.id));
function toiletRelevant(ctx, sessions) {
  const st = stageOf(ctx.pet, ctx.now);
  return (st && st.id === "puppy") || sessions.some((e) => e.skillId === "toilet-training");
}

/** Stamps earned (manual ones from the Adventure Book store, plus walk milestones), oldest first. */
export function stampsEarned(ctx, before = Infinity) {
  const defs = new Map((ctx.stamps || []).map((s) => [s.id, s]));
  const out = [], seen = new Set();
  for (const a of [...ctx.adventures].sort((x, y) => (x.at || 0) - (y.at || 0))) {
    const d = defs.get(a.stampId);
    if (!d || d.auto || seen.has(a.stampId) || !((a.at || 0) < before)) continue;
    seen.add(a.stampId);
    out.push({ stampId: a.stampId, at: a.at || 0, date: a.date, row: a });
  }
  const walks = base(ctx).walks.filter((e) => e.at < before);
  for (const d of defs.values()) {
    if (d.auto && d.auto.walks && walks.length >= d.auto.walks) out.push({ stampId: d.id, at: walks[d.auto.walks - 1].at, auto: true });
  }
  return out.sort(byAt);
}

/** The 5 stats (0 to 100). `na` when this species has no skills for a stat (cats, rabbits…). */
export function statsOf(ctx, before = Infinity) {
  const ids = skillIds(ctx);
  const { sessions } = base(ctx);
  const sess = sessions.filter((e) => e.at < before);
  const prog = {};
  for (const id of ids) prog[id] = skillProgress(id, sess, ctx.checks, before, placedOf(ctx, id));
  const stamps = stampsEarned(ctx, before).length;
  return STATS.map((st) => {
    let list = st.skills.filter((id) => ids.has(id));
    if (list.includes("toilet-training") && !toiletRelevant(ctx, sess)) list = list.filter((id) => id !== "toilet-training");
    if (!list.length) return { id: st.id, label: st.label, value: 0, skills: [], na: true };
    let v = (list.reduce((a, id) => a + points(prog[id]), 0) / list.length / 5) * 100;
    if (st.adventures) v += Math.min(15, stamps);
    return { id: st.id, label: st.label, value: Math.min(100, Math.round(v)), skills: list };
  });
}

/**
 * The skill to work on, as things stood at `at` (the start of the week): the weakest stat, then its lowest-level
 * skill, skipping skills marked "not for us" (ctx.exclude). A focus chosen for this week (ctx.focus) wins.
 * Daily and weekly quests share it, so one skill gets a whole week and can level up.
 */
export function focusSkill(ctx, at) {
  const stats = statsOf(ctx, at).filter((s) => !s.na);
  if (!stats.length) return null;
  const rank = (s) => QUEST_PRIORITY.indexOf(s.id);
  const sess = base(ctx).sessions;
  const skip = new Set(ctx.exclude || []); // "not for us"
  const auto = new Set(skip); // automatic picks also leave out opt-in skills nobody has practised
  for (const id of OPT_IN) if (!sess.some((e) => e.skillId === id)) auto.add(id);
  const wk = weekBounds(at)[0];
  const chosen = ctx.focus && ctx.focus.week === wk && skillIds(ctx).has(ctx.focus.skillId) && !skip.has(ctx.focus.skillId) ? ctx.focus.skillId : null;
  let p, weakest;
  if (chosen) {
    p = skillProgress(chosen, sess, ctx.checks, at, placedOf(ctx, chosen));
    weakest = stats.find((s) => s.skills.includes(chosen)) || stats[0];
  } else if (puppyPick(ctx, sess, at, auto)) {
    p = puppyPick(ctx, sess, at, auto);
    weakest = stats.find((s) => s.skills.includes(p.skillId)) || stats[0];
  } else {
    const usable = stats.map((s) => ({ ...s, skills: s.skills.filter((id) => !auto.has(id)) })).filter((s) => s.skills.length);
    if (!usable.length) return null;
    weakest = [...usable].sort((a, b) => a.value - b.value || rank(a) - rank(b))[0];
    const cands = weakest.skills.map((id, i) => ({ i, p: skillProgress(id, sess, ctx.checks, at, placedOf(ctx, id)) }))
      .sort((a, b) => a.p.level - b.p.level || a.p.sessions - b.p.sessions || a.i - b.i);
    p = cands[0].p;
  }
  const sk = ctx.skills.find((s) => s.id === p.skillId) || { minutes: 5, title: p.skillId };
  const nextLevel = Math.min(5, p.level + 1);
  const minutes = sk.minutes || 5;
  const name = SHORT[p.skillId] || sk.title;
  return { skillId: p.skillId, name, stat: weakest.id, statLabel: weakest.label, level: p.level, minutes, place: QUEST_PLACE[nextLevel], text: `${minutes} min ${name} ${QUEST_PLACE[nextLevel]}` };
}

/** Today's quest (optional, no streak): done once a counted session on that skill is logged today. */
export function dailyQuest(ctx) {
  const start = dayStartMs(ctx.now), end = dayStartMs(ctx.now, 1);
  const f = focusSkill(ctx, weekBounds(ctx.now)[0]);
  if (!f) return null;
  const done = base(ctx).sessions.some((e) => e.skillId === f.skillId && e.at >= start && e.at < end);
  return { ...f, done };
}

/** The 3 weekly quests for the week around `ms`. */
export function weeklyQuests(ctx, ms = ctx.now) {
  const [a, b] = weekBounds(ms);
  const inWeek = (t) => t >= a && t < b;
  const { sessions, walks, care } = base(ctx);
  const quests = [];
  const f = focusSkill(ctx, a);
  if (f) {
    quests.push({ id: "skill", emoji: "🎓", text: `3 ${f.name} sessions`, skillId: f.skillId, target: 3, progress: sessions.filter((e) => e.skillId === f.skillId && inWeek(e.at)).length });
  } else {
    const days = new Set(ctx.events.filter((e) => inWeek(e.at) && e.type !== "weight").map((e) => dayKey(e.at)));
    quests.push({ id: "days", emoji: "📒", text: "Diary on 5 days", target: 5, progress: days.size });
  }
  const manual = (ctx.stamps || []).filter((s) => !s.auto);
  const before = stampsEarned(ctx, a).filter((s) => !s.auto).length;
  const dog = ctx.pet && ctx.pet.species === "dog";
  const walkWeek = Math.round(a / (7 * 86400000)) % 2 === 1; // dogs alternate: an adventure week, then a walk week
  if (manual.length && before < manual.length && !(dog && walkWeek)) {
    quests.push({ id: "adventure", emoji: "🌟", text: "1 new adventure", target: 1, progress: stampsEarned(ctx, b).filter((s) => !s.auto && inWeek(s.at)).length });
  } else if (dog) {
    quests.push({ id: "walks", emoji: "🚶", text: "3 walks", target: 3, progress: walks.filter((e) => inWeek(e.at)).length });
  } else {
    const days = new Set(ctx.events.filter((e) => inWeek(e.at) && e.type !== "weight").map((e) => dayKey(e.at)));
    quests.push({ id: "days", emoji: "📒", text: "Diary on 4 days", target: 4, progress: days.size });
  }
  quests.push({ id: "care", emoji: "✨", text: "1 care task", target: 1, progress: care.filter((e) => inWeek(e.at)).length });
  for (const q of quests) { q.progress = Math.min(q.target, q.progress); q.done = q.progress >= q.target; }
  const doneCount = quests.filter((q) => q.done).length;
  return { start: a, end: b, quests, doneCount, allDone: doneCount === quests.length };
}

/** Weekly quests for every week from the first log to now (XP for past weeks is derived the same way). */
export function weeklyHistory(ctx) {
  const times = [...ctx.events.map((e) => e.at), ...ctx.adventures.map((x) => x.at || 0).filter(Boolean), ...ctx.checks.map((c) => c.at)];
  const now = ctx.now;
  const first = times.length ? Math.min(...times, now) : now;
  const out = [];
  let [a] = weekBounds(first);
  const [cur] = weekBounds(now);
  for (let i = 0; a <= cur && i < 600; i++) {
    out.push(weeklyQuests(ctx, a + 3600000 * 36)); // mid-Tuesday of that week: safe across clock changes
    const d = new Date(a); d.setDate(d.getDate() + 7); a = d.getTime();
  }
  return out;
}

/** The longest run of weeks with any training, with grace weeks (1 per 4 weeks trained, max 2 saved). */
export function bestStreak(times, now) {
  if (!times.length) return { best: 0, reachedAt: {} };
  const sorted = [...times].sort((x, y) => x - y);
  const weeks = new Map();
  for (const t of sorted) { const k = weekBounds(t)[0]; if (!weeks.has(k)) weeks.set(k, t); }
  let [a] = weekBounds(sorted[0]);
  const [cur] = weekBounds(now);
  let count = 0, graces = 0, since = 0, best = 0;
  const reachedAt = {};
  for (let i = 0; a <= cur && i < 600; i++) {
    if (weeks.has(a)) {
      count++; since++;
      if (since === 4) { graces = Math.min(2, graces + 1); since = 0; }
      if (count > best) { best = count; if (!reachedAt[count]) reachedAt[count] = weeks.get(a); }
    } else if (a !== cur) {
      if (graces > 0) graces--; else { count = 0; since = 0; }
    }
    const d = new Date(a); d.setDate(d.getDate() + 7); a = d.getTime();
  }
  return { best, current: count, reachedAt };
}

/** Partner XP to level (1 to 50). Level L to L+1 costs 40 + 20 × (L − 1) XP. */
export const stepCost = (L) => 40 + 20 * (L - 1);
export function levelFor(xp) {
  let level = 1, base0 = 0;
  while (level < MAX_LEVEL && xp >= base0 + stepCost(level)) { base0 += stepCost(level); level++; }
  return { level, into: xp - base0, need: level < MAX_LEVEL ? stepCost(level) : 0, max: level >= MAX_LEVEL };
}

/** Badges for this partner: every definition, with earned (and when) or progress. */
export function badgesOf(ctx, a) {
  const ids = skillIds(ctx);
  const out = [];
  for (const b of SKILL_BADGES) {
    if (!ids.has(b.skill)) continue;
    const pr = a.progress[b.skill];
    const up = pr && pr.ups.find((u) => u.level >= SKILL_BADGE_LEVEL); // earned by practice (after a level check, at the next level up)
    out.push({ ...b, kind: "skill", earned: !!up, at: up ? up.at : null, need: `${SHORT[b.skill]} level ${SKILL_BADGE_LEVEL}`, progress: pr ? `Level ${pr.level} of ${SKILL_BADGE_LEVEL}` : "" });
  }
  const streak = bestStreak(ctx.events.filter((e) => e.type === "training").map((e) => e.at), ctx.now);
  const dog = ctx.pet && ctx.pet.species === "dog";
  for (const b of MILESTONE_BADGES) {
    if ((b.walks && !dog) || (b.stamps && (ctx.stamps || []).length < b.stamps)) continue; // only badges this pet can earn
    let earned = false, at = null, progress = "";
    if (b.stamps) { earned = a.stamps.length >= b.stamps; at = earned ? a.stamps[b.stamps - 1].at : null; progress = `${Math.min(a.stamps.length, b.stamps)} of ${b.stamps} stamps`; }
    if (b.walks) { earned = a.walks.length >= b.walks; at = earned ? a.walks[b.walks - 1].at : null; progress = `${Math.min(a.walks.length, b.walks)} of ${b.walks} walks`; }
    if (b.weeks) { earned = streak.best >= b.weeks; at = earned ? streak.reachedAt[b.weeks] : null; progress = `Best run: ${Math.min(streak.best, b.weeks)} of ${b.weeks} weeks`; }
    out.push({ ...b, kind: "milestone", earned, at, progress });
  }
  return out;
}

/** Everything about one partner, computed once. */
export function analyze(ctx) {
  const b = base(ctx);
  const progress = {};
  for (const s of ctx.skills) progress[s.id] = skillProgress(s.id, b.sessions, ctx.checks, Infinity, placedOf(ctx, s.id));
  const ups = Object.values(progress).flatMap((p) => p.ups);
  const stamps = stampsEarned(ctx);
  const weeks = weeklyHistory(ctx);
  const bonusWeeks = weeks.filter((w) => w.allDone).length;
  const xpParts = {
    sessions: b.sessions.length * XP.session,
    levelUps: ups.length * XP.levelUp,
    walks: b.walks.length * XP.walk,
    stamps: capped(stamps.filter((s) => s.at), (s) => dayKey(s.at), CAPS.stampsPerDay).length * XP.stamp + stamps.filter((s) => !s.at).length * XP.stamp,
    bonus: bonusWeeks * XP.weekBonus,
  };
  const xp = Object.values(xpParts).reduce((s, v) => s + v, 0);
  const a = {
    progress, ups, stamps, weeks, xp, xpParts, level: levelFor(xp),
    stats: statsOf(ctx), stage: stageOf(ctx.pet, ctx.now), sessions: b.sessions, walks: b.walks, care: b.care,
    daily: dailyQuest(ctx), weekly: weeks[weeks.length - 1] || weeklyQuests(ctx),
  };
  a.badges = badgesOf(ctx, a);
  return a;
}

/** The human's Trainer XP and rank, across a set of partner analyses, plus Academy lessons (once each). */
export function trainerOf(analyses, academyRows, lessonIds) {
  const valid = new Set(lessonIds);
  const lessons = new Set(academyRows.filter((r) => valid.has(r.lessonId)).map((r) => r.lessonId));
  const parts = { sessions: 0, levelUps: 0, care: 0, lessons: lessons.size * XP.lesson, quests: 0 };
  for (const a of analyses) {
    parts.sessions += a.sessions.length * XP.session;
    parts.levelUps += a.ups.length * XP.levelUp;
    parts.care += a.care.length * XP.care;
    parts.quests += a.weeks.reduce((s, w) => s + w.doneCount, 0) * XP.quest;
  }
  const xp = Object.values(parts).reduce((s, v) => s + v, 0);
  return { xp, parts, lessonsDone: lessons, ...rankFor(xp) };
}
export function rankFor(xp) {
  let i = 0;
  while (i + 1 < RANKS.length && xp >= RANKS[i + 1].xp) i++;
  const rank = RANKS[i], next = RANKS[i + 1] || null;
  return { rank, next, into: xp - rank.xp, need: next ? next.xp - rank.xp : 0 };
}

/**
 * "1% a day adds up": cumulative sessions, skill level-ups and stamps at the end of each of the last `n` weeks,
 * across a set of partner analyses. Real data only; weeks before the first log are left out.
 */
export function curve(analyses, now, n = 12) {
  const all = { sessions: [], levels: [], stamps: [] };
  for (const a of analyses) {
    all.sessions.push(...a.sessions.map((e) => e.at));
    all.levels.push(...a.ups.map((u) => u.at));
    all.stamps.push(...a.stamps.map((s) => s.at));
  }
  const first = Math.min(...all.sessions, ...all.levels, ...all.stamps, Infinity);
  if (!Number.isFinite(first)) return [];
  const [cur] = weekBounds(now);
  const out = [];
  for (let k = n - 1; k >= 0; k--) {
    const d = new Date(cur); d.setDate(d.getDate() - 7 * k);
    const start = d.getTime();
    const e = new Date(start); e.setDate(e.getDate() + 7);
    const end = e.getTime();
    if (end <= weekBounds(first)[0]) continue;
    const upTo = (list) => list.filter((t) => t < end).length;
    out.push({ start, sessions: upTo(all.sessions), levels: upTo(all.levels), stamps: upTo(all.stamps) });
  }
  return out;
}

/** A small summary used to spot level-ups, new badges and rank changes after an action. */
export function snapshot(a, trainer) {
  return {
    xp: a ? a.xp : 0, level: a ? a.level.level : 1,
    skills: a ? Object.fromEntries(Object.entries(a.progress).map(([k, v]) => [k, v.level])) : {},
    badges: a ? new Set(a.badges.filter((b) => b.earned).map((b) => b.id)) : new Set(),
    weekAll: a ? a.weekly.allDone : false, weekDone: a ? a.weekly.doneCount : 0,
    trainerXp: trainer ? trainer.xp : 0, rank: trainer ? trainer.rank.id : "rookie",
  };
}
