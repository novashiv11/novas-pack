// Nova's Art Studio: generative art made on the phone from this week's real logs. Training sessions become circles,
// walks become ribbons, Adventure stamps become stars, 1% ticks become hearts, journal lines become soft glows.
// Four styles, a Shake button for a new arrangement of the same data, a doodle layer to play on, six collectible
// frames that unlock only from real days, and a 1080 x 1080 PNG to save or share. Nothing is uploaded.
// No XP for playing here: XP stays for real-life actions. Everything drawn is a pure function of the data and a seed.

import { S, pet, setSetting, realPets } from "../state.js";
import { h, put, toast, isoDate, motionOK, buzz } from "../util.js";
import { subBar, NOVA } from "./parts.js";
import { celebrate } from "./gameui.js";
import { showUpDates } from "./doitnow.js";

// ---------- constants ----------
const TAU = Math.PI * 2;
const BRAND = { blue: "#1F4E6E", sky: "#8EC1E0", tan: "#C27A3A", gold: "#F2B544", goldDeep: "#A97B1E", pink: "#E0566E", oat: "#F3F2EB", ink: "#1E1B17", muted: "#5C544B" };
const FONT_D = '"Bricolage Grotesque", "Avenir Next", system-ui, sans-serif';
const FONT_B = '"Plus Jakarta Sans", system-ui, sans-serif';

const STYLES = [
  { id: "confetti", name: "Confetti" },
  { id: "constellation", name: "Constellation" },
  { id: "paws", name: "Paw trail" },
  { id: "waves", name: "Waves" },
];

const FRAMES = [
  { id: "paw", emoji: "🐾", name: "First paw", need: "Show up on 1 day", unit: "days", goal: 1, line: "Day one is in the bag. The first frame is yours." },
  { id: "hat", emoji: "🎩", name: "Hat-trick", need: "Show up on 3 different days", unit: "days", goal: 3, line: "Three days of showing up. Nova is calling it a habit." },
  { id: "seven", emoji: "🍀", name: "Lucky seven", need: "Show up on 7 different days", unit: "days", goal: 7, line: "Seven days. Luck had very little to do with it." },
  { id: "week", emoji: "🏆", name: "Week won", need: "Show up on 3 days in one Mon to Sun week", unit: "week", goal: 3, line: "A week won: three days, one Monday to Sunday. Properly good." },
  { id: "stamp", emoji: "🎟️", name: "Stamp collector", need: "Earn your first Adventure stamp", unit: "stamps", goal: 1, line: "Your first Adventure stamp, framed. Go and make another memory." },
  { id: "thirty", emoji: "🌟", name: "Thirty and thriving", need: "Show up on 30 different days", unit: "days", goal: 30, line: "Thirty days of showing up. Nova is, for once, speechless." },
];

const SHAKE_LINES = [
  "Fresh arrangement. Same week, new mood.",
  "Shaken. Nova approves.",
  "Same week, different angle. Still yours.",
  "Reshuffled. Your week hasn't changed, only the lighting.",
];

// What the person has picked, kept while they move around the app (nothing is written to storage).
const memory = { style: "confetti", variant: 0, mode: "paw", frames: new Map(), doodles: new Map() };
let strokeId = 0;
const pendingCele = new Set();

// ---------- small helpers ----------
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function hash(str) {
  let x = 2166136261;
  for (let i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619); }
  return x >>> 0;
}
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rgb = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const toHex = (r, g, b) => "#" + [r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("");
function mixHex(a, b, t) { const x = rgb(a), y = rgb(b); return toHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t); }
const lighten = (c, t) => mixHex(c, "#FFFFFF", t);
const darken = (c, t) => mixHex(c, BRAND.ink, t);
const rgba = (c, a) => { const [r, g, b] = rgb(c); return `rgba(${r},${g},${b},${a})`; };

