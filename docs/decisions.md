# Decision log

Newest first. **Who** = who made the call. Shiv decides strategy, money, anything public and anything irreversible. The builder (Claude) makes the reversible calls and logs them here so Shiv can overturn any of them.

| # | Date | Decision | Why | Who |
|---|---|---|---|---|
| 12 | 9 Oct 2026 | Live/coming-soon labels on the welcome page are plain text with a `data-status` attribute, so Shiv can flip one by editing a single line. | Rule 1: every public promise is live or says "coming soon". | Builder |
| 11 | 9 Oct 2026 | The welcome page marks **pack chat, weekly challenges and Shout-out Saturday as "Open now"**, and **Pack Walk, Learn with Nova and the Limerick map as "Coming soon"**. The WhatsApp Community must exist before the page is shared. | These three only need Instagram plus a WhatsApp Community. The others need a trainer, clips or vouches first. | Builder |
| 10 | 9 Oct 2026 | Pack Walk rules on the page include the Irish restricted-breed law: German Shepherds (Nova included) must wear a muzzle and a strong lead of 2 m or less in public, held by someone over 16. | It's the law ([gov.ie](https://www.gov.ie/en/publication/905aa-my-legal-responsibilities-as-a-dog-owner/)), and a safety-first brand must follow it in public. It also matters for Learn with Nova: off-lead recall practice for Nova needs private land or a hired secure field, not a public park. | Builder |
| 9 | 9 Oct 2026 | Pack Walks are **adults only (18+)**. The community itself is **16+**. | Shiv's meetup rule ("adults only") plus Ireland's digital age of consent (16). | Shiv (rules); builder (wording) |
| 8 | 9 Oct 2026 | Dropped the **Founding Pack badge** from the public page for now. | Badges need an app that doesn't exist yet. Promising it breaks rule 1. Can return when the app is built. | Builder |
| 7 | 9 Oct 2026 | Removed the "Try the preview" link. The old prototype moved to `_archive/prototype-v3.html`, which GitHub Pages never publishes. | The prototype shows invented members, counts and a fake "verified" vet (audit issue #4). Kept as a spec for the Phase 2 app. | Builder |
| 6 | 9 Oct 2026 | `_config.yml` stops GitHub Pages from publishing `docs/`, `finance/`, `README.md` and `CLAUDE.md` as web pages. | Keeps the public site to the welcome page. **Note:** the repo is public, so anyone can still read these files on GitHub. | Builder |
| 5 | 9 Oct 2026 | Fonts are **self-hosted** (downloaded from Google Fonts, SIL Open Font License) rather than loaded from Google's servers. No cookies, analytics or trackers on the site. | GDPR by design: loading Google Fonts sends visitors' IP addresses to Google (Munich Regional Court, 20 Jan 2022). | Builder |
| 4 | 9 Oct 2026 | The welcome page uses Nova's existing 560 px photos inside framed cards, not stretched full-width. | Avoids blurry photos on big screens until Shiv uploads full-resolution originals. | Builder |
| 3 | 9 Oct 2026 | Lost pets go to **Limerick Animal Lost & Found** (Facebook), the **ISPCA register** and **Europetnet** (it finds which of Ireland's 4 microchip databases holds a chip). We don't build alerts. | Shiv's safety rule. These services already have the reach. | Shiv |
| 2 | 9 Oct 2026 | Community home: a **WhatsApp Community** plus Nova's **Instagram broadcast channel**. People join by DMing "PACK" to @novathehumanhandler. Real app only after about 50 active members. | Lean launch: Shiv has about 5 hours a week. | Shiv |
| 1 | 9 Oct 2026 | **Lean launch** strategy (option A from the audit). Inclusive brand, dog-first weekly ritual. 90-day wedge: Pack Walk, vouched Limerick map, Learn with Nova. Postponed: leagues, rarity tiers, card binder, Plus tier, business listings, in-app lost-pet alerts, native app. Money order: workshops and walk sponsors → verified listings and referrals (200+ local members) → merch and brand posts → Plus tier. Never: pay-to-rank, selling data, pet-sale ads. | See `docs/01-audit-and-build-prompt.md`. | Shiv |

## Open questions for Shiv

- **Repo is public.** The business plan and finance model (task 5) will be readable by anyone on GitHub. Fine, or do you want them kept somewhere private?
- **Privacy contact.** The page says "DM @novathehumanhandler" for data requests. A dedicated email address (for example a free Gmail just for Nova's Pack) would be better for GDPR requests. Want one?
- **Photos of Nova in public places without a muzzle.** Some existing posts show this. The page now states the restricted-breed law, so future Learn with Nova and Pack Walk content should show Nova muzzled and on a short lead in public, or be filmed on private land.
