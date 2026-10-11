// Health (kept small): one tab with segments. Health (quick logs, what's due, then vaccines and the care routine,
// medicines, weight with a chart, vet visits), Food, Poop and Unwell, plus the printable vet summary.
// Vet-first throughout: no doses suggested, no diagnosis.

import { S, pet, eventsOf, forPet, units, setSetting, save, logsOf } from "../state.js";
import { h, put, em, fmtDate, fmtTime, isoDate, uid, toast, ageText, DAY, telHref, startOfDay, nextDayStart } from "../util.js";
import { currentRecords, historyOf, recordStatus, dueText, medStatus, medIsActive, freqText, dosesOf, fmtWeight, toUnit, fromUnit, flagLabel, scaleFor,
  dueItems, poopWeek, healthAlerts } from "../logic.js";
import { recordSheet, medSheet, markGiven, eventSheet, speciesOf, doneRecord, deleteRecord, deleteMed, calRecord, calMed, calAllDue, CAL_NOTE,
  careTasksFor, careStatus, careSheet, markCareDone, calCare, everyText, segmented, symptomLabel, unwellSheet, logPoop, logMeal, logTreat, logMed,
  editRecord, careDue } from "../forms.js";
import { pageHead, subBar, sampleStrip, emptyState, vetFirst, eventList, avatar, moreBtn, cardTitle, alertCard, agoSpan, chevron, NOVA } from "./parts.js";
import { foodSection } from "./food.js";

const SEGS = [["care", "Health"], ["food", "Food"], ["poop", "Poop"], ["unwell", "Unwell"]];
const SUBS = [["vaccines", "Vaccines"], ["meds", "Meds"], ["weight", "Weight"], ["vet", "Vet"]];

export function health(main, arg) {
  const p = pet();
  const now = Date.now();
  const seg = SEGS.some(([k]) => k === arg && k !== "care") ? arg : "care";
  const sub = SUBS.some(([k]) => k === arg) ? arg : "vaccines";
  const late = (it) => (it.kind === "med" ? it.st.overdue : it.st.state === "overdue");
  const items = [...dueItems(p.id), ...careDue(p)].map((it, i) => [it, i]).sort((a, b) => late(b[0]) - late(a[0]) || a[1] - b[1]).map(([it]) => it);
  put(main,
    sampleStrip(p),
    pageHead("Health", novaSays(p, items, logsOf(p.id))),
    alertCard(healthAlerts(p, now), p),
    h("nav.seg.seg-nav", { "aria-label": "Health sections" }, SEGS.map(([k, label]) =>
      h("a", { href: k === "care" ? "#/health" : `#/health/${k}`, "aria-current": k === seg ? "page" : null, "data-k": `seg-${k}` }, label))));
  if (seg === "care") {
    put(main,
      h("section.sec.ql-sec", { "aria-labelledby": "ql-h" },
        h("h2.sec-title.vh", { id: "ql-h" }, "Quick log"),
        h("div.ql-grid", TILES.map(([type, label, fn]) => tile(p, type, label, fn)))),
      dueSection(p, items),
      h("nav.subnav", { "aria-label": "Health records" }, SUBS.map(([k, label]) =>
        h("a", { href: `#/health/${k}`, "aria-current": k === sub && (arg === k || (!arg && k === "vaccines")) ? "page" : null }, label))));
    ({ vaccines, meds, weight, vet })[sub](main, p);
    put(main, todayDiary(p, now));
  } else if (seg === "food") foodSection(main, p);
  else if (seg === "poop") poopSection(main, p);
  else unwellSection(main, p);
  put(main, vetFirst());
}

// ---------- quick logs, Nova's line and what's due (moved from v1's Today) ----------
const TILES = [
  ["poop", "Poop", logPoop],
  ["meal", "Meal", logMeal],
  ["treat", "Treat", logTreat],
  ["med", "Medicine", logMed],
];

function novaSays(p, items, logs) {
  const line = (...kids) => h("p.nova-line", h("img.disc.nova-face", { src: NOVA, alt: "", width: "28", height: "28" }), h("span", h("span.vh", "Nova says: "), ...kids));
  if (healthAlerts(p, Date.now()).length) return line("First things first: see the vet card below.");
  if (!p.sample && !logs.length) return line(`Log ${p.name}${/s$/i.test(p.name) ? "'" : "'s"} last meal. One tap.`);
  const hasRecords = S.records.some((r) => r.petId === p.id);
  if (!p.sample && !hasRecords && logs.length <= 5) return line("Add vaccines next? It's how I know what's due.");
  if (items.some((it) => (it.kind === "med" ? it.st.overdue : it.st.state === "overdue"))) return line("Something's late. I'm not judging. Much.");
  if (items.length) return line(`${items.length === 1 ? "One thing" : `${items.length} things`} due soon. I'm keeping count.`);
  return line("Nothing due. I checked twice.");
}

