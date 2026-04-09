import { useState, useCallback } from 'react';

export interface TutorialScenario {
  id: number;
  title: string;
  description: string;
  /** Array of CSS selectors for highlighted areas (multiple spotlights supported) */
  highlightElements: string[];
  text: string;
  instruction?: string;
  /** Card IDs to give player */
  playerHand?: string[];
  /** Card IDs to give bot */
  botHand?: string[];
  /** Trump suit for this scenario */
  trumpSuit?: 'spades' | 'hearts' | 'diamonds' | 'clubs';
  /** Cards on table */
  tableCards?: { playerId: number; cards: string[] }[];
  /** What player must do */
  requiredAction?: 'click-card' | 'click-button' | 'none';
  /** Card to click if requiredAction is 'click-card' */
  targetCard?: string;
  /** What bot does after player action */
  botAction?: string;
  /** Force text position: 'center' puts text in center of screen */
  textPosition?: 'auto' | 'center';
}

// Standard player hand for all tutorial scenarios
const STANDARD_PLAYER_HAND = ['Ks', 'As', '7s', '6h', '6h', '6d', '6c', 'Jc', 'Jc', '10h', '10c', '10d', '10s'];
// Standard bot hand for all tutorial scenarios
const STANDARD_BOT_HAND = ['Ks', 'As', 'Ks', '6h', '6h', '6d', '6c', 'Jc', 'Jc', '10h', '10c', '10d', '10s'];

const TUTORIAL_SCENARIOS: TutorialScenario[] = [
  {
    id: 1,
    title: 'Количество карт в руке',
    description: 'Понимание базовых правил',
    highlightElements: ['[data-tutorial="player-hand"]', '[data-tutorial="opponent-info"]'],
    text: 'Вначале игры всем игрокам раздается по 14 карт.\nВ руке игрока всегда должно быть минимум 14 карт, пока в колодах есть карты.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    requiredAction: 'click-button',
    textPosition: 'center',
  },
  {
    id: 2,
    title: 'Таймер хода',
    description: 'Интерфейс игры',
    highlightElements: ['[data-tutorial="timer"]', '[data-tutorial="timer-desktop"]'],
    text: 'Это таймер хода. У каждого игрока есть 30 секунд на ход. Когда время истекает, ход переходит к следующему игроку.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    requiredAction: 'click-button',
  },
  {
    id: 3,
    title: 'Счетчик бито',
    description: 'Интерфейс игры',
    highlightElements: ['[data-tutorial="bito-counter"]'],
    text: 'Это счетчик карт в бито (побитых карт). Показывает сколько карт уже побито в текущем раунде.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    requiredAction: 'click-button',
  },
  {
    id: 4,
    title: 'Две колоды в игре',
    description: 'Структура игры',
    highlightElements: ['[data-tutorial="deck-info"]'],
    text: 'В игре используются 2 колоды карт. Сначала разыгрывается колода №1 между всеми игроками. Когда она заканчивается, начинается колода №2.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    requiredAction: 'click-button',
  },
  {
    id: 5,
    title: 'Первая бито - максимум 13 карт',
    description: 'Правила первой биты',
    highlightElements: ['[data-tutorial="table-area"]'],
    text: 'В первой бито можно положить максимум 13 карт. Это предотвращает слишком быстрое окончание раунда.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    requiredAction: 'click-button',
  },
  {
    id: 6,
    title: 'Карты с одинаковым номиналом',
    description: 'Правило номиналов',
    highlightElements: ['[data-tutorial="table-area"]'],
    text: 'Карты с одинаковым номиналом (например, две пятерки) бьют друг друга. Если на столе лежит пятерка пик, то пятерка червей может побить пятерку пик.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    requiredAction: 'click-button',
  },
  {
    id: 7,
    title: 'Король пики - самая сильная карта',
    description: 'Уникальные карты',
    highlightElements: ['[data-card-id*="Ks"]'],
    text: 'Король пики - одна из самых сильных карт в игре. Он может побить практически любую карту независимо от козыря. Это делает его очень ценной картой.',
    instruction: 'Нажмите на Короля пики чтобы побить карту противника',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    tableCards: [{ playerId: 1, cards: ['2d'] }],
    requiredAction: 'click-card',
    targetCard: 'Ks',
  },
  {
    id: 8,
    title: 'Карта 777 - переводная',
    description: 'Специальные карты',
    highlightElements: ['[data-card-id*="7s"]'],
    text: 'Карта 777 (семерка) - это переводная карта. Она может перевести карту противника на другую карту.',
    instruction: 'Нажмите на 777 чтобы перевести карту противника',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    tableCards: [{ playerId: 1, cards: ['5d'] }],
    requiredAction: 'click-card',
    targetCard: '7s',
  },
  {
    id: 9,
    title: 'Карта 666 - проездная',
    description: 'Специальные карты',
    highlightElements: ['[data-card-id*="6s"]'],
    text: 'Карта 666 (шестерка) - это проездная карта. Она позволяет вам пройти мимо карты противника и положить новую карту.',
    instruction: 'Нажмите на 666 чтобы пройти мимо карты противника',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    tableCards: [{ playerId: 1, cards: ['5d'] }],
    requiredAction: 'click-card',
    targetCard: '6s',
  },
  {
    id: 10,
    title: 'Карта 6 - удаляет карту',
    description: 'Специальные карты',
    highlightElements: ['[data-card-id*="6h"]'],
    text: 'Карта 6 (шестерка) может удалить карту со стола, если она имеет такой же номинал.',
    instruction: 'Нажмите на 6 чтобы удалить карту со стола',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    tableCards: [{ playerId: 1, cards: ['6d'] }],
    requiredAction: 'click-card',
    targetCard: '6h',
  },
  {
    id: 11,
    title: 'Карта 10 - удаляет всё',
    description: 'Специальные карты',
    highlightElements: ['[data-card-id*="10s"]'],
    text: 'Карта 10 (десятка) - самая мощная карта. Она удаляет все карты со стола и заканчивает раунд.',
    instruction: 'Нажмите на 10 чтобы удалить все карты со стола',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    tableCards: [{ playerId: 1, cards: ['2d', '3d', '4d'] }],
    requiredAction: 'click-card',
    targetCard: '10s',
  },
  {
    id: 12,
    title: 'Потайные козыри',
    description: 'Продвинутые правила',
    highlightElements: ['[data-tutorial="trump-indicator"]'],
    text: 'Потайные козыри - это карты, которые скрыты в колоде и могут быть использованы в критических ситуациях. Козырь показывает нижняя карта в колоде.',
    instruction: 'Нажмите "Далее" чтобы завершить обучение',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    requiredAction: 'click-button',
  },
];

export function useInteractiveTutorial() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const getCurrentScenario = useCallback(() => {
    return TUTORIAL_SCENARIOS[currentStep] || null;
  }, [currentStep]);

  const nextStep = useCallback(() => {
    if (currentStep < TUTORIAL_SCENARIOS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsCompleted(true);
    }
  }, [currentStep]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const skipTutorial = useCallback(() => {
    setIsCompleted(true);
  }, []);

  const resetTutorial = useCallback(() => {
    setCurrentStep(0);
    setIsCompleted(false);
  }, []);

  return {
    currentStep,
    isCompleted,
    totalSteps: TUTORIAL_SCENARIOS.length,
    getCurrentScenario,
    nextStep,
    previousStep,
    skipTutorial,
    resetTutorial,
  };
}
