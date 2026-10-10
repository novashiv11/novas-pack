// More: settings-style rows (Pets, Profile and contacts, Units, Backup, Install, Pack Card, Privacy, Delete all)
// and their sub-pages (#/more/<page>).

import { S, pet, setSetting, wipe, load, refresh, units, UI } from "../state.js";
import { h, put, toast, confirmBox, fmtDate, isoDate, ageText, telHref, shareOrSave } from "../util.js";
import { exportData, validateBackup, importData } from "../db.js";
import { installCard, isStandalone } from "../install.js";
import { openPetSheet, speciesOf, segmented, deletePetFlow } from "../forms.js";
import { pageHead, subBar, avatar, chevron } from "./parts.js";

export const APP_VERSION = "1.1";
const CARD_SPECIES = { dog: "dog", cat: "cat", rabbit: "small", bird: "bird", other: "other" };

export function cardLink(p) {
  return `card.html?name=${encodeURIComponent(p.name.slice(0, 20))}&species=${CARD_SPECIES[p.species] || "other"}`;
}

/** "Back up now": the share sheet where the phone can take a file (Save to Files, email, Drive), else a download. */
export async function exportBackup() {
  try {
    const data = await exportData();
    const how = await shareOrSave(`novas-pack-backup-${isoDate()}.json`, JSON.stringify(data, null, 1), "application/json", "Nova's Pack backup");
    if (how === "cancelled") return;
    await setSetting("lastBackup", Date.now(), { quiet: false });
    toast(how === "shared" ? "Backup shared. Keep it somewhere safe, like your email or cloud drive." : "Backup saved to your downloads. Keep a copy in your email or cloud drive.");
  } catch { toast("Couldn't make the backup file."); }
}

const PAGES = { pets, profile, units: unitsPage, backup, install, sources };

export function more(main, arg) {
  if (PAGES[arg]) { PAGES[arg](main); return; }
  const p = pet();
  const u = units();
  const row = (icon, label, value, href, k) => h("li", h("a.set-row", { href, "data-k": k },
    h("span.set-ico", { "aria-hidden": "true" }, icon), h("span.set-label", label), value ? h("span.set-value", value) : null, chevron()));
  const sample = S.pets.find((x) => x.sample);
  put(main,
    pageHead("More"),
    UI.applyUpdate ? h("aside.nudge", h("p", h("b", "Update ready."), " Same diary, fresh paint."),
      h("div.row-btns.left", h("button.btn.btn-blue.sm", { type: "button", onclick: () => UI.applyUpdate() }, "Update now"))) : null,
    h("section.set-group", { "aria-labelledby": "g-pets" },
      h("h2.set-h", { id: "g-pets" }, "Your pets"),
      h("ul.set-list",
        row("🐾", "Pets", String(S.pets.length), "#/more/pets", "m-pets"),
        row("📇", "Profile and contacts", p ? p.name : "", "#/more/profile", "m-profile"))),
    h("section.set-group", { "aria-labelledby": "g-app" },
      h("h2.set-h", { id: "g-app" }, "App"),
      h("ul.set-list",
        row("⚖️", "Units", u, "#/more/units", "m-units"),
        row("💾", "Backup", S.settings.lastBackup ? fmtDate(S.settings.lastBackup, { day: "numeric", month: "short" }) : "Never", "#/more/backup", "m-backup"),
        row("📲", "Install", isStandalone() ? "Installed" : "", "#/more/install", "m-install"))),
    h("section.set-group", { "aria-labelledby": "g-pack" },
      h("h2.set-h", { id: "g-pack" }, "Nova's Pack"),
      h("ul.set-list",
        p ? row("🪪", "Pack Card", p.name, cardLink(p), "m-card") : null,
        row("🔒", "Privacy", "", "privacy.html", "m-privacy"),
        S.content.SOURCES.length ? row("📚", "Where the care info comes from", "", "#/more/sources", "m-sources") : null,
        h("li", h("a.set-row", { href: "https://www.instagram.com/novathehumanhandler/", rel: "noopener" },
          h("span.set-ico", { "aria-hidden": "true" }, "📸"), h("span.set-label", "Follow Nova on Instagram"), chevron())))),
    h("section.set-group", { "aria-labelledby": "g-del" },
      h("h2.set-h", { id: "g-del" }, "Delete"),
      h("ul.set-list",
        sample ? h("li", h("button.set-row", { type: "button", "data-k": "m-del-sample", onclick: () => deletePetFlow(sample) },
          h("span.set-ico", { "aria-hidden": "true" }, "🧹"), h("span.set-label", "Delete the sample diary"), chevron())) : null,
        h("li", h("button.set-row.danger", { type: "button", "data-k": "wipe", onclick: deleteAll },
          h("span.set-ico", { "aria-hidden": "true" }, "🗑️"), h("span.set-label", "Delete all data"), chevron())))),
    h("p.small.muted.version", `Nova's Pack ${APP_VERSION} · No account, no tracking. Your diary never leaves this device.`),
  );
}

