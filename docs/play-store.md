# Google Play: copy-paste kit

Everything to type into Play Console. Files are in `android/store/` and `img/screenshots/`.

**Honest timeline:** about 3 weeks.
- 1–3 days: account and ID check.
- 14 days: closed test with 12 testers. Google requires this for new personal accounts before an app can go public.
- A few days: review.

## Before you start (once)

1. **Email:** make a free one just for the app (e.g. a new Gmail). Play shows it publicly.
2. **Signing password:** github.com/novashiv11/novas-pack/settings/secrets/actions/new
   - Name: `ANDROID_KEYSTORE_PASSWORD`
   - Secret: a password you make up, 12+ characters. Save it.
   - Then tell Claude, who builds `novas-pack.aab` (the file Play needs).
3. **Verification repo:** github.com/new?name=novashiv11.github.io&visibility=public → **Create repository**. Tell Claude.
4. **Privacy page:** send Claude your full name, plus the app email if you're happy to show it, for `privacy.html`.

## Play Console steps

1. play.google.com/console/signup → **Personal** → pay $25 → verify ID and phone.
2. **Create app**:
   - App name: `Nova's Pack: Level up together`
   - Language: English (Ireland) or (UK)
   - App or game: App
   - Free
   - Tick the declarations.
3. **Test and release → Closed testing → Create track.**
   - Upload `novas-pack.aab` (from github.com/novashiv11/novas-pack/releases/tag/android).
   - Accept **Play App Signing**.
4. **Testers:** add an email list of 12+ people → copy the **opt-in link** → send it to them. Ask on Instagram for "12 founding testers". They must stay opted in for **14 days**.
5. **App integrity → App signing:** copy the **SHA-256** of the *app signing key* → send it to Claude, who adds it to the verification file so the app opens without a browser bar.
6. Fill in the store listing and the "App content" answers below.
7. After 14 days: **Apply for production** → answer Google's questions about your test → publish.

## Store listing

**App name (30):** Nova's Pack: Level up together

**Short description (80):** Train, walk and explore with your dog. Skills level up, and you grow too.

**Full description:**

> Grow with your dog, 1% a day.
>
> Nova's Pack turns real life with your dog into a game you play outside, not on your phone. Five-minute training sessions level up your dog's skills, from "getting the idea" at home to "nailed it" in the park. Walks and new experiences fill an Adventure Book. And you grow too: short lessons move you up the trainer ranks.
>
> WHAT YOU CAN DO
> • Pick your dog as your partner: level, life stage and 5 stats (Focus, Recall, Lead manners, Calm, Confidence)
> • Train 11 reward-based skills, each with 5 levels at harder places (home, garden, street, park)
> • Earn badges for real milestones, never for taps or likes
> • Collect about 30 Adventure Book stamps: first beach, first rain walk, first calm café visit…
> • "1% today": one small step for your dog and one for you, plus a daily line from Nova
> • A private Growth Journal
> • Trainer ranks from short lessons on how dogs learn (learning milestones, not a qualification)
> • A small Health tab: vaccines, flea and worm treatments, medicines, weight, food, treats and a poop log, with calendar reminders and "call your vet" prompts
> • Share your partner card
>
> PRIVATE BY DESIGN
> No account, no ads, no tracking. Everything stays on your phone. Export a backup any time.
>
> NOT A VET
> The app is a diary and a coach. It never diagnoses or suggests doses. If you're worried about your pet, call your vet.
>
> Hosted by Nova, a young German Shepherd and professional human handler (@novathehumanhandler on Instagram). Everyone's welcome in the pack.

**Category:** Lifestyle · **Tags:** Pets, Education

**Graphics:**
- App icon (512×512): `android/store_icon.png`
- Feature graphic (1024×500): `android/store/feature-graphic.png`
- Phone screenshots (1080×1920): `img/screenshots/today-narrow.png` and `img/screenshots/health-narrow.png`. Add 2–4 more of your own real Nova from your phone once you've used the app for a week.

**Contact:** the app email · **Website:** https://novashiv11.github.io/novas-pack/ · **Privacy policy:** https://novashiv11.github.io/novas-pack/privacy.html

## App content answers

| Question | Answer |
|---|---|
| Privacy policy | https://novashiv11.github.io/novas-pack/privacy.html |
| Ads | No ads |
| App access | All functionality available without special access (no login) |
| Content rating | Fill in the questionnaire: category "Reference, news or educational" or "Other"; answer No to violence, sex, drugs, gambling and user-generated content. Expect "Everyone" / PEGI 3. |
| Target audience | 16–17 and 18+ (not children; this avoids the Families policy and matches our 16+ rule) |
| News app | No |
| Data safety | **No data collected, no data shared.** Everything is stored on the device; nothing is sent to us. Data is not encrypted in transit because none is sent; deletion is in the app (More → Delete all data). |
| Health apps declaration | No human health features (it's a pet diary) |
| Government, financial, COVID | No |

Rules we keep in the listing: no user counts, no "certified", no health promises, no game brands (see `docs/launch-app.md`).
