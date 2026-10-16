# Vets and pet businesses: who pays, what we offer (CRQ-039, CRQ-041)

Draft for Shiv, 11 Oct 2026. Money is your call: every price below is a range to choose from, not a promise. Not legal or tax advice.

## The honest starting point

- The app has no accounts and no analytics, so we have **no user numbers** and can't prove results. We sell "a free, private tool, a small honest brand and a say in what it does", never leads or outcomes.
- About 3,800 Instagram followers is a small audience. Price for that.
- Never claim "fewer missed boosters" or "calmer visits" as results. The reminders are calendar files and the handling skill is practice steps; we can't measure either.

**Facts and gaps (check before quoting any of them)**

- **Vet practices:** 772 premises in 2020 and 758 in 2021, per [Agriland](https://www.agriland.ie/farming-news/veterinary-landscape-2021-how-does-it-compare-to-previous-year/). I couldn't open the page; the count includes farm practices and the small-animal number is unknown (check the VCI register).
- **Dog households:** 35.6% of Irish households had a dog and 10.4% a cat (about 640,620 dog households), from a 2007 phone survey of 1,250 households: [BMC Veterinary Research, 2011](https://www.biomedcentral.com/1746-6148/7/28). It is old. A Petmania report's 81% came from pet owners, so it isn't a national figure ([Nenagh Live](https://www.nenaghlive.ie/news/arts---entertainment/1320705/from-sharing-a-bed-to-boosting-mental-health-new-report-reveals-insights-from-irish-pet-owners.html)).
- **Ad labels:** the [CCPC](https://ccpc.ie/business/?p=46677) and ASAI influencer guidance (summarised by [AdWorld](https://www.adworld.ie/2023/10/27/ccpc-and-asai-issue-new-advertising-guidance-for-influencers/)): label paid posts **#Ad**, or **#Gifted** for free products or services; the Irish word is #Fógra. Put it at the start, unhidden. Own-brand posts count too. A label doesn't excuse a misleading claim.
- **Prices:** [Elev8or](https://www.elev8or.io/find/skincare-influencers-in-ireland) estimates €56 to €279 per sponsored post for Irish creators with 1k to 10k followers (skincare and beauty), and [ProfileTree](https://profiletree.com/social-media-influencer-marketing/) gives £50 to £300 in the UK. Different niche: a rough anchor only. I found **no reliable figure for Irish vet practice marketing spend** and haven't invented one.
- **Cold email:** S.I. 336 of 2011 covers unsolicited marketing email. The Data Protection Commission prosecuted a marketing email sent to a business address ([Viking Direct case](https://dataprotection.ie/en/dpc-guidance/case-studies/electronic-direct-marketing/prosecution-viking-direct-ireland-limited)). I couldn't confirm how sole traders are treated, so: one-to-one messages only, Instagram DM first, no bought lists, stop when anyone says no.
- **Vets' own rules:** the [VCI Code of Professional Conduct](https://cms.vci.ie/wp-content/uploads/2024/11/VCI-Code-of-Conduct-Report-Final-Revised-April-2025.pdf) (Issue 16, May 2025) governs vets. I couldn't read its advertising section. Each vet confirms what they may say; they approve every word under their name.

## a) Who pays, and why

| Who | What they want | What we have today | Fit |
|---|---|---|---|
| Independent vet practices | Prepared clients, fewer missed boosters, calmer handling, local reach | One-page vet summary (contacts, food, medicines, vaccines, weight, recent notes), due dates with calendar files, handling skill, vet-first Unwell checklist | **Best. Start here.** Group-owned practices may need head-office sign-off. |
| Groomers, trainers | Clients who accept handling, bookings | Handling and claw-trim skills, reward-based | Good, smaller budgets. Reward-based only. |
| Daycare, boarding | Vaccine proof, calmer arrivals | Vaccine records, the summary | Good, after vets. |
| Pet shops | Footfall, a feel-good brand | Food and treats log | Supplies only, never live animals. Never pay-to-rank in feeding advice. |
| Insurers | Reach, trust | Nothing yet | **Not now.** Regulated, and they want data we won't have or sell. |

## b) Offers (prices are options)

**1. Founding vet partner (recommended first)**
- First 3 to 5 practices: free for 3 months, then **€19 to €49 a month** (my pick €29), or €290 a year. Groomers and trainers: €10 to €20.
- Why free first: with no usage data, early partners are co-designers and our first real proof (named only with their OK).
- They get: their name on the sponsor page, a ready-to-send client message with the app link, and a say in the vet summary.
- Build: nothing in the app. A one-page agreement (what, price, cancel any time, labels, no data), about 2 h. A way to invoice.
- Effort: about 1 h to onboard each, 30 min a month. Five partners is roughly 3 h a month.

**2. Reel with Nova ("Nova's calm vet visit")**
- **€100 to €300** a Reel (my pick €150), anchored to the nano-creator benchmarks above. Labelled #Ad at the start.
- Build: nothing. Needs the practice's written OK to film, no clients in shot, and Nova's restricted-breed rules (muzzle and short lead) on the way in.
- Effort: 3 to 4 h each. Cap at one a month; it eats most of a week.

**3. Sponsored tip of the week**
- **€25 to €60** a tip, or €100 to €200 for four weeks. One sponsor per tip.
- The vet writes or checks it. We only check against our rules (no doses, no diagnosis). It shows "Sponsored" and the vet's name, and it's also a labelled Story.
- Build: `data/tips.js` plus a small Home card, with a `sw.js` version bump. Roughly 3 to 5 h with Claude.
- Effort: about 1 h a tip. Batch four a month.

**4. Partner listing ("Find a vet / pet service", by county)**
- **€10 to €30** a month a listing. Free for founding partners.
- Build (biggest): `data/partners.js`, a directory screen with county and service filters, a "Partner" label, link-outs. Roughly 10 to 20 h with Claude, plus 1 h a month to keep it current.
- **Don't build until 3 partners have said yes in writing, across at least 2 counties.** Alphabetical or rotating order, never by payment.

Order: 1, 2, 3, 4. Offers 3 and 4 stay "coming soon" on the sponsor page until built.

## c) Rules we keep

- **Labels:** everything paid says Sponsored or #Ad, in words, never colour alone.
- **No data sharing:** we hold none and sell none. Partners get no user data. The only numbers we report are Instagram Insights.
- **No medical claims:** we never call a practice "recommended", "best" or "approved", and no "verified" badges. Partners don't say the app prevents or treats anything. No outcome claims until measured.
- **No pay-to-rank:** payment never changes order. "Partner" doesn't mean "recommended".
- **No animal sales:** no live-animal, breeding or rehoming ads. Trainers must be reward-based.
- **Control:** partners approve how we describe them, can leave any time, and are removed within 7 days.

## d) Outreach kit

**Email** (to a named person)

> Subject: A free pet app for your clients
>
> Hi [Name],
>
> I'm Shiv. I run Nova's Pack with my German Shepherd Nova (@novathehumanhandler, about 3,800 followers). It's a free, private app: reminders for vaccines and medicines, a one-page vet summary owners can bring to visits, and short steps for calm handling.
>
> I'm looking for a few Irish practices to help shape it, free to start [only once you've decided]. Details: https://novashiv11.github.io/novas-pack/sponsor.html
>
> Would a 15-minute chat suit? If not, say so and I won't write again.
>
> Shiv

**Instagram DM**

> Hi [Practice]! Shiv here, Nova's human. I made a free, private app that helps owners remember vaccines, bring a one-page summary to visits and practise calm handling. I'd love a vet's eyes on it. Details: [sponsor link]. Happy to answer anything, or leave you be if it's not for you.

**20-second pitch**

> "I'm Shiv. My German Shepherd Nova and I made a free pet app. Owners get due dates, a one-page summary to hand you at the visit, and calm-handling practice. It has no tracking, so I can't promise numbers. I'd like a few practices to try it and tell me what's missing. Can I send you a link?"

**Follow-up** (once, after 5 to 7 days)

> Hi [Name], Shiv again. I sent a note about a free pet app. No pressure: shall I send the two-line version, or leave you be? Either is fine.

**Five likely objections**

1. *How many clients use it?* "I don't know and won't guess. It has no tracking by design. Try it, and ask clients at the desk."
2. *No time or budget.* "Nothing to run, and the first months are free. I'll write the client message. If it doesn't help, stop."
3. *Liability for health advice?* "No diagnosis, no doses, and every health screen says call your vet. You approve anything under your name."
4. *What happens to client data?* "It never leaves the owner's phone. No accounts, and I can't see it."
5. *Why would we pay, and is this an ad?* "You may not, and that's fine. Early partners pay nothing and shape it. Paid things are labelled Sponsored or #Ad, and nobody can buy a better spot."

## e) 30-day plan (about 5 h a week)

- **Week 1:** decide prices and the admin (section f). Publish `sponsor.html`. List 12 targets: Nova's own vet and any groomer or trainer you know first, then 9 cold. Write the one-page agreement.
- **Week 2:** send 6 messages, warm ones first, about 10 minutes each. Book 15-minute calls. Ask every contact: "What do clients forget? What would you want on the vet summary?"
- **Week 3:** send 6 more. Follow up once on the first batch. Hold calls. Note objections.
- **Week 4:** sign 1 to 3 founders in writing. If one is ready, film the calm-visit Reel (labelled). Review the numbers and decide: go on, change the offer, or stop.

**If 15 messages bring fewer than 3 conversations, stop and rethink. Don't build the directory.**

**Three numbers (all honest, none from the app):**
1. Partner conversations held (a reply or a call, not messages sent).
2. Partners signed (a written yes; count paying ones separately).
3. Views on partner Reels (Instagram Insights, 30 days).

## f) Decisions for you

1. **First offer.** Recommend: Founding vet partner.
2. **Price after the free period.** Recommend: €29 a month for vets (range €19 to €49), €15 for groomers and trainers. Say "talk to us" publicly until you decide.
3. **Free period.** Recommend: 3 months for the first 3 practices, 5 at most. Then ask, don't auto-charge.
4. **Reel price.** Recommend: €150 (range €100 to €300), one a month at most.
5. **Admin before the first euro.** Recommend: ask Revenue or an accountant about registering as self-employed, VAT thresholds and invoicing, and check any outside-work rules. I haven't researched this.
6. **Who first.** Recommend: Nova's own vet and two warm contacts, then 9 cold.
7. **Contact route.** Recommend: a dedicated business email for vets (the privacy notice needs one too), with Instagram DM as the first touch.
