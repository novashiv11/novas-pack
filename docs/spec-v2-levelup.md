# Spec v2: "Level up together", the real-life dog and human growth game

**10 Oct 2026. Shiv's direction:** "A human–dog growth tracker, like Pokémon IRL." Not a reactive-dog tracker. Keep a small Health tab. It must be genuinely useful (real training and real life) and lead towards Shiv becoming a trainer and earning from it.

## A. One-paragraph spec

**Who:** anyone raising a dog (puppy, teenager or adult), first-time or experienced; cats and others can still use Health. **What they do:** pick their dog as a **partner**, then do short real-world training sessions, walks and new experiences, and log them in one tap. **What they get:** their dog's **skills level up** (recall, loose lead, settle…), stats grow, **badges** unlock for real milestones, an **Adventure Book** fills with real experiences, and the human rises through **Trainer ranks** (Rookie → Handler → Coach → Mentor) by learning how dogs learn. **Why they come back:** a daily 5-minute quest picked for their dog's weakest skill, weekly quests, visible growth (levels, stats, stage), and real results on walks. **Money and Shiv's path:** free core; later paid **Training Programs** (4-week guided paths), online classes, and, once Shiv qualifies, the app becomes his **coaching platform**.

## B. Review of the idea (risks → fixes)

| Risk | Fix |
|---|---|
| Pokémon is trademarked IP. | No Pokémon names, art or terms: no "Pokédex", "Poké", "gym" or "evolve" branding. Our words: **Partner, Skills, Badges, Quests, Adventure Book, Trainer rank, Stages**. Original art only (the Nova SVG and emoji). |
| XP farming makes it meaningless. | XP only for **real actions**, with caps: max 3 counted sessions per skill per day, walks max 2 a day, each adventure stamp once ever, learning lessons once each. **Never** XP for app opens, likes or shares. |
| The honour system can be gamed. | It's your own growth, so gaming only cheats yourself. Skill level-ups also need a self-check at harder **distraction levels** (home → garden → street → park), which is honest and educational. An optional photo or video note is stored on the device. |
| Guilt and dark patterns. | Daily quests are optional, with no daily streak to lose. Weekly progress has grace weeks. No guilt notifications. |
| Training must be correct and safe. | Use the existing reward-based skill library (`data/skills.js`) with "when to see a professional". In public, Nova (a restricted breed) works on a lead and muzzle; off-lead recall only in secure areas. |
| "Become a trainer" must be honest. | The trainer ranks are in-app **learning milestones**, not a qualification, and the app says so. At Coach rank, a "Go pro" card lists real routes (an accredited Irish course such as QQI Level 6, or the Karen Pryor Academy), with no affiliation claims. |
| Scope creep. | Reuse the current PWA, data layer and Health views. New: the Partner/Home screen, the XP engine, quests, badges, the Adventure Book, Trainer ranks and Academy lessons, and a shareable card. |

## C. Final build spec

### Navigation (5 tabs)

**Home** (Partner) · **Train** · **Adventures** · **Health** (the existing health, food and poop views, merged and kept small) · **More**.

### 1. Home: your Partner

- **Partner card:** photo or Nova art, name, **Stage** by age (Puppy under 6 months · Teen 6–24 months · Adult · Senior 8+ for dogs; other species just show their age), **Level** (1–50) with an XP bar, and **5 stats** (0–100): **Focus, Recall, Lead manners, Calm, Confidence**.
- **Trainer strip** (the human): name ("You"), rank, XP bar, next rank.
- **Today's quest** (1, optional): picked for the weakest stat, e.g. "5 min Recall at home". The Start button opens the skill and a session timer.
- **Weekly quests** (3): e.g. "3 Recall sessions", "1 new adventure", "1 care task", with progress rings. Completing all 3 gives a bonus.
- **Quick log:** 🎓 Training (choose a skill) · 🚶 Walk · 🌟 Adventure · 💩/🍽️ go to Health.
- **Level-up moments:** a calm celebration ("Recall reached level 3: in the garden. Nova approves.") that respects reduced motion. Confetti only on badges.

### 2. Train: skills as levels

- A skill list with **level 0–5** each and the next requirement:
  - L1: 3 sessions
  - L2: 8 sessions and "works at **home**"
  - L3: 15 sessions and "works in the **garden or quiet place**"
  - L4: 25 sessions and "works on the **street**"
  - L5: 40 sessions and "works in the **park or busy place**"
