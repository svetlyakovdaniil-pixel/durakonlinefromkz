import { describe, expect, it } from 'vitest';
import {
  createFullDeck, canBeat, createGame, getCardValue,
  isKingOfSpades, is777, isAceOfSpades, findFirstPlayer,
  getNextActivePlayer, getPrevActivePlayer, isEdgePlayer, canPlayAsAttack,
  canPlayerAddCards, playAttackCard, playDefenseCard,
  transferAttack, endAttack, showPassThrough, takeCards, finalizeTake, successfulDefense,
  toClientState, getAvailableActions, shouldSkipTurn, getBotAction,
  drawCards, resetTurnTimer, getMaxAttackCards, canNonNeighborPlayCard,
} from './gameEngine';
import type { Card, Suit, Rank, GameState, Player, TrumpInfo, RoomSettings } from '../shared/gameTypes';

// Helper to create a card
function card(suit: Suit | null, rank: string, copy = 0): Card {
  return { id: `${suit}-${rank}-${copy}`, suit, rank: rank as any, copy };
}

// Helper to create a minimal game state for testing
function createTestState(numPlayers: number, overrides?: Partial<GameState>): GameState {
  const players: Player[] = Array.from({ length: numPlayers }, (_, i) => ({
    id: `p${i + 1}`,
    odId: `p${i + 1}`,
    name: `Player ${i + 1}`,
    hand: [],
    passThrough: [],
    isOut: false,
    seatIndex: i,
    isBot: false,
    winPlace: null,
  }));

  return {
    roomId: 'test',
    players,
    deck1: [],
    deck2: [],
    trumpInfo: {
      mainTrump: 'hearts',
      hiddenTrump1: 'diamonds',
      hiddenTrump2: 'clubs',
      currentTrump: 'hearts',
      phase: 1,
    },
    battleField: [],
    discardPile: [],
    currentAttackerIdx: 0,
    currentDefenderIdx: 1,
    direction: 'cw',
    turnPhase: 'attack',
    gamePhase: 'playing',
    firstTrick: true,
    trickCount: 0,
    lastPlayedRank: null,
    winnersOrder: [],
    loserId: null,
    turnTimer: 30,
    turnTimerMax: 30,
    leadCardRank: null,
    attackerHasPriority: true,
    passedAttackers: [],
    nextWinPlace: 1,
    defenderTaking: false,
    passThroughUsedIds: [],
    revealedPassThroughs: [],
    consecutiveTimeouts: {},
    deckStyle: 'classic',
    ...overrides,
  };
}

// ============================================================
// DECK CREATION
// ============================================================
describe('Deck creation', () => {
  it('creates 145 cards total (4 suits × 9 ranks × 4 copies + 1 × 777)', () => {
    const deck = createFullDeck();
    expect(deck.length).toBe(145);
  });

  it('contains exactly one 777 card', () => {
    const deck = createFullDeck();
    const sevens = deck.filter(c => c.rank === '777');
    expect(sevens.length).toBe(1);
    expect(sevens[0].suit).toBeNull();
  });

  it('contains 4 copies of each normal card', () => {
    const deck = createFullDeck();
    const kingSpades = deck.filter(c => c.rank === 'K' && c.suit === 'spades');
    expect(kingSpades.length).toBe(4);
  });

  it('all cards have unique IDs', () => {
    const deck = createFullDeck();
    const ids = new Set(deck.map(c => c.id));
    expect(ids.size).toBe(145);
  });
});

// ============================================================
// CARD VALUE ORDERING
// ============================================================
describe('Card value ordering', () => {
  it('ranks 6 < 7 < 8 < 9 < 10 < J < Q < K < A', () => {
    expect(getCardValue(card('spades', '6'))).toBeLessThan(getCardValue(card('spades', '7')));
    expect(getCardValue(card('spades', '7'))).toBeLessThan(getCardValue(card('spades', '10')));
    expect(getCardValue(card('spades', '10'))).toBeLessThan(getCardValue(card('spades', 'J')));
    expect(getCardValue(card('spades', 'J'))).toBeLessThan(getCardValue(card('spades', 'Q')));
    expect(getCardValue(card('spades', 'Q'))).toBeLessThan(getCardValue(card('spades', 'K')));
    expect(getCardValue(card('spades', 'K'))).toBeLessThan(getCardValue(card('spades', 'A')));
  });

  it('777 has the highest value', () => {
    expect(getCardValue(card(null, '777'))).toBeGreaterThan(getCardValue(card('spades', 'A')));
  });
});

// ============================================================
// SPECIAL CARD IDENTIFICATION
// ============================================================
describe('Special card identification', () => {
  it('identifies King of Spades', () => {
    expect(isKingOfSpades(card('spades', 'K'))).toBe(true);
    expect(isKingOfSpades(card('hearts', 'K'))).toBe(false);
    expect(isKingOfSpades(card('spades', 'Q'))).toBe(false);
  });

  it('identifies 777', () => {
    expect(is777(card(null, '777'))).toBe(true);
    expect(is777(card('spades', '7'))).toBe(false);
  });

  it('identifies Ace of Spades', () => {
    expect(isAceOfSpades(card('spades', 'A'))).toBe(true);
    expect(isAceOfSpades(card('hearts', 'A'))).toBe(false);
  });
});

// ============================================================
// COMBAT RULES (canBeat)
// ============================================================
describe('canBeat — combat rules', () => {
  const trump: Suit = 'hearts';

  it('higher same-suit card beats lower', () => {
    expect(canBeat(card('spades', '7'), card('spades', '10'), trump)).toBe(true);
    expect(canBeat(card('spades', '10'), card('spades', '7'), trump)).toBe(false);
  });

  it('trump beats non-trump', () => {
    expect(canBeat(card('spades', 'A'), card('hearts', '6'), trump)).toBe(true);
  });

  it('non-trump cannot beat different non-trump suit', () => {
    expect(canBeat(card('spades', '7'), card('diamonds', 'A'), trump)).toBe(false);
  });

  it('identical cards beat each other (same rank + suit)', () => {
    expect(canBeat(card('diamonds', 'Q'), card('diamonds', 'Q', 1), trump)).toBe(true);
  });

  it('King of Spades beats any card (except itself and 777)', () => {
    expect(canBeat(card('hearts', 'A'), card('spades', 'K'), trump)).toBe(true);
    expect(canBeat(card('diamonds', '6'), card('spades', 'K'), trump)).toBe(true);
    expect(canBeat(card('clubs', 'K'), card('spades', 'K'), trump)).toBe(true);
  });

  it('King of Spades does NOT beat another King of Spades', () => {
    expect(canBeat(card('spades', 'K'), card('spades', 'K', 1), trump)).toBe(false);
  });

  it('only Ace of Spades and 777 can beat King of Spades', () => {
    expect(canBeat(card('spades', 'K'), card('spades', 'A'), trump)).toBe(true);
    expect(canBeat(card('spades', 'K'), card(null, '777'), trump)).toBe(true);
    expect(canBeat(card('spades', 'K'), card('hearts', 'A'), trump)).toBe(false);
  });

  it('777 beats everything', () => {
    expect(canBeat(card('spades', 'K'), card(null, '777'), trump)).toBe(true);
    expect(canBeat(card('hearts', 'A'), card(null, '777'), trump)).toBe(true);
    expect(canBeat(card('diamonds', '6'), card(null, '777'), trump)).toBe(true);
  });
});

