import { useState, useCallback } from 'react';

export interface TutorialScenario {
  id: number;
  title: string;
  description: string;
  highlightElement: string | null; // CSS selector or null for full screen
  text: string;
  instruction?: string;
  playerHand?: string[]; // Card IDs to give player
  tableCards?: { playerId: number; cards: string[] }[]; // Cards on table
  requiredAction?: 'click-card' | 'click-button' | 'none'; // What player must do
  targetCard?: string; // Card to click if requiredAction is 'click-card'
  botAction?: string; // What bot does after player action
}

const TUTORIAL_SCENARIOS: TutorialScenario[] = [
  {
    id: 1,
    title: 'Количество карт в руке',
    description: 'Понимание базовых правил',
    highlightElement: '[data-tutorial="player-hand"]',
    text: 'У каждого игрока должно быть минимум 14 карт в руке в начале игры. Это позволяет разыграть достаточно карт.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    playerHand: ['2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s', '10s', 'Js', 'Qs', 'Ks', 'As', '2h'],
    requiredAction: 'click-button',
  },
  {
    id: 2,
    title: 'Таймер хода',
    description: 'Интерфейс игры',
    highlightElement: '[data-tutorial="timer"]',
    text: 'Это таймер хода. У каждого игрока есть 30 секунд на ход. Когда время истекает, ход переходит к следующему игроку.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    requiredAction: 'click-button',
  },
  {
    id: 3,
    title: 'Счетчик бито',
    description: 'Интерфейс игры',
    highlightElement: '[data-tutorial="bito-counter"]',
    text: 'Это счетчик карт в бито (побитых карт). Показывает сколько карт уже побито в текущем раунде.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    requiredAction: 'click-button',
  },
  {
    id: 4,
    title: 'Две колоды в игре',
    description: 'Структура игры',
    highlightElement: '[data-tutorial="deck-info"]',
    text: 'В игре используются 2 колоды карт. Сначала разыгрывается колода №1 между всеми игроками. Когда она заканчивается, начинается колода №2.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    requiredAction: 'click-button',
  },
  {
    id: 5,
    title: 'Первая бито - максимум 13 карт',
    description: 'Правила первой биты',
    highlightElement: '[data-tutorial="player-hand"]',
    text: 'В первой бито можно положить максимум 13 карт. Это предотвращает слишком быстрое окончание раунда.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    playerHand: ['2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s', '10s', 'Js', 'Qs', 'Ks', 'As'],
    requiredAction: 'click-button',
  },
  {
    id: 6,
    title: 'Карты с одинаковым номиналом',
    description: 'Правило номиналов',
    highlightElement: '[data-tutorial="player-hand"]',
    text: 'Карты с одинаковым номиналом (например, две пятерки) бьют друг друга. Если на столе лежит пятерка пик, то пятерка червей может побить пятерку пик.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    playerHand: ['5s', '5h', '5d', '5c', '3s', '4s', '6s', '7s', '8s', '9s', '10s', 'Js', 'Qs', 'Ks'],
    requiredAction: 'click-button',
  },
  {
    id: 7,
    title: 'Король пики - самая сильная карта',
    description: 'Уникальные карты',
    highlightElement: '[data-tutorial="player-hand"]',
    text: 'Король пики - одна из самых сильных карт в игре. Он может побить практически любую карту независимо от козыря. Это делает его очень ценной картой.',
    instruction: 'Нажмите на Короля пики чтобы побить карту противника',
    playerHand: ['Ks', '2h', '3h', '4h', '5h', '6h', '7h', '8h', '9h', '10h', 'Jh', 'Qh', 'Ah'],
    tableCards: [{ playerId: 1, cards: ['2d'] }],
    requiredAction: 'click-card',
    targetCard: 'Ks',
  },
  {
    id: 8,
    title: 'Карта 777 - переводная',
    description: 'Специальные карты',
    highlightElement: '[data-tutorial="player-hand"]',
    text: 'Карта 777 (семерка) - это переводная карта. Она может перевести карту противника на другую карту. Например, если противник положил 5, вы можете положить 7 на 5, и противник должен побить 7.',
    instruction: 'Нажмите на 777 чтобы перевести карту противника',
    playerHand: ['7s', '2h', '3h', '4h', '5h', '6h', '8h', '9h', '10h', 'Jh', 'Qh', 'Kh', 'Ah'],
    tableCards: [{ playerId: 1, cards: ['5d'] }],
    requiredAction: 'click-card',
    targetCard: '7s',
  },
  {
    id: 9,
    title: 'Карта 666 - проездная',
    description: 'Специальные карты',
    highlightElement: '[data-tutorial="player-hand"]',
    text: 'Карта 666 (шестерка) - это проездная карта. Она позволяет вам пройти мимо карты противника и положить новую карту. Противник должен побить новую карту.',
    instruction: 'Нажмите на 666 чтобы пройти мимо карты противника',
    playerHand: ['6s', '2h', '3h', '4h', '5h', '7h', '8h', '9h', '10h', 'Jh', 'Qh', 'Kh', 'Ah'],
    tableCards: [{ playerId: 1, cards: ['5d'] }],
    requiredAction: 'click-card',
    targetCard: '6s',
  },
  {
    id: 10,
    title: 'Карта 6 - удаляет карту',
    description: 'Специальные карты',
    highlightElement: '[data-tutorial="player-hand"]',
    text: 'Карта 6 (шестерка) может удалить карту со стола, если она имеет такой же номинал. Например, если на столе лежит 6, вы можете положить 6 и удалить 6 со стола.',
    instruction: 'Нажмите на 6 чтобы удалить карту со стола',
    playerHand: ['6h', '2s', '3s', '4s', '5s', '7s', '8s', '9s', '10s', 'Js', 'Qs', 'Ks', 'As'],
    tableCards: [{ playerId: 1, cards: ['6d'] }],
    requiredAction: 'click-card',
    targetCard: '6h',
  },
  {
    id: 11,
    title: 'Карта 10 - удаляет всё',
    description: 'Специальные карты',
    highlightElement: '[data-tutorial="player-hand"]',
    text: 'Карта 10 (десятка) - самая мощная карта. Она удаляет все карты со стола и заканчивает раунд. Это очень полезная карта в критических ситуациях.',
    instruction: 'Нажмите на 10 чтобы удалить все карты со стола',
    playerHand: ['10s', '2h', '3h', '4h', '5h', '6h', '7h', '8h', '9h', 'Jh', 'Qh', 'Kh', 'Ah'],
    tableCards: [{ playerId: 1, cards: ['2d', '3d', '4d'] }],
    requiredAction: 'click-card',
    targetCard: '10s',
  },
  {
    id: 12,
    title: 'Потайные козыри',
    description: 'Продвинутые правила',
    highlightElement: '[data-tutorial="trump-indicator"]',
    text: 'Потайные козыри - это карты, которые скрыты в колоде и могут быть использованы в критических ситуациях. Они дают дополнительное преимущество в игре. Козырь показывает нижняя карта в колоде.',
    instruction: 'Нажмите "Далее" чтобы завершить обучение',
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
