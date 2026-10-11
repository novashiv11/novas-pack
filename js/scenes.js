// WORK IN PROGRESS (CRQ-003): not loaded by the app yet. The builder stopped at a usage limit; finish and wire in later.
// Nova's Pack: a tiny SVG scene renderer. "A picture is worth 1,000 words": every training step gets one
// flat, friendly picture (a dog, a cat, a person, a few props and marks) drawn from a small spec.
//
//   scene({ bg: "room", parts: [ { t: "dog", v: "sit", x: 110, flip: true }, { t: "bubble", text: "yes!", x: 60, y: 16 } ] })
//
// Returns an <svg viewBox="0 0 160 100" aria-hidden="true">. Colours come from CSS classes (.sc-*) in css/visuals.css,
// so dark mode works. Parts are drawn in array order. Shared options: x, y (feet, default y 90), s (scale), flip (face left).
// No network, no libraries. Specs live in data/scenes.js.

const NS = "http://www.w3.org/2000/svg";
let uid = 0;
const n2 = (v) => Math.round(v * 100) / 100;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const SKIN = ["#F2C9A5", "#D9A074", "#A8704A", "#7A4A2E"];
const HAIR = ["#4A3426", "#9A6A35", "#2B2622", "#C9A24B"];
const xf = (o, s) => `translate(${n2(o.x ?? 80)} ${n2(o.y ?? 90)}) scale(${n2(o.flip ? -s : s)} ${n2(s)})`;
const at = (o, s, p) => [n2((o.x ?? 80) + (o.flip ? -s : s) * p[0]), n2((o.y ?? 90) + s * p[1])];
const rot = (p, deg, c) => {
  const a = (deg * Math.PI) / 180, dx = p[0] - c[0], dy = p[1] - c[1];
  return [c[0] + dx * Math.cos(a) - dy * Math.sin(a), c[1] + dx * Math.sin(a) + dy * Math.cos(a)];
};

// ---------------------------------------------------------------- background
function bg(kind = "room") {
  let s = '<rect class="sc-bg" width="160" height="100"/>';
  if (kind === "plain") return s;
  if (kind === "grass" || kind === "garden") {
    s += '<rect class="sc-grass" y="76" width="160" height="24"/>';
    s += '<path class="sc-tuft" d="M12,94 l-2,-5 M12,94 l2,-5 M12,94 v-6 M70,97 l-2,-5 M70,97 l2,-5 M70,97 v-6 M126,95 l-2,-5 M126,95 l2,-5 M126,95 v-6 M150,86 l-2,-4 M150,86 l2,-4 M150,86 v-5 M40,84 l-2,-4 M40,84 l2,-4 M40,84 v-5"/>';
    s += '<circle class="sc-pinkf" cx="26" cy="82" r="2"/><circle class="sc-goldf" cx="104" cy="81" r="2"/><circle class="sc-pinkf" cx="140" cy="80" r="2"/><circle class="sc-goldf" cx="58" cy="80" r="1.8"/>';
    return s;
  }
  if (kind === "hall") {
    return '<path class="sc-sky2" d="M0,0 H160 L106,26 H54 Z"/><path class="sc-wall" d="M0,0 L54,26 V74 L0,100 Z"/><path class="sc-wall" d="M160,0 L106,26 V74 L160,100 Z"/>' +
      '<rect class="sc-bg" x="54" y="26" width="52" height="48"/><rect class="sc-door" x="71" y="38" width="18" height="36" rx="1.5"/><circle class="sc-gold" cx="85.5" cy="57" r="1.4"/>' +
      '<path class="sc-floor" d="M0,100 L54,74 H106 L160,100 Z"/><path class="sc-rug" d="M70,74 H90 L124,100 H36 Z"/>';
  }
  s += '<rect class="sc-floor" y="78" width="160" height="22"/><path class="sc-base" d="M0,78 H160"/>';
  return s;
}

