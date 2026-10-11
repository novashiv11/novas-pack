# STATUS: read this first after any restart or usage limit

The **co-captain** (Claude, the main session) updates this file after every step and commits it, so no work is lost when a session stops or hits a usage limit. The full backlog is in `docs/crq.md` and decisions are in `docs/decisions.md`.

**Last updated:** 11 Oct 2026, late evening (Sprint 2 shipped).

## How we never lose work
1. Every request from Shiv goes into `docs/crq.md` first, with an ID, before any work starts.
2. Work ships in small commits pushed to `main` and the session branch. Nothing waits until the end.
3. This file always lists **Now**, **Next** and **Waiting on Shiv**.
4. Agents write into files in the repo (never only into chat), and the co-captain commits their work as soon as each agent finishes.
5. If an agent dies at a limit, its CRQ goes back to "Planned" here, along with whatever partial files it left.

## Now (Sprint 2: "Fun, simple, less text", plus business)

| CRQ | What | State |
|---|---|---|
| 027 | Duolingo lessons (`docs/duolingo-lessons.md`) applied | Done |
| 028 | This STATUS file | Done |
| 029 | Welcome: "Tiny daily wins. For you and your pet.", "Add my pet" / "No pet yet? Peek inside", emoji grid | Done |
| 030 | Level check: one question per screen, big cards, progress bar, results, then the first 1-minute win | Done |
| 031 | "Mission complete!" screen: Nova pops, XP counts up, week dot fills, sticker drops, confetti | Done |
| 033 | One-tap log on Home: Meal, Treat, Poop, Walk (or Unwell), Train | Done |
| 034 | Less text: Home stats folded, extras as icon tiles, Train notes behind "How levels work" | Done (more in QA) |
| 035 | "Plan" is now "⏰ When should Nova nudge you?": 4 one-tap times + calendar | Done |
| 036 | Photos: tighter crop, colour lift, framed "photo sticker" look; step photos now show in "How?" (the cartoon filter looked worse) | Done |
| 037 | Discord removed (privacy page, site.js, CLAUDE.md). Instagram/Facebook now, WhatsApp group later | Done |
| 039/041 | `sponsor.html` (unlisted) + `docs/business-vets.md`: founding vet partner offer | Done; prices wait on Shiv |
| 042 | Trophy card: "📸 Share this win" on Mission complete, level-ups, badges, week won (Story 9:16 or Post 4:5, caption) | Done |
| 032 | Navigation polish and a fresh QA pass | Next |
| 003 | Picture steps for every skill: `js/scenes.js` is a work in progress, not loaded | Planned |

## Waiting on Shiv
- **CRQ-001:** pick our own name for "1% better every day". Recommended: **"Nova's Nudge"** (see `docs/research-psych.md`).
- **CRQ-038:** location-based walk groups with a "people near you" counter. This needs a server, carries privacy and safety risk, and goes against the "online-only, no meetups" decision of 10 Oct. Shiv decides whether to revisit it (options in `docs/crq.md`).
- **CRQ-019:** full name and an app email for the privacy page.
- **CRQ-018:** Google Play account ($25), when ready.
- **CRQ-039/041:** vet partner price (recommended: free 3 months for the first 3 to 5, then €29 a month; a Reel with Nova €150). Check tax and VAT registration and your day-job contract first.

## Done today (11 Oct)
Android APK · link preview image · launch kit · Do it now (1-minute win, plan, week dots, stickers, fresh start) · simple steps for kids · 20-user test, with the critical bug and most majors fixed · level check · talk buttons · feeding guide · media slots · art studio · psychology research · CRQ list · agent-org prompt.
