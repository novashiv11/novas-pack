// Nova's Pack: Level up together (with the pet care diary inside). Entry point: loads content and data, draws the
// screen for the current #/route, and redraws after every change. No framework, no build step, no network calls
// except loading the app's own files.

// install.js first: it sets up the install prompt listener and the update-hook queue before any view module runs.
import { isStandalone } from "./install.js";
import { S, load, onChange, pet, setSetting } from "./state.js";
import { h, ago, toast } from "./util.js";
import { onQuotaError, QUOTA_MESSAGE, persist } from "./db.js";
import { welcome } from "./views/welcome.js";
import { home } from "./views/home.js";
import { health, summary } from "./views/health.js";
import { training } from "./views/training.js";
import { adventures } from "./views/adventures.js";
import { trainer } from "./views/trainer.js";
import { journal } from "./views/journal.js";
import { more } from "./views/more.js";
import { avatar } from "./views/parts.js";
import { openPetSheet, eventSheet, medGivenSheet } from "./forms.js";

const ROUTES = { home, train: training, adventures, health, summary, more, trainer, journal, welcome };
// Old v1 addresses (bookmarks, shortcuts) still land somewhere sensible.
const ALIASES = { today: ["home"], training: ["train"], poop: ["health", "poop"], food: ["health", "food"] };
const TAB_OF = { home: "home", trainer: "home", journal: "home", train: "train", adventures: "adventures", health: "health", summary: "health", more: "more" };
const TITLES = { home: "Home", train: "Train", adventures: "Adventures", health: "Health", summary: "Vet summary", more: "More", trainer: "Trainer", journal: "Growth Journal" };
const HEALTH_QUICK = ["poop", "meal", "treat", "med", "weight", "vet", "symptom"];

const main = document.getElementById("main");
const switcher = document.getElementById("switcher");
const appbar = document.querySelector(".appbar");
const tabbar = document.getElementById("tabbar");

function route() {
  let [name, arg, sub] = location.hash.replace(/^#\/?/, "").split("/").map((x) => { try { return decodeURIComponent(x || ""); } catch { return ""; } });
  if (ALIASES[name]) [name, arg] = [ALIASES[name][0], ALIASES[name][1] || arg];
  return { name: ROUTES[name] ? name : "home", arg: arg || "", sub: sub || "", raw: name || "" };
}

// #/quick/<type> (Home Screen shortcuts): show Today, then open that quick log once.
const QUICK = ["poop", "meal", "treat", "med", "walk", "training", "weight", "vet", "symptom"];
let pendingQuick = "";
function openQuick(type) {
  if (!pet()) return;
  if (typeof window.NP_openQuickLog === "function") { window.NP_openQuickLog(type); return; }
  if (type === "med") medGivenSheet();
  else if (type !== "symptom") eventSheet(type);
}

let lastRoute = "";
function draw() {
  let { name, arg, sub, raw } = route();
  if (raw === "quick") {
    pendingQuick = QUICK.includes(arg) ? arg : "";
    name = HEALTH_QUICK.includes(arg) ? "health" : "home"; arg = "";
    history.replaceState(null, "", `#/${name}`);
  }
  if (!S.pets.length && name !== "welcome") { pendingQuick = ""; name = "welcome"; arg = ""; if (location.hash !== "#/welcome") history.replaceState(null, "", "#/welcome"); }
  if (S.pets.length && name === "welcome") { name = "home"; arg = ""; history.replaceState(null, "", "#/home"); }
  const key = `${name}/${arg}/${sub}`;
  const navigated = key !== lastRoute;
  lastRoute = key;

  // Remember focus so a redraw after a save doesn't throw keyboard users back to the top.
  const act = document.activeElement;
  const focusKey = act && main.contains(act) ? (act.dataset.k ? `[data-k="${CSS.escape(act.dataset.k)}"]` : act.id ? `#${CSS.escape(act.id)}` : null) : null;
  const y = window.scrollY;

  document.body.classList.toggle("first-run", name === "welcome");
  drawChrome(name);
  main.replaceChildren();
  try {
    ROUTES[name](main, arg, sub);
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
  if (pendingQuick) {
    const t = pendingQuick;
    pendingQuick = "";
    setTimeout(() => { try { openQuick(t); } catch (err) { console.warn(err); } }, 0);
  }
}

function drawChrome(name) {
  const p = pet();
  // pet switcher
  switcher.replaceChildren();
  if (name !== "welcome" && p) {
    for (const x of S.pets) {
      const on = x.id === p.id;
      switcher.append(h("button.pet-chip", { type: "button", "aria-pressed": String(on), onclick: () => switchTo(x.id) },
        avatar(x, 32), h("span.pet-chip-name", x.name), x.sample ? h("span.sample-dot", "SAMPLE") : null));
    }
    switcher.append(h("button.pet-chip.add", { type: "button", "data-k": "bar-add-pet", onclick: () => openPetSheet() },
      h("span.avatar.av-add", { "aria-hidden": "true" }, "+"), h("span.pet-chip-name", "Add pet")));
  }
  // The bar shows with 2+ pets (to switch). With one real pet it shows until "Hide" (Add pet stays in More → Pets).
  const real = S.pets.filter((x) => !x.sample).length;
  const show = name !== "welcome" && !!p && (S.pets.length > 1 || (real === 1 && !S.settings.addBarHidden));
  if (show && S.pets.length === 1) {
    switcher.append(h("button.pet-chip.bar-hide", { type: "button", "data-k": "bar-hide", onclick: async () => {
      await setSetting("addBarHidden", true);
      drawChrome(name);
      toast("Hidden. Add a pet any time in More → Pets.");
    } }, h("span.vh", "Hide this bar"), h("span", { "aria-hidden": "true" }, "×")));
  }
  appbar.classList.toggle("show", show);
  // bottom nav
  const tab = TAB_OF[name];
  tabbar.hidden = name === "welcome";
  tabbar.querySelectorAll("a").forEach((a) => {
    if (a.dataset.tab === tab) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
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
  if (S.settings.currentPet && !S.pets.some((p) => p.id === S.settings.currentPet)) S.settings.currentPet = S.pets[0] ? S.pets[0].id : null;
  onChange(draw);
  window.addEventListener("hashchange", () => {
    // A sheet belongs to the screen it was opened on: Back (or any route change) closes it.
    document.querySelectorAll("dialog.sheet[open]").forEach((d) => { if (d.dataset.hash !== location.hash) d.close(); });
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
