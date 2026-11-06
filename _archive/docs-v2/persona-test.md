# 20-user test (11 Oct 2026)

**Method:** 4 agents each played 5 different people (20 in total), simulating 3 to 30 days of real use on a frozen copy of the app with the shared test kit (Playwright, phone browsers, light and dark mode, slow network, offline, screen-reader checks). Model: Sonnet, about 30 tool calls each.

**Overall:**
- 1 Critical, now fixed: a false "no poop for 48 hours" alert that fired when someone simply stopped logging.
- About 25 Major issues: most are fixed (decision 48 and the commits after it), and the rest are in `docs/crq.md`.
- No privacy leaks (zero external requests), zero WCAG contrast failures, offline works, and the tone is kind.

## Pros people saw
- **Fast logging:** one-tap logs with Undo.
- **Honest caps:** "only 3 count today".
- **Calm, no-guilt tone:** "Welcome back. Today counts."
- **Privacy that holds up under inspection:** no cookies, no third parties, EXIF removed, and delete really deletes.
- **Accessibility:** real dialogs, focus handling and a skip link; nothing relies on colour alone.
- **Health safety:** good gut-stasis rules for rabbits, conservative "call your vet" wording, and no doses anywhere.
- **Offline:** a full week offline with no data lost.

## Cons and what we changed

| Problem | Who hit it | Status |
|---|---|---|
| False "no poop 48 h" alert after a logging gap | Aoife | **Fixed** |
| Sessions finishable at 0 seconds; levels in 2 minutes; Coach in 2 weeks | Dana, Jake, Hana | **Fixed**: Finish after 1 minute, a level needs 2 different days, Coach 2,500 and Mentor 6,000, stamp XP capped at 2 a day |
| Daily and weekly quests chose different skills; no badges by day 30 | Hana | **Fixed**: one weekly focus skill, with swap and "not for us" |
| Puppy got Recall first; toilet training shown to adult dogs | Aoife, Hana | **Fixed**: puppy-first quests; toilet training for puppies only |
| Medicines buried; extra doses possible; no reminder on Home | Margaret, Lena | **Fixed**: "Due today" on Home for all pets, with an extra-dose guard |
| Unwell list missing emergencies; few toxins | Oliver | **Fixed**: 7 new signs, species-aware toxins |
| Crisis help only for Ireland | Grace, Sofia | **Fixed**: 116 123, 988, findahelpline.com, also linked from the Journal |
| Backup nudge hidden behind the install card | Kofi | **Fixed** |
| Quick log far down Home; no walks quest | Marcus | **Fixed** |
| Reactive dogs pushed to "meet a dog" | Mia | **Partly fixed**: optional and skip wording, "not for us". A full reactive path is CRQ-014 |
| Cats and hens get dog wording; Walk tile for every species | Lena, Tom, Chen | **Partly fixed**: Walk tile only for dogs, neutral journal copy. More is in CRQ-009 and CRQ-010 |
| Foster pets: deleting one loses the human's XP | Fatima | CRQ-007 (archive) |
| Slow first load on 3G (14 s) | Tom | CRQ-017 |
| Share card lacks caption, hashtags and Story size | Leo | CRQ-011 |
| No path for people without a dog | Priya | CRQ-024 |

## Scores (would keep using, 1–5)

| Person | Score |
|---|---|
| Aoife | 3 |
| Marcus | 3 |
| Priya | 2 |
| Jake | 2 |
| Sofia | 4 |
| Margaret | 2 |
| Tom | 3 |
| Lena | 3 |
| Chen | 3 |
| Fatima | 3 |
| Ravi | 4 |
| Ellen | 4 |
| Noah | 4 |
| Grace | 4 |
| Kofi | 4 |
| Dana | 3 |
| Leo | 3 |
| Mia | 3 |
| Oliver | 3.5 |
| Hana | 4 |

The average was about 3.2 before the fixes. The biggest gaps were game integrity (now fixed), "care first" people who want the diary without the game (CRQ-008), and non-dog pets.
