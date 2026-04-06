import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import type { ClientGameState, AvailableAction, Card, BattlePair } from '../../../shared/gameTypes';
import { RANK_ORDER } from '../../../shared/gameTypes';
import { SUIT_SYMBOLS, SUIT_COLORS, CARD_BACK_URL, CARD_BACK_CUSTOM_URL, GAME_TABLE_URL, CARD_IMAGES, CARD_IMAGES_CUSTOM, getCardImageKey, getCustomCardImageKey } from '../../../shared/cardAssets';
import PlayingCard from './PlayingCard';
import DraggableCard from './DraggableCard';
import { BitoAnimation } from './CardAnimations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Swords, Shield, ArrowRight, ArrowLeft, Timer, Layers, Trash2, Crown, Trophy, Frown, Home, HandMetal, Eye, LogOut, DoorOpen, ChevronLeft, ChevronRight, Music, VolumeX, X, UserPlus, Clock, Check } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { useSettings } from '@/contexts/SettingsContext';
import { getAvatarUrl } from '../../../shared/avatars';
import { trpc } from '@/lib/trpc';
import { formatBalance } from '../../../shared/formatBalance';


const SUIT_ORDER: Record<string, number> = { spades: 0, clubs: 1, diamonds: 2, hearts: 3 };

function sortHand(hand: Card[], mode: 'suit-rank' | 'rank-only'): Card[] {
  return [...hand].sort((a, b) => {
    if (a.rank === '777') return 1;
    if (b.rank === '777') return -1;
    if (mode === 'suit-rank') {
      const suitDiff = (SUIT_ORDER[a.suit || ''] ?? 4) - (SUIT_ORDER[b.suit || ''] ?? 4);
      if (suitDiff !== 0) return suitDiff;
    }
    return (RANK_ORDER[a.rank] ?? 0) - (RANK_ORDER[b.rank] ?? 0);
  });
}

// ---- PlayerHand component with drag-and-drop support ----

