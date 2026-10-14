// First run. The welcome page (tap Nova, two buttons), then "Add my pet" as five one-question screens with a progress
// bar (who, name, photo or icon, here's their day, reminder), then Home. The level check is offered later from Train.
// Also the app-shell hooks that used to live with Today: window.NP_openQuickLog for #/quick/<type>, the
// "Update ready" toast, the in-app browser banner and the route cross-fade.

import { S, pet, refresh, UI, save, setSetting } from "../state.js";
import { h, put, em, toast, motionOK, uid, isoDate, buzz, resizePhoto } from "../util.js";
import { eventSheet, unwellSheet, logPoop, logMeal, logEggs, logTreat, logWalk, logMed, SPECIES, PET_ICONS, speciesOf, saveError } from "../forms.js";
import { NOVA, avatar, chevron } from "./parts.js";
import { importForm } from "./more.js";
import { inAppBanner, installCard } from "../install.js";
import { trainingPicker, confetti } from "./gameui.js";
import { ANCHORS } from "./doitnow.js";
import { dayPreview, novaSay } from "./today.js";
import { scene } from "../scenes.js";
import { SCENES } from "../../data/scenes.js";
import * as ics from "../ics.js";

function welcomeInstall() {
  try { const c = installCard(); return c ? h("div.welcome-install", c) : null; } catch { return null; }
}

// ---------- Add my pet: one question per screen ----------
// The answers live here (not in the page) so a redraw (coming back from the camera, say) doesn't lose them.
const TOTAL = 5;
const wiz = { species: "", name: "", you: "", photo: null, icon: null, anchor: "", time: "", err: "", busy: false, last: 0 };
const resetWiz = () => Object.assign(wiz, { species: "", name: "", you: "", photo: null, icon: null, anchor: "", time: "", err: "", busy: false, last: 0 });
const NOVA_SAYS = {
  dog: "A dog! Welcome to the pack, friend.", cat: "A cat. They'll act like it was their idea. It was.", rabbit: "A rabbit! Hay, binkies and tiny wins.",
  bird: "A bird! I'll try not to stare.", chicken: "Chickens! A whole flock. I respect that.", horse: "A horse! Big plans. I love it.", other: "Someone special. I like them already.",
};
const goStep = (n) => { location.hash = `#/welcome/add/${n}`; };

/** A set of big tap cards: real radio inputs underneath, so arrow keys and screen readers just work. */
function optionCards(group, items, value, onpick, cls = "") {
  const box = h(`div.ob-opts${cls ? `.${cls}` : ""}`, { role: "radiogroup", "aria-label": group });
  items.forEach(([v, e, label, sub]) => {
    const id = `ob-${group.replace(/\W+/g, "")}-${v}`;
    box.append(
      h("input", { type: "radio", name: group, id, value: v, "data-k": `ob-${v}`, checked: v === value, onchange: () => { buzz(10); onpick(v); } }),
      h("label", { for: id }, h("span.ob-e", label ? { "aria-hidden": "true" } : null, e), label ? h("b", label) : null, sub ? h("span.ob-sub", sub) : null));
  });
  return box;
}