// ---------------------------------------------------------------- dog
const STAND_BODY = "M-24,-26 C-24,-34 -12,-36 -2,-36 C8,-37 18,-37 22,-31 C25,-26 22,-17 15,-14 L-12,-14 C-20,-14 -24,-19 -24,-26 Z";
const STAND_SADDLE = "M-30,-42 L26,-42 L25,-33 C14,-30 6,-27 -4,-27 C-14,-27 -22,-24 -30,-20 Z";
const DOG = {
  stand: {
    tail: "M-21,-31 C-30,-29 -35,-19 -33,-7 C-32,-4 -28,-5 -28,-8 C-28,-16 -25,-23 -19,-26 Z",
    body: STAND_BODY, saddle: STAND_SADDLE,
    far: ["M16,-18 L16,-3", "M-12,-19 L-11,-9 L-9,-3"], near: ["M10,-18 L10,-3", "M-17,-20 L-21,-9 L-18,-3"],
    neck: [12, -29], head: [26, -40, 0],
  },
  walk: {
    tail: "M-21,-31 C-29,-33 -35,-30 -37,-22 C-37,-19 -33,-19 -33,-22 C-32,-27 -27,-28 -20,-27 Z",
    body: STAND_BODY, saddle: STAND_SADDLE,
    far: ["M16,-18 L8,-3", "M-11,-19 L-5,-4"], near: ["M10,-18 L19,-4", "M-17,-20 L-25,-9 L-24,-3"],
    neck: [12, -29], head: [27, -40, -3],
  },
  run: {
    tail: "M-21,-33 C-30,-36 -38,-37 -44,-35 C-46,-34 -45,-31 -42,-31 C-36,-31 -28,-30 -20,-28 Z",
    body: STAND_BODY, saddle: STAND_SADDLE,
    far: ["M16,-18 L27,-10 L35,-12", "M-11,-19 L-22,-11 L-31,-14"], near: ["M10,-18 L22,-8 L31,-8", "M-17,-20 L-29,-10 L-38,-6"],
    neck: [12, -29], head: [28, -40, -8], lift: 6,
  },
  sit: {
    tail: "M-22,-6 C-30,-6 -36,-5 -41,-2 C-43,0 -41,2 -38,2 C-33,1 -28,0 -22,0 Z",
    body: "M-24,-9 C-25,-17 -17,-27 -7,-31 C1,-35 9,-41 17,-38 C23,-34 22,-24 17,-16 C16,-12 15,-8 15,-3 L-15,-3 C-21,-3 -24,-5 -24,-9 Z",
    saddle: "M-30,-46 L28,-50 L24,-36 C12,-30 4,-24 -8,-19 C-16,-15 -24,-14 -30,-12 Z",
    haunch: [-12, -9, 11, 9], paw: [-1, -2.2, 8],
    far: ["M17,-26 L17,-3"], near: ["M11,-26 L11,-3"],
    neck: [11, -33], head: [22, -47, 0],
  },
  down: {
    tail: "M-23,-7 C-30,-7 -36,-5 -41,-2 C-43,0 -41,2 -38,2 C-33,1 -28,0 -22,-1 Z",
    body: "M-24,-9 C-24,-16 -14,-21 -4,-21 C6,-22 16,-22 20,-16 C23,-11 20,-3 14,-2 L-16,-2 C-22,-2 -24,-5 -24,-9 Z",
    saddle: "M-30,-28 L26,-28 L24,-17 C12,-14 2,-12 -10,-10 C-18,-9 -24,-9 -30,-8 Z",
    haunch: [-13, -8, 11, 7],
    far: ["M12,-5.5 L36,-5.5"], near: ["M8,-3 L32,-3"],
    neck: [10, -16], head: [25, -17, 8],
  },
};
// Names that reuse a body with a different head or twist.
const DOG_ALIAS = {
  jump: ["stand", { twist: [-48, -18, -3] }],
  sniff: ["stand", { head: [31, -13, 52], neck: [12, -27] }],
  "look-up": ["sit", { head: [22, -49, -38] }],
  "nose-in": ["sit", { head: [26, -45, 6], muzzle: true }],
  spin: ["walk", { head: [23, -34, 26], tail: DOG.walk.tail }],
};
const TUCKED = "M-20,-16 C-23,-9 -20,-3 -14,-2 C-11,-2 -11,-5 -13,-6 C-15,-8 -16,-11 -16,-16 Z";

function dogHead(o, h) {
  const w = !!o.worried;
  let g = "";
  g += w ? '<path class="sc-mark" d="M-2,-5 L-11,-11 L2,-9 Z"/>' : '<path class="sc-mark" d="M-1,-6 L2,-18 L8,-6 Z"/>';
  g += w ? '<path class="sc-mark" d="M-6,-3 L-16,-8 L-5,-9 Z"/>' : '<path class="sc-mark" d="M-6,-5 L-4,-19 L3,-7 Z"/>';
  g += '<ellipse class="sc-fur" cx="0" cy="0" rx="9" ry="7.5"/>';
  const m = o.mouth;
  if (m === "yawn") {
    g += '<path class="sc-mouth" d="M4,1 L21,0 L18,10 L4,8 Z"/><ellipse class="sc-tongue" cx="12" cy="8" rx="4.5" ry="2"/>';
    g += '<path class="sc-mark" d="M3,-3.5 L15,-3 Q21,-2 21,0.5 L4,2 Z"/><path class="sc-mark" d="M4,7 L18,9.5 Q21,12 17,13 L5,11 Z"/>';
    g += '<circle class="sc-nose" cx="20" cy="-0.8" r="2.4"/>';
  } else {
    g += '<path class="sc-mark" d="M3,-3.5 L15,-3 Q21,-2 21,2 Q21,6.5 15,7 L3,7.5 Z"/><circle class="sc-nose" cx="20" cy="-0.3" r="2.5"/><circle class="sc-shine" cx="19.2" cy="-1.4" r="0.8"/>';
    if (m === "open") g += '<path class="sc-tongue" d="M7,7 Q8,15 13,13 Q15,10 14,7 Z"/>';
  }
  if (o.calm) g += '<path class="sc-eyeline" d="M3.6,-2 Q6,-4.6 8.4,-2"/>';
  else g += '<circle class="sc-eye" cx="6.2" cy="-2" r="1.8"/><circle class="sc-shine" cx="6.8" cy="-2.7" r="0.6"/>';
  if (w) g += '<path class="sc-eyeline" d="M3,-6.2 L9.5,-4.4"/>';
  if (o.muzzle) {
    g += '<g class="sc-muz"><rect class="sc-muz-b" x="3" y="-6" width="21" height="16" rx="4"/><path class="sc-muz-l" d="M9,-6 V10 M14,-6 V10 M19,-6 V10 M3,-1 H24 M3,4 H24"/></g>';
    if (o.strap) g += '<path class="sc-muz-s" d="M5,-5 C0,-11 -5,-9 -7,-3"/>';
  }
  return g;
}

