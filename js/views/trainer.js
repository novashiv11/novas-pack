// Trainer: the human's growth. Rank (Rookie → Handler → Coach → Mentor, in-app learning milestones, not a
// qualification), where the XP came from, the "1% a day adds up" curve (real data only), the Academy (short lessons
// with a 2-question check, +40 XP once each), and at Coach, a "Go pro" card with real routes into the job.
// Lessons can be tagged with `species` (data/academy.js): a pet sees the untagged ones plus its own species'. Rank still
// counts every lesson ever finished, so nobody loses XP when the list changes or they switch pet.
// v7: the lessons are a list with progress rings, and a lesson opens as a card-by-card PLAYER (one card at a time, a
// progress bar, one big button, one question per screen, and a slide-up banner for right / not quite).

import { S, pet, save, setSetting } from "../state.js";
import { h, put, em, fmtDate, toast, buzz, motionOK } from "../util.js";
import { sampleStrip, NOVA, chevron, trainNav, pageHead } from "./parts.js";
import { gameOf, trainerFor, trainerName, worldPets, withRewards, bar, confetti } from "./gameui.js";
import { RANKS, XP, curve } from "../game.js";
import { saveError } from "../forms.js";
import { ringIcon, novaSay } from "./training.js";

/** The lessons this pet sees: untagged ones (everyone) plus those tagged with its species. The sample world and "no pet" see all. */
export function lessonsFor(all, p) {
  if (!p || p.sample) return all;
  return all.filter((l) => !l.species || l.species.includes(p.species));
}

const RANK_EM = { rookie: "🌱", handler: "🦮", coach: "🎓", mentor: "🏆" };

