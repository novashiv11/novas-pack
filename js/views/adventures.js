// Adventures: the Adventure Book. A grid of real-life firsts (data/adventures.js), greyed until earned. Tap one,
// add the date and an optional photo (shrunk on the device, location data removed), +20 XP once. Walks are logged
// here too, in one tap, and feed the walk milestones.

import { S, pet, save, remove, eventsOf } from "../state.js";
import { h, put, em, sheet, toast, confirmBox, isoDate, fmtDate, fmtDay, fmtTime, resizePhoto } from "../util.js";
import { logWalk, eventSheet, saveError } from "../forms.js";
import { pageHead, sampleStrip, NOVA, trainNav } from "./parts.js";
import { gameOf, withRewards, bar } from "./gameui.js";
import { XP, CAPS, weekBounds } from "../game.js";
import { stampsFor } from "../../data/adventures.js";

export function adventures(main) {
  const p = pet();
  const a = gameOf(p);
  const dog = p.species === "dog";
  const stamps = stampsFor(S.content.STAMPS || [], p.species);
  const sets = (S.content.STAMP_SETS || []).filter((set) => stamps.some((s) => s.set === set.id));
  const earned = new Map(a.stamps.map((s) => [s.stampId, s]));
  put(main,
    sampleStrip(p),
    pageHead("Adventures"), trainNav("adv"), h("div", h("p.nova-line", h("img.disc.nova-face", { src: NOVA, alt: "", width: "28", height: "28" }),
      h("span", h("span.vh", "Nova says: "), dog ? `${earned.size} of ${stamps.length} stamps. The world is big. Let's sniff it.` : `${earned.size} of ${stamps.length} stamps. Small brave firsts count.`))),
    dog ? walkCard(p, a) : null,
    sets.map((set) => {
      const list = stamps.filter((s) => s.set === set.id);
      const got = list.filter((s) => earned.has(s.id)).length;
      return h("section.sec", { "aria-labelledby": `set-${set.id}` },
        h("div.sec-row", h("h2.sec-title", { id: `set-${set.id}` }, em(set.emoji), " ", set.title), h("span.small.muted", `${got} of ${list.length}`)),
        h("ul.stamp-grid", list.map((s) => stampTile(p, a, s, earned.get(s.id)))));
    }),
    h("p.note-line", em("🔒"), " Photos stay on this device. They're shrunk and their location data is removed. No places are ever saved."));
}

function walkCard(p, a) {
  const walks = eventsOf("walk");
  const [w0, w1] = weekBounds(Date.now());
  const week = walks.filter((e) => e.at >= w0 && e.at < w1).length;
  const next = (S.content.STAMPS || []).filter((s) => s.auto && s.auto.walks > a.walks.length).sort((x, y) => x.auto.walks - y.auto.walks)[0];
  return h("section.walk-card", { "aria-labelledby": "walk-h" },
    h("div.walk-top",
      h("div", h("h2", { id: "walk-h" }, "Walks"),
        h("p.walk-n", h("b", String(a.walks.length)), " counted · ", `${week} this week`)),
      h("button.btn.btn-blue", { type: "button", "data-k": "log-walk", onclick: logWalk }, em("🚶"), " Log a walk")),
    next ? [bar(a.walks.length, next.auto.walks, "gold"), h("p.small.muted", `${next.auto.walks - a.walks.length} more to the ${next.title} stamp.`)]
      : h("p.small.muted", "Every walk milestone stamped. Legendary. Keep sniffing."),
    walks.length ? h("details.more-box.walk-list",
      h("summary", `Recent walks (${Math.min(walks.length, 10)})`),
      h("ul.tl", walks.slice(0, 10).map((e) => h("li.tl-item",
        h("button.tl-row", { type: "button", "data-k": `ev-${e.id}`, onclick: () => eventSheet("walk", e) },
          h("span.tl-dot", { "aria-hidden": "true" }, "🚶"),
          h("span.tl-body", h("span.tl-time", `${fmtDay(e.at)}, ${fmtTime(e.at)}`), h("span.tl-text", e.minutes ? `${e.minutes} min` : "Walk")),
          h("span.vh", ", edit")))))) : null);
}

function stampTile(p, a, s, got) {
  const label = got ? `${s.title}: earned ${fmtDate(got.at, { day: "numeric", month: "short" })}`
    : s.auto ? `${s.title}: not yet, ${Math.min(a.walks.length, s.auto.walks)} of ${s.auto.walks} walks` : `${s.title}: not yet, +${XP.stamp} XP`;
  return h(`li.stamp${got ? ".got" : ""}`,
    h("button.stamp-btn", { type: "button", "data-k": `st-${s.id}`, "aria-label": label, onclick: () => stampSheet(p, s, got) },
      h("span.stamp-disc", { "aria-hidden": "true" },
        got && got.row && got.row.photo ? h("img", { src: got.row.photo, alt: "" }) : h("span.stamp-em", s.emoji)),
      h("span.stamp-title", { "aria-hidden": "true" }, s.title),
      h("span.stamp-meta", { "aria-hidden": "true" }, got ? fmtDate(got.date || got.at, { day: "numeric", month: "short" }) : s.auto ? `${Math.min(a.walks.length, s.auto.walks)} of ${s.auto.walks}` : `+${XP.stamp} XP`)));
}

