# CLAUDE.md — Nova's Pack

Handoff summary for Claude Code. Read this first, then `docs/00-master-brief.md` and `docs/01-audit-and-build-prompt.md`.

## What this is
**Nova's Pack** is a free, friendly community for **everyone who loves animals**: first-time and experienced owners; dogs, cats, chickens, rabbits, horses and more; rescuers and fosters; and people with no pet yet. It is hosted by **Nova**, a ~1-year-old black-and-tan German Shepherd in Limerick, Ireland, whose Instagram is **@novathehumanhandler** (~3.8k followers). The founder is **Shiv**, a solo founder with a day job who works from a phone. **Since 10 Oct 2026: worldwide and online-only** (see `docs/global-plan.md`).

- **Tagline:** "Everyone's welcome in the pack."
- **Nova's voice:** warm, witty, a little bossy in a loving way, adult. No baby talk, and no exclusive or "hiring" language.

## Repo map
| Path | What |
|---|---|
| `index.html` + `app.css` + `js/` | **The app: "Level up together"** (PWA). `js/app.js` router, `js/db.js` IndexedDB + backup (schema v2), `js/game.js` pure XP/level/rank/badge logic (derived, never stored), `js/logic.js` due/red-flag logic, `js/views/*` screens (welcome, home, training, adventures, trainer, journal, health, food, more, gameui), `js/sharecard.js` partner share image, `js/ics.js` calendar files, `js/sample.js` labelled sample data. |
| `data/` | Content: `skills.js` (13 reward-based skills), `care.js` (vaccines/preventives/poop scale/red flags, sourced), `adventures.js` (Adventure Book stamps), `academy.js` (Trainer Academy lessons), `quotes.js` (Nova's daily lines + a few attributed quotes). Vet-first; no doses. |
| `clips/` | Drop training clips here as `<skill-id>.mp4` (muted, <3 MB). Missing clip → "Clip coming soon". |
| `manifest.webmanifest`, `sw.js`, `img/icons/` | PWA install + offline. **Bump `VERSION` in sw.js on every app change.** |
| `card.html` + `card.js` | Pack Card maker (fun share; `?name=&species=` pre-fill). |
| `privacy.html` | GDPR notice incl. on-device app data. Needs Shiv's full name + email when available. |
| `site.css` / `site.js` | Shared brand styles; site.js used by card.html (challenge rotation, streak). |
| `docs/spec-v2-levelup.md` | **Current app spec** (v2 "Level up together" + the "1% better every day" addendum). Older: `docs/build-prompt-v4-app.md` (v1), `docs/spec-v1.1.md`. |
| `js/install.js`, `img/screenshots/` | One-click install (Android prompt, iOS steps, in-app browser banner); manifest screenshots. |
| `docs/learn-with-nova.md` | Training clip episode plans (shot lists). |
| `docs/global-plan.md` | Growth/money plan (community parts now secondary). |
| `docs/decisions.md` | Decision log + open items. |
| `_archive/` | Old landing pages, prototype, old docs. Never published. |

## Design tokens
- **Light mode:** Shannon blue `#1F4E6E` (primary; the CSS variable is named `--spruce` in app.html), oat background `#F3F2EB`, ink `#1E1B17`, muted `#5C544B`, Nova tan `#C27A3A` (`#8E5019` for small text), sunset gold `#F2B544` (XP/rewards).
- **Dark mode:** background `#14120F`, blue `#8EC1E0`.
- **Fonts:** Bricolage Grotesque (display) and Plus Jakarta Sans (body), from Google Fonts.
- **Shape and motion:** cards 16px radius, buttons 12px with a 3px "ledge" shadow, restrained motion, respect `prefers-reduced-motion`.
- **Nova illustration:** flat SVG GSD head with black saddle, tan cheeks, tan eyebrow dots, pink collar `#E0566E`, gold tag.

## Non-negotiable principles
1. **Honest.** No fake members, counts, polls or "verified" badges in anything public. Label examples on the item itself, or remove them. Every public promise is live or marked "coming soon".
2. **Welcoming.** Species-neutral wording ("pet", "my pack", "lost pet"). Onboarding asks "Who's in your family?" and offers a "no pet yet" option.
3. **Safe.**
   - Vet-first note on every health topic.
   - No selling or rehoming animals for money.
   - 16+ for Instagram features and the Pack Card; 18+ for the Discord chat.
   - Never show exact locations; strip EXIF from uploads.
   - Lost pets: route to local shelters/vets and microchip databases (Ireland: ISPCA). Don't build our own alerts.
   - No in-person meetups organised by the pack (online-only since 10 Oct 2026).
4. **Real life over screens.** XP only for showing up, helping and learning. Never XP for likes, vouches or anything spammable.
5. **Small and finished beats big and broken.** Shiv must be able to run it in about 5 hours a week.
6. **Privacy.** GDPR by design, minimal data, privacy notice wherever data is collected.

## Audit summary
- **Keep:**
  - Nova's voice.
  - The welcome page structure.
  - Shout-out Saturday: Nova features 3 members' animals weekly (newcomer, most helpful, challenge favourite), once per pet every 8 weeks, with opt-out.
  - The safety thinking.
  - Humane habit design: weekly goals, caps, opt-out leaderboards.
- **Fix:**
  1. The join flow goes nowhere (no real community home yet).
  2. Promises that aren't live yet.
  3. The prototype is dog-only and drops everyone into Nova's account.
  4. Fake social proof.
  5. XP farming: likes, vouches, a repeatable lost-dog "sighting", tapping trick sessions.
  6. Dog-centric health keywords.
  7. Photo quality, share image (needs an absolute URL), no favicon, the "Alpha Walker" title.
- **Inconsistencies to resolve:** hashtags (use **#NewToThePack, #OffDuty, #GoldenHour**), Shout-out pick categories (use newcomer / most helpful / challenge favourite), the Founding Pack badge (should be the first 100 only), and phase numbering between docs.

## Product (10 Oct 2026, latest): "Level up together"
- **The app is the product** (`index.html` = installable PWA): a real-life dog and human growth game. Your dog is your **partner** (stage, level 1–50, 5 stats); 13 skills level 0–5 at harder distraction levels with an honest self-check; badges at skill level 3; Adventure Book stamps; daily and weekly quests; **Trainer ranks** (Rookie → Handler → Coach → Mentor) from Academy lessons; shareable partner card.
- **1% better every day:** "1% today" card (one step for your dog, one for you), daily Nova line (`data/quotes.js`), private Growth Journal, "1% a day adds up" chart, Samaritans link in More. No therapy language, no guilt.
- **Health tab kept small:** vaccines/preventives/medicines with due lists and .ics reminders, food and treats, poop log with vet-first red flags, Unwell checklist, weight, vet summary.
- **XP rules:** derived from logs, never stored; capped (3 sessions/skill/day, 2 walks/day, stamps and lessons once). Never XP for opens, likes or shares. No Pokémon names or art.
- Data on the device (IndexedDB), no accounts, backup/export/delete. Never dosing advice or diagnosis.
- Spec: `docs/spec-v2-levelup.md`. Community, Discord and the Pack Card are secondary.

## Strategy (10 Oct 2026): worldwide, online-only
- Reach: Instagram Reels (main), TikTok, YouTube Shorts, Facebook Reels: one video, four places. Home: **Discord** (18+). Hub: website + Pack Card.
- Weekly rhythm: Mon challenge · Wed Ask the Pack · Sat Shout-out Saturday · Sun #PackWalk (real life).
- Engagement: Pack Card, weekly streak with grace weeks, badges for showing up/helping/learning. Never XP for likes or messages, no dark patterns.
- Money (by milestone): affiliates → brand posts (5k+) → sponsored challenge, merch (500+ members) → Learn with Nova mini-course (10k+) → supporter membership (25k+). Never pay-to-rank, selling data, pet-sale ads. TikTok Creator Rewards not listed for Ireland.
- No offline activity, no flyers, no Limerick focus (Shiv, 10 Oct 2026).
- Ages: Instagram features + Pack Card 16+; Discord chat 18+.
- Rehoming: none at all, free or paid. Vet first on health.
- Usage: save Claude usage: no new research agents; build directly; one small QA pass.

## Process for every deliverable
1. Research and check facts, with citations.
2. Write a one-paragraph spec: who it's for, what they do, what they get, why they come back.
3. Build.
4. Run an independent QA agent that didn't build it, and doesn't grade kindly.
5. Fix every Critical and Major issue.
6. Commit and push to `main` (Pages deploys from main / root).
7. Give Shiv a short phone-friendly summary and the next 3 actions.

## Deploy
GitHub repo: `novashiv11/novas-pack`. To deploy on GitHub Pages: **Settings → Pages → Deploy from a branch → `main` / root**. The site is then at `https://novashiv11.github.io/novas-pack/` (Pack Card at `/card.html`).

## Communication
Shiv reads on his phone, sometimes writes in Hinglish, and prefers to "just start". Lead with the answer, keep it short, and ask only when a decision is genuinely his: strategy, money, anything public, anything irreversible.
