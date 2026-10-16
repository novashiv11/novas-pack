// Nova's Pack: Level up together (with the pet care diary inside). Entry point: loads content and data, draws the
// screen for the current #/route, and redraws after every change. No framework, no build step, no network calls
// except loading the app's own files.

// install.js first: it sets up the install prompt listener and the update-hook queue before any view module runs.
import { doNow } from "./views/doitnow.js";
import { isStandalone } from "./install.js";
import { S, load, onChange, pet, setSetting, activePets } from "./state.js";
import { h, ago, toast, clearToast, motionOK } from "./util.js";
import { onQuotaError, QUOTA_MESSAGE, persist } from "./db.js";
import { welcome } from "./views/welcome.js";
import { home, statPills } from "./views/home.js";
import { dueItems } from "./logic.js";
import { health, summary } from "./views/health.js";
import { training } from "./views/training.js";
import { adventures } from "./views/adventures.js";
import { trainer } from "./views/trainer.js";
import { journal } from "./views/journal.js";
import { placement } from "./views/placement.js";
// The art studio (50 KB) loads the first time it's opened, not on the first visit; after that it draws straight away.
let studioMod = null;
function studio(main, ...args) {
  if (studioMod) { studioMod.studio(main, ...args); return; }
  main.append(h("p.boot", { role: "status" }, "Opening the art studio…"));
  import("./views/studio.js").then((m) => {
    studioMod = m;
    if (route().name === "studio") { draw(); const t = document.getElementById("page-title"); if (t) t.focus({ preventScroll: true }); }
  }).catch(() => {
    main.replaceChildren(h("div.empty", h("h1", { tabindex: "-1", id: "page-title" }, "Couldn't open the art studio"), h("p", "Check your connection, then try again."), h("a.btn.btn-blue", { href: "#/home" }, "Back to Home")));
  });
}
import { ready } from "./views/ready.js";
import { logSheet } from "./views/today.js";
import { more } from "./views/more.js";
import { avatar } from "./views/parts.js";
import { openPetSheet, eventSheet, medGivenSheet } from "./forms.js";

const ROUTES = { home, train: training, adventures, health, summary, more, trainer, journal, welcome, placement, studio, ready };
// Old v1 addresses (bookmarks, shortcuts) still land somewhere sensible.
const ALIASES = { today: ["home"], training: ["train"], poop: ["health", "poop"], food: ["health", "food"] };
const TAB_OF = { home: "home", trainer: "train", journal: "home", studio: "home", ready: "more", placement: "train", train: "train", adventures: "train", health: "health", summary: "health", more: "more" };
const TITLES = { home: "Home", train: "Train", adventures: "Adventures", health: "Health", summary: "Vet summary", more: "More", trainer: "Trainer", journal: "Growth Journal", placement: "Level check", studio: "Art studio", ready: "Get ready" };
const HEALTH_QUICK = ["poop", "meal", "treat", "med", "weight", "vet", "symptom"];

const main = document.getElementById("main");
const switcher = document.getElementById("switcher");
const appbar = document.querySelector(".appbar");
const tabbar = document.getElementById("tabbar");
// The "+" button: every log type in one sheet, from any main screen (v6).
const fab = h("button.fab", { type: "button", "data-k": "fab", "aria-label": "Log something", hidden: true, onclick: () => logSheet(pet()) }, h("span", { "aria-hidden": "true" }, "+"));
document.body.append(fab);
// v9.1: the "+" tucks away while you scroll down (so it never sits on a row's own button) and comes back on scroll up.
let lastY = 0;
addEventListener("scroll", () => {
  const y = window.scrollY, down = y > lastY + 6, up = y < lastY - 6;
  if (down && y > 80) fab.classList.add("tuck");
  else if (up || y < 40) fab.classList.remove("tuck");
  if (down || up) lastY = y;
}, { passive: true });

