// Pieces several screens share: avatars, page and sub-page headers, the sample strip, the "Call your vet"
// card, the ⋯ action sheet, card titles that open edit, and diary-entry rows.

import { S, units } from "../state.js";
import { h, em, sheet, ago, fmtTime, fmtDay, telHref } from "../util.js";
import { speciesOf, TYPES, openPetSheet, symptomLabel } from "../forms.js";
import { scaleFor, flagLabel, fmtWeight } from "../logic.js";

export const NOVA = "img/brand/nova-head.svg";

export function avatar(p, size = 40) {
  if (p && p.photo) return h("img.avatar", { src: p.photo, alt: "", width: String(size), height: String(size) });
  if (p && p.sample && !p.icon) return h("img.avatar.disc", { src: NOVA, alt: "", width: String(size), height: String(size) });
  return h("span.avatar.av-emoji", { "aria-hidden": "true", style: { width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.55)}px` } }, (p && p.icon) || speciesOf(p && p.species).emoji);
}

const svg = (paths, cls = "") => {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true");
  if (cls) s.setAttribute("class", cls);
  s.innerHTML = paths;
  return s;
};
export const chevron = (dir = "right") => svg(dir === "left" ? '<path d="M15 5l-7 7 7 7"/>' : '<path d="M9 5l7 7-7 7"/>', "chev");
const dots = () => svg('<circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>', "dots");

/** Tab screen title. tabindex -1 so the router can move focus here after navigation. */
export function pageHead(title, ...extra) {
  return h("div.page-head", h("h1", { tabindex: "-1", id: "page-title" }, title), ...extra);
}

/** Sub-page bar: sticky, 52 px, a 44×44 back chevron and a centred title (the page's h1). */
export function subBar(title, backHref, backLabel) {
  return h("div.subbar",
    h("a.sub-back", { href: backHref }, chevron("left"), h("span.vh", backLabel)),
    h("h1.sub-title", { tabindex: "-1", id: "page-title" }, title),
    h("span.sub-end", { "aria-hidden": "true" }));
}

/** Sample mode: one sticky 40 px strip instead of a banner. Deleting the sample lives in More. */
export function sampleStrip(p) {
  if (!p || !p.sample) return null;
  return h("aside.sample-strip", { "aria-label": "Sample diary" },
    h("button.strip-btn", { type: "button", "data-k": "strip-add", onclick: () => openPetSheet() },
      h("b.strip-tag", "SAMPLE"), h("span", " · Add your own pet "), h("span.strip-arrow", { "aria-hidden": "true" }, "→")));
}

export function vetFirst() {
  return h("p.vet-first", em("🩺"), " ", S.content.VET_FIRST || "Worried about your pet? Call your vet first.");
}

const LEVELS = {
  emergency: { rank: 0, title: "Call a vet now", tag: "Now" },
  today: { rank: 1, title: "Call your vet today", tag: "Today" },
  watch: { rank: 2, title: "Keep an eye on this", tag: "Watch" },
};
const levelOf = (a) => (LEVELS[a.level] ? a.level : "today");

/**
 * The calm "Call your vet" card for healthAlerts(pet): [{ level, reason, advice }].
 * Emergencies come first. Shows the vet's numbers (from the profile) as call buttons.
 */
export function alertCard(alerts, p) {
  if (!alerts || !alerts.length) return null;
  const list = alerts.map((a) => ({ ...a, level: levelOf(a), advice: a.advice || (a.guide && a.guide.advice) || "" }))
    .sort((a, b) => LEVELS[a.level].rank - LEVELS[b.level].rank);
  const top = list[0].level;
  const mixed = list.some((a) => a.level !== top);
  const vet = (p && p.vet) || {};
  const vetTel = telHref(vet.phone), emTel = telHref(vet.emergencyPhone);
  const calls = [];
  if (top === "emergency" && emTel) calls.push(h("a.btn.btn-danger.sm", { href: emTel }, "Call emergency vet"));
  if (vetTel) calls.push(h(`a.btn.${calls.length ? "btn-line" : top === "emergency" ? "btn-danger" : "btn-blue"}.sm`, { href: vetTel }, `Call ${vet.name || "your vet"}`));
  return h(`section.alert.lv-${top}`, { id: "vet-alert", tabindex: "-1", "aria-labelledby": "vet-alert-h" },
    h("h2", { id: "vet-alert-h" }, em(top === "emergency" ? "🚨" : "📞"), " ", LEVELS[top].title),
    h("ul.alert-list", list.map((a) => h("li",
      mixed ? h(`span.lv-tag.lv-${a.level}`, LEVELS[a.level].tag) : null,
      h("b", a.reason),
      a.advice ? h("p", a.advice) : null))),
    calls.length ? h("div.row-btns.left", calls) : null,
    h("p.small", "This is a diary, not a diagnosis. Your vet knows your pet. Out of hours, call an emergency vet.",
      !vetTel ? [" ", h("a", { href: "#/more/profile" }, "Add your vet's number")] : null));
}

export function emptyState(text, ...actions) {
  return h("div.empty", h("img.disc.empty-nova", { src: NOVA, alt: "", width: "40", height: "40" }),
    h("div.empty-body", h("p", text), actions.length ? h("div.row-btns.left", actions) : null));
}

/** The ⋯ button (44 px) that opens an action sheet. items: [[label, fn, { danger }], ...] */
export function moreBtn(what, items) {
  return h("button.more-btn", { type: "button", "aria-haspopup": "dialog", onclick: () => actionSheet(what, items) },
    dots(), h("span.vh", `More for ${what}`));
}
export function actionSheet(title, items) {
  sheet(title, (body, close) => {
    body.append(h("ul.action-list", items.filter(Boolean).map(([label, fn, o = {}]) =>
      h("li", h(`button.action-row${o.danger ? ".danger" : ""}`, { type: "button", onclick: () => { close(); setTimeout(fn, 0); } }, label)))));
  });
}
/** A card title that opens the editor when the card is tapped (it stretches over the card). */
export function cardTitle(text, onEdit, k) {
  return h("h3.card-h", h("button.card-title", { type: "button", onclick: onEdit, "data-k": k }, text, h("span.vh", ", edit")));
}

/** One line describing a diary entry. */
export function eventText(e) {
  switch (e.type) {
    case "poop": {
      const s = scaleFor(e.score, e.petId);
      const bits = [s ? s.label.split(":")[0] : "Logged"];
      if (e.flags && e.flags.length) bits.push(e.flags.map(flagLabel).map((l) => l.split(" (")[0]).join(", "));
      return bits.join(" · ");
    }
    case "meal": case "treat": return [e.name, e.amount].filter(Boolean).join(" · ") || (e.type === "meal" ? "Meal" : "Treat");
    case "med": return e.name || "Medicine";
    case "walk": return e.minutes ? `${e.minutes} min` : "Walk";
    case "eggs": return `${e.count ?? 0} egg${e.count === 1 ? "" : "s"}`;
    case "training": {
      const sk = S.content.SKILLS.find((s) => s.id === e.skillId);
      return [sk ? sk.title : "General practice", e.minutes ? `${e.minutes} min` : ""].filter(Boolean).join(" · ");
    }
    case "symptom": return (e.symptoms || []).map((id) => symptomLabel(id).split(" (")[0].split(",")[0]).join(", ") || "Unwell";
    case "weight": return fmtWeight(e.kg, units(S.pets.find((x) => x.id === e.petId)));
    case "vet": return [e.clinic, e.note].filter(Boolean).join(" · ") || "Vet visit";
    default: return "";
  }
}

const poopPill = (score) => (typeof score === "number" ? h(`span.pill.score-${score}`, `Type ${score}`) : null);

/**
 * Diary entries as tappable rows (tap to edit). Time comes first.
 * single: every entry is the same type (e.g. the poop history), so the type isn't repeated.
 */
export function eventList(events, onEdit, { showDay = false, single = false } = {}) {
  return h("ul.tl", events.map((e) => {
    const t = TYPES[e.type] || { emoji: "•", label: e.type };
    const when = showDay ? `${fmtDay(e.at)}, ${fmtTime(e.at)}` : fmtTime(e.at);
    const flagged = (e.type === "poop" && e.flags && e.flags.length) || e.type === "symptom";
    const text = eventText(e);
    return h(`li.tl-item${flagged ? ".flagged" : ""}`,
      h("button.tl-row", { type: "button", "data-k": `ev-${e.id}`, onclick: () => onEdit(e) },
        h("span.tl-dot", { "aria-hidden": "true" }, t.emoji),
        h("span.tl-body",
          h("span.tl-top", h("time.tl-time", { datetime: new Date(e.at).toISOString() }, when),
            single ? null : h("span.tl-type", t.label)),
          h("span.tl-text", text),
          e.note && e.type !== "vet" ? h("span.tl-note", e.note) : null),
        e.type === "poop" ? poopPill(e.score) : null,
        h("span.vh", ", edit")));
  }));
}

export function agoSpan(ms) { return h("span", { "data-ago": String(ms) }, ago(ms)); }

export function petLine(p) {
  return p ? `${p.name} · ${speciesOf(p.species).label}` : "";
}