function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  hh *= 60; if (hh < 0) hh += 360;
  return [hh, s, l];
}
function hsl2hex(hh, s, l) {
  hh = ((hh % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((hh / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = hh < 60 ? [c, x, 0] : hh < 120 ? [x, c, 0] : hh < 180 ? [0, c, x] : hh < 240 ? [0, x, c] : hh < 300 ? [x, 0, c] : [c, 0, x];
  return toHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

const cssVar = (name, fallback) => {
  try { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback; } catch { return fallback; }
};

// ---------- this week's real logs ----------
function weekRange(now = Date.now()) {
  const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const a = d.getTime(); d.setDate(d.getDate() + 7);
  return [a, d.getTime()];
}
const dayMs = (s) => { const t = new Date(`${s}T12:00`).getTime(); return Number.isFinite(t) ? t : NaN; };

function weekData(p) {
  const [a, b] = weekRange();
  const inW = (ms) => ms >= a && ms < b;
  const out = { from: a, to: b - 1, training: [], walks: [], stamps: 0, hearts: 0, glows: 0, other: 0 };
  for (const e of S.events) {
    if (e.petId !== p.id || !inW(e.at)) continue;
    if (e.type === "training") out.training.push({ m: Number(e.minutes) || 0, key: e.skillId || "practice" });
    else if (e.type === "walk") out.walks.push(Number(e.minutes) || 0);
    else out.other++;
  }
  for (const s of S.adventures) {
    if (s.petId !== p.id) continue;
    const ms = s.date ? dayMs(s.date) : s.at;
    if (inW(ms)) out.stamps++;
  }
  if (!p.sample) { // sample diaries never carry real ticks or journal lines
    for (const d of S.daily) if (inW(dayMs(d.date || d.id))) out.hearts += (d.dogDone ? 1 : 0) + (d.youDone ? 1 : 0);
    for (const j of S.journal) if (j.text && inW(dayMs(j.date || j.id))) out.glows++;
  }
  out.total = out.training.length + out.walks.length + out.stamps + out.hearts + out.glows + out.other;
  return out;
}

function describe(d, name, short = false) {
  const parts = [];
  if (d.training.length) parts.push(plural(d.training.length, "training circle", "training circles"));
  if (d.walks.length) parts.push(plural(d.walks.length, "walk ribbon", "walk ribbons"));
  if (d.stamps) parts.push(plural(d.stamps, "Adventure star", "Adventure stars"));
  if (d.hearts) parts.push(plural(d.hearts, "daily heart", "daily hearts"));
  if (d.glows) parts.push(plural(d.glows, "journal glow", "journal glows"));
  if (d.other) parts.push(short ? plural(d.other, "sprinkle", "sprinkles") : plural(d.other, "sprinkle from your other logs", "sprinkles from your other logs"));
  return parts.length ? `${name}'s week so far: ${parts.join(", ")}.` : "";
}

function weekLabel(from) {
  const f = (ms) => new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  return `${f(from)} to ${f(from + 6 * 86400000 + 43200000)}`;
}

// ---------- frames: unlocked by real days only ----------
function mondayKey(dateStr) {
  const d = new Date(`${dateStr}T12:00`); d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return isoDate(d);
}
function progressOf(p) {
  if (p.sample) return { days: 0, bestWeek: 0, stamps: 0, sample: true };
  const dates = showUpDates(p);
  const weeks = new Map();
  for (const day of dates) { const k = mondayKey(day); weeks.set(k, (weeks.get(k) || 0) + 1); }
  const ids = new Set(realPets().map((x) => x.id));
  return { days: dates.length, bestWeek: Math.max(0, ...weeks.values()), stamps: S.adventures.filter((a) => ids.has(a.petId)).length, sample: false };
}
function frameDone(f, c) {
  if (f.unit === "week") return c.bestWeek >= f.goal;
  if (f.unit === "stamps") return c.stamps >= f.goal;
  return c.days >= f.goal;
}
function frameProgress(f, c) {
  const have = f.unit === "week" ? c.bestWeek : f.unit === "stamps" ? c.stamps : c.days;
  if (!have) return "";
  if (f.unit === "week") return `Your best week so far: ${have} of ${f.goal} days.`;
  if (f.unit === "stamps") return "No stamps yet.";
  return `You're on ${have} of ${f.goal}.`;
}

// ---------- pet colours: a couple of pixels from the photo or icon, else a hue from the name ----------
// Colours that sit well with the brand when there's no photo to sample (picked by the pet's name).
const TINT_PAIRS = [["#2FA39A", "#8A63C9"], ["#E8704F", "#3E8FD0"], ["#8A63C9", "#2FB39A"], ["#D9528F", "#3DA5D9"], ["#E58A2E", "#2F9E7E"], ["#5B6FD6", "#E5763A"]];
const tintCache = new Map();
async function tintFor(p) {
  const key = `${p.id}|${p.photo ? p.photo.length : 0}|${p.icon || ""}`;
  if (tintCache.has(key)) return tintCache.get(key);
  let px = null;
  try {
    const c = document.createElement("canvas"); c.width = c.height = 24;
    const g = c.getContext("2d", { willReadFrequently: true });
    if (p.photo) {
      const img = new Image(); img.src = p.photo; await img.decode();
      g.drawImage(img, 0, 0, 24, 24); px = g.getImageData(0, 0, 24, 24).data;
    } else if (p.icon) {
      g.font = '20px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(p.icon, 12, 13);
      px = g.getImageData(0, 0, 24, 24).data;
    }
  } catch { px = null; }
  let out = px ? pickTints(px) : null;
  if (!out) out = TINT_PAIRS[hash(p.name || p.id || "pet") % TINT_PAIRS.length];
  tintCache.set(key, out);
  return out;
}
function pickTints(px) {
  const bins = Array.from({ length: 12 }, (_, i) => ({ i, w: 0, r: 0, g: 0, b: 0 }));
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 200) continue;
    const [hh, s, l] = rgb2hsl(px[i], px[i + 1], px[i + 2]);
    if (s < 0.28 || l < 0.2 || l > 0.85) continue;
    const b = bins[Math.floor(hh / 30) % 12];
    b.w += s; b.r += px[i] * s; b.g += px[i + 1] * s; b.b += px[i + 2] * s;
  }
  const top = bins.filter((b) => b.w > 0.6).sort((a, b) => b.w - a.w);
  if (!top.length) return null;
  const mk = (b) => { const [hh, s, l] = rgb2hsl(b.r / b.w, b.g / b.w, b.b / b.w); return hsl2hex(hh, clamp(s, 0.5, 0.85), clamp(l, 0.44, 0.62)); };
  const first = top[0];
  const far = top.find((b) => { const dd = Math.abs(b.i - first.i); return Math.min(dd, 12 - dd) >= 2; });
  const c1 = mk(first);
  let c2;
  if (far) c2 = mk(far); else { const [hh, s, l] = rgb2hsl(...rgb(c1)); c2 = hsl2hex(hh + 150, s, l); }
  return [c1, c2];
}
function makePalette(tint) {
  const [t1, t2] = tint || [BRAND.sky, BRAND.pink];
  const { gold, pink, sky, tan, blue } = BRAND;
  const tanSoft = lighten(tan, 0.2);
  return { gold, pink, sky, tan, tanSoft, blue, t1, t2, warm: [gold, pink, t1, tanSoft], cool: [blue, sky, t2], all: [gold, pink, sky, t1, tanSoft, t2, blue] };
}

// ---------- drawing primitives (all in a 1000 x 1000 space) ----------
function roundRectPath(g, x, y, w, hh, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + hh, r); g.arcTo(x + w, y + hh, x, y + hh, r); g.arcTo(x, y + hh, x, y, r); g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
function starPath(g, x, y, r, n = 5, inner = 0.5, rot = -Math.PI / 2) {
  g.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const rr = i % 2 ? r * inner : r, a = rot + (i * Math.PI) / n;
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    if (i) g.lineTo(px, py); else g.moveTo(px, py);
  }
  g.closePath();
}
function sparklePath(g, x, y, r) {
  g.beginPath();
  g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r);
  g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r);
  g.closePath();
}
function heartPath(g, x, y, r) {
  g.beginPath();
  g.moveTo(x, y + r * 0.95);
  g.bezierCurveTo(x - r * 1.6, y - r * 0.1, x - r * 0.95, y - r * 1.15, x, y - r * 0.4);
  g.bezierCurveTo(x + r * 0.95, y - r * 1.15, x + r * 1.6, y - r * 0.1, x, y + r * 0.95);
  g.closePath();
}
/** A paw print with toes pointing up when rot is 0. r is roughly the pad's half width. */
function pawPath(g, x, y, r, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.beginPath();
  g.ellipse(0, r * 0.3, r * 0.64, r * 0.5, 0, 0, TAU);
  for (const [cx, cy, rx, ry, tilt] of [[-0.8, -0.18, 0.21, 0.29, -0.4], [-0.3, -0.72, 0.21, 0.3, -0.12], [0.3, -0.72, 0.21, 0.3, 0.12], [0.8, -0.18, 0.21, 0.29, 0.4]]) {
    g.moveTo(cx * r + rx * r, cy * r); g.ellipse(cx * r, cy * r, rx * r, ry * r, tilt, 0, TAU);
  }
  g.restore();
}
function bez(p0, p1, p2, p3, u) {
  const v = 1 - u, a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, d = u * u * u;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
}
function waveY(L, x, t) {
  return L.y0 + L.amp * Math.sin((TAU * x) / L.len + L.ph + t * L.spd) + L.amp * 0.4 * Math.sin((TAU * x) / (L.len * 0.53) + L.ph * 1.7 + t * L.spd * 1.3);
}
const easeOutBack = (k) => { const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };

function drawBg(g, bg) {
  let gr;
  if (bg.type === "radial") {
    gr = g.createRadialGradient(500, 420, 40, 500, 500, 820);
    gr.addColorStop(0, bg.c0); gr.addColorStop(1, bg.c1);
  } else {
    gr = g.createLinearGradient(0, 0, 0, 1000);
    gr.addColorStop(0, bg.c0); gr.addColorStop(bg.stop || 0.6, bg.c1); gr.addColorStop(1, bg.c1);
  }
  g.fillStyle = gr; g.fillRect(0, 0, 1000, 1000);
}

