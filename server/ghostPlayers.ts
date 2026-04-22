/**
 * Ghost Player System — Simulates real human players for cold-start.
 *
 * Ghost players:
 * - Connect via socket.io-client to the local server (same process)
 * - Are NOT marked as isBot — they look identical to real players
 * - Are NOT counted in botCount statistics
 * - Have unique personalities: skill level, play speed, temperament
 * - Create rooms, join rooms, play games, use emotions, sometimes leave early
 * - Have diverse cosmetic profiles (avatars, frames, emotion packs)
 */

import { io as ioClient, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents, Room, AvailableAction, ClientGameState } from '../shared/gameTypes';
import { RANK_ORDER } from '../shared/gameTypes';
import type { TableStyle } from '../shared/cardAssets';
import { getAvailableRooms } from './socketServer';
import { provisionGhostPlayer, refillGhostShanyrak, getGhostLearningStats, getShopPriceOverrides } from './db';

// ─── Types ──────────────────────────────────────────────────────────────────

type GhostState = 'idle' | 'browsing' | 'in_lobby' | 'in_game' | 'disconnected';

type Temperament = 'aggressive' | 'passive' | 'balanced' | 'troll' | 'friendly';

interface GhostPersonality {
  nick: string;
  /** 0.0 = very weak, 1.0 = expert */
  skill: number;
  /** ms range for thinking before playing a card */
  thinkMinMs: number;
  thinkMaxMs: number;
  /** Extra long think probability (0–1) — "AFK moment" */
  longThinkProb: number;
  /** Probability of leaving mid-game (0–1) */
  ragequitProb: number;
  /** Probability of leaving lobby before game starts (0–1) */
  lobbyLeaveProb: number;
  /** Probability of sending an emotion per turn (0–1) */
  emotionProb: number;
  temperament: Temperament;
  avatarId: string;
  equippedFrame?: string;
  emotionPack: string;
  /** Preferred bet range [min, max] in shanyraks */
  betRange: [number, number];
  /** Preferred player count range */
  playerCountRange: [number, number];
  /** Preferred deck style */
  preferredDeckStyle: 'classic' | 'custom';
  /** Preferred table style */
  preferredTableStyle: TableStyle;
}

interface GhostPlayer {
  id: string; // ghost-<nick-slug> — matches DB openId
  personality: GhostPersonality;
  state: GhostState;
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  currentRoomId: string | null;
  isHosting: boolean;
  gameState: ClientGameState | null;
  myActions: AvailableAction[];
  actionTimer: NodeJS.Timeout | null;
  idleTimer: NodeJS.Timeout | null;
  lobbyTimer: NodeJS.Timeout | null;
  reconnectAttempts: number;
  /** Real DB gameId for registerProfile (0 until provisioned) */
  dbGameId: number;
  /** Real DB season rating for registerProfile (0 until provisioned) */
  dbSeasonRating: number;
}

// ─── Nicknames ───────────────────────────────────────────────────────────────

const GHOST_NICKS: string[] = [
  // Russian/Ukrainian
  'dimon1997', 'Ветерок', 'katya_kyiv98', '4elovek', 'nikita_pro',
  'Roma90', '_andruha', 'igorOK', 'алёна_м', 'MAX_power',
  'zheka_d', 'Юра77', 'slavik', 'tolian', 'misha_ru',
  'olegdn', 'Vitalik', 'danchik', 'rus_34', 'Женёк',
  // Kazakh
  'Айдос', 'nurs_alive', 'Әлібек', 'erlan88', 'bekzat',
  'aru_05', 'daniyar', 'zhandos', 'askar90', 'nomad_kz',
  // Uzbek/Central Asian
  'Aziz_94', 'dilshodlive', 'sardor', 'nodirbek', 'jasur_aka',
  'akmal98', 'farrux', 'ulugbek', 'bek_uz', 'rustam',
  // Azerbaijani
  'elvin', 'Rəşad', 'orxan', 'kamran', 'murad',
  'anar', 'samir', 'ilqar', 'tural', 'emin',
  // Georgian
  'გიორგი', 'nika', 'ლაშა', 'irakli', 'saba',
  'ბექა', 'ზურა', 'temuri', 'vakho', 'gio',
  // Polish
  'Paweł', 'marek', 'Łukasz', 'krzysztof', 'tomek',
  'bartek', 'piotr', 'adrian', 'janek', 'michał',
  // English/International
  'John', 'mike', 'Alex', 'chill_dude', 'noah',
  'david', 'justin', 'player1', 'randomUser', 'realgamer',
  // Female names
  'Катя', 'Алина', 'Даша', 'Милана', 'Аня',
  'Дана', 'Сабина', 'Зарина', 'Мадина', 'Яна',
  // Generic
  'qwerty', 'asdfg', 'zxcvbn', '123abc', 'helloThere',
  'shadow', 'nightowl', 'luckyone', 'fasthand', 'lastmove',
  // More Russian/CIS
  'kolya_nsk', 'petya_spb', 'seryoga', 'dimych', 'kostyan',
  'vovan', 'sashok', 'leha_pro', 'zhenya_k', 'fedya',
  // More Kazakh
  'aibek', 'serik_kz', 'marat_kz', 'bauyrzhan', 'arman_kz',
  'dauren', 'adil_kz', 'temirlan', 'yerlan', 'nurlan',
  // More international
  'kevin', 'chris', 'james_g', 'tyler', 'brandon',
  'lucas', 'ethan', 'oliver', 'liam', 'mason',
];

// ─── Cosmetics ───────────────────────────────────────────────────────────────

// Standard/free avatars (no premium, no season reward)
const FREE_AVATARS = [
  'wolf', 'eagle', 'bear', 'fox', 'snow-leopard',
];

// Shop avatars (premium purchasable — only a few ghosts use these)
const SHOP_AVATARS = [
  'nexus_bunny', 'goose_animated', 'kitsune_emerald', 'dragon_ryu_sapphire',
  'fox_smug', 'bear_angry', 'owl_wise', 'cat_lazy', 'wolf_fierce',
  'tiger_proud', 'panda_happy', 'eagle_determined', 'snow_leopard_calm', 'raccoon_mischievous',
];

// Frames available in shop (non-season only)
// Free frames: fire, neon, lightning, ice, ruby_neon, amber_neon, zircon_neon
// Shop frame: premium
// Season-only frames excluded: great_khan, obsidian_neon, molten_lava, oni_japanese, obsidian_*
const ALL_FRAMES = [
  'fire', 'neon', 'lightning', 'ice',
  'ruby_neon', 'amber_neon', 'zircon_neon',
  'premium',
];

// Emotion packs
const EMOTION_PACKS = ['khan', 'hamster', 'monkey', 'devil', 'raccoon'];

