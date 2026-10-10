// Training: the skill library (from data/skills.js), progress per pet, practice log and weekly streak.

import { S, pet, eventsOf, save, remove, refresh } from "../state.js";
import { h, put, em, uid, toast, weeklyStreak, isoWeek, fmtTime } from "../util.js";
import { skillsFor, progressOf, PROGRESS } from "../logic.js";
import { pageHead, sampleBanner, NOVA } from "./parts.js";
import { speciesOf } from "../forms.js";

const LEVELS = ["Foundation", "Next steps", "Fun"];

export function training(main, arg) {
  const p = pet();
  const skills = skillsFor(p);
  if (arg) {
    const sk = skills.find((s) => s.id === arg) || S.content.SKILLS.find((s) => s.id === arg);
    if (sk) { skillDetail(main, p, sk); return; }
  }
  put(main, sampleBanner(p), pageHead("Training", p.name));
  if (!skills.length) {
    put(main, h("div.card.soon-card",
      h("img.disc", { src: NOVA, alt: "", width: "64", height: "64" }),
      h("div", h("h2", `${speciesOf(p.species).label} training: coming soon`),
        h("p", "Nova is dog-first (she's biased). More species are on the way. Meanwhile, you can still log practice sessions below."))));
  } else {
    const counts = { none: 0, practising: 0, got: 0 };
    skills.forEach((s) => counts[progressOf(p, s.id)]++);
    put(main, h("ul.progress-sum", { "aria-label": "Progress" },
      h("li.got", h("b", String(counts.got)), " Got it"),
      h("li.practising", h("b", String(counts.practising)), " Practising"),
      h("li", h("b", String(counts.none)), " Not started")));
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
  if (other.length) put(main, h("ul.skill-list", other.map((s) => h("li", h("a.skill-card", { href: `#/training/${s.id}` }, h("span.skill-title", s.title))))));
  put(main, h("p.note-line", em("💛"), " Kind methods only: treats, toys and praise. No shouting, no shock, prong or choke collars."));
}

function streakCard(p) {
  const times = eventsOf("training").map((e) => e.at);
  const st = weeklyStreak(times);
  return h("section.streak-card", { "aria-labelledby": "st-h" },
    h("div.streak-top",
      h("div", h("h2", { id: "st-h" }, "Practice streak"),
        h("p.streak-n", em("🔥"), " ", h("b", String(st.weeks)), ` week${st.weeks === 1 ? "" : "s"}`)),
      h("button.btn.btn-gold", { type: "button", "data-k": "log-practice", onclick: () => logPractice(p) }, "Log practice")),
    h("ol.week-dots", { "aria-label": "Last 8 weeks" }, st.last8.map((w) =>
      h(`li${w.done ? ".done" : ""}${w.current ? ".current" : ""}`, h("span.vh", `${w.current ? "This week" : w.id}: ${w.done ? "practised" : "no practice logged"}`), h("span", { "aria-hidden": "true" }, w.done ? "✓" : "")))),
    h("p.small.muted", st.thisWeek ? "This week counts. " : "Practise once this week to keep it going. ",
      st.graces ? `Grace weeks saved: ${st.graces}. ` : "", "Every 4 weeks of practice earns a grace week (up to 2), so one busy week won't break it."));
}

async function logPractice(p, skillId) {
  const ev = { id: uid(), petId: p.id, type: "training", at: Date.now(), skillId };
  if (!skillId) delete ev.skillId;
  if (p.sample) ev.sample = true;
  // Logging practice on a skill you haven't started moves it to "Practising".
  const started = skillId && !(p.training || {})[skillId];
  await save("events", ev, { quiet: true });
  if (started) await save("pets", { ...p, training: { ...(p.training || {}), [skillId]: "practising" } }, { quiet: true });
  refresh();
  const sk = S.content.SKILLS.find((s) => s.id === skillId);
  toast(`Practice logged${sk ? `: ${sk.title}` : ""} at ${fmtTime(ev.at)}.`, [["Undo", async () => {
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
  const clipBox = h("div.clip", h("div.clip-fallback",
    h("img.disc", { src: NOVA, alt: "", width: "96", height: "96" }),
    h("p", h("b", "Clip coming soon"), h("br"), "Nova is rehearsing. Follow the steps below meanwhile.")));
  const setProgress = async (v) => {
    const training = { ...(p.training || {}) };
    if (v === "none") delete training[sk.id]; else training[sk.id] = v;
    await save("pets", { ...p, training });
    if (v === "got") toast(`${sk.title}: got it. Nice work, both of you.`);
  };
  put(main, 
    sampleBanner(p),
    h("a.back", { href: "#/training" }, "← All skills"),
    clipBox,
    h("div.page-head",
      h("p.eyebrow", `${sk.level} · ${sk.minutes} min a session`),
      h("h1", { tabindex: "-1", id: "page-title" }, sk.title)),
    h("fieldset.fs.progress-pick",
      h("legend", `${p.name}'s progress`),
      h("div.seg-radio", ["none", "practising", "got"].map((v) => {
        const id = `pr-${v}`;
        return [h("input", { type: "radio", name: "progress", id, value: v, checked: pr === v, onchange: () => setProgress(v) }), h("label", { for: id }, PROGRESS[v])];
      }))),
    h("div.practice-row",
      h("button.btn.btn-gold", { type: "button", "data-k": "log-skill", onclick: () => logPractice(p, sk.id) }, em("🎓"), " Log practice"),
      h("p.small.muted", `This week: ${thisWeek} session${thisWeek === 1 ? "" : "s"} · total ${practices.length}`)),
    h("section.sec.skill-sec", h("h2", "Why it matters"), h("p", sk.why)),
    h("section.sec.skill-sec", h("h2", "Steps"), h("ol.steps-list", (sk.steps || []).map((s) => h("li", s)))),
    h("section.sec.skill-sec.mistake", h("h2", em("⚠️"), " Common mistake"), h("p", sk.mistake)),
    h("section.sec.skill-sec.pro", h("h2", em("🧑‍⚕️"), " When to see a professional"), h("p", sk.pro)),
    h("p.note-line", em("💛"), " Short, happy sessions. Stop while it's still fun. Kind methods only."),
  );
  loadClip(clipBox, sk);
}

/** Show the skill's clip if the file exists (clips/<id>.mp4 or .gif); otherwise keep the fallback. */
async function loadClip(box, sk) {
  const base = (sk.clip || `clips/${sk.id}.mp4`).replace(/\.(mp4|gif|webm)$/i, "");
  const first = sk.clip || `${base}.mp4`;
  const urls = [first, ...[`${base}.mp4`, `${base}.gif`].filter((u) => u !== first)];
  for (const url of urls) {
    let ok = false;
    try { const r = await fetch(url, { method: "HEAD" }); ok = r.status === 200; } catch { ok = false; }
    if (!ok || !box.isConnected) continue;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const alt = `Nova demonstrating: ${sk.title}`;
    const media = /\.gif$/i.test(url)
      ? h("img", { src: url, alt, loading: "lazy" })
      : h("video", { src: url, controls: true, muted: true, loop: true, playsinline: true, autoplay: !reduce, preload: "metadata", "aria-label": alt });
    if (media.tagName === "VIDEO") { media.muted = true; media.setAttribute("playsinline", ""); }
    box.replaceChildren(media);
    return;
  }
}
