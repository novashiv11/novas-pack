// Home (Today): the day's checklist, what's due, today so far, then the partner card and extras folded behind one row,
// and one gentle nudge.

import { planSheet, weekAndSticker, showUpDates } from "./doitnow.js";
import { todayCard, todaySoFar } from "./today.js";
import { S, pet, setSetting, logsOf, LOG_TYPES } from "../state.js";
import { h, put, em, fmtDate, isoDate, ageText, sinceText, isAnniversary, sheet, parseDate } from "../util.js";
import { healthAlerts, backupDue, dueItems, dueText } from "../logic.js";
import { speciesOf, openPetSheet, markGiven, doneRecord } from "../forms.js";
import { sampleStrip, alertCard, avatar, chevron } from "./parts.js";
import { gameOf, trainerFor, bar, ring } from "./gameui.js";
import { openPartnerCard } from "../sharecard.js";
import { exportBackup } from "./more.js";
import { installCard } from "../install.js";

export function home(main) {
  const p = pet();
  const care = !!S.settings.careOnly;
  const a = care ? null : gameOf(p);
  const tr = care ? null : trainerFor(p);
  put(main,
    sampleStrip(p),
    alertCard(healthAlerts(p, Date.now()), p),
    todayCard(p),
    dueToday(p),
    todaySoFar(p),
    care ? careLinks() : homeMore(p, a, tr),
    nudge(p, a, tr),
  );
  // Once, right after the first thing they log: offer the daily reminder (the only trigger a no-server app has).
  if (!p.sample && !S.settings.plan && !S.settings.planAsked && logsOf(p.id).length >= 1) {
    setTimeout(() => {
      if (document.querySelector("dialog[open]") || S.settings.planAsked) return;
      setSetting("planAsked", Date.now()).catch(() => {});
      planSheet(p);
    }, 2500);
  }
}

// ---------- the top bar's stat pills (app.js draws them): honest numbers, each one explained in a small sheet ----------
/** The three pills on the right of the top bar: days this week, partner level, stickers. Real numbers only; none in care-diary mode. */
export function statPills(p) {
  if (!p || S.settings.careOnly) return [];
  const ws = weekAndSticker(p), a = gameOf(p), stickers = showUpDates(p).length;
  const pill = (k, e, text, label, fn) => h("button.stat-pill", { type: "button", "data-k": `pill-${k}`, "aria-label": `${label}. What's this?`, onclick: fn },
    h("span.sp-e", { "aria-hidden": "true" }, e), h("b.sp-n", { "aria-hidden": "true" }, text));
  const sample = p.sample ? h("p.small.muted.ss-note", "These are example numbers from Nova's sample.") : null;
  const big = (e, title, text) => [h("div.ss-top", h("span.ss-e", { "aria-hidden": "true" }, e), h("p.ss-title", title)), h("p.ss-text", text)];
  return [
    pill("week", "🗓️", `${ws.count}/7`, `${ws.count} of 7 days this week`, () => sheet("Days this week", (body, close) => put(body,
      big("🗓️", `${ws.count} of 7 days`, "A day counts when you spend time together: training, a walk, play or a care task like brushing. Meals and poop checks are care admin, so they don't. Three days wins the week."),
      h("div.ss-week", { role: "img", "aria-label": `${ws.count} of 7 days this week` }, ws.week.map((d) => h(`span.ss-day${d.on ? ".on" : ""}${d.today ? ".today" : ""}`, { "aria-hidden": "true" },
        h("i", "SMTWTFS"[parseDate(d.date).getDay()]), h("b", d.on ? "✓" : "")))),
      h("p.ss-text", "Miss a day? Nothing is lost. Monday is a fresh start."),
      sample,
      h("button.btn.btn-blue.wide", { type: "button", onclick: close }, "Got it")))),
    pill("level", "⭐", String(a.level.level), `${p.name} is level ${a.level.level}`, () => sheet(`${p.name}'s level`, (body) => put(body,
      big("⭐", `Level ${a.level.level}`, a.level.max ? `The top level, with ${a.xp} XP.` : `${a.level.into} of ${a.level.need} XP to level ${a.level.level + 1}.`),
      bar(a.level.max ? 1 : a.level.into, a.level.max ? 1 : a.level.need, "gold"),
      h("p.ss-text", "XP comes from real minutes together: training sessions, walks, stamps and quests. Never from opening the app, likes or shares."),
      sample,
      h("a.btn.btn-blue.wide", { href: "#/train", "data-k": "pill-go-train" }, "Train for XP")))),
    pill("stickers", "🍪", String(stickers), `${stickers} sticker${stickers === 1 ? "" : "s"}`, () => sheet("Stickers", (body) => put(body,
      big("🍪", `${stickers} sticker${stickers === 1 ? "" : "s"}`, "One for every day you showed up with your pet. Never lost, never bought."),
      sample,
      h("a.btn.btn-blue.wide", { href: "#/more/jar", "data-k": "pill-go-jar" }, "See the treat jar")))),
  ];
}

