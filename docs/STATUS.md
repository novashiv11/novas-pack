# STATUS: read this first after any restart or usage limit

The **co-captain** (Claude, the main session) updates this file after every step and commits it, so no work is lost when a session stops or hits a usage limit. The full backlog is in `docs/crq.md` and decisions are in `docs/decisions.md`.

**Last updated:** 11 Oct 2026, evening.

## How we never lose work
1. Every request from Shiv goes into `docs/crq.md` first, with an ID, before any work starts.
2. Work ships in small commits pushed to `main` and the session branch. Nothing waits until the end.
3. This file always lists **Now**, **Next** and **Waiting on Shiv**.
4. Agents write into files in the repo (never only into chat), and the co-captain commits their work as soon as each agent finishes.
5. If an agent dies at a limit, its CRQ goes back to "Planned" here, along with whatever partial files it left.

## Now (Sprint 2: "Fun, simple, less text", plus business)

| CRQ | What | Owner | State |
|---|---|---|---|
| 027 | Learn from Duolingo (flow, look, logic, psychology). Write `docs/duolingo-lessons.md`, then apply it | Co-captain | Doing |
| 029 | Welcome page says "Grow with your dog", which excludes people with no dog: make the copy inclusive | Co-captain | Next |
| 030 | Level check has too much text: one question per screen, big tappable cards, progress bar, fun | Co-captain | Next |
| 031 | Animated celebrations when a mission is done (Duolingo-style "mission complete" screen) | Co-captain | Next |
| 033 | Simpler food logging: one-tap meal, treat and poop on Home | Co-captain | Next |
| 034 | Fewer tips and "spam" screens: minimal, curious, appealing | Co-captain | Next |
| 035 | "Plan" isn't clear ("iss plan ka purpose kya hai"): reframe as "When should Nova nudge you?" | Co-captain | Next |
| 036 | Shiv's photos look plain or ugly in the app: better crop and a styled/cartoon treatment | Co-captain | Next |
| 037 | Remove Discord everywhere. Channels: Instagram/Facebook Reels now, a WhatsApp group later | Co-captain | Next |
| 032 | Navigation and less text on screens: smoother page moves, clearer back/forward, fun styles | Co-captain (+ QA agent) | Next |
| 039/041 | Business and vets: a sponsor page plus an Irish subscription/sponsorship model and pitch | Business agent | Starting |
| 042 | Shareable "trophy" card for Instagram (proud moments: trick done, level up), Story size | Share agent | Starting |
| 003 | Picture steps for every skill. The builder died at the usage limit; `js/scenes.js` is partial, untracked and not wired in | Co-captain | Re-plan after 030–036 |

## Waiting on Shiv
- **CRQ-001:** pick our own name for "1% better every day". Recommended: **"Nova's Nudge"** (see `docs/research-psych.md`).
- **CRQ-038:** location-based walk groups with a "people near you" counter. This needs a server, carries privacy and safety risk, and goes against the "online-only, no meetups" decision of 10 Oct. Shiv decides whether to revisit it (options in `docs/crq.md`).
- **CRQ-019:** full name and an app email for the privacy page.
- **CRQ-018:** Google Play account ($25), when ready.

## Done today (11 Oct)
Android APK · link preview image · launch kit · Do it now (1-minute win, plan, week dots, stickers, fresh start) · simple steps for kids · 20-user test, with the critical bug and most majors fixed · level check · talk buttons · feeding guide · media slots · art studio · psychology research · CRQ list · agent-org prompt.
