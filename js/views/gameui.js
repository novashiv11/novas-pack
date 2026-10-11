// Level up together: the shared game UI. Builds the game context from the diary, caches the derived numbers
// (js/game.js) between changes, and owns the calm reward moments: "+10 XP" in toasts, level-up and badge
// celebrations, the session timer, the honest self-check and the skill picker. Plus small widgets (bars, rings, pips).

import { EASY } from "../../data/easysteps.js";
import { S, pet, save, remove, refresh, realPets } from "../state.js";
import { h, put, em, uid, sheet, toast, motionOK, buzz, isoDate } from "../util.js";
import { skillsFor } from "../logic.js";
import { setLogHooks, eventSheet, saveError } from "../forms.js";
import * as G from "../game.js";
import { NOVA } from "./parts.js";

// ---------- derived game state (cached until the next change or a new day) ----------
export function ctxFor(p) {
  return {
    pet: p, skills: skillsFor(p).map((s) => ({ id: s.id, title: s.title, minutes: s.minutes, level: s.level })),
    events: S.events.filter((e) => e.petId === p.id), adventures: S.adventures.filter((a) => a.petId === p.id),
    checks: S.skillChecks.filter((c) => c.petId === p.id), stamps: S.content.STAMPS || [], now: Date.now(),
  };
}
let cache = { key: "", map: new Map(), trainer: new Map() };
function fresh() {
  const key = `${S.rev}|${G.dayKey(Date.now())}`;
  if (cache.key !== key) cache = { key, map: new Map(), trainer: new Map() };
  return cache;
}
/** Everything about one partner: level, XP, stats, skills, stamps, badges, quests. */
export function gameOf(p) {
  const c = fresh();
  if (!c.map.has(p.id)) c.map.set(p.id, G.analyze(ctxFor(p)));
  return c.map.get(p.id);
}
/** The sample lives in its own world: its progress never counts towards your real trainer rank. */
export function worldPets(p = pet()) { return p && p.sample ? S.pets.filter((x) => x.sample) : realPets(); }
export function lessonIds() { return (S.content.LESSONS || []).map((l) => l.id); }
export function trainerFor(p = pet()) {
  const c = fresh();
  const world = p && p.sample ? "sample" : "real";
  if (!c.trainer.has(world)) c.trainer.set(world, G.trainerOf(worldPets(p).map(gameOf), S.academy, lessonIds()));
  return c.trainer.get(world);
}
export function trainerName() { return (S.settings.trainerName || "").trim() || "You"; }
export function snap(p = pet()) { return p ? G.snapshot(gameOf(p), trainerFor(p)) : G.snapshot(null, null); }
export const skillName = (sk) => G.SHORT[sk.id] || sk.title;

// ---------- rewards ----------
/** "+10 XP" for a toast, from two snapshots. */
export function xpText(before, after, ev) {
  const pd = after.xp - before.xp, td = after.trainerXp - before.trainerXp;
  if (pd > 0 && td > pd) return ` +${pd} XP, +${td} trainer XP.`;
  if (pd > 0) return ` +${pd} XP.`;
  if (td > 0) return ` +${td} trainer XP.`;
  if (ev && ev.type === "walk") return " (Up to 2 walks a day count for XP.)";
  return "";
}

/** What changed between two snapshots, as celebration lines. */
function changes(p, a, before, after) {
  const items = [];
  for (const [id, L] of Object.entries(after.skills)) {
    const was = before.skills[id] || 0;
    if (L > was) {
      const sk = (S.content.SKILLS || []).find((s) => s.id === id) || { id, title: id };
      items.push({ emoji: "⭐", title: `${skillName(sk)} reached level ${L}: ${G.LEVEL_PLACE[L].short}.`, text: "Nova approves." });
    }
  }
  for (const b of a.badges) {
    if (b.earned && !before.badges.has(b.id)) items.push({ emoji: b.emoji, badge: true, title: `New badge: ${b.name}`, text: b.kind === "skill" ? `${p.name} can do it in the garden now. Real progress.` : `${b.need}: done. That's showing up.` });
  }
  if (after.level > before.level) items.push({ emoji: "🎉", title: `${p.name} reached level ${after.level}`, text: "Small steps, adding up." });
  if (after.weekAll && !before.weekAll) items.push({ emoji: "🗓️", title: "All 3 weekly quests done", text: `+${G.XP.weekBonus} bonus XP for ${p.name}. That's a good week.` });
  if (after.rank !== before.rank && G.RANKS.findIndex((r) => r.id === after.rank) > G.RANKS.findIndex((r) => r.id === before.rank)) {
    const r = G.RANKS.find((x) => x.id === after.rank);
    items.push({ emoji: "🏅", title: `Trainer rank: ${r.name}`, text: "A learning milestone in the app, not a qualification. Still: well done, you." });
  }
  return items;
}

