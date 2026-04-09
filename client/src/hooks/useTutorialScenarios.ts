import { ClientGameState } from '@shared/gameTypes';

export interface TutorialScenario {
  stepId: string;
  title: string;
  description: string;
  situation: string; // Описание ситуации на столе
  highlights: Array<{
    element: string; // CSS selector или элемент для выделения
    label: string; // Текст подсказки
    position: 'top' | 'bottom' | 'left' | 'right'; // Позиция стрелки
  }>;
  actions?: Array<{
    type: 'show' | 'highlight' | 'arrow';
    target: string;
    text: string;
  }>;
}

const TUTORIAL_SCENARIOS: TutorialScenario[] = [
  {
    stepId: 'interface',
    title: 'Добро пожаловать в Дурак!',
    description: 'Это основной интерфейс игры',
    situation: 'Игра только начинается. Вы видите свои 6 карт в руке, соперников слева и справа, и игровой стол в центре.',
    highlights: [
      {
        element: '[data-tutorial="player-hand"]',
        label: 'Ваши карты в руке',
        position: 'top',
      },
      {
        element: '[data-tutorial="table-area"]',
        label: 'Игровой стол',
        position: 'bottom',
      },
      {
        element: '[data-tutorial="deck-info"]',
        label: 'Информация о колодах',
        position: 'bottom',
      },
    ],
  },
  {
    stepId: 'deck-info',
    title: 'Количество карт в игре',
    description: 'В игре используется 2 колоды (104 карты всего)',
    situation: 'К1 и К2 - это две колоды. Каждому игроку в начале раздаётся 6 карт. По мере игры карты добираются из колод.',
    highlights: [
      {
        element: '[data-tutorial="deck-info"]',
        label: 'К1=52, К2=52 (всего 104 карты)',
        position: 'bottom',
      },
    ],
  },
  {
    stepId: 'first-beat',
    title: 'Правило первой биты (13 карт)',
    description: 'Первый ход начинается с 13 карт!',
    situation: 'Атакующий может положить на стол до 13 карт в первом ходу. После этого в следующих ходах количество карт ограничено количеством карт в руке защищающегося.',
    highlights: [
      {
        element: '[data-tutorial="table-area"]',
        label: 'На столе может быть до 13 карт в первый ход',
        position: 'bottom',
      },
    ],
  },
  {
    stepId: 'nominal-cards',
    title: 'Карты с одинаковым номиналом',
    description: 'Карты с одинаковым номиналом бьют сами себя!',
    situation: 'Если на столе лежит 7♠, вы можете положить на неё 7♥, 7♦ или 7♣. Это очень важное правило!',
    highlights: [
      {
        element: '[data-tutorial="table-area"]',
        label: 'Положите карту того же номинала на карту противника',
        position: 'bottom',
      },
    ],
  },
  {
    stepId: 'king-of-spades',
    title: 'Король пики - король всех карт',
    description: 'Король пики (♠K) - самая сильная карта!',
    situation: 'Король пики бьет ВСЕ карты, кроме самой себя. Два короля пики не могут биться друг с другом - это ничья!',
    highlights: [
      {
        element: '[data-tutorial="player-hand"]',
        label: 'Король пики - самая сильная карта',
        position: 'top',
      },
    ],
  },
  {
    stepId: 'beat-king',
    title: 'Как побить короля пики',
    description: 'Побить короля пики можно ТОЛЬКО другим королём пики',
    situation: 'Никакая другая карта не может побить короля пики, даже козырь! Это главное исключение в игре.',
    highlights: [
      {
        element: '[data-tutorial="table-area"]',
        label: 'Только король пики может побить короля пики',
        position: 'bottom',
      },
    ],
  },
  {
    stepId: 'card-777',
    title: 'Механика карты 777',
    description: 'Карта 777 имеет особую механику',
    situation: 'Карта 777 может быть использована как переводная карта (передать ход другому игроку вместо того, чтобы брать карты).',
    highlights: [
      {
        element: '[data-tutorial="player-hand"]',
        label: '777 - специальная карта',
        position: 'top',
      },
    ],
  },
  {
    stepId: 'transfer-card',
    title: 'Переводная карта',
    description: 'Переводная карта передаёт ход другому игроку',
    situation: 'Вместо того чтобы брать карты со стола, вы можете положить переводную карту и передать ход следующему игроку.',
    highlights: [
      {
        element: '[data-tutorial="table-area"]',
        label: 'Положите переводную карту',
        position: 'bottom',
      },
    ],
  },
  {
    stepId: 'skip-card',
    title: 'Проездная карта',
    description: 'Проездная карта пропускает ход',
    situation: 'После проездной карты ход переходит к следующему игроку, и вы не берёте карты со стола.',
    highlights: [
      {
        element: '[data-tutorial="table-area"]',
        label: 'Положите проездную карту',
        position: 'bottom',
      },
    ],
  },
  {
    stepId: 'card-6',
    title: 'Механика карты 6',
    description: 'Карта 6 имеет специальное действие',
    situation: 'Карта 6 может использоваться для определённых комбинаций и стратегий. Запомните эту карту!',
    highlights: [
      {
        element: '[data-tutorial="player-hand"]',
        label: '6 - специальная карта',
        position: 'top',
      },
    ],
  },
  {
    stepId: 'card-10',
    title: 'Механика карты 10',
    description: 'Карта 10 - вторая по силе карта!',
    situation: 'Карта 10 бьет все карты, кроме короля пики и другой 10. Это очень сильная карта!',
    highlights: [
      {
        element: '[data-tutorial="player-hand"]',
        label: '10 - вторая по силе карта',
        position: 'top',
      },
    ],
  },
  {
    stepId: 'trump-cards',
    title: 'Потайные козыри',
    description: 'Козырные карты имеют особую силу',
    situation: 'Козырные карты могут бить карты других мастей в определённых ситуациях. Смотрите на козырь вверху - это текущий козырь игры!',
    highlights: [
      {
        element: '[data-tutorial="trump-indicator"]',
        label: 'Это текущий козырь',
        position: 'bottom',
      },
    ],
  },
];

export function useTutorialScenarios() {
  const getScenario = (stepId: string): TutorialScenario | undefined => {
    return TUTORIAL_SCENARIOS.find(s => s.stepId === stepId);
  };

  const getAllScenarios = (): TutorialScenario[] => {
    return TUTORIAL_SCENARIOS;
  };

  return {
    getScenario,
    getAllScenarios,
    totalScenarios: TUTORIAL_SCENARIOS.length,
  };
}
