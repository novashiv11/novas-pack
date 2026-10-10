// Every form in the app: pets, quick logs, vaccines, medicines, food, treats, vet visits.
// Forms open in a bottom sheet (a <dialog>), except the first-run pet form which sits on the page.

import { S, pet, save, remove, setSetting, eventsOf, forPet, units, refresh } from "./state.js";
import { h, put, em, uid, sheet, toast, confirmBox, isoDate, addDays, addMonths, daysBetween, toLocalInput, fromLocalInput, resizePhoto, fmtTime } from "./util.js";
import { ALSO_NOTICED, scaleFor, skillsFor, medStatus, fromUnit, toUnit, poopAlerts, medIsActive } from "./logic.js";

export const SPECIES = [
  { id: "dog", label: "Dog", emoji: "🐶" },
  { id: "cat", label: "Cat", emoji: "🐱" },
  { id: "rabbit", label: "Rabbit", emoji: "🐰" },
  { id: "bird", label: "Bird", emoji: "🐦" },
  { id: "other", label: "Other", emoji: "🐾" },
];
export const speciesOf = (id) => SPECIES.find((s) => s.id === id) || SPECIES[4];

export const TYPES = {
  poop: { emoji: "💩", label: "Poop" },
  meal: { emoji: "🍽️", label: "Meal" },
  treat: { emoji: "🦴", label: "Treat" },
  med: { emoji: "💊", label: "Medicine" },
  walk: { emoji: "🚶", label: "Walk" },
  training: { emoji: "🎓", label: "Training" },
  weight: { emoji: "⚖️", label: "Weight" },
  vet: { emoji: "🩺", label: "Vet visit" },
};

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
function segmented(name, legend, items, value, onchange) {
  const box = h("div.seg-radio");
  items.forEach(([v, label]) => {
    const id = fid();
    const inp = h("input", { type: "radio", name, id, value: v, checked: v === value, onchange: () => onchange && onchange(v) });
    box.append(inp, h("label", { for: id }, label));
  });
  return h("fieldset.fs", h("legend", legend), box);
}
const radioVal = (form, name) => { const r = form.querySelector(`input[name="${name}"]:checked`); return r ? r.value : null; };
export const slug = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "pet";

// ---------- pets ----------

/** Builds the add/edit pet form into `box`. Calls onSaved(pet) after saving. */
export function petForm(box, existing, onSaved) {
  const p = existing || {};
  let photo = p.photo || null;
  const form = h("form.form", { novalidate: true });
  const name = textIn({ name: "name", maxlength: "40", required: true, value: p.name || "", autocomplete: "off", placeholder: "e.g. Nova" });
  const speciesBox = h("div.species.pick");
  SPECIES.forEach((s) => {
    const id = fid();
    speciesBox.append(
      h("input", { type: "radio", name: "species", id, value: s.id, checked: (p.species || "dog") === s.id }),
      h("label", { for: id }, em(s.emoji), " ", s.label));
  });
  const birthday = h("input", { type: "date", name: "birthday", max: isoDate(), value: p.birthday || "" });
  const preview = h("img.photo-preview", { alt: "", hidden: !photo, src: photo || undefined, width: "72", height: "72" });
  const removePhoto = h("button.linkish", { type: "button", hidden: !photo, onclick: () => { photo = null; preview.hidden = true; removePhoto.hidden = true; file.value = ""; } }, "Remove photo");
  const file = h("input", { type: "file", accept: "image/*", name: "photo" });
  const photoMsg = h("p.hint", { role: "status" });
  file.addEventListener("change", async () => {
    const f = file.files && file.files[0];
    if (!f) return;
    try {
      photo = await resizePhoto(f, 512);
      preview.src = photo; preview.hidden = false; removePhoto.hidden = false;
      photoMsg.textContent = "Photo ready. Resized on your phone, location data removed.";
    } catch { photoMsg.textContent = "Couldn't read that photo. Try a JPG or PNG."; }
  });
  const weight = h("input", { type: "number", name: "weight", inputmode: "decimal", min: "0", max: "2000", step: "0.1" });
  const err = errorLine();

  put(form, 
    field("Name", name),
    h("fieldset.fs", h("legend", "Species"), speciesBox),
    field(h("span", "Birthday", opt()), birthday, "A guess is fine."),
    h("div.field",
      h("label", { for: file.id || (file.id = fid()) }, "Photo", opt()),
      h("div.photo-row", preview, h("div", file, removePhoto)),
      h("p.hint", "Stays on this device. We shrink it and strip location data."),
      photoMsg),
    existing ? null : field(h("span", `Weight in ${units()}`, opt()), weight),
    err,
    h("button.btn.btn-blue.wide", { type: "submit" }, existing ? "Save changes" : "Add pet"),
  );
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nm = name.value.trim();
    if (!nm) { err.textContent = "Please add a name."; name.setAttribute("aria-invalid", "true"); name.focus(); return; }
    const row = {
      ...p, id: p.id || uid(), name: nm.slice(0, 40), species: radioVal(form, "species") || "dog",
      birthday: birthday.value || undefined, photo: photo || undefined, createdAt: p.createdAt || Date.now(),
      training: p.training || {},
    };
    if (!row.birthday) delete row.birthday;
    if (!row.photo) delete row.photo;
    try {
      const first = !S.pets.some((x) => !x.sample);
      await save("pets", row, { quiet: true });
      const w = parseFloat(weight.value);
      if (!existing && w > 0) await save("events", { id: uid(), petId: row.id, type: "weight", at: Date.now(), kg: fromUnit(w, units()) }, { quiet: true });
      await setSetting("currentPet", row.id);
      if (first && !S.settings.firstUse) await setSetting("firstUse", Date.now());
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
      onSaved(row);
    } catch {
      err.textContent = "Couldn't save on this device. If you're in private browsing, open the app in a normal tab.";
    }
  });
  box.append(form);
  return form;
}
export function openPetSheet(existing) {
  sheet(existing ? `Edit ${existing.name}` : "Add a pet", (body, close) => {
    petForm(body, existing, (row) => {
      close();
      toast(existing ? "Saved." : `${row.name} added.`);
      if (!existing && location.hash !== "#/today") location.hash = "#/today"; else refresh();
    });
  });
}

