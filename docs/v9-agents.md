# v9: five agents in parallel ("10x the progress")

Shiv (15 Oct): "Make agents to 10x our progress, this is too slow."

Five builders work at the same time, each in its own git worktree and on its own files. Then the co-captain merges their work, an independent QA agent checks the whole app, and every Critical and Major finding is fixed before the push.

## Read first (only these)
- `CLAUDE.md`: brand, principles, tone.
- `docs/v8-feel.md`: what "the feel" is now.
- `css/v8-feel.css`: its tokens and patterns (grep it, don't copy it).

## Shared rules (every agent)
**Look and feel (v8):**
- The pet is the hero.
- Soft cards: `box-shadow:var(--elev)`, no hard outlines, `--hair` for hairlines.
- A colour per kind of care: `--c-meals`, `--c-walk`, `--c-play`, `--c-train`, `--c-poop`, `--c-eggs`, `--c-med`, `--c-own`.
- Gold only for rewards.
- The time-of-day sky (`.stage.tod-*` with `.st-sky`) for heroes.
- Compact Nova pill (`novaSay`).
- Light segmented controls.
- Spring presses (`--spring`).
- Respect `prefers-reduced-motion`.

**Duolingo-grade clarity:**
- One obvious next step per screen.
- Progress always visible.
- Bite-size.
- Instant feedback (`buzz()`, `sound("tick"|"win")` from `js/sound.js` for real wins only).

**Honest and safe:**
- Real data only.
- Vet-first, with no doses or diagnosis.
- Reward-based training only.
- Never XP for taps, opens or shares.
- No guilt, streak-loss, leaderboards or paywalls.
- Photos are shrunk on the device with `resizePhoto` and never uploaded.

**Accessible:**
- 44 px targets.
- AA contrast in light and dark, at every time of day.
- Visible focus.
- 320 px with no sideways scroll.

**Engineering:**
- Vanilla JS and the `h()` helper; no new libraries or fonts.
- Keep every existing `data-k` and add `data-k` to new controls.
- **Don't change the data model, XP rules or storage** unless your brief says so. New settings keys are OK if your brief names them.
- **CSS goes only in your own file `css/v9-<area>.css`.** It's already linked and precached; don't edit `index.html`, `sw.js`, `app.css`, `css/v7-*.css` or `css/v8-feel.css`.
- **Edit only the JS files you own.** If you need a change in another file, describe it in your report.
- **New JS modules:** you may create them under `js/views/` with your own prefix. List them in your report so the co-captain can add them to `sw.js` and to the modulepreload list.

**Testing:**
- Serve your worktree with `python3 -m http.server <your port> --bind 127.0.0.1` in the background.
- Use the Playwright kit: `require('/tmp/claude-0/-home-user-novas-pack/10b23907-acdb-5d78-8db3-158421021835/scratchpad/personas/harness.cjs')`. Its API is in the header. Pass `day0` to set the clock.
- `require('/tmp/claude-0/-home-user-novas-pack/10b23907-acdb-5d78-8db3-158421021835/scratchpad/onb7.cjs').addPet(s, 'Bran', 'dog')` onboards a pet.
- Write your scripts in `/tmp/claude-0/-home-user-novas-pack/10b23907-acdb-5d78-8db3-158421021835/scratchpad/v9<letter>/`.
- **Pass criteria,** at 320 light and 390 dark, on every screen you touched:
  - no console errors;
  - `H.overflow` is false;
  - `H.smallTargets` is empty.
- Run `node /tmp/claude-0/-home-user-novas-pack/10b23907-acdb-5d78-8db3-158421021835/scratchpad/v2/game.test.mjs`; all 27 tests must pass.
- Read at most 8 screenshots.

**Finish:**
- Commit in your worktree. The message ends with the co-author lines from your prompt.
- Don't push.
- Report in under 250 words: what changed, the files you touched, new modules, any shared-file changes you need, and 2 screenshot paths.

## Briefs

### A. Home, onboarding and welcome (`css/v9-home.css`, port 8851)
**Owns:** `js/views/home.js`, `js/views/welcome.js` (the onboarding wizard and welcome; not the app-shell hooks at the bottom), `js/views/ready.js`, `js/views/doitnow.js` (the plan and timer helpers only, if needed).

- **Onboarding wizard:**
  - Each step sits on a soft sky header that matches the time of day.
  - The species cards get the v8 look (no outlines, a spring press, a tinted emoji disc).
  - The "Here's Bran's day" preview rows use the care colours (add `data-cat` like Today's `.td-row`).
  - The photo step shows the photo or icon in the stage ring.
  - The final step ends with a short "Welcome to the pack" moment (`sound("win")`, confetti if motion is OK) before Today.
- **Home below Today:**
  - `dueToday`, `todaySoFar`, the folded "More for Bran" (`homeMore` and the partner card inside) and the nudge card get the v8 look.
  - Make "Today so far" a clean timeline with the care colours on its dots.
- **"No pet yet? Get ready" (`ready.js`):** a sky hero and v8 tiles.

### B. Train: path, skill page, timer, academy, adventures, level check (`css/v9-train.css`, port 8852)
**Owns:** `js/views/training.js`, `js/views/trainer.js`, `js/views/adventures.js`, `js/views/placement.js`.

- **Skills path:**
  - Nodes take the training colour (`--c-train`), with gold when a skill is at L3+.
  - The current node pulses.
  - Section banners become soft sky cards, not dark blocks.
  - Add a small header strip: "Bran · Level N · X XP to next", with a bar.
- **Skill page:**
  - A hero with the skill emoji in a ring (progress to the next level).
  - The steps are cleaner cards.
  - The sticky "Start" button stays.
- **Academy:** lesson rows as a path or list with rings. The rank card is v8-styled.
- **Adventures:**
  - The sticker album gets a die-cut sticker look; locked stamps are silhouettes.
  - The "Adventure Book" banner becomes a soft card.
  - The walk card is v8.
- **Level check:** v8 option tiles and the slide-up feedback.

### C. Health: dashboard, food, poop, unwell, vet summary (`css/v9-health.css`, port 8853)
**Owns:** `js/views/health.js`, `js/views/food.js`.

- **Health home:**
  - A small hero header for the pet's health: "All caught up" or "2 things due", in the sky style with a calm palette.
  - Then cards: Due soon with one-tap Done/Given, a weight card with an SVG **sparkline of the real weights** (needs at least 2 points; otherwise "Weigh in once a month"), and the poop week strip using `--c-poop`.
- **Food:** a current-food card, treats as chips, "Don't feed" as a red-accent warning card. Make the feeding guide a fold.
- **Unwell:** big symptom tiles, then one calm, vet-first result card with a phone button. Never a diagnosis.
- **Vet summary:** a clean, printable report look.

### D. More, profile, pets, badges, sticker jar, journal, and a new "Memories" page (`css/v9-more.css`, port 8854)
**Owns:** `js/views/more.js`, `js/views/journal.js`, `js/views/recap.js`.

- **New `#/more/memories`, "Memories":**
  - Every photo on this device for the current pet: walk, play and training event photos (`e.photo`), stamp photos (`S.adventures[].photo`) and the pet photo.
  - Grouped by month as a polaroid grid. Tapping one opens a sheet with the photo big, its date and what it was, e.g. "🚶 Walk · 12 Oct".
  - Empty state: Nova and "Add a photo after a walk: tap 📷 on the toast."
  - Add a row in More's "Level up" group, plus a link from the week recap.
- **Badges:** an achievement grid with v8 medals.
- **Treat jar:** a collectible album.
- **Pets list:** v8 cards.
- **Journal:** a chat-bubble timeline in the v8 style.
- Settings rows keep their v8 look; tidy any leftover v7 bits.

### E. Shared components: sheets, forms, timer, Mission complete, celebrations, toasts (`css/v9-ui.css`, port 8855)
**Owns:**
- `js/views/gameui.js`;
- `js/forms.js` (the look and markup of forms; not the data);
- `js/util.js`: only the `sheet` and `toast` functions, plus new UI helpers;
- `js/views/parts.js`.

- **Bottom sheets:**
  - **Swipe down to close:** drag the handle or header down past a threshold. Pointer events, with a spring back if not far enough.
  - Respect reduced motion.
  - The sticky bottom action bar.
- **Log forms (`eventSheet`):**
  - v8 option tiles (the poop scale as picture tiles, with `--c-poop` when chosen).
  - Minute tiles as chips.
  - The time row as "Now · Change".
  - Consistent field styles.
- **Timer (`startSession`):** the ring in `--c-train`, and the sky behind Nova.
- **Mission complete and the celebration sheet:** a sky header with Nova, stat tiles in the care colours, and the XP bar. Keep merged tiles.
- **Day complete (today.js):** describe what you'd change; don't edit `today.js`.
- **Toasts:** keep v8 (compact).
- **Pet sheet (`openPetSheet`):** v8 look; the photo in a ring.

## Shipped (16 Oct)
All five areas were built in parallel and merged with no conflicts, thanks to per-area files.

- **A. Home and onboarding:**
  - Onboarding steps sit on a time-of-day sky, with tinted species cards and care-coloured day preview rows.
  - The photo step shows the photo or icon in the stage ring.
  - A new "Welcome to the pack" screen (#/welcome/add/done) plays the win sound, fills a ring and shows confetti.
  - Home: "Due today" is a soft card, "Today so far" is a care-coloured timeline, and "More for Bran" and the nudges have the v8 look. Get ready has a sky hero.
- **B. Train:**
  - The path uses the training colour (gold from L3), with a "Bran · Level N" strip.
  - The skill page has a sky hero with a ring. The Academy is a ring path, and Adventures has die-cut stickers with silhouettes.
  - Fix: the tab bar no longer catches taps on full-screen lesson buttons.
- **C. Health:**
  - A calm sky hero ("All caught up" / "N things due").
  - One-tap Done/Given rows, and a weight sparkline spaced by real dates.
  - The poop week in the poop colour.
  - Unwell result card: shows "Find an emergency vet" (a map search) when there's no emergency number. The vet summary has a print button.
- **D. More:**
  - **Memories** (#/more/memories): every photo, grouped by month as polaroids.
  - Shiny medals, treat jar album pages, pet cards, and journal polish.
- **E. Shared:**
  - **Swipe down to close sheets.** Releasing outside a sheet no longer closes it.
  - Forms take their care colour, and the time row reads "Now · Change".
  - The timer and Mission complete sit in the sky, and the pet sheet has a sky hero.
- **Co-captain:** Day complete in the time-of-day sky, with tinted tiles.