function dog(o, A) {
  let name = o.v || "stand", over = {};
  if (DOG_ALIAS[name]) [name, over] = DOG_ALIAS[name];
  const P = { ...(DOG[name] || DOG.stand), ...over };
  const s = 0.72 * (o.s ?? 1), cream = o.coat === "cream";
  let [hx, hy, hr] = P.head;
  if (o.look === "up") { hr -= 36; hy -= 2; hx -= 2; }
  if (o.look === "down") { hr += 30; hy += 4; hx += 1; }
  const [nx, ny] = P.neck;
  const cx = nx + (hx - nx) * 0.5, cy = ny + (hy - ny) * 0.5;
  const L = Math.hypot(hx - nx, hy - ny) || 1, ux = (hx - nx) / L, uy = (hy - ny) / L;
  let px = -uy, py = ux;
  if (py < 0) { px = -px; py = -py; }
  const id = `sc${++uid}`;
  let inner = "";
  inner += `<path class="sc-fur2 sc-tailp" d="${o.worried && name !== "sit" && name !== "down" ? TUCKED : P.tail}"/>`;
  inner += P.far.map((d) => `<path class="sc-legs2" d="${d}"/>`).join("");
  inner += `<clipPath id="${id}"><path d="${P.body}"/></clipPath><path class="sc-fur" d="${P.body}"/>`;
  if (!cream) inner += `<path class="sc-mark" clip-path="url(#${id})" d="${P.saddle}"/>`;
  if (P.haunch) inner += `<ellipse class="sc-haunch" cx="${P.haunch[0]}" cy="${P.haunch[1]}" rx="${P.haunch[2]}" ry="${P.haunch[3]}"/>`;
  if (P.paw) inner += `<ellipse class="sc-fur" cx="${P.paw[0]}" cy="${P.paw[1]}" rx="${P.paw[2]}" ry="2.6"/>`;
  inner += P.near.map((d) => `<path class="sc-legs" d="${d}"/>`).join("");
  inner += `<path class="sc-neck" d="M${nx},${ny} L${hx},${hy}"/>`;
  inner += `<path class="sc-collar" d="M${n2(cx - px * 6.2)},${n2(cy - py * 6.2)} L${n2(cx + px * 6.2)},${n2(cy + py * 6.2)}"/><circle class="sc-tag" cx="${n2(cx + px * 7.6)}" cy="${n2(cy + py * 7.6)}" r="2"/>`;
  inner += `<g transform="translate(${hx} ${hy}) rotate(${hr})">${dogHead({ ...o, muzzle: o.muzzle ?? P.muzzle }, hr)}</g>`;
  let col = [cx + px * 8, cy + py * 8], nose = rot([hx + 20, hy + 1], hr, [hx, hy]);
  if (P.twist) {
    inner = `<g transform="rotate(${P.twist[0]} ${P.twist[1]} ${P.twist[2]})">${inner}</g>`;
    col = rot(col, P.twist[0], [P.twist[1], P.twist[2]]); nose = rot(nose, P.twist[0], [P.twist[1], P.twist[2]]);
  }
  const lift = P.lift || 0;
  A.dog.push({ collar: at(o, s, [col[0], col[1] - lift]), nose: at(o, s, [nose[0], nose[1] - lift]) });
  return `<g class="${cream ? "sc-cream" : ""}" transform="${xf({ ...o, y: (o.y ?? 90) - lift * s }, s)}">${inner}</g>`;
}

// ---------------------------------------------------------------- cat
function catHead(x, y, mood = "calm", sc = 1) {
  const up = mood === "upset", happy = mood === "happy";
  let g = up
    ? '<path class="sc-cat2" d="M-8,-3 L-17,-4 L-9,-9 Z"/><path class="sc-cat2" d="M8,-3 L17,-4 L9,-9 Z"/>'
    : '<path class="sc-cat" d="M-8.4,-2 L-7.4,-14 L-1,-7 Z"/><path class="sc-cat" d="M8.4,-2 L7.4,-14 L1,-7 Z"/><path class="sc-pinkf" d="M-7,-4 L-6.6,-10.5 L-3.2,-6.5 Z"/><path class="sc-pinkf" d="M7,-4 L6.6,-10.5 L3.2,-6.5 Z"/>';
  g += '<circle class="sc-cat" r="9"/>';
  if (happy) g += '<path class="sc-cline" d="M-6.6,-0.4 Q-4.2,-3.6 -1.8,-0.4 M1.8,-0.4 Q4.2,-3.6 6.6,-0.4"/>';
  else if (up) g += '<ellipse class="sc-ciris" cx="-3.8" cy="-1" rx="2.1" ry="1.2"/><ellipse class="sc-ciris" cx="3.8" cy="-1" rx="2.1" ry="1.2"/><path class="sc-cline" d="M-6.5,-4 L-1.8,-2.4 M6.5,-4 L1.8,-2.4"/>';
  else g += '<ellipse class="sc-ciris" cx="-3.8" cy="-1" rx="2.2" ry="2.5"/><ellipse class="sc-ciris" cx="3.8" cy="-1" rx="2.2" ry="2.5"/><ellipse class="sc-eye" cx="-3.8" cy="-1" rx="0.9" ry="2"/><ellipse class="sc-eye" cx="3.8" cy="-1" rx="0.9" ry="2"/>';
  g += '<path class="sc-cnose" d="M-1.4,2.2 L1.4,2.2 L0,3.8 Z"/><path class="sc-cline" d="M0,3.8 Q-1.4,5.6 -3.2,4.8 M0,3.8 Q1.4,5.6 3.2,4.8"/><path class="sc-whisk" d="M-7,2.4 L-14,1 M-7,4 L-14,5 M7,2.4 L14,1 M7,4 L14,5"/>';
  return `<g transform="translate(${x} ${y}) scale(${sc})">${g}</g>`;
}

