// v8.6 "Bran's week": a Sunday (and Monday) recap of the real week, Monday to Sunday. Only what was logged: days
// together, walks, meals, play, training, stamps and badges, with a share card. Nothing shows for an empty week (no guilt).
// Home shows a small card on Sunday (this week) and Monday (last week) until you close it; More → "This week" any day.

import { S, setSetting } from "../state.js";
import { h, put, sheet, fmtDate, isoDate, toast, isoWeek } from "../util.js";
import { weekBounds } from "../game.js";
import { gameOf } from "./gameui.js";
import { avatar } from "./parts.js";

/** The numbers for one week: offset 0 = this week, -1 = last week. */
export function weekRecap(p, offset = 0) {
  const [a0] = weekBounds(Date.now());
  const start = new Date(a0); start.setDate(start.getDate() + 7 * offset);
  const end = new Date(start); end.setDate(end.getDate() + 7);
  const [a, b] = [start.getTime(), end.getTime()];
  const ev = S.events.filter((e) => e.petId === p.id && e.at >= a && e.at < b);
  const count = (t) => ev.filter((e) => e.type === t).length;
  const fromIso = isoDate(start), toIso = isoDate(new Date(b - 1));
  const stamps = (S.adventures || []).filter((s) => s.petId === p.id && s.date >= fromIso && s.date <= toIso);
  const days = new Set([...ev.map((e) => isoDate(new Date(e.at))), ...stamps.map((s) => s.date)]);
  let badges = [];
  if (!S.settings.careOnly) { try { badges = gameOf(p).badges.filter((x) => x.earned && x.at && x.at >= a && x.at < b); } catch { badges = []; } }
  const photos = [...ev.filter((e) => e.photo).map((e) => ({ src: e.photo, at: e.at })), ...stamps.filter((s) => s.photo).map((s) => ({ src: s.photo, at: s.at || 0 }))]
    .sort((x, y) => y.at - x.at).slice(0, 6).map((x) => x.src);
  return { photos, key: `${p.id}|${isoWeek(a)}`, start: a, end: b - 1, days: days.size, walks: count("walk"), meals: count("meal"), play: count("play"),
    sessions: count("training"), care: count("care") + count("task") + count("med"), stamps: stamps.length, badges, total: ev.length + stamps.length };
}

const LINE = (n, name) => n >= 6 ? `${n} days out of 7. ${name} has the best human in the pack. I said what I said.`
  : n >= 3 ? `${n} days together. That's a week won. ${name} noticed every one.`
    : n ? `${n} ${n === 1 ? "day" : "days"} together. Small weeks count too. Monday is a fresh start.` : "";

function tiles(r) {
  return [["🗓️", `${r.days}/7`, "Days together"], ["🚶", r.walks, "Walks"], ["🍽️", r.meals, "Meals"], ["🧶", r.play, "Play"],
    ["🎯", r.sessions, "Training"], ["💊", r.care, "Care"], ["📍", r.stamps, "Stamps"], ["🏅", r.badges.length, "Badges"]]
    .filter(([, n], i) => i === 0 || Number(n) > 0);
}
const range = (r) => `${fmtDate(r.start, { day: "numeric", month: "short" })} – ${fmtDate(r.end, { day: "numeric", month: "short" })}`;
const subLine = (r) => tiles(r).slice(1, 4).map(([, n, l]) => `${n} ${l.toLowerCase()}`).join(" · ");

/** The full recap in a sheet, with "Share the week". */
export function recapSheet(p, offset = 0) {
  const r = weekRecap(p, offset);
  sheet(offset ? `${p.name}'s last week` : `${p.name}'s week`, (body) => {
    put(body,
      h("div.rc-hero", avatar(p, 72), h("p.rc-range", range(r))),
      r.total ? h("ul.rc-tiles", tiles(r).map(([e, n, l]) => h("li.rc-tile", h("span.rc-e", { "aria-hidden": "true" }, e), h("b", String(n)), h("span", l))))
        : h("p.muted", "Nothing logged this week yet. One tap on Today starts it."),
      r.photos.length ? h("div.rc-photos", { role: "group", "aria-label": "Photos this week" }, r.photos.map((src, i) => h("img", { src, alt: "", width: "120", height: "120", style: `--r:${[-3, 2, -1, 3, -2, 1][i]}deg` }))) : null,
      r.badges.length ? h("p.rc-badges", "New: ", r.badges.map((x) => `${x.emoji} ${x.name}`).join(", ")) : null,
      r.days ? h("p.rc-line", LINE(r.days, p.name)) : null,
      r.total && !p.sample ? h("button.btn.btn-blue.wide", { type: "button", "data-k": "rc-share", onclick: async () => {
        try {
          const m = await import("../sharecard.js");
          m.openTrophyCard({ pet: { name: p.name, photo: p.photo, icon: p.icon, species: p.species }, kind: "week", emoji: "🗓️",
            title: `${r.days} ${r.days === 1 ? "day" : "days"} together`, sub: subLine(r), date: r.end });
        } catch { toast("Couldn't open the card. Try again."); }
      } }, "📸 Share the week") : null);
  });
}

/** Home's small card: Sunday shows this week, Monday shows last week. Hidden once closed, and for an empty week. */
export function recapCard(p) {
  if (!p || p.sample) return null;
  const day = new Date().getDay();
  if (day !== 0 && day !== 1) return null;
  const offset = day === 0 ? 0 : -1;
  const r = weekRecap(p, offset);
  if (!r.days || S.settings.recapSeen === r.key) return null;
  return h("section.rc-card", { "aria-labelledby": "rc-h" },
    h("button.rc-open", { type: "button", "data-k": "rc-open", onclick: () => recapSheet(p, offset) },
      h("span.rc-e", { "aria-hidden": "true" }, "🗓️"),
      h("span.rc-t", h("b", { id: "rc-h" }, offset ? `${p.name}'s last week` : `${p.name}'s week`), h("span", `${r.days} ${r.days === 1 ? "day" : "days"} together · ${subLine(r) || "see it"}`))),
    h("button.rc-x", { type: "button", "data-k": "rc-close", "aria-label": "Hide the week card", onclick: () => setSetting("recapSeen", r.key, { quiet: false }).catch(() => {}) }, "✕"));
}
