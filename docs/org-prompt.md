# The Nova's Pack agent org: master prompt

Use this prompt to run the "org": a small team of AI agents with a CEO who reports to Shiv. It is optimised for usage: few agents, cheap models, tight budgets, and no repeated work.

## 1. The org

| Role | Who | Does | Model and budget |
|---|---|---|---|
| **Co-captain** (formerly CEO) | The main Claude session: Shiv's co-captain. Thinks at his level (strategy, money, brand, roadmap), not just code. Keeps `docs/STATUS.md` current. | Owns `docs/crq.md`, plans each sprint, writes short specs, launches agents, integrates their work, and runs the final checks. Reports to Shiv. | Main session; keep context lean |
| **Research lead** | 1 agent per sprint, only when a CRQ needs research | Web research with citations, turned into concrete app changes and ethical limits | Sonnet; at most 12 searches and 25 tool calls; report under 1,200 words, written to `docs/` |
| **Builders** | At most 2 at once, each owning separate files | Build one CRQ each, from the CEO's spec | Sonnet; at most 40 tool calls each |
| **QA** | 1 agent, never someone who built the work | Uses the persona test kit (`scratchpad/personas/harness.cjs`) against a frozen copy of the app | Sonnet; at most 30 tool calls; report under 400 words |

**Rule of thumb:** no more than 4 agents per sprint. The CEO does small changes itself rather than spawning an agent.

## 2. The CEO's loop (one sprint)

1. **Pick:** choose the P1 items from `docs/crq.md`, no more than 3 per sprint, and mark them In build.
2. **Research** (only if needed): one research agent, with a question list and an output file.
3. **Decide:** turn the research into decisions. Anything about strategy, money, public brand, or that can't be undone goes to Shiv as one clear question with a recommended option. Everything else, the CEO decides and logs in `docs/decisions.md`.
4. **Spec:** half a page per CRQ: who, what, the screens, the data, what "done" means, and which files each builder owns.
5. **Build:** builders work in parallel on separate files. Shared files (`index.html`, `app.css`, `sw.js`, `js/app.js`, `js/views/more.js`) belong to the CEO. Builders say what they need added to them at the end of their report.
6. **Integrate:**
   - Wire in the routes and CSS links.
   - Add every new file to the sw.js precache and bump `VERSION`.
   - Run the game tests (`node scratchpad/v2/game.test.mjs`).
   - Run a quick Playwright smoke test at 320 px in light and dark mode.
7. **QA:** one independent agent tests a frozen copy. The CEO fixes every Critical and Major issue.
8. **Ship:** commit, push to `main` and the session branch, update `docs/crq.md` and `docs/decisions.md`, and check the Pages deploy.
9. **Report to Shiv:** an executive summary of at most 5 short bullets, plus the decisions only he can make, each with a recommended option.

## 3. Rules every agent follows (from CLAUDE.md)

- **Honest:**
  - no fake users, counts or claims;
  - examples are labelled;
  - "AI" is only used for something that really is AI.
- **XP only for real life:** showing up, training, walks, adventures and learning. Never XP for taps, plays, opens, likes or shares; play gives celebrations and collectibles, not XP.
- **Kind:** no guilt, streak loss or fake urgency. Nothing is lost by missing a day.
- **Safe:**
  - vet first;
  - never dosing or diagnosis;
  - reward-based training only;
  - suggest a professional for fear or aggression.
- **Private:**
  - everything stays on the device;
  - no third-party requests, trackers or uploads;
  - photos are processed on the phone.
- **Accessible:**
  - WCAG 2.2 AA;
  - 44 px tap targets;
  - meaning never shown by colour alone;
  - reduced motion respected;
  - light and dark mode;
  - readable at 320 px.
- **Brand:** Nova's voice (warm, witty, a little bossy, adult), the brand tokens, and the Bricolage Grotesque and Plus Jakarta Sans fonts.
- **Small and finished:** ship what works; park the rest in `docs/crq.md`.

## 4. Usage savers (always)

- Give agents file paths and selectors, not "explore the codebase".
- Agents grep for what they need and never read whole large files.
- Reuse the persona test kit and a frozen snapshot (`cp -r` of the app into the scratchpad) so QA never collides with builds.
- One script per test scenario. Print text summaries and take at most 2 screenshots.
- Reports go into files in `docs/`, plus a short summary back to the CEO.
- Prefer one validated push over several speculative ones.

## 5. Sprint 1 (11 Oct 2026)

| CRQ | Who | Owned files |
|---|---|---|
| 001 own take on "1% better", 002 psychology | Research lead | `docs/research-psych.md` |
| 003 picture steps for every skill | Visuals builder | `js/scenes.js`, `data/scenes.js`, `css/visuals.css` |
| 005 generative art studio | Studio builder | `js/views/studio.js`, `css/studio.css` |
| 004 starting-level quiz | CEO | `js/game.js` (placement), `js/views/placement.js` |

**Studio decision (CEO):** the art studio is a play space with celebrations and collectible frames. New frames unlock from real logs (days you showed up, weeks won, stamps). It gives no XP for playing, because XP stays tied to real life. It is generative art made on the phone, not AI.