function PlayerHand({
  sortedHand,
  playableIds,
  transferIds,
  passThroughIds,
  selectedCardId,
  onCardClick,
  onCardDrop,
  deckStyle,
}: {
  sortedHand: Card[];
  playableIds: Set<string>;
  transferIds: Set<string>;
  passThroughIds: Set<string>;
  selectedCardId: string | null;
  onCardClick: (card: Card) => void;
  onCardDrop?: (card: Card) => boolean;
  deckStyle?: 'classic' | 'custom';
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useMemo(() => {
    setTimeout(checkScroll, 50);
  }, [sortedHand.length, checkScroll]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 56;
    const scrollAmount = cardWidth * 3;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
    setTimeout(checkScroll, 300);
  }, [checkScroll]);

  const getCardMargin = (i: number) => {
    if (i === 0) return '0';
    if (sortedHand.length <= 6) return '0';
    if (sortedHand.length <= 8) return '-6px';
    if (sortedHand.length <= 10) return '-10px';
    if (sortedHand.length <= 14) return '-16px';
    if (sortedHand.length <= 18) return '-20px';
    return '-26px';
  };

  const needsScroll = sortedHand.length > 6;

  return (
    <div className="relative">
      {needsScroll && canScrollLeft && (
        <button
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-black/70 hover:bg-black/90 text-amber-300 rounded-full p-0.5 sm:p-1 shadow-lg border border-amber-700/40 transition-all"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      )}
      {needsScroll && canScrollRight && (
        <button
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-black/70 hover:bg-black/90 text-amber-300 rounded-full p-0.5 sm:p-1 shadow-lg border border-amber-700/40 transition-all"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex justify-center overflow-x-auto pb-1 sm:pb-2 scrollbar-thin scrollbar-thumb-amber-700/40 scrollbar-track-transparent"
        onScroll={checkScroll}
        style={{
          scrollbarWidth: 'thin',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="flex items-end px-4 sm:px-6">
          {sortedHand.map((card, i) => {
            const isPlayable = playableIds.has(card.id) || transferIds.has(card.id) || passThroughIds.has(card.id);
            const isSelected = selectedCardId === card.id;
            const isPassThroughCard = passThroughIds.has(card.id);
            const canDrag = playableIds.has(card.id) || transferIds.has(card.id);
            return (
              <div
                key={card.id}
                className="relative flex-shrink-0"
                style={{
                  marginLeft: getCardMargin(i),
                  zIndex: isSelected ? 50 : i,
                }}
              >
                {canDrag && onCardDrop ? (
                  <DraggableCard
                    card={card}
                    playable={isPlayable}
                    selected={isSelected}
                    isPassThrough={isPassThroughCard}
                    deckStyle={deckStyle}
                    onClick={() => onCardClick(card)}
                    onDrop={() => onCardDrop(card)}
                  />
                ) : (
                  <div
                    style={{
                      transform: isSelected ? 'translateY(-8px)' : undefined,
                      transition: 'transform 0.15s',
                    }}
                  >
                    <PlayingCard
                      card={card}
                      playable={isPlayable}
                      selected={isSelected}
                      deckStyle={deckStyle}
                      onClick={() => onCardClick(card)}
                    />
                    {isPassThroughCard && !isSelected && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-yellow-600 rounded-full flex items-center justify-center border border-yellow-400">
                        <Eye className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---- Deck visual: trump card peeks from LEFT side of deck ----
function DeckVisual({
  deckCount,
  trumpCard,
  showOpenTrump,
  deckStyle,
  label,
}: {
  deckCount: number;
  trumpCard?: { suit: string | null; rank: string; copy: number; id: string } | null;
  showOpenTrump: boolean;
  deckStyle: 'classic' | 'custom';
  label: string;
}) {
  const backUrl = deckStyle === 'custom' ? CARD_BACK_CUSTOM_URL : CARD_BACK_URL;

  if (deckCount === 0) return null;

  const cardW = 88;
  const cardH = 128;
  const trumpPeekAmount = Math.round(cardW * 0.5);
  const containerW = trumpPeekAmount + cardW;
  const containerH = cardH + 8;

  const isCustom = deckStyle === 'custom';
  const trumpImageKey = trumpCard && showOpenTrump
    ? (isCustom
        ? getCustomCardImageKey(trumpCard.rank, trumpCard.suit)
        : getCardImageKey(trumpCard.rank, trumpCard.suit))
    : null;
  const trumpImageMap = isCustom ? CARD_IMAGES_CUSTOM : CARD_IMAGES;
  const trumpImageUrl = trumpImageKey ? trumpImageMap[trumpImageKey] : null;

  const trumpSuit = trumpCard?.suit || '';
  const trumpSymbol = SUIT_SYMBOLS[trumpSuit] || trumpSuit;
  const isRed = trumpSuit === 'hearts' || trumpSuit === 'diamonds';
  const trumpColor = isRed ? '#c41e3a' : '#1a1a2e';

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-amber-200/60 text-[9px] sm:text-xs font-medium">{label}</span>
      <div className="relative" style={{ width: `${containerW}px`, height: `${containerH}px` }}>
        {deckCount > 1 && (
          <div
            className="absolute rounded-lg overflow-hidden border-2 shadow-md"
            style={{
              width: `${cardW}px`,
              height: `${cardH}px`,
              top: '0px',
              left: '0px',
              zIndex: 0,
              borderColor: showOpenTrump ? 'rgba(245,158,11,0.5)' : 'rgba(120,80,20,0.3)',
            }}
          >
            {showOpenTrump && trumpCard ? (
              trumpImageUrl ? (
                <div className="w-full h-full bg-white">
                  <img src={trumpImageUrl} alt={`${trumpCard.rank} ${trumpCard.suit}`} className="w-full h-full object-cover" loading="lazy" />
                </div>
              ) : (
                <div className="w-full h-full bg-white flex flex-col items-center justify-between p-1.5 relative overflow-hidden">
                  <div className="self-start leading-none" style={{ color: trumpColor }}>
                    <div className="text-xs font-bold">{trumpCard.rank}</div>
                    <div className="text-xs -mt-0.5">{trumpSymbol}</div>
                  </div>
                  <div className="text-2xl" style={{ color: trumpColor }}>
                    {trumpSymbol}
                  </div>
                  <div className="self-end leading-none rotate-180" style={{ color: trumpColor }}>
                    <div className="text-xs font-bold">{trumpCard.rank}</div>
                    <div className="text-xs -mt-0.5">{trumpSymbol}</div>
                  </div>
                </div>
              )
            ) : (
              <img src={backUrl} alt="hidden trump" className="w-full h-full object-cover" />
            )}
          </div>
        )}

        {deckCount > 0 && (
          <>
            {deckCount > 4 && (
              <div className="absolute rounded-lg overflow-hidden border border-amber-900/20 shadow-sm"
                style={{ width: `${cardW - 4}px`, height: `${cardH - 4}px`, top: '4px', left: `${trumpPeekAmount + 4}px`, zIndex: 1 }}>
                <img src={backUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            {deckCount > 2 && (
              <div className="absolute rounded-lg overflow-hidden border border-amber-900/25 shadow-sm"
                style={{ width: `${cardW - 4}px`, height: `${cardH - 4}px`, top: '2px', left: `${trumpPeekAmount + 2}px`, zIndex: 2 }}>
                <img src={backUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="absolute rounded-lg overflow-hidden border border-amber-900/30 shadow-md"
              style={{ width: `${cardW - 4}px`, height: `${cardH - 4}px`, top: '0px', left: `${trumpPeekAmount}px`, zIndex: 3 }}>
              <img src={backUrl} alt="card back" className="w-full h-full object-cover" />
            </div>
          </>
        )}

        <div className="absolute bg-black/80 border border-amber-700/40 rounded-full w-7 h-7 flex items-center justify-center"
          style={{ bottom: '-2px', right: '-4px', zIndex: 10 }}>
          <span className="text-amber-300 text-xs font-bold">{deckCount}</span>
        </div>
      </div>
    </div>
  );
}

// ---- Trump icon ----
function TrumpIcon({ suit, size = 'normal' }: { suit: string; size?: 'normal' | 'large' }) {
  const symbol = SUIT_SYMBOLS[suit] || suit;
  const isRed = suit === 'hearts' || suit === 'diamonds';
  const color = isRed ? '#ef4444' : '#e5e7eb';

  if (size === 'large') {
    return (
      <div className="flex flex-col items-center justify-center gap-2" style={{ width: '180px', height: '180px' }}>
        <span
          style={{
            color,
            fontSize: '6rem',
            lineHeight: 1,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6)) drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
            textShadow: isRed
              ? '0 0 20px rgba(239,68,68,0.4), 0 4px 12px rgba(0,0,0,0.5)'
              : '0 0 20px rgba(229,231,235,0.3), 0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          {symbol}
        </span>
        <span className="text-white text-lg font-bold tracking-wide not-italic" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>
          Козырь
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-1" style={{ width: '88px', height: '128px' }}>
      <span
        style={{
          color,
          fontSize: '4rem',
          lineHeight: 1,
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6)) drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
          textShadow: isRed
            ? '0 0 15px rgba(239,68,68,0.4), 0 4px 10px rgba(0,0,0,0.5)'
            : '0 0 15px rgba(229,231,235,0.3), 0 4px 10px rgba(0,0,0,0.5)',
        }}
      >
        {symbol}
      </span>
      <span className="text-white text-xs font-bold tracking-wide not-italic" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>
        Козырь
      </span>
    </div>
  );
}

// ---- Discard pile visual ----
function DiscardPile({ count, deckStyle }: { count: number; deckStyle: 'classic' | 'custom' }) {
  const backUrl = deckStyle === 'custom' ? CARD_BACK_CUSTOM_URL : CARD_BACK_URL;

  const cardPositions = useMemo(() => {
    const positions: { rotation: number; offsetX: number; offsetY: number }[] = [];
    const rotations = [3, -5, 7, -2, 8, -6, 4, -3, 5, -7, 2, -4];
    const offsetsX = [0, 3, -2, 5, -4, 2, -3, 4, -1, 3, -5, 1];
    const offsetsY = [0, -2, 1, -3, 2, -1, 3, -2, 1, -3, 2, -1];
    for (let i = 0; i < 12; i++) {
      positions.push({
        rotation: rotations[i],
        offsetX: offsetsX[i],
        offsetY: offsetsY[i] - i * 1.5,
      });
    }
    return positions;
  }, []);

  const cardW = 84;
  const cardH = 124;

  if (count === 0) return null;

  const displayCards = Math.min(count, 8);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: `${cardW + 20}px`, height: `${cardH + 20}px` }}>
        {Array.from({ length: displayCards }).map((_, i) => {
          const pos = cardPositions[i % cardPositions.length];
          return (
            <div
              key={i}
              className="absolute rounded-lg overflow-hidden border border-amber-900/30 shadow-sm"
              style={{
                width: `${cardW}px`,
                height: `${cardH}px`,
                top: `${10 + pos.offsetY}px`,
                left: `${10 + pos.offsetX}px`,
                transform: `rotate(${pos.rotation}deg)`,
                zIndex: i,
              }}
            >
              <img src={backUrl} alt="" className="w-full h-full object-cover" />
            </div>
          );
        })}
      </div>
      <div className="bg-black/60 border border-amber-700/30 rounded-lg px-4 py-1.5">
        <span className="text-amber-300 text-3xl sm:text-4xl font-black">{count}</span>
      </div>
      <span className="text-amber-200/50 text-xs font-medium">Бито</span>
    </div>
  );
}


export interface GameTableProps {
  gameState: ClientGameState;
  availableActions: AvailableAction[];
  turnTimer: number;
  gameOverData?: { winnersOrder: string[]; loserId: string | null } | null;
  prizeData?: { pool: number; prizes: { playerId: string; place: number; amount: number }[] } | null;
  onPlayCard: (cardId: string, targetPairIdx?: number) => void;
  onTransferCard: (cardId: string) => void;
  onTakeCards: () => void;
  onPassTurn: () => void;
  onEndAttack: () => void;
  onSkipTurn: () => void;
  onShowPassThrough: (cardId: string) => void;
  onLeaveGame?: () => void;
  onReturnToLobby?: () => void;
  musicEnabled?: boolean;
  onToggleMusic?: () => void;
  frozenInfo?: { disconnectedPlayerName: string; secondsLeft: number } | null;
}

export default function GameTable({
  gameState, availableActions, turnTimer, gameOverData, prizeData,
  onPlayCard, onTransferCard, onTakeCards, onPassTurn, onEndAttack, onSkipTurn, onShowPassThrough,
  onLeaveGame, onReturnToLobby,
  musicEnabled = false, onToggleMusic, frozenInfo,
}: GameTableProps) {
  const gs = gameState;
  const myIdx = gs.myIndex;

  const [sortMode, setSortMode] = useState<'suit-rank' | 'rank-only'>('suit-rank');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showYourTurn, setShowYourTurn] = useState(false);
  const [yourTurnPhase, setYourTurnPhase] = useState<'enter' | 'exit' | null>(null);
  const prevIsMyTurn = useRef(false);

  // Trump change overlay state
  const [showTrumpChange, setShowTrumpChange] = useState(false);
  const [trumpChangePhase, setTrumpChangePhase] = useState<'enter' | 'exit' | null>(null);
  const [trumpChangeInfo, setTrumpChangeInfo] = useState<{ suit: string; phase: number } | null>(null);
  const prevTrumpSuit = useRef(gs.trumpInfo.currentTrump);
  const prevTrumpPhaseNum = useRef(gs.trumpInfo.phase);
  const trumpChangeTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const yourTurnTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Urgent "YOUR TURN" alert at 15 seconds
  const [showUrgentTurn, setShowUrgentTurn] = useState(false);
  const [urgentTurnPhase, setUrgentTurnPhase] = useState<'enter' | 'exit' | null>(null);
  const urgentTurnTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const urgentAlertShownForTrick = useRef(-1);

  // Animation states
  const [showBitoAnim, setShowBitoAnim] = useState(false);
  const [bitoCardCount, setBitoCardCount] = useState(0);
  const prevBattleFieldLen = useRef(gs.battleField.length);
  const prevDiscardCount = useRef(gs.discardCount);
  const isFirstRender = useRef(true);

  // Drop zone highlight
  const [dropZoneHighlight, setDropZoneHighlight] = useState(false);

  const isAttacker = myIdx === gs.currentAttackerIdx;
  const isDefender = myIdx === gs.currentDefenderIdx;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
    }
  }, []);

  // Bito animation when battlefield clears and discard grows
  useEffect(() => {
    if (isFirstRender.current) return;

    const battleCleared = prevBattleFieldLen.current > 0 && gs.battleField.length === 0;
    const discardGrew = gs.discardCount > prevDiscardCount.current;

    if (battleCleared && discardGrew) {
      const cardsCleared = prevBattleFieldLen.current * 2; // attack + defense pairs
      setBitoCardCount(cardsCleared);
      setShowBitoAnim(true);
    }

    prevBattleFieldLen.current = gs.battleField.length;
    prevDiscardCount.current = gs.discardCount;
  }, [gs.battleField.length, gs.discardCount]);

  // Detect trump change
  useEffect(() => {
    const currentSuit = gs.trumpInfo.currentTrump;
    const currentPhase = gs.trumpInfo.phase;
    if (prevTrumpSuit.current !== currentSuit || prevTrumpPhaseNum.current !== currentPhase) {
      trumpChangeTimers.current.forEach(t => clearTimeout(t));
      trumpChangeTimers.current = [];

      setTrumpChangeInfo({ suit: currentSuit, phase: currentPhase });
      setShowTrumpChange(true);
      setTrumpChangePhase('enter');

      const exitTimer = setTimeout(() => {
        setTrumpChangePhase('exit');
      }, 2800);
      const hideTimer = setTimeout(() => {
        setShowTrumpChange(false);
        setTrumpChangePhase(null);
        setTrumpChangeInfo(null);
        trumpChangeTimers.current = [];
      }, 3200);
      trumpChangeTimers.current = [exitTimer, hideTimer];
    }
    prevTrumpSuit.current = currentSuit;
    prevTrumpPhaseNum.current = currentPhase;
  }, [gs.trumpInfo.currentTrump, gs.trumpInfo.phase]);

  // Show "YOUR TURN" overlay — triggers on every turn start (including when it's already your turn but a new trick begins)
  const prevTrickCount = useRef(gs.trickCount);
  useEffect(() => {
    const isMyTurn = availableActions.length > 0 && availableActions.some(a =>
      a.type === 'playCard' || a.type === 'takeCards' || a.type === 'transferCard' || a.type === 'showPassThrough' || a.type === 'endAttack'
    );
    const trickChanged = gs.trickCount !== prevTrickCount.current;
    // Show overlay when: transitioning to my turn, OR trick changed and it's still my turn
    if (isMyTurn && (!prevIsMyTurn.current || trickChanged)) {
      yourTurnTimers.current.forEach(t => clearTimeout(t));
      yourTurnTimers.current = [];
      
      setShowYourTurn(true);
      setYourTurnPhase('enter');
      const exitTimer = setTimeout(() => {
        setYourTurnPhase('exit');
      }, 1600);
      const hideTimer = setTimeout(() => {
        setShowYourTurn(false);
        setYourTurnPhase(null);
        yourTurnTimers.current = [];
      }, 2000);
      yourTurnTimers.current = [exitTimer, hideTimer];
    }
    prevIsMyTurn.current = isMyTurn;
    prevTrickCount.current = gs.trickCount;
  }, [availableActions, gs.trickCount]);

  // Sound effects for alert
  const { play: playSound, enabled: soundEnabled } = useSound();
  const { settings: gameSettings } = useSettings();

  // Urgent turn alert when timer reaches 15 seconds
  useEffect(() => {
    const isMyTurn = availableActions.length > 0 && availableActions.some(a =>
      a.type === 'playCard' || a.type === 'takeCards' || a.type === 'transferCard' || a.type === 'showPassThrough'
    );

    if (isMyTurn && turnTimer !== undefined && turnTimer <= 15 && turnTimer > 0 && urgentAlertShownForTrick.current !== gs.trickCount) {
      urgentAlertShownForTrick.current = gs.trickCount;
      urgentTurnTimers.current.forEach(t => clearTimeout(t));
      urgentTurnTimers.current = [];

      // Play alert sound (only if sound is enabled)
      playSound('timerWarning', 0.8);

      // Vibrate on mobile (works even if sound is muted, but respects vibration setting)
      try {
        if (gameSettings.vibrationEnabled && navigator.vibrate) {
          navigator.vibrate([200, 100, 200, 100, 200]);
        }
      } catch {}

      setShowUrgentTurn(true);
      setUrgentTurnPhase('enter');

      const exitTimer = setTimeout(() => {
        setUrgentTurnPhase('exit');
      }, 1700);
      const hideTimer = setTimeout(() => {
        setShowUrgentTurn(false);
        setUrgentTurnPhase(null);
        urgentTurnTimers.current = [];
      }, 2000);
      urgentTurnTimers.current = [exitTimer, hideTimer];
    }

    // Reset when it's no longer my turn
    if (!isMyTurn) {
      urgentAlertShownForTrick.current = -1;
    }
  }, [turnTimer, availableActions, gs.trickCount]);

  const playableIds = useMemo(() => {
    const ids = new Set<string>();
    for (const a of availableActions) {
      if (a.type === 'playCard') a.cardIds.forEach(id => ids.add(id));
    }
    return ids;
  }, [availableActions]);

  const transferIds = useMemo(() => {
    const ids = new Set<string>();
    for (const a of availableActions) {
      if (a.type === 'transferCard') a.cardIds.forEach(id => ids.add(id));
    }
    return ids;
  }, [availableActions]);

  const passThroughIds = useMemo(() => {
    const ids = new Set<string>();
    for (const a of availableActions) {
      if (a.type === 'showPassThrough') a.cardIds.forEach(id => ids.add(id));
    }
    return ids;
  }, [availableActions]);

  const canTake = availableActions.some(a => a.type === 'takeCards');
  const canEndAttack = availableActions.some(a => a.type === 'endAttack');
  const canSkip = availableActions.some(a => a.type === 'skipTurn');
  const canTransfer = transferIds.size > 0;
  const canPassThrough = passThroughIds.size > 0;
  const hasAnyAction = canTake || canEndAttack || canSkip || (canTransfer && selectedCardId && transferIds.has(selectedCardId)) || (canPassThrough && selectedCardId && passThroughIds.has(selectedCardId));

  const sortedHand = sortHand(gs.myHand, sortMode);

  const handleCardClick = (card: Card) => {
    if (isDefender && gs.turnPhase === 'defend' && !gs.defenderTaking) {
      if (transferIds.has(card.id) || passThroughIds.has(card.id)) {
        if (selectedCardId === card.id) {
          setSelectedCardId(null);
        } else {
          setSelectedCardId(card.id);
        }
        return;
      }
      if (playableIds.has(card.id)) {
        const undefended = gs.battleField
          .map((p, i) => ({ pair: p, idx: i }))
          .filter(x => !x.pair.defense);
        if (undefended.length === 1) {
          onPlayCard(card.id, undefended[0].idx);
        } else {
          // Only show target selection for special cards (trump, king of spades, 777)
          // Normal cards auto-find the first valid target
          const isTrump = card.suit === gs.trumpInfo.currentTrump;
          const isKingSpades = card.rank === 'K' && card.suit === 'spades';
          const is777Card = card.rank === '777';
          const isSpecialCard = isTrump || isKingSpades || is777Card;

          if (isSpecialCard) {
            // Show highlight on battlefield pairs so player can choose which to beat
            if (selectedCardId === card.id) {
              setSelectedCardId(null);
            } else {
              setSelectedCardId(card.id);
            }
          } else {
            // Auto-play on first valid undefended pair
            onPlayCard(card.id);
          }
        }
        return;
      }
    }
    if (playableIds.has(card.id)) {
      onPlayCard(card.id);
      setSelectedCardId(null);
    } else if (transferIds.has(card.id)) {
      onTransferCard(card.id);
      setSelectedCardId(null);
    } else if (passThroughIds.has(card.id)) {
      if (selectedCardId === card.id) {
        setSelectedCardId(null);
      } else {
        setSelectedCardId(card.id);
      }
    }
  };

  // Handle drag-and-drop card play
  const handleCardDrop = useCallback((card: Card): boolean => {
    // Attacker or non-defender adding cards
    if (!isDefender || gs.defenderTaking) {
      if (playableIds.has(card.id)) {
        onPlayCard(card.id);
        setSelectedCardId(null);
        return true;
      }
      if (transferIds.has(card.id)) {
        onTransferCard(card.id);
        setSelectedCardId(null);
        return true;
      }
    }

    // Defender: auto-target if only one undefended pair, or auto-play non-special cards
    if (isDefender && gs.turnPhase === 'defend' && !gs.defenderTaking) {
      if (playableIds.has(card.id)) {
        const undefended = gs.battleField
          .map((p, i) => ({ pair: p, idx: i }))
          .filter(x => !x.pair.defense);
        if (undefended.length === 1) {
          onPlayCard(card.id, undefended[0].idx);
          setSelectedCardId(null);
          return true;
        }
        // Check if special card (trump, king of spades, 777) — needs target selection
        const isTrump = card.suit === gs.trumpInfo.currentTrump;
        const isKingSpades = card.rank === 'K' && card.suit === 'spades';
        const is777Card = card.rank === '777';
        if (isTrump || isKingSpades || is777Card) {
          // Special card — select and let player click target
          setSelectedCardId(card.id);
          return false;
        }
        // Normal card — auto-play on first valid target
        onPlayCard(card.id);
        setSelectedCardId(null);
        return true;
      }
    }

    return false; // Invalid drop — card returns to hand
  }, [isDefender, gs.defenderTaking, gs.turnPhase, gs.battleField, gs.trumpInfo.currentTrump, playableIds, transferIds, onPlayCard, onTransferCard]);

  const trumpSymbol = SUIT_SYMBOLS[gs.trumpInfo.currentTrump] || gs.trumpInfo.currentTrump;
  const mobileTrumpColor = gs.trumpInfo.currentTrump === 'hearts' || gs.trumpInfo.currentTrump === 'diamonds' ? 'text-red-500' : 'text-white';

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [profilePopupGameId, setProfilePopupGameId] = useState<number | null>(null);

  const opponents = gs.players.filter((_, i) => i !== myIdx);

  const deck1Empty = gs.deck1Count === 0;
  const deck2Empty = gs.deck2Count === 0;
  const bothDecksEmpty = deck1Empty && deck2Empty;

  // Game over screen
  if (gs.gamePhase === 'finished' || gameOverData) {
    const myPlayer = gs.players[myIdx];
    const isLoser = gs.loserId === myPlayer?.id;
    const isWinner = myPlayer?.winPlace && myPlayer.winPlace > 0;
    const didLeave = myPlayer?.leftGame;

    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-[#0a1628] via-[#0f2035] to-[#0a1628] flex items-center justify-center p-3 sm:p-4">
        <div className="bg-[#1a2d45]/90 border border-amber-700/30 rounded-2xl p-4 sm:p-8 max-w-md w-full text-center space-y-4 sm:space-y-6">
          <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">
            {isLoser ? '😢' : didLeave ? '🚶' : '🎉'}
          </div>
          <h2 className="text-xl sm:text-3xl font-bold text-amber-100">
            {didLeave ? 'Вы покинули игру' : isLoser ? 'Вы проиграли!' : isWinner ? `Вы победили! (${myPlayer.winPlace}-е место)` : 'Игра окончена!'}
          </h2>

          {prizeData && prizeData.pool > 0 && (
            <div className="bg-amber-900/20 border border-amber-600/30 rounded-xl p-3 sm:p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/shanyrak_icon_9c1e8a3f.png" alt="" className="w-5 h-5" />
                <span className="text-amber-300 font-bold text-sm sm:text-base">Банк: {formatBalance(prizeData.pool)}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-amber-400 font-semibold text-base sm:text-lg">Результаты:</h3>
            {gs.players.map(p => {
              const prize = prizeData?.prizes.find(pr => pr.playerId === p.id);
              return (
                <div key={p.id} className={`flex items-center justify-between px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base ${
                  p.leftGame ? 'bg-gray-800/40 border border-gray-600/30' :
                  p.id === gs.loserId ? 'bg-red-900/30 border border-red-700/30' :
                  p.winPlace ? 'bg-green-900/20 border border-green-700/20' : 'bg-[#0f2035]/50'
                }`}>
                  <span className="text-amber-100 flex items-center gap-1.5 sm:gap-2 truncate">
                    {p.leftGame && <DoorOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 shrink-0" />}
                    {!p.leftGame && p.winPlace && <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />}
                    {!p.leftGame && p.id === gs.loserId && <Frown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 shrink-0" />}
                    <span className="truncate">{p.name}</span>
                  </span>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {prize && prize.amount > 0 && (
                      <span className="flex items-center gap-0.5 text-xs sm:text-sm text-amber-300">
                        +{formatBalance(prize.amount)}
                        <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/shanyrak_icon_9c1e8a3f.png" alt="" className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <span className={`text-xs sm:text-sm ${p.leftGame ? 'text-gray-400' : p.id === gs.loserId ? 'text-red-400' : 'text-green-400'}`}>
                      {p.leftGame ? 'Покинул' : p.id === gs.loserId ? 'Дурак' : p.winPlace ? `${p.winPlace}-е место` : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {onReturnToLobby && (
            <Button
              size="lg"
              className="w-full bg-amber-600 hover:bg-amber-500 text-white"
              onClick={onReturnToLobby}
            >
              <Home className="w-4 h-4 mr-2" />
              Вернуться в лобби
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-[100dvh] bg-cover bg-center bg-no-repeat relative flex flex-col"
      style={{ backgroundImage: `url(${GAME_TABLE_URL})` }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Bito animation */}
      {showBitoAnim && (
        <BitoAnimation
          cardCount={bitoCardCount}
          deckStyle={gs.deckStyle}
          onComplete={() => setShowBitoAnim(false)}
        />
      )}

      {/* Leave game confirmation dialog */}
      {showLeaveConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a2d45] border border-amber-700/40 rounded-2xl p-4 sm:p-6 max-w-sm w-full mx-4 text-center space-y-3 sm:space-y-4">
            <DoorOpen className="w-10 h-10 sm:w-12 sm:h-12 text-red-400 mx-auto" />
            <h3 className="text-lg sm:text-xl font-bold text-amber-100">Покинуть игру?</h3>
            <p className="text-amber-200/60 text-xs sm:text-sm">
              Вы автоматически проиграете. Ваши карты уйдут в бито.
            </p>
            <div className="flex gap-2 sm:gap-3">
              <Button
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm"
                onClick={() => setShowLeaveConfirm(false)}
              >
                Остаться
              </Button>
              <Button
                className="flex-1 bg-red-700 hover:bg-red-600 text-white text-sm"
                onClick={() => {
                  setShowLeaveConfirm(false);
                  onLeaveGame?.();
                }}
              >
                <LogOut className="w-4 h-4 mr-1" />
                Покинуть
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Room frozen overlay */}
      {frozenInfo && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1a2d45] border-2 border-amber-600/60 rounded-2xl p-5 sm:p-8 max-w-sm w-full mx-4 text-center space-y-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-amber-900/40 border-2 border-amber-600/40 flex items-center justify-center">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 11-12.728 0M12 9v4" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-amber-100">
              Игра приостановлена
            </h3>
            <p className="text-amber-200/80 text-sm sm:text-base">
              <span className="font-semibold text-amber-300">{frozenInfo.disconnectedPlayerName}</span>{' '}
              потерял соединение и пытается войти обратно...
            </p>
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(245,158,11,0.2)" strokeWidth="6" />
                <circle
                  cx="50" cy="50" r="45" fill="none" stroke="#f59e0b" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - frozenInfo.secondsLeft / 30)}`}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-3xl sm:text-4xl font-bold ${frozenInfo.secondsLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-amber-300'}`}>
                  {frozenInfo.secondsLeft}
                </span>
              </div>
            </div>
            <p className="text-amber-200/50 text-xs">
              Если игрок не вернётся, он автоматически выбывает из игры
            </p>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col h-[100dvh]">
        {/* Top HUD — compact panel */}
        <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 bg-black/60 backdrop-blur-sm border-b border-amber-700/20">
          <div className="flex items-center gap-2 sm:gap-3">
            <Badge variant="outline" className="sm:hidden border-amber-700/30 text-white text-sm px-2 py-1">
              К1:<span className={`font-bold ${gs.deck1Count < 5 ? 'text-red-400' : ''}`}>{gs.deck1Count}</span>
              <span className="text-amber-300 mx-1">|</span>
              К2:<span className={`font-bold ${gs.deck2Count < 5 ? 'text-red-400' : ''}`}>{gs.deck2Count}</span>
              <span className="text-amber-300 mx-1">|</span>
              Бито:<span className="font-bold">{gs.discardCount}</span>
            </Badge>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Badge variant="outline" className="border-amber-700/30 text-amber-200/70 text-sm px-2 sm:px-3 py-1">
              {gs.direction === 'cw' ? <ArrowRight className="w-[18px] h-[18px] sm:w-5 sm:h-5" /> : <ArrowLeft className="w-[18px] h-[18px] sm:w-5 sm:h-5" />}
            </Badge>
            <Badge className={`sm:hidden text-sm px-2 py-1 ${turnTimer <= 5 ? 'bg-red-900/60 text-red-300 border-red-700/40 animate-pulse' : 'bg-amber-900/60 text-amber-300 border-amber-700/40'}`}>
              <Timer className="w-4 h-4 mr-0.5" />
              {turnTimer}с
            </Badge>
            {onToggleMusic && (
              <button
                className={`transition-colors p-1 sm:p-1.5 rounded ${musicEnabled ? 'text-amber-400 hover:text-amber-300' : 'text-gray-500 hover:text-gray-400'}`}
                onClick={onToggleMusic}
                title={musicEnabled ? 'Выключить музыку' : 'Включить музыку'}
              >
                {musicEnabled ? <Music className="w-[18px] h-[18px] sm:w-6 sm:h-6" /> : <VolumeX className="w-[18px] h-[18px] sm:w-6 sm:h-6" />}
              </button>
            )}
            {onLeaveGame && !gs.players[myIdx]?.isOut && (
              <button
                className="text-gray-400 hover:text-red-400 transition-colors p-1 sm:p-1.5 rounded"
                onClick={() => setShowLeaveConfirm(true)}
                title="Покинуть игру"
              >
                <LogOut className="w-[18px] h-[18px] sm:w-6 sm:h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Opponents — positioned below expanded HUD */}
        {(() => {
          const manyOpponents = opponents.length >= 4;
          return (
            <div className={`flex justify-center flex-wrap px-1 sm:px-3 py-1 sm:py-2.5 ${manyOpponents ? 'gap-1' : 'gap-1.5'} sm:gap-3`}>
              {opponents.map(p => {
                const pIdx = gs.players.findIndex(pp => pp.id === p.id);
                const isOppAttacker = pIdx === gs.currentAttackerIdx;
                const isOppDefender = pIdx === gs.currentDefenderIdx;
                const oppRevealed = gs.revealedPassThroughs?.find(r => r.playerId === p.id);
                return (
                  <div key={p.id} className={`flex flex-col items-center ${manyOpponents ? 'px-1 py-0.5' : 'px-1.5 py-1'} sm:px-3 sm:py-2 rounded-lg sm:rounded-xl border transition-all shrink-0 ${
                    isOppAttacker ? 'bg-red-900/30 border-red-500/40' :
                    isOppDefender ? (gs.defenderTaking ? 'bg-orange-900/30 border-orange-500/40' : 'bg-blue-900/30 border-blue-500/40') :
                    'bg-black/30 border-amber-700/20'
                  }`}>
                    {/* Avatar — clickable for profile popup */}
                    <button
                      className="focus:outline-none mb-0.5 sm:mb-1"
                      onClick={() => p.gameId && !p.isBot ? setProfilePopupGameId(p.gameId) : undefined}
                      disabled={p.isBot || !p.gameId}
                    >
                      <img
                        src={getAvatarUrl(p.avatarId)}
                        alt={p.name}
                        className={`${manyOpponents ? 'w-5 h-5' : 'w-7 h-7'} sm:w-9 sm:h-9 rounded-full border ${p.isBot ? 'border-gray-500/40 opacity-70' : 'border-amber-600/50 cursor-pointer hover:border-amber-400 hover:scale-110 transition-all'} object-cover`}
                      />
                    </button>
                    <div className={`flex items-center gap-0.5 sm:gap-1 ${manyOpponents ? 'mb-0' : 'mb-0.5'} sm:mb-1`}>
                      {isOppAttacker && <Swords className={`${manyOpponents ? 'w-2 h-2' : 'w-2.5 h-2.5'} sm:w-3 sm:h-3 text-red-400`} />}
                      {isOppDefender && !gs.defenderTaking && <Shield className={`${manyOpponents ? 'w-2 h-2' : 'w-2.5 h-2.5'} sm:w-3 sm:h-3 text-blue-400`} />}
                      {isOppDefender && gs.defenderTaking && <HandMetal className={`${manyOpponents ? 'w-2 h-2' : 'w-2.5 h-2.5'} sm:w-3 sm:h-3 text-orange-400`} />}
                      {p.isOut && p.winPlace && <Crown className={`${manyOpponents ? 'w-2 h-2' : 'w-2.5 h-2.5'} sm:w-3 sm:h-3 text-amber-400`} />}
                      <span className={`${manyOpponents ? 'text-[9px] max-w-10' : 'text-[10px] max-w-14'} sm:text-xs text-amber-100 font-medium truncate sm:max-w-20`}>{p.name}</span>
                    </div>
                    {isOppDefender && gs.defenderTaking && (
                      <span className={`${manyOpponents ? 'text-[7px]' : 'text-[8px]'} sm:text-[10px] text-orange-400 mb-0.5`}>Берёт</span>
                    )}
                    {oppRevealed && oppRevealed.cards.length > 0 && (
                      <div className={`flex items-center gap-0.5 mb-0.5 sm:mb-1 bg-yellow-900/40 border border-yellow-600/40 rounded ${manyOpponents ? 'px-0.5' : 'px-1'} sm:px-2 py-0.5`}>
                        <Eye className={`${manyOpponents ? 'w-2 h-2' : 'w-2.5 h-2.5'} sm:w-3 sm:h-3 text-yellow-400`} />
                        <span className={`${manyOpponents ? 'text-[7px]' : 'text-[8px]'} sm:text-[10px] text-yellow-300 font-medium`}>
                          {oppRevealed.cards.length}
                        </span>
                      </div>
                    )}
                    {p.leftGame ? (
                      <div className={`flex items-center gap-0.5 bg-gray-800/50 border border-gray-600/30 rounded ${manyOpponents ? 'px-1 py-0.5' : 'px-1.5 py-0.5'} sm:px-2 sm:py-1`}>
                        <DoorOpen className={`${manyOpponents ? 'w-2 h-2' : 'w-2.5 h-2.5'} sm:w-3.5 sm:h-3.5 text-gray-400`} />
                        <span className={`${manyOpponents ? 'text-[7px]' : 'text-[8px]'} sm:text-xs text-gray-400 font-semibold`}>Ушёл</span>
                      </div>
                    ) : p.isOut ? (
                      <div className={`flex items-center gap-0.5 bg-green-900/40 border border-green-600/30 rounded ${manyOpponents ? 'px-1 py-0.5' : 'px-1.5 py-0.5'} sm:px-2 sm:py-1`}>
                        <Trophy className={`${manyOpponents ? 'w-2 h-2' : 'w-2.5 h-2.5'} sm:w-3.5 sm:h-3.5 text-amber-400`} />
                        <span className={`${manyOpponents ? 'text-[7px]' : 'text-[8px]'} sm:text-xs text-green-300 font-semibold`}>{p.winPlace}м</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5 sm:gap-1.5">
                        <img
                          src={gs.deckStyle === 'custom' ? CARD_BACK_CUSTOM_URL : CARD_BACK_URL}
                          alt="cards"
                          className={`${manyOpponents ? 'w-3 h-[18px]' : 'w-4 h-6'} sm:w-5 sm:h-7 rounded-sm object-cover`}
                        />
                        <span className={`${manyOpponents ? 'text-[10px]' : 'text-xs'} sm:text-sm text-amber-200 font-bold`}>{p.cardCount}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* YOUR TURN overlay */}
        {showYourTurn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className={`text-6xl sm:text-8xl md:text-[10rem] font-black text-amber-400 drop-shadow-[0_0_40px_rgba(245,158,11,0.6)] tracking-wider ${yourTurnPhase === 'enter' ? 'your-turn-enter' : yourTurnPhase === 'exit' ? 'your-turn-exit' : ''}`}>
              ВАШ ХОД
            </div>
          </div>
        )}

        {/* URGENT TURN ALERT at 15 seconds */}
        {showUrgentTurn && (
          <div className="fixed inset-0 z-[55] flex items-center justify-center pointer-events-none">
            <div className={`text-5xl sm:text-7xl md:text-9xl font-black text-red-500 drop-shadow-[0_0_40px_rgba(239,68,68,0.8)] tracking-wider ${urgentTurnPhase === 'enter' ? 'urgent-turn-enter' : urgentTurnPhase === 'exit' ? 'urgent-turn-exit' : ''}`}>
              <span className="urgent-blink">ВАШ ХОД</span>
            </div>
          </div>
        )}

        {/* TRUMP CHANGE overlay */}
        {showTrumpChange && trumpChangeInfo && (() => {
          const SUIT_NAMES: Record<string, string> = { spades: 'Пики', hearts: 'Черви', diamonds: 'Бубны', clubs: 'Трефы' };
          const sym = SUIT_SYMBOLS[trumpChangeInfo.suit] || trumpChangeInfo.suit;
          const suitName = SUIT_NAMES[trumpChangeInfo.suit] || trumpChangeInfo.suit;
          const color = trumpChangeInfo.suit === 'hearts' || trumpChangeInfo.suit === 'diamonds' ? 'text-red-500' : 'text-gray-100';
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
              <div className={`flex flex-col items-center gap-1.5 sm:gap-2 bg-black/70 backdrop-blur-md rounded-2xl px-5 sm:px-8 py-4 sm:py-6 border-2 border-amber-500/60 ${trumpChangePhase === 'enter' ? 'trump-change-enter' : trumpChangePhase === 'exit' ? 'trump-change-exit' : ''}`}>
                <span className="text-amber-300 text-sm sm:text-lg font-semibold tracking-wider uppercase">Козырь изменился!</span>
                <span className={`${color} text-6xl sm:text-8xl md:text-9xl leading-none drop-shadow-[0_0_20px_rgba(217,119,6,0.5)]`}>{sym}</span>
                <span className="text-amber-100 text-xl sm:text-2xl font-bold">{suitName}</span>
                <span className="text-amber-200/60 text-xs sm:text-sm">Фаза {trumpChangeInfo.phase}/3</span>
              </div>
            </div>
          );
        })()}

        {/* Main game area */}
        <div className="flex-1 flex relative">
          {/* LEFT PANEL — Timer + Discard pile — DESKTOP ONLY */}
          <div className="hidden sm:flex flex-col justify-between items-center w-36 md:w-44 py-4 px-2">
            <div className={`flex flex-col items-center gap-1 rounded-xl px-4 py-3 border-2 transition-all ${
              turnTimer <= 5
                ? 'bg-red-900/60 border-red-500/50 animate-pulse'
                : 'bg-black/50 border-amber-700/30'
            }`}>
              <Timer className={`w-6 h-6 ${turnTimer <= 5 ? 'text-red-400' : 'text-amber-400'}`} />
              <span className={`text-4xl md:text-5xl font-black tabular-nums leading-none ${
                turnTimer <= 5 ? 'text-red-300' : 'text-amber-300'
              }`}>
                {turnTimer}
              </span>
              <span className={`text-xs font-medium ${turnTimer <= 5 ? 'text-red-400/70' : 'text-amber-200/50'}`}>сек</span>
            </div>

            {gs.discardCount > 0 && (
              <DiscardPile count={gs.discardCount} deckStyle={gs.deckStyle} />
            )}
          </div>

          {/* CENTER — Battlefield (drop zone) */}
          <div className="flex-1 flex items-center justify-center px-2 sm:px-4">
            <div
              id="battlefield-drop-zone"
              className={`flex flex-col items-center gap-1 sm:gap-2 relative rounded-xl p-2 sm:p-4 transition-all ${
                dropZoneHighlight ? 'drop-zone-active' : ''
              }`}
            >
              {/* Defender taking banner */}
              {gs.defenderTaking && (
                <div className="bg-orange-900/60 border border-orange-600/40 rounded-lg px-2 sm:px-4 py-1 sm:py-1.5 mb-1 sm:mb-2">
                  <span className="text-orange-300 text-[10px] sm:text-sm font-medium">
                    {isDefender ? '🫳 Вы берёте' :
                     isAttacker ? '🔥 Защитник берёт — докиньте!' :
                     gs.attackerHasPriority ? '⏳ Ожидание' :
                     '🔥 Защитник берёт — докиньте!'}
                  </span>
                </div>
              )}

              {/* Revealed pass-through cards banner */}
              {gs.revealedPassThroughs && gs.revealedPassThroughs.find(r => r.playerId === gs.players[myIdx]?.id) && (
                <div className="bg-yellow-900/50 border border-yellow-600/40 rounded-lg px-2 sm:px-4 py-1 sm:py-1.5 mb-1 sm:mb-2">
                  <span className="text-yellow-300 text-[10px] sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                    Проездной ({gs.revealedPassThroughs.find(r => r.playerId === gs.players[myIdx]?.id)!.cards.length})
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-2 sm:gap-4 justify-center max-w-xs sm:max-w-3xl">
                {gs.battleField.map((pair: BattlePair, i: number) => (
                  <div
                    key={i}
                    className={`relative ${
                      selectedCardId && isDefender && !pair.defense
                        ? 'ring-2 ring-amber-400/50 rounded-lg cursor-pointer'
                        : ''
                    }`}
                    onClick={() => {
                      if (selectedCardId && isDefender && !pair.defense && playableIds.has(selectedCardId)) {
                        onPlayCard(selectedCardId, i);
                        setSelectedCardId(null);
                      }
                    }}
                  >
                    <PlayingCard card={pair.attack} medium deckStyle={gs.deckStyle} />
                    {pair.defense && (
                      <div className="absolute top-3 left-3 sm:top-5 sm:left-5 z-10">
                        <PlayingCard card={pair.defense} medium deckStyle={gs.deckStyle} />
                      </div>
                    )}
                  </div>
                ))}

              </div>
            </div>
          </div>

          {/* RIGHT PANEL — Decks — DESKTOP ONLY */}
          <div className="hidden sm:flex flex-col justify-center items-center w-44 md:w-52 py-4 px-2 gap-3">
            {bothDecksEmpty ? (
              <TrumpIcon suit={gs.trumpInfo.currentTrump} size="large" />
            ) : (
              <div className="flex flex-col gap-3 items-center">
                {deck1Empty ? (
                  <TrumpIcon suit={gs.trumpInfo.currentTrump} size="normal" />
                ) : (
                  <>
                    <TrumpIcon suit={gs.trumpInfo.currentTrump} size="normal" />
                    <DeckVisual
                      deckCount={gs.deck1Count}
                      trumpCard={gs.trumpInfo.trumpCard || null}
                      showOpenTrump={true}
                      deckStyle={gs.deckStyle}
                      label="Колода 1"
                    />
                  </>
                )}

                {deck2Empty ? (
                  deck1Empty ? null : (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-amber-200/60 text-[9px] sm:text-xs font-medium">Колода 2</span>
                      <div className="text-amber-200/20 text-xs italic">Пусто</div>
                    </div>
                  )
                ) : (
                  <DeckVisual
                    deckCount={gs.deck2Count}
                    trumpCard={gs.trumpInfo.hiddenTrumpCard || null}
                    showOpenTrump={false}
                    deckStyle={gs.deckStyle}
                    label="Колода 2"
                  />
                )}
              </div>
            )}
          </div>

          {/* MOBILE: Trump icon */}
          <div className="sm:hidden absolute top-2 right-2 z-20 flex flex-col items-center bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-2 border border-amber-700/40">
            <span className={`${mobileTrumpColor} text-3xl leading-none`}>{trumpSymbol}</span>
            <span className="text-amber-200/60 text-[8px] font-semibold">Козырь</span>

          </div>


        </div>

        {/* Winner/spectator banner */}
        {gs.players[myIdx]?.isOut && gs.players[myIdx]?.winPlace && (
          <div className="flex items-center justify-center px-2 sm:px-3 py-1 sm:py-2">
            <div className="bg-green-900/60 border border-green-600/40 rounded-lg px-3 sm:px-6 py-1.5 sm:py-2 flex items-center gap-2 sm:gap-3">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              <span className="text-green-300 font-semibold text-xs sm:text-base">
                Вы победили! ({gs.players[myIdx].winPlace}-е место)
              </span>
            </div>
          </div>
        )}

        {/* Role indicator + Action buttons — DESKTOP: centered fixed overlay */}
        {/* Desktop version */}
        {hasAnyAction && (
          <div className="hidden sm:flex fixed left-0 right-0 bottom-[180px] z-40 justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-2 pointer-events-auto">
              {/* Role badges */}
              <div className="flex items-center gap-2">
                {isAttacker && !gs.defenderTaking && (
                  <Badge className="bg-red-900/70 text-red-300 border-red-700/40 text-xl px-5 py-2 backdrop-blur-sm">
                    <Swords className="w-6 h-6 mr-2" /> Атакуете
                  </Badge>
                )}
                {isAttacker && gs.defenderTaking && (
                  <Badge className="bg-orange-900/70 text-orange-300 border-orange-700/40 text-xl px-5 py-2 backdrop-blur-sm">
                    <Swords className="w-6 h-6 mr-2" /> Докиньте
                  </Badge>
                )}
                {isDefender && !gs.defenderTaking && (
                  <Badge className="bg-blue-900/70 text-blue-300 border-blue-700/40 text-xl px-5 py-2 backdrop-blur-sm">
                    <Shield className="w-6 h-6 mr-2" /> Защита
                  </Badge>
                )}
                {isDefender && gs.defenderTaking && (
                  <Badge className="bg-orange-900/70 text-orange-300 border-orange-700/40 text-xl px-5 py-2 backdrop-blur-sm">
                    <HandMetal className="w-6 h-6 mr-2" /> Берёте
                  </Badge>
                )}
                {!isAttacker && !isDefender && gs.canAddCards && !gs.attackerHasPriority && (
                  <Badge className="bg-amber-900/70 text-amber-300 border-amber-700/40 text-lg px-4 py-1.5 backdrop-blur-sm">
                    Подкинуть
                  </Badge>
                )}
                {!isAttacker && !isDefender && gs.canAddCards && gs.attackerHasPriority && (
                  <Badge className="bg-gray-800/70 text-gray-400 border-gray-700/40 text-lg px-4 py-1.5 backdrop-blur-sm">
                    Ожидание...
                  </Badge>
                )}
              </div>

              {/* Action buttons — semi-transparent so cards underneath are visible */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {canTransfer && selectedCardId && transferIds.has(selectedCardId) && (
                  <Button
                    className="bg-purple-700/60 hover:bg-purple-600/80 text-white text-lg h-14 px-6 font-semibold backdrop-blur-sm shadow-xl border border-purple-500/20"
                    onClick={() => { onTransferCard(selectedCardId); setSelectedCardId(null); }}
                  >
                    Перевести
                  </Button>
                )}
                {canPassThrough && selectedCardId && passThroughIds.has(selectedCardId) && (
                  <Button
                    className="bg-yellow-700/60 hover:bg-yellow-600/80 text-white text-lg h-14 px-6 font-semibold backdrop-blur-sm shadow-xl border border-yellow-500/20"
                    onClick={() => { onShowPassThrough(selectedCardId); setSelectedCardId(null); }}
                  >
                    <Eye className="w-5 h-5 mr-1.5" />
                    Проездной
                  </Button>
                )}
                {canTake && (
                  <Button variant="destructive" className="text-lg h-14 px-6 font-semibold bg-red-700/60 hover:bg-red-600/80 backdrop-blur-sm shadow-xl" onClick={onTakeCards}>
                    Забрать
                  </Button>
                )}
                {canEndAttack && (
                  <Button className="bg-green-700/60 hover:bg-green-600/80 text-white text-lg h-14 px-6 font-semibold backdrop-blur-sm shadow-xl border border-green-500/20" onClick={onEndAttack}>
                    {gs.defenderTaking ? 'Бито (хватит)' : 'Бито'}
                  </Button>
                )}
                {canSkip && (
                  <Button variant="outline" className="border-amber-700/40 text-amber-200 bg-amber-900/30 text-lg h-14 px-6 font-semibold backdrop-blur-sm shadow-xl" onClick={onSkipTurn}>
                    Пропустить
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MOBILE: Floating action buttons — always visible over battlefield */}
        {hasAnyAction && (
          <div className="sm:hidden fixed bottom-[120px] left-0 right-0 z-40 flex flex-col items-center gap-1.5 pointer-events-none">
            {/* Role badge */}
            <div className="pointer-events-auto">
              {isAttacker && !gs.defenderTaking && (
                <Badge className="bg-red-900/80 text-red-300 border-red-700/50 text-xs px-2.5 py-1 shadow-lg backdrop-blur-sm">
                  <Swords className="w-3.5 h-3.5 mr-1" /> Атакуете
                </Badge>
              )}
              {isAttacker && gs.defenderTaking && (
                <Badge className="bg-orange-900/80 text-orange-300 border-orange-700/50 text-xs px-2.5 py-1 shadow-lg backdrop-blur-sm">
                  <Swords className="w-3.5 h-3.5 mr-1" /> Докиньте
                </Badge>
              )}
              {isDefender && !gs.defenderTaking && (
                <Badge className="bg-blue-900/80 text-blue-300 border-blue-700/50 text-xs px-2.5 py-1 shadow-lg backdrop-blur-sm">
                  <Shield className="w-3.5 h-3.5 mr-1" /> Защита
                </Badge>
              )}
              {isDefender && gs.defenderTaking && (
                <Badge className="bg-orange-900/80 text-orange-300 border-orange-700/50 text-xs px-2.5 py-1 shadow-lg backdrop-blur-sm">
                  <HandMetal className="w-3.5 h-3.5 mr-1" /> Берёте
                </Badge>
              )}
              {!isAttacker && !isDefender && gs.canAddCards && !gs.attackerHasPriority && (
                <Badge className="bg-amber-900/80 text-amber-300 border-amber-700/50 text-xs px-2.5 py-1 shadow-lg backdrop-blur-sm">
                  Подкинуть
                </Badge>
              )}
              {!isAttacker && !isDefender && gs.canAddCards && gs.attackerHasPriority && (
                <Badge className="bg-gray-800/80 text-gray-400 border-gray-700/50 text-xs px-2.5 py-1 shadow-lg backdrop-blur-sm">
                  Ожидание...
                </Badge>
              )}
            </div>

            {/* Floating action buttons */}
            <div className="flex items-center gap-2 pointer-events-auto">
              {canTransfer && selectedCardId && transferIds.has(selectedCardId) && (
                <Button
                  className="bg-purple-700/55 hover:bg-purple-600/75 text-white text-sm h-11 px-4 font-semibold shadow-xl backdrop-blur-sm border border-purple-500/20"
                  onClick={() => { onTransferCard(selectedCardId); setSelectedCardId(null); }}
                >
                  Перевести
                </Button>
              )}
              {canPassThrough && selectedCardId && passThroughIds.has(selectedCardId) && (
                <Button
                  className="bg-yellow-700/55 hover:bg-yellow-600/75 text-white text-sm h-11 px-4 font-semibold shadow-xl backdrop-blur-sm border border-yellow-500/20"
                  onClick={() => { onShowPassThrough(selectedCardId); setSelectedCardId(null); }}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Проездной
                </Button>
              )}
              {canTake && (
                <Button variant="destructive" className="text-sm h-11 px-4 font-semibold shadow-xl backdrop-blur-sm bg-red-700/55 hover:bg-red-600/75" onClick={onTakeCards}>
                  Забрать
                </Button>
              )}
              {canEndAttack && (
                <Button className="bg-green-700/55 hover:bg-green-600/75 text-white text-sm h-11 px-4 font-semibold shadow-xl backdrop-blur-sm border border-green-500/20" onClick={onEndAttack}>
                  {gs.defenderTaking ? 'Бито (хватит)' : 'Бито'}
                </Button>
              )}
              {canSkip && (
                <Button variant="outline" className="border-amber-700/40 text-amber-200 bg-amber-900/25 text-sm h-11 px-4 font-semibold shadow-xl backdrop-blur-sm" onClick={onSkipTurn}>
                  Пропустить
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Player hand */}
        {gs.players[myIdx]?.isOut ? (
          <div className="px-2 pb-2 sm:pb-3 pt-1">
            <div className="text-center text-amber-200/40 text-xs sm:text-sm py-2 sm:py-4">
              Вы вышли — наблюдайте
            </div>
          </div>
        ) : (
        <div className="px-1 sm:px-2 pb-2 sm:pb-3 pt-0.5 sm:pt-1">
          <div className="flex items-center justify-between mb-0.5 sm:mb-1 px-2">
            <span className="text-xs sm:text-base text-white font-medium">{gs.myHand.length} карт</span>
            <button
              className="text-xs sm:text-base text-white hover:text-amber-300 transition-colors font-medium"
              onClick={() => setSortMode(m => m === 'suit-rank' ? 'rank-only' : 'suit-rank')}
            >
              {sortMode === 'suit-rank' ? 'По масти' : 'По рангу'}
            </button>
          </div>
          <PlayerHand
            sortedHand={sortedHand}
            playableIds={playableIds}
            transferIds={transferIds}
            passThroughIds={passThroughIds}
            selectedCardId={selectedCardId}
            onCardClick={handleCardClick}
            onCardDrop={gameSettings.cardControlMode === 'drag' ? handleCardDrop : undefined}
            deckStyle={gs.deckStyle}
          />
        </div>
        )}
      </div>

      {/* Player Profile Popup */}
      {profilePopupGameId !== null && (
        <PlayerProfilePopup
          gameId={profilePopupGameId}
          onClose={() => setProfilePopupGameId(null)}
        />
      )}
    </div>
  );
}

// ---- Player Profile Popup ----
function PlayerProfilePopup({ gameId, onClose }: { gameId: number; onClose: () => void }) {
  const { data: profile, isLoading } = trpc.profile.withFriendStatus.useQuery({ targetGameId: gameId });
  const sendRequest = trpc.friends.sendRequest.useMutation();
  const utils = trpc.useUtils();

  const handleAddFriend = async () => {
    const result = await sendRequest.mutateAsync({ targetGameId: gameId });
    if (result.result === 'sent') {
      utils.profile.withFriendStatus.invalidate({ targetGameId: gameId });
    }
  };

  const winRate = profile && profile.gamesPlayed > 0
    ? Math.round((profile.wins / profile.gamesPlayed) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative bg-gradient-to-b from-[#1a2d45] to-[#0f1923] border border-amber-700/40 rounded-xl shadow-2xl w-[280px] sm:w-[320px] p-4 sm:p-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-2 right-2 text-amber-200/60 hover:text-amber-200 transition-colors p-1"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : profile ? (
          <div className="flex flex-col items-center gap-3">
            {/* Avatar & Name */}
            <img
              src={getAvatarUrl(profile.avatarId)}
              alt={profile.displayName || 'Player'}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-amber-600/60 object-cover"
            />
            <div className="text-center">
              <h3 className="text-amber-100 font-bold text-base sm:text-lg">{profile.displayName || 'Игрок'}</h3>
              <span className="text-amber-200/50 text-xs">ID {profile.gameId}</span>
            </div>

            {/* Stats */}
            <div className="w-full grid grid-cols-2 gap-2 text-center">
              <div className="bg-black/30 rounded-lg px-2 py-1.5 border border-amber-700/20">
                <div className="text-amber-200/50 text-[10px] sm:text-xs">Игры</div>
                <div className="text-amber-100 font-bold text-sm sm:text-base">{profile.gamesPlayed}</div>
              </div>
              <div className="bg-black/30 rounded-lg px-2 py-1.5 border border-amber-700/20">
                <div className="text-amber-200/50 text-[10px] sm:text-xs">Рейтинг</div>
                <div className="text-amber-100 font-bold text-sm sm:text-base">{profile.rating}</div>
              </div>
              <div className="bg-black/30 rounded-lg px-2 py-1.5 border border-amber-700/20">
                <div className="text-amber-200/50 text-[10px] sm:text-xs">Победы / Поражения</div>
                <div className="text-amber-100 font-bold text-sm sm:text-base">
                  <span className="text-green-400">{profile.wins}</span>
                  <span className="text-amber-200/40 mx-0.5">/</span>
                  <span className="text-red-400">{profile.losses}</span>
                </div>
              </div>
              <div className="bg-black/30 rounded-lg px-2 py-1.5 border border-amber-700/20">
                <div className="text-amber-200/50 text-[10px] sm:text-xs">Винрейт</div>
                <div className="text-amber-100 font-bold text-sm sm:text-base">{winRate}%</div>
              </div>
            </div>

            {/* Add Friend button */}
            {profile.friendStatus === 'none' && (
              <button
                className="w-full flex items-center justify-center gap-2 bg-amber-600/80 hover:bg-amber-600 text-white font-semibold rounded-lg px-4 py-2 transition-colors text-sm"
                onClick={handleAddFriend}
                disabled={sendRequest.isPending}
              >
                <UserPlus className="w-4 h-4" />
                {sendRequest.isPending ? 'Отправка...' : 'Добавить в друзья'}
              </button>
            )}
            {profile.friendStatus === 'pending_sent' && (
              <div className="w-full flex items-center justify-center gap-2 bg-amber-900/40 text-amber-300 rounded-lg px-4 py-2 text-sm border border-amber-700/30">
                <Clock className="w-4 h-4" />
                Запрос отправлен
              </div>
            )}
            {profile.friendStatus === 'pending_received' && (
              <div className="w-full flex items-center justify-center gap-2 bg-blue-900/40 text-blue-300 rounded-lg px-4 py-2 text-sm border border-blue-700/30">
                <UserPlus className="w-4 h-4" />
                Ожидает вашего ответа
              </div>
            )}
            {profile.friendStatus === 'friends' && (
              <div className="w-full flex items-center justify-center gap-2 bg-green-900/40 text-green-300 rounded-lg px-4 py-2 text-sm border border-green-700/30">
                <Check className="w-4 h-4" />
                Друзья
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-amber-200/50 text-sm">Профиль не найден</div>
        )}
      </div>
    </div>
  );
}
