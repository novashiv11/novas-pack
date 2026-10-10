// More: pets, units, backup and restore, install help, delete everything, links.

import { S, pet, setSetting, removePet, wipe, load, refresh, units } from "../state.js";
import { h, put, em, toast, confirmBox, fmtDate, isoDate, ageText } from "../util.js";
import { exportData, validateBackup, importData } from "../db.js";
import { download } from "../ics.js";
import { openPetSheet, speciesOf } from "../forms.js";
import { pageHead, avatar, deleteSample } from "./parts.js";

export const APP_VERSION = "1.0";
const CARD_SPECIES = { dog: "dog", cat: "cat", rabbit: "small", bird: "bird", other: "other" };

export function isStandalone() {
  return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
}
export function cardLink(p) {
  return `card.html?name=${encodeURIComponent(p.name.slice(0, 20))}&species=${CARD_SPECIES[p.species] || "other"}`;
}

export async function exportBackup() {
  try {
    const data = await exportData();
    download(`novas-pack-backup-${isoDate()}.json`, JSON.stringify(data, null, 1), "application/json");
    await setSetting("lastBackup", Date.now(), { quiet: false });
    toast("Backup saved to your downloads. Keep it somewhere safe, like your cloud drive or email.");
  } catch { toast("Couldn't make the backup file."); }
}

export function more(main, arg) {
  const u = units();
  const persisted = h("span", "Checking…");
  if (navigator.storage && navigator.storage.persisted) {
    navigator.storage.persisted().then((v) => { persisted.textContent = v ? "Protected: your browser won't clear it to free up space." : "Not protected yet. Install the app (below) and back up now and then."; }).catch(() => { persisted.textContent = "Unknown."; });
  } else persisted.textContent = "Unknown on this browser. Back up now and then.";

  const impForm = importForm("merge");

  const installBtn = S.installPrompt ? h("button.btn.btn-blue", { type: "button", onclick: async () => {
    const ev = S.installPrompt; S.installPrompt = null;
    ev.prompt();
    try { await ev.userChoice; } catch { /* ignore */ }
    refresh();
  } }, "Install Nova's Pack") : null;

  put(main, 
    pageHead("More"),
    h("section.sec", { "aria-labelledby": "h-pets" },
      h("div.sec-row", h("h2.sec-title", { id: "h-pets" }, "Pets"),
        h("button.btn.btn-blue.sm", { type: "button", "data-k": "add-pet", onclick: () => openPetSheet() }, "Add a pet")),
      h("ul.pet-list", S.pets.map((p) => h("li.card.pet-row",
        h("div.pet-row-top", avatar(p, 48), h("div",
          h("h3", p.name, p.sample ? h("span.sample-tag", "SAMPLE") : null),
          h("p.small.muted", [speciesOf(p.species).label, ageText(p.birthday)].filter(Boolean).join(" · ")))),
        h("div.row-btns.left",
          h("button.btn.btn-line.sm", { type: "button", "data-k": `edit-pet-${p.id}`, onclick: () => openPetSheet(p) }, "Edit", h("span.vh", ` ${p.name}`)),
          h("a.btn.btn-line.sm", { href: cardLink(p) }, "Make a Pack Card", h("span.vh", ` for ${p.name}`)),
          h("button.btn.btn-line.sm", { type: "button", onclick: () => (p.sample ? deleteSample() : deletePet(p)) }, "Delete", h("span.vh", ` ${p.name}`))))))),
    h("section.sec", { "aria-labelledby": "h-units" },
      h("h2.sec-title", { id: "h-units" }, "Units"),
      h("div.seg-btns", { role: "group", "aria-label": "Weight units" }, [["kg", "Kilograms (kg)"], ["lb", "Pounds (lb)"]].map(([x, l]) =>
        h("button", { type: "button", "aria-pressed": String(x === u), "data-k": `units-${x}`, onclick: () => setSetting("units", x, { quiet: false }) }, l)))),
    h("section.sec", { id: "backup", "aria-labelledby": "h-backup" },
      h("h2.sec-title", { id: "h-backup" }, em("💾"), " Backup"),
      h("p", "Your diary lives only on this device. A backup is one file you can keep in your email or cloud drive, and import on a new phone."),
      h("p.small.muted", S.settings.lastBackup ? `Last backup: ${fmtDate(S.settings.lastBackup)}.` : "No backup yet."),
      h("p.small.muted", h("b", "Storage: "), persisted),
      h("button.btn.btn-blue", { type: "button", "data-k": "export", onclick: exportBackup }, "Export backup"),
      h("details.more-box", h("summary", "Import a backup"), impForm)),
    h("section.sec", { id: "install", "aria-labelledby": "h-install" },
      h("h2.sec-title", { id: "h-install" }, em("📲"), " Install the app"),
      isStandalone() ? h("p", "Installed. Nice.") : h("p", "Free, no app store. Installed, it opens like an app, works offline and your phone is less likely to clear it."),
      installBtn,
      isStandalone() ? null : h("ul.install-steps",
        h("li", h("b", "iPhone or iPad (Safari): "), "tap Share, then ", h("b", "Add to Home Screen"), "."),
        h("li", h("b", "Android (Chrome): "), "tap the ⋮ menu, then ", h("b", "Install app"), " or ", h("b", "Add to Home screen"), "."))),
    h("section.sec", { "aria-labelledby": "h-pack" },
      h("h2.sec-title", { id: "h-pack" }, "Nova's Pack"),
      h("ul.link-list",
        pet() ? h("li", h("a", { href: cardLink(pet()) }, em("🪪"), ` Make a Pack Card for ${pet().name}`)) : null,
        h("li", h("a", { href: "https://www.instagram.com/novathehumanhandler/", rel: "noopener" }, em("📸"), " Follow Nova on Instagram")),
        h("li", h("a", { href: "privacy.html" }, em("🔒"), " Privacy notice"))),
      S.content.SOURCES.length ? h("details.more-box",
        h("summary", "Where the care info comes from"),
        h("ul.src-list", S.content.SOURCES.map((s) => h("li", h("a", { href: s.url, rel: "noopener" }, s.title))))) : null),
    h("section.sec.danger-zone", { "aria-labelledby": "h-del" },
      h("h2.sec-title", { id: "h-del" }, "Delete everything"),
      h("p", "Removes every pet and every entry from this device. It can't be undone, so export a backup first if you might want it back."),
      h("button.btn.btn-danger", { type: "button", "data-k": "wipe", onclick: deleteAll }, "Delete all data")),
    h("p.small.muted.version", `Nova's Pack ${APP_VERSION} · No account, no tracking, no data leaves this device.`),
  );
  if (arg === "install" || arg === "backup") requestAnimationFrame(() => { const el = document.getElementById(arg); if (el) el.scrollIntoView({ block: "start" }); });
}

