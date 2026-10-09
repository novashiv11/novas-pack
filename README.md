# Nova's Pack

**Everyone's welcome in the pack.** A free, friendly community for everyone who loves animals: first-time and experienced owners; dogs, cats, hens, rabbits, horses and more; rescuers and fosters; and people with no pet yet. Hosted by Nova, a young German Shepherd and professional human handler ([@novathehumanhandler](https://www.instagram.com/novathehumanhandler/)). Starting in Limerick, Ireland.

Live site (once GitHub Pages is on): https://novashiv11.github.io/novas-pack/

## What's here

| Path | What it is |
|---|---|
| `index.html` | Public welcome page. Static, no cookies or trackers. |
| `privacy.html` | Full privacy notice. |
| `site.css`, `site.js` | Shared styles; `site.js` holds the WhatsApp invite link (the only setting). |
| `print/flyer-a6.pdf` | Print-ready flyers: 4 × A6 on an A4 sheet, with a QR code to the site. |
| `img/` | Nova's photos in use, the share image (`og-image.jpg`), the Nova illustration and the QR code (`brand/`). |
| `fonts/` | Self-hosted Bricolage Grotesque and Plus Jakarta Sans (SIL Open Font License). |
| `favicon.svg`, `favicon.ico`, `apple-touch-icon.png` | Site icons. |
| `docs/decisions.md` | Decision log and open items for Shiv. |
| `docs/community-kit.md` | WhatsApp setup, rules, moderation, Pack Walk format, DM replies, partner messages. |
| `docs/launch-kit.md` | Bio, 5 Reels, 2-week launch plan, Facebook post, flyer, Shout-out Saturday. |
| `docs/money-plan.md` | How Nova's Pack earns money, with the automation stack. |
| `docs/specs/` | One spec per deliverable, with the facts checked and their sources. |
| `docs/00-master-brief.md`, `docs/01-audit-and-build-prompt.md` | Master brief and the 9 Oct 2026 audit. |
| `docs/launch-plan.md` | Older launch plan. Partly out of date: see the note at its top. |
| `_archive/` | The old prototype app, the previous welcome page and unused photos. Never published. |
| `_config.yml` | Tells GitHub Pages to publish only the site, not the docs. |

## Turn the site on (GitHub Pages)

1. In this repo, tap **Settings** (on a phone: the **⋯** menu, then **Settings**).
2. In the left menu, tap **Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Under **Branch**, choose **main** and **/ (root)**, then tap **Save**.
5. Wait 1–2 minutes and open https://novashiv11.github.io/novas-pack/

## Flip a "Coming soon" label to "Open now"

In `index.html`, find the item, change `data-status="soon"` to `data-status="live"` and the text "Coming soon" to "Open now". Commit to `main`; the site updates in about a minute.

## Add the WhatsApp join button

Open `site.js`, paste your WhatsApp Community invite link between the quotes on the `WHATSAPP_INVITE` line, and commit. Keep "Approve new members" on in WhatsApp.
