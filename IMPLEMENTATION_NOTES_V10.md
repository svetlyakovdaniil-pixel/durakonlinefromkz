# V10 Implementation Notes

## Issues to Fix

### 1. Online Friends Not Broadcasting
- `onlineFriendsUpdate` event is defined in gameTypes.ts but NEVER emitted from socketServer.ts
- Need to add: on connect/disconnect, look up the player's friends (by gameId), find which are online, and emit `onlineFriendsUpdate` to them
- Problem: socketServer doesn't have DB access currently for friends
- Solution: Import `getProfileByGameId` and `getFriends` from db.ts, or simpler: maintain a reverse map of gameId->odId and broadcast online status

### 2. Invite System Issues
- The invite handler works but:
  - No check if target is in lobby (not in a game)
  - No 30-second timeout on invites
  - Client shows invite even if player is in a game
  - Need to check `playerRooms` to see if target is in any active game

### 3. Friend Profile Viewing
- `trpc.profile.byGameId` exists and returns profile data
- ProfileDrawer FriendsTab has no "view profile" button
- Need to add a clickable friend name or eye icon that shows friend's profile

### Key Maps in socketServer:
- `playerSockets`: odId -> socketId
- `socketPlayers`: socketId -> { odId, name }
- `playerGameIds`: odId -> gameId
- `playerRooms`: odId -> Set<roomId>
- `rooms`: roomId -> Room
- `games`: roomId -> GameState

### Plan:
1. **socketServer.ts**: 
   - Add lobby-only check in inviteFriend handler
   - Add online friends broadcasting on connect/disconnect/registerProfile
   - Use playerGameIds reverse lookup for online status

2. **ProfileDrawer.tsx**:
   - Add friend profile viewing dialog
   - Keep invite button working (it already works if onInviteFriend is passed)

3. **Home.tsx**:
   - Add 30-second auto-dismiss on invite toast
   - Don't show invite if player is in a game (check gameState)

4. **RoomInviteToast.tsx**:
   - Add countdown timer display
