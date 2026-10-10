// Today (quick log, alerts, due, timeline), the poop log, the first-run welcome, and a few app-shell hooks:
// window.NP_openQuickLog for #/quick/<type>, the "Update ready" toast, the in-app browser banner and
// the route cross-fade.

import { S, pet, eventsOf, setSetting, logsOf, refresh, UI } from "../state.js";
import { h, put, em, fmtDate, isoDate, startOfDay, nextDayStart, DAY, toast, motionOK } from "../util.js";
import { dueItems, dueText, poopWeek, scaleFor, freqText, medIsActive, healthAlerts } from "../logic.js";
import { eventSheet, unwellSheet, logPoop, logMeal, logTreat, logWalk, logTraining, logMed, markGiven, medSheet, deleteMed, calMed,
  calRecord, doneRecord, editRecord, deleteRecord, careTaskOf, petForm } from "../forms.js";
import { pageHead, subBar, sampleStrip, alertCard, emptyState, eventList, agoSpan, vetFirst, moreBtn, cardTitle, chevron, NOVA } from "./parts.js";
import { addSample } from "../sample.js";
import { exportBackup, importForm, cardLink } from "./more.js";
import { installCard, inAppBanner } from "../install.js";

const TILES = [
  ["poop", "Poop", logPoop],
  ["meal", "Meal", logMeal],
  ["treat", "Treat", logTreat],
  ["walk", "Walk", logWalk],
  ["med", "Medicine", logMed],
  ["training", "Training", logTraining],
  ["symptom", "Unwell", () => unwellSheet()],
];

export function today(main) {
  const p = pet();
  const now = Date.now();
  const items = dueItems(p.id);
  const logs = logsOf(p.id);
  const coachFirst = !p.sample && !logs.length;
  const todays = S.events.filter((e) => e.petId === p.id && e.at >= startOfDay(now) && e.at < nextDayStart(now)).sort((a, b) => b.at - a.at);

  put(main,
    sampleStrip(p),
    pageHead("Today", novaSays(p, items, logs)),
    h("section.sec.ql-sec", { "aria-labelledby": "ql-h" },
      h("div.sec-row", h("h2.sec-title", { id: "ql-h" }, "Quick log"),
        h("a.text-link", { href: "#/poop" }, "Poop log", chevron())),
      h("div.ql-grid", TILES.map(([type, label, fn]) => tile(p, type, label, fn, coachFirst && type === "meal")))),
    alertCard(healthAlerts(p, now), p),
    dueSection(p, items),
    nudge(p),
    h("section.sec", { "aria-labelledby": "tl-h" },
      h("h2.sec-title", { id: "tl-h" }, "Today's timeline"),
      todays.length
        ? eventList(todays, (e) => eventSheet(e.type, e))
        : emptyState("Nothing logged yet today. Tap a tile above: one tap, done.")),
  );
}

/** Nova's one line under the title: what she'd say about today. */
function novaSays(p, items, logs) {
  const line = (...kids) => h("p.nova-line", h("img.disc.nova-face", { src: NOVA, alt: "", width: "28", height: "28" }), h("span", h("span.vh", "Nova says: "), ...kids));
  if (!p.sample && !logs.length) return line(`Log ${p.name}'s last meal. One tap.`);
  const hasRecords = S.records.some((r) => r.petId === p.id);
  if (!p.sample && !hasRecords && logs.length <= 5) return line("Nice. Add vaccines next? ", h("a", { href: "#/health/vaccines" }, "Go to Health"));
  if (items.some((it) => (it.kind === "record" ? it.st.state === "overdue" : it.st.overdue))) return line("Something's late. I'm not judging. Much.");
  if (items.length) return line(`${items.length === 1 ? "One thing" : `${items.length} things`} due soon. I'm keeping count.`);
  return line("Nothing due. I checked twice.");
}