const DRAW = {
  glow(g, it, t) {
    const r = it.r * (1 + 0.05 * Math.sin(t * 0.7 + it.ph));
    const gr = g.createRadialGradient(it.x, it.y, 0, it.x, it.y, r);
    gr.addColorStop(0, rgba(it.c, it.a)); gr.addColorStop(1, rgba(it.c, 0));
    g.fillStyle = gr; g.fillRect(it.x - r, it.y - r, r * 2, r * 2);
  },
  dot(g, it, t) {
    const a = clamp(it.a * (0.65 + 0.35 * Math.sin(t * (it.sp || 1.2) + it.ph)), 0, 1);
    g.fillStyle = rgba(it.c, a); g.beginPath(); g.arc(it.x, it.y, it.r, 0, TAU); g.fill();
  },
  bit(g, it, t) {
    g.translate(it.x, it.y); g.rotate(it.rot + t * 0.25 * it.dir);
    g.fillStyle = rgba(it.c, 0.9); g.fillRect(-it.r, -it.r * 0.38, it.r * 2, it.r * 0.76);
  },
  circle(g, it, t) {
    const r = it.r * (1 + 0.035 * Math.sin(t * 1.4 + it.ph));
    const gr = g.createRadialGradient(it.x - r * 0.3, it.y - r * 0.35, r * 0.08, it.x, it.y, r);
    gr.addColorStop(0, lighten(it.c, 0.5)); gr.addColorStop(0.55, it.c); gr.addColorStop(1, darken(it.c, 0.12));
    g.fillStyle = gr; g.beginPath(); g.arc(it.x, it.y, r, 0, TAU); g.fill();
    if (it.ring) {
      g.strokeStyle = rgba(it.c, 0.38); g.lineWidth = 5;
      g.beginPath(); g.arc(it.x, it.y, r + 15 + 4 * Math.sin(t * 1.1 + it.ph), 0, TAU); g.stroke();
    }
  },
  orb(g, it, t) {
    const r = it.r * (1 + 0.06 * Math.sin(t * 1.6 + it.ph));
    let gr = g.createRadialGradient(it.x, it.y, 0, it.x, it.y, r * 3.4);
    gr.addColorStop(0, rgba(it.c, 0.5)); gr.addColorStop(1, rgba(it.c, 0));
    g.fillStyle = gr; g.fillRect(it.x - r * 3.4, it.y - r * 3.4, r * 6.8, r * 6.8);
    gr = g.createRadialGradient(it.x - r * 0.25, it.y - r * 0.25, 0, it.x, it.y, r);
    gr.addColorStop(0, "#FFFFFF"); gr.addColorStop(1, it.c);
    g.fillStyle = gr; g.beginPath(); g.arc(it.x, it.y, r, 0, TAU); g.fill();
  },
  twinkle(g, it, t) {
    const s = 1 + 0.14 * Math.sin(t * 2.2 + it.ph), r = it.r * s;
    const gr = g.createRadialGradient(it.x, it.y, 0, it.x, it.y, r * 2.4);
    gr.addColorStop(0, rgba(it.c, 0.45)); gr.addColorStop(1, rgba(it.c, 0));
    g.fillStyle = gr; g.fillRect(it.x - r * 2.4, it.y - r * 2.4, r * 4.8, r * 4.8);
    sparklePath(g, it.x, it.y, r * 1.25); g.fillStyle = it.c; g.fill();
    g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(it.x, it.y, r * 0.16, 0, TAU); g.fill();
  },
  star(g, it, t) {
    const s = 1 + 0.07 * Math.sin(t * 2 + it.ph), a = 0.82 + 0.18 * Math.sin(t * 1.7 + it.ph);
    g.globalAlpha *= a;
    starPath(g, it.x, it.y, it.r * s, 5, 0.52);
    g.lineJoin = "round"; g.lineWidth = it.r * 0.32;
    g.strokeStyle = it.c; g.stroke();
    g.fillStyle = it.c; g.fill();
    g.fillStyle = "rgba(255,255,255,.55)"; g.beginPath(); g.arc(it.x - it.r * 0.18, it.y - it.r * 0.12, it.r * 0.16, 0, TAU); g.fill();
  },
  heart(g, it, t) {
    let y = it.y, a = 1;
    if (it.float) {
      const off = ((t + it.delay) * it.float) % it.range;
      y = it.y - off; a = off / it.range > 0.75 ? (1 - off / it.range) * 4 : 1;
    } else y += 5 * Math.sin(t * 1.2 + it.ph);
    const x = it.x + (it.float ? 10 * Math.sin(t * 0.9 + it.ph) : 0);
    g.globalAlpha *= clamp(a, 0, 1);
    heartPath(g, x, y, it.r); g.fillStyle = it.c; g.fill();
    g.fillStyle = "rgba(255,255,255,.5)"; g.beginPath(); g.ellipse(x - it.r * 0.5, y - it.r * 0.3, it.r * 0.2, it.r * 0.13, -0.6, 0, TAU); g.fill();
  },
  ribbon(g, it, t) {
    const [p0, p1, p2, p3] = it.pts, sw = 14 * Math.sin(t * 0.6 + it.ph);
    const q1 = [p1[0] + sw, p1[1] - sw], q2 = [p2[0] - sw, p2[1] + sw];
    if (it.dotted) {
      for (let i = 0; i <= 26; i++) {
        const u = i / 26, pt = bez(p0, q1, q2, p3, u);
        const r = it.w * 0.22 * (0.65 + 0.35 * Math.sin(u * 9 - t * 2 + it.ph));
        g.fillStyle = rgba(it.c, 0.9); g.beginPath(); g.arc(pt[0], pt[1], r, 0, TAU); g.fill();
      }
      return;
    }
    const gr = g.createLinearGradient(p0[0], p0[1], p3[0], p3[1]);
    gr.addColorStop(0, it.c); gr.addColorStop(1, lighten(it.c, 0.4));
    g.lineCap = "round";
    g.beginPath(); g.moveTo(p0[0], p0[1]); g.bezierCurveTo(q1[0], q1[1], q2[0], q2[1], p3[0], p3[1]);
    g.lineWidth = it.w; g.strokeStyle = gr; g.stroke();
    g.lineWidth = it.w * 0.26; g.strokeStyle = "rgba(255,255,255,.4)"; g.stroke();
    const pt = bez(p0, q1, q2, p3, (t * 0.05 + it.ph / TAU) % 1);
    g.fillStyle = "rgba(255,255,255,.85)"; g.beginPath(); g.arc(pt[0], pt[1], it.w * 0.3, 0, TAU); g.fill();
  },
  paw(g, it, t) {
    const pulse = 0.7 + 0.3 * Math.max(0, Math.cos(TAU * (it.idx / it.n - t * 0.1)));
    g.globalAlpha *= clamp(it.a * pulse, 0, 1);
    pawPath(g, it.x, it.y, it.r, it.rot);
    g.fillStyle = it.c; g.fill();
  },
  wave(g, it, t) {
    g.beginPath(); g.moveTo(0, 1000);
    for (let x = 0; x <= 1000; x += 10) g.lineTo(x, waveY(it, x, t));
    g.lineTo(1000, 1000); g.closePath();
    const gr = g.createLinearGradient(0, it.y0 - it.amp, 0, 1000);
    gr.addColorStop(0, rgba(it.c, 0.88)); gr.addColorStop(1, rgba(darken(it.c, 0.18), 0.95));
    g.fillStyle = gr; g.fill();
    g.lineWidth = 3; g.strokeStyle = "rgba(255,255,255,.4)";
    g.beginPath();
    for (let x = 0; x <= 1000; x += 10) { const y = waveY(it, x, t); if (x) g.lineTo(x, y); else g.moveTo(x, y); }
    g.stroke();
  },
  foam(g, it, t) {
    const y = waveY(it.layer, it.x, t) - 2;
    g.fillStyle = `rgba(255,255,255,${0.55 + 0.25 * Math.sin(t * 1.5 + it.ph)})`;
    g.beginPath(); g.arc(it.x, y, it.r, 0, TAU); g.fill();
  },
  link(g, it, t) {
    g.strokeStyle = `rgba(255,255,255,${0.22 + 0.08 * Math.sin(t * 1.1 + it.ph)})`; g.lineWidth = 2;
    g.beginPath(); g.moveTo(it.a[0], it.a[1]); g.lineTo(it.b[0], it.b[1]); g.stroke();
  },
};

function drawScene(g, sc, t) {
  drawBg(g, sc.bg);
  g.save();
  if (sc.alpha < 1) g.globalAlpha = sc.alpha;
  for (const it of sc.items) { g.save(); DRAW[it.k](g, it, t, sc); g.restore(); }
  g.restore();
}

