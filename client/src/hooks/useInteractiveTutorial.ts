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
  /** Cards on table. Each entry can be a simple card string (attack only) or a pair {attack, defense} */
  tableCards?: { playerId: number; cards: (string | { attack: string; defense: string })[] }[];
  /** What player must do */
  requiredAction?: 'click-card' | 'click-button' | 'click-sort' | 'none';
  /** Card to click if requiredAction is 'click-card' */
  targetCard?: string;
  /** What bot does after player action */
  botAction?: string;
  /** Force text position: 'center' puts text in center of screen, 'top' puts it at top */
  textPosition?: 'auto' | 'center' | 'top' | 'bottom';
  /** Number of cards in discard pile */
  discardCount?: number;
  /** Trump card shown under deck (e.g. 'Qh' = Queen of hearts) */
  trumpCard?: string;
  /** Card notations to visually highlight (raise + glow) in player hand */
  highlightCards?: string[];
  /** Whether to show arrows from text to highlighted elements (default: true) */
  showArrows?: boolean;
  /** When true, clicking a target card auto-defends all matching table cards with matching hand cards */
  autoDefend?: boolean;
  /** Sequential defense: player clicks cards one by one to defend, then bito animation plays */
  sequentialDefend?: {
    /** Card notation for each defense step (e.g. ['6h', '6h']) */
    defenseCards: string[];
    /** Whether to highlight attack cards on the table */
    highlightTableCards?: boolean;
    /** Skip bito animation after all defenses — just enable Next button */
    noBitoAnimation?: boolean;
    /** Show arrow from table area to the Next button after all defenses */
    showArrowToNextButton?: boolean;
    /** Cards already defended from a previous step (shown as overlays from the start) */
    preDefendedCards?: string[];
  };
  /** Transfer mechanic: player clicks card, then clicks "Перевести" button */
  transferMechanic?: {
    /** Card to transfer with */
    transferCard: string;
    /** Name of the bot the turn is transferred to */
    targetBotName: string;
  };
  /** Number of extra bots to show (besides the main opponent) */
  extraBots?: number;
  /** Custom names for extra bots (if not set, defaults to 'Бот 2', 'Бот 3', etc.) */
  extraBotNames?: string[];
  /** Override which player index is the attacker (0=player, 1=first bot, 2=second extra bot, etc.) */
  attackerPlayerIdx?: number;
  /** Override which player index is the defender */
  defenderPlayerIdx?: number;
  /** Custom arrows between game elements (e.g. clockwise direction arrows) */
  customArrows?: {
    /** CSS selector for start element */
    from: string;
    /** CSS selector for end element */
    to: string;
    /** Arrow color (default: yellow) */
    color?: string;
  }[];
  /** Show pass-through (проездной) icon under a specific bot by player index */
  passThroughBotIdx?: number;
  /** Override the main bot's name for this step */
  overrideMainBotName?: string;
  /** Indices of opponents to add a glow effect around (1=first bot, 2=second, etc.) */
  glowOpponents?: number[];
  /** Card notations to highlight GREEN and raise in player hand */
  highlightCardsGreen?: string[];
  /** Card notations to highlight RED (no raise) in player hand */
  highlightCardsRed?: string[];
  /** Throw-cards mechanic: player clicks green-highlighted cards to throw them onto the table */
  throwCards?: {
    /** Card notations the player can throw (e.g. ['6h','6d','6c']) */
    throwableCards: string[];
    /** Minimum cards to throw before Next is enabled (default: 1) */
    minThrows?: number;
  };
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
    title: 'Как это работает?',
    description: 'Практика одинаковых карт',
    highlightElements: ['[data-tutorial="player-hand"]', '[data-tutorial="table-area"]'],
    text: 'Нажмите на 6 черви чтобы отбиться. Карты с одинаковым номиналом и мастью бьют сами себя',
    instruction: 'Нажмите на 6 черви в вашей руке',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    tableCards: [{ playerId: 1, cards: ['6h', '6h'] }],
    requiredAction: 'click-card',
    targetCard: '6h',
    trumpCard: 'Qh',
    discardCount: 10,
    highlightCards: ['6h', '6h'],
    showArrows: false,
    textPosition: 'top',
    sequentialDefend: {
      defenseCards: ['6h', '6h'],
      highlightTableCards: true,
    },
  },
  {
    id: 10,
    title: 'Король пики - бьет все, независимо от козыря',
    description: 'Специальные карты',
    highlightElements: ['[data-tutorial="player-hand"]', '[data-tutorial="table-area"]'],
    text: 'У вас в руке есть карта Король пики - найдите её. Это очень сильная карта с уникальной механикой. Он может побить любую карту в игре, независимо от козыря, <red>кроме самого себя</red>. Побейте королем пики козырный туз на столе',
    instruction: 'Нажмите на Короля пики в вашей руке',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    tableCards: [{ playerId: 1, cards: ['Ah'] }],
    requiredAction: 'click-card',
    targetCard: 'Ks',
    trumpCard: 'Qh',
    discardCount: 10,
    highlightCards: ['Ks'],
    showArrows: false,
    textPosition: 'top',
    sequentialDefend: {
      defenseCards: ['Ks'],
      highlightTableCards: true,
    },
  },
  {
    id: 11,
    title: 'Карта 777 - бьет все карты в игре',
    description: 'Специальные карты',
    highlightElements: ['[data-tutorial="player-hand"]', '[data-tutorial="table-area"]'],
    text: '777 - бьет любую карту! В колоде всего одна.\nС карты 777 нельзя походить! Только биться. Если в конце игры у вас осталась только эта карта в руке, и начинается ваш ход - вы его пропустите',
    instruction: 'Нажмите на 777 в вашей руке',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    tableCards: [{ playerId: 1, cards: ['Ks', 'Ks'] }],
    requiredAction: 'click-card',
    targetCard: '777',
    trumpCard: 'Qh',
    discardCount: 10,
    highlightCards: ['777'],
    showArrows: false,
    textPosition: 'top',
    sequentialDefend: {
      defenseCards: ['777'],
      highlightTableCards: true,
      noBitoAnimation: true,
      showArrowToNextButton: true,
    },
  },
  {
    id: 12,
    title: 'Туз пики - уникальная механика',
    description: 'Специальные карты',
    highlightElements: ['[data-tutorial="player-hand"]', '[data-tutorial="table-area"]'],
    text: 'Короля пики может побить только Туз пики и 777, больше никакая карта не в силах сделать этого\nНайдите в своей руке Туз пики. Нажмите на него чтобы отбить короля пики на столе',
    instruction: 'Нажмите на Туз пики в вашей руке',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    trumpCard: 'Qh',
    // Table: two Ks, first one already beaten by 777 (carried over from step 11)
    tableCards: [{ playerId: 1, cards: ['Ks', 'Ks'] }],
    requiredAction: 'click-card',
    targetCard: 'As',
    discardCount: 10,
    highlightCards: ['As'],
    showArrows: false,
    textPosition: 'top',
    sequentialDefend: {
      defenseCards: ['As'],
      highlightTableCards: true,
      noBitoAnimation: false,
      preDefendedCards: ['777'],
    },
  },
  {
    id: 13,
    title: 'Переводной',
    description: 'Механика перевода',
    highlightElements: ['[data-tutorial="player-hand"]', '[data-tutorial="table-area"]'],
    text: 'Игра всегда с механикой переводного. Если на вас походили картой, и у вас в руке есть карта с таким же номиналом (индексом), вы можете перевести ход на следующего игрока, выкинув эту карту на стол',
    instruction: 'Нажмите на 7 пики в вашей руке',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    trumpCard: 'Qh',
    tableCards: [{ playerId: 1, cards: ['7d', '7c', '7d'] }],
    requiredAction: 'click-card',
    targetCard: '7s',
    discardCount: 10,
    highlightCards: ['7s'],
    showArrows: false,
    textPosition: 'top',
    extraBots: 2,
    extraBotNames: ['Мадина', 'Бот 3'],
    transferMechanic: {
      transferCard: '7s',
      targetBotName: 'Мадина',
    },
  },
  {
    id: 14,
    title: 'Ход по часовой стрелке',
    description: 'Направление игры',
    highlightElements: ['[data-tutorial="opponent-info"]:nth-of-type(1)', '[data-tutorial="opponent-info"]:nth-of-type(2)', '[data-tutorial="opponent-info"]:nth-of-type(3)'],
    text: 'Игроки ходят друг на друга по часовой стрелке, но есть исключение:\nЕсли какой-то игрок начинает свой ход с 10-ки, выкинув ее на стол, <red>направление игры меняется</red> на против часовой стрелки',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    trumpCard: 'Qh',
    requiredAction: 'click-button',
    discardCount: 10,
    textPosition: 'center',
    showArrows: false,
    extraBots: 2,
    extraBotNames: ['Мадина', 'Бот 3'],
    attackerPlayerIdx: 3,
    defenderPlayerIdx: 0,
    customArrows: [
      // Мадина → Бот 2 (под иконкой)
      { from: '[data-tutorial="opponent-info"]:nth-of-type(1)', to: '[data-tutorial="opponent-info"]:nth-of-type(2)', color: '#facc15' },
      // Бот 2 → Бот 3 (под иконкой)
      { from: '[data-tutorial="opponent-info"]:nth-of-type(2)', to: '[data-tutorial="opponent-info"]:nth-of-type(3)', color: '#facc15' },
      // Бот 3 → Player hand (обходя текст)
      { from: '[data-tutorial="opponent-info"]:nth-of-type(3)', to: '[data-tutorial="player-hand"]', color: '#facc15' },
      // Player hand → Мадина (обходя текст)
      { from: '[data-tutorial="player-hand"]', to: '[data-tutorial="opponent-info"]:nth-of-type(1)', color: '#facc15' },
    ],
  },
  {
    id: 15,
    title: 'Ход с 10-ки',
    description: 'Смена направления',
    highlightElements: ['[data-tutorial="opponent-info"]:nth-of-type(3)', '[data-tutorial="player-hand"]'],
    text: 'Если игрок начинает свой ход с карты 10, то меняется направление игры. Сейчас ход Бота 3, он должен походить на вас',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    trumpCard: 'Qh',
    requiredAction: 'click-button',
    discardCount: 10,
    textPosition: 'center',
    showArrows: false,
    extraBots: 2,
    extraBotNames: ['Мадина', 'Бот 3'],
    attackerPlayerIdx: 3,
    defenderPlayerIdx: 0,
  },
  {
    id: 16,
    title: 'Игрок Бот 3 начал свой ход с 10-ки, поменяв направление игры.',
    description: 'Смена направления — 10-ка на столе',
    highlightElements: ['[data-tutorial="opponent-info"]:nth-of-type(3)', '[data-tutorial="opponent-info"]:nth-of-type(2)', '[data-tutorial="table-area"]'],
    text: 'Теперь Бот 3 ходит не на вас, а на игрока Мадина',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    trumpCard: 'Qh',
    requiredAction: 'click-button',
    discardCount: 10,
    textPosition: 'bottom',
    showArrows: false,
    extraBots: 2,
    extraBotNames: ['Мадина', 'Бот 3'],
    attackerPlayerIdx: 3,
    defenderPlayerIdx: 2,
    tableCards: [{ playerId: 2, cards: ['10d'] }],
  },
  {
    id: 17,
    title: 'Перевод карты возвращает предыдущее направление игры',
    description: 'Перевод 10-кой возвращает направление',
    highlightElements: ['[data-tutorial="opponent-info"]:nth-of-type(2)', '[data-tutorial="opponent-info"]:nth-of-type(3)', '[data-tutorial="table-area"]'],
    text: 'Игрок Мадина перевела 10-кой пики ход на игрока Бот 3. Теперь игра снова идет по часовой стрелке.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    trumpCard: 'Qh',
    requiredAction: 'click-button',
    discardCount: 10,
    textPosition: 'bottom',
    showArrows: false,
    extraBots: 2,
    extraBotNames: ['Мадина', 'Бот 3'],
    attackerPlayerIdx: 2,
    defenderPlayerIdx: 3,
    tableCards: [{ playerId: 2, cards: ['10d', '10s'] }],
  },
  {
    id: 18,
    title: 'На 10-ку распространяется проездной',
    description: 'Проездной с козырной 10-кой',
    highlightElements: ['[data-tutorial="opponent-info"]:nth-of-type(3)', '[data-tutorial="table-area"]'],
    text: 'У игрока Бот 3 в руке была козырная 10-ка, он воспользовался проездным, и перевел ход снова на игрока Мадина. Сменив направление игры.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    trumpCard: 'Qh',
    requiredAction: 'click-button',
    discardCount: 10,
    textPosition: 'bottom',
    showArrows: false,
    extraBots: 2,
    extraBotNames: ['Мадина', 'Бот 3'],
    attackerPlayerIdx: 3,
    defenderPlayerIdx: 2,
    tableCards: [{ playerId: 2, cards: ['10d', '10s'] }],
    passThroughBotIdx: 3,
  },
  // Step 19: 6-ка вне очереди
  {
    id: 19,
    title: '6-ка вне очереди',
    description: 'Подкидывание 6-ки любым игроком',
    text: 'По правилам игры, обороняющемуся игроку могут подкидывать только соседи. Но если кто-то походил с 6-ки, то любой игрок за столом может подкинуть 6-ки, даже если не является соседом',
    highlightElements: ['[data-tutorial="table-area"]'],
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    trumpCard: 'Qh',
    requiredAction: 'none',
    discardCount: 10,
    textPosition: 'bottom',
    showArrows: false,
    extraBots: 2,
    extraBotNames: ['Мадина', 'Бот 3'],
    overrideMainBotName: 'Камила',
    attackerPlayerIdx: 1,
    defenderPlayerIdx: 2,
    tableCards: [{ playerId: 1, cards: [
      { attack: '6s', defense: '10s' },
      { attack: '6d', defense: '10d' },
    ] }],
    glowOpponents: [1, 2], // Камила and Мадина
  },
  // Step 20: Подкидывание 6-ок
  {
    id: 20,
    title: '6-ка вне очереди',
    description: 'Подкидывание 6-ок на стол',
    text: 'У Камилы и Бота 3 в руке нет карт, которые они могли бы подкинуть, но так как Камила изначально походила с 6-ки, ход перешел к вам. Вы можете подкинуть 6-ки Мадине, хоть и не являетесь ее соседом. Десятки в данном случае подкидывать нельзя.',
    highlightElements: ['[data-tutorial="player-hand"]'],
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    trumpCard: 'Qh',
    requiredAction: 'none',
    discardCount: 10,
    textPosition: 'bottom',
    showArrows: false,
    extraBots: 2,
    extraBotNames: ['Мадина', 'Бот 3'],
    overrideMainBotName: 'Камила',
    attackerPlayerIdx: -1,
    defenderPlayerIdx: 2,
    tableCards: [{ playerId: 1, cards: [
      { attack: '6s', defense: '10s' },
      { attack: '6d', defense: '10d' },
    ] }],
    glowOpponents: [2], // Only Мадина
    highlightCardsGreen: ['6h', '6h', '6d', '6c'],
    highlightCardsRed: ['10h', '10c', '10d', '10s'],
    throwCards: {
      throwableCards: ['6h', '6h', '6d', '6c'],
      minThrows: 1,
    },
  },
  // Step 21: Duplicate of step 4 (Две колоды в игре)
  {
    id: 21,
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