function tile(p, type, label, fn, pulse) {
  const last = eventsOf(type, p.id)[0];
  const caption = last ? agoSpan(last.at) : type === "symptom" ? "Checklist" : "Not yet";
  return h(`button.ql.ql-${type}${pulse ? ".pulse" : ""}`, { type: "button", "data-k": `ql-${type}`, onclick: fn },
    h("span.ql-em", { "aria-hidden": "true" }, { poop: "💩", meal: "🍽️", treat: "🦴", walk: "🚶", med: "💊", training: "🎓", symptom: "😟" }[type]),
    h("span.ql-l", label),
    h("span.ql-ago", caption));
}

function dueSection(p, items) {
  if (!items.length) {
    const any = S.records.some((r) => r.petId === p.id) || S.meds.some((m) => m.petId === p.id);
    if (any) return null;
    return h("section.sec", { "aria-labelledby": "due-h" }, h("h2.sec-title", { id: "due-h" }, "Due"),
      emptyState(`Add ${p.name}'s vaccines, flea and worm treatments or medicines, and they'll show here when they're due.`,
        h("a.btn.btn-line.sm", { href: "#/health/vaccines" }, "Add vaccines")));
  }
  const more = items.length - 2;
  return h("section.sec", { "aria-labelledby": "due-h" },
    h("h2.sec-title", { id: "due-h" }, "Due"),
    h("ul.due-list", items.slice(0, 2).map((it) => dueCard(p, it))),
    more > 0 ? h("a.text-link.more-due", { href: "#/health" }, `${more} more due`, chevron()) : null);
}

