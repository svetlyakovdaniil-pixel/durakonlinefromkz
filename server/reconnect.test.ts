import { describe, it, expect } from 'vitest';
import {
  createGame,
  playAttackCard,
  playDefenseCard,
  getAvailableActions,
  toClientState,
  endAttack,
  takeCards,
} from './gameEngine';
import type { GameState } from '../shared/gameTypes';

// Tests for reconnect scenarios and error message localization

function createTestPlayers(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    odId: `p${i + 1}`,
    name: `Player ${i + 1}`,
    isBot: false,
  }));
}

describe('Reconnect scenario: stale card replay', () => {
  it('playing a card that was already played returns Russian error', () => {
    const players = createTestPlayers(2);
    const game = createGame('room1', players);
    const attackerIdx = game.currentAttackerIdx;

    // Attacker plays a card successfully
    const card = game.players[attackerIdx].hand[0];
    const firstError = playAttackCard(game, attackerIdx, card.id);
    expect(firstError).toBeNull();
    expect(game.battleField.length).toBe(1);

    // Simulate reconnect: attacker tries to play the same card again (stale sendBuffer)
    const secondError = playAttackCard(game, attackerIdx, card.id);
    expect(secondError).not.toBeNull();
    // Error must be in Russian (not English)
    expect(secondError).toBe('Такой карты нет в руке');
    expect(secondError).not.toMatch(/[A-Z][a-z]+ [a-z]+ [a-z]+/); // No English phrases
  });

  it('defender playing already-played card returns Russian error', () => {
    const players = createTestPlayers(2);
    const game = createGame('room1', players);
    const attackerIdx = game.currentAttackerIdx;
    const defenderIdx = game.currentDefenderIdx;

    // Attacker plays a card
    const attackCard = game.players[attackerIdx].hand[0];
    playAttackCard(game, attackerIdx, attackCard.id);

    // Find a valid defense card
    const defActions = getAvailableActions(game, defenderIdx);
    const defPlayCard = defActions.find(a => a.type === 'playCard');

    if (defPlayCard && defPlayCard.cardIds.length > 0) {
      const defCardId = defPlayCard.cardIds[0];

      // Defender plays the card successfully
      const firstError = playDefenseCard(game, defenderIdx, defCardId, 0);
      expect(firstError).toBeNull();

      // Simulate reconnect: defender tries to play the same card again (stale sendBuffer)
      const secondError = playDefenseCard(game, defenderIdx, defCardId, 0);
      expect(secondError).not.toBeNull();
      expect(secondError).toBe('Такой карты нет в руке');
    }
  });

  it('all gameEngine error messages are in Russian', () => {
    const players = createTestPlayers(2);
    const game = createGame('room1', players);
    const attackerIdx = game.currentAttackerIdx;
    const defenderIdx = game.currentDefenderIdx;

    const errors: string[] = [];

    // Test various error conditions
    errors.push(playAttackCard(game, attackerIdx, 'nonexistent-id') ?? '');
    errors.push(playAttackCard(game, defenderIdx, game.players[defenderIdx].hand[0].id) ?? '');
    errors.push(endAttack(game, attackerIdx) ?? '');

    // All errors should be non-empty strings in Russian (no pure English phrases)
    for (const err of errors) {
      if (err) {
        // Should not start with a capital English word followed by English words
        expect(err).not.toMatch(/^[A-Z][a-z]+ [a-z]/);
      }
    }
  });

  it('endAttack error is in Russian', () => {
    const players = createTestPlayers(2);
    const game = createGame('room1', players);
    const attackerIdx = game.currentAttackerIdx;

    const error = endAttack(game, attackerIdx);
    expect(error).toBe('На столе нет карт');
  });
});