function route() {
  let [name, arg, sub] = location.hash.replace(/^#\/?/, "").split("/").map((x) => { try { return decodeURIComponent(x || ""); } catch { return ""; } });
  if (ALIASES[name]) [name, arg] = [ALIASES[name][0], ALIASES[name][1] || arg];
  return { name: ROUTES[name] ? name : "home", arg: arg || "", sub: sub || "", raw: name || "" };
}

// #/quick/<type> (Home Screen shortcuts): show Today, then open that quick log once.
const QUICK = ["poop", "meal", "treat", "med", "walk", "training", "weight", "vet", "symptom"];
let pendingQuick = "", pendingNow = false;
function openQuick(type) {
  if (!pet()) return;
  if (typeof window.NP_openQuickLog === "function") { window.NP_openQuickLog(type); return; }
  if (type === "med") medGivenSheet();
  else if (type !== "symptom") eventSheet(type);
}

// Care diary only (More): game screens opened from an old link say so, with one tap to switch the game back on.
const GAME_ROUTES = ["train", "adventures", "placement", "trainer", "studio", "journal"];
function gameOff(main) {
  main.append(h("div.empty",
    h("h1", { tabindex: "-1", id: "page-title" }, "Care diary only is on"),
    h("p", "Training, levels and adventures are hidden. Everything you logged still counts if you switch back."),
    h("div.row-btns",
      h("a.btn.btn-blue", { href: "#/home" }, "Back to Home"),
      h("button.btn.btn-line", { type: "button", "data-k": "game-on", onclick: async () => { await setSetting("careOnly", false, { quiet: false }); toast("The game is back."); } }, "Show the game"))));
}

let lastRoute = "";
function draw() {
  let { name, arg, sub, raw } = route();
  if (raw === "now") { pendingNow = true; name = "home"; arg = ""; history.replaceState(null, "", "#/home"); }
  if (raw === "quick") {
    pendingQuick = QUICK.includes(arg) ? arg : "";
    name = HEALTH_QUICK.includes(arg) ? "health" : "home"; arg = "";
    history.replaceState(null, "", `#/${name}`);
  }
  if (!activePets().length && name !== "welcome" && name !== "ready") { pendingQuick = ""; name = "welcome"; arg = ""; if (location.hash !== "#/welcome") history.replaceState(null, "", "#/welcome"); }
  if (activePets().length && name === "welcome" && arg !== "add") { name = "home"; arg = ""; history.replaceState(null, "", "#/home"); }
  const key = `${name}/${arg}/${sub}`;
  const navigated = key !== lastRoute;
  lastRoute = key;

  // Remember focus so a redraw after a save doesn't throw keyboard users back to the top.
  const act = document.activeElement;
  const focusKey = act && main.contains(act) ? (act.dataset.k ? `[data-k="${CSS.escape(act.dataset.k)}"]` : act.id ? `#${CSS.escape(act.id)}` : null) : null;
  const y = window.scrollY;

  // v8: moving between screens feels like an app. Another tab cross-fades; deeper screens slide in from the right,
  // and going back slides them out. No motion when the phone asks for less, or when the browser can't do it.
  const depth = [arg, sub].filter(Boolean).length;
  const dir = !navigated || !started ? "" : depth > lastNav.depth ? "fwd" : depth < lastNav.depth && name === lastNav.name ? "back" : "tab";
  lastNav = { name, depth };
  const paint = () => paintRoute(name, arg, sub, navigated, focusKey, y);
  if (dir && document.startViewTransition && motionOK()) {
    document.documentElement.dataset.nav = dir;
    try { document.startViewTransition(paint); } catch { paint(); }
  } else paint();
}
let lastNav = { name: "", depth: 0 };

function paintRoute(name, arg, sub, navigated, focusKey, y) {
  document.body.classList.toggle("first-run", name === "welcome");
  drawChrome(name);
  main.replaceChildren();
  try {
    if (S.settings.careOnly && GAME_ROUTES.includes(name)) gameOff(main);
    else ROUTES[name](main, arg, sub);
  } catch (err) {
    console.warn(err);
    main.replaceChildren(h("div.empty", h("h1", { tabindex: "-1", id: "page-title" }, "Something went wrong"), h("p", "Your data is safe on this device. Try going back to Home."), h("a.btn.btn-blue", { href: "#/home" }, "Home")));
  }
  if (name !== "welcome") document.title = `${TITLES[name] || "Home"}${pet() ? ` · ${pet().name}` : ""} · Nova's Pack`;

  if (navigated) {
    window.scrollTo(0, 0);
    const h1 = document.getElementById("page-title");
    if (h1 && started) h1.focus({ preventScroll: true });
  } else {
    window.scrollTo(0, y);
    const el = focusKey && main.querySelector(focusKey);
    if (el) el.focus({ preventScroll: true });
  }
  if (pendingNow && pet()) { pendingNow = false; setTimeout(() => { try { doNow(pet()); } catch (err) { console.warn(err); } }, 0); }
  if (pendingQuick) {
    const t = pendingQuick;
    pendingQuick = "";
    setTimeout(() => { try { openQuick(t); } catch (err) { console.warn(err); } }, 0);
  }
}

// v7 top bar (Duolingo-style): the pet chip(s) on the left, honest stat pills on the right (days this week, level,
// stickers; each opens a small sheet that explains it). It shows on every main screen, so the numbers are always there.
const statsBox = h("div.stat-pills", { id: "stats", role: "group", "aria-label": "Your numbers" });
appbar.querySelector(".appbar-in").append(statsBox);

// With many pets the row scrolls sideways: a soft fade on the side that has more shows there's more to see.
function switcherFade() {
  const more = switcher.scrollWidth - switcher.clientWidth > 2;
  switcher.classList.toggle("fade-l", more && switcher.scrollLeft > 2);
  switcher.classList.toggle("fade-r", more && switcher.scrollLeft < switcher.scrollWidth - switcher.clientWidth - 2);
}
switcher.addEventListener("scroll", switcherFade, { passive: true });
addEventListener("resize", switcherFade, { passive: true });

function drawChrome(name) {
  const p = pet();
  // pet switcher: the current pet is a named chip, the others are avatar bubbles (names stay for screen readers)
  switcher.replaceChildren();
  const pets = activePets();
  if (name !== "welcome" && p) {
    for (const x of pets) {
      const on = x.id === p.id;
      switcher.append(h("button.pet-chip", { type: "button", "aria-pressed": String(on), onclick: () => switchTo(x.id) },
        avatar(x, 32), h("span.pet-chip-name", x.name), x.sample ? h("span.sample-dot", "SAMPLE") : null));
    }
    if (!S.settings.addBarHidden || pets.length > 1) {
      switcher.append(h("button.pet-chip.add", { type: "button", "data-k": "bar-add-pet", onclick: () => openPetSheet() },
        h("span.avatar.av-add", { "aria-hidden": "true" }, "+"), h("span.pet-chip-name", "Add pet")));
    }
  }
  const show = name !== "welcome" && !!p;
  statsBox.replaceChildren();
  if (show) { try { statPills(p).forEach((el) => statsBox.append(el)); } catch (err) { console.warn(err); } }
  statsBox.hidden = !statsBox.childElementCount;
  appbar.classList.toggle("show", show);
  switcher.classList.toggle("multi", pets.length > 1);
  if (show) { // with a few pets the row scrolls: keep the current pet in view
    const on = switcher.querySelector('.pet-chip[aria-pressed="true"]');
    if (on && switcher.scrollWidth > switcher.clientWidth) {
      if (on.offsetLeft + on.offsetWidth > switcher.scrollLeft + switcher.clientWidth) switcher.scrollLeft = on.offsetLeft + on.offsetWidth - switcher.clientWidth + 8;
      if (on.offsetLeft < switcher.scrollLeft) switcher.scrollLeft = Math.max(0, on.offsetLeft - 8);
    }
  }
  switcherFade();
  // bottom nav
  const tab = TAB_OF[name];
  tabbar.hidden = name === "welcome" || !pets.length;
  document.body.classList.toggle("care-only", !!S.settings.careOnly);
  const onSkillPage = name === "train" && /^#\/train\/[^/]+/.test(location.hash); // the skill page has its own big Start button
  fab.hidden = !p || !["home", "train", "health", "adventures"].includes(name) || onSkillPage;
  document.body.classList.toggle("has-fab", !fab.hidden);
  // A small dot on Health when something real is due or overdue for this pet.
  let due = false;
  try { due = !!p && dueItems(p.id).some((it) => !(it.kind === "record" && it.st.state === "soon")); } catch { due = false; }
  tabbar.querySelectorAll("a").forEach((a) => {
    if (a.dataset.tab === tab) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    const dot = a.dataset.tab === "health" && due;
    a.classList.toggle("has-dot", dot);
    if (dot) a.setAttribute("aria-label", "Health, something is due"); else a.removeAttribute("aria-label");
  });
}

async function switchTo(id) {
  await setSetting("currentPet", id);
  const { name } = route();
  // Skill pages and the summary are per pet, so go back to the list view of the same tab.
  if (name === "train" || name === "summary") history.replaceState(null, "", name === "summary" ? "#/health/vet" : "#/train");
  draw();
  const btn = [...switcher.querySelectorAll(".pet-chip")].find((b) => b.getAttribute("aria-pressed") === "true");
  if (btn) btn.focus();
}

// "4 h ago" labels tick over without redrawing the page.
setInterval(() => {
  document.querySelectorAll("[data-ago]").forEach((el) => { el.textContent = ago(Number(el.dataset.ago)); });
}, 60000);
// A new day (or coming back to the app) should show fresh "due" and "today" lists.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && !document.querySelector("dialog[open]")) draw();
});

