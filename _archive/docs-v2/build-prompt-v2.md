# Build prompt v2: the global launch site

Use this prompt to build or rebuild the public site. It encodes the plan in `docs/global-plan.md`.

---

> **Role:** You're the lead builder of Nova's Pack, a free, worldwide, online community for everyone who loves animals, hosted by Nova (a young German Shepherd, @novathehumanhandler). The founder runs it from a phone in about 5 hours a week.
>
> **Goal:** a static site on GitHub Pages that turns an Instagram or TikTok visitor into (1) someone who makes and shares a **Pack Card** within 60 seconds and (2) a member of the Discord pack chat. Then it brings them back weekly.
>
> **Build:**
> 1. `index.html`, the hub:
>    - Hero: Nova, "Everyone's welcome in the pack.", and a worldwide, online-only lede.
>    - Primary CTA "Make your pet's Pack Card"; secondary "Join the pack chat" (Discord, from `site.js`) and "DM PACK on Instagram".
>    - **This week's challenge**: computed from the date on an 8-week rotation, with a countdown to Shout-out Saturday.
>    - The weekly rhythm (Mon challenge · Wed Ask the Pack · Sat Shout-out · Sun #PackWalk).
>    - What you get, each item labelled *Open now* or *Coming soon*.
>    - A note from Nova; who it's for (any species, no pet yet); house rules.
>    - Lost or found a pet: worldwide guidance plus an Irish list.
>    - How to join; ages (16+ for Instagram features, 18+ for Discord); privacy summary.
> 2. `card.html`, the **Pack Card maker** (no backend):
>    - Photo (optional) + name + species (including "No pet yet: pack supporter") + a witty title + 3 stat sliders with species-aware labels.
>    - Renders a 1080×1350 card on a canvas in brand style, with Nova's mark, #NovasPack, this week's challenge tag and the site URL.
>    - **Share** (Web Share API with the file) or **Download**.
>    - The photo never leaves the device; re-encoding strips location metadata. Saved choices (not the photo) go in localStorage.
>    - **Weekly Pack streak** (honour system): "I took part this week" once per ISO week; 1 grace week per 4; shown on the card; reset and delete buttons.
> 3. `privacy.html`: Discord replaces WhatsApp. The card maker is local-only. localStorage is explained. Add co-mods as recipients, a reshare-by-tag consent row, and retention details.
> 4. `site.js`: `COMMUNITY_URL` (Discord invite). Items marked `data-needs-community` show "Open now" only when it's set, otherwise "Opening soon". The challenge rotation and countdown live here too.
>
> **Always:**
> - Honest (no fake counts or examples presented as real).
> - Species-neutral; vet-first on health.
> - No points for likes; no dark patterns (no infinite scroll, no guilt copy, no fake urgency).
> - Mobile-first: join CTA on the first screen at 375×553.
> - WCAG 2.2 AA; light and dark mode; respects reduced motion.
> - Brand tokens (Shannon blue #1F4E6E, oat #F3F2EB, ink #1E1B17, tan #C27A3A / #8E5019, gold #F2B544; dark #14120F / #8EC1E0); Bricolage Grotesque + Plus Jakarta Sans, self-hosted.
> - Cards 16 px, buttons 12 px with a 3 px ledge.
> - No third-party requests and no cookies.
>
> **Done when:** an independent QA pass at 320/375/390 px in light and dark finds no Critical or Major issues; the card renders and shares on mobile Chrome and Safari; every asset returns 200; it's pushed to `main`.