function tile(p, type, label, fn) {
  const last = eventsOf(type, p.id)[0];
  return h(`button.ql.ql-${type}`, { type: "button", "data-k": `ql-${type}`, onclick: fn },
    h("span.ql-em", { "aria-hidden": "true" }, { poop: "💩", meal: "🍽️", treat: "🦴", med: "💊" }[type]),
    h("span.ql-l", label),
    h("span.ql-ago", last ? agoSpan(last.at) : "Not yet"));
}

function dueSection(p, items) {
  if (!items.length) return null;
  return h("section.sec", { "aria-labelledby": "due-h" },
    h("h2.sec-title", { id: "due-h" }, "Due"),
    h("ul.due-list", items.map((it) => dueCard(p, it))));
}

function dueCard(p, it) {
  if (it.kind === "care") {
    const t = it.task;
    return h(`li.card.due-card.${it.st.state}`,
      h("div.due-top",
        h("span.due-em", { "aria-hidden": "true" }, "✨"),
        h("div.due-body",
          cardTitle(t.name, () => careSheet(t), `due-care-${t.id}`),
          h("p.due-when", h("b", dueText(it.st)), ` · ${everyText(t).toLowerCase()}`))),
      h("div.card-actions",
        h("button.btn.btn-blue.sm", { type: "button", "data-k": `cdone-${t.id}`, onclick: () => markCareDone(p, t) }, "Mark done", h("span.vh", `: ${t.name}`)),
        moreBtn(t.name, [["Change last done", () => careSheet(t)], ["Add to calendar", () => calCare(p, t, it.nextDue)]])));
  }
  if (it.kind === "record") {
    const r = it.rec;
    return h(`li.card.due-card.${it.st.state}`,
      h("div.due-top",
        h("span.due-em", { "aria-hidden": "true" }, r.kind === "vaccine" ? "💉" : "🛡️"),
        h("div.due-body",
          cardTitle(r.name, () => editRecord(r), `due-edit-${r.id}`),
          h("p.due-when", h("b", dueText(it.st)), ` · ${fmtDate(r.nextDue, { day: "numeric", month: "short" })}`))),
      h("div.card-actions",
        h("button.btn.btn-blue.sm", { type: "button", "data-k": `due-done-${r.id}`, onclick: () => doneRecord(r) }, "Mark done", h("span.vh", `: ${r.name}`)),
        moreBtn(r.name, [["Edit", () => editRecord(r)], ["Add to calendar", () => calRecord(p, r)], ["Delete", () => deleteRecord(r), { danger: true }]])));
  }
  const m = it.med, st = it.st;
  return h(`li.card.due-card.${st.overdue ? "overdue" : "today"}`,
    h("div.due-top",
      h("span.due-em", { "aria-hidden": "true" }, "💊"),
      h("div.due-body",
        cardTitle(m.name, () => medSheet(m), `due-edit-${m.id}`),
        h("p.due-when", h("b", st.daily ? `${st.given} of ${st.need} given today` : dueText({ state: st.overdue ? "overdue" : "today", days: -st.days })),
          st.daily && st.next ? ` · next ${st.next}` : "", ` · ${freqText(m)}`),
        m.dose ? h("p.due-dose", "Dose (from your vet): ", m.dose) : null)),
    h("div.card-actions",
      h("button.btn.btn-blue.sm", { type: "button", "data-k": `due-give-${m.id}`, onclick: () => markGiven(m) }, "Mark given", h("span.vh", `: ${m.name}`)),
      moreBtn(m.name, [["Edit", () => medSheet(m)], ["Add to calendar", () => calMed(p, m)], ["Delete", () => deleteMed(m), { danger: true }]])));
}

function todayDiary(p, now) {
  const todays = S.events.filter((e) => e.petId === p.id && e.at >= startOfDay(now) && e.at < nextDayStart(now)).sort((a, b) => b.at - a.at);
  return h("details.more-box.today-diary",
    h("summary", `Today's diary (${todays.length})`),
    todays.length ? eventList(todays, (e) => eventSheet(e.type, e)) : h("p.small.muted", "Nothing logged yet today."));
}

