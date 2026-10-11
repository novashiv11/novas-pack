// Nova's Pack: getting the app onto the Home Screen, and out of in-app browsers (Instagram, TikTok…),
// which can't keep the diary. Everything here fails quietly: on desktop or an unknown browser it shows nothing.
//
//   installCard()  an element (one-tap install, or the iPhone steps) or null
//   inAppBanner()  an element ("Open in Chrome" / "Copy link") or null
//   isStandalone() true when running as the installed app

import { S, setSetting, refresh } from "./state.js";
import { h, sheet, toast, DAY } from "./util.js";
import { persist } from "./db.js";

const SNOOZE = 14 * DAY;
const COPY = "Install first: the in-app browser can't keep your diary.";

const ua = () => { try { return navigator.userAgent || ""; } catch { return ""; } };

export function isStandalone() {
  try {
    return matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: fullscreen)").matches ||
      navigator.standalone === true || document.referrer.startsWith("android-app://");
  } catch { return false; }
}
function isIOS() {
  try { return /iPhone|iPad|iPod/.test(ua()) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); } catch { return false; }
}
const isAndroid = () => /Android/.test(ua());

/** Which in-app browser this is: "instagram" | "facebook" | "tiktok" | "snapchat" | "other" | null. */
export function inAppKind() {
  const u = ua();
  if (/Instagram/.test(u)) return "instagram";
  if (/FBAN|FBAV|FB_IAB|FBIOS/.test(u)) return "facebook";
  if (/musical_ly|BytedanceWebview|TikTok|trill_/i.test(u)) return "tiktok";
  if (/Snapchat/.test(u)) return "snapchat";
  if (/LinkedInApp|Pinterest|Line\//.test(u) || (isAndroid() && /; wv\)/.test(u))) return "other";
  return null;
}

// app.js owns window.NP_onUpdateReady, but view modules load before app.js runs: queue early callers until then.
try {
  if (typeof window.NP_onUpdateReady !== "function") {
    const queue = [];
    window.NP_onUpdateReady = (fn) => { queue.push(fn); };
    window.NP_onUpdateReady.queue = queue;
  }
} catch { /* not a browser */ }

// ---------- Chromium's one-tap install ----------
// Keep the browser's prompt for our own button, and redraw whatever screen is showing so the button appears.
try {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); S.installPrompt = e; refresh(); });
  window.addEventListener("appinstalled", () => { S.installPrompt = null; persist(); refresh(); });
} catch { /* not a browser */ }

async function promptInstall() {
  const ev = S.installPrompt;
  S.installPrompt = null;
  if (!ev) return;
  try {
    ev.prompt();
    const choice = await ev.userChoice;
    if (choice && choice.outcome === "accepted") toast("Installed. Nova's on your Home Screen now.");
  } catch { /* the browser said no */ }
  refresh();
}

// ---------- the install card ----------

/** The install card for Today and More, or null (already installed, snoozed, in-app, or no way to install here). */
export function installCard() {
  try {
    if (isStandalone() || inAppKind()) return null;
    if (Date.now() - (Number(S.settings.installSnooze) || 0) < SNOOZE) return null;
    const notNow = h("button.btn.btn-line.sm", { type: "button", onclick: () => setSetting("installSnooze", Date.now(), { quiet: false }) }, "Not now");
    const card = (text, action) => h("aside.nudge.install-card", { "aria-labelledby": "install-card-h" },
      h("p", h("b", { id: "install-card-h" }, "Install Nova's Pack."), " ", text),
      h("div.row-btns.left", action, notNow));

    if (S.installPrompt) {
      return card("One tap, and your diary opens like an app and stays put.",
        h("button.btn.btn-blue.sm", { type: "button", onclick: promptInstall }, "Install"));
    }
    if (isIOS()) {
      return card("Two taps, and your diary opens like an app and stays put.",
        h("button.btn.btn-blue.sm", { type: "button", onclick: iosSheet }, "Show me how"));
    }
    if (isAndroid()) {
      return card("In Chrome, tap ⋮ (top right), scroll down and tap \"Install app\" or \"Install and create shortcut\" (older phones: \"Add to Home screen\"). It then opens like any app.", null);
    }
    return null;
  } catch { return null; }
}