function dueCard(p, it) {
  if (it.kind === "record") {
    const r = it.rec;
    const task = careTaskOf(p, r);
    return h(`li.card.due-card.${it.st.state}`,
      h("div.due-top",
        h("span.due-em", { "aria-hidden": "true" }, task ? "✨" : r.kind === "vaccine" ? "💉" : "🛡️"),
        h("div.due-body",
          cardTitle(r.name, () => editRecord(r), `due-edit-${r.id}`),
          h("p.due-when", h("b", dueText(it.st)), ` · ${fmtDate(r.nextDue, { day: "numeric", month: "short" })}`))),
      h("div.card-actions",
        h("button.btn.btn-blue.sm", { type: "button", "data-k": `done-${r.id}`, onclick: () => doneRecord(r) }, "Mark done", h("span.vh", `: ${r.name}`)),
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
      h("button.btn.btn-blue.sm", { type: "button", "data-k": `give-${m.id}`, onclick: () => markGiven(m) }, "Mark given", h("span.vh", `: ${m.name}`)),
      moreBtn(m.name, [["Edit", () => medSheet(m)], ["Add to calendar", () => calMed(p, m)], ["Delete", () => deleteMed(m), { danger: true }]])));
}

// One gentle card at a time, for real pets only: install (after the first log), back up (after the 3rd log,
// then every 14 days), and once, the Pack Card (after the first vet summary or 7 days of logs).
function nudge(p) {
  if (p.sample) return null;
  const logs = logsOf();
  if (!logs.length) return null;
  let card = null;
  try { card = installCard(); } catch { card = null; }
  if (card) return h("div.nudge-slot", card);
  const now = Date.now();
  const since = Math.max(S.settings.lastBackup || 0, S.settings.backupSnooze || 0);
  if (logs.length >= 3 && now - since > 14 * DAY) {
    return h("aside.nudge", { "aria-labelledby": "nudge-h" },
      h("h2.nudge-h", { id: "nudge-h" }, "Back up the diary?"),
      h("p", S.settings.lastBackup ? `Last backup ${fmtDate(S.settings.lastBackup, { day: "numeric", month: "short" })}. ` : "It lives only on this phone. ",
        "One file in your email or cloud drive keeps it safe if the phone is lost or cleared."),
      h("div.row-btns.left",
        h("button.btn.btn-blue.sm", { type: "button", "data-k": "nudge-backup", onclick: exportBackup }, "Back up now"),
        h("button.btn.btn-line.sm", { type: "button", onclick: () => setSetting("backupSnooze", now, { quiet: false }) }, "Not now")));
  }
  const days = new Set(logs.map((e) => isoDate(new Date(e.at)))).size;
  if (!S.settings.packCardOffered && (S.settings.summaryViewed || days >= 7)) {
    const go = async (e) => { e.preventDefault(); await setSetting("packCardOffered", true); location.href = cardLink(p); };
    return h("aside.nudge.nudge-card", { "aria-labelledby": "nudge-h" },
      h("h2.nudge-h", { id: "nudge-h" }, `Make ${p.name}'s Pack Card`),
      h("p", `A week of diary. ${p.name} has earned a card. Made on your phone; the photo never leaves it.`),
      h("div.row-btns.left",
        h("a.btn.btn-blue.sm", { href: cardLink(p), onclick: go }, "Make the card"),
        h("button.btn.btn-line.sm", { type: "button", onclick: () => setSetting("packCardOffered", true, { quiet: false }) }, "Not now")));
  }
  return null;
}

// ---------- poop log ----------
export function poopLog(main) {
  const p = pet();
  const poops = eventsOf("poop");
  const week = poopWeek(p.id);
  const strip = h("ol.week-strip", { "aria-label": "Poops in the last 7 days" }, week.map((d) => {
    const label = new Date(d.day).toLocaleDateString(undefined, { weekday: "short" });
    const s = scaleFor(d.worst);
    const desc = `${new Date(d.day).toLocaleDateString(undefined, { weekday: "long" })}: ${d.count} poop${d.count === 1 ? "" : "s"}${d.flagged ? ", something unusual noted" : ""}${d.count && s ? `, least typical: ${s.label}` : ""}`;
    return h(`li.ws-day${d.flagged ? ".flag" : ""}${d.count && d.worst !== 3 && d.worst !== 2 ? ".off" : ""}${d.count ? ".has" : ""}`,
      h("span.ws-l", { "aria-hidden": "true" }, label),
      h("span.ws-n", { "aria-hidden": "true" }, d.count ? String(d.count) : "·"),
      h("span.vh", desc));
  }));
  const recent = poops.filter((e) => Date.now() - e.at < 30 * DAY);
  put(main,
    subBar("Poop log", "#/today", "Back to Today"),
    sampleStrip(p),
    alertCard(healthAlerts(p, Date.now()), p),
    h("section.sec", { "aria-labelledby": "ws-h" },
      h("h2.sec-title", { id: "ws-h" }, "This week"),
      strip,
      h("p.small.muted", "Poops per day. Tan means something wasn't typical (looser, harder or flagged).")),
    h("div.sticky-cta", h("button.btn.btn-blue.wide", { type: "button", "data-k": "log-poop", onclick: () => eventSheet("poop") }, em("💩"), " Log a poop")),
    h("section.sec", { "aria-labelledby": "ph-h" },
      h("h2.sec-title", { id: "ph-h" }, "Last 30 days"),
      recent.length ? eventList(recent, (e) => eventSheet("poop", e), { showDay: true, single: true }) : emptyState("No poops logged in the last 30 days.")),
    S.content.RED_FLAGS.length ? h("details.more-box",
      h("summary", "When to call your vet"),
      h("ul.rf-list", S.content.RED_FLAGS.map((r) => h("li", h("b", r.when), h("p", r.advice))))) : null,
    vetFirst(),
  );
}

// ---------- first run ----------
export function welcome(main, arg) {
  document.title = "Nova's Pack · the pet care diary";
  if (arg === "add") {
    put(main,
      subBar("Add your pet", "#/welcome", "Back"),
      h("p.add-lede", "Who's in your family? Only the name is needed. Free. No account to lose."));
    petForm(main, null, (row) => { toast(`Welcome, ${row.name}. Let's start with one tap.`); location.hash = "#/today"; });
    return;
  }
  put(main, h("section.welcome",
    h("img.disc.welcome-nova", { src: NOVA, alt: "", width: "96", height: "96" }),
    h("p.eyebrow", "Nova's Pack · the pet care diary"),
    h("h1", { tabindex: "-1", id: "page-title" }, "Your pet's whole routine, in one place."),
    h("p.lede", "Private on your phone. Free. No account to lose."),
    h("div.welcome-ctas",
      h("a.btn.btn-blue.wide", { href: "#/welcome/add" }, "Add your pet"),
      h("button.btn.btn-line.wide", { type: "button", onclick: async () => {
        try { await addSample(); location.hash = "#/today"; } catch { toast("Couldn't save on this device. Private browsing?"); }
      } }, "No pet yet? Explore Nova's sample diary")),
    h("ul.welcome-features",
      h("li", em("💩"), " Poop, meals and walks in one tap"),
      h("li", em("💉"), " Vaccines and medicines, with what's due"),
      h("li", em("😟"), " An Unwell checklist that tells you when to call the vet"),
      h("li", em("🎓"), " Training with Nova")),
    h("p.bubble.welcome-bubble", "I'm Nova, professional human handler. I keep my human's diary in order. Let's do yours."),
    h("details.more-box.restore", h("summary", "Have a backup? Restore it"), importForm("replace")),
    h("p.small.muted", "Everything stays on this device. ", h("a", { href: "privacy.html" }, "Privacy notice"), " · ", h("a", { href: "card.html" }, "Pack Card maker"))));
}

// ---------- app-shell hooks ----------

/** #/quick/<type> (home-screen shortcuts) lands here, after app.js has drawn Today. */
const QUICK = { poop: logPoop, meal: logMeal, treat: logTreat, walk: logWalk, training: logTraining, med: logMed, medicine: logMed, unwell: () => unwellSheet(), symptom: () => unwellSheet() };
export function openQuickLog(type) {
  if (!pet()) return;
  const fn = QUICK[String(type || "").toLowerCase()];
  if (fn) fn();
}
window.NP_openQuickLog = openQuickLog;

function showUpdateReady(apply) {
  UI.applyUpdate = apply;
  toast("Update ready. Same diary, fresh paint.", [["Update now", () => apply()]], { ms: 20000 });
  if (/^#\/more/.test(location.hash) && !document.querySelector("dialog[open]")) refresh();
}
let updateHooked = false;
function hookUpdates() {
  if (updateHooked || typeof window.NP_onUpdateReady !== "function") return;
  updateHooked = true;
  window.NP_onUpdateReady(showUpdateReady);
}

function mountInAppBanner() {
  const slot = document.getElementById("inapp-slot");
  if (!slot || slot.childElementCount) return;
  let el = null;
  try { el = inAppBanner(); } catch { el = null; }
  if (el) slot.append(el);
}

/** A 150 ms cross-fade between screens where the browser supports view transitions (and motion is OK). */
function crossFade(e) {
  if (!document.startViewTransition || !motionOK() || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest && e.target.closest('a[href^="#/"]');
  if (!a || a.target || document.querySelector("dialog[open]")) return;
  const href = a.getAttribute("href");
  if (href === location.hash) return;
  e.preventDefault();
  document.startViewTransition(() => new Promise((resolve) => {
    addEventListener("hashchange", () => resolve(), { once: true }); // app.js redraws on hashchange first
    setTimeout(resolve, 300); // never hold the page
    location.hash = href;
  }));
}

hookUpdates();
document.addEventListener("DOMContentLoaded", () => { hookUpdates(); mountInAppBanner(); });
addEventListener("load", hookUpdates);
if (document.readyState !== "loading") mountInAppBanner();
document.addEventListener("click", crossFade);
