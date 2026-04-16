// ============================================================
// Kazakh Durak Online — Game Engine (v4)
// Fixes: attacker priority handoff, pickup-after-take mechanic,
// card limit enforcement, bito multi-attacker
// ============================================================

import {
  Card, Suit, Rank, SUITS, RANKS, RANK_ORDER, COPIES_PER_CARD,
  HAND_SIZE, FIRST_TRICK_LIMIT,
  TrumpInfo, Player, BattlePair, Direction, GameState, GamePhase, TurnPhase,
  ClientGameState, ClientPlayer, AvailableAction, RoomSettings,
} from '../shared/gameTypes';

// ---- Helpers ----

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---- Card creation & identification ----

export function createFullDeck(): Card[] {
  const cards: Card[] = [];
  for (let copy = 0; copy < COPIES_PER_CARD; copy++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push({ id: `${suit}-${rank}-${copy}`, suit, rank, copy });
      }
    }
  }
  cards.push({ id: '777-0', suit: null, rank: '777', copy: 0 });
  return cards;
}

export function getCardValue(card: Card): number {
  if (card.rank === '777') return 100;
  return RANK_ORDER[card.rank] ?? 0;
}

export function isKingOfSpades(card: Card): boolean {
  return card.rank === 'K' && card.suit === 'spades';
}

export function is777(card: Card): boolean {
  return card.rank === '777';
}

export function isAceOfSpades(card: Card): boolean {
  return card.rank === 'A' && card.suit === 'spades';
}

// ---- Combat rules ----

export function canBeat(attack: Card, defense: Card, currentTrump: Suit): boolean {
  if (is777(defense)) return true;
  if (is777(attack)) return false;
  if (isKingOfSpades(attack)) {
    return isAceOfSpades(defense) || is777(defense);
  }
  if (isKingOfSpades(defense)) {
    if (isKingOfSpades(attack)) return false;
    return true;
  }
  if (attack.suit === defense.suit && attack.rank === defense.rank) {
    return true;
  }
  if (attack.suit === defense.suit) {
    return getCardValue(defense) > getCardValue(attack);
  }
  if (defense.suit === currentTrump && attack.suit !== currentTrump) {
    return true;
  }
  return false;
}

// ---- Trump selection ----

function pickTrumps(): { mainTrump: Suit; hiddenTrump1: Suit; hiddenTrump2: Suit } {
  const shuffled = shuffleArray([...SUITS]);
  return { mainTrump: shuffled[0], hiddenTrump1: shuffled[1], hiddenTrump2: shuffled[2] };
}

function splitDecks(cards: Card[]): { deck1: Card[]; deck2: Card[] } {
  const half = Math.ceil(cards.length / 2);
  return { deck1: cards.slice(0, half), deck2: cards.slice(half) };
}

// ---- First player logic ----
// Rules:
// 1. Find the player with the lowest trump card.
// 2. If multiple players share the same minimum trump value, that rank is "cancelled" for those players.
//    Among tied players, find their next lowest trump (excluding the cancelled rank).
// 3. Repeat until one player wins.
// 4. Tie-break at same rank: the player with MORE copies of that rank wins.
// 5. If all trump ranks are cancelled (complete tie), fall back to player index 0.
export function findFirstPlayer(players: Player[], trumpSuit: Suit): number {
  // Build per-player trump card lists (sorted ascending by value)
  const playerTrumps: { idx: number; cards: number[] }[] = players
    .map((p, idx) => ({
      idx,
      cards: p.hand
        .filter(c => c.suit === trumpSuit)
        .map(c => getCardValue(c))
        .sort((a, b) => a - b),
    }))
    .filter(p => p.cards.length > 0);

  if (playerTrumps.length === 0) return 0; // No one has trumps — default to player 0

  // Each player tracks a pointer into their sorted trump list (which rank we're currently considering)
  const pointers: number[] = playerTrumps.map(() => 0);

  // Iteratively resolve ties
  let candidates = playerTrumps.map((_, i) => i); // indices into playerTrumps array

  while (candidates.length > 1) {
    // Find the minimum current trump value among all candidates
    const minVal = Math.min(...candidates.map(ci => {
      const ptr = pointers[ci];
      return ptr < playerTrumps[ci].cards.length ? playerTrumps[ci].cards[ptr] : Infinity;
    }));

    if (minVal === Infinity) break; // All candidates exhausted — complete tie

    // Find candidates that have this minimum value at their current pointer
    const withMin = candidates.filter(ci => {
      const ptr = pointers[ci];
      return ptr < playerTrumps[ci].cards.length && playerTrumps[ci].cards[ptr] === minVal;
    });

    // Candidates without this minimum value have higher minimums — eliminate them
    const withoutMin = candidates.filter(ci => !withMin.includes(ci));
    if (withoutMin.length > 0) {
      candidates = withMin;
    }

    if (candidates.length === 1) break; // Winner found

    // Multiple candidates share the same minimum rank — apply tie-break by count
    // Count how many cards of this rank each tied candidate has
    const counts = candidates.map(ci => ({
      ci,
      count: playerTrumps[ci].cards.filter(v => v === minVal).length,
    }));

    const maxCount = Math.max(...counts.map(x => x.count));
    const withMaxCount = counts.filter(x => x.count === maxCount).map(x => x.ci);

    if (withMaxCount.length === 1) {
      // One player has more copies of this rank — they win
      candidates = withMaxCount;
      break;
    }

    // Complete tie at this rank and count — cancel this rank for all tied candidates
    // Advance each tied candidate's pointer past all cards of this rank
    for (const ci of candidates) {
      while (pointers[ci] < playerTrumps[ci].cards.length && playerTrumps[ci].cards[pointers[ci]] === minVal) {
        pointers[ci]++;
      }
    }
    // Candidates who exhausted their trump list are eliminated
    candidates = candidates.filter(ci => pointers[ci] < playerTrumps[ci].cards.length);

    if (candidates.length === 0) break; // All exhausted — complete tie, fall back
  }

  if (candidates.length === 0) return 0; // Complete tie — default to player 0
  return playerTrumps[candidates[0]].idx;
}

// ---- Game creation ----

export function createGame(
  roomId: string,
  playerInfos: { id: string; odId: string; name: string; isBot: boolean; avatarId?: string }[],
  settings?: RoomSettings
): GameState {
  const allCards = shuffleArray(createFullDeck());
  const numPlayers = playerInfos.length;
  const totalDeal = numPlayers * HAND_SIZE;

  const players: Player[] = playerInfos.map((p, idx) => ({
    id: p.id,
    odId: p.odId,
    name: p.name,
    hand: allCards.slice(idx * HAND_SIZE, (idx + 1) * HAND_SIZE),
    passThrough: [],
    isOut: false,
    seatIndex: idx,
    isBot: p.isBot,
    winPlace: null,
    leftGame: false,
    avatarId: p.avatarId,
  }));

  const remaining = allCards.slice(totalDeal);
  const { deck1, deck2 } = splitDecks(remaining);
  const trumps = pickTrumps();

  // The bottom card of deck1 is the visible trump card (determines mainTrump suit)
  // The second card from bottom of deck1 is the hidden trump card under deck1 (determines phase 2 trump)
  // The bottom card of deck2 is the hidden trump card (face down, revealed when deck2 starts)
  const trumpCard = deck1.length > 0 ? deck1[0] : undefined;
  const hiddenTrumpCard1 = deck1.length > 1 ? deck1[1] : undefined;
  const hiddenTrumpCard = deck2.length > 0 ? deck2[0] : undefined;

  // Override mainTrump with the actual trump card's suit
  const actualMainTrump = trumpCard?.suit ?? trumps.mainTrump;
  // Phase 2 trump will be determined by hiddenTrumpCard1's suit
  const phase2Trump = hiddenTrumpCard1?.suit ?? trumps.hiddenTrump1;

  const trumpInfo: TrumpInfo = {
    mainTrump: actualMainTrump,
    hiddenTrump1: phase2Trump,
    hiddenTrump2: trumps.hiddenTrump2,
    currentTrump: actualMainTrump,
    phase: 1,
    trumpCard,
    hiddenTrumpCard1,
    hiddenTrumpCard,
  };

  const firstPlayerIdx = findFirstPlayer(players, trumpInfo.currentTrump);
  const defenderIdx = getNextActivePlayer(players, firstPlayerIdx, 'cw');
  const timerMax = settings?.turnTimer ?? 30;

  return {
    roomId,
    players,
    deck1,
    deck2,
    trumpInfo,
    battleField: [],
    discardPile: [],
    currentAttackerIdx: firstPlayerIdx,
    currentDefenderIdx: defenderIdx,
    direction: 'cw',
    turnPhase: 'attack',
    gamePhase: 'playing',
    firstTrick: true,
    trickCount: 0,
    lastPlayedRank: null,
    winnersOrder: [],
    loserId: null,
    turnTimer: timerMax,
    turnTimerMax: timerMax,
    leadCardRank: null,
    attackerHasPriority: true,
    passedAttackers: [],
    nextWinPlace: 1,
    defenderTaking: false,
    passThroughUsedIds: [],
    revealedPassThroughs: [],
    consecutiveTimeouts: {},
    deckStyle: settings?.deckStyle ?? 'classic',
    tableStyle: settings?.tableStyle ?? 'classic',
    prizePool: 0,
    playerPrizes: [],
    phantomNeighborIdx: null,
  };
}

