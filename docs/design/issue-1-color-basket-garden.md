# Pixie UI/UX Spec - Issue 1 - Color Basket Garden

## Context

- Game: Color Basket Garden
- GitHub issue: https://github.com/LazyHoundSV/avril-games-lab/issues/1
- Related repo issue spec: `docs/issues/1.md`
- Target player: Avril, age 2/3, non-reader
- Technical baseline: Phaser 3 + Vite + TypeScript
- Primary platforms: mobile browser first, desktop browser second

## Product Intent

Create a calm, joyful sorting game where Avril drags colorful garden objects into matching baskets. The experience should feel like helping a magical garden get ready for a little celebration. It should work without text, without prior game literacy, and without tight timing or punishment.

## UX Principles

- One active task at a time: pick up one object and place it in one basket.
- Start playable immediately: no menu wall, no reading gate, no setup.
- Reward success clearly: visible snap, sparkle, fill, and celebration.
- Handle mistakes softly: no buzzer, no shake-screen, no losing state.
- Keep the screen legible for a toddler: few objects, big shapes, clear color grouping.

## Visual Direction

### Tone

Warm magical garden, bright daylight, rounded shapes, soft edges, toy-like materials. The mood should feel homemade and kind rather than flashy or arcade-like.

### Color System

Use 3 high-separation basket colors in the first version:

- red: warm tomato / strawberry family
- yellow: sunflower / lemon family
- blue: sky / berry family

Optional later expansion:

- green
- orange
- purple

Rules:

- Basket color must be the strongest color cue on screen.
- Object silhouette should stay simple enough to read at small glance.
- Avoid relying on close hues like teal vs blue or lime vs yellow.
- Background should be low-contrast and lower saturation than interactive elements.

### Shape Language

- Baskets: wide, rounded, front-facing, with thick rims
- Objects: chunky, friendly, oversized, no thin stems or tiny details
- Helper animal: soft rounded body, big eyes, readable smile, no complex costume
- Effects: stars, leaf sparkles, floating petals, soft glow rings

## Screen Layout

### Core Play Screen

Use a single-screen loop with no scene change during normal play.

### Mobile Portrait Target

Reference layout for `360 x 640` CSS px:

- Top band: `10-15%` height for sky, helper animal perch, and optional parent-only mute/restart controls
- Middle band: `45-50%` height for draggable objects on the garden floor
- Bottom band: `25-30%` height for basket row
- Safe margins: minimum `16px` on all sides
- Gap between baskets: `12-16px`

### Desktop / Landscape Target

Reference layout for `1280 x 720`:

- Keep gameplay centered in a fixed-aspect stage
- Preferred logical game area: `16:9`
- Add decorative side garden space rather than spreading baskets too far apart
- Keep the basket cluster within the center `70%` of the width

### Basket Layout

- Start with 3 baskets max on screen
- Each basket should occupy roughly `22-26%` of stage width on mobile portrait
- Basket drop zone should extend slightly above the rim so near-misses still count
- Basket row should sit fully above device gesture areas and browser bottom chrome

### Object Layout

- Show `3-5` draggable objects at once
- Only `1` object should visually feel primary at a time
- Preferred arrangement: objects spaced across the middle ground with no overlap
- If multiple objects are present, the next recommended object can idle-bob slightly to draw attention

## Interaction States

### Idle

- Baskets gently bob or breathe at very low amplitude
- One available object can pulse with a subtle scale change every `2.5-3s`
- Helper animal watches but does not compete for attention

### Drag Start

- Selected object scales up `1.05-1.1x`
- Add a soft shadow under the object
- Object should come to front immediately
- Nearby baskets brighten slightly when drag begins

### Drag Hover - Correct Basket

- Matching basket rim glows
- Basket opens or lifts slightly
- Optional faint color halo appears inside the drop zone

### Drag Hover - Incorrect Basket

- No harsh red X
- At most, show a neutral "not quite" response such as slight basket stillness, no glow, or a soft wobble that reads as unavailable

### Correct Drop

- Object snaps into basket in `120-180ms`
- Object settles among previously sorted items or disappears into the basket with a visible "collected" pop
- Trigger `3-6` sparkle particles, a short basket bounce, and a progress bloom in the background such as a flower opening or vine curl

### Incorrect Drop

- Object returns to its prior area in `180-260ms`
- Use a curved or eased return, not a sharp bounce
- Keep the object fully available for retry
- No score reduction, timeout, or negative sound

### Round Complete

- All baskets do a brief happy bounce
- Helper animal enters or pops up larger
- Background gets a short celebration burst: petals, sparkles, maybe 1-2 butterflies
- After `2-3s`, show a large icon-only replay button or automatically reset after a pause

## Touch Target Notes