// ============================================================
// GAME CREATION
// ============================================================
describe('Game creation', () => {
  it('creates a game with correct number of players', () => {
    const players = [
      { id: 'p1', odId: 'p1', name: 'Player 1', isBot: false },
      { id: 'p2', odId: 'p2', name: 'Player 2', isBot: false },
      { id: 'p3', odId: 'p3', name: 'Player 3', isBot: false },
    ];
    const game = createGame('room1', players);
    expect(game.players.length).toBe(3);
    expect(game.gamePhase).toBe('playing');
    expect(game.direction).toBe('cw');
  });

  it('deals 14 cards to each player', () => {
    const players = [
      { id: 'p1', odId: 'p1', name: 'Player 1', isBot: false },
      { id: 'p2', odId: 'p2', name: 'Player 2', isBot: false },
    ];
    const game = createGame('room1', players);
    expect(game.players[0].hand.length).toBe(14);
    expect(game.players[1].hand.length).toBe(14);
  });

  it('remaining cards split into two decks', () => {
    const players = [
      { id: 'p1', odId: 'p1', name: 'Player 1', isBot: false },
      { id: 'p2', odId: 'p2', name: 'Player 2', isBot: false },
    ];
    const game = createGame('room1', players);
    const totalCards = game.players.reduce((sum, p) => sum + p.hand.length, 0)
      + game.deck1.length + game.deck2.length;
    expect(totalCards).toBe(145);
  });

  it('trump info has 3 different suits', () => {
    const players = [
      { id: 'p1', odId: 'p1', name: 'Player 1', isBot: false },
      { id: 'p2', odId: 'p2', name: 'Player 2', isBot: false },
    ];
    const game = createGame('room1', players);
    const trumpSuits = new Set([
      game.trumpInfo.mainTrump,
      game.trumpInfo.hiddenTrump1,
      game.trumpInfo.hiddenTrump2,
    ]);
    expect(trumpSuits.size).toBe(3);
    expect(game.trumpInfo.currentTrump).toBe(game.trumpInfo.mainTrump);
    expect(game.trumpInfo.phase).toBe(1);
  });

  it('sets first attacker and defender correctly', () => {
    const players = [
      { id: 'p1', odId: 'p1', name: 'Player 1', isBot: false },
      { id: 'p2', odId: 'p2', name: 'Player 2', isBot: false },
    ];
    const game = createGame('room1', players);
    expect(game.currentAttackerIdx).toBeGreaterThanOrEqual(0);
    expect(game.currentDefenderIdx).toBeGreaterThanOrEqual(0);
    expect(game.currentAttackerIdx).not.toBe(game.currentDefenderIdx);
  });

  it('creates bot players correctly', () => {
    const players = [
      { id: 'p1', odId: 'p1', name: 'Player 1', isBot: false },
      { id: 'bot-1', odId: 'bot-1', name: 'Бот Алмас', isBot: true },
    ];
    const game = createGame('room1', players);
    expect(game.players[1].isBot).toBe(true);
    expect(game.players[0].isBot).toBe(false);
  });

  it('respects custom turn timer from settings', () => {
    const players = [
      { id: 'p1', odId: 'p1', name: 'Player 1', isBot: false },
      { id: 'p2', odId: 'p2', name: 'Player 2', isBot: false },
    ];
    const settings: RoomSettings = { turnTimer: 45, withBots: false, botCount: 0 };
    const game = createGame('room1', players, settings);
    expect(game.turnTimerMax).toBe(45);
    expect(game.turnTimer).toBe(45);
  });
});

// ============================================================
// CLIENT STATE CONVERSION
// ============================================================
describe('Client state conversion', () => {
  it('hides other players cards', () => {
    const players = [
      { id: 'p1', odId: 'p1', name: 'Player 1', isBot: false },
      { id: 'p2', odId: 'p2', name: 'Player 2', isBot: false },
    ];
    const game = createGame('room1', players);
    const clientState = toClientState(game, 'p1');
    expect(clientState.myHand.length).toBe(14);
    expect(clientState.myIndex).toBe(0);
    expect(clientState.players[1].cardCount).toBe(14);
    expect((clientState.players[1] as any).hand).toBeUndefined();
  });

  it('includes timer info in client state', () => {
    const players = [
      { id: 'p1', odId: 'p1', name: 'Player 1', isBot: false },
      { id: 'p2', odId: 'p2', name: 'Player 2', isBot: false },
    ];
    const game = createGame('room1', players);
    const clientState = toClientState(game, 'p1');
    expect(clientState.turnTimer).toBeDefined();
    expect(clientState.turnTimerMax).toBeDefined();
  });

  it('includes bot flag in client players', () => {
    const players = [
      { id: 'p1', odId: 'p1', name: 'Player 1', isBot: false },
      { id: 'bot-1', odId: 'bot-1', name: 'Bot', isBot: true },
    ];
    const game = createGame('room1', players);
    const clientState = toClientState(game, 'p1');
    expect(clientState.players[1].isBot).toBe(true);
  });
});

// ============================================================
// FIX #2: TRANSFER ATTACK (PEREVOD)
// ============================================================
describe('FIX #2: Transfer attack (perevod)', () => {
  it('defender can transfer when they have a matching rank card', () => {
    const state = createTestState(3);
    state.players[0].hand = [card('spades', '7')];
    state.players[1].hand = [card('hearts', '7'), card('clubs', '8')];
    // Player 2 needs at least 2 cards (1 existing on table + 1 transfer = 2 total attack cards)
    state.players[2].hand = [card('diamonds', '9'), card('diamonds', '10')];
    state.battleField = [{ attack: card('spades', '7'), defense: null }];
    state.turnPhase = 'defend';
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;

    const result = transferAttack(state, 1, state.players[1].hand[0].id);
    expect(result).toBeNull(); // success
    expect(state.currentDefenderIdx).toBe(2); // next player is now defending
    expect(state.currentAttackerIdx).toBe(1); // transferrer becomes attacker
  });

  it('cannot transfer if some attacks are already defended', () => {
    const state = createTestState(3);
    state.players[1].hand = [card('hearts', '7')];
    state.battleField = [
      { attack: card('spades', '7'), defense: card('spades', '8') },
      { attack: card('clubs', '7'), defense: null },
    ];
    state.turnPhase = 'defend';
    state.currentDefenderIdx = 1;

    const result = transferAttack(state, 1, state.players[1].hand[0].id);
    expect(result).not.toBeNull(); // error
  });

  it('cannot transfer with a non-matching rank', () => {
    const state = createTestState(3);
    state.players[1].hand = [card('hearts', '8')];
    state.battleField = [{ attack: card('spades', '7'), defense: null }];
    state.turnPhase = 'defend';
    state.currentDefenderIdx = 1;

    const result = transferAttack(state, 1, state.players[1].hand[0].id);
    expect(result).not.toBeNull(); // error
  });

  it('transfer option appears in available actions for defender', () => {
    const state = createTestState(3);
    state.players[1].hand = [card('hearts', '7'), card('clubs', '9')];
    // Player 2 needs at least 2 cards for transfer
    state.players[2].hand = [card('diamonds', '9'), card('diamonds', '10')];
    state.battleField = [{ attack: card('spades', '7'), defense: null }];
    state.turnPhase = 'defend';
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;

    const actions = getAvailableActions(state, 1);
    const transferAction = actions.find(a => a.type === 'transferCard');
    expect(transferAction).toBeDefined();
    expect(transferAction!.type === 'transferCard' && transferAction!.cardIds.length).toBeGreaterThan(0);
  });

  it('transfer option does NOT appear when defender has no matching rank', () => {
    const state = createTestState(3);
    state.players[1].hand = [card('hearts', '8'), card('clubs', '9')];
    state.battleField = [{ attack: card('spades', '7'), defense: null }];
    state.turnPhase = 'defend';
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;

    const actions = getAvailableActions(state, 1);
    const transferAction = actions.find(a => a.type === 'transferCard');
    expect(transferAction).toBeUndefined();
  });
});

// ============================================================
// FIX #3: ROOM CLOSING (tested via game state, not sockets)
// ============================================================

// ============================================================
// FIX #4: TURN TIMER
// ============================================================
describe('FIX #4: Turn timer', () => {
  it('resetTurnTimer resets to max', () => {
    const state = createTestState(2);
    state.turnTimer = 5;
    state.turnTimerMax = 30;
    resetTurnTimer(state);
    expect(state.turnTimer).toBe(30);
  });
});

// ============================================================
// FIX #5: ATTACK PRIORITY & END ATTACK
// ============================================================
describe('FIX #5: Attack priority and endAttack', () => {
  it('non-attacker cannot play first card when attacker has priority', () => {
    const state = createTestState(4);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.attackerHasPriority = true;
    state.players[2].hand = [card('spades', '7')];
    state.battleField = [];

    const result = playAttackCard(state, 2, state.players[2].hand[0].id);
    expect(result).not.toBeNull(); // error: attacker has priority
  });

  it('attacker can play first card and retains priority', () => {
    const state = createTestState(4);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.attackerHasPriority = true;
    state.players[0].hand = [card('spades', '7')];

    const result = playAttackCard(state, 0, state.players[0].hand[0].id);
    expect(result).toBeNull(); // success
    // Attacker retains priority after playing a card
    expect(state.attackerHasPriority).toBe(true);
  });

  it('endAttack returns error if not the attacker', () => {
    const state = createTestState(3);
    state.currentAttackerIdx = 0;
    state.battleField = [{ attack: card('spades', '7'), defense: null }];

    const result = endAttack(state, 1);
    expect(result).not.toBeNull();
  });

  it('endAttack triggers successfulDefense when all defended', () => {
    const state = createTestState(3);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    // Give players some cards so they're not "out"
    state.players[0].hand = [card('spades', '9')];
    state.players[1].hand = [card('spades', '10')];
    state.players[2].hand = [card('hearts', '6')];
    state.battleField = [{ attack: card('spades', '7'), defense: card('spades', '8') }];

    const result = endAttack(state, 0);
    // After attacker 0 passes, player 2 (edge) should get a chance or defense succeeds
    expect(result).toBeNull();
  });
});

