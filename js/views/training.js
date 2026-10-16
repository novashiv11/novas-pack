// Train: skills as levels 0 to 5 (from data/skills.js). Each level needs sessions and an honest self-check at a
// harder place (home → garden → street → park). v7: the skills are a winding PATH of round nodes (each with a ring for
// progress to its next level), the skill page leads with one big "Start" button, and the steps are stacked cards.
// Sessions, XP and levels all come from the diary (js/game.js); nothing here stores anything.

import { quizSkills } from "./placement.js";
import { challengeCard } from "./challenge.js";
import { S, pet, eventsOf, save, remove, setSetting } from "../state.js";
import { h, put, em, weeklyStreak, motionOK, fmtDay, fmtTime, toast, confirmBox, sheet, inIreland } from "../util.js";
import { skillsFor, progressOf } from "../logic.js";
import { pageHead, subBar, sampleStrip, NOVA, moreBtn, trainNav, chevron, avatar } from "./parts.js";
import { eventSheet } from "../forms.js";
import { weekly } from "./home.js";
import { gameOf, pips, bar, levelText, placeFor, skillName, startSession, selfCheck, logSession, trainingPicker, howTo } from "./gameui.js";
import { LEVEL_REQ, CAPS, countedSessions, dayKey, weekBounds } from "../game.js";

const GROUPS = ["Foundation", "Next steps", "Fun", "Advanced"];
const BLURB = { Foundation: "The basics for everyday life", "Next steps": "Build on the basics", Fun: "Tricks and play", Advanced: "For pros: best once the basics work" };
const GROUP_EM = { Foundation: "🌱", "Next steps": "🪜", Fun: "🎉", Advanced: "🏆" };
// The skill emoji for the path (data/skills.js has none). Same family as the level check's.
const SKILL_EM = { recall: "📣", "loose-lead": "🦮", settle: "🛏️", greetings: "🤝", "leave-it": "✋", "wait-doors": "🚪", handling: "🖐️", "trick-spin": "🌀", muzzle: "🐕",
  "toilet-training": "🚽", "alone-time": "🏠", "cat-carrier": "🧳", "cat-handling": "🐾", sit: "🪑", down: "⬇️", stay: "🛑", "check-in": "👀", "drop-it": "🎾", "look-at-that": "🔭", "talk-buttons": "💬",
  heel: "🎖️", "distance-down": "📡", "emergency-stop": "🛑", place: "🛏️", "find-it": "👃", "roll-over": "🌀",
  "cat-target": "👆", "cat-come": "🔔", "cat-sit": "🪑", "cat-high-five": "🙌", "rabbit-come": "🐇", "rabbit-target": "🥢", "rabbit-carrier": "🧳" };
export const skillEmoji = (id) => SKILL_EM[id] || "⭐";
// Winding path: each node sits this many % left (-) or right (+) of the centre.
const WIND = [0, 16, 26, 16, 0, -16, -26, -16];
const ROW = 144, PAD = 36; // px per node row, and room above the first node for its "Start" tip

/** "chickens", "horses", "birds" for the coming-soon wording (the species label is singular for most). */
const kindOf = (p) => ({ chicken: "chickens", horse: "horses", bird: "birds", rabbit: "rabbits", cat: "cats", dog: "dogs" }[p.species] || "your kind of pet");

