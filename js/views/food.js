// Food (a segment of the Health tab, v7 cards): current food as a card, treats as chips, "Don't feed" as a warning card,
// the meal and treat log, and the feeding guide behind a "How to feed" card.

import { S, forPet, save } from "../state.js";
import { h, put, em, fmtDate, daysBetween, isoDate, toast, DAY } from "../util.js";
import { foodSheet, treatSheet, eventSheet, logMeal, logTreat } from "../forms.js";
import { emptyState, eventList, cardTitle, chevron } from "./parts.js";
import { GUIDE_PHOTOS } from "../../data/media.js";

// How to feed: short, practical tips with a real photo. Vet first: amounts and special diets are your vet's call.
const FEED_TIPS = {
  dog: [
    ["⚖️", "How much", "Start with the food label for your dog's ideal weight, then adjust. Every 2 weeks, check: you should feel the ribs easily under a thin layer, and see a waist from above."],
    ["🕰️", "How often", "Most adult dogs do well on 2 meals a day. Puppies need 3 to 4 (ask your vet when to drop to 2)."],
    ["🥣", "Mixing", "Kibble with a spoon of wet food, or soaked in warm water, is fine (that's Nova's dinner above). Count both in the day's amount. Lift any wet or soaked food not eaten within 30 minutes."],
    ["🐕‍🦺", "Big, deep-chested dogs", "Like German Shepherds: split food into 2 or more meals, use a slow feeder if they gulp, and many vets suggest about an hour's rest after eating before running or rough play. A swollen, hard belly or retching with nothing coming up is an emergency."],
    ["🍪", "Treats", "Treats and chews: at most about a tenth of the day's food. Use part of dinner for training instead."],
    ["🔄", "Changing food", "Switch over 7 to 10 days, mixing in a bit more of the new food each day."],
    ["💧", "Water", "Fresh water all day. Wash bowls daily."],
    ["🧠", "Make it a game", "Ask for a calm sit before the bowl goes down. Lick mats, snuffle mats or scattering kibble on grass turn dinner into brain work."],
    ["🛑", "Never", "Never take food away to \"show who's boss\". If your dog guards their bowl, drop a tasty extra in as you walk past, and ask a reward-based trainer."],
  ],
  other: [
    ["⚖️", "How much", "Follow the food label for your pet's ideal weight and check their body shape every couple of weeks. Your vet can show you how."],
    ["🍪", "Treats", "Treats: at most about a tenth of the day's food."],
    ["🔄", "Changing food", "Switch slowly, over 7 to 10 days."],
    ["💧", "Water", "Fresh water all day (many cats drink more from a fountain or a wide bowl). Rabbits need unlimited hay and water."],
  ],
};
function feedingGuide(p) {
  const tips = FEED_TIPS[p.species === "dog" ? "dog" : "other"];
  const ph = p.species === "dog" ? GUIDE_PHOTOS.feeding : null;
  return h("details.more-box.feed-guide.hv-guide", { "data-k": "feed-guide" },
    h("summary", h("span.hv-badge", { "aria-hidden": "true" }, "📖"),
      h("span.hv-guide-t", h("b", `How to feed ${p.name}`), h("span.small.muted", "Tips with pictures")), chevron()),
    ph ? h("figure.feed-photo", h("img", { src: ph.src, alt: ph.alt, loading: "lazy", width: "640", height: "633" }), h("figcaption", "Nova's dinner: soaked kibble + a spoon of wet food")) : null,
    h("ul.feed-tips", tips.map(([e, t, d]) => h("li", h("span.ft-e", { "aria-hidden": "true" }, e), h("span", h("b", `${t}. `), d)))),
    h("p.small.muted", "Your vet knows your pet: ask them about amounts, special diets and any weight change."),
    h("a.text-link", { href: "https://wsava.org/global-guidelines/global-nutrition-guidelines/", rel: "noopener" }, "WSAVA nutrition guidelines"));
}

