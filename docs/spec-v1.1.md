# Spec v1.1: pro polish (from 4 specialist reviews, 10 Oct 2026)

Sources: the product and growth, UX design, vet and pet-care, and PWA platform reviews. Rules are unchanged: honest, vet-first (no doses or diagnosis), no dark patterns, data on the device, no accounts or server.

**Two builders work in parallel, each on its own files.** Builder A: platform and safety. Builder B: UX and product. The shared contracts are at the bottom.

---

## Builder A: platform and safety

**Owns:** `sw.js`, `manifest.webmanifest`, `js/db.js`, `js/app.js`, `js/logic.js`, `data/care.js`, `data/skills.js`, plus the new `js/install.js` and `img/screenshots/`.

### P0: safety (vet review)

1. **Health alerts engine:** `export function healthAlerts(pet, now)` in `logic.js` returns `[{ level: "emergency"|"today"|"watch", reason, advice }]`, merging the poop alerts with the new symptom rules below. It keeps the existing `poopAlerts` working (it can call it internally) and de-duplicates.
2. **New event type `symptom`:** `{ type: "symptom", at, symptoms: [ids] }`. The ids are listed under "Shared contracts". Rules (conservative, "call your vet" wording, no diagnosis):
   - **Rabbit:** `not-eating` or `no-droppings` logged and unresolved for 12 h or more → **emergency** (gut stasis risk). `maggots` (any species, rabbits especially) → **emergency**: "Call an emergency vet now. Do not wait or treat at home."
   - **Cat:** `not-eating` for 24 h or more → **today** ("sooner for kittens, seniors or overweight cats"). A male cat with `straining-urine` → **emergency**.
   - **Any species:** `breathing` → **emergency**. `bloat` (swollen hard belly, retching with nothing coming up) → **emergency**, "no home remedy". `vomiting` logged twice or more in 24 h → **today**. `toxin` → **emergency** with: "Call your vet or an animal poison line now. Do not make your pet sick unless a vet tells you to. Keep the packaging."
   - **Senior and vulnerable:** dogs and cats aged 8 or over (from `pet.birthday`), or with `pet.conditions` non-empty, get the "sooner" thresholds the under-6-months rule already uses.
3. **care.js fixes:**
   - Relabel the poop scale "Nova's simplified scale (based on vet faecal charts)". Score 2: "Firm and segmented, easy to pick up. Also healthy."
   - Add a rabbit hint: "Soft, sticky, grape-like clusters (caecotropes) are normal, and rabbits eat them. Worry about runny, shapeless poop."
   - Add `RED_FLAGS` entries for every new rule.
   - Add `export const TOXINS = ["Chocolate", "Grapes and raisins", "Xylitol (sugar-free gum, some peanut butters)", "Lilies (cats: every part, even pollen)", "Onions and garlic", "Human painkillers"]`.
   - Add `export const CARE_TASKS = { dog: [...], cat: [...], rabbit: [...], other: [...] }` of `{ name, everyWeeks, what }`, e.g. nail trim, grooming/brushing, dental check, teeth brushing, rabbit teeth check, hutch deep clean. These are suggestions only.
4. **`markRecordDone`:** when the record was overdue, or is a puppy or kitten course, return a flag so the UI can say: "Late, or part of a puppy/kitten course? Ask your vet whether to restart the course."
5. **skills.js:** add 3 skills: `toilet-training` (puppy), `alone-time` (dog, with "check with your vet first if they're distressed"), `cat-handling` (cat cooperative care and nail trims). Same contract.

### P0: one-click install (platform review)