// ---------- poop log ----------
function poopSection(main, p) {
  const poops = eventsOf("poop");
  const week = poopWeek(p.id);
  const strip = h("ol.week-strip", { "aria-label": "Poops in the last 7 days" }, week.map((d) => {
    const label = new Date(d.day).toLocaleDateString(undefined, { weekday: "short" });
    const s = scaleFor(d.worst, p.id);
    const desc = `${new Date(d.day).toLocaleDateString(undefined, { weekday: "long" })}: ${d.count} poop${d.count === 1 ? "" : "s"}${d.flagged ? ", something unusual noted" : ""}${d.count && s ? `, least typical: ${s.label}` : ""}`;
    return h(`li.ws-day${d.flagged ? ".flag" : ""}${d.count && d.worst !== 3 && d.worst !== 2 ? ".off" : ""}${d.count ? ".has" : ""}`,
      h("span.ws-l", { "aria-hidden": "true" }, label),
      h("span.ws-n", { "aria-hidden": "true" }, d.count ? String(d.count) : "·"),
      h("span.vh", desc));
  }));
  const recent = poops.filter((e) => Date.now() - e.at < 30 * DAY);
  put(main,
    h("section.sec", { "aria-labelledby": "ws-h" },
      h("h2.sec-title", { id: "ws-h" }, "This week"),
      strip,
      h("p.small.muted", "Poops per day. Tan means something wasn't typical (looser, harder or flagged).")),
    h("div.sticky-cta", h("button.btn.btn-blue.wide", { type: "button", "data-k": "log-poop", onclick: () => eventSheet("poop") }, em("💩"), " Log a poop")),
    h("section.sec", { "aria-labelledby": "ph-h" },
      h("h2.sec-title", { id: "ph-h" }, "Last 30 days"),
      recent.length ? eventList(recent, (e) => eventSheet("poop", e), { showDay: true, single: true }) : emptyState("No poops logged in the last 30 days.")),
    redFlags());
}

const redFlags = (open = false) => (S.content.RED_FLAGS.length ? h("details.more-box", { open },
  h("summary", "When to call your vet"),
  h("ul.rf-list", S.content.RED_FLAGS.map((r) => h("li", h("b", r.when), h("p", r.advice))))) : null);

// ---------- unwell ----------
function unwellSection(main, p) {
  const notes = eventsOf("symptom").filter((e) => Date.now() - e.at < 30 * DAY);
  put(main,
    h("section.sec", { "aria-labelledby": "uw-h" },
      h("h2.sec-title", { id: "uw-h" }, `Is ${p.name} unwell?`),
      h("p", "Tick what you've noticed. If any of it needs a vet, Nova says so straight away. She doesn't diagnose: your vet does."),
      h("button.btn.btn-blue.wide", { type: "button", "data-k": "open-unwell", onclick: () => unwellSheet() }, em("😟"), " Open the Unwell checklist")),
    h("section.sec", { "aria-labelledby": "un-h" },
      h("h2.sec-title", { id: "un-h" }, "Unwell notes, last 30 days"),
      notes.length ? eventList(notes, (e) => eventSheet("symptom", e), { showDay: true, single: true }) : emptyState("Nothing logged. Long may it last.")),
    redFlags(true),
    p.vet && telHref(p.vet.phone) ? null : h("a.text-link", { href: "#/more/profile" }, "Add your vet's number"));
}

const pillFor = (st) => (st.state === "overdue" ? ["overdue", dueText(st)] : st.state === "today" ? ["today", "Due today"] : st.state === "soon" ? ["soon", dueText(st)] : st.state === "later" ? ["ok", "Up to date"] : ["none", "No next date"]);
const isDueish = (st) => st.state === "overdue" || st.state === "today" || st.state === "soon";
/** The bottom row of a card: its one primary button (if any) and ⋯. Without a primary, the meta line sits beside ⋯. */
const actionsRow = (primary, more, meta) => (primary
  ? [meta, h("div.card-actions", primary, more)]
  : h("div.card-actions", meta ? h("div.card-meta", meta) : null, more));

