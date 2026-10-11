# Spec v3: "Do it now" (built for procrastinators)

**11 Oct 2026. Shiv's direction:** "Make it maximally motivating for someone like me, a big procrastinator, to actually use it and make their life better."

## One-paragraph spec

**Who:** people who mean to train their dog and look after themselves, but put it off. **What they do:** open the app and tap one big button, **Do 1 minute now**. **What they get:**
- a 60-second guided mini-session with an instant win;
- a plan they chose ("after breakfast, with a coffee");
- a daily reminder in their own calendar;
- a "3 days a week wins the week" target with spare days built in;
- a surprise sticker from Nova's treat jar the first time they show up each day;
- a fresh start whenever they come back.

**Why they come back:** starting is tiny, the reminder comes at a moment they chose, the reward is immediate, and missing a day costs nothing.

## The science (what each feature uses)

| Finding | Source | Feature |
|---|---|---|
| A behaviour happens when motivation, ability and a prompt meet; make it tiny when motivation is low. | Fogg Behavior Model, behaviormodel.org | **Do 1 minute now**, one tap from opening |
| People procrastinate more when the reward is far away (temporal motivation theory). | Steel 2007, *Psychological Bulletin* 133(1):65–94, doi:10.1037/0033-2909.133.1.65 | Instant reward: a toast, XP, a sticker and progress |
| "When X, I will Y" plans roughly double follow-through (meta-analysis d ≈ 0.65). | Gollwitzer & Sheeran 2006, *Adv. Exp. Soc. Psychol.* 38:69–119, doi:10.1016/S0065-2601(06)38002-1 | **My plan** (anchor + time) and a calendar reminder |
| Pairing a "should" with a "want" raises follow-through. | Milkman, Minson & Volpp 2014, *Management Science* 60(2):283–299, doi:10.1287/mnsc.2013.1784 | Optional "pair it with…" (coffee, podcast, music) |
| New beginnings (Mondays, the 1st of the month, a return) boost motivation. | Dai, Milkman & Riis 2014, *Management Science* 60(10):2563–2582, doi:10.1287/mnsc.2014.1901 | **Fresh start** messages, and the goal shrinks after a break |
| Forgiving yourself for procrastinating reduces later procrastination. | Wohl, Pychyl & Bennett 2010, *Personality and Individual Differences* 48(7):803–808, doi:10.1016/j.paid.2010.01.029 | No guilt, ever. "Welcome back. Today counts." |
| Effort speeds up near a goal (goal gradient). | Kivetz, Urminsky & Zheng 2006, *J. Marketing Research* 43(1):39–58, doi:10.1509/jmkr.43.1.39 | "1 more day to win the week" and near-goal progress bars |

## Build

1. **Do 1 minute now:** the first card on Home, with one big button.
   - It opens a 60-second mini-session for today's quest skill: 1 step from that skill, a calm countdown, and "Done" (or it ends on its own).
   - **Result:** the session is logged (`minutes: 1`) and earns normal XP within the caps. The toast reads "That counts. Want 4 more minutes?" with **Keep going** (the normal 5-minute timer) or **Done for today**.
   - Route `#/now`, plus a manifest shortcut **Do 1 minute**.
2. **My plan:** a card on Home until it's set; afterwards a single line.
   - Choose an anchor: After breakfast, After a walk, When I get home, Before bed, or My own time. Then a time (default by anchor) and an optional "pair it with": coffee, music, a podcast, or nothing.
   - **Add a daily reminder to my calendar:** a repeating .ics (RRULE daily, with an alert at the time). Copy: "Your phone reminds you. We never send notifications."
   - Shown on Home as: "Your plan: after breakfast (08:00), with a coffee."
3. **Win the week:** 3 days with any real log wins the week. It appears as 7 dots on Home with "1 more day to win the week". Winning gives a small celebration plus the existing weekly bonus. No penalties; the week simply starts fresh.
4. **Nova's treat jar:** the first real log of each day draws a random sticker (about 30, each an emoji plus a Nova line) into a collection in More.
   - Stickers are only for showing up. They are never bought, never lost, and never shown as a ranking.
   - Stickers are derived from the days logged (deterministic per date), so they can't be farmed and aren't stored.
5. **Fresh start:** on a Monday, the 1st of the month, or after 3 or more days away, the top card says "Fresh start. Just 1 minute today." and the button stays at 1 minute.
6. **Tell a friend (optional):** a share sheet with "I'm doing 1 minute a day with {pet}. Check on me Friday?" There's no server and nothing is tracked.

## Rules kept

- XP and stickers come only from real logs.
- No streak loss, no guilt, no fake urgency, no notifications we can't honestly send.
- Everything stays on the device, and the plan is included in backups.
- Bump the sw.js VERSION and precache any new files.

## Done when

- First open to the first logged 1-minute win takes 2 taps or fewer.
- The plan and the .ics reminder work.
- The week dots count 3 days, including across days with the clock moved.
- The sticker is the same all day, new tomorrow, and only after a real log.
- Fresh start shows on Monday or after a gap.
- No overflow at 320 px and no errors.
- Independent QA finds no Critical or Major issues.