// ---------- scenes: one builder, four styles ----------
function buildScene(style, d, pal, seed, starter) {
  const R = rng(seed);
  const rnd = (a, b) => a + R() * (b - a);
  const pick = (a) => a[Math.floor(R() * a.length)];
  const ph = () => rnd(0, TAU);
  const items = [];
  const placed = [];
  const add = (it) => { items.push(it); return it; };
  const spot = (r, x0 = 50, x1 = 950, y0 = 50, y1 = 950) => {
    const xa = x0 + r, xb = Math.max(xa + 1, x1 - r), ya = y0 + r, yb = Math.max(ya + 1, y1 - r);
    let best = [(xa + xb) / 2, (ya + yb) / 2];
    for (let i = 0; i < 40; i++) {
      const x = rnd(xa, xb), y = rnd(ya, yb);
      best = [x, y];
      if (placed.every((q) => Math.hypot(q.x - x, q.y - y) >= (q.r + r) * 0.8)) break;
    }
    placed.push({ x: best[0], y: best[1], r });
    return best;
  };
  const curve = (inside) => {
    const horiz = R() < 0.5, e = inside ? 90 : -40, a = rnd(100, 900), b = rnd(100, 900);
    const p0 = horiz ? [e, a] : [a, e], p3 = horiz ? [1000 - e, b] : [b, 1000 - e];
    return [p0, [rnd(200, 800), rnd(100, 900)], [rnd(200, 800), rnd(100, 900)], p3];
  };
  const train = starter ? [{ m: 12, key: "a" }, { m: 24, key: "b" }, { m: 8, key: "c" }, { m: 18, key: "d" }] : d.training.slice(0, 22);
  const walks = starter ? [24, 38] : d.walks.slice(0, 9);
  const nStars = starter ? 3 : Math.min(d.stamps, 12);
  const nHearts = starter ? 5 : Math.min(d.hearts, 14);
  const nGlows = starter ? 2 : Math.min(d.glows, 7);
  const nOther = starter ? 12 : Math.min(d.other, 40);
  const warm = (i, key) => pal.warm[(key !== undefined ? hash(String(key)) : i) % pal.warm.length];
  const trR = (m) => 44 + Math.min(m || 12, 40) * 1.4;
  const ribW = (m) => 14 + Math.min(m || 20, 60) * 0.32;
  const byBig = train.map((t, i) => ({ ...t, i })).sort((a, b) => b.m - a.m);
  const glows = (cols, a, r0, r1) => {
    for (let i = 0; i < nGlows; i++) add({ k: "glow", z: 0, x: rnd(130, 870), y: rnd(130, 870), r: rnd(r0, r1), c: pick(cols), a, ph: ph() });
  };
  let bg;

  if (style === "confetti") {
    bg = { type: "radial", c0: "#FFFBEF", c1: "#F4E6C9" };
    glows(pal.all, 0.5, 150, 240);
    for (let i = 0; i < 18; i++) add({ k: "dot", z: 1, x: rnd(30, 970), y: rnd(30, 970), r: rnd(4, 9), c: pick(pal.all), a: 0.4, ph: ph() });
    byBig.forEach((t) => { const r = trR(t.m), [x, y] = spot(r); add({ k: "circle", z: 5, x, y, r, c: warm(t.i, t.key), ring: t.m >= 10, ph: ph() }); });
    walks.forEach((m, i) => add({ k: "ribbon", z: 4, pts: curve(false), w: ribW(m), c: pal.cool[i % 3], ph: ph() }));
    for (let i = 0; i < nStars; i++) { const r = rnd(26, 38), [x, y] = spot(r + 10); add({ k: "star", z: 7, x, y, r, c: pal.gold, ph: ph() }); }
    for (let i = 0; i < nHearts; i++) { const r = rnd(15, 22), [x, y] = spot(r + 6); add({ k: "heart", z: 8, x, y, r, c: pal.pink, ph: ph() }); }
    for (let i = 0; i < nOther; i++) add({ k: "bit", z: 6, x: rnd(40, 960), y: rnd(40, 960), r: rnd(8, 13), rot: ph(), dir: R() < 0.5 ? -1 : 1, c: pick(pal.all) });
  } else if (style === "constellation") {
    bg = { type: "radial", c0: "#1A4565", c1: "#08131D" };
    glows([pal.t1, pal.t2, pal.pink, "#3B7CA6"], 0.34, 170, 270);
    for (let i = 0; i < 48; i++) add({ k: "dot", z: 1, x: rnd(20, 980), y: rnd(20, 980), r: rnd(1.4, 3.4), c: "#FFFFFF", a: 0.6, sp: rnd(0.8, 2.4), ph: ph() });
    const nodes = [];
    const node = (it) => { add(it); nodes.push([it.x, it.y]); };
    byBig.forEach((t) => { const r = 13 + Math.min(t.m || 12, 40) * 0.42, [x, y] = spot(r * 2.6); node({ k: "orb", z: 5, x, y, r, c: lighten(warm(t.i, t.key), 0.3), ph: ph() }); });
    for (let i = 0; i < nStars; i++) { const r = rnd(20, 30), [x, y] = spot(r * 1.8); node({ k: "twinkle", z: 6, x, y, r, c: "#FFF1C9", ph: ph() }); }
    for (let i = 0; i < nHearts; i++) { const r = rnd(11, 16), [x, y] = spot(r + 12); node({ k: "heart", z: 7, x, y, r, c: lighten(pal.pink, 0.12), ph: ph() }); }
    walks.forEach((m, i) => {
      const pts = curve(true);
      add({ k: "ribbon", z: 4, pts, dotted: true, w: ribW(m), c: lighten(pal.cool[(i + 1) % 3 === 0 ? 1 : (i + 1) % 3], 0.35), ph: ph() });
      for (const e of [pts[0], pts[3]]) node({ k: "orb", z: 5, x: e[0], y: e[1], r: 7, c: pal.sky, ph: ph() });
    });
    for (let i = 0; i < nOther; i++) add({ k: "dot", z: 2, x: rnd(40, 960), y: rnd(40, 960), r: rnd(2, 4.2), c: pick([pal.gold, "#FFFFFF", pal.sky]), a: 0.75, sp: rnd(1, 2.6), ph: ph() });
    const seen = new Set();
    nodes.forEach((a, i) => {
      nodes.map((b, j) => ({ j, dist: Math.hypot(a[0] - b[0], a[1] - b[1]) })).filter((o) => o.j !== i && o.dist < 380).sort((x, y) => x.dist - y.dist).slice(0, 2).forEach((o) => {
        const key = i < o.j ? `${i}-${o.j}` : `${o.j}-${i}`;
        if (!seen.has(key)) { seen.add(key); add({ k: "link", z: 3, a, b: nodes[o.j], ph: ph() }); }
      });
    });
  } else if (style === "paws") {
    bg = { type: "linear", c0: "#F7E5CE", c1: "#F3F2EB", stop: 0.7 };
    glows(pal.all, 0.4, 150, 230);
    const sum = walks.reduce((s, m) => s + (m || 15), 0);
    const total = walks.length ? clamp(Math.round(10 + sum / 4 + walks.length * 2), 12, 44) : 14;
    const sizes = [];
    if (walks.length) {
      const wts = walks.map((m) => Math.max(5, m || 15)), wsum = wts.reduce((a, b) => a + b, 0);
      let left = total;
      wts.forEach((w, i) => { const n = i === wts.length - 1 ? left : Math.min(left - (wts.length - 1 - i), Math.max(1, Math.round((total * w) / wsum))); sizes.push(n); left -= n; });
    } else sizes.push(total);
    const A = rnd(130, 220), f = rnd(0.8, 1.3), phi = rnd(0, 1), vertical = R() < 0.4, flip = R() < 0.5;
    const pos = [];
    for (let i = 0; i < total; i++) {
      const s = (i + 0.5) / total, along = flip ? 930 - 860 * s : 70 + 860 * s, across = 500 + A * Math.sin(TAU * (f * s + phi));
      pos.push(vertical ? [across, along] : [along, across]);
    }
    let idx = 0;
    sizes.forEach((n, wi) => {
      const col = walks.length ? [pal.blue, pal.tan, pal.t2, pal.pink, pal.t1][wi % 5] : pal.tan;
      for (let k = 0; k < n; k++, idx++) {
        const a = pos[Math.max(0, idx - 1)], b = pos[Math.min(total - 1, idx + 1)], ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        const side = idx % 2 ? 1 : -1, ox = Math.cos(ang + Math.PI / 2) * 20 * side, oy = Math.sin(ang + Math.PI / 2) * 20 * side;
        const x = pos[idx][0] + ox, y = pos[idx][1] + oy;
        placed.push({ x, y, r: 36 });
        add({ k: "paw", z: 5, x, y, r: 27, rot: ang + Math.PI / 2, c: col, a: walks.length ? 0.95 : 0.4, idx, n: total });
      }
    });
    byBig.forEach((t) => { const r = trR(t.m) * 0.78, [x, y] = spot(r); add({ k: "circle", z: 4, x, y, r, c: warm(t.i, t.key), ring: t.m >= 10, ph: ph() }); });
    for (let i = 0; i < nStars; i++) { const r = rnd(24, 34), [x, y] = spot(r + 10); add({ k: "star", z: 7, x, y, r, c: pal.gold, ph: ph() }); }
    for (let i = 0; i < nHearts; i++) { const r = rnd(14, 20), [x, y] = spot(r + 6); add({ k: "heart", z: 8, x, y, r, c: pal.pink, ph: ph() }); }
    for (let i = 0; i < nOther; i++) add({ k: "dot", z: 2, x: rnd(30, 970), y: rnd(30, 970), r: rnd(4, 8), c: pick(pal.all), a: 0.5, ph: ph() });
  } else { // waves
    bg = { type: "linear", c0: "#FCE9BF", c1: "#DCE7F0", stop: 0.5 };
    add({ k: "glow", z: 0, x: rnd(280, 720), y: 190, r: 300, c: pal.gold, a: 0.75, ph: ph() });
    glows([pal.t1, pal.pink, pal.sky], 0.3, 150, 220);
    const L = clamp(4 + walks.length, 4, 11);
    const order = Array.from({ length: L }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const slotOf = new Map(order.slice(0, walks.length).map((li, k) => [li, k]));
    const layers = [];
    for (let i = 0; i < L; i++) {
      const wk = slotOf.get(i);
      const m = wk !== undefined ? walks[wk] : 0;
      const layer = {
        k: "wave", z: 3 + i * 0.01, y0: 430 + (i / (L - 1)) * 470,
        amp: wk !== undefined ? 22 + Math.min(60, m || 20) * 0.55 : 16 + rnd(0, 14),
        len: rnd(260, 520), ph: ph(), spd: rnd(0.35, 0.7) * (R() < 0.5 ? -1 : 1),
        c: wk !== undefined ? mixHex([pal.t2, pal.pink, pal.t1, pal.gold][wk % 4], pal.sky, 0.12) : mixHex(pal.sky, pal.blue, i / (L - 1)),
      };
      layers.push(layer); add(layer);
    }
    byBig.forEach((t, k) => {
      const r = trR(t.m) * (k < 5 ? 0.9 : 0.62);
      const [x, y] = k < 5 ? spot(r, 60, 940, 60, 400) : spot(r, 60, 940, 440, 940);
      add({ k: "circle", z: k < 5 ? 2.5 : 2.4, x, y, r, c: warm(t.i, t.key), ring: t.m >= 10 && k < 5, ph: ph() });
    });
    for (let i = 0; i < nStars; i++) { const r = rnd(22, 32), [x, y] = spot(r + 8, 40, 960, 40, 330); add({ k: "star", z: 2.6, x, y, r, c: pal.gold, ph: ph() }); }
    for (let i = 0; i < nHearts; i++) {
      const range = 150, float = rnd(10, 18);
      add({ k: "heart", z: 8, x: rnd(70, 930), y: rnd(470, 880), r: rnd(14, 20), c: pal.pink, ph: ph(), float, range, delay: rnd(0, (0.7 * range) / float) });
    }
    for (let i = 0; i < nOther; i++) add({ k: "foam", z: 6, layer: pick(layers), x: rnd(20, 980), r: rnd(3.5, 7), ph: ph() });
  }
  items.sort((a, b) => a.z - b.z);
  return { bg, items, alpha: starter ? 0.62 : 1 };
}

// ---------- doodles ----------
function drawDoodles(g, list, now, motion, t) {
  for (const d of list) {
    const age = motion ? now - d.t0 : 1e9;
    if (age < 0) continue;
    const k = Math.min(1, age / 300), sc = k >= 1 ? 1 : Math.max(0.01, easeOutBack(k));
    g.save();
    g.translate(d.x * 1000, d.y * 1000); g.rotate(d.rot + (d.kind === "spark" && motion ? Math.sin(t * 1.5 + d.x * 9) * 0.12 : 0));
    g.scale(sc * d.s, sc * d.s);
    g.lineJoin = "round";
    if (d.kind === "paw") {
      pawPath(g, 0, 0, 30, 0);
      g.lineWidth = 9; g.strokeStyle = "rgba(255,255,255,.92)"; g.stroke();
      g.fillStyle = d.c; g.fill();
    } else {
      const tw = motion ? 0.88 + 0.12 * Math.sin(t * 3 + d.x * 13) : 1;
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, 62);
      gr.addColorStop(0, rgba(d.c, 0.5)); gr.addColorStop(1, rgba(d.c, 0));
      g.fillStyle = gr; g.fillRect(-62, -62, 124, 124);
      sparklePath(g, 0, 0, 42 * tw);
      g.lineWidth = 7; g.strokeStyle = "rgba(255,255,255,.95)"; g.stroke();
      g.fillStyle = d.c; g.fill();
      sparklePath(g, 0, 0, 16 * tw); g.fillStyle = "#FFFFFF"; g.fill();
    }
    g.restore();
  }
}

