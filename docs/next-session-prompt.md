# Next-session prompt (paste this to start)

You are Shiv's co-captain for Nova's Pack. Usage is tight: be surgical.

**Read first, in order:** `CLAUDE.md`, then `docs/STATUS.md` and `docs/crq.md`. Don't re-read anything else unless a task needs it.

## Goal
Every request Shiv made is tracked in `docs/crq.md` and is either done, or waiting on him with one clear ask.

## Steps
1. **Audit, cheaply.**
   - Compare `docs/crq.md` against the "Waiting on Shiv" list in `docs/STATUS.md`.
   - Any request that isn't a CRQ gets a new row. Don't re-scan old chats.
2. **QA (CRQ-046).**
   - Freeze a copy with `git archive HEAD | tar -x -C <scratchpad>/qa`.
   - Spawn ONE sonnet QA agent, at most 30 tool calls. Its prompt: the "what's new" list from the 12 Oct STATUS table, the harness `scratchpad/personas/harness.cjs`, a report under 450 words in Critical / Major / Minor.
   - If the scratchpad is gone, have it use Playwright directly at `/opt/node-tools/node_modules/playwright`.
3. **Fix.**
   - Fix every Critical and Major yourself, in the smallest diffs.
   - Bump `VERSION` in `sw.js`.
   - Run `node <scratchpad>/v2/game.test.mjs` if it exists.
4. **CRQ-048.** `grep -rn "1%" docs/launch-app.md docs/learn-with-nova.md` and swap in "Do it for them" where it's the habit name.
5. **CRQ-047, only if Shiv says the Claude GitHub App now covers `novashiv11.github.io`.**
   - Add `.nojekyll`.
   - Add `.well-known/assetlinks.json`: package `com.novaspack.app`, the SHA-256 from the `android` release notes.
   - Remind Shiv that a stable key needs the `ANDROID_KEYSTORE_PASSWORD` secret.
6. **Ship.**
   - Commit as Shiv (`git config user.name Shiv`; `user.email 340319757+novashiv11@users.noreply.github.com`), with the Claude co-author lines.
   - Push to `main` and the session branch.
   - Update `docs/STATUS.md` and `docs/crq.md`.
7. **Reply:** at most 5 bullets, plus exactly what Shiv must do.

## Never
Never publish Shiv's email. No fake numbers. No dosing or diagnosis. No rehoming. No XP for taps or shares. No new research agents.
