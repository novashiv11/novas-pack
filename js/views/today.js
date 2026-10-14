// v6 "Today" (docs/v6-architect-review.md), v7 look (docs/v7-duolingo-screens.md, brief A): the pet's real day as a
// short list of chunky lesson-node tiles you tap as you go (meals, a walk or play, a 1-minute training win, medicines
// due, eggs). Each tile has its own progress ring and ticks with a pop (+XP only where XP is real). Nova's bubble
// reacts to how far you are, and finishing the list opens one full-screen "Day complete!" card.
// Plus the "+" sheet: every log type in one place, the ones this pet logs most first.
// Nothing new is stored except the list itself (settings.checklist[petId]); progress is read from today's logs.

import { S, setSetting, eventsOf } from "../state.js";
import { h, put, sheet, toast, isoDate, ago, buzz, motionOK, parseDate } from "../util.js";
import { dueItems, skillsFor } from "../logic.js";
import { logMeal, logTreat, logPoop, logWalk, logPlay, logEggs, logMed, markGiven, eventSheet, unwellSheet } from "../forms.js";
import { eventList, NOVA } from "./parts.js";
import { trainingPicker, confetti, shareWinBtn, xpProgress } from "./gameui.js";
import { doNow, planSheet, planText, weekAndSticker } from "./doitnow.js";
import * as G from "../game.js";

const startOfDay = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
const todayOf = (p, type) => S.events.filter((e) => e.petId === p.id && e.type === type && e.at >= startOfDay()).sort((a, b) => b.at - a.at);

/** Every item a checklist can hold. `for` limits it to some species; `target` is how many make it done. */
const ITEMS = {
  meals: { e: "🍽️", type: "meal", label: (p) => ({ rabbit: "Hay and greens", chicken: "Feed and water" }[p.species] || "Meals"), target: (p) => countOf(p, "meals", ["dog", "cat"].includes(p.species) ? 2 : 1), tap: () => logMeal(), counts: true },
  walk: { e: "🚶", type: "walk", label: (p) => (countOf(p, "walk", 1) > 1 ? "Walks" : "Walk"), target: (p) => countOf(p, "walk", 1), tap: () => logWalk(), for: ["dog"], counts: true },
  play: { e: "🧶", type: "play", label: () => "Play time", target: () => 1, tap: () => logPlay() },
  train: { e: "🎯", type: "training", label: () => "1-minute training", target: () => 1, tap: (p) => doNow(p), when: (p) => skillsFor(p).length > 0 },
  poop: { e: "💩", type: "poop", label: (p) => (p.species === "rabbit" ? "Droppings check" : "Poop check"), target: () => 1, tap: () => logPoop() },
  eggs: { e: "🥚", type: "eggs", label: () => "Collect eggs", target: () => 1, tap: () => logEggs(), for: ["chicken"] },
};
const countOf = (p, id, def) => { const n = (p.__counts && p.__counts[id]) || ((S.settings.checklistN || {})[p.id] || {})[id]; return Number.isInteger(n) && n >= 1 && n <= 4 ? n : def; };
const DEFAULTS = { dog: ["meals", "walk", "train"], cat: ["meals", "play", "train"], rabbit: ["meals", "poop", "play"], chicken: ["meals", "eggs"] };
const allowed = (p, id) => { const it = ITEMS[id]; return it && (!it.for || it.for.includes(p.species)) && (!it.when || it.when(p)); };
export function checklistOf(p) {
  const mine = (S.settings.checklist || {})[p.id];
  return (Array.isArray(mine) ? mine : DEFAULTS[p.species] || ["meals", "play"]).filter((id) => allowed(p, id) && !(id === "train" && S.settings.careOnly));
}

/** What a day looks like for a pet that isn't saved yet (the add-pet flow's "Here's Nova's day"). Each { e, label, sub }. */
export function dayPreview(p) {
  return checklistOf(p).map((id) => {
    const it = ITEMS[id], need = it.target(p);
    return { e: it.e, label: it.label(p), sub: need > 1 ? `${need} times a day` : id === "train" ? "One minute, one tiny win" : "Once a day" };
  });
}