describe('Reconnect scenario: game state consistency after reconnect', () => {
  it('toClientState returns correct hand after card was played', () => {
    const players = createTestPlayers(2);
    const game = createGame('room1', players);
    const attackerIdx = game.currentAttackerIdx;
    const attackerId = game.players[attackerIdx].id;

    const initialHandSize = game.players[attackerIdx].hand.length;
    const card = game.players[attackerIdx].hand[0];

    // Attacker plays a card
    playAttackCard(game, attackerIdx, card.id);

    // Simulate reconnect: server sends fresh gameStateUpdate
    const clientState = toClientState(game, attackerId);

    // Card should NOT be in hand anymore
    expect(clientState.myHand.length).toBe(initialHandSize - 1);
    expect(clientState.myHand.find(c => c.id === card.id)).toBeUndefined();

    // Card should be on battlefield
    expect(clientState.battleField.length).toBe(1);
    expect(clientState.battleField[0].attack.id).toBe(card.id);
  });

  it('availableActions in gameStateUpdate are correct after reconnect', () => {
    const players = createTestPlayers(2);
    const game = createGame('room1', players);
    const attackerIdx = game.currentAttackerIdx;
    const defenderIdx = game.currentDefenderIdx;
    const attackerId = game.players[attackerIdx].id;
    const defenderId = game.players[defenderIdx].id;

    // Attacker plays a card
    const card = game.players[attackerIdx].hand[0];
    playAttackCard(game, attackerIdx, card.id);

    // Simulate reconnect for attacker — they should NOT have playCard actions for the played card
    const attackerClientState = toClientState(game, attackerId);
    const attackerActions = getAvailableActions(game, attackerIdx);
    const playCardAction = attackerActions.find(a => a.type === 'playCard');

    if (playCardAction) {
      // The played card should not be in available actions
      expect(playCardAction.cardIds).not.toContain(card.id);
    }

    // Simulate reconnect for defender — they should have defend actions
    const defenderActions = getAvailableActions(game, defenderIdx);
    const defenderPlayCard = defenderActions.find(a => a.type === 'playCard');
    const canTake = defenderActions.some(a => a.type === 'takeCards');

    // Defender should have either playCard or takeCards
    expect(defenderPlayCard !== undefined || canTake).toBe(true);
  });

  it('defender taking state is preserved across reconnect', () => {
    const players = createTestPlayers(2);
    const game = createGame('room1', players);
    const attackerIdx = game.currentAttackerIdx;
    const defenderIdx = game.currentDefenderIdx;
    const defenderId = game.players[defenderIdx].id;

    // Setup: attacker plays, defender decides to take
    game.players[attackerIdx].hand[0] = { id: 'test-atk', suit: 'spades', rank: '9', copy: 0 };
    game.firstTrick = false;
    playAttackCard(game, attackerIdx, 'test-atk');
    takeCards(game);

    expect(game.defenderTaking).toBe(true);

    // Simulate reconnect: server sends fresh gameStateUpdate
    const clientState = toClientState(game, defenderId);

    // defenderTaking should be preserved
    expect(clientState.defenderTaking).toBe(true);

    // Defender should NOT have playCard actions (already decided to take)
    const defenderActions = getAvailableActions(game, defenderIdx);
    const hasPlayCard = defenderActions.some(a => a.type === 'playCard');
    expect(hasPlayCard).toBe(false);
  });
});

describe('Reconnect scenario: sendBuffer clearing prevents double-play', () => {
  it('playing a card twice (simulating stale sendBuffer) returns correct Russian error', () => {
    const players = createTestPlayers(2);
    const game = createGame('room1', players);
    const attackerIdx = game.currentAttackerIdx;

    const card = game.players[attackerIdx].hand[0];

    // First play succeeds
    const error1 = playAttackCard(game, attackerIdx, card.id);
    expect(error1).toBeNull();

    // Second play (from stale sendBuffer after reconnect) fails with Russian error
    const error2 = playAttackCard(game, attackerIdx, card.id);
    expect(error2).toBe('Такой карты нет в руке');
    expect(typeof error2).toBe('string');

    // Game state should be unchanged (card still on battlefield from first play)
    expect(game.battleField.length).toBe(1);
    expect(game.battleField[0].attack.id).toBe(card.id);
  });

  it('game state is authoritative after reconnect — hand reflects actual state', () => {
    const players = createTestPlayers(2);
    const game = createGame('room1', players);
    const attackerIdx = game.currentAttackerIdx;
    const attackerId = game.players[attackerIdx].id;

    const initialHandSize = game.players[attackerIdx].hand.length;

    // Play one card
    const card1 = game.players[attackerIdx].hand[0];
    const err = playAttackCard(game, attackerIdx, card1.id);
    expect(err).toBeNull();

    // Simulate reconnect: server sends authoritative state
    const clientState = toClientState(game, attackerId);

    // Played card should be gone from hand
    expect(clientState.myHand.length).toBe(initialHandSize - 1);
    expect(clientState.myHand.find(c => c.id === card1.id)).toBeUndefined();

    // Card should be on battlefield
    expect(clientState.battleField.length).toBe(1);
    expect(clientState.battleField[0].attack.id).toBe(card1.id);
  });
});
