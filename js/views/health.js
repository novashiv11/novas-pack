// Health: vaccines and preventives, medicines, weight (with a chart), vet visits, and the printable vet summary.

import { pet, eventsOf, forPet, units, setSetting, save } from "../state.js";
import { h, put, em, fmtDate, fmtTime, isoDate, uid, toast, ageText, DAY } from "../util.js";
import { currentRecords, historyOf, recordStatus, dueText, medStatus, medIsActive, freqText, dosesOf, fmtWeight, toUnit, fromUnit, flagLabel, scaleFor } from "../logic.js";
import { recordSheet, markRecordDone, medSheet, markGiven, eventSheet, speciesOf, slug } from "../forms.js";
import { pageHead, sampleBanner, emptyState, vetFirst, eventList, avatar } from "./parts.js";
import { calRecord } from "./today.js";
import * as ics from "../ics.js";

const TABS = [["vaccines", "Vaccines"], ["meds", "Medicines"], ["weight", "Weight"], ["vet", "Vet"]];

export function health(main, arg) {
  const p = pet();
  const tab = TABS.some(([k]) => k === arg) ? arg : "vaccines";
  put(main, 
    sampleBanner(p),
    pageHead("Health", p.name),
    h("nav.tabs", { "aria-label": "Health sections" }, TABS.map(([k, label]) =>
      h("a", { href: `#/health/${k}`, "aria-current": k === tab ? "page" : null }, label))),
  );
  ({ vaccines, meds, weight, vet })[tab](main, p);
  put(main, vetFirst());
}

// ---------- vaccines and preventives ----------
function vaccines(main, p) {
  const cur = currentRecords(p.id);
  put(main, h("div.row-btns.left.top-actions",
    h("button.btn.btn-blue", { type: "button", "data-k": "add-rec", onclick: () => recordSheet() }, em("➕"), " Add vaccine or preventive")));
  for (const [kind, title] of [["vaccine", "Vaccines"], ["preventive", "Flea, worm and other preventives"]]) {
    const list = cur.filter((r) => r.kind === kind);
    put(main, h("section.sec", { "aria-labelledby": `h-${kind}` },
      h("h2.sec-title", { id: `h-${kind}` }, em(kind === "vaccine" ? "💉" : "🛡️"), " ", title),
      list.length ? h("ul.cards", list.map((r) => recCard(p, r))) : emptyState(kind === "vaccine"
        ? "Nothing yet. Copy the last ones from the vaccination card or pet passport."
        : "Nothing yet. Add flea, tick or worm treatments to see when they're due.")));
  }
}
function recCard(p, r) {
  const st = recordStatus(r);
  const hist = historyOf(r);
  const pill = st.state === "overdue" ? ["overdue", dueText(st)] : st.state === "today" ? ["today", "Due today"] : st.state === "soon" ? ["soon", dueText(st)] : st.state === "later" ? ["ok", "Up to date"] : ["none", "No next date"];
  return h("li.card",
    h("div.card-top", h("h3", r.name), h(`span.pill.${pill[0]}`, pill[1])),
    h("p.small", `Given ${r.given ? fmtDate(r.given) : "date unknown"}`, r.nextDue ? ` · Next due ${fmtDate(r.nextDue)}` : ""),
    r.note ? h("p.small.muted", r.note) : null,
    h("div.row-btns.left",
      st.state === "overdue" || st.state === "today" || st.state === "soon"
        ? h("button.btn.btn-gold.sm", { type: "button", "data-k": `done-${r.id}`, onclick: () => markRecordDone(r) }, "Mark done", h("span.vh", `: ${r.name}`)) : null,
      r.nextDue ? h("button.btn.btn-line.sm", { type: "button", onclick: () => calRecord(p, r) }, "Add to calendar", h("span.vh", `: ${r.name}`)) : null,
      h("button.btn.btn-line.sm", { type: "button", "data-k": `edit-${r.id}`, onclick: () => recordSheet(r) }, "Edit", h("span.vh", `: ${r.name}`))),
    hist.length > 1 ? h("details.mini",
      h("summary", `History (${hist.length})`),
      h("ul.hist", hist.map((x) => h("li",
        `${x.given ? fmtDate(x.given) : "?"}${x.nextDue ? ` → next ${fmtDate(x.nextDue)}` : ""} `,
        h("button.mini-btn", { type: "button", onclick: () => recordSheet(x) }, "Edit", h("span.vh", ` ${x.name} given ${x.given || ""}`)))))) : null);
}

