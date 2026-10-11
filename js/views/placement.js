// The level check: "Where is {name} now?" A minute of questions with answers anchored to what you've actually seen.
// It sets a starting level per skill (pet.placement, 0–4) so nobody starts from zero on things their pet can already do.
// No XP for answers: XP is for what you do from today. Badges still need a level reached by practice.

import { S, pet, save } from "../state.js";
import { h, put, toast } from "../util.js";
import { subBar } from "./parts.js";
import { skillsFor } from "../logic.js";
import { celebrate, skillName } from "./gameui.js";
import { saveError } from "../forms.js";

// Answer i sets level i: 0 not yet · 1 getting the idea · 2 at home · 3 garden or quiet place · 4 on the street.
export const QUIZ = {
  recall: { q: "You call {name} once, in a happy voice. What happens?", a: ["Doesn't come yet, or I haven't tried", "Comes sometimes, at home", "Comes almost every time at home", "Comes in the garden or a quiet park too", "Comes on walks, even with smells around"] },
  "loose-lead": { q: "On the lead, {name}…", a: ["Pulls most of the time", "Walks nicely for a few steps", "Walks nicely indoors or in the garden", "Walks nicely on quiet streets", "Walks nicely on busier streets too"] },
  settle: { q: "You ask {name} to lie on a mat or bed and relax…", a: ["Won't stay yet", "Stays a few seconds, with treats", "Stays a few minutes at home", "Settles somewhere quiet away from home", "Settles on a busy street bench too"] },
  "leave-it": { q: "A treat drops on the floor and you say \"leave it\"…", a: ["Grabs it", "Leaves it if I cover it with my hand", "Leaves it at home", "Leaves food in the garden or a quiet park", "Leaves food on walks too"] },
  "wait-doors": { q: "You open the front door…", a: ["Bolts or pushes past", "Waits a second if I block the way", "Waits at doors at home until I say OK", "Waits at the garden gate too", "Waits at doors anywhere, even the car"] },
  handling: { q: "You touch {name}'s paws, ears and mouth…", a: ["Pulls away or looks worried", "OK for a second, with treats", "Relaxed at home", "Relaxed with a visitor or groomer", "Relaxed at the vet"] },
  "cat-carrier": { q: "The carrier comes out. {name}…", a: ["Hides", "Sniffs it from a distance", "Goes in for treats at home", "Stays calm in it while I carry it at home", "Stays calm in the car or at the vet"] },
  "cat-handling": { q: "You touch {name}'s paws…", a: ["Pulls away or swats", "OK for a second, with treats", "Relaxed at home", "Lets me press a toe to show a claw", "Stays calm for a claw trim"] },
};

/** Skills this pet can take the level check for. */
export const quizSkills = (p) => (p ? skillsFor(p).filter((s) => QUIZ[s.id]) : []);

export function placement(main) {
  const p = pet();
  const skills = quizSkills(p);
  const back = "#/home";
  if (!p || p.sample || !skills.length) {
    put(main, subBar("Level check", back, "Back to Home"), h("p.empty", p && p.sample ? "The sample has its levels already. Add your own pet to do the level check." : "There's no level check for this pet yet."));
    return;
  }
  const cur = p.placement || {};
  const picked = {};
  const form = h("form.form.lc", { novalidate: true });
  skills.forEach((s, qi) => {
    const def = QUIZ[s.id];
    const name = `lc-${s.id}`;
    picked[s.id] = Number.isInteger(cur[s.id]) ? cur[s.id] : null;
    form.append(h("fieldset.fs.lc-q",
      h("legend", h("span.lc-n", `${qi + 1} of ${skills.length} · ${skillName(s)}`), h("span.lc-text", def.q.replace(/\{name\}/g, p.name))),
      h("div.lc-opts", def.a.map((label, i) => {
        const id = `${name}-${i}`;
        return [h("input", { type: "radio", name, id, value: String(i), checked: picked[s.id] === i, onchange: () => { picked[s.id] = i; } }),
          h("label", { for: id }, h("span.lc-lv", { "aria-hidden": "true" }, i === 0 ? "·" : `L${i}`), h("span", label))];
      }).flat())));
  });
  const err = h("p.form-error", { role: "alert" });
  form.append(err, h("div.row-btns",
    h("a.btn.btn-line", { href: back, "data-k": "lc-skip" }, "Skip for now"),
    h("button.btn.btn-blue", { type: "submit", "data-k": "lc-save" }, "Set our starting levels")));
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const placementRow = {};
    for (const s of skills) if (Number.isInteger(picked[s.id]) && picked[s.id] > 0) placementRow[s.id] = picked[s.id];
    const row = { ...p, placement: Object.keys(placementRow).length ? placementRow : undefined, placedAt: Date.now() };
    if (!row.placement) delete row.placement;
    try { await save("pets", row, { quiet: true }); } catch (ex) { err.textContent = saveError(ex); return; }
    const best = Object.entries(placementRow).sort((a, b) => b[1] - a[1]);
    location.hash = "#/train";
    celebrate([{ emoji: "🧭", title: "Starting point set",
      text: best.length
        ? `${best.slice(0, 3).map(([id, lv]) => `${skillName(skills.find((s) => s.id === id))} level ${lv}`).join(", ")}. Not starting from zero. Noted. XP starts with what you do from today.`
        : `Fresh start for ${p.name}. Every level from here is earned together. XP starts today.` }]);
    toast("Saved. You can redo the level check from Train any time.");
  });
  put(main,
    subBar("Level check", back, "Skip"),
    h("p.lede", `Where is ${p.name} now? One minute. Answer what you've actually seen, not what you hope. It sets your starting levels, so you don't start from zero.`),
    h("p.small.muted", "No XP for answers, and no wrong ones. Not sure? Pick the lower one: levelling up is the fun part."),
    form);
}
