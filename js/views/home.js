// Home: your Partner. The partner card (stage, level, XP, 5 stats), "1% today" (one tiny thing for your dog, one for
// you, and Nova's line of the day), the trainer strip, this week's quests, quick logs, badges, and one gentle nudge.

import { S, pet, setSetting, save, logsOf, LOG_TYPES } from "../state.js";
import { h, put, em, fmtDate, isoDate, ageText, DAY, toast } from "../util.js";
import { healthAlerts, backupDue } from "../logic.js";
import { logWalk, speciesOf, openPetSheet, saveError } from "../forms.js";
import { sampleStrip, alertCard, avatar, chevron } from "./parts.js";
import { gameOf, trainerFor, trainerName, bar, ring, badgeChip, trainingPicker } from "./gameui.js";
import { openPartnerCard, openLineCard } from "../sharecard.js";
import { lineOfDay, youActionOfDay, replyOfDay } from "../../data/quotes.js";
import { exportBackup } from "./more.js";
import { installCard } from "../install.js";

export function home(main) {
  const p = pet();
  const a = gameOf(p);
  const tr = trainerFor(p);
  put(main,
    sampleStrip(p),
    alertCard(healthAlerts(p, Date.now()), p),
    partnerCard(p, a, tr),
    onePercent(p, a),
    trainerStrip(tr, p),
    weekly(p, a),
    quickLog(p),
    badgeRow(a),
    nudge(p, a, tr),
  );
}

function stageText(p, a) {
  const age = ageText(p.birthday);
  if (a.stage) return `${a.stage.label} · ${age}`;
  if (p.species === "dog") return null;
  return [speciesOf(p.species).label, age].filter(Boolean).join(" · ");
}

function partnerCard(p, a, tr) {
  const st = stageText(p, a);
  const stats = a.stats.filter((s) => !s.na);
  const lv = a.level;
  return h("section.partner", { "aria-labelledby": "page-title" },
    h("div.partner-top",
      h("div.partner-av", avatar(p, 72)),
      h("div.partner-id",
        h("p.partner-eyebrow", p.sample ? "Sample partner" : "Your partner"),
        h("h1.partner-name", { tabindex: "-1", id: "page-title" }, p.name),
        st ? h("p.partner-stage", st)
          : h("button.linkish.partner-stage", { type: "button", "data-k": "add-bday", onclick: () => openPetSheet(p) }, "Add a birthday to see their stage")),
      h("div.lv-medal", h("span.lv-l", "Level"), h("b.lv-n", String(lv.level)))),
    h("div.xp-row",
      h("p.xp-text", lv.max ? `Level ${lv.level}: the top. ${a.xp} XP` : h("span", h("b", `${lv.into} / ${lv.need} XP`), ` to level ${lv.level + 1}`)),
      bar(lv.max ? 1 : lv.into, lv.max ? 1 : lv.need, "gold")),
    stats.length
      ? h("ul.stats", { "aria-label": `${p.name}'s stats, out of 100` }, stats.map((s) => h("li",
        h("span.st-l", s.label), bar(s.value, 100), h("b.st-v", String(s.value), h("span.vh", " out of 100")))))
      : h("p.small.muted", "Skill levels are dog-first for now. Adventures, Health and the journal work for every pet."),
    h("div.partner-actions",
      h("button.btn.btn-line.sm", { type: "button", "data-k": "share-card", onclick: () => openPartnerCard(p, a, tr) }, em("📸"), " Share card"),
      h("a.text-link", { href: "#/train" }, "Skills", chevron())));
}

// ---------- 1% today ----------
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
  const last = lastActive(p);
  const back = last > 0 && Date.now() - last >= 3 * DAY;
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
    back ? h("p.welcome-back", h("img.disc", { src: "img/brand/nova-head.svg", alt: "", width: "28", height: "28" }), h("b", "Welcome back. Today counts.")) : null,
    h("figure.day-line",
      h("blockquote", h("p", `“${line.text}”`)),
      h("figcaption", line.by ? [`${line.by}`, line.source ? h("span.muted", `, ${line.source}`) : null] : "Nova, today",
        h("button.linkish.share-line", { type: "button", "data-k": "share-line", onclick: () => openLineCard(line) }, "Share", h("span.vh", " today's line")))),
    h("ul.ticks",
      tick("dogDone", dogDone, dogLabel,
        q && !q.done ? h("a.btn.btn-blue.sm.tick-go", { href: `#/train/${encodeURIComponent(q.skillId)}/start` }, "Start", h("span.vh", `: ${q.text}`)) : q && q.done ? h("span.pill.done-pill", "Session logged") : null,
        q && q.done),
      tick("youDone", !!row.youDone, `For you: ${youActionOfDay()}`)),
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
  h("label", { for: input.id }, "What went 1% better today, for you or your dog?"),
  h("div.input-row", input, h("button.btn.btn-blue", { type: "submit", "data-k": "jr-save" }, "Save")),
  err);
}

