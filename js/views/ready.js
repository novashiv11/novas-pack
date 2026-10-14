// "No pet yet? Get ready" (CRQ-024): a short checklist for people who are thinking about a pet. Ticks are stored in
// settings.ready. No XP (XP is for real life with a pet); finishing it gets a small celebration and "Add my pet".
// Vet first, adopt or buy responsibly, and never anything about selling or rehoming.
// v7: Nova's bubble reacts as you tick, chunky tiles with a round check, a gold progress bar, one bottom button.

import { S, setSetting, activePets } from "../state.js";
import { h, put, toast, buzz } from "../util.js";
import { subBar } from "./parts.js";
import { novaSay } from "./today.js";
import { bar, confetti } from "./gameui.js";
import { openPetSheet } from "../forms.js";
import { addSample } from "../sample.js";

const STEPS = [
  { id: "time", e: "⏰", t: "Time and money", d: "A pet needs you every day, plus food, vet care and insurance. Add it up first: costs vary a lot." },
  { id: "where", e: "🏠", t: "Adopt or buy responsibly", d: "A rescue or shelter, or a responsible breeder where you meet the mum. Never a pet from an ad you can't check." },
  { id: "vet", e: "🩺", t: "Pick a vet nearby", d: "Ask about first vaccines, neutering and microchipping (the law for dogs in Ireland and many other places)." },
  { id: "learn", e: "🎓", t: "Learn the basics", d: "How pets learn, and reading body language: two 2-minute lessons in the Academy (it opens with the sample too).", href: "#/trainer", go: "Open the Academy" },
  { id: "proof", e: "🔌", t: "Pet-proof your home", d: "Cables, bins, medicines and toxic foods (grapes, chocolate, xylitol) out of reach." },
  { id: "spot", e: "🛏️", t: "Make a calm spot", d: "A bed or mat, a water bowl, and a quiet corner that's theirs." },
  { id: "week", e: "📅", t: "Plan the first week", d: "Keep it quiet: lots of sleep, short sessions, toilet trips, no big outings yet." },
];

const SAY = (n) => (n === STEPS.length ? ["You're ready. Your pet is a lucky one.", "proud"]
  : n ? [`${n} of ${STEPS.length}. Keep going, you're doing right by them.`, "happy"]
    : ["No pet yet? Smart. Seven small things, and you'll be the human every pet hopes for.", "think"]);

export function ready(main) {
  const done = { ...(S.settings.ready || {}) };
  const count = () => STEPS.filter((s) => done[s.id]).length;
  const hasPet = activePets().length > 0;
  const prog = h("div.ready-prog");
  const say = h("div.ready-say");
  const showProg = () => {
    const n = count();
    prog.replaceChildren(h("p.ready-count", h("b", `${n} of ${STEPS.length}`), n === STEPS.length ? " · You're ready 🎉" : " done"), bar(n, STEPS.length, "gold"));
    say.replaceChildren(novaSay(...SAY(n)));
  };
  const list = h("ul.ready-list", STEPS.map((s) => {
    const id = `ready-${s.id}`;
    return h("li.ready-item",
      h("input", { type: "checkbox", id, "data-k": id, checked: !!done[s.id], onchange: async (e) => {
        done[s.id] = e.target.checked;
        buzz(10);
        try { await setSetting("ready", { ...done }); } catch { toast("Couldn't save on this device. Private browsing?"); }
        showProg();
        if (count() === STEPS.length && e.target.checked) { confetti(); toast("All ready. When your pet comes home, tap Add my pet."); }
      } }),
      h("label", { for: id }, h("span.ready-e", { "aria-hidden": "true" }, s.e), h("span.ready-t", h("b", s.t), h("span.small.muted.block", s.d))),
      s.href && hasPet ? h("a.text-link.ready-go", { href: s.href }, s.go) : null);
  }));
  showProg();
  put(main,
    hasPet ? subBar("Get ready", "#/more", "Back to More") : subBar("Get ready", "#/welcome", "Back"),
    say,
    prog,
    list,
    h("p.small.muted.ready-vet", "Health questions? Your vet first, always."),
    h("div.ready-foot",
      h("button.btn.btn-blue.wide", { type: "button", "data-k": "ready-add", onclick: () => { if (hasPet) openPetSheet(); else location.hash = "#/welcome/add"; } }, "Add my pet"),
      hasPet ? null : h("button.btn.btn-line.wide", { type: "button", "data-k": "ready-peek", onclick: async () => {
        try { await addSample(); location.hash = "#/home"; } catch { toast("Couldn't save on this device. Private browsing?"); }
      } }, "Peek at a sample pet")));
}