- Each level-up asks one honest self-check ("Did it work 4 out of 5 times at this level?" Yes / Not yet).
- **Skill page:** clip (if present), why, steps, common mistake, when to see a pro; **Start session** (a 5-minute timer with "How did it go? 😕 🙂 🤩"); session history.
- **Stats mapping:**
  - Recall ← recall
  - Lead manners ← loose-lead, wait-doors
  - Focus ← leave-it, settle, trick-spin, toilet-training
  - Calm ← settle, greetings, handling, alone-time
  - Confidence ← muzzle, handling, adventures count, cat-carrier, cat-handling

  A stat is the scaled average of its skills' levels, plus a small bonus from adventures for Confidence.

### 3. Adventures: the Adventure Book

- A grid of **stamps** (real-life firsts), greyed until earned.
- About 30 stamps across 5 sets: **Places** (first beach, café, forest walk, city street, vet visit calm, car trip), **Friends** (met a calm dog, met a child calmly with a parent, met a cat politely), **Milestones** (10/50/100 walks, first muzzle walk, first night walk), **Seasons** (first rain walk, snow, autumn leaves), **Brave** (new surface, stairs, lift, bridge).
- Earning one: tap → add date and an optional photo (stays on the device, location data removed) → +20 XP once.
- Walks log (one tap, optional minutes) feeds the Milestones set.

### 4. Badges (8 skill badges + milestone badges)

- **Skill badges:** a skill reaching **level 3** earns its badge: Recall, Loose Lead, Settle, Calm Greetings, Leave It, Doorway, Handling, Muzzle.
- **Milestone badges:** Adventurer (10 stamps), Explorer (25 stamps), Walker (100 walks), Steady (8 weeks with any training; grace weeks allowed).
- Shown on Home (row) and in More → Badges.

### 5. Trainer ranks and the Academy (the human's growth)

- **Trainer XP** comes from: training sessions logged (+10), skill level-ups (+50), care tasks done (+5), Academy lessons completed (+15 once each), weekly quests (+30).
- **Ranks:** Rookie (0) → Handler (300) → Coach (1,000) → Mentor (2,500).
- **Academy:** 8 short lessons (1–2 minutes of reading, each ending in a 2-question check), written in `data/academy.js`:
  1. How dogs learn (reward timing)
  2. Reading body language (stress signals)
  3. Choosing rewards
  4. Distraction levels
  5. Short sessions and ending on a win
  6. Management versus training
  7. When to call a professional
  8. Muzzle-positive in public (restricted-breed law example).

  Content is reward-based, sourced, with no diagnosis.
- At **Coach**, a "Go pro" card: "Want to train other people's dogs for real? Here's how people get qualified" with real routes (an accredited course such as Creedons QQI Level 6 in Ireland; Karen Pryor Academy), clearly "not affiliated, check current details".

### 6. Share: the Partner card

A 1080×1350 canvas image (reuse the `card.js` drawing approach in a new `js/sharecard.js`) with the partner photo, name, stage, level, the 5 stat bars, the top 3 badges, and the trainer rank, ending "Nova's Pack · Level up together". Share via the Web Share API or download.

### 7. Health (kept small)

Merge the existing Health, Food and poop log into one Health tab with segments: Health (vaccines, meds, weight, vet), Food, Poop, Unwell. Keep the vet-first alerts and everything that already works. Care tasks done award trainer XP.

### 8. Data

- Add the stores and fields via a db.js schema migration (keep users' existing data):
  - `xp` events are **derived**, not stored: compute XP from logs, so there's nothing to farm or desync.
  - `adventures` (`petId`, `stampId`, `date`, `photo?`)
  - `skillChecks` (`petId`, `skillId`, `level`, `at`)
  - `academy` (`lessonId`, `doneAt`)
  - `settings.trainerName`
- Export/import includes the new stores.
- **Bump `VERSION` in sw.js and add new JS files to the precache list.**

### Rules (unchanged)

- Honest; vet-first; no doses or diagnosis; no dark patterns; on-device data; no accounts or third-party requests; WCAG 2.2 AA; light and dark mode; reduced motion.
- Brand tokens and fonts as in `app.css` and `site.css`.
- Nova's voice: witty, adult, lovingly bossy.

### Done when

- First run is partner setup → Home with a quest in under 60 seconds.
- Logging a session raises the skill's progress and XP.
- A level-up self-check works; a badge unlocks at L3.
- An adventure stamp unlocks once.
- An Academy lesson raises trainer XP once.
- The rank changes at the threshold.
- The share card renders.
- Health still works.
- Export/import round-trip works, including the new stores; works offline.
- No console errors or overflow at 320/375/390 in light and dark.
- Independent QA: no Critical or Major issues.
