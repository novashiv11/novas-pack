// v10 Challenge mode: the 3 Ds (distance, duration, distraction). Once a skill is at level 2+, the skill page shows a
// "Challenge" card. One tap rolls a proofing challenge that changes ONE D only, with numbers scaled by the skill's level.
// "Too hard? Make it easier" swaps in an easier version. "Start" opens the normal timer, so the session logs as usual.
// No extra XP and no change to the data: the only thing stored is the last challenge per pet and skill, in
// settings.challenge = { [petId]: { [skillId]: { id, easy } } }.

import { S, setSetting } from "../state.js";
import { h, put, em } from "../util.js";
import { sound } from "../sound.js";

// What kind of skill it is decides which challenges fit.
//  hold: a position or a wait that can last; move: you and the dog moving; cue: a one-off behaviour or game;
//  social: calm around people and triggers (no "ask from far away" for these); care: handling and gear. Toilet training and alone time get no challenges (they follow their own gentle plans).
const KIND = {
  sit: "hold", down: "hold", stay: "hold", settle: "hold", place: "hold", "distance-down": "hold", "wait-doors": "hold",
  recall: "move", "loose-lead": "move", heel: "move", "check-in": "move", "emergency-stop": "move",
  "trick-spin": "cue", "roll-over": "cue", "find-it": "cue", "talk-buttons": "cue", "drop-it": "cue", "leave-it": "cue", "look-at-that": "social", greetings: "social",
  handling: "care", "cat-handling": "care", muzzle: "care", "cat-carrier": "care",
  // v11: cats and rabbits (indoor-friendly challenges only, see INDOOR_ONLY)
  "cat-target": "cue", "cat-come": "cue", "cat-sit": "hold", "cat-high-five": "cue",
  "rabbit-come": "cue", "rabbit-target": "cue", "rabbit-carrier": "care",
};
// Small pets and cats: no outdoor, jogging or ball-bouncing challenges.
const INDOOR_ONLY = /^(cat|rabbit)-/;
const NOT_INDOORS = new Set(["dx-out", "dx-jog", "dx-ball"]);

// Safety notes that show with every challenge for these skills.
const SAFE = {
  "emergency-stop": "Emergency stop: only in a safe, enclosed space.",
  "roll-over": "Soft surface only. Stop if your dog seems stiff or sore.",
  recall: "Outdoors, use a long line or a safely enclosed space.",
  "look-at-that": "Stay far enough away that your dog still takes treats.",
};
// Some notes only matter for some challenges (the recall one is about going outdoors; the long-line challenge has its own).
const SAFE_IF = { recall: (c) => c.id === "dx-out" };
/** The safety notes for a challenge on a skill: the challenge's own, then the skill's. */
export function notesFor(c, skillId) {
  const fits = SAFE_IF[skillId] ? SAFE_IF[skillId](c) : true;
  return [c.note, fits ? SAFE[skillId] : null].filter(Boolean);
}

export const DS = {
  distance: { em: "📏", name: "Distance" },
  duration: { em: "⏳", name: "Duration" },
  distraction: { em: "🧸", name: "Distraction" },
};