export function foodSection(main, p) {
  const foods = forPet("foods");
  const current = foods.filter((f) => f.kind === "food" && !f.until).sort((a, b) => (b.since || "").localeCompare(a.since || ""))[0];
  const past = foods.filter((f) => f.kind === "food" && f !== current).sort((a, b) => (b.since || "").localeCompare(a.since || ""));
  const treats = foods.filter((f) => f.kind === "treat").sort((a, b) => (b.inUse !== false) - (a.inUse !== false) || a.name.localeCompare(b.name));
  const log = S.events.filter((e) => e.petId === p.id && (e.type === "meal" || e.type === "treat") && Date.now() - e.at < 7 * DAY).sort((a, b) => b.at - a.at);
  const meals = log.filter((e) => e.type === "meal").length, treatLogs = log.length - meals;

  const allergies = h("textarea", { id: "allergy", rows: "3", maxlength: "1000", value: p.allergies || "", placeholder: "e.g. chicken makes her itchy; no grapes" });
  const allergyForm = h("form.form", { novalidate: true, onsubmit: async (e) => {
    e.preventDefault();
    await save("pets", { ...p, allergies: allergies.value.trim() || undefined });
    toast("Saved.");
  } },
  h("div.field", h("label", { for: "allergy" }, "Allergies and foods to avoid"), allergies),
  h("button.btn.btn-line.sm", { type: "submit", "data-k": "save-allergy" }, "Save list"));
  const foodTitle = (f) => [f.brand, f.product].filter(Boolean).join(" · ") || "Food";

  put(main,
    h("section.sec", { "aria-labelledby": "h-food" },
      h("h2.sec-title", { id: "h-food" }, "Current food"),
      current ? h("div.card.food-card.hv-food",
        h("div.hv-food-top",
          h("span.hv-badge.big", { "aria-hidden": "true" }, "🥣"),
          h("div.hv-food-body",
            cardTitle(foodTitle(current), () => foodSheet(current), "edit-food"),
            current.amount ? h("p.hv-amount", h("b", "Per day: "), current.amount) : null)),
        current.since ? h("span.pill.ok.hv-since", `Since ${fmtDate(current.since)} · ${daysBetween(current.since, isoDate())} days`) : null,
        current.note ? h("p.small.muted", current.note) : null,
        h("div.card-actions",
          h("button.btn.btn-blue.sm", { type: "button", "data-k": "change-food", onclick: () => foodSheet() }, "Change food")))
        : emptyState(`What does ${p.name} eat? Add the food you use now, so you (and your vet) know when it changed.`,
          h("button.btn.btn-blue.sm", { type: "button", "data-k": "change-food", onclick: () => foodSheet() }, "Add current food"))),
    h("section.sec", { "aria-labelledby": "h-treats" },
      h("div.sec-row", h("h2.sec-title", { id: "h-treats" }, "Treats"),
        h("button.btn.btn-line.sm", { type: "button", "data-k": "add-treat", onclick: () => treatSheet() }, em("➕"), " Add a treat")),
      treats.length ? h("ul.hv-chips", treats.map((t) => {
        const on = t.inUse !== false;
        return h(`li.hv-treat.${on ? "on" : "off"}`,
          h("button.hv-treat-sw", { type: "button", role: "switch", "aria-checked": String(on), "data-k": `sw-${t.id}`,
            onclick: () => save("foods", { ...t, inUse: t.inUse === false }) },
          h("span.hv-treat-tick", { "aria-hidden": "true" }, on ? "✓" : "–"),
          h("span.hv-treat-txt", h("span.hv-treat-name", t.name), t.note ? h("span.hv-treat-note", t.note) : null),
          h("span.hv-treat-state", on ? "In use" : "Stopped"),
          h("span.vh", `: ${on ? "in use" : "stopped"}. Tap to switch.`)),
          h("button.hv-treat-edit", { type: "button", "data-k": `edit-${t.id}`, onclick: () => treatSheet(t) },
            h("span", { "aria-hidden": "true" }, "✎"), h("span.vh", `Edit ${t.name}`)));
      }))
        : emptyState("No treats listed. Add the ones you use, and switch them off when you stop."),
    ),
    h("section.hv-warn", { "aria-labelledby": "h-allergy" },
      h("div.hv-warn-head",
        h("span.hv-warn-e", { "aria-hidden": "true" }, "⚠️"),
        h("div", h("h2.sec-title", { id: "h-allergy" }, "Don't feed"), h("p.small", "Allergies and foods that don't agree with them. It goes on the vet summary."))),
      allergyForm),
    h("section.sec", { "aria-labelledby": "h-log" },
      h("div.sec-row", h("h2.sec-title", { id: "h-log" }, "Last 7 days"),
        h("div.row-btns",
          h("button.btn.btn-line.sm", { type: "button", "data-k": "f-meal", onclick: logMeal }, em("🍽️"), " Log meal"),
          h("button.btn.btn-line.sm", { type: "button", "data-k": "f-treat", onclick: logTreat }, em("🦴"), " Log treat"))),
      log.length ? [h("p.small.muted", `${meals} meal${meals === 1 ? "" : "s"} and ${treatLogs} treat${treatLogs === 1 ? "" : "s"} logged`),
        h("div.card.hv-listcard", eventList(log, (e) => eventSheet(e.type, e), { showDay: true }))]
        : emptyState("No meals or treats logged this week.")),
    feedingGuide(p),
    past.length ? h("section.sec", { "aria-labelledby": "h-fh" },
      h("h2.sec-title", { id: "h-fh" }, "Food history"),
      h("ul.cards", past.map((f) => h("li.card",
        cardTitle(foodTitle(f), () => foodSheet(f), `edit-${f.id}`),
        h("p.small.muted", `${f.since ? fmtDate(f.since) : "?"} to ${f.until ? fmtDate(f.until) : "now"}${f.amount ? ` · ${f.amount}` : ""}`),
        f.note ? h("p.small.muted", f.note) : null)))) : null,
  );
}
