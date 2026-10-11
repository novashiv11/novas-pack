// Train: skills as levels 0 to 5 (from data/skills.js). Each level needs sessions and an honest self-check at a
// harder place (home → garden → street → park). The skill page has the clip, steps, a 5-minute session timer and
// the session history. Sessions, XP and levels all come from the diary (js/game.js).

import { quizSkills } from "./placement.js";
import { S, pet, eventsOf, save, remove, setSetting } from "../state.js";
import { h, put, em, weeklyStreak, motionOK, fmtDay, fmtTime, toast, confirmBox, sheet, inIreland } from "../util.js";
import { skillsFor, progressOf } from "../logic.js";
import { pageHead, subBar, sampleStrip, NOVA, moreBtn } from "./parts.js";
import { speciesOf, eventSheet } from "../forms.js";
import { gameOf, pips, bar, levelText, placeFor, skillName, startSession, selfCheck, logSession, trainingPicker, howTo } from "./gameui.js";
import { LEVEL_REQ, CAPS, countedSessions, dayKey, weekBounds } from "../game.js";

const GROUPS = ["Foundation", "Next steps", "Fun"];

export function training(main, arg, sub) {
  const p = pet();
  const skills = skillsFor(p);
  if (arg) {
    const sk = skills.find((s) => s.id === arg);
    if (sk) {
      skillPage(main, p, sk);
      if (sub === "start") {
        history.replaceState(null, "", `#/train/${encodeURIComponent(sk.id)}`);
        setTimeout(() => startSession(p, sk), 0);
      }
      return;
    }
  }
  const a = gameOf(p);
  const q = a.daily;
  put(main, sampleStrip(p),
    pageHead("Train", h("p.nova-line", h("img.disc.nova-face", { src: NOVA, alt: "", width: "28", height: "28" }),
      h("span", h("span.vh", "Nova says: "), q ? `Weakest link first: ${q.statLabel}. Five minutes. Go.` : "Short, happy sessions. Stop while it's still fun."))));
  if (!skills.length) {
    put(main, h("div.card.soon-card",
      h("img.disc", { src: NOVA, alt: "", width: "56", height: "56" }),
      h("div", h("h2", `${speciesOf(p.species).label} skills: coming soon`),
        h("p", "Skills for your kind of pet are on their way. You can still log practice, and every log counts."),
        h("button.btn.btn-line.sm", { type: "button", onclick: () => eventSheet("training") }, "Log practice"))));
  }
  if (q) {
    put(main, h("section.quest-card", { "aria-labelledby": "dq-h" },
      h("p.eyebrow", { id: "dq-h" }, "Today's quest · optional"),
      howTo(q.skillId, q.text, { k: "quest-howto" }),
      q.done ? h("p.small", em("✅"), " Done today. Nova approves.")
        : h("div.row-btns.left", h("a.btn.btn-blue.sm", { href: `#/train/${encodeURIComponent(q.skillId)}/start` }, "Start the timer")),
      h("button.linkish", { type: "button", "data-k": "swap-focus", onclick: () => focusPicker(p, skills) }, "Change this week's skill")));
  }
  if (!p.sample && quizSkills(p).length) {
    put(main, h("p.lc-link", h("a.text-link", { href: "#/placement", "data-k": "lc-open" }, p.placement ? "Redo the level check" : "Already trained? Take the level check")));
  }
  put(main, streakCard(p));
  for (const g of GROUPS) {
    const list = skills.filter((s) => s.level === g);
    if (!list.length) continue;
    put(main, h("section.sec", { "aria-labelledby": `lv-${g.replace(/\s/g, "-")}` },
      h("h2.sec-title", { id: `lv-${g.replace(/\s/g, "-")}` }, g),
      h("ul.skill-list", list.map((s) => skillRow(s, a.progress[s.id])))));
  }
  const other = skills.filter((s) => !GROUPS.includes(s.level));
  if (other.length) put(main, h("ul.skill-list", other.map((s) => skillRow(s, a.progress[s.id]))));
  put(main, h("details.fold.how-levels", h("summary", "How levels work"),
    h("p.small", `Levels need ${LEVEL_REQ.slice(1).join(", ")} sessions, each with a self-check at a harder place: home, garden, street, park (or, for skills like stay and alone time, a little longer each time). Up to ${CAPS.sessions} sessions per skill, and ${CAPS.sessionsPerDay} in total, count each day.`),
    h("p.small", "Every 4 weeks of practice earns a grace week (up to 2), so one busy week won't break your practice weeks."),
    h("p.small", "💛 Kind methods only: treats, toys and praise. No shouting, no shock, prong or choke collars.")));
}

