// More (v7): a profile, like a good settings app. An avatar header with honest stats (all derived from your logs),
// then grouped rows with icons, values and chevrons. Sub-pages (#/more/<page>): pets, profile, units, backup, install,
// sources, badges (an achievement grid with progress) and jar (the sticker album).

import { planSheet, planText, showUpDates, weekAndSticker } from "./doitnow.js";
import { STICKERS } from "../../data/stickers.js";
import { S, pet, setSetting, wipe, load, refresh, units, UI } from "../state.js";
import { h, put, sheet, toast, confirmBox, fmtDate, isoDate, ageText, telHref, shareOrSave } from "../util.js";
import { exportData, validateBackup, importData } from "../db.js";
import { installCard, isStandalone } from "../install.js";
import { openPetSheet, speciesOf, segmented, deletePetFlow, adoptSampleFlow, unarchivePet } from "../forms.js";
import { subBar, avatar, chevron, sampleStrip, emptyState, NOVA } from "./parts.js";
import { gameOf, trainerFor } from "./gameui.js";
import { openPartnerCard } from "../sharecard.js";
import { sound } from "../sound.js";
import { recapSheet } from "./recap.js";

export const APP_VERSION = "2.0";
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

const PAGES = { pets, profile, units: unitsPage, backup, install, sources, badges, jar };
const novaFace = (size = 40) => h("img.disc.nova-face", { src: NOVA, alt: "", width: String(size), height: String(size) });
const buzz = () => { try { navigator.vibrate && navigator.vibrate(12); } catch { /* not everywhere */ } };

// ---------- the More screen ----------

/** The profile header: avatar, name, a line about them, level with a real XP bar, and four honest stat tiles. */
function hero(p) {
  if (!p) {
    return h("section.mh.mh-empty", { "aria-label": "Profile" },
      novaFace(56),
      h("p.mh-hello", "Hi, I'm Nova. Add your pet and we'll start together."),
      h("button.btn.btn-blue", { type: "button", "data-k": "m-add-first", onclick: () => openPetSheet() }, "Add your pet"));
  }
  const careOnly = !!S.settings.careOnly;
  const meta = [speciesOf(p.species).label, ageText(p.birthday), p.homeSince ? `home since ${fmtDate(p.homeSince, { month: "short", year: "numeric" })}` : ""].filter(Boolean);
  let level = null, tiles;
  if (careOnly) {
    const mine = S.events.filter((e) => e.petId === p.id);
    const days = new Set(mine.map((e) => isoDate(new Date(e.at)))).size;
    tiles = [["📝", String(mine.length), "Entries", "#/health", "m-stat-entries"], ["📅", String(days), "Days logged", "#/health", "m-stat-days"]];
  } else {
    const a = gameOf(p);
    const lv = a.level;
    const week = weekAndSticker(p).count;
    const pct = lv.max ? 100 : Math.round((lv.into / Math.max(1, lv.need)) * 100);
    level = h("div.mh-level",
      h("div.mh-chips", h("span.mh-chip.gold", `Level ${lv.level}`), h("span.mh-chip", `Trainer: ${trainerFor(p).rank.name}`)),
      h("div.mh-xp", { role: "progressbar", "aria-label": `Level ${lv.level} progress`, "aria-valuemin": "0", "aria-valuemax": String(lv.max ? 1 : lv.need), "aria-valuenow": String(lv.max ? 1 : lv.into) },
        h("i", { style: { width: `${pct}%` } })),
      h("p.mh-xp-t", lv.max ? "Top level. Well done." : `${lv.need - lv.into} XP to level ${lv.level + 1}`));
    tiles = [["🔥", `${week}/7`, "This week", "#/home", "m-stat-week"], ["🎯", String(a.sessions.length), "Sessions", "#/train", "m-stat-sessions"],
      ["📍", String(a.stamps.length), "Stamps", "#/adventures", "m-stat-stamps"], ["🏅", String(a.badges.filter((b) => b.earned).length), "Badges", "#/more/badges", "m-stat-badges"]];
  }
  return h("section.mh", { "aria-label": `${p.name}'s profile` },
    h("div.mh-banner", { "aria-hidden": "true" }),
    avatar(p, 88),
    h("h2.mh-name", p.name, p.sample ? h("span.mh-sample", "Sample") : null),
    h("p.mh-meta", meta.join(" · ")),
    level,
    h(`ul.mh-stats.n${tiles.length}`, tiles.map(([e, n, label, href, k]) => h("li", h("a.mh-stat", { href, "data-k": k },
      h("span.mh-stat-e", { "aria-hidden": "true" }, e), h("b.mh-stat-n", n), h("span.mh-stat-l", label))))));
}