// ---- Navigation helpers ----

export function getNextActivePlayer(players: Player[], fromIdx: number, dir: Direction): number {
  const n = players.length;
  let idx = fromIdx;
  for (let i = 0; i < n; i++) {
    idx = dir === 'cw' ? (idx + 1) % n : (idx - 1 + n) % n;
    if (!players[idx].isOut) return idx;
  }
  return fromIdx;
}

export function getPrevActivePlayer(players: Player[], fromIdx: number, dir: Direction): number {
  return getNextActivePlayer(players, fromIdx, dir === 'cw' ? 'ccw' : 'cw');
}

export function isEdgePlayer(players: Player[], playerIdx: number, defenderIdx: number, dir: Direction, phantomNeighborIdx?: number | null): boolean {
  // Compute neighbors using only active (non-out) players, but treat the phantom
  // neighbor as still-active so the player AFTER the phantom doesn't become a neighbor.
  const effectivePlayers: Player[] = phantomNeighborIdx != null
    ? players.map((p, i) => i === phantomNeighborIdx ? { ...p, isOut: false } : p)
    : players;
  const leftNeighbor = getNextActivePlayer(effectivePlayers, defenderIdx, dir === 'cw' ? 'ccw' : 'cw');
  const rightNeighbor = getNextActivePlayer(effectivePlayers, defenderIdx, dir);
  return playerIdx === leftNeighbor || playerIdx === rightNeighbor;
}

// ---- Trick limits ----

export function getMaxAttackCards(state: GameState): number {
  const defender = state.players[state.currentDefenderIdx];
  // Limit = defender's ORIGINAL hand size at start of trick
  // = current hand + defense cards already played on the table
  const defenseCardsOnTable = state.battleField.filter(p => p.defense !== null).length;
  const defenderOriginalCards = defender.hand.length + defenseCardsOnTable;
  // Rule: while discard pile is empty (no successful defense yet = "первая бито"),
  // max attack cards on table is capped at FIRST_TRICK_LIMIT (13)
  if (state.discardPile.length === 0) return Math.min(FIRST_TRICK_LIMIT, defenderOriginalCards);
  return defenderOriginalCards;
}

// ---- Draw cards ----

export function drawCards(state: GameState): void {
  const order: number[] = [];
  let idx = state.currentAttackerIdx;
  const n = state.players.length;
  for (let i = 0; i < n; i++) {
    if (!state.players[idx].isOut) order.push(idx);
    idx = state.direction === 'cw' ? (idx + 1) % n : (idx - 1 + n) % n;
  }

  for (const pIdx of order) {
    const player = state.players[pIdx];
    while (player.hand.length < HAND_SIZE) {
      if (state.deck1.length > 0) {
        const card = state.deck1.pop()!;
        player.hand.push(card);
        // When deck1 empties, transition to phase 2
        // Phase 2 trump is determined by hiddenTrumpCard1 (card under the trump card of deck1)
        if (state.deck1.length === 0 && state.trumpInfo.phase === 1) {
          state.trumpInfo.phase = 2;
          state.trumpInfo.currentTrump = state.trumpInfo.hiddenTrumpCard1?.suit
            ?? state.trumpInfo.hiddenTrump1;
        }
      } else if (state.deck2.length > 0) {
        if (state.trumpInfo.phase === 1) {
          // Edge case: deck1 was already empty at start of drawCards
          state.trumpInfo.phase = 2;
          state.trumpInfo.currentTrump = state.trumpInfo.hiddenTrumpCard1?.suit
            ?? state.trumpInfo.hiddenTrump1;
        }
        const card = state.deck2.pop()!;
        player.hand.push(card);
        // Track last card from deck2 for phase 3 transition
        if (state.deck2.length === 0 && state.trumpInfo.phase === 2) {
          state.trumpInfo.phase = 3;
          state.trumpInfo.currentTrump = card.suit ?? state.trumpInfo.currentTrump;
        }
      } else {
        break;
      }
    }
  }

  // Handle case where deck2 was already empty before drawing started
  // but phase wasn't updated yet
  if (state.deck2.length === 0 && state.trumpInfo.phase === 2) {
    // Phase 3 should have been set above; this is a safety net
    state.trumpInfo.phase = 3;
  }
}

// ---- Skip turn (777 only) ----

export function shouldSkipTurn(state: GameState, playerIdx: number): boolean {
  const player = state.players[playerIdx];
  // Skip is only allowed when the player STARTS their attack turn with only the 777 card.
  // The battlefield must be empty — meaning they haven't played any cards yet this turn.
  // This prevents the skip button appearing after the player has already played all other cards.
  return (
    player.hand.length === 1 &&
    is777(player.hand[0]) &&
    playerIdx === state.currentAttackerIdx &&
    state.battleField.length === 0
  );
}

// ---- Attack validation ----

export function canPlayAsAttack(state: GameState, card: Card): boolean {
  if (is777(card)) return false;
  if (state.battleField.length === 0) return true;
  const ranksOnTable = new Set<string>();
  for (const pair of state.battleField) {
    ranksOnTable.add(pair.attack.rank);
    if (pair.defense) ranksOnTable.add(pair.defense.rank);
  }
  return ranksOnTable.has(card.rank);
}

// ---- Edge player / 6-exception ----

export function canPlayerAddCards(state: GameState, playerIdx: number): boolean {
  if (playerIdx === state.currentDefenderIdx) return false;
  if (state.players[playerIdx].isOut) return false;
  // Six exception: when lead card is 6, ALL players can add sixes (not just neighbors)
  if (state.leadCardRank === '6') return true;
  return isEdgePlayer(state.players, playerIdx, state.currentDefenderIdx, state.direction, state.phantomNeighborIdx);
}

// Check if a specific non-neighbor player can play a specific card
// When leadCardRank === '6', non-neighbors can ONLY add sixes, not other ranks
export function canNonNeighborPlayCard(state: GameState, playerIdx: number, card: Card): boolean {
  const isNeighbor = isEdgePlayer(state.players, playerIdx, state.currentDefenderIdx, state.direction, state.phantomNeighborIdx);
  if (isNeighbor) return true; // Neighbors can play any valid card
  // Non-neighbor can only participate if leadCardRank === '6'
  if (state.leadCardRank !== '6') return false;
  // Non-neighbors can ONLY add sixes
  return card.rank === '6';
}

// ---- Total cards on table ----

function totalCardsOnTable(state: GameState): number {
  let count = 0;
  for (const pair of state.battleField) {
    count++; // attack card
    if (pair.defense) count++; // defense card
  }
  return count;
}

// ---- Check if more attack cards can be added ----

function canAddMoreAttackCards(state: GameState): boolean {
  const maxCards = getMaxAttackCards(state);
  // Count total attack cards (each pair has one attack card)
  const attackCardCount = state.battleField.length;
  return attackCardCount < maxCards;
}

// ---- Attack card play ----

