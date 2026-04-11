/**
 * Multiplayer Stability Improvements
 * 
 * This file documents and implements improvements to handle:
 * 1. Simultaneous disconnects
 * 2. Incomplete reconnects
 * 3. Game state synchronization issues
 * 4. Timeout handling during disconnects
 */

import type { GameState } from '../shared/gameTypes';

/**
 * IMPROVEMENT 1: Explicit Game Over Detection
 * 
 * After any forfeit, immediately check if game should end.
 * This prevents the game from getting stuck in "playing" state
 * when all players are out.
 */
export function checkAndFinishGameIfNeeded(gameState: GameState): boolean {
  const activePlayers = gameState.players.filter(p => !p.isOut);
  
  if (activePlayers.length <= 1) {
    console.log(`[Stability] Game should end: ${activePlayers.length} active players remaining`);
    // The checkGameOver function in gameEngine.ts will handle the transition
    return true; // Game is over
  }
  
  return false; // Game continues
}

/**
 * IMPROVEMENT 2: Detect Partial Reconnects
 * 
 * A player might reconnect to Socket.IO but fail to rejoin the room.
 * This causes the watchdog to detect them as "disconnected" even though
 * they have an active socket.
 */
export function isPlayerProperlConnected(
  playerSocket: any,
  roomId: string
): boolean {
  if (!playerSocket) return false;
  
  // Check if socket is actually in the room
  const isInRoom = playerSocket.rooms.has(roomId);
  
  // Check if socket is still connected
  const isConnected = playerSocket.connected;
  
  return isConnected && isInRoom;
}

/**
 * IMPROVEMENT 3: Graceful Timeout Handling
 * 
 * When a timeout occurs during a disconnect, we need to:
 * 1. Check if the player is still in the game
 * 2. If not, skip the timeout action
 * 3. Let the watchdog handle the forfeit
 */
export function shouldProcessTimeout(
  gameState: GameState,
  playerIdx: number
): boolean {
  const player = gameState.players[playerIdx];
  
  if (!player) {
    console.warn(`[Stability] Timeout for invalid player index ${playerIdx}`);
    return false;
  }
  
  if (player.isOut || player.leftGame) {
    console.log(`[Stability] Skipping timeout for player ${player.name} (already out)`);
    return false;
  }
  
  return true;
}

/**
 * IMPROVEMENT 4: Validate Game State Consistency
 * 
 * After any major operation (forfeit, timeout, reconnect), validate
 * that the game state is consistent.
 */
export function validateGameStateConsistency(gameState: GameState): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check 1: Active players count
  const activePlayers = gameState.players.filter(p => !p.isOut);
  if (activePlayers.length < 0) {
    issues.push('Negative active players count');
  }
  
  // Check 2: Current attacker/defender are valid
  if (gameState.gamePhase === 'playing') {
    const attacker = gameState.players[gameState.currentAttackerIdx];
    const defender = gameState.players[gameState.currentDefenderIdx];
    
    if (!attacker || attacker.isOut) {
      issues.push(`Invalid attacker: ${gameState.currentAttackerIdx}`);
    }
    
    if (!defender || defender.isOut) {
      issues.push(`Invalid defender: ${gameState.currentDefenderIdx}`);
    }
  }
  
  // Check 3: loserId consistency
  if (gameState.loserId) {
    const loser = gameState.players.find(p => p.id === gameState.loserId);
    if (!loser) {
      issues.push(`loserId points to non-existent player: ${gameState.loserId}`);
    }
  }
  
  // Check 4: Battlefield consistency
  if (gameState.battleField.length > 0 && gameState.gamePhase !== 'playing') {
    issues.push(`Battlefield has cards but game phase is ${gameState.gamePhase}`);
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * IMPROVEMENT 5: Enhanced Logging for Debugging
 * 
 * Log all critical events with timestamps and context.
 */
export function logCriticalEvent(
  eventType: string,
  roomId: string,
  context: Record<string, any>
): void {
  const timestamp = new Date().toISOString();
  const contextStr = Object.entries(context)
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join(', ');
  
  console.log(`[${timestamp}] [CRITICAL] ${eventType} in room ${roomId}: ${contextStr}`);
}

/**
 * IMPROVEMENT 6: Detect Simultaneous Disconnects
 * 
 * If multiple players disconnect within a short time window,
 * we might need special handling.
 */
export class DisconnectTracker {
  private disconnects: Map<string, number> = new Map(); // roomId -> last disconnect time
  private threshold = 5000; // 5 seconds
  
  recordDisconnect(roomId: string): boolean {
    const now = Date.now();
    const lastDisconnect = this.disconnects.get(roomId);
    
    if (lastDisconnect && now - lastDisconnect < this.threshold) {
      console.warn(`[Stability] Multiple disconnects in room ${roomId} within ${this.threshold}ms`);
      return true; // Simultaneous disconnect detected
    }
    
    this.disconnects.set(roomId, now);
    return false;
  }
  
  clear(roomId: string): void {
    this.disconnects.delete(roomId);
  }
}

/**
 * IMPROVEMENT 7: State Versioning (for future implementation)
 * 
 * Add version numbers to game state for proper ordering of updates.
 * This helps detect out-of-order updates during network issues.
 */
export interface VersionedGameState extends GameState {
  version: number; // Incremented on each significant state change
}

/**
 * IMPROVEMENT 8: Reconnect State Validation
 * 
 * When a player reconnects, validate that the game state they're
 * rejoining is still valid.
 */
export function validateReconnectState(
  gameState: GameState,
  playerIdx: number
): {
  valid: boolean;
  reason?: string;
} {
  if (!gameState) {
    return { valid: false, reason: 'Game state not found' };
  }
  
  if (gameState.gamePhase !== 'playing') {
    return { valid: false, reason: `Game phase is ${gameState.gamePhase}` };
  }
  
  const player = gameState.players[playerIdx];
  if (!player) {
    return { valid: false, reason: 'Player not found in game' };
  }
  
  if (player.isOut || player.leftGame) {
    return { valid: false, reason: 'Player is already out or left' };
  }
  
  return { valid: true };
}
