# Nova's Pack — Audit (9 Oct 2026) and Build Prompt

Two independent reviews ran before any further building: a **product & code audit** of everything made so far, and a **market & strategy reality check** with web research. They reached the same conclusion from different directions.

**Bottom line:** the brand, Nova's voice and the welcome page are better than most funded pet startups. The product behind them is too big, partly dog-only, padded with example content, and the join flow leads nowhere. Fix trust first, shrink to one weekly real-world reason to come back, then build a small real app.

---

## Best things (keep and double down)

1. **Nova's voice** — adult, funny, warm ("Complaints go to my handler, who is also me"). This is the moat.
2. **The welcome page** — the note from Nova, "Who it's for" and the house rules land the welcoming position in about 10 seconds. Clean on phones, proper dark mode.
3. **Shout-out Saturday** — fair (once per 8 weeks, opt-out), cheap to run, and a real reason to join that also grows Instagram.
4. **Safety thinking from day one** — vet-first prompts, "needs space" quiet groups, no selling animals, vouches-not-ads, nothing pay-to-win.
5. **Humane habit design** — weekly goals instead of daily, streak passes, XP caps, leaderboards you can switch off.
6. **A launch kit you can use today** — Reel scripts, a 7-day plan, DM replies, a flyer and a Facebook post.
7. **Nova's real story fits the biggest market pain** — 42% of surrender requests to Dogs Trust Ireland are adolescent dogs. Recall (36%) and lead pulling (34%) are the top problems owners report. A teenage GSD learning alongside her human is a story people will follow.

## Worst things (ranked)

| # | Severity | Problem | Fix |
|---|---|---|---|
| 1 | Critical | **The join flow leads nowhere.** The DM reply says "invite link on its way", but there is no shared community. | Pick a real home now: a WhatsApp Community (Limerick-first) plus Nova's Instagram broadcast channel. |
| 2 | Critical | **Public copy promises things that don't exist yet** (verified vets, lost-pet alerts, member directory, local recommendations). | Make each promise true or mark it "coming soon". |
| 3 | Critical | **The preview drops everyone into Nova's account**, and it's dog-only: no cat, hen or "no pet yet" option. | Add a "Who's in your family?" first screen with species and a no-pet path. Until then, label it "Dog preview". |
| 4 | Critical | **Fake social proof** — invented groups with 12,408 members, thousands of poll votes, a fictional "Verified vet", invented Limerick members. This is a trust risk (and an EU consumer-law risk). | Remove it, or label every example and never mark a fake account as verified. Honest empty states are better. |
| 5 | Major | **XP rewards the wrong things** — likes (2 XP), business vouches (15 XP), a repeatable lost-dog sighting (10 taps = 350 XP), and tapping "Trick session" farms badges. | No XP for likes or vouches; one sighting per alert; only real alerts; badges for verified actions. |
| 6 | Major | **Lost-pet and meetup safety** — no guidance on reward scams or theft, no 24/7 moderation, no meetup rules. Limerick Lost & Found (on Facebook since 2012, working with vets) already owns lost pets. | Don't build alerts. Partner with Limerick Lost & Found and ISPCA, and add a "Share to Limerick Lost & Found" button. Meetups: public places, leads on, adults only, no reactive dogs in group walks, insurance. |
| 7 | Major | **Personal data and minors** — DM signups collect names, areas and handles with no privacy notice. Ireland's digital age of consent is 16. | A short privacy note in the DM reply and on the page; 16+ stated. |
| 8 | Major | **The health check is dog-centric** and misses hen and rabbit emergencies. It also fires on "I ate lunch". | A Health topic that always shows the vet note, plus species-aware keywords. |
| 9 | Major | **The prototype code won't scale** — one 90 KB file, one dog per user, XP as counters, photos stored in browser storage (saves silently dropped when full). | Treat the prototype as a spec, not a codebase. Use a real data model: User → Pets (with species) → XP ledger, with photos stored as files. |
| 10 | Minor | **Photo and brand polish** — screenshot-quality crops stretched on desktop, mixed photo filters, a share image that won't preview, no favicon, the "Alpha Walker" title. | Full-resolution originals, one colour grade, absolute share-image URL, favicon, rename the title. |

