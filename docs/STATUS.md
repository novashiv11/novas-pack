# STATUS: read this first after any restart or usage limit

The **co-captain** (Claude, the main session) updates this file after every step and commits it, so no work is lost when a session stops or hits a usage limit. The full backlog is in `docs/crq.md` and decisions are in `docs/decisions.md`.

**Last updated:** 12 Oct 2026 (all buildable CRQs done; final QA is the next job).

## How we never lose work
1. Every request from Shiv goes into `docs/crq.md` first, with an ID, before any work starts.
2. Work ships in small commits pushed to `main` and the session branch. Nothing waits until the end.
3. This file always lists **Now**, **Next** and **Waiting on Shiv**.
4. Agents write into files in the repo (never only into chat), and the co-captain commits their work as soon as each agent finishes.
5. If an agent dies at a limit, its CRQ goes back to "Planned" here, along with whatever partial files it left.

## Now (12 Oct: "Finish all tasks")

Everything buildable in `docs/crq.md` is done. What's left needs Shiv (below).

| Batch | What shipped |
|---|---|
| A | Phone Back closes the top sheet (032); early badges First step / Three days / First stamp (015); Coach needs 5 lessons, Mentor 8 (025); Irish muzzle law only on Irish phones (016); "Home since" gotcha day (026); Story share (011) |
| B | 6 new skills: sit, down, check-in, drop it, stay, look at that (013, 014); own level ladders for stay, look at that, alone time, toilet training (012); lesson "Worried dogs: space first"; rabbit poop choices and grams (010); Chickens with an Eggs tile, Horse (009) |
| C | Archive a pet (007); Care diary only mode (008); "No pet yet? Get ready" checklist (024); faster first load (017) |
| 003 | A drawn picture for every simple step of all 20 skills (`js/scenes.js`, `data/scenes.js`) |
| QA | **Next session, first job (paste `docs/next-session-prompt.md`):** run the final independent QA pass (prompt pattern in `docs/qa-sprint2.md` style) on batches A–C, then fix Critical/Major. Stopped on 12 Oct to save usage at Shiv's request. |

## Waiting on Shiv
- **CRQ-001 (decided 12 Oct):** our "1% better" is an emotional play: **"Do it for them"**. Next session: rename the 1% wording in the app to it.
- **CRQ-038:** location-based walk groups with a "people near you" counter. This needs a server, carries privacy and safety risk, and goes against the "online-only, no meetups" decision of 10 Oct. Shiv decides whether to revisit it (options in `docs/crq.md`).
- **CRQ-019:** full name and an app email for the privacy page (Shiv: not yet).
- **CRQ-018:** Google Play account ($25), only when he wants the Play Store; the web install works without it.
- **CRQ-023:** Learn with Nova paid content (milestone-gated money decision).
- **TWA verification:** create the `novashiv11.github.io` repo so the Android app loses its address bar (`docs/android-app.md`).
- **CRQ-039/041 (decided 12 Oct, live on sponsor.html):** vet partner price (recommended: free 3 months for the first 3 to 5, then €29 a month; a Reel with Nova €150). Check tax and VAT registration and your day-job contract first.

## Done today (11 Oct)
Android APK · link preview image · launch kit · Do it now (1-minute win, plan, week dots, stickers, fresh start) · simple steps for kids · 20-user test, with the critical bug and most majors fixed · level check · talk buttons · feeding guide · media slots · art studio · psychology research · CRQ list · agent-org prompt.