/** Nova with a speech bubble (v7). mood: proud | think | sleepy adds a tiny badge on her head. */
export function novaSay(text, mood = "", ...extra) {
  const badge = { proud: "✨", think: "💭", sleepy: "💤" }[mood];
  return h("div.nova-say", h("span.ns-head", h("img.disc.nova-face", { src: NOVA, alt: "", width: "44", height: "44" }), badge ? h("span.ns-badge", em(badge)) : null),
    h("p.bubble", h("span.vh", "Nova says: "), text), ...extra);
}
/** A round picture with a progress ring around it (a conic gradient, so no SVG maths). */
export const ringIcon = (emoji, pct, cls = "") => h(`span.rg${cls ? `.${cls}` : ""}`, { style: `--p:${Math.max(0, Math.min(100, Math.round(pct)))}`, "aria-hidden": "true" }, h("span.rg-face", emoji));

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
  const ordered = GROUPS.flatMap((g) => skills.filter((s) => s.level === g)).concat(skills.filter((s) => !GROUPS.includes(s.level)));
  // The node that pulses "Start": today's quest skill, else the first skill still below level 3.
  const curId = q && !q.done && ordered.some((s) => s.id === q.skillId) ? q.skillId
    : (ordered.find((s) => ((a.progress[s.id] || {}).level || 0) < 3) || ordered[0] || {}).id;
  put(main, sampleStrip(p),
    pageHead("Train"), trainNav("skills"), levelStrip(p, a),
    novaSay(!skills.length ? `Skills for ${kindOf(p)} are coming. Stamps and lessons are open now.` : q && q.done ? "Today's quest is done. Proud of you both." : q ? `Weakest link first: ${q.statLabel}. Five minutes. Go.` : "Short, happy sessions. Stop while it's still fun.", !skills.length ? "think" : q && q.done ? "proud" : ""));
  if (!skills.length) {
    put(main, h("div.card.soon-card",
      h("img.disc", { src: NOVA, alt: "", width: "56", height: "56" }),
      h("div", h("h2", `Skills for ${kindOf(p)}: coming soon`),
        h("p", "Until then, collect Adventure stamps and take Academy lessons. Every care log still counts."),
        h("div.row-btns.left",
          h("a.btn.btn-line.sm", { href: "#/adventures", "data-k": "soon-adv" }, "Adventures"),
          p.species === "chicken" ? null : h("button.linkish", { type: "button", "data-k": "soon-log", onclick: () => eventSheet("training") }, "Log practice")))));
  }
  if (q) {
    put(main, h("section.quest-card.tq", { "aria-labelledby": "dq-h" },
      h("span.tq-em", { "aria-hidden": "true" }, skillEmoji(q.skillId)),
      h("p.eyebrow", { id: "dq-h" }, "Today's quest · optional"),
      howTo(q.skillId, q.text, { k: "quest-howto" }),
      q.done ? h("p.small", em("✅"), " Done today. Nova approves.")
        : h("div.row-btns.left", h("a.btn.btn-blue", { href: `#/train/${encodeURIComponent(q.skillId)}/start`, "data-k": "quest-start" }, em("⏱️"), " Start the timer")),
      h("button.linkish", { type: "button", "data-k": "swap-focus", onclick: () => focusPicker(p, skills) }, "Change this week's skill")));
  }
  if (!p.sample && quizSkills(p).length) {
    put(main, h("a.lc-pill", { href: "#/placement", "data-k": "lc-open" }, em("🧭"), h("span", p.placement ? "Redo the level check" : "Already trained? Take the level check"), chevron()));
  }
  let secN = 0;
  for (const g of GROUPS) {
    const list = skills.filter((s) => s.level === g);
    if (list.length) put(main, pathSection(g, ++secN, list, a, curId));
  }
  const other = skills.filter((s) => !GROUPS.includes(s.level));
  if (other.length) put(main, pathSection("More", ++secN, other, a, curId));
  put(main, skills.length ? streakCard(p) : null, weekly(p, a));
  put(main, h("details.fold.how-levels", h("summary", "How levels work"),
    h("p.small", `Levels need ${LEVEL_REQ.slice(1).join(", ")} sessions, each with a self-check at a harder place: home, garden, street, park (or, for skills like stay and alone time, a little longer each time). Up to ${CAPS.sessions} sessions per skill, and ${CAPS.sessionsPerDay} in total, count each day.`),
    h("p.small", "Every 4 weeks of practice earns a grace week (up to 2), so one busy week won't break your practice weeks."),
    h("p.small", "💛 Kind methods only: treats, toys and praise. No shouting, no shock, prong or choke collars.")));
}

/** The partner's level at the top of the path: "Bran · Level 3 · 40 XP to next", with a gold bar (XP is a reward). */
function levelStrip(p, a) {
  const lv = a.level;
  return h("section.tr-strip", { "aria-label": `${p.name}'s level` },
    h("span.tr-av", avatar(p, 40)),
    h("p.tr-line", h("b.tr-name", p.name), h("span.tr-lv", h("span", { "aria-hidden": "true" }, "· "), `Level ${lv.level}`),
      h("span.tr-xp", lv.max ? "Top level" : `${lv.need - lv.into} XP to next`)),
    bar(lv.max ? 1 : lv.into, lv.max ? 1 : lv.need, "gold"));
}