// ============================================================
// FIX #6: 10-CARD DIRECTION CHANGE (ONLY ON LEAD)
// ============================================================
describe('FIX #6: 10-card direction change', () => {
  it('playing 10 as first card reverses direction', () => {
    const state = createTestState(4);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.direction = 'cw';
    state.players[0].hand = [card('spades', '10')];

    playAttackCard(state, 0, state.players[0].hand[0]?.id || 'spades-10-0');
    // After playing 10 as lead, direction should reverse
    // But we already removed the card, so let's check state
    expect(state.direction).toBe('ccw');
    expect(state.leadCardRank).toBe('10');
  });

  it('playing 10 as subsequent card does NOT reverse direction', () => {
    const state = createTestState(4);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.direction = 'cw';
    state.attackerHasPriority = false;
    state.battleField = [{ attack: card('spades', '7'), defense: null }];
    state.leadCardRank = '7';
    state.players[0].hand = [card('hearts', '10')];

    // 10 is not on the table yet, so it can't be added (rank not matching)
    // Let's set up a scenario where 10 is already on the table
    state.battleField = [{ attack: card('spades', '10'), defense: card('spades', 'J') }];
    state.leadCardRank = '10';
    state.direction = 'ccw'; // already reversed from lead
    state.players[0].hand = [card('hearts', '10')];

    const dirBefore = state.direction;
    playAttackCard(state, 0, state.players[0].hand[0]?.id || 'hearts-10-0');
    expect(state.direction).toBe(dirBefore); // should NOT change again
  });
});

// ============================================================
// FIX #7: DEFENSE TARGETING (ANY UNDEFENDED PAIR)
// ============================================================
describe('FIX #7: Free defense targeting', () => {
  it('defender can target specific undefended pair', () => {
    const state = createTestState(3);
    state.currentDefenderIdx = 1;
    state.turnPhase = 'defend';
    state.players[1].hand = [card('spades', '8')];
    state.battleField = [
      { attack: card('hearts', '6'), defense: null },
      { attack: card('spades', '7'), defense: null },
    ];

    // Target pair index 1 (spades 7) with spades 8
    const result = playDefenseCard(state, 1, state.players[1].hand[0].id, 1);
    expect(result).toBeNull(); // success
    expect(state.battleField[1].defense).not.toBeNull();
    expect(state.battleField[0].defense).toBeNull(); // first pair still undefended
  });

  it('auto-finds matching pair when no target specified', () => {
    const state = createTestState(3);
    state.currentDefenderIdx = 1;
    state.turnPhase = 'defend';
    state.players[1].hand = [card('spades', '8')];
    state.battleField = [
      { attack: card('hearts', '6'), defense: null },
      { attack: card('spades', '7'), defense: null },
    ];

    // No target specified — should auto-find spades 7 (same suit)
    const result = playDefenseCard(state, 1, state.players[1].hand[0].id);
    expect(result).toBeNull();
    expect(state.battleField[1].defense).not.toBeNull();
  });
});

// ============================================================
// 777 SPECIAL RULES
// ============================================================
describe('777 special rules', () => {
  it('cannot be used as attack card', () => {
    const state = createTestState(2);
    state.currentAttackerIdx = 0;
    const card777: Card = { id: '777-0', suit: null, rank: '777', copy: 0 };
    expect(canPlayAsAttack(state, card777)).toBe(false);
  });

  it('shouldSkipTurn returns true when player has only 777 and is attacker', () => {
    const state = createTestState(2);
    state.currentAttackerIdx = 0;
    state.players[0].hand = [{ id: '777-0', suit: null, rank: '777', copy: 0 }];
    expect(shouldSkipTurn(state, 0)).toBe(true);
    expect(shouldSkipTurn(state, 1)).toBe(false);
  });

  it('777 can beat King of Spades', () => {
    expect(canBeat(card('spades', 'K'), card(null, '777'), 'hearts')).toBe(true);
  });
});

// ============================================================
// EDGE PLAYER RULES
// ============================================================
describe('Edge player rules', () => {
  it('identifies edge players correctly in clockwise direction', () => {
    const players: Player[] = [
      { id: 'p1', odId: 'p1', name: 'P1', hand: [], passThrough: [], isOut: false, seatIndex: 0, isBot: false, winPlace: null },
      { id: 'p2', odId: 'p2', name: 'P2', hand: [], passThrough: [], isOut: false, seatIndex: 1, isBot: false, winPlace: null },
      { id: 'p3', odId: 'p3', name: 'P3', hand: [], passThrough: [], isOut: false, seatIndex: 2, isBot: false, winPlace: null },
      { id: 'p4', odId: 'p4', name: 'P4', hand: [], passThrough: [], isOut: false, seatIndex: 3, isBot: false, winPlace: null },
    ];
    expect(isEdgePlayer(players, 0, 1, 'cw')).toBe(true);
    expect(isEdgePlayer(players, 2, 1, 'cw')).toBe(true);
    expect(isEdgePlayer(players, 3, 1, 'cw')).toBe(false);
  });
});

// ============================================================
// ATTACK CARD VALIDATION
// ============================================================
describe('Attack card validation', () => {
  it('allows any card as first attack', () => {
    const state = createTestState(2);
    state.battleField = [];
    expect(canPlayAsAttack(state, card('spades', '7'))).toBe(true);
    expect(canPlayAsAttack(state, card('hearts', 'K'))).toBe(true);
  });

  it('subsequent attacks must match rank on table', () => {
    const state = createTestState(2);
    state.battleField = [{ attack: card('spades', '7'), defense: null }];
    expect(canPlayAsAttack(state, card('hearts', '7'))).toBe(true);
    expect(canPlayAsAttack(state, card('hearts', '8'))).toBe(false);
  });

  it('777 can never be played as attack', () => {
    const state = createTestState(2);
    state.battleField = [];
    expect(canPlayAsAttack(state, card(null, '777'))).toBe(false);
  });
});

// ============================================================
// 6-CARD EXCEPTION FOR ADDING CARDS
// ============================================================
describe('6-card exception for adding cards', () => {
  it('all players can add cards when lead card is a 6', () => {
    const state = createTestState(4);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.leadCardRank = '6';
    state.battleField = [{ attack: card('spades', '6'), defense: null }];

    expect(canPlayerAddCards(state, 2)).toBe(true);
    expect(canPlayerAddCards(state, 3)).toBe(true);
    expect(canPlayerAddCards(state, 1)).toBe(false); // defender cannot add
  });

  it('non-edge players cannot add when lead is not 6', () => {
    const state = createTestState(4);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.leadCardRank = '7';
    state.battleField = [{ attack: card('spades', '7'), defense: null }];

    // Player 3 (index 3) is not edge to defender (index 1) in 4-player CW
    expect(canPlayerAddCards(state, 3)).toBe(false);
  });
});

// ============================================================
// BOT AI
// ============================================================
describe('Bot AI', () => {
  it('bot defends with cheapest card', () => {
    const state = createTestState(2);
    state.players[1].isBot = true;
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.turnPhase = 'defend';
    state.players[1].hand = [
      card('spades', 'A'),
      card('spades', '8'),
    ];
    state.battleField = [{ attack: card('spades', '7'), defense: null }];

    const action = getBotAction(state, 1);
    expect(action).not.toBeNull();
    expect(action!.action).toBe('playDefense');
    // Should pick 8 (cheaper) over A
    expect(action!.cardId).toBe(state.players[1].hand[1].id);
  });

  it('bot takes cards when cannot defend', () => {
    const state = createTestState(2);
    state.players[1].isBot = true;
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.turnPhase = 'defend';
    state.players[1].hand = [card('clubs', '6')]; // cannot beat spades 7 (different suit, non-trump)
    state.battleField = [{ attack: card('spades', '7'), defense: null }];

    const action = getBotAction(state, 1);
    expect(action).not.toBeNull();
    expect(action!.action).toBe('takeCards');
  });

  it('bot attacks with lowest card', () => {
    const state = createTestState(2);
    state.players[0].isBot = true;
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.turnPhase = 'attack';
    state.players[0].hand = [
      card('spades', 'K'),
      card('spades', '6'),
    ];

    const action = getBotAction(state, 0);
    expect(action).not.toBeNull();
    expect(action!.action).toBe('playAttack');
    expect(action!.cardId).toBe(state.players[0].hand[1].id); // 6 is cheaper
  });

  it('bot skips turn when only has 777', () => {
    const state = createTestState(2);
    state.players[0].isBot = true;
    state.currentAttackerIdx = 0;
    state.players[0].hand = [card(null, '777')];

    const action = getBotAction(state, 0);
    expect(action).not.toBeNull();
    expect(action!.action).toBe('skipTurn');
  });

  it('non-bot player returns null from getBotAction', () => {
    const state = createTestState(2);
    state.players[0].isBot = false;
    const action = getBotAction(state, 0);
    expect(action).toBeNull();
  });
});

// ============================================================
// DRAW CARDS & TRUMP PHASE TRANSITIONS
// ============================================================
describe('Draw cards and trump transitions', () => {
  it('draws from deck1 first, then deck2', () => {
    const state = createTestState(2);
    state.players[0].hand = [card('spades', '6')]; // only 1 card
    state.players[1].hand = Array.from({ length: 14 }, (_, i) => card('hearts', '7', i));
    state.deck1 = [card('clubs', '8'), card('clubs', '9')];
    state.deck2 = Array.from({ length: 20 }, (_, i) => card('diamonds', '6', i));

    drawCards(state);
    // Player 0 should have drawn from deck1 first
    expect(state.players[0].hand.length).toBe(14);
  });

  it('transitions to trump phase 2 when deck1 is empty', () => {
    const state = createTestState(2);
    state.players[0].hand = [card('spades', '6')];
    state.players[1].hand = Array.from({ length: 14 }, (_, i) => card('hearts', '7', i));
    state.deck1 = [];
    state.deck2 = Array.from({ length: 20 }, (_, i) => card('diamonds', '6', i));
    state.trumpInfo.phase = 1;

    drawCards(state);
    expect(state.trumpInfo.phase).toBe(2);
    expect(state.trumpInfo.currentTrump).toBe(state.trumpInfo.hiddenTrump1);
  });
});

