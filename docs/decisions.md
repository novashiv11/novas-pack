# Decision log

Newest first. **Who** = who made the call. Shiv decides strategy, money, anything public and anything irreversible. The builder (Claude) makes the reversible calls and logs them here so Shiv can overturn any of them.

| # | Date | Decision | Why | Who |
|---|---|---|---|---|
| 31 | 10 Oct 2026 | Old Limerick-era docs (community kit, launch kit, money plan, launch plan) moved to `_archive/docs-v1/`. `docs/global-plan.md` is now the single plan. | One source of truth; less to maintain. | Builder |
| 30 | 10 Oct 2026 | Usage: no new research agents; build directly; one small QA pass per deliverable. | Shiv asked to save Claude usage. | **Shiv** |
| 29 | 10 Oct 2026 | Engagement system: weekly rhythm (Mon challenge, Wed Ask, Sat Shout-out, Sun #PackWalk), Pack Card, weekly streak with grace weeks, badges for real actions. **No** XP-per-message bots, guilt notifications, infinite feeds or points for likes. | Shiv asked for Reels/TikTok-level engagement; this is the humane version that keeps his rule 4 and fits upcoming EU addictive-design rules. | Builder |
| 28 | 10 Oct 2026 | **Pack Card maker** (`card.html`): client-side only, photo never uploaded, re-encoded without location data; card choices and streak in localStorage with a delete button. | Shareable result = viral loop (Wordle/Wrapped pattern) with zero backend or privacy risk. | Builder |
| 27 | 10 Oct 2026 | **Community home: Discord** (18+), replacing WhatsApp. One line in `site.js` (`COMMUNITY_URL`). Chat items show "Opening soon" until it's set. | Worldwide scale, usernames instead of phone numbers, AutoMod, onboarding questions, roles for badges. | Builder (Shiv: "decide yourself"; reversible) |
| 26 | 10 Oct 2026 | No flyers or anything offline. | Shiv won't print or distribute. | **Shiv** |
| 25 | 10 Oct 2026 | **Pivot: worldwide, online-only.** Limerick-first, Pack Walks in person and the vouched Limerick map are dropped. Sunday #PackWalk becomes a global "real life" ritual. | Shiv's call. | **Shiv** |
| 24 | 9 Oct 2026 | **Money plan:** workshops → walk sponsors → brand posts → merch → verified listings (200+ members). Automation stack: Instagram saved/keyword replies, Luma, Stripe, Tally, Fourthwall. Prices and splits are suggestions. | Shiv asked for an automated money plan. See `docs/money-plan.md`. | Builder (proposal); Shiv decides prices |
| 23 | 9 Oct 2026 | Pack Walk sign-ups go through **Luma** (free events), not only WhatsApp Events. | Luma caps numbers, runs a waitlist, records the rules tick-box and sends reminders. WhatsApp Events can't cap numbers. | Builder |
| 22 | 9 Oct 2026 | Walk sign-up uses an **acknowledgement of owners' duties**, not a liability waiver. | Excluding liability for injury is an unfair term once events are paid (Consumer Rights Act 2022). Owners are strictly liable for their dogs anyway. | Builder (legal review) |
| 21 | 9 Oct 2026 | **No rehoming at all, free or paid.** No breeding or stud offers. Registered rescues may share their own appeals through an admin. | "Free to a good home" posts attract flippers, and Irish pet-advertising rules cover supply as well as sale (S.I. 681/2019). | Builder (tightens Shiv's rule) |
| 20 | 9 Oct 2026 | Shout-out picks: newcomers in joining order; most helpful nominated by members; challenge favourite picked by Shiv from Instagram **or** chat entries, never by likes. Consent screenshot logged. "Everyone gets a turn" became "lots of pets get a turn". | 3 a week can't reach everyone, so the old line wasn't honest. Copyright: we need permission from whoever took the photo. | Builder |
| 19 | 9 Oct 2026 | Recommend a **second phone number** for the pack's WhatsApp, and a **co-admin** before opening. | WhatsApp shows admins' numbers to every member. One admin can't cover moderation. | Builder (Shiv to action) |
| 18 | 9 Oct 2026 | Recommend switching Nova's Instagram to a free **Creator account**. | Needed for saved replies, insights and trial Reels. Reversible. | Builder (Shiv to action) |
| 17 | 9 Oct 2026 | Full privacy notice on its own page (`privacy.html`) with a short summary on the welcome page. Contact is Instagram DM or a WhatsApp admin until Shiv sets up a dedicated email. | GDPR Art. 13. Shiv left the email choice to the builder. | Builder |
| 16 | 9 Oct 2026 | **Photos: indoor shots only for now** (scarf, face). Outdoor photos moved to `_archive/img/` until there are muzzled versions. The share image was remade. | Outdoor photos showed Nova unmuzzled in public right beside the law the page quotes. | Builder (Shiv: "decide yourself") |
| 15 | 9 Oct 2026 | **Public "No Instagram? Join on WhatsApp" button**, with "Approve new members" on. It shows once Shiv pastes the invite link into `site.js`. | Flyer and Facebook visitors may not use Instagram; DMs from strangers land in Requests. | Builder (Shiv: "decide yourself") |
| 14 | 9 Oct 2026 | **WhatsApp chat and Pack Walks: 18+.** Following Nova, challenges and Shout-out Saturday stay 16+. | WhatsApp exposes members' phone numbers. Adults could DM 16–17-year-olds, and a single volunteer admin can't safeguard that. | **Shiv** |
| 13 | 9 Oct 2026 | Welcome page restructured after 5 independent reviews (QA, brand, community safety, legal, growth): text-first hero so the join button is on the first phone screen; one "What you get" list instead of duplicate sections; walk rules in a tap-to-open section; photo strip removed; more of Nova's voice. | Instagram's in-app browser is short; the old page was about 13 phone screens long. | Builder |
| 12 | 9 Oct 2026 | Live/coming-soon labels are plain text with a `data-status` attribute, so Shiv can flip one by editing a single line. | Rule 1: every public promise is live or says "coming soon". | Builder |
| 11 | 9 Oct 2026 | The welcome page marks the **pack chat, photo challenges and Shout-out Saturday as "Open now"**, and the **Pack Walk, Learn with Nova and the Limerick map as "Coming soon"**. The WhatsApp Community must exist before the page is shared. | These three only need Instagram and a WhatsApp Community; the others need a trainer, clips or vouches first. | Builder |
| 10 | 9 Oct 2026 | Pack Walk rules include the Irish restricted-breed law: German Shepherds (Nova included) wear a muzzle and a strong lead of 2 m or less in public, held by an adult who can control them. | It's the law ([gov.ie](https://www.gov.ie/en/publication/905aa-my-legal-responsibilities-as-a-dog-owner/)). It also shapes Learn with Nova: off-lead recall practice needs private land or a hired secure field. | Builder |
| 9 | 9 Oct 2026 | Pack Walks are adults only (18+). | Shiv's meetup rule. | Shiv |
| 8 | 9 Oct 2026 | Dropped the **Founding Pack badge** from public copy for now. | Badges need an app that doesn't exist yet. | Builder |
| 7 | 9 Oct 2026 | Removed "Try the preview". The old prototype moved to `_archive/prototype-v3.html`, which GitHub Pages never publishes. | The prototype shows invented members, counts and a fake "verified" vet. Kept as a spec for the Phase 2 app. | Builder |
| 6 | 9 Oct 2026 | `_config.yml` stops GitHub Pages publishing `docs/`, `finance/`, `README.md` and `CLAUDE.md`. | Keeps the public site to the pages. **The repo itself is public**, so anyone can still read these files on GitHub. | Builder |
| 5 | 9 Oct 2026 | Fonts are **self-hosted**. No cookies, analytics or trackers on the site. | GDPR by design: loading Google Fonts sends visitors' IPs to Google (Munich Regional Court, 20 Jan 2022). | Builder |
| 4 | 9 Oct 2026 | Nova's photos stay in framed cards, never stretched full-width. | The photos are 560 px crops until Shiv uploads full-resolution originals. | Builder |
| 3 | 9 Oct 2026 | Lost pets go to **Limerick Animal Lost & Found**, the **ISPCA register** and **Europetnet**. No alerts of our own. | Shiv's safety rule; these already have the reach. | Shiv |
| 2 | 9 Oct 2026 | Community home: **WhatsApp Community** + Nova's **Instagram broadcast channel**; join by DMing "PACK". Real app only after about 50 active members. | Lean launch; about 5 hours a week. Note: broadcast channels may not be available to every account size; the WhatsApp Announcements group does the same job. | Shiv |
| 1 | 9 Oct 2026 | **Lean launch** strategy (option A). Inclusive brand, dog-first weekly ritual. 90-day wedge: Pack Walk, vouched Limerick map, Learn with Nova. Postponed: leagues, rarity tiers, card binder, Plus tier, business listings, in-app lost-pet alerts, native app. Money order and "never" list as in `CLAUDE.md`. | See `docs/01-audit-and-build-prompt.md`. | Shiv |

## Open items for Shiv

- **Discord:** create the server (`docs/global-plan.md`, Appendix A) and send Claude the invite link.
- **Email for the pack** (privacy contact). Legal review: needed before sharing publicly.

- **Full name and a dedicated email** for the privacy notice (GDPR: people must be able to identify and contact the controller). Needed within days of launch, and before any money comes in.
- **Repo is public.** The money plan, and later the business plan and finance model, are readable by anyone on GitHub. Fine, or move them somewhere private?
- **Photos:** full-resolution originals, plus outdoor shots **with the muzzle on** (river at sunset, night walk, raincoat, red jumper), so they can come back to the site.
- **Before the first walk:** insurance (yours and the trainer's), a council check on the park, and a co-admin.
- **Before the first euro:** check your employment contract; CRO business name; see `docs/money-plan.md`.
