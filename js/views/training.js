// Training: the skill library (from data/skills.js), progress per pet, practice log and weekly streak.

import { S, pet, eventsOf, save, remove, refresh, UI } from "../state.js";
import { h, put, em, uid, toast, weeklyStreak, isoWeek, motionOK, buzz } from "../util.js";
import { skillsFor, progressOf, PROGRESS } from "../logic.js";
import { pageHead, subBar, sampleStrip, NOVA } from "./parts.js";
import { speciesOf, segmented } from "../forms.js";

const LEVELS = ["Foundation", "Next steps", "Fun"];

export function training(main, arg) {
  const p = pet();
  const skills = skillsFor(p);
  if (arg) {
    const sk = skills.find((s) => s.id === arg) || S.content.SKILLS.find((s) => s.id === arg);
    if (sk) { skillDetail(main, p, sk); return; }
  }
  put(main, sampleStrip(p), pageHead("Training"));
  if (!skills.length) {
    put(main, h("div.card.soon-card",
      h("img.disc", { src: NOVA, alt: "", width: "56", height: "56" }),
      h("div", h("h2", `${speciesOf(p.species).label} training: coming soon`),
        h("p", "Nova is dog-first (she's biased). More species are on the way. Meanwhile, you can still log practice below."))));
  } else {
    const got = skills.filter((s) => progressOf(p, s.id) === "got").length;
    const practising = skills.filter((s) => progressOf(p, s.id) === "practising").length;
    put(main, h("div.progress-sum",
      h("p", h("b", `${got} of ${skills.length} learned`), practising ? h("span.muted", ` · ${practising} practising`) : null),
      h("div.bar", { "aria-hidden": "true" }, h("span", { style: { width: `${Math.round((got / skills.length) * 100)}%` } }))));
  }
  put(main, streakCard(p));
  for (const level of LEVELS) {
    const list = skills.filter((s) => s.level === level);
    if (!list.length) continue;
    put(main, h("section.sec", { "aria-labelledby": `lv-${level}` },
      h("h2.sec-title", { id: `lv-${level}` }, level),
      h("ul.skill-list", list.map((s) => {
        const pr = progressOf(p, s.id);
        return h("li", h("a.skill-card", { href: `#/training/${encodeURIComponent(s.id)}` },
          h("span.skill-title", s.title),
          h("span.skill-meta", `${s.minutes} min a session`),
          h(`span.pill.pr-${pr}`, PROGRESS[pr])));
      }))));
  }
  const other = skills.filter((s) => !LEVELS.includes(s.level));
  if (other.length) put(main, h("ul.skill-list", other.map((s) => h("li", h("a.skill-card", { href: `#/training/${encodeURIComponent(s.id)}` }, h("span.skill-title", s.title))))));
  put(main, h("p.note-line", em("💛"), " Kind methods only: treats, toys and praise. No shouting, no shock, prong or choke collars."));
}

function streakCard(p) {
  const st = weeklyStreak(eventsOf("training").map((e) => e.at));
  // The week that just closed (first practice this week) gets one gold ring pulse.
  const pulse = UI.weekPulse && UI.weekPulse === isoWeek(Date.now()) && st.thisWeek;
  if (pulse) UI.weekPulse = "";
  return h("section.streak-card", { "aria-labelledby": "st-h" },
    h("div.streak-top",
      h("div", h("h2", { id: "st-h" }, "Practice streak"),
        h("p.streak-n", h("b", String(st.weeks)), ` week${st.weeks === 1 ? "" : "s"}`)),
      h("button.btn.btn-blue", { type: "button", "data-k": "log-practice", onclick: () => logPractice(p) }, "Log practice")),
    h("ol.week-dots", { "aria-label": "Last 8 weeks" }, st.last8.map((w) =>
      h(`li${w.done ? ".done" : ""}${w.current ? ".current" : ""}${w.current && pulse && motionOK() ? ".pulse" : ""}`,
        h("span.vh", `${w.current ? "This week" : (w.label || w.id)}: ${w.done ? "practised" : "no practice logged"}`),
        h("span", { "aria-hidden": "true" }, w.done ? "✓" : "")))),
    h("p.small.muted", st.thisWeek ? (pulse ? `Week ${st.weeks}. Acceptable. ` : "This week counts. ") : "Practise once this week to keep it going. ",
      st.graces ? `Grace weeks saved: ${st.graces}. ` : "", "Every 4 weeks of practice earns a grace week (up to 2), so one busy week won't break it."));
}