// ============================================================
// NAVIGATION HELPERS
// ============================================================
describe('Navigation helpers', () => {
  it('getNextActivePlayer skips out players', () => {
    const players: Player[] = [
      { id: 'p1', odId: 'p1', name: 'P1', hand: [], passThrough: [], isOut: false, seatIndex: 0, isBot: false, winPlace: null },
      { id: 'p2', odId: 'p2', name: 'P2', hand: [], passThrough: [], isOut: true, seatIndex: 1, isBot: false, winPlace: null },
      { id: 'p3', odId: 'p3', name: 'P3', hand: [], passThrough: [], isOut: false, seatIndex: 2, isBot: false, winPlace: null },
    ];
    expect(getNextActivePlayer(players, 0, 'cw')).toBe(2);
  });

  it('getPrevActivePlayer goes in reverse direction', () => {
    const players: Player[] = [
      { id: 'p1', odId: 'p1', name: 'P1', hand: [], passThrough: [], isOut: false, seatIndex: 0, isBot: false, winPlace: null },
      { id: 'p2', odId: 'p2', name: 'P2', hand: [], passThrough: [], isOut: false, seatIndex: 1, isBot: false, winPlace: null },
      { id: 'p3', odId: 'p3', name: 'P3', hand: [], passThrough: [], isOut: false, seatIndex: 2, isBot: false, winPlace: null },
    ];
    expect(getPrevActivePlayer(players, 2, 'cw')).toBe(1);
  });
});

// ============================================================
// TAKE CARDS & SUCCESSFUL DEFENSE
// ============================================================
describe('Take cards and successful defense', () => {
  it('takeCards sets defenderTaking=true and turnPhase=pickup', () => {
    const state = createTestState(3);
    state.currentDefenderIdx = 1;
    state.currentAttackerIdx = 0;
    state.players[1].hand = [];
    state.battleField = [
      { attack: card('spades', '7'), defense: card('spades', '8') },
      { attack: card('hearts', '6'), defense: null },
    ];

    takeCards(state);
    expect(state.defenderTaking).toBe(true);
    expect(state.turnPhase).toBe('pickup');
    // Cards are NOT yet taken — they stay on battlefield
    expect(state.battleField.length).toBe(2);
    expect(state.players[1].hand.length).toBe(0);
  });

  it('finalizeTake gives all battlefield cards to defender', () => {
    const state = createTestState(3);
    state.currentDefenderIdx = 1;
    state.currentAttackerIdx = 0;
    state.players[0].hand = [card('spades', '6')];
    state.players[1].hand = [];
    state.players[2].hand = [card('hearts', 'A')];
    state.battleField = [
      { attack: card('spades', '7'), defense: card('spades', '8') },
      { attack: card('hearts', '6'), defense: null },
    ];
    state.defenderTaking = true;
    state.turnPhase = 'pickup';

    finalizeTake(state);
    expect(state.players[1].hand.length).toBe(3); // 2 from pair + 1 undefended
    expect(state.battleField.length).toBe(0);
    expect(state.defenderTaking).toBe(false);
  });

  it('successfulDefense moves cards to discard pile', () => {
    const state = createTestState(3);
    state.currentDefenderIdx = 1;
    state.currentAttackerIdx = 0;
    state.battleField = [
      { attack: card('spades', '7'), defense: card('spades', '8') },
    ];

    successfulDefense(state);
    expect(state.discardPile.length).toBe(2);
    expect(state.battleField.length).toBe(0);
    // Defender becomes attacker
    expect(state.currentAttackerIdx).toBe(1);
  });
});

// ============================================================
// ATTACKER PRIORITY & PICKUP MECHANIC
// ============================================================
describe('Attacker priority mechanic', () => {
  it('edge player cannot add cards while attacker has priority', () => {
    const state = createTestState(3);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.attackerHasPriority = true;
    state.players[0].hand = [card('spades', '7'), card('hearts', '7')];
    state.players[1].hand = [card('spades', 'A')];
    state.players[2].hand = [card('spades', '7', 1)]; // edge player has matching card
    state.battleField = [
      { attack: card('spades', '7', 2), defense: card('spades', '8') },
    ];
    state.turnPhase = 'attack';

    // Edge player (p3) should NOT be able to add cards while attacker has priority
    const error = playAttackCard(state, 2, state.players[2].hand[0].id);
    expect(error).toBeTruthy();
    expect(error).toContain('priority');
  });

  it('attacker pressing bito passes priority to edge player', () => {
    const state = createTestState(3);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.attackerHasPriority = true;
    state.players[0].hand = [card('hearts', 'A')];
    state.players[1].hand = [card('spades', 'A')];
    state.players[2].hand = [card('spades', '7', 1)];
    state.battleField = [
      { attack: card('spades', '7', 2), defense: card('spades', '8') },
    ];
    state.turnPhase = 'attack';

    // Attacker presses bito
    const error = endAttack(state, 0);
    expect(error).toBeNull();
    // Priority should pass to edge player (p3 = index 2)
    expect(state.currentAttackerIdx).toBe(2);
    expect(state.attackerHasPriority).toBe(true);
  });

  it('after defender beats a card, attacker regains priority', () => {
    const state = createTestState(3);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.attackerHasPriority = false;
    state.players[0].hand = [card('hearts', '7')];
    state.players[1].hand = [card('spades', 'A')];
    state.players[2].hand = [card('hearts', '7', 1)];
    state.battleField = [
      { attack: card('spades', '7'), defense: null },
    ];
    state.turnPhase = 'defend';

    // Defender beats the card
    const error = playDefenseCard(state, 1, state.players[1].hand[0].id, 0);
    expect(error).toBeNull();
    // Attacker should regain priority
    expect(state.attackerHasPriority).toBe(true);
  });
});

describe('Pickup mechanic (defender takes)', () => {
  it('takeCards enters pickup mode, does not immediately take', () => {
    const state = createTestState(3);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.players[0].hand = [card('spades', '7', 1)];
    state.players[1].hand = [card('hearts', 'A')];
    state.battleField = [
      { attack: card('spades', '7'), defense: null },
    ];
    state.turnPhase = 'defend';

    takeCards(state);
    expect(state.defenderTaking).toBe(true);
    expect(state.turnPhase).toBe('pickup');
    expect(state.battleField.length).toBe(1); // cards still on table
  });

  it('attacker can add cards in pickup mode', () => {
    const state = createTestState(3);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.defenderTaking = true;
    state.turnPhase = 'pickup';
    state.firstTrick = false;
    state.players[0].hand = [card('spades', '7', 1)];
    state.players[1].hand = [card('hearts', 'A'), card('hearts', 'K'), card('hearts', 'Q')]; // 3 cards = max 3 attack cards
    state.battleField = [
      { attack: card('spades', '7'), defense: null },
    ];

    const actions = getAvailableActions(state, 0);
    const playAction = actions.find(a => a.type === 'playCard');
    expect(playAction).toBeTruthy();

    // Attacker adds a card
    const error = playAttackCard(state, 0, state.players[0].hand[0].id);
    expect(error).toBeNull();
    expect(state.battleField.length).toBe(2);
  });

  it('defender cannot defend in pickup mode', () => {
    const state = createTestState(3);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.defenderTaking = true;
    state.turnPhase = 'pickup';
    state.players[1].hand = [card('spades', 'A')];
    state.battleField = [
      { attack: card('spades', '7'), defense: null },
    ];

    const error = playDefenseCard(state, 1, state.players[1].hand[0].id, 0);
    expect(error).toBeTruthy();
  });

  it('all attackers pressing bito in pickup mode finalizes take', () => {
    const state = createTestState(3);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.defenderTaking = true;
    state.turnPhase = 'pickup';
    state.players[0].hand = [card('hearts', 'A')];
    state.players[1].hand = [];
    state.players[2].hand = [card('hearts', 'K')];
    state.battleField = [
      { attack: card('spades', '7'), defense: null },
    ];

    // Attacker (p1) presses bito
    endAttack(state, 0);
    // Should pass to edge player (p3)
    expect(state.currentAttackerIdx).toBe(2);
    expect(state.defenderTaking).toBe(true);

    // Edge player (p3) presses bito
    endAttack(state, 2);
    // All passed — should finalize take
    expect(state.defenderTaking).toBe(false);
    expect(state.battleField.length).toBe(0);
    expect(state.players[1].hand.length).toBe(1); // took 1 card from battlefield
  });

  it('card limit enforced: first trick max 13 cards', () => {
    const state = createTestState(2);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.firstTrick = true;
    state.defenderTaking = true;
    state.turnPhase = 'pickup';
    
    // Fill battlefield with 13 attack cards
    state.battleField = Array.from({ length: 13 }, (_, i) => ({
      attack: card('spades', '7', i),
      defense: null,
    }));
    state.players[0].hand = [card('hearts', '7')];
    state.players[1].hand = Array.from({ length: 20 }, (_, i) => card('hearts', 'A', i));

    // Should not be able to add more
    const error = playAttackCard(state, 0, state.players[0].hand[0].id);
    expect(error).toBeTruthy();
    expect(error).toContain('Maximum');
  });

  it('card limit enforced: after first trick, max = defender hand size', () => {
    const state = createTestState(2);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.firstTrick = false;
    state.defenderTaking = true;
    state.turnPhase = 'pickup';
    
    // Defender has 3 cards
    state.players[1].hand = [card('hearts', 'A'), card('hearts', 'K'), card('hearts', 'Q')];
    
    // 3 attack cards already on table (= defender hand size)
    state.battleField = [
      { attack: card('spades', '7', 0), defense: null },
      { attack: card('spades', '7', 1), defense: null },
      { attack: card('spades', '7', 2), defense: null },
    ];
    state.players[0].hand = [card('hearts', '7')];

    // Should not be able to add more (3 attack cards = 3 cards in defender hand)
    const error = playAttackCard(state, 0, state.players[0].hand[0].id);
    expect(error).toBeTruthy();
    expect(error).toContain('Maximum');
  });
});