/** Show the calm celebration for whatever changed. Confetti only for badges, and only if motion is OK. */
export function celebrateDiff(p, before, after) {
  if (!p) return;
  const items = changes(p, gameOf(p), before, after);
  if (!items.length) return;
  setTimeout(() => celebrate(items), 250);
}
export function celebrate(items) {
  if (document.querySelector("dialog.cele[open]")) return;
  const title = items.length === 1 ? items[0].title : "Look at you two";
  const { dlg } = sheet(title, (body, close) => {
    put(body,
      h("div.cele-top", h("img.disc.cele-nova", { src: NOVA, alt: "", width: "72", height: "72" })),
      h("ul.cele-list", items.map((it) => h(`li${it.badge ? ".is-badge" : ""}`,
        h("span.cele-em", { "aria-hidden": "true" }, it.emoji),
        h("span", items.length > 1 ? h("b", it.title) : null, items.length > 1 ? " " : null, it.text)))),
      h("button.btn.btn-gold.wide", { type: "button", autofocus: true, onclick: close }, "Carry on"));
  });
  dlg.classList.add("cele");
  dlg.querySelector(".btn-gold").focus();
  buzz(20);
  if (items.some((i) => i.badge)) confetti();
}

/** Run an action that may level something up, then celebrate the difference. */
export async function withRewards(p, fn) {
  const before = snap(p);
  const out = await fn();
  const after = snap(p);
  celebrateDiff(p, before, after);
  return { out, before, after };
}

// One-tap logs (walks, care tasks, general practice) and "Log" forms get "+N XP" and celebrations through forms.js.
setLogHooks({
  before: () => snap(pet()),
  after: (ev, before) => {
    const p = S.pets.find((x) => x.id === ev.petId) || pet();
    if (!before || !p) return "";
    const after = snap(p);
    celebrateDiff(p, before, after);
    return xpText(before, after, ev);
  },
});

/** A short confetti burst (canvas, removed after ~1.3 s). Never with reduced motion. */
export function confetti() {
  if (!motionOK()) return;
  const c = h("canvas.confetti", { "aria-hidden": "true" });
  c.width = innerWidth; c.height = innerHeight;
  document.body.append(c);
  const g = c.getContext("2d");
  if (!g) { c.remove(); return; }
  const cols = ["#F2B544", "#1F4E6E", "#C27A3A", "#E0566E", "#8EC1E0"];
  const bits = Array.from({ length: 60 }, () => ({ x: innerWidth / 2, y: innerHeight * 0.35, vx: (Math.random() - 0.5) * 11, vy: -Math.random() * 11 - 3, s: 5 + Math.random() * 5, a: Math.random() * 6, c: cols[(Math.random() * cols.length) | 0] }));
  let t = 0;
  (function frame() {
    g.clearRect(0, 0, c.width, c.height);
    for (const b of bits) { b.vy += 0.42; b.x += b.vx; b.y += b.vy; b.a += 0.2; g.save(); g.translate(b.x, b.y); g.rotate(b.a); g.fillStyle = b.c; g.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2); g.restore(); }
    if (++t < 80) requestAnimationFrame(frame); else c.remove();
  })();
}