// ---------- sub-pages ----------
function pets(main) {
  put(main,
    subBar("Pets", "#/more", "Back to More"),
    h("ul.set-list.pet-rows", S.pets.map((p) => h("li",
      h("button.set-row.pet-row", { type: "button", "data-k": `edit-pet-${p.id}`, onclick: () => openPetSheet(p) },
        avatar(p, 40),
        h("span.set-label", h("b", p.name), h("span.small.muted.block", [p.sample ? "Sample" : "", speciesOf(p.species).label, ageText(p.birthday)].filter(Boolean).join(" · "))),
        h("span.vh", ", edit"), chevron())))),
    h("div.top-actions", h("button.btn.btn-blue", { type: "button", "data-k": "add-pet", onclick: () => openPetSheet() }, "Add a pet")),
    h("p.small.muted", "Tap a pet to edit, add a photo, or delete."));
}

function profile(main) {
  const p = pet();
  const v = p.vet || {}, ins = p.insurer || {}, chip = p.microchip || {};
  const call = (num) => (telHref(num) ? h("a.call-link", { href: telHref(num) }, num) : num);
  const item = (k, ...val) => {
    const has = val.some((x) => x);
    return h("div.pf-row", h("dt", k), h("dd", has ? val.filter(Boolean).flatMap((x, i) => (i ? [" · ", x] : [x])) : h("span.muted", "Not added")));
  };
  const neu = p.neutered;
  put(main,
    subBar("Profile and contacts", "#/more", "Back to More"),
    h("p.pf-for", avatar(p, 32), h("span", "For ", h("b", p.name))),
    h("section.sec", { "aria-labelledby": "pf-vet" }, h("h2.sec-title", { id: "pf-vet" }, "Vet and insurance"),
      h("dl.pf-list",
        item("Vet", v.name, v.phone ? call(v.phone) : ""),
        item("Emergency vet", v.emergencyPhone ? call(v.emergencyPhone) : ""),
        item("Insurer", ins.name, ins.policy ? `policy ${ins.policy}` : "", ins.renewal ? `renews ${fmtDate(ins.renewal)}` : ""))),
    h("section.sec", { "aria-labelledby": "pf-chip" }, h("h2.sec-title", { id: "pf-chip" }, "Microchip"),
      h("dl.pf-list",
        item("Number", chip.number), item("Registry", chip.registry),
        item("Details checked", chip.checkedOn ? fmtDate(chip.checkedOn) : ""))),
    h("section.sec", { "aria-labelledby": "pf-health" }, h("h2.sec-title", { id: "pf-health" }, "Health notes"),
      h("dl.pf-list",
        item("Sex", p.sex === "male" ? "Male" : p.sex === "female" ? "Female" : ""),
        item("Neutered", neu ? (neu.yes ? `Yes${neu.date ? `, ${fmtDate(neu.date)}` : ""}` : "No") : ""),
        ["dog", "cat", "rabbit"].includes(p.species) && !(neu && neu.yes) && p.sex !== "male" ? item("Last season", p.lastSeason ? fmtDate(p.lastSeason) : "") : null,
        item("Allergies", p.allergies), item("Conditions", p.conditions))),
    h("div.top-actions", h("button.btn.btn-blue", { type: "button", "data-k": "edit-profile", onclick: () => openPetSheet(p, { openProfile: true }) }, "Edit profile")),
    h("p.small.muted", "It's on the vet summary, and the vet's numbers show as call buttons if Nova ever says to call. Stays on this device."));
}

function unitsPage(main) {
  put(main,
    subBar("Units", "#/more", "Back to More"),
    h("div.sec", segmented("units", "Weight units", [["kg", "Kilograms (kg)"], ["lb", "Pounds (lb)"]], units(), (x) => setSetting("units", x, { quiet: false }))));
}

