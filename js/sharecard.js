// Shareable images, drawn on the device with <canvas> (the same approach as card.js). Nothing is uploaded.
//   openPartnerCard(p, a, trainer)  1080 × 1350: photo, name, stage, level, the 5 stats, top 3 badges, trainer rank
//   openLineCard(line)              1080 × 1080: today's line from Nova (or a famous quote, with its attribution)
// Share goes through the phone's share sheet when it can take files, otherwise it downloads a PNG.

import { h, put, sheet } from "./util.js";
import { slug } from "./forms.js";

const C = { blue: "#1F4E6E", oat: "#F3F2EB", ink: "#1E1B17", muted: "#5C544B", tanText: "#8E5019", gold: "#F2B544", goldLedge: "#A97B1E", sunk: "#E9E6DB", soft: "#DCE7F0", white: "#FFFFFF" };
const FONT_D = '"Bricolage Grotesque", "Avenir Next", system-ui, sans-serif';
const FONT_B = '"Plus Jakarta Sans", system-ui, sans-serif';
const font = (w, s, display) => `${w} ${s}px ${display ? FONT_D : FONT_B}`;

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
function paw(g, cx, cy, s) {
  g.fillStyle = C.blue;
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

/** Draw the Partner card. data: { name, stage, level, stats: [{label, value, na}], badges: [{emoji, name}], rank, photo, sample, species } */
export async function drawPartner(canvas, data) {
  await fontsReady();
  const [head, photo] = await Promise.all([img("img/brand/nova-head.svg"), img(data.photo)]);
  const W = 1080, H = 1350, g = canvas.getContext("2d");
  canvas.width = W; canvas.height = H;
  g.fillStyle = C.blue; g.fillRect(0, 0, W, H);
  g.fillStyle = C.oat; rr(g, 40, 40, 1000, 1270, 48); g.fill();
  header(g, head, W, "PARTNER CARD", data.sample);

  // photo
  const px = 80, py = 168, pw = 920, ph = 470;
  g.save(); rr(g, px, py, pw, ph, 32); g.clip();
  g.fillStyle = C.soft; g.fillRect(px, py, pw, ph);
  if (photo) {
    const ir = photo.naturalWidth / photo.naturalHeight, br = pw / ph;
    let sw = photo.naturalWidth, sh = photo.naturalHeight, sx = 0, sy = 0;
    if (ir > br) { sw = sh * br; sx = (photo.naturalWidth - sw) / 2; } else { sh = sw / br; sy = (photo.naturalHeight - sh) / 3; }
    g.drawImage(photo, sx, sy, sw, sh, px, py, pw, ph);
  } else if (data.sample && head) {
    g.drawImage(head, px + pw / 2 - 180, py + ph / 2 - 190, 360, 360);
  } else if (data.icon) {
    g.textAlign = "center"; g.textBaseline = "middle";
    g.font = `300px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
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

  // stats
  const stats = data.stats.filter((s) => !s.na);
  const top = 820, gap = stats.length > 3 ? 62 : 80;
  stats.forEach((s, i) => {
    const y = top + i * gap;
    g.fillStyle = C.ink; g.textAlign = "left"; g.font = font(700, 30, false); g.fillText(s.label, 80, y + 22);
    g.textAlign = "right"; g.font = font(800, 32, true); g.fillText(String(s.value), 1000, y + 22);
    g.fillStyle = C.sunk; rr(g, 330, y + 4, 590, 22, 11); g.fill();
    if (s.value > 0) { g.fillStyle = C.gold; rr(g, 330, y + 4, Math.max(22, 590 * s.value / 100), 22, 11); g.fill(); }
  });
  if (!stats.length) { g.fillStyle = C.muted; g.font = font(600, 30, false); g.textAlign = "left"; g.fillText("Growing together, one small step at a time.", 80, top + 30); }

  // badges and rank
  let y = 1140;
  g.textAlign = "left"; g.fillStyle = C.ink; g.font = font(800, 28, false);
  g.fillText("Badges", 80, y + 34);
  let x = 210;
  const badges = data.badges.slice(0, 3);
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
  g.fillText("novashiv11.github.io/novas-pack", 1000, 1276);
}

/** Draw today's line. line: { text, by?, source? } */
export async function drawLine(canvas, line) {
  await fontsReady();
  const head = await img("img/brand/nova-head.svg");
  const W = 1080, H = 1080, g = canvas.getContext("2d");
  canvas.width = W; canvas.height = H;
  g.fillStyle = C.blue; g.fillRect(0, 0, W, H);
  g.fillStyle = C.oat; rr(g, 40, 40, 1000, 1000, 48); g.fill();
  header(g, head, W, "1% BETTER", false);
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
  g.fillText("Nova's Pack · 1% better every day", 110, 990);
}

async function shareCanvas(canvas, filename, title, status) {
  const blob = await new Promise((r) => canvas.toBlob((b) => r(b), "image/png"));
  if (!blob) { status.textContent = "Couldn't make the image on this device."; return; }
  let file = null;
  try { file = new File([blob], filename, { type: "image/png" }); } catch { file = null; }
  let can = false;
  try { can = !!(file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })); } catch { can = false; }
  if (can) {
    try { await navigator.share({ files: [file], title }); status.textContent = "Shared. Tag @novathehumanhandler so Nova sees it."; return; } catch (e) {
      if (e && e.name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = h("a", { href: url, download: filename });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  status.textContent = "Saved to your downloads.";
}

function cardSheet(title, alt, filename, draw) {
  sheet(title, (body) => {
    const canvas = h("canvas.share-canvas", { role: "img", "aria-label": alt, width: "1080", height: "1350" });
    const status = h("p.small.muted", { role: "status" }, "Drawing…");
    const shareBtn = h("button.btn.btn-blue", { type: "button", "data-k": "share-go", disabled: true, onclick: () => shareCanvas(canvas, filename, title, status) }, "Share or save");
    put(body,
      h("div.share-frame", canvas),
      h("div.row-btns.left", shareBtn),
      status,
      h("p.small.muted", "Made on your phone. Nothing is uploaded; you choose where it goes."));
    draw(canvas).then(() => { status.textContent = ""; shareBtn.disabled = false; canvas.dataset.ready = "1"; })
      .catch(() => { status.textContent = "Couldn't draw the card on this device."; });
  });
}

export function openPartnerCard(p, a, trainer) {
  const data = {
    name: p.name, sample: !!p.sample, photo: p.photo || null, icon: p.icon || null, level: a.level.level,
    stage: [a.stage ? a.stage.label : "", a.stage ? `${a.stage.months} months` : ""].filter(Boolean).join(" · "),
    stats: a.stats, rank: trainer.rank.name,
    badges: a.badges.filter((b) => b.earned).sort((x, y) => (y.at || 0) - (x.at || 0)).slice(0, 3),
  };
  if (a.stage && a.stage.months >= 24) data.stage = `${a.stage.label} · ${Math.floor(a.stage.months / 12)} years`;
  const alt = `${p.name}'s partner card: level ${data.level}. ${data.stats.filter((s) => !s.na).map((s) => `${s.label} ${s.value}`).join(", ")}. Trainer rank ${data.rank}.`;
  cardSheet(`${p.name}'s partner card`, alt, `${slug(p.name)}-partner-card.png`, (c) => drawPartner(c, data));
}

export function openLineCard(line) {
  const alt = `Today's line: “${line.text}” ${line.by ? `${line.by}.` : "Nova."}`;
  cardSheet("Share today's line", alt, "novas-pack-line.png", (c) => drawLine(c, line));
}
