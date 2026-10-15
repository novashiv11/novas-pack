// The Growth Journal (v7): private, on the device. Nova asks one question ("What went well today?"), you answer in a big
// composer, and your lines sit in a chat-bubble timeline next to what you actually logged. Real data only.

import { S, pet, remove, save } from "../state.js";
import { h, put, em, isoDate, toast } from "../util.js";
import { subBar, NOVA } from "./parts.js";
import { saveError } from "../forms.js";
import { gameOf, worldPets } from "./gameui.js";
import { weekBounds } from "../game.js";
import { heavy } from "./more.js";

const dayLabel = (d) => d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
const novaFace = (size = 36) => h("img.disc.nova-face", { src: NOVA, alt: "", width: String(size), height: String(size) });
const MAX = 280;

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
    plural("days", "did it for them on one day", "did it for them on # days")].forEach((x) => x && bits.push(x));
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

const dayDone = (key) => { const t = S.daily.find((x) => x.id === key); return !!(t && (t.dogDone || t.youDone)); };
const hasLine = (key) => S.journal.some((j) => j.id === key);

/** The week as seven dots: a day is "on" when you wrote a line or ticked a daily card. */
function weekDots(days) {
  const today = isoDate();
  return h("ol.jr-dots", days.map((d) => {
    const key = isoDate(d);
    const on = hasLine(key) || dayDone(key);
    return h(`li${on ? ".on" : ""}${key === today ? ".today" : ""}`,
      h("span.jr-dot", { "aria-hidden": "true" }, on ? "✓" : ""),
      h("span.jr-dl", { "aria-hidden": "true" }, d.toLocaleDateString(undefined, { weekday: "narrow" })),
      h("span.vh", `${d.toLocaleDateString(undefined, { weekday: "long" })}: ${on ? "something done" : key > today ? "still to come" : "nothing yet"}`));
  }));
}

/** Your lines as chat bubbles, newest first, with a date chip above each day. */
function timeline(days, { past = false } = {}) {
  const today = isoDate();
  const yest = isoDate(new Date(Date.now() - 86400000));
  const shown = days.filter((d) => { const k = isoDate(d); return hasLine(k) || dayDone(k); }).reverse();
  if (!shown.length) {
    if (past) return null;
    return h("div.jr-empty", novaFace(40), h("p", "Nothing this week yet. One line is plenty."));
  }
  return h("ol.jr-feed", shown.map((d) => {
    const key = isoDate(d);
    const e = S.journal.find((j) => j.id === key);
    const t = S.daily.find((x) => x.id === key);
    const dog = !!(t && t.dogDone), you = !!(t && t.youDone);
    return h(`li.jr-day${e ? ".has" : ""}`,
      h("span.jr-date", key === today ? "Today" : key === yest ? "Yesterday" : dayLabel(d)),
      h(`div.jb.jb-me${e ? "" : ".ghost"}`, e ? h("p", e.text) : h("p", dog && you ? "Did it for both of you." : dog ? "Did it for them." : "Did it for you.")),
      dog || you ? h("span.jr-ticks", h("span", { "aria-hidden": "true" }, `${dog ? "🐾 for them" : ""}${dog && you ? " · " : ""}${you ? "💛 for you" : ""}`),
        h("span.vh", `Done today: ${[dog ? "for your pet" : "", you ? "for you" : ""].filter(Boolean).join(" and ")}`)) : null);
  }));
}

/** Nova's question and your big answer box. One obvious button. */
function composer(today, entry) {
  const id = `jr-${today}`;
  const ta = h("textarea", { id, name: "journal", rows: "4", maxlength: String(MAX), autocomplete: "off", "data-k": "jr-text", placeholder: "e.g. she waited at the door. I stayed calm.", value: entry ? entry.text : "" });
  const count = h("span.jr-count", { "aria-hidden": "true" }, `${ta.value.length}/${MAX}`);
  const err = h("p.form-error", { role: "alert" });
  ta.addEventListener("input", () => { count.textContent = `${ta.value.length}/${MAX}`; err.textContent = ""; });
  return h("form.jr-composer", { novalidate: true, onsubmit: async (e) => {
    e.preventDefault();
    const text = ta.value.trim();
    if (!text) { err.textContent = "Write a few words first. Small is fine."; ta.focus(); return; }
    try { await save("journal", { id: today, date: today, text: text.slice(0, MAX), at: Date.now() }); } catch (ex) { err.textContent = saveError(ex); return; }
    try { navigator.vibrate && navigator.vibrate(15); } catch { /* not everywhere */ }
    toast("Saved in your journal. Private, on this device.");
  } },
  h("div.jr-ask", novaFace(44),
    h("div.jb.jb-nova",
      h("label", { for: id }, "What went well today?"),
      h("span.small", "Small counts. Do it for them, and for you."))),
  h("div.jr-box", ta, h("div.jr-box-foot", h("span.small.muted", em("🔒"), " Private, on this device"), count)),
  err,
  h("button.btn.btn-blue.wide", { type: "submit", "data-k": "jr-save" }, entry ? "Update today's line" : "Save my line"),
  entry ? h("button.linkish.jr-del", { type: "button", "data-k": "jr-del", onclick: async () => {
    await remove("journal", entry.id);
    toast("Line deleted.", [["Undo", () => save("journal", entry)]]);
  } }, "Delete today's line") : null);
}

export function journal(main) {
  const p = pet();
  const today = isoDate();
  const entry = S.journal.find((j) => j.id === today);
  const [a0, a1] = weekBounds(Date.now());
  const sum = weekSummary(p, a0, a1);
  const all = weekDays(a0, a1, false);
  const on = all.filter((d) => hasLine(isoDate(d)) || dayDone(isoDate(d))).length;
  const past = [];
  for (let k = 1; k <= 8; k++) {
    const d = new Date(a0); d.setDate(d.getDate() - 7 * k);
    const [b0, b1] = weekBounds(d.getTime() + 36 * 3600000);
    const days = weekDays(b0, b1, false);
    const any = days.some((x) => hasLine(isoDate(x)));
    const s = weekSummary(p, b0, b1);
    if (any || s) past.push({ b0, days, s, lines: days.filter((x) => hasLine(isoDate(x))).length });
  }
  put(main,
    subBar("Growth Journal", "#/home", "Back to Home"),
    composer(today, entry),
    h("section.jr-week", { "aria-labelledby": "jw-h" },
      h("div.sec-row", h("h2.sec-title", { id: "jw-h" }, "This week"), h("span.pill", `${on} of 7 days`)),
      weekDots(all),
      h("div.jr-nova", novaFace(36), h("div.jb.jb-nova", h("p", h("b", "This week you… "), sum ? `${sum}.` : "…are just getting started. Today counts."))),
      timeline(weekDays(a0, a1, true))),
    past.length ? h("section.sec", { "aria-labelledby": "jp-h" },
      h("h2.sec-title", { id: "jp-h" }, "Earlier weeks"),
      past.map((w) => h("details.jr-fold",
        h("summary", h("span", `Week of ${new Date(w.b0).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`),
          h("span.small.muted", w.lines ? `${w.lines} line${w.lines === 1 ? "" : "s"}` : "")),
        w.s ? h("div.jr-nova", novaFace(32), h("div.jb.jb-nova", h("p", `You ${w.s}.`))) : null,
        timeline(w.days, { past: true })))) : null,
    h("p.note-line", em("💛"), " Effort, not perfection. A missed day is just a day. Welcome back whenever."),
    h("p.small", h("button.linkish", { type: "button", "data-k": "jr-heavy", onclick: heavy }, "If things feel heavy, talking helps →")));
}