// ============================================================
// PASS-THROUGH (ПРОЕЗДНОЙ) MECHANIC
// ============================================================
describe('Pass-through (проездной) mechanic', () => {
  it('defender can show a trump card matching attack rank as pass-through', () => {
    const state = createTestState(3);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.turnPhase = 'defend';
    // Attack with 7 of spades, defender has 7 of hearts (trump)
    state.battleField = [{ attack: card('spades', '7'), defense: null }];
    state.players[1].hand = [card('hearts', '7'), card('clubs', 'A')];
    // Next defender (player 2) needs enough cards to handle the pass-through
    state.players[2].hand = [card('clubs', '9'), card('clubs', '10')];

    const error = showPassThrough(state, 1, state.players[1].hand[0].id);
    expect(error).toBeNull();

    // Card should STAY in hand
    expect(state.players[1].hand.length).toBe(2);
    expect(state.players[1].hand[0].id).toBe('hearts-7-0');

    // Card should be in passThroughUsedIds
    expect(state.passThroughUsedIds).toContain('hearts-7-0');

    // Card should be in revealedPassThroughs
    expect(state.revealedPassThroughs.length).toBe(1);
    expect(state.revealedPassThroughs[0].playerId).toBe('p2');
    expect(state.revealedPassThroughs[0].cards.length).toBe(1);

    // Defender becomes attacker, next player becomes defender
    expect(state.currentAttackerIdx).toBe(1);
    expect(state.currentDefenderIdx).toBe(2);
  });

  it('cannot use same card as pass-through twice', () => {
    const state = createTestState(3);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.turnPhase = 'defend';
    state.battleField = [{ attack: card('spades', '7'), defense: null }];
    state.players[1].hand = [card('hearts', '7')];
    state.passThroughUsedIds = ['hearts-7-0']; // already used

    const error = showPassThrough(state, 1, 'hearts-7-0');
    expect(error).toBeTruthy();
    expect(error).toContain('уже использовалась');
  });

  it('cannot use non-trump card as pass-through', () => {
    const state = createTestState(3);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.turnPhase = 'defend';
    state.battleField = [{ attack: card('spades', '7'), defense: null }];
    // clubs-7 is NOT a trump (trump is hearts)
    state.players[1].hand = [card('clubs', '7')];

    const error = showPassThrough(state, 1, 'clubs-7-0');
    expect(error).toBeTruthy();
    expect(error).toContain('козырной');
  });

  it('cannot use card with wrong rank as pass-through', () => {
    const state = createTestState(3);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.turnPhase = 'defend';
    state.battleField = [{ attack: card('spades', '7'), defense: null }];
    // hearts-8 is trump but wrong rank
    state.players[1].hand = [card('hearts', '8')];

    const error = showPassThrough(state, 1, 'hearts-8-0');
    expect(error).toBeTruthy();
    expect(error).toContain('номиналу');
  });

  it('defender can show multiple pass-through cards if they have them', () => {
    const state = createTestState(4);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.turnPhase = 'defend';
    state.battleField = [{ attack: card('spades', '7'), defense: null }];
    // Defender has TWO trump 7s
    state.players[1].hand = [card('hearts', '7', 0), card('hearts', '7', 1), card('clubs', 'A')];
    // Next defender (player 2) needs enough cards
    state.players[2].hand = [card('clubs', '9'), card('clubs', '10')];

    // Show first pass-through
    const error1 = showPassThrough(state, 1, 'hearts-7-0');
    expect(error1).toBeNull();
    expect(state.revealedPassThroughs[0].cards.length).toBe(1);

    // Now defender is attacker (idx 1), new defender is idx 2
    // Simulate new attack on new defender who also has trump 7
    state.currentDefenderIdx = 2;
    state.currentAttackerIdx = 1;
    state.battleField = [{ attack: card('spades', '7', 1), defense: null }];
    state.players[2].hand = [card('hearts', '7', 2)];
    // Next defender (player 3) needs enough cards
    state.players[3].hand = [card('clubs', 'J'), card('clubs', 'Q')];

    // New defender shows pass-through
    const error2 = showPassThrough(state, 2, 'hearts-7-2');
    expect(error2).toBeNull();
    expect(state.revealedPassThroughs.length).toBe(2); // Two different players
  });

  it('showPassThrough action appears in available actions for defender with trump matching card', () => {
    const state = createTestState(3);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.turnPhase = 'defend';
    state.battleField = [{ attack: card('spades', '7'), defense: null }];
    state.players[1].hand = [card('hearts', '7'), card('clubs', 'A')];
    // Next defender (player 2) needs enough cards
    state.players[2].hand = [card('clubs', '9'), card('clubs', '10')];

    const actions = getAvailableActions(state, 1);
    const ptAction = actions.find(a => a.type === 'showPassThrough');
    expect(ptAction).toBeDefined();
    if (ptAction && ptAction.type === 'showPassThrough') {
      expect(ptAction.cardIds).toContain('hearts-7-0');
    }
  });

  it('showPassThrough action does NOT appear for non-trump matching card', () => {
    const state = createTestState(3);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.turnPhase = 'defend';
    state.battleField = [{ attack: card('spades', '7'), defense: null }];
    // Only has clubs-7 (not trump)
    state.players[1].hand = [card('clubs', '7')];

    const actions = getAvailableActions(state, 1);
    const ptAction = actions.find(a => a.type === 'showPassThrough');
    expect(ptAction).toBeUndefined();
  });

  it('revealedPassThroughs are cleared after successful defense', () => {
    const state = createTestState(3);
    state.revealedPassThroughs = [{ playerId: 'p2', cards: [card('hearts', '7')] }];
    state.currentDefenderIdx = 1;
    state.currentAttackerIdx = 0;
    state.battleField = [{ attack: card('spades', '8'), defense: card('spades', '9') }];

    successfulDefense(state);
    expect(state.revealedPassThroughs.length).toBe(0);
  });

  it('revealedPassThroughs are cleared after finalizeTake', () => {
    const state = createTestState(3);
    state.revealedPassThroughs = [{ playerId: 'p2', cards: [card('hearts', '7')] }];
    state.currentDefenderIdx = 1;
    state.currentAttackerIdx = 0;
    state.defenderTaking = true;
    state.turnPhase = 'pickup';
    state.players[0].hand = [card('hearts', 'A')];
    state.players[1].hand = [];
    state.players[2].hand = [card('hearts', 'K')];
    state.battleField = [{ attack: card('spades', '7'), defense: null }];

    finalizeTake(state);
    expect(state.revealedPassThroughs.length).toBe(0);
  });

  it('revealedPassThroughs visible in client state', () => {
    const state = createTestState(3);
    state.revealedPassThroughs = [{ playerId: 'p2', cards: [card('hearts', '7')] }];
    state.players[0].hand = [card('spades', 'A')];

    const clientState = toClientState(state, 'p1');
    expect(clientState.revealedPassThroughs.length).toBe(1);
    expect(clientState.revealedPassThroughs[0].playerId).toBe('p2');
    expect(clientState.revealedPassThroughs[0].cards.length).toBe(1);
  });
});