export function playAttackCard(state: GameState, playerIdx: number, cardId: string): string | null {
  // Only the current attacker can initiate the first card
  if (state.battleField.length === 0 && playerIdx !== state.currentAttackerIdx) {
    return 'Только атакующий может сыграть первую карту';
  }

  // Defender cannot play attack cards
  if (playerIdx === state.currentDefenderIdx) {
    return 'Защитник не может атаковать';
  }

  const player = state.players[playerIdx];
  if (player.isOut) return 'Игрок уже вышел из игры';

  const cardIndex = player.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return 'Такой карты нет в руке';
  const card = player.hand[cardIndex];

  // After first card, check if this player can add cards
  if (state.battleField.length > 0 && playerIdx !== state.currentAttackerIdx) {
    // SIX EXCEPTION: when lead card is 6 and player is throwing a six, bypass attacker priority
    const isSixException = state.leadCardRank === '6' && card.rank === '6';
    // PRIORITY RULE: Edge players cannot add cards while attacker has priority
    // But sixes bypass this rule when the lead card is 6
    if (state.attackerHasPriority && !isSixException) return 'Атакующий ещё не нажал Бито — подождите';
    if (!canPlayerAddCards(state, playerIdx)) return 'Вы не можете подкидывать карты в этот ход';
  }

  // Six exception: non-neighbors can ONLY add sixes
  // For the current attacker: only restrict if they are NOT a neighbor AND leadCardRank is '6'
  if (state.battleField.length > 0) {
    const isNeighbor = isEdgePlayer(state.players, playerIdx, state.currentDefenderIdx, state.direction, state.phantomNeighborIdx);
    const isAttacker = playerIdx === state.currentAttackerIdx;
    if (isAttacker) {
      // Attacker is only restricted if lead is 6 AND they are not a neighbor
      if (state.leadCardRank === '6' && !isNeighbor && card.rank !== '6') {
        return 'Вы можете подкинуть только шестёрку';
      }
    } else {
      if (!canNonNeighborPlayCard(state, playerIdx, card)) return 'Вы можете подкинуть только шестёрку';
    }
  }

  if (!canPlayAsAttack(state, card)) return 'Эту карту нельзя сыграть в атаку';

  // Check card limit
  if (!canAddMoreAttackCards(state)) return 'Достигнут максимум атакующих карт';

  player.hand.splice(cardIndex, 1);
  state.battleField.push({ attack: card, defense: null });
  state.lastPlayedRank = card.rank as Rank;

  // 10-card only reverses direction when it's the LEAD card
  if (state.battleField.length === 1 && card.rank === '10') {
    state.direction = state.direction === 'cw' ? 'ccw' : 'cw';
    state.leadCardRank = '10';
    state.currentDefenderIdx = getNextActivePlayer(state.players, state.currentAttackerIdx, state.direction);
  }

  if (state.battleField.length === 1) {
    state.leadCardRank = card.rank as Rank;
  }

  // When attacker plays a card, they regain priority
  if (playerIdx === state.currentAttackerIdx) {
    state.attackerHasPriority = true;
  }

  // If defender is NOT taking, set phase to defend
  if (!state.defenderTaking) {
    state.turnPhase = 'defend';
  }
  // If defender IS taking (pickup mode), stay in pickup — cards just pile up

  // When someone adds a card in normal mode, reset passed attackers since new cards appeared
  // In pickup mode (defenderTaking), do NOT reset — the attacker who just added a card
  // is still considered "passed" for the purpose of finalizeTake. Only remove THIS player
  // from passedAttackers (since they just played a card, they haven't "passed" yet).
  if (state.defenderTaking) {
    // Remove only this player from passed list — they just played, so they need to press бито again
    state.passedAttackers = state.passedAttackers.filter(id => id !== player.id);
  } else {
    state.passedAttackers = [];
  }
  const wentOut = checkPlayerOut(state, playerIdx);

  // If the player who just played went out (last card), handle gracefully
  if (wentOut) {
    // Auto-pass this player since they have no more cards
    if (!state.passedAttackers.includes(player.id)) {
      state.passedAttackers.push(player.id);
    }
    // If this was the current attacker, try to pass to next
    if (playerIdx === state.currentAttackerIdx) {
      const nextIdx = findNextUnpassedAttacker(state, playerIdx);
      if (nextIdx !== null) {
        state.currentAttackerIdx = nextIdx;
        state.attackerHasPriority = true;
      } else if (!state.defenderTaking) {
        // All attackers done — if all defended, auto-complete
        state.attackerHasPriority = false;
      }
    }
    checkGameOver(state);
  }
  return null;
}

// ---- Defense card play ----

export function playDefenseCard(state: GameState, playerIdx: number, cardId: string, targetPairIdx?: number): string | null {
  if (playerIdx !== state.currentDefenderIdx) return 'Сейчас не ваш ход защищаться';
  if (state.defenderTaking) return 'Вы уже выбрали взять карты';

  const player = state.players[playerIdx];
  const cardIndex = player.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return 'Такой карты нет в руке';
  const card = player.hand[cardIndex];

  let pairIdx = targetPairIdx;
  if (pairIdx === undefined || pairIdx === null) {
    pairIdx = state.battleField.findIndex(p => !p.defense && canBeat(p.attack, card, state.trumpInfo.currentTrump));
  }

  if (pairIdx === -1 || pairIdx === undefined) return 'Нет подходящей цели для этой карты';
  const pair = state.battleField[pairIdx];
  if (!pair) return 'Неверная цель';
  if (pair.defense) return 'Эта карта уже отбита';

  if (!canBeat(pair.attack, card, state.trumpInfo.currentTrump)) {
    return 'Этой картой нельзя отбить атакующую карту';
  }

  player.hand.splice(cardIndex, 1);
  pair.defense = card;

  const allDefended = state.battleField.every(p => p.defense !== null);
  if (allDefended) {
    // After defender beats a card, attacker regains priority to add more
    state.turnPhase = 'attack';
    state.attackerHasPriority = true;
    state.passedAttackers = [];
    
    // Auto-pass attackers who have no matching cards to add
    autoPassAttackersWithNoCards(state);
    
    // If all attackers auto-passed (nobody can add cards), auto-complete defense
    // BUT only if defender still has cards (otherwise checkPlayerOut handles it)
    if (player.hand.length > 0 && checkAllAttackersPassed(state)) {
      // Don't auto-complete immediately — will be handled below or by the caller
      // Set a flag so the server knows to auto-complete
      state._autoCompleteDefense = true;
    }
  }

  const wentOut = checkPlayerOut(state, playerIdx);

  // If defender went out (defended with last card) and all cards are defended,
  // add a 3-second delay so all players can see the final cards
  if (wentOut && allDefended) {
    state._lastCardDefenseDelay = true;
    // Don't call successfulDefense immediately — server will handle the 3s delay
  } else if (allDefended && player.hand.length === 0) {
    // Defender used last card to defend — same logic, add delay
    state._lastCardDefenseDelay = true;
  } else if (wentOut) {
    checkGameOver(state);
  }
  return null;
}

// ---- Transfer (perevod) ----

export function transferAttack(state: GameState, playerIdx: number, cardId: string): string | null {
  if (playerIdx !== state.currentDefenderIdx) return 'Сейчас не ваш ход';
  if (state.defenderTaking) return 'Нельзя переводить, когда берёте карты';

  const player = state.players[playerIdx];
  const cardIndex = player.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return 'Такой карты нет в руке';
  const card = player.hand[cardIndex];

  if (state.battleField.some(p => p.defense)) return 'Нельзя переводить после отбивания карт';

  const attackRank = state.battleField[0]?.attack.rank;
  if (card.rank !== attackRank) return 'Карта перевода должна совпадать по номиналу с атакующей';

  // Check if the next defender has enough cards to handle all attack cards
  // Total attack cards after transfer = current battlefield cards + 1 (the transfer card)
  const totalAttackCards = state.battleField.length + 1;

  // Transfer is NOT limited by the 13-card first bito rule.
  // Transfer only checks if the next defender has enough cards in hand.

  const potentialDir = (card.rank === '10' && state.leadCardRank === '10')
    ? (state.direction === 'cw' ? 'ccw' : 'cw')
    : state.direction;
  const newDefenderIdx = getNextActivePlayer(state.players, state.currentDefenderIdx, potentialDir);
  const nextDefender = state.players[newDefenderIdx];
  // Phantom neighbor rule: cannot transfer to a player who just went out this trick
  if (state.phantomNeighborIdx !== null && newDefenderIdx === state.phantomNeighborIdx) {
    return `Нельзя перевести — игрок (${nextDefender.name}) уже вышел из игры в этом ходу`;
  }
  if (nextDefender.hand.length < totalAttackCards) {
    return `Нельзя перевести — у следующего игрока (${nextDefender.name}) только ${nextDefender.hand.length} карт(ы), а на столе будет ${totalAttackCards}`;
  }

  if (card.rank === '10' && state.leadCardRank === '10') {
    state.direction = state.direction === 'cw' ? 'ccw' : 'cw';
  }

  player.hand.splice(cardIndex, 1);
  state.battleField.push({ attack: card, defense: null });

  // newDefenderIdx already computed above with correct direction
  state.currentAttackerIdx = state.currentDefenderIdx;
  state.currentDefenderIdx = newDefenderIdx;

  state.turnPhase = 'defend';
  state.passedAttackers = [];
  state.attackerHasPriority = true;
  state.defenderTaking = false;
  resetTurnTimer(state);
  checkPlayerOut(state, playerIdx);
  return null;
}

