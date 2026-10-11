// Trainer: the human's growth. Rank (Rookie → Handler → Coach → Mentor, in-app learning milestones, not a
// qualification), where the XP came from, the "1% a day adds up" curve (real data only), the Academy (short lessons
// with a 2-question check, +40 XP once each), and at Coach, a "Go pro" card with real routes into the job.

import { S, pet, save, setSetting } from "../state.js";
import { h, put, em, fmtDate, toast } from "../util.js";
import { subBar, sampleStrip, NOVA, chevron } from "./parts.js";
import { gameOf, trainerFor, trainerName, worldPets, withRewards, bar } from "./gameui.js";
import { RANKS, XP, curve } from "../game.js";
import { saveError } from "../forms.js";

export function trainer(main, arg) {
  const lessons = S.content.LESSONS || [];
  if (arg) {
    const i = lessons.findIndex((l) => l.id === arg);
    if (i >= 0) { lesson(main, lessons[i], i, lessons.length); return; }
  }
  const p = pet();
  const tr = trainerFor(p);
  const done = tr.lessonsDone;
  const isCoach = RANKS.findIndex((r) => r.id === tr.rank.id) >= 2;
  const P = tr.parts;
  put(main,
    subBar("Trainer", "#/home", "Back to Home"),
    sampleStrip(p),
    h("section.rank-card", { "aria-labelledby": "rk-h" },
      h("p.eyebrow", trainerName() === "You" ? "Your trainer rank" : `${trainerName()}'s trainer rank`),
      h("h2", { id: "rk-h" }, tr.rank.name),
      h("p.rank-xp", h("b", `${tr.xp} XP`), tr.next ? ` · ${tr.next.xp - tr.xp} to ${tr.next.name}` : " · top rank"),
      bar(tr.next ? tr.into : 1, tr.next ? tr.need : 1, "gold"),
      h("ol.rank-ladder", RANKS.map((r) => h(`li${tr.xp >= r.xp ? ".reached" : ""}${r.id === tr.rank.id ? ".current" : ""}`,
        h("span.rl-dot", { "aria-hidden": "true" }, tr.xp >= r.xp ? "✓" : ""),
        h("span.rl-name", r.name), h("span.rl-xp", `${r.xp.toLocaleString()} XP`),
        h("span.vh", tr.xp >= r.xp ? ", reached" : ", not yet")))),
      h("p.small.muted", "Trainer ranks are learning milestones in this app, not a qualification."),
      p.sample ? h("p.small.muted", "Sample mode: Nova's sample progress counts here, never towards your real rank.") : null),
    h("section.sec", { "aria-labelledby": "xp-h" },
      h("h2.sec-title", { id: "xp-h" }, "Where your XP came from"),
      h("table.xp-table", h("tbody",
        row("Training sessions", `+${XP.session} each`, P.sessions),
        row("Skill level-ups", `+${XP.levelUp} each`, P.levelUps),
        row("Care tasks", `+${XP.care} each`, P.care),
        row("Academy lessons", `+${XP.lesson} once each`, P.lessons),
        row("Weekly quests", `+${XP.quest} each`, P.quests))),
      h("p.small.muted", "XP comes from real things you did, worked out from your diary. Never from opening the app, likes or shares.")),
    curveSection(p),
    h("section.sec", { "aria-labelledby": "ac-h" },
      h("div.sec-row", h("h2.sec-title", { id: "ac-h" }, "Academy"), h("span.small.muted", `${done.size} of ${lessons.length} done`)),
      h("p.small.muted", `1 to 2 minutes each, reward-based, with sources. Pass the 2-question check for +${XP.lesson} XP, once.`),
      h("ul.lesson-list", lessons.map((l, i) => h("li", h("a.lesson-row", { href: `#/trainer/${encodeURIComponent(l.id)}`, "data-k": `ls-${l.id}` },
        h("span.ls-em", { "aria-hidden": "true" }, done.has(l.id) ? "✅" : l.emoji),
        h("span.ls-body", h("span.ls-title", `${i + 1}. ${l.title}`), h("span.ls-meta", done.has(l.id) ? "Done" : `${l.minutes} min · +${XP.lesson} XP`)),
        chevron()))))),
    isCoach ? goPro() : h("p.note-line", em("🎓"), " At Coach rank (1,000 XP), Nova shows how people get qualified to train other people's dogs for real."),
    nameForm());
}

const row = (k, rate, v) => h("tr", h("th", { scope: "row" }, k, h("span.xp-rate", ` ${rate}`)), h("td", `${v} XP`));