// ─── Personality factory ─────────────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function buildPersonality(nick: string, index: number): GhostPersonality {
  // Distribute skill: 60% weak/medium, 30% decent, 10% strong
  const skillRoll = Math.random();
  let skill: number;
  if (skillRoll < 0.3) skill = rand(0.1, 0.35);       // weak
  else if (skillRoll < 0.7) skill = rand(0.35, 0.65); // medium
  else if (skillRoll < 0.9) skill = rand(0.65, 0.82); // decent
  else skill = rand(0.82, 0.97);                        // strong

  // Speed profile — minimum 2s to avoid looking like a bot
  // Only index=0 (first ghost player) gets the "very slow" profile
  const speedRoll = Math.random();
  let thinkMinMs: number, thinkMaxMs: number, longThinkProb: number;
  if (index === 0) {
    // One special slow player (like a pensioner who thinks long)
    thinkMinMs = 5000; thinkMaxMs = 14000; longThinkProb = 0.0;
  } else if (speedRoll < 0.30) {
    // Fast player
    thinkMinMs = 2000; thinkMaxMs = 3500; longThinkProb = 0.0;
  } else if (speedRoll < 0.75) {
    // Normal player
    thinkMinMs = 2500; thinkMaxMs = 5500; longThinkProb = 0.0;
  } else {
    // Slightly slower player
    thinkMinMs = 3000; thinkMaxMs = 7000; longThinkProb = 0.0;
  }

  const temperaments: Temperament[] = ['aggressive', 'passive', 'balanced', 'troll', 'friendly'];
  const temperament = pickRandom(temperaments);

  // Cosmetics:
  // 65% free avatar, no frame
  // 20% shop avatar, no frame
  // 10% free avatar + frame (small portion use frames)
  //  5% shop avatar + frame
  const cosmeticRoll = Math.random();
  let avatarId: string;
  let equippedFrame: string | undefined;
  let emotionPack: string;

  if (cosmeticRoll < 0.65) {
    avatarId = pickRandom(FREE_AVATARS);
    equippedFrame = undefined;
    emotionPack = 'khan'; // default pack
  } else if (cosmeticRoll < 0.85) {
    avatarId = pickRandom(SHOP_AVATARS);
    equippedFrame = undefined;
    emotionPack = pickRandom(EMOTION_PACKS);
  } else if (cosmeticRoll < 0.95) {
    avatarId = pickRandom(FREE_AVATARS);
    equippedFrame = pickRandom(ALL_FRAMES);
    emotionPack = pickRandom(EMOTION_PACKS);
  } else {
    avatarId = pickRandom(SHOP_AVATARS);
    equippedFrame = pickRandom(ALL_FRAMES);
    emotionPack = pickRandom(EMOTION_PACKS);
  }

  // Preferred deck and table style (small portion use custom/premium)
  const deckStyleRoll = Math.random();
  const preferredDeckStyle: 'classic' | 'custom' = deckStyleRoll < 0.88 ? 'classic' : 'custom';
  // Use only table styles that are available (not hidden by admin via shop_price_overrides).
  // availableTableStyles is refreshed from DB at init. Bias towards 'classic' (3x weight).
  const weightedTableStyles: import('../shared/cardAssets').TableStyle[] = [
    ...availableTableStyles,
    ...availableTableStyles.filter(s => s === 'classic'), // extra weight for classic
    ...availableTableStyles.filter(s => s === 'classic'), // extra weight for classic
  ];
  const preferredTableStyle = pickRandom(weightedTableStyles.length > 0 ? weightedTableStyles : ['classic' as import('../shared/cardAssets').TableStyle]);

  // Bet preferences — lower bets more common
  const betRoll = Math.random();
  let betRange: [number, number];
  if (betRoll < 0.40) betRange = [100, 500];
  else if (betRoll < 0.70) betRange = [200, 1000];
  else if (betRoll < 0.85) betRange = [500, 3000];
  else betRange = [1000, 10000];

  // Player count preferences
  const pcRoll = Math.random();
  let playerCountRange: [number, number];
  if (pcRoll < 0.35) playerCountRange = [2, 3];
  else if (pcRoll < 0.70) playerCountRange = [3, 5];
  else playerCountRange = [4, 6];

  return {
    nick,
    skill,
    thinkMinMs,
    thinkMaxMs,
    longThinkProb,
    ragequitProb: rand(0.0003, 0.0007),
    lobbyLeaveProb: rand(0.05, 0.20),
    emotionProb: rand(0.05, 0.30),
    temperament,
    avatarId,
    equippedFrame,
    emotionPack,
    betRange,
    playerCountRange,
    preferredDeckStyle,
    preferredTableStyle,
  };
}

// ─── Ghost Player Action Logic ───────────────────────────────────────────────

const VALID_EMOTIONS = ['laugh', 'cool', 'angry', 'sad', 'think', 'wow', 'heart', 'hurry', 'win', 'sleep'];

/** Pick an emotion based on temperament */
function pickEmotion(temperament: Temperament): string {
  const emotionsByTemperament: Record<Temperament, string[]> = {
    aggressive: ['angry', 'cool', 'hurry', 'wow'],
    passive: ['sad', 'think', 'sleep', 'heart'],
    balanced: VALID_EMOTIONS,
    troll: ['laugh', 'cool', 'wow', 'win'],
    friendly: ['heart', 'laugh', 'wow', 'cool'],
  };
  return pickRandom(emotionsByTemperament[temperament] || VALID_EMOTIONS);
}

/**
 * Returns true if a card is considered "valuable" — trump J/Q/K/A, King of Spades, or 777.
 * Valuable cards should not be played carelessly (only as last resort).
 */
function isValuableCard(card: ClientGameState['myHand'][number], trumpSuit: ClientGameState['trumpInfo']['currentTrump']): boolean {
  if (card.rank === '777') return true;
  // Trump cards from Jack and above are valuable
  if (card.suit === trumpSuit) {
    const rank = RANK_ORDER[card.rank] ?? 0;
    if (rank >= RANK_ORDER['J']) return true; // J, Q, K, A of trump
  }
  if (card.suit === 'spades' && card.rank === 'K') return true;
  return false;
}

/**
 * From a list of card IDs, pick the best one to play:
 * - Prefer non-valuable cards
 * - Among non-valuable, prefer lowest rank
 * - Fall back to valuable cards only if no other option
 */