export function more(main, arg) {
  if (PAGES[arg]) { PAGES[arg](main); return; }
  const p = pet();
  const u = units();
  const careOnly = !!S.settings.careOnly;
  const sample = S.pets.find((x) => x.sample);
  const a = p && !careOnly ? gameOf(p) : null;
  const inner = (icon, tone, label, value, sub) => [
    h(`span.set-ico.${tone}`, { "aria-hidden": "true" }, icon),
    h("span.set-label", label, sub ? h("span.set-sub", sub) : null),
    value ? h("span.set-value", value) : null];
  const row = (icon, tone, label, value, href, k, sub) => h("li", h("a.set-row", { href, "data-k": k }, ...inner(icon, tone, label, value, sub), chevron()));
  const btnRow = (icon, tone, label, value, onclick, k, sub) => h("li", h("button.set-row", { type: "button", "data-k": k, onclick }, ...inner(icon, tone, label, value, sub), chevron()));
  const group = (id, title, ...rows) => h("section.set-group", { "aria-labelledby": id }, h("h2.set-h", { id }, title), h("ul.set-list", ...rows));
  const earned = a ? a.badges.filter((b) => b.earned).length : 0;
  put(main,
    h("h1.vh", { tabindex: "-1", id: "page-title" }, "More"),
    UI.applyUpdate ? h("aside.nudge", h("p", h("b", "Update ready."), " Same diary, fresh paint."),
      h("div.row-btns.left", h("button.btn.btn-blue.sm", { type: "button", onclick: () => UI.applyUpdate() }, "Update now"))) : null,
    hero(p),
    a ? group("g-lvl", "Level up",
      p ? btnRow("🗓️", "t-blue", "This week", "Recap", () => recapSheet(p, 0), "m-recap") : null,
      row("🍪", "t-gold", "Nova's treat jar", "Stickers", "#/more/jar", "m-jar"),
      row("🎨", "t-tan", "Art studio", "Play", "#/studio", "m-studio"),
      row("🏅", "t-gold", "Badges", `${earned} of ${a.badges.length}`, "#/more/badges", "m-badges"),
      row("🎓", "t-blue", "Trainer and Academy", trainerFor(p).rank.name, "#/trainer", "m-trainer"),
      row("📓", "t-tan", "Growth Journal", S.journal.length ? `${S.journal.length} line${S.journal.length === 1 ? "" : "s"}` : "", "#/journal", "m-journal"),
      p.sample ? null : btnRow("📸", "t-blue", "Share the partner card", p.name, () => openPartnerCard(p, gameOf(p), trainerFor(p)), "m-share")) : null,
    group("g-pets", "Your pets",
      row("🐾", "t-tan", "Pets", String(S.pets.filter((x) => !x.archivedAt).length), "#/more/pets", "m-pets"),
      row("📇", "t-blue", "Profile and contacts", p ? p.name : "", "#/more/profile", "m-profile"),
      row("🌱", "t-gold", "Getting a new pet?", "Checklist", "#/ready", "m-ready")),
    group("g-rem", "Reminders and mode",
      p && !careOnly ? btnRow("⏰", "t-gold", "Nudge time", S.settings.plan && S.settings.plan.anchor ? planText(S.settings.plan).replace(/^./, (c) => c.toUpperCase()) : "Pick one", () => planSheet(p), "m-plan", "One gentle daily reminder, at a time you choose") : null,
      h("li", h("button.set-row", { type: "button", role: "switch", "aria-checked": String(careOnly), "data-k": "m-care-only", onclick: async () => {
        const on = !S.settings.careOnly;
        buzz();
        await setSetting("careOnly", on, { quiet: false });
        toast(on ? "Care diary only: levels, quests and stickers are hidden. Your logs keep counting if you switch back." : "The game is back. Everything you logged still counts.");
      } }, ...inner("🧺", "t-blue", "Care diary only", "", "Hide levels, quests and stickers"), h("span.set-sw", { "aria-hidden": "true" }))),
      h("li", h("button.set-row", { type: "button", role: "switch", "aria-checked": String(S.settings.sound !== false), "data-k": "m-sound", onclick: async () => {
        const on = S.settings.sound === false;
        buzz();
        await setSetting("sound", on, { quiet: false });
        if (on) sound("tick");
      } }, ...inner("🔔", "t-gold", "Sounds", "", "A soft tick when you log, a little tune for wins"), h("span.set-sw", { "aria-hidden": "true" })))),
    group("g-app", "App",
      row("⚖️", "t-blue", "Units", u, "#/more/units", "m-units"),
      row("💾", "t-tan", "Backup", S.settings.lastBackup ? fmtDate(S.settings.lastBackup, { day: "numeric", month: "short" }) : "Never", "#/more/backup", "m-backup"),
      row("📲", "t-blue", "Install", isStandalone() ? "Installed" : "", "#/more/install", "m-install")),
    group("g-pack", "Help and about",
      p ? row("🪪", "t-gold", "Pack Card", p.name, cardLink(p), "m-card") : null,
      row("🔒", "t-blue", "Privacy", "", "privacy.html", "m-privacy"),
      btnRow("🌧️", "t-tan", "If things feel heavy", "", heavy, "m-heavy"),
      S.content.SOURCES.length ? row("📚", "t-tan", "Where the info comes from", "", "#/more/sources", "m-sources") : null,
      h("li", h("a.set-row", { href: "https://www.instagram.com/novathehumanhandler/", rel: "noopener" }, ...inner("📸", "t-gold", "Follow Nova on Instagram"), chevron()))),
    group("g-del", "Delete",
      sample ? h("li", h("button.set-row", { type: "button", "data-k": "m-adopt-sample", onclick: () => adoptSampleFlow(sample) }, ...inner("✨", "t-gold", `Make ${sample.name} mine (clear the examples)`), chevron())) : null,
      sample ? h("li", h("button.set-row", { type: "button", "data-k": "m-del-sample", onclick: () => deletePetFlow(sample) }, ...inner("🧹", "t-tan", "Delete the sample diary"), chevron())) : null,
      h("li", h("button.set-row.danger", { type: "button", "data-k": "wipe", onclick: deleteAll }, ...inner("🗑️", "t-danger", "Delete all data"), chevron()))),
    h("p.small.muted.version", `Nova's Pack ${APP_VERSION} · Level up together · No account, no tracking. Everything stays on this device.`),
  );
}

