# Avril Games Lab Operating Model

This repo is the implementation lane for small educational web games for Avril.

## Audience

- Avril is 2/3 years old.
- She does not read yet.
- She is starting to grasp early math.
- She enjoys logic/building, draggable interactions, puzzles, collecting themed/color objects, dogs, cats, and cozy magical/dollhouse-like vibes.

## Product Rules

- Child-facing screens must not depend on written instructions.
- Prefer drag, tap, collect, match, sort, place, and build interactions.
- Use large touch targets and short 2-5 minute sessions.
- Avoid timers, penalties, keyboard controls, complex menus, tiny buttons, and failure-heavy loops.
- Use original characters/worlds only. Do not use Netflix, Vera, Gabby, direct characters, logos, art, music, or story references.
- Do not add accounts, telemetry, child data collection, cloud persistence, or analytics without Ramon approval.

## Workflow

1. Hawks drafts game ideas in Obsidian.
2. Ramon approves specific ideas.
3. Hawks creates a GitHub issue only after approval.
4. Hawks writes `docs/issues/<issue-number>.md` for the approved game.
5. Hawks asks Pixie for a UI/UX spec and stores it in `docs/design/`.
6. Hawks implements one approved issue at a time.
7. Hawks validates desktop/mobile playability before marking done.

## Deployment Workflow

- Cloudflare should build preview deployments for pull requests and feature branches.
- Keep production pointed at `main`; do not switch production to a feature branch just to test a game.
- A production build can fail while `main` contains only docs/specs. Treat the PR preview build as the authoritative deploy check for active game work.
- For each implementation PR, Hawks should verify the Cloudflare preview deployment, capture the preview URL, and add it to the PR/issue/build note.
- Promote to production only by merging an approved PR into `main`.
- GitHub Actions deploys previews/production to Cloudflare Pages using:
  - `CLOUDFLARE_ACCOUNT_ID` repo secret
  - `CLOUDFLARE_API_TOKEN` repo secret
  - optional `CLOUDFLARE_PROJECT_NAME` repo variable, defaulting to `avril-games-lab`

## Technical Default

- Phaser 3 + Vite + TypeScript.
- Browser-playable and touch-first.
- Offline-friendly.
- No backend initially.