- Minimum tappable / draggable visual size: `88 x 88` CSS px
- Preferred object body size on mobile: `96-120px`
- Minimum effective basket drop zone: `96 x 96` CSS px, larger than the visible opening
- Parent-only corner buttons: minimum `44 x 44` CSS px, but avoid making them the most eye-catching element
- Leave at least `12px` between adjacent interactive targets
- Avoid placing core targets within the bottom `24px` of the viewport to reduce browser gesture conflicts

Implementation note:
Use generous invisible hit areas in Phaser for both draggable items and basket sensors. Visual art can be smaller than the input region as long as it still looks honest.

## Asset Style Guidance

### Background

- Simple layered garden with sky, grass, maybe one path or flower bed
- Keep texture soft and sparse
- No busy repeating patterns behind objects
- Reserve strongest contrast for playable items

### Baskets

- Same base model recolored per basket
- Thick rim, clear opening, slightly angled front view
- Include a small decorative garden cue per basket if useful, but color remains the main signal

### Objects

Use a small pool of repeated categories:

- flowers
- fruits
- leaves

Rules:

- Each object should read clearly by silhouette first, color second
- Avoid tiny stems, thin outlines, or realistic shading
- Prefer 2-3 tones per asset plus a subtle highlight
- Keep each category consistent so variation comes from color, not complexity

### Helper Animal

- Choose one original helper for v1, not multiple
- Recommended: small garden fox, puppy, or cat
- Use the helper mainly for completion and ambient delight, not constant instruction

### Animation Style

- Snappy but soft
- Ease out more than ease in
- Avoid fast flashes, screen shake, or full-screen particle storms
- Keep loops under control to preserve calm focus

## Celebration and Feedback Behavior

Feedback ladder:

1. Immediate success feedback on each correct sort
2. Visible round progress in the garden after every 1-2 correct sorts
3. Short end-of-round celebration

Per-correct-match feedback should combine:

- snap to basket
- sparkle burst
- basket bounce
- gentle pleasant chime if audio is enabled

Round-progress feedback ideas:

- flowers bloom in the background
- a small rainbow ribbon grows
- helper animal peeks out more

End celebration should last `2-4s` and then return cleanly to replayable state. Do not trap the player behind a long ceremony.

## Mobile and Desktop Framing

### Mobile

- Design first for portrait orientation
- Keep the core play loop fully usable with one hand
- Avoid requiring precision drags across the full screen width
- Maintain clear space around browser UI and notch areas

### Desktop

- Support mouse drag with identical rules
- Keep mobile-sized touch targets even on desktop; do not shrink interaction zones
- Center the game in a framed stage with decorative margins
- Optional cursor affordance: object slightly lifts on hover, but do not rely on hover for comprehension

## Accessibility Notes

- No child-facing text is required for play
- Do not encode matching only through color nuance; pair color with shape grouping and basket consistency
- Keep simultaneous choices low: `3` baskets is a strong default
- Avoid timed failure, countdowns, and pressure cues
- Audio must be optional and never required to understand success
- Use high brightness contrast between objects and background
- Avoid rapid flashing and heavy particle density
- If color confusion is observed in testing, add secondary basket markers such as dot, star, and leaf badges while keeping the experience non-reading-based

## Implementation Constraints and Measurements

- First version should use exactly `3` basket colors
- Recommended round length: `6-9` correct placements total
- Recommended concurrent object count: `3-5`
- Maximum active decorative particles at once on low-end mobile: `20-30`
- Aim for interaction feedback latency under `100ms`
- Keep celebration sequences skippable by tap or auto-finish in under `4s`
- Keep the full game functional offline after initial load
- No login, save account, analytics, telemetry, ads, or backend calls

## Suggested Phaser Structure

- One main gameplay scene
- Optional lightweight boot / preload scene
- Separate containers or layers for background, basket row, object layer, feedback/particles, helper animal, and parent controls

Input guidance:

- Use drag thresholds low enough for toddlers, but not so low that a tap instantly counts as a drag
- Expand basket drop hit areas beyond visible edges
- On incorrect drop, animate back to the remembered origin position

## Open Questions for Implementation

- Whether v1 should auto-reset after celebration or wait for replay tap
- Whether the helper animal should be a cat, dog, fox, or another original animal
- Whether subtle secondary symbols are needed on baskets from the start or only if testing shows color confusion

## Acceptance Checklist

- A toddler can begin play without reading or menu navigation
- The main screen shows only one obvious goal: match objects to baskets
- Correct matches feel rewarding within a fraction of a second
- Incorrect matches are clearly non-terminal and non-punitive
- The layout remains clean on small mobile screens
- Desktop framing preserves the same interaction scale
- The art direction is original and contains no prohibited IP references