/** A small, calm pointer to people who can help. No therapy language, no promises. */
export function heavy() {
  sheet("If things feel heavy", (body) => {
    put(body,
      h("p", "Talking helps. You don't have to be in crisis to reach out."),
      h("p", h("b", "Ireland and the UK: "), "Samaritans, free, any time, day or night: ", h("a.call-link", { href: "tel:116123" }, "116 123"), "."),
      h("p", h("b", "United States: "), "call or text ", h("a.call-link", { href: "tel:988" }, "988"), " (Suicide & Crisis Lifeline)."),
      h("p", h("b", "Anywhere else: "), "find a free, confidential helpline in your country at ", h("a", { href: "https://findahelpline.com/", rel: "noopener" }, "findahelpline.com"), ", or talk to your doctor."),
      h("p", "If you or someone else is in danger right now, call your local emergency number."),
      h("p.small.muted", h("a", { href: "https://www.samaritans.org/ireland/", rel: "noopener" }, "samaritans.org/ireland"), ". Nova's Pack isn't connected to any service and never sees what you do here."));
  });
}

// ---------- sub-pages ----------
const back = (title) => subBar(title, "#/more", "Back to More");
const needPet = (main, title) => put(main, back(title), emptyState("Add your pet first, then this page fills up.", h("button.btn.btn-blue", { type: "button", "data-k": "add-pet", onclick: () => openPetSheet() }, "Add your pet")));
const bar = (frac, label) => h("div.bar7", { role: "progressbar", "aria-label": label, "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": String(Math.round(frac * 100)) }, h("i", { style: { width: `${Math.round(frac * 100)}%` } }));