function shareIcon() {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.setAttribute("width", "28"); s.setAttribute("height", "28");
  s.innerHTML = '<path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 10H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
  return s;
}
function addIcon() {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.setAttribute("width", "28"); s.setAttribute("height", "28");
  s.innerHTML = '<rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 8.5v7M8.5 12h7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
  return s;
}

/** The iPhone and iPad steps: Share, then "Add to Home Screen". */
export function iosSheet() {
  try {
    sheet("Add Nova's Pack to your Home Screen", (body, close) => {
      body.append(
        h("ol.ios-steps",
          h("li", h("span.ios-ico", shareIcon()), h("div",
            h("b", "Tap Share"),
            h("p.small.muted", "In Safari it's in the bar at the bottom (on iOS 26, tap ⋯ first). In Chrome it's at the top."))),
          h("li", h("span.ios-ico", addIcon()), h("div",
            h("b", "Tap \"Add to Home Screen\", then Add"),
            h("p.small.muted", "Scroll down the list if you don't see it.")))),
        h("p.small", "On iOS 26 and later it opens as its own app (leave \"Open as Web App\" on). Your diary stays on this phone."),
        h("button.btn.btn-blue.wide", { type: "button", onclick: close }, "Got it"),
        h("div.ios-arrow", { "aria-hidden": "true" }, "↓"),
      );
    });
  } catch { /* no dialog support */ }
}

// ---------- in-app browsers ----------

function appUrl() {
  try { return location.origin + location.pathname + location.search; } catch { return ""; }
}

async function copyLink(status) {
  const url = appUrl();
  let ok = false;
  try { await navigator.clipboard.writeText(url); ok = true; } catch { /* blocked in many in-app browsers */ }
  if (!ok) {
    try {
      const t = h("textarea", { readonly: true, style: { position: "fixed", top: "0", left: "0", opacity: "0" } });
      t.value = url;
      document.body.append(t); t.select(); t.setSelectionRange(0, url.length);
      ok = document.execCommand("copy");
      t.remove();
    } catch { ok = false; }
  }
  status.replaceChildren(ok
    ? "Link copied. Open Safari, tap the address bar and paste it."
    : h("span", "Copy this link and open it in Safari: ", h("input.inapp-url", { type: "text", readonly: true, value: url, "aria-label": "App link", onfocus: (e) => e.target.select() })));
}

/** A banner for Instagram, Facebook, TikTok, Snapchat and other in-app browsers, or null. */
export function inAppBanner() {
  try {
    const kind = inAppKind();
    if (!kind || isStandalone()) return null;
    const status = h("p.small", { role: "status" });
    const actions = [];
    const tips = [];
    if (isAndroid()) {
      const target = appUrl().replace(/^https?:\/\//, "");
      actions.push(h("a.btn.btn-blue.sm", { href: `intent://${target}#Intent;scheme=https;package=com.android.chrome;end` }, "Open in Chrome"));
    }
    actions.push(h(`button.btn.${actions.length ? "btn-line" : "btn-blue"}.sm`, { type: "button", onclick: () => copyLink(status) }, "Copy link"));
    if (isIOS()) tips.push("Then open it in Safari.");
    if (kind === "tiktok") tips.push("Or tap ⋯ → Open in browser.");
    else if (kind === "instagram" || kind === "facebook") tips.push(isIOS() ? "Or tap ⋯ (top right) → Open in external browser." : "Or tap ⋮ (top right) → Open in Chrome.");
    return h("aside.nudge.inapp-banner", { "aria-labelledby": "inapp-h" },
      h("p", h("b", { id: "inapp-h" }, COPY)),
      h("div.row-btns.left", actions),
      tips.length ? h("p.small", tips.join(" ")) : null,
      status);
  } catch { return null; }
}