// Each challenge: { id, d, kinds?, skills?, text, n?, easy?, note? }.
// n has five numbers: [easier, level 2, level 3, level 4, level 5]. {n} in the text takes the number;
// the easier version takes the one before it. Challenges without n give their own `easy` text.
const C = [
  // ---------- distance ----------
  { id: "ds-steps", d: "distance", kinds: ["hold", "cue"], n: [1, 2, 3, 5, 8], text: "Ask from {n} steps away." },
  { id: "ds-chair", d: "distance", kinds: ["hold", "cue"], n: [0, 1, 2, 3, 4], text: "Ask while you sit on a chair, {n} steps away.", easyText: "Ask while you sit on a chair right next to your dog." },
  { id: "ds-turn", d: "distance", kinds: ["hold", "cue"], n: [0, 1, 2, 3, 5], text: "Ask with your side turned, {n} steps away.", easyText: "Ask with your side turned, right next to your dog." },
  { id: "ds-kneel", d: "distance", kinds: ["hold", "cue"], n: [1, 2, 3, 4, 6], text: "Ask while kneeling {n} steps away." },
  { id: "ds-away", d: "distance", kinds: ["hold"], n: [1, 2, 3, 5, 8], text: "Step {n} steps away, come back, then reward." },
  { id: "ds-circle", d: "distance", kinds: ["hold"], n: [0, 1, 2, 3, 4], text: "Walk a slow circle around your dog, {n} steps out.", easyText: "Walk half a circle around your dog, close by." },
  { id: "ds-send", d: "distance", skills: ["place"], n: [1, 2, 3, 5, 8], text: "Send your dog to the bed from {n} steps away." },
  { id: "ds-room", d: "distance", skills: ["recall"], text: "Call from the next room.", easy: "Call from the doorway, where you can still see each other." },
  { id: "ds-line", d: "distance", skills: ["recall", "check-in"], n: [3, 5, 8, 12, 20], text: "On a long line, let your dog wander {n} steps away first.", note: "Use a long line on a flat harness, never on a collar." },
  { id: "ds-heel", d: "distance", skills: ["heel"], n: [0, 1, 2, 3, 4], text: "Start {n} steps apart and call your dog into heel.", easyText: "Start right beside your dog and say the heel cue." },
  { id: "ds-stop", d: "distance", skills: ["emergency-stop"], n: [1, 2, 3, 5, 8], text: "Give the stop cue when your dog is {n} steps away." },
  { id: "ds-hide", d: "distance", skills: ["find-it"], n: [2, 3, 5, 8, 12], text: "Hide the treat {n} steps away." },

  // ---------- duration ----------
  { id: "du-hold", d: "duration", kinds: ["hold"], n: [3, 5, 10, 20, 30], text: "Hold it for {n} seconds before the treat." },
  { id: "du-count", d: "duration", kinds: ["hold"], n: [2, 3, 5, 10, 15], text: "Count to {n} out loud, then reward." },
  { id: "du-more", d: "duration", kinds: ["hold"], n: [2, 3, 5, 10, 15], text: "Reward, then ask for {n} more seconds before the release." },
  { id: "du-reps", d: "duration", kinds: ["hold", "move", "cue", "social"], n: [2, 3, 4, 5, 6], text: "Do {n} in a row, with a treat each time." },
  { id: "du-mat", d: "duration", skills: ["settle", "place"], n: [1, 1, 2, 4, 6], text: "Stay on the bed for {n} min while you read or sip a drink.", easyText: "Stay on the bed for 30 seconds while you read." },
  { id: "du-steps", d: "duration", skills: ["heel", "loose-lead"], n: [3, 5, 10, 20, 30], text: "Walk {n} steps in a row before you reward." },
  { id: "du-collar", d: "duration", skills: ["recall"], n: [0, 1, 2, 3, 5], text: "When your dog arrives, gently hold the collar for {n} seconds, then treat.", easyText: "When your dog arrives, touch the collar, then treat." },
  { id: "du-stop", d: "duration", skills: ["emergency-stop"], n: [1, 2, 3, 5, 8], text: "Hold the stop for {n} seconds before the release." },
  { id: "du-leave", d: "duration", skills: ["leave-it"], n: [1, 2, 3, 5, 10], text: "Wait {n} seconds of looking away before the reward." },
  { id: "du-hides", d: "duration", skills: ["find-it"], n: [1, 2, 3, 4, 5], text: "Do {n} searches in a row, a little harder each time." },
  { id: "du-paw", d: "duration", skills: ["handling", "cat-handling"], n: [1, 2, 3, 5, 8], text: "Hold each touch for {n} seconds, a treat after each." },
  { id: "du-muzzle", d: "duration", skills: ["muzzle"], n: [5, 10, 20, 30, 60], text: "Muzzle on for {n} seconds, feeding treats through it." },
  { id: "du-carrier", d: "duration", skills: ["cat-carrier"], n: [2, 3, 5, 10, 20], text: "Close the door for {n} seconds, with treats through the gaps." },

  // ---------- distraction ----------
  { id: "dx-toy", d: "distraction", kinds: ["hold", "move", "cue", "social", "care"], text: "With a toy on the floor nearby.", easy: "With a toy on a chair, out of reach." },
  { id: "dx-food", d: "distraction", kinds: ["hold", "cue"], n: [5, 4, 3, 2, 1], text: "With a treat on the floor {n} steps away. Keep a foot ready to cover it." },
  { id: "dx-walker", d: "distraction", kinds: ["hold", "move", "cue", "social", "care"], text: "While someone walks past.", easy: "While someone sits still in the room." },
  { id: "dx-ball", d: "distraction", kinds: ["hold", "cue"], text: "While you bounce a ball gently.", easy: "While you hold a ball still in your hand." },
  { id: "dx-music", d: "distraction", kinds: ["hold", "move", "cue", "social", "care"], text: "With the TV or music on.", easy: "With quiet music on, turned low." },
  { id: "dx-room", d: "distraction", kinds: ["hold", "move", "cue", "social", "care"], text: "In a room where you never practise.", easy: "In your usual room, but in a new spot." },
  { id: "dx-out", d: "distraction", kinds: ["hold", "move", "cue", "social"], text: "Outside somewhere quiet, like a garden or a quiet path.", easy: "By an open door, still inside.", note: "Check the ground is clear of litter, bones and anything harmful first." },
  { id: "dx-door", d: "distraction", skills: ["place", "settle", "stay", "wait-doors", "sit", "down"], text: "While someone knocks on the door.", easy: "While someone taps softly on a table." },
  { id: "dx-snack", d: "distraction", kinds: ["hold"], text: "While you eat a snack.", easy: "While you hold a snack, not eating it." },
  { id: "dx-jog", d: "distraction", kinds: ["hold", "cue"], text: "Right after you jog a few steps.", easy: "Right after you take one quick step." },
  { id: "dx-sniff", d: "distraction", kinds: ["move"], text: "Past a smelly spot, like a lamp post or a hedge.", easy: "Near a smelly spot, but not right past it." },
  { id: "dx-phone", d: "distraction", kinds: ["hold", "move", "cue", "social", "care"], text: "While your phone pings or rings.", easy: "While you hold your phone and scroll." },
  { id: "dx-crisps", d: "distraction", kinds: ["hold", "move", "cue", "social"], text: "While someone rustles a crisp packet.", easy: "While someone folds a tea towel." },
];