/** The rows for today: chosen items plus medicines due today. Each { key, e, label, sub, done, n, need, tap }. */
export function todayRows(p) {
  const rows = checklistOf(p).map((id) => {
    const it = ITEMS[id], list = todayOf(p, it.type), need = it.target(p), n = Math.min(list.length, need);
    const last = list[0] ? new Date(list[0].at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
    return { key: id, e: it.e, label: it.label(p), done: list.length >= need, n, need,
      sub: list.length ? `${need > 1 ? `${n} of ${need} · ` : ""}${last}` : need > 1 ? `0 of ${need}` : "Tap when done", tap: () => it.tap(p) };
  });
  const dueIds = new Set();
  for (const it of dueItems(p.id)) {
    if (it.kind !== "med") continue;
    const st = it.st;
    dueIds.add(it.med.id);
    rows.push({ key: `med-${it.med.id}`, e: "💊", label: it.med.name, done: false, n: st.daily ? st.given : 0, need: st.daily ? st.need : 1,
      sub: st.daily ? `${st.given} of ${st.need} given today` : st.overdue ? "Overdue" : "Due today", tap: () => markGiven(it.med) });
  }
  // Medicines given today stay on the list, ticked (so the ring doesn't shrink).
  const given = new Map();
  for (const e of todayOf(p, "med")) if (e.medId && !dueIds.has(e.medId) && !given.has(e.medId)) given.set(e.medId, e);
  for (const [id, e] of given) {
    const m = S.meds.find((x) => x.id === id);
    rows.push({ key: `med-${id}`, e: "💊", label: (m && m.name) || e.name || "Medicine", done: true, n: 1, need: 1,
      sub: `Given ${new Date(e.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`, tap: () => toast(`${(m && m.name) || "That medicine"} is done for today.`) });
  }
  return rows;
}

const SVGNS = "http://www.w3.org/2000/svg";
const svgEl = (t, a) => { const x = document.createElementNS(SVGNS, t); for (const [n, v] of Object.entries(a)) x.setAttribute(n, v); return x; };

/** The big ring in the Today header. */
function ring(done, total) {
  const R = 22, C = 2 * Math.PI * R, k = total ? done / total : 0;
  const svg = svgEl("svg", { viewBox: "0 0 52 52", "aria-hidden": "true" });
  svg.append(svgEl("circle", { class: "td-track", cx: "26", cy: "26", r: String(R) }), svgEl("circle", { class: "td-fill", cx: "26", cy: "26", r: String(R), "stroke-dasharray": String(C), "stroke-dashoffset": String(C * (1 - k)) }));
  return h(`div.td-ring${done && done === total ? ".full" : ""}`, { role: "img", "aria-label": `${done} of ${total} done today` }, svg, h("b", `${done}/${total}`));
}

/** The ring round a row's round node. It slides from where it was last time to where it is now. */
function nodeRing(k, from) {
  const R = 29, C = 2 * Math.PI * R;
  const fill = svgEl("circle", { class: "tn-fill", cx: "32", cy: "32", r: String(R), "stroke-dasharray": String(C), "stroke-dashoffset": String(C * (1 - (from == null ? k : from))) });
  const svg = svgEl("svg", { viewBox: "0 0 64 64", "aria-hidden": "true" });
  svg.append(svgEl("circle", { class: "tn-track", cx: "32", cy: "32", r: String(R) }), fill);
  if (from != null && from !== k) requestAnimationFrame(() => requestAnimationFrame(() => fill.setAttribute("stroke-dashoffset", String(C * (1 - k)))));
  return svg;
}

/** Nova with a speech bubble: one short line that reacts to the moment. mood: think, happy, proud or sleepy. */
export function novaSay(text, mood = "happy", extra = null) {
  return h(`div.nova-say.mood-${mood}`,
    h("span.ns-face", h("img.disc", { src: NOVA, alt: "", width: "52", height: "52" }), mood === "sleepy" ? h("span.ns-z", { "aria-hidden": "true" }, "z z") : null),
    h("div.ns-bubble", h("p", h("span.vh", "Nova says: "), text), extra));
}

// One tap logs once: a short lock stops double taps, and a done row asks before logging another.
const lockUntil = new Map(); // per row, so a quick tap on another row still works
function tapRow(e, r) {
  if (Date.now() < (lockUntil.get(r.key) || 0)) return;
  lockUntil.set(r.key, Date.now() + 1200);
  buzz(12);
  if (r.done && !r.key.startsWith("med-")) { toast(`${r.label}: done for today.`, [["Log another", () => r.tap()]]); return; }
  r.tap();
}

// What each row looked like the last time it was drawn, so a row that has just been completed can pop (and slide its ring).
const seen = new Map();

/** The pop that rises from a row you just completed: "+10 XP" only where the game really gave XP, else a tick. */
function popText(p, r) {
  if (S.settings.careOnly) return "✓";
  const mine = S.events.filter((e) => e.petId === p.id);
  if (r.key === "train") {
    const last = todayOf(p, "training")[0];
    return last && G.countedSessions(mine).some((e) => e.id === last.id) ? `+${G.XP.session} XP` : "✓";
  }
  if (r.key === "walk") {
    const last = todayOf(p, "walk")[0];
    return last && G.countedWalks(mine).some((e) => e.id === last.id) ? `+${G.XP.walk} XP` : "✓";
  }
  return "✓";
}

function rowTile(p, r, prev, next = false) {
  const k = r.need ? Math.min(1, r.n / r.need) : r.done ? 1 : 0;
  const just = r.done && prev && !prev.done;
  const bump = !just && prev && r.n > prev.n;
  const pop = just ? popText(p, r) : null;
  return h("li", h(`button.td-row${r.done ? ".done" : ""}${just ? ".just" : ""}${bump ? ".bump" : ""}${next ? ".next" : ""}`, { type: "button", "data-k": `td-${r.key}`, onclick: (e) => tapRow(e, r) },
    h("span.td-node", nodeRing(k, prev ? (prev.done ? 1 : Math.min(1, prev.n / (prev.need || 1))) : null),
      h("span.td-e", { "aria-hidden": "true" }, r.done ? "✓" : r.e),
      pop ? h("span.td-pop", { "aria-hidden": "true" }, pop) : null),
    h("span.td-t", h("b", r.label), h("span.td-s", r.sub)),
    next ? h("span.td-next", { "aria-hidden": "true" }, "Next") : h("span.td-plus", { "aria-hidden": "true" }, r.done ? "" : "+"),
    h("span.vh", r.done ? ", done" : ", tap to log")));
}

/** Nova's line for the top of Today: 0 done, some done, all done. */
function greeting(p, done, total) {
  const nm = (S.settings.trainerName || "").trim();
  const hr = new Date().getHours();
  if (!total) return ["Your list is empty. Tap Edit list to add what " + p.name + "'s day needs.", "think"];
  if (done === total) return [`All done. ${p.name} is a lucky ${p.species === "chicken" ? "flock" : "one"}.`, "proud"];
  if (done) return [total - done === 1 ? `One to go${nm ? `, ${nm}` : ""}. ${p.name} noticed what you did.` : `${done} down, ${total - done} to go. ${p.name} noticed.`, "happy"];
  const hi = hr < 12 ? "Morning" : hr < 18 ? "Afternoon" : "Evening";
  return [`${hi}${nm ? `, ${nm}` : ""}! ${hr < 18 ? `One tap and ${p.name}'s day is under way.` : `Still time to give ${p.name} a good day.`}`, "think"];
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
      dayComplete(p);
    };
    setTimeout(show, 900); // long enough to see the last tile tick first
  }
  const prevs = rows.map((r) => seen.get(`${key}|${r.key}`));
  rows.forEach((r) => seen.set(`${key}|${r.key}`, { done: r.done, n: r.n, need: r.need }));
  const [line, mood] = greeting(p, done, total);
  return h("section.td", { "aria-labelledby": "page-title" },
    novaSay(line, mood),
    h("div.td-head",
      h("div", h("h1.td-h", { id: "page-title", tabindex: "-1" }, "Today"), h("p.td-sub", total ? `${done} of ${total} done` : "Nothing on the list")),
      ring(done, total)),
    weekStrip(p),
    h("ul.td-list", rows.map((r, i) => rowTile(p, r, prevs[i], i === rows.findIndex((x) => !x.done)))),
    h("div.td-foot",
      h("button.linkish", { type: "button", "data-k": "td-edit", onclick: () => editList(p) }, "Edit list"),
      S.settings.plan && S.settings.plan.anchor
        ? h("button.linkish", { type: "button", "data-k": "plan-edit", onclick: () => planSheet(p) }, `⏰ ${planText(S.settings.plan)}`)
        : h("button.linkish", { type: "button", "data-k": "plan-make", onclick: () => planSheet(p) }, "⏰ Daily reminder")));
}