function pickBestAttackCard(
  cardIds: string[],
  hand: ClientGameState['myHand'],
  trumpSuit: ClientGameState['trumpInfo']['currentTrump'],
  skill: number,
): string {
  if (cardIds.length === 0) return cardIds[0];

  const cardMap = new Map(hand.map(c => [c.id, c]));
  const cards = cardIds.map(id => cardMap.get(id)).filter(Boolean) as ClientGameState['myHand'];

  if (cards.length === 0) return pickRandom(cardIds);

  // Separate valuable from non-valuable
  const nonValuable = cards.filter(c => !isValuableCard(c, trumpSuit));
  const pool = nonValuable.length > 0 ? nonValuable : cards;

  if (Math.random() < skill) {
    // Skilled: pick lowest rank from pool
    const sorted = [...pool].sort((a, b) => {
      const rankA = RANK_ORDER[a.rank] ?? 0;
      const rankB = RANK_ORDER[b.rank] ?? 0;
      return rankA - rankB;
    });
    return sorted[0].id;
  }
  return pickRandom(pool).id;
}

/**
 * Ghost skill-based action selection.
 * skill=1.0 → always optimal play
 * skill=0.0 → random/suboptimal play
 *
 * Priority order (mirrors real human behaviour):
 *  1. showPassThrough (проездной) — ALWAYS if non-valuable cards available
 *  2. transferCard   (перевод)    — ALWAYS if non-valuable cards available
 *  3. multi-attack   — if attacker has ≥2 cards of same rank on opening move
 *  4. single playCard / defense / endAttack / passTurn
 */
function pickGhostAction(
  actions: AvailableAction[],
  skill: number,
  temperament: Temperament,
  gameState: ClientGameState,
  learningStats?: { transferRate: number; passThroughRate: number; multiAttackRate: number; takeRate: number; total: number },
): { event: string; data?: unknown } | null {
  if (actions.length === 0) return null;

  // ── Apply learning stats to adjust probabilities (if enough data) ──
  // When we have 100+ real human moves, use their patterns to bias ghost decisions.
  // This makes ghosts gradually mirror how real players in this community actually play.
  const hasLearningData = (learningStats?.total ?? 0) >= 100;
  // Learned take rate: how often real defenders choose to take vs defend
  // Used below in the takeCards decision block
  const learnedTakeRate = hasLearningData ? learningStats!.takeRate : null;

  // Check what types of actions are available
  const playCard = actions.find(a => a.type === 'playCard');
  const transferCard = actions.find(a => a.type === 'transferCard');
  const showPassThrough = actions.find(a => a.type === 'showPassThrough');
  const takeCards = actions.find(a => a.type === 'takeCards');
  const endAttack = actions.find(a => a.type === 'endAttack');
  const passTurn = actions.find(a => a.type === 'passTurn');
  const skipTurn = actions.find(a => a.type === 'skipTurn');

  const roomId = gameState.roomId;
  const trumpSuit = gameState.trumpInfo.currentTrump;
  const myHand = gameState.myHand;
  const cardMap = new Map(myHand.map(c => [c.id, c]));

  // Skip turn (non-active player)
  if (skipTurn) return { event: 'skipTurn', data: roomId };

  // When defender is taking cards, ghost player should mostly pass (not pile on)
  // Only aggressive ghosts with matching cards sometimes add more
  if (gameState.defenderTaking) {
    if (passTurn) {
      // 80% chance to pass immediately; aggressive players sometimes add a card
      const addCardChance = temperament === 'aggressive' ? 0.3 : 0.1;
      if (Math.random() > addCardChance || !playCard || !playCard.cardIds.length) {
        return { event: 'passTurn', data: roomId };
      }
      // Aggressive ghost adds one non-valuable card
      const cardId = pickBestAttackCard(playCard.cardIds, myHand, trumpSuit, skill);
      return { event: 'playCard', data: { roomId, cardId } };
    }
    // No passTurn available — endAttack or playCard only
    if (endAttack) return { event: 'endAttack', data: roomId };
  }

  // Pass turn (non-active edge player)
  if (passTurn && !playCard && !endAttack) return { event: 'passTurn', data: roomId };

  // Defender logic
  if (takeCards && !playCard && !transferCard && !showPassThrough) {
    // Only option is to take
    return { event: 'takeCards', data: roomId };
  }

  if (takeCards && playCard) {
    // ── ALL-OR-NOTHING DEFENSE ──────────────────────────────────────────────
    // Count undefended attack cards on the battlefield
    const undefendedPairs = gameState.battleField
      .map((pair, idx) => ({ pair, idx }))
      .filter(({ pair }) => !pair.defense);

    // Skill-based decision: weak bots sometimes try partial defense (looks human)
    // If we have learning data, blend the learned take rate into the decision
    const baseTakeProb = learnedTakeRate !== null
      ? learnedTakeRate * (1 - skill) + 0.3 * skill // blend: learned rate for weak, 30% for strong
      : (0.5 - skill * 0.5); // default: weak=50% take, strong=0% take
    const useAllOrNothing = Math.random() > baseTakeProb; // invert: high take prob → less all-or-nothing

    if (useAllOrNothing && playCard.type === 'playCard') {
      // Check if we can cover ALL undefended cards
      // We have playCard.cardIds.length cards available to defend with
      // If we have fewer defense cards than attack cards, we can't cover all → take
      const canCoverAll = playCard.cardIds.length >= undefendedPairs.length;

      if (!canCoverAll) {
        // Can't cover everything — take immediately, don't defend any
        return { event: 'takeCards', data: roomId };
      }

      // Can cover all — pick best (non-valuable) defense card for first undefended pair
      if (undefendedPairs.length > 0) {
        const targetPairIdx = undefendedPairs[0].idx;
        // Prefer non-valuable defense cards
        const defenseCardId = pickBestAttackCard(playCard.cardIds, myHand, trumpSuit, skill);
        return { event: 'playCard', data: { roomId, cardId: defenseCardId, targetPairIdx } };
      }
    } else {
      // Partial defense (less skilled / random behavior)
      const shouldDefend = Math.random() < (0.4 + skill * 0.55);
      if (shouldDefend && playCard.type === 'playCard' && playCard.cardIds.length > 0) {
        const undefendedIdx = gameState.battleField.findIndex(p => !p.defense);
        if (undefendedIdx >= 0) {
          const cardId = pickBestAttackCard(playCard.cardIds, myHand, trumpSuit, skill);
          return { event: 'playCard', data: { roomId, cardId, targetPairIdx: undefendedIdx } };
        }
      }
      return { event: 'takeCards', data: roomId };
    }
  }

  // ── Pass-through (проездной) — ALWAYS use it first if non-valuable cards available ──
  if (showPassThrough && showPassThrough.type === 'showPassThrough' && showPassThrough.cardIds.length > 0) {
    const cardMap2 = new Map(myHand.map(c => [c.id, c]));
    const ptCards = showPassThrough.cardIds.map(id => cardMap2.get(id)).filter(Boolean) as ClientGameState['myHand'];
    const nonValPT = ptCards.filter(c => !isValuableCard(c, trumpSuit));
    if (nonValPT.length > 0) {
      // ALWAYS use pass-through if we have non-valuable cards for it (mirrors real player behaviour)
      if (nonValPT.length > 1) {
        // Send all matching pass-through cards at once (batch)
        const batchIds = nonValPT.map(c => c.id);
        return { event: 'showPassThroughs', data: { roomId, cardIds: batchIds } };
      }
      const cardId = pickBestAttackCard(nonValPT.map(c => c.id), myHand, trumpSuit, skill);
      return { event: 'showPassThrough', data: { roomId, cardId } };
    }
    // Only valuable cards available for pass-through — use with low probability
    if (Math.random() < 0.08) {
      const cardId = pickBestAttackCard(showPassThrough.cardIds, myHand, trumpSuit, skill);
      return { event: 'showPassThrough', data: { roomId, cardId } };
    }
  }

  // ── Transfer (перевод) — ALWAYS use it if non-valuable cards available ──
  if (transferCard && transferCard.type === 'transferCard' && transferCard.cardIds.length > 0) {
    const cardMap3 = new Map(myHand.map(c => [c.id, c]));
    const trCards = transferCard.cardIds.map(id => cardMap3.get(id)).filter(Boolean) as ClientGameState['myHand'];
    const nonValTr = trCards.filter(c => !isValuableCard(c, trumpSuit));
    if (nonValTr.length > 0) {
      // ALWAYS transfer if we have non-valuable cards for it (mirrors real player behaviour)
      if (nonValTr.length > 1) {
        // Batch transfer all same-rank non-valuable cards
        const batchIds = nonValTr.map(c => c.id);
        return { event: 'transferCards', data: { roomId, cardIds: batchIds } };
      }
      const cardId = pickBestAttackCard(nonValTr.map(c => c.id), myHand, trumpSuit, skill);
      return { event: 'transferCard', data: { roomId, cardId } };
    }
    // Only valuable cards available for transfer — use with low probability
    if (Math.random() < 0.12) {
      const cardId = pickBestAttackCard(transferCard.cardIds, myHand, trumpSuit, skill);
      return { event: 'transferCard', data: { roomId, cardId } };
    }
  }

  // ── Play a card (attack) — prefer multi-attack if same-rank cards available ──
  if (playCard && playCard.type === 'playCard' && playCard.cardIds.length > 0) {
    const cardMap4 = new Map(myHand.map(c => [c.id, c]));
    const undefendedIdx = gameState.battleField.findIndex(p => !p.defense);

    // Multi-attack: if attacker opens the round (battlefield empty) and has ≥2 same-rank cards,
    // play all of them at once — exactly like real players do
    const isOpeningAttack = gameState.battleField.length === 0;
    if (isOpeningAttack) {
      const availableCards = playCard.cardIds
        .map(id => cardMap4.get(id))
        .filter(Boolean) as ClientGameState['myHand'];
      // Group by rank
      const byRank = new Map<string, ClientGameState['myHand']>();
      for (const c of availableCards) {
        const group = byRank.get(c.rank) ?? [];
        group.push(c);
        byRank.set(c.rank, group);
      }
      // Find non-valuable groups with multiple cards
      const multiGroups = Array.from(byRank.values())
        .filter(g => g.length >= 2 && g.some(c => !isValuableCard(c, trumpSuit)));
      if (multiGroups.length > 0) {
        // Pick the group with the lowest rank (least valuable) for multi-attack
        const bestGroup = multiGroups.sort((a, b) => {
          const rankA = RANK_ORDER[a[0].rank] ?? 0;
          const rankB = RANK_ORDER[b[0].rank] ?? 0;
          return rankA - rankB;
        })[0];
        const nonValGroup = bestGroup.filter(c => !isValuableCard(c, trumpSuit));
        const attackIds = nonValGroup.map(c => c.id);
        // Return special multi-attack action — executeGhostAction handles sequential emit
        return { event: 'multiPlayCard', data: { roomId, cardIds: attackIds } };
      }
    }

    const cardId = pickBestAttackCard(playCard.cardIds, myHand, trumpSuit, skill);
    if (undefendedIdx >= 0) {
      return { event: 'playCard', data: { roomId, cardId, targetPairIdx: undefendedIdx } };
    }
    return { event: 'playCard', data: { roomId, cardId } };
  }

  // ── End attack — but only if all attack cards are covered ──
  if (endAttack) {
    // Check if there are any uncovered attack cards on the battlefield
    const uncoveredCount = gameState.battleField.filter(p => !p.defense).length;
    if (uncoveredCount > 0) {
      // There are uncovered cards — don't end attack yet, try to add more cards
      if (playCard && playCard.type === 'playCard' && playCard.cardIds.length > 0) {
        const cardId = pickBestAttackCard(playCard.cardIds, myHand, trumpSuit, skill);
        return { event: 'playCard', data: { roomId, cardId } };
      }
      // No cards to add but uncovered exist — wait (pass turn if available)
      if (passTurn) return { event: 'passTurn', data: roomId };
    }
    // All covered — aggressive players try to add more cards before ending
    if (playCard && playCard.type === 'playCard' && playCard.cardIds.length > 0) {
      const addChance = temperament === 'aggressive' ? 0.65 : (0.2 + skill * 0.3);
      if (Math.random() < addChance) {
        const cardId = pickBestAttackCard(playCard.cardIds, myHand, trumpSuit, skill);
        return { event: 'playCard', data: { roomId, cardId } };
      }
    }
    return { event: 'endAttack', data: roomId };
  }

  // Pass turn fallback
  if (passTurn) return { event: 'passTurn', data: roomId };

  return null;
}

