# v8: "feel" pass

Shiv (15 Oct): "Yaar, app mein feel nahi aa raha. Research modern GUI and functionality, and improve it."

## What was wrong (screenshots at 390 px, before)
- **It looked like a web page, not an app.** The beige background, 2 px outlines on every card and the Duolingo "ledge" on everything made it flat and boxy.
- **The pet was not the hero.** Home opened with a small Nova bubble and the word "Today". Your own pet was a 32 px chip in the corner.
- **No colour language.** Meals, walks, play and training all looked the same.
- **Screens swapped with no motion,** while a native app slides deeper screens in and out.
- **The log toast was big and wrapped to two lines** ("Logged. I supervised." + Undo + Add details), and it followed you to other tabs.

## Research (short)
- **Finch (self-care pet, App Store Editors' Choice):**
  - The companion is the centre of the home screen.
  - Completing real-life goals visibly fills the pet's energy, so progress feels tangible.
  - The tone is gentle, with no red failure states.
  - Onboarding starts with the pet, not a feature list.

  Sources: [Android Authority review](https://cellphoneplans.androidauthority.com/CellPhones/Guides/finch-self-care-app-review), [Foxdata on Editors' Choice](https://foxdata.com/en/blogs/finch-as-app-store-editors-choice-a-self-care-companion/), [Screenwise](https://screenwiseapp.com/media/finch-app).
- **2026 UI trends:**
  - Card-based layouts.
  - Micro-interactions that give emotional feedback, but not too many.
  - Translucent blurred bars, as in recent iOS.
  - Contrast as a baseline.

  Sources: [Musemind](https://musemind.agency/blog/ui-design-trends), [Tinyfrog](https://tinyfrog.com/web-design-trends).
- **Native feel in a PWA:**
  - The View Transitions API, with transitions only where they carry meaning (forward/back slide, tab fade).
  - An in-app back on every screen; the OS Back closes sheets first (we already do this).

  Sources: [PWABuilder blog](https://blog.pwabuilder.com/posts/mimic-native-transitions-in-your-progressive-web-app/), [Frontend Masters PWAs](https://frontendmasters.com/courses/pwas-v2/additional-ui-techniques).

## Spec (one paragraph)
**For** everyone who opens the app once or twice a day to care for their pet. **What they do:** they open the app and see *their* pet, big, in a sky that matches the time of day, with a ring that fills as the day's care gets done. Then they tap colourful rows to log. **What they get:** an app that feels alive and personal. Moving around feels native (slides, a glass bar), and feedback is small and quick. **Why they come back:** the pet's ring and mood, the week dots and Nova's line change with what they did. Real care moves the picture, not taps for their own sake.

## What shipped (v8.1)
- **Pet stage on Today:**
  - The photo (or icon) in a progress ring, which slides as rows get done and turns gold when the day is done.
  - A mood badge (👋 → 😊 → 🥰, 😴 at night).
  - The name as the page title, Nova's line, and the week dots.
  - A sky by the time of day: morning, day, evening, and night with a moon and stars, each in light and dark.
  - No photo yet: a 📷 button on the picture opens the pet editor.
- **Colour per kind of care,** the same on Today's rows, the "+" sheet and Health's quick tiles:
  - meals orange, walk green, play pink, training blue, poop brown, eggs amber, medicine red, your own items purple.
  - Gold stays for rewards (XP pops, the full ring, week dots).
- **Soft depth:**
  - Cards lost their 2 px outlines and ledges, and got soft shadows (`--elev`) and hairlines (`--hair`).
  - Buttons keep their 3 px ledge (brand rule).
- **Glass bars:** the top bar and tab bar are translucent with blur. The active tab's pill springs in.
- **Screen transitions:** tabs cross-fade up, deeper screens slide in from the right, and Back slides them out. There's no motion with reduced-motion or in browsers without View Transitions.
- **Toast:**
  - One compact line, "🍽️ Meal logged." with Undo and Details.
  - It clears when you change screen, unless it appeared in the last 1.5 s.

Files: `css/v8-feel.css` (new, loaded last), `js/views/today.js`, `js/app.js`, `js/util.js`, `js/forms.js`, plus the shadow and border swap in `app.css` and `css/v7-*.css`.

## QA (15 Oct)
An independent agent found 0 Critical and 2 Major issues, both fixed:
- Taps were dropped for about 0.35 s during a screen slide. `::view-transition` now passes taps through.
- The week label in the hero was too faint at night in light mode. It now uses the hero's text colour.

Minor issues, also fixed:
- The v7 navy pulse on the Next row was replaced by a soft colour pulse.
- The glass bars are now 92% opaque, so text no longer shows through.
- The camera button's icon is bigger and visible in dark mode.
- Slides follow depth: a deeper screen slides forward; switching to another screen fades.
- Toast labels start with a capital letter, and focus goes to the page title after Undo.

## v8.3 (15 Oct): the same feel on Train, Health and More
- **Nova's line on every screen** is now one compact pill: a small face and a tinted bubble, with no outline or tail.
- **Segmented controls** (Skills / Adventures / Academy, and the Health sections) are a light track with a raised pill, iOS style, instead of a dark block.
- **Today's quest** is a featured card: a soft blue sky, with the skill's picture in a circle.
- **More's profile header** has the same sky as Today, and the four stat tiles are tinted (orange, blue, green, purple).
- **The remaining outlined containers** are soft cards (an audit script found 20 of them). Folds keep a hairline. The trainer rank and practice-week cards use a gold tint. The "Don't feed" warning has a red side accent.
- **Checks:** 27 game tests, the persona scripts at 320 light and 390 dark (no errors, no overflow, no small targets) and fast tab taps all pass. This was CSS plus one emoji, so there was no separate QA agent this time.

## v8.4 (15 Oct): juice and the welcome sky
- **Sounds,** made on the phone (Web Audio, no files): a soft two-note tick on every log, and a short four-note tune for real wins (Day complete, Mission complete, badges and level-ups). They're quiet and never play on a timer. More → "Sounds" turns them off (`settings.sound`).
- **Sparks:** a ring of sparks in the row's care colour bursts from a row you just finished. There are none with reduced motion.
- **Welcome:** Nova sits in the same time-of-day sky as Today, with the buttons right under it. The how-it-works cards and the restore fold are soft cards.
- **Checks:** sound off plays nothing (verified), and there are no errors, overflow or small targets on Welcome at 320 and 390, light and dark, morning and night. Game tests and persona scripts pass.

## v8.5 (15 Oct): see and change a row's entries
- **Tap a done row on Today** to open its entries for today, e.g. "🚶 Walk · 08:00". Tap an entry to change it, or press "Log another". This replaces the old "done for today" toast.
- **Long-press any row** (about half a second) to open the same sheet, so you can fix the first meal before logging the second. A long-press never logs anything.
- **Medicines:** a medicine that's done shows what was given, with "Questions about doses go to your vet" and no "Log another" button. That keeps it vet-first and avoids nudging toward a second dose.
