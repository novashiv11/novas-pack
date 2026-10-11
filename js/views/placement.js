// The level check, Duolingo-style: one question per screen, big tap cards, a progress bar, then a result screen that
// goes straight into the first 1-minute win. It sets a starting level per skill (pet.placement, 0–4). No XP for answers:
// XP is for what you do from today, and badges still need a level reached by practice.

import { pet, save } from "../state.js";
import { h, put, motionOK } from "../util.js";
import { subBar } from "./parts.js";
import { skillsFor } from "../logic.js";
import { skillName, confetti } from "./gameui.js";
import { saveError } from "../forms.js";
import { doNow } from "./doitnow.js";

// Answer i sets level i: 0 not yet · 1 getting the idea · 2 at home · 3 garden or quiet place · 4 on walks or the street.
export const QUIZ = {
  recall: { e: "📣", q: "You call {name}. They…", a: ["Don't come yet", "Sometimes come", "Come, at home", "Come in the garden too", "Come on walks too"] },
  "loose-lead": { e: "🦮", q: "On the lead, {name}…", a: ["Pulls a lot", "Walks nicely a few steps", "Walks nicely at home or garden", "Walks nicely on quiet streets", "Walks nicely on busy streets"] },
  settle: { e: "🛏️", q: "On a mat or bed, {name}…", a: ["Won't stay", "Stays a few seconds", "Relaxes at home", "Relaxes away from home", "Relaxes even somewhere busy"] },
  "leave-it": { e: "✋", q: "Food drops. You say \"leave it\". {name}…", a: ["Grabs it", "Leaves it if I cover it", "Leaves it at home", "Leaves it in the park", "Leaves it on walks"] },
  "wait-doors": { e: "🚪", q: "The front door opens. {name}…", a: ["Bolts out", "Waits if I block", "Waits at home doors", "Waits at the gate too", "Waits at any door"] },
  handling: { e: "🖐️", q: "You touch {name}'s paws and ears…", a: ["Pulls away", "OK with treats", "Relaxed at home", "Relaxed with visitors", "Relaxed at the vet"] },
  "cat-carrier": { e: "🧳", q: "The carrier comes out. {name}…", a: ["Hides", "Sniffs from afar", "Goes in for treats", "Calm when carried", "Calm at the vet"] },
  "cat-handling": { e: "🐾", q: "You touch {name}'s paws…", a: ["Pulls away", "OK with treats", "Relaxed at home", "Lets me see a claw", "Calm for a trim"] },
};
const DOTS = ["·", "L1", "L2", "L3", "L4"];

/** Skills this pet can take the level check for. */
export const quizSkills = (p) => (p ? skillsFor(p).filter((s) => QUIZ[s.id]) : []);

export function placement(main) {
  const p = pet();
  const skills = quizSkills(p);
  if (!p || p.sample || !skills.length) {
    put(main, subBar("Level check", "#/home", "Back to Home"), h("p.empty", p && p.sample ? "The sample has its levels already. Add your own pet to do the level check." : "There's no level check for this pet yet."));
    return;
  }
  const cur = p.placement || {};
  const picked = {};
  skills.forEach((s) => { picked[s.id] = Number.isInteger(cur[s.id]) ? cur[s.id] : null; });
  let i = 0;
  const stage = h("div.lc2");
  const bar = h("div.lc2-bar", { role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(skills.length) }, h("span"));
  put(main, subBar("Level check", "#/home", "Skip the level check"), bar, stage);

  const show = () => {
    bar.setAttribute("aria-valuenow", String(i));
    bar.firstChild.style.width = `${(i / skills.length) * 100}%`;
    if (i >= skills.length) return results();
    const s = skills[i], def = QUIZ[s.id];
    const card = h(`section.lc2-card${motionOK() ? ".in" : ""}`, { "aria-labelledby": "lc2-q" },
      h("div.lc2-emoji", { "aria-hidden": "true" }, def.e),
      h("p.lc2-skill", `${i + 1} of ${skills.length} · ${skillName(s)}`),
      h("h1.lc2-q", { id: "lc2-q", tabindex: "-1" }, def.q.replace(/\{name\}/g, p.name)),
      h("div.lc2-opts", def.a.map((label, n) => h(`button.lc2-opt${picked[s.id] === n ? ".on" : ""}`, { type: "button", "data-k": `lc-${s.id}-${n}`, onclick: (e) => {
        picked[s.id] = n;
        e.currentTarget.classList.add("on");
        setTimeout(() => { i++; show(); }, motionOK() ? 220 : 0);
      } }, h("span.lc2-lv", { "aria-hidden": "true" }, DOTS[n]), h("span", label)))),
      h("div.lc2-foot",
        i > 0 ? h("button.linkish", { type: "button", "data-k": "lc-back", onclick: () => { i--; show(); } }, "← Back") : h("span"),
        h("button.linkish", { type: "button", "data-k": "lc-notsure", onclick: () => { picked[s.id] = 0; i++; show(); } }, "Not sure")));
    stage.replaceChildren(card);
    card.querySelector("h1").focus({ preventScroll: true });
  };

  const results = async () => {
    const placementRow = {};
    for (const s of skills) if (Number.isInteger(picked[s.id]) && picked[s.id] > 0) placementRow[s.id] = picked[s.id];
    const row = { ...p, placedAt: Date.now() };
    if (Object.keys(placementRow).length) row.placement = placementRow; else delete row.placement;
    try { await save("pets", row, { quiet: true }); } catch (ex) { stage.replaceChildren(h("p.form-error", saveError(ex))); return; }
    // The first win practises the skill that needs it most (lowest level; the first one on a tie).
    const weakest = skills.reduce((m, s) => ((picked[s.id] || 0) < (picked[m.id] || 0) ? s : m), skills[0]).id;
    if (motionOK()) confetti();
    const bk = main.querySelector(".sub-back .vh");
    if (bk) bk.textContent = "Back to Home";
    stage.replaceChildren(h(`section.lc2-card.lc2-done${motionOK() ? ".in" : ""}`, { "aria-labelledby": "lc2-done-h" },
      h("div.lc2-emoji", { "aria-hidden": "true" }, "🧭"),
      h("h1.lc2-q", { id: "lc2-done-h", tabindex: "-1" }, `Here's where ${p.name} starts`),
      h("ul.lc2-res", skills.map((s) => h("li", h("span", { "aria-hidden": "true" }, QUIZ[s.id].e), h("b", skillName(s)), h("span.lc2-lv.on", `L${picked[s.id] || 0}`)))),
      h("p.small.muted", "No XP for answers. XP is for what you do from today."),
      h("button.btn.btn-blue.wide", { type: "button", "data-k": "lc-first-win", onclick: () => { location.hash = "#/home"; setTimeout(() => doNow(row, weakest), 50); } }, "▶ Do your first 1-minute win"),
      h("a.btn.btn-line.wide", { href: "#/home", "data-k": "lc-home" }, "Go to Home")));
    stage.querySelector("h1").focus({ preventScroll: true });
  };
  show();
}
