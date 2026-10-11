// Every form in the app: pets (with profile and contacts), one-tap logs, the Unwell checklist, vaccines,
// care routine, medicines, food and treats. Forms open in a bottom sheet (a <dialog>), except the
// first-run pet form, which sits on the page.

import { S, pet, save, remove, removePet, adoptSample, setSetting, eventsOf, forPet, units, refresh, UI } from "./state.js";
import { h, put, em, uid, sheet, toast, confirmBox, isoDate, addDays, addMonths, daysBetween, toLocalInput, fromLocalInput, resizePhoto, fmtDate, weeklyStreak, isoWeek, motionOK, buzz } from "./util.js";
import { ALSO_NOTICED, scaleFor, poopScale, skillsFor, medStatus, fromUnit, toUnit, medIsActive, recordStatus, currentRecords, healthAlerts, recordDoneCheck } from "./logic.js";
import { saveErrorText } from "./db.js";
import * as ics from "./ics.js";

export const SPECIES = [
  { id: "dog", label: "Dog", emoji: "🐶" },
  { id: "cat", label: "Cat", emoji: "🐱" },
  { id: "rabbit", label: "Rabbit", emoji: "🐰" },
  { id: "bird", label: "Bird", emoji: "🐦" },
  { id: "chicken", label: "Chickens", emoji: "🐔" },
  { id: "horse", label: "Horse", emoji: "🐴" },
  { id: "other", label: "Other", emoji: "🐾" },
];
/** Icons a pet can have when there's no photo. The species' own emoji is the default. */
const ICON_NAMES = { "🐶": "Dog face", "🐕": "Dog", "🦮": "Guide dog", "🐩": "Poodle", "🐺": "Wolf", "🦊": "Fox", "🐱": "Cat face", "🐈": "Cat", "🐈‍⬛": "Black cat", "🐯": "Tiger", "🐰": "Rabbit face", "🐇": "Rabbit", "🐹": "Hamster", "🐭": "Mouse", "🦔": "Hedgehog", "🐦": "Bird", "🦜": "Parrot", "🐤": "Chick", "🐔": "Hen", "🦆": "Duck", "🐴": "Horse", "🐮": "Cow", "🐷": "Pig", "🐑": "Sheep", "🐐": "Goat", "🐢": "Tortoise", "🦎": "Lizard", "🐍": "Snake", "🐟": "Fish", "🐠": "Tropical fish", "🐸": "Frog", "🐾": "Paw prints" };
export const PET_ICONS = ["🐶", "🐕", "🦮", "🐩", "🐺", "🦊", "🐱", "🐈", "🐈‍⬛", "🐯", "🐰", "🐇", "🐹", "🐭", "🦔", "🐦", "🦜", "🐤", "🐔", "🦆", "🐴", "🐮", "🐷", "🐑", "🐐", "🐢", "🦎", "🐍", "🐟", "🐠", "🐸", "🐾"];

export const speciesOf = (id) => SPECIES.find((s) => s.id === id) || SPECIES[4];

export const TYPES = {
  poop: { emoji: "💩", label: "Poop" },
  meal: { emoji: "🍽️", label: "Meal" },
  treat: { emoji: "🦴", label: "Treat" },
  med: { emoji: "💊", label: "Medicine" },
  walk: { emoji: "🚶", label: "Walk" },
  training: { emoji: "🎓", label: "Training" },
  symptom: { emoji: "😟", label: "Unwell" },
  care: { emoji: "✨", label: "Care" },
  weight: { emoji: "⚖️", label: "Weight" },
  vet: { emoji: "🩺", label: "Vet visit" },
  eggs: { emoji: "🥚", label: "Eggs" },
};

/** The Unwell checklist, in plain words. Ids are the shared contract with logic.js (healthAlerts). */
export const SYMPTOMS = [
  { id: "not-eating", label: "Not eating, or eating much less" },
  { id: "vomiting", label: "Vomiting (being sick)" },
  { id: "diarrhoea", label: "Diarrhoea (runny poop)" },
  { id: "lethargy", label: "Very tired, flat or hiding" },
  { id: "breathing", label: "Breathing fast, noisily or with effort" },
  { id: "collapse", label: "Collapsed, had a fit (seizure), or can't stand" },
  { id: "heat", label: "Overheated: heavy panting, drooling or wobbly after heat or exercise" },
  { id: "bleeding", label: "Bleeding that won't stop, a deep wound, or hit by a car" },
  { id: "swelling", label: "Sudden swelling of the face, lumps all over (hives), or a sting" },
  { id: "eye", label: "Eye problem: squinting, red, cloudy or swollen, or an injury" },
  { id: "limping", label: "Limping, stiff, or seems in pain" },
  { id: "coughing", label: "Coughing or gagging that keeps going" },
  { id: "bloat", label: "Swollen, hard belly, or retching with nothing coming up" },
  { id: "straining-urine", label: "Straining to pee, little or nothing coming out" },
  { id: "no-droppings", label: "No poop or droppings, or far fewer than usual" },
  { id: "maggots", label: "Maggots or fly eggs on the skin or bottom", only: ["rabbit"] },
  { id: "toxin", label: "Might have eaten something poisonous" },
];
export const symptomLabel = (id) => (SYMPTOMS.find((s) => s.id === id) || { label: id }).label;

// ---------- log hooks (v2): the game layer adds "+10 XP" to the toast and celebrates level-ups ----------
// before() runs just before a new diary entry is saved and returns a token; after(ev, token) runs once it's saved and
// returns extra toast text (or ""). Set by js/views/gameui.js; forms.js never imports the game.
let hooks = {};
export function setLogHooks(h) { hooks = h || {}; }
function hookBefore() { try { return hooks.before ? hooks.before() : null; } catch (e) { console.warn(e); return null; } }
function hookAfter(ev, token) { try { return (hooks.after && hooks.after(ev, token)) || ""; } catch (e) { console.warn(e); return ""; } }

// ---------- small form helpers ----------
let n = 0;
const fid = () => `f${++n}`;
export function field(label, input, hint) {
  if (!input.id) input.id = fid();
  const kids = [h("label", { for: input.id }, label), input];
  if (hint) {
    const hid = `${input.id}-hint`;
    input.setAttribute("aria-describedby", hid);
    kids.push(h("p.hint", { id: hid }, hint));
  }
  return h("div.field", ...kids);
}
const opt = () => h("span.opt", " (optional)");
export function textIn(props = {}) { return h("input", { type: "text", autocomplete: "off", ...props }); }
function errorLine() { return h("p.form-error", { role: "alert" }); }

/** The one segmented control: radio inputs (arrow keys work) styled as a 44 px track. */
export function segmented(name, legend, items, value, onchange, { hideLegend = false } = {}) {
  const box = h("div.seg");
  items.forEach(([v, label]) => {
    const id = fid();
    box.append(
      h("input", { type: "radio", name, id, value: v, checked: v === value, onchange: () => onchange && onchange(v) }),
      h("label", { for: id }, label));
  });
  return h("fieldset.fs.seg-fs", h(`legend${hideLegend ? ".vh" : ""}`, legend), box);
}
const radioVal = (form, name) => { const r = form.querySelector(`input[name="${name}"]:checked`); return r ? r.value : null; };
export const slug = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "pet";
function dropEmpty(o) {
  for (const k of Object.keys(o)) if (o[k] === undefined || o[k] === "") delete o[k];
  return Object.keys(o).length ? o : undefined;
}
export const saveError = (e) => saveErrorText(e, "Couldn't save on this device. If you're in private browsing, open the app in a normal tab.");
function check(label, props = {}, hint) {
  const id = fid();
  const inp = h("input", { type: "checkbox", id, ...props });
  const kids = [inp, h("label", { for: id }, label)];
  if (hint) { inp.setAttribute("aria-describedby", `${id}-h`); kids.push(h("p.hint.check-hint", { id: `${id}-h` }, hint)); }
  return { row: h("div.check", ...kids), input: inp };
}