// ---------- medicines ----------
function meds(main, p) {
  const all = forPet("meds");
  const active = all.filter((m) => medIsActive(m) || (m.start && m.start > isoDate()));
  const past = all.filter((m) => !active.includes(m));
  put(main, 
    h("div.row-btns.left.top-actions",
      h("button.btn.btn-blue", { type: "button", "data-k": "add-med", onclick: () => medSheet() }, em("➕"), " Add a medicine")),
    h("p.note-line", em("✍️"), " Type the dose exactly as your vet wrote it. Nova's Pack never suggests a dose."),
    h("section.sec", { "aria-labelledby": "h-meds" },
      h("h2.sec-title", { id: "h-meds" }, em("💊"), " Current medicines"),
      active.length ? h("ul.cards", active.map((m) => medCard(p, m))) : emptyState("No current medicines.")),
    past.length ? h("details.more-box",
      h("summary", `Finished medicines (${past.length})`),
      h("ul.cards", past.map((m) => medCard(p, m)))) : null);
}
function medCard(p, m) {
  const st = medStatus(m);
  const last = dosesOf(m)[0];
  let status = "Finished";
  if (st.active) status = st.daily ? `${st.given} of ${st.need} given today` : st.due ? (st.overdue ? "Overdue" : "Due today") : st.dueDate ? `Next ${fmtDate(st.dueDate, { day: "numeric", month: "short" })}` : "Done";
  else if (m.start && m.start > isoDate()) status = `Starts ${fmtDate(m.start)}`;
  return h("li.card",
    h("div.card-top", h("h3", m.name), h(`span.pill.${st.due ? (st.overdue ? "overdue" : "today") : "ok"}`, status)),
    h("p.small", h("b", "Dose: "), m.dose || "not written down"),
    h("p.small.muted", `${freqText(m)}${m.times && m.times.length && m.freq !== "weekly" && m.freq !== "monthly" ? ` at ${m.times.slice(0, m.freq === "twice" ? 2 : 1).join(" and ")}` : ""} · from ${m.start ? fmtDate(m.start) : "?"}${m.end ? ` to ${fmtDate(m.end)}` : ""}`),
    last ? h("p.small.muted", `Last given ${fmtDate(last.at, { day: "numeric", month: "short" })} at ${fmtTime(last.at)}`) : null,
    m.note ? h("p.small.muted", m.note) : null,
    h("div.row-btns.left",
      st.active ? h("button.btn.btn-gold.sm", { type: "button", "data-k": `give-${m.id}`, onclick: () => markGiven(m) }, "Mark given", h("span.vh", `: ${m.name}`)) : null,
      st.active || (m.start && m.start > isoDate()) ? h("button.btn.btn-line.sm", { type: "button", onclick: () => calMed(p, m) }, "Add to calendar", h("span.vh", `: ${m.name}`)) : null,
      h("button.btn.btn-line.sm", { type: "button", "data-k": `edit-${m.id}`, onclick: () => medSheet(m) }, "Edit", h("span.vh", `: ${m.name}`))));
}
function calMed(p, m) {
  const text = ics.medEvents({ uid: m.id, title: `${p.name}: ${m.name}`, start: m.start || isoDate(), end: m.end, freq: m.freq, times: m.times, everyDays: m.everyDays, dose: m.dose });
  ics.download(`${slug(p.name)}-${slug(m.name)}.ics`, text);
  toast("Calendar file saved. Open it to add repeating reminders.");
}