**Strategic risks from the market review:**

- **No reason to come back.** This is the cold-start problem: feed-only pet networks died.
- **Founder bandwidth.** There is a day job.
- **Weak Instagram reach.** Recent posts reach about 2–8% of followers, and most followers probably aren't in Limerick.
- **Free incumbents** in the local Facebook groups.
- **Credibility of training clips** from a non-professional.
- **"All animals" gives no single hook.** Rabbits, poultry and horses are each in about 1.5% of UK households.

## Contradictions to clean up

- **The app vs the welcome page:**
  - The app is dog-only throughout: breeds, "Good dog", "My dog", stats, titles, polls.
  - Hashtags don't match. The app uses #SunsetShift and #DressCode; the page uses #NewToThePack, #OffDuty and #GoldenHour.
  - Shout-out picks don't match. The app picks top XP / winner / wildcard; the page picks newcomer / most helpful / challenge favourite.
- **The Founding Pack badge** says "first 100" but is given to everyone.
- **Launch plan vs master brief:**
  - The phase numbers differ.
  - The plan says "no selling dogs"; the brief says "no selling or rehoming animals".
- **The original agent brief** ("dog owners 25–55", "post → reactions → XP") is superseded by the master brief.
- **Learn with Nova** is in the brief but not in the app or on the welcome page.

---

## Decisions this audit recommends (Shiv to confirm)

1. **Inclusive brand, focused start.** "Everyone's welcome" stays. Share and Ask are open to every species and to people with no pet. The weekly ritual starts dog-first, because that's where the density is. Cat, hen and other corners open when members ask for them.
2. **The wedge for the first 90 days in Limerick:**
   - **Weekly Pack Walk** — leashed, parallel and structured, co-run with a reward-based trainer.
   - **Vouched Limerick map** — dog-friendly places, secure fields, trainers and groomers, each recommended by named members.
   - **Learn with Nova** — framed as "our journey" (recall, lead walking, settling): honest progress clips rather than expert instruction, checked by the partner trainer.
3. **Community home now:** a WhatsApp Community plus an Instagram broadcast channel. Build the real app only once around 50–100 members are active.
4. **Postpone:** leagues, rarity tiers, card binder, the Plus tier, business listings, in-app lost-pet alerts, worldwide scope, native app.
5. **Money, in order:**
   1. Small paid workshops with the trainer, plus local sponsors for a walk.
   2. Verified listings and trainer referrals, once there are 200+ local members.
   3. Merch drops and brand posts.
   4. The Plus tier, much later.
   - **Never:** pay-to-rank, selling data, pet-sale ads.
6. **Realistic year one (estimates):**
   - 150–400 signups and 40–120 monthly active members.
   - 10–25 Pack Walk regulars.
   - €500–2,500 revenue, roughly break-even.
   - Success means members still showing up at week 8.

---

## The Build Prompt (what I'll follow to make the best work)

