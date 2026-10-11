// "Do it now" (spec v3): built for procrastinators. One big button for a 1-minute win, a nudge time they picked
// (morning, lunch, after work, evening) as a daily calendar reminder, "3 days wins the week", a sticker from Nova's
// treat jar for each day they show up, and a fresh start whenever they come back. No streak to lose, no guilt.
// Everything is derived from what's already logged; only the nudge time is stored (settings.plan).

import { S, save, setSetting, refresh } from "../state.js";
import { h, put, sheet, toast, isoDate, uid, shareOrSave } from "../util.js";
import { skillsFor } from "../logic.js";
import { saveError } from "../forms.js";
import * as ics from "../ics.js";
import { STICKERS } from "../../data/stickers.js";
import { gameOf, worldPets, startSession, celebrate } from "./gameui.js";
import * as G from "../game.js";

const DAY = 86400000;
export const ANCHORS = [
  ["morning", "☀️", "Morning", "08:00"],
  ["lunch", "🥪", "Lunch", "13:00"],
  ["work", "🏠", "After work", "18:00"],
  ["evening", "🌙", "Evening", "21:00"],
];
// Plans saved before the nudge picker (CRQ-035) still read sensibly.
const OLD = { breakfast: "After breakfast", walk: "After a walk", home: "When I get home", bed: "Before bed", own: "My own time" };

// ---------- showing up (derived) ----------

/** Dates (YYYY-MM-DD) you showed up: time together with this pet's world (training, a walk, a care task like brushing),
 *  a stamp, or the 1-minute tick. Logging a meal or a poop is care admin, so it doesn't win the day on its own. */
export function showUpDates(p) {
  const ids = new Set(worldPets(p).map((x) => x.id));
  const set = new Set();
  for (const e of S.events) if (ids.has(e.petId) && G.TOGETHER.includes(e.type)) set.add(isoDate(new Date(e.at)));
  for (const a of S.adventures) if (ids.has(a.petId)) set.add(a.date || isoDate(new Date(a.at)));
  if (!p.sample) for (const d of S.daily) if (d.dogDone) set.add(d.date || d.id);
  return [...set].filter(Boolean).sort();
}
/** The sticker for a show-up date: the n-th day you showed up gets sticker n (so the first 30 are all new). */
export function stickerFor(dates, date) {
  const i = dates.indexOf(date);
  return i < 0 ? null : { ...STICKERS[i % STICKERS.length], n: i + 1 };
}
/** For the mission-complete screen: this week's dots and today's sticker (if today is a show-up day). */
export function weekAndSticker(p) {
  const dates = showUpDates(p);
  const week = weekDays(dates);
  return { week, count: week.filter((d) => d.on).length, sticker: stickerFor(dates, isoDate()) };
}
function weekDays(dates, now = Date.now()) {
  const [a] = G.weekBounds(now);
  const days = [];
  for (let i = 0; i < 7; i++) { const d = new Date(a); d.setDate(d.getDate() + i); days.push(isoDate(d)); }
  const set = new Set(dates);
  return days.map((d) => ({ date: d, on: set.has(d), today: d === isoDate() }));
}
function daysAway(dates) {
  const today = isoDate();
  const past = dates.filter((d) => d < today);
  if (!past.length) return 0;
  return Math.round((new Date(`${today}T12:00`) - new Date(`${past[past.length - 1]}T12:00`)) / DAY);
}

// ---------- the Home card ----------

