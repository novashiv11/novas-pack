// Shareable images, drawn on the device with <canvas> (the same approach as card.js). Nothing is uploaded.
//   openTrophyCard(data)            Story 9:16 (1080 × 1920, default) or Post 4:5 (1080 × 1350): the "I did it" trophy for a
//                                   trick, a level-up, a week won, a badge or a first. Pet photo/icon in a gold ring, a medal with
//                                   the emoji, the achievement in huge type, a Nova line, confetti. Has a "Copy caption" button.
//   openPartnerCard(p, a, trainer)  Post 4:5 (default) or Story 9:16: photo, name, stage, level, the stats that are above 0,
//                                   top 3 badges, trainer rank
//   openLineCard(line)              1080 × 1080: today's line from Nova (or a famous quote, with its attribution)
// Share goes through the phone's share sheet when it can take files, otherwise it downloads a PNG.
//
// DESIGN RULES for a card people actually post (CRQ-042). From how Duolingo's streak milestones, Spotify Wrapped and
// Strava's year-in-sport cards spread, plus the usual Instagram Story guidance (Meta publishes no official safe-zone
// numbers; about 250 px top and bottom is the common rule, the bottom reply bar can need more):
//  1. One win, one glance. The achievement is the biggest thing on the card and reads at thumbnail size in a second,
//     before any small print (Duolingo treats milestones like power-ups so the moment is obvious without words).
//  2. The pet is the hero, we are the frame. People post their own animal, not our logo: photo in a gold ring, our
//     branding small, at the bottom. A card that looks like an ad does not get posted.
//  3. Bold, joyful, character-led. Saturated brand colour, a medal, confetti and a witty Nova line (Wrapped and Duolingo
//     lean on humour and punchlines, not data). Warm and a little bossy; never guilt, never "beat your friends".
//  4. Real or nothing. Only what actually happened: no invented counts, streaks or "top 1%". Anything empty (no photo,
//     no sub line, no date) is left out, and the Nova line is labelled as Nova's.
//  5. Native format. Story 9:16 is the default (1080 × 1920) with nothing important in the top or bottom 250 px (profile
//     bar, close button, reply bar); the key content sits in the middle ~1080 × 1420. A 4:5 Post option for the feed.
//  6. Ready to post in two taps. Share or save, plus a copy-ready caption with the pet's name and win filled in and the
//     handle and hashtag, so the card spreads the app honestly without any extra work.

import { h, put, sheet } from "./util.js";
import { slug, segmented } from "./forms.js";

const C = {
  blue: "#1F4E6E", oat: "#F3F2EB", ink: "#1E1B17", muted: "#5C544B", tanText: "#8E5019", tan: "#C27A3A",
  gold: "#F2B544", goldLedge: "#A97B1E", goldLight: "#FFD982", sunk: "#E9E6DB", soft: "#DCE7F0", white: "#FFFFFF",
  pink: "#E0566E", pinkDark: "#B03A52", sky: "#8EC1E0", deep: "#0F2F45",
};
const FONT_D = '"Bricolage Grotesque", "Avenir Next", system-ui, sans-serif';
const FONT_B = '"Plus Jakarta Sans", system-ui, sans-serif';
const FONT_E = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
const font = (w, s, display) => `${w} ${s}px ${display ? FONT_D : FONT_B}`;
const SITE = "novashiv11.github.io/novas-pack";
const HANDLE = "@novathehumanhandler";