/** This week: a dot for each day you spent time together, and "3 days wins the week". */
function weekStrip(p) {
  if (p.sample) return null;
  const ws = weekAndSticker(p);
  return h("div.td-week", { role: "img", "aria-label": `This week: ${ws.count} of 3 days to win the week` },
    h("span.wk-dots", { "aria-hidden": "true" }, ws.week.map((d) => h(`span.wk-dot${d.on ? ".on" : ""}${d.today ? ".today" : ""}`, d.on ? "✓" : "SMTWTFS"[parseDate(d.date).getDay()]))),
    h("span.td-wk-t", { "aria-hidden": "true" }, ws.count >= 3 ? "Week won 🏆" : ws.count === 2 ? "1 more day wins the week" : `${ws.count} of 3 days wins the week`));
}

/** "Day complete!": one full-screen end card (Nova, the week, today's sticker, Continue) instead of stacked dialogs. */
function dayComplete(p) {
  if (document.querySelector("dialog.daydone[open]")) return;
  const ws = weekAndSticker(p);
  const dlg = h("dialog.daydone", { "aria-labelledby": "dd-h" });
  const close = () => dlg.close();
  put(dlg, h("div.dd-in",
    h("div.dd-hero", h("span.dd-rays", { "aria-hidden": "true" }), h("img.disc.dd-nova", { src: NOVA, alt: "", width: "132", height: "132" })),
    h("h2.dd-h", { id: "dd-h" }, "Day complete!"),
    h("p.dd-sub", `Everything on today's list. That's what ${p.name} needs from you.`),
    S.settings.careOnly ? null : xpProgress(p),
    h("div.dd-tiles",
      h("div.dd-tile.dd-week",
        h("span.dd-tl", "This week"),
        h("span.dd-dots", { role: "img", "aria-label": `${ws.count} of 7 days this week` }, ws.week.map((d) => h(`span.dd-dot${d.on ? ".on" : ""}${d.today ? ".today" : ""}`, { "aria-hidden": "true" },
          h("i", "SMTWTFS"[parseDate(d.date).getDay()]), h("b", d.on ? "✓" : "")))),
        h("b", ws.count >= 3 ? `${ws.count} days: week won 🏆` : `${ws.count} of 3 days wins the week`)),
      ws.sticker
        ? h("div.dd-tile.dd-sticker", h("span.dd-tl", "Today's sticker"), h("span.dd-se", { "aria-hidden": "true" }, ws.sticker.e), h("b", `No. ${ws.sticker.n}`), h("span.dd-st", ws.sticker.t))
        : h("div.dd-tile.dd-sticker.none", h("span.dd-tl", "Today's sticker"), h("span.dd-se", { "aria-hidden": "true" }, "🍪"), h("span.dd-st", "A walk, play or a training minute counts as time together, and earns one."))),
    h("div.dd-foot",
      h("button.btn.btn-blue.wide", { type: "button", "data-k": "dd-continue", autofocus: true, onclick: close }, "Continue"),
      shareWinBtn(p, { kind: "session", title: "Day done", sub: "Everything on today's list", emoji: "🎉" }, "dd-share"))));
  dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); });
  dlg.addEventListener("close", () => dlg.remove());
  addEventListener("hashchange", () => { if (dlg.open) dlg.close(); }, { once: true });
  document.body.append(dlg);
  dlg.showModal();
  const go = dlg.querySelector("[data-k=dd-continue]");
  if (go) go.focus();
  buzz(30);
  confetti();
}