6. **`js/install.js`** exports:
   - `installCard()`, which returns an element or null:
     - Android/Chromium uses the captured `beforeinstallprompt` (one tap).
     - iOS Safari opens a 2-step sheet: Share → "Add to Home Screen", with an arrow and a note that iOS 26 opens it as an app.
     - Hidden when standalone. "Not now" snoozes 14 days.
   - `inAppBanner()`, which returns an element or null for the Instagram, Facebook, TikTok and other in-app browsers:
     - Android: an "Open in Chrome" `intent://` link.
     - iOS: "Copy link" plus "Open it in Safari".
     - TikTok: "⋯ → Open in browser".
   - Copy: "Install first: the in-app browser can't keep your diary."
   - `isStandalone()`.
   - Make the `beforeinstallprompt` handler re-render the current view.
7. **Manifest:**
   - `"id": "/novas-pack/"`, `"prefer_related_applications": false`, `"categories": ["lifestyle","health","utilities"]`
   - `shortcuts`: Log poop → `./#/quick/poop`, Log meal → `./#/quick/meal`, Log medicine → `./#/quick/med`, with icons
   - 2 narrow screenshots (1080×1920 PNG, made with Playwright from the sample diary) and 1 wide one (1280×720), all with labels
8. **Service worker update flow:**
   - No `skipWaiting` on install. Show an "Update ready" toast with a button that posts `SKIP_WAITING`, then reload on `controllerchange` (the UI hook goes in app.js).
   - If any precache `cache.add` fails, fail the install, so the cache is never half-filled.
   - Bump VERSION.
9. **Storage:**
   - Call `navigator.storage.persist()` on DB open, on `appinstalled`, and on standalone launch.
   - In `db.js`, reset `dbp = null` on open failure and on `versionchange`.
   - Detect `QuotaExceededError` and expose a friendly message ("Phone storage is full. Try a smaller photo or free some space.").
   - Change the backup nudge from monthly to every 14 days.
10. **Route `#/quick/<type>`:** opens Today and the quick-log action for that type (Builder B renders it via the shared hook `openQuickLog(type)`).

---

## Builder B: UX and product

**Owns:** `js/views/*.js`, `js/forms.js`, `app.css`, `index.html`, `js/sample.js`, `js/state.js`, `js/util.js` (additions only).

### P0: activation and clarity

1. **Today order:** pet switcher (only shown at 2+ pets) → **Quick log** grid (each tile shows a 12 px "7 h ago" caption) → health alerts (`alertCard(healthAlerts(pet))`) → Due (max 2 cards, then a "N more due" link to Health) → today's timeline. Add a state-aware Nova line under the title:
   - nothing due: "Nothing due. I checked twice."
   - overdue: "Something's late. I'm not judging. Much."
2. **One-tap logs:**
   - Poop, meal, treat, walk and training log instantly with sensible defaults (poop = "typical"; meal = the current food).
   - A toast says "Logged. I supervised." with **Undo** and **Add details**.
   - Medicine opens its sheet only if there's more than one active medicine.
   - "Same as last time" chips in the meal and treat sheets.
3. **New Quick log tile:** "😟 Unwell" opens a checklist sheet of the symptom ids (labels in plain words; `maggots` only shown for rabbits; `straining-urine` labelled "Straining to pee, little or nothing coming out"). It saves a `symptom` event, then shows the alert card at once if any rule fires.
4. **First run:** only name and species are required; "Add details later" collapses the rest. Copy: "Free. No account to lose." After saving the first pet, Today pulses the Meal tile with "Log {name}'s last meal. One tap." After the first log: "Nice. Add vaccines next?" with a link to Health.
5. **Sample mode:** replace the 155 px banner with a sticky 40 px strip: "SAMPLE · Add your own pet →". Delete sample moves to More.
6. **App bar and sub-pages:**
   - Remove the duplicate Nova faces and the "SAMPLE" label shown twice, and drop the pet-name subtitle under each H1.
   - Sub-pages (poop log, skill, records) get a sticky 52 px bar: a 44×44 back chevron and a centred title.
