import { useState, useCallback } from 'react';

export interface TutorialScenario {
  id: number;
  title: string;
  /** Title in Kazakh */
  titleKk?: string;
  /** Title in English */
  titleEn?: string;
  /** Title in Ukrainian */
  titleUk?: string;
  /** Title in Georgian */
  titleKa?: string;
  /** Title in Azerbaijani */
  titleAz?: string;
  description: string;
  /** Array of CSS selectors for highlighted areas (multiple spotlights supported) */
  highlightElements: string[];
  text: string;
  /** Text in Kazakh */
  textKk?: string;
  /** Text in English */
  textEn?: string;
  /** Text in Ukrainian */
  textUk?: string;
  /** Text in Georgian */
  textKa?: string;
  /** Text in Azerbaijani */
  textAz?: string;
  instruction?: string;
  /** Instruction in Kazakh */
  instructionKk?: string;
  /** Instruction in English */
  instructionEn?: string;
  /** Instruction in Ukrainian */
  instructionUk?: string;
  /** Instruction in Georgian */
  instructionKa?: string;
  /** Instruction in Azerbaijani */
  instructionAz?: string;
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
    /** Name of the bot in English */
    targetBotNameEn?: string;
    /** Name of the bot in Kazakh */
    targetBotNameKk?: string;
    /** Name of the bot in Ukrainian */
    targetBotNameUk?: string;
    /** Name of the bot in Azerbaijani */
    targetBotNameAz?: string;
  };
  /** Number of extra bots to show (besides the main opponent) */
  extraBots?: number;
  /** Custom names for extra bots (if not set, defaults to 'Бот 2', 'Бот 3', etc.) */
  extraBotNames?: string[];
  /** Custom names for extra bots in English */
  extraBotNamesEn?: string[];
  /** Custom names for extra bots in Kazakh */
  extraBotNamesKk?: string[];
  /** Custom names for extra bots in Ukrainian */
  extraBotNamesUk?: string[];
  /** Custom names for extra bots in Azerbaijani */
  extraBotNamesAz?: string[];
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
  /** Override the main bot's name in English */
  overrideMainBotNameEn?: string;
  /** Override the main bot's name in Kazakh */
  overrideMainBotNameKk?: string;
  /** Override the main bot's name in Ukrainian */
  overrideMainBotNameUk?: string;
  /** Override the main bot's name in Azerbaijani */
  overrideMainBotNameAz?: string;
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
  /** Override deck1 card count (default: 59) */
  deck1Count?: number;
  /** Override deck2 card count (default: 58) */
  deck2Count?: number;
  /** Hidden trump card 1 (revealed when deck1 is empty, e.g. 'Ac' = Ace of clubs) */
  hiddenTrumpCard1?: string;
  /** Override text for mobile view */
  mobileText?: string;
  /** Override text for mobile view in Kazakh */
  mobileTextKk?: string;
  /** Override text for mobile view in English */
  mobileTextEn?: string;
  /** Override text for mobile view in Ukrainian */
  mobileTextUk?: string;
  /** Override text for mobile view in Azerbaijani */
  mobileTextAz?: string;
  /** Override text position for mobile view: 'bottom' puts text near player hand */
  mobileTextPosition?: 'auto' | 'center' | 'top' | 'bottom';
  /** Additional highlight elements for mobile only */
  mobileHighlightElements?: string[];
  /** Add glow effect around the table area */
  glowTableArea?: boolean;
  /** Add glow effect around the mobile trump indicator */
  glowMobileTrump?: boolean;
  /** Whether this is the last step — shows 'Завершить обучение' instead of 'Далее' */
  isLastStep?: boolean;
  /** Custom text for the finish button (default: 'Завершить обучение') */
  finishButtonText?: string;
}

// Standard player hand for all tutorial scenarios (14 cards, includes 777)
const STANDARD_PLAYER_HAND = ['Ks', 'As', '777', '6h', '6h', '6d', '6c', 'Jc', 'Jc', '10h', '10c', '10d', '10s', '7s'];
// Standard bot hand for all tutorial scenarios (14 cards)
const STANDARD_BOT_HAND = ['Ks', 'As', 'Ks', '6h', '6h', '6d', '6c', 'Jc', 'Jc', '10h', '10c', '10d', '10s', '7s'];

