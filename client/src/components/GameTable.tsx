import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import type { ClientGameState, AvailableAction, Card, BattlePair } from '../../../shared/gameTypes';
import { RANK_ORDER } from '../../../shared/gameTypes';
import { SUIT_SYMBOLS, GAME_TABLE_URL } from '../../../shared/cardAssets';
import PlayingCard from './PlayingCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Swords, Shield, ArrowRight, ArrowLeft, Timer, Layers, Trash2, Crown, Trophy, Frown, Home, HandMetal, Eye, LogOut, DoorOpen, ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { useSound } from '@/hooks/useSound';

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

// ---- PlayerHand component with horizontal scroll and navigation arrows ----

function PlayerHand({
  sortedHand,
  playableIds,
  transferIds,
  passThroughIds,
  selectedCardId,
  onCardClick,
}: {
  sortedHand: Card[];
  playableIds: Set<string>;
  transferIds: Set<string>;
  passThroughIds: Set<string>;
  selectedCardId: string | null;
  onCardClick: (card: Card) => void;
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

  // Check scroll on mount and when hand changes
  useMemo(() => {
    // Delay to let DOM update
    setTimeout(checkScroll, 50);
  }, [sortedHand.length, checkScroll]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 72; // approx card width
    const scrollAmount = cardWidth * 3; // scroll 3 cards at a time
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
    setTimeout(checkScroll, 300);
  }, [checkScroll]);

  // Calculate overlap based on card count
  const getCardMargin = (i: number) => {
    if (i === 0) return '0';
    if (sortedHand.length <= 8) return '0'; // No overlap needed
    if (sortedHand.length <= 12) return '-8px';
    if (sortedHand.length <= 18) return '-14px';
    return '-20px'; // Heavy overlap for 18+ cards
  };

  const needsScroll = sortedHand.length > 8;

  return (
    <div className="relative">
      {/* Left scroll arrow */}
      {needsScroll && canScrollLeft && (
        <button
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-black/70 hover:bg-black/90 text-amber-300 rounded-full p-1 shadow-lg border border-amber-700/40 transition-all"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {/* Right scroll arrow */}
      {needsScroll && canScrollRight && (
        <button
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-black/70 hover:bg-black/90 text-amber-300 rounded-full p-1 shadow-lg border border-amber-700/40 transition-all"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex justify-center overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-amber-700/40 scrollbar-track-transparent"
        onScroll={checkScroll}
        style={{
          scrollbarWidth: 'thin',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="flex items-end px-6">
          {sortedHand.map((card, i) => {
            const isPlayable = playableIds.has(card.id) || transferIds.has(card.id) || passThroughIds.has(card.id);
            const isSelected = selectedCardId === card.id;
            const isPassThroughCard = passThroughIds.has(card.id);
            return (
              <div
                key={card.id}
                className="relative flex-shrink-0 transition-transform duration-150"
                style={{
                  marginLeft: getCardMargin(i),
                  zIndex: isSelected ? 50 : i,
                  transform: isSelected ? 'translateY(-8px)' : undefined,
                }}
              >
                <PlayingCard
                  card={card}
                  playable={isPlayable}
                  selected={isSelected}
                  onClick={() => onCardClick(card)}
                />
                {isPassThroughCard && !isSelected && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-600 rounded-full flex items-center justify-center border border-yellow-400">
                    <Eye className="w-2.5 h-2.5 text-white" />
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

export interface GameTableProps {
  gameState: ClientGameState;
  availableActions: AvailableAction[];
  turnTimer: number;
  gameOverData?: { winnersOrder: string[]; loserId: string | null } | null;
  onPlayCard: (cardId: string, targetPairIdx?: number) => void;
  onTransferCard: (cardId: string) => void;
  onTakeCards: () => void;
  onPassTurn: () => void;
  onEndAttack: () => void;
  onSkipTurn: () => void;
  onShowPassThrough: (cardId: string) => void;
  onLeaveGame?: () => void;
  onReturnToLobby?: () => void;
}

export default function GameTable({
  gameState, availableActions, turnTimer, gameOverData,
  onPlayCard, onTransferCard, onTakeCards, onPassTurn, onEndAttack, onSkipTurn, onShowPassThrough,
  onLeaveGame, onReturnToLobby,
}: GameTableProps) {
  const gs = gameState;
  const myIdx = gs.myIndex;

  const [sortMode, setSortMode] = useState<'suit-rank' | 'rank-only'>('suit-rank');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const { play: playSound, enabled: soundEnabled, toggle: toggleSound } = useSound();

  // Track previous state for detecting changes
  const prevBattleFieldLen = useRef(gs.battleField.length);

  const prevGamePhase = useRef(gs.gamePhase);
  const prevMyHandLen = useRef(gs.myHand.length);
  const prevDiscardCount = useRef(gs.discardCount);

  // Sound effects triggered by game state changes
  useEffect(() => {
    const bfLen = gs.battleField.length;
    const prevBf = prevBattleFieldLen.current;
    const prevHand = prevMyHandLen.current;
    const prevDiscard = prevDiscardCount.current;

    // Card played on table (new attack or defense card)
    if (bfLen > prevBf || (bfLen === prevBf && bfLen > 0 && gs.battleField.some(p => p.defense) && prevDiscard === gs.discardCount)) {
      // Check if a defense card was just played (battlefield same length but a defense appeared)
      const hasNewDefense = bfLen === prevBf && bfLen > 0;
      if (bfLen > prevBf || hasNewDefense) {
        playSound('cardPlay', 0.4);
      }
    }

    // Successful defense (bito) — battlefield cleared, discard increased
    if (prevBf > 0 && bfLen === 0 && gs.discardCount > prevDiscard) {
      playSound('roundWin', 0.5);
    }

    // Defender took cards — battlefield cleared, hand grew
    if (prevBf > 0 && bfLen === 0 && gs.myHand.length > prevHand) {
      playSound('cardTake', 0.5);
    }

    // Someone else took cards (battlefield cleared, discard didn't increase, my hand didn't grow)
    if (prevBf > 0 && bfLen === 0 && gs.discardCount === prevDiscard && gs.myHand.length <= prevHand) {
      playSound('cardTake', 0.3);
    }

    prevBattleFieldLen.current = bfLen;
    prevMyHandLen.current = gs.myHand.length;
    prevDiscardCount.current = gs.discardCount;
  }, [gs.battleField.length, gs.defenderTaking, gs.myHand.length, gs.discardCount, playSound]);

  // Deal sound when game starts (transition to playing phase)
  useEffect(() => {
    if (gs.gamePhase === 'playing' && prevGamePhase.current !== 'playing') {
      // Play deal sound with slight delay to feel like cards being dealt
      playSound('cardDeal', 0.4);
      const t1 = setTimeout(() => playSound('cardDeal', 0.3), 120);
      const t2 = setTimeout(() => playSound('cardDeal', 0.35), 240);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [gs.gamePhase, playSound]);

  // Game over sounds
  useEffect(() => {
    if (gs.gamePhase === 'finished' && prevGamePhase.current === 'playing') {
      const myPlayer = gs.players[myIdx];
      const isLoser = gs.loserId === myPlayer?.id;
      if (isLoser || myPlayer?.leftGame) {
        playSound('gameLose', 0.5);
      } else {
        playSound('gameWin', 0.6);
      }
    }
    prevGamePhase.current = gs.gamePhase;
  }, [gs.gamePhase, gs.loserId, gs.players, myIdx, playSound]);

  // Your turn notification sound
  const prevActionsLen = useRef(availableActions.length);
  useEffect(() => {
    if (availableActions.length > 0 && prevActionsLen.current === 0) {
      // Only play if it's a meaningful turn (not just "skip")
      const hasMeaningfulAction = availableActions.some(a => 
        a.type === 'playCard' || a.type === 'takeCards' || a.type === 'transferCard'
      );
      if (hasMeaningfulAction) {
        playSound('yourTurn', 0.3);
      }
    }
    prevActionsLen.current = availableActions.length;
  }, [availableActions, playSound]);

  // Timer warning sound (at 5 seconds)
  const prevTimer = useRef(turnTimer);
  useEffect(() => {
    if (turnTimer === 5 && prevTimer.current > 5 && availableActions.length > 0) {
      playSound('timerWarning', 0.3);
    }
    prevTimer.current = turnTimer;
  }, [turnTimer, availableActions.length, playSound]);
  const isAttacker = myIdx === gs.currentAttackerIdx;
  const isDefender = myIdx === gs.currentDefenderIdx;

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

  const sortedHand = sortHand(gs.myHand, sortMode);

  const handleCardClick = (card: Card) => {
    if (isDefender && gs.turnPhase === 'defend' && !gs.defenderTaking) {
      // If card is a transfer or passThrough candidate, select it
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
          onPlayCard(card.id);
        }
        return;
      }
    }
    if (playableIds.has(card.id)) {
      onPlayCard(card.id);
    }
  };

  const trumpSymbol = SUIT_SYMBOLS[gs.trumpInfo.currentTrump] || '';
  const trumpColor = gs.trumpInfo.currentTrump === 'hearts' || gs.trumpInfo.currentTrump === 'diamonds' ? 'text-red-400' : 'text-gray-200';

  const opponents = gs.players.filter((_, i) => i !== myIdx);

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Game over overlay
  if (gs.gamePhase === 'finished') {
    const myPlayer = gs.players[myIdx];
    const isLoser = gs.loserId === myPlayer?.id;
    const isWinner = myPlayer?.winPlace !== null && myPlayer?.winPlace !== undefined;
    const didLeave = myPlayer?.leftGame;

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0f2035] to-[#0a1628] flex items-center justify-center p-4">
        <div className="bg-[#1a2d45]/90 border border-amber-700/30 rounded-2xl p-8 max-w-md w-full text-center space-y-6">
          <div className="text-6xl mb-4">
            {isLoser ? '😢' : didLeave ? '🚶' : '🎉'}
          </div>
          <h2 className="text-3xl font-bold text-amber-100">
            {didLeave ? 'Вы покинули игру' : isLoser ? 'Вы проиграли!' : isWinner ? `Вы победили! (${myPlayer.winPlace}-е место)` : 'Игра окончена!'}
          </h2>

          <div className="space-y-2">
            <h3 className="text-amber-400 font-semibold text-lg">Результаты:</h3>
            {gs.players.map(p => (
              <div key={p.id} className={`flex items-center justify-between px-4 py-2 rounded-lg ${
                p.leftGame ? 'bg-gray-800/40 border border-gray-600/30' :
                p.id === gs.loserId ? 'bg-red-900/30 border border-red-700/30' :
                p.winPlace ? 'bg-green-900/20 border border-green-700/20' : 'bg-[#0f2035]/50'
              }`}>
                <span className="text-amber-100 flex items-center gap-2">
                  {p.leftGame && <DoorOpen className="w-4 h-4 text-gray-400" />}
                  {!p.leftGame && p.winPlace && <Trophy className="w-4 h-4 text-amber-400" />}
                  {!p.leftGame && p.id === gs.loserId && <Frown className="w-4 h-4 text-red-400" />}
                  {p.name}
                </span>
                <span className={p.leftGame ? 'text-gray-400' : p.id === gs.loserId ? 'text-red-400' : 'text-green-400'}>
                  {p.leftGame ? 'Покинул игру' : p.id === gs.loserId ? 'Дурак' : p.winPlace ? `${p.winPlace}-е место` : ''}
                </span>
              </div>
            ))}
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
      className="min-h-screen bg-cover bg-center bg-no-repeat relative flex flex-col"
      style={{ backgroundImage: `url(${GAME_TABLE_URL})` }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Leave game confirmation dialog */}
      {showLeaveConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a2d45] border border-amber-700/40 rounded-2xl p-6 max-w-sm w-full mx-4 text-center space-y-4">
            <DoorOpen className="w-12 h-12 text-red-400 mx-auto" />
            <h3 className="text-xl font-bold text-amber-100">Покинуть игру?</h3>
            <p className="text-amber-200/60 text-sm">
              Вы автоматически проиграете. Ваши карты уйдут в бито.
            </p>
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
                onClick={() => setShowLeaveConfirm(false)}
              >
                Остаться
              </Button>
              <Button
                className="flex-1 bg-red-700 hover:bg-red-600 text-white"
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

      <div className="relative z-10 flex flex-col h-screen">
        {/* Top HUD */}
        <div className="flex items-center justify-between px-3 py-2 bg-black/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-amber-900/60 text-amber-300 border-amber-700/40 px-3 py-1.5">
              <span className={`${trumpColor} text-2xl leading-none`}>{trumpSymbol}</span>
              <span className="ml-2 text-sm font-medium">Фаза {gs.trumpInfo.phase}/3</span>
            </Badge>
            <Badge variant="outline" className="border-amber-700/30 text-amber-200/70 text-xs">
              <Layers className="w-3 h-3 mr-1" />
              {gs.deck1Count + gs.deck2Count}
            </Badge>
            <Badge variant="outline" className="border-amber-700/30 text-amber-200/70 text-xs">
              <Trash2 className="w-3 h-3 mr-1" />
              {gs.discardCount}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-amber-700/30 text-amber-200/70 text-xs">
              {gs.direction === 'cw' ? <ArrowRight className="w-3 h-3" /> : <ArrowLeft className="w-3 h-3" />}
            </Badge>
            <Badge className={`${turnTimer <= 5 ? 'bg-red-900/60 text-red-300 border-red-700/40 animate-pulse' : 'bg-amber-900/60 text-amber-300 border-amber-700/40'}`}>
              <Timer className="w-3 h-3 mr-1" />
              {turnTimer}с
            </Badge>
            <button
              className={`transition-colors p-1 rounded ${soundEnabled ? 'text-amber-400 hover:text-amber-300' : 'text-gray-500 hover:text-gray-400'}`}
              onClick={toggleSound}
              title={soundEnabled ? 'Выключить звук' : 'Включить звук'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            {onLeaveGame && !gs.players[myIdx]?.isOut && (
              <button
                className="text-gray-400 hover:text-red-400 transition-colors p-1 rounded"
                onClick={() => setShowLeaveConfirm(true)}
                title="Покинуть игру"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Opponents */}
        <div className="flex justify-center gap-3 px-3 py-2 flex-wrap">
          {opponents.map(p => {
            const pIdx = gs.players.findIndex(pp => pp.id === p.id);
            const isOppAttacker = pIdx === gs.currentAttackerIdx;
            const isOppDefender = pIdx === gs.currentDefenderIdx;
            // Check if this opponent has revealed pass-through cards
            const oppRevealed = gs.revealedPassThroughs?.find(r => r.playerId === p.id);
            return (
              <div key={p.id} className={`flex flex-col items-center px-3 py-2 rounded-xl border transition-all ${
                isOppAttacker ? 'bg-red-900/30 border-red-500/40' :
                isOppDefender ? (gs.defenderTaking ? 'bg-orange-900/30 border-orange-500/40' : 'bg-blue-900/30 border-blue-500/40') :
                'bg-black/30 border-amber-700/20'
              }`}>
                <div className="flex items-center gap-1 mb-1">
                  {isOppAttacker && <Swords className="w-3 h-3 text-red-400" />}
                  {isOppDefender && !gs.defenderTaking && <Shield className="w-3 h-3 text-blue-400" />}
                  {isOppDefender && gs.defenderTaking && <HandMetal className="w-3 h-3 text-orange-400" />}
                  {p.isOut && p.winPlace && <Crown className="w-3 h-3 text-amber-400" />}
                  <span className="text-xs text-amber-100 font-medium truncate max-w-20">{p.name}</span>
                </div>
                {isOppDefender && gs.defenderTaking && (
                  <span className="text-[10px] text-orange-400 mb-0.5">Берёт</span>
                )}
                {/* Show revealed pass-through cards */}
                {oppRevealed && oppRevealed.cards.length > 0 && (
                  <div className="flex items-center gap-1 mb-1 bg-yellow-900/40 border border-yellow-600/40 rounded px-2 py-0.5">
                    <Eye className="w-3 h-3 text-yellow-400" />
                    <span className="text-[10px] text-yellow-300 font-medium">
                      Проездной: {oppRevealed.cards.length}
                    </span>
                    <div className="flex gap-0.5 ml-1">
                      {oppRevealed.cards.map(c => (
                        <span key={c.id} className="text-xs">
                          {SUIT_SYMBOLS[c.suit as keyof typeof SUIT_SYMBOLS] || ''}{c.rank}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {p.leftGame ? (
                  <div className="flex items-center gap-1.5 bg-gray-800/50 border border-gray-600/30 rounded-lg px-2 py-1">
                    <DoorOpen className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-400 font-semibold">Покинул игру</span>
                  </div>
                ) : p.isOut ? (
                  <div className="flex items-center gap-1.5 bg-green-900/40 border border-green-600/30 rounded-lg px-2 py-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs text-green-300 font-semibold">{p.winPlace}-е место</span>
                    <span className="text-[10px] text-green-200/50">Наблюдает</span>
                  </div>
                ) : (
                  <div className="flex gap-0.5">
                    {Array.from({ length: Math.min(p.cardCount, 14) }).map((_, i) => (
                      <div key={i} className="w-3 h-5 bg-amber-900/60 rounded-sm border border-amber-700/30" />
                    ))}
                    {p.cardCount > 14 && <span className="text-xs text-amber-400 ml-1">+{p.cardCount - 14}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Battlefield */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-2">
            {/* Defender taking banner */}
            {gs.defenderTaking && (
              <div className="bg-orange-900/60 border border-orange-600/40 rounded-lg px-4 py-1.5 mb-2">
                <span className="text-orange-300 text-sm font-medium">
                  {isDefender ? '🫳 Вы берёте — ждите, пока атакующие докинут' :
                   isAttacker ? '🔥 Защитник берёт — можно докинуть карты!' :
                   gs.attackerHasPriority ? '⏳ Ожидание — атакующий решает' :
                   '🔥 Защитник берёт — можно докинуть карты!'}
                </span>
              </div>
            )}

            {/* Revealed pass-through cards banner (my own) */}
            {gs.revealedPassThroughs && gs.revealedPassThroughs.find(r => r.playerId === gs.players[myIdx]?.id) && (
              <div className="bg-yellow-900/50 border border-yellow-600/40 rounded-lg px-4 py-1.5 mb-2">
                <span className="text-yellow-300 text-sm font-medium flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Вы показали проездной ({gs.revealedPassThroughs.find(r => r.playerId === gs.players[myIdx]?.id)!.cards.length} шт.)
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
              {gs.battleField.map((pair: BattlePair, i: number) => (
                <div key={i} className="relative">
                  <PlayingCard card={pair.attack} medium />
                  {pair.defense && (
                    <div className="absolute top-4 left-4 z-10">
                      <PlayingCard card={pair.defense} medium />
                    </div>
                  )}
                </div>
              ))}
              {gs.battleField.length === 0 && (
                <div className="text-amber-200/30 text-sm italic">Стол пуст</div>
              )}
            </div>
          </div>
        </div>

        {/* Winner/spectator banner */}
        {gs.players[myIdx]?.isOut && gs.players[myIdx]?.winPlace && (
          <div className="flex items-center justify-center px-3 py-2">
            <div className="bg-green-900/60 border border-green-600/40 rounded-lg px-6 py-2 flex items-center gap-3">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span className="text-green-300 font-semibold">
                Вы победили! ({gs.players[myIdx].winPlace}-е место)
              </span>
              <span className="text-green-200/60 text-sm">Наблюдайте за игрой</span>
            </div>
          </div>
        )}

        {/* Role indicator & Actions */}
        <div className="flex items-center justify-center gap-2 px-3 py-1">
          {isAttacker && !gs.defenderTaking && (
            <Badge className="bg-red-900/60 text-red-300 border-red-700/40">
              <Swords className="w-3 h-3 mr-1" /> Вы атакуете
            </Badge>
          )}
          {isAttacker && gs.defenderTaking && (
            <Badge className="bg-orange-900/60 text-orange-300 border-orange-700/40">
              <Swords className="w-3 h-3 mr-1" /> Можно докинуть
            </Badge>
          )}
          {isDefender && !gs.defenderTaking && (
            <Badge className="bg-blue-900/60 text-blue-300 border-blue-700/40">
              <Shield className="w-3 h-3 mr-1" /> Вы защищаетесь
            </Badge>
          )}
          {isDefender && gs.defenderTaking && (
            <Badge className="bg-orange-900/60 text-orange-300 border-orange-700/40">
              <HandMetal className="w-3 h-3 mr-1" /> Вы берёте карты
            </Badge>
          )}
          {!isAttacker && !isDefender && gs.canAddCards && !gs.attackerHasPriority && (
            <Badge className="bg-amber-900/60 text-amber-300 border-amber-700/40">
              Можно подкинуть
            </Badge>
          )}
          {!isAttacker && !isDefender && gs.canAddCards && gs.attackerHasPriority && (
            <Badge className="bg-gray-800/60 text-gray-400 border-gray-700/40">
              Ожидание атакующего...
            </Badge>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-2 px-3 py-1 flex-wrap">
          {canTransfer && selectedCardId && transferIds.has(selectedCardId) && (
            <Button
              size="sm"
              className="bg-purple-700 hover:bg-purple-600 text-white"
              onClick={() => { onTransferCard(selectedCardId); setSelectedCardId(null); }}
            >
              Перевести
            </Button>
          )}
          {canPassThrough && selectedCardId && passThroughIds.has(selectedCardId) && (
            <Button
              size="sm"
              className="bg-yellow-700 hover:bg-yellow-600 text-white"
              onClick={() => { onShowPassThrough(selectedCardId); setSelectedCardId(null); }}
            >
              <Eye className="w-3 h-3 mr-1" />
              Проездной
            </Button>
          )}
          {canTake && (
            <Button size="sm" variant="destructive" onClick={onTakeCards}>
              Забрать
            </Button>
          )}
          {canEndAttack && (
            <Button size="sm" className="bg-green-700 hover:bg-green-600 text-white" onClick={onEndAttack}>
              {gs.defenderTaking ? 'Бито (хватит)' : 'Бито'}
            </Button>
          )}
          {canSkip && (
            <Button size="sm" variant="outline" className="border-amber-700/40 text-amber-200 bg-amber-900/30" onClick={onSkipTurn}>
              Пропустить
            </Button>
          )}
        </div>

        {/* Player hand */}
        {gs.players[myIdx]?.isOut ? (
          <div className="px-2 pb-3 pt-1">
            <div className="text-center text-amber-200/40 text-sm py-4">
              Вы вышли из игры — наблюдайте за оставшимися игроками
            </div>
          </div>
        ) : (
        <div className="px-2 pb-3 pt-1">
          <div className="flex items-center justify-between mb-1 px-2">
            <span className="text-xs text-amber-200/50">{gs.myHand.length} карт</span>
            <button
              className="text-xs text-amber-400/60 hover:text-amber-300 transition-colors"
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
          />
        </div>
        )}
      </div>
    </div>
  );
}