// ---------- pets ----------

/**
 * The add/edit pet form, built into `box`. Calls onSaved(pet) after saving.
 * Adding asks only for the name and species; everything else folds away ("add details later").
 * Editing adds the profile: vet and insurance, microchip, and health notes.
 */
export function petForm(box, existing, onSaved, { openProfile = false, extra = null, submitLabel = "" } = {}) {
  const p = existing || {};
  let photo = p.photo || null;
  const form = h("form.form", { novalidate: true });
  const name = textIn({ name: "name", maxlength: "40", required: true, value: p.name || "", placeholder: "e.g. Nova", autocomplete: "off" });
  const speciesBox = h("div.species.pick");
  SPECIES.forEach((s) => {
    const id = fid();
    speciesBox.append(
      h("input", { type: "radio", name: "species", id, value: s.id, checked: (p.species || "dog") === s.id }),
      h("label", { for: id }, em(s.emoji), " ", s.label));
  });
  // Icon (when there's no photo): follows the species until you pick one yourself.
  let icon = p.icon || null;
  const iconBox = h("div.icon-pick", { role: "radiogroup", "aria-label": "Icon" });
  const iconName = `icon-${fid()}`;
  const iconFor = () => icon || speciesOf(radioVal(form, "species") || p.species || "dog").emoji;
  const drawIcons = () => {
    const cur = iconFor();
    iconBox.replaceChildren(...PET_ICONS.flatMap((e) => {
      const id = fid();
      return [h("input", { type: "radio", name: iconName, id, value: e, checked: e === cur, onchange: () => { icon = e; } }), h("label", { for: id, title: ICON_NAMES[e] || "", "aria-label": ICON_NAMES[e] || "Icon" }, h("span", { "aria-hidden": "true" }, e))];
    }));
  };
  speciesBox.addEventListener("change", () => { if (!p.icon && !iconTouched()) drawIcons(); });
  const iconTouched = () => icon !== null && icon !== (p.icon || null);
  const birthday = h("input", { type: "date", name: "birthday", max: isoDate(), value: p.birthday || "" });
  const homeSince = h("input", { type: "date", name: "homeSince", max: isoDate(), value: p.homeSince || "" });
  const preview = h("img.photo-preview", { alt: "", hidden: !photo, src: photo || undefined, width: "72", height: "72" });
  const file = h("input", { type: "file", accept: "image/*", name: "photo", id: fid() });
  const photoMsg = h("p.hint", { role: "status" });
  // Style: the photo as it is, or a cartoon of it (made on this phone by js/cartoon.js; nothing is uploaded).
  // A saved cartoon has no original kept, so it starts as "Cartoon" and can't be un-cartooned (choose the photo again).
  let style = p.photo && p.photoStyle === "cartoon" ? "cartoon" : "photo", shown = style;
  let original = shown === "cartoon" ? null : photo, styleRun = 0, pending = null;
  const applyStyle = async () => {
    const run = ++styleRun;
    if (!original) {
      if (style === "photo" && shown === "cartoon") photoMsg.textContent = "To use the plain photo again, choose it again above.";
      return;
    }
    if (style === "photo") { photo = original; shown = "photo"; preview.src = photo; photoMsg.textContent = ""; return; }
    photoMsg.textContent = "Drawing the cartoon…";
    try {
      const { cartoonize } = await import("./cartoon.js");
      const out = await cartoonize(original, { size: 512 });
      if (run !== styleRun) return;
      photo = out; shown = "cartoon"; preview.src = photo;
      photoMsg.textContent = "Cartoon ready. Made on your phone.";
    } catch { if (run === styleRun) photoMsg.textContent = "Couldn't make a cartoon of that photo. The photo is kept as it is."; }
  };
  const runStyle = () => { pending = applyStyle().finally(() => { pending = null; }); return pending; };
  const styleSeg = segmented(`style-${fid()}`, "Style", [["photo", "Photo"], ["cartoon", "Cartoon"]], style, (v) => { style = v; runStyle(); });
  styleSeg.classList.add("photo-style");
  styleSeg.hidden = !photo;
  const removePhoto = h("button.linkish", { type: "button", hidden: !photo, onclick: () => { photo = null; original = null; shown = "photo"; preview.hidden = true; removePhoto.hidden = true; styleSeg.hidden = true; file.value = ""; photoMsg.textContent = ""; } }, "Remove photo");
  file.addEventListener("change", async () => {
    const f = file.files && file.files[0];
    if (!f) return;
    try {
      original = photo = await resizePhoto(f, 512); shown = "photo";
      preview.src = photo; preview.hidden = false; removePhoto.hidden = false; styleSeg.hidden = false;
      photoMsg.textContent = "Photo ready. Resized on your phone, location data removed.";
      if (style === "cartoon") await runStyle();
    } catch { photoMsg.textContent = "Couldn't read that photo. Try a JPG or PNG."; }
  });
  const weight = h("input", { type: "number", name: "weight", inputmode: "decimal", min: "0", max: "2000", step: "0.01" });
  const err = errorLine();
  let sex = p.sex === "male" || p.sex === "female" ? p.sex : "unknown";
  let profile = null;
  const basics = [
    segmented(`sex-${fid()}`, "Sex", [["female", "Female"], ["male", "Male"], ["unknown", "Not sure"]], sex, (v) => { sex = v; if (profile) profile.sync(); }),
    field(h("span", "Birthday", opt()), birthday, "A guess is fine."),
    field(h("span", "Home since", opt()), homeSince, "Adopted or rescued? Their gotcha day. Nova will remember it."),
    h("div.field",
      h("label", { for: file.id }, "Photo", opt()),
      h("div.photo-row", preview, h("div", file, removePhoto)),
      h("p.hint", "Stays on this device. We shrink it and strip location data."),
      styleSeg,
      photoMsg),
    existing ? null : field(h("span", `Weight in ${units()}`, opt()), weight),
  ];

  // Adding a pet while the sample is there: remove the sample too (ticked by default).
  const sampleNow = !existing && S.pets.some((x) => x.sample);
  const dropSample = sampleNow ? check("Remove Nova's sample (recommended)", { checked: true }, "The example pet and all its example logs. Your own pet starts clean.") : null;

  put(form,
    field("Name", name),
    h("fieldset.fs", h("legend", "Species"), speciesBox),
    h("fieldset.fs", h("legend", "Icon", opt()), iconBox, h("p.hint", "Shown when there's no photo.")),
    existing ? basics : h("details.fold", h("summary", "Add details (optional)"), h("div.fold-body", h("p.hint", "Birthday, photo and weight. Skip them now and add them later if you like."), basics)));

  if (existing) {
    profile = profileFields(p, openProfile, () => radioVal(form, "species"), () => sex);
    put(form, profile.el);
    speciesBox.addEventListener("change", profile.sync);
  }
  drawIcons();
  put(form, dropSample ? dropSample.row : null, extra, err,
    h("div.row-btns",
      existing ? h("button.btn.btn-line", { type: "button", onclick: () => deletePetFlow(p) }, p.sample ? "Delete sample" : "Delete") : null,
      existing && p.sample ? h("button.btn.btn-line", { type: "button", "data-k": "adopt-sample", onclick: () => adoptSampleFlow(p) }, "Make it mine") : null,
      h("button.btn.btn-blue", { type: "submit" }, existing ? "Save changes" : submitLabel || "Add pet")));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (pending) await pending; // a cartoon that's still drawing
    const nm = name.value.trim();
    if (!nm) { err.textContent = "Please add a name."; name.setAttribute("aria-invalid", "true"); name.focus(); return; }
    name.removeAttribute("aria-invalid");
    const row = {
      ...p, id: p.id || uid(), name: nm.slice(0, 40), species: radioVal(form, "species") || "dog",
      birthday: birthday.value || undefined, homeSince: homeSince.value || undefined, photo: photo || undefined, photoStyle: photo && shown === "cartoon" ? "cartoon" : undefined, createdAt: p.createdAt || Date.now(),
      training: p.training || {}, sex: sex === "unknown" ? undefined : sex,
      icon: icon && icon !== speciesOf(radioVal(form, "species") || "dog").emoji ? icon : undefined,
      ...(profile ? profile.read() : {}),
    };
    for (const k of Object.keys(row)) if (row[k] === undefined) delete row[k];
    try {
      const first = !S.pets.some((x) => !x.sample);
      await save("pets", row, { quiet: true });
      const w = parseFloat(weight.value);
      if (!existing && w > 0) await save("events", { id: uid(), petId: row.id, type: "weight", at: Date.now(), kg: fromUnit(w, units()) }, { quiet: true });
      await setSetting("currentPet", row.id);
      if (dropSample && dropSample.input.checked) for (const x of S.pets.filter((q) => q.sample)) await removePet(x.id);
      if (first && !S.settings.firstUse) await setSetting("firstUse", Date.now());
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
      onSaved(row);
    } catch (ex) {
      err.textContent = saveError(ex);
    }
  });
  box.append(form);
  return form;
}

