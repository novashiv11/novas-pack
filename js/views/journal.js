// The Growth Journal: private, on the device. One optional line in the evening ("What went 1% better today?"), and
// a weekly view: "This week you…" in your own words, next to what you actually logged.

import { S, pet, remove, save } from "../state.js";
import { h, put, em, isoDate, toast } from "../util.js";
import { subBar } from "./parts.js";
import { gameOf, worldPets } from "./gameui.js";
import { weekBounds } from "../game.js";
import { journalPrompt } from "./home.js";
import { heavy } from "./more.js";

const dayLabel = (d) => d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

function weekSummary(p, a0, a1) {
  const pets = worldPets(p);
  const as = pets.map(gameOf);
  const inW = (t) => t >= a0 && t < a1;
  const n = {
    sessions: as.reduce((s, a) => s + a.sessions.filter((e) => inW(e.at)).length, 0),
    walks: as.reduce((s, a) => s + a.walks.filter((e) => inW(e.at)).length, 0),
    stamps: as.reduce((s, a) => s + a.stamps.filter((x) => inW(x.at)).length, 0),
    care: as.reduce((s, a) => s + a.care.filter((e) => inW(e.at)).length, 0),
    levels: as.reduce((s, a) => s + a.ups.filter((u) => inW(u.at)).length, 0),
    lessons: S.academy.filter((r) => inW(r.doneAt || 0)).length,
    days: S.daily.filter((d) => (d.dogDone || d.youDone) && inW(new Date(`${d.date}T12:00`).getTime())).length,
  };
  const bits = [];
  const plural = (k, one, many) => (n[k] ? `${n[k] === 1 ? one : many.replace("#", n[k])}` : null);
  [plural("sessions", "trained once", "trained # times"), plural("walks", "went for a walk", "went for # walks"),
    plural("levels", "levelled up a skill", "levelled up # skills"), plural("stamps", "earned a stamp", "earned # stamps"),
    plural("care", "did a care task", "did # care tasks"), plural("lessons", "finished a lesson", "finished # lessons"),
    plural("days", "did your 1% on one day", "did your 1% on # days")].forEach((x) => x && bits.push(x));
  if (!bits.length) return null;
  return bits.length === 1 ? bits[0] : `${bits.slice(0, -1).join(", ")} and ${bits[bits.length - 1]}`;
}

function weekDays(a0, a1, untilToday) {
  const out = [];
  for (let d = new Date(a0); d.getTime() < a1; d.setDate(d.getDate() + 1)) {
    if (untilToday && isoDate(d) > isoDate()) break;
    out.push(new Date(d));
  }
  return out;
}

function dayList(days) {
  const shown = days.filter((d) => { const k = isoDate(d); const t = S.daily.find((x) => x.id === k); return S.journal.some((j) => j.id === k) || (t && (t.dogDone || t.youDone)); });
  if (!shown.length) return h("p.small.muted", "Nothing this week yet. One line is plenty.");
  return h("ul.jr-days", shown.map((d) => {
    const key = isoDate(d);
    const e = S.journal.find((j) => j.id === key);
    const t = S.daily.find((x) => x.id === key);
    return h(`li${e ? ".has" : ""}`,
      h("span.jr-day", dayLabel(d)),
      h("span.jr-text", e ? e.text : h("span.muted", "Ticked 1% today.")),
      t && (t.dogDone || t.youDone) ? h("span.jr-ticks", h("span", { "aria-hidden": "true" }, `${t.dogDone ? "🐾" : ""}${t.youDone ? "💛" : ""}`),
        h("span.vh", `1% done: ${[t.dogDone ? "for your pet" : "", t.youDone ? "for you" : ""].filter(Boolean).join(" and ")}`)) : null);
  }));
}

export function journal(main) {
  const p = pet();
  const today = isoDate();
  const entry = S.journal.find((j) => j.id === today);
  const [a0, a1] = weekBounds(Date.now());
  const sum = weekSummary(p, a0, a1);
  const past = [];
  for (let k = 1; k <= 8; k++) {
    const d = new Date(a0); d.setDate(d.getDate() - 7 * k);
    const [b0, b1] = weekBounds(d.getTime() + 36 * 3600000);
    const days = weekDays(b0, b1, false);
    const any = days.some((x) => S.journal.some((j) => j.id === isoDate(x)));
    const s = weekSummary(p, b0, b1);
    if (any || s) past.push({ b0, days, s });
  }
  put(main,
    subBar("Growth Journal", "#/home", "Back to Home"),
    h("p.small.muted.jr-private", em("🔒"), " Private. It stays on this device, like everything else."),
    h("section.sec", { "aria-labelledby": "jt-h" },
      h("h2.sec-title", { id: "jt-h" }, entry ? "Today's line" : "Tonight's line"),
      journalPrompt(today, entry ? entry.text : ""),
      entry ? h("button.linkish", { type: "button", "data-k": "jr-del", onclick: async () => {
        await remove("journal", entry.id);
        toast("Line deleted.", [["Undo", () => save("journal", entry)]]);
      } }, "Delete today's line") : null),
    h("section.week-sum", { "aria-labelledby": "jw-h" },
      h("h2", { id: "jw-h" }, "This week you…"),
      h("p.jr-sum", sum ? `${sum}.` : "…are just getting started. Today counts."),
      dayList(weekDays(a0, a1, true))),
    past.length ? h("section.sec", { "aria-labelledby": "jp-h" },
      h("h2.sec-title", { id: "jp-h" }, "Earlier weeks"),
      past.map((w) => h("details.more-box",
        h("summary", `Week of ${new Date(w.b0).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`),
        w.s ? h("p.small", `You ${w.s}.`) : null,
        dayList(w.days)))) : null,
    h("p.note-line", em("💛"), " Effort, not perfection. A missed day is just a day. Welcome back whenever."),
    h("p.small", h("button.linkish", { type: "button", "data-k": "jr-heavy", onclick: heavy }, "If things feel heavy, talking helps →")));
}
