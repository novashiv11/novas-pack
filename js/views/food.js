// Food: current food and its history, treats in use, allergies, and the meal and treat log.

import { S, pet, forPet, save } from "../state.js";
import { h, put, em, fmtDate, daysBetween, isoDate, toast, DAY } from "../util.js";
import { foodSheet, treatSheet, eventSheet, logMeal, logTreat } from "../forms.js";
import { pageHead, sampleBanner, emptyState, eventList } from "./parts.js";

export function food(main) {
  const p = pet();
  const foods = forPet("foods");
  const current = foods.filter((f) => f.kind === "food" && !f.until).sort((a, b) => (b.since || "").localeCompare(a.since || ""))[0];
  const past = foods.filter((f) => f.kind === "food" && f !== current).sort((a, b) => (b.since || "").localeCompare(a.since || ""));
  const treats = foods.filter((f) => f.kind === "treat").sort((a, b) => (b.inUse !== false) - (a.inUse !== false) || a.name.localeCompare(b.name));
  const log = S.events.filter((e) => e.petId === p.id && (e.type === "meal" || e.type === "treat") && Date.now() - e.at < 7 * DAY).sort((a, b) => b.at - a.at);

  const allergies = h("textarea", { id: "allergy", rows: "3", maxlength: "1000", value: p.allergies || "", placeholder: "e.g. chicken makes her itchy; no grapes" });
  const allergyForm = h("form.form", { novalidate: true, onsubmit: async (e) => {
    e.preventDefault();
    await save("pets", { ...p, allergies: allergies.value.trim() || undefined });
    toast("Saved.");
  } },
  h("div.field", h("label", { for: "allergy" }, "Allergies and don't-feed list"), allergies),
  h("button.btn.btn-line.sm", { type: "submit", "data-k": "save-allergy" }, "Save list"));

  put(main, 
    sampleBanner(p),
    pageHead("Food", p.name),
    h("section.sec", { "aria-labelledby": "h-food" },
      h("h2.sec-title", { id: "h-food" }, em("🥣"), " Current food"),
      current ? h("div.card.food-card",
        h("h3", [current.brand, current.product].filter(Boolean).join(" · ")),
        current.amount ? h("p", h("b", "Per day: "), current.amount) : null,
        current.since ? h("p.small.muted", `Since ${fmtDate(current.since)} (${daysBetween(current.since, isoDate())} days)`) : null,
        current.note ? h("p.small.muted", current.note) : null,
        h("div.row-btns.left",
          h("button.btn.btn-blue.sm", { type: "button", "data-k": "change-food", onclick: () => foodSheet() }, "Change food"),
          h("button.btn.btn-line.sm", { type: "button", "data-k": "edit-food", onclick: () => foodSheet(current) }, "Edit")))
        : emptyState(`What does ${p.name} eat? Add the food you use now, so you (and your vet) know when it changed.`,
          h("button.btn.btn-blue.sm", { type: "button", "data-k": "change-food", onclick: () => foodSheet() }, "Add current food"))),
    h("section.sec", { "aria-labelledby": "h-treats" },
      h("div.sec-row", h("h2.sec-title", { id: "h-treats" }, em("🦴"), " Treats"),
        h("button.btn.btn-line.sm", { type: "button", "data-k": "add-treat", onclick: () => treatSheet() }, "Add a treat")),
      treats.length ? h("ul.treat-list", treats.map((t) => h("li",
        h("div", h("b", t.name), t.note ? h("p.small.muted", t.note) : null),
        h("button.switch", { type: "button", role: "switch", "aria-checked": String(t.inUse !== false), "data-k": `sw-${t.id}`,
          onclick: () => save("foods", { ...t, inUse: t.inUse === false }) },
          h("span.switch-label", t.inUse !== false ? "In use" : "Stopped"), h("span.vh", `: ${t.name}`)),
        h("button.mini-btn", { type: "button", onclick: () => treatSheet(t) }, "Edit", h("span.vh", ` ${t.name}`)))))
        : emptyState("No treats listed. Add the ones you use, and switch them off when you stop.")),
    h("section.sec", { "aria-labelledby": "h-allergy" },
      h("h2.sec-title", { id: "h-allergy" }, em("🚫"), " Don't feed"),
      allergyForm),
    h("section.sec", { "aria-labelledby": "h-log" },
      h("div.sec-row", h("h2.sec-title", { id: "h-log" }, "Last 7 days"),
        h("div.row-btns",
          h("button.btn.btn-gold.sm", { type: "button", "data-k": "f-meal", onclick: logMeal }, em("🍽️"), " Meal"),
          h("button.btn.btn-gold.sm", { type: "button", "data-k": "f-treat", onclick: logTreat }, em("🦴"), " Treat"))),
      log.length ? eventList(log, (e) => eventSheet(e.type, e), { showDay: true }) : emptyState("No meals or treats logged this week.")),
    past.length ? h("section.sec", { "aria-labelledby": "h-fh" },
      h("h2.sec-title", { id: "h-fh" }, "Food history"),
      h("ul.cards", past.map((f) => h("li.card",
        h("h3", [f.brand, f.product].filter(Boolean).join(" · ")),
        h("p.small.muted", `${f.since ? fmtDate(f.since) : "?"} to ${f.until ? fmtDate(f.until) : "now"}${f.amount ? ` · ${f.amount}` : ""}`),
        f.note ? h("p.small.muted", f.note) : null,
        h("div.row-btns.left", h("button.mini-btn", { type: "button", onclick: () => foodSheet(f) }, "Edit", h("span.vh", ` ${f.brand || f.product || "food"}`))))))) : null,
  );
}