// ---------- frames ----------
function drawFrame(g, id, mat, t) {
  const m = 46;
  const ring = (c, w, inset = 0) => { g.strokeStyle = c; g.lineWidth = w; g.strokeRect(inset + w / 2, inset + w / 2, 1000 - 2 * inset - w, 1000 - 2 * inset - w); };
  const corners = (fn) => { for (const [x, y] of [[40, 40], [960, 40], [40, 960], [960, 960]]) fn(x, y); };
  g.lineJoin = "round";
  if (id === "paw") {
    ring(BRAND.tan, m); ring(BRAND.oat, 5, m);
    corners((x, y) => {
      g.fillStyle = BRAND.gold; g.strokeStyle = darken(BRAND.tan, 0.2); g.lineWidth = 5;
      g.beginPath(); g.arc(x, y, 40, 0, TAU); g.fill(); g.stroke();
      pawPath(g, x, y + 1, 19, 0); g.fillStyle = darken(BRAND.tan, 0.25); g.fill();
    });
  } else if (id === "hat") {
    ring(BRAND.gold, 24); ring("#FFF8E6", 8, 24); ring(BRAND.blue, 14, 32);
    g.fillStyle = BRAND.blue; roundRectPath(g, 360, 8, 280, 66, 33); g.fill();
    g.strokeStyle = BRAND.gold; g.lineWidth = 5; g.stroke();
    [0, 1, 2].forEach((i) => { starPath(g, 430 + i * 70, 41 + (i === 1 ? -3 : 0), 22 + (i === 1 ? 4 : 0), 5, 0.5); g.fillStyle = BRAND.gold; g.fill(); });
  } else if (id === "seven") {
    ring(BRAND.blue, 34);
    const cols = [BRAND.gold, BRAND.pink, BRAND.sky, BRAND.tan, "#FFF8E6"];
    let k = 0;
    for (let side = 0; side < 4; side++) {
      for (let i = 0; i < 7; i++) {
        const u = (i + 0.5) * (1000 / 7);
        const [x, y] = side === 0 ? [u, 20] : side === 1 ? [980, u] : side === 2 ? [1000 - u, 980] : [20, 1000 - u];
        g.fillStyle = cols[k++ % cols.length]; g.strokeStyle = BRAND.blue; g.lineWidth = 5;
        g.beginPath(); g.arc(x, y, 30, 0, TAU); g.fill(); g.stroke();
      }
    }
  } else if (id === "week") {
    const gr = g.createLinearGradient(0, 0, 1000, 1000);
    gr.addColorStop(0, "#F7CB6A"); gr.addColorStop(0.5, BRAND.gold); gr.addColorStop(1, "#E7A92E");
    ring(gr, 58); ring(BRAND.goldDeep, 6, 58); ring("#FFF3CC", 4, 0);
    corners((x, y) => {
      starPath(g, x, y, 46, 5, 0.5);
      g.fillStyle = "#FFF8E6"; g.strokeStyle = BRAND.goldDeep; g.lineWidth = 7; g.stroke(); g.fill();
    });
  } else if (id === "stamp") {
    ring("#F8E7BF", 70); ring("#FFFBEA", 4, 62); ring(rgba(BRAND.blue, 0.55), 4, 70);
    g.fillStyle = mat;
    for (let u = 28; u < 1000; u += 56) {
      for (const [x, y] of [[u, 0], [u, 1000], [0, u], [1000, u]]) { g.beginPath(); g.arc(x, y, 18, 0, TAU); g.fill(); }
    }
    g.save(); g.globalAlpha = 0.45; g.strokeStyle = BRAND.blue; g.lineWidth = 5;
    g.beginPath(); g.arc(912, 912, 44, 0, TAU); g.stroke();
    g.beginPath(); g.arc(912, 912, 33, 0, TAU); g.stroke();
    pawPath(g, 912, 914, 15, 0); g.fillStyle = BRAND.blue; g.fill();
    g.restore();
  } else if (id === "thirty") {
    const gr = g.createLinearGradient(0, 0, 1000, 1000);
    [BRAND.blue, BRAND.sky, BRAND.gold, BRAND.tan, BRAND.pink, BRAND.blue].forEach((c, i, a) => gr.addColorStop(i / (a.length - 1), c));
    ring(gr, 42); ring("rgba(255,255,255,.7)", 4, 42);
    [[40, 40], [960, 40], [40, 960], [960, 960], [500, 20], [500, 980], [20, 500], [980, 500]].forEach(([x, y], i) => {
      const r = (i < 4 ? 34 : 24) * (1 + 0.16 * Math.sin(t * 2.2 + i * 1.3));
      sparklePath(g, x, y, r * 1.2); g.fillStyle = "#FFFFFF"; g.strokeStyle = BRAND.gold; g.lineWidth = 5; g.stroke(); g.fill();
    });
  }
}