// --- Sticker album (More → Treat jar): one sticker for every day you showed up, in order. Real data only.
function jar(main) {
  const p = pet();
  if (!p) { needPet(main, "Nova's treat jar"); return; }
  const dates = showUpDates(p);
  const n = STICKERS.length;
  const counts = STICKERS.map((_, i) => dates.filter((_d, j) => j % n === i).length);
  const got = counts.filter(Boolean).length;
  const die = (s, i, big) => h(`span.stk-die${big ? ".big" : ""}`, { style: { transform: `rotate(${[-4, 3, -2, 5, -5, 2][i % 6]}deg)` }, "aria-hidden": "true" }, s);
  const peek = (s, i) => sheet(`Sticker ${i + 1} of ${n}`, (body) => {
    put(body, h("div.stk-sheet",
      counts[i] ? die(s.e, i, true) : h("span.stk-die.big.locked", { "aria-hidden": "true" }, h("span.stk-ghost", s.e)),
      counts[i] ? h("p.stk-line", s.t) : h("p.stk-line", `Comes on your day ${i + 1} of showing up.`),
      counts[i]
        ? h("p.small.muted", `Earned ${fmtDate(dates[i])}${counts[i] > 1 ? ` · and ${counts[i] - 1} more time${counts[i] === 2 ? "" : "s"}` : ""}`)
        : h("p.small.muted", "Any real time together counts: training, a walk, brushing, a stamp, or the 1-minute tick. Never lost, never bought.")));
  });
  put(main,
    back("Nova's treat jar"),
    sampleStrip(p),
    h("section.stk-sum", { "aria-label": "Sticker album progress" },
      h("div.stk-sum-top", h("b.stk-big", `${got}`), h("span", ` of ${n} stickers`)),
      bar(got / n, "Stickers collected"),
      h("p.small.muted", `${dates.length} day${dates.length === 1 ? "" : "s"} of showing up. One sticker for each day you spend a minute together. Never lost, never bought.`)),
    h("ul.album", STICKERS.map((s, i) => h("li", h(`button.stk${counts[i] ? "" : ".locked"}`, { type: "button", "data-k": `sticker-${i + 1}`, onclick: () => peek(s, i) },
      counts[i] ? die(s.e, i) : h("span.stk-die.locked", { "aria-hidden": "true" }, h("span.stk-ghost", s.e)),
      counts[i] > 1 ? h("span.stk-n", `×${counts[i]}`) : null,
      h("span.stk-d", `Day ${i + 1}`),
      h("span.vh", counts[i] ? `: ${s.t}` : ": locked"))))));
}

// --- Badges: medals in colour when earned, greyed with a real progress bar when not.
const NEXT_HREF = { "m-stamp1": "#/adventures", "m-adventurer": "#/adventures", "m-explorer": "#/adventures", "m-first": "#/train", "m-days3": "#/train", "m-steady": "#/train" };
const fracOf = (b) => { if (b.earned) return 1; const m = /(\d+) of (\d+)/.exec(b.progress || ""); return m ? Math.min(1, +m[1] / Math.max(1, +m[2])) : 0; };
const progText = (b) => (b.progress || "").replace(/^Best run: /, "");
const medal = (b, big) => h(`span.medal.${b.earned ? "earned" : "locked"}${big ? ".big" : ""}`, { "aria-hidden": "true" },
  h("span.medal-e", b.emoji), b.earned ? null : h("span.medal-lock", "🔒"));

