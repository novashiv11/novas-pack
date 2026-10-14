// v6 "Today" (docs/v6-architect-review.md): the pet's real day as a short checklist you tap as you go (meals, a walk
// or play, a 1-minute training win, medicines due, eggs), a ring that fills, "day done", and "Today so far" underneath.
// Plus the "+" sheet: every log type in one place, each with when it was last logged.
// Nothing new is stored except the list itself (settings.checklist[petId]); progress is read from today's logs.

import { S, setSetting, eventsOf } from "../state.js";
import { h, put, sheet, toast, isoDate, ago } from "../util.js";
import { dueItems, skillsFor } from "../logic.js";
import { logMeal, logTreat, logPoop, logWalk, logPlay, logEggs, logMed, markGiven, eventSheet, unwellSheet } from "../forms.js";
import { eventList } from "./parts.js";
import { celebrate, trainingPicker } from "./gameui.js";
import { doNow, planSheet, planText } from "./doitnow.js";

const startOfDay = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
const todayOf = (p, type) => S.events.filter((e) => e.petId === p.id && e.type === type && e.at >= startOfDay()).sort((a, b) => b.at - a.at);

/** Every item a checklist can hold. `for` limits it to some species; `target` is how many make it done. */
const ITEMS = {
  meals: { e: "🍽️", type: "meal", label: (p) => ({ rabbit: "Hay and greens", chicken: "Feed and water" }[p.species] || "Meals"), target: (p) => (["dog", "cat"].includes(p.species) ? 2 : 1), tap: () => logMeal() },
  walk: { e: "🚶", type: "walk", label: () => "Walk", target: () => 1, tap: () => logWalk(), for: ["dog"] },
  play: { e: "🧶", type: "play", label: () => "Play time", target: () => 1, tap: () => logPlay() },
  train: { e: "🎯", type: "training", label: () => "1-minute training", target: () => 1, tap: (p) => doNow(p), when: (p) => skillsFor(p).length > 0 },
  poop: { e: "💩", type: "poop", label: (p) => (p.species === "rabbit" ? "Droppings check" : "Poop check"), target: () => 1, tap: () => logPoop() },
  eggs: { e: "🥚", type: "eggs", label: () => "Collect eggs", target: () => 1, tap: () => logEggs(), for: ["chicken"] },
};
const DEFAULTS = { dog: ["meals", "walk", "train"], cat: ["meals", "play", "train"], rabbit: ["meals", "poop", "play"], chicken: ["meals", "eggs"] };
const allowed = (p, id) => { const it = ITEMS[id]; return it && (!it.for || it.for.includes(p.species)) && (!it.when || it.when(p)); };
export function checklistOf(p) {
  const mine = (S.settings.checklist || {})[p.id];
  return (Array.isArray(mine) ? mine : DEFAULTS[p.species] || ["meals", "play"]).filter((id) => allowed(p, id) && !(id === "train" && S.settings.careOnly));
}