/** Profile and contacts (pet fields in the shared contract). Returns { el, read(), sync() }. */
function profileFields(p, open, species, sex) {
  const v = p.vet || {}, ins = p.insurer || {}, chip = p.microchip || {}, neu = p.neutered || {};
  const tel = (value) => h("input", { type: "tel", inputmode: "tel", autocomplete: "off", maxlength: "40", value: value || "" });
  const vetName = textIn({ maxlength: "120", value: v.name || "", placeholder: "e.g. Riverside Vets" });
  const vetPhone = tel(v.phone), emPhone = tel(v.emergencyPhone);
  const insName = textIn({ maxlength: "120", value: ins.name || "" });
  const policy = textIn({ maxlength: "80", value: ins.policy || "" });
  const renewal = h("input", { type: "date", value: ins.renewal || "" });
  const chipNo = textIn({ maxlength: "40", value: chip.number || "", inputmode: "text", spellcheck: "false" });
  const registry = textIn({ maxlength: "120", value: chip.registry || "", placeholder: "The database it's registered on" });
  const checkedOn = h("input", { type: "date", max: isoDate(), value: chip.checkedOn || "" });
  const allergies = h("textarea", { rows: "2", maxlength: "1000", value: p.allergies || "", placeholder: "e.g. chicken makes her itchy" });
  const conditions = h("textarea", { rows: "2", maxlength: "1000", value: p.conditions || "", placeholder: "e.g. arthritis, diabetes" });
  let neut = neu.yes === true ? "yes" : neu.yes === false ? "no" : "unknown";
  const neutDate = h("input", { type: "date", max: isoDate(), value: neu.date || "" });
  const neutDateF = field(h("span", "Date", opt()), neutDate);
  const season = h("input", { type: "date", max: isoDate(), value: p.lastSeason || "" });
  const seasonF = field(h("span", "Last season (heat) started", opt()), season, "Only if they're not neutered. Helps your vet with timing.");
  const sync = () => {
    neutDateF.hidden = neut !== "yes";
    seasonF.hidden = neut === "yes" || sex() === "male" || !["dog", "cat", "rabbit"].includes(species());
  };
  const group = (title, ...kids) => h("details.fold", { open }, h("summary", title), h("div.fold-body", kids));
  const el = h("div.profile-groups",
    h("p.fold-intro", "Profile and contacts", h("span.opt", " (all optional)")),
    group("Vet and insurance",
      field("Vet practice", vetName), field("Vet phone", vetPhone), field("Emergency vet phone", emPhone, "The out-of-hours number, if your vet uses a different one."),
      field("Insurer", insName), h("div.two", field("Policy number", policy), field("Renewal date", renewal))),
    group("Microchip",
      field("Microchip number", chipNo), field("Registry", registry),
      field("Details checked on", checkedOn, "Moved house or changed number? Update the registry, then the date here.")),
    group("Health notes",
      field("Allergies and don't-feed list", allergies), field("Conditions", conditions, "Long-term conditions mean Nova flags some things sooner."),
      segmented(`neut-${fid()}`, "Neutered or spayed?", [["yes", "Yes"], ["no", "No"], ["unknown", "Not sure"]], neut, (x) => { neut = x; sync(); }),
      neutDateF, seasonF));
  sync();
  const t = (x) => x.value.trim() || undefined;
  const read = () => ({
    vet: dropEmpty({ name: t(vetName), phone: t(vetPhone), emergencyPhone: t(emPhone) }),
    insurer: dropEmpty({ name: t(insName), policy: t(policy), renewal: renewal.value || undefined }),
    microchip: dropEmpty({ number: t(chipNo), registry: t(registry), checkedOn: checkedOn.value || undefined }),
    allergies: t(allergies),
    conditions: t(conditions),
    neutered: neut === "unknown" ? undefined : dropEmpty({ yes: neut === "yes", date: neut === "yes" ? neutDate.value || undefined : undefined }),
    lastSeason: neut !== "yes" && !seasonF.hidden ? season.value || undefined : undefined,
  });
  return { el, read, sync };
}

export function openPetSheet(existing, { openProfile = false } = {}) {
  sheet(existing ? `Edit ${existing.name}` : "Add a pet", (body, close) => {
    if (!existing) body.append(h("p.sheet-intro", "Only the name is needed. Free. No account to lose."));
    const sample = !existing && S.pets.find((x) => x.sample);
    if (sample) body.append(h("p.adopt-line", `Is your pet ${sample.name}? `,
      h("button.linkish", { type: "button", "data-k": "adopt-from-add", onclick: () => adoptSampleFlow(sample) }, `Keep the sample's ${sample.name} and clear the examples`)));
    petForm(body, existing, (row) => {
      close();
      toast(existing ? "Saved." : `${row.name} added. Welcome to the pack.`);
      if (!existing && location.hash !== "#/home") location.hash = "#/home"; else refresh();
    }, { openProfile });
  });
}

/** Keep the sample pet as your own and clear every example, after asking; then open its details to check. */
export async function adoptSampleFlow(p) {
  const ok = await confirmBox(`Make ${p.name} yours?`,
    `${p.name}'s name stays. Every example is cleared: logs, vaccines, medicines, food, training, stamps, the example vet and insurer, and the made-up birthday. Add the real birthday next.`,
    "Clear examples, keep pet");
  if (!ok) return;
  document.querySelectorAll("dialog[open]").forEach((d) => d.close());
  const mine = await adoptSample(p.id);
  if (!mine) return;
  toast(`${mine.name} is yours now. Clean slate. Today counts.`);
  if (location.hash !== "#/home") location.hash = "#/home"; else refresh();
  openPetSheet(mine);
}

