/**
 * Test: Reproduce the exact scenario from the video
 * - 3 players: human (idx 0), ghost (idx 1), ghost2 (idx 2, already out)
 * - Ghost attacked with two 8s
 * - Human made showPassThrough with trump 8
 * - Now ghost is defender, human is attacker
 * - Ghost has an 8 in hand — should transfer, not defend
 */

import { getAvailableActions } from './server/gameEngine';
import type { GameState, Player } from './shared/gameTypes';

// Minimal GameState for testing
function makeState(overrides: Partial<GameState>): GameState {
  return {
    roomId: 'test',
    phase: 'playing',
    gamePhase: 'playing',
    turnPhase: 'defend',
    players: [],
    deck: [],
    battleField: [],
    trumpInfo: { currentTrump: 'spades', phase: 1, trumpCard: null },
    currentAttackerIdx: 0,
    currentDefenderIdx: 1,
    direction: 'cw',
    defenderTaking: false,
    passThroughUsedIds: [],
    phantomNeighborIdx: null,
    prizePool: 0,
    settings: { betAmount: 100, playerCount: 3, isTutorial: false, deckSize: 36, tableStyle: 'classic', deckStyle: 'classic' },
    ...overrides,
  } as GameState;
}

function makePlayer(id: string, name: string, hand: { id: string; rank: string; suit: string }[], isOut = false): Player {
  return {
    id, name, hand: hand as any, isOut, isBot: false, avatarId: 'wolf',
    shanyrakBalance: 1000, rating: 1000, gamesPlayed: 0, wins: 0, losses: 0,
  } as Player;
}

// Scenario: 
// - Human (idx 0) is attacker, has 5 cards including no 8s
// - Ghost (idx 1) is defender, has 8♣ in hand (5 cards total)
// - Ghost2 (idx 2) is OUT
// - Battlefield: 8♦ and 8♠ (ghost's attack), plus 8♥ (human's passthrough) — all undefended
// - passThroughUsedIds: ['8h'] (human's trump 8 used for passthrough)
// - Trump suit: hearts

const human = makePlayer('human', 'Vitalik', [
  { id: '9d', rank: '9', suit: 'diamonds' },
  { id: '9s', rank: '9', suit: 'spades' },
  { id: 'jd', rank: 'J', suit: 'diamonds' },
  { id: 'qd', rank: 'Q', suit: 'diamonds' },
  { id: 'kd', rank: 'K', suit: 'diamonds' },
]);

const ghost = makePlayer('ghost-nightowl', 'nightowl', [
  { id: '8c', rank: '8', suit: 'clubs' },
  { id: '10d', rank: '10', suit: 'diamonds' },
  { id: 'jh', rank: 'J', suit: 'hearts' },
  { id: 'qh', rank: 'Q', suit: 'hearts' },
  { id: 'kh', rank: 'K', suit: 'hearts' },
]);

const ghost2 = makePlayer('ghost-player2', 'player2', [], true); // OUT

const state = makeState({
  players: [human, ghost, ghost2],
  currentAttackerIdx: 0,  // human is attacker
  currentDefenderIdx: 1,  // ghost is defender
  battleField: [
    { attack: { id: '8d', rank: '8', suit: 'diamonds' }, defense: null },
    { attack: { id: '8s', rank: '8', suit: 'spades' }, defense: null },
    { attack: { id: '8h', rank: '8', suit: 'hearts' }, defense: null }, // human's passthrough card (trump 8)
  ],
  passThroughUsedIds: ['8h'], // human's trump 8 already used as passthrough
  trumpInfo: { currentTrump: 'hearts', phase: 'normal', trumpCard: null },
});

console.log('=== Scenario: Ghost defending after human passthrough ===');
console.log('Players:', state.players.map((p, i) => `${i}:${p.name}(${p.isOut ? 'OUT' : 'active'})`).join(', '));
console.log('Attacker idx:', state.currentAttackerIdx, '=', state.players[state.currentAttackerIdx].name);
console.log('Defender idx:', state.currentDefenderIdx, '=', state.players[state.currentDefenderIdx].name);
console.log('Battlefield:', state.battleField.map(p => `${p.attack.rank}${p.attack.suit}${p.defense ? '→'+p.defense.rank+p.defense.suit : ''}`).join(', '));
console.log('Ghost hand:', ghost.hand.map((c: any) => `${c.rank}${c.suit}`).join(', '));
console.log('Human hand:', human.hand.map((c: any) => `${c.rank}${c.suit}`).join(', '));
console.log('Trump:', state.trumpInfo.currentTrump);
console.log('passThroughUsedIds:', state.passThroughUsedIds);
console.log('');

// Get actions for ghost (idx 1, the defender)
const ghostActions = getAvailableActions(state, 1);
console.log('Ghost available actions:', JSON.stringify(ghostActions, null, 2));

const hasTransfer = ghostActions.some(a => a.type === 'transferCard');
const hasPassThrough = ghostActions.some(a => a.type === 'showPassThrough');
const hasPlayCard = ghostActions.some(a => a.type === 'playCard');
const hasTakeCards = ghostActions.some(a => a.type === 'takeCards');

console.log('');
console.log('Summary:');
console.log('  transferCard available:', hasTransfer);
console.log('  showPassThrough available:', hasPassThrough);
console.log('  playCard available:', hasPlayCard);
console.log('  takeCards available:', hasTakeCards);

if (hasTransfer) {
  console.log('✅ CORRECT: Ghost can transfer (8♣ matches attack rank 8)');
} else {
  console.log('❌ BUG: Ghost cannot transfer despite having 8♣!');
  // Diagnose why
  const nextDefIdx = 2; // ghost2 is OUT, so next active from idx 1 is idx 0 (human)
  const nextDef = state.players[0]; // human
  const totalAfterTransfer = state.battleField.length + 1;
  console.log(`  Next defender: idx 0 = ${nextDef.name}, hand.length=${nextDef.hand.length}`);
  console.log(`  totalAfterTransfer: ${totalAfterTransfer} (${state.battleField.length} on field + 1)`);
  console.log(`  nextDef.hand.length >= totalAfterTransfer: ${nextDef.hand.length} >= ${totalAfterTransfer} = ${nextDef.hand.length >= totalAfterTransfer}`);
  console.log(`  battleField.every(!defense): ${state.battleField.every(p => !p.defense)}`);
  const attackRank = state.battleField[0].attack.rank;
  const transferCards = ghost.hand.filter((c: any) => c.rank === attackRank);
  console.log(`  Attack rank: ${attackRank}, ghost cards with same rank: ${transferCards.map((c: any) => c.id).join(', ')}`);
}