function nameForm() {
  const input = h("input", { type: "text", id: "tn-in", maxlength: "40", value: S.settings.trainerName || "", autocomplete: "off", placeholder: "e.g. Shiv" });
  return h("details.more-box.name-box",
    h("summary", "What should Nova call you?"),
    h("form.inline-form", { novalidate: true, onsubmit: async (e) => {
      e.preventDefault();
      try { await setSetting("trainerName", input.value.trim().slice(0, 40), { quiet: false }); toast("Noted. Nova will try to remember."); } catch (ex) { toast(saveError(ex)); }
    } },
    h("label", { for: "tn-in" }, "Your name (optional, stays on this device)"),
    h("div.input-row", input, h("button.btn.btn-blue", { type: "submit" }, "Save"))));
}

function goPro() {
  const routes = S.content.GO_PRO || [];
  return h("section.gopro", { "aria-labelledby": "gp-h" },
    h("h2", { id: "gp-h" }, em("🚀"), " Go pro"),
    h("p", "Want to train other people's dogs for real? Here's how people get qualified."),
    h("ul.gopro-list", routes.map((r) => h("li", h("b", r.title), h("p.small", r.text), h("a", { href: r.url, rel: "noopener" }, r.link)))),
    h("p.small.muted", "Nova's Pack isn't affiliated with any of these. Check current details, costs and accreditation yourself."));
}

// ---------- the 1% curve: small multiples, one per measure (different scales never share an axis) ----------
function curveSection(p) {
  const pts = curve(worldPets(p).map(gameOf), Date.now(), 12);
  const head = h("h2.sec-title", { id: "cv-h" }, "1% a day adds up");
  if (pts.length < 2) {
    return h("section.sec", { "aria-labelledby": "cv-h" }, head,
      h("p.empty", pts.length ? "Your curve starts this week. Come back next week and you'll see it climb." : "Your curve starts with your first session. Small steps, every week."));
  }
  const series = [["sessions", "Training sessions"], ["levels", "Skill levels gained"], ["stamps", "Adventure stamps"]];
  const label = (t) => new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  return h("section.sec", { "aria-labelledby": "cv-h" }, head,
    h("p.small.muted", `Totals so far, week by week, over the last ${pts.length} weeks. Real logs only.`),
    h("div.curves", series.map(([k, name]) => spark(pts, k, name, label))),
    h("details.more-box", h("summary", "Show as a table"),
      h("table.xp-table.curve-table",
        h("thead", h("tr", h("th", { scope: "col" }, "Week of"), series.map(([, n]) => h("th", { scope: "col" }, n)))),
        h("tbody", pts.map((pt) => h("tr", h("th", { scope: "row" }, label(pt.start)), series.map(([k]) => h("td", String(pt[k])))))))));
}

function spark(pts, key, name, label) {
  const W = 300, H = 72, L = 6, R = 10, T = 10, B = 8;
  const vals = pts.map((p) => p[key]);
  const max = Math.max(1, ...vals);
  const x = (i) => L + (i / (pts.length - 1)) * (W - L - R);
  const y = (v) => T + (1 - v / max) * (H - T - B);
  const NS = "http://www.w3.org/2000/svg";
  const el = (n, a = {}) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const first = vals[0], last = vals[vals.length - 1];
  const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "spark", role: "img", "aria-label": `${name}: ${first} at the start, ${last} now.` });
  svg.append(el("line", { x1: L, x2: W - R, y1: H - B, y2: H - B, class: "c-grid" }));
  const line = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  svg.append(el("polygon", { points: `${x(0)},${H - B} ${line} ${x(vals.length - 1)},${H - B}`, class: "sp-area" }));
  svg.append(el("polyline", { points: line, class: "c-line" }));
  svg.append(el("circle", { cx: x(vals.length - 1), cy: y(last), r: 4, class: "c-dot" }));
  // hover / tap: crosshair + value
  const cross = el("line", { y1: T, y2: H - B, class: "c-cross", visibility: "hidden" });
  const hot = el("circle", { r: 5, class: "c-hot", visibility: "hidden" });
  svg.append(cross, hot);
  const tip = h("span.sp-tip", { "aria-hidden": "true" }, "");
  const hit = el("rect", { x: 0, y: 0, width: W, height: H, fill: "transparent" });
  const show = (ev) => {
    const r = svg.getBoundingClientRect();
    const px = ((ev.clientX - r.left) / r.width) * W;
    const i = Math.max(0, Math.min(vals.length - 1, Math.round(((px - L) / (W - L - R)) * (vals.length - 1))));
    cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i)); cross.setAttribute("visibility", "visible");
    hot.setAttribute("cx", x(i)); hot.setAttribute("cy", y(vals[i])); hot.setAttribute("visibility", "visible");
    tip.textContent = `Week of ${label(pts[i].start)}: ${vals[i]}`;
  };
  const hide = () => { cross.setAttribute("visibility", "hidden"); hot.setAttribute("visibility", "hidden"); tip.textContent = ""; };
  hit.addEventListener("pointermove", show); hit.addEventListener("pointerdown", show); hit.addEventListener("pointerleave", hide);
  svg.append(hit);
  const gain = last - first;
  return h("figure.spark-card",
    h("figcaption", h("span.sp-name", name), h("b.sp-val", String(last)), h("span.sp-gain", gain > 0 ? `+${gain} in ${pts.length} weeks` : "steady")),
    svg, tip);
}