7. **Cards:** one primary button per card ("Mark done"). Edit, Add to calendar and Delete go in a 44 px "⋯" action sheet; tapping the card opens edit.
8. **One segmented control style everywhere:** a 44 px track with `background:var(--line);padding:4px;border-radius:12px`; the selected item is filled `var(--blue)` with 14 px/700 text. Training's count chips become "1 of 12 learned" plus a progress bar.
9. **Skill page:** the clip card shows only if the clip file exists (HEAD request, or the video's `onerror` hides it); otherwise a 56 px "Clip coming soon" note goes below Steps.
10. **Colour and type:**
    - Primary routine buttons use **blue**; gold is only for completion, streaks and rewards.
    - Type scale 12/14/16/18/22/30 px; radii 12 and 16 only.
    - Every tap target is at least 44 px (including More links and pills).
11. **More** becomes settings-style grouped rows (icon, label, chevron): Pets, Profile and contacts, Units, Backup, Install, Privacy, Pack Card, Delete all.
12. **Install surfaces:**
    - Mount `inAppBanner()` at the top of the app shell when present.
    - Mount `installCard()` on Today after the first real log.
    - Keep the More → Install row.
    - Show the "Update ready" toast (A's hook).
13. **Backup:** "Back up now" uses `navigator.share({ files: [json] })` when available (falling back to download). Offer it after the 3rd log and every 14 days (A's timing).
14. **Calendar:** saving a record with a next-due date pre-ticks "Remind me in my calendar". On save, it downloads or shares the .ics. Health gets "Add all due dates to my calendar" (one .ics with several events). Copy: "Your phone reminds you. We never message you."

### P1 (do if time allows, in this order)

15. **Profile and contacts** in the pet form and on the vet summary:
    - vet name and phone, emergency vet phone, insurer, policy number and renewal date
    - microchip number, registry and "details checked on"
    - allergies and conditions (`pet.conditions`, free text)
    - neutered (yes/no and date), last season start (dogs, cats and rabbits)
16. **Recurring care:** Health → "Care routine", built from `CARE_TASKS` (every N weeks, last done → due), feeding into Due.
17. **Signature moments** (respect reduced motion):
    - the quick-log tile bounces (about 140 ms) with `navigator.vibrate?.(10)`
    - the week-close streak dot fills gold with one ring pulse and "Week 3. Acceptable."
    - a 150 ms route cross-fade via `document.startViewTransition` when available
18. **Share loop:** after the first vet summary, or after 7 days of logs, show a one-time card: "Make {name}'s Pack Card" (pre-filled link). The printed vet summary gets a small "Made with Nova's Pack" footer.
19. **Poop history:** time first, a "Type 3" pill, no repeated bold "Poop", and a sticky "Log a poop" button above the tab bar.

### Kill

- The duplicate Pack Card links in More.
- Meal and walk reminders: never build them.

---

## Shared contracts

- **Symptom ids:** `not-eating`, `vomiting`, `lethargy`, `breathing`, `no-droppings`, `maggots`, `bloat`, `toxin`, `straining-urine`, `diarrhoea`.
- **From `logic.js`:** `healthAlerts(pet, now) → [{ level, reason, advice }]`.
- **From `install.js`:** `installCard()`, `inAppBanner()`, `isStandalone()`.
- **From `app.js`:**
  - a global update hook `window.NP_onUpdateReady(fn)` (B calls it to show the toast; `fn(apply)`, where `apply()` triggers the update)
  - the route `#/quick/<type>`, which calls `window.NP_openQuickLog(type)` (B defines it in today.js and assigns it on load)
- **From `care.js`:** `TOXINS`, `CARE_TASKS`.
- **Pet fields:** `birthday`, `conditions`, `vet: { name, phone, emergencyPhone }`, `insurer: { name, policy, renewal }`, `microchip: { number, registry, checkedOn }`, `neutered: { yes, date }`, `lastSeason`.
- Both builders bump nothing else in each other's files. If you truly need a change in the other builder's file, write it at the end of your final report instead.
