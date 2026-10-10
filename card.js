// Pack Card maker. Runs entirely in the browser: the photo is never uploaded or stored.
(() => {
  const SPECIES = [
    { id: "dog", label: "Dog", stats: ["Zoomies", "Snack radar", "Sofa claim"],
      titles: ["Head of Snack Security", "Chief Zoomies Officer", "Professional Sofa Inspector", "Director of Squirrel Affairs", "Professional Human Handler"] },
    { id: "cat", label: "Cat", stats: ["Judgement", "Table-clearing", "Nap mastery"],
      titles: ["Minister of Judgement", "Senior Keyboard Warmer", "Head of Knocking Things Over", "Chief Box Inspector"] },
    { id: "bird", label: "Bird", stats: ["Volume", "Shoulder time", "Seed snobbery"],
      titles: ["Lead Vocalist", "Chief Shoulder Officer", "Head of Early Mornings"] },
    { id: "small", label: "Rabbit or small pet", stats: ["Binkies", "Cable chewing", "Cuteness"],
      titles: ["Binky Champion", "Cable Inspector", "Head of Hay Quality"] },
    { id: "horse", label: "Horse or pony", stats: ["Carrot radar", "Mud rolling", "Drama"],
      titles: ["Carrot Accountant", "Mud Spa Manager", "Head of Dramatic Snorts"] },
    { id: "scaly", label: "Reptile or fish", stats: ["Chill", "Basking", "Mystery"],
      titles: ["Chief Basking Officer", "Professional Lurker", "Head of Staying Calm"] },
    { id: "other", label: "Other", stats: ["Chaos", "Charm", "Snack radar"],
      titles: ["Head of Chaos", "Household Celebrity", "Chief Morale Officer"] },
    { id: "none", label: "No pet yet", stats: ["Animal love", "Treat pockets", "Patience"],
      titles: ["Pack Supporter", "Future Pet Parent", "Professional Petter of Other People's Dogs"] },
  ];
  const DEFAULT_STATS = [72, 88, 95];
  const STATE_KEY = "np-card-v1";
  const C = { blue: "#1F4E6E", oat: "#F3F2EB", ink: "#1E1B17", muted: "#5C544B", tan: "#C27A3A", tanText: "#8E5019", gold: "#F2B544", sunk: "#E9E6DB", soft: "#DCE7F0" };

  const $ = (id) => document.getElementById(id);
  const canvas = $("card"), ctx = canvas.getContext("2d");
  const form = $("cardForm"), status = $("status");
  const raw = NP.store.get(STATE_KEY, {});
  const saved = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const state = {
    species: (() => {
      const q = new URLSearchParams(location.search).get("species");
      if (SPECIES.some((s) => s.id === q)) return q;
      return SPECIES.some((s) => s.id === saved.species) ? saved.species : "dog";
    })(),
    name: typeof saved.name === "string" ? saved.name.slice(0, 20) : "",
    title: typeof saved.title === "string" ? saved.title : "",
    custom: typeof saved.custom === "string" ? saved.custom.slice(0, 32) : "",
    stats: Array.isArray(saved.stats) && saved.stats.length === 3 ? saved.stats.map((n) => clamp(+n || 0)) : DEFAULT_STATS.slice(),
    photo: null,
  };
  function clamp(n) { return Math.max(0, Math.min(100, Math.round(n))); }
  function sp() { return SPECIES.find((s) => s.id === state.species); }
  function save() {
    const { species, name, title, custom, stats } = state;
    NP.store.set(STATE_KEY, { species, name, title, custom, stats });
  }

  // ---------- form ----------
  const speciesBox = $("species");
  SPECIES.forEach((s) => {
    const id = `sp-${s.id}`;
    const input = Object.assign(document.createElement("input"), { type: "radio", name: "species", id, value: s.id, checked: s.id === state.species });
    const label = Object.assign(document.createElement("label"), { htmlFor: id, textContent: s.label });
    speciesBox.append(input, label);
  });
  speciesBox.addEventListener("change", (e) => {
    state.species = e.target.value;
    state.title = "";
    buildTitles(); buildStats(); update();
  });

  const nameInput = $("petName"), titleSel = $("title"), customInput = $("customTitle");
  nameInput.value = state.name;
  customInput.value = state.custom;
  nameInput.addEventListener("input", () => { state.name = nameInput.value.slice(0, 20); update(); });
  customInput.addEventListener("input", () => { state.custom = customInput.value.slice(0, 32); update(); });
  titleSel.addEventListener("change", () => { state.title = titleSel.value; update(); });

  function buildTitles() {
    titleSel.replaceChildren(...sp().titles.map((t) => Object.assign(document.createElement("option"), { value: t, textContent: t })));
    if (!sp().titles.includes(state.title)) state.title = sp().titles[0];
    titleSel.value = state.title;
  }
  function buildStats() {
    const box = $("stats");
    box.replaceChildren();
    sp().stats.forEach((label, i) => {
      const id = `stat-${i}`;
      const row = document.createElement("div");
      row.className = "stat";
      const l = Object.assign(document.createElement("label"), { htmlFor: id, textContent: label });
      const out = Object.assign(document.createElement("output"), { htmlFor: id, textContent: state.stats[i] });
      const r = Object.assign(document.createElement("input"), { type: "range", id, min: 0, max: 100, step: 1, value: state.stats[i] });
      r.addEventListener("input", () => { state.stats[i] = clamp(+r.value); out.textContent = state.stats[i]; update(); });
      row.append(l, out, r);
      box.append(row);
    });
  }

  $("photo").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { say("That file isn't an image. Try a photo."); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); state.photo = img; update(); say("Photo added. It stays on your device."); };
    img.onerror = () => { URL.revokeObjectURL(url); say("Couldn't read that photo. Try a JPG or PNG."); };
    img.src = url;
  });
  form.addEventListener("submit", (e) => e.preventDefault());

  // ---------- drawing ----------
  const head = new Image();
  head.src = "img/brand/nova-head.svg";

  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function font(weight, size, display) {
    return `${weight} ${size}px ${display ? '"Bricolage Grotesque"' : '"Plus Jakarta Sans"'}, system-ui, sans-serif`;
  }
  function fit(text, maxW, size, weight, display, min = 24) {
    let s = size;
    ctx.font = font(weight, s, display);
    while (ctx.measureText(text).width > maxW && s > min) { s -= 2; ctx.font = font(weight, s, display); }
    if (ctx.measureText(text).width > maxW) {
      while (text.length > 1 && ctx.measureText(text + "…").width > maxW) text = text.slice(0, -1);
      text += "…";
    }
    return text;
  }
  function chip(text, x, y, bg, fg, alignRight) {
    ctx.font = font(800, 30, false);
    const w = ctx.measureText(text).width + 44;
    const left = alignRight ? x - w : x;
    ctx.fillStyle = bg; rr(left, y, w, 56, 28); ctx.fill();
    ctx.fillStyle = fg; ctx.textBaseline = "middle"; ctx.textAlign = "left";
    ctx.fillText(text, left + 22, y + 29);
    ctx.textBaseline = "alphabetic";
  }
  function paw(cx, cy, s) {
    ctx.fillStyle = C.blue;
    ctx.beginPath(); ctx.ellipse(cx, cy + 40 * s, 70 * s, 58 * s, 0, 0, Math.PI * 2); ctx.fill();
    [[-80, -40, -0.3], [-30, -85, -0.1], [30, -85, 0.1], [80, -40, 0.3]].forEach(([dx, dy, rot]) => {
      ctx.beginPath(); ctx.ellipse(cx + dx * s, cy + dy * s, 26 * s, 34 * s, rot, 0, Math.PI * 2); ctx.fill();
    });
  }

  function draw() {
    const W = 1080, H = 1350, s = sp();
    const name = state.name.trim() || (s.id === "none" ? "Pack Supporter" : "Your pet's name");
    const title = state.custom.trim() || state.title;
    const ch = NP.challenge();
    const st = NP.streak();

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.blue; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.oat; rr(40, 40, 1000, 1270, 48); ctx.fill();

    // header
    if (head.complete && head.naturalWidth) {
      ctx.fillStyle = C.soft; ctx.beginPath(); ctx.arc(116, 112, 38, 0, Math.PI * 2); ctx.fill();
      ctx.drawImage(head, 84, 80, 64, 64);
    }
    ctx.fillStyle = C.ink; ctx.textAlign = "left"; ctx.font = font(800, 44, true);
    ctx.fillText("Nova's Pack", 170, 128);
    ctx.fillStyle = C.tanText; ctx.textAlign = "right"; ctx.font = font(800, 28, false);
    ctx.fillText("PACK CARD", 1000, 124);

    // photo
    const px = 80, py = 170, pw = 920, ph = 600;
    ctx.save(); rr(px, py, pw, ph, 32); ctx.clip();
    if (state.photo) {
      const img = state.photo, ir = img.naturalWidth / img.naturalHeight, br = pw / ph;
      let sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0;
      if (ir > br) { sw = sh * br; sx = (img.naturalWidth - sw) / 2; } else { sh = sw / br; sy = (img.naturalHeight - sh) / 3; }
      ctx.drawImage(img, sx, sy, sw, sh, px, py, pw, ph);
    } else {
      ctx.fillStyle = C.soft; ctx.fillRect(px, py, pw, ph);
      if (s.id === "none" && head.complete && head.naturalWidth) ctx.drawImage(head, px + pw / 2 - 190, py + ph / 2 - 200, 380, 380);
      else paw(px + pw / 2, py + ph / 2, 1.5);
    }
    ctx.restore();
    chip(s.label, px + 24, py + ph - 80, "#FFFFFF", C.ink, false);
    if (st.weeks > 0) chip(`${st.weeks}-week streak`, px + pw - 24, py + ph - 80, C.gold, C.ink, true);

    // name + title
    ctx.textAlign = "left";
    ctx.fillStyle = C.blue; const n = fit(name, 920, 96, 800, true, 48); ctx.fillText(n, 80, 870);
    ctx.fillStyle = C.tanText; const t = fit(title, 920, 40, 700, false, 26); ctx.fillText(t, 80, 928);

    // stats
    s.stats.forEach((label, i) => {
      const y = 1000 + i * 82, v = state.stats[i];
      ctx.fillStyle = C.ink; ctx.textAlign = "left"; ctx.font = font(700, 32, false); ctx.fillText(label, 80, y);
      ctx.textAlign = "right"; ctx.font = font(800, 34, true); ctx.fillText(String(v), 1000, y);
      ctx.fillStyle = C.sunk; rr(80, y + 16, 920, 20, 10); ctx.fill();
      if (v > 0) { ctx.fillStyle = C.gold; rr(80, y + 16, Math.max(20, 920 * v / 100), 20, 10); ctx.fill(); }
    });

    // footer
    ctx.textAlign = "left"; ctx.fillStyle = C.blue; ctx.font = font(800, 28, false);
    ctx.fillText(`#NovasPack · ${ch.tag}`, 80, 1268);
    ctx.textAlign = "right"; ctx.fillStyle = C.muted; ctx.font = font(600, 24, false);
    ctx.fillText("novashiv11.github.io/novas-pack", 1000, 1268);

    canvas.setAttribute("aria-label", `Preview of the Pack Card for ${name}, ${title}. Stats: ${s.stats.map((l, i) => `${l} ${state.stats[i]}`).join(", ")}.`);
  }

  // Keep a ready-made image so Share can run straight from the tap (iOS needs that).
  let queued = false, readyBlob = null, blobTimer = 0;
  function render() {
    draw();
    readyBlob = null;
    clearTimeout(blobTimer);
    blobTimer = setTimeout(() => canvas.toBlob((b) => { readyBlob = b; }, "image/png"), 400);
  }
  function update() {
    save();
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; render(); });
  }

  // ---------- share / download / caption ----------
  function say(msg) { status.textContent = msg; }
  function fileName() { return `pack-card-${(state.name.trim() || "nova-pack").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "nova-pack"}.png`; }
  function caption() {
    const name = state.name.trim() || "my pet";
    const title = state.custom.trim() || state.title;
    return `Meet ${name}, ${title} 🐾 Made my Pack Card at Nova's Pack. ${NP.challenge().tag} #NovasPack @novathehumanhandler`;
  }
  function toBlob() {
    draw();
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
  }
  function download(blob) {
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: fileName() });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  $("shareBtn").addEventListener("click", async () => {
    const blob = readyBlob || await toBlob();
    if (!blob) { say("Sorry, your browser couldn't make the image."); return; }
    const file = new File([blob], fileName(), { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "My Pack Card", text: caption() });
        say("Shared! Tag @novathehumanhandler so Nova sees it."); NP.confetti($("shareBtn"));
      } catch (err) {
        if (err && err.name !== "AbortError") { download(blob); say("Sharing didn't work here, so we downloaded it instead."); }
      }
    } else {
      download(blob);
      say("Downloaded. Post it and tag @novathehumanhandler.");
    }
  });
  $("downloadBtn").addEventListener("click", async () => {
    const blob = await toBlob();
    if (blob) { download(blob); say("Downloaded. Post it and tag @novathehumanhandler."); NP.confetti($("downloadBtn")); }
  });
  $("captionBtn").addEventListener("click", async () => {
    const text = caption();
    try { await navigator.clipboard.writeText(text); say("Caption copied."); }
    catch { say(text); }
  });

  // ---------- streak ----------
  function showStreak() {
    const st = NP.streak();
    $("streakWeeks").textContent = st.weeks;
    $("streakUnit").textContent = st.weeks === 1 ? "week" : "weeks";
    $("streakGrace").textContent = st.graces ? `Grace weeks saved: ${st.graces}` : "No grace weeks saved yet.";
    const btn = $("tickBtn");
    btn.setAttribute("aria-disabled", String(st.doneThisWeek));
    btn.textContent = st.doneThisWeek ? "Done for this week ✓" : "I took part this week";
    const dots = $("weekDots");
    if (dots) dots.replaceChildren(...NP.lastWeeks(8).map((w) => {
      const li = document.createElement("li");
      li.className = (w.done ? "done" : "") + (w.current ? " current" : "");
      li.textContent = w.done ? "✓" : "";
      li.setAttribute("aria-label", `${w.current ? "This week" : w.id}: ${w.done ? "took part" : "not yet"}`);
      return li;
    }));
  }
  $("diceBtn").addEventListener("click", () => {
    const t = sp().titles;
    let pick; do { pick = t[(Math.random() * t.length) | 0]; } while (t.length > 1 && pick === state.title);
    state.title = pick; state.custom = ""; customInput.value = ""; titleSel.value = pick;
    state.stats = state.stats.map(() => 40 + ((Math.random() * 61) | 0));
    if (Math.random() < 0.1) state.stats[(Math.random() * 3) | 0] = 100;
    buildStats(); update();
    say(state.stats.includes(100) ? "Ooh, a perfect 100. Rare." : "Rolled. Not happy? Roll again.");
  });
  $("tickBtn").addEventListener("click", () => {
    if (NP.streak().doneThisWeek) { say("Already counted this week. See you next week."); return; }
    if (!NP.tickThisWeek()) { say("Couldn't save on this device (private browsing?). Your card still works."); return; }
    showStreak(); render(); NP.confetti($("tickBtn"));
    say("Nice. See you next week.");
  });
  $("resetBtn").addEventListener("click", () => {
    if (!confirm("Delete your streak and card choices from this device?")) return;
    NP.resetStreak(); NP.store.remove(STATE_KEY);
    state.name = ""; state.custom = ""; state.stats = DEFAULT_STATS.slice(); state.photo = null;
    nameInput.value = ""; customInput.value = ""; $("photo").value = "";
    buildTitles(); buildStats(); showStreak(); render();
    say("Deleted from this device.");
  });

  // ---------- start ----------
  buildTitles(); buildStats(); showStreak(); render();
  Promise.all([
    document.fonts ? document.fonts.load('800 96px "Bricolage Grotesque"') : null,
    document.fonts ? document.fonts.load('700 32px "Plus Jakarta Sans"') : null,
    head.decode ? head.decode().catch(() => {}) : null,
  ]).then(render, render);
})();
