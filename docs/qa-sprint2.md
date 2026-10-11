# QA2 report (Nova's Pack, frozen copy qa2)

Tested at 320 and 390 px, light and dark, reduced motion, cat, dog, sample.
Clean: no console errors, no horizontal overflow on any route, no low-contrast text found by an automated dark-mode scan (page and sheets), the sample never offers "Share this win" (5 wins plus level-up), a closed timer logs nothing, the daily cap is honest ("just for fun" toast), the nudge .ics downloads, the tiles all have Back.

## Critical
None found.

## Major
1. **Care taps count as the 1-minute win.** Where: Home, `showUpDates()` in doitnow.js. Steps: new pet, tap Meal (or tick "For you"). Home flips to "Done for today. Anything else is a bonus." with a week dot and a sticker. Meal taps on 3 days fire "Week won 🏆 3 days of showing up" with zero training. Fix: count only the 1-minute win, training, walks, stamps. Show care days separately.
2. **Cat's first win is Talk buttons.** Where: `#/placement` results to "Do your first 1-minute win". Steps: cat, answer Carrier and Handling, tap the CTA. The sheet says "Record your words on the button" (needs a bought device) and ignores the skills just assessed. Fix: start the weakest assessed skill, or an equipment-free one.
3. **Cat owner meets dog-only content.** Where: `#/adventures`, `#/more/badges`, `#/trainer`, quests. Steps: add a cat, open Adventures. "Let's sniff it", Log a walk, 10/50/100 walks, "First muzzle walk", "Met a calm dog". The weekly quest "1 new adventure" is needed for the +50 bonus. Academy: "How dogs learn". Fix: filter stamps, milestones and quests by species. Species picker has no horse or chicken ("Other" only).
4. **Tap targets under 44 px.** Health (cat): "Brushing", "Teeth brushing", "Dental check", "Weigh-in" title buttons 24 px, "Litter tray deep clean" 40. The SAMPLE banner is 39 px on every screen. Welcome "Pack Card maker" 18 px, "Privacy notice" 40. Fix: min-height 44 px.

## Minor
5. **Share sheet feedback is off-screen.** Steps: Mission, Share this win, Copy caption. "Caption copied" sits at y=814 on an 800 px viewport (320 and 390 wide). Saving gave no visible message. Fix: put the status above the buttons or use a toast.
6. **Mission headline XP.** On the 3rd win it jumps +10 to +38 (the ~30 looks like the quest bonus). Fix: split "+8 XP" and "Quest bonus +30".
7. **Level check.** The results screen keeps a stray top "Skip". System Back from Q2 leaves the quiz and loses answers.
8. **Timer.** The 1-minute mode shows a dead disabled "Keep at it…" button for 60 s. After the daily cap, "Do another minute" still runs a full minute and then says "just for fun". Warn before starting.
9. **Sample card.** "Share card" (Home) and "Share the partner card" (More) still work for the sample. The canvas is labelled "SAMPLE", so it is honest, but it is inconsistent with the no-share rule. Hide them.
10. **Copy.** Nudge text is lower-case ("lunch (13:00)", "after work (18:00)") in the sheet, Home and More.
11. **Back with a sheet open.** Android Back from the nudge sheet went from `#/home` to `#/train`. The sheet has no history entry.
12. **Install banner.** The same long paragraph shows on Welcome and again on Home.
