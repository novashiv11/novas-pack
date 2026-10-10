# Nova's Pack — Launch Plan & Agent Prompts

> **⚠️ Partly out of date (9 Oct 2026).** Don't post the Facebook/WhatsApp post, flyer or DM replies below: they promise things that aren't live (verified vets, lost-pet alerts, a member directory, a Founding Pack badge) and point to the old app preview. Honest replacements are coming in `docs/community-kit.md` (task 2) and `docs/launch-kit.md` (task 4). See `docs/decisions.md`.

**Status (9 Oct 2026):** Prototype app (v3) and public launch page are built. An open, welcoming community for all animal lovers: new and experienced owners, dogs, cats, chickens and everyone else. Signups run through Nova's Instagram DMs ("PACK") until the real app is live.

---

## Your to-do list (Shiv)

**Tonight (10 minutes)**
1. Open the launch page → **Share** → turn on the public link. Copy it.
2. Do the same for the app preview (the launch page's "Try the preview" button points to it).
3. Instagram: put the launch page link in Nova's bio and update the bio text (below). Fix "humam" → "human".
4. Turn on a DM quick reply for the word **PACK** (text below).

**This week**
5. Post Reel 1 ("Everyone's welcome") on Monday, then follow the 7-day plan.
6. Post the Facebook/WhatsApp message in 2–3 Limerick dog groups (ask admins first).
7. Print 20 A6 flyers with a QR code to the launch page. Ask your vet, a groomer and one dog-friendly café to keep a few.
8. Keep a simple list of everyone who DMs PACK: their animals (name and kind), Instagram handle, area. That's your Founding Pack.

**When you hit ~30–50 signups → build the real app (Phase 3)**
9. Create free accounts on a hosting service and a database/sign-in service (the build agents will say exactly which and walk you through it), and buy the domain (e.g. novaspack.com / .ie).

---

## Agent team for launch

```
                Shiv (Owner)
                     │
            Launch Manager (PM)
     ┌───────────────┼────────────────┐
 Growth Supervisor   Product Supervisor   Engineering Supervisor
  ├ Content Creator   ├ Community Manager   ├ Backend Engineer
  ├ Local Outreach    └ Moderation Lead     ├ Front-end Engineer
  └ Analytics                               └ QA & Security Tester
```

### Launch Manager
> You run the Nova's Pack launch. Goal: 100 founding members in Limerick in 30 days, from every kind of animal lover, then a working public app. Each week, report to Shiv in plain language: signups, what worked, what's next, and decisions he needs to make. Keep one decision log. Never commit Shiv to spending money without asking.

### Growth Supervisor
> Own reach. Use the launch kit below. Track which Reels and channels bring DMs. Double down on what works after week one; drop what doesn't.

- **Content Creator** — Write and script Reels, Stories and captions in Nova's voice (warm, witty, welcoming; never exclusive or snobby; no baby talk). Plan each week's #challenge and Shout-out Saturday post.
- **Local Outreach** — Find Limerick dog, cat, poultry and pet groups, plus vets, groomers, trainers, farm shops and cafés. Draft polite messages for Shiv to send. Never spam groups; always ask admins.
- **Analytics** — Each Sunday, summarise: followers, Reel views, DMs with PACK, signups by area/breed. One-paragraph verdict.

### Product Supervisor
- **Community Manager** — Welcome every new member, run Shout-out Saturday by the rules, collect feedback, and turn the top 3 requests into a feature list for Engineering.
- **Moderation Lead** — Write community rules (no selling dogs, no shaming, health questions → vet first), and a simple report/block process before the app opens to the public.

### Engineering Supervisor (Phase 3: real app)
> Turn the prototype into a real public web app. Keep Nova's design, copy and features. Use a managed database with built-in sign-in and file storage, and a simple host with free tiers. Build mobile-first; installable on phones as a web app before any app-store version.

- **Backend Engineer** — Accounts (email + Google/Apple sign-in), dogs, posts with photo upload, likes, comments, Q&A, groups, places with vouches, lost-dog alerts by distance, XP ledger, weekly leagues, Instagram handle field. Row-level security so people only edit their own stuff.
- **Front-end Engineer** — Port the prototype screens and open them to every animal (dogs, cats, chickens, rabbits, horses, other; plus "no pet yet" members). Add sign-up/onboarding ("Add your animals"), real feed, Pack Directory, Shout-out Saturday picks from real XP. Shareable dog-card image for Instagram Stories.
- **QA & Security Tester** — Test every flow on a phone, check privacy (no exact home locations shown, photos stripped of location data), rate limits on posts, and that reports/blocks work. Report bugs by severity; don't grade kindly.

**Instagram note for engineers:** personal Instagram accounts can't be connected to third-party apps any more. v1 stores the handle and shows a Follow button. Auto-import of posts needs a Business/Creator account and Meta app review; consider it only after launch.

---

## Launch kit (welcoming version)

**Tone:** Nova is the host, not the boss. Warm, a little funny, never exclusive. Everyone is welcome: first-time owners, old hands, dog, cat and chicken people, and people with no pet yet.

### Instagram bio (about 140 characters)
> German Shepherd. Professional human handler. Host of Nova's Pack, a friendly home for all animal lovers. DM PACK to join 🐾

### Reel scripts
Keep each Reel 7–15 seconds. Put the hook on screen in the first frame. Use Nova's own sounds (snores, sighs) as audio.

**Reel 1 — "Everyone's welcome" (launch, Monday)**
- **Hook:** "You don't need a German Shepherd to join. You don't even need a dog."
- **Shots:**
  1. Nova looking into the camera
  2. Cosy blanket nap
  3. Sunset on the Shannon
  4. Belly-up nap
  5. Phone showing the app
- **Voiceover:** "I'm Nova. I'm starting a pack, and it's for everyone. First puppy or fifth cat. Backyard hens. No pet yet, just love animals. Share your animals, ask anything, meet people nearby. DM me PACK. Come on in."
- **Caption:** Nova's Pack is open. A free, friendly community for anyone who loves animals: newbies, old hands, dog people, cat people, chicken people. DM PACK to join. Starting in Limerick, open to everyone.
- **Hashtags:** #NovasPack #NewToThePack #LimerickPets #AnimalLovers

**Reel 2 — "Off Duty"**
- **Hook:** "Do not disturb. Nap in progress."
- **Shots:**
  1. Belly-up nap, wide shot
  2. Push in on a twitching paw
  3. Human tiptoes past
  4. Nova opens one eye
- **Voiceover:** "This is my best work. Now show me yours. Dogs, cats, hens, whoever. Most relaxed nap pose wins my heart."
- **Caption:** Show me your animal's most off-duty pose with #OffDuty. Every species welcome. Favourites go in my Stories.

**Reel 3 — "Golden Hour"**
- **Hook:** "My favourite part of the day. What's yours?"
- **Shots:**
  1. Golden hour on the Shannon
  2. Slow-mo trot
  3. Nova looks back at the camera
- **Voiceover:** "Evenings by the river are my thing. Yours might be the garden, the window seat, or the hen house. Show me with #GoldenHour."
- **Caption:** Your animal in the evening light. Walk, garden or windowsill. Tag me and #GoldenHour.

**Reel 4 — "Ask the pack"**
- **Hook:** "First pet? Here's the best advice I've got."
- **Shots:**
  1. Puppy-ish Nova clips, or close-ups
  2. Text on screen with questions people asked
  3. Nova's head tilt
- **Voiceover:** "Nobody knows everything on day one. My human certainly didn't. In the pack, no question is silly. Ask the people who've done it for years."
- **Caption:** New pet parents: what's the one thing you wish you'd known? Old hands: drop your best tip below. #NovasPack

**Reel 5 — "Shout-out Saturday"**
- **Hook:** "Three animals are getting famous this Saturday."
- **Shots:**
  1. Cosy blanket nap
  2. Nova looking at a phone
  3. An approving head tilt
- **Voiceover:** "Every Saturday I share three pack members' animals. A newcomer, the most helpful member, and a challenge favourite. Any species. Everyone gets a turn."
- **Caption:** Shout-out Saturday starts this week. Join the pack (DM PACK), add your pet's Instagram, post a hello with #NewToThePack.

### Launch week
| Day | Reel | Stories |
|---|---|---|
| Mon | R1 Everyone's welcome | "Who's in your family?" question sticker; poll: dog / cat / hens / other |
| Tue | R2 Off Duty | Launch #OffDuty; reshare entries from any species |
| Wed | — | Welcome the first members by name (with permission); "Ask me anything" sticker |
| Thu | R3 Golden Hour | Launch #GoldenHour; poll: walk, garden or window? |
| Fri | R4 Ask the pack | Share the best tips from comments; remind people Shout-out Saturday is tomorrow |
| Sat | R5 Shout-out Saturday | Feature the 3 picks (tag them) |
| Sun | — | Thank-you recap with member count; "What should the pack do next?" |

Reply to every comment within the first hour of posting, especially questions from newcomers.

### Facebook / WhatsApp group post
> Hi all, Shiv here. I live in Limerick with my German Shepherd Nova. I've started **Nova's Pack**, a **free** and friendly community for anyone who loves animals: brand-new pet owners, people who've had animals all their lives, dog, cat and chicken people, and anyone with no pet yet who just loves them.
>
> You can share photos and ask questions (no question is silly, and there are verified vets and trainers). You can also find local walks and meetups, including quiet ones for nervous pets, get honest recommendations for local vets and groomers, and send lost-pet alerts.
>
> To join, follow @novathehumanhandler on Instagram and DM **PACK**, or see [link]. No fees, no catch. Admins, happy to remove this if it's not OK here.

### A6 flyer
> **EVERYONE'S WELCOME IN THE PACK.**
> A free, friendly community for animal lovers in Limerick and beyond.
>
> - First pet or fifth, dogs, cats, hens and more
> - Ask anything, no judgement
> - Local walks and meetups
> - Trusted vets and groomers, recommended by locals
> - Lost-pet alerts
>
> **[QR CODE → launch page]**
> Scan, or DM **PACK** to **@novathehumanhandler**

### DM replies
**Quick reply for "PACK":**
> Welcome! 🐾 I'm Nova, your host. Tell me who's in your family: their names, what kind of animal, and their Instagram if they have one. No pet yet? That's fine. Just tell me what you love. Your invite link is on its way.

**Welcome message:**
> Welcome to the pack, [name]! You're one of our first members, so you'll get the Founding Pack badge.
> 1. Join here: [link]
> 2. Post a hello with #NewToThePack so everyone can say hi
> 3. Add your pet's Instagram to the member directory
> 4. Got a question? Ask in the pack. No question is silly.
>
> So glad you're here. – Nova

### Shout-out Saturday rules
1. You must be a member. Any animal counts. If you link a public Instagram, we'll tag it.
2. Each week there are 3 picks: a **newcomer welcome**, the **most helpful member** and a **challenge favourite**.
3. A pet can be featured once every 8 weeks, so everyone gets a turn.
4. Real photos of your own animals only.
5. People are told by Friday and can opt out.

**Caption template:**
> Shout-out Saturday! Meet some of the pack:
> Newcomer: @[handle], welcome [pet name] the [animal]!
> Most helpful: @[handle], thank you for [what they did].
> Challenge favourite: @[handle] for #[Challenge].
> Everyone's welcome. DM PACK to join. #NovasPack #ShoutOutSaturday

### Launch-week challenges
- **#NewToThePack** — introduce your animal, or yourself if you don't have one yet
- **#OffDuty** — your pet's most relaxed nap pose, any species
- **#GoldenHour** — your animal in the evening light
