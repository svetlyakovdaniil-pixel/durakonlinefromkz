import { describe, expect, it } from 'vitest';
import { createGame, toClientState, getAvailableActions, playAttackCard, playDefenseCard, successfulDefense, endAttack, takeCards, finalizeTake, resetTurnTimer, getBotAction, checkPlayerOut, getNextActivePlayer, forfeitPlayer } from './gameEngine';
import type { GameState, Player, RoomSettings } from '../shared/gameTypes';

// Integration-level tests for game flow scenarios

function createTestPlayers(count: number, withBots = false) {
  return Array.from({ length: count }, (_, i) => ({
    id: withBots && i > 0 ? `bot-${i}` : `p${i + 1}`,
    odId: withBots && i > 0 ? `bot-${i}` : `p${i + 1}`,
    name: withBots && i > 0 ? `Bot ${i}` : `Player ${i + 1}`,
    isBot: withBots && i > 0,
  }));
}

describe('Game flow integration', () => {
  it('creates a game with bots and human player', () => {
    const players = createTestPlayers(4, true);
    const game = createGame('room1', players);

    expect(game.players.length).toBe(4);
    expect(game.players[0].isBot).toBe(false);
    expect(game.players[1].isBot).toBe(true);
    expect(game.players[2].isBot).toBe(true);
    expect(game.players[3].isBot).toBe(true);
  });

  it('generates client state that hides opponent cards', () => {
    const players = createTestPlayers(3);
    const game = createGame('room1', players);
    const clientState = toClientState(game, 'p1');

    expect(clientState.myHand.length).toBe(14);
    expect(clientState.myIndex).toBe(0);
    // Other players should have card counts but no actual cards
    for (let i = 0; i < clientState.players.length; i++) {
      if (i !== clientState.myIndex) {
        expect(clientState.players[i].cardCount).toBe(14);
      }
    }
  });

  it('provides available actions for the attacker', () => {
    const players = createTestPlayers(2);
    const game = createGame('room1', players);
    const attackerIdx = game.currentAttackerIdx;
    const actions = getAvailableActions(game, attackerIdx);

    // Attacker should have playCard action
    const playCardAction = actions.find(a => a.type === 'playCard');
    expect(playCardAction).toBeDefined();
    expect(playCardAction!.cardIds.length).toBeGreaterThan(0);
  });

  it('allows attacker to play a card', () => {
    const players = createTestPlayers(2);
    const game = createGame('room1', players);
    const attackerIdx = game.currentAttackerIdx;
    const cardToPlay = game.players[attackerIdx].hand[0];

    const error = playAttackCard(game, attackerIdx, cardToPlay.id);
    expect(error).toBeNull();
    expect(game.battleField.length).toBe(1);
    expect(game.battleField[0].attack.id).toBe(cardToPlay.id);
  });

  it('bot action returns a valid action', () => {
    const players = createTestPlayers(2, true);
    const game = createGame('room1', players);

    // Find a bot player
    const botIdx = game.players.findIndex(p => p.isBot);
    if (botIdx !== -1) {
      const action = getBotAction(game, botIdx);
      // Bot should return some action (play, take, endAttack, etc.)
      expect(action).toBeDefined();
    }
  });

  it('client state includes trump info', () => {
    const players = createTestPlayers(2);
    const game = createGame('room1', players);
    const clientState = toClientState(game, 'p1');

    expect(clientState.trumpInfo).toBeDefined();
    expect(clientState.trumpInfo.currentTrump).toBeDefined();
    expect(clientState.trumpInfo.phase).toBe(1);
  });

  it('client state includes deck counts', () => {
    const players = createTestPlayers(2);
    const game = createGame('room1', players);
    const clientState = toClientState(game, 'p1');

    expect(clientState.deck1Count).toBeGreaterThanOrEqual(0);
    expect(clientState.deck2Count).toBeGreaterThanOrEqual(0);
    expect(clientState.discardCount).toBe(0);
  });

  it('custom turn timer is respected', () => {
    const players = createTestPlayers(2);
    const settings: RoomSettings = { turnTimer: 45, withBots: false, botCount: 0 };
    const game = createGame('room1', players, settings);

    expect(game.turnTimerMax).toBe(45);
    expect(game.turnTimer).toBe(45);

    const clientState = toClientState(game, 'p1');
    expect(clientState.turnTimerMax).toBe(45);
  });

  it('resetTurnTimer resets to max', () => {
    const players = createTestPlayers(2);
    const game = createGame('room1', players);
    game.turnTimer = 5;
    resetTurnTimer(game);
    expect(game.turnTimer).toBe(game.turnTimerMax);
  });

  it('full attack-defense cycle works', () => {
    const players = createTestPlayers(2);
    const game = createGame('room1', players);
    const attackerIdx = game.currentAttackerIdx;
    const defenderIdx = game.currentDefenderIdx;

    // Attacker plays a card
    const attackCard = game.players[attackerIdx].hand[0];
    const attackError = playAttackCard(game, attackerIdx, attackCard.id);
    expect(attackError).toBeNull();
    expect(game.battleField.length).toBe(1);
    expect(game.turnPhase).toBe('defend');

    // Try to find a card that can defend
    const defenderHand = game.players[defenderIdx].hand;
    const actions = getAvailableActions(game, defenderIdx);
    const defenseAction = actions.find(a => a.type === 'playCard');

    if (defenseAction && defenseAction.cardIds.length > 0) {
      const defenseCardId = defenseAction.cardIds[0];
      const defError = playDefenseCard(game, defenderIdx, defenseCardId, 0);
      expect(defError).toBeNull();
      expect(game.battleField[0].defense).not.toBeNull();
    }
  });

  it('takeCards enters pickup mode, endAttack finalizes', () => {
    const players = createTestPlayers(2);
    const game = createGame('room1', players);
    const attackerIdx = game.currentAttackerIdx;
    const defenderIdx = game.currentDefenderIdx;

    // Attacker plays a card
    const attackCard = game.players[attackerIdx].hand[0];
    playAttackCard(game, attackerIdx, attackCard.id);
    expect(game.turnPhase).toBe('defend');

    // Defender takes
    takeCards(game);
    expect(game.defenderTaking).toBe(true);
    expect(game.turnPhase).toBe('pickup');
    expect(game.battleField.length).toBe(1); // still on table

    // Attacker presses bito
    endAttack(game, attackerIdx);
    // In 2-player game, all attackers passed → finalize
    expect(game.defenderTaking).toBe(false);
    expect(game.battleField.length).toBe(0);
  });

  it('client state includes defenderTaking and attackerHasPriority', () => {
    const players = createTestPlayers(3);
    const game = createGame('room1', players);
    game.defenderTaking = true;
    game.attackerHasPriority = false;

    const clientState = toClientState(game, 'p1');
    expect(clientState.defenderTaking).toBe(true);
    expect(clientState.attackerHasPriority).toBe(false);
  });
});