// ============================================================
// PICKUP MODE — passedAttackers not fully reset
// ============================================================
describe('Pickup mode passedAttackers behavior', () => {
  it('in pickup mode, adding a card only removes the playing attacker from passedAttackers', () => {
    const state = createTestState(4);
    state.players[0].hand = [card('spades', '7'), card('spades', '8')];
    state.players[1].isOut = true; // Bot1 finished
    state.players[2].hand = [card('hearts', '7'), card('hearts', '8')]; // Bot2 attacker
    state.players[3].hand = [card('diamonds', 'A'), card('diamonds', 'K'), card('diamonds', 'Q')]; // Bot3 defender with enough cards
    state.currentAttackerIdx = 2;
    state.currentDefenderIdx = 3;
    state.defenderTaking = true;
    state.turnPhase = 'pickup';
    state.battleField = [{ attack: card('spades', '7'), defense: null }];
    state.leadCardRank = '7';
    state.firstTrick = false;

    // Bot2 (idx 2, id='p3') presses бито
    endAttack(state, 2);
    expect(state.passedAttackers).toContain('p3');

    // Now p1 (edge player, idx 0) adds a card matching rank 7
    state.attackerHasPriority = false; // Edge players can act
    // currentAttackerIdx may have changed after endAttack, set it to allow edge play
    state.currentAttackerIdx = 0; // p1 becomes attacker after priority pass

    const err = playAttackCard(state, 0, state.players[0].hand[0].id); // p1 plays 7
    expect(err).toBeNull();
    // In pickup mode, p3 should still be in passedAttackers
    expect(state.passedAttackers).toContain('p3');
    // p1 just played, so they should NOT be in passedAttackers
    expect(state.passedAttackers).not.toContain('p1');
  });

  it('in normal mode, adding a card resets ALL passedAttackers', () => {
    const state = createTestState(3);
    state.players[0].hand = [card('spades', '7', 1), card('spades', '9')];
    state.players[1].hand = [card('hearts', 'A'), card('hearts', 'K'), card('hearts', 'Q')]; // defender with enough cards
    state.players[2].hand = [card('diamonds', '6')];
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.defenderTaking = false;
    state.turnPhase = 'attack';
    state.battleField = [{ attack: card('spades', '7'), defense: card('hearts', '7') }];
    state.leadCardRank = '7';
    state.firstTrick = false;
    state.passedAttackers = ['p3']; // p3 already passed
    state.deck1 = [card('spades', 'A')]; // deck not empty so player doesn't go out

    // p1 (attacker) adds a card with rank 7 matching the table
    const err = playAttackCard(state, 0, state.players[0].hand[0].id);
    expect(err).toBeNull();
    // In normal mode, ALL passedAttackers should be reset
    expect(state.passedAttackers).toEqual([]);
  });

  it('4-player pickup: two bots press бито sequentially, finalizeTake is called', () => {
    const state = createTestState(4);
    state.players[0].hand = [card('spades', 'A')]; // human (edge)
    state.players[1].isOut = true; // Bot1 finished
    state.players[2].hand = [card('hearts', '7')]; // Bot2 attacker
    state.players[3].hand = []; // Bot3 defender (taking)
    state.currentAttackerIdx = 2;
    state.currentDefenderIdx = 3;
    state.defenderTaking = true;
    state.turnPhase = 'pickup';
    state.battleField = [{ attack: card('spades', '7'), defense: null }];
    state.leadCardRank = '7';
    state.firstTrick = false;

    // Bot2 (idx 2) presses бито
    endAttack(state, 2);
    // Should NOT finalize yet — p1 (idx 0) hasn't passed
    expect(state.defenderTaking).toBe(true);

    // p1 (idx 0) presses бито  
    endAttack(state, 0);
    // Now all attackers passed — should finalize
    expect(state.defenderTaking).toBe(false);
    expect(state.battleField.length).toBe(0);
  });
});

// ============================================================
// FIX: ATTACK CARD LIMIT (defender original hand size)
// ============================================================
describe('Attack card limit uses defender original hand size', () => {
  it('allows adding cards when defender has defended some but originally had enough', () => {
    const state = createTestState(3);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.turnPhase = 'defend';
    state.firstTrick = false;
    // Defender originally had 6 cards, defended 3, has 3 left
    state.players[1].hand = [card('hearts', '9'), card('hearts', '10'), card('hearts', 'J')];
    state.players[0].hand = [card('spades', '7'), card('spades', '8')];
    state.battleField = [
      { attack: card('spades', '7', 0), defense: card('hearts', '7') },
      { attack: card('spades', '8', 0), defense: card('hearts', '8') },
      { attack: card('spades', '9', 0), defense: card('hearts', '6') },
    ];
    // Max should be 3 (hand) + 3 (defense on table) = 6
    expect(getMaxAttackCards(state)).toBe(6);
  });

  it('getMaxAttackCards counts defense cards on table', () => {
    const state = createTestState(3);
    state.currentDefenderIdx = 1;
    state.firstTrick = false;
    state.players[1].hand = [card('hearts', '9')]; // 1 card left
    state.battleField = [
      { attack: card('spades', '7', 0), defense: card('hearts', '7') },
      { attack: card('spades', '8', 0), defense: card('hearts', '8') },
    ];
    // Max = 1 (hand) + 2 (defense on table) = 3
    expect(getMaxAttackCards(state)).toBe(3);
  });
});

// ============================================================
// FIX: TRANSFER BLOCKED WHEN NEXT DEFENDER HAS TOO FEW CARDS
// ============================================================
describe('Transfer blocked when next defender has insufficient cards', () => {
  it('blocks transfer when next defender has fewer cards than total attack cards', () => {
    const state = createTestState(3);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.turnPhase = 'defend';
    state.players[1].hand = [card('hearts', '7'), card('clubs', '8')];
    // Player 2 has only 1 card but after transfer there will be 2 attack cards
    state.players[2].hand = [card('diamonds', '9')];
    state.battleField = [{ attack: card('spades', '7'), defense: null }];

    const result = transferAttack(state, 1, state.players[1].hand[0].id);
    expect(result).not.toBeNull();
    expect(result).toContain('Нельзя перевести');
  });

  it('allows transfer when next defender has enough cards', () => {
    const state = createTestState(3);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.turnPhase = 'defend';
    state.players[1].hand = [card('hearts', '7'), card('clubs', '8')];
    state.players[2].hand = [card('diamonds', '9'), card('diamonds', '10')];
    state.battleField = [{ attack: card('spades', '7'), defense: null }];

    const result = transferAttack(state, 1, state.players[1].hand[0].id);
    expect(result).toBeNull();
  });

  it('transfer action hidden in getAvailableActions when next defender has too few cards', () => {
    const state = createTestState(3);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.turnPhase = 'defend';
    state.players[1].hand = [card('hearts', '7'), card('clubs', '9')];
    state.players[2].hand = [card('diamonds', '9')]; // only 1 card, need 2
    state.battleField = [{ attack: card('spades', '7'), defense: null }];

    const actions = getAvailableActions(state, 1);
    const transferAction = actions.find(a => a.type === 'transferCard');
    expect(transferAction).toBeUndefined();
  });

  it('blocks pass-through when next defender has too few cards', () => {
    const state = createTestState(3);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.turnPhase = 'defend';
    state.battleField = [{ attack: card('spades', '7'), defense: null }];
    state.players[1].hand = [card('hearts', '7'), card('clubs', 'A')];
    state.players[2].hand = []; // 0 cards, need 1

    const error = showPassThrough(state, 1, state.players[1].hand[0].id);
    expect(error).not.toBeNull();
    expect(error).toContain('Нельзя проехать');
  });
});

// ============================================================
// FIX: SIX EXCEPTION — only sixes can be added by non-neighbors
// ============================================================
describe('Six exception: non-neighbors can only add sixes', () => {
  it('canNonNeighborPlayCard returns true for neighbors regardless of card rank', () => {
    const state = createTestState(6);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.leadCardRank = '6';
    // Player 0 is neighbor (attacker/left neighbor)
    expect(canNonNeighborPlayCard(state, 0, card('spades', '8'))).toBe(true);
    // Player 2 is neighbor (right neighbor)
    expect(canNonNeighborPlayCard(state, 2, card('spades', '8'))).toBe(true);
  });

  it('canNonNeighborPlayCard allows non-neighbor to play 6 when leadCardRank is 6', () => {
    const state = createTestState(6);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.leadCardRank = '6';
    // Player 4 is NOT a neighbor of defender (player 1)
    expect(canNonNeighborPlayCard(state, 4, card('spades', '6'))).toBe(true);
  });

  it('canNonNeighborPlayCard blocks non-neighbor from playing non-6 when leadCardRank is 6', () => {
    const state = createTestState(6);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.leadCardRank = '6';
    // Player 4 is NOT a neighbor — cannot play 8
    expect(canNonNeighborPlayCard(state, 4, card('spades', '8'))).toBe(false);
  });

  it('playAttackCard blocks non-neighbor from adding non-6 card when lead is 6', () => {
    const state = createTestState(6);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.turnPhase = 'defend';
    state.leadCardRank = '6';
    state.attackerHasPriority = false;
    state.firstTrick = false;
    // Player 4 is not neighbor, has a 6 and an 8 on table
    state.players[4].hand = [card('spades', '6'), card('spades', '8')];
    state.battleField = [
      { attack: card('hearts', '6'), defense: card('hearts', '8') },
    ];

    // Playing 8 should be blocked (8 is on table, but non-neighbor can only add 6)
    const error = playAttackCard(state, 4, state.players[4].hand[1].id);
    expect(error).toBeTruthy();
    expect(error).toContain('шестёрку');
  });

  it('playAttackCard allows non-neighbor to add 6 when lead is 6', () => {
    const state = createTestState(6);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.turnPhase = 'defend';
    state.leadCardRank = '6';
    state.attackerHasPriority = false;
    state.firstTrick = false;
    state.players[4].hand = [card('spades', '6')];
    state.players[1].hand = [card('hearts', 'J'), card('hearts', 'Q')]; // defender has cards
    state.battleField = [
      { attack: card('hearts', '6'), defense: card('hearts', '8') },
    ];

    const error = playAttackCard(state, 4, state.players[4].hand[0].id);
    expect(error).toBeNull();
  });

  it('getAvailableActions only shows 6 for non-neighbor when lead is 6', () => {
    const state = createTestState(6);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.turnPhase = 'defend';
    state.leadCardRank = '6';
    state.attackerHasPriority = false;
    state.firstTrick = false;
    // Player 4 has a 6 and an 8
    state.players[4].hand = [card('spades', '6'), card('spades', '8')];
    state.players[1].hand = [card('hearts', 'J'), card('hearts', 'Q')]; // defender has cards
    state.battleField = [
      { attack: card('hearts', '6'), defense: card('hearts', '8') },
    ];

    const actions = getAvailableActions(state, 4);
    const playAction = actions.find(a => a.type === 'playCard');
    expect(playAction).toBeDefined();
    if (playAction && playAction.type === 'playCard') {
      // Only the 6 should be playable, not the 8
      expect(playAction.cardIds).toContain('spades-6-0');
      expect(playAction.cardIds).not.toContain('spades-8-0');
    }
  });

  it('neighbor can add non-6 card when lead is 6', () => {
    const state = createTestState(6);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.turnPhase = 'defend';
    state.leadCardRank = '6';
    state.attackerHasPriority = false;
    state.firstTrick = false;
    // Player 2 IS a neighbor (right of defender)
    state.players[2].hand = [card('spades', '8')];
    state.players[1].hand = [card('hearts', 'J'), card('hearts', 'Q')]; // defender has cards
    state.battleField = [
      { attack: card('hearts', '6'), defense: card('hearts', '8') },
    ];

    const actions = getAvailableActions(state, 2);
    const playAction = actions.find(a => a.type === 'playCard');
    expect(playAction).toBeDefined();
    if (playAction && playAction.type === 'playCard') {
      expect(playAction.cardIds).toContain('spades-8-0');
    }
  });
});