// ─── GhostPlayerManager ──────────────────────────────────────────────────────

let serverPort = 3000;
let ghostsEnabled = false;
const ghosts = new Map<string, GhostPlayer>();
let managerInterval: NodeJS.Timeout | null = null;
/** Cache of table styles that are available (not hidden by admin). Updated at init. */
let availableTableStyles: import('../shared/cardAssets').TableStyle[] = ['classic', 'dark_kazakh', 'neon', 'apocalypse', 'galaxy', 'sea_depths', 'stargazer', 'black_velvet'];
/** Refresh the available table styles cache from DB shop_price_overrides */
async function refreshAvailableTableStyles(): Promise<void> {
  try {
    const overrides = await getShopPriceOverrides();
    const disabledTables = new Set(
      overrides
        .filter((o: any) => o.itemType === 'table' && !o.isAvailable)
        .map((o: any) => o.itemId as string)
    );
    const allStyles: import('../shared/cardAssets').TableStyle[] = ['classic', 'dark_kazakh', 'neon', 'apocalypse', 'galaxy', 'sea_depths', 'stargazer', 'black_velvet'];
    availableTableStyles = allStyles.filter(s => !disabledTables.has(s));
    // Always keep 'classic' as fallback
    if (availableTableStyles.length === 0) availableTableStyles = ['classic'];
    console.log(`[Ghost] Available table styles: ${availableTableStyles.join(', ')}`);
  } catch (err) {
    console.warn('[Ghost] Failed to refresh table styles from DB, using defaults:', err);
  }
}
/** Call this after the HTTP server starts listening */
export async function initGhostPlayers(port: number, count: number = 15): Promise<void> {
  serverPort = port;
  ghostsEnabled = true;
  console.log(`[Ghost] Initializing ${count} ghost players on port ${port}`);
  // Load available table styles from DB before building personalities
  await refreshAvailableTableStyles();

  // Use a stable deterministic order (no shuffle) so the same nick always maps
  // to the same openId in the DB. Shuffling caused index-based openIds to change
  // on every restart, creating duplicate ghost accounts.
  const selectedNicks = GHOST_NICKS.slice(0, Math.min(count, GHOST_NICKS.length));

  // Provision DB accounts first (parallel)
  const provisionResults = await Promise.allSettled(
    selectedNicks.map(async (nick, i) => {
      const personality = buildPersonality(nick, i);
      const result = await provisionGhostPlayer(
        nick,
        personality.avatarId,
        personality.equippedFrame,
        personality.emotionPack,
        // No index needed — openId is now derived from a stable hash of the nick
      );
      if (!result) {
        console.warn(`[Ghost] Failed to provision DB account for ${nick}`);
        return null;
      }
      console.log(`[Ghost] Provisioned ${nick} → openId=${result.openId} gameId=${result.gameId} seasonRating=${result.seasonRating}`);
      return { nick, personality, openId: result.openId, gameId: result.gameId, seasonRating: result.seasonRating };
    })
  );

  for (const res of provisionResults) {
    if (res.status !== 'fulfilled' || !res.value) continue;
    const { nick, personality, openId, gameId, seasonRating } = res.value;
    const ghost: GhostPlayer = {
      id: openId, // openId IS the ghost id (ghost-<nick-slug>)
      personality,
      state: 'idle',
      socket: null,
      currentRoomId: null,
      isHosting: false,
      gameState: null,
      myActions: [],
      actionTimer: null,
      idleTimer: null,
      lobbyTimer: null,
      reconnectAttempts: 0,
      dbGameId: gameId,
      dbSeasonRating: seasonRating,
    };
    ghosts.set(openId, ghost);
  }

  console.log(`[Ghost] ${ghosts.size} ghost players ready. Connecting...`);

  // Stagger initial connections to avoid thundering herd
  let delay = 0;
  for (const ghost of Array.from(ghosts.values())) {
    setTimeout(() => {
      if (ghostsEnabled) connectGhost(ghost);
    }, delay);
    delay += rand(800, 3000);
  }

  // Manager loop: every 30s check ghost health (reconnect dead ghosts)
  managerInterval = setInterval(() => {
    if (!ghostsEnabled) return;
    for (const ghost of Array.from(ghosts.values())) {
      maintainGhost(ghost);
    }
  }, 30_000);

  // Room manager loop: every 5s manage bait rooms and fill rooms with real players
  // Start after initial connections settle (15s delay)
  setTimeout(() => {
    if (!ghostsEnabled) return;
    roomManagerInterval = setInterval(roomManagerTick, 5_000);
    // Run immediately once
    roomManagerTick();
    console.log('[Ghost] Room manager started');
  }, 15_000);
}

