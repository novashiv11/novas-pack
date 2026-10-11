// "Do it now" (spec v3): built for procrastinators. One big button for a 1-minute win, a plan they chose
// ("after breakfast, with a coffee") with a daily calendar reminder, "3 days wins the week", a sticker from Nova's
// treat jar for each day they show up, and a fresh start whenever they come back. No streak to lose, no guilt.
// Everything is derived from what's already logged; only the plan is stored (settings.plan).

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
  ["breakfast", "After breakfast", "08:00"],
  ["walk", "After a walk", "18:30"],
  ["home", "When I get home", "18:00"],
  ["bed", "Before bed", "21:30"],
  ["own", "At my own time", "19:00"],
];
const PAIRS = [["", "Nothing"], ["coffee", "a coffee"], ["tea", "a tea"], ["music", "music"], ["podcast", "a podcast"]];

// ---------- showing up (derived) ----------

/** Dates (YYYY-MM-DD) you showed up: any log for this pet's world, a stamp, a 1% tick, or a journal line. */
export function showUpDates(p) {
  const ids = new Set(worldPets(p).map((x) => x.id));
  const set = new Set();
  for (const e of S.events) if (ids.has(e.petId)) set.add(isoDate(new Date(e.at)));
  for (const a of S.adventures) if (ids.has(a.petId)) set.add(a.date || isoDate(new Date(a.at)));
  if (!p.sample) {
    for (const d of S.daily) if (d.dogDone || d.youDone) set.add(d.date || d.id);
    for (const j of S.journal) if (j.text) set.add(j.date || j.id);
  }
  return [...set].filter(Boolean).sort();
}
/** The sticker for a show-up date: the n-th day you showed up gets sticker n (so the first 30 are all new). */
export function stickerFor(dates, date) {
  const i = dates.indexOf(date);
  return i < 0 ? null : { ...STICKERS[i % STICKERS.length], n: i + 1 };
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
    setTimeout(() => { setSetting("weekWon", wk); celebrate([{ emoji: "🏆", title: "Week won", text: "3 days of showing up. That's the whole trick." }]); }, 300);
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
      : h("p.small.muted.doit-jar", "🍪 Your first log today opens Nova's treat jar."),
    plan && plan.anchor
      ? h("p.doit-plan", "Your plan: ", h("b", planText(plan)), " ", h("button.linkish", { type: "button", "data-k": "plan-edit", onclick: () => planSheet(p) }, "Change"))
      : h("button.btn.btn-line.wide.doit-plan-btn", { type: "button", "data-k": "plan-make", onclick: () => planSheet(p) }, "Make a 30-second plan (people who plan, do)"));
}

export function planText(plan) {
  const a = ANCHORS.find((x) => x[0] === plan.anchor);
  const pair = PAIRS.find((x) => x[0] === plan.pair);
  return `${a ? a[1].toLowerCase() : "my own time"} (${plan.time || "19:00"})${pair && pair[0] ? `, with ${pair[1]}` : ""}`;
}

// ---------- Do 1 minute now ----------

/** The 1-minute win: today's quest skill (or the first skill this pet can learn), else one minute together. */
export function doNow(p) {
  if (!p) return;
  const a = gameOf(p);
  const skills = skillsFor(p);
  const sk = (a.daily && skills.find((s) => s.id === a.daily.skillId)) || skills[0];
  if (sk) { startSession(p, sk, { seconds: 60 }); return; }
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

// ---------- the plan ----------

export function planSheet(p) {
  const cur = S.settings.plan || {};
  let anchor = cur.anchor || "breakfast";
  let pair = cur.pair || "";
  sheet("Your 30-second plan", (body, close) => {
    const time = h("input", { type: "time", value: cur.time || ANCHORS.find((x) => x[0] === anchor)[2], "data-k": "plan-time" });
    const anchors = h("div.plan-pick", { role: "radiogroup", "aria-label": "When" }, ANCHORS.map(([v, label, t]) => {
      const id = `pa-${v}`;
      return [h("input", { type: "radio", name: "plan-anchor", id, value: v, checked: v === anchor, onchange: () => { anchor = v; if (!cur.time || cur.anchor !== v) time.value = t; } }),
        h("label", { for: id }, label)];
    }).flat());
    const pairs = h("div.plan-pick.small-pick", { role: "radiogroup", "aria-label": "Pair it with" }, PAIRS.map(([v, label]) => {
      const id = `pp-${v || "none"}`;
      return [h("input", { type: "radio", name: "plan-pair", id, value: v, checked: v === pair, onchange: () => { pair = v; } }), h("label", { for: id }, label === "Nothing" ? "Nothing" : label.replace(/^a /, ""))];
    }).flat());
    const after = h("div.plan-after", { hidden: true });
    const saveBtn = h("button.btn.btn-blue", { type: "button", "data-k": "plan-save", onclick: async () => {
      const plan = { anchor, time: time.value || "19:00", pair };
      await setSetting("plan", plan, { quiet: false });
      saveBtn.hidden = true;
      put(after,
        h("p", h("b", "Saved: "), planText(plan), "."),
        h("p.small", "Want a nudge? Add it to your calendar: your phone reminds you every day. We never send notifications."),
        h("div.row-btns.left",
          h("button.btn.btn-blue", { type: "button", "data-k": "plan-cal", onclick: () => {
            const title = `1 minute with ${p ? p.name : "your pet"} 🐾`;
            ics.download("novas-pack-daily-minute.ics", ics.dailyEvent({ uid: `plan-${uid()}`, title, time: plan.time, start: isoDate(), note: "Open Nova's Pack and tap Do 1 minute now." }));
            toast("Calendar file made. Open it and tap Add.");
          } }, "Add daily reminder"),
          h("button.btn.btn-line", { type: "button", "data-k": "plan-friend", onclick: () => tellFriend(p, plan) }, "Tell a friend")),
        h("button.linkish", { type: "button", onclick: close }, "Done"));
      after.hidden = false;
    } }, "Save my plan");
    put(body,
      h("p.sheet-intro", "Pick a moment you already have every day. Linking it to something you do anyway makes it far more likely to happen."),
      h("fieldset.fs", h("legend", "When?"), anchors),
      h("div.field", h("label", { for: "plan-time-in" }, "Around"), Object.assign(time, { id: "plan-time-in" })),
      h("fieldset.fs", h("legend", "Pair it with something you like (optional)"), pairs),
      h("div.row-btns", saveBtn),
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
    h("p.lede", `${dates.length} day${dates.length === 1 ? "" : "s"} of showing up, ${got.size} of ${STICKERS.length} stickers. One per day you log anything. Never lost, never bought.`),
    h("ul.jar", STICKERS.map((s, i) => {
      const n = got.get(s.e) || 0;
      return h(`li${n ? "" : ".locked"}`, h("span.jar-e", { "aria-hidden": "true" }, n ? s.e : "?"),
        h("span.jar-t", n ? s.t : `Day ${i + 1}`), n > 1 ? h("span.jar-n", `×${n}`) : null);
    })));
}