function badgeSheet(b) {
  const href = b.kind === "skill" ? `#/train/${encodeURIComponent(b.skill)}` : NEXT_HREF[b.id];
  sheet(b.name, (body, close) => {
    put(body, h("div.bd-sheet",
      medal(b, true),
      h("p.bd-need", b.earned ? "You earned this one." : b.need),
      b.earned ? h("p.small.muted", `Earned ${fmtDate(b.at, { day: "numeric", month: "short", year: "numeric" })}`)
        : [b.progress ? bar(fracOf(b), `${b.name} progress`) : null, b.progress ? h("p.small", h("b", progText(b))) : null],
      !b.earned && href ? h("a.btn.btn-blue.wide", { href, "data-k": "badge-go", onclick: close }, b.kind === "skill" ? "Practise this skill" : "Go for it") : null));
  });
}

function badges(main) {
  const p = pet();
  if (!p) { needPet(main, "Badges"); return; }
  const a = gameOf(p);
  const earned = a.badges.filter((b) => b.earned).length;
  const group = (kind, title) => {
    const list = a.badges.filter((b) => b.kind === kind);
    if (!list.length) return null;
    const mine = list.filter((b) => b.earned).length;
    return h("section.sec", { "aria-labelledby": `bg-${kind}` },
      h("div.sec-row", h("h2.sec-title", { id: `bg-${kind}` }, title), h("span.pill", `${mine} of ${list.length}`)),
      h("ul.medal-grid", list.map((b) => h(`li${b.earned ? ".earned" : ""}`, h("button.medal-cell", { type: "button", "data-k": `badge-${b.id}`, onclick: () => badgeSheet(b) },
        medal(b),
        h("span.medal-name", b.name),
        b.earned ? h("span.medal-sub", fmtDate(b.at, { day: "numeric", month: "short" }))
          : [b.progress ? bar(fracOf(b), `${b.name} progress`) : null, h("span.medal-sub", progText(b))],
        h("span.vh", b.earned ? ", earned" : `, locked. ${b.need}. ${b.progress || ""}`))))));
  };
  put(main,
    back("Badges"),
    sampleStrip(p),
    h("section.bd-sum", { "aria-label": "Badge progress" },
      h("div.bd-sum-top", h("b.bd-big", String(earned)), h("span", ` of ${a.badges.length} badges`)),
      bar(earned / Math.max(1, a.badges.length), "Badges earned"),
      h("p.nova-line", novaFace(28), h("span", p.species === "dog"
        ? "Real milestones only. A skill badge means it works in the garden."
        : `Real milestones only, for ${p.name}. More ${p.species === "cat" ? "cat" : "pet"} badges are coming soon.`))),
    group("milestone", "Milestones"),
    group("skill", "Skill badges"));
}

// --- Pets: cards with avatars and an "Add pet" tile; archived pets fold away.
function pets(main) {
  const live = S.pets.filter((p) => !p.archivedAt);
  const gone = S.pets.filter((p) => p.archivedAt);
  const cur = pet();
  const game = !S.settings.careOnly;
  put(main,
    back("Pets"),
    h("ul.pc-grid",
      live.map((p) => h("li", h(`button.pc${cur && p.id === cur.id ? ".cur" : ""}`, { type: "button", "data-k": `edit-pet-${p.id}`, onclick: () => openPetSheet(p) },
        avatar(p, 64),
        h("span.pc-name", p.name),
        h("span.pc-meta", [speciesOf(p.species).label, ageText(p.birthday)].filter(Boolean).join(" · ")),
        h("span.pc-tags",
          cur && p.id === cur.id ? h("span.pc-tag.now", "Showing now") : null,
          p.sample ? h("span.pc-tag", "Sample") : null,
          game ? h("span.pc-tag.gold", `Level ${gameOf(p).level.level}`) : null),
        h("span.vh", ", edit")))),
      h("li", h("button.pc.pc-add", { type: "button", "data-k": "add-pet", onclick: () => openPetSheet() },
        h("span.pc-plus", { "aria-hidden": "true" }, "+"), h("span.pc-name", "Add a pet"), h("span.pc-meta", "Everyone's welcome in the pack")))),
    h("p.small.muted.pc-hint", "Tap a pet to edit, add a photo, archive or delete."),
    gone.length ? h("details.pc-fold", h("summary", `Archived (${gone.length})`),
      h("p.small.muted", "Fosters gone home, rehomed, or remembered. Their diary and your XP stay."),
      h("ul.set-list.pet-rows", gone.map((p) => h("li.pet-arch",
        h("div.set-row.pet-row", avatar(p, 40), h("span.set-label", h("b", p.name), h("span.small.muted.block", `Archived ${fmtDate(p.archivedAt)}`)),
          h("button.btn.btn-line.sm", { type: "button", "data-k": `unarchive-${p.id}`, onclick: () => unarchivePet(p) }, "Bring back", h("span.vh", `: ${p.name}`))))))) : null);
}

