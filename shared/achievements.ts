/**
 * Achievement definitions for Казахский Дурак Онлайн.
 *
 * Rules:
 * - All achievements require <33.4% bots in the game (i.e., human-majority games).
 * - "Донатор" is an exception — it tracks shop purchases, not in-game events.
 * - "Первый шанырак" is triggered when ANY other achievement is first unlocked.
 */

export interface AchievementReward {
  shanyrak?: number;
  tenge?: number;
}

export interface AchievementDef {
  key: string;
  nameRu: string;
  nameKk: string;
  nameEn: string;
  nameUk: string;
  nameKa: string;
  nameAz: string;
  descRu: string;
  descKk: string;
  descEn: string;
  descUk: string;
  descKa: string;
  descAz: string;
  reward: AchievementReward;
  /** Max progress value (for progress bar). 1 = binary unlock. */
  maxProgress: number;
  /** Category for grouping in UI */
  category: 'beginner' | 'combat' | 'special' | 'grind' | 'collector' | 'premium' | 'season' | 'social';
  /** Emoji icon */
  icon: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    key: 'first_game',
    nameRu: 'Первый шаг',
    nameKk: 'Алғашқы қадам',
    nameEn: 'First Step',
    nameUk: 'Перший крок',
    nameKa: 'პირველი ნაბიჯი',
    nameAz: 'İlk addım',
    descRu: 'Сыграй первую партию с реальными людьми',
    descKk: 'Нақты адамдармен алғашқы ойынды ойна',
    descEn: 'Play your first game with real people',
    descUk: 'Зіграй першу партію з реальними людьми',
    descKa: 'ითამაშე პირველი პარტია რეალურ ადამიანებთან',
    descAz: 'Real insanlarla ilk oyunu oyna',
    reward: { shanyrak: 500 },
    maxProgress: 1,
    category: 'beginner',
    icon: '🎯',
  },
  {
    key: 'steppe_student',
    nameRu: 'Степной ученик',
    nameKk: 'Дала шәкірті',
    nameEn: 'Steppe Student',
    nameUk: 'Степовий учень',
    nameKa: 'სტეპის მოსწავლე',
    nameAz: 'Çöl tələbəsi',
    descRu: 'Сыграй 10 партий',
    descKk: '10 ойын ойна',
    descEn: 'Play 10 games',
    descUk: 'Зіграй 10 партій',
    descKa: 'ითამაშე 10 პარტია',
    descAz: '10 oyun oyna',
    reward: { shanyrak: 1000 },
    maxProgress: 10,
    category: 'grind',
    icon: '📚',
  },
  {
    key: 'golden_start',
    nameRu: 'Золотой старт',
    nameKk: 'Алтын бастама',
    nameEn: 'Golden Start',
    nameUk: 'Золотий старт',
    nameKa: 'ოქროს დასაწყისი',
    nameAz: 'Qızıl başlanğıc',
    descRu: 'Набери 1200 очков рейтинга',
    descKk: '1200 рейтинг ұпайын жина',
    descEn: 'Reach 1200 rating points',
    descUk: 'Набери 1200 очок рейтингу',
    descKa: 'დააგროვე 1200 რეიტინგის ქულა',
    descAz: '1200 reytinq xalı topla',
    reward: { shanyrak: 1000 },
    maxProgress: 1200,
    category: 'beginner',
    icon: '⭐',
  },
  {
    key: 'first_trump',
    nameRu: 'Первый козырь',
    nameKk: 'Алғашқы козырь',
    nameEn: 'First Trump',
    nameUk: 'Перший козир',
    nameKa: 'პირველი კოზირი',
    nameAz: '',  // TODO: translate
    descRu: 'Побейся козырем в первой партии',
    descKk: 'Алғашқы ойында козырьмен жауап бер',
    descEn: 'Beat an attack with a trump card in your first game',
    descUk: 'Відбийся козирем у першій партії',
    descKa: 'კოზირით დაიცვი თავდასხმა პირველ თამაშში',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 100 },
    maxProgress: 1,
    category: 'beginner',
    icon: '🃏',
  },
  {
    key: 'batyr_recruit',
    nameRu: 'Батыр-новобранец',
    nameKk: 'Батыр-жаңадан',
    nameEn: 'Batyr Recruit',
    nameUk: 'Батир-новобранець',
    nameKa: 'ბატირი-ახალწვეული',
    nameAz: '',  // TODO: translate
    descRu: 'Отбей 10 атак за одну партию',
    descKk: 'Бір ойында 10 шабуылды тойтар',
    descEn: 'Deflect 10 attacks in a single game',
    descUk: 'Відбий 10 атак за одну партію',
    descKa: 'ერთ თამაშში 10 თავდასხმა დაიცვი',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 500 },
    maxProgress: 1,
    category: 'combat',
    icon: '🛡️',
  },
  {
    key: 'bush_rabbit',
    nameRu: 'Заяц в кустах',
    nameKk: 'Бұтадағы қоян',
    nameEn: 'Bush Rabbit',
    nameUk: 'Заєць у кущах',
    nameKa: 'კურდღელი ბუჩქებში',
    nameAz: '',  // TODO: translate
    descRu: 'Займи предпоследнее место в партии',
    descKk: 'Ойында соңғыдан бір алдыңғы орынды ал',
    descEn: 'Finish in second-to-last place in a game',
    descUk: 'Займи передостаннє місце в партії',
    descKa: 'თამაშში ბოლოდან მეორე ადგილი დაიკავე',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 500 },
    maxProgress: 1,
    category: 'special',
    icon: '🐇',
  },
  {
    key: 'first_throw',
    nameRu: 'Первый подкид',
    nameKk: 'Алғашқы лақтыру',
    nameEn: 'First Throw',
    nameUk: 'Перший підкид',
    nameKa: 'პირველი დამატება',
    nameAz: '',  // TODO: translate
    descRu: 'Подкинь 5 карт за один ход',
    descKk: 'Бір жүрісте 5 карта лақтыр',
    descEn: 'Throw 5 cards in a single turn',
    descUk: 'Підкинь 5 карт за один хід',
    descKa: 'ერთი სვლის განმავლობაში 5 ბარათი გადაუდე',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 300 },
    maxProgress: 1,
    category: 'combat',
    icon: '🎴',
  },
  {
    key: 'quick_win',
    nameRu: 'Быстрая победа',
    nameKk: 'Жылдам жеңіс',
    nameEn: 'Quick Win',
    nameUk: 'Швидка перемога',
    nameKa: 'სწრაფი გამარჯვება',
    nameAz: '',  // TODO: translate
    descRu: 'Выиграй партию за 10 минут',
    descKk: 'Ойынды 10 минутта жеңіп шық',
    descEn: 'Win a game in under 10 minutes',
    descUk: 'Виграй партію за 10 хвилин',
    descKa: 'მოიგე 10 წუთში',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 1500 },
    maxProgress: 1,
    category: 'combat',
    icon: '⚡',
  },
  {
    key: 'steppe_debut',
    nameRu: 'Степной дебют',
    nameKk: 'Дала дебюті',
    nameEn: 'Steppe Debut',
    nameUk: 'Степовий дебют',
    nameKa: 'სტეპის დებიუტი',
    nameAz: '',  // TODO: translate
    descRu: 'Сыграй 50 партий',
    descKk: '50 ойын ойна',
    descEn: 'Play 50 games',
    descUk: 'Зіграй 50 партій',
    descKa: 'ითამაშე 50 პარტია',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 2000 },
    maxProgress: 50,
    category: 'grind',
    icon: '🏜️',
  },
  {
    key: 'little_hero',
    nameRu: 'Маленький герой',
    nameKk: 'Кішкентай батыр',
    nameEn: 'Little Hero',
    nameUk: 'Маленький герой',
    nameKa: 'პატარა გმირი',
    nameAz: '',  // TODO: translate
    descRu: 'Отбей короля пики тузом пики',
    descKk: 'Пика королін пика тузымен жеңіп шық',
    descEn: 'Beat the King of Spades with the Ace of Spades',
    descUk: 'Відбий короля пік тузом пік',
    descKa: 'სპადების მეფე სპადების ტუზით გაარიე',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 500 },
    maxProgress: 1,
    category: 'special',
    icon: '🦸',
  },
  {
    key: 'first_berkut',
    nameRu: 'Первый беркут',
    nameKk: 'Алғашқы бүркіт',
    nameEn: 'First Berkut',
    nameUk: 'Перший беркут',
    nameKa: 'პირველი ბერკუტი',
    nameAz: '',  // TODO: translate
    descRu: 'Закончи партию с 1 картой на руках',
    descKk: 'Ойынды қолыңда 1 картамен аяқта',
    descEn: 'Finish a game with exactly 1 card in hand',
    descUk: 'Закінчи партію з 1 картою на руках',
    descKa: 'დაასრულე თამაში ხელში 1 ბარათით',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 1000 },
    maxProgress: 1,
    category: 'special',
    icon: '🦅',
  },
  {
    key: 'first_shanyrak',
    nameRu: 'Первый шанырак',
    nameKk: 'Алғашқы шаңырақ',
    nameEn: 'First Shanyrak',
    nameUk: 'Перший шанірак',
    nameKa: 'პირველი შანირაქი',
    nameAz: 'İlk şanyrak',
    descRu: 'Получи первое достижение',
    descKk: 'Алғашқы жетістікті ал',
    descEn: 'Unlock your first achievement',
    descUk: 'Отримай перше досягнення',
    descKa: 'მიიღე პირველი მიღწევა',
    descAz: 'İlk nailiyyəti aç',
    reward: { shanyrak: 200 },
    maxProgress: 1,
    category: 'beginner',
    icon: '🏠',
  },
  {
    key: 'three_throws',
    nameRu: 'Три подкида',
    nameKk: 'Үш лақтыру',
    nameEn: 'Triple Throw',
    nameUk: 'Три підкиди',
    nameKa: 'სამი გადაცემა',
    nameAz: '',  // TODO: translate
    descRu: 'Переведи ход 10 раз за одну партию',
    descKk: 'Бір ойында жүрісті 10 рет аудар',
    descEn: 'Transfer the attack 10 times in a single game',
    descUk: 'Переведи хід 10 разів за одну партію',
    descKa: 'ერთ თამაშში 10-ჯერ გადააციე',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 800 },
    maxProgress: 1,
    category: 'combat',
    icon: '🔄',
  },
  {
    key: 'steppe_warrior',
    nameRu: 'Степной воин',
    nameKk: 'Дала жауынгері',
    nameEn: 'Steppe Warrior',
    nameUk: 'Степовий воїн',
    nameKa: 'სტეპის მებრძოლი',
    nameAz: '',  // TODO: translate
    descRu: 'Сыграй 100 партий',
    descKk: '100 ойын ойна',
    descEn: 'Play 100 games',
    descUk: 'Зіграй 100 партій',
    descKa: 'ითამაშე 100 პარტია',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 4000 },
    maxProgress: 100,
    category: 'grind',
    icon: '⚔️',
  },
  {
    key: 'trump_rookie',
    nameRu: 'Козырной новичок',
    nameKk: 'Козырь жаңадан',
    nameEn: 'Trump Rookie',
    nameUk: 'Козирний новачок',
    nameKa: 'კოზირის ნოვიცი',
    nameAz: '',  // TODO: translate
    descRu: 'Побей 20 карт козырем за одну партию',
    descKk: 'Бір ойында 20 картаны козырьмен жеңіп шық',
    descEn: 'Beat 20 cards with trumps in a single game',
    descUk: 'Побий 20 карт козирем за одну партію',
    descKa: 'ერთ თამაშში 20 ბარათი კოზირით გაარიე',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 1200 },
    maxProgress: 1,
    category: 'combat',
    icon: '👑',
  },
  {
    key: 'clean_win',
    nameRu: 'Чистая победа',
    nameKk: 'Таза жеңіс',
    nameEn: 'Clean Win',
    nameUk: 'Чиста перемога',
    nameKa: 'სუფთა გამარჯვება',
    nameAz: '',  // TODO: translate
    descRu: 'Выиграй партию, не взяв ни одной карты',
    descKk: 'Ойынды бірде-бір карта алмай жеңіп шық',
    descEn: 'Win a game without picking up any cards',
    descUk: 'Виграй партію, не взявши жодної карти',
    descKa: 'მოიგე თამაში არც ერთი ბარათის არ აღებით',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 1500 },
    maxProgress: 1,
    category: 'combat',
    icon: '✨',
  },
  {
    key: 'quick_start',
    nameRu: 'Быстрый старт',
    nameKk: 'Жылдам старт',
    nameEn: 'Quick Start',
    nameUk: 'Швидкий старт',
    nameKa: 'სწრაფი დასაწყისი',
    nameAz: '',  // TODO: translate
    descRu: 'Займи первое место 5 раз подряд',
    descKk: 'Қатарынан 5 рет бірінші орынды ал',
    descEn: 'Finish first 5 times in a row',
    descUk: 'Займи перше місце 5 разів поспіль',
    descKa: 'ზედიზედ 5-ჯერ პირველი ადგილი დაიკავე',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 2000 },
    maxProgress: 5,
    category: 'grind',
    icon: '🚀',
  },
  {
    key: 'first_millionaire',
    nameRu: 'Первый миллионер',
    nameKk: 'Алғашқы миллионер',
    nameEn: 'First Millionaire',
    nameUk: 'Перший мільйонер',
    nameKa: 'პირველი მილიონერი',
    nameAz: '',  // TODO: translate
    descRu: 'Накопи 1 000 000 шаныраков',
    descKk: '1 000 000 шаңырақ жина',
    descEn: 'Accumulate 1,000,000 shanyrak',
    descUk: 'Накопи 1 000 000 шаніраків',
    descKa: 'დააგროვე 1 000 000 შანირაქი',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 10000 },
    maxProgress: 1000000,
    category: 'collector',
    icon: '💰',
  },
  {
    key: 'donator',
    nameRu: 'Донатор',
    nameKk: 'Донатор',
    nameEn: 'Donator',
    nameUk: 'Донатор',
    nameKa: 'დონატორი',
    nameAz: 'Donator',
    descRu: 'Купи предметы в магазине на сумму более 100 Тенге',
    descKk: 'Дүкенде 100 Теңгеден астам тауар сатып ал',
    descEn: 'Purchase items in the shop for more than 100 Tenge',
    descUk: 'Купи предмети в магазині на суму більше 100 Тенге',
    descKa: 'შეიძინე საქონელი მაღაზიაში 100 თენგეზე მეტად',
    descAz: 'Mağazadan hər hansı bir şey al',
    reward: { shanyrak: 5000, tenge: 20 },
    maxProgress: 100,
    category: 'collector',
    icon: '💎',
  },
  {
    key: 'spade_king',
    nameRu: 'Король пики',
    nameKk: 'Пика королі',
    nameEn: 'King of Spades',
    nameUk: 'Король пік',
    nameKa: 'სპადების მეფე',
    nameAz: '',  // TODO: translate
    descRu: 'Побей козырной туз королём пики',
    descKk: 'Козырь тузын пика королімен жеңіп шық',
    descEn: 'Beat a trump ace with the King of Spades',
    descUk: 'Побий козирний туз королем пік',
    descKa: 'კოზირის ტუზი სპადების მეფით გაარიე',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 500 },
    maxProgress: 1,
    category: 'special',
    icon: '♠️',
  },
  {
    key: 'lucky_sevens',
    nameRu: 'Счастливые семёрки',
    nameKk: 'Бақытты жетілер',
    nameEn: 'Lucky Sevens',
    nameUk: 'Щасливі сімки',
    nameKa: 'იღბიანი შვიდოსნები',
    nameAz: '',  // TODO: translate
    descRu: 'В конце матча начни ход, имея на руке только карту 777',
    descKk: 'Матч соңында тек 777 картасымен жүрісті баста',
    descEn: 'Start a turn with only the 777 card in hand at the end of a match',
    descUk: 'Наприкінці матчу почни хід, маючи на руці лише карту 777',
    descKa: 'მატჩის ბოლოს სვლა დაიწყე მხოლოდ 777 ბარათით',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 2000 },
    maxProgress: 1,
    category: 'special',
    icon: '7️⃣',
  },
  {
    key: 'king_vs_777',
    nameRu: 'Король пики vs 777',
    nameKk: 'Пика королі vs 777',
    nameEn: 'King of Spades vs 777',
    nameUk: 'Король пік vs 777',
    nameKa: 'სპადების მეფე vs 777',
    nameAz: '',  // TODO: translate
    descRu: 'Побей короля пики картой 777',
    descKk: 'Пика королін 777 картасымен жеңіп шық',
    descEn: 'Beat the King of Spades with the 777 card',
    descUk: 'Побий короля пік картою 777',
    descKa: 'სპადების მეფე 777 ბარათით გაარიე',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 500 },
    maxProgress: 1,
    category: 'special',
    icon: '🃏',
  },
  {
    key: 'what_is_happening',
    nameRu: 'Что происходит?',
    nameKk: 'Не болып жатыр?',
    nameEn: 'What Is Happening?',
    nameUk: 'Що відбувається?',
    nameKa: 'რა ხდება?',
    nameAz: '',  // TODO: translate
    descRu: 'Походи с 10-ки, перевернув ход игры',
    descKk: '10-шымен жүріп, ойын барысын өзгерт',
    descEn: 'Play a 10 and reverse the direction of play',
    descUk: 'Походи з 10-ки, перевернувши хід гри',
    descKa: '10-ით ითამაშე და თამაშის მიმართულება შეაბრუნე',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 300 },
    maxProgress: 1,
    category: 'special',
    icon: '🔀',
  },
  {
    key: 'spiderman_meme',
    nameRu: 'Мем с человеком-пауком',
    nameKk: 'Өрмекші-адам мемі',
    nameEn: 'Spider-Man Meme',
    nameUk: 'Мем з Людиною-павуком',
    nameKa: 'სპაიდერმენის მემი',
    nameAz: '',  // TODO: translate
    descRu: 'Переведи за один ход три раза подряд 10-ку на игрока, который походил с неё на тебя',
    descKk: 'Бір жүрісте 10-шыны саған жүрген ойыншыға үш рет қатарынан аудар',
    descEn: 'Transfer a 10 back to the player who played it on you, three times in a row in one turn',
    descUk: 'Переведи за один хід три рази поспіль 10-ку на гравця, який походив нею на тебе',
    descKa: 'ერთ სვლაში ზედიზედ სამჯერ 10 გადააციე მოთამაშეზე, ვინც ის შენზე ითამაშა',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 1000 },
    maxProgress: 1,
    category: 'special',
    icon: '🕷️',
  },

  // ============================================================
  // PREMIUM achievements (1-5)
  // ============================================================
  {
    key: 'premium_player',
    nameRu: 'Премиум игрок',
    nameKk: 'Premium ойыншы',
    nameEn: 'Premium Player',
    nameUk: 'Преміум гравець',
    nameKa: 'პრემიუმ მოთამაშე',
    nameAz: '',  // TODO: translate
    descRu: 'Приобретите PREMIUM хотя бы один раз',
    descKk: 'PREMIUM-ді кемінде бір рет сатып алыңыз',
    descEn: 'Purchase PREMIUM at least once',
    descUk: 'Придбайте PREMIUM хоча б один раз',
    descKa: 'შეიძინეთ PREMIUM სულ მცირე ერთხელ',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 5000, tenge: 25 },
    maxProgress: 1,
    category: 'premium',
    icon: '💎',
  },
  {
    key: 'legendary_player',
    nameRu: 'Легендарный игрок',
    nameKk: 'Аңыздық ойыншы',
    nameEn: 'Legendary Player',
    nameUk: 'Легендарний гравець',
    nameKa: 'ლეგენდარული მოთამაშე',
    nameAz: '',  // TODO: translate
    descRu: 'Приобретите PREMIUM два месяца подряд',
    descKk: 'PREMIUM-ді қатарынан екі ай сатып алыңыз',
    descEn: 'Purchase PREMIUM two months in a row',
    descUk: 'Придбайте PREMIUM два місяці поспіль',
    descKa: 'შეიძინეთ PREMIUM ზედიზედ ორი თვის განმავლობაში',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 15000, tenge: 50 },
    maxProgress: 2,
    category: 'premium',
    icon: '🌟',
  },
  {
    key: 'admin_pryanik',
    nameRu: 'Админу пряников',
    nameKk: 'Әкімшіге тәттілер',
    nameEn: 'Gingerbread for Admin',
    nameUk: 'Адміну пряників',
    nameKa: 'ადმინისთვის ნამცხვარი',
    nameAz: '',  // TODO: translate
    descRu: 'Приобретите PREMIUM три месяца подряд',
    descKk: 'PREMIUM-ді қатарынан үш ай сатып алыңыз',
    descEn: 'Purchase PREMIUM three months in a row',
    descUk: 'Придбайте PREMIUM три місяці поспіль',
    descKa: 'შეიძინეთ PREMIUM ზედიზედ სამი თვის განმავლობაში',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 30000, tenge: 100 },
    maxProgress: 3,
    category: 'premium',
    icon: '🍪',
  },
  {
    key: 'kazakhstan_pride',
    nameRu: 'Гордость Казахстана',
    nameKk: 'Қазақстан мақтанышы',
    nameEn: 'Pride of Kazakhstan',
    nameUk: 'Гордість Казахстану',
    nameKa: 'ყაზახეთის სიამაყე',
    nameAz: '',  // TODO: translate
    descRu: 'Приобретите PREMIUM шесть месяцев подряд',
    descKk: 'PREMIUM-ді қатарынан алты ай сатып алыңыз',
    descEn: 'Purchase PREMIUM six months in a row',
    descUk: 'Придбайте PREMIUM шість місяців поспіль',
    descKa: 'შეიძინეთ PREMIUM ზედიზედ ექვსი თვის განმავლობაში',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 100000, tenge: 500 },
    maxProgress: 6,
    category: 'premium',
    icon: '🇰🇿',
  },
  {
    key: 'elbasy',
    nameRu: 'Елбасы',
    nameKk: 'Елбасы',
    nameEn: 'Elbasy',
    nameUk: 'Елбасы',
    nameKa: 'ელბასი',
    nameAz: '',  // TODO: translate
    descRu: 'Приобретите PREMIUM 10 раз (не обязательно подряд)',
    descKk: 'PREMIUM-ді 10 рет сатып алыңыз (қатарынан болмауы мүмкін)',
    descEn: 'Purchase PREMIUM 10 times (not necessarily in a row)',
    descUk: 'Придбайте PREMIUM 10 разів (не обов\'язково поспіль)',
    descKa: 'შეიძინეთ PREMIUM 10-ჯერ (სავალდებულოდ არ არის ზედიზედ)',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 777777, tenge: 777 },
    maxProgress: 10,
    category: 'premium',
    icon: '👑',
  },

  // ============================================================
  // DAILY QUEST achievements (6-8)
  // ============================================================
  {
    key: 'daily_diary',
    nameRu: 'Ежедневник',
    nameKk: 'Күнделік',
    nameEn: 'Daily Diary',
    nameUk: 'Щоденник',
    nameKa: 'ყოველდღიური დღიური',
    nameAz: '',  // TODO: translate
    descRu: 'Выполните 30 ежедневных заданий',
    descKk: '30 күнделікті тапсырма орындаңыз',
    descEn: 'Complete 30 daily quests',
    descUk: 'Виконайте 30 щоденних завдань',
    descKa: 'შეასრულეთ 30 ყოველდღიური დავალება',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 3000 },
    maxProgress: 30,
    category: 'grind',
    icon: '📓',
  },
  {
    key: 'daily_calendar',
    nameRu: 'Календарь',
    nameKk: 'Күнтізбе',
    nameEn: 'Calendar',
    nameUk: 'Календар',
    nameKa: 'კალენდარი',
    nameAz: '',  // TODO: translate
    descRu: 'Выполните 60 ежедневных заданий',
    descKk: '60 күнделікті тапсырма орындаңыз',
    descEn: 'Complete 60 daily quests',
    descUk: 'Виконайте 60 щоденних завдань',
    descKa: 'შეასრულეთ 60 ყოველდღიური დავალება',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 10000 },
    maxProgress: 60,
    category: 'grind',
    icon: '📅',
  },
  {
    key: 'daily_regular',
    nameRu: 'Постоянник',
    nameKk: 'Тұрақты ойыншы',
    nameEn: 'Regular',
    nameUk: 'Постійний гравець',
    nameKa: 'მუდმივი მოთამაშე',
    nameAz: '',  // TODO: translate
    descRu: 'Выполните 120 ежедневных заданий',
    descKk: '120 күнделікті тапсырма орындаңыз',
    descEn: 'Complete 120 daily quests',
    descUk: 'Виконайте 120 щоденних завдань',
    descKa: 'შეასრულეთ 120 ყოველდღიური დავალება',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 30000 },
    maxProgress: 120,
    category: 'grind',
    icon: '🗓️',
  },

  // ============================================================
  // ACHIEVEMENT COUNT achievements (9-12)
  // ============================================================
  {
    key: 'achievement_lover',
    nameRu: 'Любитель',
    nameKk: 'Сүйіспеншілік',
    nameEn: 'Enthusiast',
    nameUk: 'Любитель',
    nameKa: 'მოყვარული',
    nameAz: '',  // TODO: translate
    descRu: 'Выполните 10 любых достижений',
    descKk: 'Кез келген 10 жетістікті орындаңыз',
    descEn: 'Unlock any 10 achievements',
    descUk: 'Виконайте будь-які 10 досягнень',
    descKa: 'შეასრულეთ ნებისმიერი 10 მიღწევა',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 5000 },
    maxProgress: 10,
    category: 'collector',
    icon: '🏅',
  },
  {
    key: 'achievement_expert',
    nameRu: 'Эксперт',
    nameKk: 'Сарапшы',
    nameEn: 'Expert',
    nameUk: 'Експерт',
    nameKa: 'ექსპერტი',
    nameAz: '',  // TODO: translate
    descRu: 'Выполните 20 любых достижений',
    descKk: 'Кез келген 20 жетістікті орындаңыз',
    descEn: 'Unlock any 20 achievements',
    descUk: 'Виконайте будь-які 20 досягнень',
    descKa: 'შეასრულეთ ნებისმიერი 20 მიღწევა',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 8000 },
    maxProgress: 20,
    category: 'collector',
    icon: '🥈',
  },
  {
    key: 'achievement_master',
    nameRu: 'Мастер',
    nameKk: 'Шебер',
    nameEn: 'Master',
    nameUk: 'Майстер',
    nameKa: 'ოსტატი',
    nameAz: '',  // TODO: translate
    descRu: 'Выполните 30 любых достижений',
    descKk: 'Кез келген 30 жетістікті орындаңыз',
    descEn: 'Unlock any 30 achievements',
    descUk: 'Виконайте будь-які 30 досягнень',
    descKa: 'შეასრულეთ ნებისმიერი 30 მიღწევა',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 10000 },
    maxProgress: 30,
    category: 'collector',
    icon: '🥇',
  },
  {
    key: 'achievement_achiever',
    nameRu: 'Достигатор',
    nameKk: 'Жетістікші',
    nameEn: 'Achiever',
    nameUk: 'Досягатор',
    nameKa: 'მიმღწევი',
    nameAz: '',  // TODO: translate
    descRu: 'Выполните 50 любых достижений',
    descKk: 'Кез келген 50 жетістікті орындаңыз',
    descEn: 'Unlock any 50 achievements',
    descUk: 'Виконайте будь-які 50 досягнень',
    descKa: 'შეასრულეთ ნებისმიერი 50 მიღწევა',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 50000, tenge: 25 },
    maxProgress: 50,
    category: 'collector',
    icon: '🏆',
  },

  // ============================================================
  // COLLECTOR achievements (13-16)
  // ============================================================
  {
    key: 'fashionista',
    nameRu: 'Модник',
    nameKk: 'Сәнқой',
    nameEn: 'Fashionista',
    nameUk: 'Модник',
    nameKa: 'მოდური',
    nameAz: '',  // TODO: translate
    descRu: 'Получите как минимум 3 разные рамки для аватарки',
    descKk: 'Кемінде 3 түрлі аватар жақтауын алыңыз',
    descEn: 'Obtain at least 3 different avatar frames',
    descUk: 'Отримайте щонайменше 3 різні рамки для аватарки',
    descKa: 'მიიღეთ სულ მცირე 3 სხვადასხვა ავატარის ჩარჩო',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 10000, tenge: 25 },
    maxProgress: 3,
    category: 'collector',
    icon: '🖼️',
  },
  {
    key: 'croupier',
    nameRu: 'Крупье',
    nameKk: 'Крупье',
    nameEn: 'Croupier',
    nameUk: 'Крупʼє',
    nameKa: 'კრუპიე',
    nameAz: '',  // TODO: translate
    descRu: 'Получите как минимум 3 разные колоды карт (не считая классическую)',
    descKk: 'Кемінде 3 түрлі карта дестесін алыңыз (классикалықты есептемегенде)',
    descEn: 'Obtain at least 3 different card decks (excluding the classic)',
    descUk: 'Отримайте щонайменше 3 різні колоди карт (не рахуючи класичну)',
    descKa: 'მიიღეთ სულ მცირე 3 სხვადასხვა ბარათის კომპლექტი (კლასიკის გარდა)',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 10000, tenge: 25 },
    maxProgress: 3,
    category: 'collector',
    icon: '🃏',
  },
  {
    key: 'meloman',
    nameRu: 'Меломан',
    nameKk: 'Меломан',
    nameEn: 'Meloman',
    nameUk: 'Меломан',
    nameKa: 'მელომანი',
    nameAz: '',  // TODO: translate
    descRu: 'Получите как минимум 3 разных плейлиста (не считая классический)',
    descKk: 'Кемінде 3 түрлі ойнату тізімін алыңыз (классикалықты есептемегенде)',
    descEn: 'Obtain at least 3 different playlists (excluding the classic)',
    descUk: 'Отримайте щонайменше 3 різних плейлисти (не рахуючи класичний)',
    descKa: 'მიიღეთ სულ მცირე 3 სხვადასხვა პლეილისტი (კლასიკის გარდა)',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 10000 },
    maxProgress: 3,
    category: 'collector',
    icon: '🎵',
  },
  {
    key: 'many_faces',
    nameRu: 'Многоликий',
    nameKk: 'Көпбейнелі',
    nameEn: 'Many Faces',
    nameUk: 'Багатоликий',
    nameKa: 'მრავალსახოვანი',
    nameAz: '',  // TODO: translate
    descRu: 'Получите как минимум 5 разных аватарок (не считая классических)',
    descKk: 'Кемінде 5 түрлі аватар алыңыз (классикалықтарды есептемегенде)',
    descEn: 'Obtain at least 5 different avatars (excluding the classic ones)',
    descUk: 'Отримайте щонайменше 5 різних аватарок (не рахуючи класичні)',
    descKa: 'მიიღეთ სულ მცირე 5 სხვადასხვა ავატარი (კლასიკების გარდა)',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 10000, tenge: 10 },
    maxProgress: 5,
    category: 'collector',
    icon: '🎭',
  },

  // ============================================================
  // SEASON RANK achievements (17-24)
  // ============================================================
  {
    key: 'season_steppe_hare',
    nameRu: 'Лунный камень',
    nameKk: 'Ай Тасы',
    nameEn: 'Moonstone',
    nameUk: 'Місячний камінь',
    nameKa: 'მთვარის ქვა',
    nameAz: '',  // TODO: translate
    descRu: 'Закончите сезон с рангом «Лунный камень»',
    descKk: 'Сезонды «Ай Тасы» дәрежесімен аяқтаңыз',
    descEn: 'Finish a season with the rank Moonstone',
    descUk: 'Закінчіть сезон з рангом «Місячний камінь»',
    descKa: 'სეზონი დაასრულეთ «მთვარის ქვა» რანგით',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 1000 },
    maxProgress: 1,
    category: 'season',
    icon: '🔘',
  },
  {
    key: 'season_mountain_ram',
    nameRu: 'Изумруд',
    nameKk: 'Зумруд',
    nameEn: 'Emerald',
    nameUk: 'Смарагд',
    nameKa: 'ზმარაგდი',
    nameAz: '',  // TODO: translate
    descRu: 'Закончите сезон с рангом «Изумруд»',
    descKk: 'Сезонды «Зумруд» дәрежесімен аяқтаңыз',
    descEn: 'Finish a season with the rank Emerald',
    descUk: 'Закінчіть сезон з рангом «Смарагд»',
    descKa: 'სეზონი დაასრულეთ «ზმარაგდი» რანგით',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 2000 },
    maxProgress: 1,
    category: 'season',
    icon: '💚',
  },
  {
    key: 'season_golden_falcon',
    nameRu: 'Сапфир',
    nameKk: 'Сапфир',
    nameEn: 'Sapphire',
    nameUk: 'Сапфір',
    nameKa: 'საფირი',
    nameAz: '',  // TODO: translate
    descRu: 'Закончите сезон с рангом «Сапфир»',
    descKk: 'Сезонды «Сапфир» дәрежесімен аяқтаңыз',
    descEn: 'Finish a season with the rank Sapphire',
    descUk: 'Закінчіть сезон з рангом «Сапфір»',
    descKa: 'სეზონი დაასრულეთ «საფირი» რანგით',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 3000 },
    maxProgress: 1,
    category: 'season',
    icon: '💙',
  },
  {
    key: 'season_winged_horse',
    nameRu: 'Аметист',
    nameKk: 'Аметист',
    nameEn: 'Amethyst',
    nameUk: 'Аметист',
    nameKa: 'ამეთვისტო',
    nameAz: '',  // TODO: translate
    descRu: 'Закончите сезон с рангом «Аметист»',
    descKk: 'Сезонды «Аметист» дәрежесімен аяқтаңыз',
    descEn: 'Finish a season with the rank Amethyst',
    descUk: 'Закінчіть сезон з рангом «Аметист»',
    descKa: 'სეზონი დაასრულეთ «ამეთვისტო» რანგით',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 4000 },
    maxProgress: 1,
    category: 'season',
    icon: '💜',
  },
  {
    key: 'season_sky_eagle',
    nameRu: 'Циркон',
    nameKk: 'Циркон',
    nameEn: 'Zircon',
    nameUk: 'Циркон',
    nameKa: 'ცირკონი',
    nameAz: '',  // TODO: translate
    descRu: 'Закончите сезон с рангом «Циркон»',
    descKk: 'Сезонды «Циркон» дәрежесімен аяқтаңыз',
    descEn: 'Finish a season with the rank Zircon',
    descUk: 'Закінчіть сезон з рангом «Циркон»',
    descKa: 'სეზონი დაასრულეთ «ცირკონი» რანგით',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 5000 },
    maxProgress: 1,
    category: 'season',
    icon: '🟠',
  },
  {
    key: 'season_steppe_khan',
    nameRu: 'Рубин',
    nameKk: 'Рубин',
    nameEn: 'Ruby',
    nameUk: 'Рубін',
    nameKa: 'რუბინი',
    nameAz: '',  // TODO: translate
    descRu: 'Закончите сезон с рангом «Рубин»',
    descKk: 'Сезонды «Рубин» дәрежесімен аяқтаңыз',
    descEn: 'Finish a season with the rank Ruby',
    descUk: 'Закінчіть сезон з рангом «Рубін»',
    descKa: 'სეზონი დაასრულეთ «რუბინი» რანგით',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 10000 },
    maxProgress: 1,
    category: 'season',
    icon: '❤️',
  },
  {
    key: 'season_golden_horde',
    nameRu: 'Янтарь',
    nameKk: 'Янтар',
    nameEn: 'Amber',
    nameUk: 'Бурштин',
    nameKa: 'ქარვა',
    nameAz: '',  // TODO: translate
    descRu: 'Закончите сезон с рангом «Янтарь»',
    descKk: 'Сезонды «Янтар» дәрежесімен аяқтаңыз',
    descEn: 'Finish a season with the rank Amber',
    descUk: 'Закінчіть сезон з рангом «Бурштин»',
    descKa: 'სეზონი დაასრულეთ «ქარვა» რანგით',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 25000 },
    maxProgress: 1,
    category: 'season',
    icon: '🟡',
  },
  {
    key: 'season_great_khan',
    nameRu: 'Обсидиан',
    nameKk: 'Обсидиан',
    nameEn: 'Obsidian',
    nameUk: 'Обсидіан',
    nameKa: 'ობსიდიანი',
    nameAz: '',  // TODO: translate
    descRu: 'Закончите сезон с рангом «Обсидиан»',
    descKk: 'Сезонды «Обсидиан» дәрежесімен аяқтаңыз',
    descEn: 'Finish a season with the rank Obsidian',
    descUk: 'Закінчіть сезон з рангом «Обсидіан»',
    descKa: 'სეზონი დაასრულეთ «ობსიდიანი» რანგით',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 50000 },
    maxProgress: 1,
    category: 'season',
    icon: '🖤',
  },

  // ============================================================
  // BOT GAME achievements (25-28)
  // ============================================================
  {
    key: 'bot_lover',
    nameRu: 'Любитель ботов',
    nameKk: 'Бот сүйіспеншісі',
    nameEn: 'Bot Lover',
    nameUk: 'Любитель ботів',
    nameKa: 'ბოტების მოყვარული',
    nameAz: '',  // TODO: translate
    descRu: 'Сыграйте 10 игр с ботами',
    descKk: 'Боттармен 10 ойын ойнаңыз',
    descEn: 'Play 10 games with bots',
    descUk: 'Зіграйте 10 ігор з ботами',
    descKa: 'ბოტებთან 10 თამაში ითამაშეთ',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 1000 },
    maxProgress: 10,
    category: 'grind',
    icon: '🤖',
  },
  {
    key: 'bot_terror',
    nameRu: 'Гроза ботов',
    nameKk: 'Боттар қорқынышы',
    nameEn: 'Bot Terror',
    nameUk: 'Гроза ботів',
    nameKa: 'ბოტების საშინელება',
    nameAz: '',  // TODO: translate
    descRu: 'Сыграйте 25 игр с ботами',
    descKk: 'Боттармен 25 ойын ойнаңыз',
    descEn: 'Play 25 games with bots',
    descUk: 'Зіграйте 25 ігор з ботами',
    descKa: 'ბოტებთან 25 თამაში ითამაშეთ',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 3000 },
    maxProgress: 25,
    category: 'grind',
    icon: '💻',
  },
  {
    key: 'programmer',
    nameRu: 'Программист',
    nameKk: 'Бағдарламашы',
    nameEn: 'Programmer',
    nameUk: 'Програміст',
    nameKa: 'პროგრამისტი',
    nameAz: '',  // TODO: translate
    descRu: 'Сыграйте 50 игр с ботами',
    descKk: 'Боттармен 50 ойын ойнаңыз',
    descEn: 'Play 50 games with bots',
    descUk: 'Зіграйте 50 ігор з ботами',
    descKa: 'ბოტებთან 50 თამაში ითამაშეთ',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 5000 },
    maxProgress: 50,
    category: 'grind',
    icon: '👨‍💻',
  },
  {
    key: 'bot_hater',
    nameRu: 'Ботоненавистник',
    nameKk: 'Бот жек көруші',
    nameEn: 'Bot Hater',
    nameUk: 'Ботоненависник',
    nameKa: 'ბოტების მოძულე',
    nameAz: '',  // TODO: translate
    descRu: 'Сыграйте 100 игр с ботами',
    descKk: 'Боттармен 100 ойын ойнаңыз',
    descEn: 'Play 100 games with bots',
    descUk: 'Зіграйте 100 ігор з ботами',
    descKa: 'ბოტებთან 100 თამაში ითამაშეთ',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 10000 },
    maxProgress: 100,
    category: 'grind',
    icon: '🔧',
  },

  // ============================================================
  // LEADERBOARD achievements (29-31)
  // ============================================================
  {
    key: 'leaderboard_1',
    nameRu: '№1',
    nameKk: '№1',
    nameEn: '#1',
    nameUk: '№1',
    nameKa: '№1',
    nameAz: '',  // TODO: translate
    descRu: 'Займите первое место в несезонном рейтинге',
    descKk: 'Маусымдық емес рейтингте бірінші орынды алыңыз',
    descEn: 'Reach first place in the non-seasonal leaderboard',
    descUk: 'Займіть перше місце в несезонному рейтингу',
    descKa: 'პირველი ადგილი დაიკავეთ სეზონგარეშე რეიტინგში',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 100000, tenge: 50 },
    maxProgress: 1,
    category: 'special',
    icon: '🥇',
  },
  {
    key: 'leaderboard_2',
    nameRu: '№2',
    nameKk: '№2',
    nameEn: '#2',
    nameUk: '№2',
    nameKa: '№2',
    nameAz: '',  // TODO: translate
    descRu: 'Займите второе место в несезонном рейтинге',
    descKk: 'Маусымдық емес рейтингте екінші орынды алыңыз',
    descEn: 'Reach second place in the non-seasonal leaderboard',
    descUk: 'Займіть друге місце в несезонному рейтингу',
    descKa: 'მეორე ადგილი დაიკავეთ სეზონგარეშე რეიტინგში',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 70000, tenge: 30 },
    maxProgress: 1,
    category: 'special',
    icon: '🥈',
  },
  {
    key: 'leaderboard_3',
    nameRu: '№3',
    nameKk: '№3',
    nameEn: '#3',
    nameUk: '№3',
    nameKa: '№3',
    nameAz: '',  // TODO: translate
    descRu: 'Займите третье место в несезонном рейтинге',
    descKk: 'Маусымдық емес рейтингте үшінші орынды алыңыз',
    descEn: 'Reach third place in the non-seasonal leaderboard',
    descUk: 'Займіть третє місце в несезонному рейтингу',
    descKa: 'მესამე ადგილი დაიკავეთ სეზონგარეშე რეიტინგში',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 50000, tenge: 20 },
    maxProgress: 1,
    category: 'special',
    icon: '🥉',
  },

  // ============================================================
  // TUTORIAL achievements (32-34)
  // ============================================================
  {
    key: 'tutorial_student',
    nameRu: 'Ученик',
    nameKk: 'Оқушы',
    nameEn: 'Student',
    nameUk: 'Учень',
    nameKa: 'მოსწავლე',
    nameAz: '',  // TODO: translate
    descRu: 'Пройдите обучение',
    descKk: 'Оқытудан өтіңіз',
    descEn: 'Complete the tutorial',
    descUk: 'Пройдіть навчання',
    descKa: 'გაიარეთ სწავლება',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 2000 },
    maxProgress: 1,
    category: 'beginner',
    icon: '📖',
  },
  {
    key: 'tutorial_honor',
    nameRu: 'Отличник',
    nameKk: 'Үздік оқушы',
    nameEn: 'Honor Student',
    nameUk: 'Відмінник',
    nameKa: 'ფრიადოსანი',
    nameAz: '',  // TODO: translate
    descRu: 'Пройдите обучение дважды',
    descKk: 'Оқытудан екі рет өтіңіз',
    descEn: 'Complete the tutorial twice',
    descUk: 'Пройдіть навчання двічі',
    descKa: 'გაიარეთ სწავლება ორჯერ',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 5000 },
    maxProgress: 2,
    category: 'beginner',
    icon: '📝',
  },
  {
    key: 'tutorial_grind',
    nameRu: 'Зубрила',
    nameKk: 'Жаттаушы',
    nameEn: 'Grinder',
    nameUk: 'Зубрила',
    nameKa: 'გამეორებელი',
    nameAz: '',  // TODO: translate
    descRu: 'Пройдите обучение 5 раз',
    descKk: 'Оқытудан 5 рет өтіңіз',
    descEn: 'Complete the tutorial 5 times',
    descUk: 'Пройдіть навчання 5 разів',
    descKa: 'გაიარეთ სწავლება 5-ჯერ',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 10000 },
    maxProgress: 5,
    category: 'beginner',
    icon: '🎓',
  },

  // ============================================================
  // REFERRAL achievements
  // ============================================================
  {
    key: 'referral_1',
    nameRu: 'Эй, ты!',
    nameKk: 'Эй, сен!',
    nameEn: 'Hey, You!',
    nameUk: 'Гей, ти!',
    nameKa: 'ჰეი, შენ!',
    nameAz: 'Dəvətçi',
    descRu: 'Пригласи 1 друга в игру по реферальному коду',
    descKk: 'Реферал кодымен 1 досыңды ойынға шақыр',
    descEn: 'Invite 1 friend to the game via referral code',
    descUk: 'Запроси 1 друга в гру за реферальним кодом',
    descKa: 'მოიწვიეთ 1 მეგობარი თამაშში რეფერალური კოდით',
    descAz: '1 dostu dəvət et',
    reward: { shanyrak: 1000 },
    maxProgress: 1,
    category: 'social',
    icon: '👋',
  },
  {
    key: 'referral_5',
    nameRu: 'Своя компашка',
    nameKk: 'Өз тобың',
    nameEn: 'Your Crew',
    nameUk: 'Своя компанія',
    nameKa: 'შენი გუნდი',
    nameAz: 'Böyük dəvətçi',
    descRu: 'Пригласи 5 друзей в игру по реферальному коду',
    descKk: 'Реферал кодымен 5 досыңды ойынға шақыр',
    descEn: 'Invite 5 friends to the game via referral code',
    descUk: 'Запроси 5 друзів в гру за реферальним кодом',
    descKa: 'მოიწვიეთ 5 მეგობარი თამაშში რეფერალური კოდით',
    descAz: '5 dostu dəvət et',
    reward: { shanyrak: 5000 },
    maxProgress: 5,
    category: 'social',
    icon: '👥',
  },
  {
    key: 'referral_15',
    nameRu: 'Коммуникатор',
    nameKk: 'Коммуникатор',
    nameEn: 'Communicator',
    nameUk: 'Комунікатор',
    nameKa: 'კომუნიკატორი',
    nameAz: '',  // TODO: translate
    descRu: 'Пригласи 15 друзей в игру по реферальному коду',
    descKk: 'Реферал кодымен 15 досыңды ойынға шақыр',
    descEn: 'Invite 15 friends to the game via referral code',
    descUk: 'Запроси 15 друзів в гру за реферальним кодом',
    descKa: 'მოიწვიეთ 15 მეგობარი თამაშში რეფერალური კოდით',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 15000 },
    maxProgress: 15,
    category: 'social',
    icon: '📣',
  },
  {
    key: 'referral_50',
    nameRu: 'VIP-персона',
    nameKk: 'VIP-тұлға',
    nameEn: 'VIP Person',
    nameUk: 'VIP-персона',
    nameKa: 'VIP-პირი',
    nameAz: '',  // TODO: translate
    descRu: 'Пригласи 50 друзей в игру по реферальному коду',
    descKk: 'Реферал кодымен 50 досыңды ойынға шақыр',
    descEn: 'Invite 50 friends to the game via referral code',
    descUk: 'Запроси 50 друзів в гру за реферальним кодом',
    descKa: 'მოიწვიეთ 50 მეგობარი თამაშში რეფერალური კოდით',
    descAz: '',  // TODO: translate
    reward: { shanyrak: 50000 },
    maxProgress: 50,
    category: 'social',
    icon: '🌟',
  },
];

export const ACHIEVEMENT_MAP: Record<string, AchievementDef> = Object.fromEntries(
  ACHIEVEMENTS.map(a => [a.key, a])
);

/** Bot ratio threshold — achievements only count if bots < this fraction */
export const MAX_BOT_RATIO = 1 / 3; // 33.4%