// ---------- widgets ----------
/** A thin progress bar (decorative: the numbers are always in the text next to it). */
export function bar(value, max, cls = "") {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 100;
  return h(`div.gbar${cls ? `.${cls}` : ""}`, { "aria-hidden": "true" }, h("span", { style: { width: `${pct}%` } }));
}
/** A small progress ring with "2/3" inside. */
export function ring(progress, target, done) {
  const NS = "http://www.w3.org/2000/svg";
  const s = document.createElementNS(NS, "svg");
  s.setAttribute("viewBox", "0 0 44 44"); s.setAttribute("aria-hidden", "true"); s.setAttribute("class", `ring${done ? " done" : ""}`);
  const C = 2 * Math.PI * 18, f = target ? Math.min(1, progress / target) : 0;
  s.innerHTML = `<circle class="ring-track" cx="22" cy="22" r="18"/><circle class="ring-fill" cx="22" cy="22" r="18" stroke-dasharray="${(C * f).toFixed(2)} ${C.toFixed(2)}" transform="rotate(-90 22 22)"/>` +
    `<text x="22" y="26.5" text-anchor="middle" class="ring-text">${done ? "✓" : `${progress}/${target}`}</text>`;
  return s;
}
/** Five pips for a skill level (0 to 5). */
export function pips(level) {
  return h("span.pips", { "aria-hidden": "true" }, [1, 2, 3, 4, 5].map((i) => h(`span${i <= level ? ".on" : ""}`)));
}
export function badgeChip(b, { showName = true } = {}) {
  return h(`span.badge-chip${b.earned ? ".earned" : ""}`,
    h("span.badge-disc", { "aria-hidden": "true" }, b.earned ? b.emoji : "🔒"),
    showName ? h("span.badge-name", b.name) : null);
}
export function levelText(pr) {
  if (!pr) return "";
  if (pr.level >= 5) return "Level 5: works anywhere. Top marks.";
  if (pr.ready) return `Ready for level ${pr.next}: do the self-check`;
  return `Level ${pr.next}: ${pr.toGo} more session${pr.toGo === 1 ? "" : "s"}, then works ${G.LEVEL_PLACE[pr.next].where}`;
}

// ---------- simple steps ("so a child can follow") ----------

/** The quest as a tap-to-open card: what you need, simple numbered steps, and what counts as a win. */
export function howTo(skillId, title, { open = false, k = "howto" } = {}) {
  const e = EASY[skillId];
  if (!e) return h("p.quest-text", title);
  return h("details.howto", { open, "data-k": k },
    h("summary", h("span.howto-title", title), h("span.howto-hint", "How? Tap for simple steps")),
    h("div.howto-body",
      e.need ? h("p.howto-need", h("b", "You need: "), e.need) : null,
      h("ol.howto-steps", e.steps.map((s) => h("li", s))),
      e.win ? h("p.howto-win", "✅ ", e.win) : null,
      h("p.small.muted", "Simple enough for kids to help, with a grown-up. Treats, toys and praise only.")));
}

// ---------- training ----------
const MOODS = [[1, "😕", "Tricky"], [2, "🙂", "OK"], [3, "🤩", "Great"]];
const MOOD_LINE = { 1: "Tricky is normal. Make it easier next time.", 2: "Solid work. I supervised.", 3: "Great session. End there. Biscuit." };

/** Save one training session (skill optional), then "+10 XP" and any celebration. */
export async function logSession(p, sk, { minutes, mood, more } = {}) {
  const ev = { id: uid(), petId: p.id, type: "training", at: Date.now(), skillId: sk ? sk.id : undefined, minutes, mood };
  for (const k of Object.keys(ev)) if (ev[k] === undefined) delete ev[k];
  if (p.sample) ev.sample = true;
  const before = snap(p);
  try { await save("events", ev, { quiet: true }); } catch (e) { toast(saveError(e)); return null; }
  const after = snap(p);
  refresh();
  buzz(10);
  const counted = G.sessionCounts(S.events.filter((e) => e.petId === p.id), ev);
  const name = sk ? skillName(sk) : "General practice";
  const msg = counted
    ? more ? `That counts! ${name}.${xpText(before, after, ev)} Want 4 more minutes?` : `Session logged: ${name}.${xpText(before, after, ev)} ${MOOD_LINE[mood] || "I supervised."}`
    : S.events.filter((e) => e.petId === p.id && e.type === "training" && (e.skillId || "general") === (ev.skillId || "general") && G.dayKey(e.at) === G.dayKey(ev.at)).length > G.CAPS.sessions
      ? `Logged: ${name}. Only ${G.CAPS.sessions} sessions per skill count each day, so this one's just for fun. Give that skill a rest.`
      : `Logged: ${name}. Only ${G.CAPS.sessionsPerDay} sessions a day count, so this one's just for fun. Rest is training too.`;
  const acts = [["Undo", () => remove("events", ev.id).then(() => toast("Undone."))]];
  if (more && counted) acts.unshift(["Keep going", more]);
  toast(msg, acts, more ? { ms: 9000 } : undefined);
  celebrateDiff(p, before, after);
  return ev;
}