function cat(o) {
  if (o.v === "carrier") return carrier({ ...o, cat: true });
  const s = o.s ?? 1, mood = o.mood || (o.happy ? "happy" : "calm"), up = mood === "upset";
  let g = "";
  if (o.v === "stand") {
    g += `<path class="sc-catl2" d="M6,-14 L6,-2 M-9,-14 L-8,-2"/><path class="sc-tailc" d="M-16,-18 C-25,-20 -27,-30 -22,-38"/>`;
    g += '<ellipse class="sc-cat" cx="0" cy="-17" rx="17" ry="8"/><path class="sc-cline2" d="M-8,-24 L-6,-20 M-2,-25 L0,-21 M4,-24 L6,-20"/>';
    g += '<path class="sc-catl" d="M11,-14 L11,-2 M-14,-14 L-13,-2"/>';
    g += catHead(20, -27, mood, 0.9);
  } else {
    const tail = up ? "M-12,-4 C-26,-4 -29,-20 -23,-31" : "M-12,-3 C-22,-1 -27,-8 -24,-16";
    g += `<path class="sc-tailc" d="${tail}"/>`;
    g += '<path class="sc-cat" d="M-14,-1 C-16,-13 -10,-25 0,-27 C10,-28 15,-19 13,-8 C12,-4 13,-2 13,-1 Z"/>';
    g += '<ellipse class="sc-cat2" cx="-5" cy="-8" rx="10" ry="8"/><path class="sc-cline2" d="M-9,-20 L-5,-17 M-6,-24 L-2,-21 M-11,-14 L-7,-12"/>';
    g += '<ellipse class="sc-catw" cx="9" cy="-15" rx="3.6" ry="9"/><path class="sc-catl" d="M9,-14 L9,-3"/><ellipse class="sc-catw" cx="9.4" cy="-2" rx="4" ry="2.2"/>';
    g += catHead(7, -34, mood, 1);
    if (o.swish || up) g += '<path class="sc-motion" d="M-30,-34 Q-33,-27 -30,-20 M-35,-36 Q-39,-27 -35,-18"/>';
  }
  return `<g transform="${xf(o, s * 0.95)}">${g}</g>`;
}

function carrier(o) {
  const s = o.s ?? 1, closed = o.door === "closed";
  let g = '<rect class="sc-shell" x="-23" y="-35" width="46" height="35" rx="6"/><path class="sc-handle" d="M-9,-35 C-9,-46 9,-46 9,-35"/>';
  g += '<rect class="sc-inside" x="-17" y="-29" width="34" height="26" rx="5"/>';
  if (o.cat) g += catHead(0, -15, o.mood || "calm", 1.05);
  g += '<rect class="sc-blanket" x="-17" y="-9" width="34" height="6" rx="3"/>';
  if (closed) {
    g += '<path class="sc-bars" d="M-12,-29 V-3 M-6,-29 V-3 M0,-29 V-3 M6,-29 V-3 M12,-29 V-3"/><circle class="sc-gold" cx="19.5" cy="-16" r="1.8"/>';
  } else {
    g += '<path class="sc-bars" d="M17,-29 L27,-33 L27,-2 L17,-3 Z M22,-31 V-2.5"/>';
  }
  return `<g transform="${xf(o, s)}">${g}</g>`;
}

// ---------------------------------------------------------------- person
const PERSON = {
  stand: { sh: [1, -49], hip: [0, -30], neck: [1, -51], head: [3, -61], far: [[0, -30], [-1, -16], [-3, -3]], near: [[0, -30], [1, -16], [3, -3]] },
  walk: { sh: [2, -49], hip: [0, -30], neck: [2, -51], head: [4, -61], far: [[0, -30], [-5, -16], [-10, -3]], near: [[0, -30], [5, -16], [10, -3]] },
  crouch: { sh: [0, -37], hip: [-8, -17], neck: [1, -39], head: [5, -48], far: [[-8, -17], [8, -18], [4, -3]], near: [[-8, -17], [10, -14], [9, -3]] },
};
const ARM = { down: [3, 17, 4], out: [25, -2, 6], low: [24, 14, 5], up: [12, -22, 4], point: [32, -4, 0], lead: [15, 8, 5], reach: [26, 8, 4], back: [-4, 16, 3] };