// ---- Multi-card Transfer ----

export function transferMultipleCards(state: GameState, playerIdx: number, cardIds: string[]): string | null {
  if (cardIds.length === 0) return 'Нет карт для перевода';
  if (cardIds.length === 1) return transferAttack(state, playerIdx, cardIds[0]);

  if (playerIdx !== state.currentDefenderIdx) return 'Сейчас не ваш ход';
  if (state.defenderTaking) return 'Нельзя переводить, когда берёте карты';
  if (state.battleField.some(p => p.defense)) return 'Нельзя переводить после отбивания карт';

  const player = state.players[playerIdx];
  const attackRank = state.battleField[0]?.attack.rank;

  // Validate all cards exist in hand and match attack rank
  const cards: { card: Card; index: number }[] = [];
  for (const cardId of cardIds) {
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return `Карты ${cardId} нет в руке`;
    const card = player.hand[cardIndex];
    if (card.rank !== attackRank) return 'Все карты перевода должны совпадать по номиналу';
    cards.push({ card, index: cardIndex });
  }

  // Check if the next defender has enough cards for all transferred cards
  const totalAttackCards = state.battleField.length + cardIds.length;

  // Check direction change (if transferring 10s when lead is 10)
  // Multiple tens thrown at once count as ONE direction change (not per-card)
  const hasDirectionChange = cards.some(c => c.card.rank === '10') && state.leadCardRank === '10';
  const potentialDir = hasDirectionChange
    ? (state.direction === 'cw' ? 'ccw' : 'cw')
    : state.direction;

  const newDefenderIdx = getNextActivePlayer(state.players, state.currentDefenderIdx, potentialDir);
  const nextDefender = state.players[newDefenderIdx];
  // Phantom neighbor rule: cannot transfer to a player who just went out this trick
  if (state.phantomNeighborIdx !== null && newDefenderIdx === state.phantomNeighborIdx) {
    return `Нельзя перевести — игрок (${nextDefender.name}) уже вышел из игры в этом ходу`;
  }
  if (nextDefender.hand.length < totalAttackCards) {
    return `Нельзя перевести — у следующего игрока (${nextDefender.name}) только ${nextDefender.hand.length} карт(ы), а на столе будет ${totalAttackCards}`;
  }

  // Apply direction change if needed
  if (hasDirectionChange) {
    state.direction = potentialDir as Direction;
  }

  // Remove cards from hand (in reverse index order to avoid shifting issues)
  const sortedCards = [...cards].sort((a, b) => b.index - a.index);
  for (const { card, index } of sortedCards) {
    player.hand.splice(index, 1);
    state.battleField.push({ attack: card, defense: null });
  }

  // Update attacker/defender
  state.currentAttackerIdx = state.currentDefenderIdx;
  state.currentDefenderIdx = newDefenderIdx;

  state.turnPhase = 'defend';
  state.passedAttackers = [];
  state.attackerHasPriority = true;
  state.defenderTaking = false;
  resetTurnTimer(state);
  checkPlayerOut(state, playerIdx);
  return null;
}

// ---- Pass-through (proezdnoy) ----
// The defender SHOWS a trump card of the same rank as the attack card.
// The card stays in hand (not played to the table).
// Each specific card can only be shown as pass-through ONCE per game.
// Multiple cards can be shown if the defender has multiple qualifying cards.

export function showPassThrough(state: GameState, playerIdx: number, cardId: string): string | null {
  if (playerIdx !== state.currentDefenderIdx) return 'Не ваш ход';
  if (state.defenderTaking) return 'Вы уже берёте карты';
  if (state.battleField.length === 0) return 'Нет карт на столе';

  // Pass-through is only allowed BEFORE the defender starts defending
  // If any card has been defended, pass-through is no longer available
  if (state.battleField.some(p => p.defense !== null)) {
    return 'Проездной можно показать только до начала защиты';
  }

  const player = state.players[playerIdx];
  const card = player.hand.find(c => c.id === cardId);
  if (!card) return 'Карта не в руке';

  // Card must match the attack rank
  const attackRank = state.battleField[0]?.attack.rank;
  if (card.rank !== attackRank) return 'Проездной должен совпадать по номиналу с атакующей картой';

  // Card must be a trump card
  if (card.suit !== state.trumpInfo.currentTrump) return 'Проездной должен быть козырной картой';

  // Each card can only be used as pass-through once per game
  if (state.passThroughUsedIds.includes(cardId)) return 'Эта карта уже использовалась как проездной';

  // Check if the next defender has enough cards to handle all attack cards
  const totalAttackCards = state.battleField.length; // pass-through doesn't add to battlefield
  // For 10-card pass-through, direction will reverse, so check with the reversed direction
  const checkDir = (card.rank === '10' && state.leadCardRank === '10')
    ? (state.direction === 'cw' ? 'ccw' : 'cw')
    : state.direction;
  const newDefenderIdxCheck = getNextActivePlayer(state.players, state.currentDefenderIdx, checkDir);
  const nextDefender = state.players[newDefenderIdxCheck];
  // Phantom neighbor rule: cannot pass-through to a player who just went out this trick
  if (state.phantomNeighborIdx !== null && newDefenderIdxCheck === state.phantomNeighborIdx) {
    return `Нельзя проехать — игрок (${nextDefender.name}) уже вышел из игры в этом ходу`;
  }
  if (nextDefender.hand.length < totalAttackCards) {
    return `Нельзя проехать — у следующего игрока (${nextDefender.name}) только ${nextDefender.hand.length} карт(ы), а на столе ${totalAttackCards}`;
  }

  // Mark this card as used for pass-through (one-time per game)
  state.passThroughUsedIds.push(cardId);

  // Add to revealed pass-throughs for this trick (visible to all players)
  const existing = state.revealedPassThroughs.find(r => r.playerId === player.id);
  if (existing) {
    existing.cards.push(card);
  } else {
    state.revealedPassThroughs.push({ playerId: player.id, cards: [card] });
  }

  // The card stays in the player's hand — NOT removed
  // Special 10-card pass-through: reverse direction (same as transfer with 10)
  if (card.rank === '10' && state.leadCardRank === '10') {
    state.direction = state.direction === 'cw' ? 'ccw' : 'cw';
  }

  // Transfer the attack: defender becomes attacker, next player becomes defender
  const newDefenderIdx = getNextActivePlayer(state.players, state.currentDefenderIdx, state.direction);
  state.currentAttackerIdx = state.currentDefenderIdx;
  state.currentDefenderIdx = newDefenderIdx;

  state.passedAttackers = [];
  state.attackerHasPriority = true;
  state.defenderTaking = false;
  resetTurnTimer(state);
  return null;
}

// ---- Multi-card Pass-through ----
// Show multiple pass-through cards at once (e.g., multiple 10s as proezdnoy).
// Each 10 reverses direction, so odd count = reverse, even count = no change.