function stampSheet(p, s, got) {
  if (s.auto) {
    const a = gameOf(p);
    sheet(`${s.emoji} ${s.title}`, (body, close) => {
      put(body,
        h("p", got ? `Earned on ${fmtDate(got.at)}. One walk at a time.` : `${Math.min(a.walks.length, s.auto.walks)} of ${s.auto.walks} walks.`),
        bar(Math.min(a.walks.length, s.auto.walks), s.auto.walks, "gold"),
        h("p.small.muted", s.tip),
        got ? null : h("button.btn.btn-blue", { type: "button", onclick: () => { close(); logWalk(); } }, "Log a walk now"));
    });
    return;
  }
  if (got && got.row) { viewStamp(p, s, got.row); return; }
  stampForm(p, s, null);
}

function viewStamp(p, s, row) {
  sheet(`${s.emoji} ${s.title}`, (body, close) => {
    put(body,
      row.photo ? h("img.stamp-photo", { src: row.photo, alt: `Photo for ${s.title}` }) : null,
      h("p", h("b", "Earned "), fmtDate(row.date || isoDate(new Date(row.at)))),
      row.note ? h("p", row.note) : null,
      h("p.small.muted", s.tip),
      h("div.row-btns",
        h("button.btn.btn-line", { type: "button", onclick: async () => {
          if (!(await confirmBox(`Remove ${s.title}?`, `The stamp, its photo and its ${XP.stamp} XP will go. You can earn it again.`, "Remove", true))) return;
          close();
          await remove("adventures", row.id);
          toast("Stamp removed.", [["Undo", () => save("adventures", row)]]);
        } }, "Remove"),
        h("button.btn.btn-blue", { type: "button", onclick: () => { close(); setTimeout(() => stampForm(p, s, row), 0); } }, "Edit")));
  });
}

function stampForm(p, s, existing) {
  sheet(existing ? `Edit: ${s.title}` : `${s.emoji} ${s.title}`, (body, close) => {
    let photo = existing && existing.photo ? existing.photo : null;
    const form = h("form.form", { novalidate: true });
    const err = h("p.form-error", { role: "alert" });
    const date = h("input", { type: "date", id: "st-date", required: true, max: isoDate(), value: existing ? existing.date || isoDate(new Date(existing.at)) : isoDate() });
    const note = h("input", { type: "text", id: "st-note", maxlength: "280", value: existing && existing.note ? existing.note : "", autocomplete: "off", placeholder: "e.g. she found a crab. Diplomacy followed." });
    const preview = h("img.photo-preview", { alt: "", hidden: !photo, src: photo || undefined, width: "72", height: "72" });
    const file = h("input", { type: "file", id: "st-photo", accept: "image/*" });
    const msg = h("p.hint", { role: "status" });
    const drop = h("button.linkish", { type: "button", hidden: !photo, onclick: () => { photo = null; preview.hidden = true; drop.hidden = true; file.value = ""; } }, "Remove photo");
    file.addEventListener("change", async () => {
      const f = file.files && file.files[0];
      if (!f) return;
      try { photo = await resizePhoto(f, 800); preview.src = photo; preview.hidden = false; drop.hidden = false; msg.textContent = "Photo ready. Resized on your phone, location data removed."; }
      catch { msg.textContent = "Couldn't read that photo. Try a JPG or PNG."; }
    });
    put(form,
      h("p.what", s.tip),
      h("div.field", h("label", { for: "st-date" }, "When"), date),
      h("div.field", h("label", { for: "st-photo" }, "Photo", h("span.opt", " (optional)")), h("div.photo-row", preview, h("div", file, drop)),
        h("p.hint", "Stays on this device. Shrunk, with location data removed."), msg),
      h("div.field", h("label", { for: "st-note" }, "A line about it", h("span.opt", " (optional)")), note),
      err,
      h("div.row-btns", h("button.btn.btn-blue", { type: "submit", "data-k": "stamp-save" }, existing ? "Save" : `Add stamp (+${XP.stamp} XP)`)));
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!date.value) { err.textContent = "Pick the date."; date.focus(); return; }
      const day = date.value > isoDate() ? isoDate() : date.value;
      const row = { id: `${p.id}:${s.id}`, petId: p.id, stampId: s.id, date: day, at: existing ? existing.at : Date.now(), photo: photo || undefined, note: note.value.trim() || undefined };
      if (p.sample) row.sample = true;
      for (const k of Object.keys(row)) if (row[k] === undefined) delete row[k];
      close();
      try {
        if (existing) { await save("adventures", row); toast("Saved."); return; }
        await withRewards(p, () => save("adventures", row));
        toast(`Stamp earned: ${s.title}. +${XP.stamp} XP. Good adventure.`, [["Undo", () => remove("adventures", row.id)]]);
      } catch (ex) { toast(saveError(ex)); }
    });
    put(body, form);
  });
}