// ---------- one lesson ----------
function lesson(main, l, i, n) {
  const p = pet();
  const done = S.academy.find((r) => r.lessonId === l.id);
  const form = h("form.form.quiz", { novalidate: true });
  const result = h("div.quiz-result", { "aria-live": "polite" });
  l.check.forEach((q, qi) => {
    const name = `q-${l.id}-${qi}`;
    form.append(h("fieldset.fs.quiz-q",
      h("legend", `${qi + 1}. ${q.q}`),
      h("div.quiz-opts", q.options.map((o, oi) => {
        const id = `${name}-${oi}`;
        return h("div.check.radio", h("input", { type: "radio", name, id, value: String(oi) }), h("label", { for: id }, o));
      })),
      h("p.quiz-why", { hidden: true })));
  });
  put(form, result, h("div.row-btns.left", h("button.btn.btn-blue", { type: "submit", "data-k": "quiz-check" }, "Check my answers")));
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    let right = 0, missing = false;
    l.check.forEach((q, qi) => {
      const fs = form.querySelectorAll(".quiz-q")[qi];
      const picked = form.querySelector(`input[name="q-${l.id}-${qi}"]:checked`);
      const why = fs.querySelector(".quiz-why");
      if (!picked) { missing = true; why.hidden = true; return; }
      const ok = Number(picked.value) === q.answer;
      if (ok) right++;
      why.hidden = false;
      why.className = `quiz-why ${ok ? "ok" : "no"}`;
      why.textContent = `${ok ? "Right." : "Not quite."} ${q.why}`;
    });
    if (missing) { result.textContent = "Pick an answer for both questions."; return; }
    if (right < l.check.length) { result.textContent = `${right} of ${l.check.length}. Have another look and try again: no limit, no judgement.`; return; }
    if (done) { result.textContent = "Both right. You'd already earned this one's XP. Refreshers are good for you."; return; }
    try {
      await withRewards(p, () => save("academy", { id: l.id, lessonId: l.id, doneAt: Date.now() }));
      toast(`Lesson done: ${l.title}. +${XP.lesson} trainer XP. Nova is impressed (she won't say it twice).`);
    } catch (ex) { result.textContent = saveError(ex); }
  });
  put(main,
    subBar(l.title, "#/trainer", "Back to Trainer"),
    h("article.lesson", { "aria-labelledby": "page-title" },
      h("p.eyebrow", `Lesson ${i + 1} of ${n} · ${l.minutes} min read${done ? " · done" : ""}`),
      h("p.lesson-intro", h("img.disc", { src: NOVA, alt: "", width: "40", height: "40" }), h("span", l.intro)),
      l.parts.map((part) => h("section.lesson-part",
        h("h2", part.h),
        part.p ? h("p", part.p) : null,
        part.list ? h("ul", part.list.map((x) => h("li", x))) : null)),
      h("p.takeaway", h("b", "Take-away: "), l.takeaway),
      h("section.quiz-sec", { "aria-labelledby": "quiz-h" },
        h("h2", { id: "quiz-h" }, "Quick check"),
        done ? h("p.small", em("✅"), ` Done on ${fmtDate(done.doneAt || Date.now())}. +${XP.lesson} XP earned.`) : h("p.small.muted", `Both right for +${XP.lesson} trainer XP, once.`),
        form),
      h("section.lesson-src", { "aria-labelledby": "src-h" },
        h("h2", { id: "src-h" }, "Sources and further reading"),
        h("ul.src-list", l.sources.map((s) => h("li", h("a", { href: s.url, rel: "noopener" }, s.title))))),
      h("p.vet-first", em("🩺"), " General education, not a diagnosis. Worried about your dog's health or behaviour? Talk to your vet first.")),
    i + 1 < n ? h("a.btn.btn-line.wide.next-lesson", { href: `#/trainer/${encodeURIComponent(S.content.LESSONS[i + 1].id)}` }, `Next: ${S.content.LESSONS[i + 1].title}`) : null);
}
