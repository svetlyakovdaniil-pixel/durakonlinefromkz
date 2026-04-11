/**
 * Watchdog Improvements for Multiplayer Stability
 * 
 * Detects and handles:
 * 1. Partial reconnects (socket connected but not in room)
 * 2. Stale game states
 * 3. Disconnected players who haven't been forfeited yet
 */

import type { GameState, Player } from '../shared/gameTypes';

export interface WatchdogConfig {
  checkIntervalMs: number;
  maxStaleMs: number;
  partialReconnectTimeoutMs: number;
}

export const DEFAULT_WATCHDOG_CONFIG: WatchdogConfig = {
  checkIntervalMs: 10_000,      // Check every 10 seconds
  maxStaleMs: 30_000,            // Force resolve if no progress for 30s
  partialReconnectTimeoutMs: 5_000, // Timeout for partial reconnects
};

/**
 * Improved watchdog state tracking
 */
export class ImprovedWatchdog {
  private config: WatchdogConfig;
  private lastProgressTime: Map<string, number> = new Map();
  private partialReconnectDetected: Map<string, Set<string>> = new Map(); // roomId -> set of player IDs
  
  constructor(config: Partial<WatchdogConfig> = {}) {
    this.config = { ...DEFAULT_WATCHDOG_CONFIG, ...config };
  }
  
  /**
   * Check if a player has a partial reconnect (socket exists but not in room)
   */
  detectPartialReconnect(
    playerSocket: any,
    roomId: string,
    playerName: string
  ): boolean {
    if (!playerSocket) return false;
    
    const isConnected = playerSocket.connected;
    const isInRoom = playerSocket.rooms.has(roomId);
    
    // Partial reconnect: connected but not in room
    if (isConnected && !isInRoom) {
      console.warn(`[Watchdog] Partial reconnect detected: ${playerName} is connected but not in room ${roomId}`);
      return true;
    }
    
    return false;
  }
  
  /**
   * Mark progress in a room (game state changed)
   */
  markProgress(roomId: string): void {
    this.lastProgressTime.set(roomId, Date.now());
    // Clear partial reconnect tracking when game progresses
    this.partialReconnectDetected.delete(roomId);
  }
  
  /**
   * Check if a room is stale (no progress for too long)
   */
  isStale(roomId: string): boolean {
    const lastProgress = this.lastProgressTime.get(roomId) || Date.now();
    const staleDuration = Date.now() - lastProgress;
    return staleDuration > this.config.maxStaleMs;
  }
  
  /**
   * Get stale duration in milliseconds
   */
  getStaleDuration(roomId: string): number {
    const lastProgress = this.lastProgressTime.get(roomId) || Date.now();
    return Date.now() - lastProgress;
  }
  
  /**
   * Track partial reconnect detection
   */
  recordPartialReconnect(roomId: string, playerId: string): void {
    if (!this.partialReconnectDetected.has(roomId)) {
      this.partialReconnectDetected.set(roomId, new Set());
    }
    this.partialReconnectDetected.get(roomId)!.add(playerId);
  }
  
  /**
   * Check if a player has been detected as partially reconnected
   */
  hasPartialReconnectRecord(roomId: string, playerId: string): boolean {
    return this.partialReconnectDetected.get(roomId)?.has(playerId) ?? false;
  }
  
  /**
   * Clean up room tracking
   */
  cleanup(roomId: string): void {
    this.lastProgressTime.delete(roomId);
    this.partialReconnectDetected.delete(roomId);
  }
}

/**
 * Validate that attacker and defender are still valid
 */
export function validateAttackerDefender(gameState: GameState): {
  valid: boolean;
  issue?: string;
} {
  const { currentAttackerIdx, currentDefenderIdx, players } = gameState;
  
  const attacker = players[currentAttackerIdx];
  const defender = players[currentDefenderIdx];
  
  if (!attacker) {
    return { valid: false, issue: `Attacker at index ${currentAttackerIdx} not found` };
  }
  
  if (!defender) {
    return { valid: false, issue: `Defender at index ${currentDefenderIdx} not found` };
  }
  
  if (attacker.isOut || attacker.leftGame) {
    return { valid: false, issue: `Attacker ${attacker.name} is out or left` };
  }
  
  if (defender.isOut || defender.leftGame) {
    return { valid: false, issue: `Defender ${defender.name} is out or left` };
  }
  
  if (currentAttackerIdx === currentDefenderIdx) {
    return { valid: false, issue: 'Attacker and defender are the same player' };
  }
  
  return { valid: true };
}

/**
 * Validate battlefield consistency
 */
export function validateBattlefield(gameState: GameState): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const { battleField, gamePhase, turnPhase } = gameState;
  
  if (gamePhase !== 'playing' && battleField.length > 0) {
    issues.push(`Game not playing but has ${battleField.length} cards on battlefield`);
  }
  
  if (turnPhase === 'attack' && battleField.length === 0) {
    // This is OK - attacker hasn't played yet
  }
  
  if (turnPhase === 'defend' && battleField.length === 0) {
    issues.push('Defender turn but no cards on battlefield');
  }
  
  // Check for duplicate cards on battlefield
  const cardIds = new Set<string>();
  for (const pair of battleField) {
    if (cardIds.has(pair.attack.id)) {
      issues.push(`Duplicate attack card on battlefield: ${pair.attack.id}`);
    }
    cardIds.add(pair.attack.id);
    
    if (pair.defense && cardIds.has(pair.defense.id)) {
      issues.push(`Duplicate defense card on battlefield: ${pair.defense.id}`);
    }
    if (pair.defense) cardIds.add(pair.defense.id);
  }
  
  return { valid: issues.length === 0, issues };
}

/**
 * Validate player hand consistency
 */
export function validatePlayerHands(gameState: GameState): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const allCardIds = new Set<string>();
  
  // Collect all cards from player hands
  for (const player of gameState.players) {
    for (const card of player.hand) {
      if (allCardIds.has(card.id)) {
        issues.push(`Card ${card.id} appears in multiple player hands`);
      }
      allCardIds.add(card.id);
    }
  }
  
  // Check battlefield cards aren't in hands
  for (const pair of gameState.battleField) {
    if (allCardIds.has(pair.attack.id)) {
      issues.push(`Attack card ${pair.attack.id} is both on battlefield and in a hand`);
    }
    if (pair.defense && allCardIds.has(pair.defense.id)) {
      issues.push(`Defense card ${pair.defense.id} is both on battlefield and in a hand`);
    }
  }
  
  return { valid: issues.length === 0, issues };
}

/**
 * Comprehensive game state validation
 */
export function validateGameState(gameState: GameState): {
  valid: boolean;
  issues: string[];
} {
  const allIssues: string[] = [];
  
  // Check attacker/defender
  const attackerDefenderCheck = validateAttackerDefender(gameState);
  if (!attackerDefenderCheck.valid) {
    allIssues.push(`Attacker/Defender: ${attackerDefenderCheck.issue}`);
  }
  
  // Check battlefield
  const battlefieldCheck = validateBattlefield(gameState);
  allIssues.push(...battlefieldCheck.issues);
  
  // Check hands
  const handsCheck = validatePlayerHands(gameState);
  allIssues.push(...handsCheck.issues);
  
  return {
    valid: allIssues.length === 0,
    issues: allIssues,
  };
}