const LV = (level) => Math.max(0, Math.min(5, level) - 2); // level 2 → 0 … level 5 → 3

/** The challenges that fit a skill. Empty for skills with no challenges (toilet training, alone time). */
export function challengesFor(skillId) {
  const kind = KIND[skillId];
  if (!kind) return [];
  return C.filter((c) => (c.skills ? c.skills.includes(skillId) : (c.kinds || []).includes(kind)) && !(INDOOR_ONLY.test(skillId) && NOT_INDOORS.has(c.id)));
}

/** The text for one challenge at a level, normal or easier. */
export function challengeText(c, level, easy = false) {
  const i = LV(level);
  if (c.n) {
    const n = easy ? c.n[i] : c.n[i + 1];
    if (easy && !n && c.easyText) return c.easyText;
    if (easy && c.easyText && i === 0 && c.n[0] === c.n[1]) return c.easyText;
    return c.text.replace("{n}", String(n)).replace(/\b1 (step|second|search)(e?s)\b/g, "1 $1");
  }
  return easy ? c.easy : c.text;
}

/** Roll a new challenge: a random D first (so each D comes up as often), then a random challenge, never the same one twice running. */
export function rollChallenge(skillId, lastId, rnd = Math.random) {
  const all = challengesFor(skillId);
  if (!all.length) return null;
  const pool = all.length > 1 ? all.filter((c) => c.id !== lastId) : all;
  const ds = [...new Set(pool.map((c) => c.d))];
  const d = ds[Math.floor(rnd() * ds.length)];
  const list = pool.filter((c) => c.d === d);
  return list[Math.floor(rnd() * list.length)];
}