/** Delete one pet (or, for the sample, every sample pet), after asking. */
export async function deletePetFlow(p) {
  const samples = p.sample ? S.pets.filter((x) => x.sample) : [p];
  const ok = p.sample
    ? await confirmBox("Delete the sample?", "Nova's example diary and everything in it will be removed from this device.", "Delete sample", true)
    : await confirmBox(`Delete ${p.name}?`, `${p.name} and everything logged for them will be removed from this device. Export a backup first if you might want it back.`, "Delete", true);
  if (!ok) return;
  document.querySelectorAll("dialog[open]").forEach((d) => d.close());
  for (const x of samples) await removePet(x.id);
  toast(p.sample ? "Sample deleted." : `${p.name} deleted.`);
  if (!S.pets.length) location.hash = "#/welcome";
  refresh();
}

// ---------- one-tap logs ----------

/** The little bounce on the tile that was tapped, plus a tap of haptics. */
function celebrate(type) {
  buzz(10);
  if (!motionOK()) return;
  const tile = document.querySelector(`.ql[data-k="ql-${type}"]`);
  if (!tile) return;
  tile.classList.remove("bounce");
  void tile.offsetWidth;
  tile.classList.add("bounce");
  tile.addEventListener("animationend", () => tile.classList.remove("bounce"), { once: true });
}

/** After any one-tap log: bounce, then "Logged. I supervised." with Undo and Add details. */
function afterLog(ev, label, weekBefore, extra = "") {
  celebrate(ev.type);
  let msg = (label ? `Logged: ${label}. I supervised.` : "Logged. I supervised.") + extra;
  if (weekBefore && !weekBefore.thisWeek) {
    const st = weeklyStreak(eventsOf("training", ev.petId).map((e) => e.at));
    if (st.thisWeek) { UI.weekPulse = isoWeek(ev.at); msg = `Week ${st.weeks}. Acceptable.${extra}`; }
  }
  toast(msg, [
    ["Undo", () => remove("events", ev.id).then(() => toast("Undone."))],
    ["Add details", () => eventSheet(ev.type, ev, { details: true })],
  ]);
}

/** Log something in one tap with sensible defaults. */
export async function quickLog(type, fields = {}, label = "") {
  const p = pet();
  if (!p) return null;
  const ev = { id: uid(), petId: p.id, type, at: Date.now(), ...fields };
  if (p.sample) ev.sample = true;
  for (const k of Object.keys(ev)) if (ev[k] === undefined) delete ev[k];
  const weekBefore = type === "training" ? weeklyStreak(eventsOf("training", p.id).map((e) => e.at)) : null;
  const token = hookBefore();
  try { await save("events", ev); } catch (e) { toast(saveError(e)); return null; }
  afterLog(ev, label, weekBefore, hookAfter(ev, token));
  return ev;
}

export function currentFood(petId) {
  return forPet("foods", petId).filter((f) => f.kind === "food" && !f.until).sort((a, b) => (b.since || "").localeCompare(a.since || ""))[0] || null;
}
export const foodName = (f) => [f.brand, f.product].filter(Boolean).join(" ");
const treatsInUse = () => forPet("foods").filter((f) => f.kind === "treat" && f.inUse !== false);

export function logPoop() { return quickLog("poop", { score: 3 }, "a typical poop"); }
/** Hens: how many eggs today (a number, so it opens the small form). */
export function logEggs() { eventSheet("eggs"); }
export function logMeal() {
  const cur = currentFood();
  const last = lastOf("meal");
  if (cur) return quickLog("meal", { name: foodName(cur) || undefined }, foodName(cur));
  if (last && last.name) return quickLog("meal", { name: last.name, amount: last.amount }, last.name);
  return quickLog("meal");
}
export function logTreat() {
  const inUse = treatsInUse(), last = lastOf("treat");
  let name = "";
  if (inUse.length === 1) name = inUse[0].name;
  else if (last && last.name && (!inUse.length || inUse.some((t) => t.name === last.name))) name = last.name;
  else if (inUse.length) name = inUse[0].name;
  return quickLog("treat", { name: name || undefined }, name);
}
export function logWalk() { return quickLog("walk"); }
export function logTraining() { return quickLog("training"); }
/** Medicine: one tap when there's exactly one active medicine, otherwise the sheet. */
export function logMed() {
  const meds = forPet("meds").filter((m) => medIsActive(m));
  if (meds.length === 1) return markGiven(meds[0]);
  medGivenSheet();
  return null;
}

/** Move to the "Call your vet" card (on this screen, or Health's) and read it out. */
export function focusAlert() {
  const go = () => {
    const a = document.getElementById("vet-alert");
    if (!a) return;
    a.scrollIntoView({ block: "center", behavior: motionOK() ? "smooth" : "auto" });
    a.focus({ preventScroll: true });
  };
  if (!document.getElementById("vet-alert")) { location.hash = "#/health"; setTimeout(go, 160); }
  else setTimeout(go, 90);
}