export function stopGhostPlayers(): void {
  ghostsEnabled = false;
  if (managerInterval) { clearInterval(managerInterval); managerInterval = null; }
  if (roomManagerInterval) { clearInterval(roomManagerInterval); roomManagerInterval = null; }
  for (const ghost of Array.from(ghosts.values())) {
    disconnectGhost(ghost);
  }
  ghosts.clear();
}

export function getGhostStats(): { total: number; connected: number; inGame: number; inLobby: number } {
  let connected = 0, inGame = 0, inLobby = 0;
  for (const g of Array.from(ghosts.values())) {
    if (g.socket?.connected) connected++;
    if (g.state === 'in_game') inGame++;
    if (g.state === 'in_lobby') inLobby++;
  }
  return { total: ghosts.size, connected, inGame, inLobby };
}

// ─── Ghost Lifecycle ─────────────────────────────────────────────────────────

function connectGhost(ghost: GhostPlayer): void {
  if (ghost.socket?.connected) return;

  const url = `http://localhost:${serverPort}`;
  const socket: Socket<ServerToClientEvents, ClientToServerEvents> = ioClient(url, {
    path: '/api/socket.io',
    transports: ['websocket'],
    reconnection: false, // we manage reconnect ourselves
    auth: {
      odId: ghost.id,
      name: ghost.personality.nick,
    },
  });

  ghost.socket = socket;
  ghost.state = 'idle';

  socket.on('connect', () => {
    ghost.reconnectAttempts = 0;
    ghost.state = 'browsing';
    // Register profile using real DB gameId and real season rating
    socket.emit('registerProfile', {
      gameId: ghost.dbGameId,
      displayName: ghost.personality.nick,
      avatarId: ghost.personality.avatarId,
      equippedFrame: ghost.personality.equippedFrame ?? null,
      isPremium: false,
      seasonRating: ghost.dbSeasonRating,
    });
    // Ghost will be picked up by roomManagerTick automatically
    ghost.state = 'browsing';
  });

  socket.on('disconnect', () => {
    ghost.state = 'disconnected';
    clearGhostTimers(ghost);
    ghost.currentRoomId = null;
    ghost.isHosting = false;
    ghost.gameState = null;
    ghost.myActions = [];
    // Reconnect with backoff
    if (ghostsEnabled && ghost.reconnectAttempts < 5) {
      ghost.reconnectAttempts++;
      const backoff = Math.min(5000 * ghost.reconnectAttempts, 30000);
      setTimeout(() => {
        if (ghostsEnabled) connectGhost(ghost);
      }, backoff + rand(0, 3000));
    }
  });

  socket.on('roomList', (rooms) => {
    // Store room list for decision making (only if browsing)
    if (ghost.state === 'browsing') {
      ghost.state = 'browsing'; // no-op, just ensure we process it
    }
  });

  socket.on('roomUpdated', (room) => {
    if (ghost.currentRoomId === room.id) {
      // Room was updated — check if game started
      if ((room.hasActiveGame || room.gameState !== null) && ghost.state === 'in_lobby') {
        // Game started — transition handled by gameStarted event
      }
    }
  });

  socket.on('roomClosed', (roomId) => {
    if (ghost.currentRoomId === roomId) {
      ghost.currentRoomId = null;
      ghost.isHosting = false;
      ghostReturnToBrowsing(ghost);
    }
  });

  socket.on('gameStarted', (state) => {
    if (ghost.currentRoomId === state.roomId) {
      ghost.state = 'in_game';
      ghost.gameState = state;
      ghost.myActions = state.availableActions || [];
      clearGhostTimers(ghost);
      // Schedule first action if it's our turn
      if (ghost.myActions.length > 0) {
        scheduleGameAction(ghost);
      }
    }
  });

  socket.on('gameStateUpdate', (state) => {
    if (ghost.currentRoomId !== state.roomId) return;
    // Transition to in_game if we receive gameStateUpdate while still in lobby
    if (ghost.state === 'in_lobby' && state.gamePhase === 'playing') {
      ghost.state = 'in_game';
    }
    ghost.gameState = state;
    const prevActions = ghost.myActions;
    ghost.myActions = state.availableActions || [];

    if (state.gamePhase === 'finished') {
      // Game over — go back to lobby after a delay
      ghost.state = 'browsing';
      ghost.gameState = null;
      ghost.myActions = [];
      clearGhostTimers(ghost);
      // Leave the room after seeing results
      setTimeout(() => {
        if (ghost.socket?.connected && ghost.currentRoomId) {
          ghost.socket.emit('leaveRoom', ghost.currentRoomId);
          ghost.currentRoomId = null;
          ghost.isHosting = false;
        }
        ghostReturnToBrowsing(ghost);
      }, rand(3000, 8000));
      return;
    }

    // Schedule action whenever we have actions (cancel previous timer to avoid double-firing)
    if (ghost.myActions.length > 0) {
      // Only reschedule if we don't already have a pending action timer
      if (!ghost.actionTimer) {
        scheduleGameAction(ghost);
      }
    }
  });

  socket.on('yourTurn', (actions) => {
    // Accept yourTurn even if state is 'in_lobby' — game may have started but gameStarted event was missed
    if (ghost.state !== 'in_game' && ghost.state !== 'in_lobby') return;
    // Transition to in_game if we receive yourTurn while still in lobby
    if (ghost.state === 'in_lobby' && actions.length > 0) {
      ghost.state = 'in_game';
    }
    ghost.myActions = actions;
    if (actions.length > 0) {
      clearGhostTimers(ghost);
      scheduleGameAction(ghost);
    }
  });

  socket.on('gameOver', () => {
    // Handled via gameStateUpdate with phase=finished
  });

  socket.on('error', (msg) => {
    console.debug(`[Ghost:${ghost.personality.nick}] Server error: ${msg}`);
    // Auto-refill when out of shanyraks
    if (typeof msg === 'string' && msg.includes('Недостаточно шаныраков')) {
      refillGhostShanyrak(ghost.id, 10000).then(() => {
        console.log(`[Ghost:${ghost.personality.nick}] Refilled to 10k shanyraks`);
        // Retry idle action after refill
        // Ghost will be picked up by roomManagerTick automatically
      }).catch(e => console.debug(`[Ghost] Refill error: ${e}`));
    }
  });
}

