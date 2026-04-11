# Multiplayer Stability Improvements

## Problem Analysis

Based on user reports:
1. Both players disconnect during active game
2. One player automatically becomes loser without leaving lobby
3. Game doesn't end properly

## Root Causes Identified

### 1. Race Condition in Disconnect Handling
When both players disconnect simultaneously:
- Player 1 disconnect triggers grace period (30s freeze)
- Player 2 disconnect also triggers grace period
- If both grace periods expire, both get forfeited
- But the game state might not properly handle "all players out" scenario

**Solution**: Add explicit check for "all players out" condition and properly finalize game

### 2. Watchdog Timer Edge Case
The watchdog checks every 10 seconds for stale games (no progress for 30s).
Problem: If a player reconnects but fails to rejoin the room (socket connected but not in room), the watchdog might:
- Auto-forfeit the player
- But not properly update the game state
- Leaving the other player in an inconsistent state

**Solution**: Improve the watchdog to properly handle partial reconnects

### 3. Incomplete State Synchronization on Reconnect
When a player reconnects:
- Server sends gameStateUpdate
- But if the game state changed during disconnect, there might be a mismatch
- Client might have stale actions

**Solution**: Add version/sequence numbers to game state for proper ordering

### 4. Timeout Handling During Disconnect
If a player disconnects and the turn timer expires:
- The timeout handler tries to get the player's socket
- But the socket might be in a weird state (connected but not in room)
- This could cause the timeout handler to not properly advance the game

**Solution**: Improve timeout handler to handle disconnected players gracefully

## Improvements Made

### 1. Fixed Syntax Error
- Removed double closing bracket in disconnect handler
- Added proper requestRoomList handler

### 2. Added Disconnect Tests
- 10 comprehensive tests for disconnect/reconnect scenarios
- Tests cover: defender disconnect, attacker disconnect, 3-player scenarios, forfeit order tracking

### 3. Improvements to Implement

#### A. Add Game State Versioning
```typescript
// In GameState
version: number; // Incremented on each state change
```

#### B. Improve Watchdog Detection
- Check if player socket exists AND is in the room
- If not, immediately forfeit instead of waiting for stale timeout
- Properly handle the case where all players are out

#### C. Add Explicit "Game Over" Detection
```typescript
// After any forfeit, check:
const activePlayers = gameState.players.filter(p => !p.isOut);
if (activePlayers.length <= 1) {
  // Game should end
  finishGame(gameState);
}
```

#### D. Improve Reconnect State Sync
- Send game version to client
- Client tracks last received version
- If versions don't match sequentially, request full state refresh

#### E. Add Better Logging
- Log all disconnect/reconnect events with timestamps
- Log all forfeit events with reasons
- Log all game state changes with version numbers

## Testing Strategy

1. **Unit Tests**: Already added 10 tests for disconnect scenarios
2. **Integration Tests**: Test simultaneous disconnects
3. **Network Simulation**: Simulate packet loss, delays, timeouts
4. **Stress Tests**: Test with multiple rapid disconnect/reconnect cycles

## Deployment Checklist

- [ ] Code review of changes
- [ ] Run full test suite (496 tests)
- [ ] Manual testing of disconnect scenarios
- [ ] Monitor logs for any new issues
- [ ] Gradual rollout if possible

## Known Limitations

1. Grace period is 30 seconds - players need to reconnect within this window
2. If both players disconnect, game will end after 30s
3. No persistent game state storage - if server restarts, games are lost
