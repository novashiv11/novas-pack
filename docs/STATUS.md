# STATUS: read this first after any restart or usage limit

The **co-captain** (Claude, the main session) updates this file after every step and commits it, so no work is lost when a session stops or hits a usage limit. The full backlog is in `docs/crq.md` and decisions are in `docs/decisions.md`.

**Last updated:** 15 Oct 2026 (v10 live; all buildable work done).

## How we never lose work
1. Every request from Shiv goes into `docs/crq.md` first, with an ID, before any work starts.
2. Work ships in small commits pushed to `main` and the session branch. Nothing waits until the end.
3. This file always lists **Now**, **Next** and **Waiting on Shiv**.
4. Agents write into files in the repo (never only into chat), and the co-captain commits their work as soon as each agent finishes.
5. If an agent dies at a limit, its CRQ goes back to "Planned" here, along with whatever partial files it left.

## Now (16 Oct): v10 live, nothing buildable left

| Version | What shipped |
|---|---|
| v6 (14 Oct) | The daily loop: the Today checklist with a ring and Day complete, "+" from every main screen, 4 tabs, a reminder in onboarding (`docs/v6-architect-review.md`) |
| v7 (14 Oct) | Duolingo-grade screens from 5 agents: skills path, sticker album, lesson player, health dashboard, profile-style More, Mission complete (`docs/v7-duolingo-screens.md`) |
| v7.1 | The XP bar fills, the next row pulses, Home extras folded, meals a day in onboarding |
| v7.2 | Your own checklist items (e.g. eye drops), the training row names this week's skill, a step-by-step flow for the 2nd pet |
| v7.3 (15 Oct) | "Do it for them" replaces the old 1% wording (CRQ-001); the pet row fades at the edge when it scrolls; Train for hens, horses and other pets with no skills yet points to stamps and lessons; a stamp and its badge or level-up share one screen; old Home code removed |
| v8.2 (15 Oct) | "Feel" pass (CRQ-052, `docs/v8-feel.md`): the pet is the hero of Today (time-of-day sky, ring, mood), a colour per kind of care, soft depth, glass bars, app-like slides, a compact toast. QA: 2 Major fixed |
| v8.3 (15 Oct) | Same feel on Train, Health and More: Nova's line as a compact pill, light segmented controls, a featured quest card, a sky on the profile, soft cards everywhere |
| v8.4 (15 Oct) | Juice: a soft tick sound on logs, a little tune for wins (Sounds switch in More), sparks from a finished row; Welcome in the same sky as Today |
| v8.5 (15 Oct) | Tap a done Today row (or long-press any row) to see today's entries, change one, or log another; medicines show no "log another" |
| v8.6 (15 Oct) | "Bran's week" recap: a Home card on Sunday and Monday, More → This week, real numbers only, share as a Story |
| v8.7 (15 Oct) | Photo moments: a photo on walks, play, training and eggs (shrunk, location removed, stays on the phone); a polaroid on Today; photos in the week recap |
| v9 (16 Oct) | 5 agents in parallel (`docs/v9-agents.md`): sky onboarding and Welcome-to-the-pack, Train path/skill/Academy/sticker album, Health hero with weight sparkline, Memories photo page, swipe-down sheets, sky Mission/Day complete |
| v9.1 (16 Oct) | Advanced training: 6 new dog skills (heel, distance down, emergency stop, go to bed, find it, roll over) with ladders and badges; the + tucks away on scroll |
| v10 (16 Oct) | Pro training: pictures and level-check questions for the Advanced skills, Challenge mode (the 3 Ds) from level 2, 3 new Academy lessons |

Tests: 27 game tests pass; smoke runs at 320 px light and 390 px dark with no errors, no sideways scroll and no small targets.

## Waiting on Shiv (his call, no rush)
- **CRQ-019:** full name and an app email for the privacy page (Shiv: not yet).
- **CRQ-018:** Google Play ($25), only if he wants the Play Store. Before that, add the `ANDROID_KEYSTORE_PASSWORD` secret for a stable key (`docs/android-app.md`).
- **CRQ-050:** the Reddit post (link the website, not the APK).
- **Outreach:** the vet and business emails (`docs/outreach-prompt.md`).
- **CRQ-038:** "people near you" walk groups. Parked: it needs a server and goes against online-only.
- **CRQ-023:** Learn with Nova paid content (milestone-gated).
- **CRQ-039/041:** the vet partner price is live on sponsor.html. Check tax/VAT and your day-job contract before the first paid deal.

## Done today (11 Oct)
Android APK · link preview image · launch kit · Do it now (1-minute win, plan, week dots, stickers, fresh start) · simple steps for kids · 20-user test, with the critical bug and most majors fixed · level check · talk buttons · feeding guide · media slots · art studio · psychology research · CRQ list · agent-org prompt.
