// Nova's Pack: the pet care diary. Entry point: loads content and data, draws the screen for the
// current #/route, and redraws after every change. No framework, no build step, no network calls
// except loading the app's own files.

import { S, load, onChange, pet, setSetting } from "./state.js";
import { h, ago } from "./util.js";
import { today, poopLog, welcome } from "./views/today.js";
import { health, summary } from "./views/health.js";
import { food } from "./views/food.js";
import { training } from "./views/training.js";
import { more } from "./views/more.js";
import { avatar } from "./views/parts.js";
import { openPetSheet } from "./forms.js";

const ROUTES = { today, poop: poopLog, health, summary, food, training, more, welcome };
const TAB_OF = { today: "today", poop: "today", health: "health", summary: "health", food: "food", training: "training", more: "more" };
const TITLES = { today: "Today", poop: "Poop log", health: "Health", summary: "Vet summary", food: "Food", training: "Training", more: "More" };

const main = document.getElementById("main");
const switcher = document.getElementById("switcher");
const tabbar = document.getElementById("tabbar");

function route() {
  const [name, arg] = location.hash.replace(/^#\/?/, "").split("/").map((x) => decodeURIComponent(x || ""));
  return { name: ROUTES[name] ? name : "today", arg: arg || "" };
}

let lastRoute = "";
function draw() {
  let { name, arg } = route();
  if (!S.pets.length && name !== "welcome") { name = "welcome"; arg = ""; if (location.hash !== "#/welcome") history.replaceState(null, "", "#/welcome"); }
  if (S.pets.length && name === "welcome") { name = "today"; arg = ""; history.replaceState(null, "", "#/today"); }
  const key = `${name}/${arg}`;
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
    ROUTES[name](main, arg);
  } catch (err) {
    console.warn(err);
    main.replaceChildren(h("div.empty", h("h1", { tabindex: "-1", id: "page-title" }, "Something went wrong"), h("p", "Your data is safe on this device. Try going back to Today."), h("a.btn.btn-blue", { href: "#/today" }, "Today")));
  }
  if (name !== "welcome") document.title = `${TITLES[name] || "Today"}${pet() ? ` · ${pet().name}` : ""} · Nova's Pack`;

  if (navigated) {
    window.scrollTo(0, 0);
    const h1 = document.getElementById("page-title");
    if (h1 && started) h1.focus({ preventScroll: true });
  } else {
    window.scrollTo(0, y);
    const el = focusKey && main.querySelector(focusKey);
    if (el) el.focus({ preventScroll: true });
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
    switcher.append(h("button.pet-chip.add", { type: "button", onclick: () => openPetSheet() },
      h("span.avatar.av-add", { "aria-hidden": "true" }, "+"), h("span.pet-chip-name", "Add pet")));
  }
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
  if (name === "training" || name === "summary") location.hash = name === "summary" ? "#/health/vet" : "#/training";
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

window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); S.installPrompt = e; if (route().name === "more") draw(); });
window.addEventListener("appinstalled", () => { S.installPrompt = null; });

async function loadContent() {
  const [care, skills] = await Promise.all([
    import("../data/care.js").catch(() => ({})),
    import("../data/skills.js").catch(() => ({})),
  ]);
  const c = S.content;
  c.SKILLS = Array.isArray(skills.SKILLS) ? skills.SKILLS : [];
  c.VACCINES = care.VACCINES || {};
  c.PREVENTIVES = care.PREVENTIVES || {};
  c.POOP_SCALE = Array.isArray(care.POOP_SCALE) && care.POOP_SCALE.length ? care.POOP_SCALE : [1, 2, 3, 4, 5].map((n) => ({ score: n, emoji: "", label: ["Very hard", "Firm", "Ideal", "Soft", "Watery"][n - 1], hint: "" }));
  c.POOP_FLAGS = Array.isArray(care.POOP_FLAGS) ? care.POOP_FLAGS : [];
  c.RED_FLAGS = Array.isArray(care.RED_FLAGS) ? care.RED_FLAGS : [];
  c.VET_FIRST = typeof care.VET_FIRST === "string" ? care.VET_FIRST : "";
  c.SOURCES = Array.isArray(care.SOURCES) ? care.SOURCES : [];
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
  window.addEventListener("hashchange", draw);
  draw();
  started = true;
  document.body.classList.add("ready");
}
start();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
