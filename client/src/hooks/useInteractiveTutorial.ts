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
  requiredAction?: 'click-card' | 'click-button' | 'click-sort' | 'none';
  /** Card to click if requiredAction is 'click-card' */
  targetCard?: string;
  /** What bot does after player action */
  botAction?: string;
  /** Force text position: 'center' puts text in center of screen */
  textPosition?: 'auto' | 'center';
  /** Number of cards in discard pile */
  discardCount?: number;
  /** Trump card shown under deck (e.g. 'Qh' = Queen of hearts) */
  trumpCard?: string;
  /** Card notations to visually highlight (raise + glow) in player hand */
  highlightCards?: string[];
  /** Whether to show arrows from text to highlighted elements (default: true) */
  showArrows?: boolean;
}

// Standard player hand for all tutorial scenarios (14 cards, includes 777)
const STANDARD_PLAYER_HAND = ['Ks', 'As', '777', '6h', '6h', '6d', '6c', 'Jc', 'Jc', '10h', '10c', '10d', '10s', '7s'];
// Standard bot hand for all tutorial scenarios (14 cards)
const STANDARD_BOT_HAND = ['Ks', 'As', 'Ks', '6h', '6h', '6d', '6c', 'Jc', 'Jc', '10h', '10c', '10d', '10s', '7s'];

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
    trumpCard: 'Qh',
    requiredAction: 'click-button',
    textPosition: 'center',
    discardCount: 10,
  },
  {
    id: 2,
    title: 'Таймер хода',
    description: 'Интерфейс игры',
    highlightElements: ['[data-tutorial="timer"]', '[data-tutorial="timer-desktop"]'],
    text: 'Это таймер хода. У каждого игрока есть определенное количество секунд на ход, которое устанавливается в настройках каждой комнаты. Когда время истекает, ход переходит к следующему игроку.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    trumpCard: 'Qh',
    requiredAction: 'click-button',
    discardCount: 10,
    textPosition: 'center',
  },
  {
    id: 3,
    title: 'Счетчик бито',
    description: 'Интерфейс игры',
    highlightElements: ['[data-tutorial="bito-counter"]', '[data-tutorial="mobile-bito"]'],
    text: 'Это счетчик карт в бито (побитых карт). Показывает сколько карт уже выбыло из игры.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    trumpCard: 'Qh',
    requiredAction: 'click-button',
    discardCount: 10,
    textPosition: 'center',
  },
  {
    id: 4,
    title: 'Две колоды в игре',
    description: 'Структура игры',
    highlightElements: ['[data-tutorial="deck-area"]', '[data-tutorial="mobile-decks"]'],
    text: 'В игре используются 2 колоды карт. Сначала разыгрывается колода №1 между всеми игроками. Когда она заканчивается, начинается колода №2.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    trumpCard: 'Qh',
    requiredAction: 'click-button',
    discardCount: 10,
    textPosition: 'center',
  },
  {
    id: 5,
    title: 'Сортировка и счетчик карт',
    description: 'Интерфейс игры',
    highlightElements: ['[data-tutorial="player-card-count"]', '[data-tutorial="sort-button"]'],
    text: 'Счетчик карт показывает количество карт в вашей руке в реальном времени.\nКнопкой сортировки вы меняете расположение карт в руке',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    trumpCard: 'Qh',
    requiredAction: 'click-button',
    discardCount: 10,
    textPosition: 'center',
  },
  {
    id: 6,
    title: 'Попробуйте воспользоваться сортировкой',
    description: 'Интерактивная сортировка',
    highlightElements: ['[data-tutorial="sort-button"]'],
    text: 'Нажмите на "По масти", чтобы сортировать карты в руке по номиналу.',
    instruction: 'Нажмите на кнопку сортировки',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    trumpCard: 'Qh',
    requiredAction: 'click-sort',
    discardCount: 10,
    textPosition: 'center',
  },
  {
    id: 7,
    title: 'Сортировка карт в руке',
    description: 'Результат сортировки',
    highlightElements: ['[data-tutorial="player-hand"]'],
    text: 'Теперь ваши карты в руке отсортированы по номиналу от меньшего к большему.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    trumpCard: 'Qh',
    requiredAction: 'click-button',
    discardCount: 10,
    textPosition: 'center',
  },
  {
    id: 8,
    title: 'Одинаковые карты',
    description: 'Правила одинаковых карт',
    highlightElements: ['[data-tutorial="player-hand"]'],
    text: 'Так как в игре смешаны 4 стандартные колоды по 36 карт воедино, встречаются одинаковые по масти и номиналу карты. Такие карты бьют сами себя. Исключение - Король пики. Король пики сам себя побить не может',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    requiredAction: 'click-button',
    trumpCard: 'Qh',
    discardCount: 10,
    textPosition: 'center',
    /** Cards to visually highlight (raise + glow) in player hand */
    highlightCards: ['6h', '6h', 'Jc', 'Jc'],
    showArrows: false,
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
    trumpCard: 'Qh',
    discardCount: 10,
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
    trumpCard: 'Qh',
    discardCount: 10,
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
    trumpCard: 'Qh',
    discardCount: 10,
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
    trumpCard: 'Qh',
    requiredAction: 'click-button',
    discardCount: 10,
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