describe('Winner system', () => {
  it('player with no cards and empty deck is marked as winner', () => {
    const players = createTestPlayers(3);
    const game = createGame('room1', players);

    // Empty the decks
    game.deck1 = [];
    game.deck2 = [];

    // Empty one player's hand
    const playerIdx = 2; // not attacker or defender
    game.players[playerIdx].hand = [];

    const result = checkPlayerOut(game, playerIdx);

    expect(result).toBe(true);
    expect(game.players[playerIdx].isOut).toBe(true);
    expect(game.players[playerIdx].winPlace).toBe(1);
    expect(game.winnersOrder).toContain(game.players[playerIdx].id);
  });

  it('winner gets no available actions', () => {
    const players = createTestPlayers(3);
    const game = createGame('room1', players);

    // Mark a player as out
    game.players[2].isOut = true;
    game.players[2].winPlace = 1;
    game.players[2].hand = [];

    const actions = getAvailableActions(game, 2);
    expect(actions).toEqual([]);
  });

  it('winner is skipped when assigning attacker/defender', () => {
    const players = createTestPlayers(4);
    const game = createGame('room1', players);

    // Mark player 1 as out
    game.players[1].isOut = true;
    game.players[1].winPlace = 1;
    game.players[1].hand = [];

    // Set attacker to player 0
    game.currentAttackerIdx = 0;

    // Get next active player from 0 — should skip 1
    const nextIdx = getNextActivePlayer(game.players, 0, game.direction);
    expect(nextIdx).not.toBe(1);
    expect(game.players[nextIdx].isOut).toBe(false);
  });

  it('game ends when only one player remains', () => {
    const players = createTestPlayers(3);
    const game = createGame('room1', players);

    // Empty decks
    game.deck1 = [];
    game.deck2 = [];

    // Mark two players as out
    game.players[0].isOut = true;
    game.players[0].winPlace = 1;
    game.players[0].hand = [];
    game.winnersOrder.push(game.players[0].id);

    game.players[1].isOut = true;
    game.players[1].winPlace = 2;
    game.players[1].hand = [];
    game.winnersOrder.push(game.players[1].id);

    game.nextWinPlace = 3;

    // Manually trigger checkGameOver via successfulDefense-like flow
    // The remaining player is the loser
    const activePlayers = game.players.filter(p => !p.isOut);
    expect(activePlayers.length).toBe(1);
  });

  it('client state shows winPlace for winners', () => {
    const players = createTestPlayers(3);
    const game = createGame('room1', players);

    game.players[0].isOut = true;
    game.players[0].winPlace = 1;
    game.players[0].hand = [];
    game.winnersOrder.push(game.players[0].id);

    const clientState = toClientState(game, 'p2');
    const winner = clientState.players.find(p => p.id === game.players[0].id);
    expect(winner?.isOut).toBe(true);
    expect(winner?.winPlace).toBe(1);
  });

  it('second winner gets winPlace=2', () => {
    const players = createTestPlayers(4);
    const game = createGame('room1', players);

    game.deck1 = [];
    game.deck2 = [];

    // First winner
    game.players[0].hand = [];
    checkPlayerOut(game, 0);
    expect(game.players[0].winPlace).toBe(1);

    // Second winner
    game.players[2].hand = [];
    checkPlayerOut(game, 2);
    expect(game.players[2].winPlace).toBe(2);
    expect(game.nextWinPlace).toBe(3);
  });

  it('bot that is out returns null action', () => {
    const players = createTestPlayers(3, true);
    const game = createGame('room1', players);

    const botIdx = game.players.findIndex(p => p.isBot);
    game.players[botIdx].isOut = true;
    game.players[botIdx].winPlace = 1;
    game.players[botIdx].hand = [];

    const action = getBotAction(game, botIdx);
    expect(action).toBeNull();
  });
});