// Below Today, the game extras sit behind one row so Home stays short. Open/closed is remembered for this visit.
let moreOpen = false;
function homeMore(p, a, tr) {
  const lv = a.level;
  const d = h("details.home-more", { open: moreOpen, ontoggle: (e) => { moreOpen = e.currentTarget.open; } },
    h("summary", { "data-k": "home-more" },
      h("span.hm-av", { "aria-hidden": "true" }, avatar(p, 36)),
      h("span.hm-t", h("b", `${p.name}: level ${lv.level}`), h("span", lv.max ? "Top level" : `${lv.need - lv.into} XP to level ${lv.level + 1} · badges, art, journal`))),
    partnerCard(p, a, tr),
    extras(p, a, tr));
  return d;
}

function careLinks() {
  const tile = (href, e, label, k) => h("a.ex-tile", { href, "data-k": k }, h("span.ex-e", { "aria-hidden": "true" }, e), h("span.ex-l", label));
  return h("nav.extras.care-links", { "aria-label": "Care diary" },
    tile("#/health", "🩺", "Health", "care-health"), tile("#/health/food", "🍽️", "Food", "care-food"),
    tile("#/health/vet", "📋", "Vet summary", "care-vet"), tile("#/more/profile", "📇", "Contacts", "care-profile"));
}

function stageText(p, a) {
  const age = ageText(p.birthday);
  const home = p.homeSince ? (isAnniversary(p.homeSince) ? "🎉 Gotcha day!" : sinceText(p.homeSince) ? `home ${sinceText(p.homeSince)}` : "") : "";
  if (a.stage) return [`${a.stage.label} · ${age}`, home].filter(Boolean).join(" · ");
  if (p.species === "dog") return home ? (home.startsWith("🎉") ? home : `🏡 ${home}`) : null;
  return [speciesOf(p.species).label, age, home].filter(Boolean).join(" · ");
}

function partnerCard(p, a, tr) {
  const st = stageText(p, a);
  const stats = a.stats.filter((s) => !s.na);
  const lv = a.level;
  return h("section.partner", { "aria-labelledby": "partner-name" },
    h("div.partner-top",
      h("div.partner-av", avatar(p, 72)),
      h("div.partner-id",
        h("p.partner-eyebrow", p.sample ? "Sample partner" : "Your partner"),
        h("h2.partner-name", { id: "partner-name" }, p.name),
        st ? h("p.partner-stage", st)
          : h("button.linkish.partner-stage", { type: "button", "data-k": "add-bday", onclick: () => openPetSheet(p) }, "+ Add birthday")),
      h("div.lv-medal", h("span.lv-l", "Level"), h("b.lv-n", String(lv.level)))),
    h("div.xp-row",
      h("p.xp-text", lv.max ? `Level ${lv.level}: the top. ${a.xp} XP` : h("span", h("b", `${lv.into} / ${lv.need} XP`), ` to level ${lv.level + 1}`)),
      bar(lv.max ? 1 : lv.into, lv.max ? 1 : lv.need, "gold")),
    stats.length
      ? h("details.stats-fold", h("summary", "Stats"), h("ul.stats", { "aria-label": `${p.name}'s stats, out of 100` }, stats.map((s) => h("li",
        h("span.st-l", s.label), bar(s.value, 100), h("b.st-v", String(s.value), h("span.vh", " out of 100"))))))
      : null,
    h("div.partner-actions",
      p.sample ? h("span") : h("button.btn.btn-line.sm", { type: "button", "data-k": "share-card", onclick: () => openPartnerCard(p, a, tr) }, em("📸"), " Share card"),
      h("a.text-link", { href: "#/train" }, "Skills", chevron())));
}

// ---------- due today ----------
/** Medicines and records due today or overdue, for every pet (sample world or real), with one tap to mark them. */
function dueToday(p) {
  const pets = p.sample ? S.pets.filter((x) => x.sample) : S.pets.filter((x) => !x.sample && !x.archivedAt);
  const rows = [];
  for (const x of pets) {
    for (const it of dueItems(x.id)) {
      if (it.kind === "record" && it.st.state === "soon") continue;
      if (it.kind === "med" && x.id === p.id) continue; // on the Today list
      if (it.kind === "med") {
        const st = it.st;
        rows.push(h("li.due-row",
          h("span.due-row-t", h("b", `${it.med.name}`), pets.length > 1 ? ` · ${x.name}` : "", h("span.small.muted.block", st.daily ? `${st.given} of ${st.need} given today${st.next ? ` · next ${st.next}` : ""}` : st.overdue ? "Overdue" : "Due today")),
          h("button.btn.btn-blue.sm", { type: "button", "data-k": `home-give-${it.med.id}`, onclick: () => markGiven(it.med) }, "Given", h("span.vh", `: ${it.med.name}`))));
      } else {
        rows.push(h("li.due-row",
          h("span.due-row-t", h("b", it.rec.name), pets.length > 1 ? ` · ${x.name}` : "", h("span.small.muted.block", dueText(it.st))),
          h("button.btn.btn-line.sm", { type: "button", "data-k": `home-done-${it.rec.id}`, onclick: () => doneRecord(it.rec) }, "Done", h("span.vh", `: ${it.rec.name}`))));
      }
    }
  }
  if (!rows.length) return null;
  return h("section.due-today", { "aria-labelledby": "dt-h" },
    h("h2.sec-title", { id: "dt-h" }, "💊 Due today"),
    h("ul.due-rows", rows.slice(0, 6)),
    rows.length > 6 ? h("a.text-link", { href: "#/health" }, `${rows.length - 6} more in Health`) : null);
}