/** One section of the path: a banner (what it is, how far you are) and the winding nodes. */
function pathSection(g, n, list, a, curId) {
  const id = `lv-${g.replace(/\s/g, "-")}`;
  const gold = list.filter((s) => ((a.progress[s.id] || {}).level || 0) >= 3).length;
  return h("section.pth-sec", { "aria-labelledby": id },
    h(`header.pth-banner.g${n}`,
      h("div.pb-text", h("p.pb-eyebrow", `Section ${n}`), h("h2", { id }, g), h("p.pb-sub", BLURB[g] || "More to explore")),
      h("div.pb-stat", h("span.pb-medal", em(GROUP_EM[g] || "⭐")), h("span.pb-n", `${gold}/${list.length}`), h("span.vh", " skills at level 3 or more")),
      h("div.pb-bar", { "aria-hidden": "true" }, h("span", { style: { width: `${Math.round((gold / list.length) * 100)}%` } }))),
    pathOf(list.map((s) => skillNode(s, a.progress[s.id], s.id === curId))));
}

function skillNode(s, pr, cur) {
  const lvl = pr ? pr.level : 0;
  const state = lvl >= 5 ? "master" : lvl >= 3 ? "done" : lvl >= 1 || (pr && pr.sessions) ? "going" : "new";
  const off = ((S.settings.notForUs || {})[(pet() || {}).id] || []).includes(s.id);
  return {
    href: `#/train/${encodeURIComponent(s.id)}`, k: `sk-${s.id}`, emoji: skillEmoji(s.id), name: skillName(s), state, cur: cur && !off, off,
    pct: lvl >= 5 ? 100 : pr ? pr.frac * 100 : 0,
    chip: lvl >= 5 ? "★" : lvl >= 3 ? "✓" : lvl >= 1 ? `L${lvl}` : "",
    tip: pr && pr.ready ? "Check" : cur && !off ? "Start" : "", ready: !!(pr && pr.ready),
    vh: `. Level ${lvl} of 5. ${levelText(pr) || "Not started yet."}${off ? " Left out of quests." : ""}`,
  };
}