const TUTORIAL_SCENARIOS: TutorialScenario[] = [
  {
    id: 1,
    title: 'Количество карт в руке',
    titleKk: 'Қолдағы карта саны',
    titleEn: 'Cards in Hand',
    titleUk: 'Кількість карт у руці',
    titleAz: 'Əldəki kart sayı',
    description: 'Понимание базовых правил',
    highlightElements: ['[data-tutorial="player-hand"]', '[data-tutorial="opponent-info"]'],
    text: 'Вначале игры всем игрокам раздается по 14 карт.\nВ руке игрока всегда должно быть минимум 14 карт, пока в колодах есть карты.',
    textKk: 'Ойын басында әр ойыншыға 14 карта бөлінеді.\nКолодаларда карта бар кезде ойыншы қолында әрқашан да 14 карта болуы керек.',
    textEn: 'At the start of the game, each player is dealt 14 cards.\nA player must always have at least 14 cards in hand while there are cards in the decks.',
    textUk: 'На початку гри кожному гравцю роздається по 14 карт.\nУ руці гравця завжди має бути мінімум 14 карт, поки в колодах є карти.',
    textKa: 'თამაშის დასაწყისში თითოეულ მოთამაშეს ურიგდება 14 ბარათი.\nმოთამაშის ხელში ყოველთვის უნდა იყოს მინიმუმ 14 ბარათი, სანამ გემბნებში ბარათებია.',
    textAz: 'Oyunun əvvəlində hər oyunçuya 14 kart paylanır.\nDəstələrdə kart olduğu müddətcə oyunçunun əlində həmişə minimum 14 kart olmalıdır.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    instructionKk: '"Келесі" басыңыз',
    instructionEn: 'Click "Next" to continue',
    instructionUk: 'Натисніть "Далі" щоб продовжити',
    instructionAz: '"Növbəti" düyməsini basın',
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
    titleKk: 'Қадам таймері',
    titleEn: 'Turn Timer',
    titleUk: 'Таймер ходу',
    titleAz: 'Növbə taymerı',
    description: 'Интерфейс игры',
    highlightElements: ['[data-tutorial="timer"]', '[data-tutorial="timer-desktop"]'],
    text: 'Это таймер хода. У каждого игрока есть определенное количество секунд на ход, которое устанавливается в настройках каждой комнаты. Когда время истекает — ход переходит к следующему игроку.',
    textKk: 'Бұл қадам таймері. Әр ойыншының қадамына әр бөлме баптауларында белгіленетін секунд саны бөлінеді. Уақыт аяқталса — қадам келесі ойыншыға өтеді.',
    textEn: 'This is the turn timer. Each player has a set number of seconds per turn, configured in each room\'s settings. When time runs out, the turn passes to the next player.',
    textUk: 'Це таймер ходу. Кожен гравець має певну кількість секунд на хід, яка встановлюється в налаштуваннях кімнати. Коли час закінчується — хід переходить до наступного гравця.',
    textKa: 'ეს არის სვლის ტაიმერი. თითოეულ მოთამაშეს აქვს გარკვეული წამები სვლისთვის, რომელიც დგინდება ოთახის პარამეტრებში. დროის ამოწურვისას — სვლა გადადის შემდეგ მოთამაშეზე.',
    textAz: 'Bu növbə taymerıdır. Hər oyunçunun növbəsi üçün müəyyən sayda saniyəsi var, bu hər otağın parametrlərində təyin edilir. Vaxt bitdikdə — növbə növbəti oyunçuya keçir.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    instructionKk: '"Келесі" басыңыз',
    instructionEn: 'Click "Next" to continue',
    instructionUk: 'Натисніть "Далі" щоб продовжити',
    instructionAz: '"Növbəti" düyməsini basın',
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
    titleKk: 'Бито санағышы',
    titleEn: 'Discard Counter',
    titleUk: 'Лічильник бито',
    titleAz: 'Bito sayğacı',
    description: 'Интерфейс игры',
    highlightElements: ['[data-tutorial="bito-counter"]', '[data-tutorial="mobile-bito"]'],
    text: 'Это счетчик карт в бито (побитых карт). Показывает сколько карт уже выбыло из игры.',
    textKk: 'Бұл битодағы (ұтылған) карталар санағышы. Ойыннан қанша карталар санын көрсетеді.',
    textEn: 'This is the discard pile counter (beaten cards). It shows how many cards have already been eliminated from the game.',
    textUk: 'Це лічильник карт у бито (побитих карт). Показує скільки карт вже вибуло з гри.',
    textKa: 'ეს არის ამოღებული ბარათების მრიცხველი. გვიჩვენებს რამდენი ბარათი უკვე გამოვიდა თამაშიდან.',
    textAz: 'Bu bito (vurulmuş kartlar) sayğacıdır. Oyundan neçə kartın çıxdığını göstərir.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    instructionKk: '"Келесі" басыңыз',
    instructionEn: 'Click "Next" to continue',
    instructionUk: 'Натисніть "Далі" щоб продовжити',
    instructionAz: '"Növbəti" düyməsini basın',
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
    titleKk: 'Ойында екі колода',
    titleEn: 'Two Decks in the Game',
    titleUk: 'Дві колоди в грі',
    titleAz: 'Oyunda iki dəstə',
    description: 'Структура игры',
    highlightElements: ['[data-tutorial="deck-area"]', '[data-tutorial="mobile-decks"]'],
    text: 'В игре используются 2 колоды карт. Сначала разыгрывается колода №1 между всеми игроками. Когда она заканчивается, начинается колода №2.',
    textKk: 'Ойында 2 карта колодасы пайдаланылады. Алдымен колода №1 барлық ойыншылар арасында ойналады. Ол біткенде, колода №2 басталады.',
    textEn: 'The game uses 2 card decks. First, deck #1 is played among all players. When it runs out, deck #2 begins.',
    textUk: 'У грі використовуються 2 колоди карт. Спочатку розігрується колода №1 між усіма гравцями. Коли вона закінчується, починається колода №2.',
    textKa: 'თამაშში გამოიყენება 2 გემბანი ბარათი. პირველად ყველა მოთამაშეს შორის ითამაშება გემბანი №1. მისი ამოწურვისას იწყება გემბანი №2.',
    textAz: 'Oyunda 2 dəstə kart istifadə olunur. Əvvəlcə bütün oyunçular arasında №1 dəstə oynanır. O bitdikdə №2 dəstə başlayır.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    instructionKk: '"Келесі" басыңыз',
    instructionEn: 'Click "Next" to continue',
    instructionUk: 'Натисніть "Далі" щоб продовжити',
    instructionAz: '"Növbəti" düyməsini basın',
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
    titleKk: 'Сұрыптау және карта санағышы',
    titleEn: 'Sort and Card Counter',
    titleUk: 'Сортування та лічильник карт',
    titleAz: 'Çeşidləmə və kart sayğacı',
    description: 'Интерфейс игры',
    highlightElements: ['[data-tutorial="player-card-count"]', '[data-tutorial="sort-button"]'],
    text: 'Счетчик карт показывает количество карт в вашей руке в реальном времени.\nКнопкой сортировки вы меняете расположение карт в руке',
    textKk: 'Карта санағышы қолыңыздағы карталар санын нақты уақытта көрсетеді.\nСұрыптау түймесі арқылы қолдағы карталардың орналасуын өзгертеді',
    textEn: 'The card counter shows the number of cards in your hand in real time.\nThe sort button changes the arrangement of cards in your hand.',
    textUk: 'Лічильник карт показує кількість карт у вашій руці в реальному часі.\nКнопка сортування змінює розташування карт у руці.',
    textKa: 'ბარათების მრიცხველი გვიჩვენებს ბარათების რაოდენობას თქვენს ხელში რეალურ დროში.\nდახარისხების ღილაკი ცვლის ბარათების განლაგებას ხელში.',
    textAz: 'Kartları çeşidləmək üçün "Çeşidlə" düyməsini basın. Sayğac əldəki kartların sayını göstərir.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    instructionKk: '"Келесі" басыңыз',
    instructionEn: 'Click "Next" to continue',
    instructionUk: 'Натисніть "Далі" щоб продовжити',
    instructionAz: '"Çeşidlə" düyməsini basın',
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
    titleKk: 'Сұрыптауды қолданыңыз',
    titleEn: 'Try Sorting',
    titleUk: 'Спробуйте сортування',
    titleAz: 'Çeşidləməni sınayın',
    description: 'Интерактивная сортировка',
    highlightElements: ['[data-tutorial="sort-button"]'],
    text: 'Нажмите на "По масти", чтобы сортировать карты в руке по номиналу.',
    textKk: 'Карталарды номинал бойынша сұрыптау үшін "Сапта бойынша" басыңыз.',
    textEn: 'Click "By Suit" to sort the cards in your hand by rank.',
    textUk: 'Натисніть "За мастю", щоб сортувати карти в руці за номіналом.',
    textKa: 'დააჭირეთ "მასით" ბარათების ხელში ნომინალის მიხედვით დასახარისხებლად.',
    textAz: 'Bu koz kartıdır. Koz kartları digər maskaların kartlarını döyür. Koz maskanı yuxarıda görə bilərsiniz.',
    instruction: 'Нажмите на кнопку сортировки',
    instructionKk: 'Сұрыптау түймесін басыңыз',
    instructionEn: 'Click the sort button',
    instructionUk: 'Натисніть кнопку сортування',
    instructionAz: '"Növbəti" düyməsini basın',
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
    titleKk: 'Қолдағы карталарды сұрыптау',
    titleEn: 'Cards Sorted',
    titleUk: 'Карти відсортовано',
    titleAz: 'Əldəki kartların çeşidlənməsi',
    description: 'Результат сортировки',
    highlightElements: ['[data-tutorial="player-hand"]'],
    text: 'Теперь ваши карты в руке отсортированы по номиналу от меньшего к большему.',
    textKk: 'Енді қолыңыздағы карталар номинал бойынша кішіден үлкенге дейін сұрыпталған.',
    textEn: 'Your cards in hand are now sorted by rank from lowest to highest.',
    textUk: 'Тепер ваші карти в руці відсортовані за номіналом від меншого до більшого.',
    textKa: 'ახლა თქვენი ბარათები ხელში დახარისხებულია ნომინალის მიხედვით პატარიდან დიდამდე.',
    textAz: 'Siz hücum edirsiniz! Masaya kart atmaq üçün əlinizdəki yaşıl vurğulanmış karta basın.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    instructionKk: '"Келесі" басыңыз',
    instructionEn: 'Click "Next" to continue',
    instructionUk: 'Натисніть "Далі" щоб продовжити',
    instructionAz: 'Yaşıl vurğulanmış karta basın',
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
    titleKk: 'Бірдей карталар',
    titleEn: 'Identical Cards',
    titleUk: 'Однакові карти',
    titleAz: 'Eyni kartlar',
    description: 'Правила одинаковых карт',
    highlightElements: ['[data-tutorial="player-hand"]'],
    text: 'Так как в игре смешаны 4 стандартных колоды по 36 карт воедино, встречаются одинаковые по масти и номиналу карты. Такие карты бьют сами себя. Исключение - Король пики. Король пики сам себя побить не может',
    textKk: 'Ойында 4 стандартты 36 карталық колода араластырылғандықтан, сапта мен номиналы бірдей карталар кездеседі. Мұндай карталар өздеріне өздері ұра алады. Ерекшелік - Піка Көрпесі. Піка Көрпесі өзіне-өзі ұра ала алмайды',
    textEn: 'Since the game combines 4 standard 36-card decks, you will encounter cards of the same suit and rank. Such cards beat each other. Exception — King of Spades. The King of Spades cannot beat itself.',
    textUk: 'Оскільки в грі змішані 4 стандартні колоди по 36 карт, зустрічаються однакові за мастю та номіналом карти. Такі карти б\'ють самі себе. Виняток — Король пік. Король пік сам себе побити не може.',
    textKa: 'ვინაიდან თამაშში შერეულია 4 სტანდარტული გემბანი 36 ბარათით, გვხვდება ერთი და იმავე მასის და ნომინალის ბარათები. ასეთი ბარათები ერთმანეთს სცემენ. გამონაკლისია პიკის მეფე. პიკის მეფეს თავი ვერ სცემს.',
    textAz: 'İndi siz müdafiə edirsiniz! Masadakı kartı döymək üçün əlinizdəki uyğun karta basın.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    instructionKk: '"Келесі" басыңыз',
    instructionEn: 'Click "Next" to continue',
    instructionUk: 'Натисніть "Далі" щоб продовжити',
    instructionAz: 'Masadakı kartı döyün',
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
    titleKk: 'Бұл қалай жұмыс етеді?',
    titleEn: 'How Does It Work?',
    titleUk: 'Як це працює?',
    titleAz: 'Bu necə işləyir?',
    description: 'Практика одинаковых карт',
    highlightElements: ['[data-tutorial="player-hand"]', '[data-tutorial="table-area"]'],
    text: 'Нажмите на 6 черви чтобы отбиться. Карты с одинаковым номиналом и мастью бьют сами себя',
    textKk: 'Қорғану үшін 6 жүрекке басыңыз. Бірдей номинал мен сапталы карталар өздеріне өздері ұра алады',
    textEn: 'Click the 6 of Hearts to defend. Cards with the same rank and suit beat each other.',
    textUk: 'Натисніть на 6 червей щоб відбитися. Карти з однаковим номіналом та мастю б\'ють самі себе.',
    textKa: 'დააჭირეთ გულის 6-ს დასაცავად. ერთი და იმავე ნომინალისა და მასის ბარათები ერთმანეთს სცემენ.',
    textAz: 'Eyni nominallı kartlar (məsələn, iki yeddi) bir-birini döyür! Əgər onlar eyni nominaldırsa, kartı rəqibin kartının üstünə qoya bilərsiniz. Bu çox vacib qaydadır!',
    instruction: 'Нажмите на 6 черви в вашей руке',
    instructionKk: 'Қолыңыздағы 6 жүрекке басыңыз',
    instructionEn: 'Click the 6 of Hearts in your hand',
    instructionUk: 'Натисніть на 6 червей у вашій руці',
    instructionAz: '"Növbəti" düyməsini basın',
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
    titleKk: 'Піка Көрпесі — қозырдан тәуелсіз барлықты ұрады',
    titleEn: 'King of Spades — Beats Any Card Regardless of Trump',
    titleUk: 'Король пік — б\'є все, незалежно від козиря',
    titleAz: 'Maça Padşahı — kozdan asılı olmayaraq hər şeyi döyür',
    description: 'Специальные карты',
    highlightElements: ['[data-tutorial="player-hand"]', '[data-tutorial="table-area"]'],
    text: 'У вас в руке есть карта Король пики - найдите её. Это очень сильная карта с уникальной механикой. Он может побить любую карту в игре, независимо от козыря, <red>кроме самого себя</red>. Побейте королем пики козырный туз на столе',
    textKk: 'Қолыңызда Піка Көрпесі бар — оны табыңыз. Бұл ерекше механикалық өте күшті карта. Ол қозырдан тәуелсіз ойындағы кез картаны ұра ала алады, <red>өзінен басқа</red>. Үстелдегі қозыр түзін Піка Көрпесімен ұрыңыз',
    textEn: 'You have the King of Spades in your hand — find it. This is a very powerful card with a unique mechanic. It can beat any card in the game regardless of trump, <red>except itself</red>. Beat the trump ace on the table with the King of Spades.',
    textUk: 'У вас у руці є карта Король пік — знайдіть її. Це дуже сильна карта з унікальною механікою. Вона може побити будь-яку карту в грі, незалежно від козиря, <red>крім самої себе</red>. Поб\'йте Королем пік козирний туз на столі.',
    textKa: 'თქვენს ხელში არის პიკის მეფე — იპოვეთ იგი. ეს ძალიან ძლიერი ბარათია უნიკალური მექანიკით. მას შეუძლია სცეს ნებისმიერ ბარათს თამაშში, კოზირისგან დამოუკიდებლად, <red>გარდა საკუთარი თავისა</red>. სცეთ პიკის მეფით მაგიდაზე კოზირ ტუზს.',
    textAz: 'Maça Padşahı (♠K) — oyundakı ən güclü kartdır! O, özündən başqa BÜTÜN kartları döyür. İki Maça Padşahı bir-birini döyə bilməz — bu heç-heçədir!',
    instruction: 'Нажмите на Короля пики в вашей руке',
    instructionKk: 'Қолыңыздағы Піка Көрпесіне басыңыз',
    instructionEn: 'Click the King of Spades in your hand',
    instructionUk: 'Натисніть на Короля пік у вашій руці',
    instructionAz: '"Növbəti" düyməsini basın',
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
    titleKk: '777 картасы — ойындағы барлық картаны ұрады',
    titleEn: 'Card 777 — Beats All Cards in the Game',
     titleUk: 'Карта 777 — б\'є всі карти в грі',
    titleKa: 'ბარათი 777 — ყველა ბარათს სცემს თამაშში',
    titleAz: 'Maça Padşahını necə döymək olar',
    description: 'Спеціальні карти',
    highlightElements: ['[data-tutorial="player-hand"]', '[data-tutorial="table-area"]'],
    text: '777 - бьет любую карту! В колоде всего одна.\nС карты 777 нельзя походить! Только биться. Если в конце игры у вас осталась только эта карта в руке, и начинается ваш ход - вы его пропустите',
    textKk: '777 — кез картаны ұрады! Колодада тек біреу.\n777 картасымен шабуға шығармайды! Тек қорғануға арналған. Егер ойын соңында қолыңызда тек осы карта қалса және сіздің қадамыңыз келсе — оны өткізесіз',
    textEn: '777 beats any card! There is only one in the deck.\nYou cannot attack with the 777 card! Only defend. If at the end of the game you have only this card in hand and it is your turn — you will skip it.',
    textUk: '777 — б\'є будь-яку карту! У колоді лише одна.\nЗ карти 777 не можна ходити! Тільки відбиватися. Якщо в кінці гри у вас залишилась лише ця карта в руці, і починається ваш хід — ви його пропустите.',
    textKa: '777 — სცემს ნებისმიერ ბარათს! გემბანში მხოლოდ ერთია.\n777 ბარათით ვერ ივლი! მხოლოდ დაცვა. თუ თამაშის ბოლოს ხელში მხოლოდ ეს ბარათი გრჩებათ და თქვენი სვლაა — გამოტოვებთ.',
    textAz: 'Maça Padşahını YALNIZ başqa Maça Padşahı ilə döymək olar. Heç bir başqa kart onu döyə bilməz, hətta koz belə! Bu oyundakı əsas istisnalardır.',
    instruction: 'Нажмите на 777 в вашей руке',
    instructionKk: 'Қолыңыздағы 777 басыңыз',
    instructionEn: 'Click the 777 in your hand',
    instructionUk: 'Натисніть на 777 у вашій руці',
    instructionAz: '"Növbəti" düyməsini basın',
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
    titleKk: 'Піка Түзі — ерекше механика',
    titleEn: 'Ace of Spades — Unique Mechanic',
    titleUk: 'Туз пік — унікальна механіка',
    titleAz: 'Maça Tuzu — unikal mexanika',
    description: 'Специальные карты',
    highlightElements: ['[data-tutorial="player-hand"]', '[data-tutorial="table-area"]'],
    text: 'Короля пики может побить только Туз пики и 777, больше никакая карта не в силах сделать этого\nНайдите в своей руке Туз пики. Нажмите на него чтобы отбить короля пики на столе',
    textKk: 'Піка Көрпесін тек Піка Түзі мен 777 ұра ала алады, басқа ешқанда карта бұны істе асыра алмайды\nҚолыңызда Піка Түзін табыңыз. Үстелдегі Піка Көрпесін қорғау үшін оны басыңыз',
    textEn: 'The King of Spades can only be beaten by the Ace of Spades and 777, no other card can do this.\nFind the Ace of Spades in your hand. Click it to beat the King of Spades on the table.',
    textUk: 'Короля пік може побити лише Туз пік та 777, жодна інша карта не здатна це зробити.\nЗнайдіть у своїй руці Туз пік. Натисніть на нього щоб відбити Короля пік на столі.',
    textKa: 'პიკის მეფეს შეუძლია სცეს მხოლოდ პიკის ტუზმა და 777-მა, სხვა ბარათს ეს არ შეუძლია.\nიპოვეთ ხელში პიკის ტუზი. დააჭირეთ მას მაგიდაზე პიკის მეფის დასაცავად.',
    textAz: '777 kartının xüsusi mexanikası var: o, ötürmə kartı kimi istifadə edilə bilər (kart götürmək əvəzinə növbəni başqa oyunçuya ötürmək).',
    instruction: 'Нажмите на Туз пики в вашей руке',
    instructionKk: 'Қолыңыздағы Піка Түзіне басыңыз',
    instructionEn: 'Click the Ace of Spades in your hand',
    instructionUk: 'Натисніть на Туз пік у вашій руці',
    instructionAz: '"Növbəti" düyməsini basın',
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
    titleKk: 'Аудармалық',
    titleEn: 'Transfer',
    titleUk: 'Переведення',
    titleAz: 'Ötürmə',
    description: 'Механика перевода',
    highlightElements: ['[data-tutorial="player-hand"]', '[data-tutorial="table-area"]'],
    text: 'Игра всегда с механикой переводного. Если на вас походили картой, и у вас в руке есть карта с таким же номиналом (индексом), вы можете перевести ход на следующего игрока, выкинув эту карту на стол',
    textKk: 'Ойын әрқашан аудармалық механикасымен жүреді. Егер сізге картамен шабуға шықса және қолыңызда сондай номиналды (индексті) карта болса, сіз оны үстелге тастап қадамды келесі ойыншыға аудара аласыз',
    textEn: 'The game always uses the transfer mechanic. If a card was played against you and you have a card with the same rank (index) in hand, you can transfer the turn to the next player by placing that card on the table.',
    textUk: 'Гра завжди з механікою переведення. Якщо на вас походили картою, і у вас у руці є карта з таким же номіналом (індексом), ви можете перевести хід на наступного гравця, кинувши цю карту на стіл.',
    textKa: 'თამაში ყოველთვის გადაცემის მექანიკით. თუ თქვენზე ივლეს ბარათით, და ხელში გაქვთ ბარათი ამავე ნომინალით (ინდექსით), შეგიძლიათ გადასცეთ სვლა შემდეგ მოთამაშეს, ეს ბარათი მაგიდაზე გადაყრით.',
    textAz: 'Ötürmə kartı masadan kart götürmək əvəzinə növbəni başqa oyunçuya ötürməyə imkan verir. Bu 777 və ya otağın qaydalarına görə digər kartlar ola bilər.',
    instruction: 'Нажмите на 7 пики в вашей руке',
    instructionKk: 'Қолыңыздағы 7 пікаға басыңыз',
    instructionEn: 'Click the 7 of Spades in your hand',
    instructionUk: 'Натисніть на 7 пік у вашій руці',
    instructionAz: '"Ötür" düyməsini basın',
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
    extraBotNamesEn: ['Madina', 'Bot 3'],
    extraBotNamesKk: ['Мадина', 'Қадам 3'],
    extraBotNamesUk: ['Мадіна', 'Бот 3'],
    transferMechanic: {
      transferCard: '7s',
      targetBotName: 'Мадина',
      targetBotNameEn: 'Madina',
      targetBotNameKk: 'Мадина',
      targetBotNameUk: 'Мадіна',
    },
  },
  {
    id: 14,
    title: 'Ход по часовой стрелке',
    titleKk: 'Сағат тілі бойынша қадам',
    titleEn: 'Clockwise Turn Order',
    titleUk: 'Хід за годинниковою стрілкою',
    titleAz: 'Saat əqrəbi istiqamətində növbə',
    description: 'Направление игры',
    highlightElements: ['[data-tutorial="opponent-info"]:nth-of-type(1)', '[data-tutorial="opponent-info"]:nth-of-type(2)', '[data-tutorial="opponent-info"]:nth-of-type(3)'],
    text: 'Игроки ходят друг на друга по часовой стрелке, но есть исключение:\nЕсли какой-то игрок начинает свой ход с 10-ки, выкинув ее на стол, <red>направление игры меняется</red> на против часовой стрелки',
    textKk: 'Ойыншылар сағат тілі бойынша біріне бірі қадам жасайды, бірақ ерекшелік бар:\nЕгер қандай ойыншы 10-ды үстелге тастап өз қадамын бастаса, <red>ойын бағыты өзгереді</red> сағат тіліне қарсы',
    textEn: 'Players take turns clockwise, but there is an exception:\nIf a player starts their turn by playing a 10, <red>the direction of play reverses</red> to counter-clockwise.',
    textUk: 'Гравці ходять один на одного за годинниковою стрілкою, але є виняток:\nЯкщо якийсь гравець починає свій хід з 10-ки, кинувши її на стіл, <red>напрямок гри змінюється</red> на проти годинникової стрілки.',
    textKa: 'მოთამაშეები ერთმანეთზე ივლიან საათის ისრის მიმართულებით, მაგრამ არის გამონაკლისი:\nთუ რომელიმე მოთამაშე სვლას 10-ით იწყებს, მაგიდაზე გადაყრით, <red>თამაშის მიმართულება იცვლება</red> საათის ისრის საწინააღმდეგოდ.',
    textAz: 'Proezdnoy kartı növbəni ötürməyə və masadan kart götürməməyə imkan verir. Proezdnoy kartdan sonra növbə növbəti oyunçuya keçir.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    instructionKk: '"Келесі" басыңыз',
    instructionEn: 'Click "Next" to continue',
    instructionUk: 'Натисніть "Далі" щоб продовжити',
    instructionAz: '"Növbəti" düyməsini basın',
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
    extraBotNamesEn: ['Madina', 'Bot 3'],
    extraBotNamesKk: ['Мадина', 'Қадам 3'],
    extraBotNamesUk: ['Мадіна', 'Бот 3'],
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
    titleKk: '10-мен қадам',
    titleEn: 'Playing a Ten',
    titleUk: 'Хід з 10-ки',
    titleAz: '10-dan növbə',
    description: 'Смена направления',
    highlightElements: ['[data-tutorial="opponent-info"]:nth-of-type(3)', '[data-tutorial="player-hand"]'],
    text: 'Если игрок начинает свой ход с карты 10, то меняется направление игры. Сейчас ход Бота 3, он должен походить на вас',
    textKk: 'Егер ойыншы 10 картасымен өз қадамын бастаса, ойын бағыты өзгереді. Қазір Қадамы 3, ол сізге қарай шабуға шығуы керек',
    textEn: 'If a player starts their turn with a 10 card, the direction of play changes. Now it is Bot 3\'s turn, and he must attack you.',
    textUk: 'Якщо гравець починає свій хід з карти 10, то змінюється напрямок гри. Зараз хід Бота 3, він має походити на вас.',
    textKa: 'თუ მოთამაშე სვლას 10 ბარათით იწყებს, თამაშის მიმართულება იცვლება. ახლა ბოტ 3-ის სვლაა, მან თქვენზე უნდა ივლიოს.',
    textAz: '6 kartının xüsusi hərəkəti var: o, müəyyən kombinasiyalar və strategiyalar üçün istifadə edilə bilər. Bu kartı yadda saxlayın!',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    instructionKk: '"Келесі" басыңыз',
    instructionEn: 'Click "Next" to continue',
    instructionUk: 'Натисніть "Далі" щоб продовжити',
    instructionAz: '"Növbəti" düyməsini basın',
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
    extraBotNamesEn: ['Madina', 'Bot 3'],
    extraBotNamesKk: ['Мадина', 'Қадам 3'],
    extraBotNamesUk: ['Мадіна', 'Бот 3'],
    attackerPlayerIdx: 3,
    defenderPlayerIdx: 0,
  },
  {
    id: 16,
    title: 'Игрок Бот 3 начал свой ход с 10-ки, поменяв направление игры.',
    titleKk: 'Қадам 3 ойыншысы 10-мен қадамын бастап, ойын бағытын өзгертті.',
    titleEn: 'Bot 3 Started Their Turn with a 10, Changing Direction.',
    titleUk: 'Гравець Бот 3 почав свій хід з 10-ки, змінивши напрямок гри.',
    titleAz: 'Bot 3 oyunçusu 10 ilə növbəsini başlatdı, oyunun istiqamətini dəyişdirdi.',
    description: 'Смена направления — 10-ка на столе',
    highlightElements: ['[data-tutorial="opponent-info"]:nth-of-type(3)', '[data-tutorial="opponent-info"]:nth-of-type(2)', '[data-tutorial="table-area"]'],
    text: 'Теперь Бот 3 ходит не на вас, а на игрока Мадина',
    textKk: 'Енді Қадам 3 сізге емес, Мадина ойыншысына қарай жүреді',
    textEn: 'Now Bot 3 attacks not you, but the player Madina.',
    textUk: 'Тепер Бот 3 ходить не на вас, а на гравця Мадіна.',
    textKa: 'ახლა ბოტ 3 თქვენზე კი არ ივლის, არამედ მოთამაშე მადინაზე.',
    textAz: '10 kartı — Maça Padşahından sonra ikinci ən güclü kartdır! O, Maça Padşahı və başqa 10-dan başqa bütün kartları döyür. Bu çox güclü kartdır!',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    instructionKk: '"Келесі" басыңыз',
    instructionEn: 'Click "Next" to continue',
    instructionUk: 'Натисніть "Далі" щоб продовжити',
    instructionAz: '"Növbəti" düyməsini basın',
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
    extraBotNamesEn: ['Madina', 'Bot 3'],
    extraBotNamesKk: ['Мадина', 'Қадам 3'],
    extraBotNamesUk: ['Мадіна', 'Бот 3'],
    attackerPlayerIdx: 3,
    defenderPlayerIdx: 2,
    tableCards: [{ playerId: 2, cards: ['10d'] }],
  },
  {
    id: 17,
    title: 'Перевод карты возвращает предыдущее направление игры',
    titleKk: 'Аударма алдыңғы ойын бағытын қайтарады',
    titleEn: 'Transfer Restores Previous Direction',
    titleUk: 'Переведення повертає попередній напрямок гри',
    titleAz: 'Kartın ötürülməsi oyunun əvvəlki istiqamətini qaytarır',
    description: 'Перевод 10-кой возвращает направление',
    highlightElements: ['[data-tutorial="opponent-info"]:nth-of-type(2)', '[data-tutorial="opponent-info"]:nth-of-type(3)', '[data-tutorial="table-area"]'],
    text: 'Игрок Мадина перевела 10-кой пики ход на игрока Бот 3. Теперь игра снова идет по часовой стрелке.',
    textKk: 'Мадина ойыншысы Піка 10-мен Қадам 3 ойыншысына қадамды аударды. Енді ойын қайтадан сағат тілі бойынша жүреді.',
    textEn: 'Player Madina transferred the turn to Bot 3 using the 10 of Spades. Now the game goes clockwise again.',
    textUk: 'Гравець Мадіна перевела 10-кою пік хід на гравця Бот 3. Тепер гра знову йде за годинниковою стрілкою.',
    textKa: 'მოთამაშე მადინამ პიკის 10-ით სვლა გადასცა ბოტ 3-ს. ახლა თამაში კვლავ საათის ისრის მიმართულებით მიდის.',
    textAz: 'Koz kartlarının xüsusi gücü var. Onlar müəyyən vəziyyətlərdə digər maskaların kartlarını döyə bilər. Yuxarıdakı kozlara baxın — bu oyunun cari kozudur!',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    instructionKk: '"Келесі" басыңыз',
    instructionEn: 'Click "Next" to continue',
    instructionUk: 'Натисніть "Далі" щоб продовжити',
    instructionAz: '"Növbəti" düyməsini basın',
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
    extraBotNamesEn: ['Madina', 'Bot 3'],
    extraBotNamesKk: ['Мадина', 'Қадам 3'],
    extraBotNamesUk: ['Мадіна', 'Бот 3'],
    attackerPlayerIdx: 2,
    defenderPlayerIdx: 3,
    tableCards: [{ playerId: 2, cards: ['10d', '10s'] }],
  },
  {
    id: 18,
    title: 'На 10-ку распространяется проездной',
    titleKk: '10-ға жолаушы рұқсат етеді',
    titleEn: 'Pass-Through Applies to the Ten',
    titleUk: 'На 10-ку поширюється проїзний',
    titleAz: '10-a proezdnoy tətbiq olunur',
    description: 'Проездной с козырной 10-кой',
    highlightElements: ['[data-tutorial="opponent-info"]:nth-of-type(3)', '[data-tutorial="table-area"]'],
    text: 'У игрока Бот 3 в руке была козырная 10-ка, он воспользовался проездным, и перевел ход снова на игрока Мадина. Сменив направление игры.',
    textKk: 'Қадам 3 ойыншысының қолында қозыр 10 болды, ол жолаушыдан пайдаланып, Қадамды Қайтадан Мадина ойыншысына аударды. Ойын бағытын өзгертті.',
    textEn: 'Bot 3 had a trump 10 in hand, used the pass-through, and transferred the turn back to player Madina. Changing the direction of play.',
    textUk: 'У гравця Бот 3 в руці була козирна 10-ка, він скористався проїзним, і перевів хід знову на гравця Мадіна. Змінивши напрямок гри.',
    textKa: 'ბოტ 3-ს ხელში ჰქონდა კოზირი 10, გამოიყენა გადაცემა და სვლა კვლავ მოთამაშე მადინაზე გადასცა. შეცვალა თამაშის მიმართულება.',
    textAz: 'Hücum zamanı masaya bir neçə kart ata bilərsiniz. Eyni nominallı kartları atın — bu rəqibin müdafiəsini çətinləşdirir!',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    instructionKk: '"Келесі" басыңыз',
    instructionEn: 'Click "Next" to continue',
    instructionUk: 'Натисніть "Далі" щоб продовжити',
    instructionAz: 'Yaşıl kartları masaya atın',
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
    extraBotNamesEn: ['Madina', 'Bot 3'],
    extraBotNamesKk: ['Мадина', 'Қадам 3'],
    extraBotNamesUk: ['Мадіна', 'Бот 3'],
    attackerPlayerIdx: 3,
    defenderPlayerIdx: 2,
    tableCards: [{ playerId: 2, cards: ['10d', '10s'] }],
    passThroughBotIdx: 3,
  },
  // Step 19: 6-ка вне очереди
  {
    id: 19,
    title: '6-ка вне очереди',
    titleKk: '6 кезезінде',
    titleEn: 'Six Out of Turn',
    titleUk: '6-ка поза чергою',
    titleAz: '6 növbədənkənar',
    description: 'Подкидывание 6-ки любым игроком',
    text: 'По правилам игры, обороняющемуся игроку могут подкидывать только соседи. Но если кто-то походил с 6-ки, то любой игрок за столом может подкинуть 6-ки, даже если не является соседом',
    textKk: 'Ойын ережелері бойынша, қорғаушы ойыншыға тек көршілер қосымша карта ұра алады. Бірақ егер кімдер 6-мен шабуға шықса, үстел басындағы кез ойыншы 6-ларды қосымшы болмаса да қоса алады',
    textEn: 'By the rules, only neighbors can add cards to the defender. But if someone started with a six, any player at the table can add sixes, even if they are not a neighbor.',
    textUk: 'За правилами гри, захисному гравцю можуть підкидати лише сусіди. Але якщо хтось походив з 6-ки, то будь-який гравець за столом може підкинути 6-ки, навіть якщо не є сусідом.',
    textKa: 'თამაშის წესების მიხედვით, მცველ მოთამაშეს შეუძლიათ მხოლოდ მეზობლებმა მიაყარონ. მაგრამ თუ ვინმე 6-ით ივლის, ნებისმიერ მოთამაშეს მაგიდასთან შეუძლია 6-ები მიაყაროს, თუნდაც მეზობელი არ იყოს.',
    textAz: 'Oyun başa çatdıqda son oyunçu "Axmaq" adlanır. Hər oyunun məqsədi əlinizdəki bütün kartlardan xilas olmaqdır!',
    highlightElements: ['[data-tutorial="table-area"]', '[data-tutorial="opponent-info"]:nth-of-type(1)', '[data-tutorial="opponent-info"]:nth-of-type(2)'],
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
    extraBotNamesEn: ['Madina', 'Bot 3'],
    extraBotNamesKk: ['Мадина', 'Қадам 3'],
    extraBotNamesUk: ['Мадіна', 'Бот 3'],
    overrideMainBotName: 'Камила',
    overrideMainBotNameEn: 'Kamila',
    overrideMainBotNameKk: 'Камила',
    overrideMainBotNameUk: 'Каміла',
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
    titleKk: '6 кезезінде',
    titleEn: 'Six Out of Turn',
    titleUk: '6-ка поза чергою',
    titleAz: '6 növbədənkənar',
    description: 'Подкидывание 6-ок на стол',
    text: 'У Камилы и Бота 3 в руке нет карт, которые они могли бы подкинуть, но так как Камила изначально походила с 6-ки, ход перешел к вам. Вы можете подкинуть 6-ки Мадине, хоть и не являетесь ее соседом. Десятки в данном случае подкидывать нельзя.',
    textKk: 'Камила мен Қадам 3 қолында қоса алатын карталар жоқ, бірақ Камила бастапқыда 6-мен шабуға шыққандықтан, қадам сізге өтті. Сіз Мадинаға 6-ларды қоса ала аласыз, көршісі болмасаңыз да. Бұл жағдайда ондықтарды қосуға болмайды.',
    textEn: 'Kamila and Bot 3 have no cards to add, but since Kamila originally started with a six, the turn passed to you. You can add sixes to Madina, even though you are not her neighbor. Tens cannot be added in this case.',
    textUk: 'У Каміли та Бота 3 в руці немає карт, які вони могли б підкинути, але оскільки Каміла спочатку походила з 6-ки, хід перейшов до вас. Ви можете підкинути 6-ки Мадіні, хоч і не є її сусідом. Десятки в даному випадку підкидати не можна.',
    textKa: 'კამილასა და ბოტ 3-ს ხელში არ აქვთ ბარათები, რომლებიც შეეძლოთ მიეყარათ, მაგრამ ვინაიდან კამილამ პირველად 6-ით ივლო, სვლა თქვენზე გადავიდა. შეგიძლიათ 6-ები მიაყაროთ მადინას, თუნდაც მისი მეზობელი არ იყოთ. ამ შემთხვევაში ათეულების მიყრა არ შეიძლება.',
    textAz: 'Oyunçular saat əqrəbi istiqamətində növbə ilə hücum edirlər. Müdafiəçi kartları döydükdən sonra hücumçu dəyişir.',
    mobileText: 'Камила 6-дан бастады, ход перешёл к вам. Можно подкидывать 6-ки, но не десятки.',
    mobileTextKk: 'Камила 6-дан бастағандықтан, қадам сізге өтті. 6-ларды қоса аласыз, ондықтарды — жоқ.',
    mobileTextEn: 'Kamila started with a six, turn passed to you. Add sixes — not tens.',
    mobileTextUk: 'Каміла почала з 6-ки, хід перейшов до вас. Можна підкидати 6-ки, але не десятки.',
    highlightElements: ['[data-tutorial="player-hand"]', '[data-tutorial="opponent-info"]:nth-of-type(2)', '[data-tutorial="table-area"]'],
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
    extraBotNamesEn: ['Madina', 'Bot 3'],
    extraBotNamesKk: ['Мадина', 'Қадам 3'],
    extraBotNamesUk: ['Мадіна', 'Бот 3'],
    overrideMainBotName: 'Камила',
    overrideMainBotNameEn: 'Kamila',
    overrideMainBotNameKk: 'Камила',
    overrideMainBotNameUk: 'Каміла',
    attackerPlayerIdx: -1,
    defenderPlayerIdx: 2,
    tableCards: [{ playerId: 1, cards: [
      { attack: '6s', defense: '10s' },
      { attack: '6d', defense: '10d' },
    ] }],
    glowOpponents: [2], // Only Мадина
    glowTableArea: true,
    highlightCardsGreen: ['6h', '6h', '6d', '6c'],
    highlightCardsRed: ['10h', '10c', '10d', '10s'],
    throwCards: {
      throwableCards: ['6h', '6h', '6d', '6c'],
      minThrows: 1,
    },
  },
  // Step 21: Потайной козырь
  {
    id: 21,
    title: 'Потайной козырь',
    titleKk: 'Жасырын қозыр',
    titleEn: 'Hidden Trump',
    titleUk: 'Прихований козир',
    titleAz: 'Gizli koz',
    description: 'Потайные козыри под колодами',
    highlightElements: ['[data-tutorial="deck-area"]', '[data-tutorial="mobile-decks"]'],
    text: 'Сейчас в игре 2 колоды. Под колодой №1 лежит дама черви - это карта, назначающая нынешний козырь.\nПод дамой черви спрятана карта - потайный козырь №1.\nПод колодой №2 лежит потайный козырь №2',
    textKk: 'Қазір ойында 2 колода бар. Колода №1 астында жүрек дамасы жатыр — бұл қазіргі қозырды белгілейтін карта.\nЖүрек дамасының астында жасырын карта — жасырын қозыр №1.\nКолода №2 астында жасырын қозыр №2 жатыр',
    textEn: 'Now there are 2 decks in the game. Under deck #1 lies the Queen of Hearts — this is the card that determines the current trump.\nUnder the Queen of Hearts is a hidden card — hidden trump #1.\nUnder deck #2 lies hidden trump #2.',
    textUk: 'Зараз у грі 2 колоди. Під колодою №1 лежить дама червей — це карта, що призначає нинішній козир.\nПід дамою червей захована карта — прихований козир №1.\nПід колодою №2 лежить прихований козир №2.',
    textKa: 'ახლა თამაშში 2 გემბანია. გემბანი №1-ის ქვეშ დევს გულის ქალბატონი — ეს ბარათი ადგენს მიმდინარე კოზირს.\nქალბატონის ქვეშ დამალულია ბარათი — ფარული კოზირი №1.\nგემბანი №2-ის ქვეშ დევს ფარული კოზირი №2.',
    textAz: 'İlk hücumçu masaya 13-ə qədər kart ata bilər! Sonrakı turlarda kart sayı müdafiəçinin əlindəki kart sayı ilə məhdudlaşır.',
    mobileText: 'В начале партии козырем стала масть черви. Как только карты в колоде №1 (К1) закончатся, козырь поменяется',
    mobileTextKk: 'Ойын басында қозыр жүрек масы болды. Колода №1 (Қ1) біткенде, қозыр өзгереді',
    mobileTextEn: 'At the start of the game, hearts became the trump suit. Once the cards in deck #1 (D1) run out, the trump will change.',
    mobileTextUk: 'На початку партії козирем стала масть червей. Як тільки карти в колоді №1 (К1) закінчаться, козир зміниться.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    instructionKk: '"Келесі" басыңыз',
    instructionEn: 'Click "Next" to continue',
    instructionUk: 'Натисніть "Далі" щоб продовжити',
    instructionAz: '"Növbəti" düyməsini basın',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'hearts',
    trumpCard: 'Qh',
    requiredAction: 'click-button',
    discardCount: 10,
    textPosition: 'center',
    mobileTextPosition: 'bottom',
    mobileHighlightElements: ['[data-tutorial="trump-indicator"]'],
    glowMobileTrump: true,
  },
  // Step 22: Потайной козырь №1 — колода 1 закончилась, козырь сменился на крести
  {
    id: 22,
    title: 'Потайной козырь №1',
    titleKk: 'Жасырын қозыр №1',
    titleEn: 'Hidden Trump #1',
    titleUk: 'Прихований козир №1',
    titleAz: 'Gizli koz №1',
    description: 'Смена козыря при окончании колоды 1',
    highlightElements: ['[data-tutorial="deck-area"]', '[data-tutorial="mobile-decks"]'],
    text: 'Когда колода №1 заканчивается, вскрывается потайный козырь №1, и козырь в игре меняется. В данном случае козырь поменялся на крести',
    textKk: 'Колода №1 біткенде, жасырын қозыр №1 ашылады және ойындағы қозыр өзгереді. Бұл жағдайда қозыр крестіге өзгерді',
    textEn: 'When deck #1 runs out, hidden trump #1 is revealed and the trump in the game changes. In this case the trump changed to clubs.',
    textUk: 'Коли колода №1 закінчується, відкривається прихований козир №1, і козир у грі змінюється. В даному випадку козир змінився на трефи.',
    textKa: 'გემბანი №1-ის ამოწურვისას იხსნება ფარული კოზირი №1 და თამაშში კოზირი იცვლება. ამ შემთხვევაში კოზირი ჩვენად შეიცვალა.',
    textAz: 'Güclü kartlarınızı saxlayın! Zəif kartlarla hücum edin, güclü kartları müdafiə üçün saxlayın. Rəqibinizin əlindəki kart sayını izləyin.',
    mobileText: 'Когда колода №1 заканчивается, вскрывается потайный козырь №1, и козырь в игре меняется. Козырь поменялся на крести',
    mobileTextKk: 'Колода №1 біткенде, жасырын қозыр №1 ашылады және ойындағы қозыр өзгереді. Қозыр крестіге өзгерді',
    mobileTextEn: 'When deck #1 runs out, hidden trump #1 is revealed and the trump changes. The trump changed to clubs.',
    mobileTextUk: 'Коли колода №1 закінчується, відкривається прихований козир №1, і козир у грі змінюється. Козир змінився на трефи.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    instructionKk: '"Келесі" басыңыз',
    instructionEn: 'Click "Next" to continue',
    instructionUk: 'Натисніть "Далі" щоб продовжити',
    instructionAz: '"Növbəti" düyməsini basın',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'clubs',
    trumpCard: 'Qh',
    requiredAction: 'click-button',
    discardCount: 10,
    textPosition: 'center',
    mobileTextPosition: 'bottom',
    mobileHighlightElements: ['[data-tutorial="trump-indicator"]'],
    glowMobileTrump: true,
    deck1Count: 0,
    hiddenTrumpCard1: 'Ac',
  },
  // Step 23: Потайной козырь №2 — обе колоды закончились, козырь буби
  {
    id: 23,
    title: 'Потайной козырь №2',
    titleKk: 'Жасырын қозыр №2',
    titleEn: 'Hidden Trump #2',
    titleUk: 'Прихований козир №2',
    titleAz: 'Gizli koz №2',
    description: 'Финальная смена козыря',
    highlightElements: ['[data-tutorial="deck-area"]', '[data-tutorial="mobile-decks"]'],
    text: 'Когда колода №1 и колода №2 заканчиваются, вскрывается потайный козырь №2, меняя козырь в игре в последний раз. Теперь козырь в игре буби',
    textKk: 'Колода №1 мен колода №2 біткенде, жасырын қозыр №2 ашылады және ойындағы қозыр соңғы рет өзгереді. Енді ойындағы қозыр бүбі',
    textEn: 'When deck #1 and deck #2 run out, hidden trump #2 is revealed, changing the trump for the last time. Now the trump in the game is diamonds.',
    textUk: 'Коли колода №1 і колода №2 закінчуються, відкривається прихований козир №2, змінюючи козир у грі востаннє. Тепер козир у грі бубни.',
    textKa: 'გემბანი №1 და გემბანი №2-ის ამოწურვისას იხსნება ფარული კოზირი №2, რომელიც ბოლოჯერ ცვლის კოზირს თამაშში. ახლა თამაშში კოზირი ბუბია.',
    textAz: 'Siz öyrədicini tamamladınız! İndi real oyunçulara qarşı oynamağa hazırsınız. Uğurlar!',
    mobileText: 'Когда колода №1 и колода №2 заканчиваются, вскрывается потайный козырь №2, меняя козырь в игре в последний раз. Теперь козырь в игре буби',
    mobileTextKk: 'Колода №1 мен колода №2 біткенде, жасырын қозыр №2 ашылады, ойындағы қозыр соңғы рет өзгереді. Енді қозыр бүбі',
    mobileTextEn: 'When deck #1 and deck #2 run out, hidden trump #2 is revealed, changing the trump for the last time. Now the trump is diamonds.',
    mobileTextUk: 'Коли колода №1 і колода №2 закінчуються, відкривається прихований козир №2, змінюючи козир востаннє. Тепер козир — бубни.',
    instruction: 'Нажмите "Завершить обучение"',
    instructionKk: '"Оқытуды аяқтау" басыңыз',
    instructionEn: 'Click "Finish Tutorial"',
    instructionUk: 'Натисніть "Завершити навчання"',
    instructionAz: 'Öyrədicini bitir',
    playerHand: STANDARD_PLAYER_HAND,
    botHand: STANDARD_BOT_HAND,
    trumpSuit: 'diamonds',
    requiredAction: 'click-button',
    discardCount: 10,
    textPosition: 'center',
    mobileTextPosition: 'bottom',
    mobileHighlightElements: ['[data-tutorial="trump-indicator"]'],
    glowMobileTrump: true,
    deck1Count: 0,
    deck2Count: 0,
    isLastStep: true,
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