function wizard(main, step) {
  const draft = { id: "__new", name: wiz.name || "your pet", species: wiz.species || "dog", __counts: wiz.meals ? { meals: wiz.meals } : undefined };
  const sp = speciesOf(wiz.species || "dog");
  const from = Math.min(wiz.last || step, TOTAL), fill = h("span", { style: { width: `${(from / TOTAL) * 100}%` } });
  if (from !== step) requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = `${(step / TOTAL) * 100}%`; }));
  wiz.last = step;
  const top = h("div.ob-top",
    h("a.ob-back", { href: step > 1 ? `#/welcome/add/${step - 1}` : "#/welcome", "data-k": "ob-back" }, chevron("left"), h("span.vh", "Back")),
    h("div.ob-prog", { role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(TOTAL), "aria-valuenow": String(step), "aria-valuetext": `Step ${step} of ${TOTAL}` }, fill));
  const next = (label, fn, { disabled = false } = {}) => h("button.btn.btn-blue.wide.ob-next", { type: "button", "data-k": "ob-next", "aria-disabled": disabled ? "true" : null, onclick: (e) => { if (e.currentTarget.getAttribute("aria-disabled") === "true") return; fn(); } }, label);
  const setNext = (btn, on, label) => { btn.setAttribute("aria-disabled", on ? "false" : "true"); if (label) btn.textContent = label; };
  const card = (...kids) => h("section.ob-card", { "aria-labelledby": "page-title" }, ...kids);
  let body;

  if (step === 1) {
    const say = h("span", wiz.species ? NOVA_SAYS[wiz.species] : "Pick your partner. Whoever it is, they're welcome.");
    const btn = next("Continue", () => goStep(2), { disabled: !wiz.species });
    body = card(
      novaSay(say, "happy"),
      h("h1.ob-h", { id: "page-title", tabindex: "-1" }, "Who's in your family?"),
      optionCards("Species", SPECIES.map((s) => [s.id, s.emoji, s.label]), wiz.species, (v) => { wiz.species = v; wiz.icon = null; say.textContent = NOVA_SAYS[v]; setNext(btn, true); }, "ob-species"),
      h("p.ob-alt", h("a.text-link", { href: "#/ready", "data-k": "ob-noped" }, "No pet yet? Get ready")),
      h("div.ob-foot", btn));
  } else if (step === 2) {
    const name = h("input", { type: "text", id: "ob-name", "data-k": "ob-name", maxlength: "40", value: wiz.name, placeholder: "e.g. Nova", autocomplete: "off", enterkeyhint: "next", "aria-label": "Name" });
    const you = S.settings.trainerName ? null : h("input", { type: "text", id: "ob-you", "data-k": "ob-you", maxlength: "40", value: wiz.you, placeholder: "e.g. Shiv", autocomplete: "given-name", enterkeyhint: "next" });
    const btn = next("Continue", () => go(), { disabled: !wiz.name.trim() });
    const go = () => { const v = name.value.trim(); if (!v) { name.focus(); return; } wiz.name = v.slice(0, 40); wiz.you = you ? you.value.trim().slice(0, 40) : ""; goStep(3); };
    name.addEventListener("input", () => { wiz.name = name.value; setNext(btn, !!name.value.trim()); });
    if (you) you.addEventListener("input", () => { wiz.you = you.value; });
    for (const inp of [name, you]) if (inp) inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); go(); } });
    body = card(
      novaSay(`${sp.emoji} ${NOVA_SAYS[wiz.species] || "Nice."} What do they answer to?`, "think"),
      h("h1.ob-h", { id: "page-title", tabindex: "-1" }, "What's their name?"),
      h("form.ob-form", { novalidate: true, onsubmit: (e) => { e.preventDefault(); go(); } },
        h("label.vh", { for: "ob-name" }, "Name"), name,
        you ? h("div.ob-you", h("label", { for: "ob-you" }, "And you? ", h("span.opt", "(optional)")), you, h("p.hint", "So Nova can say hi. Stays on this phone.")) : null),
      h("div.ob-foot", btn));
    setTimeout(() => { if (document.contains(name) && !name.value) name.focus({ preventScroll: true }); }, 60);
  } else if (step === 3) {
    const view = h("div.ob-face");
    const shown = () => ({ name: wiz.name, species: wiz.species || "dog", photo: wiz.photo || undefined, icon: wiz.icon || undefined });
    const msg = h("p.hint.ob-msg", { role: "status" }, "Stays on this phone. We shrink it and remove location data.");
    const btn = next(wiz.photo || wiz.icon ? "Continue" : "Skip for now", () => goStep(4));
    const draw = () => { view.replaceChildren(avatar(shown(), 112)); setNext(btn, true, wiz.photo || wiz.icon ? "Continue" : "Skip for now"); };
    const file = h("input", { type: "file", accept: "image/*", "data-k": "ob-photo", class: "vh" });
    file.addEventListener("change", async () => {
      const f = file.files && file.files[0];
      if (!f) return;
      try { wiz.photo = await resizePhoto(f, 512); msg.textContent = "Lovely. Resized on your phone, location data removed."; draw(); iconsBox.querySelectorAll("input").forEach((i) => { i.checked = false; }); }
      catch { msg.textContent = "Couldn't read that photo. Try a JPG or PNG."; }
    });
    const iconsBox = optionCards("Icon", PET_ICONS.map((e) => [e, e, ""]), wiz.icon || "", (v) => { wiz.icon = v; wiz.photo = null; draw(); }, "ob-icons");
    body = card(
      novaSay("A face for the home screen. Skip it if you like, you can add one later.", "happy"),
      h("h1.ob-h", { id: "page-title", tabindex: "-1" }, `A face for ${wiz.name || "your pet"}`),
      h("div.ob-photo", view,
        h("label.btn.btn-line.ob-choose", em("📷"), wiz.photo ? " Choose another photo" : " Choose a photo", file),
        wiz.photo ? h("button.linkish", { type: "button", "data-k": "ob-photo-remove", onclick: () => { wiz.photo = null; refresh(); } }, "Remove photo") : null),
      msg,
      h("p.ob-or", "or pick an icon"),
      iconsBox,
      h("div.ob-foot", btn));
    draw();
  } else if (step === 4) {
    const rows = dayPreview(draft);
    body = card(
      novaSay("Tap each one as you do it. The ring fills and you get a tick. That's the whole game.", "proud"),
      h("h1.ob-h", { id: "page-title", tabindex: "-1" }, `Here's ${wiz.name || "your pet"}'s day`),
      h("ul.ob-day", { "aria-label": "Daily checklist" }, rows.map((r) => h("li.ob-daytile",
        h("span.td-node", h("span.td-e", { "aria-hidden": "true" }, r.e)), h("span.td-t", h("b", r.label), h("span.td-s", r.sub))))),
      h("div.ob-meals", { role: "group", "aria-label": "Meals a day" }, h("span", "Meals a day"),
        [1, 2, 3].map((n) => h(`button.chip${(wiz.meals || (["dog", "cat"].includes(draft.species) ? 2 : 1)) === n ? ".on" : ""}`, { type: "button", "data-k": `ob-meals-${n}`, "aria-pressed": String((wiz.meals || (["dog", "cat"].includes(draft.species) ? 2 : 1)) === n), onclick: () => { wiz.meals = n; refresh(); } }, String(n)))),
      h("p.ob-note", "Medicines you add show up here when they're due. Change the list any time with Edit list."),
      h("div.ob-foot", next("Looks good", () => goStep(5))));
  } else {
    const picks = [...ANCHORS.map(([v, e, label, t]) => [v, e, label, t]), ["none", "🔕", "No reminder", "Maybe later"]];
    const calBox = h("div.ob-cal", { hidden: !wiz.anchor });
    const showCal = () => {
      calBox.hidden = !wiz.anchor;
      if (!wiz.anchor) return;
      calBox.replaceChildren(h("button.btn.btn-line.wide", { type: "button", "data-k": "ob-cal", onclick: () => {
        ics.download("novas-pack-daily-minute.ics", ics.dailyEvent({ uid: `plan-${uid()}`, title: `1 minute with ${wiz.name} 🐾`, time: wiz.time, start: isoDate(), note: "Open Nova's Pack and tap a tile on Today." }));
        toast("Calendar file made. Open it and tap Add.");
      } }, em("📅"), " Add to my calendar"));
    };
    const err = h("p.form-error", { role: "alert" }, wiz.err);
    const btn = next("Start", () => finish(btn, err));
    body = card(
      novaSay("A tiny nudge helps. Your calendar does the reminding, I never buzz you.", "think"),
      h("h1.ob-h", { id: "page-title", tabindex: "-1" }, "When should Nova nudge you?"),
      optionCards("Reminder time", picks, wiz.anchor || "", (v) => {
        const hit = ANCHORS.find((a) => a[0] === v);
        wiz.anchor = hit ? v : ""; wiz.time = hit ? hit[3] : ""; showCal();
      }, "ob-times"),
      calBox, err,
      h("div.ob-foot", btn));
    showCal();
  }
  put(main, h("div.ob", top, body));
}