export function doItNowCard(p) {
  const dates = showUpDates(p);
  const today = isoDate();
  const doneToday = dates.includes(today);
  const week = weekDays(dates);
  const count = week.filter((d) => d.on).length;
  const won = count >= 3;
  const now = new Date();
  const away = daysAway(dates);
  const fresh = !doneToday && (away >= 3 || now.getDay() === 1 || now.getDate() === 1);
  const plan = S.settings.plan;
  const st = doneToday ? stickerFor(dates, today) : null;

  // Celebrate winning the week once.
  const wk = week[0].date;
  if (won && !p.sample && S.settings.weekWon !== wk) {
    setTimeout(() => { setSetting("weekWon", wk); celebrate([{ emoji: "🏆", title: "Week won", text: "3 days of showing up. That's the whole trick.", share: { kind: "week", title: "Week won", sub: "3 days of showing up", emoji: "🏆" } }], p); }, 300);
  }

  const head = doneToday
    ? "Done for today. Anything else is a bonus."
    : fresh ? (away >= 3 ? "Welcome back. Fresh start: just 1 minute today." : now.getDate() === 1 ? "New month, fresh start. Just 1 minute." : "New week, fresh start. Just 1 minute.")
      : "One minute. That's all it takes today.";
  return h("section.doit", { "aria-labelledby": "doit-h" },
    h("h2.doit-h", { id: "doit-h" }, head),
    h("button.btn.btn-blue.wide.doit-go", { type: "button", "data-k": "do-now", onclick: () => doNow(p) },
      h("span", { "aria-hidden": "true" }, "▶ "), doneToday ? "Do another minute" : "Do 1 minute now"),
    h("div.doit-week", { role: "img", "aria-label": `This week: ${count} of 3 days to win the week${won ? ". Week won." : "."}` },
      h("span.wk-dots", { "aria-hidden": "true" }, week.map((d) => h(`span.wk-dot${d.on ? ".on" : ""}${d.today ? ".today" : ""}`, d.on ? "✓" : ""))),
      h("span.wk-text", { "aria-hidden": "true" }, won ? "Week won 🏆" : count === 2 ? "1 more day wins the week" : `${count} of 3 days wins the week`)),
    st
      ? h("a.doit-sticker", { href: "#/more/jar", "data-k": "sticker" }, h("span.st-e", { "aria-hidden": "true" }, st.e), h("span", h("b", `Sticker ${st.n}: `), st.t))
      : h("p.small.muted.doit-jar", "🍪 Your first minute today opens Nova's treat jar."),
    plan && plan.anchor
      ? h("button.linkish.doit-plan", { type: "button", "data-k": "plan-edit", onclick: () => planSheet(p) }, "⏰ Nova nudges you: ", h("b", planText(plan)))
      : h("button.btn.btn-line.wide.doit-plan-btn", { type: "button", "data-k": "plan-make", onclick: () => planSheet(p) }, "⏰ When should Nova nudge you?"));
}

export function planText(plan) {
  const a = ANCHORS.find((x) => x[0] === plan.anchor);
  return `${a ? a[2].toLowerCase() : OLD[plan.anchor] ? OLD[plan.anchor].toLowerCase() : "my time"} (${plan.time || "19:00"})`;
}

// ---------- Do 1 minute now ----------

/** The 1-minute win: the skill asked for, else today's quest skill, else the first skill that needs no special kit,
 *  else one minute together. */
const KIT = ["talk-buttons", "muzzle"];
export function doNow(p, skillId) {
  if (!p) return;
  const a = gameOf(p);
  const skills = skillsFor(p);
  const sk = (skillId && skills.find((s) => s.id === skillId)) || (a.daily && skills.find((s) => s.id === a.daily.skillId))
    || skills.find((s) => !KIT.includes(s.id)) || skills[0];
  if (sk) {
    // Say up front when today's XP is already full, rather than after the minute.
    const today = G.dayKey(Date.now());
    const mine = S.events.filter((e) => e.petId === p.id && e.type === "training" && G.dayKey(e.at) === today);
    if (mine.length >= G.CAPS.sessionsPerDay || mine.filter((e) => e.skillId === sk.id).length >= G.CAPS.sessions) toast("XP is full for today. This minute is just for fun, and still counts for you two.");
    startSession(p, sk, { seconds: 60 });
    return;
  }
  sheet(`One minute with ${p.name}`, (body, close) => {
    put(body,
      h("p", `A gentle brush, a scratch where they like it, or just sitting together. One minute.`),
      h("div.row-btns",
        h("button.btn.btn-blue", { type: "button", "data-k": "minute-done", onclick: async () => {
          const today = isoDate();
          const row = S.daily.find((d) => d.id === today) || { id: today, date: today, dogDone: false, youDone: false };
          try { await save("daily", { ...row, dogDone: true }); } catch (e) { toast(saveError(e)); return; }
          close();
          toast("That counts. Nice minute.");
        } }, "Done")));
  });
}