function skillRow(s, pr) {
  const lvl = pr ? pr.level : 0;
  return h("li", h("a.skill-card.lv-card", { href: `#/train/${encodeURIComponent(s.id)}` },
    h("span.skill-title", s.title),
    h("span.skill-meta", levelText(pr)),
    h("span.skill-lv", pips(lvl), h("span.lv-tag", `Lv ${lvl}`), pr && pr.ready ? h("span.pill.ready-pill", "Check") : null),
    h("span.vh", `. Level ${lvl} of 5.`)));
}

function streakCard(p) {
  const st = weeklyStreak(eventsOf("training").map((e) => e.at));
  // Only the weeks since this pet joined (no row of "no practice" weeks from before you started).
  const since = weekBounds(p.createdAt || Date.now())[0];
  const shown = Math.max(1, Math.min(8, Math.round((weekBounds(Date.now())[0] - since) / (7 * 86400000)) + 1));
  st.last8 = st.last8.slice(-shown);
  return h("section.streak-card", { "aria-labelledby": "st-h" },
    h("div.streak-top",
      h("div", h("h2", { id: "st-h" }, "Practice weeks"),
        h("p.streak-n", h("b", String(st.weeks)), ` week${st.weeks === 1 ? "" : "s"}`)),
      h("button.btn.btn-line", { type: "button", "data-k": "log-practice", onclick: () => trainingPicker(p) }, "Pick a skill")),
    h("ol.week-dots", { "aria-label": st.last8.length === 1 ? "This week" : `Last ${st.last8.length} weeks` }, st.last8.map((w) =>
      h(`li${w.done ? ".done" : ""}${w.current ? ".current" : ""}`,
        h("span.vh", `${w.current ? "This week" : (w.label || w.id)}: ${w.done ? "practised" : "no practice logged"}`),
        h("span", { "aria-hidden": "true" }, w.done ? "✓" : "")))),
    h("p.small.muted", st.thisWeek ? "This week counts ✓" : "Any practice counts this week.", st.graces ? ` 🛟 ${st.graces} grace week${st.graces === 1 ? "" : "s"} saved.` : ""));
}

