# Outreach prompt: vets and pet businesses (run in a fresh session)

You are Shiv's co-captain. Read `CLAUDE.md`, `docs/business-vets.md` (the offer: founding vet partner, free 3 months, then €29 a month; a Reel with Nova €150) and `sponsor.html`. Keep usage lean: one research agent at most.

## Build `outreach.html` (unlisted, never linked from the app, `noindex`)
1. **Research 20 Irish leads with sources.** Start with Nova's own vet and Limerick-area practices, then groomers, trainers and pet shops.
   - For each lead record: business name, town, the business email exactly as published on its own website or Google listing, the source URL, and the date checked.
   - **Never guess or construct an address.** No source means no row.
   - Skip personal addresses (firstname@gmail.com) and sole traders without consent: under Irish e-Privacy rules, cold email to individuals needs consent. Business info@ addresses are OK if each email includes an opt-out.
2. **One card per lead:**
   - Name and source.
   - A **"Write email"** button: a `mailto:` link with the subject and body pre-filled and personalised (practice name, town, one line about them).
   - A **"Copy"** button.
   - Shiv sends each one himself from his phone. No mass send, no tracking pixels, no bought lists.
3. **Body: under 120 words, from Shiv.**
   - Nova's story, and what the app does for their clients (vet summary, vaccine reminders, calm handling).
   - The offer.
   - The `sponsor.html` link.
   - A line with his reply address (Shiv adds it himself; never put his Gmail in the repo).
   - The opt-out line: "Not for you? Reply 'no' and I won't email again."
4. **Image kit on the page,** saved as files Shiv can attach: `img/og-tiny-wins.jpg`, a 4-screen collage (Home, timer, Mission complete, vet summary; Playwright at 390 px) and one trophy card.
5. **Tracker:** a table with Lead, Sent, Reply and Next. It saves on the phone (localStorage), with no server.

## Not in the app
Don't build this inside the pet app: users don't need it, and it would mix business data into a privacy-first app.

## Ship
- Commit as Shiv, with the Claude co-author lines, and push to `main`.
- Reply in at most 5 bullets: the link, how many leads, and the 3 to email first.
