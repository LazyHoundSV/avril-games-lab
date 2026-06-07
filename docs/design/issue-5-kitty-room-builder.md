# Pixie UI/UX Spec - Issue 5 - Kitty Room Builder

## Context

- Game: Kitty Room Builder
- GitHub issue: https://github.com/LazyHoundSV/avril-games-lab/issues/5
- Related repo issue spec: `docs/issues/5.md`
- Related issue spec PR: https://github.com/LazyHoundSV/avril-games-lab/pull/6
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

Create a calm dollhouse-like matching game where Avril finishes a kitten's cozy room by dragging large objects into clearly matching silhouettes. The experience should feel warm and satisfying, with obvious placement goals, soft feedback, and a short replayable loop that works without reading or adult explanation.

## UX Principles

- One obvious task: pick up one room object and place it into its home.
- Read the scene at a glance: each silhouette should be recognizable before interaction.
- Reward every success: snap, glow, and a small room-improvement moment.
- Handle misses softly: objects return gently with no failure state.
- Keep the room uncluttered: only a few large pieces on screen, no side systems.
- Preserve calm focus: celebration is warm and brief, never loud or chaotic.

## Visual Direction

### Tone

Soft cozy bedroom, late-afternoon warmth, toy-like shapes, friendly rounded forms, clean outlines. The room should feel handmade and safe, more like a plush dollhouse than a realistic interior.

### Mood Keywords

- cozy
- warm
- tidy
- playful
- gentle
- sleepy-happy

### Color System

Use a warm pastel palette with clear object separation:

- walls: pale peach, cream, or light apricot
- floor: honey wood or warm tan
- silhouettes: muted dusty versions of the final object color
- draggable objects: brighter, richer versions of each object color
- helper kitten: warm cream, orange, gray, or calico-inspired original palette

Rules:

- Interactive objects must be the strongest contrast on screen.
- Silhouettes should be visible but clearly "empty" and unfinished.
- Background colors should stay less saturated than the draggable items.
- Avoid dark outlines so heavy that they make the room feel harsh.

### Shape Language

- bed: rounded mattress, chunky pillow, simple blanket shape
- rug: oversized oval or cloud-like rounded rectangle
- ball: large yarn-ball or toy-ball circle with very simple detail
- window: broad square or rounded rectangle with thick frame
- bowl: shallow rounded dish with clear silhouette
- kitten helper: big head, soft tail, readable pose, no costume

## Screen Layout

## Screen 1 - Start / Ready State

Purpose: show the room, the missing pieces, and the available objects with no instructional text.

Layout:

- Top area: finished wall zone with the empty window silhouette
- Middle area: room body with empty bed silhouette and open floor space
- Lower-middle area: rug silhouette visible on the floor
- Bottom tray: draggable objects arranged in a simple row or shallow arc
- Optional corner controls: parent-only mute and restart, low emphasis

Behavior:

- The kitten helper is not yet inside the room; it can peek from the doorway or edge of screen
- One object may give a very subtle bob to suggest "drag me"
- No text banner, modal, or tutorial overlay

### Mobile Portrait Reference

Reference layout for `360 x 640` CSS px:

- top room wall zone: `20-24%` height
- center room zone: `38-42%` height
- bottom object tray: `22-26%` height
- safe margins: minimum `16px`
- spacing between draggable objects: minimum `12px`

### Desktop / Landscape Reference

Reference layout for `1280 x 720`:

- keep the playable room centered in a `16:9` stage
- use side margins for decorative wallpaper edge, curtains, or room trim
- do not spread silhouettes so far apart that dragging becomes tiring
- bottom tray should remain close to the room, not detached at screen edge

## Screen 2 - Active Play State

Purpose: Avril drags each item into the obvious matching silhouette.

Room composition:

- `5` total placements: bed, rug, ball, window, bowl
- all silhouettes visible from the beginning
- `3-5` draggable objects visible at once
- if needed, the window can start already in the tray rather than requiring a camera pan

Object tray rules:

- keep objects large and non-overlapping
- the next remaining objects should stay visible after each placement
- placed objects disappear from the tray once snapped into the room

Priority of attention:

- the silhouette field is the goal
- the currently touched object is the only moving element
- the kitten helper remains secondary until completion

## Screen 3 - Completion State

Purpose: celebrate a finished room with one obvious next action.

Layout:

- finished room fully visible
- kitten helper enters through doorway or side edge and moves to the bed or rug
- brief celebration accents appear around the room
- one large replay button appears after the short celebration

Rules:

- replay control should be icon-first, such as a large circular arrow
- no score screen
- no level-select branching
- no long celebration lock; replay becomes available quickly

## Interaction States

### Idle

- silhouettes softly glow or breathe at very low intensity
- one draggable item may lift by `2-4px` every few seconds
- room stays calm; no constant particle effects

### Drag Start

- selected object scales to `1.05-1.1x`
- soft shadow appears underneath
- object comes to front immediately
- matching silhouette becomes slightly brighter

### Dragging Over Valid Area

