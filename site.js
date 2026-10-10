// Nova's Pack site script. No cookies, no tracking, no network requests.
//
// THE ONE SETTING: paste the Discord invite link between the quotes, e.g.
//   const COMMUNITY_URL = "https://discord.gg/AbC123";
// Until it's set, the "Join the pack chat" buttons stay hidden and the chat is labelled "Opening soon".
const COMMUNITY_URL = "";

const NP = (() => {
  // Weekly challenge rotation. Week 0 starts Monday 12 Oct 2026 (UTC).
  const ANCHOR = Date.UTC(2026, 9, 12);
  const WEEK = 7 * 24 * 3600 * 1000;
  const CHALLENGES = [
    { tag: "#NewToThePack", text: "Introduce your animal, or yourself if you're pet-less for now." },
    { tag: "#OffDuty", text: "The most relaxed nap pose you've ever seen. Any species." },
    { tag: "#GoldenHour", text: "Your animal in the evening light: walk, garden or windowsill." },
    { tag: "#SideBySide", text: "You and your animal, side by side. Faces optional." },
    { tag: "#SnackFace", text: "The face they make when snacks appear." },
    { tag: "#ThrowbackPet", text: "Then and now: their baby photo next to today." },
    { tag: "#MyPetsJob", text: "Their job title, based on their worst habit." },
    { tag: "#NewTrick", text: "A trick or skill you're learning together. Treats and praise only." },
  ];

  function weekIndex(now = Date.now()) {
    return Math.floor((now - ANCHOR) / WEEK);
  }
  function challenge(now = Date.now()) {
    const i = Math.max(0, weekIndex(now)) % CHALLENGES.length; // before launch week: #NewToThePack
    return CHALLENGES[i];
  }
  function daysToSaturday(now = new Date()) {
    // Days until Saturday in the visitor's own time zone. 0 means today.
    return (6 - now.getDay() + 7) % 7;
  }

  // ISO week id like "2026-W41", based on the visitor's local date.
  function isoWeek(d = new Date()) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((t - yearStart) / 86400000 + 1) / 7);
    return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
  }
  function mondayOf(d) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7));
    return t;
  }

  // Storage that never throws (private mode, blocked storage).
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch { /* ignore */ }
    },
  };

  // Weekly Pack streak, honour system, saved on this device only.
  // Rule: 1 grace week for every 4 weeks you take part (max 2 saved). The current week never breaks a streak.
  const STREAK_KEY = "np-streak-v1";
  function streak(now = new Date()) {
    const ticked = new Set(weeksList());
    const thisWeek = isoWeek(now);
    if (ticked.size === 0) return { weeks: 0, graces: 0, doneThisWeek: false };
    const first = [...ticked].sort()[0];
    // Walk week by week from the first ticked week to now.
    let cursor = mondayOf(now); // a UTC-midnight date; isoWeek reads it as a plain date
    const id0 = (c) => isoWeekPlain(c);
    const weeks = [];
    for (let i = 0; i < 520; i++) {
      const id = id0(cursor);
      weeks.unshift(id);
      if (id <= first) break;
      cursor = new Date(cursor.getTime() - WEEK);
    }
    let count = 0, graces = 0, sinceGrace = 0;
    for (const id of weeks) {
      if (ticked.has(id)) {
        count++; sinceGrace++;
        if (sinceGrace === 4) { graces = Math.min(2, graces + 1); sinceGrace = 0; }
      } else if (id !== thisWeek) {
        if (graces > 0) graces--;
        else { count = 0; sinceGrace = 0; }
      }
    }
    return { weeks: count, graces, doneThisWeek: ticked.has(thisWeek) };
  }
  function weeksList() {
    const raw = store.get(STREAK_KEY, []);
    return Array.isArray(raw) ? raw.filter((x) => typeof x === "string" && /^\d{4}-W\d{2}$/.test(x)) : [];
  }
  // Same as isoWeek, for dates that are already UTC midnights.
  function isoWeekPlain(t0) {
    const t = new Date(t0.getTime());
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((t - yearStart) / 86400000 + 1) / 7);
    return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
  }
  // Returns true if it was saved.
  function tickThisWeek(now = new Date()) {
    const list = weeksList();
    const id = isoWeek(now);
    if (!list.includes(id)) list.push(id);
    return store.set(STREAK_KEY, list.slice(-260));
  }
  function resetStreak() { store.remove(STREAK_KEY); }

  // Last n weeks, oldest first, for the streak dots.
  function lastWeeks(n = 8, now = new Date()) {
    const ticked = new Set(weeksList());
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * WEEK);
      const id = isoWeek(d);
      out.push({ id, done: ticked.has(id), current: i === 0 });
    }
    return out;
  }

  // Small confetti burst. Skipped when the visitor prefers reduced motion.
  function confetti(originEl) {
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = originEl ? originEl.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
    const c = document.createElement("canvas");
    c.className = "confetti"; c.width = innerWidth; c.height = innerHeight; c.setAttribute("aria-hidden", "true");
    document.body.append(c);
    const g = c.getContext("2d"), cols = ["#F2B544", "#1F4E6E", "#C27A3A", "#E0566E", "#8EC1E0"];
    const bits = Array.from({ length: 70 }, () => ({
      x: r.left + r.width / 2, y: r.top + r.height / 2,
      vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 12 - 4,
      s: 5 + Math.random() * 6, a: Math.random() * 6, c: cols[(Math.random() * cols.length) | 0],
    }));
    let t = 0;
    (function frame() {
      g.clearRect(0, 0, c.width, c.height);
      bits.forEach((p) => { p.vy += 0.45; p.x += p.vx; p.y += p.vy; p.a += 0.2; g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore(); });
      if (++t < 75) requestAnimationFrame(frame); else c.remove();
    })();
  }

  return { CHALLENGES, challenge, daysToSaturday, isoWeek, store, streak, tickThisWeek, resetStreak, lastWeeks, confetti };
})();