// ---------- weight ----------
function weight(main, p) {
  const u = units();
  const list = eventsOf("weight");
  const latest = list[0];
  const input = h("input", { type: "number", inputmode: "decimal", min: "0", step: "0.1", id: "w-in", required: true });
  const err = h("p.form-error", { role: "alert" });
  const form = h("form.inline-form", { novalidate: true, onsubmit: async (e) => {
    e.preventDefault();
    const v = parseFloat(input.value);
    if (!(v > 0)) { err.textContent = "Enter a weight above 0."; input.focus(); return; }
    const ev = { id: uid(), petId: p.id, type: "weight", at: Date.now(), kg: fromUnit(v, u) };
    if (p.sample) ev.sample = true;
    await save("events", ev);
    toast(`Weight saved: ${fmtWeight(ev.kg, u)}.`);
  } },
  h("div.field", h("label", { for: "w-in" }, `Today's weight in ${u}`), h("div.input-row", input, h("button.btn.btn-blue", { type: "submit", "data-k": "w-save" }, "Save"))), err);

  const unitSwitch = h("div.seg-btns.small-seg", { role: "group", "aria-label": "Weight units" }, ["kg", "lb"].map((x) =>
    h("button", { type: "button", "aria-pressed": String(x === u), "data-k": `unit-${x}`, onclick: () => setSetting("units", x, { quiet: false }) }, x)));

  let change = null;
  if (list.length > 1) {
    const prev = list.find((e) => latest.at - e.at > 25 * DAY) || list[list.length - 1];
    const d = toUnit(latest.kg - prev.kg, u);
    change = `${d >= 0 ? "+" : "−"}${Math.abs(Math.round(d * 10) / 10)} ${u} since ${fmtDate(prev.at, { day: "numeric", month: "short" })}`;
  }
  const chart = h("div.chart", { id: "weight-chart" });
  put(main, 
    h("section.sec", { "aria-labelledby": "h-w" },
      h("div.sec-row", h("h2.sec-title", { id: "h-w" }, em("⚖️"), " Weight"), unitSwitch),
      latest ? h("p.big-num", fmtWeight(latest.kg, u), change ? h("span.small.muted", ` ${change}`) : null) : null,
      list.length ? chart : emptyState("No weights yet. Weigh your pet once a month: it's one of the easiest ways to spot changes early."),
      form),
    list.length ? h("section.sec", { "aria-labelledby": "h-wl" },
      h("h2.sec-title", { id: "h-wl" }, "All weights"),
      h("ul.w-list", list.map((e) => h("li",
        h("span", fmtDate(e.at)), h("b", fmtWeight(e.kg, u)),
        h("button.mini-btn", { type: "button", "data-k": `ev-${e.id}`, onclick: () => eventSheet("weight", e) }, "Edit", h("span.vh", ` weight on ${fmtDate(e.at)}`)))))) : null);
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
    h("div.row-btns.left.top-actions",
      h("a.btn.btn-blue", { href: "#/summary" }, em("📋"), " Vet summary"),
      h("button.btn.btn-line", { type: "button", "data-k": "add-vet", onclick: () => eventSheet("vet") }, em("➕"), " Add a vet visit")),
    h("p.note-line", "The vet summary is one page with food, medicines, vaccines, weight and recent poop notes. Show it or print it at your next visit."),
    h("section.sec", { "aria-labelledby": "h-vet" },
      h("h2.sec-title", { id: "h-vet" }, em("🩺"), " Vet visits"),
      visits.length ? eventList(visits, (e) => eventSheet("vet", e), { showDay: true }) : emptyState("No vet visits logged yet.")),
    h("p", h("a", { href: "#/poop" }, "Open the poop log")));
}

