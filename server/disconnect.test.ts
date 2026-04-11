import { describe, it, expect, beforeEach } from 'vitest';
import { createGame, forfeitPlayer, getNextActivePlayer } from './gameEngine';
import type { GameState, Player } from '../shared/gameTypes';

// Tests for disconnect/reconnect scenarios

function createTestPlayers(count: number, withBots = false) {
  return Array.from({ length: count }, (_, i) => ({
    id: withBots && i > 0 ? `bot-${i}` : `p${i + 1}`,
    odId: withBots && i > 0 ? `bot-${i}` : `p${i + 1}`,
    name: withBots && i > 0 ? `Bot ${i}` : `Player ${i + 1}`,
    isBot: withBots && i > 0,
  }));
}

describe('Disconnect/Reconnect Scenarios', () => {
  let game: GameState;

  beforeEach(() => {
    const players = createTestPlayers(2);
    game = createGame('room1', players);
  });

  it('should handle defender disconnect correctly', () => {
    const defenderIdx = game.currentDefenderIdx;
    const defender = game.players[defenderIdx];
    const initialAttackerIdx = game.currentAttackerIdx;

    // Defender forfeits (simulating disconnect timeout)
    forfeitPlayer(game, defenderIdx);

    // Defender should be marked as out and left
    expect(defender.isOut).toBe(true);
    expect(defender.leftGame).toBe(true);

    // Defender should be marked as loser (only 1 active player left)
    expect(game.loserId).toBe(defender.id);

    // Battlefield should be cleared
    expect(game.battleField.length).toBe(0);
  });

  it('should handle attacker disconnect correctly', () => {
    const attackerIdx = game.currentAttackerIdx;
    const attacker = game.players[attackerIdx];

    // Attacker forfeits
    forfeitPlayer(game, attackerIdx);

    // Attacker should be marked as out
    expect(attacker.isOut).toBe(true);
    expect(attacker.leftGame).toBe(true);

    // Attacker should be marked as loser
    expect(game.loserId).toBe(attacker.id);
  });

  it('should correctly identify remaining active players after forfeit', () => {
    const initialActiveCount = game.players.filter(p => !p.isOut).length;
    expect(initialActiveCount).toBe(2);

    const firstPlayerIdx = 0;
    forfeitPlayer(game, firstPlayerIdx);

    // In a 2-player game, when one forfeits, the other becomes the loser (0 active)
    const remainingActive = game.players.filter(p => !p.isOut).length;
    expect(remainingActive).toBe(0);
  });

  it('should not double-forfeit a player', () => {
    const playerIdx = 0;
    const player = game.players[playerIdx];

    // First forfeit
    forfeitPlayer(game, playerIdx);
    expect(player.isOut).toBe(true);
    const firstLoserId = game.loserId;

    // Second forfeit attempt (should be no-op)
    forfeitPlayer(game, playerIdx);
    expect(game.loserId).toBe(firstLoserId);
  });

  it('should handle 3-player game with one disconnect', () => {
    const players = createTestPlayers(3);
    game = createGame('room1', players);

    const activeBeforeForfeit = game.players.filter(p => !p.isOut).length;
    expect(activeBeforeForfeit).toBe(3);

    // First player forfeits
    forfeitPlayer(game, 0);

    const activeAfterForfeit = game.players.filter(p => !p.isOut).length;
    expect(activeAfterForfeit).toBe(2);

    // Game should not be over yet (multiple players still active)
    expect(game.loserId).toBeNull();
    expect(game.forfeitOrder).toContain(game.players[0].id);

    // Second player forfeits
    forfeitPlayer(game, 1);

    const activeAfterSecondForfeit = game.players.filter(p => !p.isOut).length;
    // After second forfeit, all players are out (only the last one remains but is marked as loser)
    expect(activeAfterSecondForfeit).toBe(0);

    // Now the second player should be marked as loser (only 1 active left)
    expect(game.loserId).toBe(game.players[1].id);
  });

  it('should preserve player hand state before forfeit', () => {
    const playerIdx = 0;
    const player = game.players[playerIdx];
    const initialHandSize = player.hand.length;

    expect(initialHandSize).toBeGreaterThan(0);

    forfeitPlayer(game, playerIdx);

    // Hand should be moved to discard pile
    expect(player.hand.length).toBe(0);
    expect(game.discardPile.length).toBeGreaterThanOrEqual(initialHandSize);
  });

  it('should handle defender forfeit during active battle', () => {
    const attackerIdx = game.currentAttackerIdx;
    const defenderIdx = game.currentDefenderIdx;

    // Play a card from attacker
    const cardToPlay = game.players[attackerIdx].hand[0];
    game.battleField.push({
      attack: cardToPlay,
      defense: null,
    });
    game.players[attackerIdx].hand = game.players[attackerIdx].hand.filter(c => c.id !== cardToPlay.id);

    expect(game.battleField.length).toBe(1);

    // Defender forfeits
    forfeitPlayer(game, defenderIdx);

    // Battlefield should be cleared
    expect(game.battleField.length).toBe(0);
    expect(game.discardPile.length).toBeGreaterThan(0);
  });

  it('should track forfeit order for place assignment', () => {
    const players = createTestPlayers(3);
    game = createGame('room1', players);

    forfeitPlayer(game, 0);
    expect(game.forfeitOrder).toBeDefined();
    expect(game.forfeitOrder).toContain(game.players[0].id);

    forfeitPlayer(game, 1);
    // After second forfeit, player 1 becomes loser (only 1 active left)
    // So forfeitOrder should only have player 0
    expect(game.forfeitOrder).toContain(game.players[0].id);
    expect(game.loserId).toBe(game.players[1].id);
  });

  it('should handle passthrough cards on defender disconnect', () => {
    const defenderIdx = game.currentDefenderIdx;
    const defender = game.players[defenderIdx];

    // Add a passthrough card
    if (defender.hand.length > 0) {
      const passThroughCard = defender.hand[0];
      game.revealedPassThroughs = [{
        playerId: defender.id,
        cards: [passThroughCard],
      }];
    }

    forfeitPlayer(game, defenderIdx);

    // Passthrough should be cleared when defender forfeits
    const hasDefenderPassthrough = game.revealedPassThroughs.some(
      r => r.playerId === defender.id
    );
    expect(hasDefenderPassthrough).toBe(false);
  });

  it('should ensure valid attacker/defender after forfeit', () => {
    const players = createTestPlayers(3);
    game = createGame('room1', players);

    const defenderIdx = game.currentDefenderIdx;
    forfeitPlayer(game, defenderIdx);

    // After forfeit, attacker and defender should still be valid indices
    expect(game.currentAttackerIdx).toBeGreaterThanOrEqual(0);
    expect(game.currentAttackerIdx).toBeLessThan(game.players.length);
    expect(game.currentDefenderIdx).toBeGreaterThanOrEqual(0);
    expect(game.currentDefenderIdx).toBeLessThan(game.players.length);

    // Both should be active players
    expect(game.players[game.currentAttackerIdx].isOut).toBe(false);
    expect(game.players[game.currentDefenderIdx].isOut).toBe(false);
  });
});
