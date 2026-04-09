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
    title: 'Интерфейс игры',
    description: 'Это основной интерфейс игры. Слева ваши карты, справа информация о противниках, в центре игровой стол.',
    elementSelector: '[data-tutorial="game-table"]',
  },
  {
    id: 'deck-info',
    title: 'Информация о колодах',
    description: 'В игре используется 2 колоды (104 карты). Каждому игроку раздаётся 6 карт в начале игры.',
    elementSelector: '[data-tutorial="deck-info"]',
  },
  {
    id: 'first-beat',
    title: 'Первая бито (13 карт)',
    description: 'Первый ход начинается с 13 карт. После этого игроки бьют столько карт, сколько есть у них в руке. Количество карт может быть неограниченным.',
    elementSelector: '[data-tutorial="table-area"]',
  },
  {
    id: 'nominal-cards',
    title: 'Карты с одинаковым номиналом',
    description: 'Карты с одинаковым номиналом (например, две семёрки) бьют сами себя. Вы можете положить карту на карту противника, если они одного номинала.',
    elementSelector: '[data-tutorial="player-hand"]',
  },
  {
    id: 'king-of-spades',
    title: 'Король пики - уникальная механика',
    description: 'Король пики - самая сильная карта! Она бьет все карты, кроме самой себя. Два короля пики не могут биться друг с другом.',
    elementSelector: '[data-tutorial="table-area"]',
  },
  {
    id: 'beat-king',
    title: 'Как побить короля пики',
    description: 'Побить короля пики можно только другим королём пики. Никакая другая карта не может его побить.',
    elementSelector: '[data-tutorial="table-area"]',
  },
  {
    id: 'card-777',
    title: 'Механика карты 777',
    description: 'Карта 777 имеет особую механику: она может быть использована как переводная карта (перевести ход другому игроку).',
    elementSelector: '[data-tutorial="player-hand"]',
  },
  {
    id: 'transfer-card',
    title: 'Переводная карта',
    description: 'Переводная карта позволяет передать ход другому игроку вместо того, чтобы брать карты.',
    elementSelector: '[data-tutorial="table-area"]',
  },
  {
    id: 'skip-card',
    title: 'Проездная карта',
    description: 'Проездная карта позволяет пропустить ход и не брать карты со стола.',
    elementSelector: '[data-tutorial="table-area"]',
  },
  {
    id: 'card-6',
    title: 'Механика карты 6',
    description: 'Карта 6 имеет специальное действие в игре. Она может использоваться для определённых комбинаций.',
    elementSelector: '[data-tutorial="player-hand"]',
  },
  {
    id: 'card-10',
    title: 'Механика карты 10',
    description: 'Карта 10 - вторая по силе карта после короля пики. Она бьет все карты, кроме короля пики и другой 10.',
    elementSelector: '[data-tutorial="player-hand"]',
  },
  {
    id: 'trump-cards',
    title: 'Потайные козыри',
    description: 'Козырные карты имеют особую силу. Они могут бить карты других мастей в определённых ситуациях.',
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