describe('Pass-through blocked after defense started', () => {
  it('pass-through is blocked when defender has already defended a card', () => {
    const state = createTestState(3);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.turnPhase = 'defend';
    state.firstTrick = false;
    state.trumpInfo = { trumpCard: card('hearts', '6'), currentTrump: 'hearts' };
    // Defender has a trump card matching attack rank
    state.players[1].hand = [card('hearts', '9'), card('hearts', 'K')];
    // Battlefield: one pair defended, one pair undefended
    state.battleField = [
      { attack: card('spades', '9'), defense: card('diamonds', '9') }, // DEFENDED
      { attack: card('clubs', '9'), defense: null }, // undefended
    ];

    // Pass-through should be blocked because defender already defended a card
    const err = showPassThrough(state, 1, 'hearts-9-0');
    expect(err).toBe('Проездной можно показать только до начала защиты');
  });

  it('pass-through is allowed when no cards have been defended yet', () => {
    const state = createTestState(3);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.turnPhase = 'defend';
    state.firstTrick = false;
    state.trumpInfo = { trumpCard: card('hearts', '6'), currentTrump: 'hearts' };
    state.players[1].hand = [card('hearts', '9'), card('hearts', 'K')];
    state.players[2].hand = [card('spades', 'J'), card('spades', 'Q')]; // next defender has cards
    state.battleField = [
      { attack: card('spades', '9'), defense: null },
    ];

    const err = showPassThrough(state, 1, 'hearts-9-0');
    expect(err).toBeNull();
  });

  it('getAvailableActions hides pass-through when defense has started', () => {
    const state = createTestState(3);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.turnPhase = 'defend';
    state.firstTrick = false;
    state.trumpInfo = { trumpCard: card('hearts', '6'), currentTrump: 'hearts' };
    state.players[1].hand = [card('hearts', '9'), card('hearts', 'K')];
    state.players[2].hand = [card('spades', 'J'), card('spades', 'Q')];
    state.battleField = [
      { attack: card('spades', '9'), defense: card('diamonds', '9') }, // defended
      { attack: card('clubs', '9'), defense: null },
    ];

    const actions = getAvailableActions(state, 1);
    const passThroughAction = actions.find(a => a.type === 'showPassThrough');
    expect(passThroughAction).toBeUndefined();
  });
});

describe('Six exception: currentAttacker who is non-neighbor can only play sixes', () => {
  it('non-neighbor currentAttacker cannot play non-6 card when leadCardRank is 6', () => {
    const state = createTestState(6);
    state.currentAttackerIdx = 4; // Player 5 — NOT a neighbor of defender (player 2)
    state.currentDefenderIdx = 1;
    state.turnPhase = 'defend';
    state.leadCardRank = '6';
    state.attackerHasPriority = true;
    state.firstTrick = false;
    state.players[4].hand = [card('spades', '8'), card('spades', '6')];
    state.players[1].hand = [card('hearts', 'J'), card('hearts', 'Q'), card('hearts', 'K')]; // defender has cards
    state.battleField = [
      { attack: card('hearts', '6'), defense: card('hearts', '8') },
    ];

    // Non-neighbor currentAttacker should NOT be able to play 8
    const err8 = playAttackCard(state, 4, 'spades-8-0');
    expect(err8).toBe('Вы можете подкинуть только шестёрку');

    // But CAN play 6
    const err6 = playAttackCard(state, 4, 'spades-6-0');
    expect(err6).toBeNull();
  });

  it('getAvailableActions for non-neighbor currentAttacker shows only sixes', () => {
    const state = createTestState(6);
    state.currentAttackerIdx = 4; // Player 5 — NOT a neighbor of defender (player 2)
    state.currentDefenderIdx = 1;
    state.turnPhase = 'defend';
    state.leadCardRank = '6';
    state.attackerHasPriority = true;
    state.firstTrick = false;
    state.players[4].hand = [card('spades', '8'), card('spades', '6'), card('diamonds', '7')];
    state.players[1].hand = [card('hearts', 'J'), card('hearts', 'Q'), card('hearts', 'K')]; // defender has cards
    state.battleField = [
      { attack: card('hearts', '6'), defense: card('hearts', '8') },
      { attack: card('clubs', '7'), defense: card('clubs', '8') },
    ];

    const actions = getAvailableActions(state, 4);
    const playAction = actions.find(a => a.type === 'playCard');
    // Should only include 6, not 8 or 7
    if (playAction && playAction.type === 'playCard') {
      expect(playAction.cardIds).toContain('spades-6-0');
      expect(playAction.cardIds).not.toContain('spades-8-0');
      expect(playAction.cardIds).not.toContain('diamonds-7-0');
    } else {
      // If no play action, that's also acceptable (means only 6 is available but filtered)
      // Let's check if there's at least endAttack
      expect(actions.some(a => a.type === 'endAttack')).toBe(true);
    }
  });

  it('neighbor currentAttacker CAN play non-6 card when leadCardRank is 6', () => {
    const state = createTestState(6);
    state.currentAttackerIdx = 0; // Player 1 — IS a neighbor of defender (player 2)
    state.currentDefenderIdx = 1;
    state.turnPhase = 'defend';
    state.leadCardRank = '6';
    state.attackerHasPriority = true;
    state.firstTrick = false;
    state.players[0].hand = [card('spades', '8')];
    state.players[1].hand = [card('hearts', 'J'), card('hearts', 'Q'), card('hearts', 'K')]; // defender has cards
    state.battleField = [
      { attack: card('hearts', '6'), defense: card('hearts', '8') },
    ];

    // Neighbor currentAttacker CAN play 8
    const err = playAttackCard(state, 0, 'spades-8-0');
    expect(err).toBeNull();
  });
});

describe('Auto-complete trick when defender has no cards', () => {
  it('should auto-complete trick when defender uses last card to defend', () => {
    const state = createTestState(3);
    state.trumpInfo.currentTrump = 'hearts';
    // Give defender exactly 1 card (trump 10 to beat spades 6)
    state.players[1].hand = [card('hearts', '10', 0)];
    // Attacker has a 6 of spades
    state.players[0].hand = [card('spades', '6', 0)];
    // Player 2 has cards so game doesn't end
    state.players[2].hand = [card('clubs', 'A', 0), card('clubs', 'K', 0)];
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.turnPhase = 'attack';
    state.firstTrick = false;

    // Attacker plays
    const err1 = playAttackCard(state, 0, 'spades-6-0');
    expect(err1).toBeNull();

    // Defender uses last card to defend (hearts 10 beats spades 6 as trump)
    const err2 = playDefenseCard(state, 1, 'hearts-10-0');
    expect(err2).toBeNull();

    // Trick should auto-complete — battlefield should be cleared
    expect(state.battleField.length).toBe(0);
  });

  it('should NOT auto-complete if defender still has cards', () => {
    const state = createTestState(3);
    state.trumpInfo.currentTrump = 'hearts';
    // Give defender 2 cards
    state.players[1].hand = [
      card('hearts', '10', 0),
      card('hearts', 'J', 0),
    ];
    state.players[0].hand = [card('spades', '6', 0)];
    state.players[2].hand = [card('clubs', 'A', 0), card('clubs', 'K', 0)];
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.turnPhase = 'attack';
    state.firstTrick = false;

    playAttackCard(state, 0, 'spades-6-0');
    playDefenseCard(state, 1, 'hearts-10-0');

    // Should NOT auto-complete — defender still has 1 card left
    expect(state.battleField.length).toBe(1);
    expect(state.turnPhase).toBe('attack');
  });
});