const treatShape = (x, y, r = 3.4) => `<circle class="sc-treat" cx="${n2(x)}" cy="${n2(y)}" r="${r}"/><circle class="sc-shine" cx="${n2(x - r * 0.3)}" cy="${n2(y - r * 0.35)}" r="${n2(r * 0.22)}"/>`;
function muzzleSide(withTreat) {
  return '<g class="sc-muz"><rect class="sc-muz-b" x="-1" y="-7" width="23" height="14" rx="4.5"/>' +
    (withTreat ? treatShape(6, 1, 3) : "") +
    '<path class="sc-muz-l" d="M5,-7 V7 M10,-7 V7 M15,-7 V7 M-1,-2.4 H21 M-1,2.6 H21"/><ellipse class="sc-muz-o" cx="21" cy="0" rx="3.2" ry="7"/></g>';
}
function held(name, [x, y]) {
  switch (name) {
    case "treat": return `<circle class="sc-skin" cx="${x}" cy="${y}" r="3"/>${treatShape(x + 2.5, y - 2, 3.6)}`;
    case "fist": return `<g transform="translate(${x} ${y})"><rect class="sc-skin" x="-4.4" y="-4.8" width="10" height="9.6" rx="3.8"/><path class="sc-fline" d="M-0.5,-2 H5 M-0.5,0.4 H5.4 M-0.5,2.8 H5"/></g>`;
    case "cloth": return `<circle class="sc-skin" cx="${x}" cy="${y}" r="3"/><rect class="sc-cloth" x="${x - 1}" y="${y - 2}" width="10" height="7" rx="2" transform="rotate(-18 ${x} ${y})"/>`;
    case "handle": return `<circle class="sc-skin" cx="${x}" cy="${y}" r="3"/><circle class="sc-handlep" cx="${x + 1}" cy="${y + 4}" r="2.6"/>`;
    default: return `<circle class="sc-skin" cx="${x}" cy="${y}" r="3"/>`;
  }
}
function person(o, A) {
  const pose = PERSON[o.v === "kneel" ? "crouch" : o.v] || PERSON.stand;
  const s = 0.88 * (o.s ?? 1) * (o.kid ? 0.66 : 1), sh = pose.sh;
  const armOf = (a) => (Array.isArray(a) ? a : ARM[a] || ARM.down);
  const a1 = armOf(o.arm), a2 = armOf(o.arm2);
  const hand = (a) => [sh[0] + a[0], sh[1] + a[1]];
  const armD = (a) => { const [hx, hy] = hand(a); return `M${sh[0]},${sh[1]} Q${n2((sh[0] + hx) / 2)},${n2((sh[1] + hy) / 2 + (a[2] ?? 5))} ${n2(hx)},${n2(hy)}`; };
  const poly = (pts, c) => `<polyline class="${c}" points="${pts.map((p) => p.join(",")).join(" ")}"/>`;
  const shoe = (p) => `<ellipse class="sc-shoe" cx="${p[0] + 3}" cy="-2" rx="5.2" ry="2.5"/>`;
  const h1 = hand(a1), h2 = hand(a2), hd = pose.head;
  let g = `<path class="sc-arm2" d="${armD(a2)}"/>${held(o.hold2, h2)}`;
  g += poly(pose.far, "sc-pants2") + shoe(pose.far[2]) + poly(pose.near, "sc-pants") + shoe(pose.near[2]);
  g += `<line class="sc-torso" x1="${pose.hip[0]}" y1="${pose.hip[1]}" x2="${pose.neck[0]}" y2="${pose.neck[1]}"/>`;
  g += `<path class="sc-arm" d="${armD(a1)}"/>${held(o.hold, h1)}`;
  g += `<g transform="translate(${hd[0]} ${hd[1]})${o.kid ? " scale(1.25)" : ""}"><circle class="sc-hair" r="7.8"/><circle class="sc-skin" cx="1.6" cy="1.2" r="6.5"/><circle class="sc-eye" cx="5" cy="-0.2" r="0.95"/><path class="sc-smile" d="M3.4,3 Q5.4,4.8 7.2,3"/></g>`;
  if (o.badge === "cross") g += '<path class="sc-pinkf" d="M-1,-40 h3 v-3 h3 v3 h3 v3 h-3 v3 h-3 v-3 h-3 Z"/>';
  A.person.push({ hand: at(o, s, h1), hand2: at(o, s, h2), head: at(o, s, hd) });
  const style = `--sc-skin:${SKIN[o.skin ?? 0]};--sc-hair:${HAIR[o.hair ?? 0]}`;
  return `<g class="sc-shirt-${o.shirt || "blue"}" style="${style}" transform="${xf(o, s)}">${g}</g>`;
}

// ---------------------------------------------------------------- hand (close-up, comes in from the left; tip at x,y)
function hand(o) {
  const s = o.s ?? 1, v = o.v || "open";
  let g = "";
  if (o.hold === "muzzle") g += `<g transform="translate(-6 0)">${muzzleSide(o.treat)}</g>`;
  g += '<rect class="sc-sleeve" x="-92" y="-9.5" width="68" height="19" rx="4.5"/><path class="sc-cuff" d="M-26,-9.5 V9.5"/>';
  if (v === "fist") {
    g += '<rect class="sc-skin" x="-17" y="-8" width="18" height="16" rx="6.5"/><path class="sc-fline" d="M-9,-4 H0 M-9,0 H0.6 M-9,4 H0"/>';
    if (o.treat) g += treatShape(-1, 5.5, 2.4);
  } else {
    g += '<ellipse class="sc-skin" cx="-18" cy="0" rx="9" ry="7.8"/><ellipse class="sc-skin" cx="-15" cy="-7.4" rx="5.4" ry="2.7" transform="rotate(-28 -15 -7.4)"/>';
    g += '<rect class="sc-skin" x="-13" y="-5.4" width="13" height="10.8" rx="5.4"/><path class="sc-fline" d="M-9,-1.8 H-1 M-9,1.8 H-1"/>';
    if (v === "pinch" || o.hold === "treat") g += treatShape(0.5, 0, 3.8);
  }
  if (o.hold === "cloth") g += '<rect class="sc-cloth" x="-6" y="-8" width="16" height="16" rx="3"/>';
  return `<g class="sc-shirt-${o.shirt || "blue"}" style="--sc-skin:${SKIN[o.skin ?? 0]}" transform="translate(${n2(o.x ?? 80)} ${n2(o.y ?? 50)}) rotate(${o.rot ?? 0}) scale(${s})">${g}</g>`;
}