function disconnectGhost(ghost: GhostPlayer): void {
  clearGhostTimers(ghost);
  if (ghost.socket) {
    ghost.socket.removeAllListeners();
    ghost.socket.disconnect();
    ghost.socket = null;
  }
  ghost.state = 'disconnected';
  ghost.currentRoomId = null;
  ghost.isHosting = false;
  ghost.gameState = null;
  ghost.myActions = [];
}

function clearGhostTimers(ghost: GhostPlayer): void {
  if (ghost.actionTimer) { clearTimeout(ghost.actionTimer); ghost.actionTimer = null; }
  if (ghost.idleTimer) { clearTimeout(ghost.idleTimer); ghost.idleTimer = null; }
  if (ghost.lobbyTimer) { clearTimeout(ghost.lobbyTimer); ghost.lobbyTimer = null; }
}

/** Periodic health check — reconnect dead ghosts, nudge stuck ones */
function maintainGhost(ghost: GhostPlayer): void {
  if (!ghostsEnabled) return;
  if (!ghost.socket?.connected) {
    if (ghost.state !== 'disconnected' || ghost.reconnectAttempts < 5) {
      connectGhost(ghost);
    }
    return;
  }
  // Ghost state is managed by roomManagerTick — no nudge needed here
}

// ─── GhostRoomManager ────────────────────────────────────────────────────────
// Central manager that runs every 5s:
//  1. Maintains BAIT_ROOM_COUNT open bait rooms (ghost-hosted, waiting for players)
//  2. Detects rooms with real players and fills them with bots gradually
//  3. Bots NEVER start a game unless a real human is present

const BAIT_ROOM_COUNT = 3; // how many bait rooms to keep open at all times
const BAIT_ROOM_BET_OPTIONS = [100, 200, 500, 1000]; // bait rooms use small bets
let roomManagerInterval: NodeJS.Timeout | null = null;

/** Returns true if the player id belongs to a ghost or built-in bot */
function isGhostOrBot(id: string): boolean {
  return id.startsWith('ghost-') || id.startsWith('bot-');
}

/** Count real human players in a room */
function countHumans(room: Room): number {
  return room.players.filter(p => !isGhostOrBot(p.id)).length;
}

/** Count ghost players (not built-in bots) in a room */
function countGhostsInRoom(room: Room): number {
  return room.players.filter(p => p.id.startsWith('ghost-')).length;
}

/** Get a free ghost (not in lobby/game) that is connected */
function getFreeGhost(): GhostPlayer | null {
  for (const g of Array.from(ghosts.values())) {
    if (g.socket?.connected && g.state === 'browsing') return g;
  }
  return null;
}