// ---------- one skill ----------
function skillPage(main, p, sk) {
  const a = gameOf(p);
  const pr = a.progress[sk.id] || { level: 0, sessions: 0, next: 1, need: 3, toGo: 3, ready: false, frac: 0, ups: [] };
  const sessions = eventsOf("training").filter((e) => e.skillId === sk.id);
  const counted = new Set(countedSessions(eventsOf("training")).map((e) => e.id));
  const todayKey = dayKey(Date.now());
  const today = sessions.filter((e) => dayKey(e.at) === todayKey && counted.has(e.id)).length;
  const old = progressOf(p, sk.id);
  const clipBox = h("div.clip", { hidden: true });
  const soon = h("p.clip-soon", h("img.disc", { src: NOVA, alt: "", width: "32", height: "32" }), h("span", h("b", "Clip coming soon."), " Nova is rehearsing."));
  const lastCheck = S.skillChecks.filter((c) => c.petId === p.id && c.skillId === sk.id && c.level === pr.level)[0];
  put(main,
    subBar(sk.title, "#/train", "Back to all skills"),
    sampleStrip(p),
    h("section.level-card", { "aria-labelledby": "lv-h" },
      h("div.level-top",
        h("div",
          h("p.eyebrow", `${sk.level} · ${sk.minutes} min a session`),
          h("h2", { id: "lv-h" }, `Level ${pr.level}`, h("span.lv-of", " of 5")),
          h("p.small", pr.level ? `Works ${placeFor(sk.id, pr.level).where}.` : "Just starting. Everyone does.")),
        pips(pr.level),
        lastCheck ? moreBtn(`${sk.title} level`, [[`Undo the level ${pr.level} check`, () => undoCheck(p, sk, pr.level, lastCheck)]]) : null),
      pr.next ? [
        h("p.lv-next", h("b", `Level ${pr.next}: `), `${LEVEL_REQ[pr.next]} sessions, and it works ${placeFor(sk.id, pr.next).where}.`),
        bar(Math.min(pr.sessions, pr.need) - LEVEL_REQ[pr.level], pr.need - LEVEL_REQ[pr.level], "gold"),
        h("p.small.muted", `${pr.sessions} counted session${pr.sessions === 1 ? "" : "s"} · ${pr.ready ? "enough for the next level" : `${pr.toGo} to go`}`),
        pr.ready ? h("div.ready-box",
          h("p", h("b", `Ready for level ${pr.next}?`), " One honest question first."),
          h("button.btn.btn-gold", { type: "button", "data-k": "self-check", onclick: () => selfCheck(p, sk, pr.next) }, `Level ${pr.next} self-check`)) : null,
      ] : h("p.lv-next", "Top level. Keep it fun and keep it fresh in new places.")),
    h("div.practice-row",
      h("button.btn.btn-blue", { type: "button", "data-k": "start-session", onclick: () => startSession(p, sk) }, em("⏱️"), ` Start ${sk.minutes}-min session`),
      h("button.btn.btn-line.sm.wide", { type: "button", "data-k": "log-skill", onclick: () => logSession(p, sk, { minutes: sk.minutes }) }, "Already did one? Log it")),
    h("p.small.muted", `Today: ${today} of ${CAPS.sessions} counted sessions for this skill.`),
    old !== "none" && pr.level === 0 ? h("p.note-line", em("📒"), ` In the old diary you marked this "${old === "got" ? "Got it" : "Practising"}". Levels start fresh: log sessions and do the self-checks.`) : null,
    clipBox,
    h("details.fold.skill-fold", { "data-k": "why-fold" }, h("summary", "Why it matters"), h("p.skill-why", sk.why),
      sk.id === "muzzle" && inIreland() ? h("p.small", "🇮🇪 In Ireland, German Shepherds and some other breeds (Control of Dogs Regulations 1998) must wear a muzzle and be on a short, strong lead in public, held by someone over 16.") : null),
    h("section.sec.skill-sec", h("h2", "Steps"), howTo(sk.id, "Simple version (for everyone)", { k: "skill-howto" }), h("ol.steps-list", (sk.steps || []).map((s) => h("li", s))), soon),
    h("details.fold.skill-fold", h("summary", "Common mistake"), h("p.skill-why", sk.mistake)),
    h("details.fold.skill-fold", h("summary", "When to see a professional"), h("p.skill-why", sk.pro)),
    h("section.sec", { "aria-labelledby": "sh-h" },
      h("h2.sec-title", { id: "sh-h" }, "Sessions"),
      sessions.length ? h("ul.tl", sessions.slice(0, 12).map((e) => h("li.tl-item",
        h("button.tl-row", { type: "button", "data-k": `ev-${e.id}`, onclick: () => eventSheet("training", e) },
          h("span.tl-dot", { "aria-hidden": "true" }, { 1: "😕", 2: "🙂", 3: "🤩" }[e.mood] || "🎓"),
          h("span.tl-body", h("span.tl-time", `${fmtDay(e.at)}, ${fmtTime(e.at)}`),
            h("span.tl-text", [e.minutes ? `${e.minutes} min` : "", { 1: "Tricky", 2: "OK", 3: "Great" }[e.mood] || "", counted.has(e.id) ? "" : "not counted (over 3 that day)"].filter(Boolean).join(" · ") || "Session")),
          h("span.vh", ", edit"))))) : h("p.empty", "No sessions yet. The first one is the hardest. Five minutes.")),
    notForUsRow(p, sk),
    h("p.note-line", em("💛"), " Short, happy sessions. Stop while it's still fun. Kind methods only."));
  loadClip(clipBox, soon, sk);
}