// ---------------------------------------------------------------- props
function door(o) {
  const s = o.s ?? 1, v = o.v || "closed", fx = v === "closed" ? -16 : v === "ajar" ? -5 : 7, k = v === "closed" ? 0 : v === "ajar" ? 2 : 5;
  let g = '<rect class="sc-frame" x="-19" y="-78" width="38" height="78" rx="2"/><rect class="sc-out" x="-16" y="-75" width="32" height="75"/>';
  if (v === "open") g += '<path class="sc-tuft" d="M-8,-1 l-2,-5 M-8,-1 l2,-5 M2,-1 l-2,-5 M2,-1 l2,-5"/>';
  g += `<path class="sc-door" d="M16,-75 L${fx},${-75 - k} L${fx},${k} L16,0 Z"/>`;
  if (v === "closed") g += '<rect class="sc-door2" x="-10" y="-68" width="20" height="26" rx="2"/><rect class="sc-door2" x="-10" y="-37" width="20" height="30" rx="2"/>';
  g += `<circle class="sc-gold" cx="${fx + 5}" cy="-36" r="2.6"/>`;
  return `<g transform="${xf(o, s)}">${g}</g>`;
}
function mat(o) {
  return `<g transform="${xf(o, o.s ?? 1)}"><path class="sc-mat" d="M-27,-3 L27,-3 L32,4 L-32,4 Z"/><path class="sc-mat2" d="M-24,-0.4 L24,-0.4 L26.5,1.8 L-26.5,1.8 Z"/></g>`;
}
function toy(o) {
  return `<g transform="${xf(o, o.s ?? 1)}"><g class="sc-toy"><rect x="-8" y="-2.4" width="16" height="4.8" rx="2"/><circle cx="-9" cy="-3" r="3.2"/><circle cx="-9" cy="3" r="3.2"/><circle cx="9" cy="-3" r="3.2"/><circle cx="9" cy="3" r="3.2"/></g></g>`;
}
function treat(o) {
  const n = o.n || 1, gap = o.gap ?? 8, r = 3.4 * (o.s ?? 1);
  let g = "";
  for (let i = 0; i < n; i++) g += treatShape((o.x ?? 80) + (i - (n - 1) / 2) * gap, o.y ?? 88, r);
  return g;
}
function muzzleProp(o) {
  return `<g transform="${xf({ ...o, y: o.y ?? 50 }, o.s ?? 1)}">${muzzleSide(o.treat)}</g>`;
}
function puddle(o) {
  return `<ellipse class="sc-puddle" cx="${o.x ?? 80}" cy="${o.y ?? 91}" rx="${o.rx ?? 13}" ry="${o.ry ?? 3.2}"/>`;
}
function clock(o) {
  const s = o.s ?? 1;
  return `<g transform="translate(${o.x ?? 80} ${o.y ?? 24}) scale(${s})"><rect class="sc-ink" x="-2" y="-16" width="4" height="4" rx="1"/><circle class="sc-clockf" r="11.5"/><text class="sc-t ${o.text && o.text.length > 3 ? "xs" : "sm"}" x="0" y="${o.text && o.text.length > 3 ? 2.6 : 3.4}">${esc(o.text || "")}</text></g>`;
}
function paw(o) {
  const s = o.s ?? 1;
  let g = '<ellipse class="sc-cat" cx="0" cy="4" rx="19" ry="14"/>';
  g += '<ellipse class="sc-cat" cx="-13" cy="-7" rx="5.4" ry="6.4"/><ellipse class="sc-cat" cx="-4.5" cy="-12" rx="5.4" ry="6.6"/><ellipse class="sc-cat" cx="4.5" cy="-12" rx="5.4" ry="6.6"/><ellipse class="sc-cat" cx="13" cy="-7" rx="5.4" ry="6.4"/>';
  g += '<path class="sc-claw" d="M-6.5,-16 C-7,-24 -4,-28 0,-29 C-1,-24 -2,-20 -2.5,-16 Z"/>';
  g += '<ellipse class="sc-pinkf" cx="-13" cy="-6" rx="2.6" ry="3"/><ellipse class="sc-pinkf" cx="-4.5" cy="-10" rx="2.6" ry="3.2"/><ellipse class="sc-pinkf" cx="4.5" cy="-10" rx="2.6" ry="3.2"/><ellipse class="sc-pinkf" cx="13" cy="-6" rx="2.6" ry="3"/>';
  g += '<path class="sc-pinkf" d="M-8,8 Q-9,0 0,-1 Q9,0 8,8 Q4,13 0,12 Q-4,13 -8,8 Z"/>';
  g += '<g class="sc-shirt-blue" style="--sc-skin:' + SKIN[o.skin ?? 1] + '"><rect class="sc-skin" x="-6" y="-2" width="12" height="40" rx="6" transform="translate(-32 -26) rotate(-52 0 0)"/></g>';
  return `<g transform="translate(${o.x ?? 80} ${o.y ?? 60}) scale(${s})">${g}</g>`;
}
function icon(o) {
  const v = o.v, s = o.s ?? 1;
  let g = '<circle class="sc-chip" r="10.5"/>';
  if (v === "sleep") g += '<text class="sc-t sm" x="-2.5" y="4.4">z</text><text class="sc-t xs" x="4.2" y="-1.4">z</text>';
  else if (v === "eat") g += '<path class="sc-bowl" d="M-6.5,-0.5 H6.5 Q5.6,6 0,6 Q-5.6,6 -6.5,-0.5 Z"/><circle class="sc-treat" cx="-2.4" cy="-2.6" r="2"/><circle class="sc-treat" cx="2.4" cy="-2.2" r="2"/>';
  else if (v === "play") g += '<circle class="sc-ball" r="6"/><path class="sc-ballline" d="M-5.4,-2 Q0,2 5.4,-2"/>';
  else if (v === "vet") g += '<path class="sc-pinkf" d="M-2,-7 h4 v5 h5 v4 h-5 v5 h-4 v-5 h-5 v-4 h5 Z"/>';
  else if (v === "garden") g += '<path class="sc-tuft" d="M-5,6 l-1,-5 M-5,6 l2,-4 M5,6 l-2,-4 M5,6 l1,-5"/><circle class="sc-pinkf" cx="0" cy="-2" r="3"/><circle class="sc-gold" cx="0" cy="-2" r="1.2"/><path class="sc-tuft" d="M0,1 V6"/>';
  return `<g transform="translate(${o.x ?? 80} ${o.y ?? 16}) scale(${s})">${g}</g>`;
}