// ---------- quick logs ----------

/** Log something in one tap, with Undo and Details in the toast. */
export async function quickLog(type, fields = {}) {
  const p = pet();
  if (!p) return;
  const ev = { id: uid(), petId: p.id, type, at: Date.now(), ...fields };
  if (p.sample) ev.sample = true;
  try { await save("events", ev); } catch { toast("Couldn't save. Is storage blocked?"); return; }
  const t = TYPES[type];
  toast(`${t.label} logged at ${fmtTime(ev.at)}.`, [
    ["Undo", () => remove("events", ev.id).then(() => toast("Undone."))],
    ["Details", () => eventSheet(type, ev)],
  ]);
}

export function logMeal() {
  const cur = forPet("foods").find((f) => f.kind === "food" && !f.until);
  quickLog("meal", cur ? { name: [cur.brand, cur.product].filter(Boolean).join(" ") } : {});
}
export function logTreat() {
  const inUse = forPet("foods").filter((f) => f.kind === "treat" && f.inUse !== false);
  if (inUse.length <= 1) { quickLog("treat", inUse[0] ? { name: inUse[0].name } : {}); return; }
  sheet("Which treat?", (body, close) => {
    put(body, h("div.choice-grid", inUse.map((t) =>
      h("button.choice", { type: "button", onclick: () => { close(); quickLog("treat", { name: t.name }); } }, em("🦴"), t.name)),
    h("button.choice", { type: "button", onclick: () => { close(); quickLog("treat"); } }, em("➕"), "Something else")));
  });
}
export function logWalk() { quickLog("walk"); }