// ---------- vaccines, preventives and the care routine ----------
function vaccines(main, p) {
  const cur = currentRecords(p.id);
  put(main, h("div.top-actions",
    h("button.btn.btn-blue", { type: "button", "data-k": "add-rec", onclick: () => recordSheet() }, em("➕"), " Add vaccine or preventive")));
  for (const [kind, title] of [["vaccine", "Vaccines"], ["preventive", "Flea, worm and other preventives"]]) {
    const list = cur.filter((r) => r.kind === kind);
    put(main, h("section.sec", { "aria-labelledby": `h-${kind}` },
      h("h2.sec-title", { id: `h-${kind}` }, title),
      list.length ? h("ul.cards", list.map((r) => recCard(p, r))) : emptyState(kind === "vaccine"
        ? "Nothing yet. Copy the last ones from the vaccination card or pet passport."
        : "Nothing yet. Add flea, tick or worm treatments to see when they're due.")));
  }
  put(main, careRoutine(p),
    h("section.sec.cal-sec", { "aria-labelledby": "h-cal" },
      h("h2.sec-title", { id: "h-cal" }, "Reminders"),
      h("p", CAL_NOTE, " One calendar file adds every upcoming due date, with an alarm the day before."),
      h("button.btn.btn-line", { type: "button", "data-k": "cal-all", onclick: () => calAllDue(p) }, em("📅"), " Add all due dates to my calendar")));
}

function recCard(p, r) {
  const st = recordStatus(r);
  const hist = historyOf(r);
  const pill = pillFor(st);
  return h("li.card",
    h("div.card-top", cardTitle(r.name, () => recordSheet(r), `edit-${r.id}`), h(`span.pill.${pill[0]}`, pill[1])),
    r.note ? h("p.small.muted", r.note) : null,
    actionsRow(
      isDueish(st) ? h("button.btn.btn-blue.sm", { type: "button", "data-k": `done-${r.id}`, onclick: () => doneRecord(r) }, "Mark done", h("span.vh", `: ${r.name}`)) : null,
      moreBtn(r.name, [["Edit", () => recordSheet(r)], r.nextDue ? ["Add to calendar", () => calRecord(p, r)] : null, ["Delete", () => deleteRecord(r), { danger: true }]]),
      h("p.small", `Given ${r.given ? fmtDate(r.given) : "date unknown"}`, r.nextDue ? ` · Next due ${fmtDate(r.nextDue)}` : "")),
    hist.length > 1 ? h("details.mini",
      h("summary", `History (${hist.length})`),
      h("ul.hist", hist.map((x) => h("li",
        h("button.hist-row", { type: "button", onclick: () => recordSheet(x) },
          `${x.given ? fmtDate(x.given) : "?"}${x.nextDue ? ` → next ${fmtDate(x.nextDue)}` : ""}`, h("span.vh", ", edit")))))) : null);
}

function careRoutine(p) {
  const tasks = careTasksFor(p);
  if (!tasks.length) return null;
  return h("section.sec", { id: "care", "aria-labelledby": "h-care" },
    h("h2.sec-title", { id: "h-care" }, "Care routine"),
    h("p.small.muted", "Suggestions only. Track the ones you do, and they show in Due when they come round."),
    h("ul.cards", tasks.map((t) => {
      const cs = careStatus(p, t);
      const pill = cs ? pillFor(cs.st) : ["none", "Not tracked"];
      return h("li.card.care-card",
        h("div.card-top", cardTitle(t.name, () => careSheet(t), `care-${t.id}`), h(`span.pill.${pill[0]}`, pill[1])),
        actionsRow(
          !cs ? h("button.btn.btn-line.sm", { type: "button", "data-k": `track-${t.id}`, onclick: () => careSheet(t) }, "Track it", h("span.vh", `: ${t.name}`))
            : isDueish(cs.st) ? h("button.btn.btn-blue.sm", { type: "button", "data-k": `cdone-${t.id}`, onclick: () => markCareDone(p, t) }, "Mark done", h("span.vh", `: ${t.name}`)) : null,
          cs ? moreBtn(t.name, [["Change last done", () => careSheet(t)], ["Add to calendar", () => calCare(p, t, cs.nextDue)]]) : null,
          h("p.small.muted", everyText(t), cs ? ` · last done ${fmtDate(cs.last, { day: "numeric", month: "short" })}` : "")));
    })));
}