export function showMultiplePassThroughs(state: GameState, playerIdx: number, cardIds: string[]): string | null {
  if (cardIds.length === 0) return 'Нет карт для показа';
  if (cardIds.length === 1) return showPassThrough(state, playerIdx, cardIds[0]);

  if (playerIdx !== state.currentDefenderIdx) return 'Не ваш ход';
  if (state.defenderTaking) return 'Вы уже берёте карты';
  if (state.battleField.length === 0) return 'Нет карт на столе';
  if (state.battleField.some(p => p.defense !== null)) {
    return 'Проездной можно показать только до начала защиты';
  }

  const player = state.players[playerIdx];
  const attackRank = state.battleField[0]?.attack.rank;

  // Validate all cards
  const cards: Card[] = [];
  for (const cardId of cardIds) {
    const card = player.hand.find(c => c.id === cardId);
    if (!card) return `Карта ${cardId} не в руке`;
    if (card.rank !== attackRank) return 'Проездной должен совпадать по номиналу с атакующей картой';
    if (card.suit !== state.trumpInfo.currentTrump) return 'Проездной должен быть козырной картой';
    if (state.passThroughUsedIds.includes(cardId)) return `Карта ${cardId} уже использовалась как проездной`;
    cards.push(card);
  }

  // Multiple tens thrown at once count as ONE direction change (not per-card)
  const hasTens = cards.some(c => c.rank === '10');
  const hasDirectionChange = hasTens && state.leadCardRank === '10';

  const potentialDir = hasDirectionChange
    ? (state.direction === 'cw' ? 'ccw' : 'cw')
    : state.direction;

  // Check if the next defender has enough cards
  const totalAttackCards = state.battleField.length;
  const newDefenderIdxCheck = getNextActivePlayer(state.players, state.currentDefenderIdx, potentialDir);
  const nextDefender = state.players[newDefenderIdxCheck];
  // Phantom neighbor rule: cannot pass-through to a player who just went out this trick
  if (state.phantomNeighborIdx !== null && newDefenderIdxCheck === state.phantomNeighborIdx) {
    return `Нельзя проехать — игрок (${nextDefender.name}) уже вышел из игры в этом ходу`;
  }
  if (nextDefender.hand.length < totalAttackCards) {
    return `Нельзя проехать — у следующего игрока (${nextDefender.name}) только ${nextDefender.hand.length} карт(ы), а на столе ${totalAttackCards}`;
  }

  // Mark all cards as used
  for (const card of cards) {
    state.passThroughUsedIds.push(card.id);
  }

  // Add to revealed pass-throughs
  const existing = state.revealedPassThroughs.find(r => r.playerId === player.id);
  if (existing) {
    existing.cards.push(...cards);
  } else {
    state.revealedPassThroughs.push({ playerId: player.id, cards: [...cards] });
  }

  // Apply direction change
  if (hasDirectionChange) {
    state.direction = potentialDir as Direction;
  }

  // Transfer the attack
  const newDefenderIdx = getNextActivePlayer(state.players, state.currentDefenderIdx, state.direction);
  state.currentAttackerIdx = state.currentDefenderIdx;
  state.currentDefenderIdx = newDefenderIdx;

  state.passedAttackers = [];
  state.attackerHasPriority = true;
  state.defenderTaking = false;
  resetTurnTimer(state);
  return null;
}

// ---- Take cards (defender chooses to take) ----
// NEW: Does NOT immediately take. Sets defenderTaking=true so attackers can add more cards.
// Cards are actually picked up when all attackers press "bito" (via finalizeTake).

export function takeCards(state: GameState): void {
  // Mark that defender is taking — attackers can now add more cards
  state.defenderTaking = true;
  state.turnPhase = 'pickup';
  state.attackerHasPriority = true;
  state.passedAttackers = [];
  resetTurnTimer(state);
}

// ---- Finalize take — actually move cards to defender's hand ----

export function finalizeTake(state: GameState): void {
  const defender = state.players[state.currentDefenderIdx];
  for (const pair of state.battleField) {
    defender.hand.push(pair.attack);
    if (pair.defense) defender.hand.push(pair.defense);
  }
  state.battleField = [];
  state.turnPhase = 'attack';
  state.firstTrick = false;
  state.trickCount++;
  state.leadCardRank = null;
  state.attackerHasPriority = true;
  state.passedAttackers = [];
  state.defenderTaking = false;
  state.revealedPassThroughs = []; // Clear revealed pass-throughs for next trick
  state.phantomNeighborIdx = null; // Round ended — phantom neighbor no longer applies

  drawCards(state);
  checkAllPlayersOut(state); // Check if any players ran out of cards after draw

  const nextAttacker = getNextActivePlayer(state.players, state.currentDefenderIdx, state.direction);
  state.currentAttackerIdx = nextAttacker;
  state.currentDefenderIdx = getNextActivePlayer(state.players, nextAttacker, state.direction);

  ensureActiveAttackerDefender(state);
  resetTurnTimer(state);
  checkGameOver(state);
}

// ---- Successful defense ----

export function successfulDefense(state: GameState): void {
  for (const pair of state.battleField) {
    state.discardPile.push(pair.attack);
    if (pair.defense) state.discardPile.push(pair.defense);
  }
  state.battleField = [];
  state.turnPhase = 'attack';
  state.firstTrick = false;
  state.trickCount++;
  state.leadCardRank = null;
  state.attackerHasPriority = true;
  state.passedAttackers = [];
  state.defenderTaking = false;
  state.revealedPassThroughs = []; // Clear revealed pass-throughs for next trick
  state.phantomNeighborIdx = null; // Round ended — phantom neighbor no longer applies

  drawCards(state);
  checkAllPlayersOut(state); // Check if any players ran out of cards after draw

  state.currentAttackerIdx = state.currentDefenderIdx;
  state.currentDefenderIdx = getNextActivePlayer(state.players, state.currentDefenderIdx, state.direction);

  ensureActiveAttackerDefender(state);
  resetTurnTimer(state);
  checkGameOver(state);
}

// ---- End attack / "Бито" — multi-attacker priority mechanic ----
// 
// Flow:
// 1. Attacker plays cards, has priority. Edge players wait.
// 2. Attacker presses "бито" → priority passes to next edge player.
// 3. Edge player can add cards. If defender beats with a rank that attacker has → attacker regains priority.
// 4. When ALL eligible attackers have pressed "бито":
//    - If defenderTaking=true → finalizeTake (defender picks up cards)
//    - If all cards defended → successfulDefense
//    - Otherwise → defender must still take or defend

export function endAttack(state: GameState, playerIdx: number): string | null {
  if (state.battleField.length === 0) return 'На столе нет карт';

  const isCurrentAttacker = playerIdx === state.currentAttackerIdx;
  const isEdge = canPlayerAddCards(state, playerIdx);
  if (!isCurrentAttacker && !isEdge) return 'Вы не атакующий и не крайний игрок';

  const playerId = state.players[playerIdx].id;
  if (!state.passedAttackers.includes(playerId)) {
    state.passedAttackers.push(playerId);
  }

  // If defender is taking (pickup mode)
  if (state.defenderTaking) {
    if (checkAllAttackersPassed(state)) {
      finalizeTake(state);
      return null;
    }
    // Pass priority to next unpassed attacker
    const nextAttackerIdx = findNextUnpassedAttacker(state, playerIdx);
    if (nextAttackerIdx !== null) {
      state.currentAttackerIdx = nextAttackerIdx;
      state.attackerHasPriority = true;
      resetTurnTimer(state);
      return null;
    }
    // No one else can add — finalize take
    finalizeTake(state);
    return null;
  }

  // Normal mode — all cards defended
  if (state.battleField.every(p => p.defense)) {
    if (checkAllAttackersPassed(state)) {
      successfulDefense(state);
      return null;
    }

    // Pass to next eligible attacker who hasn't passed yet
    const nextAttackerIdx = findNextUnpassedAttacker(state, playerIdx);
    if (nextAttackerIdx !== null) {
      state.currentAttackerIdx = nextAttackerIdx;
      state.attackerHasPriority = true;
      resetTurnTimer(state);
      return null;
    }

    // Everyone passed or no one else can add
    successfulDefense(state);
    return null;
  }

  // Not all defended, not taking — pass to next edge player
  const nextAttackerIdx = findNextUnpassedAttacker(state, playerIdx);
  if (nextAttackerIdx !== null) {
    state.currentAttackerIdx = nextAttackerIdx;
    state.attackerHasPriority = true;
    resetTurnTimer(state);
    return null;
  }

  // No one else can add — defender must take or defend remaining
  // Make sure turnPhase is 'defend' so defender gets actions
  state.turnPhase = 'defend';
  state.attackerHasPriority = false;
  resetTurnTimer(state);
  return null;
}

// Find the next edge attacker who hasn't passed yet
function findNextUnpassedAttacker(state: GameState, fromIdx: number): number | null {
  const n = state.players.length;
  let idx = fromIdx;
  for (let i = 0; i < n; i++) {
    idx = state.direction === 'cw' ? (idx + 1) % n : (idx - 1 + n) % n;
    if (idx === state.currentDefenderIdx) continue;
    if (state.players[idx].isOut) continue;
    if (state.passedAttackers.includes(state.players[idx].id)) continue;
    if (canPlayerAddCards(state, idx) || idx === state.currentAttackerIdx) {
      return idx;
    }
  }
  return null;
}