const fmtClock = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

/** The session timer: counts down the skill's minutes, then "How did it go? 😕 🙂 🤩". Closing it logs nothing. */
/** The session timer. opts.seconds = 60 gives the 1-minute win (spec v3): first step shown, ends by itself. */
export function startSession(p, sk, { seconds } = {}) {
  const one = !!seconds;
  const total = one ? seconds * 1000 : Math.max(1, sk.minutes || 5) * 60000;
  const a = gameOf(p);
  const pr = a.progress[sk.id];
  const place = pr ? G.QUEST_PLACE[Math.min(5, pr.level + 1)] : "at home";
  let t0 = Date.now(), pausedAt = 0, pausedFor = 0, timer = 0, lastMin = -1, over = false;
  const elapsed = () => (pausedAt || Date.now()) - t0 - pausedFor;
  sheet(one ? `${skillName(sk)}: your 1-minute win` : `${skillName(sk)}: ${sk.minutes || 5}-minute session`, (body, close) => {
    const clock = h("p.timer-clock", { role: "timer", "aria-label": "Time left" }, fmtClock(total));
    const first = sk.steps && sk.steps.length ? sk.steps[0] : "";
    const status = h("p.timer-status", { "aria-live": "polite" }, one ? `Just one minute, ${place}.${first ? ` Try: ${first}` : ""}` : `Practise ${place}. Short and happy. End on a win.`);
    const track = h("div.gbar.timer-bar", { "aria-hidden": "true" }, h("span", { style: { width: "0%" } }));
    const pauseBtn = h("button.btn.btn-line", { type: "button", onclick: () => {
      if (pausedAt) { pausedFor += Date.now() - pausedAt; pausedAt = 0; pauseBtn.textContent = "Pause"; status.textContent = "Back to it."; }
      else { pausedAt = Date.now(); pauseBtn.textContent = "Resume"; status.textContent = "Paused. Take your time."; }
    } }, "Pause");
    const moodBox = h("fieldset.fs.mood-box", { hidden: true },
      h("legend", "How did it go?"),
      h("div.mood-row", MOODS.map(([v, e, label]) => h("button.mood-btn", { type: "button", "data-k": `mood-${v}`, onclick: () => {
        const mins = Math.max(1, Math.round(elapsed() / 60000));
        close();
        logSession(p, sk, { minutes: Math.min(mins, 180), mood: v, more: one ? () => startSession(p, sk) : undefined });
      } }, h("span.mood-em", { "aria-hidden": "true" }, e), h("span", label)))));
    const finish = () => {
      clearInterval(timer);
      if (!pausedAt) pausedAt = Date.now();
      runRow.hidden = true;
      moodBox.hidden = false;
      moodBox.querySelector("button").focus();
    };
    // Finish unlocks after a minute, so a session is a real one (a 1-minute win simply ends by itself).
    const doneBtn = h("button.btn.btn-blue", { type: "button", "data-k": "timer-done", disabled: true, onclick: finish }, one ? "Keep at it…" : "Finish (after 1 min)");
    const runRow = h("div.row-btns.timer-btns", pauseBtn, doneBtn);
    const tick = () => {
      const left = total - elapsed();
      clock.textContent = fmtClock(left);
      track.firstChild.style.width = `${Math.min(100, (elapsed() / total) * 100)}%`;
      if (!one && doneBtn.disabled && elapsed() >= 60000) { doneBtn.disabled = false; doneBtn.textContent = "Finish session"; }
      const min = Math.ceil(left / 60000);
      if (!over && left <= 0) {
        over = true; buzz(200);
        status.textContent = "Time! End on a win, then tell me how it went.";
        finish();
      } else if (!pausedAt && min !== lastMin && left > 0 && lastMin !== -1 && min >= 1) {
        status.textContent = `${min} minute${min === 1 ? "" : "s"} left.`;
      }
      lastMin = min;
    };
    put(body,
      h("div.timer", clock, track, status),
      runRow,
      moodBox,
      EASY[sk.id] ? h("details.more-box", { open: one }, h("summary", "Simple steps"), h("ol.steps-list.timer-steps", EASY[sk.id].steps.map((s) => h("li", s))))
        : sk.steps && sk.steps.length ? h("details.more-box", h("summary", "Steps"), h("ol.steps-list.timer-steps", sk.steps.map((s) => h("li", s)))) : null,
      h("p.small.muted", one ? "Closing this logs nothing. Treats, toys and praise only." : "Closing this logs nothing. Kind methods only: treats, toys and praise."));
    timer = setInterval(tick, 250);
    tick();
  }, { onClose: () => clearInterval(timer) });
}