- target silhouette brightens and gains a soft outline
- the object can subtly align toward final orientation
- nearby unrelated silhouettes stay neutral

### Dragging Over Invalid Area

- no red X, no buzzer
- object simply follows the finger with no success cue
- optional tiny neutral wobble on release if dropped far from a target

### Correct Drop

- object snaps into place in `120-180ms`
- small sparkle burst or puff appears at contact point
- a gentle room "improvement" reaction plays:
  - bed settles with a little bounce
  - rug fluffs into place
  - bowl shines
  - window glows with light
  - ball gives a tiny happy pop

### Incorrect Drop

- object returns to its tray position in `180-260ms`
- use a curved ease-back, not a harsh bounce
- no progress loss and no negative state

### Final Placement

- room lighting warms slightly
- kitten helper enters within `300-700ms`
- room gets a short celebration: stars, hearts, or cozy glow
- replay affordance appears after roughly `2s`

## Touch Target Notes

- Minimum draggable visual size: `88 x 88` CSS px
- Preferred draggable object size on mobile: `96-128px`
- Minimum effective drag hit area: larger than the art by `8-16px` on each side
- Minimum effective silhouette drop zone: `96 x 96` CSS px
- Bed and rug drop zones should be substantially larger because they are anchor pieces
- Corner parent controls: minimum `44 x 44` CSS px and visually de-emphasized
- Leave at least `12px` between adjacent tray items
- Keep core gameplay targets out of the bottom `24px` browser gesture zone

Implementation note:
Use invisible forgiving hit areas for both draggable items and silhouette sensors. The art should feel honest, but the input should be easier than it looks.

## Asset Style Guidance

### Background Room

- one-wall, one-floor room view with clear separation line
- simple wallpaper or painted wall texture, not busy patterns
- minimal furniture already present; the room should look intentionally incomplete
- optional doorway or curtain edge for the kitten's entrance

### Silhouettes

- use filled ghost-shapes, not thin outlines only
- silhouettes should suggest exact object identity
- keep them slightly translucent or desaturated
- when empty, they should feel like invitation spots, not errors

### Room Objects

Required set:

- bed
- rug
- ball
- window
- bowl

Rules:

- every object should read clearly by silhouette first
- use chunky proportions and avoid delicate details
- shading should be soft and minimal
- keep decorative details low so silhouettes stay obvious
- use original cat-room props only; do not echo branded rooms or character props

### Kitten Helper

- original kitten only
- design for 2-3 key poses:
  - peeking
  - entering
  - curling up or sitting happily
- expression should read from a distance
- avoid clothing, accessories, or franchise-coded styling

### Effects

- soft sparkles
- tiny hearts
- warm glow rings
- sunbeam shimmer by the window on completion

Avoid:

- confetti storms
- screen shake
- strobing flashes
- dense particles that obscure the room

## Feedback and Celebration Behavior

Feedback ladder:

1. Each correct placement gives immediate snap and sparkle feedback.
2. The room feels more complete after every placement.
3. The final object triggers the kitten entrance and a short cozy celebration.

Per-placement feedback should combine:

- snap into silhouette
- one tiny object-specific bounce
- soft success sound if audio is enabled
- subtle visual improvement to the room

Incorrect placement feedback should combine:

- gentle ease-back motion
- soft neutral sound or no sound
- full chance to retry immediately

Final celebration should last `2-4s`:

- kitten enters
- room glows warmer
- a few hearts or stars float upward
- then replay appears or the game auto-resets after a pause

## Mobile and Desktop Framing

### Mobile

- design first for portrait
- keep the room and tray visible without scrolling
- avoid long diagonal drags that require precision
- keep one-hand play comfortable
- respect notches and browser chrome safe areas

### Desktop

- support mouse drag with the same logic
- preserve mobile-sized target generosity
- center the stage and use decorative side padding
- do not add hover-only instructions or desktop-only UI branches

## Accessibility Notes

- No child-facing text required for play
- No timed pressure, countdowns, or fail state
- Use contrast between background, silhouettes, and draggable objects
- Do not rely on audio for comprehension
- Keep simultaneous choices low and spatially separated
- If any silhouette reads ambiguously in testing, simplify the asset before adding complexity elsewhere

## Implementation Constraints and Measurements

- First version should use exactly `5` object placements
- Recommended session length: `2-4` minutes
- One screen for active play, plus brief completion state
- Keep total active decorative particles low for mobile performance
- Aim for visible interaction feedback within `100ms`
- Do not introduce analytics, child data collection, online saves, accounts, or sharing

## Suggested Scene Structure

- `MenuCard` or landing entry from the main menu
- `KittyRoomBuilderScene` for the full play loop
- optional `CompletionOverlay` kept lightweight and skippable

## Acceptance Criteria

- Hawks can implement directly from this spec.
- The design supports toddler use without reading.
- Visual feedback is clear for correct and incorrect placement without harsh failure.
- All five objects have obvious matching silhouettes.
- The final kitten entrance feels rewarding but brief.
- The game works touch-first on mobile and remains comfortable on desktop.
