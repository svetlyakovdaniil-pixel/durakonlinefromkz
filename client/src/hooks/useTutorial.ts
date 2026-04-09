import { useState, useCallback, useRef } from 'react';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  elementSelector: string; // CSS selector to find the element
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'interface',
    title: 'Добро пожаловать в Дурак!',
    description: 'Это основной интерфейс игры. Снизу ваши карты в руке, слева и справа соперники, в центре игровой стол где разыгрываются карты. Вверху информация о колодах и козыре.',
    elementSelector: '[data-tutorial="game-table"]',
  },
  {
    id: 'deck-info',
    title: 'Количество карт в игре',
    description: 'В игре используется 2 колоды (104 карты всего). К1 и К2 - это две колоды. Каждому игроку в начале раздаётся 6 карт. По мере игры карты добираются из колод.',
    elementSelector: '[data-tutorial="deck-info"]',
  },
  {
    id: 'first-beat',
    title: 'Правило первой биты (13 карт)',
    description: 'Первый ход начинается с 13 карт! Атакующий может положить на стол до 13 карт. После этого в следующих ходах количество карт ограничено количеством карт в руке защищающегося.',
    elementSelector: '[data-tutorial="table-area"]',
  },
  {
    id: 'nominal-cards',
    title: 'Карты с одинаковым номиналом',
    description: 'Карты с одинаковым номиналом (например, две семёрки) бьют сами себя! Вы можете положить карту на карту противника, если они одного номинала. Это очень важное правило!',
    elementSelector: '[data-tutorial="player-hand"]',
  },
  {
    id: 'king-of-spades',
    title: 'Король пики - король всех карт',
    description: 'Король пики (♠K) - самая сильная карта в игре! Она бьет ВСЕ карты, кроме самой себя. Два короля пики не могут биться друг с другом - это ничья!',
    elementSelector: '[data-tutorial="table-area"]',
  },
  {
    id: 'beat-king',
    title: 'Как побить короля пики',
    description: 'Побить короля пики можно ТОЛЬКО другим королём пики. Никакая другая карта не может его побить, даже козырь! Это главное исключение в игре.',
    elementSelector: '[data-tutorial="table-area"]',
  },
  {
    id: 'card-777',
    title: 'Механика карты 777',
    description: 'Карта 777 имеет особую механику: она может быть использована как переводная карта (передать ход другому игроку вместо того, чтобы брать карты).',
    elementSelector: '[data-tutorial="player-hand"]',
  },
  {
    id: 'transfer-card',
    title: 'Переводная карта',
    description: 'Переводная карта позволяет передать ход другому игроку вместо того, чтобы брать карты со стола. Это может быть 777 или другие карты в зависимости от правил комнаты.',
    elementSelector: '[data-tutorial="table-area"]',
  },
  {
    id: 'skip-card',
    title: 'Проездная карта',
    description: 'Проездная карта позволяет пропустить ход и не брать карты со стола. После проездной карты ход переходит к следующему игроку.',
    elementSelector: '[data-tutorial="table-area"]',
  },
  {
    id: 'card-6',
    title: 'Механика карты 6',
    description: 'Карта 6 имеет специальное действие: она может использоваться для определённых комбинаций и стратегий. Запомните эту карту!',
    elementSelector: '[data-tutorial="player-hand"]',
  },
  {
    id: 'card-10',
    title: 'Механика карты 10',
    description: 'Карта 10 - вторая по силе карта после короля пики! Она бьет все карты, кроме короля пики и другой 10. Это очень сильная карта!',
    elementSelector: '[data-tutorial="player-hand"]',
  },
  {
    id: 'trump-cards',
    title: 'Потайные козыри',
    description: 'Козырные карты имеют особую силу. Они могут бить карты других мастей в определённых ситуациях. Смотрите на козырь вверху - это текущий козырь игры!',
    elementSelector: '[data-tutorial="trump-indicator"]',
  },
];

export function useTutorial() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  const currentStep = TUTORIAL_STEPS[currentStepIndex];

  const updateTargetElement = useCallback(() => {
    if (!currentStep) return;
    const element = document.querySelector(currentStep.elementSelector) as HTMLElement | null;
    setTargetElement(element);
  }, [currentStep]);

  const goToNextStep = useCallback(() => {
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      updateTargetElement();
    } else {
      // Tutorial completed
      setIsActive(false);
      return true; // Signal completion
    }
    return false;
  }, [currentStepIndex, updateTargetElement]);

  const skipTutorial = useCallback(() => {
    setIsActive(false);
    setCurrentStepIndex(0);
  }, []);

  const startTutorial = useCallback(() => {
    setIsActive(true);
    setCurrentStepIndex(0);
    updateTargetElement();
  }, [updateTargetElement]);

  return {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps: TUTORIAL_STEPS.length,
    targetElement,
    startTutorial,
    goToNextStep,
    skipTutorial,
    updateTargetElement,
  };
}