/** The form for any diary entry, new or existing. details: opened from a toast's "Add details". */
export function eventSheet(type, existing, { details = false } = {}) {
  if (type === "symptom") { unwellSheet(existing); return; }
  const p = pet();
  if (!p) return;
  const ev = existing || {};
  const t = TYPES[type];
  const title = details ? `${t.label}: add details` : existing ? `Edit ${t.label.toLowerCase()}` : `Log ${type === "poop" ? "a poop" : t.label.toLowerCase()}`;
  sheet(title, (body, close) => {
    const form = h("form.form", { novalidate: true });
    const err = errorLine();
    const when = h("input", { type: "datetime-local", value: toLocalInput(ev.at || Date.now()), max: toLocalInput(Date.now() + 3600000), required: true });
    const note = h("textarea", { rows: "2", maxlength: "1000", value: ev.note || "" });
    const parts = [];
    let collect = () => ({});

    if (type === "poop") {
      const scaleBox = h("div.scale");
      const hint = h("p.hint.scale-hint", { "aria-live": "polite" });
      const rabbit = p.species === "rabbit";
      poopScale(p.id).forEach((s) => {
        const id = fid();
        const inp = h("input", { type: "radio", name: "score", id, value: String(s.score), checked: ev.score === s.score, onchange: () => { hint.textContent = s.hint; } });
        scaleBox.append(inp, h("label", { for: id }, h("span.em", { "aria-hidden": "true" }, s.emoji), h("span.sc-n", String(s.score)), h("span.sc-l", s.label)));
      });
      if (ev.score) hint.textContent = (scaleFor(ev.score, p.id) || {}).hint || "";
      const spHint = (S.content.POOP_HINTS || {})[p.species];
      const flags = new Set(ev.flags || []);
      const checks = (list) => h("div.checks", list.map((f) => check(f.label, { value: f.id, checked: flags.has(f.id) }).row));
      parts.push(
        h("fieldset.fs", h("legend", "How did it look?"),
          !rabbit && S.content.POOP_SCALE_NAME ? h("p.hint.scale-name", S.content.POOP_SCALE_NAME) : null,
          spHint ? h("p.hint.sp-hint", spHint) : null, scaleBox, hint),
        h("fieldset.fs", h("legend", "Anything unusual?", opt()), checks(S.content.POOP_FLAGS)),
        h("fieldset.fs", h("legend", "Also noticed today", opt()), checks(ALSO_NOTICED)));
      collect = () => {
        const sc = radioVal(form, "score");
        if (!sc) return { error: "Pick how it looked (1 to 5)." };
        return { score: Number(sc), flags: [...form.querySelectorAll(".checks input:checked")].map((c) => c.value) };
      };
    }

    if (type === "meal" || type === "treat") {
      const nameIn = textIn({ maxlength: "120", value: ev.name || "", placeholder: type === "meal" ? "e.g. breakfast, kibble" : "e.g. dental chew" });
      const amount = textIn({ maxlength: "120", value: ev.amount || "", placeholder: "e.g. 1 cup, 150 g" });
      const fill = (nm, am) => { nameIn.value = nm || ""; amount.value = am || ""; nameIn.focus(); };
      const last = eventsOf(type).find((x) => x.id !== ev.id && x.name);
      const chips = [];
      if (last) chips.push(h("button.chip", { type: "button", onclick: () => fill(last.name, last.amount) }, "Same as last time: ", h("b", [last.name, last.amount].filter(Boolean).join(", "))));
      const cur = type === "meal" ? currentFood() : null;
      if (cur && foodName(cur) && (!last || last.name !== foodName(cur))) chips.push(h("button.chip", { type: "button", onclick: () => fill(foodName(cur), "") }, foodName(cur)));
      if (type === "treat") treatsInUse().filter((f) => !last || f.name !== last.name).forEach((f) => chips.push(h("button.chip", { type: "button", onclick: () => fill(f.name, "") }, f.name)));
      if (chips.length) parts.push(h("div.chips-row", { role: "group", "aria-label": "Quick fill" }, chips));
      parts.push(field(h("span", type === "meal" ? "What" : "Which treat", opt()), nameIn), field(h("span", "How much", opt()), amount));
      collect = () => ({ name: nameIn.value.trim() || undefined, amount: amount.value.trim() || undefined });
    }

    if (type === "walk") {
      const mins = h("input", { type: "number", inputmode: "numeric", min: "1", max: "600", value: ev.minutes || "" });
      parts.push(field(h("span", "Minutes", opt()), mins));
      collect = () => ({ minutes: parseInt(mins.value, 10) > 0 ? Math.min(600, parseInt(mins.value, 10)) : undefined });
    }

    if (type === "training") {
      const skills = skillsFor(p);
      const sel = h("select", h("option", { value: "" }, "General practice"), skills.map((s) => h("option", { value: s.id }, s.title)));
      sel.value = ev.skillId || "";
      const mins = h("input", { type: "number", inputmode: "numeric", min: "1", max: "180", value: ev.minutes || "" });
      parts.push(field("Skill", sel), field(h("span", "Minutes", opt()), mins));
      collect = () => ({ skillId: sel.value || undefined, minutes: parseInt(mins.value, 10) > 0 ? parseInt(mins.value, 10) : undefined });
    }

    if (type === "med") {
      const nameIn = textIn({ maxlength: "120", value: ev.name || "", required: true });
      parts.push(field("Medicine", nameIn));
      collect = () => (nameIn.value.trim() ? { name: nameIn.value.trim() } : { error: "Add the medicine's name." });
    }

    if (type === "weight") {
      const u = units(p);
      const w = h("input", { type: "number", inputmode: "decimal", min: "0", step: u === "g" ? "1" : "0.01", required: true, value: ev.kg ? String(Math.round(toUnit(ev.kg, u) * 100) / 100) : "" });
      parts.push(field(`Weight in ${u}`, w));
      collect = () => { const v = parseFloat(w.value); return v > 0 ? { kg: fromUnit(v, u) } : { error: "Enter a weight above 0." }; };
    }

    if (type === "eggs") {
      const n = h("input", { type: "number", inputmode: "numeric", min: "0", max: "500", step: "1", required: true, value: ev.count ?? "" });
      parts.push(field("How many eggs?", n));
      collect = () => { const v = parseInt(n.value, 10); return v >= 0 && v <= 500 ? { count: v } : { error: "Enter how many eggs (0 is fine)." }; };
    }

    if (type === "care") {
      const task = careTask(p, ev.task);
      parts.push(h("p.care-name", h("b", task ? task.name : "Care task")));
    }

    if (type === "vet") {
      const clinic = textIn({ maxlength: "120", value: ev.clinic || "" });
      parts.push(field(h("span", "Clinic", opt()), clinic));
      collect = () => ({ clinic: clinic.value.trim() || undefined });
    }

    put(form,
      ...parts,
      field("When", when),
      field(h("span", type === "vet" ? "What the vet said" : "Note", opt()), note),
      err,
      h("div.row-btns",
        existing ? h("button.btn.btn-line", { type: "button", onclick: async () => {
          close(); await remove("events", ev.id);
          toast(`${t.label} deleted.`, [["Undo", () => save("events", ev)]]);
        } }, "Delete") : null,
        h("button.btn.btn-blue", { type: "submit" }, "Save")));
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const extra = collect();
      if (extra.error) { err.textContent = extra.error; return; }
      const row = { ...ev, ...extra, id: ev.id || uid(), petId: ev.petId || p.id, type, at: fromLocalInput(when.value), note: note.value.trim() || undefined };
      for (const k of Object.keys(row)) if (row[k] === undefined) delete row[k];
      if (p.sample && !existing) row.sample = true;
      const token = existing ? null : hookBefore();
      try { await save("events", row); } catch (ex) { err.textContent = saveError(ex); return; }
      close();
      if (type === "poop" && healthAlerts(p, Date.now()).length) {
        toast("Saved. Please read Nova's note about calling your vet.");
        focusAlert();
      } else if (!existing) {
        toast(`Logged. I supervised.${hookAfter(row, token)}`, [["Undo", () => remove("events", row.id)]]);
      } else toast("Saved.");
    });
    put(body, form);
  });
}

/** The Unwell checklist. Saves a `symptom` event, then shows the "Call your vet" card at once if a rule fires. */
export function unwellSheet(existing) {
  const p = pet();
  if (!p) return;
  const ev = existing || {};
  const picked = new Set(ev.symptoms || []);
  sheet(existing ? "Edit unwell note" : `Is ${p.name} unwell?`, (body, close) => {
    const form = h("form.form", { novalidate: true });
    const err = errorLine();
    const toxins = Array.isArray(S.content.TOXINS) ? S.content.TOXINS : [];
    const list = SYMPTOMS.filter((s) => !s.only || s.only.includes(p.species) || picked.has(s.id));
    const mine = toxins.map((t) => (typeof t === "string" ? { name: t } : t)).filter((t) => !t.only || t.only.includes(p.species));
    const boxes = list.map((s) => check(s.label, { value: s.id, checked: picked.has(s.id) },
      s.id === "toxin" && mine.length ? `Common ones: ${mine.map((t) => t.name).join("; ")}.` : null));
    const when = h("input", { type: "datetime-local", value: toLocalInput(ev.at || Date.now()), max: toLocalInput(Date.now() + 3600000), required: true });
    const note = h("textarea", { rows: "2", maxlength: "1000", value: ev.note || "", placeholder: "e.g. sick twice since lunch, still drinking" });
    put(form,
      h("p.sheet-intro", "Tick what you've noticed. If any of it needs a vet, I'll say so straight away. I don't diagnose: your vet does."),
      h("fieldset.fs", h("legend", "What have you noticed?"), h("div.checks.sym-checks", boxes.map((b) => b.row))),
      field("When did you notice?", when),
      field(h("span", "Note", opt()), note),
      err,
      h("div.row-btns",
        existing ? h("button.btn.btn-line", { type: "button", onclick: async () => {
          close(); await remove("events", ev.id); toast("Unwell note deleted.", [["Undo", () => save("events", ev)]]);
        } }, "Delete") : null,
        h("button.btn.btn-blue", { type: "submit" }, "Save")));
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const symptoms = boxes.filter((b) => b.input.checked).map((b) => b.input.value);
      if (!symptoms.length) { err.textContent = "Tick at least one thing you've noticed."; boxes[0].input.focus(); return; }
      const row = { ...ev, id: ev.id || uid(), petId: ev.petId || p.id, type: "symptom", at: fromLocalInput(when.value), symptoms, note: note.value.trim() || undefined };
      if (!row.note) delete row.note;
      if (p.sample && !existing) row.sample = true;
      try { await save("events", row); } catch (ex) { err.textContent = saveError(ex); return; }
      close();
      celebrate("symptom");
      if (healthAlerts(p, Date.now()).length) {
        toast("Saved. Please read my note about calling your vet.");
        focusAlert();
      } else {
        toast(`Noted. Keep an eye on ${p.name}, and call your vet if you're worried.`, existing ? [] : [["Undo", () => remove("events", row.id)]]);
      }
    });
    put(body, form);
  });
}