> **Role:** You are the lead builder of Nova's Pack, working for Shiv, a solo founder with a day job in Limerick. You run the specialist agents and you own quality.
>
> **Goal:** Within 90 days, 100 real Limerick members who come back every week. You get there through a trustworthy, welcoming community hosted by Nova.
>
> **Always true:**
> 1. *Honest:* never show fake members, fake counts or fake "verified" badges in anything public. Example content is labelled "Example" on the item itself, or not shown at all. Every public promise is either live or marked "coming soon".
> 2. *Welcoming:* every screen works for a first-time owner, any species, and someone with no pet. Use species-neutral words ("pet", "my pack", "lost pet") except inside dog-specific features.
> 3. *Kind and safe:*
>    - Vet-first notes on every health topic.
>    - No selling or rehoming animals for money.
>    - 16+ only.
>    - No exact locations.
>    - Lost pets are routed to Limerick Lost & Found, ISPCA and the microchip databases.
>    - Meetup rules: public places, leads on, adults only.
> 4. *Real life over screens:* reward showing up, helping and learning. No XP for likes, vouches or anything you can spam.
> 5. *Small and finished beats big and broken:* ship the smallest version that's genuinely useful. A solo founder must be able to run it in 5 hours a week.
> 6. *Nova's voice:* warm, witty, adult. No baby talk, no "hiring" or exclusive language.
> 7. *Plain language:* Shiv reads on his phone, so lead with the answer and keep it short.
>
> **Process for every deliverable:**
> 1. Research or check facts first, and cite them.
> 2. Write a one-paragraph spec: who it's for, what they do, what they get, why they come back.
> 3. Build.
> 4. Have it reviewed by an independent QA agent that didn't build it, and doesn't grade kindly.
> 5. Fix everything rated Critical or Major.
> 6. Ship, and tell Shiv in a few lines what changed and what he needs to do.
>
> **Phase 1 deliverables, in order:**
> 1. **Trust fixes:** the welcome page (true promises, "coming soon" labels, 16+, privacy note, absolute share image, favicon), and the DM reply pointing to the real community home.
> 2. **Community starter kit:**
>    - WhatsApp Community structure (channels, pinned rules, welcome message)
>    - House rules
>    - Meetup safety rules
>    - Privacy notice
>    - Pack Walk format and sign-up post
>    - Trainer partnership pitch
>    - Lost & Found partnership message
> 3. **Learn with Nova, season 1:** 8 episode plans (recall, loose lead, settle, greetings, and so on), each with a shot list, steps, a common mistake, and "when to see a professional". Plus a page to post the clips.
> 4. **The preview app, rebuilt honestly:**
>    - "Who's in your family?" onboarding with species and a no-pet option
>    - Species-neutral copy
>    - The game layer cut to XP and 6 badges
>    - Example content removed or clearly labelled
>    - Learn with Nova and the Limerick map, with Pack Walks first
> 5. **Business pack:**
>    - One-page business plan
>    - 12-month model spreadsheet with three scenarios
>    - Brand book
>    - Irish setup and GDPR checklist
>    - Draft privacy policy, terms and community guidelines (marked "not legal advice")
> 6. **Real app (Phase 2)**, only after about 50 active members: accounts, pets with species, posts with photos, Ask, Pack Walk sign-ups, the vouched map, Learn with Nova (admin posting), and reports and blocks. Use a low-cost managed backend and deploy from GitHub.
>
> **Definition of done:**
> - Works on a phone.
> - Nothing fake presented as real.
> - Passes independent QA with no Critical or Major issues.
> - Consistent with the master brief and this audit.
> - Saved in the repo.
> - Shiv gets a short summary of what changed and his next three actions.

---

### Sources (market review)
[Dogs Trust Ireland census 2025](https://www.dogstrust.ie/downloads/Census%202025%20Report%20FINAL.pdf) · [Irish Examiner: adolescent dogs and surrenders](https://www.irishexaminer.com/news/spotlight/arid-41874659.html) · [UK Pet Food pet population](https://pfma.org.uk/pet-population) · [Limerick Animal Lost & Found](https://www.ilovelimerick.ie/limerick-animal-lost-found/) · [ISPCA lost & found](https://ispca.ie/lost-and-found-info) · [gov.ie: rules for selling pets](https://www.gov.ie/en/press-release/ab0bf3-department-reminds-sellers-and-suppliers-of-pet-animals-of-new-rules/) · [Digital age of consent: 16](https://www.williamfry.com/knowledge/in-short-digital-age-of-consent-for-childrens-data-to-be-set-at-16/) · [Online Safety Code Q&A](https://www.matheson.com/insights/the-online-safety-code-q-a/) · [Atomic networks](https://lennysnewsletter.com/p/atomic-network) · [Pet nano-influencer rates](https://www.launchpointhq.com/guides/rates/how-much-do-pets-nano-influencers-charge) · [Mungret dog park](https://www.limerick.ie/discover/eat-see-do/nature-wildlife/parks/dog-park-mungret-park) · [Dogs Trust: shock collar ban](https://www.dogstrust.ie/about-us/media-centre/dogs-trust-ireland-welcomes-introduction-of-ban-on-remotely-controlled)
