// v8.4 "juice": tiny sounds made on the device (Web Audio, no files): a soft tick when something is logged, and a short
// fanfare for real wins (day complete, mission complete, a badge). Quiet, never on a timer, never to pull you back.
// On by default; More → "Sounds" turns them off (settings.sound === false).

import { S } from "./state.js";

let ctx = null;
const NOTES = {
  tick: [[880, 0, 0.07], [1320, 0.06, 0.09]],
  win: [[523.25, 0, 0.12], [659.25, 0.1, 0.12], [783.99, 0.2, 0.12], [1046.5, 0.3, 0.28]],
};

/** Play "tick" or "win". Silently does nothing when sounds are off, the page is hidden, or audio isn't available. */
export function sound(kind = "tick") {
  try {
    if (S.settings.sound === false || document.hidden) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = ctx || new AC();
    if (ctx.state === "suspended") ctx.resume();
    const t0 = ctx.currentTime + 0.01;
    for (const [freq, at, len] of NOTES[kind] || NOTES.tick) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = kind === "win" ? "triangle" : "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t0 + at);
      g.gain.exponentialRampToValueAtTime(kind === "win" ? 0.07 : 0.05, t0 + at + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + len);
      o.connect(g).connect(ctx.destination);
      o.start(t0 + at);
      o.stop(t0 + at + len + 0.02);
    }
  } catch { /* sound is a nice-to-have */ }
}
