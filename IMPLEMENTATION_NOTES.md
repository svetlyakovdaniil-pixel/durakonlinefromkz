# Implementation Notes

## GameTable Structure
- PlayerHand renders cards in a scrollable flex container with overlapping margins
- Cards use PlayingCard component with click-only interaction
- handleCardClick in GameTable handles: defender targeting, transfer, passthrough, attack
- Battlefield is rendered as flex-wrap grid of BattlePair divs
- DiscardPile is a static messy stack with seeded offsets
- Game state tracks: playableIds, transferIds, passThroughIds sets
- selectedCardId state for multi-step actions (defender choosing target)

## For Drag-and-Drop:
- Need to add pointer/touch event handlers to PlayerHand card wrappers
- Drop zone = battlefield area (center div)
- On drop: validate card is playable/transferable, then call appropriate action
- Invalid drop: animate card back to hand position
- Must work with both mouse and touch

## For Animations:
- Deal animation: overlay cards flying from deck position to hand
- Bito animation: battlefield cards flying to discard pile position
- Both use CSS animations with absolute positioning
- Trigger deal on gameStarted event
- Trigger bito on battlefield clearing (turnPhase changes)