// ---------- medicines ----------
function meds(main, p) {
  const all = forPet("meds");
  const active = all.filter((m) => medIsActive(m) || (m.start && m.start > isoDate()));
  const past = all.filter((m) => !active.includes(m));
  put(main,
    h("div.top-actions",
      h("button.btn.btn-blue", { type: "button", "data-k": "add-med", onclick: () => medSheet() }, em("➕"), " Add a medicine")),
    h("p.note-line", em("✍️"), " Type the dose exactly as your vet wrote it. Nova's Pack never suggests a dose."),
    h("section.sec", { "aria-labelledby": "h-meds" },
      h("h2.sec-title", { id: "h-meds" }, "Current medicines"),
      active.length ? h("ul.cards", active.map((m) => medCard(p, m))) : emptyState("No current medicines.")),
    past.length ? h("details.more-box",
      h("summary", `Finished medicines (${past.length})`),
      h("ul.cards", past.map((m) => medCard(p, m)))) : null);
}
function medCard(p, m) {
  const st = medStatus(m);
  const last = dosesOf(m)[0];
  let status = "Finished";
  if (st.active) status = st.daily ? `${st.given} of ${st.need} today` : st.due ? (st.overdue ? "Overdue" : "Due today") : st.dueDate ? `Next ${fmtDate(st.dueDate, { day: "numeric", month: "short" })}` : "Done";
  else if (m.start && m.start > isoDate()) status = `Starts ${fmtDate(m.start, { day: "numeric", month: "short" })}`;
  const upcoming = st.active || (m.start && m.start > isoDate());
  return h("li.card",
    h("div.card-top", cardTitle(m.name, () => medSheet(m), `edit-${m.id}`), h(`span.pill.${st.due ? (st.overdue ? "overdue" : "today") : "ok"}`, status)),
    h("p.small", h("b", "Dose: "), m.dose || "not written down"),
    h("p.small.muted", `${freqText(m)}${m.times && m.times.length && m.freq !== "weekly" && m.freq !== "monthly" ? ` at ${m.times.slice(0, m.freq === "twice" ? 2 : 1).join(" and ")}` : ""} · from ${m.start ? fmtDate(m.start) : "?"}${m.end ? ` to ${fmtDate(m.end)}` : ""}`),
    m.note ? h("p.small.muted", m.note) : null,
    actionsRow(
      st.active ? h("button.btn.btn-blue.sm", { type: "button", "data-k": `give-${m.id}`, onclick: () => markGiven(m) }, "Mark given", h("span.vh", `: ${m.name}`)) : null,
      moreBtn(m.name, [["Edit", () => medSheet(m)], upcoming ? ["Add to calendar", () => calMed(p, m)] : null, ["Delete", () => deleteMed(m), { danger: true }]]),
      last ? h("p.small.muted", `Last given ${fmtDate(last.at, { day: "numeric", month: "short" })} at ${fmtTime(last.at)}`) : null));
}

// ---------- weight ----------
function weight(main, p) {
  const u = units(p);
  const list = eventsOf("weight");
  const latest = list[0];
  const input = h("input", { type: "number", inputmode: "decimal", min: "0", step: u === "g" ? "1" : "0.1", id: "w-in", required: true });
  const err = h("p.form-error", { role: "alert" });
  const form = h("form.inline-form", { novalidate: true, onsubmit: async (e) => {
    e.preventDefault();
    const v = parseFloat(input.value);
    if (!(v > 0)) { err.textContent = "Enter a weight above 0."; input.focus(); return; }
    const ev = { id: uid(), petId: p.id, type: "weight", at: Date.now(), kg: fromUnit(v, u) };
    if (p.sample) ev.sample = true;
    await save("events", ev);
    toast(`Weight saved: ${fmtWeight(ev.kg, u)}. I supervised.`);
  } },
  h("div.field", h("label", { for: "w-in" }, `Today's weight in ${u}`), h("div.input-row", input, h("button.btn.btn-blue", { type: "submit", "data-k": "w-save" }, "Save"))), err);

  let change = null;
  if (list.length > 1) {
    const prev = list.find((e) => latest.at - e.at > 25 * DAY) || list[list.length - 1];
    const d = toUnit(latest.kg - prev.kg, u);
    change = `${d >= 0 ? "+" : "−"}${Math.abs(u === "g" ? Math.round(d) : Math.round(d * 10) / 10)} ${u} since ${fmtDate(prev.at, { day: "numeric", month: "short" })}`;
  }
  const chart = h("div.chart", { id: "weight-chart" });
  put(main,
    h("section.sec", { "aria-labelledby": "h-w" },
      h("div.sec-row", h("h2.sec-title", { id: "h-w" }, "Weight"),
        segmented("units", "Weight units", [["kg", "kg"], ["lb", "lb"]], u, (x) => setSetting("units", x, { quiet: false }), { hideLegend: true })),
      latest ? h("p.big-num", fmtWeight(latest.kg, u), change ? h("span.small.muted", ` ${change}`) : null) : null,
      list.length ? chart : emptyState("No weights yet. Weigh your pet once a month: it's one of the easiest ways to spot changes early."),
      form),
    list.length ? h("section.sec", { "aria-labelledby": "h-wl" },
      h("h2.sec-title", { id: "h-wl" }, "All weights"),
      h("ul.tl", list.map((e) => h("li.tl-item",
        h("button.tl-row.w-row", { type: "button", "data-k": `ev-${e.id}`, onclick: () => eventSheet("weight", e) },
          h("span.tl-body", h("span.tl-time", fmtDate(e.at))), h("b", fmtWeight(e.kg, u)), h("span.vh", ", edit")))))) : null);
  if (list.length) requestAnimationFrame(() => drawWeight(chart, list.slice(0, 24).reverse(), u));
}