// Auto-pass all attackers who have no cards to add (e.g. when defender went out)
function autoPassAttackersWithNoCards(state: GameState): void {
  const ranksOnTable = new Set<string>();
  for (const pair of state.battleField) {
    ranksOnTable.add(pair.attack.rank);
    if (pair.defense) ranksOnTable.add(pair.defense.rank);
  }
  const n = state.players.length;
  for (let i = 0; i < n; i++) {
    if (i === state.currentDefenderIdx) continue;
    if (state.players[i].isOut) {
      // Already out — auto-pass
      if (!state.passedAttackers.includes(state.players[i].id)) {
        state.passedAttackers.push(state.players[i].id);
      }
      continue;
    }
    if (!canPlayerAddCards(state, i) && i !== state.currentAttackerIdx) continue;
    // Check if this player has any matching cards to add
    // For non-neighbors in six-exception, only check for sixes
    const hasMatchingCards = state.players[i].hand.some(c => 
      ranksOnTable.has(c.rank) && canNonNeighborPlayCard(state, i, c)
    );
    if (!hasMatchingCards) {
      if (!state.passedAttackers.includes(state.players[i].id)) {
        state.passedAttackers.push(state.players[i].id);
      }
    }
  }
}

// Check if all eligible attackers have passed
function checkAllAttackersPassed(state: GameState): boolean {
  const n = state.players.length;
  for (let i = 0; i < n; i++) {
    if (i === state.currentDefenderIdx) continue;
    if (state.players[i].isOut) continue;
    if (!canPlayerAddCards(state, i) && i !== state.currentAttackerIdx) continue;
    if (!state.passedAttackers.includes(state.players[i].id)) return false;
  }
  return true;
}

// ---- Timer ----

export function resetTurnTimer(state: GameState): void {
  state.turnTimer = state.turnTimerMax;
}

// ---- Player out check ----

// Prize distribution percentages by total player count
const PRIZE_DISTRIBUTIONS: Record<number, number[]> = {
  2: [100],
  3: [60, 40],
  4: [50, 30, 20],
  5: [40, 25, 20, 15],
  6: [35, 25, 20, 12, 8],
  7: [30, 22, 18, 14, 10, 6],
  8: [28, 20, 16, 13, 10, 7, 6],
};

/** Calculate the prize amount for a given place (1-indexed) */
export function getPrizeForPlace(prizePool: number, totalPlayers: number, place: number): number {
  const dist = PRIZE_DISTRIBUTIONS[totalPlayers] || PRIZE_DISTRIBUTIONS[8]!;
  const idx = place - 1; // 0-indexed
  if (idx < 0 || idx >= dist.length) return 0;
  return Math.floor(prizePool * dist[idx] / 100);
}

export function checkPlayerOut(state: GameState, playerIdx: number): boolean {
  const player = state.players[playerIdx];
  if (player.hand.length === 0 && state.deck1.length === 0 && state.deck2.length === 0) {
    if (!player.isOut) {
      player.isOut = true;
      player.winPlace = state.nextWinPlace;
      state.nextWinPlace++;
      if (!state.winnersOrder.includes(player.id)) {
        state.winnersOrder.push(player.id);
      }
      // Calculate and record prize immediately
      if (state.prizePool > 0) {
        const prizeAmount = getPrizeForPlace(state.prizePool, state.players.length, player.winPlace);
        state.playerPrizes.push({
          playerId: player.id,
          place: player.winPlace,
          amount: prizeAmount,
        });
      }
      // Mark as phantom neighbor: this player just played their last card during the
      // current trick. They remain a "phantom neighbor" until the end of this round
      // so that the player AFTER them doesn't gain neighbor priority prematurely.
      // Only set if the game is still in progress (battlefield is not empty = mid-trick).
      // If the battlefield is empty (trick just ended), no phantom is needed.
      if (state.battleField.length > 0 && state.gamePhase === 'playing') {
        state.phantomNeighborIdx = playerIdx;
      }
      return true; // player just went out
    }
  }
  return false;
}

// Check ALL players for out status (called after drawCards when deck empties)
function checkAllPlayersOut(state: GameState): void {
  for (let i = 0; i < state.players.length; i++) {
    checkPlayerOut(state, i);
  }
}

// Ensure attacker and defender are active players (not winners)

function ensureActiveAttackerDefender(state: GameState): void {
  const activePlayers = state.players.filter(p => !p.isOut);
  if (activePlayers.length <= 1) return;

  if (state.players[state.currentAttackerIdx].isOut) {
    state.currentAttackerIdx = getNextActivePlayer(state.players, state.currentAttackerIdx, state.direction);
  }
  if (state.players[state.currentDefenderIdx].isOut || state.currentDefenderIdx === state.currentAttackerIdx) {
    state.currentDefenderIdx = getNextActivePlayer(state.players, state.currentAttackerIdx, state.direction);
  }
}

// ---- Forfeit (player leaves game voluntarily) ----

export function forfeitPlayer(state: GameState, playerIdx: number): void {
  const player = state.players[playerIdx];
  if (player.isOut) return; // Already out

  // Mark player as left and out
  player.leftGame = true;
  player.isOut = true;

  // Count how many active players remain AFTER this forfeit
  const remainingActive = state.players.filter(p => !p.isOut).length;

  if (remainingActive <= 1) {
    // Only 0 or 1 players left — this forfeiter is the loser (durak)
    state.loserId = player.id;
  } else {
    // Multiple players still playing — assign last place to the forfeiter
    // In Durak, the last person standing is the loser.
    // Forfeited players get the worst remaining places (counting down from total).
    // Track forfeited players separately — they get places after all active players finish.
    if (!state.forfeitOrder) state.forfeitOrder = [];
    state.forfeitOrder.push(player.id);
  }

  // Move all cards from hand to discard pile
  for (const card of player.hand) {
    state.discardPile.push(card);
  }
  player.hand = [];

  // If this player was involved in current battle, handle it
  const isAttacker = playerIdx === state.currentAttackerIdx;
  const isDefender = playerIdx === state.currentDefenderIdx;

  if (isDefender) {
    // Defender left — all battlefield cards go to discard
    for (const pair of state.battleField) {
      state.discardPile.push(pair.attack);
      if (pair.defense) state.discardPile.push(pair.defense);
    }
    state.battleField = [];
    state.turnPhase = 'attack';
    state.defenderTaking = false;
    state.passedAttackers = [];
    state.revealedPassThroughs = [];
    state.attackerHasPriority = true;
  }

  if (isAttacker) {
    // Auto-pass this attacker
    if (!state.passedAttackers.includes(player.id)) {
      state.passedAttackers.push(player.id);
    }
  }

  // Reassign attacker/defender if needed
  ensureActiveAttackerDefender(state);

  // If defender left and we cleared the battlefield, set up new trick
  if (isDefender) {
    state.currentAttackerIdx = getNextActivePlayer(state.players, playerIdx, state.direction);
    state.currentDefenderIdx = getNextActivePlayer(state.players, state.currentAttackerIdx, state.direction);
    resetTurnTimer(state);
  }

  // Check if game is over
  checkGameOver(state);
}

// ---- Game over check ----

export function checkGameOver(state: GameState): void {
  const activePlayers = state.players.filter(p => !p.isOut);
  if (activePlayers.length <= 1) {
    state.gamePhase = 'finished';
    if (activePlayers.length === 1) {
      if (!state.loserId) {
        // Normal game end: last remaining player is the loser (durak)
        state.loserId = activePlayers[0].id;
      } else {
        // Forfeit case: loserId already set, remaining player is a winner
        const remaining = activePlayers[0];
        if (!remaining.winPlace) {
          remaining.isOut = true;
          remaining.winPlace = state.nextWinPlace;
          state.nextWinPlace++;
          if (!state.winnersOrder.includes(remaining.id)) {
            state.winnersOrder.push(remaining.id);
          }
          if (state.prizePool > 0) {
            const prizeAmount = getPrizeForPlace(state.prizePool, state.players.length, remaining.winPlace);
            state.playerPrizes.push({
              playerId: remaining.id,
              place: remaining.winPlace,
              amount: prizeAmount,
            });
          }
        }
      }
    } else if (activePlayers.length === 0) {
      // All players forfeited — last forfeiter is the loser
      if (state.forfeitOrder && state.forfeitOrder.length > 0 && !state.loserId) {
        state.loserId = state.forfeitOrder[state.forfeitOrder.length - 1];
      }
    }

    // Assign winPlace to forfeited players in reverse order (first to leave = worst place)
    if (state.forfeitOrder && state.forfeitOrder.length > 0) {
      const totalPlayers = state.players.length;
      // Forfeited players get places from worst to better
      // Last place = totalPlayers (for 2-player: loser is place 2)
      // The loser (loserId) gets the absolute last place
      // Forfeited players who aren't the loserId get places just before the loser
      for (let i = 0; i < state.forfeitOrder.length; i++) {
        const fId = state.forfeitOrder[i];
        const fPlayer = state.players.find(p => p.id === fId);
        if (fPlayer && !fPlayer.winPlace && fPlayer.id !== state.loserId) {
          // First forfeiter gets worst non-loser place, etc.
          const place = totalPlayers - 1 - i;
          if (place >= 1) {
            fPlayer.winPlace = place;
          }
        }
      }
    }
  }
}