/** "Today so far": everything logged today for this pet, newest first; tap to edit. */
export function todaySoFar(p) {
  const list = S.events.filter((e) => e.petId === p.id && e.at >= startOfDay()).sort((a, b) => b.at - a.at);
  return h("section.sec.td-log", { "aria-labelledby": "tsf-h" },
    h("h2.sec-title", { id: "tsf-h" }, "Today so far"),
    list.length ? eventList(list, (e) => (e.type === "symptom" ? unwellSheet(e) : eventSheet(e.type, e)))
      : novaSay("Quiet so far. Tap a tile above, or the + button.", "sleepy"));
}

function editList(p) {
  const cur = new Set(checklistOf(p));
  const counts = { ...((S.settings.checklistN || {})[p.id] || {}) };
  sheet("Today's list", (body, close) => {
    const ids = Object.keys(ITEMS).filter((id) => allowed(p, id));
    put(body,
      h("p.sheet-intro", `Pick what ${p.name}'s day needs. Medicines due today are added for you.`),
      h("div.td-pick", ids.map((id) => {
        const it = ITEMS[id], fid = `tdp-${id}`;
        const box = h("label.check", { for: fid }, h("input", { type: "checkbox", id: fid, checked: cur.has(id), onchange: (e) => { if (e.target.checked) cur.add(id); else cur.delete(id); } }),
          h("span", `${it.e} ${it.label(p)}`));
        if (!it.counts) return box;
        const sel = h("select", { id: `${fid}-n`, "aria-label": `How many ${it.label(p).toLowerCase()} a day`, onchange: (e) => { counts[id] = Number(e.target.value); } },
          [1, 2, 3, 4].map((n) => h("option", { value: String(n), selected: n === it.target(p) }, `${n} a day`)));
        return h("div.td-pick-row", box, sel);
      })),
      h("div.row-btns", h("button.btn.btn-blue", { type: "button", "data-k": "td-save", onclick: async () => {
        const list = ids.filter((id) => cur.has(id));
        if (!list.length) { toast("Keep at least one thing on the list."); return; }
        try {
          await setSetting("checklistN", { ...(S.settings.checklistN || {}), [p.id]: counts });
          await setSetting("checklist", { ...(S.settings.checklist || {}), [p.id]: list }, { quiet: false });
        } catch { toast("Couldn't save on this device."); return; }
        close();
      } }, "Save")));
  });
}

