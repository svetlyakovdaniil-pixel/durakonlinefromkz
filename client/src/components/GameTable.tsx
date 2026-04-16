import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import type { ClientGameState, AvailableAction, Card, BattlePair } from '../../../shared/gameTypes';
import { RANK_ORDER } from '../../../shared/gameTypes';
import { SUIT_SYMBOLS, SUIT_COLORS, CARD_BACK_URL, CARD_BACK_CUSTOM_URL, GAME_TABLE_URL, TABLE_STYLES, CARD_IMAGES, CARD_IMAGES_CUSTOM, getCardImageKey, getCustomCardImageKey } from '../../../shared/cardAssets';
import PlayingCard from './PlayingCard';
import DraggableCard from './DraggableCard';
import { BitoAnimation } from './CardAnimations';
import GalaxyTableOverlay from './GalaxyTableOverlay';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Swords, Shield, ArrowRight, ArrowLeft, Timer, Layers, Trash2, Crown, Trophy, Frown, Home, HandMetal, Eye, LogOut, DoorOpen, ChevronLeft, ChevronRight, Settings, X, UserPlus, Clock, Check, Flag } from 'lucide-react';
import { useSoundContext } from '@/contexts/SoundContext';
import { useSettings } from '@/contexts/SettingsContext';
import { getAvatarUrl } from '../../../shared/avatars';
import { AvatarDisplay } from './AvatarDisplay';
import { trpc } from '@/lib/trpc';
import { formatBalance } from '../../../shared/formatBalance';
import { useTranslation } from '@/i18n';
import { FrameWrapper } from './AvatarWithFrame';
import GameSettingsSheet from './GameSettingsSheet';
import TutorialOverlay from './TutorialOverlay';
import TutorialTooltip from './TutorialTooltip';
import TutorialArrow from './TutorialArrow';
import TutorialHint from './TutorialHint';
import { useTutorial } from '@/hooks/useTutorial';
import { useTutorialScenarios } from '@/hooks/useTutorialScenarios';
import { useInteractiveTutorial } from '@/hooks/useInteractiveTutorial';
import TutorialStepDisplay from './TutorialStepDisplay';
import { useTutorialGameState } from '@/hooks/useTutorialGameState';
import { DiamondRankIcon } from '@/components/DiamondRankIcon';


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
  multiSelectIds,
  highlightedIds,
  tutorialHighlightIds,
  tutorialGreenIds,
  tutorialRedIds,
  pendingCardId,
  onCardClick,
  onCardDrop,
  deckStyle,
}: {
  sortedHand: Card[];
  playableIds: Set<string>;
  transferIds: Set<string>;
  passThroughIds: Set<string>;
  selectedCardId: string | null;
  multiSelectIds: Set<string>;
  highlightedIds: Set<string>;
  tutorialHighlightIds?: Set<string>;
  tutorialGreenIds?: Set<string>;
  tutorialRedIds?: Set<string>;
  pendingCardId?: string | null;
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

  // Desktop: allow mouse wheel to scroll hand horizontally
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    // Only intercept if we can scroll horizontally
    if (el.scrollWidth <= el.clientWidth) return;
    e.preventDefault();
    el.scrollLeft += e.deltaY !== 0 ? e.deltaY : e.deltaX;
    setTimeout(checkScroll, 50);
  }, [checkScroll]);

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
        className={`flex pb-1 sm:pb-2 ${needsScroll ? 'overflow-x-auto scrollbar-thin scrollbar-thumb-amber-700/40 scrollbar-track-transparent' : 'justify-center'}`}
        onScroll={checkScroll}
        onWheel={handleWheel}
        style={needsScroll ? {
          scrollbarWidth: 'thin',
          WebkitOverflowScrolling: 'touch',
        } : undefined}
      >
        <div className={`flex items-end px-4 sm:px-6 ${!needsScroll ? 'justify-center' : ''}`} style={needsScroll ? { minWidth: 'min-content', margin: '0 auto' } : undefined}>
          {sortedHand.map((card, i) => {
            const isPlayable = playableIds.has(card.id) || transferIds.has(card.id) || passThroughIds.has(card.id);
            const isSelected = selectedCardId === card.id || multiSelectIds.has(card.id);
            const isPending = pendingCardId === card.id;
            const isHighlighted = highlightedIds.has(card.id) && !multiSelectIds.has(card.id);
            const isTutorialHighlighted = tutorialHighlightIds?.has(card.id) ?? false;
            const isTutorialGreen = tutorialGreenIds?.has(card.id) ?? false;
            const isTutorialRed = tutorialRedIds?.has(card.id) ?? false;
            const hasColoredHighlight = isTutorialGreen || isTutorialRed;
            const isPassThroughCard = passThroughIds.has(card.id);
            const canDrag = playableIds.has(card.id) || transferIds.has(card.id);
            return (
              <div
                key={card.id}
                data-card-id={card.id}
                className={`relative flex-shrink-0 ${(isTutorialHighlighted || hasColoredHighlight) ? 'z-[60]' : ''} ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
                style={{
                  marginLeft: getCardMargin(i),
                  zIndex: (isTutorialHighlighted || hasColoredHighlight) ? 60 : isSelected ? 50 : i,
                  transition: isPending ? 'opacity 0.15s' : undefined,
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
                      transform: (isTutorialHighlighted || isTutorialGreen) ? 'translateY(-16px)' : isSelected ? 'translateY(-8px)' : undefined,
                      transition: 'transform 0.15s',
                    }}
                  >
                    {/* Colored glow wrapper for green/red tutorial highlights */}
                    {hasColoredHighlight && (
                      <div
                        className="absolute inset-0 rounded-lg pointer-events-none"
                        style={{
                          boxShadow: isTutorialGreen
                            ? '0 0 12px rgba(34,197,94,0.7), 0 0 24px rgba(34,197,94,0.4)'
                            : '0 0 12px rgba(239,68,68,0.7), 0 0 24px rgba(239,68,68,0.4)',
                          border: isTutorialGreen ? '2px solid rgba(34,197,94,0.8)' : '2px solid rgba(239,68,68,0.8)',
                          zIndex: 1,
                        }}
                      />
                    )}
                    <PlayingCard
                      card={card}
                      playable={isPlayable}
                      selected={isSelected}
                      highlighted={isHighlighted || isTutorialHighlighted}
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
  hiddenTrumpCard1,
  showOpenTrump,
  deckStyle,
  label,
}: {
  deckCount: number;
  trumpCard?: { suit: string | null; rank: string; copy: number; id: string } | null;
  hiddenTrumpCard1?: { suit: string | null; rank: string; copy: number; id: string } | null;
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
function TrumpIcon({ suit, size = 'normal', label = 'Козырь' }: { suit: string; size?: 'normal' | 'large'; label?: string }) {
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
          {label}
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
        {label}
      </span>
    </div>
  );
}

// ---- Discard pile visual ----
function DiscardPile({ count, deckStyle, bitoLabel = 'Бито' }: { count: number; deckStyle: 'classic' | 'custom'; bitoLabel?: string }) {
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
      <span className="text-amber-300 text-xs sm:text-2xl font-bold">{bitoLabel}</span>
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
  onTransferCards?: (cardIds: string[]) => void;
  onTakeCards: () => void;
  onPassTurn: () => void;
  onEndAttack: () => void;
  onSkipTurn: () => void;
  onShowPassThrough: (cardId: string) => void;
  onShowPassThroughs?: (cardIds: string[]) => void;
  onLeaveGame?: () => void;
  onReturnToLobby?: () => void;
  roomPenalty?: number;
  musicEnabled?: boolean;
  onToggleMusic?: () => void;
  musicVolume?: number;
  onMusicVolumeChange?: (v: number) => void;
  frozenInfo?: { disconnectedPlayerName: string; secondsLeft: number } | null;
  isTutorial?: boolean;
  onTutorialComplete?: () => void;
}

export default function GameTable({
  gameState, availableActions, turnTimer, gameOverData, prizeData,
  onPlayCard, onTransferCard, onTransferCards, onTakeCards, onPassTurn, onEndAttack, onSkipTurn, onShowPassThrough, onShowPassThroughs,
  onLeaveGame, onReturnToLobby, roomPenalty = 0,
  musicEnabled = false, onToggleMusic, musicVolume = 0.3, onMusicVolumeChange, frozenInfo,
  isTutorial = false, onTutorialComplete,
}: GameTableProps) {
  // Interactive tutorial state
  const {
    currentStep: tutorialStep,
    isCompleted: tutorialCompleted,
    totalSteps: tutorialTotalSteps,
    getCurrentScenario,
    nextStep: tutorialNextStep,
    previousStep: tutorialPreviousStep,
    skipTutorial,
  } = useInteractiveTutorial();
  const currentTutorialScenario = getCurrentScenario();
  
  const { t, locale } = useTranslation();
  // Apply tutorial game state modifications if in tutorial
  const tutorialModifiedGameState = useTutorialGameState(currentTutorialScenario, gameState, locale);
  
  // Use tutorial game state if in tutorial, otherwise use actual game state
  const gs = isTutorial && currentTutorialScenario ? tutorialModifiedGameState : gameState;
  const myIdx = gs.myIndex;

  const [sortMode, setSortMode] = useState<'suit-rank' | 'rank-only'>('suit-rank');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  // Multi-card opening attack / transfer selection
  const [multiSelectIds, setMultiSelectIds] = useState<Set<string>>(new Set());
  const [multiSelectMode, setMultiSelectMode] = useState<'attack' | 'transfer' | 'passthrough' | null>(null);
  // Pending card ID — prevents double-tap/click after card is sent to server
  // Cleared when gameStateUpdate or yourTurn arrives (via availableActions change)
  const [pendingCardId, setPendingCardId] = useState<string | null>(null);
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

  // Sound effect tracking refs
  const prevBattleFieldForSound = useRef(gs.battleField);
  const prevDefenderTaking = useRef(gs.defenderTaking);
  const prevRevealedPassThroughs = useRef(gs.revealedPassThroughs);
  const prevDirection = useRef(gs.direction);
  const prevDefenderIdx = useRef(gs.currentDefenderIdx);

  // Sound effects
  const { play: playSound, enabled: soundEnabled, toggle: toggleSound, volume: soundVolume, setVolume: setSoundVolume } = useSoundContext();
  const { settings: gameSettings } = useSettings();

  // Drop zone highlight
  const [dropZoneHighlight, setDropZoneHighlight] = useState(false);

  // Tutorial state
  const tutorial = useTutorial();
  useEffect(() => {
    if (isTutorial) {
      tutorial.startTutorial();
    }
  }, [isTutorial]);

  // Handle tutorial completion — return to lobby
  const tutorialCompleteCalledRef = useRef(false);
  useEffect(() => {
    if (tutorialCompleted && onTutorialComplete && !tutorialCompleteCalledRef.current) {
      tutorialCompleteCalledRef.current = true;
      onTutorialComplete();
    }
  }, [tutorialCompleted]);

  const isAttacker = myIdx === gs.currentAttackerIdx;
  const isDefender = myIdx === gs.currentDefenderIdx;
  // Helper: is myIdx a direct neighbor (left or right) of the current defender?
  // Mirrors server-side isEdgePlayer logic using active players.
  const isNeighborOfDefender = (() => {
    if (isAttacker || isDefender) return true; // attacker is always a neighbor
    const activePlayers = gs.players.filter(p => !p.isOut);
    if (activePlayers.length < 2) return true;
    const defIdx = gs.currentDefenderIdx;
    // Find left neighbor (ccw from defender)
    const dir = gs.direction;
    const n = gs.players.length;
    const step = (idx: number, forward: boolean) => {
      let i = idx;
      for (let tries = 0; tries < n; tries++) {
        i = forward ? (i + 1) % n : (i - 1 + n) % n;
        if (!gs.players[i].isOut) return i;
      }
      return idx;
    };
    const cwNeighbor = step(defIdx, true);
    const ccwNeighbor = step(defIdx, false);
    return myIdx === cwNeighbor || myIdx === ccwNeighbor;
  })();
  // True when: lead card is 6, I'm NOT a neighbor, and I have NO sixes in hand.
  // In this case the player is purely a spectator — hide all action UI.
  const isSixOnlySpectator = gs.leadCardRank === '6' &&
    gs.battleField.length > 0 &&
    !isNeighborOfDefender &&
    !gs.myHand.some(c => c.rank === '6');

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
      // Cards went to discard = bito
      const cardsCleared = prevBattleFieldLen.current * 2; // attack + defense pairs
      setBitoCardCount(cardsCleared);
      setShowBitoAnim(true);
      playSound('bito', 0.6);
    } else if (battleCleared && !discardGrew) {
      // Battlefield cleared but discard didn't grow = defender took the cards
      playSound('cardTake', 0.7);
    }

    prevBattleFieldLen.current = gs.battleField.length;
    prevDiscardCount.current = gs.discardCount;
  }, [gs.battleField.length, gs.discardCount, playSound]);

  // Sound effects for game actions — priority-based: only ONE sound per state update
  // Priority order: transfer/passThrough > multiCard > trumpPlay > cardPlay
  useEffect(() => {
    if (isFirstRender.current) return;

    const prevBF = prevBattleFieldForSound.current;
    const currBF = gs.battleField;

    // Detect transfer: defender changed while battlefield has cards
    const isTransfer = gs.currentDefenderIdx !== prevDefenderIdx.current && currBF.length > 0;
    // Detect pass-through shown
    const isPassThrough = gs.revealedPassThroughs.length > prevRevealedPassThroughs.current.length;

    if (isTransfer || isPassThrough) {
      // Transfer/pass-through has highest priority — play only this sound
      playSound('transfer', 0.7);
    } else {
      // Count total cards on battlefield (attack + defense)
      const prevTotalCards = prevBF.reduce((sum, p) => sum + 1 + (p.defense ? 1 : 0), 0);
      const currTotalCards = currBF.reduce((sum, p) => sum + 1 + (p.defense ? 1 : 0), 0);
      const newCardsCount = currTotalCards - prevTotalCards;

      if (newCardsCount > 0) {
        if (newCardsCount > 1) {
          // Multiple cards played at once
          playSound('multiCard', 0.6);
        } else {
          // Single card — check if trump
          const trumpSuit = gs.trumpInfo.currentTrump;
          let hasTrump = false;

          // Check new attack cards
          if (currBF.length > prevBF.length) {
            for (let i = prevBF.length; i < currBF.length; i++) {
              const card = currBF[i].attack;
              if (card.suit === trumpSuit) hasTrump = true;
            }
          }
          // Check new defense cards
          for (let i = 0; i < Math.min(prevBF.length, currBF.length); i++) {
            if (!prevBF[i].defense && currBF[i].defense) {
              const card = currBF[i].defense!;
              if (card.suit === trumpSuit) hasTrump = true;
            }
          }

          if (hasTrump) {
            playSound('trumpPlay', 0.6);
          } else {
            playSound('cardPlay', 0.6);
          }
        }
      }
    }

    // Update refs
    prevBattleFieldForSound.current = currBF;
    prevDefenderTaking.current = gs.defenderTaking;
    prevRevealedPassThroughs.current = gs.revealedPassThroughs;
    prevDefenderIdx.current = gs.currentDefenderIdx;
  }, [gs.battleField, gs.defenderTaking, gs.revealedPassThroughs, gs.trumpInfo.currentTrump, gs.currentDefenderIdx, playSound]);

  // cardTake sound is now handled in the bito useEffect above (merged to avoid ref race condition)

  // Sound for direction change (10 was played)
  useEffect(() => {
    if (isFirstRender.current) return;
    if (gs.direction !== prevDirection.current) {
      // Direction reversed — a 10 was played (handled by transfer sound or card play sound already)
    }
    prevDirection.current = gs.direction;
  }, [gs.direction]);

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
    // "ВАШ ХОД" overlay only shows when player has meaningful actions.
    // endAttack alone (without playCard/takeCards/transferCard/showPassThrough) means the player
    // is a non-neighbor with sixes in hand — they can press бито but it's NOT "their turn".
    const isMyTurn = availableActions.some(a =>
      a.type === 'playCard' || a.type === 'takeCards' || a.type === 'transferCard' || a.type === 'showPassThrough'
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

  // Urgent turn alert when timer reaches 15 seconds
  useEffect(() => {
    // Base check: player has meaningful actions
    const hasMeaningfulAction = availableActions.length > 0 && availableActions.some(a =>
      a.type === 'playCard' || a.type === 'takeCards' || a.type === 'transferCard' || a.type === 'showPassThrough'
    );
    // Exclude case: I'm the attacker, already put cards on table, and defender hasn't taken yet.
    // In this state I have playCard/endAttack available but it's NOT "my turn" — I'm waiting for defender.
    const attackerWaitingForDefense = isAttacker && gs.battleField.length > 0 && gs.turnPhase === 'defend' && !gs.defenderTaking;
    const isMyTurn = hasMeaningfulAction && !attackerWaitingForDefense;

    if (isMyTurn && turnTimer !== undefined && turnTimer <= 15 && turnTimer > 0 && turnTimer < 99 && urgentAlertShownForTrick.current !== gs.trickCount) {
      urgentAlertShownForTrick.current = gs.trickCount;
      urgentTurnTimers.current.forEach(t => clearTimeout(t));
      urgentTurnTimers.current = [];

      // Play alert sound (only if sound is enabled)
      playSound('yourTurn', 0.8);

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

  // Clear pendingCardId whenever server sends new availableActions (gameStateUpdate or yourTurn)
  // This unblocks the UI after a card was sent to the server
  useEffect(() => {
    setPendingCardId(null);
  }, [availableActions]);

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
  const canEndAttack = availableActions.some(a => a.type === 'endAttack') && !isSixOnlySpectator;
  const canSkip = availableActions.some(a => a.type === 'skipTurn');
  const canTransfer = transferIds.size > 0;
  const canPassThrough = passThroughIds.size > 0;
  const isMultiSelecting = multiSelectIds.size > 0;
  const canBeat = playableIds.size > 0;
  const selectedCanBeat = canBeat && selectedCardId && playableIds.has(selectedCardId);
  const selectedCanTransfer = canTransfer && selectedCardId && transferIds.has(selectedCardId);
  const selectedCanPassThrough = canPassThrough && selectedCardId && passThroughIds.has(selectedCardId);
  const hasAnyAction = canTake || canEndAttack || canSkip || isMultiSelecting || selectedCanTransfer || selectedCanPassThrough || selectedCanBeat;

  const sortedHand = sortHand(gs.myHand, sortMode);

  // Compute tutorial-highlighted card IDs from scenario.highlightCards
  const tutorialHighlightIds = useMemo(() => {
    if (!isTutorial || !currentTutorialScenario?.highlightCards || currentTutorialScenario.highlightCards.length === 0) {
      return new Set<string>();
    }
    // Build a frequency map of requested highlight cards (e.g. ['6h','6h','Jc','Jc'])
    const requestedCounts = new Map<string, number>();
    for (const notation of currentTutorialScenario.highlightCards) {
      requestedCounts.set(notation, (requestedCounts.get(notation) || 0) + 1);
    }
    // Match against actual hand cards by rank+suit notation
    const matchedCounts = new Map<string, number>();
    const ids = new Set<string>();
    for (const card of gs.myHand) {
      const suitChar = card.suit === 'spades' ? 's' : card.suit === 'hearts' ? 'h' : card.suit === 'diamonds' ? 'd' : card.suit === 'clubs' ? 'c' : '';
      const notation = card.rank === '777' ? '777' : `${card.rank}${suitChar}`;
      const needed = requestedCounts.get(notation) || 0;
      const matched = matchedCounts.get(notation) || 0;
      if (matched < needed) {
        ids.add(card.id);
        matchedCounts.set(notation, matched + 1);
      }
    }
    return ids;
  }, [isTutorial, currentTutorialScenario?.highlightCards, gs.myHand]);

  // Compute tutorial GREEN highlighted card IDs (raised + green glow)
  const tutorialGreenIds = useMemo(() => {
    if (!isTutorial || !currentTutorialScenario?.highlightCardsGreen || currentTutorialScenario.highlightCardsGreen.length === 0) {
      return new Set<string>();
    }
    const requestedCounts = new Map<string, number>();
    for (const notation of currentTutorialScenario.highlightCardsGreen) {
      requestedCounts.set(notation, (requestedCounts.get(notation) || 0) + 1);
    }
    const matchedCounts = new Map<string, number>();
    const ids = new Set<string>();
    for (const card of gs.myHand) {
      const suitChar = card.suit === 'spades' ? 's' : card.suit === 'hearts' ? 'h' : card.suit === 'diamonds' ? 'd' : card.suit === 'clubs' ? 'c' : '';
      const notation = card.rank === '777' ? '777' : `${card.rank}${suitChar}`;
      const needed = requestedCounts.get(notation) || 0;
      const matched = matchedCounts.get(notation) || 0;
      if (matched < needed) {
        ids.add(card.id);
        matchedCounts.set(notation, matched + 1);
      }
    }
    return ids;
  }, [isTutorial, currentTutorialScenario?.highlightCardsGreen, gs.myHand]);

  // Compute tutorial RED highlighted card IDs (no raise, red glow)
  const tutorialRedIds = useMemo(() => {
    if (!isTutorial || !currentTutorialScenario?.highlightCardsRed || currentTutorialScenario.highlightCardsRed.length === 0) {
      return new Set<string>();
    }
    const requestedCounts = new Map<string, number>();
    for (const notation of currentTutorialScenario.highlightCardsRed) {
      requestedCounts.set(notation, (requestedCounts.get(notation) || 0) + 1);
    }
    const matchedCounts = new Map<string, number>();
    const ids = new Set<string>();
    for (const card of gs.myHand) {
      const suitChar = card.suit === 'spades' ? 's' : card.suit === 'hearts' ? 'h' : card.suit === 'diamonds' ? 'd' : card.suit === 'clubs' ? 'c' : '';
      const notation = card.rank === '777' ? '777' : `${card.rank}${suitChar}`;
      const needed = requestedCounts.get(notation) || 0;
      const matched = matchedCounts.get(notation) || 0;
      if (matched < needed) {
        ids.add(card.id);
        matchedCounts.set(notation, matched + 1);
      }
    }
    return ids;
  }, [isTutorial, currentTutorialScenario?.highlightCardsRed, gs.myHand]);

  // Compute highlighted card IDs:
  // 1. Cards of the same rank as selected multi-attack/transfer cards (existing logic)
  // 2. Six-highlight: when leadCardRank === '6', highlight all 6s in hand so player
  //    knows they can/should throw them (even if they are a non-neighbor)
  const highlightedIds = useMemo(() => {
    const ids = new Set<string>();

    // Six-highlight: leadCardRank === '6' → highlight all 6s in hand
    // Only applies when there are cards on the battlefield (active trick)
    if (gs.leadCardRank === '6' && gs.battleField.length > 0) {
      for (const c of gs.myHand) {
        if (c.rank === '6') ids.add(c.id);
      }
    }

    // Multi-select highlight (existing): same rank as already-selected cards
    if (multiSelectIds.size > 0) {
      const selectedCards = gs.myHand.filter(c => multiSelectIds.has(c.id));
      if (selectedCards.length > 0) {
        const rank = selectedCards[0].rank;
        const validPool = multiSelectMode === 'transfer' ? transferIds : multiSelectMode === 'passthrough' ? passThroughIds : playableIds;
        for (const c of gs.myHand) {
          if (c.rank === rank && !multiSelectIds.has(c.id) && validPool.has(c.id)) {
            ids.add(c.id);
          }
        }
      }
    }

    return ids;
  }, [multiSelectIds, multiSelectMode, gs.myHand, gs.leadCardRank, gs.battleField.length, playableIds, transferIds, passThroughIds]);

  // Clear multi-select when trick changes
  useEffect(() => {
    setMultiSelectIds(new Set());
    setMultiSelectMode(null);
  }, [gs.trickCount]);

  // Clear multi-select when battlefield gets cards (someone played)
  const prevBattleLen = useRef(gs.battleField.length);
  useEffect(() => {
    if (gs.battleField.length !== prevBattleLen.current) {
      // Only clear if battlefield grew (cards were played by someone)
      if (gs.battleField.length > prevBattleLen.current) {
        setMultiSelectIds(new Set());
        setMultiSelectMode(null);
      }
      prevBattleLen.current = gs.battleField.length;
    }
  }, [gs.battleField.length]);

  // Play all multi-selected cards sequentially
  const handleMultiAttack = useCallback(() => {
    const ids = Array.from(multiSelectIds);
    for (const id of ids) {
      onPlayCard(id);
    }
    setMultiSelectIds(new Set());
    setMultiSelectMode(null);
    setSelectedCardId(null);
  }, [multiSelectIds, onPlayCard]);

  // Transfer all multi-selected cards at once
  const handleMultiTransfer = useCallback(() => {
    const ids = Array.from(multiSelectIds);
    if (onTransferCards && ids.length > 1) {
      onTransferCards(ids);
    } else {
      // Fallback: single card transfer
      for (const id of ids) {
        onTransferCard(id);
      }
    }
    setMultiSelectIds(new Set());
    setMultiSelectMode(null);
    setSelectedCardId(null);
  }, [multiSelectIds, onTransferCard, onTransferCards]);

  // Pass-through all multi-selected cards at once
  const handleMultiPassThrough = useCallback(() => {
    const ids = Array.from(multiSelectIds);
    if (onShowPassThroughs && ids.length > 1) {
      onShowPassThroughs(ids);
    } else {
      // Fallback: single card pass-through
      if (ids.length > 0) {
        onShowPassThrough(ids[0]);
      }
    }
    setMultiSelectIds(new Set());
    setMultiSelectMode(null);
    setSelectedCardId(null);
  }, [multiSelectIds, onShowPassThrough, onShowPassThroughs]);

  const handleCardClick = (card: Card) => {
    // If in multi-select mode, handle toggling cards of the same rank
    if (isMultiSelecting) {
      const selectedCards = gs.myHand.filter(c => multiSelectIds.has(c.id));
      const multiRank = selectedCards.length > 0 ? selectedCards[0].rank : null;
      const validPool = multiSelectMode === 'transfer' ? transferIds : multiSelectMode === 'passthrough' ? passThroughIds : playableIds;
      if (card.rank === multiRank && validPool.has(card.id)) {
        const newSet = new Set(multiSelectIds);
        if (newSet.has(card.id)) {
          newSet.delete(card.id);
        } else {
          newSet.add(card.id);
        }
        setMultiSelectIds(newSet);
        return;
      }
      // Clicking a different rank card cancels multi-select
      setMultiSelectIds(new Set());
      setMultiSelectMode(null);
      // Fall through to normal handling
    }

    if (isDefender && gs.turnPhase === 'defend' && !gs.defenderTaking) {
      // Check how many action types this card supports
      const canBeatThis = playableIds.has(card.id);
      const canTransferThis = transferIds.has(card.id);
      const canPassThroughThis = passThroughIds.has(card.id);
      const actionCount = (canBeatThis ? 1 : 0) + (canTransferThis ? 1 : 0) + (canPassThroughThis ? 1 : 0);

      // If card has multiple possible actions (beat + transfer, beat + passthrough, etc.),
      // always select it to show all action buttons
      if (actionCount >= 2) {
        if (selectedCardId === card.id) {
          setSelectedCardId(null);
        } else {
          setSelectedCardId(card.id);
        }
        return;
      }

      // Single-action cards: handle normally
      if (canTransferThis) {
        const sameRankTransfer = gs.myHand.filter(
          c => c.rank === card.rank && transferIds.has(c.id) && c.id !== card.id
        );
        if (sameRankTransfer.length > 0) {
          // Enter multi-select mode for transfer
          setMultiSelectIds(new Set([card.id]));
          setMultiSelectMode('transfer');
          setSelectedCardId(null);
          return;
        }
        // Single transfer card — use old select behavior
        if (selectedCardId === card.id) {
          setSelectedCardId(null);
        } else {
          setSelectedCardId(card.id);
        }
        return;
      }
      if (canPassThroughThis) {
        // Check if there are more pass-through cards of the same rank
        const sameRankPassThrough = gs.myHand.filter(
          c => c.rank === card.rank && passThroughIds.has(c.id) && c.id !== card.id
        );
        if (sameRankPassThrough.length > 0) {
          // Enter multi-select mode for pass-through
          setMultiSelectIds(new Set([card.id]));
          setMultiSelectMode('passthrough');
          setSelectedCardId(null);
          return;
        }
        // Single pass-through card — use old select behavior
        if (selectedCardId === card.id) {
          setSelectedCardId(null);
        } else {
          setSelectedCardId(card.id);
        }
        return;
      }
      if (canBeatThis) {
        const undefended = gs.battleField
          .map((p, i) => ({ pair: p, idx: i }))
          .filter(x => !x.pair.defense);
        if (undefended.length === 1) {
          if (pendingCardId === card.id) return; // Prevent double-tap
          setPendingCardId(card.id);
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
            if (pendingCardId === card.id) return; // Prevent double-tap
            setPendingCardId(card.id);
            onPlayCard(card.id);
          }
        }
        return;
      }
    }

    // Attacker opening attack: check for same-rank cards for multi-select
    if (playableIds.has(card.id) && !isDefender && gs.battleField.length === 0) {
      // Check if there are other playable cards of the same rank
      const sameRankPlayable = gs.myHand.filter(
        c => c.rank === card.rank && playableIds.has(c.id) && c.id !== card.id
      );
      if (sameRankPlayable.length > 0) {
        // Enter multi-select mode with this card pre-selected
        setMultiSelectIds(new Set([card.id]));
        setMultiSelectMode('attack');
        setSelectedCardId(null);
        return;
      }
    }

    if (playableIds.has(card.id)) {
      if (pendingCardId === card.id) return; // Prevent double-tap
      setPendingCardId(card.id);
      onPlayCard(card.id);
      setSelectedCardId(null);
    } else if (transferIds.has(card.id)) {
      if (pendingCardId === card.id) return; // Prevent double-tap
      setPendingCardId(card.id);
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

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [profilePopupGameId, setProfilePopupGameId] = useState<number | null>(null);

  // Sort opponents in turn order starting from the player after myIdx (in direction of play).
  // This ensures the display order matches the actual turn sequence.
  const opponents = (() => {
    const n = gs.players.length;
    const dir = gs.direction;
    const result: typeof gs.players = [];
    let idx = myIdx;
    for (let step = 0; step < n - 1; step++) {
      idx = dir === 'cw' ? (idx + 1) % n : (idx - 1 + n) % n;
      result.push(gs.players[idx]);
    }
    return result;
  })();

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
            {didLeave ? t('game.youLeftGame') : isLoser ? t('game.youLostExcl') : isWinner ? t('game.youWonPlace', { n: String(myPlayer.winPlace) }) : t('game.gameOverExcl')}
          </h2>

          {((gs.prizePool && gs.prizePool > 0) || (prizeData && prizeData.pool > 0)) && (
            <div className="bg-amber-900/20 border border-amber-600/30 rounded-xl p-3 sm:p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/shanyrak_96e91a49.png" alt="" className="w-5 h-5" />
                <span className="text-amber-300 font-bold text-sm sm:text-base">{t('game.bank')}: {formatBalance(gs.prizePool || prizeData?.pool || 0)}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-amber-400 font-semibold text-base sm:text-lg">{t('game.resultsTitle')}</h3>
            {gs.players.map(p => {
              const prize = gs.playerPrizes?.find(pr => pr.playerId === p.id) || prizeData?.prizes.find(pr => pr.playerId === p.id);
              return (
                <div key={p.id} className={`flex items-center justify-between px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base ${
                  p.leftGame && p.id === gs.loserId ? 'bg-red-900/30 border border-red-700/30' :
                  p.leftGame ? 'bg-gray-800/40 border border-gray-600/30' :
                  p.id === gs.loserId ? 'bg-red-900/30 border border-red-700/30' :
                  p.winPlace ? 'bg-green-900/20 border border-green-700/20' : 'bg-[#0f2035]/50'
                }`}>
                  <span className="text-amber-100 flex items-center gap-1.5 sm:gap-2 truncate">
                    {p.leftGame && p.id === gs.loserId && <Frown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 shrink-0" />}
                    {p.leftGame && p.id !== gs.loserId && <DoorOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 shrink-0" />}
                    {!p.leftGame && p.winPlace && <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />}
                    {!p.leftGame && p.id === gs.loserId && <Frown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 shrink-0" />}
                    <span className="truncate">{p.name}</span>
                  </span>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {prize && prize.amount > 0 && (
                      <span className="flex items-center gap-0.5 text-xs sm:text-sm text-amber-300">
                        +{formatBalance(prize.amount)}
                        <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/shanyrak_96e91a49.png" alt="" className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <span className={`text-xs sm:text-sm ${p.leftGame && p.id === gs.loserId ? 'text-red-400' : p.leftGame ? 'text-gray-400' : p.id === gs.loserId ? 'text-red-400' : 'text-green-400'}`}>
                      {p.leftGame && p.id === gs.loserId
                        ? t('game.leftFool')
                        : p.leftGame
                        ? t('game.left')
                        : p.id === gs.loserId
                        ? t('game.fool')
                        : p.winPlace
                        ? t('game.placeN', { n: String(p.winPlace) })
                        : ''}
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
              {t('game.backToLobbyBtn')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      data-tutorial="game-table"
      className="min-h-[100dvh] bg-cover bg-center bg-no-repeat relative flex flex-col"
      style={{ backgroundImage: `url(${TABLE_STYLES[gs.tableStyle ?? 'classic']?.url ?? GAME_TABLE_URL})` }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Galaxy table animated stars overlay */}
      {gs.tableStyle === 'galaxy' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <GalaxyTableOverlay enabled={gameSettings.animationsEnabled} />
        </div>
      )}

      {/* Bito animation */}
      {showBitoAnim && gameSettings.animationsEnabled && (
        <BitoAnimation
          cardCount={bitoCardCount}
          deckStyle={gs.deckStyle}
          onComplete={() => setShowBitoAnim(false)}
        />
      )}

      {/* Leave game confirmation dialog */}
      {showLeaveConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a2d45] border border-red-700/40 rounded-2xl p-4 sm:p-6 max-w-sm w-full mx-4 text-center space-y-3 sm:space-y-4">
            <DoorOpen className="w-10 h-10 sm:w-12 sm:h-12 text-red-400 mx-auto" />
            <h3 className="text-lg sm:text-xl font-bold text-amber-100">{t('game.leaveGameTitle')}</h3>
            <div className="space-y-2">
              <p className="text-amber-200/80 text-xs sm:text-sm">
                {t('game.leaveGameWarning')}
              </p>
              {gs.prizePool > 0 && (
                <div className="flex items-center justify-center gap-1.5 bg-red-900/30 border border-red-700/30 rounded-lg px-3 py-2">
                  <span className="text-red-300 text-xs sm:text-sm font-medium">
                    {t('game.leaveGameDeduction', { amount: formatBalance(Math.floor(gs.prizePool / gs.players.length)) })}
                  </span>
                  <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/shanyrak_96e91a49.png" alt="" className="w-4 h-4" />
                </div>
              )}
              <div className="flex items-center justify-center gap-1.5 bg-red-900/30 border border-red-700/30 rounded-lg px-3 py-2">
                <span className="text-red-300 text-xs sm:text-sm font-medium">
                  {t('game.leaveRatingPenalty')}
                </span>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <Button
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm"
                onClick={() => setShowLeaveConfirm(false)}
              >
                {t('game.stayBtn')}
              </Button>
              <Button
                className="flex-1 bg-red-700 hover:bg-red-600 text-white text-sm"
                onClick={() => {
                  setShowLeaveConfirm(false);
                  onLeaveGame?.();
                }}
              >
                <LogOut className="w-4 h-4 mr-1" />
                {t('game.leaveBtn')}
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
              {t('game.gamePaused')}
            </h3>
            <p className="text-amber-200/80 text-sm sm:text-base">
              <span className="font-semibold text-amber-300">{frozenInfo.disconnectedPlayerName}</span>{' '}
              {t('game.playerReconnecting')}
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
              {t('game.autoKickWarning')}
            </p>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col h-[100dvh]">
        {/* Top HUD — compact panel */}
        <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 bg-black/60 backdrop-blur-sm border-b border-amber-700/20 overflow-hidden">
          <div className="flex items-center gap-2 sm:gap-3">
            <Badge data-tutorial="deck-info" variant="outline" className="sm:hidden border-amber-700/30 text-white text-sm px-2 py-1">
              <span data-tutorial="mobile-decks">{locale === 'en' ? 'D1' : 'К1'}:<span className={`font-bold ${gs.deck1Count < 5 ? 'text-red-400' : ''}`}>{gs.deck1Count}</span>
              <span className="text-amber-300 mx-1">|</span>
              {locale === 'en' ? 'D2' : 'К2'}:<span className={`font-bold ${gs.deck2Count < 5 ? 'text-red-400' : ''}`}>{gs.deck2Count}</span></span>
              <span className="text-amber-300 mx-1">|</span>
              <span data-tutorial="mobile-bito">{t('game.bitoCount')}<span className="font-bold">{gs.discardCount}</span></span>
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Badge variant="outline" className="border-amber-700/30 text-amber-200/70 text-sm px-2 sm:px-3 py-1">
              {gs.direction === 'cw' ? <ArrowRight className="w-[18px] h-[18px] sm:w-5 sm:h-5" /> : <ArrowLeft className="w-[18px] h-[18px] sm:w-5 sm:h-5" />}
            </Badge>
            <Badge data-tutorial="timer" className={`sm:hidden text-sm px-2 py-1 ${turnTimer <= 5 ? 'bg-red-900/60 text-red-300 border-red-700/40 animate-pulse' : 'bg-amber-900/60 text-amber-300 border-amber-700/40'}`}>
              <Timer className="w-4 h-4 mr-0.5" />
              {turnTimer >= 99 ? '--' : `${turnTimer}с`}
            </Badge>
            {/* Settings button */}
            <GameSettingsSheet onLeaveGame={() => onLeaveGame?.()} roomPenalty={roomPenalty} isTutorial={isTutorial}>
              <button className={`transition-colors p-1 sm:p-1.5 rounded relative ${isTutorial ? 'text-amber-300 hover:text-amber-200' : 'text-amber-200/50 hover:text-amber-100'}`}>
                {isTutorial && (
                  <>
                    <span className="absolute inset-0 rounded animate-ping bg-amber-400/40 pointer-events-none" />
                    <span className="absolute inset-0 rounded ring-2 ring-amber-400/70 pointer-events-none" />
                  </>
                )}
                <Settings className="w-[18px] h-[18px] sm:w-6 sm:h-6 relative z-10" />
              </button>
            </GameSettingsSheet>

            {gs.players[myIdx]?.isOut && gs.players[myIdx]?.winPlace && onReturnToLobby && (
              <button
                className="text-green-400 hover:text-green-300 transition-colors p-1 sm:p-1.5 rounded"
                onClick={onReturnToLobby}
                title={t('game.exitToLobby')}
              >
                <Home className="w-[18px] h-[18px] sm:w-6 sm:h-6" />
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
                  <div key={p.id} data-tutorial="opponent-info" className={`flex flex-col items-center ${manyOpponents ? 'px-1 py-0.5' : 'px-1.5 py-1'} sm:px-3 sm:py-2 rounded-lg sm:rounded-xl border transition-all shrink-0 ${
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
                       <FrameWrapper frameId={p.equippedFrame} size={manyOpponents ? 32 : 40}>
                         <AvatarDisplay
                           avatarId={p.avatarId}
                           size={manyOpponents ? 32 : 40}
                           alt={p.name}
                           className={`${manyOpponents ? 'w-8 h-8' : 'w-10 h-10'} sm:w-14 sm:h-14 rounded-full border-2 ${p.isBot ? 'border-gray-500/40 opacity-70' : 'border-amber-600/50 cursor-pointer hover:border-amber-400 hover:scale-110 transition-all'}`}
                         />
                      </FrameWrapper>
                    </button>
                    <div className={`flex items-center gap-0.5 sm:gap-1 ${manyOpponents ? 'mb-0' : 'mb-0.5'} sm:mb-1`}>
                      {isOppAttacker && <Swords className={`${manyOpponents ? 'w-2 h-2' : 'w-2.5 h-2.5'} sm:w-3 sm:h-3 text-red-400`} />}
                      {isOppDefender && !gs.defenderTaking && <Shield className={`${manyOpponents ? 'w-2 h-2' : 'w-2.5 h-2.5'} sm:w-3 sm:h-3 text-blue-400`} />}
                      {isOppDefender && gs.defenderTaking && <HandMetal className={`${manyOpponents ? 'w-2 h-2' : 'w-2.5 h-2.5'} sm:w-3 sm:h-3 text-orange-400`} />}
                      {p.isOut && p.winPlace && <Crown className={`${manyOpponents ? 'w-2 h-2' : 'w-2.5 h-2.5'} sm:w-3 sm:h-3 text-amber-400`} />}
                      {!p.isBot && <DiamondRankIcon seasonRating={p.seasonRating ?? 0} size={manyOpponents ? 9 : 11} />}
                      <span className={`${manyOpponents ? 'text-[9px] max-w-10' : 'text-[10px] max-w-14'} sm:text-xs text-amber-100 font-medium truncate sm:max-w-20`}>{p.name}</span>
                    </div>
                    {isOppDefender && gs.defenderTaking && (
                      <span className={`${manyOpponents ? 'text-[7px]' : 'text-[8px]'} sm:text-[10px] text-orange-400 mb-0.5`}>{t('game.taking')}</span>
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
                        <span className={`${manyOpponents ? 'text-[7px]' : 'text-[8px]'} sm:text-xs text-gray-400 font-semibold`}>{t('game.playerGone')}</span>
                      </div>
                    ) : p.isOut ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <div className={`flex items-center gap-0.5 bg-green-900/40 border border-green-600/30 rounded ${manyOpponents ? 'px-1 py-0.5' : 'px-1.5 py-0.5'} sm:px-2 sm:py-1`}>
                          <Trophy className={`${manyOpponents ? 'w-2 h-2' : 'w-2.5 h-2.5'} sm:w-3.5 sm:h-3.5 text-amber-400`} />
                          <span className={`${manyOpponents ? 'text-[7px]' : 'text-[8px]'} sm:text-xs text-green-300 font-semibold`}>{p.winPlace}м</span>
                        </div>
                        {(() => {
                          const oppPrize = gs.playerPrizes?.find(pr => pr.playerId === p.id);
                          return oppPrize && oppPrize.amount > 0 ? (
                            <div className={`flex items-center gap-0.5 ${manyOpponents ? 'text-[7px]' : 'text-[8px]'} sm:text-[10px] text-amber-300 font-medium`}>
                              <span>+{formatBalance(oppPrize.amount)}</span>
                              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/shanyrak_96e91a49.png" alt="" className="w-3 h-3" />
                            </div>
                          ) : null;
                        })()}
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
        {showYourTurn && !isSixOnlySpectator && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className={`text-4xl sm:text-8xl md:text-[10rem] font-black text-amber-400 drop-shadow-[0_0_40px_rgba(245,158,11,0.6)] tracking-wider text-center whitespace-nowrap px-4 ${yourTurnPhase === 'enter' ? 'your-turn-enter' : yourTurnPhase === 'exit' ? 'your-turn-exit' : ''}`}>
              {t('game.yourTurnCaps')}
            </div>
          </div>
        )}



        {/* URGENT TURN ALERT at 15 seconds */}
        {showUrgentTurn && !isSixOnlySpectator && (
          <div className="fixed inset-0 z-[55] flex items-center justify-center pointer-events-none">
            <div className={`text-4xl sm:text-7xl md:text-9xl font-black text-red-500 drop-shadow-[0_0_40px_rgba(239,68,68,0.8)] tracking-wider text-center whitespace-nowrap px-4 ${urgentTurnPhase === 'enter' ? 'urgent-turn-enter' : urgentTurnPhase === 'exit' ? 'urgent-turn-exit' : ''}`}>
              <span className="urgent-blink">{t('game.yourTurnCaps')}</span>
            </div>
          </div>
        )}

        {/* TRUMP CHANGE overlay */}
        {showTrumpChange && trumpChangeInfo && (() => {
          const SUIT_NAMES: Record<string, string> = { spades: t('game.suitSpades'), hearts: t('game.suitHearts'), diamonds: t('game.suitDiamonds'), clubs: t('game.suitClubs') };
          const sym = SUIT_SYMBOLS[trumpChangeInfo.suit] || trumpChangeInfo.suit;
          const suitName = SUIT_NAMES[trumpChangeInfo.suit] || trumpChangeInfo.suit;
          const color = trumpChangeInfo.suit === 'hearts' || trumpChangeInfo.suit === 'diamonds' ? 'text-red-500' : 'text-gray-100';
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
              <div className={`flex flex-col items-center gap-1.5 sm:gap-2 bg-black/70 backdrop-blur-md rounded-2xl px-5 sm:px-8 py-4 sm:py-6 border-2 border-amber-500/60 ${trumpChangePhase === 'enter' ? 'trump-change-enter' : trumpChangePhase === 'exit' ? 'trump-change-exit' : ''}`}>
                <span className="text-amber-300 text-sm sm:text-lg font-semibold tracking-wider uppercase">{t('game.trumpChanged')}</span>
                <span className={`${color} text-6xl sm:text-8xl md:text-9xl leading-none drop-shadow-[0_0_20px_rgba(217,119,6,0.5)]`}>{sym}</span>
                <span className="text-amber-100 text-xl sm:text-2xl font-bold">{suitName}</span>
                <span className="text-amber-200/60 text-xs sm:text-sm">{t('game.phaseOf', { n: String(trumpChangeInfo.phase) })}</span>
              </div>
            </div>
          );
        })()}

        {/* Main game area */}
        <div className="flex-1 flex relative overflow-hidden">
          {/* LEFT PANEL — Timer + Discard pile — DESKTOP ONLY */}
          <div className="hidden sm:flex flex-col justify-start items-center w-36 md:w-44 py-4 px-2 gap-4">
            <div data-tutorial="timer-desktop" className={`flex flex-col items-center gap-1 rounded-xl px-4 py-3 border-2 transition-all ${
              turnTimer <= 5
                ? 'bg-red-900/60 border-red-500/50 animate-pulse'
                : 'bg-black/50 border-amber-700/30'
            }`}>
              <Timer className={`w-6 h-6 ${turnTimer <= 5 ? 'text-red-400' : 'text-amber-400'}`} />
              <span className={`text-4xl md:text-5xl font-black tabular-nums leading-none ${
                turnTimer <= 5 ? 'text-red-300' : 'text-amber-300'
              }`}>
                {turnTimer >= 99 ? '--' : turnTimer}
              </span>
              <span className={`text-xs font-medium ${turnTimer <= 5 ? 'text-red-400/70' : 'text-amber-200/50'}`}>{turnTimer >= 99 ? '' : t('game.sec')}</span>
            </div>

            {gs.discardCount > 0 && (
              <div data-tutorial="bito-counter"><DiscardPile count={gs.discardCount} deckStyle={gs.deckStyle} bitoLabel={t('game.bito')} /></div>
            )}
          </div>

          {/* CENTER — Battlefield (drop zone) */}
          <div className={`flex-1 flex justify-center px-2 sm:px-4 ${
            // Mobile: allow scroll when ≥15 pairs; Desktop: allow scroll when >36 pairs
            (gs.battleField.length >= 15 || gs.battleField.length > 36)
              ? 'overflow-y-auto overflow-x-hidden items-start pt-2'
              : 'overflow-hidden items-center'
          }`}>
            <div
              id="battlefield-drop-zone"
              className={`flex flex-col items-center gap-1 sm:gap-2 relative rounded-xl p-2 sm:p-4 transition-all w-full ${
                dropZoneHighlight ? 'drop-zone-active' : ''
              }`}
            >
              {/* Defender taking banner */}
              {gs.defenderTaking && (
                <div className="bg-orange-900/60 border border-orange-600/40 rounded-lg px-2 sm:px-4 py-1 sm:py-1.5 mb-1 sm:mb-2">
                  <span className="text-orange-300 text-[10px] sm:text-sm font-medium">
{isDefender ? `🫳 ${t('game.youTake')}` :
                     isAttacker ? `🔥 ${t('game.defenderTakesAdd')}` :
                      gs.attackerHasPriority ? `⏳ ${t('game.roleWaiting')}` :
                      `🔥 ${t('game.defenderTakesAdd')}`}
                  </span>
                </div>
              )}

              {/* Revealed pass-through cards banner */}
              {gs.revealedPassThroughs && gs.revealedPassThroughs.find(r => r.playerId === gs.players[myIdx]?.id) && (
                <div className="bg-yellow-900/50 border border-yellow-600/40 rounded-lg px-2 sm:px-4 py-1 sm:py-1.5 mb-1 sm:mb-2">
                  <span className="text-yellow-300 text-[10px] sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                    {t('game.passThrough')} ({gs.revealedPassThroughs.find(r => r.playerId === gs.players[myIdx]?.id)!.cards.length})
                  </span>
                </div>
              )}

              {/* Mobile: wrap + vertical scroll (only when ≥15 cards); Desktop: wrap + vertical scroll (only when >30 cards) */}
              <div
                data-tutorial="table-area"
                className={[
                  'battlefield-scroll',
                  gs.battleField.length > 4 ? 'gap-1 sm:gap-3' : gs.battleField.length > 2 ? 'gap-1.5 sm:gap-3' : 'gap-2 sm:gap-4',
                  'flex flex-wrap justify-center w-full',
                  // Mobile: enable scroll only when ≥15 pairs
                  gs.battleField.length >= 15 ? 'mobile-needs-scroll' : '',
                  // Desktop: enable vertical scroll only when >36 pairs
                  gs.battleField.length > 36 ? 'desktop-needs-scroll' : '',
                ].filter(Boolean).join(' ')}
              >
                {gs.battleField.map((pair: BattlePair, i: number) => (
                  <div
                    key={i}
                    className={`relative flex-shrink-0 ${
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
          <div data-tutorial="deck-area" className="hidden sm:flex flex-col justify-center items-center w-44 md:w-52 py-4 px-2 gap-3">
            {bothDecksEmpty ? (
              <TrumpIcon suit={gs.trumpInfo.currentTrump} size="large" label={t('game.trumpSuit')} />
            ) : (
              <div className="flex flex-col gap-3 items-center">
                {deck1Empty ? (
                  <>
                    <TrumpIcon suit={gs.trumpInfo.currentTrump} size="normal" label={t('game.trumpSuit')} />
                    {/* Revealed hidden trump card — shown face-up when phase 2 starts (deck1 emptied) */}
                    {gs.trumpInfo.hiddenTrumpCard1 && gs.trumpInfo.hiddenTrumpCard1.suit && (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-green-300/80 text-[9px] sm:text-xs font-medium animate-pulse">{t('game.hiddenTrump')}</span>
                        <div className="rounded-lg overflow-hidden border-2 border-green-500/60 shadow-lg shadow-green-500/20" style={{ width: '88px', height: '128px' }}>
                          {(() => {
                            const hc = gs.trumpInfo.hiddenTrumpCard1!;
                            const isCustom = gs.deckStyle === 'custom';
                            const imgKey = isCustom ? getCustomCardImageKey(hc.rank, hc.suit) : getCardImageKey(hc.rank, hc.suit);
                            const imgMap = isCustom ? CARD_IMAGES_CUSTOM : CARD_IMAGES;
                            const imgUrl = imgKey ? imgMap[imgKey] : null;
                            if (imgUrl) {
                              return <div className="w-full h-full bg-white"><img src={imgUrl} alt={`${hc.rank} ${hc.suit}`} className="w-full h-full object-cover" /></div>;
                            }
                            const hSuit = hc.suit || '';
                            const hSymbol = SUIT_SYMBOLS[hSuit] || hSuit;
                            const hIsRed = hSuit === 'hearts' || hSuit === 'diamonds';
                            const hColor = hIsRed ? '#c41e3a' : '#1a1a2e';
                            return (
                              <div className="w-full h-full bg-white flex flex-col items-center justify-between p-1.5">
                                <div className="self-start leading-none" style={{ color: hColor }}>
                                  <div className="text-xs font-bold">{hc.rank}</div>
                                  <div className="text-xs -mt-0.5">{hSymbol}</div>
                                </div>
                                <div className="text-2xl" style={{ color: hColor }}>{hSymbol}</div>
                                <div className="self-end leading-none rotate-180" style={{ color: hColor }}>
                                  <div className="text-xs font-bold">{hc.rank}</div>
                                  <div className="text-xs -mt-0.5">{hSymbol}</div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <TrumpIcon suit={gs.trumpInfo.currentTrump} size="normal" label={t('game.trumpSuit')} />
                    <DeckVisual
                      deckCount={gs.deck1Count}
                      trumpCard={gs.trumpInfo.trumpCard || null}
                      hiddenTrumpCard1={gs.trumpInfo.hiddenTrumpCard1 || null}
                      showOpenTrump={true}
                      deckStyle={gs.deckStyle}
                      label={t('game.deck1')}
                    />
                  </>
                )}

                {deck2Empty ? (
                  deck1Empty ? null : (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-amber-200/60 text-[9px] sm:text-xs font-medium">{t('game.deck2')}</span>
                      <div className="text-amber-200/20 text-xs italic">{t('game.empty')}</div>
                    </div>
                  )
                ) : (
                  <DeckVisual
                    deckCount={gs.deck2Count}
                    trumpCard={gs.trumpInfo.hiddenTrumpCard || null}
                    showOpenTrump={false}
                    deckStyle={gs.deckStyle}
                    label={t('game.deck2')}
                  />
                )}
              </div>
            )}
          </div>

          {/* MOBILE: Trump icon */}
          <div data-tutorial="trump-indicator" className="sm:hidden absolute top-2 right-2 z-20 flex flex-col items-center bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-2 border border-amber-700/40">
            <span className={`${mobileTrumpColor} text-3xl leading-none`}>{trumpSymbol}</span>
            <span className="text-amber-200/60 text-[8px] font-semibold">{t('game.trumpSuit')}</span>

          </div>


        </div>

        {/* Winner/spectator banner */}
        {gs.players[myIdx]?.isOut && gs.players[myIdx]?.winPlace && (
          <div className="flex items-center justify-center px-2 sm:px-3 py-1 sm:py-2">
            <div className="bg-green-900/60 border border-green-600/40 rounded-lg px-3 sm:px-6 py-1.5 sm:py-2 flex flex-col items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                <span className="text-green-300 font-semibold text-xs sm:text-base">
                  {t('game.youWon', { place: String(gs.players[myIdx].winPlace) })}
                </span>
              </div>
              {(() => {
                const myPrize = gs.playerPrizes?.find(pr => pr.playerId === gs.players[myIdx]?.id);
                return myPrize && myPrize.amount > 0 ? (
                  <div className="flex items-center gap-1.5 text-amber-300 text-xs sm:text-sm font-medium">
                    <span>+{formatBalance(myPrize.amount)}</span>
                    <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/shanyrak_96e91a49.png" alt="" className="w-4 h-4" />
                  </div>
                ) : null;
              })()}
              {onReturnToLobby && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="mt-1"
                  onClick={onReturnToLobby}
                >
                  <Home className="w-3.5 h-3.5 mr-1" />
                  {t('game.exitToLobby')}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Role indicator + Action buttons — DESKTOP: centered fixed overlay */}
        {/* Desktop: First attacker indicator — shown in action buttons area when table is empty */}
        {!hasAnyAction && isAttacker && gs.battleField.length === 0 && gs.turnPhase === 'attack' && !gs.players[myIdx]?.isOut && !isSixOnlySpectator && (
          <div className="hidden sm:flex fixed left-0 right-0 bottom-[180px] z-40 justify-center pointer-events-none">
            <span className="text-red-500 text-xl md:text-2xl font-black tracking-wider drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]" style={{ animation: 'attackBlink 0.33s ease-in-out infinite alternate' }}>
              {t('game.yourTurnAttack')}
            </span>
          </div>
        )}
        {/* Mobile: First attacker indicator — shown in action buttons area when table is empty */}
        {!hasAnyAction && isAttacker && gs.battleField.length === 0 && gs.turnPhase === 'attack' && !gs.players[myIdx]?.isOut && !isSixOnlySpectator && (
          <div className="sm:hidden fixed bottom-[120px] left-0 right-0 z-40 flex justify-center pointer-events-none">
            <span className="text-red-500 text-base font-black tracking-wider drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]" style={{ animation: 'attackBlink 0.33s ease-in-out infinite alternate' }}>
              {t('game.yourTurnAttack')}
            </span>
          </div>
        )}
        {/* Desktop version */}
        {hasAnyAction && !isSixOnlySpectator && (
          <div className="hidden sm:flex fixed left-0 right-0 bottom-[180px] z-40 justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-2 pointer-events-auto">
              {/* Role badges */}
              <div className="flex items-center gap-2">
                {isAttacker && !gs.defenderTaking && (
                  <Badge className="bg-red-900/70 text-red-300 border-red-700/40 text-xl px-5 py-2 backdrop-blur-sm">
                    <Swords className="w-6 h-6 mr-2" /> {t('game.roleAttacking')}
                  </Badge>
                )}
                {isAttacker && gs.defenderTaking && (
                  <Badge className="bg-orange-900/70 text-orange-300 border-orange-700/40 text-xl px-5 py-2 backdrop-blur-sm">
                    <Swords className="w-6 h-6 mr-2" /> {t('game.roleAddCards')}
                  </Badge>
                )}
                {isDefender && !gs.defenderTaking && (
                  <Badge className="bg-blue-900/70 text-blue-300 border-blue-700/40 text-xl px-5 py-2 backdrop-blur-sm">
                    <Shield className="w-6 h-6 mr-2" /> {t('game.roleDefending')}
                  </Badge>
                )}
                {isDefender && gs.defenderTaking && (
                  <Badge className="bg-orange-900/70 text-orange-300 border-orange-700/40 text-xl px-5 py-2 backdrop-blur-sm">
                    <HandMetal className="w-6 h-6 mr-2" /> {t('game.roleTaking')}
                  </Badge>
                )}
                {!isAttacker && !isDefender && gs.canAddCards && !gs.attackerHasPriority && (
                  <Badge className="bg-amber-900/70 text-amber-300 border-amber-700/40 text-lg px-4 py-1.5 backdrop-blur-sm">
                    {t('game.roleCanAdd')}
                  </Badge>
                )}
                {!isAttacker && !isDefender && gs.canAddCards && gs.attackerHasPriority && (
                  <Badge className="bg-gray-800/70 text-gray-400 border-gray-700/40 text-lg px-4 py-1.5 backdrop-blur-sm">
                    {t('game.roleWaiting')}
                  </Badge>
                )}
              </div>

              {/* Multi-card selection notice */}
              {isMultiSelecting && (
                <div className="text-center mb-1">
                  <span className="text-amber-200 text-sm sm:text-base bg-black/50 px-3 py-1 rounded-lg backdrop-blur-sm">
                    {multiSelectMode === 'transfer'
                      ? t('game.multiSelectTransferN', { n: String(multiSelectIds.size) })
                      : multiSelectMode === 'passthrough'
                      ? t('game.multiSelectPassThroughN', { n: String(multiSelectIds.size) })
                      : t('game.multiSelectAttackN', { n: String(multiSelectIds.size) })}
                  </span>
                </div>
              )}

              {/* Action buttons — semi-transparent so cards underneath are visible */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {isMultiSelecting && multiSelectMode === 'attack' && (
                  <>
                    <Button
                      className="action-btn-blink bg-emerald-700/35 hover:bg-emerald-600/55 text-white text-lg h-14 px-6 font-semibold backdrop-blur-sm shadow-xl border border-emerald-500/20"
                      onClick={handleMultiAttack}
                    >
                      {t('game.playN', { n: String(multiSelectIds.size) })}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-gray-600/40 text-gray-300 bg-gray-800/20 text-lg h-14 px-6 font-semibold backdrop-blur-sm shadow-xl"
                      onClick={() => { setMultiSelectIds(new Set()); setMultiSelectMode(null); }}
                    >
                      {t('game.cancel')}
                    </Button>
                  </>
                )}
                {isMultiSelecting && multiSelectMode === 'transfer' && (
                  <>
                    <Button
                      className="action-btn-blink bg-purple-700/35 hover:bg-purple-600/55 text-white text-lg h-14 px-6 font-semibold backdrop-blur-sm shadow-xl border border-purple-500/20"
                      onClick={handleMultiTransfer}
                    >
                      {t('game.transferN', { n: String(multiSelectIds.size) })}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-gray-600/40 text-gray-300 bg-gray-800/20 text-lg h-14 px-6 font-semibold backdrop-blur-sm shadow-xl"
                      onClick={() => { setMultiSelectIds(new Set()); setMultiSelectMode(null); }}
                    >
                      {t('game.cancel')}
                    </Button>
                  </>
                )}
                {isMultiSelecting && multiSelectMode === 'passthrough' && (
                  <>
                    <Button
                      className="action-btn-blink bg-yellow-700/35 hover:bg-yellow-600/55 text-white text-lg h-14 px-6 font-semibold backdrop-blur-sm shadow-xl border border-yellow-500/20"
                      onClick={handleMultiPassThrough}
                    >
                      <Eye className="w-5 h-5 mr-1.5" />
                      {t('game.passThroughN', { n: String(multiSelectIds.size) })}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-gray-600/40 text-gray-300 bg-gray-800/20 text-lg h-14 px-6 font-semibold backdrop-blur-sm shadow-xl"
                      onClick={() => { setMultiSelectIds(new Set()); setMultiSelectMode(null); }}
                    >
                      {t('game.cancel')}
                    </Button>
                  </>
                )}
                {selectedCanBeat && (
                  <Button
                    className="action-btn-blink bg-blue-700/35 hover:bg-blue-600/55 text-white text-lg h-14 px-6 font-semibold backdrop-blur-sm shadow-xl border border-blue-500/20"
                    onClick={() => { onPlayCard(selectedCardId!); setSelectedCardId(null); }}
                  >
                    <Shield className="w-5 h-5 mr-1.5" />
                    {t('game.beat')}
                  </Button>
                )}
                {selectedCanTransfer && (
                  <Button
                    className="action-btn-blink bg-purple-700/35 hover:bg-purple-600/55 text-white text-lg h-14 px-6 font-semibold backdrop-blur-sm shadow-xl border border-purple-500/20"
                    onClick={() => {
                      const cardId = selectedCardId!;
                      const card = gs.myHand.find(c => c.id === cardId);
                      if (card) {
                        const sameRankTransfer = gs.myHand.filter(
                          c => c.rank === card.rank && transferIds.has(c.id) && c.id !== cardId
                        );
                        if (sameRankTransfer.length > 0) {
                          // Enter multi-select mode for transfer
                          setMultiSelectIds(new Set([cardId]));
                          setMultiSelectMode('transfer');
                          setSelectedCardId(null);
                          return;
                        }
                      }
                      onTransferCard(cardId);
                      setSelectedCardId(null);
                    }}
                  >
                    {t('game.transfer')}
                  </Button>
                )}
                {selectedCanPassThrough && (
                  <Button
                    className="action-btn-blink bg-yellow-700/35 hover:bg-yellow-600/55 text-white text-lg h-14 px-6 font-semibold backdrop-blur-sm shadow-xl border border-yellow-500/20"
                    onClick={() => { onShowPassThrough(selectedCardId!); setSelectedCardId(null); }}
                  >
                    <Eye className="w-5 h-5 mr-1.5" />
                    {t('game.passThrough')}
                  </Button>
                )}
                {selectedCardId && !isMultiSelecting && (
                  <Button
                    variant="outline"
                    className="border-gray-600/40 text-gray-300 bg-gray-800/20 text-lg h-14 px-6 font-semibold backdrop-blur-sm shadow-xl"
                    onClick={() => setSelectedCardId(null)}
                  >
                    {t('game.cancel')}
                  </Button>
                )}
                {canTake && (
                  <Button variant="destructive" className="action-btn-blink text-lg h-14 px-6 font-semibold bg-red-700/35 hover:bg-red-600/55 backdrop-blur-sm shadow-xl" onClick={onTakeCards}>
                    {t('game.take')}
                  </Button>
                )}
                {canEndAttack && (
                  <Button className="action-btn-blink bg-green-700/35 hover:bg-green-600/55 text-white text-lg h-14 px-6 font-semibold backdrop-blur-sm shadow-xl border border-green-500/20" onClick={onEndAttack}>
                    {gs.defenderTaking ? t('game.bitoEnough') : t('game.bito')}
                  </Button>
                )}
                {canSkip && (
                  <Button variant="outline" className="action-btn-blink border-amber-700/40 text-amber-200 bg-amber-900/20 text-lg h-14 px-6 font-semibold backdrop-blur-sm shadow-xl" onClick={onSkipTurn}>
                    {t('game.skip')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MOBILE: Floating action buttons — always visible over battlefield */}
        {hasAnyAction && !isSixOnlySpectator && (
          <div className="sm:hidden fixed bottom-[120px] left-0 right-0 z-40 flex flex-col items-center gap-1.5 pointer-events-none">
            {/* Role badge */}
            <div className="pointer-events-auto">
              {isAttacker && !gs.defenderTaking && (
                <Badge className="bg-red-900/80 text-red-300 border-red-700/50 text-xs px-2.5 py-1 shadow-lg backdrop-blur-sm">
                  <Swords className="w-3.5 h-3.5 mr-1" /> {t('game.roleAttacking')}
                </Badge>
              )}
              {isAttacker && gs.defenderTaking && (
                <Badge className="bg-orange-900/80 text-orange-300 border-orange-700/50 text-xs px-2.5 py-1 shadow-lg backdrop-blur-sm">
                  <Swords className="w-3.5 h-3.5 mr-1" /> {t('game.roleAddCards')}
                </Badge>
              )}
              {isDefender && !gs.defenderTaking && (
                <Badge className="bg-blue-900/80 text-blue-300 border-blue-700/50 text-xs px-2.5 py-1 shadow-lg backdrop-blur-sm">
                  <Shield className="w-3.5 h-3.5 mr-1" /> {t('game.roleDefending')}
                </Badge>
              )}
              {isDefender && gs.defenderTaking && (
                <Badge className="bg-orange-900/80 text-orange-300 border-orange-700/50 text-xs px-2.5 py-1 shadow-lg backdrop-blur-sm">
                  <HandMetal className="w-3.5 h-3.5 mr-1" /> {t('game.roleTaking')}
                </Badge>
              )}
              {!isAttacker && !isDefender && gs.canAddCards && !gs.attackerHasPriority && (
                <Badge className="bg-amber-900/80 text-amber-300 border-amber-700/50 text-xs px-2.5 py-1 shadow-lg backdrop-blur-sm">
                  {t('game.roleCanAdd')}
                </Badge>
              )}
              {!isAttacker && !isDefender && gs.canAddCards && gs.attackerHasPriority && (
                <Badge className="bg-gray-800/80 text-gray-400 border-gray-700/50 text-xs px-2.5 py-1 shadow-lg backdrop-blur-sm">
                  {t('game.roleWaiting')}
                </Badge>
              )}
            </div>

            {/* Multi-card selection notice (mobile) */}
            {isMultiSelecting && (
              <div className="pointer-events-auto text-center mb-0.5">
                <span className="text-amber-200 text-xs bg-black/60 px-2.5 py-0.5 rounded-lg backdrop-blur-sm">
                  {multiSelectMode === 'transfer'
                    ? t('game.multiSelectTransferN', { n: String(multiSelectIds.size) })
                    : multiSelectMode === 'passthrough'
                    ? t('game.multiSelectPassThroughN', { n: String(multiSelectIds.size) })
                    : t('game.multiSelectAttackN', { n: String(multiSelectIds.size) })}
                </span>
              </div>
            )}

            {/* Floating action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pointer-events-auto max-w-[95vw]">
              {isMultiSelecting && multiSelectMode === 'attack' && (
                <>
                  <Button
                    className="action-btn-blink bg-emerald-700/35 hover:bg-emerald-600/55 text-white text-sm h-11 px-4 font-semibold shadow-xl backdrop-blur-sm border border-emerald-500/20"
                    onClick={handleMultiAttack}
                  >
                    {t('game.playN', { n: String(multiSelectIds.size) })}
                    </Button>
                  <Button
                    variant="outline"
                    className="border-gray-600/40 text-gray-300 bg-gray-800/20 text-sm h-11 px-4 font-semibold shadow-xl backdrop-blur-sm"
                    onClick={() => { setMultiSelectIds(new Set()); setMultiSelectMode(null); }}
                  >
                    {t('game.cancel')}
                  </Button>
                </>
              )}
              {isMultiSelecting && multiSelectMode === 'transfer' && (
                <>
                  <Button
                    className="action-btn-blink bg-purple-700/35 hover:bg-purple-600/55 text-white text-sm h-11 px-4 font-semibold shadow-xl backdrop-blur-sm border border-purple-500/20"
                    onClick={handleMultiTransfer}
                  >
                    {t('game.transferN', { n: String(multiSelectIds.size) })}
                    </Button>
                  <Button
                    variant="outline"
                    className="border-gray-600/40 text-gray-300 bg-gray-800/20 text-sm h-11 px-4 font-semibold shadow-xl backdrop-blur-sm"
                    onClick={() => { setMultiSelectIds(new Set()); setMultiSelectMode(null); }}
                  >
                    {t('game.cancel')}
                  </Button>
                </>
              )}
              {isMultiSelecting && multiSelectMode === 'passthrough' && (
                <>
                  <Button
                    className="action-btn-blink bg-yellow-700/35 hover:bg-yellow-600/55 text-white text-sm h-11 px-4 font-semibold shadow-xl backdrop-blur-sm border border-yellow-500/20"
                    onClick={handleMultiPassThrough}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    {t('game.passThroughN', { n: String(multiSelectIds.size) })}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-600/40 text-gray-300 bg-gray-800/20 text-sm h-11 px-4 font-semibold shadow-xl backdrop-blur-sm"
                    onClick={() => { setMultiSelectIds(new Set()); setMultiSelectMode(null); }}
                  >
                    {t('game.cancel')}
                  </Button>
                </>
              )}
              {selectedCanBeat && (
                <Button
                  className="action-btn-blink bg-blue-700/35 hover:bg-blue-600/55 text-white text-sm h-11 px-4 font-semibold shadow-xl backdrop-blur-sm border border-blue-500/20"
                  onClick={() => { onPlayCard(selectedCardId!); setSelectedCardId(null); }}
                >
                  <Shield className="w-4 h-4 mr-1" />
                  {t('game.beat')}
                </Button>
              )}
              {selectedCanTransfer && (
                <Button
                  className="action-btn-blink bg-purple-700/35 hover:bg-purple-600/55 text-white text-sm h-11 px-4 font-semibold shadow-xl backdrop-blur-sm border border-purple-500/20"
                  onClick={() => {
                    const cardId = selectedCardId!;
                    const card = gs.myHand.find(c => c.id === cardId);
                    if (card) {
                      const sameRankTransfer = gs.myHand.filter(
                        c => c.rank === card.rank && transferIds.has(c.id) && c.id !== cardId
                      );
                      if (sameRankTransfer.length > 0) {
                        // Enter multi-select mode for transfer
                        setMultiSelectIds(new Set([cardId]));
                        setMultiSelectMode('transfer');
                        setSelectedCardId(null);
                        return;
                      }
                    }
                    onTransferCard(cardId);
                    setSelectedCardId(null);
                  }}
                >
                  {t('game.transfer')}
                </Button>
              )}
              {selectedCanPassThrough && (
                <Button
                  className="action-btn-blink bg-yellow-700/35 hover:bg-yellow-600/55 text-white text-sm h-11 px-4 font-semibold shadow-xl backdrop-blur-sm border border-yellow-500/20"
                  onClick={() => { onShowPassThrough(selectedCardId!); setSelectedCardId(null); }}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  {t('game.passThrough')}
                </Button>
              )}
              {selectedCardId && !isMultiSelecting && (
                <Button
                  variant="outline"
                  className="border-gray-600/40 text-gray-300 bg-gray-800/20 text-sm h-11 px-4 font-semibold shadow-xl backdrop-blur-sm"
                  onClick={() => setSelectedCardId(null)}
                >
                  {t('game.cancel')}
                </Button>
              )}
              {canTake && (
                <Button variant="destructive" className="action-btn-blink text-sm h-11 px-4 font-semibold shadow-xl backdrop-blur-sm bg-red-700/35 hover:bg-red-600/55" onClick={onTakeCards}>
                  {t('game.take')}
                </Button>
              )}
              {canEndAttack && (
                <Button className="action-btn-blink bg-green-700/35 hover:bg-green-600/55 text-white text-sm h-11 px-4 font-semibold shadow-xl backdrop-blur-sm border border-green-500/20" onClick={onEndAttack}>
                  {gs.defenderTaking ? t('game.bitoEnough') : t('game.bito')}
                </Button>
              )}
              {canSkip && (
                <Button variant="outline" className="action-btn-blink border-amber-700/40 text-amber-200 bg-amber-900/15 text-sm h-11 px-4 font-semibold shadow-xl backdrop-blur-sm" onClick={onSkipTurn}>
                  {t('game.skip')}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Player hand */}
        {gs.players[myIdx]?.isOut ? (
          <div className="px-2 pb-2 sm:pb-3 pt-1">
            <div className="text-center text-amber-200/40 text-xs sm:text-sm py-2 sm:py-4">
              {t('game.youExited')}
            </div>
          </div>
        ) : (
        <div className="px-1 sm:px-2 pb-2 sm:pb-3 pt-0.5 sm:pt-1">
          <div className="flex items-center justify-between mb-0.5 sm:mb-1 px-2">
            <span data-tutorial="player-card-count" className="text-xs sm:text-base text-white font-medium">{t('game.nCards', { n: String(gs.myHand.length) })}</span>
            <button
              data-tutorial="sort-button"
              className="text-xs sm:text-base text-white hover:text-amber-300 transition-colors font-medium"
              onClick={() => setSortMode(m => m === 'suit-rank' ? 'rank-only' : 'suit-rank')}
            >
              {sortMode === 'suit-rank' ? t('game.sortBySuit') : t('game.sortByRank')}
            </button>
          </div>
          <div data-tutorial="player-hand">
            <PlayerHand
              sortedHand={sortedHand}
              playableIds={playableIds}
              transferIds={transferIds}
              passThroughIds={passThroughIds}
              selectedCardId={selectedCardId}
              multiSelectIds={multiSelectIds}
              highlightedIds={highlightedIds}
              tutorialHighlightIds={tutorialHighlightIds}
              tutorialGreenIds={tutorialGreenIds}
              tutorialRedIds={tutorialRedIds}
              pendingCardId={pendingCardId}
              onCardClick={handleCardClick}
              onCardDrop={handleCardDrop}
              deckStyle={gs.deckStyle}
            />
          </div>
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

      {/* Tutorial Step Display */}
      {isTutorial && currentTutorialScenario && (
        <TutorialStepDisplay
          scenario={currentTutorialScenario}
          currentStep={tutorialStep}
          totalSteps={tutorialTotalSteps}
          onNext={tutorialNextStep}
          onPrevious={tutorialPreviousStep}
          onSkip={skipTutorial}
          tutorialHighlightIds={tutorialHighlightIds}
          tutorialGreenIds={tutorialGreenIds}
          gameState={gs}
          locale={locale}
        />
      )}
    </div>
  );
}

// ---- Player Profile Popup ----
function PlayerProfilePopup({ gameId, onClose }: { gameId: number; onClose: () => void }) {
  const { t } = useTranslation();
  const { data: profile, isLoading } = trpc.profile.withFriendStatus.useQuery({ targetGameId: gameId });
  const sendRequest = trpc.friends.sendRequest.useMutation();
  const submitComplaint = trpc.complaints.submit.useMutation();
  const utils = trpc.useUtils();
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintReason, setComplaintReason] = useState<'cheating' | 'toxic_behavior' | 'inappropriate_name' | 'afk_abuse' | 'other'>('cheating');
  const [complaintDesc, setComplaintDesc] = useState('');

  const handleAddFriend = async () => {
    const result = await sendRequest.mutateAsync({ targetGameId: gameId });
    if (result.result === 'sent') {
      utils.profile.withFriendStatus.invalidate({ targetGameId: gameId });
    }
  };

  const handleSubmitComplaint = async () => {
    try {
      await submitComplaint.mutateAsync({
        targetGameId: gameId,
        reason: complaintReason,
        description: complaintDesc || undefined,
      });
      setShowComplaintForm(false);
      setComplaintDesc('');
      (await import('sonner')).toast.success(t('complaint.success'));
    } catch (err: any) {
      if (err?.message?.includes('24')) {
        (await import('sonner')).toast.error(t('complaint.duplicate'));
      } else {
        (await import('sonner')).toast.error(t('complaint.error'));
      }
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
            <FrameWrapper frameId={profile.equippedFrame} size={64}>
              <AvatarDisplay
                avatarId={profile.avatarId}
                size={64}
                alt={profile.displayName || 'Player'}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-amber-600/60"
              />
            </FrameWrapper>
            <div className="text-center">
              <h3 className="text-amber-100 font-bold text-base sm:text-lg">{profile.displayName || t('game.player')}</h3>
              <span className="text-amber-200/50 text-xs">ID {profile.gameId}</span>
            </div>

            {/* Stats */}
            <div className="w-full grid grid-cols-2 gap-2 text-center">
              <div className="bg-black/30 rounded-lg px-2 py-1.5 border border-amber-700/20">
                <div className="text-amber-200/50 text-[10px] sm:text-xs">{t('game.gamesPlayed')}</div>
                <div className="text-amber-100 font-bold text-sm sm:text-base">{profile.gamesPlayed}</div>
              </div>
              <div className="bg-black/30 rounded-lg px-2 py-1.5 border border-amber-700/20">
                <div className="text-amber-200/50 text-[10px] sm:text-xs">{t('game.rating')}</div>
                <div className="text-amber-100 font-bold text-sm sm:text-base">{profile.rating}</div>
              </div>
              <div className="bg-black/30 rounded-lg px-2 py-1.5 border border-amber-700/20">
                <div className="text-amber-200/50 text-[10px] sm:text-xs">{t('game.winsLosses')}</div>
                <div className="text-amber-100 font-bold text-sm sm:text-base">
                  <span className="text-green-400">{profile.wins}</span>
                  <span className="text-amber-200/40 mx-0.5">/</span>
                  <span className="text-red-400">{profile.losses}</span>
                </div>
              </div>
              <div className="bg-black/30 rounded-lg px-2 py-1.5 border border-amber-700/20">
                <div className="text-amber-200/50 text-[10px] sm:text-xs">{t('game.winRate')}</div>
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
                {sendRequest.isPending ? t('game.sendingRequest') : t('game.addFriend')}
              </button>
            )}
            {profile.friendStatus === 'pending_sent' && (
              <div className="w-full flex items-center justify-center gap-2 bg-amber-900/40 text-amber-300 rounded-lg px-4 py-2 text-sm border border-amber-700/30">
                <Clock className="w-4 h-4" />
                {t('game.requestSent')}
              </div>
            )}
            {profile.friendStatus === 'pending_received' && (
              <div className="w-full flex items-center justify-center gap-2 bg-blue-900/40 text-blue-300 rounded-lg px-4 py-2 text-sm border border-blue-700/30">
                <UserPlus className="w-4 h-4" />
                {t('game.pendingResponse')}
              </div>
            )}
            {profile.friendStatus === 'friends' && (
              <div className="w-full flex items-center justify-center gap-2 bg-green-900/40 text-green-300 rounded-lg px-4 py-2 text-sm border border-green-700/30">
                <Check className="w-4 h-4" />
                 {t('game.alreadyFriends')}
               </div>
            )}

            {/* Report button — only for other players */}
            {!profile.isSelf && !showComplaintForm && (
              <button
                className="w-full flex items-center justify-center gap-2 bg-red-900/30 hover:bg-red-900/50 text-red-300 rounded-lg px-4 py-2 transition-colors text-sm border border-red-700/20"
                onClick={() => setShowComplaintForm(true)}
              >
                <Flag className="w-4 h-4" />
                {t('complaint.report')}
              </button>
            )}

            {/* Complaint form */}
            {showComplaintForm && (
              <div className="w-full bg-black/30 rounded-lg p-3 border border-red-700/30 space-y-2">
                <h4 className="text-red-300 font-semibold text-sm">{t('complaint.title')}</h4>
                <div>
                  <label className="text-amber-200/60 text-xs block mb-1">{t('complaint.reason')}</label>
                  <select
                    className="w-full bg-[#0f1923] border border-amber-700/30 rounded-md px-2 py-1.5 text-amber-100 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    value={complaintReason}
                    onChange={e => setComplaintReason(e.target.value as any)}
                  >
                    <option value="cheating">{t('complaint.reasonCheating')}</option>
                    <option value="toxic_behavior">{t('complaint.reasonToxic')}</option>
                    <option value="inappropriate_name">{t('complaint.reasonName')}</option>
                    <option value="afk_abuse">{t('complaint.reasonAfk')}</option>
                    <option value="other">{t('complaint.reasonOther')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-amber-200/60 text-xs block mb-1">{t('complaint.description')}</label>
                  <textarea
                    className="w-full bg-[#0f1923] border border-amber-700/30 rounded-md px-2 py-1.5 text-amber-100 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-none"
                    rows={2}
                    maxLength={500}
                    placeholder={t('complaint.descriptionPlaceholder')}
                    value={complaintDesc}
                    onChange={e => setComplaintDesc(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 bg-red-700/60 hover:bg-red-700/80 text-white rounded-md px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50"
                    onClick={handleSubmitComplaint}
                    disabled={submitComplaint.isPending}
                  >
                    {submitComplaint.isPending ? t('complaint.submitting') : t('complaint.submit')}
                  </button>
                  <button
                    className="flex-1 bg-gray-700/40 hover:bg-gray-700/60 text-gray-300 rounded-md px-3 py-1.5 text-sm transition-colors"
                    onClick={() => setShowComplaintForm(false)}
                  >
                    {t('complaint.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-amber-200/50 text-sm">{t('game.profileNotFound')}</div>
        )}
      </div>
    </div>
  );
}
