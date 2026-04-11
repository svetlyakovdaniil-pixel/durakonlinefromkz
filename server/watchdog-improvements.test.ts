import { describe, it, expect, beforeEach } from 'vitest';
import {
  ImprovedWatchdog,
  validateAttackerDefender,
  validateBattlefield,
  validatePlayerHands,
  validateGameState,
} from './watchdog-improvements';
import { createGame } from './gameEngine';
import type { Player, GameState } from '../shared/gameTypes';

function createTestPlayers(count: number): Player[] {
  const players: Player[] = [];
  for (let i = 0; i < count; i++) {
    players.push({
      id: `player-${i}`,
      name: `Player ${i}`,
      hand: [],
      isBot: false,
      isOut: false,
      leftGame: false,
      winPlace: null,
      displayName: `Player ${i}`,
      profileImageUrl: '',
      shanyrakBalance: 0,
      consecutiveTimeouts: {},
    });
  }
  return players;
}

describe('ImprovedWatchdog', () => {
  let watchdog: ImprovedWatchdog;
  
  beforeEach(() => {
    watchdog = new ImprovedWatchdog();
  });
  
  it('should detect partial reconnects', () => {
    const mockSocket = {
      connected: true,
      rooms: new Set(['room-1']),
    };
    
    // Socket in room - not a partial reconnect
    expect(watchdog.detectPartialReconnect(mockSocket, 'room-1', 'Player 1')).toBe(false);
    
    // Socket not in room - partial reconnect
    mockSocket.rooms.delete('room-1');
    expect(watchdog.detectPartialReconnect(mockSocket, 'room-1', 'Player 1')).toBe(true);
  });
  
  it('should track progress and reset stale detection', () => {
    const roomId = 'room-1';
    
    // Initially not stale
    expect(watchdog.isStale(roomId)).toBe(false);
    
    // Mark progress
    watchdog.markProgress(roomId);
    expect(watchdog.isStale(roomId)).toBe(false);
  });
  
  it('should record and check partial reconnects', () => {
    const roomId = 'room-1';
    const playerId = 'player-1';
    
    expect(watchdog.hasPartialReconnectRecord(roomId, playerId)).toBe(false);
    
    watchdog.recordPartialReconnect(roomId, playerId);
    expect(watchdog.hasPartialReconnectRecord(roomId, playerId)).toBe(true);
    
    watchdog.cleanup(roomId);
    expect(watchdog.hasPartialReconnectRecord(roomId, playerId)).toBe(false);
  });
});

describe('Game State Validation', () => {
  let gameState: GameState;
  
  beforeEach(() => {
    const players = createTestPlayers(2);
    gameState = createGame('room-1', players);
  });
  
  it('should validate attacker/defender consistency', () => {
    const result = validateAttackerDefender(gameState);
    expect(result.valid).toBe(true);
    
    // Mark attacker as out
    gameState.players[gameState.currentAttackerIdx].isOut = true;
    const result2 = validateAttackerDefender(gameState);
    expect(result2.valid).toBe(false);
    expect(result2.issue).toContain('out');
  });
  
  it('should validate battlefield consistency', () => {
    gameState.gamePhase = 'finished';
    gameState.battleField.push({
      attack: { id: 'card-1', suit: 'hearts', rank: '6', copy: 0 },
      defense: null,
    });
    
    const result = validateBattlefield(gameState);
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });
  
  it('should detect duplicate cards on battlefield', () => {
    const card = { id: 'card-1', suit: 'hearts', rank: '6', copy: 0 };
    gameState.battleField.push({
      attack: card,
      defense: null,
    });
    gameState.battleField.push({
      attack: card,
      defense: null,
    });
    
    const result = validateBattlefield(gameState);
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.includes('Duplicate'))).toBe(true);
  });
  
  it('should validate player hands have no duplicates', () => {
    const card = { id: 'card-1', suit: 'hearts', rank: '6', copy: 0 };
    gameState.players[0].hand.push(card);
    gameState.players[1].hand.push(card);
    
    const result = validatePlayerHands(gameState);
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.includes('multiple'))).toBe(true);
  });
  
  it('should perform comprehensive game state validation', () => {
    const result = validateGameState(gameState);
    expect(result.valid).toBe(true);
    
    // Make it invalid
    gameState.players[gameState.currentAttackerIdx].isOut = true;
    const result2 = validateGameState(gameState);
    expect(result2.valid).toBe(false);
    expect(result2.issues.length).toBeGreaterThan(0);
  });
  
  it('should allow cards on battlefield during defend phase', () => {
    gameState.turnPhase = 'defend';
    gameState.battleField.push({
      attack: { id: 'card-1', suit: 'hearts', rank: '6', copy: 0 },
      defense: null,
    });
    
    const result = validateBattlefield(gameState);
    expect(result.valid).toBe(true);
  });
});
