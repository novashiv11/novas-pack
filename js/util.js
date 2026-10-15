// Small shared helpers: building DOM, dates, a bottom sheet, a toast with Undo, the weekly streak.

/**
 * h("p.note", { onclick }, "text", child) builds an element.
 * Props starting with "on" are listeners; `class`, `text`, `html` are NOT used for user data (text only).
 */
export function h(tag, props, ...kids) {
  const [name, ...classes] = tag.split(".");
  const el = document.createElement(name || "div");
  if (classes.length) el.className = classes.join(" ");
  if (props && (typeof props !== "object" || props instanceof Node || Array.isArray(props))) { kids.unshift(props); props = null; }
  let value;
  for (const [k, v] of Object.entries(props || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "value") { value = v; continue; }
    if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k === "class") el.className += (el.className ? " " : "") + v;
    else if (k === "dataset") Object.assign(el.dataset, v);
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else if (k in el && typeof v !== "string") el[k] = v;
    else if (v === true) el.setAttribute(k, "");
    else el.setAttribute(k, v);
  }
  add(el, kids);
  if (value !== undefined) el.value = value; // after children, so <select> options exist
  return el;
}
/** Like el.append(), but skips null/false (so optional parts can be written inline). */
export function put(el, ...kids) { add(el, kids); return el; }
function add(el, kids) {
  for (const k of kids.flat(Infinity)) {
    if (k === null || k === undefined || k === false) continue;
    el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
}
export const $ = (sel, root = document) => root.querySelector(sel);

/** A decorative emoji (hidden from screen readers) followed by its text label. */
export const em = (e) => h("span.em", { "aria-hidden": "true" }, e);

/** True when the phone is set to Ireland (time zone or language). Used only to show Irish rules to people they apply to. */
export function inIreland() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone === "Europe/Dublin" || /-IE$/i.test(navigator.language || ""); } catch { return false; }
}
export function uid() {
  return (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
}

// ---------- dates ----------
const pad = (n) => String(n).padStart(2, "0");
export const DAY = 86400000;
export function isoDate(d = new Date()) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
export function parseDate(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
export function addDays(s, n) { const d = parseDate(s); d.setDate(d.getDate() + n); return isoDate(d); }
export function addMonths(s, n) {
  const d = parseDate(s), day = d.getDate();
  d.setDate(1); d.setMonth(d.getMonth() + n);
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return isoDate(d);
}
export function daysBetween(a, b) { return Math.round((parseDate(b) - parseDate(a)) / DAY); }
export function startOfDay(ms = Date.now()) { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); }
/** Midnight at the start of the day `offset` days from ms (calendar maths, safe across clock changes). */
export function dayStart(ms = Date.now(), offset = 0) { const d = new Date(ms); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + offset); return d.getTime(); }
export function nextDayStart(ms = Date.now()) { return dayStart(ms, 1); }
export function fmtTime(ms) { return new Date(ms).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }); }
export function fmtDate(s, opts = { day: "numeric", month: "short", year: "numeric" }) {
  return (typeof s === "number" ? new Date(s) : parseDate(s)).toLocaleDateString(undefined, opts);
}
export function fmtDay(ms) {
  const d0 = startOfDay(ms), t0 = startOfDay();
  if (d0 === t0) return "Today";
  if (dayStart(t0, -1) === d0) return "Yesterday";
  return new Date(ms).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}
