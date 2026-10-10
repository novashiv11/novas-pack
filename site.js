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

  return { CHALLENGES, challenge, daysToSaturday, isoWeek, store, streak, tickThisWeek, resetStreak };
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