/** Pick this week's focus skill (daily and weekly quests follow it). Skills marked "not for us" aren't offered. */
function focusPicker(p, skills) {
  const skip = new Set(((S.settings.notForUs || {})[p.id]) || []);
  sheet("This week's skill", (body, close) => {
    put(body,
      h("p.sheet-intro", "Your daily and weekly quests will follow it until Sunday. Pick what helps your real life most."),
      h("ul.pick-list", skills.filter((s) => !skip.has(s.id)).map((s) => h("li", h("button.pick-row", { type: "button", "data-k": `focus-${s.id}`, onclick: async () => {
        await setSetting("focus", { ...(S.settings.focus || {}), [p.id]: { skillId: s.id, week: weekBounds(Date.now())[0] } }, { quiet: false });
        close(); toast(`This week: ${skillName(s)}. Small sessions, big difference.`);
      } }, h("span.pick-title", skillName(s)), h("span.pick-meta", s.level), h("span.pick-go", { "aria-hidden": "true" }, "→"))))));
  });
}

/** "Not for us": leave a skill out of quests (e.g. muzzle work for a dog that doesn't need it, or greetings for a shy dog). */
function notForUsRow(p, sk) {
  const all = S.settings.notForUs || {};
  const list = all[p.id] || [];
  const on = list.includes(sk.id);
  const id = `nfu-${sk.id}`;
  return h("div.check.nfu", h("input", { type: "checkbox", id, "data-k": "not-for-us", checked: on, onchange: async (e) => {
    const next = e.target.checked ? [...new Set([...list, sk.id])] : list.filter((x) => x !== sk.id);
    await setSetting("notForUs", { ...all, [p.id]: next }, { quiet: false });
    toast(e.target.checked ? "Left out of quests. You can still practise it here." : "Back in the quests.");
  } }), h("label", { for: id }, "Leave this out of quests (not for us right now)"));
}

async function undoCheck(p, sk, level, row) {
  if (!(await confirmBox(`Undo level ${level}?`, `${skillName(sk)} goes back to level ${level - 1} until you do the check again. Its XP goes too.`, "Undo level", true))) return;
  await remove("skillChecks", row.id);
  toast(`${skillName(sk)} is back to level ${level - 1}.`, [["Redo", () => save("skillChecks", row)]]);
}

/**
 * Show the clip card only if the file exists (a HEAD request; the service worker answers 204 for a missing clip),
 * and hide it again if the video can't play. Otherwise the small "Clip coming soon" note stays below the steps.
 */
async function loadClip(box, soon, sk) {
  const url = sk.clip || `clips/${sk.id}.mp4`;
  let ok = false;
  try { const r = await fetch(url, { method: "HEAD" }); ok = r.status === 200; } catch { ok = false; }
  if (!ok || !box.isConnected) return;
  const alt = `Nova demonstrating: ${sk.title}`;
  const show = () => { box.hidden = false; soon.hidden = true; };
  const hide = () => { box.hidden = true; soon.hidden = false; };
  const media = /\.gif$/i.test(url)
    ? h("img", { src: url, alt, loading: "lazy", onload: show, onerror: hide })
    : h("video", { src: url, controls: true, muted: true, loop: true, playsinline: true, autoplay: motionOK(), preload: "metadata", "aria-label": alt, onloadedmetadata: show, onerror: hide });
  if (media.tagName === "VIDEO") { media.muted = true; media.setAttribute("playsinline", ""); }
  box.replaceChildren(media);
}