const saved = (p, sk) => ((S.settings.challenge || {})[p.id] || {})[sk.id] || null;
async function remember(p, sk, value) {
  const all = S.settings.challenge || {};
  await setSetting("challenge", { ...all, [p.id]: { ...(all[p.id] || {}), [sk.id]: value } });
}

/** The Challenge card for a skill page, or null below level 2 or for skills with no challenges. */
export function challengeCard(p, sk, level) {
  if (!p || level < 2 || !challengesFor(sk.id).length) return null;
  const box = h("section.ch-card", { "aria-labelledby": `ch-h-${sk.id}`, "data-k": "challenge-card" });
  // "your dog" → the pet's name, so it reads personal and stays right for cats (talk buttons, carrier, handling).
  const pal = (t) => (p.name ? t.replace(/\byour dog\b/g, p.name).replace(/\bYour dog\b/g, p.name) : t.replace(/\byour dog\b/g, "your pet"));
  const draw = (focus) => {
    box.replaceChildren();
    const s = saved(p, sk);
    const c = s && challengesFor(sk.id).find((x) => x.id === s.id);
    const easy = !!(s && s.easy);
    const roll = async () => {
      const next = rollChallenge(sk.id, c && c.id);
      if (!next) return;
      sound("tick");
      await remember(p, sk, { id: next.id, easy: false });
      draw("ch-roll");
    };
    const head = h("div.ch-head",
      h("span.ch-ico", { "aria-hidden": "true" }, "🎯"),
      h("div",
        h("h2", { id: `ch-h-${sk.id}` }, "Challenge"),
        h("p.small", "Change one thing: distance, duration or distraction. Keep the other two easy.")));
    if (!c) {
      put(box, head, h("button.btn.btn-line.wide.ch-roll", { type: "button", "data-k": "ch-roll", onclick: roll }, em("🎲"), " Give me a challenge"));
    } else {
      const D = DS[c.d];
      const notes = notesFor(c, sk.id);
      put(box, head,
        h(`div.ch-body.ch-${c.d}`,
          h("p.ch-d", em(D.em), ` ${D.name}${easy ? " · easier" : ""}`),
          h("p.ch-text", { "aria-live": "polite" }, pal(challengeText(c, level, easy))),
          notes.map((t) => h("p.ch-note", em("⚠️"), ` ${pal(t)}`)),
          h("p.small.muted", "Same session, same XP. It just proves the skill holds up.")),
        h("div.ch-btns",
          h("a.btn.btn-blue.ch-start", { href: `#/train/${encodeURIComponent(sk.id)}/start`, "data-k": "ch-start" }, em("⏱️"), " Start"),
          h("button.btn.btn-line.ch-roll", { type: "button", "data-k": "ch-roll", onclick: roll }, em("🎲"), " New one")),
        easy ? h("button.linkish.ch-easy", { type: "button", "data-k": "ch-harder", onclick: async () => { await remember(p, sk, { id: c.id, easy: false }); draw("ch-harder"); } }, "Ready for the full version?")
          : h("button.linkish.ch-easy", { type: "button", "data-k": "ch-easier", onclick: async () => { await remember(p, sk, { id: c.id, easy: true }); draw("ch-easier"); } }, "Too hard? Make it easier"));
    }
    if (focus) {
      const el = box.querySelector(`[data-k="${focus}"]`) || box.querySelector('[data-k="ch-roll"]');
      if (el) el.focus();
    }
  };
  draw();
  return box;
}