// ---------- medicines ----------
export function medGivenSheet() {
  const p = pet();
  const meds = forPet("meds").filter((m) => medIsActive(m));
  sheet("Medicine given", (body, close) => {
    if (!meds.length) put(body, h("p", "No medicines set up for ", p.name, " yet. Add one with the dose exactly as your vet wrote it."));
    const list = h("ul.plain-list");
    meds.forEach((m) => {
      const st = medStatus(m);
      list.append(h("li.med-row",
        h("div", h("b", m.name), h("p.small.muted", m.dose ? `Dose: ${m.dose}` : "Dose as your vet wrote it"),
          h("p.small", st.daily ? `${st.given} of ${st.need} given today` : st.due ? "Due now" : "Not due yet")),
        h("button.btn.btn-blue.sm", { type: "button", onclick: () => { close(); markGiven(m); } }, "Given", h("span.vh", `: ${m.name}`))));
    });
    const other = textIn({ maxlength: "120", placeholder: "e.g. one-off ear cleaner" });
    const err = errorLine();
    put(body, list,
      h("details.fold",
        h("summary", "Something else"),
        h("form.form.fold-body", { novalidate: true, onsubmit: (e) => {
          e.preventDefault();
          if (!other.value.trim()) { err.textContent = "Add the medicine's name."; return; }
          close(); quickLog("med", { name: other.value.trim() }, other.value.trim());
        } }, field("Medicine", other), err, h("button.btn.btn-line", { type: "submit" }, "Log it"))),
      h("button.btn.btn-line.wide", { type: "button", onclick: () => { close(); medSheet(); } }, "Set up a medicine"));
  });
}
export async function markGiven(m) {
  // Dose guard: once today's doses are all logged, an extra one needs a deliberate "yes".
  const st = medStatus(m);
  if (st.daily && st.given >= st.need) {
    const ok = await confirmBox(`${m.name}: already given today`, `${st.given} of ${st.need} logged today. Extra doses can be harmful. Only log another if your vet told you to.`, "Log another dose");
    if (!ok) return null;
  }
  const ev = { id: uid(), petId: m.petId, type: "med", at: Date.now(), medId: m.id, name: m.name };
  if (m.sample) ev.sample = true;
  try { await save("events", ev); } catch (e) { toast(saveError(e)); return null; }
  afterLog(ev, m.name);
  return ev;
}

export function medSheet(existing) {
  const p = pet();
  const m = existing || {};
  sheet(existing ? `Edit ${m.name}` : "Add a medicine", (body, close) => {
    const form = h("form.form", { novalidate: true });
    const err = errorLine();
    const name = textIn({ maxlength: "120", value: m.name || "", required: true, placeholder: "As on the label" });
    const dose = textIn({ maxlength: "300", value: m.dose || "", placeholder: "Copy it from the label" });
    const freq = h("select", Object.entries({ once: "Once a day", twice: "Twice a day", weekly: "Once a week", monthly: "Once a month", custom: "Every few days" }).map(([v, l]) => h("option", { value: v }, l)));
    freq.value = m.freq || "once";
    const every = h("input", { type: "number", inputmode: "numeric", min: "1", max: "365", value: m.everyDays || "2" });
    const everyF = field("Every how many days?", every);
    const t1 = h("input", { type: "time", value: (m.times && m.times[0]) || "08:00" });
    const t2 = h("input", { type: "time", value: (m.times && m.times[1]) || "20:00" });
    const t1F = field("Time", t1), t2F = field("Second time", t2);
    const start = h("input", { type: "date", value: m.start || isoDate(), required: true });
    const end = h("input", { type: "date", value: m.end || "" });
    const note = h("textarea", { rows: "2", maxlength: "1000", value: m.note || "" });
    const sync = () => {
      everyF.hidden = freq.value !== "custom";
      t2F.hidden = freq.value !== "twice";
      t1F.querySelector("label").textContent = freq.value === "twice" ? "First time" : "Time";
    };
    freq.addEventListener("change", sync);
    put(form,
      field("Medicine name", name),
      field("Dose, exactly as your vet wrote it", dose, "Nova's Pack never suggests a dose. If you're unsure, ask your vet."),
      field("How often", freq), everyF, h("div.two", t1F, t2F),
      h("div.two", field("Start", start), field(h("span", "End", opt()), end)),
      field(h("span", "Note", opt()), note),
      err,
      h("div.row-btns",
        existing ? h("button.btn.btn-line", { type: "button", onclick: () => { close(); deleteMed(m); } }, "Delete") : null,
        h("button.btn.btn-blue", { type: "submit" }, "Save")));
    sync();
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!name.value.trim()) { err.textContent = "Add the medicine's name."; name.focus(); return; }
      if (end.value && start.value && end.value < start.value) { err.textContent = "The end date is before the start date."; return; }
      const row = {
        ...m, id: m.id || uid(), petId: m.petId || p.id, name: name.value.trim(), dose: dose.value.trim() || undefined,
        freq: freq.value, times: freq.value === "twice" ? [t1.value || "08:00", t2.value || "20:00"] : [t1.value || "08:00"],
        everyDays: freq.value === "custom" ? Math.max(1, parseInt(every.value, 10) || 1) : undefined,
        start: start.value || isoDate(), end: end.value || undefined, note: note.value.trim() || undefined,
      };
      if (p.sample && !existing) row.sample = true;
      for (const k of Object.keys(row)) if (row[k] === undefined) delete row[k];
      try { await save("meds", row); } catch (ex) { err.textContent = saveError(ex); return; }
      close();
      toast(existing ? "Saved." : `${row.name} added. It shows under Health when it's due.`);
    });
    put(body, form);
  });
}
export async function deleteMed(m) {
  if (!(await confirmBox(`Delete ${m.name}?`, "Its 'given' history stays in the diary.", "Delete", true))) return;
  await remove("meds", m.id);
  toast("Medicine deleted.", [["Undo", () => save("meds", m)]]);
}