// ---- Available actions ----

export function getAvailableActions(state: GameState, playerIdx: number): AvailableAction[] {
  if (state.gamePhase !== 'playing') return [];
  const player = state.players[playerIdx];
  if (player.isOut) return [];
  const actions: AvailableAction[] = [];

  if (shouldSkipTurn(state, playerIdx)) {
    actions.push({ type: 'skipTurn' });
    return actions;
  }

  const isAttacker = playerIdx === state.currentAttackerIdx;
  const isDefender = playerIdx === state.currentDefenderIdx;

  // === DEFENDER ACTIONS ===
  if (isDefender && !state.defenderTaking) {
    if (state.turnPhase === 'defend') {
      // Defense cards
      const undefended = state.battleField.filter(p => !p.defense);
      const playableIds: string[] = [];
      for (const card of player.hand) {
        for (const pair of undefended) {
          if (canBeat(pair.attack, card, state.trumpInfo.currentTrump)) {
            if (!playableIds.includes(card.id)) playableIds.push(card.id);
          }
        }
      }
      if (playableIds.length > 0) {
        actions.push({ type: 'playCard', cardIds: playableIds });
      }

      // Transfer option — show all matching cards for choice
      // Only show if next defender has enough cards to handle the transfer
      // Transfer is NOT limited by the 13-card first bito rule
      if (state.battleField.length > 0 && state.battleField.every(p => !p.defense)) {
        const totalAfterTransfer = state.battleField.length + 1;
        const attackRank = state.battleField[0].attack.rank;
        const transferCards = player.hand.filter(c => c.rank === attackRank).map(c => c.id);
        if (transferCards.length > 0) {
          // Check next defender has enough cards (battlefield + 1 transfer card)
          const nextDefIdx = getNextActivePlayer(state.players, state.currentDefenderIdx, state.direction);
          const nextDef = state.players[nextDefIdx];
          // Phantom neighbor rule: don't offer transfer if next defender just went out this trick
          const isPhantomTarget = state.phantomNeighborIdx !== null && nextDefIdx === state.phantomNeighborIdx;
          if (!isPhantomTarget && nextDef.hand.length >= totalAfterTransfer) {
            actions.push({ type: 'transferCard', cardIds: transferCards });
          }
        }
      }

      // Pass-through (проездной) — show trump cards matching attack rank that haven't been used yet
      // Only available BEFORE defender starts defending (no cards defended yet)
      // Only show if next defender has enough cards
      if (state.battleField.length > 0 && state.battleField.every(p => !p.defense)) {
        const attackRank = state.battleField[0].attack.rank;
        const passThroughCards = player.hand.filter(c =>
          c.rank === attackRank &&
          c.suit === state.trumpInfo.currentTrump &&
          !state.passThroughUsedIds.includes(c.id)
        ).map(c => c.id);
        if (passThroughCards.length > 0) {
          const nextDefIdx = getNextActivePlayer(state.players, state.currentDefenderIdx, state.direction);
          const nextDef = state.players[nextDefIdx];
          // Phantom neighbor rule: don't offer pass-through if next defender just went out this trick
          const isPhantomTarget = state.phantomNeighborIdx !== null && nextDefIdx === state.phantomNeighborIdx;
          if (!isPhantomTarget && nextDef.hand.length >= state.battleField.length) {
            actions.push({ type: 'showPassThrough', cardIds: passThroughCards });
          }
        }
      }

      actions.push({ type: 'takeCards' });
    }
  }

  // === ATTACKER ACTIONS ===
  if (isAttacker) {
    // In pickup mode, attacker can add cards
    if (state.defenderTaking) {
      if (canAddMoreAttackCards(state)) {
        const playableIds = player.hand
          .filter(c => canPlayAsAttack(state, c) && canNonNeighborPlayCard(state, playerIdx, c))
          .map(c => c.id);
        if (playableIds.length > 0) {
          actions.push({ type: 'playCard', cardIds: playableIds });
        }
      }
      // Always can press "бито" in pickup mode
      actions.push({ type: 'endAttack' });
      return actions;
    }

    // Attacker can play cards in attack phase, or add cards during defend phase
    if (state.turnPhase === 'attack' || state.battleField.length === 0) {
      if (state.battleField.length === 0 || canAddMoreAttackCards(state)) {
        const playableIds = player.hand
          .filter(c => canPlayAsAttack(state, c) && (state.battleField.length === 0 || canNonNeighborPlayCard(state, playerIdx, c)))
          .map(c => c.id);
        if (playableIds.length > 0) {
          actions.push({ type: 'playCard', cardIds: playableIds });
        }
      }
    } else if (state.turnPhase === 'defend' && state.battleField.length > 0) {
      // Attacker can add matching cards during defend phase
      // Exception: if leadCardRank is '6' and attacker is NOT a neighbor, they can only add sixes
      if (canAddMoreAttackCards(state)) {
        const isNeighbor = isEdgePlayer(state.players, playerIdx, state.currentDefenderIdx, state.direction, state.phantomNeighborIdx);
        const playableIds = player.hand
          .filter(c => {
            if (!canPlayAsAttack(state, c)) return false;
            // If lead is 6 and attacker is not a neighbor, only sixes allowed
            if (state.leadCardRank === '6' && !isNeighbor) return c.rank === '6';
            return true;
          })
          .map(c => c.id);
        if (playableIds.length > 0) {
          actions.push({ type: 'playCard', cardIds: playableIds });
        }
      }
    }

    // "Бито" button — attacker can ALWAYS press бито when cards are on table
    // This prevents deadlocks where attacker has no way to end their turn
    if (state.battleField.length > 0) {
      actions.push({ type: 'endAttack' });
    }
  }

  // === EDGE PLAYER ACTIONS (non-attacker, non-defender) ===
  if (!isAttacker && !isDefender && canPlayerAddCards(state, playerIdx)) {
    if (state.battleField.length > 0) {
      // Whether this player is a true neighbor of the defender (phantom-aware)
      const isNeighborOfDefender = isEdgePlayer(state.players, playerIdx, state.currentDefenderIdx, state.direction, state.phantomNeighborIdx);

      // RULE: When defender is taking cards:
      // - Neighbors can always act
      // - Non-neighbors can act ONLY if they have at least one 6 in hand
      const hasSixInHandForTaking = player.hand.some(c => c.rank === '6');
      if (state.defenderTaking && !isNeighborOfDefender && !hasSixInHandForTaking) {
        // Non-neighbor without a 6 during pickup: no actions
      } else {
        // Six exception: when lead card is 6, ANY player can throw sixes immediately
        // regardless of attackerHasPriority (they don't wait for their turn)
        const isSixException = state.leadCardRank === '6';
        const canAct = !state.attackerHasPriority || isSixException;
        const hasSixInHand = player.hand.some(c => c.rank === '6');
        // Non-neighbor can ONLY participate when lead card is 6 AND they have a 6 in hand.
        const isSixOnlyParticipant = !isNeighborOfDefender;
        if (isSixOnlyParticipant && (!isSixException || !hasSixInHand)) {
          // Non-neighbor without six exception or without sixes in hand: no actions
        } else if (canAct) {
          if (state.defenderTaking) {
            // In pickup mode: neighbors can add any valid card;
            // non-neighbors (who passed the hasSix gate above) can only add sixes
            if (canAddMoreAttackCards(state)) {
              const playableIds = player.hand
                .filter(c => {
                  if (!canPlayAsAttack(state, c)) return false;
                  // Non-neighbor: only sixes allowed
                  if (!isNeighborOfDefender && c.rank !== '6') return false;
                  return true;
                })
                .map(c => c.id);
              if (playableIds.length > 0) {
                actions.push({ type: 'playCard', cardIds: playableIds });
              }
            }
            // Can press "бито" to pass
            if (!state.passedAttackers.includes(player.id)) {
              actions.push({ type: 'endAttack' });
            }
          } else {
            // Normal mode — edge can add cards when all defended or when there are cards on table
            if (canAddMoreAttackCards(state)) {
              const playableIds = player.hand
                .filter(c => canPlayAsAttack(state, c) && canNonNeighborPlayCard(state, playerIdx, c))
                .map(c => c.id);
              if (playableIds.length > 0) {
                actions.push({ type: 'playCard', cardIds: playableIds });
              }
            }
            // Edge players can also click "бито" to pass
            if (state.battleField.every(p => p.defense) && !state.passedAttackers.includes(player.id)) {
              actions.push({ type: 'endAttack' });
            }
          }
        }
      }
    }
  }

  return actions;
}