// ---------------------------------------------------------------- marks
function bubble(o) {
  const t = String(o.text || ""), w = Math.max(26, t.length * 6.6 + 14), hh = 18;
  const x = o.x ?? 80, y = o.y ?? 16, l = x - w / 2, r = x + w / 2, top = y - hh / 2, bot = y + hh / 2;
  let tail = "";
  if (o.to) {
    const [tx, ty] = o.to, below = ty >= y;
    const bx = n2(Math.min(Math.max(tx, l + 8), r - 8)), by = below ? bot : top;
    tail = `<path class="sc-bub-t" d="M${n2(bx - 4)},${by} L${tx},${ty} L${n2(bx + 4)},${by}"/><path class="sc-bub-c" d="M${n2(bx - 3.4)},${by} L${n2(bx + 3.4)},${by}"/>`;
  }
  return `<g class="sc-bubg${o.c === "gold" ? " gold" : ""}"><rect class="sc-bub" x="${n2(l)}" y="${n2(top)}" width="${n2(w)}" height="${hh}" rx="9"/>${tail}<text class="sc-t" x="${x}" y="${y + 4.2}">${esc(t)}</text></g>`;
}
const headPath = (x, y, dx, dy, size = 6.5) => {
  const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
  const bx = x - dx * size, by = y - dy * size, px = -dy * size * 0.58, py = dx * size * 0.58;
  return `M${n2(x)},${n2(y)} L${n2(bx + px)},${n2(by + py)} L${n2(bx - px)},${n2(by - py)} Z`;
};
function arrow(o) {
  const [x1, y1] = o.from, [x2, y2] = o.to, bend = o.bend || 0;
  const L = Math.hypot(x2 - x1, y2 - y1) || 1;
  const cx = (x1 + x2) / 2 - ((y2 - y1) / L) * bend, cy = (y1 + y2) / 2 + ((x2 - x1) / L) * bend;
  const dx = x2 - cx, dy = y2 - cy, d = Math.hypot(dx, dy) || 1;
  const ex = x2 - (dx / d) * 5, ey = y2 - (dy / d) * 5;
  let sx = x1, sy = y1, back = "";
  if (o.both) {
    const bx = x1 - cx, by = y1 - cy, e = Math.hypot(bx, by) || 1;
    sx = x1 - (bx / e) * 5; sy = y1 - (by / e) * 5; back = `<path class="sc-a-h" d="${headPath(x1, y1, bx, by)}"/>`;
  }
  return `<g class="sc-arrow c-${o.c || "blue"}${o.dash ? " dash" : ""}"><path class="sc-a-l" d="M${n2(sx)},${n2(sy)} Q${n2(cx)},${n2(cy)} ${n2(ex)},${n2(ey)}"/><path class="sc-a-h" d="${headPath(x2, y2, dx, dy)}"/>${back}</g>`;
}
function spin(o) {
  const x = o.x ?? 80, y = o.y ?? 50, rx = o.rx ?? 20, ry = o.ry ?? rx, a0 = ((o.from ?? 200) * Math.PI) / 180, sw = ((o.sweep ?? 300) * Math.PI) / 180, N = 28;
  const P = [];
  for (let i = 0; i <= N; i++) { const a = a0 + (sw * i) / N; P.push([x + rx * Math.cos(a), y + ry * Math.sin(a)]); }
  const e = P[N], p = P[N - 3], k = Math.hypot(e[0] - p[0], e[1] - p[1]) || 1, hsz = o.head ?? 6.5;
  const line = P.slice(0, N - 1).map((q, i) => `${i ? "L" : "M"}${n2(q[0])},${n2(q[1])}`).join("");
  return `<g class="sc-arrow c-${o.c || "blue"}"><path class="sc-a-l" d="${line}"/><path class="sc-a-h" d="${headPath(e[0], e[1], e[0] - p[0], e[1] - p[1], hsz)}"/></g>`;
}
function motion(o) {
  const n = o.n || 3, len = o.len || 9, dir = o.dir ?? 1;
  let d = "";
  for (let i = 0; i < n; i++) { const yy = (o.y ?? 60) + (i - (n - 1) / 2) * 4.2, l = len - (i % 2) * 3; d += `M${o.x ?? 80},${n2(yy)} h${-dir * l} `; }
  return `<path class="sc-motion" d="${d}"/>`;
}
const star = (x, y, s) => `<path class="sc-spark sc-twinkle" transform="translate(${x} ${y}) scale(${s})" d="M0,-5 L1.4,-1.4 L5,0 L1.4,1.4 L0,5 L-1.4,1.4 L-5,0 L-1.4,-1.4 Z"/>`;
function spark(o) {
  return (o.pts || [[o.x ?? 80, o.y ?? 40, o.s ?? 1.4]]).map((p) => star(p[0], p[1], p[2] ?? 1.4)).join("");
}
function check(o) {
  return `<g transform="translate(${o.x ?? 80} ${o.y ?? 40}) scale(${o.s ?? 1})"><circle class="sc-gold sc-gold-s" r="7.5"/><path class="sc-tick" d="M-3.6,0.4 L-1,3 L3.8,-2.8"/></g>`;
}
function pause(o) {
  return `<g transform="translate(${o.x ?? 80} ${o.y ?? 24}) scale(${o.s ?? 1})"><circle class="sc-gold sc-gold-s" r="9"/><path class="sc-bars2" d="M-3,-4.5 V4.5 M3,-4.5 V4.5"/></g>`;
}
function stop(o) {
  return `<g transform="translate(${o.x ?? 80} ${o.y ?? 24}) scale(${o.s ?? 1})"><path class="sc-stop" d="M-4.2,-10 H4.2 L10,-4.2 V4.2 L4.2,10 H-4.2 L-10,4.2 V-4.2 Z"/><path class="sc-stopbar" d="M-5,0 H5"/></g>`;
}
function no(o) {
  const r = o.r ?? 12;
  return `<g class="sc-no"><circle cx="${o.x ?? 80}" cy="${o.y ?? 50}" r="${r}"/><path d="M${n2((o.x ?? 80) - r * 0.7)},${n2((o.y ?? 50) - r * 0.7)} L${n2((o.x ?? 80) + r * 0.7)},${n2((o.y ?? 50) + r * 0.7)}"/></g>`;
}
function tally(o) {
  const n = o.n || 5, gap = o.gap ?? 9;
  let g = "";
  for (let i = 0; i < n; i++) g += `<circle class="sc-gold sc-gold-s" cx="${n2((o.x ?? 80) + (i - (n - 1) / 2) * gap)}" cy="${o.y ?? 16}" r="3.6"/>`;
  return g;
}
function label(o) {
  const t = String(o.text || ""), w = t.length * 6.4 + 14;
  return `<g><rect class="sc-chip" x="${n2((o.x ?? 80) - w / 2)}" y="${(o.y ?? 16) - 9}" width="${n2(w)}" height="18" rx="9"/><text class="sc-t" x="${o.x ?? 80}" y="${(o.y ?? 16) + 4.2}">${esc(t)}</text></g>`;
}
function ring(o) {
  const r = o.r ?? 8;
  return `<ellipse class="sc-ring" cx="${o.x ?? 80}" cy="${o.y ?? 50}" rx="${r}" ry="${o.ry ?? r}"/>` +
    (o.text ? `<circle class="sc-gold sc-gold-s" cx="${n2((o.x ?? 80) + r * 0.85)}" cy="${n2((o.y ?? 50) - (o.ry ?? r) * 0.85)}" r="4.6"/><text class="sc-t xs dk" x="${n2((o.x ?? 80) + r * 0.85)}" y="${n2((o.y ?? 50) - (o.ry ?? r) * 0.85 + 2.5)}">${esc(o.text)}</text>` : "");
}
function drop(o) {
  return `<path class="sc-drop" transform="translate(${o.x ?? 80} ${o.y ?? 30}) scale(${o.s ?? 1})" d="M0,-6 C3,-1 4.5,1 4.5,3 A4.5,4.5 0 0 1 -4.5,3 C-4.5,1 -3,-1 0,-6 Z"/>`;
}