// ---------- calendar (.ics): your phone reminds you, we never message you ----------
export const CAL_NOTE = "Your phone reminds you. We never message you.";
export function calRecord(p, r) {
  if (!r.nextDue) { toast("Add a next due date first."); return; }
  ics.download(`${slug(p.name)}-${slug(r.name)}.ics`, ics.dueEvent({ uid: r.id, title: `${p.name}: ${r.name} due`, due: r.nextDue, note: r.note }));
  toast("Calendar file saved. Open it to add the reminder (alarm the day before).");
}
export function calMed(p, m) {
  ics.download(`${slug(p.name)}-${slug(m.name)}.ics`, ics.medEvents({ uid: m.id, title: `${p.name}: ${m.name}`, start: m.start || isoDate(), end: m.end, freq: m.freq, times: m.times, everyDays: m.everyDays, dose: m.dose }));
  toast("Calendar file saved. Open it to add repeating reminders.");
}
/** One .ics with every upcoming due date (vaccines, preventives, care routine). */
export function calAllDue(p) {
  const today = isoDate();
  const items = currentRecords(p.id).filter((r) => r.nextDue && r.nextDue >= today)
    .map((r) => ({ uid: r.id, title: `${p.name}: ${r.name} due`, due: r.nextDue, note: r.note }));
  for (const task of careTasksFor(p)) {
    const cs = careStatus(p, task, today);
    if (cs && cs.nextDue >= today) items.push({ uid: `care-${p.id}-${task.id}`, title: `${p.name}: ${task.name}`, due: cs.nextDue, note: task.what });
  }
  if (!items.length) { toast("Nothing with an upcoming due date yet."); return; }
  const recs = items;
  const parts = items.map((x) => ics.dueEvent(x).split("\r\n"));
  const head = parts[0].slice(0, parts[0].indexOf("BEGIN:VEVENT"));
  const events = parts.flatMap((ls) => ls.slice(ls.indexOf("BEGIN:VEVENT"), ls.lastIndexOf("END:VEVENT") + 1));
  ics.download(`${slug(p.name)}-due-dates.ics`, [...head, ...events, "END:VCALENDAR", ""].join("\r\n"));
  toast(`${recs.length} due date${recs.length === 1 ? "" : "s"} in one calendar file. Open it to add them all.`);
}
/** "Remind me in my calendar": ticked by itself once there's a (new) next-due date. */
function calendarTick(next, original) {
  let touched = false;
  const c = check("Remind me in my calendar", { onchange: () => { touched = true; } }, CAL_NOTE);
  const sync = () => {
    c.row.hidden = !next.value;
    if (!touched) c.input.checked = !!next.value && next.value !== (original || "");
  };
  return { row: c.row, input: c.input, sync };
}

// ---------- vaccines and preventives ----------
/** prefill: { kind, name, given, nextDue, note } for "Mark done". */
export function recordSheet(existing, prefill) {
  const p = pet();
  const r = existing || prefill || {};
  const sp = ["dog", "cat", "rabbit"].includes(p.species) ? p.species : "other";
  sheet(existing ? `Edit ${r.name}` : prefill ? `Done: ${prefill.name}` : "Add a vaccine or preventive", (body, close) => {
    const form = h("form.form", { novalidate: true });
    const err = errorLine();
    let kind = r.kind || "vaccine";
    const name = textIn({ maxlength: "120", value: r.name || "", required: true });
    const what = h("p.hint.what", { "aria-live": "polite" });
    const sugBox = h("div.chips-row", { role: "group", "aria-label": "Suggestions" });
    const showWhat = () => {
      const list = (kind === "vaccine" ? S.content.VACCINES : S.content.PREVENTIVES)[sp] || [];
      const hit = list.find((x) => x.name.toLowerCase() === name.value.trim().toLowerCase());
      what.textContent = hit ? hit.what : "";
    };
    const fillSug = () => {
      const list = (kind === "vaccine" ? S.content.VACCINES : S.content.PREVENTIVES)[sp] || [];
      sugBox.replaceChildren(...list.map((x) => h("button.chip", { type: "button", onclick: () => { name.value = x.name; showWhat(); } }, x.name)));
      sugBox.hidden = !list.length;
      showWhat();
    };
    name.addEventListener("input", showWhat);
    const given = h("input", { type: "date", value: r.given || isoDate(), max: isoDate() });
    const next = h("input", { type: "date", value: r.nextDue || "" });
    const cal = calendarTick(next, existing ? r.nextDue : "");
    next.addEventListener("input", cal.sync);
    next.addEventListener("change", cal.sync);
    const plus = (label, fn) => h("button.chip", { type: "button", onclick: () => { next.value = fn(given.value || isoDate()); cal.sync(); } }, label);
    put(form,
      prefill && prefill.note ? h("p.note-line.course-note", { role: "note" }, em("🩺"), " ", prefill.note) : null,
      segmented("kind", "Type", [["vaccine", "Vaccine"], ["preventive", "Preventive"]], kind, (v) => { kind = v; fillSug(); }),
      field("Name", name), what,
      h("div.sug", h("p.hint", "Suggestions only. Your vet decides your pet's schedule."), sugBox),
      h("div.two", field("Date given", given), field(h("span", "Next due", opt()), next)),
      h("div.chips-row", { role: "group", "aria-label": "Set next due from the date given" },
        plus("+1 month", (d) => addMonths(d, 1)), plus("+3 months", (d) => addMonths(d, 3)), plus("+1 year", (d) => addMonths(d, 12))),
      cal.row,
      field(h("span", "Note", opt()), h("textarea", { rows: "2", maxlength: "1000", value: r.note || "", name: "note" })),
      err,
      h("div.row-btns",
        existing ? h("button.btn.btn-line", { type: "button", onclick: () => { close(); deleteRecord(r); } }, "Delete") : null,
        h("button.btn.btn-blue", { type: "submit" }, "Save")));
    fillSug();
    cal.sync();
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!name.value.trim()) { err.textContent = "Add a name, or tap a suggestion."; name.focus(); return; }
      if (next.value && given.value && next.value < given.value) { err.textContent = "Next due is before the date given."; return; }
      const row = {
        id: existing ? r.id : uid(), petId: p.id, kind, name: name.value.trim(), given: given.value || isoDate(),
        nextDue: next.value || undefined, note: form.note.value.trim() || undefined,
      };
      if (p.sample) row.sample = true;
      for (const k of Object.keys(row)) if (row[k] === undefined) delete row[k];
      try { await save("records", row); } catch (ex) { err.textContent = saveError(ex); return; }
      close();
      if (cal.input.checked && row.nextDue) calRecord(p, row);
      else toast(existing ? "Saved." : `${row.name} saved.`, existing ? [] : [["Undo", () => remove("records", row.id)]]);
    });
    put(body, form);
  });
}
export function deleteRecord(r) {
  remove("records", r.id).then(() => toast("Deleted.", [["Undo", () => save("records", r)]]));
}
/**
 * Mark a due vaccine/preventive as done: same name, given today, next due after the same gap as last time.
 * If it was late or is part of a puppy or kitten course (recordDoneCheck), the sheet asks the owner to check with their vet.
 */
export function markRecordDone(rec) {
  const today = isoDate();
  let nextDue = "";
  if (rec.given && rec.nextDue) {
    const gap = daysBetween(rec.given, rec.nextDue);
    if (gap > 0) nextDue = gap % 365 === 0 ? addMonths(today, 12 * (gap / 365)) : addDays(today, gap);
  }
  const p = S.pets.find((x) => x.id === rec.petId) || pet();
  const chk = recordDoneCheck(rec, p, today);
  recordSheet(null, { kind: rec.kind, name: rec.name, given: today, nextDue, note: "" });
}

// ---------- care routine (suggestions from CARE_TASKS; each "done" is a { type: "care", task } diary entry) ----------
export function careTasksFor(p) {
  const T = S.content.CARE_TASKS || {};
  return (p && T[["dog", "cat", "rabbit"].includes(p.species) ? p.species : "other"]) || [];
}
export const careTask = (p, id) => careTasksFor(p).find((t) => t.id === id) || null;
/** Last done (ms) or null. A logged weight counts as a weigh-in. */
export function careLastDone(p, task) {
  const ev = eventsOf("care", p.id).find((e) => e.task === task.id);
  let at = ev ? ev.at : 0;
  if (task.id === "weigh") { const w = eventsOf("weight", p.id)[0]; if (w && w.at > at) at = w.at; }
  return at || null;
}
/** { last, nextDue, st } for a task that has been done at least once, else null. */
export function careStatus(p, task, today = isoDate()) {
  const last = careLastDone(p, task);
  if (!last) return null;
  const nextDue = addDays(isoDate(new Date(last)), Math.max(1, task.everyWeeks || 1) * 7);
  return { last, nextDue, st: recordStatus({ nextDue }, today) };
}
/** Care tasks due today or late, for Today's Due list. */
export function careDue(p) {
  return careTasksFor(p).map((task) => ({ task, cs: careStatus(p, task) }))
    .filter((x) => x.cs && (x.cs.st.state === "overdue" || x.cs.st.state === "today"))
    .map((x) => ({ kind: "care", task: x.task, st: x.cs.st, nextDue: x.cs.nextDue }));
}
export const everyText = (task) => (task.everyWeeks === 1 ? "Every week" : `Every ${task.everyWeeks} weeks`);

