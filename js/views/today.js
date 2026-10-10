// Today (due list, quick log, timeline), the poop log, and the first-run welcome.

import { S, pet, eventsOf, setSetting } from "../state.js";
import { h, put, em, fmtTime, fmtDay, fmtDate, startOfDay, DAY, toast } from "../util.js";
import { dueItems, dueText, poopAlerts, poopWeek, scaleFor, freqText } from "../logic.js";
import { eventSheet, logMeal, logTreat, logWalk, medGivenSheet, markGiven, markRecordDone, petForm, slug } from "../forms.js";
import { pageHead, sampleBanner, alertCard, emptyState, eventList, agoSpan, vetFirst, NOVA } from "./parts.js";
import { addSample } from "../sample.js";
import * as ics from "../ics.js";
import { exportBackup, isStandalone, importForm } from "./more.js";

export function today(main) {
  const p = pet();
  const now = Date.now();
  const todays = S.events.filter((e) => e.petId === p.id && e.at >= startOfDay(now) && e.at < startOfDay(now) + DAY).sort((a, b) => b.at - a.at);
  const lastPoop = eventsOf("poop")[0], lastMeal = eventsOf("meal")[0], lastWalk = eventsOf("walk")[0];

  put(main, 
    sampleBanner(p),
    alertCard(poopAlerts(p)),
    nudge(),
    pageHead("Today", `${p.name} · ${new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}`),
    dueSection(p),
    h("section.sec", { "aria-labelledby": "ql-h" },
      h("h2.sec-title", { id: "ql-h" }, "Quick log"),
      h("div.ql-grid",
        qlBtn("poop", "💩", "Poop", () => eventSheet("poop")),
        qlBtn("meal", "🍽️", "Meal", logMeal),
        qlBtn("treat", "🦴", "Treat", logTreat),
        qlBtn("med", "💊", "Medicine", medGivenSheet),
        qlBtn("walk", "🚶", "Walk", logWalk),
        qlBtn("training", "🎓", "Training", () => eventSheet("training"))),
      h("ul.lasts",
        h("li", h("a", { href: "#/poop" }, em("💩"), " Last poop: ", lastPoop ? agoSpan(lastPoop.at) : "not logged yet")),
        h("li", em("🍽️"), " Last meal: ", lastMeal ? `${fmtDay(lastMeal.at) === "Today" ? "" : fmtDay(lastMeal.at) + " "}${fmtTime(lastMeal.at)}` : "not logged yet"),
        lastWalk ? h("li", em("🚶"), " Last walk: ", agoSpan(lastWalk.at)) : null)),
    h("section.sec", { "aria-labelledby": "tl-h" },
      h("h2.sec-title", { id: "tl-h" }, "Today's timeline"),
      todays.length
        ? eventList(todays, (e) => eventSheet(e.type, e))
        : emptyState("Nothing logged yet today. Tap a button above: it takes one second.")),
  );
}

function qlBtn(key, emoji, label, fn) {
  return h("button.ql", { type: "button", "data-k": `ql-${key}`, onclick: fn }, h("span.ql-em", { "aria-hidden": "true" }, emoji), h("span.ql-l", label));
}

function dueSection(p) {
  const items = dueItems(p.id);
  const sec = h("section.sec", { "aria-labelledby": "due-h" }, h("h2.sec-title", { id: "due-h" }, "Due and overdue"));
  if (!items.length) {
    const any = S.records.some((r) => r.petId === p.id) || S.meds.some((m) => m.petId === p.id);
    put(sec, any
      ? h("p.all-clear", em("✅"), " Nothing due this week. Nice.")
      : emptyState(`Add ${p.name}'s vaccines, flea and worm treatments, or medicines, and they'll show here when due.`,
        h("a.btn.btn-line.sm", { href: "#/health/vaccines" }, "Add vaccines"),
        h("a.btn.btn-line.sm", { href: "#/health/meds" }, "Add a medicine")));
    return sec;
  }
  put(sec, h("ul.due-list", items.map((it) => {
    if (it.kind === "record") {
      const r = it.rec;
      return h(`li.due-card.${it.st.state}`,
        h("span.due-em", { "aria-hidden": "true" }, r.kind === "vaccine" ? "💉" : "🛡️"),
        h("div.due-body",
          h("p.due-name", r.name),
          h("p.due-when", h("b", dueText(it.st)), ` · ${fmtDate(r.nextDue, { day: "numeric", month: "short" })}`)),
        h("div.due-actions",
          h("button.btn.btn-gold.sm", { type: "button", "data-k": `done-${r.id}`, onclick: () => markRecordDone(r) }, "Mark done", h("span.vh", `: ${r.name}`)),
          h("button.btn.btn-line.sm", { type: "button", onclick: () => calRecord(p, r) }, "Add to calendar", h("span.vh", `: ${r.name}`))));
    }
    const m = it.med, st = it.st;
    return h(`li.due-card.${st.overdue ? "overdue" : "today"}`,
      h("span.due-em", { "aria-hidden": "true" }, "💊"),
      h("div.due-body",
        h("p.due-name", m.name),
        h("p.due-when", h("b", st.daily ? `${st.given} of ${st.need} given today` : dueText({ state: st.overdue ? "overdue" : "today", days: -st.days })),
          st.daily && st.next ? ` · next ${st.next}` : "", ` · ${freqText(m)}`),
        m.dose ? h("p.due-dose", "Dose (from your vet): ", m.dose) : null),
      h("div.due-actions",
        h("button.btn.btn-gold.sm", { type: "button", "data-k": `give-${m.id}`, onclick: () => markGiven(m) }, "Mark given", h("span.vh", `: ${m.name}`))));
  })));
  return sec;
}

