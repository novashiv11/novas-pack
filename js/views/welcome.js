// First run (pick your partner, straight to Home with a quest), plus the app-shell hooks that used to live with
// Today: window.NP_openQuickLog for #/quick/<type>, the "Update ready" toast, the in-app browser banner and the
// route cross-fade.

import { quizSkills } from "./placement.js";
import { S, pet, refresh, UI, setSetting } from "../state.js";
import { h, put, em, toast, motionOK } from "../util.js";
import { eventSheet, unwellSheet, logPoop, logMeal, logEggs, logTreat, logWalk, logMed, petForm, field, textIn } from "../forms.js";
import { subBar, NOVA } from "./parts.js";
import { importForm } from "./more.js";
import { inAppBanner, installCard } from "../install.js";
import { trainingPicker, confetti } from "./gameui.js";
import { scene } from "../scenes.js";
import { SCENES } from "../../data/scenes.js";

function welcomeInstall() {
  try { const c = installCard(); return c ? h("div.welcome-install", c) : null; } catch { return null; }
}

export function welcome(main, arg) {
  document.title = "Nova's Pack · Tiny daily wins with your pet";
  if (arg === "add") {
    const name = textIn({ maxlength: "40", value: S.settings.trainerName || "", placeholder: "e.g. Shiv", autocomplete: "given-name" });
    const extra = S.settings.trainerName ? null : field(h("span", "And you are?", h("span.opt", " (optional)")), name, "So Nova can say hi. Stays on this device.");
    put(main,
      subBar("Pick your partner", "#/welcome", "Back"),
      h("p.add-lede", "Who's in your family? Only the name is needed. Free, no account."));
    petForm(main, null, async (row) => {
      if (extra && name.value.trim()) await setSetting("trainerName", name.value.trim().slice(0, 40)).catch(() => {});
      if (quizSkills(row).length) {
        toast(`${row.name} is your partner. One quick question round first.`);
        location.hash = "#/placement";
      } else {
        toast(`${row.name} is your partner. Here's today's quest.`);
        location.hash = "#/home";
      }
    }, { extra, submitLabel: "Start levelling up" });
    return;
  }
  const nova = h("button.welcome-hero", { type: "button", "data-k": "wel-nova", "aria-label": "High-five Nova" },
    h("span.wh-rays", { "aria-hidden": "true" }),
    h("img.disc.welcome-nova", { src: NOVA, alt: "", width: "120", height: "120" }),
    h("span.wh-medal", { "aria-hidden": "true" }, "LEVEL", h("b", "UP!")),
    h("span.wh-pop", { "aria-hidden": "true" }, "+10 XP"));
  let fives = 0;
  nova.addEventListener("click", () => {
    fives++;
    nova.classList.remove("hi"); void nova.offsetWidth; nova.classList.add("hi");
    if (motionOK()) confetti();
    hint.textContent = fives === 1 ? "That's how a win feels. Real XP comes from real minutes with your pet." : fives < 5 ? "Again? I like you already." : "Okay, okay. Go add your pet. 🐾";
  });
  const hint = h("p.small.muted.wh-hint", { "aria-live": "polite" }, "Tap me. Go on.");
  const how = [
    ["1", "Do 1 minute", SCENES.sit && SCENES.sit[2]],
    ["2", "Level up", SCENES.recall && SCENES.recall[3]],
    ["3", "Share the win", SCENES.stay && SCENES.stay[3]],
  ];
  put(main, h("section.welcome",
    nova, hint,
    h("p.eyebrow", "Nova's Pack · Do it for them"),
    h("h1", { tabindex: "-1", id: "page-title" }, "Tiny daily wins. For you and your pet."),
    h("p.lede", "Free. Private on your phone. No account."),
    h("div.welcome-ctas",
      h("a.btn.btn-blue.wide", { href: "#/welcome/add", "data-k": "wel-add" }, "Add my pet"),
      h("a.btn.btn-line.wide", { href: "#/ready", "data-k": "wel-ready" }, "No pet yet? Get ready")),
    welcomeInstall(),
    h("ol.welcome-how", { "aria-label": "How it works" }, how.map(([n, t, sp]) => h("li",
      sp ? h("figure.wh-pic", scene(sp)) : null, h("span.wh-n", { "aria-hidden": "true" }, n), h("b", t)))),
    h("ul.welcome-grid",
      h("li.wg-blue", em("🎓"), h("span", "20 skills, kid-simple")),
      h("li.wg-gold", em("🏆"), h("span", "Badges and trophies")),
      h("li.wg-tan", em("🩺"), h("span", "Care diary + vet summary")),
      h("li.wg-pink", em("🐾"), h("span", "Dogs, cats, rabbits, hens…"))),
    h("details.more-box.restore", h("summary", "Have a backup? Restore it"), importForm("replace")),
    h("p.small.muted", "Everything stays on this device. ", h("a", { href: "privacy.html" }, "Privacy notice"), " · ", h("a", { href: "card.html" }, "Pack Card maker"))));
}

// ---------- app-shell hooks ----------

/** #/quick/<type> (home-screen shortcuts) lands here, after app.js has drawn the screen. */
const QUICK = { poop: logPoop, meal: logMeal, treat: logTreat, walk: logWalk, med: logMed, medicine: logMed, eggs: logEggs,
  training: () => trainingPicker(pet()), unwell: () => unwellSheet(), symptom: () => unwellSheet(), weight: () => eventSheet("weight"), vet: () => eventSheet("vet") };
export function openQuickLog(type) {
  if (!pet()) return;
  const fn = QUICK[String(type || "").toLowerCase()];
  if (fn) fn();
}
window.NP_openQuickLog = openQuickLog;

function showUpdateReady(apply) {
  UI.applyUpdate = apply;
  toast("Update ready. Same diary, fresh paint.", [["Update now", () => apply()]], { ms: 20000 });
  if (/^#\/more/.test(location.hash) && !document.querySelector("dialog[open]")) refresh();
}

function mountInAppBanner() {
  const slot = document.getElementById("inapp-slot");
  if (!slot || slot.childElementCount) return;
  let el = null;
  try { el = inAppBanner(); } catch { el = null; }
  if (el) slot.append(el);
}

/** A 150 ms cross-fade between screens where the browser supports view transitions (and motion is OK). */
function crossFade(e) {
  if (!document.startViewTransition || !motionOK() || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest && e.target.closest('a[href^="#/"]');
  if (!a || a.target || document.querySelector("dialog[open]")) return;
  const href = a.getAttribute("href");
  if (href === location.hash) return;
  e.preventDefault();
  document.startViewTransition(() => new Promise((resolve) => {
    addEventListener("hashchange", () => resolve(), { once: true }); // app.js redraws on hashchange first
    setTimeout(resolve, 300); // never hold the page
    location.hash = href;
  }));
}

// install.js (loaded first) queues early callers until app.js takes over the hook, so one call is enough.
if (typeof window.NP_onUpdateReady === "function") window.NP_onUpdateReady(showUpdateReady);
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountInAppBanner); else mountInAppBanner();
document.addEventListener("click", crossFade);
