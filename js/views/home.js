// Home: your Partner. The partner card (stage, level, XP, 5 stats), "1% today" (one tiny thing for your dog, one for
// you, and Nova's line of the day), the trainer strip, this week's quests, quick logs, badges, and one gentle nudge.

import { doItNowCard, planSheet, weekAndSticker, showUpDates } from "./doitnow.js";
import { todayCard, todaySoFar } from "./today.js";
import { S, pet, setSetting, save, logsOf, LOG_TYPES } from "../state.js";
import { h, put, em, fmtDate, isoDate, ageText, sinceText, isAnniversary, DAY, toast, sheet, parseDate } from "../util.js";
import { healthAlerts, backupDue, dueItems, dueText } from "../logic.js";
import { logWalk, logMeal, logTreat, logPoop, logEggs, eventSheet, speciesOf, openPetSheet, saveError, markGiven, doneRecord } from "../forms.js";
import { sampleStrip, alertCard, avatar, chevron } from "./parts.js";
import { gameOf, trainerFor, trainerName, bar, ring, badgeChip, trainingPicker, howTo } from "./gameui.js";
import { openPartnerCard, openLineCard } from "../sharecard.js";
import { weekBounds } from "../game.js";
import { lineOfDay, youActionOfDay, replyOfDay } from "../../data/quotes.js";
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
    care ? careLinks() : partnerCard(p, a, tr),
    care ? null : extras(p, a, tr),
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

// ---------- 1% today ----------
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

/** The human's 1% for today, as one line with a tick. */
function forYou(p) {
  if (p.sample) return null;
  const today = isoDate();
  const row = S.daily.find((d) => d.id === today) || { id: today, date: today, dogDone: false, youDone: false };
  const id = "tick-youDone";
  return h("section.for-you", { "aria-label": "For you today" },
    h("input", { type: "checkbox", id, "data-k": id, checked: !!row.youDone, onchange: async (e) => {
      try { await save("daily", { ...row, youDone: e.target.checked }); if (e.target.checked) toast(replyOfDay()); } catch (ex) { toast(saveError(ex)); }
    } }),
    h("label", { for: id }, h("b", "For you: "), youActionOfDay()));
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

function lastActive(p) {
  const times = logsOf(p.id).map((e) => e.at);
  const ticks = S.daily.filter((d) => d.dogDone || d.youDone).map((d) => new Date(`${d.date}T12:00`).getTime());
  return Math.max(0, ...times, ...ticks);
}

function onePercent(p, a) {
  const today = isoDate();
  const row = S.daily.find((d) => d.id === today) || { id: today, date: today, dogDone: false, youDone: false };
  const q = a.daily;
  const dogDone = !!(row.dogDone || (q && q.done));
  const both = dogDone && row.youDone;
  const line = lineOfDay();
  const set = async (k, v) => {
    try { await save("daily", { ...row, [k]: v }); } catch (e) { toast(saveError(e)); }
  };
  const dogLabel = q ? `For ${p.name}: ${q.text}` : `For ${p.name}: five minutes of something you both enjoy`;
  const tick = (k, checked, label, extra, disabled) => {
    const id = `tick-${k}`;
    return h("li.tick-row",
      h("input", { type: "checkbox", id, "data-k": id, checked, disabled, onchange: (e) => set(k, e.target.checked) }),
      h("label", { for: id }, label),
      extra);
  };
  const entry = S.journal.find((j) => j.id === today);
  const evening = new Date().getHours() >= 17;
  return h("section.onepct", { "aria-labelledby": "op-h" },
    h("div.op-head", h("h2", { id: "op-h" }, "1% today"), h("span.op-opt", "Optional. Nothing to lose.")),
    h("figure.day-line",
      h("blockquote", h("p", `“${line.text}”`)),
      h("figcaption", line.by ? [`${line.by}`, line.source ? h("span.muted", `, ${line.source}`) : null] : "Nova, today",
        h("button.linkish.share-line", { type: "button", "data-k": "share-line", onclick: () => openLineCard(line) }, "Share", h("span.vh", " today's line")))),
    h("ul.ticks",
      tick("dogDone", dogDone, dogLabel,
        q && !q.done ? h("a.btn.btn-blue.sm.tick-go", { href: `#/train/${encodeURIComponent(q.skillId)}/start` }, "Start", h("span.vh", ` ${q.text}`)) : q && q.done ? h("span.pill.done-pill", "Session logged") : null,
        q && q.done),
      tick("youDone", !!row.youDone, `For you: ${youActionOfDay()}`)),
    q && !q.done ? howTo(q.skillId, `How to do "${q.text}"`, { k: "home-howto" }) : null,
    h("p.nova-reply", { "aria-live": "polite" }, both ? replyOfDay() : dogDone || row.youDone ? "One small thing done. That counts." : ""),
    entry
      ? h("p.journal-line", "Tonight's line: ", h("q", entry.text), " ", h("a", { href: "#/journal" }, "Growth Journal"))
      : evening ? journalPrompt(today)
        : h("p.small.muted", "This evening: one line in your ", h("a", { href: "#/journal" }, "Growth Journal"), "."));
}

/** The one-line evening prompt (also on the journal page). */
export function journalPrompt(date, existing = "") {
  const input = h("input", { type: "text", id: `jr-${date}`, maxlength: "280", value: existing, autocomplete: "off", placeholder: "e.g. she waited at the door. I stayed calm." });
  const err = h("p.form-error", { role: "alert" });
  return h("form.inline-form.journal-form", { novalidate: true, onsubmit: async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) { err.textContent = "Write a few words first. Small is fine."; input.focus(); return; }
    try { await save("journal", { id: date, date, text: text.slice(0, 280), at: Date.now() }); } catch (ex) { err.textContent = saveError(ex); return; }
    toast("Saved in your journal. Private, on this device.");
  } },
  h("label", { for: input.id }, "What went 1% better today, for you or your pet?"),
  h("div.input-row", input, h("button.btn.btn-blue", { type: "submit", "data-k": "jr-save" }, "Save")),
  err);
}