function lead(o, A) {
  const a = o.from || (A.person[o.p ?? 0] || {}).hand || [40, 56];
  const b = o.to || (A.dog[o.d ?? 0] || {}).collar || [110, 56];
  const [x1, y1] = a, [x2, y2] = b;
  if (o.v === "tight") {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    let ticks = "";
    for (const t of [-9, 0, 9]) ticks += `M${n2(mx + (dx / L) * t + nx * 3.6)},${n2(my + (dy / L) * t + ny * 3.6)} l${n2(nx * 3.4)},${n2(ny * 3.4)} M${n2(mx + (dx / L) * t - nx * 3.6)},${n2(my + (dy / L) * t - ny * 3.6)} l${n2(-nx * 3.4)},${n2(-ny * 3.4)} `;
    return `<path class="sc-lead" d="M${x1},${y1} L${x2},${y2}"/><path class="sc-tick2" d="${ticks}"/>`;
  }
  const sag = o.sag ?? Math.max(9, Math.hypot(x2 - x1, y2 - y1) * 0.26);
  return `<path class="sc-lead" d="M${x1},${y1} Q${n2((x1 + x2) / 2)},${n2((y1 + y2) / 2 + sag * 2)} ${x2},${y2}"/>`;
}

const DRAW = {
  dog, person, cat, carrier, hand, door, mat, toy, treat, muzzle: muzzleProp, puddle, clock, paw, icon,
  bubble, arrow, spin, motion, spark, check, pause, stop, no, tally, label, ring, drop,
};

/** The markup (SVG children) for a spec. Exported for tests and contact sheets. */
export function sceneMarkup(spec) {
  const parts = (spec && spec.parts) || [];
  const A = { dog: [], person: [] };
  const out = parts.map((p) => (p.t === "lead" ? null : (DRAW[p.t] ? DRAW[p.t](p, A) : "")));
  parts.forEach((p, i) => { if (p.t === "lead") out[i] = lead(p, A); });
  return bg(spec && spec.bg) + out.join("");
}

/** A decorative <svg> picture for one step. The step text sits next to it, so it is hidden from screen readers. */
export function scene(spec) {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 160 100");
  svg.setAttribute("class", "scene");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
  svg.innerHTML = sceneMarkup(spec);
  return svg;
}