/** Single-series SVG line chart, sized to its box. Hover or tap shows the value; the list below is the table view. */
export function drawWeight(box, pts, u) {
  if (!box.isConnected) return;
  const W = Math.max(240, Math.round(box.clientWidth || 300)), H = 168, L = 44, R = 16, T = 18, B = 26;
  const vals = pts.map((e) => toUnit(e.kg, u));
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (hi - lo < 1) { lo -= 0.5; hi += 0.5; }
  const padV = (hi - lo) * 0.12; lo -= padV; hi += padV;
  const t0 = pts[0].at, t1 = pts[pts.length - 1].at;
  const x = (t) => (t1 === t0 ? L + (W - L - R) / 2 : L + ((t - t0) / (t1 - t0)) * (W - L - R));
  const y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const NS = "http://www.w3.org/2000/svg";
  const el = (n, a = {}) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const r1 = (v) => Math.round(v * 10) / 10;
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: "img",
    "aria-label": `Weight chart: ${pts.length} entries, from ${r1(vals[0])} ${u} on ${fmtDate(t0)} to ${r1(vals[vals.length - 1])} ${u} on ${fmtDate(t1)}.` });
  // recessive grid: 3 lines with labels
  for (const v of [lo + padV, (lo + hi) / 2, hi - padV]) {
    svg.append(el("line", { x1: L, x2: W - R, y1: y(v), y2: y(v), class: "c-grid" }));
    const t = el("text", { x: L - 6, y: y(v) + 4, "text-anchor": "end", class: "c-axis" }); t.textContent = r1(v); svg.append(t);
  }
  const xl = (t, anchor) => { const e = el("text", { x: x(t), y: H - 6, "text-anchor": anchor, class: "c-axis" }); e.textContent = fmtDate(t, { day: "numeric", month: "short" }); svg.append(e); };
  xl(t0, pts.length > 1 ? "start" : "middle");
  if (pts.length > 1) xl(t1, "end");
  if (pts.length > 1) svg.append(el("polyline", { points: pts.map((e, i) => `${x(e.at)},${y(vals[i])}`).join(" "), class: "c-line" }));
  pts.forEach((e, i) => svg.append(el("circle", { cx: x(e.at), cy: y(vals[i]), r: 4, class: "c-dot" })));
  // direct label on the latest point only
  const lx = x(t1), ly = y(vals[vals.length - 1]);
  const lab = el("text", { x: Math.min(lx, W - R), y: ly - 10, "text-anchor": "end", class: "c-label" }); lab.textContent = `${r1(vals[vals.length - 1])} ${u}`; svg.append(lab);
  // hover / tap layer
  const cross = el("line", { y1: T, y2: H - B, class: "c-cross", visibility: "hidden" });
  const hot = el("circle", { r: 6, class: "c-hot", visibility: "hidden" });
  svg.append(cross, hot);
  const tip = h("div.c-tip", { hidden: true });
  const hit = el("rect", { x: 0, y: 0, width: W, height: H, fill: "transparent" });
  const show = (ev) => {
    const r = svg.getBoundingClientRect();
    const px = ((ev.clientX - r.left) / r.width) * W;
    let best = 0;
    pts.forEach((e, i) => { if (Math.abs(x(e.at) - px) < Math.abs(x(pts[best].at) - px)) best = i; });
    const cx = x(pts[best].at), cy = y(vals[best]);
    cross.setAttribute("x1", cx); cross.setAttribute("x2", cx); cross.setAttribute("visibility", "visible");
    hot.setAttribute("cx", cx); hot.setAttribute("cy", cy); hot.setAttribute("visibility", "visible");
    tip.textContent = `${fmtDate(pts[best].at, { day: "numeric", month: "short", year: "numeric" })}: ${r1(vals[best])} ${u}`;
    tip.hidden = false;
    tip.style.left = `${Math.max(0, Math.min(r.width - 150, (cx / W) * r.width - 75))}px`;
  };
  const hide = () => { cross.setAttribute("visibility", "hidden"); hot.setAttribute("visibility", "hidden"); tip.hidden = true; };
  hit.addEventListener("pointermove", show);
  hit.addEventListener("pointerdown", show);
  hit.addEventListener("pointerleave", hide);
  svg.append(hit);
  box.replaceChildren(svg, tip);
  if (!box._ro && "ResizeObserver" in window) {
    let w0 = box.clientWidth;
    box._ro = new ResizeObserver(() => { if (Math.abs(box.clientWidth - w0) > 4) { w0 = box.clientWidth; drawWeight(box, pts, u); } });
    box._ro.observe(box);
  }
}

