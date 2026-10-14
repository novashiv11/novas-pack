# v7: Duolingo-grade, screen by screen

Shiv (14 Oct): "Better, but come on yaar. Think like Duolingo for every screen, option and menu."

This doc is the brief for 5 parallel agents. Each one owns its own screens and files and follows the shared rules.

## Shared rules (every agent)
**What we take from Duolingo** (`docs/duolingo-lessons.md`, `docs/design-system.md`):
1. **One obvious next step per screen.** A big chunky primary button with a 4 px ledge, bottom-anchored on flows ("Continue", "Start", "Check"). Never two primaries.
2. **Progress is always visible:** bars, rings, paths, "2 of 5". The user always knows where they are and how far is left.
3. **Bite-size:** one question or one card per screen in flows (lessons, the level check, add pet). Big tap cards, not forms.
4. **Instant, juicy feedback:** a press animation on every tappable thing, a correct/incorrect banner sliding up from the bottom (green "Nice!" / soft "Not quite" with the right answer and why), haptic `navigator.vibrate` where available, and confetti only for real wins.
5. **Nova is the mascot in every moment:** a small Nova head with a speech bubble that reacts (happy, proud, thinking, sleepy for empty states). One line, never paragraphs.
6. **A journey you can see:** skills as a vertical **path** of round nodes (locked, current with a pulsing "Start", done with a gold check). Adventures as a sticker book.
7. **Menus like a profile and settings app:** an avatar header with stats (days this week, level, badges), then grouped rows with icons, chevrons and values.
8. **Empty states invite action:** Nova, one line, one button.
9. **Visual language:** brand tokens (blue `#1F4E6E`, gold `#F2B544` for rewards only, tan `#C27A3A`, oat `#F3F2EB`; dark mode `#14120F` / `#8EC1E0`); Bricolage Grotesque for display, Plus Jakarta Sans for body; 16 px cards, 12 px buttons with a ledge; emoji or SVG icons. Bright and friendly, never cluttered.

**What we never copy:**
- hearts or lives;
- streak-loss fear or guilt notifications;
- paywalls;
- leaderboards;
- fake numbers;
- XP for taps or opens.

**Honesty and safety:**
- vet-first;
- no doses or diagnosis;
- reward-based training only;
- only real data in stats.

**Accessibility:**
- 44 px tap targets;
- contrast AA in light and dark;
- `prefers-reduced-motion` respected (no movement, still clear);
- focus visible;
- works at 320 px with no sideways scroll.

**Engineering:**
- Vanilla JS with the `h()` helper (`js/util.js`); no new libraries.
- Keep every existing `data-k` attribute (tests use them), and add `data-k` to new controls.
- Don't change the data model, XP rules or storage. You may read state, but add no new stores.
- CSS goes ONLY in your own file (`css/v7-<area>.css`, already linked in `index.html` and precached). Don't edit `app.css` or `site.css`; override them in your file.
- Edit only the files you own (listed below). If you need a change in a shared file, describe it in your report instead.
- Test with `scratchpad/personas/harness.cjs` at 320 light and 390 dark: no console errors, no overflow, `smallTargets` empty. Take one before and one after screenshot per screen.
- Commit in your worktree (message ends with the co-author lines given in your prompt). Don't push.

## Briefs

### A. Shell, Today and onboarding (`css/v7-home.css`)
**Owns:** `js/views/home.js`, `js/views/today.js`, `js/views/welcome.js`, `js/views/ready.js`, `js/app.js` (drawChrome, the tab bar, the "+" button only), `index.html` (tab bar markup only).

- **Top bar like Duolingo's:** the pet chip on the left; on the right, honest stat pills: 🔥 days this week (x/7, from `weekAndSticker`), ⭐ partner level, 🍪 stickers. Tapping a pill explains it in a small sheet.
- **Today:**
  - The checklist rows become chunky "lesson node" tiles with a progress ring per row.
  - Completing a row plays a satisfying tick animation and shows a +XP pop where XP is real (training), otherwise a ✓.
  - Nova's bubble at the top reacts to progress (0, some, all).
  - "Day done" becomes one full-screen end card ("Day complete!", the week dots, the sticker, a Continue button) instead of stacked dialogs.
- **"+" sheet:** a bigger grid; the most-used types first (order by how often this pet logged each); one tap logs.
- **Onboarding (Add pet):** one question per screen with a progress bar.
  1. Who? (species as big picture cards)
  2. Name
  3. Photo or icon (skippable)
  4. Daily checklist preview ("Here's Nova's day")
  5. Reminder time
  6. Then Today. The level check is offered later from Train, not forced.
- **Welcome:** keep the tap-Nova hero; tighten the copy.

### B. Train: path, skill, timer flow, adventures, academy (`css/v7-train.css`)
**Owns:** `js/views/training.js`, `js/views/adventures.js`, `js/views/trainer.js`, `js/views/placement.js`.