function img(src) {
  return new Promise((resolve) => {
    if (!src) { resolve(null); return; }
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => resolve(null);
    i.src = src;
  });
}
async function fontsReady() {
  try { await Promise.all([document.fonts.load(font(800, 40, true)), document.fonts.load(font(700, 30, false))]); } catch { /* fall back */ }
}
function rr(g, x, y, w, hh, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + hh, r);
  g.arcTo(x + w, y + hh, x, y + hh, r);
  g.arcTo(x, y + hh, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
function fit(g, text, maxW, size, weight, display, min = 22) {
  let s = size;
  g.font = font(weight, s, display);
  while (g.measureText(text).width > maxW && s > min) { s -= 2; g.font = font(weight, s, display); }
  if (g.measureText(text).width > maxW) {
    while (text.length > 1 && g.measureText(`${text}…`).width > maxW) text = text.slice(0, -1);
    text += "…";
  }
  return text;
}
function wrap(g, text, maxW) {
  const words = String(text).split(/\s+/), lines = [];
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (g.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}
/** Shorten text to fit one line, cutting at a word where it can, and ending with an ellipsis. */
function clip(g, text, maxW) {
  if (g.measureText(text).width <= maxW) return text;
  const words = text.split(" ");
  while (words.length > 1 && g.measureText(`${words.join(" ")}…`).width > maxW) words.pop();
  let t = words.join(" ");
  while (t.length > 1 && g.measureText(`${t}…`).width > maxW) t = t.slice(0, -1);
  return `${t}…`;
}
/** Draw an image to fill a box (like CSS object-fit: cover). `bias` 0..1 picks how high the crop sits (faces are usually up top). */
function cover(g, im, x, y, w, hh, bias = 1 / 3) {
  const ir = im.naturalWidth / im.naturalHeight, br = w / hh;
  let sw = im.naturalWidth, sh = im.naturalHeight, sx = 0, sy = 0;
  if (ir > br) { sw = sh * br; sx = (im.naturalWidth - sw) / 2; } else { sh = sw / br; sy = (im.naturalHeight - sh) * bias; }
  g.drawImage(im, sx, sy, sw, sh, x, y, w, hh);
}
function paw(g, cx, cy, s, color = C.blue) {
  g.fillStyle = color;
  g.beginPath(); g.ellipse(cx, cy + 40 * s, 70 * s, 58 * s, 0, 0, Math.PI * 2); g.fill();
  [[-80, -40, -0.3], [-30, -85, -0.1], [30, -85, 0.1], [80, -40, 0.3]].forEach(([dx, dy, rot]) => {
    g.beginPath(); g.ellipse(cx + dx * s, cy + dy * s, 26 * s, 34 * s, rot, 0, Math.PI * 2); g.fill();
  });
}
function chip(g, text, x, y, bg, fg) {
  g.font = font(800, 28, false);
  const w = g.measureText(text).width + 40;
  g.fillStyle = bg; rr(g, x, y, w, 52, 26); g.fill();
  g.fillStyle = fg; g.textBaseline = "middle"; g.textAlign = "left";
  g.fillText(text, x + 20, y + 27);
  g.textBaseline = "alphabetic";
  return w;
}
function header(g, head, W, label, sample) {
  if (head) { g.fillStyle = C.soft; g.beginPath(); g.arc(116, 112, 38, 0, Math.PI * 2); g.fill(); g.drawImage(head, 84, 80, 64, 64); }
  g.fillStyle = C.ink; g.textAlign = "left"; g.font = font(800, 44, true);
  g.fillText("Nova's Pack", 170, 128);
  g.fillStyle = C.tanText; g.textAlign = "right"; g.font = font(800, 26, false);
  g.fillText(sample ? `SAMPLE · ${label}` : label, W - 80, 124);
}

// ---------- party decorations (shared by the Trophy card and the Story-size Partner card) ----------

function hash(str) {
  let x = 2166136261;
  for (const ch of String(str)) { x ^= ch.codePointAt(0); x = Math.imul(x, 16777619); }
  return x >>> 0;
}
/** Small seeded random numbers, so the confetti is the same every time the same card is drawn. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function star(g, cx, cy, r, points = 5, inner = 0.45) {
  g.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 ? r * inner : r, a = -Math.PI / 2 + (i * Math.PI) / points;
    g[i ? "lineTo" : "moveTo"](cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  }
  g.closePath();
}
function sparkle(g, cx, cy, r, color) {
  g.fillStyle = color;
  star(g, cx, cy, r, 4, 0.22);
  g.fill();
}
/** Confetti: rectangles, dots, triangles, squiggles, stars and tiny paw prints. `avoid` = rectangles [x, y, w, h] to keep clear. */
function confettiField(g, rnd, W, H, count, avoid) {
  const cols = [C.gold, C.pink, C.oat, C.tan, C.sky, C.white, C.gold, C.pink];
  for (let i = 0; i < count; i++) {
    const x = rnd() * W, y = rnd() * H, s = 16 + rnd() * 26, rot = rnd() * Math.PI * 2;
    const col = cols[Math.floor(rnd() * cols.length)], kind = Math.floor(rnd() * 8), alpha = 0.72 + rnd() * 0.28;
    if (avoid.some(([ax, ay, aw, ah]) => x > ax - s && x < ax + aw + s && y > ay - s && y < ay + ah + s)) continue;
    g.save();
    g.translate(x, y); g.rotate(rot); g.globalAlpha = alpha;
    g.fillStyle = col; g.strokeStyle = col;
    if (kind <= 1) { g.fillRect(-s / 2, -s / 4, s, s / 2); }
    else if (kind === 2) { g.beginPath(); g.arc(0, 0, s / 3, 0, Math.PI * 2); g.fill(); }
    else if (kind === 3) { g.beginPath(); g.moveTo(0, -s / 2); g.lineTo(s / 2, s / 2); g.lineTo(-s / 2, s / 2); g.closePath(); g.fill(); }
    else if (kind === 4) {
      g.lineWidth = 7; g.lineCap = "round";
      g.beginPath(); g.moveTo(-s, 0); g.quadraticCurveTo(-s / 2, -s / 1.4, 0, 0); g.quadraticCurveTo(s / 2, s / 1.4, s, 0); g.stroke();
    }
    else if (kind === 5) { star(g, 0, 0, s / 1.6); g.fill(); }
    else { paw(g, 0, 0, s / 150, col); }
    g.restore();
  }
}
/** Blue gradient, soft sunburst rays and a gold glow around (cx, cy), then confetti. */
function backdrop(g, W, H, cx, cy, rnd, avoid, count) {
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#2B6893"); bg.addColorStop(0.45, C.blue); bg.addColorStop(1, "#14354D");
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const n = 20, R = Math.hypot(W, H);
  g.fillStyle = "rgba(255,255,255,0.06)";
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = a0 + Math.PI / n;
    g.beginPath(); g.moveTo(cx, cy);
    g.lineTo(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R);
    g.lineTo(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R);
    g.closePath(); g.fill();
  }
  const glow = g.createRadialGradient(cx, cy, 0, cx, cy, 620);
  glow.addColorStop(0, "rgba(242,181,68,0.45)"); glow.addColorStop(1, "rgba(242,181,68,0)");
  g.fillStyle = glow; g.fillRect(0, 0, W, H);
  confettiField(g, rnd, W, H, count, avoid);
}

// ---------- Partner card ----------

/**
 * Draw the Partner card. data: { name, stage, level, stats: [{label, value, na}], badges: [{emoji, name}], rank, photo, sample, species, icon }
 * Stats that are n/a or 0 are left out. format: "post" (1080 × 1350, default) or "story" (1080 × 1920, the card sits in the safe zone).
 */
export async function drawPartner(canvas, data, format = data.format) {
  await fontsReady();
  const [head, photo] = await Promise.all([img("img/brand/nova-head.svg"), img(data.photo)]);
  const story = format === "story";
  const W = 1080, H = 1350, CH = story ? 1920 : H, g = canvas.getContext("2d");
  canvas.width = W; canvas.height = CH;
  if (story) {
    const off = (CH - H) / 2;
    backdrop(g, W, CH, W / 2, off + 380, rng(hash(`${data.name}|partner`)), [[40, off + 40, 1000, 1270]], 120);
    g.translate(0, off);
  } else { g.fillStyle = C.blue; g.fillRect(0, 0, W, H); }
  g.fillStyle = C.oat; rr(g, 40, 40, 1000, 1270, 48); g.fill();
  header(g, head, W, "PARTNER CARD", data.sample);

  // photo
  const px = 80, py = 168, pw = 920, ph = 470;
  g.save(); rr(g, px, py, pw, ph, 32); g.clip();
  g.fillStyle = C.soft; g.fillRect(px, py, pw, ph);
  if (photo) {
    cover(g, photo, px, py, pw, ph);
  } else if (data.sample && head) {
    g.drawImage(head, px + pw / 2 - 180, py + ph / 2 - 190, 360, 360);
  } else if (data.icon) {
    g.textAlign = "center"; g.textBaseline = "middle";
    g.font = `300px ${FONT_E}`;
    g.fillText(data.icon, px + pw / 2, py + ph / 2 + 10);
    g.textBaseline = "alphabetic";
  } else paw(g, px + pw / 2, py + ph / 2, 1.3);
  g.restore();

  // level medal
  const mx = px + pw - 90, my = py + ph - 10;
  g.fillStyle = C.goldLedge; g.beginPath(); g.arc(mx, my + 6, 82, 0, Math.PI * 2); g.fill();
  g.fillStyle = C.gold; g.beginPath(); g.arc(mx, my, 82, 0, Math.PI * 2); g.fill();
  g.fillStyle = C.ink; g.textAlign = "center"; g.font = font(800, 26, false); g.fillText("LEVEL", mx, my - 22);
  g.font = font(800, 72, true); g.fillText(String(data.level), mx, my + 46);

  // name and stage
  g.textAlign = "left";
  g.fillStyle = C.blue; g.fillText(fit(g, data.name, 700, 84, 800, true, 44), 80, 728);
  g.fillStyle = C.tanText; g.fillText(fit(g, data.stage, 720, 34, 700, false, 24), 80, 778);

  // stats: only the ones that have something to show (not n/a, not 0), centred in the space they have
  const stats = (data.stats || []).filter((s) => !s.na && s.value > 0);
  const gap = stats.length > 3 ? 62 : stats.length > 1 ? 80 : 100;
  const top = 810 + Math.max(0, (310 - stats.length * gap) / 2);
  stats.forEach((s, i) => {
    const y = top + i * gap;
    g.fillStyle = C.ink; g.textAlign = "left"; g.font = font(700, 30, false); g.fillText(s.label, 80, y + 22);
    g.textAlign = "right"; g.font = font(800, 32, true); g.fillText(String(s.value), 1000, y + 22);
    g.fillStyle = C.sunk; rr(g, 330, y + 4, 590, 22, 11); g.fill();
    g.fillStyle = C.gold; rr(g, 330, y + 4, Math.max(22, 590 * s.value / 100), 22, 11); g.fill();
  });
  if (!stats.length) {
    g.fillStyle = C.muted; g.font = font(600, 34, false); g.textAlign = "left";
    g.fillText("Growing together, one small step at a time.", 80, 960);
  }

  // badges and rank
  let y = 1140;
  g.textAlign = "left"; g.fillStyle = C.ink; g.font = font(800, 28, false);
  g.fillText("Badges", 80, y + 34);
  let x = 210;
  const badges = (data.badges || []).slice(0, 3);
  if (!badges.length) { g.fillStyle = C.muted; g.font = font(600, 28, false); g.fillText("The first one is on its way", x, y + 34); }
  for (const b of badges) {
    const label = `${b.emoji} ${b.name}`;
    g.font = font(800, 28, false);
    if (x + g.measureText(label).width + 40 > 1000) break;
    x += chip(g, label, x, y, C.gold, C.ink) + 12;
  }
  y = 1222;
  g.fillStyle = C.blue; g.font = font(800, 30, false); g.textAlign = "left";
  g.fillText(fit(g, `App rank: ${data.rank}`, 900, 30, 800, false), 80, y);
  g.fillStyle = C.blue; g.font = font(800, 28, false);
  g.fillText("Nova's Pack · Level up together", 80, 1276);
  g.textAlign = "right"; g.fillStyle = C.muted; g.font = font(600, 22, false);
  g.fillText(SITE, 1000, 1276);
}

// ---------- Line card ----------

/** Draw today's line. line: { text, by?, source? } */
export async function drawLine(canvas, line) {
  await fontsReady();
  const head = await img("img/brand/nova-head.svg");
  const W = 1080, H = 1080, g = canvas.getContext("2d");
  canvas.width = W; canvas.height = H;
  g.fillStyle = C.blue; g.fillRect(0, 0, W, H);
  g.fillStyle = C.oat; rr(g, 40, 40, 1000, 1000, 48); g.fill();
  header(g, head, W, "DO IT FOR THEM", false);
  // big quote, sized to fit
  let size = 76, lines;
  for (;;) {
    g.font = font(800, size, true);
    lines = wrap(g, `“${line.text}”`, 860);
    if (lines.length * size * 1.18 <= 560 || size <= 40) break;
    size -= 4;
  }
  const blockH = lines.length * size * 1.18;
  let y = 560 - blockH / 2 + size;
  g.fillStyle = C.blue; g.textAlign = "left";
  for (const l of lines) { g.fillText(l, 110, y); y += size * 1.18; }
  g.fillStyle = C.tanText; g.font = font(800, 32, false);
  g.fillText(fit(g, line.by ? `— ${line.by}` : "— Nova", 860, 32, 800, false), 110, y + 20);
  if (line.source) { g.fillStyle = C.muted; g.font = font(600, 24, false); g.fillText(fit(g, line.source, 860, 24, 600, false), 110, y + 62); }
  g.fillStyle = C.gold; rr(g, 110, 920, 120, 10, 5); g.fill();
  g.fillStyle = C.blue; g.font = font(800, 28, false); g.textAlign = "left";
  g.fillText("Nova's Pack · Do it for them", 110, 990);
}

// ---------- Trophy card ----------

const KINDS = {
  level: {
    label: "LEVEL UP", closer: "1 minute a day adds up.",
    nova: ["One minute a day, and look at the two of you. Same time tomorrow.", "That wasn't luck. That was turning up. I approve.", "Level up. Now try it with a distraction. Gently."],
  },
  badge: {
    label: "NEW BADGE", closer: "Showing up is the whole trick.",
    nova: ["Earned by showing up. Wear it loudly.", "I'd salute, but I'm a dog. Take a firm nod.", "Badges are for the ones who keep turning up. That's you."],
  },
  week: {
    label: "WEEKLY GOAL", closer: "A little every day adds up.",
    nova: ["A whole week of showing up. The pack noticed.", "Week won. Tell everyone, then go for a walk.", "Small steps, done on purpose. That's how a week gets won."],
  },
  trick: {
    label: "NAILED IT", closer: "Tiny sessions, big wins.",
    nova: ["Nailed it. Now ask for it in a different room.", "Another one in the bag. Treats were involved. Obviously.", "Neat work. Practise it somewhere new and pay in treats."],
  },
  session: {
    label: "MISSION DONE", closer: "1 minute a day adds up.",
    nova: ["Done is better than perfect. Same time tomorrow?", "You turned up. That's the whole trick.", "Short, happy, done. Exactly how I like it."],
  },
  first: {
    label: "A FIRST", closer: "Everyone starts somewhere.",
    nova: ["A first is a first. Remember today, then do it again tomorrow.", "Everyone starts somewhere. Look where you two are starting.", "Some firsts are worth a screenshot. This one's worth a card."],
  },
};
const SPECIES_EMOJI = [["dog", "🐶"], ["puppy", "🐶"], ["cat", "🐱"], ["kitten", "🐱"], ["rabbit", "🐰"], ["bunny", "🐰"], ["chicken", "🐔"], ["hen", "🐔"],
  ["horse", "🐴"], ["pony", "🐴"], ["bird", "🐦"], ["parrot", "🦜"], ["hamster", "🐹"], ["guinea", "🐹"], ["fish", "🐟"], ["goat", "🐐"], ["duck", "🦆"]];

const clean = (s) => String(s == null ? "" : s).replace(/\s+/g, " ").trim();
/** SHOUTING titles to Title Case, for captions (the card itself shouts on purpose). */
function soft(s) {
  if (!s || s !== s.toUpperCase() || s === s.toLowerCase()) return s;
  return s.toLowerCase().replace(/(^|[\s:(-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
}
function dateText(d) {
  if (d === undefined || d === null || d === "") return "";
  let dt;
  if (d instanceof Date) dt = d;
  else if (typeof d === "number") dt = new Date(d);
  else if (/^\d{4}-\d{2}-\d{2}$/.test(String(d))) { const [y, m, dd] = String(d).split("-").map(Number); dt = new Date(y, m - 1, dd); }
  else dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
function speciesEmoji(species) {
  const s = clean(species).toLowerCase();
  const hit = s && SPECIES_EMOJI.find(([k]) => s.includes(k));
  return hit ? hit[1] : "";
}
/** Tidy the caller's data: trimmed text, a known kind, and nothing undefined. */
function normalizeTrophy(data) {
  const d = data || {}, pet = d.pet || {};
  const kind = KINDS[d.kind] ? d.kind : "level";
  return {
    kind, meta: KINDS[kind],
    pet: { name: clean(pet.name), photo: pet.photo || null, icon: clean(pet.icon), species: clean(pet.species) },
    title: clean(d.title), sub: clean(d.sub), emoji: clean(d.emoji), date: dateText(d.date),
  };
}

/** A ready-to-post caption with the pet's name and the win filled in. */
export function trophyCaption(data) {
  const d = normalizeTrophy(data), who = d.pet.name, t = soft(d.title), e = d.emoji || "🐾";
  let lead;
  if (!t) lead = who ? `${who} just had a win` : "A win to celebrate";
  else if (d.kind === "badge") lead = `${who || "We"} just earned ${/badge/i.test(t) ? "the" : "a new badge:"} ${t}`;
  else if (d.kind === "week") lead = `${t}${who ? ` for ${who}` : ""}`;
  else if (d.kind === "trick") lead = `New trick unlocked${who ? ` for ${who}` : ""}: ${t}`;
  else if (d.kind === "session") lead = `Mission done${who ? ` with ${who}` : ""}: ${t}`;
  else if (d.kind === "first") lead = `A first for ${who || "us"}: ${t}`;
  else lead = `${who || "We"} just hit ${t}`;
  const sub = d.sub ? ` ${/[.!?]$/.test(d.sub) ? d.sub : `${d.sub}.`}` : "";
  return `${lead} ${e}${sub} ${d.meta.closer}\n\n${HANDLE} #NovasPack #NewToThePack`;
}

/** The big achievement, as lines. "LEVEL 2: RECALL" puts "LEVEL 2:" (gold) over "RECALL". Picks the biggest size that fits. */
function titleLines(g, text, maxW, maxLines, maxSize, minSize) {
  const m = text.match(/^([^:]{1,24}:)\s*(\S.*)$/);
  const parts = m ? [[m[1], "lead"], [m[2], "main"]] : [[text, "main"]];
  const build = (s) => {
    g.font = font(800, s, true);
    return parts.flatMap(([t, role]) => wrap(g, t, maxW).map((l) => ({ t: l, role })));
  };
  for (let s = maxSize; s >= minSize; s -= 4) {
    const lines = build(s);
    if (lines.length <= maxLines && lines.every((l) => g.measureText(l.t).width <= maxW)) return { size: s, lines };
  }
  const lines = build(minSize).slice(0, maxLines).map((l) => ({ ...l, t: fit(g, l.t, maxW, minSize, 800, true, minSize) }));
  return { size: minSize, lines };
}

function pillShape(g, text, cx, y, hgt, size, bg, ledge, fg, pad = 64, spacing = "3px") {
  g.font = font(800, size, false);
  if ("letterSpacing" in g) g.letterSpacing = spacing;
  const w = g.measureText(text).width + pad;
  g.fillStyle = ledge; rr(g, cx - w / 2, y + 6, w, hgt, hgt / 2); g.fill();
  g.fillStyle = bg; rr(g, cx - w / 2, y, w, hgt, hgt / 2); g.fill();
  g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(text, cx + 1.5, y + hgt / 2 + 2);
  g.textBaseline = "alphabetic";
  if ("letterSpacing" in g) g.letterSpacing = "0px";
  return w;
}
function ribbonTail(g, cx, cy, len, w, ang, color) {
  g.save(); g.translate(cx, cy); g.rotate(ang);
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(-w / 2, 0); g.lineTo(w / 2, 0); g.lineTo(w / 2, len); g.lineTo(0, len - w * 0.5); g.lineTo(-w / 2, len);
  g.closePath(); g.fill();
  g.restore();
}
function scallop(g, cx, cy, r, n = 18) {
  g.beginPath(); g.arc(cx, cy, r * 0.93, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    g.beginPath(); g.arc(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9, r * 0.13, 0, Math.PI * 2); g.fill();
  }
}
/** A prize rosette: pink ribbon tails, a scalloped gold medal, the emoji (or a star if there is none) in the middle. */
function medal(g, cx, cy, r, emoji) {
  ribbonTail(g, cx, cy, r * 1.55, r * 0.78, 0.36, C.pinkDark);
  ribbonTail(g, cx, cy, r * 1.55, r * 0.78, -0.22, C.pink);
  g.fillStyle = C.goldLedge; scallop(g, cx, cy + 9, r);
  g.fillStyle = C.gold; scallop(g, cx, cy, r);
  g.fillStyle = C.goldLight; g.beginPath(); g.arc(cx, cy, r * 0.78, 0, Math.PI * 2); g.fill();
  g.fillStyle = C.gold; g.beginPath(); g.arc(cx, cy, r * 0.69, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "rgba(255,255,255,0.55)"; g.lineWidth = r * 0.06; g.lineCap = "round";
  g.beginPath(); g.arc(cx, cy, r * 0.6, Math.PI * 1.08, Math.PI * 1.42); g.stroke();
  if (emoji) {
    const size = Math.round(r * 0.98);
    g.font = `${size}px ${FONT_E}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = C.ink;
    g.fillText(emoji, cx, cy + size * 0.05);
    g.textBaseline = "alphabetic";
  } else { g.fillStyle = C.goldLedge; star(g, cx, cy + r * 0.02, r * 0.46); g.fill(); }
}
/** The pet in a circle with a gold ring: their photo, else their emoji, else a paw. */
function petCircle(g, cx, cy, R, photo, icon) {
  g.fillStyle = C.goldLedge; g.beginPath(); g.arc(cx, cy + 12, R + 24, 0, Math.PI * 2); g.fill();
  g.fillStyle = C.gold; g.beginPath(); g.arc(cx, cy, R + 24, 0, Math.PI * 2); g.fill();
  g.fillStyle = C.oat; g.beginPath(); g.arc(cx, cy, R + 8, 0, Math.PI * 2); g.fill();
  g.save();
  g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.clip();
  g.fillStyle = C.soft; g.fillRect(cx - R, cy - R, R * 2, R * 2);
  if (photo) cover(g, photo, cx - R, cy - R, R * 2, R * 2, 0.3);
  else if (icon) {
    g.font = `${Math.round(R * 1.15)}px ${FONT_E}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = C.ink;
    g.fillText(icon, cx, cy + R * 0.06); g.textBaseline = "alphabetic";
  } else paw(g, cx, cy - R * 0.1, R / 190);
  g.restore();
}

/**
 * Draw the Trophy card. data: { pet: { name, photo?, icon?, species }, title, sub, emoji, kind, date }.
 * format: "story" (1080 × 1920, default) or "post" (1080 × 1350).
 */
export async function drawTrophy(canvas, data, format = "story") {
  await fontsReady();
  const d = normalizeTrophy(data), pet = d.pet;
  const [head, photo] = await Promise.all([img("img/brand/nova-head.svg"), img(pet.photo)]);
  const story = format !== "post";
  const W = 1080, H = story ? 1920 : 1350, cx = W / 2, g = canvas.getContext("2d");
  canvas.width = W; canvas.height = H;
  const L = story
    ? { top: 275, bottom: H - 270, rMax: 250, titleMax: 150, sub: 40, say: 36, pill: 64, foot: 30 }
    : { top: 66, bottom: H - 56, rMax: 225, titleMax: 124, sub: 34, say: 32, pill: 56, foot: 26 };

  // ---- measure everything first, so the hero can take whatever room is left ----
  const title = d.title || d.meta.label;
  const T = titleLines(g, title.toUpperCase(), 940, 3, L.titleMax, 56);
  const titleH = T.lines.length * T.size * 1.03;
  g.font = font(700, L.sub, false);
  let subLines = d.sub ? wrap(g, d.sub, 900) : [];
  if (subLines.length > 2) subLines = [subLines[0], clip(g, subLines.slice(1).join(" "), 900)];
  const subH = subLines.length * L.sub * 1.32;
  const seed = hash(`${d.kind}|${title}|${pet.name}`);
  const novaLine = d.meta.nova[seed % d.meta.nova.length];
  const sayX = 70 + 28 + 92 + 24, sayW = 1010 - 28 - sayX;
  g.font = font(700, L.say, false);
  const sayLines = wrap(g, novaLine, sayW).slice(0, 3);
  const bh = Math.max(150, 28 + 26 + 10 + sayLines.length * L.say * 1.28 + 30);
  const footTop = L.bottom - 44 - L.foot;
  const region = footTop - 30 - L.top;
  const pillText = [d.title ? d.meta.label : "", d.date.toUpperCase()].filter(Boolean).join(" · ");
  const pillH = pillText ? L.pill : 0;
  const fixed = pillH + titleH + (subH ? subH + 14 : 0) + bh;
  const minGap = 24, gaps = pillH ? 3 : 2;
  const R = Math.max(90, Math.min(L.rMax, (region - fixed - gaps * minGap - 24) / 2.39));
  const heroH = 2.39 * R + 24;
  const extra = Math.max(0, region - fixed - heroH - gaps * minGap);
  const gap = minGap + Math.min(extra / gaps, 56);
  let y = L.top + Math.max(0, (extra - (gap - minGap) * gaps) / 2);
  const pillY = y; if (pillH) y += pillH + gap;
  const heroTop = y; y += heroH + gap;
  const titleTop = y; y += titleH + (subH ? 14 : 0);
  const subTop = y; y += subH + gap;
  const bubbleTop = y;
  const cy = heroTop + 24 + R;

  // ---- paint ----
  const rnd = rng(seed);
  const avoid = [[60, titleTop - 10, 960, titleH + (subH ? subH + 24 : 20)], [60, bubbleTop - 10, 960, bh + 20], [60, pillY - 6, 960, pillH + 18], [100, footTop - 8, 880, 100]];
  backdrop(g, W, H, cx, cy, rnd, avoid, story ? 150 : 100);

  // pill: what kind of win, and when
  if (pillH) pillShape(g, pillText, cx, pillY, pillH, story ? 30 : 26, C.gold, C.goldLedge, C.ink);

  // hero: pet in a gold ring, a medal pinned bottom right, the name on a pink tag bottom left
  sparkle(g, cx - R * 1.12, cy - R * 0.55, R * 0.16, C.white);
  sparkle(g, cx + R * 1.08, cy - R * 0.8, R * 0.2, C.gold);
  sparkle(g, cx - R * 1.2, cy + R * 0.12, R * 0.11, C.gold);
  petCircle(g, cx, cy, R, photo, pet.icon || speciesEmoji(pet.species));
  medal(g, cx + R * 0.8, cy + R * 0.7, R * 0.46, d.emoji);
  if (pet.name) {
    const tagSize = story ? 46 : 40, tagCx = cx - R * 0.45, tagCy = cy + R * 0.9, tagH = story ? 78 : 68;
    g.save(); g.translate(tagCx, tagCy); g.rotate(-0.05);
    const text = fit(g, pet.name, Math.max(150, R * 1.3), tagSize, 800, true, 26);
    const tw = g.measureText(text).width + 56;
    g.fillStyle = C.pinkDark; rr(g, -tw / 2, -tagH / 2 + 7, tw, tagH, tagH / 2); g.fill();
    g.fillStyle = C.pink; rr(g, -tw / 2, -tagH / 2, tw, tagH, tagH / 2); g.fill();
    g.fillStyle = C.oat; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(text, 0, 3); g.textBaseline = "alphabetic";
    g.restore();
  }

  // the win, huge
  g.textAlign = "center"; g.lineJoin = "round";
  g.font = font(800, T.size, true);
  const lh = T.size * 1.03;
  T.lines.forEach((l, i) => {
    const by = titleTop + i * lh + T.size * 0.8;
    g.lineWidth = T.size * 0.14;
    g.strokeStyle = C.deep; g.strokeText(l.t, cx, by + T.size * 0.05);
    g.fillStyle = l.role === "lead" ? C.gold : C.oat; g.fillText(l.t, cx, by);
  });
  g.font = font(700, L.sub, false); g.fillStyle = "rgba(243,242,235,0.92)";
  subLines.forEach((l, i) => g.fillText(l, cx, subTop + i * L.sub * 1.32 + L.sub * 1.02));

  // Nova says
  g.fillStyle = C.deep; rr(g, 70, bubbleTop + 8, 940, bh, 36); g.fill();
  g.fillStyle = C.oat; rr(g, 70, bubbleTop, 940, bh, 36); g.fill();
  const hx = 70 + 28 + 46, hy = bubbleTop + bh / 2;
  g.fillStyle = C.soft; g.beginPath(); g.arc(hx, hy, 46, 0, Math.PI * 2); g.fill();
  if (head) g.drawImage(head, hx - 40, hy - 40, 80, 80); else paw(g, hx, hy - 6, 0.28);
  g.textAlign = "left";
  g.fillStyle = C.tanText; g.font = font(800, 22, false);
  if ("letterSpacing" in g) g.letterSpacing = "2px";
  g.fillText("NOVA SAYS", sayX, bubbleTop + 28 + 20);
  if ("letterSpacing" in g) g.letterSpacing = "0px";
  g.fillStyle = C.ink; g.font = font(700, L.say, false);
  sayLines.forEach((l, i) => g.fillText(l, sayX, bubbleTop + 28 + 26 + 10 + i * L.say * 1.28 + L.say * 0.9));

  // footer, small, inside the safe zone
  g.textAlign = "center";
  g.fillStyle = C.oat; g.font = font(800, L.foot, false);
  g.fillText(`${HANDLE} · #NovasPack`, cx, L.bottom - 44);
  g.fillStyle = "rgba(243,242,235,0.78)"; g.font = font(600, L.foot - 4, false);
  g.fillText(SITE, cx, L.bottom);
}

// ---------- sharing ----------

async function shareCanvas(canvas, filename, title, status) {
  const blob = await new Promise((r) => canvas.toBlob((b) => r(b), "image/png"));
  if (!blob) { status.textContent = "Couldn't make the image on this device."; return; }
  let file = null;
  try { file = new File([blob], filename, { type: "image/png" }); } catch { file = null; }
  let can = false;
  try { can = !!(file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })); } catch { can = false; }
  if (can) {
    try { await navigator.share({ files: [file], title }); status.textContent = "✓ Shared. Tag @novathehumanhandler so Nova sees it."; return; } catch (e) {
      if (e && e.name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = h("a", { href: url, download: filename });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  status.textContent = "✓ Saved to your downloads.";
}

async function copyText(text, area) {
  try {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
  } catch { /* try the old way */ }
  try {
    area.focus(); area.select(); area.setSelectionRange(0, text.length);
    return !!document.execCommand("copy");
  } catch { return false; }
}

const FORMATS = [["story", "Story 9:16"], ["post", "Post 4:5"]];

/**
 * The share sheet. draw(canvas, format) paints the card. filename is a string or a function of the format.
 * opts: { formats: [[id, label]...] (adds the size toggle), format: first one shown, caption: text for "Copy caption" }
 */
function cardSheet(title, alt, filename, draw, opts = {}) {
  const formats = opts.formats || null;
  let fmt = opts.format || (formats ? formats[0][0] : "post");
  const nameFor = typeof filename === "function" ? filename : () => filename;
  sheet(title, (body) => {
    const canvas = h("canvas.share-canvas", { role: "img", "aria-label": alt, width: "1080", height: fmt === "story" ? "1920" : "1350" });
    const status = h("p.share-status", { role: "status" }, "Drawing…");
    const shareBtn = h("button.btn.btn-blue", { type: "button", "data-k": "share-go", disabled: true, onclick: () => shareCanvas(canvas, nameFor(fmt), title, status) }, "Share or save");
    const area = opts.caption ? h("textarea", { rows: "5", "aria-label": "Caption, ready to post", value: opts.caption }) : null;
    const copyBtn = area ? h("button.btn.btn-line", { type: "button", "data-k": "copy-caption", onclick: async () => {
      const ok = await copyText(area.value, area);
      status.textContent = ok ? "✓ Caption copied. Paste it into your post." : "Couldn't copy automatically. Press and hold the caption to copy it.";
      status.classList.toggle("ok", ok);
    } }, "Copy caption") : null;
    let token = 0;
    const redraw = () => {
      const mine = ++token;
      shareBtn.disabled = true; status.textContent = "Drawing…"; delete canvas.dataset.ready;
      canvas.style.maxWidth = fmt === "story" ? "300px" : "360px";
      Promise.resolve(draw(canvas, fmt)).then(() => {
        if (mine !== token) return;
        status.textContent = ""; shareBtn.disabled = false; canvas.dataset.ready = "1"; canvas.dataset.format = fmt;
      }).catch(() => { if (mine === token) status.textContent = "Couldn't draw the card on this device."; });
    };
    put(body,
      formats ? segmented("share-size", "Picture size", formats, fmt, (v) => { fmt = v; redraw(); }, { hideLegend: true }) : null,
      h("div.share-frame", canvas),
      area ? h("div.field", area) : null,
      h("p.small.muted", "Made on your phone. Nothing is uploaded; you choose where it goes."),
      h("div.share-actions", status, h("div.row-btns.left", shareBtn, copyBtn)));
    redraw();
  });
}

// ---------- public openers ----------

/** Open the "Share this win" sheet. data: { pet: { name, photo?, icon?, species }, title, sub, emoji, kind: "level"|"badge"|"week"|"trick"|"session"|"first", date } */
export function openTrophyCard(data) {
  const d = normalizeTrophy(data);
  const alt = `${d.pet.name ? `${d.pet.name}: ` : ""}${d.title || d.meta.label}.${d.sub ? ` ${d.sub}.` : ""}${d.date ? ` ${d.date}.` : ""} A Nova's Pack trophy card.`;
  cardSheet("Share this win", alt, (f) => `${slug(d.pet.name)}-${d.kind}-${f}.png`,
    (c, f) => drawTrophy(c, d, f), { formats: FORMATS, format: "story", caption: trophyCaption(d) });
}

export function openPartnerCard(p, a, trainer) {
  const data = {
    name: p.name, sample: !!p.sample, photo: p.photo || null, icon: p.icon || null, level: a.level.level,
    stage: [a.stage ? a.stage.label : "", a.stage ? `${a.stage.months} months` : ""].filter(Boolean).join(" · "),
    stats: a.stats, rank: trainer.rank.name,
    badges: a.badges.filter((b) => b.earned).sort((x, y) => (y.at || 0) - (x.at || 0)).slice(0, 3),
  };
  if (a.stage && a.stage.months >= 24) data.stage = `${a.stage.label} · ${Math.floor(a.stage.months / 12)} years`;
  const shown = data.stats.filter((s) => !s.na && s.value > 0);
  const alt = `${p.name}'s partner card: level ${data.level}.${shown.length ? ` ${shown.map((s) => `${s.label} ${s.value}`).join(", ")}.` : ""} Trainer rank ${data.rank}.`;
  cardSheet(`${p.name}'s partner card`, alt, (f) => `${slug(p.name)}-partner-card${f === "story" ? "-story" : ""}.png`,
    (c, f) => drawPartner(c, data, f), { formats: [FORMATS[1], FORMATS[0]], format: "post" });
}

export function openLineCard(line) {
  const alt = `Today's line: “${line.text}” ${line.by ? `${line.by}.` : "Nova."}`;
  cardSheet("Share today's line", alt, "novas-pack-line.png", (c) => drawLine(c, line));
}