// ---------- vet visits ----------
function vet(main, p) {
  const visits = eventsOf("vet");
  put(main,
    h("div.top-actions.row-btns.left",
      h("a.btn.btn-blue", { href: "#/summary" }, em("📋"), " Vet summary"),
      h("button.btn.btn-line", { type: "button", "data-k": "add-vet", onclick: () => eventSheet("vet") }, em("➕"), " Add a vet visit")),
    h("p.note-line", "The vet summary is one page: contacts, food, medicines, vaccines, weight, and recent poop and unwell notes. Show it or print it at your next visit."),
    h("section.sec", { "aria-labelledby": "h-vet" },
      h("h2.sec-title", { id: "h-vet" }, "Vet visits"),
      visits.length ? eventList(visits, (e) => eventSheet("vet", e), { showDay: true, single: true }) : emptyState("No vet visits logged yet.")),
    h("p", h("a.text-link", { href: "#/health/poop" }, "Open the poop log", chevron())));
}

// ---------- printable vet summary ----------
export function summary(main) {
  const p = pet();
  const u = units(p);
  if (!p.sample && !S.settings.summaryViewed) setSetting("summaryViewed", Date.now()).catch(() => {});
  const food = forPet("foods").find((f) => f.kind === "food" && !f.until);
  const treats = forPet("foods").filter((f) => f.kind === "treat" && f.inUse !== false);
  const medsNow = forPet("meds").filter((m) => medIsActive(m));
  const recs = forPet("records").sort((a, b) => (b.given || "").localeCompare(a.given || "")).slice(0, 5);
  const weights = eventsOf("weight").slice(0, 5);
  const since = Date.now() - 14 * DAY;
  const flagged = eventsOf("poop").filter((e) => e.at >= since && ((e.flags && e.flags.length) || (typeof e.score === "number" && e.score >= 4)));
  const unwell = eventsOf("symptom").filter((e) => e.at >= since);
  const visits = eventsOf("vet").slice(0, 3);
  const row = (k, v) => (v ? h("tr", h("th", { scope: "row" }, k), h("td", v)) : null);
  const tel = (n) => (telHref(n) ? h("a", { href: telHref(n) }, n) : n);
  const join = (...xs) => { const out = xs.filter(Boolean); return out.length ? out.flatMap((x, i) => (i ? [" · ", x] : [x])) : null; };
  const v = p.vet || {}, ins = p.insurer || {}, chip = p.microchip || {}, neu = p.neutered;
  const sexText = p.sex === "male" ? "Male" : p.sex === "female" ? "Female" : "";
  const neutText = neu ? (neu.yes ? `Yes${neu.date ? ` (${fmtDate(neu.date)})` : ""}` : "No") : "";
  const chart = h("div.chart.print-chart");
  put(main,
    subBar("Vet summary", "#/health/vet", "Back to Health"),
    h("div.no-print.top-actions",
      h("button.btn.btn-blue", { type: "button", "data-k": "print", onclick: () => window.print() }, "Print or save as PDF")),
    h("article.summary", { "aria-labelledby": "sum-h" },
      h("div.sum-head", avatar(p, 56), h("div",
        h("h2.sum-title", { id: "sum-h" }, `${p.name}: vet summary`),
        h("p.small.muted", `From the owner's diary, ${fmtDate(isoDate())}${p.sample ? " · SAMPLE DATA" : ""}`))),
      h("table.sum-table", h("tbody",
        row("Species", join(speciesOf(p.species).label, sexText)),
        row("Birthday", p.birthday ? `${fmtDate(p.birthday)} (${ageText(p.birthday)})` : "Not recorded"),
        row("Neutered", neutText),
        row("Last season", p.lastSeason ? fmtDate(p.lastSeason) : ""),
        row("Latest weight", weights[0] ? `${fmtWeight(weights[0].kg, u)} on ${fmtDate(weights[0].at)}` : "Not recorded"),
        row("Current food", food ? [[food.brand, food.product].filter(Boolean).join(" "), food.amount, food.since ? `since ${fmtDate(food.since)}` : ""].filter(Boolean).join(" · ") : "Not recorded"),
        row("Treats in use", treats.length ? treats.map((t) => t.name).join(", ") : "None recorded"),
        row("Allergies / don't feed", p.allergies || "None recorded"),
        row("Conditions", p.conditions || "None recorded"))),
      v.name || v.phone || v.emergencyPhone || ins.name || chip.number ? [
        h("h3", "Contacts and IDs"),
        h("table.sum-table", h("tbody",
          row("Vet", join(v.name, v.phone ? tel(v.phone) : "")),
          row("Emergency vet", v.emergencyPhone ? tel(v.emergencyPhone) : ""),
          row("Insurance", join(ins.name, ins.policy ? `policy ${ins.policy}` : "", ins.renewal ? `renews ${fmtDate(ins.renewal)}` : "")),
          row("Microchip", join(chip.number, chip.registry, chip.checkedOn ? `details checked ${fmtDate(chip.checkedOn)}` : ""))))] : null,
      h("h3", "Current medicines"),
      medsNow.length ? h("ul", medsNow.map((m) => h("li", h("b", m.name), ` · dose as written by the vet: ${m.dose || "not written down"} · ${freqText(m)}${m.end ? ` until ${fmtDate(m.end)}` : ""}`))) : h("p", "None recorded."),
      h("h3", "Last 5 vaccines and preventives"),
      recs.length ? h("ul", recs.map((r) => h("li", h("b", r.name), ` · given ${r.given ? fmtDate(r.given) : "?"}${r.nextDue ? ` · next due ${fmtDate(r.nextDue)}` : ""}`))) : h("p", "None recorded."),
      h("h3", "Weight trend"),
      weights.length ? h("ul", weights.map((e) => h("li", `${fmtDate(e.at)}: ${fmtWeight(e.kg, u)}`))) : h("p", "None recorded."),
      weights.length > 1 ? chart : null,
      h("h3", "Unwell notes, last 14 days"),
      unwell.length ? h("ul", unwell.map((e) => h("li", `${fmtDate(e.at, { day: "numeric", month: "short" })} ${fmtTime(e.at)}: ${(e.symptoms || []).map(symptomLabel).join("; ")}${e.note ? ` · "${e.note}"` : ""}`))) : h("p", "Nothing logged."),
      h("h3", "Poop notes, last 14 days"),
      flagged.length ? h("ul", flagged.map((e) => {
        const s = scaleFor(e.score, e.petId);
        return h("li", `${fmtDate(e.at, { day: "numeric", month: "short" })} ${fmtTime(e.at)}: ${s ? `Type ${e.score}, ${s.label}` : ""}${e.flags && e.flags.length ? ` · ${e.flags.map(flagLabel).join(", ")}` : ""}${e.note ? ` · "${e.note}"` : ""}`);
      })) : h("p", `Nothing unusual logged (${eventsOf("poop").filter((e) => e.at >= since).length} poops logged).`),
      h("h3", "Recent vet visits"),
      visits.length ? h("ul", visits.map((e) => h("li", `${fmtDate(e.at)}${e.clinic ? ` · ${e.clinic}` : ""}${e.note ? `: ${e.note}` : ""}`))) : h("p", "None recorded."),
      h("p.small.muted.sum-note", "Written by the owner in a diary app. Not a medical record. Doses are as the owner typed them from the vet's instructions."),
      h("p.sum-foot", h("img", { src: "img/brand/nova-head.svg", alt: "", width: "20", height: "20" }), "Made with Nova's Pack · novashiv11.github.io/novas-pack")));
  if (weights.length > 1) requestAnimationFrame(() => drawWeight(chart, eventsOf("weight").slice(0, 24).reverse(), u));
}