// The install prompt (beforeinstallprompt, appinstalled) is handled in install.js, which redraws the current view.

// "Phone storage is full": explain it whoever made the save (after any generic "Couldn't save" message).
let quotaTimer = 0;
onQuotaError(() => { clearTimeout(quotaTimer); quotaTimer = setTimeout(() => toast(QUOTA_MESSAGE), 60); });

async function loadContent() {
  const [care, skills, adv, academy] = await Promise.all([
    import("../data/care.js").catch(() => ({})),
    import("../data/skills.js").catch(() => ({})),
    import("../data/adventures.js").catch(() => ({})),
    import("../data/academy.js").catch(() => ({})),
  ]);
  const c = S.content;
  c.SKILLS = Array.isArray(skills.SKILLS) ? skills.SKILLS : [];
  c.STAMPS = Array.isArray(adv.STAMPS) ? adv.STAMPS : [];
  c.STAMP_SETS = Array.isArray(adv.SETS) ? adv.SETS : [];
  c.LESSONS = Array.isArray(academy.LESSONS) ? academy.LESSONS : [];
  c.GO_PRO = Array.isArray(academy.GO_PRO) ? academy.GO_PRO : [];
  c.VACCINES = care.VACCINES || {};
  c.PREVENTIVES = care.PREVENTIVES || {};
  c.POOP_SCALE = Array.isArray(care.POOP_SCALE) && care.POOP_SCALE.length ? care.POOP_SCALE : [1, 2, 3, 4, 5].map((n) => ({ score: n, emoji: "", label: ["Very hard", "Firm", "Ideal", "Soft", "Watery"][n - 1], hint: "" }));
  c.POOP_SCALE_RABBIT = Array.isArray(care.POOP_SCALE_RABBIT) && care.POOP_SCALE_RABBIT.length ? care.POOP_SCALE_RABBIT : c.POOP_SCALE;
  c.POOP_SCALE_NAME = typeof care.POOP_SCALE_NAME === "string" ? care.POOP_SCALE_NAME : "";
  c.POOP_HINTS = care.POOP_HINTS && typeof care.POOP_HINTS === "object" ? care.POOP_HINTS : {};
  c.POOP_FLAGS = Array.isArray(care.POOP_FLAGS) ? care.POOP_FLAGS : [];
  c.RED_FLAGS = Array.isArray(care.RED_FLAGS) ? care.RED_FLAGS : [];
  c.VET_FIRST = typeof care.VET_FIRST === "string" ? care.VET_FIRST : "";
  c.SOURCES = Array.isArray(care.SOURCES) ? care.SOURCES : [];
  c.TOXINS = Array.isArray(care.TOXINS) ? care.TOXINS : [];
  c.CARE_TASKS = care.CARE_TASKS && typeof care.CARE_TASKS === "object" ? care.CARE_TASKS : {};
}