// ---------- trainer, quests, quick log, badges ----------
function trainerStrip(tr, p) {
  return h("a.trainer-strip", { href: "#/trainer", "data-k": "trainer-strip" },
    h("span.ts-ico", { "aria-hidden": "true" }, "🏅"),
    h("span.ts-body",
      h("span.ts-top", h("b", p && p.sample ? "Sample trainer" : trainerName()), ` · Trainer rank: ${tr.rank.name}`),
      bar(tr.next ? tr.into : 1, tr.next ? tr.need : 1),
      h("span.ts-meta", tr.next ? `${tr.xp} XP · ${tr.next.xp - tr.xp} to ${tr.next.name}` : `${tr.xp} XP · top rank`)),
    chevron());
}

function questHref(q) {
  if (q.id === "skill") return `#/train/${encodeURIComponent(q.skillId)}`;
  if (q.id === "adventure" || q.id === "walks") return "#/adventures";
  return "#/health";
}
function weekly(p, a) {
  const w = a.weekly;
  return h("section.sec.week-sec", { "aria-labelledby": "wk-h" },
    h("div.sec-row", h("h2.sec-title", { id: "wk-h" }, "This week's quests"), h("span.small.muted", `${w.doneCount} of ${w.quests.length} done`)),
    h("ul.quests", w.quests.map((q) => h(`li${q.done ? ".done" : ""}`,
      h("a.quest", { href: questHref(q) },
        ring(q.progress, q.target, q.done),
        h("span.q-body", h("span.q-text", q.text), h("span.q-meta", q.done ? "Done. +30 trainer XP" : `${q.progress} of ${q.target} · +30 trainer XP`)),
        chevron())))),
    h("p.small.muted", w.allDone ? `All 3 done: +50 bonus XP for ${p.name}. Lovely week.` : "All 3 by Sunday: +50 bonus XP. Miss a week? No drama, Monday's a fresh start."));
}

function quickLog(p) {
  const tile = (k, emoji, label, attrs) => h(attrs.href ? "a.ql" : "button.ql", { "data-k": `ql-${k}`, ...attrs, type: attrs.href ? undefined : "button" },
    h("span.ql-em", { "aria-hidden": "true" }, emoji), h("span.ql-l", label));
  return h("section.sec.ql-sec", { "aria-labelledby": "hq-h" },
    h("h2.sec-title", { id: "hq-h" }, "Quick log"),
    h("div.ql-grid.home-ql",
      tile("training", "🎓", "Training", { onclick: () => trainingPicker(p) }),
      tile("walk", "🚶", "Walk", { onclick: logWalk }),
      tile("adventure", "🌟", "Adventure", { href: "#/adventures" }),
      tile("health", "💩", "Poop & food", { href: "#/health" })));
}

function badgeRow(a) {
  const earned = a.badges.filter((b) => b.earned).sort((x, y) => (y.at || 0) - (x.at || 0));
  return h("section.sec", { "aria-labelledby": "bd-h" },
    h("div.sec-row", h("h2.sec-title", { id: "bd-h" }, "Badges"), h("a.text-link", { href: "#/more/badges" }, "All badges", chevron())),
    earned.length
      ? h("ul.badge-row", earned.slice(0, 6).map((b) => h("li", badgeChip(b))))
      : h("p.empty", "First badge: get any skill to level 3, or earn 10 stamps. Real milestones only."));
}

// One gentle card at a time, for real pets only: install (after the first log), back up (after the 3rd log, then
// every 14 days), and once, the partner card (after a week of logs).
function nudge(p, a, tr) {
  if (p.sample) return null;
  const logs = logsOf();
  if (!logs.length) return null;
  let card = null;
  try { card = installCard(); } catch { card = null; }
  if (card) return h("div.nudge-slot", card);
  const now = Date.now();
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
  if (!S.settings.partnerCardOffered && days >= 7) {
    return h("aside.nudge.nudge-card", { "aria-labelledby": "nudge-h" },
      h("h2.nudge-h", { id: "nudge-h" }, `A week in. Share ${p.name}'s card?`),
      h("p", "Level, stats and badges on one image. Made on your phone; the photo never leaves it unless you share it."),
      h("div.row-btns.left",
        h("button.btn.btn-blue.sm", { type: "button", onclick: async () => { await setSetting("partnerCardOffered", true); openPartnerCard(p, a, tr); } }, "Make the card"),
        h("button.btn.btn-line.sm", { type: "button", onclick: () => setSetting("partnerCardOffered", true, { quiet: false }) }, "Not now")));
  }
  return null;
}
