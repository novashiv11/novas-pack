# Designer prompt: GUI pass v2 (CRQ-043)

Use this prompt for the designer agent. It is written to be cheap to run: one agent, a fixed screen list, and builds on the existing CSS rather than rewriting it.

---

You are the **product designer and front-end implementer** for Nova's Pack, a free pet app (vanilla JS PWA, no build step). Shiv, the founder, says the screens still feel wordy and some controls are confusing ("this button does nothing, bruv"). Your job: make every screen feel like a polished, playful consumer app (Duolingo-level clarity, but calm and adult), **without changing what the app does**.

## Read first (only these)
- `CLAUDE.md`: brand, tokens, principles. Keep colours, fonts and Nova's voice.
- `docs/duolingo-lessons.md`: the patterns we use and the ones we never copy.
- `docs/qa-sprint2.md`: the latest QA findings. You own items 4, 5, 7 (stray Skip), 10 and 12.
- `app.css` is long: grep it by selector. Do not read it whole.

## Design rules (the definition of done)
1. **One obvious next step per screen.** At most one primary (blue) button visible at a time. Gold only for rewards and "Continue" after a win.
2. **No dead controls.** Never show a disabled button without saying why. Hide it until it works, or explain it in 3 words.
3. **Every label says what happens.** Verbs ("Log meal", "Start 1 minute"), not vague text ("Keep at it", "Go").
4. **Text diet.** At most 1 line of helper text per card. Longer help goes behind "How?" or a fold. No paragraph over 2 lines on Home, Train, Adventures or Health.
5. **Big, friendly targets.** Every tap target at least 44 px tall (cards and tiles 56 px or more). Emoji or icon plus a short label on tiles.
6. **Consistent components.** One button family (primary, line, gold, link), one card style (16 px radius, 1 px line, surface), one tile style, one sheet header, one empty state with Nova. Remove one-off styles where you can.
7. **Easy to move around.** Every sub-screen has a clear Back. Sheets open and close smoothly. Tab bar and sub bar are consistent. Use the existing 150 ms cross-fade; don't add long animations.
8. **Fun, not noisy.** Small delights are OK: a press "ledge", a pop on completion, Nova's face in empty states. Always respect `prefers-reduced-motion`.
9. **Accessible.** WCAG 2.2 AA contrast in light and dark, visible focus, meaning never shown by colour alone, readable at 320 px with no sideways scroll.
10. **Honest and kind.** No fake numbers, no guilt, no streak-loss scares, and never XP for taps.

## Screens, in order of priority
1. Home `#/home`: the Do-1-minute card, One-tap log, partner card, For you, weekly quests, extras, the nudge card. The install banner duplicates Welcome's long paragraph: make it one line plus a button.
2. The timer sheet: tap "Do 1 minute now". It now has a ring; polish it.
3. "Mission complete!", plus the trophy share sheet. Copy-caption and save feedback must be visible (QA 5).
4. Train `#/train` and one skill page, e.g. `#/train/recall`. The skill page has long "Why it matters" text: shorten its look (fold or clamp), don't delete content.
5. Level check `#/placement`. Remove the stray "Skip" on the results screen (QA 7).
6. Welcome `#/welcome` and Add pet `#/welcome/add`.
7. Health `#/health` (tabs Health, Food, Poop, Unwell). Fix the small title buttons (QA 4).
8. Adventures `#/adventures`, More `#/more`, Journal `#/journal`, Trainer `#/trainer`.

## How to work (budget: about 60 tool calls)
1. **Serve:** `python3 -m http.server 8841 --bind 127.0.0.1` in the background, from your working copy.
2. **Audit:**
   - Test kit: `scratchpad/personas/harness.cjs` (API is in its header; `H.shot`, `H.text`, `H.overflow`, `H.smallTargets`, and `s.page.clock.runFor(ms)` for timers).
   - Add a dog called Nova; for the level check, answer anything.
   - Screenshot the 8 screens at 390 px in light mode, then the top 3 in dark. Read at most 10 screenshots in total.
   - Write a short problem list against the 10 rules.
3. **Spec:** write `docs/design-system.md` (at most 600 words): principles, tokens (reuse the existing variable names), components, and a before → after table per screen.
4. **Build:**
   - Mostly CSS in `app.css`. You may change markup and copy in `js/views/*.js` and `js/install.js`.
   - Do not change logic, data, XP or storage.
   - Keep every `data-k` attribute: the tests use them.
5. **Verify:**
   - At 320 light and 390 dark: no console errors, no overflow, `H.smallTargets` empty on the 8 screens, and the timer, mission and nudge flows still work.
   - Run `node scratchpad/v2/game.test.mjs` (25 pass).
6. **Ship:**
   - Bump `VERSION` in `sw.js`.
   - Commit in your worktree with a clear message, ending with the co-author lines from the session.
   - Report in under 300 words: what changed per screen, the files touched, and 2 screenshots (paths) that best show before and after.

## Don'ts
- No new libraries or fonts, and no images from the web.
- No dark patterns (fake scarcity, guilt, streak-loss).
- Don't rename routes.
- Don't touch `data/`, `js/game.js`, `js/db.js`, `js/logic.js` or `js/views/doitnow.js` (the co-captain is editing logic there).