function backup(main) {
  const persisted = h("span", "Checking…");
  if (navigator.storage && navigator.storage.persisted) {
    navigator.storage.persisted().then((v) => { persisted.textContent = v ? "Protected: your browser won't clear it to free up space." : "Not protected yet. Install the app and back up now and then."; }).catch(() => { persisted.textContent = "Unknown."; });
  } else persisted.textContent = "Unknown on this browser. Back up now and then.";
  put(main,
    subBar("Backup", "#/more", "Back to More"),
    h("section.sec",
      h("p", "Your diary lives only on this device. A backup is one file you keep in your email or cloud drive, and import on a new phone."),
      h("p.small.muted", S.settings.lastBackup ? `Last backup: ${fmtDate(S.settings.lastBackup)}.` : "No backup yet."),
      h("p.small.muted", h("b", "Storage: "), persisted),
      h("button.btn.btn-blue", { type: "button", "data-k": "export", onclick: exportBackup }, "Back up now")),
    h("details.more-box", h("summary", "Import a backup"), importForm("merge")));
}

function install(main) {
  let card = null;
  try { card = installCard(); } catch { card = null; }
  put(main,
    subBar("Install the app", "#/more", "Back to More"),
    h("section.sec",
      isStandalone() ? h("p", "Installed. Nice. Your diary opens like an app and works offline.")
        : h("p", "Free, no app store. Installed, it opens like an app, works offline, and your phone is less likely to clear it."),
      card,
      isStandalone() ? null : h("ul.install-steps",
        h("li", h("b", "iPhone or iPad (Safari): "), "tap Share, then ", h("b", "Add to Home Screen"), "."),
        h("li", h("b", "Android (Chrome): "), "tap the ⋮ menu, then ", h("b", "Install app"), " or ", h("b", "Add to Home screen"), "."))));
}

function sources(main) {
  put(main,
    subBar("Sources", "#/more", "Back to More"),
    h("p.small.muted", "Where the care info comes from. General information only: your vet decides your pet's care."),
    h("ul.src-list", S.content.SOURCES.map((s) => h("li", h("a", { href: s.url, rel: "noopener" }, s.title)))));
}

/** The import form (More → Backup, and "Restore a backup" on the first-run screen). */
export function importForm(defaultMode) {
  const file = h("input", { type: "file", id: "imp-file", accept: "application/json,.json" });
  const msg = h("p.form-error", { role: "alert" });
  const form = h("form.form", { novalidate: true, onsubmit: (e) => { e.preventDefault(); importFile(file, form, msg); } },
    h("div.field", h("label", { for: "imp-file" }, "Backup file (.json)"), file),
    S.pets.length ? segmented("mode", "When importing", [["merge", "Merge"], ["replace", "Replace"]], defaultMode) : null,
    S.pets.length ? h("p.hint", "Merge adds it to what's here. Replace wipes this device first.") : null,
    msg,
    h("button.btn.btn-line", { type: "submit", "data-k": "imp-go" }, "Import backup"));
  return form;
}

async function deleteAll() {
  if (!(await confirmBox("Delete all data?", "Every pet, entry and setting on this device will be deleted, including your Pack Card choices and streak. This can't be undone.", "Delete everything", true))) return;
  await wipe();
  toast("Everything deleted from this device.");
  location.hash = "#/welcome";
  refresh();
}

async function importFile(file, form, msg) {
  msg.textContent = "";
  const f = file.files && file.files[0];
  if (!f) { msg.textContent = "Choose a backup file first."; return; }
  if (f.size > 25e6) { msg.textContent = "That file is too big to be a Nova's Pack backup."; return; }
  let parsed;
  try { parsed = JSON.parse(await f.text()); } catch { msg.textContent = "That file isn't a readable backup (not JSON)."; return; }
  const v = validateBackup(parsed);
  if (!v.ok) { msg.textContent = v.error; return; }
  const picked = form.querySelector('input[name="mode"]:checked');
  const mode = picked ? picked.value : "replace";
  const c = v.counts;
  const what = `${c.pets} pet${c.pets === 1 ? "" : "s"}, ${c.events} diary entries, ${c.records} vaccines and preventives, ${c.meds} medicines, ${c.foods} foods and treats.`;
  const ok = !S.pets.length || await confirmBox(mode === "replace" ? "Replace everything?" : "Merge this backup?",
    `${what}${v.skipped ? ` ${v.skipped} damaged rows will be skipped.` : ""} ${mode === "replace" ? "Everything on this device will be replaced." : "Entries with the same ID are updated from the backup."}`,
    mode === "replace" ? "Replace" : "Merge", mode === "replace");
  if (!ok) return;
  try {
    await importData(v.data, mode);
    await load();
    if (!S.pets.some((p) => p.id === S.settings.currentPet) && S.pets[0]) await setSetting("currentPet", S.pets[0].id);
    toast(`Backup imported: ${what}`);
    location.hash = "#/today";
    refresh();
  } catch { msg.textContent = "Import failed, so nothing was changed."; }
}
