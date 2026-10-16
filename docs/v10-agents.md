# v10: three agents for "pro" training

Shiv (16 Oct): "Better, keep going, max pro."

The shared rules are the same as in `docs/v9-agents.md`: the look and feel, honesty and safety, accessibility, engineering, testing and finish sections. Each agent edits only the files it owns and commits in its own worktree. All three work on the base commit `e6ae00e` or later. Use the test kit and onboarding helper paths given in `docs/v9-agents.md`.

## F. Pictures and the level check for the 6 Advanced skills (port 8871)
**Owns:** `data/scenes.js`, `js/views/placement.js` (the `QUIZ` table only), `js/scenes.js` (only to add new poses or props if you must).

- **Pictures:** add `SCENES` entries for `heel`, `distance-down`, `emergency-stop`, `place`, `find-it` and `roll-over`. Draw one picture per simple step in `data/easysteps.js`, in the same drawn style and with the same scene API as the existing skills (read how `recall` and `stay` are built).
- **Level check:** add `QUIZ` entries for the 6 skills. Use the same shape and five honest answers that match each skill's `ladder` in `data/skills.js`.
- **Test:** the howto steps show pictures, and `#/placement` shows the new questions for a dog.

## G. Challenge mode: the 3 Ds (port 8872)
**Owns:**
- `js/views/training.js` (the skill page only);
- a new module `js/views/challenge.js`;
- CSS appended to `css/v9-train.css` under a `/* v10 challenge */` header.

**What it does:** on a skill page, once the skill is at level 2 or higher, show a "Challenge" card. One tap picks a random proofing challenge suited to the level. It changes one D only:
- **Distance:** "Ask from 3 steps away".
- **Duration:** "Hold it for 10 seconds".
- **Distraction:** "With a toy on the floor nearby".

**Content rules:**
- About 8 to 12 challenges per D, with the numbers scaled by level.
- Safety notes where needed, e.g. "emergency stop: only in a safe, enclosed space".
- A "Too hard? Make it easier" link gives an easier version.

**Behaviour rules:**
- "Start" opens the normal timer (`#/train/<id>/start`), so the session logs as usual.
- **No extra XP.** The challenge only adds an optional `challenge` text field to the training event, if `startSession` lets you pass it. If it doesn't, don't change the data and just show the card.
- Remember the last challenge per skill in `settings.challenge` (a new key).
- `sound("tick")` when you roll a new challenge.

## H. Three new Academy lessons (port 8873)
**Owns:** `data/academy.js`.

**Lessons:** add 3 dog lessons for advanced trainers, in the same shape as the existing ones (parts plus a 2-question check plus sources). Pick topics that don't repeat an existing lesson; read them all first. Suggested:
1. **"Fading the treats":** from lure to hand signal to cue, and reward schedules. Treats never fully stop; you use life rewards too.
2. **"Cues that work":** saying a cue once, adding a new cue, "poisoned" cues, and why "no!" isn't a cue.
3. **"Proofing: when it works at home but not at the park":** generalising, and changing one of distance, duration or distraction at a time.

**Rules:**
- Sources: reputable, reward-based ones only (AVSAB, Dogs Trust, RSPCA, PDSA, and similar). Reuse the existing source constants where they fit. Don't invent URLs; if you can't verify one, use the organisation's advice home page that's already in the file.
- Tag the species as dog.
- Keep the rank thresholds unchanged. Check the trainer test expectations in `/tmp/claude-0/-home-user-novas-pack/10b23907-acdb-5d78-8db3-158421021835/scratchpad/v2/game.test.mjs`. If a test counts lessons, say so in your report rather than editing the test.

## Shipped (16 Oct, v10)
- **F:**
  - 24 drawn step pictures for the 6 Advanced skills, with new `cup`, `lean` and `belly` drawings.
  - 6 Advanced questions in the level check, so it now has 12 for a dog.
  - Co-captain fix: the level check's first win comes from the basics. Advanced skills only count when every basic is past level 2.
- **G:** Challenge mode (`js/views/challenge.js`).
  - A "🎯 Challenge" card on a skill page from level 2. It changes one of distance, duration or distraction; the numbers scale with level.
  - Safety notes, and an easier version.
  - Start opens the normal timer. No extra XP.
  - `settings.challenge` remembers the last challenge.
- **H:** 3 dog lessons: "Fading the treats", "Cues that work" and "Proofing: from home to the park". That makes 16 lessons in total, and rank thresholds are unchanged. The game test now expects 16.

## v11 (16 Oct): one tap, not typing
Shiv: "Make it easier: one-click select, autocomplete, future stuff."

- **Quick-pick chips under every text field** in the log forms:
  - meal and treat names and amounts (your history first, then common amounts such as "1 cup" or "2");
  - medicine names (your active medicines);
  - vet clinics.
  
  Tap a chip to fill the field, tap it again to clear it. The same list also feeds the phone's autocomplete (`datalist`).
- **The note is folded** behind "＋ Add a note", except for vet visits.
- **One-tap walks** save your usual length: the median of your last 5 walks ("🚶 Walk · 30 min logged").
- **"Usually now" on Today:**
  - The app learns when each row usually happens from the last 14 days, needing at least 3 days. It uses only your own logs, on the phone.
  - A row says "Usually now · 08:05" when it's time, or "usually 18:00" otherwise.
  - The "Next" pulse goes to the row that's due now.

## v11.1 (16 Oct): cats and rabbits can train too
- **Builder I:** added 4 cat skills (nose touch, come to the treat pot, sit for a treat, high five) and 3 rabbit skills (come to your name, target stick, happy in the carrier).
  - Each comes with steps, a ladder, simple steps with pictures (a new flat rabbit, a target stick and a treat pot), a badge and a level-check question.
  - Rabbit sessions are 1 to 3 minutes, on the floor, and never involve chasing or lifting. Stats are unchanged.
  - Rabbits no longer see "coming soon".
- **Co-captain:** Challenge mode now covers these 7 skills, with indoor-only challenges (no outdoor, jogging or ball challenges for cats and rabbits).