function profile(main) {
  const p = pet();
  if (!p) { needPet(main, "Profile and contacts"); return; }
  const v = p.vet || {}, ins = p.insurer || {}, chip = p.microchip || {};
  const call = (num) => (telHref(num) ? h("a.call-link", { href: telHref(num) }, num) : num);
  const item = (k, ...val) => {
    const has = val.some((x) => x);
    return h("div.pf-row", h("dt", k), h("dd", has ? val.filter(Boolean).flatMap((x, i) => (i ? [" · ", x] : [x])) : h("span.muted", "Not added")));
  };
  const sec = (id, icon, title, ...rows) => h("section.sec.pf-sec", { "aria-labelledby": id },
    h("h2.sec-title", { id }, h("span.pf-ico", { "aria-hidden": "true" }, icon), title), h("dl.pf-list", ...rows));
  const neu = p.neutered;
  put(main,
    back("Profile and contacts"),
    h("div.pf-for", avatar(p, 56), h("div", h("b.pf-name", p.name), h("span.small.muted.block", [speciesOf(p.species).label, ageText(p.birthday)].filter(Boolean).join(" · ")))),
    sec("pf-vet", "🩺", "Vet and insurance",
      item("Vet", v.name, v.phone ? call(v.phone) : ""),
      item("Emergency vet", v.emergencyPhone ? call(v.emergencyPhone) : ""),
      item("Insurer", ins.name, ins.policy ? `policy ${ins.policy}` : "", ins.renewal ? `renews ${fmtDate(ins.renewal)}` : "")),
    sec("pf-chip", "🔖", "Microchip",
      item("Number", chip.number), item("Registry", chip.registry),
      item("Details checked", chip.checkedOn ? fmtDate(chip.checkedOn) : "")),
    sec("pf-health", "📝", "Health notes",
      item("Home since", p.homeSince ? fmtDate(p.homeSince) : ""),
      item("Sex", p.sex === "male" ? "Male" : p.sex === "female" ? "Female" : ""),
      item("Neutered", neu ? (neu.yes ? `Yes${neu.date ? `, ${fmtDate(neu.date)}` : ""}` : "No") : ""),
      ["dog", "cat", "rabbit"].includes(p.species) && !(neu && neu.yes) && p.sex !== "male" ? item("Last season", p.lastSeason ? fmtDate(p.lastSeason) : "") : null,
      item("Allergies", p.allergies), item("Conditions", p.conditions)),
    h("div.top-actions", h("button.btn.btn-blue", { type: "button", "data-k": "edit-profile", onclick: () => openPetSheet(p, { openProfile: true }) }, "Edit profile")),
    h("p.small.muted", "It's on the vet summary, and the vet's numbers show as call buttons if Nova ever says to call. Stays on this device."));
}

function unitsPage(main) {
  put(main,
    back("Units"),
    h("section.sec.un-card",
      h("p.small.muted", "Used for weight and food amounts everywhere in the app."),
      segmented("units", "Weight units", [["kg", "Kilograms (kg)"], ["lb", "Pounds (lb)"]], units(), (x) => setSetting("units", x, { quiet: false }))));
}