/** The honest self-check before a level-up: "Did it work 4 out of 5 times …?" Yes / Not yet. */
export function selfCheck(p, sk, level) {
  const where = G.LEVEL_PLACE[level].where;
  sheet(`Level ${level} check: ${skillName(sk)}`, (body, close) => {
    put(body,
      h("p.check-q", `Honest answer, no judgement: did ${skillName(sk).toLowerCase()} work for ${p.name} about 4 out of 5 times ${where}?`),
      ["recall", "loose-lead"].includes(sk.id) && level >= 3 ? h("p.note-line", em("🦮"), " Keep the lead or a long line on unless the area is fully secure.") : null,
      h("p.small.muted", "It's your own progress, so the only person a fib would cheat is you. And me. I'd know."),
      h("div.row-btns",
        h("button.btn.btn-line", { type: "button", "data-k": "check-no", onclick: () => { close(); toast("Fair. Keep going: short sessions, easy wins. Ask me again any time."); } }, "Not yet"),
        h("button.btn.btn-blue", { type: "button", "data-k": "check-yes", onclick: async () => {
          close();
          const row = { id: `${p.id}:${sk.id}:${level}`, petId: p.id, skillId: sk.id, level, at: Date.now() };
          if (p.sample) row.sample = true;
          try { await withRewards(p, () => save("skillChecks", row)); } catch (e) { toast(saveError(e)); }
        } }, "Yes, it works")));
  });
}

/** Home's "Training (choose a skill)": pick a skill to start the timer, or log one you already did. */
export function trainingPicker(p) {
  const skills = skillsFor(p);
  const a = gameOf(p);
  sheet("Train: pick a skill", (body, close) => {
    const q = a.daily;
    const order = q ? [...skills].sort((x, y) => (y.id === q.skillId) - (x.id === q.skillId)) : skills;
    put(body,
      skills.length ? h("ul.pick-list", order.map((s) => {
        const pr = a.progress[s.id];
        return h("li", h("button.pick-row", { type: "button", onclick: () => { close(); setTimeout(() => startSession(p, s), 0); } },
          h("span.pick-title", skillName(s), q && q.skillId === s.id ? h("span.pill.quest-pill", "Today's quest") : null),
          h("span.pick-meta", `Level ${pr ? pr.level : 0} · ${s.minutes} min`),
          h("span.pick-go", { "aria-hidden": "true" }, "▶")));
      })) : h("p", "Skill levels are dog-first for now. You can still log practice."),
      h("button.btn.btn-line.wide", { type: "button", onclick: () => { close(); setTimeout(() => eventSheet("training"), 0); } }, "Log a session I already did"));
  });
}

export function todayKey() { return isoDate(); }