// ---------- the "+" sheet ----------
export function logSheet(p) {
  if (!p) return;
  const last = (type) => { const e = eventsOf(type, p.id)[0]; return e ? ago(e.at) : "never"; };
  const mine = S.events.filter((e) => e.petId === p.id);
  const used = (type) => mine.filter((e) => e.type === type).length;
  const tiles = [
    ["meal", "🍽️", "Meal", logMeal], ["treat", "🦴", "Treat", logTreat], ["poop", "💩", p.species === "rabbit" ? "Droppings" : "Poop", logPoop],
    p.species === "dog" ? ["walk", "🚶", "Walk", logWalk] : null, ["play", "🧶", "Play", logPlay],
    skillsFor(p).length ? ["training", "🎯", "Training", () => trainingPicker(p)] : null,
    p.species === "chicken" ? ["eggs", "🥚", "Eggs", logEggs] : null,
    ["med", "💊", "Medicine", logMed], ["weight", "⚖️", "Weight", () => eventSheet("weight")], ["symptom", "😟", "Unwell", () => unwellSheet()],
    ["vet", "🩺", "Vet visit", () => eventSheet("vet")],
  ].filter(Boolean)
    .map((t, i) => ({ t, i, n: used(t[0]) }))
    .sort((a, b) => b.n - a.n || a.i - b.i);  // most used first; ties keep the usual order
  const topN = Math.min(3, tiles.filter((x) => x.n > 0).length); // highlight only what this pet really logs
  sheet(`Log for ${p.name}`, (body, close) => {
    const tile = ([type, e, label, fn], top) => h(`button.ls-tile${top ? ".top" : ""}`, { type: "button", "data-k": `ls-${type}`, onclick: () => { buzz(12); close(); setTimeout(fn, 60); } },
      h("span.ls-e", { "aria-hidden": "true" }, e), h("b", label), h("span.ls-ago", `Last: ${last(type)}`));
    put(body,
      topN ? h("p.ls-cap", `${p.name}'s most used`) : null,
      h("div.ls-grid", tiles.map((x, i) => tile(x.t, i < topN))),
      h("p.small.muted.ls-note", "One tap logs it now. Undo or add details after."));
  });
}