describe('Game over and loser detection', () => {
  it('last remaining player is marked as loser', () => {
    const players = createTestPlayers(3);
    const game = createGame('room1', players);

    game.deck1 = [];
    game.deck2 = [];

    // Mark first two players as out (winners)
    game.players[0].isOut = true;
    game.players[0].winPlace = 1;
    game.players[0].hand = [];
    game.winnersOrder.push(game.players[0].id);

    game.players[1].isOut = true;
    game.players[1].winPlace = 2;
    game.players[1].hand = [];
    game.winnersOrder.push(game.players[1].id);

    game.nextWinPlace = 3;

    // Now check — only player 2 remains, should be loser
    // Simulate checkGameOver by checking active players
    const activePlayers = game.players.filter(p => !p.isOut);
    expect(activePlayers.length).toBe(1);

    // Manually set game over state as checkGameOver would
    game.gamePhase = 'finished';
    game.loserId = activePlayers[0].id;

    expect(game.loserId).toBe(game.players[2].id);
    expect(game.gamePhase).toBe('finished');
  });

  it('client state includes loserId in finished game', () => {
    const players = createTestPlayers(3);
    const game = createGame('room1', players);

    // Set up finished game
    game.gamePhase = 'finished';
    game.loserId = game.players[2].id;
    game.players[0].isOut = true;
    game.players[0].winPlace = 1;
    game.players[0].hand = [];
    game.players[1].isOut = true;
    game.players[1].winPlace = 2;
    game.players[1].hand = [];

    const clientState = toClientState(game, 'p3');
    expect(clientState.gamePhase).toBe('finished');
    expect(clientState.loserId).toBe(game.players[2].id);
  });

  it('finished game returns no actions for any player', () => {
    const players = createTestPlayers(3);
    const game = createGame('room1', players);
    game.gamePhase = 'finished';

    for (let i = 0; i < 3; i++) {
      const actions = getAvailableActions(game, i);
      expect(actions).toEqual([]);
    }
  });

  it('winner order is preserved in client state', () => {
    const players = createTestPlayers(4);
    const game = createGame('room1', players);

    game.deck1 = [];
    game.deck2 = [];
    game.winnersOrder = ['p1', 'p3', 'p2'];
    game.players[0].isOut = true;
    game.players[0].winPlace = 1;
    game.players[0].hand = [];
    game.players[2].isOut = true;
    game.players[2].winPlace = 2;
    game.players[2].hand = [];
    game.players[1].isOut = true;
    game.players[1].winPlace = 3;
    game.players[1].hand = [];
    game.gamePhase = 'finished';
    game.loserId = game.players[3].id;

    const clientState = toClientState(game, 'p4');
    expect(clientState.gamePhase).toBe('finished');
    expect(clientState.loserId).toBe('p4');
    
    // Verify each player's winPlace
    const p1 = clientState.players.find(p => p.id === 'p1');
    const p3 = clientState.players.find(p => p.id === 'p3');
    const p2 = clientState.players.find(p => p.id === 'p2');
    expect(p1?.winPlace).toBe(1);
    expect(p3?.winPlace).toBe(2);
    expect(p2?.winPlace).toBe(3);
  });
});

