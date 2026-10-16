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