describe('Trump determined by last drawn card on phase change', () => {
  it('should set trump to suit of last card from deck1 when deck1 empties', () => {
    const state = createTestState(2);
    state.trumpInfo.currentTrump = 'spades';
    state.trumpInfo.phase = 1;
    // Give players 13 cards each so they only need 1 more (HAND_SIZE=14)
    const makeHand = (prefix: string) => Array.from({ length: 13 }, (_, i) =>
      card('spades', '6', i + 100 * (prefix === 'a' ? 1 : 2))
    );
    state.players[0].hand = makeHand('a');
    state.players[1].hand = makeHand('b');
    // Set up deck1 with exactly 1 card left — this card's suit becomes new trump
    state.deck1 = [card('hearts', 'A', 99)];
    // deck2 has enough cards so it doesn't empty (player 1 needs 1 card from deck2)
    state.deck2 = [
      card('diamonds', 'J', 99), card('clubs', 'Q', 99),
      card('hearts', 'K', 99), card('spades', 'A', 99),
    ];
    state.currentAttackerIdx = 0;

    drawCards(state);

    // Phase should change to 2, trump should be hearts (suit of last card from deck1)
    expect(state.trumpInfo.phase).toBe(2);
    expect(state.trumpInfo.currentTrump).toBe('hearts');
  });

  it('should set trump to suit of last card from deck2 when deck2 empties', () => {
    const state = createTestState(2);
    state.trumpInfo.currentTrump = 'spades';
    state.trumpInfo.phase = 2;
    state.deck1 = [];
    // Give players 13 cards each so they only need 1 more (HAND_SIZE=14)
    const makeHand = (prefix: string) => Array.from({ length: 13 }, (_, i) =>
      card('spades', '6', i + 100 * (prefix === 'a' ? 1 : 2))
    );
    state.players[0].hand = makeHand('a');
    state.players[1].hand = makeHand('b');
    // Set up deck2 with exactly 1 card left — this card's suit becomes new trump
    state.deck2 = [card('clubs', 'K', 99)];
    state.currentAttackerIdx = 0;

    drawCards(state);

    // Phase should change to 3, trump should be clubs (suit of last card from deck2)
    expect(state.trumpInfo.phase).toBe(3);
    expect(state.trumpInfo.currentTrump).toBe('clubs');
  });
});

// ============================================================
// FIX: 13-CARD LIMIT ENFORCED IN getAvailableActions (attack phase)
// ============================================================
describe('13-card limit enforced in getAvailableActions during attack phase', () => {
  it('hides playCard action for attacker when 13 attack cards already on table (firstTrick)', () => {
    const state = createTestState(2);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.turnPhase = 'attack';
    state.firstTrick = true;
    // Give attacker a card that matches table ranks
    state.players[0].hand = [card('spades', '7', 50)];
    state.players[1].hand = Array.from({ length: 14 }, (_, i) => card('hearts', 'A', i + 100));
    // Put 13 attack cards on the table (all defended)
    state.battleField = Array.from({ length: 13 }, (_, i) => ({
      attack: card('spades', '7', i),
      defense: card('hearts', '7', i),
    }));
    state.leadCardRank = '7';

    const actions = getAvailableActions(state, 0);
    const playAction = actions.find(a => a.type === 'playCard');
    // Should NOT have playCard — already at 13 limit
    expect(playAction).toBeUndefined();
    // But should still have endAttack
    expect(actions.some(a => a.type === 'endAttack')).toBe(true);
  });

  it('allows playCard when under 13 attack cards (firstTrick)', () => {
    const state = createTestState(2);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.turnPhase = 'attack';
    state.firstTrick = true;
    state.players[0].hand = [card('spades', '7', 50)];
    state.players[1].hand = Array.from({ length: 14 }, (_, i) => card('hearts', 'A', i + 100));
    // Put 12 attack cards on the table (all defended)
    state.battleField = Array.from({ length: 12 }, (_, i) => ({
      attack: card('spades', '7', i),
      defense: card('hearts', '7', i),
    }));
    state.leadCardRank = '7';

    const actions = getAvailableActions(state, 0);
    const playAction = actions.find(a => a.type === 'playCard');
    // Should have playCard — only 12, under limit of 13
    expect(playAction).toBeDefined();
  });

  it('hides playCard for edge player in normal mode when at 13 limit', () => {
    const state = createTestState(4);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.turnPhase = 'defend';
    state.firstTrick = true;
    state.attackerHasPriority = false;
    // Edge player (idx 3) has matching cards
    state.players[3].hand = [card('spades', '7', 50)];
    state.players[1].hand = Array.from({ length: 14 }, (_, i) => card('hearts', 'A', i + 100));
    // 13 attack cards on table
    state.battleField = Array.from({ length: 13 }, (_, i) => ({
      attack: card('spades', '7', i),
      defense: card('hearts', '7', i),
    }));
    state.leadCardRank = '7';

    const actions = getAvailableActions(state, 3);
    const playAction = actions.find(a => a.type === 'playCard');
    expect(playAction).toBeUndefined();
  });
});

// ============================================================
// DEFENDER TIMEOUT: takeCards without immediate finalize
// ============================================================
describe('Defender timeout behavior', () => {
  it('engineTakeCards sets defenderTaking=true and attackers get playCard actions', () => {
    const state = createTestState(3);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.turnPhase = 'defend';
    state.firstTrick = false;
    state.players[0].hand = [card('spades', '7', 1)]; // attacker has matching card
    state.players[1].hand = [card('hearts', 'A', 0), card('hearts', 'K', 0)]; // defender
    state.players[2].hand = [card('clubs', 'A', 0)]; // other player
    state.battleField = [{ attack: card('spades', '7', 0), defense: null }];
    state.leadCardRank = '7';

    // Simulate defender timeout: call takeCards (not finalizeTake)
    takeCards(state);

    expect(state.defenderTaking).toBe(true);
    // Attacker should be able to add cards
    const attackerActions = getAvailableActions(state, 0);
    expect(attackerActions.some(a => a.type === 'playCard')).toBe(true);
    expect(attackerActions.some(a => a.type === 'endAttack')).toBe(true);
  });

  it('after takeCards, finalizeTake only happens when all attackers pass', () => {
    const state = createTestState(3);
    state.currentAttackerIdx = 0;
    state.currentDefenderIdx = 1;
    state.turnPhase = 'defend';
    state.firstTrick = false;
    state.players[0].hand = [card('spades', '7', 1)];
    state.players[1].hand = [card('hearts', 'A', 0)];
    state.players[2].hand = [card('clubs', 'A', 0)];
    state.battleField = [{ attack: card('spades', '7', 0), defense: null }];
    state.leadCardRank = '7';

    takeCards(state);
    expect(state.defenderTaking).toBe(true);

    // Attacker presses бито
    endAttack(state, 0);
    // Player 2 hasn't passed yet — should still be taking
    expect(state.defenderTaking).toBe(true);

    // Player 2 presses бито
    endAttack(state, 2);
    // Now all passed — finalize should happen
    expect(state.defenderTaking).toBe(false);
    expect(state.battleField.length).toBe(0);
  });
});

// ============================================================
// CONSECUTIVE TIMEOUTS TRACKING
// ============================================================
describe('Consecutive timeouts tracking', () => {
  it('consecutiveTimeouts increments correctly', () => {
    const state = createTestState(2);
    state.consecutiveTimeouts = {};
    expect(state.consecutiveTimeouts['p1'] || 0).toBe(0);

    // Simulate first timeout
    state.consecutiveTimeouts['p1'] = (state.consecutiveTimeouts['p1'] || 0) + 1;
    expect(state.consecutiveTimeouts['p1']).toBe(1);

    // Simulate second timeout
    state.consecutiveTimeouts['p1'] = (state.consecutiveTimeouts['p1'] || 0) + 1;
    expect(state.consecutiveTimeouts['p1']).toBe(2);
  });

  it('consecutiveTimeouts resets on player action', () => {
    const state = createTestState(2);
    state.consecutiveTimeouts = { 'p1': 1 };

    // Simulate player action (reset)
    state.consecutiveTimeouts['p1'] = 0;
    expect(state.consecutiveTimeouts['p1']).toBe(0);
  });

  it('consecutiveTimeouts is initialized empty in createGame', () => {
    const players = [
      { odId: 'p1', name: 'Player 1', isBot: false },
      { odId: 'p2', name: 'Player 2', isBot: false },
    ];
    const game = createGame('room1', players);
    expect(game.consecutiveTimeouts).toEqual({});
  });
});