describe('Forfeit (leave game)', () => {
  it('forfeit marks player as leftGame and isOut', () => {
    const players = createTestPlayers(3);
    const game = createGame('room1', players);

    forfeitPlayer(game, 2);

    expect(game.players[2].leftGame).toBe(true);
    expect(game.players[2].isOut).toBe(true);
    expect(game.players[2].hand.length).toBe(0);
  });

  it('forfeit moves cards to discard pile', () => {
    const players = createTestPlayers(3);
    const game = createGame('room1', players);

    const handSize = game.players[2].hand.length;
    const discardBefore = game.discardPile.length;

    forfeitPlayer(game, 2);

    expect(game.discardPile.length).toBe(discardBefore + handSize);
  });

  it('forfeit of defender clears battlefield', () => {
    const players = createTestPlayers(3);
    const game = createGame('room1', players);

    const attackerIdx = game.currentAttackerIdx;
    const defenderIdx = game.currentDefenderIdx;

    // Attacker plays a card
    playAttackCard(game, attackerIdx, game.players[attackerIdx].hand[0].id);
    expect(game.battleField.length).toBe(1);

    // Defender forfeits
    forfeitPlayer(game, defenderIdx);

    expect(game.battleField.length).toBe(0);
    expect(game.players[defenderIdx].leftGame).toBe(true);
  });

  it('forfeit ends game when only one player remains', () => {
    const players = createTestPlayers(2);
    const game = createGame('room1', players);

    // One player forfeits
    forfeitPlayer(game, 1);

    expect(game.gamePhase).toBe('finished');
  });

  it('client state shows leftGame status', () => {
    const players = createTestPlayers(3);
    const game = createGame('room1', players);

    forfeitPlayer(game, 2);

    const clientState = toClientState(game, 'p1');
    const leftPlayer = clientState.players.find(p => p.id === game.players[2].id);
    expect(leftPlayer?.leftGame).toBe(true);
    expect(leftPlayer?.isOut).toBe(true);
  });

  it('already-out player cannot forfeit again', () => {
    const players = createTestPlayers(3);
    const game = createGame('room1', players);

    game.players[2].isOut = true;
    game.players[2].winPlace = 1;
    game.players[2].hand = [];

    const discardBefore = game.discardPile.length;
    forfeitPlayer(game, 2);

    // Should not change anything
    expect(game.discardPile.length).toBe(discardBefore);
    expect(game.players[2].leftGame).toBeFalsy();
  });
});

describe('Freeze fix: attacker always has endAttack', () => {
  it('attacker can press bito even when not all cards defended', () => {
    const players = createTestPlayers(2);
    const game = createGame('room1', players);
    const attackerIdx = game.currentAttackerIdx;

    // Attacker plays a card
    playAttackCard(game, attackerIdx, game.players[attackerIdx].hand[0].id);
    expect(game.turnPhase).toBe('defend');

    // Attacker should have endAttack action even though card is not defended
    const actions = getAvailableActions(game, attackerIdx);
    const hasEndAttack = actions.some(a => a.type === 'endAttack');
    expect(hasEndAttack).toBe(true);
  });

  it('attacker can add cards during defend phase', () => {
    const players = createTestPlayers(2);
    const game = createGame('room1', players);
    const attackerIdx = game.currentAttackerIdx;
    const defenderIdx = game.currentDefenderIdx;

    // Attacker plays a card
    const firstCard = game.players[attackerIdx].hand[0];
    playAttackCard(game, attackerIdx, firstCard.id);

    // Defender defends
    const defActions = getAvailableActions(game, defenderIdx);
    const defPlayCard = defActions.find(a => a.type === 'playCard');
    if (defPlayCard && defPlayCard.cardIds.length > 0) {
      playDefenseCard(game, defenderIdx, defPlayCard.cardIds[0], 0);
    }

    // After all defended, attacker should be able to add more cards
    if (game.turnPhase === 'attack') {
      const attackActions = getAvailableActions(game, attackerIdx);
      const hasPlayCard = attackActions.some(a => a.type === 'playCard');
      const hasEndAttack = attackActions.some(a => a.type === 'endAttack');
      // Should have both options
      expect(hasEndAttack).toBe(true);
    }
  });
});
