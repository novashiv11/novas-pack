# v6: architect review and plan ("a reason to open it every day")

## What Shiv said (14 Oct)
- "Meh. Not very incentivising. I didn't even use it every day."
- Logging isn't easy, even with the one-tap tiles.
- It isn't easy to see things or move around.

## Diagnosis (from the live Home at 390 px)
1. **No daily job.** Home stacks 8 unrelated blocks: the 1-minute card, the nudge, log tiles, the level card, "For you", quests, extras and install. None of them answers the two daily questions: *what does my pet need today?* and *what's done?*
2. **Logging has no memory on screen.** After tapping Meal, nothing on Home says "fed at 08:10". You can't see today, so there's nothing to complete.
3. **Too many abstract scores.** Partner XP, trainer XP, levels, ranks, quests, stickers, badges and week dots. Real life (fed, walked, played, meds) is buried under game layers.
4. **Logging lives in one place.** The log tiles sit mid-Home. Health and Train have no fast way to add.
5. **Navigation.** 5 tabs, with Adventures as a whole tab. Health has 2 rows of sub-tabs, and More is a long list.
6. **No trigger to come back.** The calendar nudge is optional and buried; onboarding never sets it.

## Principles for v6
- **One loop:** today's checklist → tap as you go → day done ✓ → week dots. Everything else is secondary.
- **Real care first, game second:** the checklist is the pet's real day (meals, walk or play, 1-minute training, meds due, eggs). XP and stickers follow from it.
- **Every log is visible:** each row shows "1 of 2 · 08:10"; "Today so far" lists what happened today, and tapping an entry edits it.
- **Add from anywhere:** a "+" button on every main screen opens all log types, each showing when it was last logged.
- **Fewer places:** 4 tabs: Today · Train (skills, adventures, academy) · Health · More.
- **Kind:** no streak loss, no guilt; the day resets quietly.

## Build order (each one ships on its own)
1. **Today checklist on Home:** species defaults (dog: meals ×2, walk, 1-minute training; cat: meals ×2, play, training; rabbit: hay and greens, droppings check, play; hens: feed and water, collect eggs; others: meals, play), plus medicines due today. Header ring "2 of 4", a day-done celebration, "Edit list", and "Today so far". New log type `play` (time together, no XP).
2. **"+" button** on Home, Train, Health and Adventures: one sheet with every log type and "last 2 h ago".
3. **Home declutter:** the old 1-minute card, tiles, "For you" and quests leave Home (quests move to Train). A compact level strip and the extras row stay.
4. **Onboarding:** after adding a pet, one step: "When should Nova remind you?" (calendar), then the level check.
5. **Tabs:** Adventures moves into Train (Skills | Adventures | Academy switcher); 4 tabs.
6. **QA:** one independent agent, then fix Critical and Major, then push.

## Usage rules
Build directly (no research agents). Reuse `quickLog`, `doNow`, `eventList`, `dueItems` and `celebrate`. One smoke script per step. One QA agent at the end.

## Shipped (14 Oct)
Steps 1 to 6 are done. QA found 0 Critical and 4 Major issues, all fixed:
- The toast now sits above "+".
- A 1.2 s tap lock stops double taps, and a done row asks "Log another".
- Medicines given today stay on the list, ticked.
- The week strip is on Today.

Also: meal and walk counts (1 to 4) in Edit list, "Already did it today" in the 1-minute timer, and at least one item must stay on the list.

**Next ideas:** custom checklist items (e.g. "eye drops"), rotating the daily training skill, merging stacked celebrations into one, and showing Today before the level check.
