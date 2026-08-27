# Rainbow Rampage V2

Baseline: `3cc315a4b119880a4f2f115e9c37d54629fe04de`

This branch is intentionally isolated from the known-good beta build.

## Visual target
- Loud arcade/comic-book destruction
- Black/charcoal panels with white sticker-like outlines
- Hot pink, acid green, cyan, orange and rainbow accents
- Chunky readable mobile-first HUD
- Graffiti/paint-splatter energy without sacrificing gameplay readability
- Larger impact language: SMASH callouts, debris, sparks, dust, screen feedback

## V2 passes
1. Preserve mechanics and working mobile renderer.
2. Replace presentation layer: shell, HUD hierarchy, mission card, controls, game-over flow.
3. Improve impact/effects and rage presentation.
4. Audit sprites/assets and replace weak/inconsistent assets as coherent sets.
5. Wire `/api/leaderboard` + `/api/submit-score` into an in-game leaderboard and score submission flow.
6. Test desktop + mobile landscape before any merge to main.

## Safety rule
Do not merge V2 into `main` until the known-good beta and V2 have been compared on desktop and mobile. Main remains recoverable from the baseline commit above.