/** Everything else is one tap away, as a row of icons (less text on Home). */
function extras(p, a, tr) {
  const earned = a.badges.filter((b) => b.earned).length;
  const tile = (href, e, label, k) => h("a.ex-tile", { href, "data-k": k }, h("span.ex-e", { "aria-hidden": "true" }, e), h("span.ex-l", label));
  return h("nav.extras", { "aria-label": "More to explore" },
    tile("#/studio", "🎨", "Art", "ex-art"),
    tile("#/more/jar", "🍪", "Stickers", "ex-jar"),
    tile("#/more/badges", "🏅", earned ? `Badges ${earned}` : "Badges", "ex-badges"),
    tile("#/journal", "📓", "Journal", "ex-journal"),
    tile("#/trainer", "🎓", tr.rank.name, "ex-trainer"));
}

// ---------- quests and the nudge ----------
function questHref(q) {
  if (q.id === "skill") return `#/train/${encodeURIComponent(q.skillId)}`;
  if (q.id === "adventure" || q.id === "walks") return "#/adventures";
  return "#/health";
}
export function weekly(p, a) {
  const w = a.weekly;
  return h("section.sec.week-sec", { "aria-labelledby": "wk-h" },
    h("div.sec-row", h("h2.sec-title", { id: "wk-h" }, "This week's quests"), h("span.small.muted", `${w.doneCount} of ${w.quests.length} done`)),
    h("ul.quests", w.quests.map((q) => h(`li${q.done ? ".done" : ""}`,
      h("a.quest", { href: questHref(q) },
        ring(q.progress, q.target, q.done),
        h("span.q-body", h("span.q-text", q.text), h("span.q-meta", q.done ? "Done. +30 trainer XP" : `${q.progress} of ${q.target} · +30 trainer XP`)),
        chevron())))),
    h("p.small.muted", w.allDone ? `All 3 done: +50 bonus XP for ${p.name}. Lovely week.` : "All 3 by Sunday: +50 bonus XP. Missed? Monday is a fresh start."));
}

function nudge(p, a, tr) {
  if (p.sample) return null;
  const logs = logsOf();
  const now = Date.now();
  // Backing up matters more than installing once there's something to lose (3+ logs).
  const backupFirst = logs.length >= 3 && backupDue(now);
  let card = null;
  if (!backupFirst) { try { card = installCard(); } catch { card = null; } }
  if (card) return h("div.nudge-slot", card);
  if (!logs.length) return null;
  if (backupDue(now)) {
    return h("aside.nudge", { "aria-labelledby": "nudge-h" },
      h("h2.nudge-h", { id: "nudge-h" }, "Back up the diary?"),
      h("p", S.settings.lastBackup ? `Last backup ${fmtDate(S.settings.lastBackup, { day: "numeric", month: "short" })}. ` : "It lives only on this phone. ",
        "One file in your email or cloud drive keeps it safe if the phone is lost or cleared."),
      h("div.row-btns.left",
        h("button.btn.btn-blue.sm", { type: "button", "data-k": "nudge-backup", onclick: exportBackup }, "Back up now"),
        h("button.btn.btn-line.sm", { type: "button", onclick: () => setSetting("backupSnooze", now, { quiet: false }) }, "Not now")));
  }
  const days = new Set(logs.filter((e) => LOG_TYPES.includes(e.type)).map((e) => isoDate(new Date(e.at)))).size;
  if (!S.settings.partnerCardOffered && days >= 7 && a && tr) {
    return h("aside.nudge.nudge-card", { "aria-labelledby": "nudge-h" },
      h("h2.nudge-h", { id: "nudge-h" }, `A week in. Share ${p.name}'s card?`),
      h("p", "Level, stats and badges on one image. Made on your phone; the photo never leaves it unless you share it."),
      h("div.row-btns.left",
        h("button.btn.btn-blue.sm", { type: "button", onclick: async () => { await setSetting("partnerCardOffered", true); openPartnerCard(p, a, tr); } }, "Make the card"),
        h("button.btn.btn-line.sm", { type: "button", onclick: () => setSetting("partnerCardOffered", true, { quiet: false }) }, "Not now")));
  }
  return null;
}