/** The winding path: nodes at fixed rows (a % offset each), joined by one curvy dashed line drawn as an SVG. */
export function pathOf(nodes) {
  const NS = "http://www.w3.org/2000/svg";
  const n = nodes.length, H = PAD + n * ROW;
  const cx = (i) => 50 + WIND[i % WIND.length];
  const cy = (i) => PAD + i * ROW + 40;
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 100 ${H}`); svg.setAttribute("preserveAspectRatio", "none"); svg.setAttribute("class", "pth-line"); svg.setAttribute("aria-hidden", "true");
  for (let i = 0; i < n - 1; i++) {
    const m = (cy(i) + cy(i + 1)) / 2;
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", `M${cx(i)} ${cy(i)} C${cx(i)} ${m} ${cx(i + 1)} ${m} ${cx(i + 1)} ${cy(i + 1)}`);
    path.setAttribute("class", nodes[i].state === "done" || nodes[i].state === "master" ? "on" : "");
    svg.append(path);
  }
  return h("ol.pth", { style: `--n:${n};--row:${ROW}px;--pad:${PAD}px` }, svg, nodes.map((nd, i) =>
    h("li.pn-li", { style: `--i:${i};--x:${WIND[i % WIND.length]}` },
      h(`a.pn.${nd.state}${nd.cur ? ".cur" : ""}${nd.off ? ".off" : ""}${nd.ready ? ".ready" : ""}`, { href: nd.href, "data-k": nd.k },
        nd.tip ? h("span.pn-tip", { "aria-hidden": "true" }, nd.tip) : null,
        h("span.pn-ring", { style: `--p:${Math.round(nd.pct)}`, "aria-hidden": "true" }, h("span.pn-face", nd.emoji), nd.chip ? h("span.pn-chip", nd.chip) : null),
        h("span.pn-name", nd.name), h("span.vh", nd.vh)))));
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
  const goal = !pr.next ? "Top level. Keep it fresh in new places."
    : pr.ready ? `Level ${pr.level} → ${pr.next}: ready for the self-check`
      : pr.needDay ? `Level ${pr.level} → ${pr.next}: one more practice day`
        : `Level ${pr.level} → ${pr.next}: ${pr.toGo} more session${pr.toGo === 1 ? "" : "s"}`;
  put(main,
    subBar(sk.title, "#/train", "Back to all skills"),
    sampleStrip(p),
    h(`section.sk-hero${pr.level >= 3 ? ".gold" : ""}`, { "aria-labelledby": "lv-h" },
      h("div.sk-top",
        h("span.sk-ring", { style: `--p:${pr.level >= 5 ? 100 : Math.round(pr.frac * 100)}`, "aria-hidden": "true" }, h("span.sk-face", skillEmoji(sk.id))),
        h("div.sk-head",
          h("p.eyebrow", `${sk.level} · ${sk.minutes} min a session`),
          h("h2", { id: "lv-h" }, `Level ${pr.level}`, h("span.lv-of", " of 5")),
          h("p.small", pr.level ? `Works ${placeFor(sk.id, pr.level).where}.` : "Just starting. Everyone does."),
          pips(pr.level))),
      pr.next ? [
        h("p.sk-goal", goal),
        bar(Math.min(pr.sessions, pr.need) - LEVEL_REQ[pr.level], pr.need - LEVEL_REQ[pr.level], "gold"),
        h("p.small.muted", `${pr.sessions} counted session${pr.sessions === 1 ? "" : "s"} · level ${pr.next} needs ${LEVEL_REQ[pr.next]}, and it works ${placeFor(sk.id, pr.next).where}.`),
        pr.ready ? h("div.ready-box",
          h("p", h("b", `Ready for level ${pr.next}?`), " One honest question first."),
          h("button.btn.btn-gold", { type: "button", "data-k": "self-check", onclick: () => selfCheck(p, sk, pr.next) }, `Level ${pr.next} self-check`)) : null,
      ] : h("p.sk-goal", goal)),
    h("div.sk-log",
      h("button.btn.btn-line.sm", { type: "button", "data-k": "log-skill", onclick: () => logSession(p, sk, { minutes: sk.minutes }) }, "Already did one? Log it"),
      lastCheck ? moreBtn(`${sk.title} level`, [[`Undo the level ${pr.level} check`, () => undoCheck(p, sk, pr.level, lastCheck)]]) : null,
      h("p.small.muted", `Today: ${today} of ${CAPS.sessions} counted sessions for this skill.`)),
    challengeCard(p, sk, pr.level),
    old !== "none" && pr.level === 0 ? h("p.note-line", em("📒"), ` In the old diary you marked this "${old === "got" ? "Got it" : "Practising"}". Levels start fresh: log sessions and do the self-checks.`) : null,
    clipBox,
    h("section.sec.skill-sec.sk-steps", { "aria-labelledby": "steps-h" }, h("h2", { id: "steps-h" }, "Steps"),
      howTo(sk.id, "Simple version (for everyone)", { open: true, k: "skill-howto" }),
      h("h3.sk-sub", "Step by step"),
      h("ol.steps-list", (sk.steps || []).map((s) => h("li", h("span", s)))), soon),
    h("div.sk-folds",
      h("details.fold.skill-fold", { "data-k": "why-fold" }, h("summary", em("💡"), " Why it matters"), h("p.skill-why", sk.why),
        sk.id === "muzzle" && inIreland() ? h("p.small", "🇮🇪 In Ireland, German Shepherds and some other breeds (Control of Dogs Regulations 1998) must wear a muzzle and be on a short, strong lead in public, held by someone over 16.") : null),
      h("details.fold.skill-fold", h("summary", em("⚠️"), " Common mistake"), h("p.skill-why", sk.mistake)),
      h("details.fold.skill-fold", h("summary", em("🩺"), " When to see a professional"), h("p.skill-why", sk.pro))),
    h("section.sec", { "aria-labelledby": "sh-h" },
      h("h2.sec-title", { id: "sh-h" }, "Sessions"),
      sessions.length ? h("ul.tl", sessions.slice(0, 12).map((e) => h("li.tl-item",
        h("button.tl-row", { type: "button", "data-k": `ev-${e.id}`, onclick: () => eventSheet("training", e) },
          h("span.tl-dot", { "aria-hidden": "true" }, { 1: "😕", 2: "🙂", 3: "🤩" }[e.mood] || "🎓"),
          h("span.tl-body", h("span.tl-time", `${fmtDay(e.at)}, ${fmtTime(e.at)}`),
            h("span.tl-text", [e.minutes ? `${e.minutes} min` : "", { 1: "Tricky", 2: "OK", 3: "Great" }[e.mood] || "", counted.has(e.id) ? "" : "not counted (over 3 that day)"].filter(Boolean).join(" · ") || "Session")),
          h("span.vh", ", edit"))))) : novaSay("No sessions yet. The first one is the hardest. Five minutes.", "sleepy")),
    notForUsRow(p, sk),
    h("p.note-line", em("💛"), " Short, happy sessions. Stop while it's still fun. Kind methods only."),
    h("div.sticky-cta.sk-cta",
      h("button.btn.btn-blue.wide", { type: "button", "data-k": "start-session", onclick: () => startSession(p, sk) }, em("⏱️"), ` Start ${sk.minutes}-minute session`)));
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