/** Create a bait room with the given ghost as host */
function createBaitRoom(ghost: GhostPlayer): void {
  if (!ghost.socket?.connected) return;
  const p = ghost.personality;
  // maxPlayers: 2-6, but always leave 1 free slot for a real player
  // So ghost count in room = maxPlayers - 1
  const maxPlayers = pickRandom([2, 3, 4, 4, 5, 6]);
  const betAmount = pickRandom(BAIT_ROOM_BET_OPTIONS);
  const roomName = generateRoomName(p.nick);

  ghost.socket.emit('createRoom', {
    name: roomName,
    maxPlayers,
    settings: {
      turnTimer: pickRandom([20, 25, 30, 40]),
      withBots: false,
      botCount: 0,
      deckStyle: p.preferredDeckStyle,
      tableStyle: p.preferredTableStyle,
      betAmount,
      isPrivate: false,
    },
  }, (room) => {
    if (!room) return;
    ghost.currentRoomId = room.id;
    ghost.isHosting = true;
    ghost.state = 'in_lobby';
    console.log(`[Ghost] Bait room created: ${room.id} by ${p.nick} (${maxPlayers} slots)`);
    // Host marks ready after a short delay
    setTimeout(() => {
      if (ghost.state === 'in_lobby' && ghost.socket?.connected && ghost.currentRoomId) {
        ghost.socket.emit('toggleReady', ghost.currentRoomId);
      }
    }, rand(1500, 4000));

    // Randomly decide how many ghosts to fill in (always leaving 1 free slot for real player)
    // fillTarget: 0 = only host (1 ghost), up to maxPlayers-1 total ghosts
    // Distribution: ~30% just host alone, ~40% partially filled, ~30% nearly full (1 slot free)
    const maxGhostsAllowed = maxPlayers - 1; // always keep 1 slot free
    const fillRoll = Math.random();
    let fillTarget: number;
    if (fillRoll < 0.30) {
      fillTarget = 1; // just the host
    } else if (fillRoll < 0.70) {
      // partially filled: 2 to ceil(maxPlayers/2) ghosts
      const partial = Math.ceil(maxPlayers / 2);
      fillTarget = Math.min(Math.floor(rand(2, partial + 1)), maxGhostsAllowed);
    } else {
      // nearly full: fill all but 1 slot
      fillTarget = maxGhostsAllowed;
    }
    const fillersNeeded = fillTarget - 1; // subtract the host already in room
    if (fillersNeeded > 0) {
      for (let i = 0; i < fillersNeeded; i++) {
        const delay = rand(3000, 12000) * (i + 1);
        setTimeout(() => {
          // Re-check room still exists, no active game, and has space
          const currentRooms = getAvailableRooms();
          const targetRoom = currentRooms.find(r => r.id === room.id);
          if (!targetRoom || targetRoom.gameState !== null) return;
          if (targetRoom.players.length >= maxPlayers - 1) return; // keep 1 slot free
          const filler = getFreeGhost();
          if (filler) {
            filler.state = 'in_lobby'; // lock
            sendGhostToRoom(filler, room.id);
          }
        }, delay);
      }
    }
  });
}

/** Send a ghost into a specific room (used to fill rooms with real players) */
function sendGhostToRoom(ghost: GhostPlayer, roomId: string): void {
  if (!ghost.socket?.connected) return;
  ghost.socket.emit('joinRoom', { roomId }, (ok, joinedRoom) => {
    if (!ok || !joinedRoom) return;
    ghost.currentRoomId = roomId;
    ghost.isHosting = false;
    ghost.state = 'in_lobby';
    // Toggle ready after a human-like delay
    setTimeout(() => {
      if (ghost.state === 'in_lobby' && ghost.socket?.connected && ghost.currentRoomId) {
        ghost.socket.emit('toggleReady', ghost.currentRoomId);
      }
    }, rand(2000, 6000));
  });
}

/** The main room management tick — runs every 5 seconds */
function roomManagerTick(): void {
  if (!ghostsEnabled) return;

  const allRooms = getAvailableRooms();

  // ── Step 1: Maintain bait rooms ──────────────────────────────────────────
  // Count current bait rooms: rooms hosted by a ghost with no active game
  const baitRooms = allRooms.filter(r =>
    r.gameState === null &&
    r.players.some(p => p.id.startsWith('ghost-') && ghosts.get(p.id)?.isHosting),
  );

  const baitDeficit = BAIT_ROOM_COUNT - baitRooms.length;
  for (let i = 0; i < baitDeficit; i++) {
    const freeGhost = getFreeGhost();
    if (!freeGhost) break;
    // Mark as browsing→creating to avoid double-pick
    freeGhost.state = 'in_lobby'; // temporary lock
    setTimeout(() => createBaitRoom(freeGhost), rand(500, 2000) * (i + 1));
  }

  // ── Step 2: Fill rooms that have real players ────────────────────────────
  // Find rooms that have at least 1 human, are not full, no active game
  const roomsNeedingFill = allRooms.filter(r =>
    r.gameState === null &&
    countHumans(r) >= 1 &&
    r.players.length < r.maxPlayers,
  );

  for (const room of roomsNeedingFill) {
    const ghostsInRoom = countGhostsInRoom(room);
    const humans = countHumans(room);
    const total = room.players.length;
    const slots = room.maxPlayers - total;

    // Add at most 1 ghost per tick per room to feel natural
    if (slots > 0 && ghostsInRoom < humans + 2) {
      const freeGhost = getFreeGhost();
      if (freeGhost) {
        // Stagger join with human-like delay
        const delay = rand(3000, 10000);
        freeGhost.state = 'in_lobby'; // lock to prevent double-pick
        setTimeout(() => {
          if (!freeGhost.socket?.connected) {
            freeGhost.state = 'browsing';
            return;
          }
          sendGhostToRoom(freeGhost, room.id);
        }, delay);
      }
    }
  }

  // ── Step 3: Start games in rooms that are full and have humans ───────────
  for (const room of allRooms) {
    if (room.gameState !== null) continue;
    if (countHumans(room) < 1) continue;
    if (room.players.length < 2) continue;

    // Check if all players are ready
    const allReady = room.players.every(p => p.ready);
    if (!allReady) continue;

    // Find the ghost host of this room
    const hostGhost = Array.from(ghosts.values()).find(
      g => g.currentRoomId === room.id && g.isHosting && g.socket?.connected,
    );
    if (hostGhost) {
      console.log(`[Ghost] Starting game in room ${room.id} (${countHumans(room)} humans)`);
      hostGhost.socket!.emit('startGame', room.id);
    }
  }

  // ── Step 4: Clean up bait rooms that have been waiting too long (>5 min) ─
  for (const room of baitRooms) {
    if (countHumans(room) > 0) continue; // real player joined, keep it
    const hostGhost = Array.from(ghosts.values()).find(
      g => g.currentRoomId === room.id && g.isHosting,
    );
    if (!hostGhost) continue;
    // If ghost has been hosting for a long time with no humans, rotate
    // We use lobbyTimer as a "created at" marker
    if (!hostGhost.lobbyTimer) {
      hostGhost.lobbyTimer = setTimeout(() => {
        hostGhost.lobbyTimer = null;
        if (hostGhost.state !== 'in_lobby' || !hostGhost.socket?.connected) return;
        if (!hostGhost.currentRoomId) return;
        // Check if humans joined in the meantime
        const currentRooms = getAvailableRooms();
        const myRoom = currentRooms.find(r => r.id === hostGhost.currentRoomId);
        if (myRoom && countHumans(myRoom) > 0) return; // humans joined, keep it
        // Close and recreate
        hostGhost.socket.emit('closeRoom', hostGhost.currentRoomId);
        hostGhost.currentRoomId = null;
        hostGhost.isHosting = false;
        hostGhost.state = 'browsing';
        console.log(`[Ghost] Rotated stale bait room for ${hostGhost.personality.nick}`);
      }, rand(3 * 60_000, 5 * 60_000)); // 3–5 minutes
    }
  }
}

