# CRQ list (change requests)

The CEO (Claude, the main session) owns this list: it adds new requests, sets the priority, assigns an owner, and updates the status after each sprint. Shiv decides anything marked **Shiv**.

**Status:** New → Planned → In build → In QA → Done (or Parked). **Priority:** P1 (this sprint), P2 (next), P3 (later).

| ID | Request | Source | Priority | Owner | Status |
|---|---|---|---|---|---|
| CRQ-001 | Our own take on "1% better every day": a name and concept that's ours, not a borrowed slogan | Shiv | P1 | **Shiv picks** | Waiting on Shiv (recommended: "Nova's Nudge") |
| CRQ-002 | Psychology research: what makes people actually change, and how to apply it ethically in the app | Shiv | P1 | Research agent | Done (`docs/research-psych.md`) |
| CRQ-003 | More visuals: picture steps for every skill ("a picture is worth 1,000 words"), visual everywhere it helps | Shiv | P1 | Co-captain | Planned (the builder died at the usage limit; `js/scenes.js` is partial) |
| CRQ-004 | Starting-level quiz: find the dog's current level per skill at the start (no XP for the quiz) | Shiv | P1 | CEO (game engine) | Done (level check after adding a pet; redo from Train) |
| CRQ-005 | Play space: an interactive generative art studio with celebrations; art unlocked by real-life logs | Shiv | P1 | Studio builder | Done |
| CRQ-006 | "Agent org" with a CEO reporting to Shiv; master prompt in `docs/org-prompt.md` | Shiv | P1 | CEO | Done |
| CRQ-007 | Archive a pet (fosters, rehomed) and keep the human's XP and diary | Persona test | P2 | — | Done (12 Oct: Archive in the pet sheet; More → Pets → Archived → Bring back; XP and diary kept) |
| CRQ-008 | Care-only mode (hide the game for people who only want the diary) | Persona test | P2 | — | Done (12 Oct: More → Care diary only; Home, Health, More; no levels, quests or celebrations) |
| CRQ-009 | Egg and flock counts; species-aware logs for hens | Persona test | P3 | — | Done (12 Oct: "Chickens" species, egg count tile with the week total; hens follow bird health rules) |
| CRQ-010 | Rabbit poop options (pellets, soft clusters) and gram weights | Persona test | P2 | — | Done (12 Oct: rabbit poop choices on the same 1 to 5 safety steps; grams for rabbits, birds, hens) |
| CRQ-011 | Share: caption and hashtags, a Story (9:16) size, hide empty stats on the card | Persona test | P2 | — | Done (11 Oct: Story size, caption, empty stats hidden) |
| CRQ-012 | Skill-specific self-check ladders (alone time in minutes, toilet, tricks) | Persona test | P2 | — | Done (12 Oct: own ladders for stay, look at that, alone time, toilet training) |
| CRQ-013 | Basic skills: sit, down, name/check-in, drop it, stay | Persona test | P2 | — | Done (12 Oct: sit, down, name and check-in, drop it, stay) |
| CRQ-014 | Reactive and shy dog path: a lesson on space and distance, a "look at that" skill | Persona test | P2 | — | Done (12 Oct: "Look at that" skill + "Worried dogs: space first" lesson) |
| CRQ-015 | Early badges (first session, first stamp, first lesson, 3 days) | Persona test | P2 | — | Done (12 Oct: first step, three days, first stamp) |
| CRQ-016 | Region-aware notes (Irish muzzle law shown only where relevant) | Persona test | P3 | — | Done (12 Oct: Irish law note only for Irish phones) |
| CRQ-017 | Faster first load on slow networks (bundle the JS) | Persona test | P3 | — | Done (12 Oct: modulepreload for the whole graph; art studio loads on first open. Pages serves gzip) |
| CRQ-018 | Google Play listing: account ($25), ID check, 12 testers for 14 days | Shiv | P2 | **Shiv** | Waiting on Shiv |
| CRQ-019 | Full name and an app email for the privacy page | Shiv | P1 | **Shiv** | Waiting on Shiv |
| CRQ-020 | Button training ("snack please" talk buttons) with Nova's photos | Shiv | P1 | CEO + Visuals builder | Done: skill and photos. Drawn steps in build |
| CRQ-021 | Media slots: Shiv's photos, GIFs and clips drop into steps and guides (`data/media.js`, `img/steps/`, `clips/`) | Shiv | P1 | CEO | Done |
| CRQ-022 | Feeding guide with pictures: how much, how often, mixing, bloat care for big dogs, treats, switching, water, games | Shiv | P1 | CEO | Done (Health → Food) |
| CRQ-023 | Learn with Nova paid content (Shiv's pics, GIFs and clips become a course), then trainer services once qualified. Free core stays free. Milestone-gated per `docs/global-plan.md` | Shiv | P3 | **Shiv** (money) | Planned |
| CRQ-024 | "No dog yet" mode: a getting-ready path instead of "Make Nova mine" | Persona test | P2 | — | Done (12 Oct: "No pet yet? Get ready" 7-step checklist, then Add my pet or peek at the sample) |
| CRQ-025 | Coach rank needs 5 or more Academy lessons, not only XP | Persona test | P2 | — | Done (12 Oct: Coach 5 lessons, Mentor 8) |
| CRQ-026 | "Working on" picker (Calm / Confidence / Recall) and a rescue/adoption date | Persona test | P2 | — | Done (12 Oct: "Home since" gotcha day; this week's skill picker) |

| CRQ-027 | Learn from Duolingo: flow, GUI, logic, presentation, psychology; take the best, ethically | Shiv | P1 | Co-captain | Done (11 Oct) |
| CRQ-028 | Never lose work at a usage limit: `docs/STATUS.md` progress file, small commits, agents write to files | Shiv | P1 | Co-captain | Done |
| CRQ-029 | Welcome page says "Grow with your dog", but people may not have a dog: inclusive copy | Shiv | P1 | Co-captain | Done (11 Oct) |
| CRQ-030 | Level check is too much text: one question per screen, big cards with pictures, progress bar, fun | Shiv | P1 | Co-captain | Done (11 Oct) |
| CRQ-031 | Animated celebrations for missions (mission-complete screen, XP count-up) | Shiv | P1 | Co-captain | Done (11 Oct) |
| CRQ-032 | Navigation and flow: less text per screen, smoother back and forward, fun styles | Shiv | P1 | Co-captain + QA | Done (12 Oct: phone Back closes the top sheet; GUI pass v2) |
| CRQ-033 | Simpler food logging (one-tap meal, treat and poop on Home) | Shiv | P1 | Co-captain | Done (11 Oct) |
| CRQ-034 | Fewer tips and spam screens; minimal, appealing, curiosity-led | Shiv | P1 | Co-captain | Done, more in QA |
| CRQ-035 | Plan feature is unclear: reframe as "When should Nova nudge you?" | Shiv | P1 | Co-captain | Done (11 Oct) |
| CRQ-036 | Shiv's photos look plain: better crop and a styled treatment so they're appealing | Shiv | P1 | Co-captain | Done (11 Oct) |
| CRQ-037 | Remove Discord; Instagram/Facebook Reels now, WhatsApp group later | Shiv | P1 | Co-captain | Done (11 Oct) |
| CRQ-038 | Location-based walk-group requests with a "people within X km" counter. Needs a server, location data is personal (GDPR), carries stalking and safety risk, and conflicts with the 10 Oct online-only decision. Options: (a) park it; (b) opt-in county-level interest counts, shown only at 10 or more, no meetups organised by us; (c) a WhatsApp group per county. | Shiv | P3 | **Shiv decides** | Waiting on Shiv |
| CRQ-039 | Businesses and vets section: a clear page Shiv can send, showing why to sponsor and what easy value we provide | Shiv | P1 | Business agent | Done; price waits on Shiv |
| CRQ-040 | Co-captain: a super-manager who reports to Shiv at his level (strategy, money, roadmap) | Shiv | P1 | Co-captain | Done (`docs/org-prompt.md`, `docs/STATUS.md`) |
| CRQ-041 | Business model for vets and pet businesses in Ireland (subscription, sponsorship), with a pitch and outreach | Shiv | P1 | Business agent | Done; price waits on Shiv |
| CRQ-042 | Shareable Instagram "trophy" card: proud moments (trick done, level up), Story size, funnier | Shiv | P1 | Share agent | Done (11 Oct) |
| CRQ-043 | Timer "Keep at it…" button did nothing: rethink; then a full GUI pass from a designer prompt (`docs/design-prompt.md`) | Shiv | P1 | Co-captain (timer, done) + Designer agent | Done (11 Oct): `docs/design-system.md` |
| CRQ-045 | Link preview looks bad when sharing: redo it (readable thumbnail, any pet, short text) | Shiv | P1 | Co-captain | Done (11 Oct): `img/og-tiny-wins.jpg` |
| CRQ-044 | QA sprint 2 logic fixes (`docs/qa-sprint2.md` 1, 2, 3, 6, 8, 9, 11): care taps counted as the 1-minute win, cat first win, dog-only content for cats, XP split, cap warning, sample share | QA | P1 | Co-captain | Done (11 Oct), except 11 (Back with a sheet open): Planned |
| CRQ-046 | Final independent QA of 12 Oct batches A–C, picture steps and the rename; fix every Critical/Major | Co-captain | P1 | QA agent | Planned (first job) |
| CRQ-047 | Remove the Android address bar: add `.well-known/assetlinks.json` + `.nojekyll` to the `novashiv11.github.io` repo (needs the Claude GitHub App on that repo) and a stable signing key (secret `ANDROID_KEYSTORE_PASSWORD`) | Shiv | P1 | **Shiv** (access) then Co-captain | Waiting on Shiv |
| CRQ-048 | "Do it for them" replaces "1% better" everywhere (done in the app 12 Oct; check docs, launch kit, Reels scripts) | Shiv | P2 | Co-captain | Partly done |
| CRQ-049 | Credit Shiv: CREDITS.md, README, future commits under Shiv's name | Shiv | P1 | Co-captain | Done (12 Oct) |
| CRQ-050 | Reddit/community launch post (copy drafted in chat): link the website, not the APK; hide email on GitHub | Shiv | P2 | **Shiv** | Shiv to post |

Done earlier on 11 Oct: Do it now (spec v3); simple steps; persona-test batch 1 (decision 48); cartoon photos; pet icons; Add-pet bar; Android APK.