async function finish(btn, err) {
  if (wiz.busy) return;
  wiz.busy = true; btn.setAttribute("aria-disabled", "true"); err.textContent = "";
  const row = { id: uid(), name: wiz.name.trim().slice(0, 40), species: wiz.species || "dog", createdAt: Date.now(), training: {} };
  if (wiz.photo) row.photo = wiz.photo;
  else if (wiz.icon && wiz.icon !== speciesOf(row.species).emoji) row.icon = wiz.icon;
  try {
    await save("pets", row, { quiet: true });
    await setSetting("currentPet", row.id);
    if (!S.settings.firstUse) await setSetting("firstUse", Date.now());
    if (wiz.you && !S.settings.trainerName) await setSetting("trainerName", wiz.you).catch(() => {});
    if (wiz.meals) await setSetting("checklistN", { ...(S.settings.checklistN || {}), [row.id]: { meals: wiz.meals } }).catch(() => {});
    if (wiz.anchor) await setSetting("plan", { anchor: wiz.anchor, time: wiz.time }).catch(() => {});
    else await setSetting("planAsked", Date.now()).catch(() => {}); // they've been asked; don't ask again after the first log
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  } catch (ex) {
    wiz.busy = false; btn.setAttribute("aria-disabled", "false"); err.textContent = saveError(ex);
    return;
  }
  resetWiz();
  toast(`${row.name} is your partner. Here's today's list.`);
  location.hash = "#/home";
  buzz(25);
  if (motionOK()) confetti();
}