export function calRecord(p, r) {
  if (!r.nextDue) { toast("Add a next due date first."); return; }
  const text = ics.dueEvent({ uid: r.id, title: `${p.name}: ${r.name} due`, due: r.nextDue, note: r.note });
  ics.download(`${slug(p.name)}-${slug(r.name)}.ics`, text);
  toast("Calendar file saved. Open it to add the reminder (alarm the day before).");
}

// One gentle nudge at a time: back up (monthly), or install (once).
function nudge() {
  const real = S.pets.some((p) => !p.sample);
  if (!real) return null;
  const now = Date.now(), MONTH = 30 * DAY;
  const since = Math.max(S.settings.lastBackup || 0, S.settings.backupSnooze || 0, S.settings.firstUse || now);
  if (now - since > MONTH) {
    return h("aside.nudge", { "aria-label": "Backup reminder" },
      h("p", h("b", "Back up?"), " It's been a month. A backup file keeps your diary safe if your phone is lost or cleared."),
      h("div.row-btns.left",
        h("button.btn.btn-blue.sm", { type: "button", onclick: exportBackup }, "Back up now"),
        h("button.btn.btn-line.sm", { type: "button", onclick: () => setSetting("backupSnooze", now, { quiet: false }) }, "Not now")));
  }
  if (!isStandalone() && !S.settings.installDismissed) {
    return h("aside.nudge", { "aria-label": "Install tip" },
      h("p", h("b", "Add Nova's Pack to your Home Screen."), " Phones can clear website data that isn't used for a while. Installed, your diary stays put."),
      h("div.row-btns.left",
        h("a.btn.btn-blue.sm", { href: "#/more/install" }, "Show me how"),
        h("button.btn.btn-line.sm", { type: "button", onclick: () => setSetting("installDismissed", true, { quiet: false }) }, "Not now")));
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
    const desc = `${fmtDay(d.day)}: ${d.count} poop${d.count === 1 ? "" : "s"}${d.flagged ? ", something unusual noted" : ""}${d.count && s ? `, least typical: ${s.label}` : ""}`;
    return h(`li.ws-day${d.flagged ? ".flag" : ""}${d.count && d.worst !== 3 ? ".off" : ""}${d.count ? ".has" : ""}`,
      h("span.ws-l", { "aria-hidden": "true" }, label),
      h("span.ws-n", { "aria-hidden": "true" }, d.count ? String(d.count) : "·"),
      h("span.vh", desc));
  }));
  const recent = poops.filter((e) => Date.now() - e.at < 30 * DAY);
  put(main, 
    sampleBanner(p),
    h("a.back", { href: "#/today" }, "← Today"),
    pageHead("Poop log", `${p.name} · last 30 days`),
    alertCard(poopAlerts(p)),
    h("section.sec", { "aria-labelledby": "ws-h" },
      h("h2.sec-title", { id: "ws-h" }, "This week"),
      strip,
      h("p.small.muted", "Numbers are poops per day. Tan means something wasn't typical (looser, harder or flagged)."),
      h("button.btn.btn-gold.wide", { type: "button", "data-k": "log-poop", onclick: () => eventSheet("poop") }, em("💩"), " Log a poop")),
    h("section.sec", { "aria-labelledby": "ph-h" },
      h("h2.sec-title", { id: "ph-h" }, "History"),
      recent.length ? eventList(recent, (e) => eventSheet("poop", e), { showDay: true }) : emptyState("No poops logged in the last 30 days.")),
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
      h("a.back", { href: "#/welcome" }, "← Back"),
      pageHead("Add your pet", "Only the name is needed. You can add the rest later."));
    petForm(main, null, (row) => { toast(`Welcome, ${row.name}.`); location.hash = "#/today"; });
    return;
  }
  put(main, h("section.welcome",
    h("img.disc.welcome-nova", { src: NOVA, alt: "", width: "112", height: "112" }),
    h("p.eyebrow", "Nova's Pack · the pet care diary"),
    h("h1", { tabindex: "-1", id: "page-title" }, "Your pet's whole routine, in one place."),
    h("p.lede", "Private on your phone. Free. No account."),
    h("ul.feature-list",
      h("li", em("💩"), " Poop, meals and walks in one tap"),
      h("li", em("💉"), " Vaccines and medicines, with what's due"),
      h("li", em("⚖️"), " Weight, food and vet notes"),
      h("li", em("🎓"), " Training, step by step with Nova")),
    h("p.bubble.welcome-bubble", "I'm Nova, professional human handler. I keep my human's diary in order. Let's do yours."),
    h("div.welcome-ctas",
      h("a.btn.btn-gold.wide", { href: "#/welcome/add" }, "Add your pet"),
      h("button.btn.btn-line.wide", { type: "button", onclick: async () => {
        try { await addSample(); location.hash = "#/today"; } catch { toast("Couldn't save on this device. Private browsing?"); }
      } }, "No pet yet? Explore Nova's sample diary")),
    h("details.more-box.restore", h("summary", "Have a backup? Restore it"), importForm("replace")),
    h("p.small.muted", "Everything stays on this device. ", h("a", { href: "privacy.html" }, "Privacy notice"), " · ", h("a", { href: "card.html" }, "Pack Card maker"))));
}

