# CLAUDE.md — Nova's Pack

**Read only this file, then `docs/STATUS.md` (Now / Next / Waiting on Shiv).** Open other docs or code only when the task needs them. Never open `_archive/` (old, superseded) unless Shiv asks.

## What it is
A free PWA, "Level up together": a real-life pet-and-human growth game for **everyone who loves animals** (dogs, cats, hens, rabbits, horses, no pet yet). Hosted by **Nova**, Shiv's black-and-tan German Shepherd (Limerick, Ireland; Instagram @novathehumanhandler). Worldwide, online-only since 10 Oct 2026. Tagline: "Everyone's welcome in the pack." Nova's voice: warm, witty, lovingly bossy, adult; no baby talk.

## Map
- `index.html` + `app.css` + `css/*.css` (load order in index.html matters: v7 → v8 → v9 override earlier files) + `js/` — the app. `js/app.js` router, `js/db.js` IndexedDB + backup, `js/game.js` pure XP/level/badge logic (derived, never stored), `js/logic.js` due/red flags, `js/views/*` screens.
- `data/*.js` content (skills, care, adventures, academy, quotes, scenes). Vet-first; never doses.
- `sw.js` offline cache. **Bump `VERSION` on every app change; `ASSETS` must list only files that exist.**
- `card.html`/`card.js` Pack Card · `privacy.html` · `sponsor.html` (unlisted) · `android/` + `.github/workflows/android.yml` TWA build (`docs/android-app.md`).
- Docs: `docs/STATUS.md`, `docs/crq.md` (backlog), `docs/decisions.md`, `docs/spec-v2-levelup.md` + `docs/spec-v3-do-it-now.md` (spec), `docs/global-plan.md` (growth/money), `docs/launch-app.md`, `docs/design-system.md`.

## Design tokens
Light: blue `#1F4E6E` (CSS var `--spruce`), oat bg `#F3F2EB`, ink `#1E1B17`, muted `#5C544B`, tan `#C27A3A` (`#8E5019` small text), gold `#F2B544` (XP). Dark: bg `#14120F`, blue `#8EC1E0`. Fonts (self-hosted in `fonts/`): Bricolage Grotesque, Plus Jakarta Sans. Cards 16px radius, buttons 12px with 3px ledge, respect `prefers-reduced-motion`.

## Non-negotiables
1. Honest: no fake members/counts/badges; every promise live or "coming soon".
2. Welcoming: species-neutral words; "no pet yet" option.
3. Safe: vet-first note on health; no selling/rehoming animals; 16+ Pack Card/Instagram, 18+ group chat; no exact locations, strip EXIF; lost pets → shelters/vets/microchip DBs; no in-person meetups.
4. XP only for showing up, helping, learning; capped; never for opens, likes, shares.
5. Small and finished beats big and broken (Shiv: ~5 h/week).
6. GDPR by design: data on device, no accounts, backup/export/delete.

## Working rules (save usage)
- Build directly, smallest diff. No research agents. One small QA pass (headless phone check at 390px: no console errors, no sideways scroll) for app changes; a separate QA agent only for big releases.
- Commit as Shiv, push to `main` (Pages deploys main/root): `git -c user.name=Claude -c user.email=noreply@anthropic.com commit --author="Shiv <340319757+novashiv11@users.noreply.github.com>"`.
- After shipping, update `docs/STATUS.md` (a few lines) and the CRQ row.

## Talking to Shiv
Phone reader, sometimes Hinglish, likes to "just start". **Reply with at most 5 short bullets.** Ask only for decisions that are his: strategy, money, anything public or irreversible — and say exactly what's needed.
