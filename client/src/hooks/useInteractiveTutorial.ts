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
  /** Title in Uzbek */
  titleUz?: string;
  /** Title in Polish */
  titlePl?: string;
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
  /** Text in Uzbek */
  textUz?: string;
  /** Text in Polish */
  textPl?: string;
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
  /** Instruction in Uzbek */
  instructionUz?: string;
  /** Instruction in Polish */
  instructionPl?: string;
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
    /** Name of the bot in Georgian */
    targetBotNameKa?: string;
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
  /** Custom names for extra bots in Georgian */
  extraBotNamesKa?: string[];
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
  /** Override the main bot's name in Georgian */
  overrideMainBotNameKa?: string;
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
  /** Override text for mobile view in Georgian */
  mobileTextKa?: string;
  /** Override text for mobile view in Uzbek */
  mobileTextUz?: string;
  /** Override text for mobile view in Polish */
  mobileTextPl?: string;
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
    titleKa: 'ბარათების რაოდენობა ხელში',
    titleAz: 'Əldəki kart sayı',
    titleUz: 'Qoldagi kartalar soni',
    titlePl: 'Liczba kart w ręce',
    description: 'Понимание базовых правил',
    highlightElements: ['[data-tutorial="player-hand"]', '[data-tutorial="opponent-info"]'],
    text: 'Вначале игры всем игрокам раздается по 14 карт.\nВ руке игрока всегда должно быть минимум 14 карт, пока в колодах есть карты.',
    textKk: 'Ойын басында әр ойыншыға 14 карта бөлінеді.\nКолодаларда карта бар кезде ойыншы қолында әрқашан да 14 карта болуы керек.',
    textEn: 'At the start of the game, each player is dealt 14 cards.\nA player must always have at least 14 cards in hand while there are cards in the decks.',
    textUk: 'На початку гри кожному гравцю роздається по 14 карт.\nУ руці гравця завжди має бути мінімум 14 карт, поки в колодах є карти.',
    textKa: 'თამაშის დასაწყისში თითოეულ მოთამაშეს ურიგდება 14 ბარათი.\nმოთამაშის ხელში ყოველთვის უნდა იყოს მინიმუმ 14 ბარათი, სანამ გემბნებში ბარათებია.',
    textAz: 'Oyunun əvvəlində hər oyunçuya 14 kart paylanır.\nDəstələrdə kart olduğu müddətcə oyunçunun əlində həmişə minimum 14 kart olmalıdır.',
    textUz: 'Oyunun əvvəlində hər oyunçuya 14 kart paylanır.\nDəstələrdə kart olduğu müddətcə oyunçunun əlində həmişə minimum 14 kart olmalıdır.',
    textPl: 'Na początku gry każdy gracz otrzymuje 14 kart.\nDopóki w talii są karty, gracz musi mieć zawsze minimum 14 kart w ręce.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    instructionKk: '"Келесі" басыңыз',
    instructionEn: 'Click "Next" to continue',
    instructionUk: 'Натисніть "Далі" щоб продовжити',
    instructionKa: 'დააჭირეთ "შემდეგი"',
    instructionAz: '"Növbəti" düyməsini basın',
    instructionUz: '"Keyingi"ni bosing',
    instructionPl: 'Naciśnij przycisk "Dalej"',
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
    titleKa: 'სვლის ტაიმერი',
    titleAz: 'Növbə taymərı',
    titleUz: 'Navbat taymeri',
    titlePl: 'Timer tury',
    description: 'Интерфейс игры',
    highlightElements: ['[data-tutorial="timer"]', '[data-tutorial="timer-desktop"]'],
    text: 'Это таймер хода. У каждого игрока есть определенное количество секунд на ход, которое устанавливается в настройках каждой комнаты. Когда время истекает — ход переходит к следующему игроку.',
    textKk: 'Бұл қадам таймері. Әр ойыншының қадамына әр бөлме баптауларында белгіленетін секунд саны бөлінеді. Уақыт аяқталса — қадам келесі ойыншыға өтеді.',
    textEn: 'This is the turn timer. Each player has a set number of seconds per turn, configured in each room\'s settings. When time runs out, the turn passes to the next player.',
    textUk: 'Це таймер ходу. Кожен гравець має певну кількість секунд на хід, яка встановлюється в налаштуваннях кімнати. Коли час закінчується — хід переходить до наступного гравця.',
    textKa: 'ეს არის სვლის ტაიმერი. თითოეულ მოთამაშეს აქვს გარკვეული წამები სვლისთვის, რომელიც დგინდება ოთახის პარამეტრებში. დროის ამოწურვისას — სვლა გადადის შემდეგ მოთამაშეზე.',
    textAz: 'Bu növbə taymerıdır. Hər oyunçunun növbəsi üçün müəyyən sayda saniyəsi var, bu hər otağın parametrlərində təyin edilir. Vaxt bitdikdə — növbə növbəti oyunçuya keçir.',
    textUz: 'Bu navbat taymeridir. Har oʻyinçining navbati uchun belgilangan soniyalar soni bor, bu har xona sozlamalarida oʻrnatiladi. Vaqt tugaganda — navbat keyingi oʻyinçiga oʻtadi.',
    textPl: 'To jest timer tury. Każdy gracz ma określoną liczbę sekund na swoją turę, co jest ustawiane w parametrach każdego pokoju. Gdy czas minie — tura przechodzi do następnego gracza.',
    instruction: 'Nажмите "Далее" чтобы продолжить',
    instructionKk: '"Kелесі" басыңыз',
    instructionEn: 'Click "Next" to continue',
    instructionUk: 'Натисніть "Далі" щоб продовжити',
    instructionKa: 'დააჭირეთ "შემდეგი"',
    instructionAz: '"Növbəti" düyməsini basın',
    instructionUz: '"Keyingi"ni bosing',
    instructionPl: 'Naciśnij przycisk "Dalej"',
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
    titleKa: 'ამოღებული ბარათების მრიცხველი',
    titleAz: 'Bito sayğacı',
    titleUz: 'Bito hisoblagichi',
    titlePl: 'Licznik Bito',
    description: 'Интерфейс игры',
    highlightElements: ['[data-tutorial="bito-counter"]', '[data-tutorial="mobile-bito"]'],
    text: 'Это счетчик карт в бито (побитых карт). Показывает сколько карт уже выбыло из игры.',
    textKk: 'Бұл битодағы (ұтылған) карталар санағышы. Ойыннан қанша карталар санын көрсетеді.',
    textEn: 'This is the discard pile counter (beaten cards). It shows how many cards have already been eliminated from the game.',
    textUk: 'Це лічильник карт у бито (побитих карт). Показує скільки карт вже вибуло з гри.',
    textKa: 'ეს არის ამოღებული ბარათების მრიცხველი. გვიჩვენებს რამდენი ბარათი უკვე გამოვიდა თამაშიდან.',
    textAz: 'Bu bito (vurulmuş kartlar) sayğacıdır. Oyundan neçə kartın çıxdığını göstərir.',
    textUz: 'Bu bito (urilgan kartalar) hisoblagichidir. Oʻyinçining oʻyindan qancha karta chiqib ketganini koʻrsatadi.',
    textPl: 'To jest licznik Bito (pobitych kart). Pokazuje, ile kart wyszło z gry.',
    instruction: 'Nажмите "Далее" чтобы продолжить',
    instructionKk: '"Kелесі" басыңыз',
    instructionEn: 'Click "Next" to continue',
    instructionUk: 'Натисніть "Далі" щоб продовжити',
    instructionKa: 'დააჭირეთ "შემდეგი"',
    instructionAz: '"Növbəti" düyməsini basın',
    instructionUz: '"Keyingi"ni bosing',
    instructionPl: 'Naciśnij przycisk "Dalej"',
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
    titleKa: 'ორი გემბანი თამაშში',
    titleAz: 'Oyunda iki dəstə',
    titleUz: 'Oʼyinda ikki toʼplam',
    titlePl: 'Dwie talie w grze',
    description: 'Структура игры',
    highlightElements: ['[data-tutorial="deck-area"]', '[data-tutorial="mobile-decks"]'],
    text: 'В игре используются 2 колоды карт. Сначала разыгрывается колода №1 между всеми игроками. Когда она заканчивается, начинается колода №2.',
    textKk: 'Ойында 2 карта колодасы пайдаланылады. Алдымен колода №1 барлық ойыншылар арасында ойналады. Ол біткенде, колода №2 басталады.',
    textEn: 'The game uses 2 card decks. First, deck #1 is played among all players. When it runs out, deck #2 begins.',
    textUk: 'У грі використовуються 2 колоди карт. Спочатку розігрується колода №1 між усіма гравцями. Коли вона закінчується, починається колода №2.',
    textKa: 'თამაშში გამოიყენება 2 გემბანი ბარათი. პირველად ყველა მოთამაშეს შორის ითამაშება გემბანი №1. მისი ამოწურვისას იწყება გემბანი №2.',
    textAz: 'Oyunda 2 dəstə kart istifadə olunur. Əvvəlcə bütün oyunçular arasında №1 dəstə oynanır. O bitdikdə №2 dəstə başlayır.',
    textUz: 'Oʻyinça 2 ta karta toʻplami ishlatiladi. Avval barcha oʻyinçilar oʻrtasida №1 toʻplam oʻynaladi. U tugaganda №2 toʻplam boshlanadi.',
    textPl: 'W grze używane są 2 talie kart. Najpierw wszyscy gracze grają talią №1. Gdy się skończy, zaczyna się talia №2.',
    instruction: 'Nажмите "Далее" чтобы продолжить',
    instructionKk: '"Kелесі" басыңыз',
    instructionEn: 'Click "Next" to continue',
    instructionUk: 'Натисніть "Далі" щоб продовжити',
    instructionKa: 'დააჭირეთ "შემდეგი"',
    instructionAz: '"Növbəti" düyməsini basın',
    instructionUz: '"Keyingi"ni bosing',
    instructionPl: 'Naciśnij przycisk "Dalej"',
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
    titleKa: 'დახარისხება და ბარათების მრიცხველი',
    titleAz: 'Çeşidləmə və kart sayğacı',
    titleUz: 'Saralash va karta hisoblagichi',
    titlePl: 'Sortowanie i licznik kart',
    description: 'Интерфейс игры',
    highlightElements: ['[data-tutorial="player-card-count"]', '[data-tutorial="sort-button"]'],
    text: 'Счетчик карт показывает количество карт в вашей руке в реальном времени.\nКнопкой сортировки вы меняете расположение карт в руке',
    textKk: 'Карта санағышы қолыңыздағы карталар санын нақты уақытта көрсетеді.\nСұрыптау түймесі арқылы қолдағы карталардың орналасуын өзгертеді',
    textEn: 'The card counter shows the number of cards in your hand in real time.\nThe sort button changes the arrangement of cards in your hand.',
    textUk: 'Лічильник карт показує кількість карт у вашій руці в реальному часі.\nКнопка сортування змінює розташування карт у руці.',
    textKa: 'ბარათების მრიცხველი გვიჩვენებს ბარათების რაოდენობას თქვენს ხელში რეალურ დროში.\nდახარისხების ღილაკი ცვლის ბარათების განლაგებას ხელში.',
    textAz: 'Kartları çeşidləmək üçün "Çeşidlə" düyməsini basın. Sayğac əldəki kartların sayını göstərir.',
    textUz: 'Kartalar hisoblagichi qo\u02bblingizdagi kartalar sonini real vaqtda ko\u02bbrsatadi.\nSaralash tugmasi qo\u02bbldagi kartalar joylashuvini o\u02bbzgartiradi.',
    textPl: 'Licznik kart pokazuje liczb\u0119 kart w r\u0119ce w czasie rzeczywistym.\nPrzycisk sortowania zmienia uk\u0142ad kart w r\u0119ce.',
    instruction: 'Nажмите "Далее" чтобы продолжить',
    instructionKk: '"Kелесі" басыңыз',
    instructionEn: 'Click "Next" to continue',
    instructionUk: 'Натисніть "Далі" щоб продовжити',
    instructionKa: 'დააჭირეთ "შემდეგი"',
    instructionAz: '"Növbəti" düyməsini basın',
    instructionUz: '"Keyingi"ni bosing',
    instructionPl: 'Naciśnij przycisk "Dalej"',
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
    titleKa: 'სცადეთ დახარისხება',
    titleAz: 'Çeşidləməni sınayın',
    titleUz: 'Saralashni sinab koʼring',
    titlePl: 'Wypróbuj sortowanie',
    description: 'Интерактивная сортировка',
    highlightElements: ['[data-tutorial="sort-button"]'],
    text: 'Нажмите на "По масти", чтобы сортировать карты в руке по номиналу.',
    textKk: 'Карталарды номинал бойынша сұрыптау үшін "Сапта бойынша" басыңыз.',
    textEn: 'Click "By Suit" to sort the cards in your hand by rank.',
    textUk: 'Натисніть "За мастю", щоб сортувати карти в руці за номіналом.',
    textKa: 'დააჭირეთ "მასით" ბარათების ხელში ნომინალის მიხედვით დასახარისხებლად.',
    textAz: 'Kartları çeşidləmək üçün "Çeşidlə" düyməsini basın.',
    textUz: 'Kartalarni saralash uchun "Saralash" tugmasini bosing.',
    textPl: 'Naciśnij przycisk "Sortuj", aby posortować karty według koloru.',
    instruction: 'Nажмите на кнопку сортировки',
    instructionKk: 'Сұрыптау түймесін басыңыз',
    instructionEn: 'Click the sort button',
    instructionUk: 'Натисніть кнопку сортування',
    instructionKa: 'დააჭირეთ დახარისხების ღილაკს',
    instructionAz: '"Sırala" düyməsini basın',
    instructionUz: '"Saralash" tugmasini bosing',
    instructionPl: 'Naciśnij przycisk "Sortuj"',
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
    titleKa: 'ბარათები დახარისხულია',
    titleAz: 'Əldəki kartların çeşidlənməsi',
    titleUz: 'Qoldagi kartalarni saralash',
    titlePl: 'Sortowanie kart w ręce',
    description: 'Результат сортировки',
    highlightElements: ['[data-tutorial="player-hand"]'],
    text: 'Теперь ваши карты в руке отсортированы по номиналу от меньшего к большему.',
    textKk: 'Енді қолыңыздағы карталар номинал бойынша кішіден үлкенге дейін сұрыпталған.',
    textEn: 'Your cards in hand are now sorted by rank from lowest to highest.',
    textUk: 'Тепер ваші карти в руці відсортовані за номіналом від меншого до більшого.',
    textKa: 'ახლა თქვენი ბარათები ხელში დახარისხებულია ნომინალის მიხედვით პატარიდან დიდამდე.',
    textAz: 'Kartlarınız əldə nominal üzrə kiçikdən böyüyə sıralanmışdır.',
    textUz: 'Endi qoʻlingizdagi kartalar nominal boʻyicha kichikdan kattaga saralangan.',
    textPl: 'Twoje karty w ręce są teraz posortowane według wartości od najniższej do najwyższej.',
    instruction: 'Nажмите "Далее" чтобы продолжить',
    instructionKk: '"Kелесі" басыңыз',
    instructionEn: 'Click "Next" to continue',
    instructionUk: 'Натисніть "Далі" щоб продовжити',
    instructionKa: 'დააჭირეთ "შემდეგი"',
    instructionAz: '"Növbəti" düyməsini basın',
    instructionUz: '"Keyingi"ni bosing',
    instructionPl: 'Naciśnij przycisk "Dalej"',
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
    titleKa: 'ერთიდაითი ბარათები',
    titleAz: 'Eyni kartlar',
    titleUz: 'Bir xil kartalar',
    titlePl: 'Identyczne karty',
    description: 'Правила одинаковых карт',
    highlightElements: ['[data-tutorial="player-hand"]'],
    text: 'Так как в игре смешаны 4 стандартных колоды по 36 карт воедино, встречаются одинаковые по масти и номиналу карты. Такие карты бьют сами себя. Исключение - Король пики. Король пики сам себя побить не может',
    textKk: 'Ойында 4 стандартты 36 карталық колода араластырылғандықтан, сапта мен номиналы бірдей карталар кездеседі. Мұндай карталар өздеріне өздері ұра алады. Ерекшелік - Піка Көрпесі. Піка Көрпесі өзіне-өзі ұра ала алмайды',
    textEn: 'Since the game combines 4 standard 36-card decks, you will encounter cards of the same suit and rank. Such cards beat each other. Exception — King of Spades. The King of Spades cannot beat itself.',
    textUk: 'Оскільки в грі змішані 4 стандартні колоди по 36 карт, зустрічаються однакові за мастю та номіналом карти. Такі карти б\'ють самі себе. Виняток — Король пік. Король пік сам себе побити не може.',
    textKa: 'ვინაიდან თამაშში შერეულია 4 სტანდარტული გემბანი 36 ბარათით, გვხვდება ერთი და იმავე მასის და ნომინალის ბარათები. ასეთი ბარათები ერთმანეთს სცემენ. გამონაკლისია პიკის მეფე. პიკის მეფეს თავი ვერ სცემს.',
    textAz: 'Oyunda 4 standart 36 kartlıq dəstə qarışdırıldığından, eyni rəng və nominallı kartlarla rəst gəlinir. Belə kartlar bir-birini döyür. Amma Maqa Padshahı özünü döyə bilməz.',
    textUz: 'Oʻyinça 4 ta standart 36 kartali toʻplam aralashtirilib, shuning uchun bir xil rang va nominalli kartalar uchraydi. Bunday kartalar bir-birini uradi. Lekin Pik Qiroli oʻzini ura olmaydi.',
    textPl: 'Ponieważ w grze połączono 4 standardowe talie po 36 kart, spotykasz karty o tym samym kolorze i wartości. Takie karty biją się nawzajem. Wyjątek — Król Pik nie może pobić samego siebie.',
    instruction: 'Nажмите "Далее" чтобы продолжить',
    instructionKk: '"Kелесі" басыңыз',
    instructionEn: 'Click "Next" to continue',
    instructionUk: 'Натисніть "Далі" щоб продовжити',
    instructionKa: 'დააჭირეთ "შემდეგი"',
    instructionAz: '"Növbəti" düyməsini basın',
    instructionUz: '"Keyingi"ni bosing',
    instructionPl: 'Naciśnij przycisk "Dalej"',
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
    titleKa: 'როგორ მუშაობს?',
    titleAz: 'Bu necə işləyir?',
    titleUz: 'Bu qanday ishlaydi?',
    titlePl: 'Jak to działa?',
    description: 'Практика одинаковых карт',
    highlightElements: ['[data-tutorial="player-hand"]', '[data-tutorial="table-area"]'],
    text: 'Нажмите на 6 черви чтобы отбиться. Карты с одинаковым номиналом и мастью бьют сами себя',
    textKk: 'Қорғану үшін 6 жүрекке басыңыз. Бірдей номинал мен сапталы карталар өздеріне өздері ұра алады',
    textEn: 'Click the 6 of Hearts to defend. Cards with the same rank and suit beat each other.',
    textUk: 'Натисніть на 6 червей щоб відбитися. Карти з однаковим номіналом та мастю б\'ють самі себе.',
    textKa: 'დააჭირეთ გულის 6-ს დასაცავად. ერთი და იმავე ნომინალისა და მასის ბარათები ერთმანეთს სცემენ.',
    textAz: 'Eyni nominallı kartlar (məsələn, iki altılıq) bir-birini döyür! 6 ürəyə basın ki, masadakı 6 ürəyi döyəsiniz.',
    textUz: 'Bir xil nominalli kartalar (masalan, ikki oltilik) bir-birini uradi! Stoldagi 6 yurakni urish uchun 6 yurakni bosing.',
    textPl: 'Karty o tej samej wartości (np. dwie szóstki) biją się nawzajem! Naciśnij 6 Kier, aby pobić 6 Kier na stole.',
    instruction: 'Nажмите на 6 черви в вашей руке',
    instructionKk: 'Қолыңыздағы 6 жүрекке басыңыз',
    instructionEn: 'Click the 6 of Hearts in your hand',
    instructionUk: 'Натисніть на 6 червей у вашій руці',
    instructionKa: 'დააჭირეთ 6 გულის თქვენს ხელში',
    instructionAz: 'Əlinizdeki 6 ürəyə basın',
    instructionUz: 'Qoʻlingizdagi 6 yurakni bosing',
    instructionPl: 'Naciśnij 6 Kier w swojej ręce',
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
    titleKa: 'პიკის მეფე — სცემს ყველაფერს, კოზირისგან დამოუკიდებლად',
    titleAz: 'Maça Padşahı — kozdan asılı olmayaraq hər şeyi döyür',
    titleUz: 'Pik Qiroli — kozirdan qatʼi nazar hamma narsani uradi',
    titlePl: 'Król Pik — bije wszystko niezależnie od atutu',
    description: 'Специальные карты',
    highlightElements: ['[data-tutorial="player-hand"]', '[data-tutorial="table-area"]'],
    text: 'У вас в руке есть карта Король пики - найдите её. Это очень сильная карта с уникальной механикой. Он может побить любую карту в игре, независимо от козыря, <red>кроме самого себя</red>. Побейте королем пики козырный туз на столе',
    textKk: 'Қолыңызда Піка Көрпесі бар — оны табыңыз. Бұл ерекше механикалық өте күшті карта. Ол қозырдан тәуелсіз ойындағы кез картаны ұра ала алады, <red>өзінен басқа</red>. Үстелдегі қозыр түзін Піка Көрпесімен ұрыңыз',
    textEn: 'You have the King of Spades in your hand — find it. This is a very powerful card with a unique mechanic. It can beat any card in the game regardless of trump, <red>except itself</red>. Beat the trump ace on the table with the King of Spades.',
    textUk: 'У вас у руці є карта Король пік — знайдіть її. Це дуже сильна карта з унікальною механікою. Вона може побити будь-яку карту в грі, незалежно від козиря, <red>крім самої себе</red>. Поб\'йте Королем пік козирний туз на столі.',
    textKa: 'თქვენს ხელში არის პიკის მეფე — იპოვეთ იგი. ეს ძალიან ძლიერი ბარათია უნიკალური მექანიკით. მას შეუძლია სცეს ნებისმიერ ბარათს თამაშში, კოზირისგან დამოუკიდებლად, <red>გარდა საკუთარი თავისა</red>. სცეთ პიკის მეფით მაგიდაზე კოზირ ტუზს.',
    textAz: 'Qolunuzda Maça Padshahı var — onu tapın. Bu, özündən başqa istənilən kartı döyən çox gücklü kartdır. Masadakı koz tuzu Maça Padshahı ilə döyün.',
    textUz: 'Qoʻlingizdagi Pik Qiroli bor — uni toping. Bu, oʻzidan tashqari har qanday kartani ura oladigan juda kuchli karta. Stoldagi koz tuzini Pik Qiroli bilan uring.',
    textPl: 'Masz Króla Pik w ręce — znajdź go. To bardzo silna karta, która bije każdą kartę oprócz siebie. Pobić asa atutowego na stole Królem Pik.',
    instruction: 'Nажмите на Короля пики в вашей руке',
    instructionKk: 'Қолыңыздағы Піка Көрпесіне басыңыз',
    instructionEn: 'Click the King of Spades in your hand',
    instructionUk: 'Натисніть на Короля пік у вашій руці',
    instructionKa: 'დააჭირეთ პიკის მეფეს თქვენს ხელში',
    instructionAz: 'Əlinizdeki Maça Padshahına basın',
    instructionUz: 'Qoʻlingizdagi Pik Qirolini bosing',
    instructionPl: 'Naciśnij Króla Pik w swojej ręce',
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
    titleAz: '777 kartı — oyundakı bütün kartları döyür',
    titleUz: '777 karta — oʻyinça barcha kartalarni uradi',
    titlePl: 'Karta 777 — bije wszystkie karty w grze',
    description: 'Спеціальні карти',
    highlightElements: ['[data-tutorial="player-hand"]', '[data-tutorial="table-area"]'],
    text: '777 - бьет любую карту! В колоде всего одна.\nС карты 777 нельзя походить! Только биться. Если в конце игры у вас осталась только эта карта в руке, и начинается ваш ход - вы его пропустите',
    textKk: '777 — кез картаны ұрады! Колодада тек біреу.\n777 картасымен шабуға шығармайды! Тек қорғануға арналған. Егер ойын соңында қолыңызда тек осы карта қалса және сіздің қадамыңыз келсе — оны өткізесіз',
    textEn: '777 beats any card! There is only one in the deck.\nYou cannot attack with the 777 card! Only defend. If at the end of the game you have only this card in hand and it is your turn — you will skip it.',
    textUk: '777 — б\'є будь-яку карту! У колоді лише одна.\nЗ карти 777 не можна ходити! Тільки відбиватися. Якщо в кінці гри у вас залишилась лише ця карта в руці, і починається ваш хід — ви його пропустите.',
    textKa: '777 — სცემს ნებისმიერ ბარათს! გემბანში მხოლოდ ერთია.\n777 ბარათით ვერ ივლი! მხოლოდ დაცვა. თუ თამაშის ბოლოს ხელში მხოლოდ ეს ბარათი გრცებათ და თქვენი სვლაა — გამოტოვებთ.',
    textAz: '777 istənilən kartı döyür! Dəstədə yalnız birə var.\n777 kartı ilə hücum etmək olmaz! Yalnız müdafiə üçündür. Oyunun sonunda əlinizdə yalnız bu kart qalsa və sizin növbəniz gəlsə — onu buraxırsınız.',
    textUz: '777 har qanday kartani uradi! Toʻplamda faqat bitta bor.\n777 karta bilan hujum qilish mumkin emas! Faqat himoya uchun. Oʻyin oxirida qoʻlingizda faqat shu karta qolsa va sizning navbatingiz kelsa — uni oʻtkazib yuborasiz.',
    textPl: '777 bije każdą kartę! Jest tylko jedna w talii.\nNie można atakować kartą 777! Tylko się bronić. Jeśli na końcu gry masz tylko tę kartę w ręce i zaczyna się twoja tura — pomijasz ją.',
    instruction: 'Nажмите на 777 в вашей руке',
    instructionKk: 'Қолыңыздағы 777 басыңыз',
    instructionEn: 'Click the 777 in your hand',
    instructionUk: 'Натисніть на 777 у вашій руці',
    instructionKa: 'დააჭირეთ 777 თქვენს ხელში',
    instructionAz: 'Əlinizdeki 777-ə basın',
    instructionUz: 'Qoʻlingizdagi 777-ni bosing',
    instructionPl: 'Naciśnij 777 w swojej ręce',
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
    titleKa: 'პიკის ტუზი — უნიკალური მექანიკა',
    titleAz: 'Maça Tuzu — unikal mexanika',
    titleUz: 'Pik Tuzi — noyob mexanika',
    titlePl: 'As Pik — unikalna mechanika',
    description: 'Специальные карты',
    highlightElements: ['[data-tutorial="player-hand"]', '[data-tutorial="table-area"]'],
    text: 'Короля пики может побить только Туз пики и 777, больше никакая карта не в силах сделать этого\nНайдите в своей руке Туз пики. Нажмите на него чтобы отбить короля пики на столе',
    textKk: 'Піка Көрпесін тек Піка Түзі мен 777 ұра ала алады, басқа ешқанда карта бұны істе асыра алмайды\nҚолыңызда Піка Түзін табыңыз. Үстелдегі Піка Көрпесін қорғау үшін оны басыңыз',
    textEn: 'The King of Spades can only be beaten by the Ace of Spades and 777, no other card can do this.\nFind the Ace of Spades in your hand. Click it to beat the King of Spades on the table.',
    textUk: 'Короля пік може побити лише Туз пік та 777, жодна інша карта не здатна це зробити.\nЗнайдіть у своїй руці Туз пік. Натисніть на нього щоб відбити Короля пік на столі.',
    textKa: 'პიკის მეფეს შეუძლია სცეს მხოლოდ პიკის ტუზმა და 777-მა, სხვა ბარათს ეს არ შეუძლია.\nიპოვეთ ხელში პიკის ტუზი. დააჭირეთ მას მაგიდაზე პიკის მეფის დასაცავად.',
    textAz: 'Maça Padshahını yalnız Maça Tuzu və 777 döyə bilər, başqa heç bir kart bunu edə bilməz.\nƏlinizdeki Maça Tuzunu tapın. Masadakı Maça Padshahını döymək üçün ona basın.',
    textUz: 'Pik Qirolini faqat Pik Tuzi va 777 ura oladi, boshqa hech qanday karta buni qila olmaydi.\nQoʻlingizdagi Pik Tuzini toping. Stoldagi Pik Qirolini urish uchun unga bosing.',
    textPl: 'Króla Pik może pobić tylko As Pik i 777, żadna inna karta tego nie potrafi.\nZnajdź Asa Pik w swojej ręce. Naciśnij go, aby pobić Króla Pik na stole.',
    instruction: 'Nажмите на Туз пики в вашей руке',
    instructionKk: 'Қолыңыздағы Піка Түзіне басыңыз',
    instructionEn: 'Click the Ace of Spades in your hand',
    instructionUk: 'Натисніть на Туз пік у вашій руці',
    instructionKa: 'დააჭირეთ პიკის ტუზს თქვენს ხელში',
    instructionAz: 'Əlinizdeki Maça Tuzuna basın',
    instructionUz: 'Qoʻlingizdagi Pik Tuzini bosing',
    instructionPl: 'Naciśnij Asa Pik w swojej ręce',
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
    titleKa: 'გადაცემა',
    titleAz: 'Ötürmə',
    titleUz: 'Oʼtkazish',
    titlePl: 'Przekazanie',
    description: 'Механика перевода',
    highlightElements: ['[data-tutorial="player-hand"]', '[data-tutorial="table-area"]'],
    text: 'Игра всегда с механикой переводного. Если на вас походили картой, и у вас в руке есть карта с таким же номиналом (индексом), вы можете перевести ход на следующего игрока, выкинув эту карту на стол',
    textKk: 'Ойын әрқашан аудармалық механикасымен жүреді. Егер сізге картамен шабуға шықса және қолыңызда сондай номиналды (индексті) карта болса, сіз оны үстелге тастап қадамды келесі ойыншыға аудара аласыз',
    textEn: 'The game always uses the transfer mechanic. If a card was played against you and you have a card with the same rank (index) in hand, you can transfer the turn to the next player by placing that card on the table.',
    textUk: 'Гра завжди з механікою переведення. Якщо на вас походили картою, і у вас у руці є карта з таким же номіналом (індексом), ви можете перевести хід на наступного гравця, кинувши цю карту на стіл.',
    textKa: 'თამაში ყოველთვის გადაცემის მექანიკით. თუ თქვენზე ივლეს ბარათით, და ხელში გაქვთ ბარათი ამავე ნომინალით (ინდექსით), შეგიძლიათ გადასცეთ სვლა შემდეგ მოთამაშეს, ეს ბარათი მაგიდაზე გადაყრით.',
    textAz: 'Oyun həmişə ötürmə mexanikası ilə gedir. Əgər sizin üzərinizə kart oynanmışsa və əlinizdə eyni nominallı (indeksli) kart varsa, onu masaya ataraq növbəni növbəti oyunçuya ötürə bilərsiniz.',
    textUz: 'Oʻyin har doim oʻtkazish mexanikasi bilan ketadi. Agar sizga karta bilan hujum qilingan boʻlsa va qoʻlingizda xuddi shunday nominalli (indeksli) karta boʻlsa, uni stolga tashlash orqali navbatni keyingi oʻyinçiga oʻtkaza olasiz.',
    textPl: 'Gra zawsze toczy się z mechaniką przekazania. Jeśli zaatakowano cię kartą i masz w ręce kartę o tej samej wartości (indeksie), możesz przekazać turę następnemu graczowi, kładąc tę kartę na stól.',
    instruction: 'Nажмите на 7 пики в вашей руке',
    instructionKk: 'Қолыңыздағы 7 пікаға басыңыз',
    instructionEn: 'Click the 7 of Spades in your hand',
    instructionUk: 'Натисніть на 7 пік у вашій руці',
    instructionKa: 'დააჭირეთ 7 პიკის თქვენს ხელში',
    instructionAz: 'Əlinizdeki 7 maçaya basın',
    instructionUz: 'Qoʻlingizdagi 7 pikni bosing',
    instructionPl: 'Naciśnij 7 Pik w swojej ręce',
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
    titleKa: 'საათის ისრის მიმართულებით სვლა',
    titleAz: 'Saat əqrəbi istiqamətində növbə',
    titleUz: 'Soat yoʼnalishida navbat',
    titlePl: 'Kolejność zgodna z ruchem wskazówek zegara',
    description: 'Направление игры',
    highlightElements: ['[data-tutorial="opponent-info"]:nth-of-type(1)', '[data-tutorial="opponent-info"]:nth-of-type(2)', '[data-tutorial="opponent-info"]:nth-of-type(3)'],
    text: 'Игроки ходят друг на друга по часовой стрелке, но есть исключение:\nЕсли какой-то игрок начинает свой ход с 10-ки, выкинув ее на стол, <red>направление игры меняется</red> на против часовой стрелки',
    textKk: 'Ойыншылар сағат тілі бойынша біріне бірі қадам жасайды, бірақ ерекшелік бар:\nЕгер қандай ойыншы 10-ды үстелге тастап өз қадамын бастаса, <red>ойын бағыты өзгереді</red> сағат тіліне қарсы',
    textEn: 'Players take turns clockwise, but there is an exception:\nIf a player starts their turn by playing a 10, <red>the direction of play reverses</red> to counter-clockwise.',
    textUk: 'Гравці ходять один на одного за годинниковою стрілкою, але є виняток:\nЯкщо якийсь гравець починає свій хід з 10-ки, кинувши її на стіл, <red>напрямок гри змінюється</red> на проти годинникової стрілки.',
    textKa: 'მოთამაშეები ერთმანეთზე ივლიან საათის ისრის მიმართულებით, მაგრამ არის გამონაკლისი:\nთუ რომელიმე მოთამაშე სვლას 10-ით იწყებს, მაგიდაზე გადაყრით, <red>თამაშის მიმართულება იცვლება</red> საათის ისრის საწინააღმდეგოდ.',
    textAz: 'Oyunçular saat əqrəbi istiqamətində bir-birinə hücum edir, lakin istisna var:\nƏgər hansısa oyunçu 10-u masaya ataraq öz növbəsini başlatsa, <red>oyunun istiqaməti dəyişir</red> saat əqrəbinə zədd istiqamətə.',
    textUz: 'Oʻyinçilar soat yoʻnalishida bir-biriga hujum qiladi, lekin istisno bor:\nAgar biron oʻyinçi 10-ni stolga tashlab oʻz navbatini boshlasa, <red>oʻyin yoʻnalishi oʻzgaradi</red> soat yoʻnalishiga qarama-qarshi.',
    textPl: 'Gracze atakują się nawzajem zgodnie z ruchem wskazówek zegara, ale jest wyjątek:\nJeśli gracz zaczyna turę od 10, kładąc ją na stól, <red>kierunek gry zmienia się</red> na przeciwny do ruchu wskazówek zegara.',
    instruction: 'Nажмите "Далее" чтобы продолжить',
    instructionKk: '"Kелесі" басыңыз',
    instructionEn: 'Click "Next" to continue',
    instructionUk: 'Натисніть "Далі" щоб продовжити',
    instructionKa: 'დააჭირეთ "შემდეგი"',
    instructionAz: '"Növbəti" düyməsini basın',
    instructionUz: '"Keyingi"ni bosing',
    instructionPl: 'Naciśnij przycisk "Dalej"',
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
    titleKa: 'სვლა 10-ით',
    titleAz: '10-dan növbə',
    titleUz: '10 dan navbat',
    titlePl: 'Tura od 10',
    description: 'Смена направления',
    highlightElements: ['[data-tutorial="opponent-info"]:nth-of-type(3)', '[data-tutorial="player-hand"]'],
    text: 'Если игрок начинает свой ход с карты 10, то меняется направление игры. Сейчас ход Бота 3, он должен походить на вас',
    textKk: 'Егер ойыншы 10 картасымен өз қадамын бастаса, ойын бағыты өзгереді. Қазір Қадамы 3, ол сізге қарай шабуға шығуы керек',
    textEn: 'If a player starts their turn with a 10 card, the direction of play changes. Now it is Bot 3\'s turn, and he must attack you.',
    textUk: 'Якщо гравець починає свій хід з карти 10, то змінюється напрямок гри. Зараз хід Бота 3, він має походити на вас.',
    textKa: 'თუ მოთამაშე სვლას 10 ბარათით იწყებს, თამაშის მიმართულება იცვლება. ახლა ბოტ 3-ის სვლაა, მან თქვენზე უნდა ივლიოს.',
    textAz: 'Əgər oyunçu 10 kartı ilə növbəsini başlatsa, oyunun istiqaməti dəyişir. İndi Bot 3-ün növbəsidir, o sizin üzərinizə hücum etməlidir.',
    textUz: 'Agar oʻyinçi 10 karta bilan navbatini boshlasa, oʻyin yoʻnalishi oʻzgaradi. Endi Bot 3-ning navbati, u sizga hujum qilishi kerak.',
    textPl: 'Jeśli gracz zaczyna turę kartą 10, kierunek gry się zmienia. Teraz tura Bota 3, musi zaatakować ciebie.',
    instruction: 'Nажмите "Далее" чтобы продолжить',
    instructionKk: '"Kелесі" басыңыз',
    instructionEn: 'Click "Next" to continue',
    instructionUk: 'Натисніть "Далі" щоб продовжити',
    instructionKa: 'დააჭირეთ "შემდეგი"',
    instructionAz: '"Növbəti" düyməsini basın',
    instructionUz: '"Keyingi"ni bosing',
    instructionPl: 'Naciśnij przycisk "Dalej"',
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
    titleKa: 'მოთამაშე ბოტ 3-მა დაიწყო სვლა 10-ით, შეცვალა თამაშის მიმართულება.',
    titleAz: 'Bot 3 oyunçusu 10 ilə növbəsini başlatdı, oyunun istiqamətini dəyişdirdi.',
    titleUz: 'Bot 3 oʼyinchisi 10 bilan navbatini boshladi, oʼyin yoʼnalishini oʼzgartirdi.',
    titlePl: 'Gracz Bot 3 rozpoczął turę kartą 10, zmieniając kierunek gry.',
    description: 'Смена направления — 10-ка на столе',
    highlightElements: ['[data-tutorial="opponent-info"]:nth-of-type(3)', '[data-tutorial="opponent-info"]:nth-of-type(2)', '[data-tutorial="table-area"]'],
    text: 'Теперь Бот 3 ходит не на вас, а на игрока Мадина',
    textKk: 'Енді Қадам 3 сізге емес, Мадина ойыншысына қарай жүреді',
    textEn: 'Now Bot 3 attacks not you, but the player Madina.',
    textUk: 'Тепер Бот 3 ходить не на вас, а на гравця Мадіна.',
    textKa: 'ახლა ბოტ 3 თქვენზე კი არ ივლის, არამედ მოთამაშე მადინა.',
    textAz: 'İndi Bot 3 sizin üzərinizə deyil, Madina oyunçusuna hücum edir.',
    textUz: 'Endi Bot 3 sizga emas, Madina oʻyinçisiga hujum qiladi.',
    textPl: 'Teraz Bot 3 atakuje nie ciebie, ale gracza Madina.',
    instructionKa: 'დააჭირეთ "შემდეგი"',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    instructionKk: '"Келесі" басыңыз',
    instructionEn: 'Click "Next" to continue',
    instructionUk: 'Натисніть "Далі" щоб продовжити',
    instructionAz: '"Növbəti" düyməsini basın',
    instructionUz: '"Növbəti" düyməsini basın',
    instructionPl: 'Naciśnij przycisk "Dalej"',
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
    titleKa: 'ბარათის გადაცემა აგენვს თამაშის მიმართულებას აგბრუნებს',
    titleAz: 'Kartın ötürülməsi oyunun əvvəlki istiqamətini qaytarr',
    titleUz: 'Kartani oʼtkazish oʼyinning avvalgi yoʼnalishini qaytaradi',
    titlePl: 'Przekazanie karty przywraca poprzedni kierunek gry',
    description: 'Перевод 10-кой возвращает направление',
    highlightElements: ['[data-tutorial="opponent-info"]:nth-of-type(2)', '[data-tutorial="opponent-info"]:nth-of-type(3)', '[data-tutorial="table-area"]'],
    text: 'Игрок Мадина перевела 10-кой пики ход на игрока Бот 3. Теперь игра снова идет по часовой стрелке.',
    textKk: 'Мадина ойыншысы Піка 10-мен Қадам 3 ойыншысына қадамды аударды. Енді ойын қайтадан сағат тілі бойынша жүреді.',
    textEn: 'Player Madina transferred the turn to Bot 3 using the 10 of Spades. Now the game goes clockwise again.',
    textUk: 'Гравець Мадіна перевела 10-кою пік хід на гравця Бот 3. Тепер гра знову йде за годинниковою стрілкою.',
    textKa: 'მოთამაშე მადინამ პიკის 10-ით სვლა გადასცა ბოტ 3-ს. ახლა თამაში კვლავ საათის ისრის მიმართულებით მიდის.',
    textAz: 'Madina oyunçusu 10 maça ilə növbəni Bot 3-ə ötürdü. İndi oyun yenidən saat əqrəbi istiqamətində gedir.',
    textUz: 'Madina oʻyinçisi pik 10 bilan navbatni Bot 3-ga oʻtkazdi. Endi oʻyin yana soat yoʻnalishida ketadi.',
    textPl: 'Gracz Madina przekazała turę do Bota 3 za pomocą 10 Pik. Teraz gra znowu idzie zgodnie z ruchem wskazówek zegara.',
    instruction: 'Nажмите "Далее" чтобы продолжить',
    instructionKk: '"Kелесі" басыңыз',
    instructionEn: 'Click "Next" to continue',
    instructionUk: 'Натисніть "Далі" щоб продовжити',
    instructionKa: 'დააჭირეთ "შემდეგი"',
    instructionAz: '"Növbəti" düyməsini basın',
    instructionUz: '"Keyingi"ni bosing',
    instructionPl: 'Naciśnij przycisk "Dalej"',
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
    titleKa: '10-ზე გადაცემა გამოიყენება',
    titleAz: '10-a proezdnoy tətbiq olunur',
    titleUz: '10 ga proezdnoy qoʻllaniladi',
    titlePl: 'Proezdnoy stosuje się do 10',
    description: 'Проездной с козырной 10-кой',
    highlightElements: ['[data-tutorial="opponent-info"]:nth-of-type(3)', '[data-tutorial="table-area"]'],
    text: 'У игрока Бот 3 в руке была козырная 10-ка, он воспользовался проездным, и перевел ход снова на игрока Мадина. Сменив направление игры.',
    textKk: 'Қадам 3 ойыншысының қолында қозыр 10 болды, ол жолаушыдан пайдаланып, Қадамды Қайтадан Мадина ойыншысына аударды. Ойын бағытын өзгертті.',
    textEn: 'Bot 3 had a trump 10 in hand, used the pass-through, and transferred the turn back to player Madina. Changing the direction of play.',
    textUk: 'У гравця Бот 3 в руці була козирна 10-ка, він скористався проїзним, і перевів хід знову на гравця Мадіна. Змінивши напрямок гри.',
    textKa: 'ბოტ 3-ს ხელში ერთი კოზირი 10 იყო, გამოიყენა გადაცემა და სვლა კვლავ მოთამაშე მადინას გადასცა. შეცვალა თამაშის მიმართულება.',
    textAz: 'Bot 3-ün əlində koz 10 var idi, o proezdnoydan istifadə etdi və növbəni yenidən Madina oyunçusuna ötürdü. Oyunun istiqamətini dəyişdirdi.',
    textUz: 'Bot 3-ning qoʻlidagi kozir 10 bor edi, u oʻtkazishdan foydalandi va navbatni yana Madina oʻyinçisiga oʻtkazdi. Oʻyin yoʻnalishini oʻzgartirdi.',
    textPl: 'Bot 3 miał w ręce kozyrowego 10, użył proezdnoy i przekazał turę z powrotem graczowi Madina. Zmieniając kierunek gry.',
    instruction: 'Nажмите "Далее" чтобы продолжить',
    instructionKk: '"Kелесі" басыңыз',
    instructionEn: 'Click "Next" to continue',
    instructionUk: 'Натисніть "Далі" щоб продовжити',
    instructionKa: 'დააჭირეთ "შემდეგი"',
    instructionAz: '"Növbəti" düyməsini basın',
    instructionUz: '"Keyingi"ni bosing',
    instructionPl: 'Naciśnij przycisk "Dalej"',
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
    titleKa: '6 რიგის გარეშე',
    titleAz: '6 növbədənkənar',
    titleUz: '6 navbatdan tashqari',
    titlePl: 'Wyjątek dla 6',
    description: 'Подкидывание 6-ки любым игроком',
    text: 'По правилам игры, обороняющемуся игроку могут подкидывать только соседи. Но если кто-то походил с 6-ки, то любой игрок за столом может подкинуть 6-ки, даже если не является соседом',
    textKk: 'Ойын ережелері бойынша, қорғаушы ойыншыға тек көршілер қосымша карта ұра алады. Бірақ егер кімдер 6-мен шабуға шықса, үстел басындағы кез ойыншы 6-ларды қосымшы болмаса да қоса алады',
    textEn: 'By the rules, only neighbors can add cards to the defender. But if someone started with a six, any player at the table can add sixes, even if they are not a neighbor.',
    textUk: 'За правилами гри, захисному гравцю можуть підкидати лише сусіди. Але якщо хтось походив з 6-ки, то будь-який гравець за столом може підкинути 6-ки, навіть якщо не є сусідом.',
    textKa: 'თამაშის წესების მიხედვით, მცველ მოთამაშეს შეუძლიათ მხოლოდ მეზობლებმა მიაყარონ. მაგრამ თუ ვინმე 6-ით ივლის, ნებისმიერ მოთამაშეს მაგიდასთან შეუძლია 6-ები მიაყაროს, თუნდაც მეზობელი არ იყოს.',
    textAz: 'Oyun qaydalarına görə, müdafiəçiyə yalnız qonşular kart ata bilər. Lakin əgər kimsə 6-dan başladısa, masadakı istənilən oyunçu 6-lar ata bilər, qonşu olmasa belə.',
    textUz: 'Oʻyin qoidalariga koʻra, himoyachiga faqat qoʻshnilar karta tashlashi mumkin. Lekin agar kimdir 6-dan boshlagan boʻlsa, stoldagi istalgan oʻyinchi 6-larni tashlashi mumkin, qoʻshni boʻlmasa ham.',
    textPl: 'Według zasad gry, tylko sąsiedzi mogą dokładać karty do obrońcy. Ale jeśli ktoś zaczął od szóstki, każdy gracz przy stole może dokładać szóstki, nawet jeśli nie jest sąsiadem.',
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
    titleKa: '6 რიგის გარეშე',
    titleAz: '6 növbədənkənar',
    titleUz: '6 navbatdan tashqari',
    titlePl: 'Wyjątek dla 6',
    description: 'Подкидывание 6-ок на стол',
    text: 'У Камилы и Бота 3 в руке нет карт, которые они могли бы подкинуть, но так как Камила изначально походила с 6-ки, ход перешел к вам. Вы можете подкинуть 6-ки Мадине, хоть и не являетесь ее соседом. Десятки в данном случае подкидывать нельзя.',
    textKk: 'Камила мен Қадам 3 қолында қоса алатын карталар жоқ, бірақ Камила бастапқыда 6-мен шабуға шыққандықтан, қадам сізге өтті. Сіз Мадинаға 6-ларды қоса ала аласыз, көршісі болмасаңыз да. Бұл жағдайда ондықтарды қосуға болмайды.',
    textEn: 'Kamila and Bot 3 have no cards to add, but since Kamila originally started with a six, the turn passed to you. You can add sixes to Madina, even though you are not her neighbor. Tens cannot be added in this case.',
    textUk: 'У Каміли та Бота 3 в руці немає карт, які вони могли б підкинути, але оскільки Каміла спочатку походила з 6-ки, хід перейшов до вас. Ви можете підкинути 6-ки Мадіні, хоч і не є її сусідом. Десятки в даному випадку підкидати не можна.',
    textKa: 'კამილასა და ბოტ 3-ს ხელში არ აქვთ ბარათები, რომლებიც შეეძლოთ მიეყარათ, მაგრამ ვინაიდან კამილამ პირველად 6-ით ივლო, სვლა თქვენზე გადავიდა. შეგიძლიათ 6-ები მიაყაროთ მადინას, თუნდაც მისი მეზობელი არ იყოთ. ამ შემთხვევაში ათეულების მიყრა არ შეიძლება.',
    textAz: 'Kamila və Bot 3-ün əlində ata biləcəkləri kart yoxdur, lakin Kamila əvvəlcə 6-dan başladığı üçün növbə sizə keçdi. Madina oyunçusuna 6-lar ata bilərsiniz, qonşu olmasanız da. Bu halda onluqlar atmaq olmaz.',
    textUz: 'Kamila va Bot 3-ning qoʻlida tashlash uchun karta yoʻq, lekin Kamila dastlab 6-dan boshlagani uchun navbat sizga oʻtdi. Madina oʻyinchisiga 6-larni tashlashingiz mumkin, qoʻshni boʻlmasangiz ham. Bu holda oʻnliklarni tashlash mumkin emas.',
    textPl: 'Kamila i Bot 3 nie mają kart do dorzucenia, ale ponieważ Kamila zaczęła od szóstki, tura przeszła do ciebie. Możesz dorzucić szóstki Madinie, nawet jeśli nie jesteś jej sąsiadem. W tym przypadku nie można dorzucać dziesiątek.',
    mobileText: 'Камила 6-дан бастады, ход перешёл к вам. Можно подкидывать 6-ки, но не десятки.',
    mobileTextKk: 'Камила 6-дан бастағандықтан, қадам сізге өтті. 6-ларды қоса аласыз, ондықтарды — жоқ.',
    mobileTextEn: 'Kamila started with a six, turn passed to you. Add sixes — not tens.',
    mobileTextUk: 'Каміла почала з 6-ки, хід перейшов до вас. Можна підкидати 6-ки, але не десятки.',
    mobileTextKa: 'კამილამ 6-ით დაიწყო, სვლა თქვენზე გადავიდა. 6-ები — შეიძლება, ათეულები — არა.',
    mobileTextAz: 'Kamila 6-dan başladı, növbə sizə keçdi. 6-lar ata bilərsiniz, onluqlar yox.',
    mobileTextUz: "Kamila 6-dan boshladi, navbat sizga o'tdi. 6-larni tashlashingiz mumkin, o'nliklarni emas.",
    mobileTextPl: 'Kamila zaczęła od szóstki, tura przeszła do ciebie. Możesz dorzucać szóstki, ale nie dziesiątki.',
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
    titleKa: 'ფარული კოზირი',
    titleAz: 'Gizli koz',
    titleUz: 'Yashirin kozir',
    titlePl: 'Ukryty atut',
    description: 'Потайные козыри под колодами',
    highlightElements: ['[data-tutorial="deck-area"]', '[data-tutorial="mobile-decks"]'],
    text: 'Сейчас в игре 2 колоды. Под колодой №1 лежит дама черви - это карта, назначающая нынешний козырь.\nПод дамой черви спрятана карта - потайный козырь №1.\nПод колодой №2 лежит потайный козырь №2',
    textKk: 'Қазір ойында 2 колода бар. Колода №1 астында жүрек дамасы жатыр — бұл қазіргі қозырды белгілейтін карта.\nЖүрек дамасының астында жасырын карта — жасырын қозыр №1.\nКолода №2 астында жасырын қозыр №2 жатыр',
    textEn: 'Now there are 2 decks in the game. Under deck #1 lies the Queen of Hearts — this is the card that determines the current trump.\nUnder the Queen of Hearts is a hidden card — hidden trump #1.\nUnder deck #2 lies hidden trump #2.',
    textUk: 'Зараз у грі 2 колоди. Під колодою №1 лежить дама червей — це карта, що призначає нинішній козир.\nПід дамою червей захована карта — прихований козир №1.\nПід колодою №2 лежить прихований козир №2.',
    textKa: 'ახლა თამაშში 2 გემბანია. გემბანი №1-ის ქვეშ დევს გულის ქალბატონი — ეს ბარათი ადგენს მიმდინარე კოზირს.\nქალბატონის ქვეშ დამალულია ბარათი — ფარული კოზირი №1.\nგემბანი №2-ის ქვეშ დევს ფარული კოზირი №2.',
    textAz: 'İndi oyunda 2 dəstə var. Dəstə №1-in altında ürək dama var — bu cari kozu təyin edən kartdır.\nÜrək damanın altında gizli kart var — gizli koz №1.\nDəstə №2-nin altında gizli koz №2 var.',
    textUz: 'Hozir oʻyinda 2 toʻplam bor. Toʻplam №1 ostida yurak malika bor — bu joriy kozirni belgilovchi karta.\nYurak malikaning ostida yashirin karta bor — yashirin kozir №1.\nToʻplam №2 ostida yashirin kozir №2 bor.',
    textPl: 'Teraz w grze są 2 talie. Pod talią №1 leży Dama Kier — to karta wyznaczająca aktualny atut.\nPod Damą Kier ukryta jest karta — ukryty atut №1.\nPod talią №2 leży ukryty atut №2.',
    mobileText: 'В начале партии козырем стала масть черви. Как только карты в колоде №1 (К1) закончатся, козырь поменяется',
    mobileTextKk: 'Ойын басында қозыр жүрек масы болды. Колода №1 (Қ1) біткенде, қозыр өзгереді',
    mobileTextEn: 'At the start of the game, hearts became the trump suit. Once the cards in deck #1 (D1) run out, the trump will change.',
    mobileTextUk: 'На початку партії козирем стала масть червей. Як тільки карти в колоді №1 (К1) закінчаться, козир зміниться.',
    mobileTextKa: 'თამაშის დასაწყისში კოზირი გულები გახდა. გემბანი №1 (გ1) ამოიწუროს, კოზირი შეიცვლება.',
    mobileTextAz: 'Oyunun əvvəlində koz ürək oldu. Dəstə №1 (D1) bitdikdə koz dəyişəcək.',
    mobileTextUz: "O'yin boshida kozir yurak bo'ldi. Toʻplam №1 (T1) tugaganda kozir o'zgaradi.",
    mobileTextPl: 'Na początku gry atutem stały się kiery. Gdy karty w talii №1 (T1) się skończą, atut się zmieni.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    instructionKk: '"Келесі" басыңыз',
    instructionEn: 'Click "Next" to continue',
    instructionUk: 'Натисніть "Далі" щоб продовжити',
    instructionKa: 'დააჭირეთ "შემდეგი"',
    instructionAz: '"Növbəti" düyməsini basın',
    instructionUz: '"Keyingi"ni bosing',
    instructionPl: 'Naciśnij przycisk "Dalej"',
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
    titleKa: 'ფარული კოზირი №1',
    titleAz: 'Gizli koz №1',
    titleUz: 'Yashirin kozir №1',
    titlePl: 'Ukryty atut №1',
    description: 'Смена козыря при окончании колоды 1',
    highlightElements: ['[data-tutorial="deck-area"]', '[data-tutorial="mobile-decks"]'],
    text: 'Когда колода №1 заканчивается, вскрывается потайный козырь №1, и козырь в игре меняется. В данном случае козырь поменялся на крести',
    textKk: 'Колода №1 біткенде, жасырын қозыр №1 ашылады және ойындағы қозыр өзгереді. Бұл жағдайда қозыр крестіге өзгерді',
    textEn: 'When deck #1 runs out, hidden trump #1 is revealed and the trump in the game changes. In this case the trump changed to clubs.',
    textUk: 'Коли колода №1 закінчується, відкривається прихований козир №1, і козир у грі змінюється. В даному випадку козир змінився на трефи.',
    textKa: 'გემბანი №1-ის ამოწურვისას იხსნება ფარული კოზირი №1 და თამაშში კოზირი იცვლება. ამ შემთხვევაში კოზირი ჩვენად შეიცვალა.',
    textAz: 'Dəstə №1 bitdikdə gizli koz №1 açılır və oyundakı koz dəyişir. Bu halda koz trefa dəyişdi.',
    textUz: 'Toʻplam №1 tugaganda, yashirin kozir №1 ochiladi va oʻyindagi kozir oʻzgaradi. Bu holda kozir choʻpga oʻzgardi.',
    textPl: 'Gdy talia №1 się kończy, odkrywa się ukryty atut №1 i atut w grze się zmienia. W tym przypadku atut zmienił się na trefle.',
    mobileText: 'Когда колода №1 заканчивается, вскрывается потайный козырь №1, и козырь в игре меняется. Козырь поменялся на крести',
    mobileTextKk: 'Колода №1 біткенде, жасырын қозыр №1 ашылады және ойындағы қозыр өзгереді. Қозыр крестіге өзгерді',
    mobileTextEn: 'When deck #1 runs out, hidden trump #1 is revealed and the trump changes. The trump changed to clubs.',
    mobileTextUk: 'Коли колода №1 закінчується, відкривається прихований козир №1, і козир у грі змінюється. Козир змінився на трефи.',
    mobileTextKa: 'გემბანი №1-ის ამოწურვისას იხსნება ფარული კოზირი №1 და კოზირი იცვლება. კოზირი ჩვენად შეიცვალა.',
    mobileTextAz: 'Dəstə №1 bitdikdə gizli koz №1 açılır və koz dəyişir. Koz trefa dəyişdi.',
    mobileTextUz: 'Toʻplam №1 tugaganda yashirin kozir №1 ochiladi va kozir oʻzgaradi. Kozir choʻpga oʻzgardi.',
    mobileTextPl: 'Gdy talia №1 się kończy, odkrywa się ukryty atut №1 i atut się zmienia. Atut zmienił się na trefle.',
    instruction: 'Нажмите "Далее" чтобы продолжить',
    instructionKk: '"Келесі" басыңыз',
    instructionEn: 'Click "Next" to continue',
    instructionUk: 'Натисніть "Далі" щоб продовжити',
    instructionKa: 'დააჭირეთ "შემდეგი"',
    instructionAz: '"Növbəti" düyməsini basın',
    instructionUz: '"Keyingi"ni bosing',
    instructionPl: 'Naciśnij przycisk "Dalej"',
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
    titleKa: 'ფარული კოზირი №2',
    titleAz: 'Gizli koz №2',
    titleUz: 'Yashirin kozir №2',
    titlePl: 'Ukryty atut №2',
    description: 'Финальная смена козыря',
    highlightElements: ['[data-tutorial="deck-area"]', '[data-tutorial="mobile-decks"]'],
    text: 'Когда колода №1 и колода №2 заканчиваются, вскрывается потайный козырь №2, меняя козырь в игре в последний раз. Теперь козырь в игре буби',
    textKk: 'Колода №1 мен колода №2 біткенде, жасырын қозыр №2 ашылады және ойындағы қозыр соңғы рет өзгереді. Енді ойындағы қозыр бүбі',
    textEn: 'When deck #1 and deck #2 run out, hidden trump #2 is revealed, changing the trump for the last time. Now the trump in the game is diamonds.',
    textUk: 'Коли колода №1 і колода №2 закінчуються, відкривається прихований козир №2, змінюючи козир у грі востаннє. Тепер козир у грі бубни.',
    textKa: 'გემბანი №1 და გემბანი №2-ის ამოწურვისას იხსნება ფარული კოზირი №2, რომელიც ბოლოჯერ ცვლის კოზირს თამაშში. ახლა თამაშში კოზირი ბუბია.',
    textAz: 'Dəstə №1 və dəstə №2 bitdikdə gizli koz №2 açılır, oyundakı kozu son dəfə dəyişdirir. İndi oyundakı koz sinirlərdir.',
    textUz: 'Toʻplam №1 va toʻplam №2 tugaganda, yashirin kozir №2 ochiladi, oʻyindagi kozirni oxirgi marta oʻzgartiradi. Endi oʻyindagi kozir olmos.',
    textPl: 'Gdy talia №1 i talia №2 się kończą, odkrywa się ukryty atut №2, zmieniając atut w grze po raz ostatni. Teraz atutem w grze są kara.',
    mobileText: 'Когда колода №1 и колода №2 заканчиваются, вскрывается потайный козырь №2, меняя козырь в игре в последний раз. Теперь козырь в игре буби',
    mobileTextKk: 'Колода №1 мен колода №2 біткенде, жасырын қозыр №2 ашылады, ойындағы қозыр соңғы рет өзгереді. Енді қозыр бүбі',
    mobileTextEn: 'When deck #1 and deck #2 run out, hidden trump #2 is revealed, changing the trump for the last time. Now the trump is diamonds.',
    mobileTextUk: 'Коли колода №1 і колода №2 закінчуються, відкривається прихований козир №2, змінюючи козир востаннє. Тепер козир — бубни.',
    mobileTextKa: 'გემბანი №1 და №2-ის ამოწურვისას იხსნება ფარული კოზირი №2, ბოლოჯერ ცვლის კოზირს. ახლა კოზირი ბუბია.',
    mobileTextAz: 'Dəstə №1 və №2 bitdikdə gizli koz №2 açılır, kozu son dəfə dəyişdirir. İndi koz sinirdir.',
    mobileTextUz: 'Toʻplam №1 va №2 tugaganda yashirin kozir №2 ochiladi, kozirni oxirgi marta oʻzgartiradi. Endi kozir olmos.',
    mobileTextPl: 'Gdy talia №1 i №2 się kończą, odkrywa się ukryty atut №2, zmieniając atut po raz ostatni. Teraz atutem są kara.',
    instruction: 'Нажмите "Завершить обучение"',
    instructionKk: '"Оқытуды аяқтау" басыңыз',
    instructionEn: 'Click "Finish Tutorial"',
    instructionUk: 'Натисніть "Завершити навчання"',
    instructionKa: 'დაასრულეთ სწავლება',
    instructionAz: 'Öyrədicini bitir',
    instructionUz: 'Oʻqitishni tugatish',
    instructionPl: 'Zakończ samouczek',
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