let started = false;
async function start() {
  try {
    await Promise.all([loadContent(), load()]);
  } catch {
    main.replaceChildren(h("div.empty",
      h("h1", "This browser can't save the diary"),
      h("p", "Nova's Pack keeps everything on your device, and this browser is blocking that (private browsing does this). Open the app in a normal tab or another browser.")));
    tabbar.hidden = true;
    return;
  }
  if (S.settings.currentPet && !activePets().some((p) => p.id === S.settings.currentPet)) S.settings.currentPet = activePets()[0] ? activePets()[0].id : null;
  onChange(draw);
  window.addEventListener("hashchange", () => {
    // A sheet belongs to the screen it was opened on: Back (or any route change) closes it.
    document.querySelectorAll("dialog.sheet[open]").forEach((d) => { if (d.dataset.hash !== location.hash) d.close(); });
    clearToast(1500); // a toast belongs to its screen too (one made just now, e.g. "Saved" before a jump, stays)
    draw();
  });
  draw();
  started = true;
  document.body.classList.add("ready");
  if (isStandalone()) persist();
}
start();

// ---------- updates ----------
// A new version installs in the background and waits. B's toast (or the fallback below) offers "Update", which
// tells the waiting service worker to take over; the page reloads when it does.
let waitingWorker = null, applying = false;
const updateFns = [];
function applyUpdate() {
  if (!waitingWorker) { location.reload(); return; }
  applying = true;
  waitingWorker.postMessage({ type: "SKIP_WAITING" });
}
const callUpdate = (fn) => { try { fn(applyUpdate); } catch (err) { console.warn(err); } };
function updateReady(w) {
  if (waitingWorker === w) return;
  waitingWorker = w;
  if (updateFns.length) updateFns.forEach(callUpdate);
  else toast("A new version of Nova's Pack is ready.", [["Update", applyUpdate]]);
}
const queuedUpdateFns = (window.NP_onUpdateReady && window.NP_onUpdateReady.queue) || [];
/** Shared contract: window.NP_onUpdateReady(fn) calls fn(apply) when an update is ready; apply() installs it and reloads. */
window.NP_onUpdateReady = (fn) => {
  if (typeof fn !== "function" || updateFns.includes(fn)) return;
  updateFns.push(fn);
  if (waitingWorker) callUpdate(fn);
};
queuedUpdateFns.forEach((fn) => window.NP_onUpdateReady(fn));

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  const sw = navigator.serviceWorker;
  const hadController = !!sw.controller; // the very first install takes control without a reload
  let reloading = false;
  sw.addEventListener("controllerchange", () => {
    if (reloading || !(hadController || applying)) return;
    // Updated from another tab: don't throw away a half-filled form here, reload when the page is next hidden.
    if (!applying && document.querySelector("dialog[open]")) {
      document.addEventListener("visibilitychange", () => { if (!reloading) { reloading = true; location.reload(); } }, { once: true });
      return;
    }
    reloading = true;
    location.reload();
  });
  window.addEventListener("load", () => {
    sw.register("sw.js").then((reg) => {
      const watch = (w) => {
        if (!w) return;
        const check = () => {
          if (w.state === "installed" && sw.controller) updateReady(w);
          else if (w.state === "redundant" && waitingWorker === w) waitingWorker = null;
        };
        check();
        w.addEventListener("statechange", check);
      };
      watch(reg.waiting);
      watch(reg.installing);
      reg.addEventListener("updatefound", () => watch(reg.installing));
      // An installed app can stay open for days: look for a new version when it comes back to the front (at most hourly).
      let checked = Date.now();
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && Date.now() - checked > 3600000) { checked = Date.now(); reg.update().catch(() => {}); }
      });
    }).catch(() => {});
  });
}