// ---------- the nudge time (was "the plan") ----------

/** One tap: when should Nova nudge you? Then an optional daily calendar reminder. The app never sends notifications. */
export function planSheet(p) {
  const cur = S.settings.plan || {};
  sheet("When should Nova nudge you?", (body, close) => {
    const after = h("div.plan-after", { hidden: true });
    const pick = async (anchor, time) => {
      const plan = { anchor, time };
      try { await setSetting("plan", plan, { quiet: true }); } catch (e) { toast(saveError(e)); return; }
      body.querySelectorAll(".nudge-opt").forEach((b) => b.classList.toggle("on", b.dataset.a === anchor));
      put(after,
        h("p", "✅ ", h("b", planText(plan)), ". Add it to your calendar so your phone reminds you."),
        h("div.row-btns.left",
          h("button.btn.btn-blue", { type: "button", "data-k": "plan-cal", onclick: () => {
            const title = `1 minute with ${p ? p.name : "your pet"} 🐾`;
            ics.download("novas-pack-daily-minute.ics", ics.dailyEvent({ uid: `plan-${uid()}`, title, time, start: isoDate(), note: "Open Nova's Pack and tap Do 1 minute now." }));
            toast("Calendar file made. Open it and tap Add.");
          } }, "Add to calendar"),
          h("button.btn.btn-line", { type: "button", "data-k": "plan-done", onclick: () => { close(); refresh(); } }, "Done")),
        h("button.linkish", { type: "button", "data-k": "plan-friend", onclick: () => tellFriend(p, plan) }, "Tell a friend to check on you"));
      after.hidden = false;
    };
    const custom = h("input", { type: "time", id: "nudge-own", value: cur.anchor === "own" && cur.time ? cur.time : "19:00", "data-k": "plan-time" });
    put(body,
      h("div.nudge-grid", ANCHORS.map(([v, e, label, t]) => h(`button.nudge-opt${cur.anchor === v ? ".on" : ""}`, { type: "button", "data-a": v, "data-k": `plan-${v}`, onclick: () => pick(v, t) },
        h("span.nudge-e", { "aria-hidden": "true" }, e), h("b", label), h("span.small.muted", t)))),
      h("div.nudge-own", h("label", { for: "nudge-own" }, "Or pick a time"), custom,
        h("button.btn.btn-line.sm", { type: "button", "data-k": "plan-own", onclick: () => pick("own", custom.value || "19:00") }, "Set")),
      h("p.small.muted", "We never send notifications. Your calendar does the nudging."),
      after);
  });
}

async function tellFriend(p, plan) {
  const text = `I'm doing 1 minute a day with ${p ? p.name : "my pet"}, ${planText(plan)}. Check on me Friday? 🐾 https://novashiv11.github.io/novas-pack/`;
  try {
    if (navigator.share) { await navigator.share({ text }); return; }
  } catch { return; }
  try { await navigator.clipboard.writeText(text); toast("Copied. Paste it to a friend."); } catch { toast(text); }
}

// ---------- Nova's treat jar (More → Treat jar) ----------

export function treatJar(main, p, head) {
  const dates = p ? showUpDates(p) : [];
  const got = new Map();
  dates.forEach((d, i) => { const s = STICKERS[i % STICKERS.length]; got.set(s.e, (got.get(s.e) || 0) + 1); });
  put(main,
    head,
    h("p.lede", `${dates.length} day${dates.length === 1 ? "" : "s"} of showing up, ${got.size} of ${STICKERS.length} stickers. One for each day you spend a minute together. Never lost, never bought.`),
    h("ul.jar", STICKERS.map((s, i) => {
      const n = got.get(s.e) || 0;
      return h(`li${n ? "" : ".locked"}`, h("span.jar-e", { "aria-hidden": "true" }, n ? s.e : "?"),
        h("span.jar-t", n ? s.t : `Day ${i + 1}`), n > 1 ? h("span.jar-n", `×${n}`) : null);
    })));
}
