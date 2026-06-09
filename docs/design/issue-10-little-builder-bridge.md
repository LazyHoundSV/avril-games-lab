# Pixie UI/UX Spec - Issue 10 - Little Builder Bridge

## Context

- Game: Little Builder Bridge
- GitHub issue: https://github.com/LazyHoundSV/avril-games-lab/issues/10
- Related repo issue spec: `docs/issues/10.md`
- Related issue spec PR: https://github.com/LazyHoundSV/avril-games-lab/pull/11
- Approved note: `/home/monchoz/Documents/Hawks/vault/Avril Games/Approved/Little Builder Bridge.md`
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
- No accounts, telemetry, child data collection, analytics, cloud persistence, or external publishing.

## Product Intent

Create a calm toddler construction toy where Avril completes a short bridge by dragging large blocks into left-to-right gaps so an original puppy helper can cross and collect a balloon. The experience should feel sturdy, bright, and easy to read at a glance, with only a few pieces on screen, clear empty targets, soft correction for misses, and a brief satisfying payoff when the bridge is complete.

## UX Principles

- One obvious job: pick up one big block and place it into the bridge.
- Read the bridge instantly: gaps should look unfinished before any interaction.
- Support sequencing without words: the bridge should visually suggest left-to-right progress.
- Reward every success: each placed block should make the bridge look sturdier and more complete.
- Keep misses gentle: no fail state, only soft return and retry.
- Preserve focus: no extra systems, meters, or branching choices.
- End on motion: the puppy crossing is the emotional reward and confirms success.

## Visual Direction

### Tone

Sunny park play scene, toy-block construction, rounded shapes, friendly proportions, soft outlines. The world should feel like chunky wooden pieces and foam play mats rather than realistic engineering.

### Mood Keywords

- cheerful
- sturdy
- bright
- safe
- playful
- cozy-outdoors

### Color System

Use a clear high-contrast palette that separates bridge parts from the environment:

- sky: pale blue with soft cream clouds
- ground: warm green, sandy tan, or muted grassy shapes
- water or stream: soft blue-turquoise with low detail
- bridge base: warm wood brown or painted play-structure tones
- empty silhouettes: muted dusty versions of the final bridge-piece colors
- draggable blocks: saturated reds, yellows, blues, and greens with one color per piece
- puppy helper: warm cream, tan, golden, or brown original palette
- reward balloon: bright accent color that feels special and distinct from the blocks

Rules:

- Draggable blocks must be the strongest contrast in the scene.
- Empty bridge slots should look obviously unfinished but not alarming.
- Background art should stay softer and less saturated than gameplay pieces.
- Avoid dark heavy outlines that make the scene feel harsh or busy.

### Shape Language

- bridge deck: broad, gently arched, toddler-safe silhouette
- bridge blocks: chunky rectangles, arches, or capped planks with clearly different silhouettes
- target gaps: simple cutout shapes that match each block exactly
- puppy helper: big head, short legs, readable side profile, happy tail
- balloon: oversized simple oval with thick string and no tiny detail

## Screen Layout

## Screen 1 - Start / Ready State

Purpose: show the unfinished bridge, the available blocks, and the puppy waiting to cross with no instructional text.

Layout:

- Top area: sky and distant background with minimal decoration
- Middle area: bridge over a narrow stream, with `4` visible missing slots across the bridge deck
- Left side of bridge: puppy waiting in a clear idle pose
- Bottom tray: large draggable bridge pieces arranged in a simple row or shallow curve
- Optional corner controls: parent-only mute and restart, low emphasis

Behavior:

- All `4` missing slots are visible immediately
- The leftmost open slot should feel slightly more visually prominent so ordering is intuitive
- One block may give a very subtle bob or lift to hint that it can be dragged
- No tutorial panel, banner, or text label

### Mobile Portrait Reference

Reference layout for `360 x 640` CSS px:

- top background band: `16-20%` height
- bridge play zone: `42-48%` height
- bottom tray: `22-26%` height
- safe margins: minimum `16px`
- spacing between tray blocks: minimum `12px`

### Desktop / Landscape Reference

Reference layout for `1280 x 720`:

- keep the active bridge centered in a `16:9` stage
- use side space for soft scenery only, not extra gameplay
- keep tray blocks close enough to the bridge that drag distance stays short
- maintain mobile-style target generosity; desktop should not become more precise

## Screen 2 - Active Play State

Purpose: Avril drags bridge pieces into obvious matching gaps until the path is complete.

Bridge composition:

- exactly `4` placements in the first version
- bridge reads left to right, with each new placement making the path longer
- all empty slots stay visible from the beginning
- slots can vary in shape slightly, but must still read clearly at toddler scale

Object tray rules:

- keep all remaining blocks visible at once
- blocks should be large, separated, and never overlap
- once placed, a block disappears from the tray and becomes part of the bridge
- tray should re-center remaining pieces after each success if needed, but without sudden motion

Priority of attention:

- the bridge gap field is the goal
- the touched block is the only moving gameplay element
- puppy remains secondary until the bridge is finished

## Screen 3 - Completion State

Purpose: reward completion with one short animation and one obvious next action.

Layout:

- completed bridge remains centered and fully visible
- puppy crosses from left to right
- balloon reward appears near the far end of the bridge or rises after the puppy reaches it
- one large replay button appears after the celebration

Rules:

- replay should be icon-first, such as a large circular arrow
- no score, stars, or progress chart
- no next-level branch in the first version
- replay becomes available quickly after the puppy crosses

## Interaction States

### Idle