/** The whole picture: scene, doodles, frame, clipped to a rounded square. W is the pixel size to draw at. */
function renderPiece(g, W, o) {
  g.save();
  g.scale(W / 1000, W / 1000);
  roundRectPath(g, 0, 0, 1000, 1000, 34); g.clip();
  drawScene(g, o.scene, o.t);
  drawDoodles(g, o.doodles, o.now, o.motion, o.t);
  if (o.frame) drawFrame(g, o.frame, o.mat, o.t);
  g.restore();
}

function drawThumb(canvas, id) {
  const g = canvas.getContext("2d");
  if (!g) return;
  const W = canvas.width;
  g.save(); g.scale(W / 1000, W / 1000);
  roundRectPath(g, 0, 0, 1000, 1000, 80); g.clip();
  drawBg(g, { type: "radial", c0: "#FFFBEF", c1: "#F4E6C9" });
  g.fillStyle = BRAND.gold; g.beginPath(); g.arc(380, 420, 150, 0, TAU); g.fill();
  g.fillStyle = BRAND.sky; g.beginPath(); g.arc(640, 600, 110, 0, TAU); g.fill();
  heartPath(g, 600, 340, 70); g.fillStyle = BRAND.pink; g.fill();
  drawFrame(g, id, "#FFFFFF", 0);
  g.restore();
}