export function welcome(main, arg, sub) {
  document.title = "Nova's Pack · Tiny daily wins with your pet";
  if (arg === "add") {
    let step = Math.max(1, Math.min(TOTAL, Number(sub) || 1));
    // A reload or a stale link can land mid-way with nothing chosen: go back to the first question that's missing.
    const need = !wiz.species ? 1 : !wiz.name.trim() ? 2 : step;
    if (step > need) { step = need; history.replaceState(null, "", `#/welcome/add/${step}`); }
    wizard(main, step);
    return;
  }
  resetWiz();
  const nova = h("button.welcome-hero", { type: "button", "data-k": "wel-nova", "aria-label": "High-five Nova" },
    h("span.wh-rays", { "aria-hidden": "true" }),
    h("img.disc.welcome-nova", { src: NOVA, alt: "", width: "120", height: "120" }),
    h("span.wh-medal", { "aria-hidden": "true" }, "LEVEL", h("b", "UP!")),
    h("span.wh-pop", { "aria-hidden": "true" }, "+10 XP"));
  let fives = 0;
  nova.addEventListener("click", () => {
    fives++;
    nova.classList.remove("hi"); void nova.offsetWidth; nova.classList.add("hi");
    buzz(15);
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
    h("h1", { tabindex: "-1", id: "page-title" }, "Tiny daily wins with your pet."),
    h("p.lede", "One minute a day. Free, private, no account."),
    h("div.welcome-ctas",
      h("a.btn.btn-blue.wide", { href: "#/welcome/add", "data-k": "wel-add" }, "Add my pet"),
      h("a.btn.btn-line.wide", { href: "#/ready", "data-k": "wel-ready" }, "No pet yet? Get ready")),
    welcomeInstall(),
    h("ol.welcome-how", { "aria-label": "How it works" }, how.map(([n, t, sp]) => h("li",
      sp ? h("figure.wh-pic", scene(sp)) : null, h("span.wh-n", { "aria-hidden": "true" }, n), h("b", t)))),
    h("details.more-box.restore", h("summary", "Have a backup? Restore it"), importForm("replace")),
    h("p.small.muted", "Everything stays on this phone. ", h("a", { href: "privacy.html" }, "Privacy notice"), " · ", h("a", { href: "card.html" }, "Pack Card maker"))));
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