- empty bridge slots softly glow or breathe at very low intensity
- one draggable block may lift by `2-4px` every few seconds
- stream and clouds may move slightly, but background motion must stay calm

### Drag Start

- selected block scales to `1.05-1.1x`
- soft shadow appears underneath
- block moves to front immediately
- its matching gap brightens slightly

### Dragging Over Valid Area

- matching gap becomes brighter and gains a soft outline
- block can subtly align toward its final position
- non-matching gaps stay neutral

### Dragging Over Invalid Area

- no red X, no buzz, no harsh shake
- block simply follows the finger
- optional tiny neutral wobble on release if dropped far from any slot

### Correct Drop

- block snaps into place in `120-180ms`
- small sparkle puff or dust poof appears at the contact point
- the bridge gives a subtle sturdy-settle bounce
- a short success sound may play if audio is enabled

### Incorrect Drop

- block returns to tray in `180-260ms`
- use curved ease-back motion, not a hard bounce
- no progress loss and no blocking overlay

### Final Placement

- final block snaps in and the whole bridge feels complete
- puppy starts crossing within `300-700ms`
- balloon appears as the puppy reaches the far side
- replay affordance appears after roughly `2s`

## Touch Target Notes

- Minimum draggable visual size: `88 x 88` CSS px
- Preferred draggable block size on mobile: `96-132px` on the shortest side
- Minimum effective drag hit area: larger than the art by `8-16px` on each side
- Minimum effective bridge-slot drop zone: `96 x 96` CSS px
- Leftmost and rightmost slots should get extra forgiving invisible padding because they sit near scene edges
- Parent controls: minimum `44 x 44` CSS px and visually de-emphasized
- Leave at least `12px` between tray blocks
- Keep main gameplay away from the bottom `24px` browser gesture zone

Implementation note:
Use invisible forgiving hit areas for both the loose blocks and the bridge slots. The art can look precise, but the interaction should accept near misses generously.

## Asset Style Guidance

### Environment

- one clear bridge-over-stream scene
- simple park or garden backdrop with low-detail trees, hills, or shrubs
- minimal scenery near the bridge so slots remain obvious
- water should read as safe and decorative, not dangerous

### Bridge Base and Slots

- bridge should already include stable side rails or supports so the player feels they are finishing, not inventing, the structure
- empty slots should use filled ghost-shapes, not outline-only targets
- slots should suggest exact piece identity
- each successful placement should visibly improve the bridge path

### Bridge Pieces

Required set:

- `4` large bridge blocks
- each block with a distinct silhouette or top detail
- one piece may be a center arch-cap shape for extra variety, but keep silhouettes simple

Rules:

- every block must read clearly by silhouette first
- use chunky toy-like proportions
- avoid delicate textures, bolts, or realistic construction detail
- keep decorative markings broad and sparse
- do not use branded colors or patterns that imply known characters

### Puppy Helper

- original puppy only
- design for `3` key poses:
  - waiting beside the bridge
  - trotting across the bridge
  - celebrating with the balloon
- expression should read from a distance
- avoid clothing, accessories, or franchise-coded styling

### Effects

- soft sparkles
- small dust puffs
- gentle glow rings
- a few floating stars or confetti dots during completion

Avoid:

- loud confetti storms
- screen shake
- flashing light pulses
- heavy particles that cover the bridge

## Feedback and Celebration Behavior

Feedback ladder:

1. Each correct placement gives immediate snap and sturdy-settle feedback.
2. The bridge looks more complete after every block.
3. The final block triggers the puppy crossing and balloon payoff.

Per-placement feedback should combine:

- snap into matching slot
- one subtle bridge bounce or settle
- short success sound if audio is enabled
- slight increase in visual completeness of the bridge path

Incorrect placement feedback should combine:

- gentle ease-back motion
- neutral or no sound
- immediate chance to retry

Final celebration should last `2-4s`:

- puppy crosses fully
- balloon appears or lifts upward
- a few stars, sparkles, or dots float up briefly
- replay appears or the game auto-resets after a pause

## Mobile and Desktop Framing

### Mobile

- design first for portrait
- keep bridge and tray visible without scrolling
- avoid long diagonal drags and edge-to-edge reaches
- support one-hand play comfortably
- respect notches and browser chrome safe areas

### Desktop

- support mouse drag with the same gameplay logic
- keep mobile-sized touch generosity
- center the stage and use decorative side padding only
- do not add hover-only instructions or desktop-only branches

## Accessibility Notes

- No child-facing text required for play
- No timed pressure, countdown, or fail state
- Use strong contrast between background, empty slots, and draggable blocks
- Do not rely on audio for understanding progress
- Keep choice count low and spatially organized
- If a slot or block shape reads ambiguously in testing, simplify the silhouette before adding more visual detail

## Implementation Constraints and Measurements

- First version should use exactly `4` bridge placements
- Recommended session length: `2-4` minutes
- One screen for active play, plus brief completion state
- Keep active particles low for mobile performance
- Aim for visible interaction feedback within `100ms`
- Do not introduce analytics, child data collection, online saves, accounts, or sharing

## Suggested Scene Structure

- `MenuCard` or landing entry from the main menu
- `LittleBuilderBridgeScene` for the full play loop
- optional lightweight completion overlay only if replay affordance needs separation from the scene

## Acceptance Criteria

- Hawks can implement directly from this spec.
- The design supports toddler use without reading.
- Visual feedback is clear for correct and incorrect placement without harsh failure.
- The bridge slots read clearly and support left-to-right sequencing.
- The puppy crossing and balloon reward feel satisfying but brief.
- The game works touch-first on mobile and remains comfortable on desktop.