export function trainer(main, arg) {
  const all = S.content.LESSONS || [];
  const p = pet();
  const lessons = lessonsFor(all, p);
  if (arg) {
    const l = all.find((x) => x.id === arg); // a direct link to any lesson still opens, even one not in this pet's list
    if (l) { lesson(main, l, lessons); return; }
  }
  PLAYER.id = null; // back on the list: the next lesson starts from its first card
  const tr = trainerFor(p);
  const done = tr.lessonsDone;
  const doneHere = lessons.filter((l) => done.has(l.id)).length;
  const isCoach = RANKS.findIndex((r) => r.id === tr.rank.id) >= 2;
  const P = tr.parts;
  const curId = (lessons.find((l) => !done.has(l.id)) || {}).id;
  const rIdx = RANKS.findIndex((r) => r.id === tr.rank.id);
  put(main,
    pageHead("Academy"), trainNav("academy"),
    sampleStrip(p),
    h("section.rank-card.rk7", { "aria-labelledby": "rk-h" },
      h("div.rk-top",
        h("span.rk-medal", { "aria-hidden": "true" }, RANK_EM[tr.rank.id] || "🎓"),
        h("div.rk-head",
          h("p.eyebrow", trainerName() === "You" ? "Your trainer rank" : `${trainerName()}'s trainer rank`),
          h("h2", { id: "rk-h" }, tr.rank.name),
          h("p.rank-xp", h("b", `${tr.xp} XP`), !tr.next ? " · top rank"
            : tr.xp >= tr.next.xp ? ` · ${tr.lessonsToGo} more Academy lesson${tr.lessonsToGo === 1 ? "" : "s"} to ${tr.next.name}`
              : ` · ${tr.next.xp - tr.xp} to ${tr.next.name}${tr.lessonsToGo ? ` (plus ${tr.next.lessons} lessons)` : ""}`))),
      bar(tr.next ? tr.into : 1, tr.next ? tr.need : 1, "gold"),
      h("ol.rank-ladder", RANKS.map((r, i) => h(`li${i <= rIdx ? ".reached" : ""}${r.id === tr.rank.id ? ".current" : ""}`,
        h("span.rl-dot", { "aria-hidden": "true" }, i <= rIdx ? "✓" : ""),
        h("span.rl-name", r.name), h("span.rl-xp", `${r.xp.toLocaleString()} XP${r.lessons ? ` + ${r.lessons} lessons` : ""}`),
        h("span.vh", i <= rIdx ? ", reached" : ", not yet")))),
      h("p.small.muted", "Trainer ranks are learning milestones in this app, not a qualification."),
      p && p.sample ? h("p.small.muted", "Sample mode: Nova's sample progress counts here, never towards your real rank.") : null),
    h("section.sec", { "aria-labelledby": "ac-h" },
      h("div.ac-head",
        h("div", h("h2.sec-title", { id: "ac-h" }, "Academy"), h("p.small.muted", `${doneHere} of ${lessons.length} done`)),
        h("span.ac-ring", { "aria-hidden": "true", style: `--p:${lessons.length ? Math.round((doneHere / lessons.length) * 100) : 0}` }, h("span", `${doneHere}/${lessons.length}`))),
      novaSay(`1 to 2 minutes each, reward-based, with sources. Pass the ${(lessons[0] && lessons[0].check.length) || 2}-question check for +${XP.lesson} XP, once.`),
      h("ul.lesson-list.ls-path", lessons.map((l, i) => h(`li${done.has(l.id) ? ".done" : ""}`,h(`a.lesson-row.ls7${done.has(l.id) ? ".done" : ""}${l.id === curId ? ".cur" : ""}`, { href: `#/trainer/${encodeURIComponent(l.id)}`, "data-k": `ls-${l.id}` },
        ringIcon(done.has(l.id) ? "✅" : l.emoji, done.has(l.id) ? 100 : 0, "ls-em"),
        h("span.ls-body", h("span.ls-title", `${i + 1}. ${l.title}`), h("span.ls-meta", done.has(l.id) ? "Done" : `${l.minutes} min · +${XP.lesson} XP`)),
        l.id === curId ? h("span.ls-go", "Start") : chevron()))))),
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
  const head = h("h2.sec-title", { id: "cv-h" }, "Do it for them: it adds up");
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

// ---------- one lesson: the card-by-card player ----------
// Cards: intro → one per part → take-away → one question per screen → result. State lives here (not in the view) because
// saving the pass redraws the page, and the result card has to survive that redraw.
const PLAYER = { id: null, step: 0, pick: {}, res: {}, earned: false, conf: false, err: "" };
const playerFor = (id) => {
  if (PLAYER.id !== id) Object.assign(PLAYER, { id, step: 0, pick: {}, res: {}, earned: false, conf: false, err: "" });
  return PLAYER;
};
window.addEventListener("hashchange", () => { if (!location.hash.startsWith("#/trainer/")) PLAYER.id = null; });
const CHEERS = ["Nice!", "Spot on!", "Right!", "Yes!"];
const KEYS = ["A", "B", "C", "D", "E"];

function lesson(main, l, list) {
  const p = pet();
  const i = list.indexOf(l), n = list.length, next = i >= 0 && i + 1 < n ? list[i + 1] : null;
  const done = S.academy.find((r) => r.lessonId === l.id);
  const st = playerFor(l.id);
  const cards = [{ k: "intro" }, ...l.parts.map((part) => ({ k: "part", part })), { k: "take" }, ...l.check.map((q, qi) => ({ k: "q", q, qi })), { k: "end" }];
  const last = cards.length - 1, firstQ = cards.findIndex((c) => c.k === "q"), Q = l.check.length;
  st.step = Math.max(0, Math.min(st.step, last));

  const barFill = h("span");
  const bar = h("div.lp-bar", { role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(last), "aria-label": "Lesson progress" }, barFill);
  const stage = h("div.lp-stage");
  const foot = h("footer.lp-foot");
  const banner = h("div.lp-fb", { "aria-live": "polite" });
  put(main, h("div.lp", { "data-k": "lesson-player" },
    h("header.lp-top",
      h("a.lp-x", { href: "#/trainer", "data-k": "lp-close" }, h("span.vh", "Close the lesson and go back to the Academy"), xIcon()),
      bar, h("h1.vh", { tabindex: "-1", id: "page-title" }, l.title)),
    stage, foot, banner));

  const go = (s, focusHead = true) => { st.step = s; render(focusHead); };
  const allRight = () => l.check.every((_, qi) => st.res[qi] === true);
  const rightCount = () => l.check.filter((_, qi) => st.res[qi] === true).length;
  const earn = async () => {
    st.earned = true; st.err = "";
    render(false);
    try {
      await withRewards(p, () => save("academy", { id: l.id, lessonId: l.id, doneAt: Date.now() }));
      toast(`Lesson done: ${l.title}. +${XP.lesson} trainer XP. Nova is impressed (she won't say it twice).`);
    } catch (ex) { st.earned = false; st.err = saveError(ex); render(false); }
  };
  const advance = () => {
    const to = st.step + 1;
    go(to);
    if (to === last && allRight() && !done && !st.earned) earn();
  };
  const btn = (txt, k, fn, cls = "btn-blue") => h(`button.btn.${cls}.wide.lp-go`, { type: "button", "data-k": k, onclick: fn }, txt);

  function render(focusHead = true) {
    const c = cards[st.step];
    bar.setAttribute("aria-valuenow", String(st.step));
    barFill.style.width = `${(st.step / last) * 100}%`;
    banner.className = "lp-fb"; banner.replaceChildren();
    foot.hidden = false; foot.replaceChildren();
    const motion = motionOK();
    let card;
    if (c.k === "intro") {
      card = h("section.lp-card.lp-intro", { "aria-labelledby": "lp-h" },
        ringIcon(l.emoji, done ? 100 : 0, "lp-hero"),
        h("p.eyebrow", `${i >= 0 ? `Lesson ${i + 1} of ${n}` : "Lesson"} · ${l.minutes} min${done ? " · done" : ""}`),
        h("h2", { id: "lp-h", tabindex: "-1" }, l.title),
        novaSay(l.intro, ""),
        h("p.lp-note", done ? `Done on ${fmtDate(done.doneAt || Date.now())}. +${XP.lesson} XP earned. Refreshers are good for you.` : `Pass the ${Q}-question check for +${XP.lesson} trainer XP, once.`));
      foot.append(btn("Start", "lp-next", advance));
    } else if (c.k === "part") {
      const pi = cards.slice(0, st.step).filter((x) => x.k === "part").length + 1;
      card = h("section.lp-card.lp-part", { "aria-labelledby": "lp-h" },
        h("p.eyebrow", `Part ${pi} of ${l.parts.length}`),
        h("h2", { id: "lp-h", tabindex: "-1" }, c.part.h),
        c.part.p ? h("p.lp-p", c.part.p) : null,
        c.part.list ? h("ul.lp-list", c.part.list.map((x) => h("li", h("span.lp-dot", { "aria-hidden": "true" }, "✓"), h("span", x)))) : null);
      foot.append(backBtn(), btn("Continue", "lp-next", advance));
    } else if (c.k === "take") {
      card = h("section.lp-card.lp-take", { "aria-labelledby": "lp-h" },
        h("p.eyebrow", "Take-away"),
        h("h2", { id: "lp-h", tabindex: "-1" }, "The one thing to remember"),
        novaSay(l.takeaway, "proud"),
        h("details.fold.lp-src", h("summary", "Sources and further reading"),
          h("ul.src-list", l.sources.map((s) => h("li", h("a", { href: s.url, rel: "noopener" }, s.title))))),
        h("p.vet-first", em("🩺"), " General education, not a diagnosis. Worried about your pet's health or behaviour? Talk to your vet first."));
      foot.append(backBtn(), btn("On to the quick check", "lp-next", advance));
    } else if (c.k === "q") {
      const { q, qi } = c;
      const name = `q-${l.id}-${qi}`, checked = st.res[qi] !== undefined, picked = st.pick[qi];
      const check = btn("Check", "quiz-check", () => {
        if (st.pick[qi] === undefined) return;
        const ok = Number(st.pick[qi]) === q.answer;
        st.res[qi] = ok; buzz(ok ? 12 : 40);
        render(false);
      });
      check.disabled = picked === undefined;
      card = h("section.lp-card.lp-q", { "aria-labelledby": "lp-h" },
        h("p.eyebrow", `Question ${qi + 1} of ${Q}`),
        h("fieldset.lp-fs", h("legend", { id: "lp-h", tabindex: "-1" }, q.q),
          h("div.lp-opts", q.options.map((o, oi) => {
            const id = `${name}-${oi}`;
            const cls = checked ? (oi === q.answer ? ".ok" : Number(picked) === oi ? ".no" : ".dim") : "";
            return h(`div.lp-opt${cls}`,
              h("input", { type: "radio", name, id, value: String(oi), checked: picked !== undefined && Number(picked) === oi, disabled: checked, onchange: () => { st.pick[qi] = oi; check.disabled = false; buzz(6); } }),
              h("label", { for: id }, h("span.lp-key", { "aria-hidden": "true" }, KEYS[oi] || String(oi + 1)), h("span.lp-ot", o)));
          }))));
      if (checked) {
        const ok = st.res[qi];
        foot.hidden = true;
        banner.className = `lp-fb show ${ok ? "ok" : "no"}`;
        banner.append(
          h("div.fb-body",
            h("p.fb-title", h("span", { "aria-hidden": "true" }, ok ? "✓" : "✕"), ok ? CHEERS[qi % CHEERS.length] : "Not quite"),
            h("p.fb-text", ok ? q.why : `Right answer: ${q.options[q.answer]}. ${q.why}`)),
          btn(qi === Q - 1 ? "See how I did" : "Continue", "quiz-next", advance, ok ? "btn-ok" : "btn-warn"));
        setTimeout(() => { const b = banner.querySelector("button"); if (b) b.focus({ preventScroll: true }); }, 0);
      } else foot.append(check);
    } else {
      const right = rightCount(), pass = right === Q;
      if (pass && motion && !st.conf) { st.conf = true; confetti(); }
      card = h("section.lp-card.lp-end", { "aria-labelledby": "lp-h" },
        h("img.lp-nova", { src: NOVA, alt: "", width: "96", height: "96" }),
        h("h2", { id: "lp-h", tabindex: "-1" }, pass ? "Lesson complete!" : `${right} of ${Q}`),
        h("p.lp-p", pass ? (done && !st.earned ? "Both right. You'd already earned this one's XP. Refreshers are good for you." : "Both right. Nova is impressed (she won't say it twice).")
          : "Have another look and try again: no limit, no judgement."),
        h("ul.lp-tiles",
          h("li.tile.t-xp", h("b", pass && st.earned ? `+${XP.lesson}` : pass ? "✓" : "–"), h("span", pass && st.earned ? "Trainer XP" : pass ? "XP already earned" : "No XP yet")),
          h("li.tile.t-q", h("b", `${right}/${Q}`), h("span", "Right first time"))),
        st.err ? h("p.form-error", { role: "alert" }, st.err) : null);
      if (pass) {
        foot.append(next ? h("a.btn.btn-blue.wide.lp-go", { href: `#/trainer/${encodeURIComponent(next.id)}`, "data-k": "lp-next-lesson" }, `Next: ${next.title}`)
          : h("a.btn.btn-blue.wide.lp-go", { href: "#/trainer", "data-k": "lp-done" }, "Back to the Academy"),
        next ? h("a.linkish.lp-sec", { href: "#/trainer", "data-k": "lp-done" }, "Back to the Academy") : null);
      } else {
        foot.append(btn("Try the questions again", "lp-retry", () => { st.pick = {}; st.res = {}; go(firstQ); }),
          h("button.linkish.lp-sec", { type: "button", "data-k": "lp-reread", onclick: () => { st.pick = {}; st.res = {}; go(0); } }, "Read the lesson again"));
      }
    }
    stage.replaceChildren(card);
    stage.scrollTop = 0;
    if (focusHead) { const hd = card.querySelector("[tabindex='-1']"); if (hd) hd.focus({ preventScroll: true }); }
    function backBtn() {
      return h("button.btn.btn-line.lp-back", { type: "button", "data-k": "lp-back", onclick: () => go(st.step - 1) }, h("span.vh", "Previous card"), chevron("left"));
    }
  }
  render(false);
}

function xIcon() {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true");
  s.innerHTML = '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" fill="none"/>';
  return s;
}
