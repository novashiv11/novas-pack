# Nova's Pack

**Nova's Pack: Level up together.** A free, private app (installable from the website) that turns real-life training, walks and adventures with your dog into levels, skills, badges and an Adventure Book, while you grow too: Trainer ranks, short lessons and a "1% better every day" habit. A small Health tab keeps vaccines, medicines, food and poop. Everyone's welcome in the pack. Hosted by Nova, a young German Shepherd and professional human handler ([@novathehumanhandler](https://www.instagram.com/novathehumanhandler/)). Worldwide, online.

Live app: https://novashiv11.github.io/novas-pack/ (open in Chrome or Safari, then install to your home screen).

## What's here

| Path | What it is |
|---|---|
| `index.html`, `app.css`, `js/`, `data/` | The app (PWA, data on the device). Spec: `docs/spec-v2-levelup.md`. |
| `clips/` | Training clips: add `<skill-id>.mp4` (e.g. `recall.mp4`) and they appear in the app. |
| `privacy.html` | Full privacy notice. |
| `site.css`, `site.js` | Shared styles; `site.js` holds the Discord invite link (the only setting), the challenge rotation and the streak logic. |
| `img/` | Nova's photos in use, the share image (`og-image.jpg`), the Nova illustration and the QR code (`brand/`). |
| `fonts/` | Self-hosted Bricolage Grotesque and Plus Jakarta Sans (SIL Open Font License). |
| `favicon.svg`, `favicon.ico`, `apple-touch-icon.png` | Site icons. |
| `card.html`, `card.js` | Pack Card maker (runs on the visitor's device). |
| `docs/global-plan.md` | **The plan**: where, how, when, how much; Discord setup; launch content. |
| `docs/decisions.md` | Decision log and open items for Shiv. |
| `_archive/` | Old prototype, old Limerick-era docs, unused photos. Never published. |
| `_config.yml` | Tells GitHub Pages to publish only the site, not the docs. |

## Turn the site on (GitHub Pages)

1. In this repo, tap **Settings** (on a phone: the **⋯** menu, then **Settings**).
2. In the left menu, tap **Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Under **Branch**, choose **main** and **/ (root)**, then tap **Save**.
5. Wait 1–2 minutes and open https://novashiv11.github.io/novas-pack/

## After changing any app file

Bump `VERSION` in `sw.js` (and add any new JS file to its precache list), so installed phones fetch the new version.

## Add the Discord join button

Open `site.js`, paste your Discord invite link between the quotes on the `COMMUNITY_URL` line (e.g. `https://discord.gg/abc123`), and commit. The Pack Card page then shows the "Join the pack chat" button.
