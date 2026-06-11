# Pixie UI/UX Spec - Issue 13 - Garden Gate Locks

## Context

- Game: Garden Gate Locks
- GitHub issue: https://github.com/LazyHoundSV/avril-games-lab/issues/13
- Related repo issue spec: `docs/issues/13.md`
- Related issue spec PR: https://github.com/LazyHoundSV/avril-games-lab/pull/14
- Target player: Avril, age 2/3, non-reader
- Technical baseline: Phaser 3 + Vite + TypeScript
- Primary platforms: mobile browser first, desktop browser second

## Requested Output

This handoff provides:

- visual direction
- screen layout
- interaction states
- touch target notes
- asset style guidance
- celebration/feedback behavior
- mobile/desktop framing

## Constraints

- No reading-dependent instructions.
- No Netflix, Vera, Gabby, direct characters, logos, art, music, or story references.
- Large forgiving touch targets.
- Simple, obvious interactions.
- One primary action per screen.
- Short session loop.
- Use original inspired-by garden and pet visuals only.
- No accounts, telemetry, child data collection, analytics, cloud persistence, or external publishing.

## Product Intent

Create a calm matching game where Avril opens a small row of friendly garden gates by dragging big lock tokens onto clearly matching locks. The experience should start with obvious color matches, then optionally add one simple shape cue per lock once the interaction is understood. Every correct match should feel warm and rewarding, with each opened gate revealing an original little garden visitor and the full set ending in a brief shared celebration around a tiny fountain.

## UX Principles

- One obvious task: drag one big token to one matching lock.
- Start with instant readability: the first round should be understandable through color alone.
- Add shape only as reinforcement: shapes help recognition but should never make the scene feel busy.
- Reward each success: every opened gate should reveal something delightful immediately.
- Keep misses soft: wrong drops return gently with no failure state.
- Protect focus: no side mechanics, counters, or nested instructions.
- End with togetherness: the emotional payoff is several garden friends gathered in one happy scene.

## Visual Direction

### Tone

Magical but grounded garden play scene, toy-like gate shapes, rounded lock faces, oversized petals and shrubs, soft outlines, and a gentle morning-bright mood. The world should feel handcrafted and toddler-safe rather than fantasy-detailed or storybook-busy.

### Mood Keywords

- sunny
- gentle
- blooming
- playful
- safe
- magical-garden

### Color System

Use a high-clarity palette with clear separation between background, gates, and draggable tokens:

- sky: pale blue or warm mint gradient
- garden ground: soft green with broad flower patches
- gates: painted pastel woods such as coral, teal, butter yellow, or leaf green
- locks: saturated readable color anchors such as red, blue, yellow, and green
- empty or inactive lock cues: muted dusty versions of the active lock colors
- draggable tokens: strongest saturation in the scene, matching the target locks exactly
- garden visitors: original warm animal and bug palettes, distinct from the lock colors
- fountain and completion accents: soft aqua, cream, and sparkle-white

Rules:

- Matching pairs must be obvious before touch.
- Tokens should be the most visually active elements on screen.
- Background art must stay softer and less saturated than gameplay pieces.
- Avoid dark outlines or fine decorative detail that competes with the locks.

### Shape Language

- gates: chunky rounded-top mini garden gates with broad planks
- locks: large centered lock plates or medallions attached to each gate
- tokens: thick medallions, chunky keys, or rounded badges that are easy to grab
- shapes: circle, square, star, flower, or heart kept very simple and bold
- visitors: cat, puppy, butterfly, bird, or bunny rendered with big heads and readable silhouettes
- fountain: tiny circular centerpiece with broad simple splash shapes

## Screen Layout

## Screen 1 - Start / Ready State

Purpose: show the locked gates, the draggable tokens, and the promise of hidden garden friends with no instructional text.

Layout:

- Top area: sky, soft treetops, and minimal cloud decoration
- Middle area: `2-3` gates in a row, each with a large visible lock cue
- Behind or beside gates: tiny hints of hidden visitors such as ears, wings, or tails peeking out
- Bottom tray: large draggable tokens arranged in a simple row or shallow arc
- Optional corner controls: parent-only mute and restart, low emphasis

Behavior:

- All gates and all tokens are visible immediately
- The first round should use color-only matching if possible
- One token may subtly bob or lift to suggest dragging
- No tutorial panel, text label, or modal

### Mobile Portrait Reference

Reference layout for `360 x 640` CSS px:

- top background band: `16-20%` height
- gate play zone: `40-46%` height
- bottom token tray: `24-28%` height
- safe margins: minimum `16px`
- spacing between tokens: minimum `12px`

### Desktop / Landscape Reference

Reference layout for `1280 x 720`:

- keep the active gate row centered in a `16:9` stage
- use side areas for flowers, hedges, or soft scenery only
- keep the token tray visually close to the gates so drag distance stays short
- preserve mobile-sized forgiveness rather than making desktop more precise

## Screen 2 - Active Play State

Purpose: Avril drags tokens onto matching locks until every gate opens.

Gate composition:

- exactly `3` gate placements in the first version
- first round can be color-only
- later replay rounds can use color plus one bold shape cue per gate
- all targets stay visible from the beginning

Token tray rules:

- keep all remaining tokens visible at once
- tokens must be large, separated, and never overlap
- once matched, a token disappears from the tray and the gate opens
- remaining tokens can gently re-center after success, but without sudden motion

Priority of attention:

- gate row is the goal field
- the touched token is the only moving gameplay element
- hidden visitors remain secondary until their gate opens

## Screen 3 - Completion State

Purpose: reward completion with a short reveal and one obvious replay action.

Layout:

- opened gates remain visible
- the garden visitors move into the center area around a tiny fountain or flower patch
- a brief sparkle celebration plays
- one large replay button appears after the reveal

Rules:

- replay should be icon-first, such as a large circular arrow
- no score, stars, or progression chart
- no branching next-level flow in the first version
- replay becomes available quickly after the visitors gather

## Interaction States

### Idle

- lock faces softly glow or breathe at very low intensity
- one token may lift by `2-4px` every few seconds
- leaves, flowers, or clouds may drift slightly, but background motion stays calm

### Drag Start

- selected token scales to `1.05-1.1x`
- soft shadow appears underneath
- token moves to front immediately
- matching lock brightens slightly

### Dragging Over Valid Area

- matching lock becomes brighter and gains a soft outline
- token can subtly align toward its final position
- non-matching locks stay neutral

### Dragging Over Invalid Area

- no red X, buzzer, or harsh shake
- token simply follows the finger
- optional tiny neutral wobble on release if dropped far from any lock

### Correct Drop

- token snaps into the lock in `120-180ms`
- lock gives a tiny click or glow reaction
- gate swings or slides open in a short readable motion
- one original visitor appears immediately from behind the gate
- a short success sound may play if audio is enabled

### Incorrect Drop

- token returns to tray in `180-260ms`
- use curved ease-back motion, not a hard bounce
- no progress loss and no negative overlay

### Final Placement

- final token snaps in and the last gate opens
- all revealed visitors move toward the center within `300-700ms`
- fountain or flower area emits a few sparkles
- replay affordance appears after roughly `2s`

## Touch Target Notes

- Minimum draggable visual size: `88 x 88` CSS px
- Preferred token size on mobile: `96-128px`
- Minimum effective drag hit area: larger than the art by `8-16px` on each side
- Minimum effective lock drop zone: `96 x 96` CSS px
- Edge gates should get extra invisible padding because they sit near scene boundaries
- Parent controls: minimum `44 x 44` CSS px and visually de-emphasized
- Leave at least `12px` between adjacent tray tokens
- Keep primary gameplay away from the bottom `24px` browser gesture zone