- **Skills as a Duolingo path:**
  - A vertical winding path of round nodes grouped by level (Foundation → Next steps → Fun).
  - Each node is the skill emoji, with a ring for progress to its next level.
  - The current or recommended node pulses with a "Start" tooltip.
  - Done-to-L3 nodes are gold. Section headers are banners.
- **Skill page:** a header card with the level ring and "Level 2 → 3: 4 more sessions".
  - The big bottom "Start 3-minute session" button.
  - Steps as a swipeable or stacked card list with pictures.
  - "Why" and "Mistake" folded.
- **Academy:**
  - Lessons as a path or list with a progress ring.
  - The **lesson player** is card by card: each part is one card with a progress bar at the top and a "Continue" bottom button.
  - Check questions are one per screen with big option tiles and a Check button. Then a slide-up feedback banner (green correct, or soft tan "Not quite" plus the right answer and why), then an end card with +XP if it's the first pass.
- **Adventures:**
  - A sticker-album look: stamps as die-cut stickers in a grid, with locked ones shown as silhouettes.
  - Tapping a stamp opens a sheet with its tip and "I did it".
  - The walk card is compact.
- **Level check (placement):** keep one question per screen and add the slide-up feedback feel.

### C. Health: care, food, poop, unwell, vet summary (`css/v7-health.css`)
**Owns:** `js/views/health.js`, `js/views/food.js`.

- **Health home as a dashboard of cards:**
  - "Due soon" with dates and one-tap Done or Given.
  - Weight with a sparkline.
  - Poop week strip.
  - Care tasks with "every N weeks" progress rings.
- **Sub-navigation:** one clear segmented control. No double rows.
- **Unwell:** a friendly symptom picker (big tiles with icons, multi-select), then one result card that is calm and vet-first (Call vet now / Call today / Keep an eye), with the phone number button.
- **Food:** current food as a card, treats as chips, "Don't feed" as a warning card, and the feeding guide behind a "How to feed" card.
- **Vet summary:** a clean one-page report look. It stays printable as a page; no print button.

### D. More, profile, pets, badges, stickers, journal (`css/v7-more.css`)
**Owns:** `js/views/more.js`, `js/views/journal.js`.

- **More is a Duolingo profile:**
  - The pet's avatar header (name, species, age, home since).
  - A stats row: days this week, total sessions, stamps, badges.
  - Then grouped settings rows: Your pets, Reminders, Care diary only, Units, Backup, Install, Privacy, Help.
- **Badges:** an achievement grid with big medal art, earned in colour and locked greyed with progress bars ("3 of 8 weeks").
- **Treat jar (stickers):** a collectible album look.
- **Pets list:** cards with avatars, plus an "Add pet" tile; archived pets in a fold.
- **Journal:** a chat-bubble timeline of your own lines, with a big "What went well today?" composer.

### E. Shared components: sheets, timer, Mission complete, celebrations, log forms (`css/v7-ui.css`)
**Owns:** `js/views/gameui.js`, `js/forms.js`, `js/util.js` (the `sheet` and `toast` functions only), `js/views/parts.js`.

- **Bottom sheets:**
  - A drag handle and a rounded top.
  - The title is centred, with a close X.
  - Primary actions in a sticky bottom bar.
- **Log forms (`eventSheet`):** big option tiles instead of radios (the poop scale as picture tiles; meal "same as last time" chips first). The time defaults to now, with a "Change time" link.
- **Timer:** a big ring (already done). Add Nova cheering at 30 s and "Last 10 seconds!".
- **Mission complete:**
  - Duolingo's lesson-complete layout: Nova big, then stat tiles (XP, time, mood).
  - The Continue button at the bottom.
  - Badge and level-up merged in as extra tiles on the same screen, instead of separate dialogs.
- **Toasts:** a pill style, with the icon and the Undo action clear.

## Order of work and merge
1. The agents run in parallel, each in its own worktree.
2. The co-captain merges A, then B, C, D and E, resolving conflicts and keeping both sides.
3. Then one independent QA agent checks the whole app; fix every Critical and Major; push.
4. Shiv gets before and after screenshots.

## Shipped (14 Oct)
- All 5 areas are merged.
- QA found 0 Critical and 3 Major issues, all fixed:
  - "Already did it today" now works once a day (no XP farming).
  - Each Today row has its own tap lock.
  - The Unwell page no longer shows the general "log a meal" nudge.
- The days-this-week pill now uses 🗓️, not 🔥: it isn't a streak.

**Next (from QA's "still not Duolingo-grade" list):**
- An animated XP bar on Mission complete and Day complete ("30 XP to level 2").
- One "Continue" next-step button on Today and Train, with the next node pulsing on the path.
- Fold everything below Today on Home behind "More for Bran".
- Ask "meals per day" in onboarding.