// ---------- printable vet summary ----------
export function summary(main) {
  const p = pet();
  const u = units();
  const food = forPet("foods").find((f) => f.kind === "food" && !f.until);
  const treats = forPet("foods").filter((f) => f.kind === "treat" && f.inUse !== false);
  const medsNow = forPet("meds").filter((m) => medIsActive(m));
  const recs = forPet("records").sort((a, b) => (b.given || "").localeCompare(a.given || "")).slice(0, 5);
  const weights = eventsOf("weight").slice(0, 5);
  const since = Date.now() - 14 * DAY;
  const flagged = eventsOf("poop").filter((e) => e.at >= since && ((e.flags && e.flags.length) || (typeof e.score === "number" && e.score >= 4)));
  const visits = eventsOf("vet").slice(0, 3);
  const row = (k, v) => h("tr", h("th", { scope: "row" }, k), h("td", v));
  const chart = h("div.chart.print-chart");
  put(main, 
    h("div.no-print.row-btns.left",
      h("a.back", { href: "#/health/vet" }, "← Health"),
      h("button.btn.btn-blue.sm", { type: "button", onclick: () => window.print() }, "Print or save as PDF")),
    h("article.summary",
      h("div.sum-head", avatar(p, 56), h("div",
        h("h1", { tabindex: "-1", id: "page-title" }, `${p.name}: vet summary`),
        h("p.small.muted", `Made with Nova's Pack on ${fmtDate(isoDate())}${p.sample ? " · SAMPLE DATA" : ""}`))),
      h("table.sum-table", h("tbody",
        row("Species", speciesOf(p.species).label),
        row("Birthday", p.birthday ? `${fmtDate(p.birthday)} (${ageText(p.birthday)})` : "Not recorded"),
        row("Latest weight", weights[0] ? `${fmtWeight(weights[0].kg, u)} on ${fmtDate(weights[0].at)}` : "Not recorded"),
        row("Current food", food ? [[food.brand, food.product].filter(Boolean).join(" "), food.amount, food.since ? `since ${fmtDate(food.since)}` : ""].filter(Boolean).join(" · ") : "Not recorded"),
        row("Treats in use", treats.length ? treats.map((t) => t.name).join(", ") : "None recorded"),
        row("Allergies / don't feed", p.allergies || "None recorded"))),
      h("h2", "Current medicines"),
      medsNow.length ? h("ul", medsNow.map((m) => h("li", h("b", m.name), ` · dose as written by the vet: ${m.dose || "not written down"} · ${freqText(m)}${m.end ? ` until ${fmtDate(m.end)}` : ""}`))) : h("p", "None recorded."),
      h("h2", "Last 5 vaccines and preventives"),
      recs.length ? h("ul", recs.map((r) => h("li", h("b", r.name), ` · given ${r.given ? fmtDate(r.given) : "?"}${r.nextDue ? ` · next due ${fmtDate(r.nextDue)}` : ""}`))) : h("p", "None recorded."),
      h("h2", "Weight trend"),
      weights.length ? h("ul", weights.map((e) => h("li", `${fmtDate(e.at)}: ${fmtWeight(e.kg, u)}`))) : h("p", "None recorded."),
      weights.length > 1 ? chart : null,
      h("h2", "Poop notes, last 14 days"),
      flagged.length ? h("ul", flagged.map((e) => {
        const s = scaleFor(e.score);
        return h("li", `${fmtDate(e.at, { day: "numeric", month: "short" })} ${fmtTime(e.at)}: ${s ? s.label : ""}${e.flags && e.flags.length ? ` · ${e.flags.map(flagLabel).join(", ")}` : ""}${e.note ? ` · "${e.note}"` : ""}`);
      })) : h("p", `Nothing unusual logged (${eventsOf("poop").filter((e) => e.at >= since).length} poops logged).`),
      h("h2", "Recent vet visits"),
      visits.length ? h("ul", visits.map((e) => h("li", `${fmtDate(e.at)}${e.clinic ? ` · ${e.clinic}` : ""}${e.note ? `: ${e.note}` : ""}`))) : h("p", "None recorded."),
      h("p.small.muted.sum-foot", "Written by the owner in Nova's Pack, a diary app. Not a medical record. Doses are as the owner typed them from the vet's instructions.")));
  if (weights.length > 1) requestAnimationFrame(() => drawWeight(chart, eventsOf("weight").slice(0, 24).reverse(), u));
}