/** Called when a ghost leaves a room (game ended or left) — resets state */
function ghostReturnToBrowsing(ghost: GhostPlayer): void {
  ghost.currentRoomId = null;
  ghost.isHosting = false;
  ghost.state = 'browsing';
  ghost.gameState = null;
  ghost.myActions = [];
  clearGhostTimers(ghost);
}

// ─── In-Game Actions ─────────────────────────────────────────────────────────

function scheduleGameAction(ghost: GhostPlayer): void {
  if (!ghostsEnabled || !ghost.socket?.connected) return;
  if (ghost.myActions.length === 0) return;

  const p = ghost.personality;

  // Calculate think time based on hand size
  const handSize = ghost.gameState?.myHand?.length ?? 0;
  let thinkMs: number;
  if (handSize > 20) {
    // Many cards — takes longer to find the right one (2-8s, max 10s)
    thinkMs = Math.min(rand(2000, 8000), 10000);
  } else {
    // Normal hand — quick decisions (1-4s)
    thinkMs = rand(1000, 4000);
  }
  // Hard minimum: 1s always, 2s if hand > 20
  thinkMs = Math.max(thinkMs, handSize > 20 ? 2000 : 1000);

  // Long think (AFK moment)
  if (Math.random() < p.longThinkProb) {
    thinkMs += rand(8000, 18000);
  }

  ghost.actionTimer = setTimeout(() => {
    ghost.actionTimer = null;
    if (!ghost.socket?.connected || ghost.state !== 'in_game') return;
    if (ghost.myActions.length === 0) return;

    // Maybe ragequit
    if (Math.random() < p.ragequitProb && ghost.currentRoomId) {
      ghost.socket.emit('leaveGame', ghost.currentRoomId, () => {
        ghost.currentRoomId = null;
        ghost.isHosting = false;
        ghost.state = 'browsing';
        ghost.gameState = null;
        ghost.myActions = [];
        ghostReturnToBrowsing(ghost);
      });
      return;
    }

    // Maybe send emotion before playing
    if (ghost.gameState && Math.random() < p.emotionProb && ghost.currentRoomId) {
      const emotionId = pickEmotion(p.temperament);
      ghost.socket.emit('sendEmotion', { roomId: ghost.currentRoomId, emotionId });
    }

    // Pick and execute action (with learning stats if available)
    if (!ghost.gameState) return;
    // Asynchronously fetch learning stats and apply them to action selection
    getGhostLearningStats().then(stats => {
      if (!ghost.gameState) return;
      const action = pickGhostAction(ghost.myActions, p.skill, p.temperament, ghost.gameState, stats ?? undefined);
      if (!action) return;
      executeGhostAction(ghost, action);
    }).catch(() => {
      // Fallback: pick action without learning stats
      if (!ghost.gameState) return;
      const action = pickGhostAction(ghost.myActions, p.skill, p.temperament, ghost.gameState);
      if (!action) return;
      executeGhostAction(ghost, action);
    });;
  }, thinkMs);
}

function executeGhostAction(ghost: GhostPlayer, action: { event: string; data?: unknown }): void {
  if (!ghost.socket?.connected) return;

  const s = ghost.socket as any;

  // ── Multi-attack: send each card sequentially with a short human-like delay ──
  if (action.event === 'multiPlayCard') {
    const { roomId, cardIds } = action.data as { roomId: string; cardIds: string[] };
    if (!cardIds || cardIds.length === 0) return;
    // Send first card immediately
    try { s.emit('playCard', { roomId, cardId: cardIds[0] }); } catch (e) { /* ignore */ }
    // Send remaining cards with 200–450ms gaps (looks like rapid human tapping)
    for (let i = 1; i < cardIds.length; i++) {
      const delay = rand(200, 450) * i;
      const cardId = cardIds[i];
      setTimeout(() => {
        if (!ghost.socket?.connected) return;
        try { (ghost.socket as any).emit('playCard', { roomId, cardId }); } catch (e) { /* ignore */ }
      }, delay);
    }
    return;
  }

  try {
    if (action.data !== undefined) {
      s.emit(action.event, action.data);
    } else {
      s.emit(action.event);
    }
  } catch (e) {
    console.debug(`[Ghost:${ghost.personality.nick}] Action error: ${e}`);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateRoomName(nick: string): string {
  // 70% chance: no name (empty string)
  if (Math.random() < 0.70) return '';

  // 30% chance: named room — pick language by weight
  const langRoll = Math.random();

  // Russian 20%
  if (langRoll < 0.20) {
    const ru = [
      `Комната ${nick}`, `Игра ${nick}`, `${nick} играет`,
      `Заходите!`, `Дурак онлайн`, `Быстрая игра`,
      `Для всех`, `Новая игра`, `Присоединяйтесь`, `Играем!`,
    ];
    return pickRandom(ru);
  }

  // English 20%
  if (langRoll < 0.40) {
    const en = [
      `${nick}'s room`, `Join me!`, `Quick game`,
      `Open room`, `Let's play`, `Durak online`,
      `Anyone?`, `Come in!`, `New game`, `Play with me`,
    ];
    return pickRandom(en);
  }

  // Azerbaijani 20%
  if (langRoll < 0.60) {
    const az = [
      `${nick}-in otağı`, `Oyuna gəlin`, `Tez oyun`,
      `Açıq otaq`, `Oynayaq`, `Hamı üçün`,
      `Qoşulun!`, `Yeni oyun`, `Daxil olun`, `Birlikdə oynayaq`,
    ];
    return pickRandom(az);
  }

  // Uzbek 20%
  if (langRoll < 0.80) {
    const uz = [
      `${nick} xonasi`, `Keling o'ynaymiz`, `Tez o'yin`,
      `Ochiq xona`, `O'ynaymiz`, `Hammaga`,
      `Qo'shiling!`, `Yangi o'yin`, `Kiring`, `Birga o'ynaymiz`,
    ];
    return pickRandom(uz);
  }

  // Remaining 20% split between Kazakh, Polish, Ukrainian, Turkish, Georgian
  const other: string[][] = [
    // Kazakh
    [`${nick} бөлмесі`, `Ойнайық!`, `Жылдам ойын`, `Кіріңіз`, `Жаңа ойын`],
    // Polish
    [`Pokój ${nick}`, `Zagrajmy!`, `Szybka gra`, `Dołącz!`, `Nowa gra`],
    // Ukrainian
    [`Кімната ${nick}`, `Грати!`, `Швидка гра`, `Заходьте`, `Нова гра`],
    // Turkish
    [`${nick} odası`, `Oynayalım!`, `Hızlı oyun`, `Katıl!`, `Yeni oyun`],
    // Georgian
    [`${nick}-ის ოთახი`, `ვითამაშოთ!`, `სწრაფი თამაში`, `შემოდი!`, `ახალი თამაში`],
  ];
  const group = other[Math.floor(Math.random() * other.length)];
  return pickRandom(group);
}