/** The form for any diary entry, new or existing. */
export function eventSheet(type, existing) {
  const p = pet();
  if (!p) return;
  const ev = existing || {};
  const t = TYPES[type];
  sheet(existing ? `Edit ${t.label.toLowerCase()}` : `Log ${type === "poop" ? "a poop" : t.label.toLowerCase()}`, (body, close) => {
    const form = h("form.form", { novalidate: true });
    const err = errorLine();
    const when = h("input", { type: "datetime-local", value: toLocalInput(ev.at || Date.now()), max: toLocalInput(Date.now() + 3600000), required: true });
    const note = h("textarea", { rows: "2", maxlength: "1000", value: ev.note || "" });
    const parts = [];
    let collect = () => ({});

    if (type === "poop") {
      const scaleBox = h("div.scale");
      const hint = h("p.hint.scale-hint", { "aria-live": "polite" });
      S.content.POOP_SCALE.forEach((s) => {
        const id = fid();
        const inp = h("input", { type: "radio", name: "score", id, value: String(s.score), checked: ev.score === s.score,
          onchange: () => { hint.textContent = s.hint; } });
        scaleBox.append(inp, h("label", { for: id }, h("span.em", { "aria-hidden": "true" }, s.emoji), h("span.sc-n", String(s.score)), h("span.sc-l", s.label)));
      });
      if (ev.score) hint.textContent = (scaleFor(ev.score) || {}).hint || "";
      const flags = new Set(ev.flags || []);
      const checks = (list) => h("div.checks", list.map((f) => {
        const id = fid();
        return h("div.check", h("input", { type: "checkbox", id, value: f.id, checked: flags.has(f.id) }), h("label", { for: id }, f.label));
      }));
      parts.push(
        h("fieldset.fs", h("legend", "How did it look?"), scaleBox, hint),
        h("fieldset.fs", h("legend", "Anything unusual?", opt()), checks(S.content.POOP_FLAGS)),
        h("fieldset.fs", h("legend", "Also noticed today", opt()), checks(ALSO_NOTICED)),
      );
      collect = () => {
        const sc = radioVal(form, "score");
        if (!sc) return { error: "Pick how it looked (1 to 5)." };
        return { score: Number(sc), flags: [...form.querySelectorAll(".checks input:checked")].map((c) => c.value) };
      };
    }

    if (type === "meal" || type === "treat") {
      const nameIn = textIn({ maxlength: "120", value: ev.name || "", placeholder: type === "meal" ? "e.g. breakfast, kibble" : "e.g. dental chew" });
      const amount = textIn({ maxlength: "120", value: ev.amount || "", placeholder: "e.g. 1 cup, 150 g" });
      parts.push(field(h("span", type === "meal" ? "What" : "Which treat", opt()), nameIn), field(h("span", "How much", opt()), amount));
      const inUse = forPet("foods").filter((f) => f.kind === "treat" && f.inUse !== false);
      if (type === "treat" && inUse.length) {
        parts.push(h("div.chips-row", { role: "group", "aria-label": "Treats in use" }, inUse.map((f) =>
          h("button.chip", { type: "button", onclick: () => { nameIn.value = f.name; } }, f.name))));
      }
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
      const u = units();
      const w = h("input", { type: "number", inputmode: "decimal", min: "0", step: "0.1", required: true, value: ev.kg ? String(Math.round(toUnit(ev.kg, u) * 10) / 10) : "" });
      parts.push(field(`Weight in ${u}`, w));
      collect = () => { const v = parseFloat(w.value); return v > 0 ? { kg: fromUnit(v, u) } : { error: "Enter a weight above 0." }; };
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
        h("button.btn.btn-blue", { type: "submit" }, "Save")),
    );
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const extra = collect();
      if (extra.error) { err.textContent = extra.error; return; }
      const row = { ...ev, ...extra, id: ev.id || uid(), petId: ev.petId || p.id, type, at: fromLocalInput(when.value), note: note.value.trim() || undefined };
      for (const k of Object.keys(row)) if (row[k] === undefined) delete row[k];
      if (p.sample && !existing) row.sample = true;
      try { await save("events", row); } catch { err.textContent = "Couldn't save on this device."; return; }
      close();
      if (type === "poop" && poopAlerts(p).length) {
        toast("Poop logged. Please read Nova's note about calling your vet.");
        // After the sheet's own close handler has returned focus, move it to the vet note.
        setTimeout(() => { const a = document.getElementById("vet-alert"); if (a) { a.scrollIntoView({ block: "center" }); a.focus({ preventScroll: true }); } }, 80);
      } else if (!existing) {
        toast(`${t.label} logged.`, [["Undo", () => remove("events", row.id)]]);
      } else toast("Saved.");
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
        h("button.btn.btn-gold.sm", { type: "button", onclick: () => { close(); markGiven(m); } }, "Mark given")));
    });
    const other = textIn({ maxlength: "120", placeholder: "e.g. one-off ear cleaner" });
    const err = errorLine();
    put(body, list,
      h("details.mini",
        h("summary", "Something else"),
        h("form.form", { novalidate: true, onsubmit: (e) => {
          e.preventDefault();
          if (!other.value.trim()) { err.textContent = "Add the medicine's name."; return; }
          close(); quickLog("med", { name: other.value.trim() });
        } }, field("Medicine", other), err, h("button.btn.btn-line", { type: "submit" }, "Log it"))),
      h("button.btn.btn-blue.wide", { type: "button", onclick: () => { close(); medSheet(); } }, "Set up a medicine"));
  });
}
export async function markGiven(m) {
  const ev = { id: uid(), petId: m.petId, type: "med", at: Date.now(), medId: m.id, name: m.name };
  if (m.sample) ev.sample = true;
  await save("events", ev);
  toast(`${m.name}: given at ${fmtTime(ev.at)}.`, [["Undo", () => remove("events", ev.id)]]);
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
        existing ? h("button.btn.btn-line", { type: "button", onclick: async () => {
          if (!(await confirmBox(`Delete ${m.name}?`, "Its 'given' history stays in the diary.", "Delete", true))) return;
          close(); await remove("meds", m.id); toast("Medicine deleted.", [["Undo", () => save("meds", m)]]);
        } }, "Delete") : null,
        h("button.btn.btn-blue", { type: "submit" }, "Save")),
    );
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
      for (const k of Object.keys(row)) if (row[k] === undefined) delete row[k];
      await save("meds", row);
      close();
      toast(existing ? "Saved." : `${row.name} added. It shows on Today when it's due.`);
    });
    put(body, form);
  });
}