function backup(main) {
  const persisted = h("span", "Checking…");
  if (navigator.storage && navigator.storage.persisted) {
    navigator.storage.persisted().then((v) => { persisted.textContent = v ? "Protected: your browser won't clear it to free up space." : "Not protected yet. Install the app and back up now and then."; }).catch(() => { persisted.textContent = "Unknown."; });
  } else persisted.textContent = "Unknown on this browser. Back up now and then.";
  put(main,
    back("Backup"),
    h("section.sec.bk",
      h("div.bk-status", h("span.bk-ico", { "aria-hidden": "true" }, "💾"),
        h("div", h("b", S.settings.lastBackup ? `Last backup: ${fmtDate(S.settings.lastBackup)}` : "No backup yet"),
          h("p.small.muted", "Your diary lives only on this device. A backup is one file you keep in your email or cloud drive, and import on a new phone."))),
      h("p.small.bk-note", h("b", "Good to know: "), "the file is plain text and includes your Growth Journal lines. Keep it somewhere private."),
      h("p.small.muted", h("b", "Storage: "), persisted),
      h("button.btn.btn-blue.wide", { type: "button", "data-k": "export", onclick: exportBackup }, "Back up now")),
    h("details.more-box", h("summary", "Import a backup"), importForm("merge")));
}

function install(main) {
  let card = null;
  try { card = installCard(); } catch { card = null; }
  put(main,
    back("Install the app"),
    h("section.sec",
      isStandalone() ? h("p", "Installed. Nice. Your diary opens like an app and works offline.")
        : h("p", "Free, no app store. Installed, it opens like an app, works offline, and your phone is less likely to clear it."),
      card,
      isStandalone() ? null : h("ol.install-steps",
        h("li", h("b", "iPhone or iPad (Safari): "), "tap Share, then ", h("b", "Add to Home Screen"), "."),
        h("li", h("b", "Android (Chrome): "), "tap the ⋮ menu, then ", h("b", "Install app"), " or ", h("b", "Add to Home screen"), "."))));
}

function sources(main) {
  const seen = new Set();
  const academy = (S.content.LESSONS || []).flatMap((l) => l.sources).filter((s) => !seen.has(s.url) && seen.add(s.url));
  put(main,
    back("Sources"),
    h("p.small.muted", "Where the care and training info comes from. General information only: your vet decides your pet's care."),
    h("h2.sec-title.src-h", "Care"),
    h("ul.src-list", S.content.SOURCES.map((s) => h("li", h("a", { href: s.url, rel: "noopener" }, s.title)))),
    academy.length ? [h("h2.sec-title.src-h", "Academy and training"), h("ul.src-list", academy.map((s) => h("li", h("a", { href: s.url, rel: "noopener" }, s.title))))] : null);
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
  if (!(await confirmBox("Delete all data?", "Every pet, entry, stamp, journal line and setting on this device will be deleted, including your Pack Card choices and streak. This can't be undone.", "Delete everything", true))) return;
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
  const what = `${c.pets} pet${c.pets === 1 ? "" : "s"}, ${c.events} diary entries, ${c.records} vaccines and preventives, ${c.meds} medicines, ${c.foods} foods and treats, ${c.adventures || 0} adventure stamps, ${c.skillChecks || 0} skill checks, ${c.academy || 0} lessons and ${c.journal || 0} journal lines.`;
  const ok = !S.pets.length || await confirmBox(mode === "replace" ? "Replace everything?" : "Merge this backup?",
    `${what}${v.skipped ? ` ${v.skipped} damaged rows will be skipped.` : ""} ${mode === "replace" ? "Everything on this device will be replaced." : "Entries with the same ID are updated from the backup."}`,
    mode === "replace" ? "Replace" : "Merge", mode === "replace");
  if (!ok) return;
  try {
    await importData(v.data, mode);
    await load();
    if (!S.pets.some((p) => p.id === S.settings.currentPet) && S.pets[0]) await setSetting("currentPet", S.pets[0].id);
    toast(`Backup imported: ${what}`);
    location.hash = "#/home";
    refresh();
  } catch { msg.textContent = "Import failed, so nothing was changed."; }
}
