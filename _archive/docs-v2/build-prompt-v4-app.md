# Build prompt v4: the Nova's Pack pet care app

**10 Oct 2026.** Shiv's direction (translated): "Nobody joins a pack on Instagram for nothing. Build an app a pet owner actually needs: when vaccines are due, when to give medicine, how the last poop was and when, what they fed, which kibble and treats are in use, what training they're doing and what skills it needs, with short GIF tutorials I can add. Not 'join my pack'."

This file has three parts: **A** the first draft, **B** the review of that draft, **C** the final prompt the agents work from.

---

## A. Draft (v0)

> Build a mobile app for pet owners to track vaccines, medicines, poop, food, treats and training, with training tutorials (GIFs) by Nova. Make it addictive and free. Put it on the website.

## B. Review of the draft (what was missing or risky, and the fix)

| # | Problem with v0 | Fix in the final prompt |
|---|---|---|
| 1 | "App" is undefined. A native app needs the App Store, Play Store, fees and review. Shiv has about 5 h/week. | An **installable web app (PWA)** on the existing GitHub Pages site: it works on any phone and offline, has an "Add to Home Screen" icon, costs €0 and needs no store. |
| 2 | No backend, so where does data live? Accounts add GDPR weight and cost. | **On the device** (IndexedDB), with no account. **Backup/restore** is a JSON file and there's a "delete everything" button. Sync comes later, only if people ask. |
| 3 | Safari deletes site data after 7 days of no use unless the site is installed. Silent data loss would kill trust. | Ask for `navigator.storage.persist()`, nudge people to **install** (Add to Home Screen) and **back up** (a monthly reminder in the app), and explain why in one line. |
| 4 | "Reminders": web push can't fire on a schedule without a server, and iOS only allows it for installed apps. | Show reminders **in the app** (Today: due and overdue) and offer **"Add to calendar"** (an .ics file with an alarm) for vaccines, preventives and medicines. That works on every phone. No server push in v1. |
| 5 | Health is risky: no dosing advice or diagnosis, and owners may rely on the app. | **Vet first, always.** Medicine doses are typed exactly as the vet wrote them, and the app never suggests a dose. The poop log flags red signs (blood, black/tarry, runny for more than 24 h, no poop for more than 48 h, plus vomiting or lethargy) with "Call your vet". Vaccine names are *suggestions* only, with "your vet decides your pet's schedule". |
| 6 | Species: kibble and training are dog-heavy, but the brand is "everyone's welcome". | Species-aware: **dog and cat fully supported**; rabbits, birds and other animals get the generic trackers (health, food, poop, weight). Training is dog-first, with "more species coming". |
| 7 | "Addictive" could mean dark patterns, which break Shiv's rule 4 and incoming EU rules. | Habit-forming through usefulness: a **1-tap quick log**, "last poop 4 h ago", a due-soon list, **training progress** (practising → got it), weekly training streaks with grace weeks. No guilt notifications, fake counts or points for likes. |
| 8 | Content: training steps and vaccine facts must be correct and sourced. | A separate **content agent** researches and writes the skill library and care reference with citations, reward-based methods only, and a "when to see a professional" note on every skill. |
| 9 | GIF tutorials don't exist yet. | Each skill has a `clip` slot (`clips/<id>.mp4` or `.gif`). If the file is missing, show Nova's illustration and "Clip coming soon". Shiv just drops files into `/clips`. |
| 10 | Where does the community or the Pack Card fit? | Secondary. The **app is the product**; the Pack Card becomes a fun share from a pet's profile, and community links sit under More. |
| 11 | Scope creep could make it big and broken. | A fixed **MVP list** and a "not now" list (below). |
| 12 | No definition of done. | QA at 320/375/390 px in light and dark, offline test, a backup round-trip, data surviving a reload, WCAG AA, no console errors, no third-party requests. |

## C. Final prompt (v1), used by the agents