// Wire up shared page bits.
(() => {
  const hasCommunity = /^https:\/\/(discord\.gg|discord\.com\/invite)\/[\w-]+\/?$/.test(COMMUNITY_URL);
  document.querySelectorAll("[data-community]").forEach((a) => {
    if (hasCommunity) { a.href = COMMUNITY_URL; a.hidden = false; }
  });
  document.querySelectorAll("[data-if-community]").forEach((el) => { el.hidden = !hasCommunity; });
  document.querySelectorAll("[data-if-no-community]").forEach((el) => { el.hidden = hasCommunity; });
  document.querySelectorAll("[data-needs-community]").forEach((el) => {
    el.dataset.status = hasCommunity ? "live" : "soon";
    el.textContent = hasCommunity ? "Open now" : "Opening soon";
  });

  const c = NP.challenge();
  document.querySelectorAll("[data-challenge-tag]").forEach((el) => { el.textContent = c.tag; });
  document.querySelectorAll("[data-challenge-text]").forEach((el) => { el.textContent = c.text; });
  const d = NP.daysToSaturday();
  document.querySelectorAll("[data-shoutout-when]").forEach((el) => {
    el.textContent = d === 0 ? "Shout-out Saturday is today." : `Shout-out Saturday in ${d} day${d === 1 ? "" : "s"}.`;
  });
})();

// ---------- Home page interactions (only run where the elements exist) ----------
(() => {
  const $ = (sel) => document.querySelector(sel);

  // Boop Nova: random replies, a rare golden one, a personal counter.
  const boop = $("#boop");
  if (boop) {
    const LINES = [
      "Boop received. Filing it under 'acceptable'.",
      "That's my nose. I'll allow it once.",
      "Snacks first, boops second. You've got it backwards.",
      "My human boops me 40 times a day. I'm still waiting on that raise.",
      "Boop logged. Have you made your Pack Card yet?",
      "Excuse me, I'm working. Professionally.",
      "Fine. One more. Then you join the pack.",
      "Every species welcome. Even people who boop without asking.",
    ];
    const GOLDEN = "🌟 Golden boop! Rare. Screenshot this and tag @novathehumanhandler.";
    const bubble = $("#boopSay"), count = $("#boopCount");
    let n = NP.store.get("np-boops", 0);
    if (typeof n !== "number" || n < 0) n = 0;
    const show = () => { if (count) count.textContent = n ? `Your boops: ${n}` : ""; };
    show();
    let last = -1;
    boop.addEventListener("click", () => {
      n += 1; NP.store.set("np-boops", n); show();
      let line;
      if (Math.random() < 0.05) { line = GOLDEN; NP.confetti(boop); }
      else { let i; do { i = (Math.random() * LINES.length) | 0; } while (i === last); last = i; line = LINES[i]; }
      bubble.textContent = line;
      boop.classList.remove("bounce"); void boop.offsetWidth; boop.classList.add("bounce");
    });
  }

  // Who's in your family? Nova replies and the CTA personalises.
  const fam = $("#family");
  if (fam) {
    const say = $("#familySay"), cta = $("#familyCta");
    const REPLIES = {
      dog: ["Dogs", "A fellow professional. Respect."],
      cat: ["Cats", "Cats! I respect cats. From a distance."],
      bird: ["Birds", "Birds are welcome. Please keep the singing to daytime."],
      small: ["Small pets", "Small but mighty. Rabbits run this place, honestly."],
      horse: ["Horses", "A horse? You win. You win everything."],
      scaly: ["Scaly friends", "Lizards and fish: calm, mysterious, very welcome."],
      other: ["Pets", "Chickens, goats, a tortoise called Kevin? All pack."],
      none: ["You", "No pet yet? Still pack. You can borrow my human."],
    };
    fam.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-sp]");
      if (!b) return;
      fam.querySelectorAll("button[data-sp]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      const [who, line] = REPLIES[b.dataset.sp] || REPLIES.other;
      say.textContent = line;
      cta.href = `card.html?species=${b.dataset.sp}`;
      cta.textContent = b.dataset.sp === "none" ? "Make your supporter card →" : `Make a card for your ${who.toLowerCase().replace(/s$/, "")} →`;
    });
  }

  // Countdown ring to Shout-out Saturday + copy the hashtag.
  const ring = $("#ringFill");
  if (ring) {
    const d = NP.daysToSaturday();
    const frac = (7 - d) / 7; // fuller as Saturday nears
    const C = 2 * Math.PI * 34;
    ring.style.strokeDasharray = `${C}`;
    ring.style.strokeDashoffset = `${C * (1 - frac)}`;
    const num = $("#ringNum"), lab = $("#ringLab");
    if (num) num.textContent = d === 0 ? "🎉" : String(d);
    if (lab) lab.textContent = d === 0 ? "today" : d === 1 ? "day" : "days";
  }
  const copy = $("#copyTag");
  if (copy) {
    copy.addEventListener("click", async () => {
      const tag = `${NP.challenge().tag} #NovasPack @novathehumanhandler`;
      try { await navigator.clipboard.writeText(tag); copy.textContent = "Copied ✓"; }
      catch { copy.textContent = tag; }
      setTimeout(() => { copy.textContent = "Copy hashtag"; }, 2500);
    });
  }

  // Highlight today in the weekly timeline.
  const day = new Date().getDay(); // 0 Sun … 6 Sat
  document.querySelectorAll("[data-day]").forEach((el) => {
    if (Number(el.dataset.day) === day) { el.classList.add("today"); el.setAttribute("aria-current", "date"); }
  });
})();
