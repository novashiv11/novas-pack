# Spec 01: Welcome page (`index.html`)

**Status:** v2, 9 Oct 2026 · Phase 1, task 1 · reviewed by 5 independent reviewers

## One-paragraph spec

**Who it's for:** anyone who taps the link in Nova's Instagram bio, a flyer QR code or a shared post. Mostly Limerick dog owners at first, but just as much the cat, hen, rabbit and horse people, rescuers, fosters and people with no pet yet. **What they do:** in under a minute they see Nova, read that they're welcome, see honestly what is open now and what is coming soon, and join by following @novathehumanhandler and DMing "PACK". **What they get:** an invite to the pack chat (WhatsApp Community), weekly Instagram challenges, a fair shot at Shout-out Saturday, kind answers with a vet-first rule, and clear routes for lost or found pets. **Why they come back:** something happens every week (a challenge theme, Saturday shout-outs, and the Pack Walk once the trainer is in place), and the page shows each "coming soon" item turning "open now" as Shiv launches it.

## Facts checked (with sources)

| Fact used on the page | Source |
|---|---|
| Ireland's digital age of consent is 16 (Data Protection Act 2018, s.31). | [Law Reform Commission revised Act, s.31](https://revisedacts.lawreform.ie/eli/2018/act/7/section/31/revised/en/html) |
| German Shepherds are a restricted breed in Ireland. In public they must be muzzled and on a strong lead of no more than 2 m, held by someone over 16 who can control them. | [gov.ie: My legal responsibilities as a dog owner](https://www.gov.ie/en/publication/905aa-my-legal-responsibilities-as-a-dog-owner/) · [Galway County Council](https://www.galway.ie/en/environment/dog-control/restricted-breeds) · [Wexford County Council](https://www.wexfordcoco.ie/environment/animal-control/restricted-dog-breed-information) |
| Limerick Animal Lost & Found is a volunteer Facebook page (since Oct 2012, linked to Limerick Animal Welfare) at facebook.com/LimerickLostandFound. | [I Love Limerick listing](https://www.ilovelimerick.ie/limerick-animal-lost-found/) |
| ISPCA runs an online lost-and-found register and advises not to mention a reward on posters. | [ISPCA Lost and Found Info](https://ispca.ie/lost-and-found-info) |
| Ireland has four authorised dog microchip databases (Animark, Fido, Irish Kennel Club, Irish Coursing Club/MicroDog), all linked to Europetnet, which can look up any chip number. | [Agriland: four private companies run dog microchip databases](https://www.agriland.ie/farming-news/four-private-companies-running-dog-microchip-databases-minister/) · [Dogs Trust Ireland microchipping Q&A](https://www.dogstrust.ie/dog-advice/health-wellbeing/vet-care/microchipping) · [Irish Examiner Q&A](https://www.irishexaminer.com/farming/arid-20390311.html) |
| GitHub Pages logs visitors' IP addresses for security. | [GitHub Docs: What is GitHub Pages? (Data collection)](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) |
| In a WhatsApp Community, members' numbers can be hidden in the announcement group, but admins' numbers stay visible, and numbers can show in groups you join. | [WABetaInfo](https://wabetainfo.com/whatsapp-is-rolling-out-a-phone-number-privacy-feature-for-communities/) · [MyBroadband](https://mybroadband.co.za/news/software/499675-whatsapp-communities-get-phone-number-privacy-feature.html) |
| Loading Google Fonts from Google's servers sends visitors' IPs to Google (LG München, 20 Jan 2022, 3 O 17493/20), so we self-host the font files. | [activeMind.legal summary of the ruling](https://www.activemind.legal/guides/ruling-google-fonts/) |
| Open Graph images work best at 1200 × 630 (1.91:1), with an absolute https URL; crawlers don't resolve relative paths. | [Front-End Checklist: og:image size](https://frontendchecklist.io/rules/seo/og-image-size) · [Front-End Checklist: OG tags](https://frontendchecklist.io/rules/seo/og-tags) |

**Not verifiable from here:** the build container can't open facebook.com, ispca.ie or instagram.com directly, so those links were checked by web search, not by loading them. Shiv: tap each link on the live page once.

## What's live vs coming soon (on the page)

| Item | Label | Flips to "Open now" when |
|---|---|---|
| Pack chat (WhatsApp Community, 18+) | Open now | Must exist **before** the page is shared |
| Photo challenges | Open now | already live (Instagram or chat) |
| Shout-out Saturday | Open now | first Saturday after the first members join |
| Pack Walk | Coming soon | a trainer is signed up and the first date is set |
| Learn with Nova | Coming soon | the first trainer-checked clip is posted |
| Vouched Limerick map | Coming soon | 10+ places, each vouched by a named member who agreed to be named |

To flip a label, find `data-status="soon"` on that item in `index.html`, change it to `data-status="live"`, and change the text to "Open now".

## Review round 1 (9 Oct 2026): what was found and fixed

Five independent reviewers (QA and accessibility, brand, community safety, legal and privacy, growth). No Critical issues in the code. Criticals and Majors in content, all fixed in v2:

| Finding | Fix |
|---|---|
| Outdoor photos show Nova unmuzzled in public, right beside the law the page quotes (all 5 reviewers) | Indoor photos only; outdoor shots archived until muzzled versions exist; share image remade |
| Shout-out panel spilled out of its box at 320 px / 200% zoom (WCAG 1.4.4, 1.4.12) | Responsive grid |
| Join button below the first screen in Instagram's in-app browser; page about 13 screens long | Text-first hero (button at about 490 px on a 375×553 screen); duplicate sections merged; walk rules folded away |
| Only one join route, and it needs Instagram | "No Instagram? Join on WhatsApp" button (shows once the invite link is set in `site.js`) |
| "Everyone gets a turn" and "what Limerick asked for" weren't true | Reworded |
| WhatsApp exposes members' phone numbers to 16–17-year-olds | Shiv's decision: chat and walks 18+ |
| Privacy notice missing Art. 13 items (basis per purpose, third parties, US transfers, retention, all rights) | Full `privacy.html`, short summary on the page |
| Rehoming rule allowed "free to good home" | No rehoming at all, free or paid |
| Map promise clashed with future paid listings | "Nobody can pay to be recommended or to rank higher" |
| Walk rules incomplete (no greetings, flexi leads, licence/chip, responsibility) | Full list in a tap-to-open section |
| Species slips (dog-only map, no birds/reptiles/fish) | Fixed chips and map wording |