/** One tap: done now. A weigh-in opens the weight form instead (the weight is the point). */
export function markCareDone(p, task) {
  if (task.id === "weigh") { eventSheet("weight"); return null; }
  return quickLog("care", { task: task.id }, task.name);
}
/** Start tracking a task (when was it last done?), or change its last-done date. */
export function careSheet(task) {
  const p = pet();
  const lastEv = eventsOf("care", p.id).find((e) => e.task === task.id);
  sheet(lastEv ? `Edit: ${task.name}` : `Track: ${task.name}`, (body, close) => {
    const form = h("form.form", { novalidate: true });
    const err = errorLine();
    const last = h("input", { type: "date", max: isoDate(), value: lastEv ? isoDate(new Date(lastEv.at)) : isoDate() });
    const next = h("input", { type: "hidden" });
    const calc = () => { next.value = addDays(last.value || isoDate(), Math.max(1, task.everyWeeks || 1) * 7); };
    calc();
    const cal = calendarTick(next, "");
    last.addEventListener("change", () => { calc(); cal.sync(); });
    put(form,
      h("p.hint.what", task.what),
      field("Last done", last, `${everyText(task)} is a common rhythm. Suggestions only: your vet or groomer knows your pet best.`),
      cal.row,
      err,
      h("div.row-btns",
        lastEv ? h("button.btn.btn-line", { type: "button", onclick: () => { close(); stopCare(p, task); } }, "Stop tracking") : null,
        h("button.btn.btn-blue", { type: "submit" }, lastEv ? "Save" : "Start tracking")));
    cal.sync();
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      calc();
      const day = last.value || isoDate();
      const at = day === isoDate() ? Date.now() : new Date(`${day}T12:00`).getTime();
      const row = { ...(lastEv || {}), id: lastEv ? lastEv.id : uid(), petId: p.id, type: "care", task: task.id, at };
      if (p.sample) row.sample = true;
      try { await save("events", row); } catch (ex) { err.textContent = saveError(ex); return; }
      close();
      if (cal.input.checked) calCare(p, task, next.value);
      else toast(`${task.name}: next one ${fmtDate(next.value, { day: "numeric", month: "short" })}. It shows in Due when it's time.`);
    });
    put(body, form);
  });
}
async function stopCare(p, task) {
  const rows = eventsOf("care", p.id).filter((e) => e.task === task.id);
  if (!(await confirmBox(`Stop tracking ${task.name}?`, `This removes its ${rows.length} diary entr${rows.length === 1 ? "y" : "ies"}.`, "Stop tracking", true))) return;
  for (const r of rows) await remove("events", r.id, { quiet: true });
  refresh();
  toast(`Stopped tracking ${task.name}.`, [["Undo", async () => { for (const r of rows) await save("events", r, { quiet: true }); refresh(); }]]);
}
export function calCare(p, task, nextDue) {
  ics.download(`${slug(p.name)}-${slug(task.name)}.ics`, ics.dueEvent({ uid: `care-${p.id}-${task.id}`, title: `${p.name}: ${task.name}`, due: nextDue, note: task.what }));
  toast("Calendar file saved. Open it to add the reminder (alarm the day before).");
}
/** "Mark done" and "Edit" for vaccine and preventive records. */
export const doneRecord = (r) => markRecordDone(r);
export const editRecord = (r) => recordSheet(r);

// ---------- food and treats ----------
export function foodSheet(existing) {
  const p = pet();
  const f = existing || {};
  sheet(existing ? "Edit food" : "New food", (body, close) => {
    const form = h("form.form", { novalidate: true });
    const err = errorLine();
    const brand = textIn({ maxlength: "120", value: f.brand || "" });
    const product = textIn({ maxlength: "120", value: f.product || "", placeholder: "e.g. adult chicken kibble" });
    const amount = textIn({ maxlength: "120", value: f.amount || "", placeholder: "e.g. 300 g, split in 2 meals" });
    const since = h("input", { type: "date", value: f.since || isoDate(), max: isoDate() });
    const note = h("textarea", { rows: "2", maxlength: "1000", value: f.note || "" });
    put(form,
      field("Brand", brand), field("Product", product), field(h("span", "Amount per day", opt()), amount),
      field("Since", since), field(h("span", "Note", opt()), note, "Changing food? Most vets suggest mixing it in gradually over about a week."),
      err,
      h("div.row-btns",
        existing ? h("button.btn.btn-line", { type: "button", onclick: async () => { close(); await remove("foods", f.id); toast("Deleted.", [["Undo", () => save("foods", f)]]); } }, "Delete") : null,
        h("button.btn.btn-blue", { type: "submit" }, "Save")));
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!brand.value.trim() && !product.value.trim()) { err.textContent = "Add a brand or product."; brand.focus(); return; }
      const row = { ...f, id: f.id || uid(), petId: f.petId || p.id, kind: "food", brand: brand.value.trim() || undefined, product: product.value.trim() || undefined,
        amount: amount.value.trim() || undefined, since: since.value || isoDate(), note: note.value.trim() || undefined };
      if (p.sample && !existing) row.sample = true;
      for (const k of Object.keys(row)) if (row[k] === undefined) delete row[k];
      try {
        if (!existing) {
          // The old food ends where the new one starts.
          for (const old of forPet("foods").filter((x) => x.kind === "food" && !x.until)) await save("foods", { ...old, until: row.since }, { quiet: true });
        }
        await save("foods", row);
      } catch (ex) { err.textContent = saveError(ex); return; }
      close();
      toast(existing ? "Saved." : "Food updated. The old one is in the history.");
    });
    put(body, form);
  });
}
export function treatSheet(existing) {
  const p = pet();
  const t = existing || {};
  sheet(existing ? `Edit ${t.name}` : "Add a treat", (body, close) => {
    const form = h("form.form", { novalidate: true });
    const err = errorLine();
    const name = textIn({ maxlength: "120", value: t.name || "", placeholder: "e.g. dental chews" });
    const note = h("textarea", { rows: "2", maxlength: "1000", value: t.note || "" });
    put(form, field("Treat", name), field(h("span", "Note", opt()), note), err,
      h("div.row-btns",
        existing ? h("button.btn.btn-line", { type: "button", onclick: async () => { close(); await remove("foods", t.id); toast("Deleted.", [["Undo", () => save("foods", t)]]); } }, "Delete") : null,
        h("button.btn.btn-blue", { type: "submit" }, "Save")));
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!name.value.trim()) { err.textContent = "Add the treat's name."; name.focus(); return; }
      const row = { ...t, id: t.id || uid(), petId: t.petId || p.id, kind: "treat", name: name.value.trim(), inUse: t.inUse !== false, note: note.value.trim() || undefined };
      if (p.sample && !existing) row.sample = true;
      if (!row.note) delete row.note;
      try { await save("foods", row); } catch (ex) { err.textContent = saveError(ex); return; }
      close();
      toast("Saved.");
    });
    put(body, form);
  });
}

export function lastOf(type) { return eventsOf(type)[0] || null; }