export function ago(ms, now = Date.now()) {
  const m = Math.max(0, Math.round((now - ms) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const hrs = Math.floor(m / 60);
  if (hrs < 48) return `${hrs} h ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}
/** Value for <input type="datetime-local"> from ms, and back. */
export function toLocalInput(ms) { const d = new Date(ms); return `${isoDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`; }
export function fromLocalInput(v) { const t = new Date(v).getTime(); return Number.isFinite(t) ? t : Date.now(); }
export function ageText(birthday) {
  if (!birthday) return "";
  const b = parseDate(birthday), n = new Date();
  let months = (n.getFullYear() - b.getFullYear()) * 12 + n.getMonth() - b.getMonth() - (n.getDate() < b.getDate() ? 1 : 0);
  if (months < 0) return "";
  if (months < 1) return "under 1 month old";
  if (months < 24) return `${months} month${months === 1 ? "" : "s"} old`;
  return `${Math.floor(months / 12)} years old`;
}

/** "8 months" / "2 years" since a date (for "home since"), or "" if it's in the future. */
export function sinceText(day) {
  const t = ageText(day);
  return t.replace(/ old$/, "").replace(/^under 1 month$/, "under a month");
}
/** True on the yearly anniversary of a date (not on the day itself). */
export function isAnniversary(day, now = new Date()) {
  if (!day) return false;
  const d = parseDate(day);
  return d.getMonth() === now.getMonth() && d.getDate() === now.getDate() && d.getFullYear() < now.getFullYear();
}

// ISO week id like "2026-W41", from the local date.
export function isoWeek(ms) {
  const d = new Date(ms);
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return `${t.getUTCFullYear()}-W${pad(Math.ceil(((t - y0) / DAY + 1) / 7))}`;
}

/**
 * Weekly streak from a list of timestamps. A week counts if it has at least one.
 * Every 4 weeks you take part earns 1 grace week (max 2 saved); a missed week uses one.
 * The current week never breaks a streak. Returns { weeks, graces, thisWeek, last8 }.
 */
export function weeklyStreak(times, now = Date.now()) {
  const done = new Set(times.map(isoWeek));
  const thisWeek = isoWeek(now);
  const weeks = [];
  const earliest = times.length ? Math.min(...times) : now;
  // Step back a week at a time from local noon on the same weekday (safe across clock changes).
  const back = (k) => { const d = new Date(now); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - 7 * k); return d.getTime(); };
  for (let i = 0; i < 520; i++) {
    const t = back(i);
    weeks.unshift(isoWeek(t));
    if (t < earliest - 7 * DAY) break;
  }
  let count = 0, graces = 0, since = 0;
  for (const w of weeks) {
    if (done.has(w)) {
      count++; since++;
      if (since === 4) { graces = Math.min(2, graces + 1); since = 0; }
    } else if (w !== thisWeek) {
      if (graces > 0) graces--; else { count = 0; since = 0; }
    }
  }
  const last8 = [];
  for (let i = 7; i >= 0; i--) {
    const w = isoWeek(back(i));
    const mon = new Date(back(i)); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
    last8.push({ id: w, label: `Week of ${mon.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`, done: done.has(w), current: i === 0 });
  }
  return { weeks: count, graces, thisWeek: done.has(thisWeek), last8 };
}

// ---------- bottom sheet (a real <dialog>, so focus, Esc and screen readers just work) ----------
// Phone Back closes the top sheet instead of leaving the screen: each sheet adds a history entry with the same URL,
// and closing the sheet any other way takes that entry back off.
const openSheets = [];
addEventListener("popstate", (e) => {
  const cur = e.state && e.state.npSheet;
  const keep = cur ? openSheets.findIndex((x) => x.id === cur) : -1;
  openSheets.slice(keep + 1).reverse().forEach((x) => x.dlg.open && x.dlg.close());
});

export function sheet(title, build, { onClose } = {}) {
  const opener = document.activeElement;
  const openerKey = opener && opener.dataset ? opener.dataset.k : null;
  const headId = uid();
  const dlg = h("dialog.sheet", { "aria-labelledby": headId });
  const close = () => dlg.close();
  const body = h("div.sheet-body");
  // v7: a drag handle, a centred title and a close X (the empty pad keeps the title truly centred).
  const head = h("div.sheet-head",
    h("span.sheet-grab", { "aria-hidden": "true" }),
    h("span.sheet-pad", { "aria-hidden": "true" }),
    h("h2", { id: headId }, title),
    h("button.icon-btn", { type: "button", "data-k": "sheet-close", onclick: close }, h("span.vh", "Close"), closeIcon()));
  dlg.append(head, body);
  build(body, close);
  dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); });
  swipeToClose(dlg, head, close);
  const sid = `s${uid()}`;
  dlg.addEventListener("close", () => {
    const i = openSheets.findIndex((x) => x.id === sid);
    if (i >= 0) openSheets.splice(i, 1);
    if (history.state && history.state.npSheet === sid) history.back();
    dlg.remove();
    if (onClose) onClose();
    if (opener && opener.isConnected && opener.focus) opener.focus();
    else if (openerKey) { const el = document.querySelector(`[data-k="${CSS.escape(openerKey)}"]`); if (el) el.focus(); }
  });
  dlg.dataset.hash = location.hash;
  document.body.append(dlg);
  dlg.showModal();
  try { history.pushState({ npSheet: sid }, "", location.href); openSheets.push({ id: sid, dlg }); } catch { /* history unavailable: Back leaves the screen as before */ }
  const first = body.querySelector("[autofocus]") || body.querySelector("input:not([type=hidden]),select,textarea,button");
  if (first && first.hasAttribute("autofocus")) first.focus();
  return { dlg, close };
}
/** Pull the handle (or the title bar) down to dismiss, like any phone sheet. Taps on the X are left alone. */
function swipeToClose(dlg, head, close) {
  let y0 = null, dy = 0;
  head.addEventListener("pointerdown", (e) => {
    if ((e.button || 0) > 0 || e.target.closest("button")) return;
    y0 = e.clientY; dy = 0;
    try { head.setPointerCapture(e.pointerId); } catch { /* fine */ }
    dlg.style.transition = "none";
  });
  head.addEventListener("pointermove", (e) => {
    if (y0 === null) return;
    dy = Math.max(0, e.clientY - y0);
    dlg.style.transform = `translateY(${dy}px)`;
  });
  const end = () => {
    if (y0 === null) return;
    const go = dy > 90;
    y0 = null; dlg.style.transition = "";
    if (go) close(); else dlg.style.transform = "";
  };
  head.addEventListener("pointerup", end);
  head.addEventListener("pointercancel", end);
}
function closeIcon() {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true");
  s.innerHTML = '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none"/>';
  return s;
}

/** Ask a yes/no question in a small dialog. Resolves true or false. */
export function confirmBox(title, text, yes = "Yes", danger = false) {
  return new Promise((resolve) => {
    let answer = false;
    sheet(title, (body, close) => {
      body.append(
        h("p", text),
        h("div.row-btns",
          h("button.btn.btn-line", { type: "button", onclick: close }, "Cancel"),
          h(`button.btn.${danger ? "btn-danger" : "btn-blue"}`, { type: "button", onclick: () => { answer = true; close(); } }, yes)),
      );
    }, { onClose: () => resolve(answer) });
  });
}

// ---------- toast with Undo (v7: a pill with an icon) ----------
let toastTimer = 0;
const toastKind = (msg) => (/couldn'?t|can'?t|didn'?t|failed|error|not saved|try again/i.test(msg) ? "warn" : /^(undone|deleted)\b|\bdeleted\.?$/i.test(msg) ? "undo" : "ok");
const TOAST_KINDS = { ok: 1, warn: 1, undo: 1 }; // the glyph is drawn by CSS, so the toast text stays clean
/** toast(msg, [[label, fn], ...], { ms, icon }) — ms overrides how long it stays (default 4.5 s, or 8 s with buttons). icon: "ok" | "warn" | "undo". */
export function toast(msg, actions = [], { ms, icon } = {}) {
  const box = document.getElementById("toast");
  if (!box) return;
  clearTimeout(toastTimer);
  const hide = () => {
    // Don't pull the toast away from someone who is tabbing to Undo.
    if (box.contains(document.activeElement)) { toastTimer = setTimeout(hide, 4000); return; }
    box.classList.remove("show");
    box.replaceChildren();
  };
  const btns = actions.map(([label, fn]) => h(`button.toast-btn${label === "Undo" ? ".undo" : ""}`, { type: "button", "data-k": label === "Undo" ? "toast-undo" : undefined, onclick: () => {
    const t = document.getElementById("page-title"); // focus doesn't fall to the page body when the toast goes
    box.classList.remove("show"); box.replaceChildren(); clearTimeout(toastTimer);
    if (t) t.focus({ preventScroll: true });
    fn();
  } }, label));
  const kind = TOAST_KINDS[icon] ? icon : toastKind(String(msg));
  // Re-trigger the pop when a new toast replaces one that is still showing.
  box.classList.remove("show");
  void box.offsetWidth;
  box.replaceChildren(h(`span.toast-ic.${kind}`, { "aria-hidden": "true" }), h("p", msg), ...btns);
  box.classList.add("show");
  box.dataset.at = String(Date.now());
  toastTimer = setTimeout(hide, ms || (actions.length ? 8000 : 4500));
}

/** Hide the toast, unless it appeared less than `keepMs` ago (route changes call this). */
export function clearToast(keepMs = 0) {
  const box = document.getElementById("toast");
  if (!box || !box.classList.contains("show") || Date.now() - Number(box.dataset.at || 0) < keepMs) return;
  if (box.contains(document.activeElement)) return;
  clearTimeout(toastTimer);
  box.classList.remove("show");
  box.replaceChildren();
}

// ---------- photo: resize on the device and re-encode (drops EXIF, including location) ----------
export async function resizePhoto(file, max = 512) {
  if (!file || !file.type.startsWith("image/")) throw new Error("not-image");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * s)), hgt = Math.max(1, Math.round(img.naturalHeight * s));
    const c = Object.assign(document.createElement("canvas"), { width: w, height: hgt });
    const g = c.getContext("2d");
    g.fillStyle = "#fff"; g.fillRect(0, 0, w, hgt);
    g.drawImage(img, 0, 0, w, hgt);
    return c.toDataURL("image/jpeg", 0.85);
  } finally { URL.revokeObjectURL(url); }
}

// ---------- additions (v1.1) ----------

/** True unless the person asked their device for less motion. */
export function motionOK() {
  return !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
}
/** A tiny tap of haptic feedback where the phone supports it (Android). */
export function buzz(ms = 10) {
  try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(ms); } catch { /* not allowed */ }
}

/** Save text as a file through the browser's download. */
export function saveFile(filename, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Offer a file through the phone's share sheet (Save to Files, email, Drive...) when it can take files,
 * otherwise download it. Resolves "shared", "saved" or "cancelled".
 */
export async function shareOrSave(filename, text, type, title) {
  let file = null;
  try { file = new File([text], filename, { type }); } catch { file = null; }
  let can = false;
  try { can = !!(file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })); } catch { can = false; }
  if (can) {
    try { await navigator.share({ files: [file], title }); return "shared"; } catch (e) {
      if (e && e.name === "AbortError") return "cancelled";
      // Anything else (no user gesture left, share blocked): fall back to a download.
    }
  }
  saveFile(filename, text, type);
  return "saved";
}

/** Digits and + only, for a tel: link. Empty if there's nothing callable. */
export function telHref(phone) {
  const n = String(phone || "").replace(/[^\d+]/g, "");
  return n.replace(/\D/g, "").length >= 3 ? `tel:${n}` : "";
}