// ---------- trainer, quests, quick log, badges ----------
function trainerStrip(tr, p) {
  return h("a.trainer-strip", { href: "#/trainer", "data-k": "trainer-strip" },
    h("span.ts-ico", { "aria-hidden": "true" }, "🏅"),
    h("span.ts-body",
      h("span.ts-top", h("b", p && p.sample ? "Sample trainer" : trainerName()), ` · App rank: ${tr.rank.name}`),
      bar(tr.next ? tr.into : 1, tr.next ? tr.need : 1),
      h("span.ts-meta", tr.next ? `${tr.xp} XP · ${tr.next.xp - tr.xp} to ${tr.next.name}` : `${tr.xp} XP · top rank`)),
    chevron());
}

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

function quickLog(p) {
  const tile = (k, emoji, label, attrs) => h(attrs.href ? "a.ql" : "button.ql", { "data-k": `ql-${k}`, ...attrs, type: attrs.href ? undefined : "button" },
    h("span.ql-em", { "aria-hidden": "true" }, emoji), h("span.ql-l", label));
  return h("section.sec.ql-sec", { "aria-labelledby": "hq-h" },
    h("h2.sec-title", { id: "hq-h" }, "One-tap log"),
    h("div.ql-grid.home-ql.ql-5",
      tile("meal", "🍽️", "Meal", { onclick: logMeal }),
      tile("treat", "🦴", "Treat", { onclick: logTreat }),
      p.species === "chicken" ? tile("eggs", "🥚", eggLabel(p), { onclick: logEggs }) : null,
      tile("poop", "💩", "Poop", { onclick: logPoop }),
      p.species === "dog" ? tile("walk", "🚶", "Walk", { onclick: logWalk }) : tile("unwell", "😟", "Unwell?", { href: "#/health/unwell" }),
      p.species === "chicken" ? null : S.settings.careOnly ? tile("weight", "⚖️", "Weight", { onclick: () => eventSheet("weight") })
        : tile("training", "🎓", "Train", { onclick: () => trainingPicker(p) })));
}

/** "Eggs" with this week's count, e.g. "Eggs · 12". */
function eggLabel(p) {
  const [w0] = weekBounds(Date.now());
  const n = S.events.filter((e) => e.petId === p.id && e.type === "eggs" && e.at >= w0).reduce((t, e) => t + (e.count || 0), 0);
  return n ? `Eggs · ${n}` : "Eggs";
}

function badgeRow(a) {
  const earned = a.badges.filter((b) => b.earned).sort((x, y) => (y.at || 0) - (x.at || 0));
  return h("section.sec", { "aria-labelledby": "bd-h" },
    h("div.sec-row", h("h2.sec-title", { id: "bd-h" }, "Badges"), h("a.text-link", { href: "#/more/badges" }, "All badges", chevron())),
    earned.length
      ? h("ul.badge-row", earned.slice(0, 6).map((b) => h("li", badgeChip(b))))
      : h("p.empty", "First badge: get any skill to level 3, or earn 10 stamps. Real milestones only."));
}

// One gentle card at a time, for real pets only: install (from day one, until installed or "Not now"), back up (after the 3rd log, then
// every 14 days), and once, the partner card (after a week of logs).
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
