# Nova's Pack

**Nova's Pack: the pet care diary.** A free, private app (installable from the website) to track vaccines, medicines, poop, food, treats, weight and training, hosted by Nova. Everyone's welcome in the pack: for everyone who loves animals: first-time and experienced owners; dogs, cats, hens, rabbits, horses and more; rescuers and fosters; and people with no pet yet. Hosted by Nova, a young German Shepherd and professional human handler ([@novathehumanhandler](https://www.instagram.com/novathehumanhandler/)). Worldwide, online.

Live site (once GitHub Pages is on): https://novashiv11.github.io/novas-pack/

## What's here

| Path | What it is |
|---|---|
| `index.html`, `app.css`, `js/`, `data/` | The pet care diary app (PWA, data on the device). |
| `clips/` | Training clips: add `<skill-id>.mp4` (e.g. `recall.mp4`) and they appear in the app. |
| `privacy.html` | Full privacy notice. |
| `site.css`, `site.js` | Shared styles; `site.js` holds the Discord invite link (the only setting), the challenge rotation and the streak logic. |
| `img/` | Nova's photos in use, the share image (`og-image.jpg`), the Nova illustration and the QR code (`brand/`). |
| `fonts/` | Self-hosted Bricolage Grotesque and Plus Jakarta Sans (SIL Open Font License). |
| `favicon.svg`, `favicon.ico`, `apple-touch-icon.png` | Site icons. |
| `card.html`, `card.js` | Pack Card maker (runs on the visitor's device). |
| `docs/global-plan.md` | **The plan**: where, how, when, how much; Discord setup; launch content. |
| `docs/build-prompt-v2.md` | Build prompt for the site. |
| `docs/decisions.md` | Decision log and open items for Shiv. |
| `_archive/` | Old prototype, old Limerick-era docs, unused photos. Never published. |
| `_config.yml` | Tells GitHub Pages to publish only the site, not the docs. |

## Turn the site on (GitHub Pages)

1. In this repo, tap **Settings** (on a phone: the **⋯** menu, then **Settings**).
2. In the left menu, tap **Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Under **Branch**, choose **main** and **/ (root)**, then tap **Save**.
5. Wait 1–2 minutes and open https://novashiv11.github.io/novas-pack/

## Flip a "Coming soon" label to "Open now"

In `index.html`, find the item, change `data-status="soon"` to `data-status="live"` and the text "Coming soon" to "Open now". Commit to `main`; the site updates in about a minute.

## Add the Discord join button

Open `site.js`, paste your Discord invite link between the quotes on the `COMMUNITY_URL` line (e.g. `https://discord.gg/abc123`), and commit. The "Join the pack chat" buttons appear and the chat flips to "Open now".