// ---------- the screen ----------
export function studio(main) {
  const p = pet();
  main.append(subBar("Art studio", "#/home", "Back to Home"));
  if (!p) {
    put(main, h("div.st-wrap",
      h("h2.st-title", "Nova's Art Studio"),
      h("p.st-lede", "Add your pet first and Nova will get the paints out."),
      h("a.btn.btn-blue", { href: "#/welcome/add" }, "Add your pet")));
    return;
  }
  const name = p.name || "your pet";
  const data = weekData(p);
  const starter = data.total === 0;
  const prog = progressOf(p);
  const doneIds = FRAMES.filter((f) => frameDone(f, prog)).map((f) => f.id);
  const unlocked = new Set(doneIds);
  const seen = new Set(Array.isArray(S.settings.studioSeen) ? S.settings.studioSeen : []);
  const isNew = (id) => unlocked.has(id) && !seen.has(id);
  let pal = makePalette(null);
  let scene = null;
  if (!memory.doodles.has(p.id)) memory.doodles.set(p.id, []);
  const doodles = memory.doodles.get(p.id);

  const currentFrame = () => {
    const f = memory.frames.get(p.id);
    if (f === "none") return null;
    if (f && unlocked.has(f)) return f;
    return doneIds.length ? doneIds[doneIds.length - 1] : null;
  };

  // --- DOM ---
  const canvas = h("canvas.st-canvas", { width: "720", height: "720", role: "img", "aria-label": `Art made from ${name}'s week` });
  const stage = h("div.st-stage", canvas);
  const status = h("p.st-status", { role: "status", "aria-live": "polite" });
  const caption = h("p.st-caption", starter ? "Log anything real today and it adds your colours." : describe(data, name, true));
  const say = (msg) => { status.textContent = msg; };

  const styleBtns = STYLES.map((s) => h("button.st-chip", {
    type: "button", "aria-pressed": String(memory.style === s.id), "data-style": s.id,
    onclick: () => { memory.style = s.id; syncStyles(); rebuild(); say(`${s.name} style.`); },
  }, s.name));
  const syncStyles = () => styleBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.style === memory.style)));

  const modeBtns = [["paw", "Paws"], ["spark", "Sparkles"]].map(([id, label]) => h("button", {
    type: "button", "aria-pressed": String(memory.mode === id), "data-mode": id,
    onclick: () => { memory.mode = id; modeBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === id))); say(`${label} picked.`); },
  }, label));

  const shakeBtn = h("button.btn.btn-blue.sm", { type: "button", "data-k": "studio-shake", onclick: shake }, "Shake");
  const saveBtn = h("button.btn.btn-line.sm", { type: "button", "data-k": "studio-save", onclick: saveOrShare }, "Save or share");
  const sprinkleBtn = h("button.btn.btn-line.sm", { type: "button", "data-k": "studio-sprinkle", onclick: sprinkle }, "Sprinkle some");
  const undoBtn = h("button.btn.btn-line.sm", { type: "button", "data-k": "studio-undo", onclick: undo }, "Undo");
  const clearBtn = h("button.btn.btn-line.sm", { type: "button", "data-k": "studio-clear", onclick: clearAll }, "Clear my doodles");

  const frameTiles = FRAMES.map((f) => {
    const on = unlocked.has(f.id);
    const th = h("canvas.st-thumb", { width: "144", height: "144", "aria-hidden": "true" });
    drawThumb(th, f.id);
    const badge = on ? (isNew(f.id) ? h("span.st-new", "New") : null) : h("span.st-lock", { "aria-hidden": "true" }, "🔒");
    const body = [
      h("span.st-thumb-box", th, badge),
      h("span.st-frame-name", h("span", { "aria-hidden": "true" }, f.emoji), " ", f.name),
      h("span.st-frame-need", on ? f.need : [h("span.vh", "Locked. "), f.need, ".", frameProgress(f, prog) ? ` ${frameProgress(f, prog)}` : ""]),
    ];
    if (!on) return h("div.st-frame.is-locked", { "data-frame": f.id }, ...body);
    return h("button.st-frame", {
      type: "button", "data-frame": f.id, "aria-pressed": String(currentFrame() === f.id),
      onclick: () => { memory.frames.set(p.id, f.id); syncFrames(); redraw(); say(`${f.name} frame on.`); },
    }, ...body);
  });
  const noFrameBtn = h("button.st-chip.st-chip-quiet", {
    type: "button", "data-frame": "none", "aria-pressed": String(currentFrame() === null),
    onclick: () => { memory.frames.set(p.id, "none"); syncFrames(); redraw(); say("No frame."); },
  }, "No frame");
  function syncFrames() {
    const cur = currentFrame();
    frameTiles.forEach((b) => { if (b.tagName === "BUTTON") b.setAttribute("aria-pressed", String(b.dataset.frame === cur)); });
    noFrameBtn.setAttribute("aria-pressed", String(cur === null));
  }

  const legend = [["Training", "circles"], ["Walks", "ribbons"], ["Adventure stamps", "stars"], ["Daily ticks", "hearts"], ["Journal lines", "glows"]];
  put(main, h("div.st-wrap",
    h("header.st-hero",
      h("img.avatar.disc.st-nova", { src: NOVA, alt: "", width: "44", height: "44" }),
      h("div",
        h("h2.st-title", "Nova's Art Studio"),
        h("p.st-lede", `${name}'s week as a picture, made on your phone from what you really did. Go on, play.`))),
    p.sample ? h("aside.st-sample", h("p", "This is the sample diary, so the picture is a demo and the frames stay locked. Add your own pet and your real days start unlocking them."), h("a.btn.btn-line.sm", { href: "#/welcome/add" }, "Add your pet")) : null,
    stage,
    caption,
    h("div.st-chips", { role: "group", "aria-label": "Art style" }, styleBtns),
    h("div.st-row", shakeBtn, saveBtn),
    status,
    h("section.st-card", { "aria-labelledby": "st-play" },
      h("h2.st-h", { id: "st-play" }, "Play"),
      h("p.st-hint", "Tap or drag on the picture to leave paw prints or sparkles. Dragging makes a trail."),
      h("div.st-seg", { role: "group", "aria-label": "Stamp" }, modeBtns),
      h("div.st-row", sprinkleBtn, undoBtn, clearBtn)),
    h("section.st-card", { "aria-labelledby": "st-frames" },
      h("div.st-head-row", h("h2.st-h", { id: "st-frames" }, "Frames"), noFrameBtn),
      h("p.st-hint", doneIds.length || p.sample ? `${doneIds.length} of ${FRAMES.length} collected. Frames come from real days, never from tapping about in here.` : "0 of 6 collected. Log anything real today and the first frame is yours. Frames come from real days, never from tapping about in here."),
      h("div.st-frames", frameTiles)),
    h("ul.st-legend", { "aria-label": "How the picture is drawn" }, legend.map(([a, b]) => h("li", h("b", `${a}: `), b)),
      h("li", h("b", "Everything else: "), "sprinkles")),
    h("p.st-foot", "Made on your phone, from your own logs. Nothing is uploaded and you choose where a saved picture goes. Playing here earns no XP: that stays for real-life things.")));

  // --- drawing and animation ---
  const t0 = performance.now();
  let raf = 0, lastTs = 0, visible = true, disposed = false;
  const matNow = () => cssVar("--surface", BRAND.oat);

  function draw(ts) {
    const g = canvas.getContext("2d");
    if (!g || !scene || !canvas.width) return;
    const motion = motionOK();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, canvas.width, canvas.height);
    renderPiece(g, canvas.width, { scene, frame: currentFrame(), doodles, t: motion ? (ts - t0) / 1000 : 0, now: ts, motion, mat: matNow() });
  }
  const animating = () => !disposed && canvas.isConnected && visible && !document.hidden && motionOK();
  function frame(ts) {
    raf = 0;
    if (!canvas.isConnected) { dispose(); return; }
    if (!animating()) { canvas.dataset.loop = "off"; return; }
    if (ts - lastTs >= 30) { lastTs = ts; draw(ts); }
    raf = requestAnimationFrame(frame);
  }
  function kick() {
    if (raf || !animating()) return;
    canvas.dataset.loop = "on";
    raf = requestAnimationFrame(frame);
  }
  function redraw() {
    if (disposed) return;
    if (animating()) kick(); else { canvas.dataset.loop = "off"; draw(performance.now()); }
  }
  function dispose() {
    disposed = true;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    canvas.dataset.loop = "off";
    if (io) io.disconnect();
    if (ro) ro.disconnect();
    document.removeEventListener("visibilitychange", onVis);
    if (mq && mq.removeEventListener) mq.removeEventListener("change", onVis);
  }
  function onVis() { if (!canvas.isConnected) { dispose(); return; } redraw(); }
  const mq = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : null;
  document.addEventListener("visibilitychange", onVis);
  if (mq && mq.addEventListener) mq.addEventListener("change", onVis);
  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => {
    visible = es[es.length - 1].isIntersecting;
    if (!canvas.isConnected) { dispose(); return; }
    if (visible) redraw();
  }) : null;
  if (io) io.observe(canvas);
  const ro = "ResizeObserver" in window ? new ResizeObserver(() => fit()) : null;
  if (ro) ro.observe(canvas);
  function fit() {
    if (disposed) return;
    const css = canvas.getBoundingClientRect().width;
    if (!css) return;
    const px = Math.max(240, Math.round(css * Math.min(window.devicePixelRatio || 1, 2)));
    if (canvas.width !== px) { canvas.width = px; canvas.height = px; }
    redraw();
  }

  function seed() { return hash(`${p.id}|${data.from}|${memory.style}`) + memory.variant * 7919; }
  function rebuild() {
    scene = buildScene(memory.style, data, pal, seed(), starter);
    canvas.setAttribute("aria-label", starter
      ? `A soft starter picture for ${name}. Log anything real today and it adds your colours.`
      : `Art made from ${name}'s week, ${STYLES.find((s) => s.id === memory.style).name} style. ${describe(data, name)}`);
    redraw();
  }
  function shake() {
    memory.variant++;
    rebuild();
    if (motionOK()) { stage.classList.remove("is-shaking"); void stage.offsetWidth; stage.classList.add("is-shaking"); }
    buzz(12);
    say(SHAKE_LINES[memory.variant % SHAKE_LINES.length]);
  }

  // --- doodles ---
  function syncButtons() {
    undoBtn.disabled = !doodles.length;
    clearBtn.disabled = !doodles.length;
  }
  function addStamp(x, y, rot, id, delay = 0) {
    const paw = memory.mode === "paw";
    const r = Math.random;
    const cols = paw ? [BRAND.blue, BRAND.tan, BRAND.pink, pal.t1, pal.t2] : [BRAND.gold, BRAND.pink, BRAND.sky, pal.t1, pal.t2];
    doodles.push({ x: clamp(x, 0.02, 0.98), y: clamp(y, 0.02, 0.98), rot, kind: memory.mode, s: paw ? 0.85 + r() * 0.3 : 0.7 + r() * 0.5, c: cols[Math.floor(r() * cols.length)], stroke: id, t0: performance.now() + delay });
    if (doodles.length > 240) doodles.shift();
  }
  let stroke = null;
  const norm = (e) => { const b = canvas.getBoundingClientRect(); return [(e.clientX - b.left) / b.width, (e.clientY - b.top) / b.height]; };
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button > 0) return;
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch { /* not all browsers */ }
    const [x, y] = norm(e);
    stroke = { id: ++strokeId, pid: e.pointerId, lx: x, ly: y, side: 1 };
    addStamp(x, y, (Math.random() - 0.5) * 0.7, stroke.id);
    buzz(8); syncButtons(); redraw();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!stroke || e.pointerId !== stroke.pid) return;
    const [x, y] = norm(e);
    const dx = (x - stroke.lx) * 1000, dy = (y - stroke.ly) * 1000, dist = Math.hypot(dx, dy);
    const step = memory.mode === "paw" ? 70 : 48;
    if (dist < step) return;
    const ang = Math.atan2(dy, dx), n = Math.floor(dist / step);
    for (let i = 1; i <= n; i++) {
      const px = stroke.lx + (Math.cos(ang) * step * i) / 1000, py = stroke.ly + (Math.sin(ang) * step * i) / 1000;
      if (memory.mode === "paw") {
        stroke.side = -stroke.side;
        addStamp(px + (Math.cos(ang + Math.PI / 2) * 15 * stroke.side) / 1000, py + (Math.sin(ang + Math.PI / 2) * 15 * stroke.side) / 1000, ang + Math.PI / 2, stroke.id, i * 20);
      } else addStamp(px, py, (Math.random() - 0.5) * 1.2, stroke.id, i * 20);
    }
    stroke.lx += (Math.cos(ang) * step * n) / 1000; stroke.ly += (Math.sin(ang) * step * n) / 1000;
    syncButtons(); redraw();
  });
  const endStroke = (e) => { if (stroke && (!e || e.pointerId === stroke.pid)) stroke = null; };
  canvas.addEventListener("pointerup", endStroke);
  canvas.addEventListener("pointercancel", endStroke);
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  function sprinkle() {
    const id = ++strokeId;
    for (let i = 0; i < 7; i++) addStamp(0.1 + Math.random() * 0.8, 0.1 + Math.random() * 0.8, Math.random() * TAU, id, i * 70);
    syncButtons(); redraw(); say("Sprinkled.");
  }
  function undo() {
    if (!doodles.length) return;
    const last = doodles[doodles.length - 1].stroke;
    while (doodles.length && doodles[doodles.length - 1].stroke === last) doodles.pop();
    syncButtons(); redraw(); say(doodles.length ? "Undone." : "All doodles gone.");
  }
  function clearAll() {
    if (!doodles.length) return;
    const back = doodles.splice(0, doodles.length);
    syncButtons(); redraw(); say("Doodles cleared.");
    toast("Doodles cleared.", [["Undo", () => { if (!doodles.length && canvas.isConnected) { doodles.push(...back); syncButtons(); redraw(); say("Doodles are back."); } }]]);
  }

  // --- save or share: 1080 x 1080 PNG, frame included, drawn in the browser ---
  async function saveOrShare() {
    saveBtn.disabled = true;
    say("Drawing your picture…");
    try {
      try { await Promise.all([document.fonts.load(`800 32px ${FONT_D}`), document.fonts.load(`600 22px ${FONT_B}`)]); } catch { /* fall back to system fonts */ }
      const c = document.createElement("canvas"); c.width = c.height = 1080;
      const g = c.getContext("2d");
      g.fillStyle = BRAND.oat; g.fillRect(0, 0, 1080, 1080);
      g.save();
      g.shadowColor = "rgba(30,27,23,.22)"; g.shadowBlur = 30; g.shadowOffsetY = 10;
      g.fillStyle = "#FFFFFF"; roundRectPath(g, 70, 40, 940, 940, 32); g.fill();
      g.restore();
      g.save(); g.translate(70, 40);
      renderPiece(g, 940, { scene, frame: currentFrame(), doodles, t: 0, now: performance.now() + 1e6, motion: false, mat: BRAND.oat });
      g.restore();
      g.textAlign = "center"; g.textBaseline = "alphabetic";
      g.fillStyle = BRAND.blue; g.font = `800 34px ${FONT_D}`;
      g.fillText("Nova's Pack", 540, 1032);
      g.fillStyle = BRAND.muted; g.font = `600 22px ${FONT_B}`;
      let line = `${name}'s week · ${weekLabel(data.from)}`;
      while (line.length > 8 && g.measureText(line).width > 880) line = line.slice(0, -2);
      g.fillText(line, 540, 1064);
      const blob = await new Promise((resolve) => c.toBlob((b) => resolve(b), "image/png"));
      if (!blob) { say("Couldn't make the image on this device."); return; }
      const filename = `novas-pack-art-${(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "pet")}-${isoDate()}.png`;
      let file = null;
      try { file = new File([blob], filename, { type: "image/png" }); } catch { file = null; }
      let can = false;
      try { can = !!(file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })); } catch { can = false; }
      if (can) {
        try { await navigator.share({ files: [file], title: `${name}'s week · Nova's Pack` }); say("Shared. Tag @novathehumanhandler so Nova sees it."); return; } catch (err) {
          if (err && err.name === "AbortError") { say(""); return; }
        }
      }
      const url = URL.createObjectURL(blob);
      const a = h("a", { href: url, download: filename });
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      say("Saved to your downloads. Nothing was uploaded.");
    } catch {
      say("Couldn't make the image on this device.");
    } finally {
      saveBtn.disabled = false;
    }
  }

  // --- go ---
  syncButtons();
  rebuild();
  fit();
  tintFor(p).then((tint) => {
    if (disposed || !canvas.isConnected) return;
    pal = makePalette(tint);
    canvas.dataset.tint = tint.join(",");
    rebuild();
  });

  // New frames: one calm celebration, then remembered. Sample diaries never unlock anything.
  if (!p.sample) {
    const fresh = FRAMES.filter((f) => unlocked.has(f.id) && !seen.has(f.id) && !pendingCele.has(f.id));
    if (fresh.length) {
      fresh.forEach((f) => pendingCele.add(f.id));
      let tries = 0;
      const go = () => {
        if (!canvas.isConnected) { fresh.forEach((f) => pendingCele.delete(f.id)); return; }
        if (document.querySelector("dialog[open]") && tries++ < 6) { setTimeout(go, 1500); return; }
        fresh.forEach((f) => pendingCele.delete(f.id));
        setSetting("studioSeen", [...new Set([...(Array.isArray(S.settings.studioSeen) ? S.settings.studioSeen : []), ...fresh.map((f) => f.id)])]);
        celebrate(fresh.map((f) => ({ emoji: f.emoji, title: `New frame: ${f.name}`, text: f.line, badge: true })));
      };
      setTimeout(go, 600);
    }
  }
}