/** The rows for today: chosen items plus medicines due today. Each { key, e, label, sub, done, tap }. */
export function todayRows(p) {
  const rows = checklistOf(p).map((id) => {
    const it = ITEMS[id], list = todayOf(p, it.type), need = it.target(p), n = Math.min(list.length, need);
    const last = list[0] ? new Date(list[0].at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
    return { key: id, e: it.e, label: it.label(p), done: list.length >= need,
      sub: list.length ? `${need > 1 ? `${n} of ${need} · ` : ""}${last}` : need > 1 ? `0 of ${need}` : "Tap when done", tap: () => it.tap(p) };
  });
  for (const it of dueItems(p.id)) {
    if (it.kind !== "med") continue;
    const st = it.st;
    rows.push({ key: `med-${it.med.id}`, e: "💊", label: it.med.name, done: false,
      sub: st.daily ? `${st.given} of ${st.need} given today` : st.overdue ? "Overdue" : "Due today", tap: () => markGiven(it.med) });
  }
  return rows;
}

function ring(done, total) {
  const R = 22, C = 2 * Math.PI * R, k = total ? done / total : 0;
  const ns = "http://www.w3.org/2000/svg", el = (t, a) => { const x = document.createElementNS(ns, t); for (const [n, v] of Object.entries(a)) x.setAttribute(n, v); return x; };
  const svg = el("svg", { viewBox: "0 0 52 52", "aria-hidden": "true" });
  svg.append(el("circle", { class: "td-track", cx: "26", cy: "26", r: String(R) }), el("circle", { class: "td-fill", cx: "26", cy: "26", r: String(R), "stroke-dasharray": String(C), "stroke-dashoffset": String(C * (1 - k)) }));
  return h(`div.td-ring${done && done === total ? ".full" : ""}`, { role: "img", "aria-label": `${done} of ${total} done today` }, svg, h("b", `${done}/${total}`));
}

/** The Today card for Home. */
export function todayCard(p) {
  const rows = todayRows(p);
  const done = rows.filter((r) => r.done).length, total = rows.length;
  const today = isoDate();
  const key = `${p.id}|${today}`;
  if (total && done === total && !p.sample && S.settings.dayDone !== key) {
    let tries = 0;
    const show = () => {
      if (S.settings.dayDone === key) return;
      if (document.querySelector("dialog[open]") && tries++ < 40) { setTimeout(show, 1500); return; } // after Mission complete
      setSetting("dayDone", key).catch(() => {});
      celebrate([{ emoji: "🎉", title: `Day done for ${p.name}`, text: "Everything on today's list. That's what they need from you.", share: { kind: "session", title: "Day done", sub: "Everything on today's list", emoji: "🎉" } }], p);
    };
    setTimeout(show, 400);
  }
  const head = done === total && total ? `All done. ${p.name} is a lucky ${p.species === "chicken" ? "flock" : "one"}.` : done ? "Nice. Keep going." : "Tap each one as you do it.";
  return h("section.td", { "aria-labelledby": "page-title" },
    h("div.td-head",
      h("div", h("h1.td-h", { id: "page-title", tabindex: "-1" }, "Today"), h("p.td-sub", head)),
      ring(done, total)),
    h("ul.td-list", rows.map((r) => h("li", h(`button.td-row${r.done ? ".done" : ""}`, { type: "button", "data-k": `td-${r.key}`, onclick: r.tap },
      h("span.td-e", { "aria-hidden": "true" }, r.done ? "✓" : r.e),
      h("span.td-t", h("b", r.label), h("span.td-s", r.sub)),
      h("span.td-plus", { "aria-hidden": "true" }, r.done ? "" : "+"),
      h("span.vh", r.done ? ", done" : ", tap to log"))))),
    h("div.td-foot",
      h("button.linkish", { type: "button", "data-k": "td-edit", onclick: () => editList(p) }, "Edit list"),
      S.settings.plan && S.settings.plan.anchor
        ? h("button.linkish", { type: "button", "data-k": "plan-edit", onclick: () => planSheet(p) }, `⏰ ${planText(S.settings.plan)}`)
        : h("button.linkish", { type: "button", "data-k": "plan-make", onclick: () => planSheet(p) }, "⏰ Daily reminder")));
}

/** "Today so far": everything logged today for this pet, newest first; tap to edit. */
export function todaySoFar(p) {
  const list = S.events.filter((e) => e.petId === p.id && e.at >= startOfDay()).sort((a, b) => b.at - a.at);
  return h("section.sec.td-log", { "aria-labelledby": "tsf-h" },
    h("h2.sec-title", { id: "tsf-h" }, "Today so far"),
    list.length ? eventList(list, (e) => (e.type === "symptom" ? unwellSheet(e) : eventSheet(e.type, e)))
      : h("p.empty", "Nothing logged yet today. Tap a row above, or the + button."));
}

function editList(p) {
  const cur = new Set(checklistOf(p));
  sheet("Today's list", (body, close) => {
    const ids = Object.keys(ITEMS).filter((id) => allowed(p, id));
    put(body,
      h("p.sheet-intro", `Pick what ${p.name}'s day needs. Medicines due today are added for you.`),
      h("div.td-pick", ids.map((id) => {
        const it = ITEMS[id], fid = `tdp-${id}`;
        return h("label.check", { for: fid }, h("input", { type: "checkbox", id: fid, checked: cur.has(id), onchange: (e) => { if (e.target.checked) cur.add(id); else cur.delete(id); } }),
          h("span", `${it.e} ${it.label(p)}${it.target(p) > 1 ? ` (×${it.target(p)})` : ""}`));
      })),
      h("div.row-btns", h("button.btn.btn-blue", { type: "button", "data-k": "td-save", onclick: async () => {
        const list = ids.filter((id) => cur.has(id));
        try { await setSetting("checklist", { ...(S.settings.checklist || {}), [p.id]: list }, { quiet: false }); } catch { toast("Couldn't save on this device."); return; }
        close();
      } }, "Save")));
  });
}

// ---------- the "+" sheet ----------
export function logSheet(p) {
  if (!p) return;
  const last = (type) => { const e = eventsOf(type, p.id)[0]; return e ? ago(e.at) : "never"; };
  const tiles = [
    ["meal", "🍽️", "Meal", logMeal], ["treat", "🦴", "Treat", logTreat], ["poop", "💩", p.species === "rabbit" ? "Droppings" : "Poop", logPoop],
    p.species === "dog" ? ["walk", "🚶", "Walk", logWalk] : null, ["play", "🧶", "Play", logPlay],
    skillsFor(p).length ? ["training", "🎯", "Training", () => trainingPicker(p)] : null,
    p.species === "chicken" ? ["eggs", "🥚", "Eggs", logEggs] : null,
    ["med", "💊", "Medicine", logMed], ["weight", "⚖️", "Weight", () => eventSheet("weight")], ["symptom", "😟", "Unwell", () => unwellSheet()],
    ["vet", "🩺", "Vet visit", () => eventSheet("vet")],
  ].filter(Boolean);
  sheet(`Log for ${p.name}`, (body, close) => {
    put(body, h("div.ls-grid", tiles.map(([type, e, label, fn]) => h("button.ls-tile", { type: "button", "data-k": `ls-${type}`, onclick: () => { close(); setTimeout(fn, 60); } },
      h("span.ls-e", { "aria-hidden": "true" }, e), h("b", label), h("span.ls-ago", `Last: ${last(type)}`)))),
      h("p.small.muted", "One tap logs it now. Tap Undo or Add details in the message that pops up."));
  });
}

