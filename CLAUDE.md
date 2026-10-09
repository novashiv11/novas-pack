# CLAUDE.md — Nova's Pack

Handoff summary for Claude Code. Read this first, then `docs/00-master-brief.md` and `docs/01-audit-and-build-prompt.md`.

## What this is
**Nova's Pack** is a free, friendly community for **everyone who loves animals**: first-time and experienced owners; dogs, cats, chickens, rabbits, horses and more; rescuers and fosters; and people with no pet yet. It is hosted by **Nova**, a ~1-year-old black-and-tan German Shepherd in Limerick, Ireland, whose Instagram is **@novathehumanhandler** (~3.8k followers). The founder is **Shiv**, a solo founder with a day job who usually works from his phone. Launch is Limerick-first, then worldwide.

- **Tagline:** "Everyone's welcome in the pack."
- **Nova's voice:** warm, witty, a little bossy in a loving way, adult. No baby talk, and no exclusive or "hiring" language.

## Repo map
| Path | What |
|---|---|
| `index.html` | Public welcome page. Static, GitHub Pages, no cookies/trackers, self-hosted fonts. Live/coming-soon labels use `data-status="live|soon"`. |
| `privacy.html` | Full GDPR Art. 13 notice. Needs Shiv's full name + dedicated email when available. |
| `site.css` / `site.js` | Shared styles. `site.js` holds `WHATSAPP_INVITE`; the "Join on WhatsApp" buttons stay hidden until it's set. |
| `print/flyer-a6.pdf` | 4-up A6 flyer with QR to the site. Source: `print/flyer-src.html` (open in Chrome → Print → Save as PDF, A4, no margins, background graphics on). |
| `img/` | Photos in use: `card.jpg` (hero), `face.jpg` (avatar), `og-image.jpg` (1200×630), `brand/` (Nova SVG, QR). **Indoor only** until muzzled outdoor shots exist; the rest are in `_archive/img/`. |
| `fonts/` | Self-hosted woff2 + OFL licences. |
| `_archive/prototype-v3.html` | Old prototype app (dog-only, contains fake social proof). **Spec only, never publish.** `_` folders are skipped by Pages. |
| `_config.yml` | Excludes `docs/`, `finance/`, README and CLAUDE.md from the published site. The repo itself is public. |
| `docs/decisions.md` | Decision log + open questions. Update on every task. |
| `docs/specs/` | One spec per deliverable: one-paragraph spec, facts checked with sources, QA result. |
| `docs/00-master-brief.md` | Master brief (mission, principles, audience, pillars, org, agent prompts). |
| `docs/01-audit-and-build-prompt.md` | 9 Oct 2026 audit and Build Prompt. |
| `docs/launch-plan.md` | Older launch kit. **Partly out of date** (promises things that aren't live). Being replaced by `community-kit.md` and `launch-kit.md`. |
| `docs/agent-team-brief.md` | Original brief. **Superseded.** |

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
   - 16+ only, since Ireland's digital age of consent is 16.
   - Never show exact locations; strip EXIF from uploads.
   - Lost pets: route to Limerick Lost & Found, ISPCA and the microchip databases. Don't build our own alerts yet.
   - Meetups: public places, leads on, adults only, no reactive dogs in group walks.
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

## Strategy: decided 9 Oct 2026 (lean launch)
- Inclusive brand, dog-first weekly ritual to start.
- 90-day wedge: weekly **Pack Walk** (leashed, parallel, co-run with a reward-based trainer); **vouched Limerick map** (each place recommended by a named member); **Learn with Nova** clips framed as "our journey", checked by the trainer.
- Community home: WhatsApp Community + Nova's Instagram broadcast channel. Join by DMing "PACK".
- Shout-out Saturday: newcomer, most helpful, challenge favourite; each pet once every 8 weeks; opt-out. Hashtags: #NewToThePack, #OffDuty, #GoldenHour.
- Real app only after ~50 active members.
- Postponed: leagues, rarity tiers, card binder, Plus tier, business listings, in-app lost-pet alerts, native app.
- Money, in order: workshops + walk sponsors → verified listings (no ranking boost) and trainer referrals at 200+ local members → merch and brand posts → Plus tier. **Never:** pay-to-rank, selling data, pet-sale ads.
- Year one (estimates): 150–400 signups, 40–120 monthly active, €500–2,500 revenue. Success = people still showing up at week 8.

## Facts to remember
- **German Shepherds are a restricted breed in Ireland**: muzzle + strong lead ≤2 m held by someone over 16 in public places ([gov.ie](https://www.gov.ie/en/publication/905aa-my-legal-responsibilities-as-a-dog-owner/)). Applies to Nova, to Pack Walks and to Learn with Nova filming (off-lead recall = private land or a hired secure field).
- Ages: **WhatsApp chat and Pack Walks 18+** (Shiv, 9 Oct 2026). Instagram challenges and Shout-out 16+ (digital age of consent, Data Protection Act 2018 s.31).
- Rehoming: none at all, free or paid (S.I. 681/2019 covers supply too). Walk sign-up = acknowledgement, never a liability waiver.
- Lost pets: Limerick Animal Lost & Found (facebook.com/LimerickLostandFound), ISPCA register (ispca.ie/lost-and-found-info), Europetnet (finds which of the 4 Irish microchip databases holds a chip).
- `ig.me/m/novathehumanhandler` opens an Instagram DM on phones; it may not work on desktop web.
- This sandbox can't reach facebook.com, instagram.com, ispca.ie or gov.ie directly: verify via web search and ask Shiv to tap-test links.

## Phase 1 tasks (in order)
1. ✅ Welcome page (`index.html` + `privacy.html`). Spec: `docs/specs/01-welcome-page.md`.
2. ✅ `docs/community-kit.md`: WhatsApp Community structure, house rules, meetup safety, short privacy notice, Pack Walk format + sign-up post, trainer pitch, Limerick Lost & Found / ISPCA message, PACK quick reply + welcome message.
3. Learn with Nova season 1: `docs/learn-with-nova.md` (8 episodes: recall, loose lead, settle, calm greetings, leave it, wait at doors, handling and vet visits, a fun trick; each with shot list, steps, one common mistake, when to see a professional; reward-based only) + `learn.html` (clips from `/clips`).
4. ✅ `docs/launch-kit.md` (done before task 3, because launch needed it) + `print/flyer-a6.pdf`. Also ✅ `docs/money-plan.md` (Shiv asked for it).
   Was: `docs/launch-kit.md`: 5 Reel scripts, 7-day plan, Instagram bio, Facebook/WhatsApp post, A6 flyer, Shout-out Saturday rules + caption template.
5. Business pack: `docs/business-plan.md`, `finance/model.xlsx` (12 months, 3 scenarios, assumptions explained), `docs/brand-book.md`, `docs/ireland-setup-gdpr.md`, draft privacy policy / terms / community guidelines ("not legal advice").
6. Phase 2 web app — **only when Shiv says there are ~50 active members.**

## Process for every deliverable
1. Research and check facts, with citations.
2. Write a one-paragraph spec: who it's for, what they do, what they get, why they come back.
3. Build.
4. Run an independent QA agent that didn't build it, and doesn't grade kindly.
5. Fix every Critical and Major issue.
6. Commit and push to `main` (Pages deploys from main / root).
7. Give Shiv a short phone-friendly summary and the next 3 actions.

## Deploy
GitHub repo: `novashiv11/novas-pack`. To deploy on GitHub Pages: **Settings → Pages → Deploy from a branch → `main` / root**. The site is then at `https://novashiv11.github.io/novas-pack/`, with the prototype at `/app.html`.

## Communication
Shiv reads on his phone, sometimes writes in Hinglish, and prefers to "just start". Lead with the answer, keep it short, and ask only when a decision is genuinely his: strategy, money, anything public, anything irreversible.
