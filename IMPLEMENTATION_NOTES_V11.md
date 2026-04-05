# V11 Implementation Notes

## 1. Mobile Action Buttons (sticky/floating)
Current: Action buttons are in a div at line 1062 with `flex items-end justify-center sm:justify-end`
Problem: On mobile, when battlefield has many cards, buttons get pushed below viewport
Fix: Make action buttons fixed/sticky at bottom of screen on mobile, above the hand area, with high z-index

## 2. Mobile Deal Animation
Current: CardAnimations.tsx DealAnimation uses fixed viewport positions, same for mobile/desktop
Problem: On mobile it loops or doesn't appear
Fix: Make mobile-specific animation that shows deck briefly, deals cards, then disappears. Remove BitoAnimation on mobile.

## 3. Scroll vs Drag on Mobile
Current: DraggableCard has `touch-none` CSS which prevents scrolling entirely. Drag starts after 8px movement.
Problem: User can't scroll through cards because any touch triggers drag
Fix: Two-step interaction on mobile:
- Remove `touch-none` from DraggableCard on mobile
- First tap = select card (lift it up)
- Second action = drag selected card to battlefield
- Horizontal swipe = scroll (default browser behavior)
- Only the selected card should be draggable

## 4. Context-aware action buttons on drag
When card is dragged to table, show available actions (transfer, pass-through, defend) as overlay buttons
Only show if multiple actions are possible for that card

## 5. Reconnect with room freeze
Current: 60s grace period, auto-rejoin on reconnect
Need: 30s freeze with visible timer for other players, "return to game" button in lobby
Key: playerGameIds map already exists, playerRooms tracks room membership

## 6. Avatars
Schema: avatarUrl already exists in player_profiles (nullable text)
Need: 5 preset avatar images, avatar selection UI in profile, display avatars everywhere