async function logPractice(p, skillId) {
  const ev = { id: uid(), petId: p.id, type: "training", at: Date.now(), skillId };
  if (!skillId) delete ev.skillId;
  if (p.sample) ev.sample = true;
  const before = weeklyStreak(eventsOf("training").map((e) => e.at));
  // Logging practice on a skill you haven't started moves it to "Practising".
  const started = skillId && !(p.training || {})[skillId];
  await save("events", ev, { quiet: true });
  if (started) await save("pets", { ...p, training: { ...(p.training || {}), [skillId]: "practising" } }, { quiet: true });
  const after = weeklyStreak(eventsOf("training").map((e) => e.at));
  const closed = !before.thisWeek && after.thisWeek;
  if (closed) UI.weekPulse = isoWeek(ev.at);
  buzz(10);
  refresh();
  const sk = S.content.SKILLS.find((s) => s.id === skillId);
  toast(closed ? `Week ${after.weeks}. Acceptable.` : `Practice logged${sk ? `: ${sk.title}` : ""}. I supervised.`, [["Undo", async () => {
    await remove("events", ev.id, { quiet: true });
    if (started) {
      const now = S.pets.find((x) => x.id === p.id);
      const training = { ...(now.training || {}) };
      delete training[skillId];
      await save("pets", { ...now, training }, { quiet: true });
    }
    refresh();
  }]]);
}

// ---------- one skill ----------
function skillDetail(main, p, sk) {
  const pr = progressOf(p, sk.id);
  const practices = eventsOf("training").filter((e) => e.skillId === sk.id);
  const wk = isoWeek(Date.now());
  const thisWeek = practices.filter((e) => isoWeek(e.at) === wk).length;
  const clipBox = h("div.clip", { hidden: true });
  const soon = h("p.clip-soon", h("img.disc", { src: NOVA, alt: "", width: "32", height: "32" }), h("span", h("b", "Clip coming soon."), " Nova is rehearsing."));
  const setProgress = async (v) => {
    const training = { ...(p.training || {}) };
    if (v === "none") delete training[sk.id]; else training[sk.id] = v;
    await save("pets", { ...p, training });
    if (v === "got") toast(`${sk.title}: got it. Nice work, both of you.`);
  };
  put(main,
    subBar(sk.title, "#/training", "Back to all skills"),
    sampleStrip(p),
    clipBox,
    h("p.eyebrow.skill-eyebrow", `${sk.level} · ${sk.minutes} min a session`),
    segmented("progress", `${p.name}'s progress`, ["none", "practising", "got"].map((v) => [v, PROGRESS[v]]), pr, setProgress),
    h("div.practice-row",
      h("button.btn.btn-blue", { type: "button", "data-k": "log-skill", onclick: () => logPractice(p, sk.id) }, "Log practice"),
      h("p.small.muted", `This week: ${thisWeek} session${thisWeek === 1 ? "" : "s"} · total ${practices.length}`)),
    h("section.sec.skill-sec", h("h2", "Why it matters"), h("p", sk.why)),
    h("section.sec.skill-sec", h("h2", "Steps"), h("ol.steps-list", (sk.steps || []).map((s) => h("li", s))), soon),
    h("section.sec.skill-sec.mistake", h("h2", "Common mistake"), h("p", sk.mistake)),
    h("section.sec.skill-sec.pro", h("h2", "When to see a professional"), h("p", sk.pro)),
    h("p.note-line", em("💛"), " Short, happy sessions. Stop while it's still fun. Kind methods only."));
  loadClip(clipBox, soon, sk);
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