Implementation note:
Use invisible forgiving hit areas for both tokens and locks. The artwork can look neat and centered, but the interaction should accept near misses generously.

## Asset Style Guidance

### Environment

- one clear garden lane with `2-3` gate positions
- broad flower beds, hedges, or stepping stones with low detail
- soft depth layers but no clutter around the locks
- small center fountain or flower circle reserved for the completion state

### Gates and Locks

- each gate should feel clearly separate from the others
- locks should be oversized and centered for instant recognition
- lock cues must read first by color, then optionally by shape
- opened gates should look welcoming rather than dramatic

### Tokens

Required set:

- `3` large draggable tokens in the first version
- each token matching one gate by color
- optional replay variation with a bold embedded shape per token

Rules:

- every token should read clearly by silhouette first
- use chunky toy-like proportions
- avoid teeth, tiny notches, or realistic key complexity
- decorative markings should stay broad and sparse
- do not use branded motifs or franchise-coded shapes

### Garden Visitors

- original visitors only
- design for `2-3` key poses:
  - hidden behind gate
  - emerging after gate opens
  - gathered near fountain or flowers
- expressions should read from a distance
- avoid costumes, franchise-coded features, or recognizably borrowed styling

Recommended first set:

- one puppy
- one kitten
- one butterfly or bird

### Effects

- soft sparkles
- tiny glow rings
- small petal bursts
- a few floating dots or stars during completion

Avoid:

- loud confetti storms
- screen shake
- flashing light pulses
- dense particles that obscure the gates

## Feedback and Celebration Behavior

Feedback ladder:

1. Each correct placement gives immediate snap and gate-open feedback.
2. Every opened gate reveals a visitor, increasing emotional reward step by step.
3. The final gate triggers a short shared garden celebration around the fountain.

Per-placement feedback should combine:

- snap into matching lock
- one subtle lock click or glow
- short gate-open motion
- immediate visitor reveal
- soft success sound if audio is enabled

Incorrect placement feedback should combine:

- gentle ease-back motion
- neutral or no sound
- immediate chance to retry

Final celebration should last `2-4s`:

- all visitors gather together
- fountain or flower center sparkles softly
- a few petals, stars, or dots float upward briefly
- replay appears or the game auto-resets after a pause

## Mobile and Desktop Framing

### Mobile

- design first for portrait
- keep gates and token tray visible without scrolling
- avoid long diagonal drags and edge-to-edge reaches
- support one-hand play comfortably
- respect notches and browser chrome safe areas

### Desktop

- support mouse drag with the same gameplay logic
- keep mobile-sized target generosity
- center the stage and use decorative side padding only
- do not add hover-only instructions or desktop-only UI branches

## Accessibility Notes

- No child-facing text required for play
- No timed pressure, countdown, or fail state
- Use strong contrast between background, locks, and draggable tokens
- Do not rely on audio for understanding progress
- Keep simultaneous choices low and spatially organized
- If any shape becomes ambiguous in testing, simplify it rather than adding detail

## Implementation Constraints and Measurements

- First version should use exactly `3` gate placements
- Recommended session length: `2-4` minutes
- One screen for active play, plus brief completion state
- Start with color matching and add shape variation only if readability remains strong
- Keep active particles low for mobile performance
- Aim for visible interaction feedback within `100ms`
- Do not introduce analytics, child data collection, online saves, accounts, or sharing

## Suggested Scene Structure

- `MenuCard` or landing entry from the main menu
- `GardenGateLocksScene` for the full play loop
- optional lightweight completion overlay only if replay affordance needs separation from the scene

## Acceptance Criteria

- Hawks can implement directly from this spec.
- The design supports toddler use without reading.
- Visual feedback is clear for correct and incorrect placement without harsh failure.
- The first playable round works through color matching alone.
- Optional shape cues stay bold, simple, and non-essential.
- The visitors and fountain payoff feel rewarding but brief.
- The game works touch-first on mobile and remains comfortable on desktop.