// ---------- vaccines and preventives ----------
/** prefill: { kind, name, given, nextDue } for "mark done". */
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
    const plus = (label, fn) => h("button.chip", { type: "button", onclick: () => { next.value = fn(given.value || isoDate()); } }, label);
    put(form, 
      segmented("kind", "Type", [["vaccine", "💉 Vaccine"], ["preventive", "🛡️ Preventive"]], kind, (v) => { kind = v; fillSug(); }),
      field("Name", name), what,
      h("div.sug", h("p.hint", "Suggestions only. Your vet decides your pet's schedule."), sugBox),
      h("div.two", field("Date given", given), field(h("span", "Next due", opt()), next)),
      h("div.chips-row", { role: "group", "aria-label": "Set next due from the date given" },
        plus("+1 month", (d) => addMonths(d, 1)), plus("+3 months", (d) => addMonths(d, 3)), plus("+1 year", (d) => addMonths(d, 12))),
      field(h("span", "Note", opt()), h("textarea", { rows: "2", maxlength: "1000", value: r.note || "", name: "note" })),
      err,
      h("div.row-btns",
        existing ? h("button.btn.btn-line", { type: "button", onclick: async () => {
          close(); await remove("records", r.id); toast("Deleted.", [["Undo", () => save("records", r)]]);
        } }, "Delete") : null,
        h("button.btn.btn-blue", { type: "submit" }, "Save")),
    );
    fillSug();
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
      await save("records", row);
      close();
      toast(existing ? "Saved." : `${row.name} saved.`, existing ? [] : [["Undo", () => remove("records", row.id)]]);
    });
    put(body, form);
  });
}
/** Mark a due vaccine/preventive as done: same name, given today, next due after the same gap as last time. */
export function markRecordDone(rec) {
  const today = isoDate();
  let nextDue = "";
  if (rec.given && rec.nextDue) {
    const gap = daysBetween(rec.given, rec.nextDue);
    if (gap > 0) nextDue = gap % 365 === 0 ? addMonths(today, 12 * (gap / 365)) : addDays(today, gap);
  }
  recordSheet(null, { kind: rec.kind, name: rec.name, given: today, nextDue });
}

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
        h("button.btn.btn-blue", { type: "submit" }, "Save")),
    );
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!brand.value.trim() && !product.value.trim()) { err.textContent = "Add a brand or product."; brand.focus(); return; }
      const row = { ...f, id: f.id || uid(), petId: f.petId || p.id, kind: "food", brand: brand.value.trim() || undefined, product: product.value.trim() || undefined,
        amount: amount.value.trim() || undefined, since: since.value || isoDate(), note: note.value.trim() || undefined };
      if (p.sample && !existing) row.sample = true;
      for (const k of Object.keys(row)) if (row[k] === undefined) delete row[k];
      if (!existing) {
        // The old food ends where the new one starts.
        for (const old of forPet("foods").filter((x) => x.kind === "food" && !x.until)) await save("foods", { ...old, until: row.since }, { quiet: true });
      }
      await save("foods", row);
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
      await save("foods", row);
      close();
      toast("Saved.");
    });
    put(body, form);
  });
}

export function lastOf(type) { return eventsOf(type)[0] || null; }
