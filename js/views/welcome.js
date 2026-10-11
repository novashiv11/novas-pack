// First run (pick your partner, straight to Home with a quest), plus the app-shell hooks that used to live with
// Today: window.NP_openQuickLog for #/quick/<type>, the "Update ready" toast, the in-app browser banner and the
// route cross-fade.

import { quizSkills } from "./placement.js";
import { S, pet, refresh, UI, setSetting } from "../state.js";
import { h, put, em, toast, motionOK } from "../util.js";
import { eventSheet, unwellSheet, logPoop, logMeal, logTreat, logWalk, logMed, petForm, field, textIn } from "../forms.js";
import { subBar, NOVA } from "./parts.js";
import { addSample } from "../sample.js";
import { importForm } from "./more.js";
import { inAppBanner, installCard } from "../install.js";
import { trainingPicker } from "./gameui.js";

function welcomeInstall() {
  try { const c = installCard(); return c ? h("div.welcome-install", c) : null; } catch { return null; }
}

export function welcome(main, arg) {
  document.title = "Nova's Pack · Level up together";
  if (arg === "add") {
    const name = textIn({ maxlength: "40", value: S.settings.trainerName || "", placeholder: "e.g. Shiv", autocomplete: "given-name" });
    const extra = S.settings.trainerName ? null : field(h("span", "And you are?", h("span.opt", " (optional)")), name, "So Nova knows who's holding the lead. Stays on this device.");
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
  put(main, h("section.welcome",
    h("img.disc.welcome-nova", { src: NOVA, alt: "", width: "96", height: "96" }),
    h("p.eyebrow", "Nova's Pack · Level up together"),
    h("h1", { tabindex: "-1", id: "page-title" }, "Tiny daily wins. For you and your pet."),
    h("p.lede", "Free. Private on your phone. No account."),
    h("div.welcome-ctas",
      h("a.btn.btn-blue.wide", { href: "#/welcome/add", "data-k": "wel-add" }, "Add my pet"),
      h("button.btn.btn-line.wide", { type: "button", "data-k": "wel-peek", onclick: async () => {
        try { await addSample(); location.hash = "#/home"; } catch { toast("Couldn't save on this device. Private browsing?"); }
      } }, "No pet yet? Peek inside")),
    welcomeInstall(),
    h("ul.welcome-grid",
      h("li", em("🎓"), h("span", "Skills that level up")),
      h("li", em("🌟"), h("span", "Real-life adventures")),
      h("li", em("🩺"), h("span", "Care diary")),
      h("li", em("🏅"), h("span", "Badges for you too"))),
    h("p.bubble.welcome-bubble", "I'm Nova. One minute a day. I'll keep score."),
    h("details.more-box.restore", h("summary", "Have a backup? Restore it"), importForm("replace")),
    h("p.small.muted", "Everything stays on this device. ", h("a", { href: "privacy.html" }, "Privacy notice"), " · ", h("a", { href: "card.html" }, "Pack Card maker"))));
}

// ---------- app-shell hooks ----------

/** #/quick/<type> (home-screen shortcuts) lands here, after app.js has drawn the screen. */
const QUICK = { poop: logPoop, meal: logMeal, treat: logTreat, walk: logWalk, med: logMed, medicine: logMed,
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
