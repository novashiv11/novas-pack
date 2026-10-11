# Design system (GUI pass v2, CRQ-043)

Playful and calm, one obvious step per screen. No new fonts, colours or libraries: the pass reuses the tokens in `site.css` and `app.css`. The overrides live in the last block of `app.css` ("GUI pass v2").

## Principles
1. One primary (blue) button per screen. Gold only for rewards and "Continue" after a win.
2. No dead controls. If something is not ready, hide it or say why in three words ("Drawing…").
3. Labels are verbs: "Pick a skill", "Start 5-min session", "Change this week's skill".
4. One line of helper text per card. Long text goes behind a fold or "How?".
5. Tap targets 44 px or more; tiles 72 px.
6. Motion is short (150 ms fades, a press ledge, a pop on completion) and off with `prefers-reduced-motion`.
7. Meaning is never colour alone: status chips carry a tick or words.

## Tokens (unchanged names)
`--bg --surface --sunk --line --ink --muted` · `--blue --blue-ledge --blue-soft --live-ink` · `--gold --gold-ledge --gold-soft` · `--tan --tan-text --tan-soft` · `--danger`.
Type: 12 / 14 / 16 / 18 / 22 / 30 px (`--t12` … `--t30`). Radii: 12 (buttons, inputs) and 16 (cards, tiles, sheets). `--strip-h` is now 44 px.

## Components
| Component | Rule |
|---|---|
| Button | `.btn` + `btn-blue` / `btn-line` / `btn-gold`, or `.text-link`. 3 px ledge, presses down. `.sm` is still 44 px. |
| Card | 16 px radius, 1 px `--line`, `--surface`. The Home "Do 1 minute" card adds a 2 px blue edge. |
| Tile | `.ql`, `.ex-tile`, `.welcome-grid li`: 16 px, 1.5 px line, 3 px ledge, 72 px or more. |
| Fold | `details.fold`: used for "Why it matters", "Common mistake", "When to see a professional", stats, how levels work. |
| Sheet | One header (title, 44 px close), body with 16 px gutters, sticky action bar when it scrolls (`.share-actions`). |
| Empty state | `emptyState()`: Nova's face plus one line, optional action. |
| Status chip | `.share-status`: blue-soft chip, starts with a tick on success. |

## Before → after
| Screen | Before | After |
|---|---|---|
| Home | Install banner repeated Welcome's paragraph; nudge button looked like a second primary; tiles had two styles | Install is one line plus a line button; nudge is a quiet chip; "Do 1 minute now" is 60 px with 28 px week dots; extras use the tile style; quest note is one line; nudge time starts with a capital |
| Timer sheet | Flat ring, emoji glyph in Pause | Dial with a face, gold pop when time is up, plain "Pause / Resume", 52 px buttons |
| Mission complete | Three stacked full-width buttons | Gold Continue, then "4 more minutes" and "Share this win" side by side |
| Share sheet | "Caption copied" sat off screen; no save message | Sticky bar: status chip above the buttons, always visible; saved/shared messages too; the picture is capped at 44% of the screen height |
| Train | Two blue buttons; two-line helper links | One blue ("Start the timer"); "Pick a skill" is a line button; shorter links |
| Skill page | Four long text blocks | "Why it matters", "Common mistake", "When to see a professional" are folds (content kept); Start is a full-width 56 px button |
| Level check | Back arrow named "Skip" on the results | "Skip the level check" while asking, "Back to Home" on the results |
| Welcome, Add pet | Long Android install paragraph; small footer links; narrow submit | Install is "Opens like an app." + "How?" (steps in a sheet); footer links 44 px; big "Start levelling up"; shorter helper lines |
| Health | Title buttons 24 px; long empty states; inline vet link 18 px | Title buttons 44 px (layout unchanged); empty states have Nova; "Add vaccine" full width; vet link is a text link |
| Adventures, More, Journal, Trainer | Walk note two lines; nudge value lower case | One-line walk note; capitalised nudge time; rest already on the tile and fold styles |

## Checks run
320 px light and 390 px dark: no console errors, no sideways scroll, no tap target under 44 px on Welcome, Add pet, Level check, Home, Train, a skill page, Health (4 tabs), Adventures, More, Journal and Trainer. Timer, mission, nudge and share flows still work. `game.test.mjs`: 25 pass. No logic, data, XP or storage changed.

## Not done
Sheet close has no exit animation (the open animation is 200 ms). "Back with a sheet open" (QA 11) and the daily-cap warning (QA 8) are left for the logic owner.
