// Pieces several screens share.

import { S, removePet, refresh, units } from "../state.js";
import { h, em, confirmBox, toast, ago, fmtTime, fmtDay } from "../util.js";
import { speciesOf, TYPES, openPetSheet } from "../forms.js";
import { scaleFor, flagLabel, fmtWeight } from "../logic.js";

export const NOVA = "img/brand/nova-head.svg";

export function avatar(p, size = 40) {
  if (p && p.photo) return h("img.avatar", { src: p.photo, alt: "", width: String(size), height: String(size) });
  if (p && p.sample) return h("img.avatar.disc", { src: NOVA, alt: "", width: String(size), height: String(size) });
  return h("span.avatar.av-emoji", { "aria-hidden": "true", style: { width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.55)}px` } }, speciesOf(p && p.species).emoji);
}

/** Screen title. tabindex -1 so the router can move focus here after navigation. */
export function pageHead(title, sub) {
  return h("div.page-head", h("h1", { tabindex: "-1", id: "page-title" }, title), sub ? h("p.page-sub", sub) : null);
}

export function sampleBanner(p) {
  if (!p || !p.sample) return null;
  return h("aside.sample-banner", { "aria-label": "Sample data" },
    h("span.sample-tag", "SAMPLE"),
    h("p", "This is Nova's example diary, so you can look around. Nothing here is real or advice."),
    h("div.row-btns.left",
      h("button.btn.btn-line.sm", { type: "button", onclick: deleteSample }, "Delete sample"),
      h("button.btn.btn-blue.sm", { type: "button", onclick: () => openPetSheet() }, "Add your own pet")));
}
export async function deleteSample() {
  const samples = S.pets.filter((p) => p.sample);
  if (!(await confirmBox("Delete the sample?", "Nova's example pet and everything logged for it will be removed from this device.", "Delete sample", true))) return;
  for (const p of samples) await removePet(p.id);
  toast("Sample deleted.");
  if (!S.pets.length) location.hash = "#/welcome"; else refresh();
}

export function vetFirst() {
  return h("p.vet-first", em("🩺"), " ", S.content.VET_FIRST || "Worried about your pet? Call your vet first.");
}

/** The calm "Call your vet" card. */
export function alertCard(alerts) {
  if (!alerts.length) return null;
  return h("section.alert", { id: "vet-alert", tabindex: "-1", "aria-labelledby": "vet-alert-h" },
    h("h2", { id: "vet-alert-h" }, em("📞"), " Call your vet"),
    h("ul.alert-list", alerts.map((a) => h("li",
      h("b", a.reason),
      a.guide ? h("p.alert-guide", h("span", `Guidance for "${a.guide.when}": `), a.guide.advice) : null))),
    h("p.small", "This is a diary, not a diagnosis. Your vet knows your pet. Out of hours, call an emergency vet."));
}

export function emptyState(text, ...actions) {
  return h("div.empty", h("p", text), actions.length ? h("div.row-btns.left", actions) : null);
}

/** One line describing a diary entry. */
export function eventText(e) {
  switch (e.type) {
    case "poop": {
      const s = scaleFor(e.score);
      const bits = [s ? `${e.score} · ${s.label}` : "Logged"];
      if (e.flags && e.flags.length) bits.push(e.flags.map(flagLabel).map((l) => l.split(" (")[0]).join(", "));
      return bits.join(" · ");
    }
    case "meal": case "treat": return [e.name, e.amount].filter(Boolean).join(" · ") || (e.type === "meal" ? "Meal" : "Treat");
    case "med": return e.name || "Medicine";
    case "walk": return e.minutes ? `${e.minutes} min` : "Walk";
    case "training": {
      const sk = S.content.SKILLS.find((s) => s.id === e.skillId);
      return [sk ? sk.title : "General practice", e.minutes ? `${e.minutes} min` : ""].filter(Boolean).join(" · ");
    }
    case "weight": return fmtWeight(e.kg, units());
    case "vet": return [e.clinic, e.note].filter(Boolean).join(" · ") || "Vet visit";
    default: return "";
  }
}

/** A list of diary entries. onEdit(e) opens the editor. showDay adds the day to the time. */
export function eventList(events, onEdit, { showDay = false } = {}) {
  return h("ul.tl", events.map((e) => {
    const t = TYPES[e.type];
    const when = showDay ? `${fmtDay(e.at)} ${fmtTime(e.at)}` : fmtTime(e.at);
    const flagged = e.type === "poop" && e.flags && e.flags.length;
    return h(`li.tl-item${flagged ? ".flagged" : ""}`,
      h("span.tl-dot", { "aria-hidden": "true" }, t.emoji),
      h("div.tl-body",
        h("p.tl-top", h("b", t.label), " ", h("time.tl-time", { datetime: new Date(e.at).toISOString() }, when)),
        h("p.tl-text", eventText(e)),
        e.note && e.type !== "vet" ? h("p.tl-note", e.note) : null),
      onEdit ? h("button.mini-btn", { type: "button", "data-k": `ev-${e.id}`, onclick: () => onEdit(e) }, "Edit", h("span.vh", ` ${t.label.toLowerCase()}, ${when}`)) : null);
  }));
}

export function agoSpan(ms) { return h("span", { "data-ago": String(ms) }, ago(ms)); }

export function petLine(p) {
  return p ? `${p.name} · ${speciesOf(p.species).label}` : "";
}