> **You're building "Nova's Pack: the pet care diary"**, a free, private, installable web app that keeps a pet owner's whole routine in one place, hosted by Nova (a young German Shepherd, @novathehumanhandler; persona "professional human handler"; warm, witty, adult voice, no baby talk). Site: static GitHub Pages at `https://novashiv11.github.io/novas-pack/`. No backend, no accounts, no build step: vanilla HTML, CSS and JS (ES modules are fine). Keep the code readable for a solo founder.
>
> **Who it's for:** anyone with a pet (dog and cat first-class; other species get the generic trackers), plus people preparing for a first pet. **What they do:** log in one tap (poop, meal, treat, medicine given, walk, training) and keep vaccines, preventives, medicines, food, weight and vet notes. **What they get:** "what's due", "when did they last…", a clean summary to show the vet, and step-by-step training with Nova's clips. **Why they come back:** the daily quick log and the due list are genuinely needed. Training progress and weekly streaks (with grace weeks) add pull without guilt.
>
> **MVP features:**
> 1. **First run:** Nova welcomes them ("Your pet's whole routine, in one place. Private on your phone.") → **Add your pet**:
>    - name and species (Dog/Cat/Rabbit/Bird/Other)
>    - optional: birthday, photo (resized on the device to at most 512 px, re-encoded so location data is stripped), weight
>    - a "No pet yet? Explore with Nova's sample data", which is clearly labelled SAMPLE and deletable
>    - then **Today**.
> 2. **Bottom nav:** Today · Health · Food · Training · More. A pet switcher (avatars) at the top for multi-pet households.
> 3. **Today:**
>    - **Due and overdue** cards for vaccines, preventives and medicines (mark done → log it)
>    - a **quick-log grid** (💩 Poop, 🍽️ Meal, 🦴 Treat, 💊 Medicine, 🚶 Walk, 🎓 Training)
>    - "Last poop: 4 h ago · last meal: 7:30"
>    - today's timeline with undo
> 4. **Poop log:**
>    - time (now or edit), consistency on a simple 5-step scale with emoji (from the content file), optional flags (blood, mucus, black/tarry, worms, unusual colour), note
>    - a history list with a 7-day strip
>    - red-flag combinations show a calm **"Call your vet"** card with the reason; never a diagnosis
> 5. **Health:**
>    - **Vaccines and preventives:** name (suggestions per species from the content file, or free text), date given, next due; **Add to calendar** (.ics, alarm 1 day before); history.
>    - **Medicines:** name, dose *as written by your vet* (free text, never suggested), how often (once or twice daily, weekly, monthly, custom), start/end, "mark given" (logs it), due on Today.
>    - **Weight:** log plus a small SVG line chart, in kg or lb.
>    - **Vet visits:** date, clinic (optional), notes.
>    - **Vet summary:** a printable page (pet details, current food and medicines, the last 5 vaccines, weight trend, poop flags in the last 14 days).
> 6. **Food:**
>    - **current food** (brand, product, amount per day, since date) and **food change history**
>    - **treats in use** (list, with an "in use / stopped" toggle)
>    - meal and treat log, plus "allergies / don't feed" notes
> 7. **Training** (dog-first; cats get "coming soon" plus the content's cat basics if provided):
>    - a **skill library** from the content file
>    - each skill has a clip (`clips/<id>.mp4` or `.gif`, otherwise Nova's illustration and "Clip coming soon"), why it matters, steps, the common mistake, and **when to see a professional**
>    - progress per pet: Not started → Practising → Got it
>    - **"Log practice"** (counts towards a weekly training streak, with 1 grace week per 4)
> 8. **More:**
>    - pets (add/edit/delete), units (kg/lb)
>    - **Backup:** export JSON and import JSON (validated, merge or replace)
>    - **Delete all data**
>    - **Install app** help (iOS: Share → Add to Home Screen; Android: menu → Install)
>    - privacy, "Make a Pack Card" (the existing `card.html`, pre-filled from the pet), follow Nova on Instagram
> 9. **PWA:**
>    - `manifest.webmanifest` (name "Nova's Pack", start_url `./`, display standalone, theme colours, 192/512 icons from the Nova head SVG)
>    - `sw.js` caching all static assets for offline (cache-busting version constant)
>    - `navigator.storage.persist()`, plus a gentle monthly "Back up?" card
> 10. **Data:**
>    - IndexedDB (`novas-pack` database) with stores `pets`, `events` (poop/meal/treat/med/walk/training/weight/vet with `petId` and `at`), `records` (vaccine/preventive), `meds`, `foods`, `settings`
>    - one small module wraps it
>    - schema `version` for migrations; export includes `{app:"novas-pack", schema:1, exportedAt, data}`
>
> **Content contract** (written by the content agent; the app imports it):
> - `data/skills.js` → `export const SKILLS = [{ id, title, species: ["dog"], level: "Foundation"|"Next steps"|"Fun", minutes, why, steps: [string], mistake, pro, clip: "clips/<id>.mp4" }]`
> - `data/care.js` →
>   - `export const VACCINES = { dog: [{ name, what }], cat: [...], rabbit: [...], other: [] }`
>   - `export const PREVENTIVES = { dog: [{ name, what }], cat: [...], rabbit: [...], other: [...] }`
>   - `export const POOP_SCALE = [{ score: 1..5, emoji, label, hint }]`
>   - `export const POOP_FLAGS = [{ id, label }]`
>   - `export const RED_FLAGS = [{ when: string, advice: string }]`
>   - `export const VET_FIRST = string`
>   - `export const SOURCES = [{ title, url }]`
>
> **Never:** dosing advice, diagnosis, invented statistics, fake users or reviews, guilt notifications, points for likes, third-party scripts, analytics, trackers or cookies, uploading photos or data anywhere.
>
> **Design:**
> - Brand tokens and components from `site.css`: Shannon blue #1F4E6E, oat #F3F2EB, ink #1E1B17, tan #C27A3A/#8E5019, gold #F2B544 for rewards only; dark #14120F/#8EC1E0; Bricolage Grotesque + Plus Jakarta Sans, self-hosted; cards 16 px, buttons 12 px with a 3 px ledge.
> - App-like and mobile-first: a big tap area for every quick log, bottom nav at least 56 px tall, safe-area insets.
> - Short labels with emoji paired with text, so it's visual rather than wordy.
> - Light and dark mode; calm motion that respects reduced motion.
> - WCAG 2.2 AA: real buttons and labels, visible focus, and **no emoji-only labels**.
>
> **Done when:**
> - Works offline after the first load, and data survives a reload.
> - The export → delete all → import round-trip restores everything.
> - .ics files open in calendars.
> - No console errors; no horizontal overflow at 320/375/390 in light and dark.
> - An independent QA pass finds no Critical or Major issues.
> - `privacy.html` explains the on-device storage, backup and delete.
>
> **Not now:** accounts and sync, server push notifications, community and chat inside the app, AI features, a native store app, paid tiers.