// ---- Client state conversion ----

export function toClientState(
  state: GameState,
  playerId: string,
  playerGameIdsMap?: Map<string, number>,
  playerAvatarIdsMap?: Map<string, string>,
  playerEquippedFramesMap?: Map<string, string>,
  betAmount: number = 0,
  isTutorial: boolean = false,
  playerSeasonRatingsMap?: Map<string, number>,
): ClientGameState {
  const myIndex = state.players.findIndex(p => p.id === playerId);

  const clientPlayers: ClientPlayer[] = state.players.map(p => ({
    id: p.id,
    name: p.name,
    cardCount: p.hand.length,
    isOut: p.isOut,
    seatIndex: p.seatIndex,
    isBot: p.isBot,
    winPlace: p.winPlace,
    leftGame: p.leftGame,
    gameId: playerGameIdsMap?.get(p.id),
    avatarId: playerAvatarIdsMap?.get(p.id) ?? p.avatarId ?? (p.isBot ? 'bot' : undefined),
    equippedFrame: playerEquippedFramesMap?.get(p.id) ?? null,
    seasonRating: p.isBot ? 0 : (playerSeasonRatingsMap?.get(p.id) ?? 0),
  }));

  const playerCanAdd = myIndex >= 0 ? canPlayerAddCards(state, myIndex) : false;

  return {
    roomId: state.roomId,
    players: clientPlayers,
    deck1Count: state.deck1.length,
    deck2Count: state.deck2.length,
    betAmount,
    trumpInfo: {
      ...state.trumpInfo,
      // Always send the trump card (visible to all)
      trumpCard: state.trumpInfo.trumpCard,
      // Hidden trump card under deck1:
      // Phase 1: invisible (not sent) — players don't know it exists
      // Phase 2: revealed face-up (actual suit/rank) — players see the new trump
      // Phase 3+: not sent (no longer relevant)
      hiddenTrumpCard1: state.trumpInfo.hiddenTrumpCard1
        ? (state.trumpInfo.phase === 2
          ? { ...state.trumpInfo.hiddenTrumpCard1 } // face up — revealed!
          : undefined) // phase 1: invisible, phase 3+: no longer relevant
        : undefined,
      // Hidden trump card under deck2: face down during phase 1, not sent after phase 2 (drawn into deck)
      hiddenTrumpCard: state.trumpInfo.hiddenTrumpCard
        ? (state.trumpInfo.phase === 1
          ? { id: 'hidden', suit: null, rank: '777' as const, copy: 0 } // face down
          : undefined) // once phase 2+, it's been drawn
        : undefined,
    },
    battleField: state.battleField,
    discardCount: state.discardPile.length,
    currentAttackerIdx: state.currentAttackerIdx,
    currentDefenderIdx: state.currentDefenderIdx,
    direction: state.direction,
    turnPhase: state.turnPhase,
    gamePhase: state.gamePhase,
    firstTrick: state.firstTrick,
    trickCount: state.trickCount,
    myHand: myIndex >= 0 ? state.players[myIndex].hand : [],
    myIndex,
    winnersOrder: state.winnersOrder,
    loserId: state.loserId,
    turnTimer: state.turnTimer,
    turnTimerMax: state.turnTimerMax,
    leadCardRank: state.leadCardRank,
    attackerHasPriority: state.attackerHasPriority,
    passedAttackers: state.passedAttackers,
    canAddCards: playerCanAdd,
    defenderTaking: state.defenderTaking,
    revealedPassThroughs: state.revealedPassThroughs.map(r => ({
      playerId: r.playerId,
      cards: r.cards.map(c => ({ id: c.id, suit: c.suit, rank: c.rank, copy: c.copy })),
    })),
    deckStyle: state.deckStyle,
    tableStyle: state.tableStyle ?? 'classic',
    availableActions: myIndex >= 0 ? getAvailableActions(state, myIndex) : [],
    playerPrizes: state.playerPrizes,
    prizePool: state.prizePool,
    isTutorial,
    phantomNeighborIdx: state.phantomNeighborIdx,
  };
}

// ---- Bot AI ----

export function getBotAction(state: GameState, botIdx: number): { action: string; cardId?: string; targetPairIdx?: number } | null {
  const player = state.players[botIdx];
  if (player.isOut || !player.isBot) return null;

  const actions = getAvailableActions(state, botIdx);
  if (actions.length === 0) return null;

  const isDefender = botIdx === state.currentDefenderIdx;
  const isAttacker = botIdx === state.currentAttackerIdx;

  if (shouldSkipTurn(state, botIdx)) {
    return { action: 'skipTurn' };
  }

  if (isDefender && state.turnPhase === 'defend' && !state.defenderTaking) {
    // Bot tries to transfer first (50% chance if possible, or if hand is weak)
    const transferAction = actions.find(a => a.type === 'transferCard');
    if (transferAction && transferAction.type === 'transferCard' && transferAction.cardIds.length > 0) {
      const shouldTransfer = Math.random() > 0.5 || player.hand.length > 10;
      if (shouldTransfer) {
        const transferCards = player.hand
          .filter(c => transferAction.cardIds.includes(c.id))
          .sort((a, b) => getCardValue(a) - getCardValue(b));
        if (transferCards.length > 0) {
          return { action: 'transferCard', cardId: transferCards[0].id };
        }
      }
    }

    // Try to defend with the cheapest card possible
    const undefended = state.battleField.filter(p => !p.defense);
    for (const pair of undefended) {
      const pairIdx = state.battleField.indexOf(pair);
      const candidates = player.hand
        .filter(c => canBeat(pair.attack, c, state.trumpInfo.currentTrump))
        .sort((a, b) => getCardValue(a) - getCardValue(b));
      if (candidates.length > 0) {
        return { action: 'playDefense', cardId: candidates[0].id, targetPairIdx: pairIdx };
      }
    }
    return { action: 'takeCards' };
  }

  if (isAttacker) {
    const playAction = actions.find(a => a.type === 'playCard');
    if (playAction && playAction.type === 'playCard' && playAction.cardIds.length > 0) {
      if (state.defenderTaking) {
        // In pickup mode, bot adds 1-2 cards then presses бито
        // Count how many undefended cards are already on the table
        const undefendedCount = state.battleField.filter(p => !p.defense).length;
        // If there are already several undefended cards, just press бито
        if (undefendedCount >= 3) {
          if (actions.find(a => a.type === 'endAttack')) return { action: 'endAttack' };
        }
        // Otherwise add a card with 50% chance
        if (Math.random() < 0.5) {
          const playableCards = player.hand
            .filter(c => playAction.cardIds.includes(c.id))
            .sort((a, b) => getCardValue(a) - getCardValue(b));
          if (playableCards.length > 0) {
            return { action: 'playAttack', cardId: playableCards[0].id };
          }
        }
      } else {
        // Normal attack mode
        const playableCards = player.hand
          .filter(c => playAction.cardIds.includes(c.id))
          .sort((a, b) => getCardValue(a) - getCardValue(b));
        if (playableCards.length > 0) {
          return { action: 'playAttack', cardId: playableCards[0].id };
        }
      }
    }
    // Bot clicks "бито" to pass initiative
    if (actions.find(a => a.type === 'endAttack')) return { action: 'endAttack' };
  }

  // Edge player adding cards
  const addAction = actions.find(a => a.type === 'playCard');
  if (addAction && addAction.type === 'playCard') {
    const playableCards = player.hand
      .filter(c => addAction.cardIds.includes(c.id))
      .sort((a, b) => getCardValue(a) - getCardValue(b));
    if (playableCards.length > 0 && Math.random() > 0.4) {
      return { action: 'playAttack', cardId: playableCards[0].id };
    }
  }

  // Edge player "бито" pass
  if (actions.find(a => a.type === 'endAttack')) {
    return { action: 'endAttack' };
  }

  return null;
}
