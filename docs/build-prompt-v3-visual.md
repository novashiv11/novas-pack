# Build prompt v3: visual, interactive, habit-forming

Use this to redesign the public site (`index.html`, `card.html`). It builds on `docs/build-prompt-v2.md` and `docs/global-plan.md`.

---

> **Role:** You're a senior product designer and front-end engineer who builds playful, mobile-first consumer experiences (think Duolingo, BeReal, Spotify Wrapped). You're redesigning the site for **Nova's Pack**: a free, worldwide online community for everyone who loves animals, hosted by Nova (a young German Shepherd, @novathehumanhandler, persona "professional human handler").
>
> **The problem:** the site reads like a document. Visitors come from Instagram or TikTok on a phone, scroll for about 8 seconds, and leave. It needs to feel like a **toy you want to touch**, not a page you read.
>
> **Goal:** within 10 seconds of landing, the visitor has **tapped something and got a reaction**. Within 60 seconds, they've **made a Pack Card**. Something on the page gives them a reason to come back next week.
>
> **Design rules:**
> 1. **Show, don't tell.** Each section has one visual idea, one headline (max 6 words) and at most one short line of text. Anything longer goes behind a tap (`<details>`) or onto another page. Aim for under 250 visible words on the home page.
> 2. **Every section has an interaction:**
>    - **Boop Nova:** tap her photo and she answers with a random line. There's a rare "golden" line, a personal boop counter, and a little bounce.
>    - **Who's in your family?:** tap a species chip and Nova replies; the CTA becomes "Make [Cat]'s card", with the species pre-filled.
>    - **This week's challenge:** a ticket with a countdown ring to Shout-out Saturday, plus "Copy #tag".
>    - **The pack's week:** a 4-stop timeline with today highlighted.
>    - **What you get:** a sideways swipe deck with icons and live/soon chips.
>    - **House rules:** an icon grid.
>    - **Lost pet** and **privacy:** collapsed.
> 3. **Card maker as a game:**
>    - The live preview stays first on mobile.
>    - A "Surprise me" die gives a random title and stats (a variable reward).
>    - Confetti plays when you share, download or tick your streak.
>    - The streak shows as a flame and the last 8 weeks as dots, with grace weeks explained in one line.
> 4. **Habit-forming, never harmful** (non-negotiable):
>    - Variable rewards, anticipation (the Saturday countdown), visible progress (streak dots), personalisation, quick wins and shareable output: **yes**.
>    - Infinite feeds, notifications, guilt copy, fake counts, fake urgency, and points for likes or chatter: **never**.
>    - All counters are personal and stored only on the device.
> 5. **Honest:** no invented members or numbers. Nova's own card is real, so it can be shown. The chat shows "Opening soon" until the Discord link is set in `site.js`.
> 6. **Brand:**
>    - Shannon blue #1F4E6E, oat #F3F2EB, ink #1E1B17, tan #C27A3A (#8E5019 for small text), gold #F2B544 (rewards only). Dark mode #14120F / #8EC1E0.
>    - Bricolage Grotesque headings, Plus Jakarta Sans body, both self-hosted.
>    - Cards 16 px corners; buttons 12 px with a 3 px ledge.
>    - Emoji and simple inline SVG icons for warmth.
> 7. **Quality bar:**
>    - Phone-first (320–430 px); the primary CTA is on the first screen at 375×553.
>    - WCAG 2.2 AA: every interactive element is a real button or link with a label, focus is visible, emoji are `aria-hidden` and paired with text.
>    - Motion is calm and fully disabled under `prefers-reduced-motion`.
>    - No third-party requests and no cookies. Total JS under 20 KB.
>
> **Deliver:** the updated `index.html`, `card.html`, `card.js`, `site.js` and `site.css`, plus an image of Nova's real Pack Card for the home page. Then run an independent QA pass at 320/375/390 px in light and dark, fix every Critical and Major issue, and push to `main`.