/** The import form (More, and "Restore a backup" on the first-run screen). */
export function importForm(defaultMode) {
  const file = h("input", { type: "file", id: "imp-file", accept: "application/json,.json" });
  const msg = h("p.form-error", { role: "alert" });
  const radio = (v, label) => h("div.check",
    h("input", { type: "radio", name: "mode", id: `mode-${v}`, value: v, checked: v === defaultMode }), h("label", { for: `mode-${v}` }, label));
  const form = h("form.form", { novalidate: true, onsubmit: (e) => { e.preventDefault(); importFile(file, form, msg); } },
    h("div.field", h("label", { for: "imp-file" }, "Backup file (.json)"), file),
    S.pets.length ? h("fieldset.fs", h("legend", "When importing"),
      h("div.checks", radio("merge", "Merge: add it to what's here"), radio("replace", "Replace: wipe this device first"))) : null,
    msg,
    h("button.btn.btn-line", { type: "submit", "data-k": "imp-go" }, "Import backup"));
  return form;
}

async function deletePet(p) {
  if (!(await confirmBox(`Delete ${p.name}?`, `${p.name} and everything logged for them will be removed from this device.`, "Delete", true))) return;
  await removePet(p.id);
  toast(`${p.name} deleted.`);
  if (!S.pets.length) location.hash = "#/welcome"; else refresh();
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
