/**
 * Daily Quest definitions for Казахский Дурак Онлайн.
 *
 * Rules:
 * - Each day at 00:00 Moscow time (UTC+3), 4 random quests are assigned to each player.
 * - Progress resets daily.
 * - "Король Степи" (king_of_steppe) is a meta-quest: complete 3 other daily quests.
 */

export interface DailyQuestDef {
  key: string;
  nameRu: string;
  nameKk: string;
  nameEn: string;
  descRu: string;
  descKk: string;
  descEn: string;
  reward: { shanyrak: number };
  /** Target value to complete the quest */
  target: number;
  /** What stat/event to track */
  trackType: DailyQuestTrackType;
  /** Whether this quest is a meta-quest (counts other completed quests) */
  isMeta?: boolean;
}

export type DailyQuestTrackType =
  | 'games_played'
  | 'games_won'
  | 'game_finished_under_15min'
  | 'cards_taken_in_game'         // took cards from table in one game ≥ target times
  | 'trump_defenses_streak_games' // defended with trump in N consecutive games
  | 'defenses_total'              // total defenses in a day
  | 'cards_thrown_total'          // total cards thrown to others in a day
  | 'rating_gained'               // rating points gained today
  | 'first_place_today'           // 1st place finishes today
  | 'shanyrak_won_today'          // shanyrak won in games today
  | 'became_durak'                // became the fool (last player) once
  | 'perfect_defense_games'       // games where defended all attacks without taking cards
  | 'trump_defenses_total'        // total trump defenses today
  | 'win_when_opponent_has_1card' // won when opponent had 1 card
  | 'spade_king_beats_trump_ace'  // beat trump ace with king of spades
  | 'spade_king_beats_trump_ace_3'// beat trump ace with king of spades 3 times
  | 'king_beats_trump_total'      // beat any trump card with king of spades N times
  | 'trump_ace_used_total'        // used trump ace N times
  | 'attack_transfers_total'      // transferred attack N times today
  | 'trump_beats_in_one_game'     // beat N cards with trump in one game
  | 'wins_in_a_row'               // N consecutive wins
  | 'cards_thrown_in_one_turn'    // threw N cards in one turn
  | 'wins_today'                  // total wins today
  | 'attacks_total'               // total attacks today
  | 'trump_ace_in_one_game'       // used trump ace N times in one game
  | 'pass_card_shown'             // showed "проездной" (pass card) N times
  | 'started_turn_with_10'        // started a turn with a 10 card N times
  | 'defended_with_777'           // defended with 777 card N times
  | 'threw_6_to_non_neighbor'     // threw a 6 to a non-neighbor player
  | 'beat_same_rank_suit_15'      // beat a card with same rank and suit 15 times
  | 'meta_quests_completed'       // completed N other daily quests today
  | 'became_durak_count'          // became durak N times
  | 'friend_added';                // added a friend (accepted friend request)

export const DAILY_QUESTS: DailyQuestDef[] = [
  // ── 1 ─────────────────────────────────────────────────────────────────────
  {
    key: 'steppe_start',
    nameRu: 'Степной старт',
    nameKk: 'Дала старты',
    nameEn: 'Steppe Start',
    descRu: 'Сыграй 5 партий',
    descKk: '5 ойын ойна',
    descEn: 'Play 5 games',
    reward: { shanyrak: 150 },
    target: 5,
    trackType: 'games_played',
  },
  // ── 2 ─────────────────────────────────────────────────────────────────────
  {
    key: 'first_koshkar',
    nameRu: 'Первый Кошкар',
    nameKk: 'Алғашқы Қошқар',
    nameEn: 'First Koshkar',
    descRu: 'Выиграй 3 партии',
    descKk: '3 ойын жеңіп шық',
    descEn: 'Win 3 games',
    reward: { shanyrak: 300 },
    target: 3,
    trackType: 'games_won',
  },
  // ── 3 ─────────────────────────────────────────────────────────────────────
  {
    key: 'bratishka',
    nameRu: 'Братишка',
    nameKk: 'Бауырым',
    nameEn: 'Bro',
    descRu: 'Добавь 1 человека в друзья',
    descKk: '1 адамды досқа қос',
    descEn: 'Add 1 person as a friend',
    reward: { shanyrak: 300 },
    target: 1,
    trackType: 'friend_added',
  },
  // ── 4 ─────────────────────────────────────────────────────────────────────
  {
    key: 'altyn_novice',
    nameRu: 'Алтын новичок',
    nameKk: 'Алтын жаңадан',
    nameEn: 'Golden Novice',
    descRu: 'Сыграй 8 партий',
    descKk: '8 ойын ойна',
    descEn: 'Play 8 games',
    reward: { shanyrak: 300 },
    target: 8,
    trackType: 'games_played',
  },
  // ── 5 ─────────────────────────────────────────────────────────────────────
  {
    key: 'rabbit_in_steppe',
    nameRu: 'Заяц в степи',
    nameKk: 'Даладағы қоян',
    nameEn: 'Rabbit in the Steppe',
    descRu: 'Возьми карты, если не можешь побиться, 3 раза за партию',
    descKk: 'Бір ойында жауап бере алмай 3 рет карта ал',
    descEn: 'Pick up cards when unable to defend, 3 times in one game',
    reward: { shanyrak: 200 },
    target: 3,
    trackType: 'cards_taken_in_game',
  },
  // ── 6 ─────────────────────────────────────────────────────────────────────
  {
    key: 'first_trump_streak',
    nameRu: 'Первый козырь',
    nameKk: 'Алғашқы козырь',
    nameEn: 'First Trump',
    descRu: 'Побейся козырем в 10 партиях подряд',
    descKk: '10 ойын қатарынан козырьмен жауап бер',
    descEn: 'Defend with a trump card in 10 consecutive games',
    reward: { shanyrak: 200 },
    target: 10,
    trackType: 'trump_defenses_streak_games',
  },
  // ── 7 ─────────────────────────────────────────────────────────────────────
  {
    key: 'steppe_warrior_daily',
    nameRu: 'Степной воин',
    nameKk: 'Дала жауынгері',
    nameEn: 'Steppe Warrior',
    descRu: 'Сыграй 10 партий',
    descKk: '10 ойын ойна',
    descEn: 'Play 10 games',
    reward: { shanyrak: 400 },
    target: 10,
    trackType: 'games_played',
  },
  // ── 8 ─────────────────────────────────────────────────────────────────────
  {
    key: 'little_batyr',
    nameRu: 'Маленький батыр',
    nameKk: 'Кішкентай батыр',
    nameEn: 'Little Batyr',
    descRu: 'Отбей 15 атак',
    descKk: '15 шабуылды тойтар',
    descEn: 'Deflect 15 attacks',
    reward: { shanyrak: 200 },
    target: 15,
    trackType: 'defenses_total',
  },
  // ── 9 ─────────────────────────────────────────────────────────────────────
  {
    key: 'quick_start_daily',
    nameRu: 'Быстрый старт',
    nameKk: 'Жылдам старт',
    nameEn: 'Quick Start',
    descRu: 'Выиграй 4 партии за день',
    descKk: 'Күн ішінде 4 ойын жеңіп шық',
    descEn: 'Win 4 games today',
    reward: { shanyrak: 250 },
    target: 4,
    trackType: 'wins_today',
  },
  // ── 10 ────────────────────────────────────────────────────────────────────
  {
    key: 'tulpar_warmup',
    nameRu: 'Тулпар-разминка',
    nameKk: 'Тұлпар жаттығуы',
    nameEn: 'Tulpar Warmup',
    descRu: 'Отбейся 10 раз',
    descKk: '10 рет жауап бер',
    descEn: 'Defend 10 times',
    reward: { shanyrak: 150 },
    target: 10,
    trackType: 'defenses_total',
  },
  // ── 11 ────────────────────────────────────────────────────────────────────
  {
    key: 'koshkar_woke_up',
    nameRu: 'Кошкар проснулся',
    nameKk: 'Қошқар оянды',
    nameEn: 'Koshkar Woke Up',
    descRu: 'Подкинь 30 карт другим игрокам за день',
    descKk: 'Күн ішінде басқа ойыншыларға 30 карта лақтыр',
    descEn: 'Throw 30 cards to other players today',
    reward: { shanyrak: 200 },
    target: 30,
    trackType: 'cards_thrown_total',
  },
  // ── 12 ────────────────────────────────────────────────────────────────────
  {
    key: 'golden_debut',
    nameRu: 'Золотой дебют',
    nameKk: 'Алтын дебют',
    nameEn: 'Golden Debut',
    descRu: 'Набери 100 очков рейтинга за все партии',
    descKk: 'Барлық ойындарда 100 рейтинг ұпайын жина',
    descEn: 'Gain 100 rating points across all games',
    reward: { shanyrak: 200 },
    target: 100,
    trackType: 'rating_gained',
  },
  // ── 13 ────────────────────────────────────────────────────────────────────
  {
    key: 'steppe_student_daily',
    nameRu: 'Степной ученик',
    nameKk: 'Дала шәкірті',
    nameEn: 'Steppe Student',
    descRu: 'Сыграй 12 партий',
    descKk: '12 ойын ойна',
    descEn: 'Play 12 games',
    reward: { shanyrak: 750 },
    target: 12,
    trackType: 'games_played',
  },
  // ── 14 ────────────────────────────────────────────────────────────────────
  {
    key: 'first_berkut_daily',
    nameRu: 'Первый беркут',
    nameKk: 'Алғашқы бүркіт',
    nameEn: 'First Berkut',
    descRu: 'Займи 1-е место в трёх матчах за день',
    descKk: 'Күн ішінде үш матчта 1-ші орынды ал',
    descEn: 'Finish 1st in three matches today',
    reward: { shanyrak: 400 },
    target: 3,
    trackType: 'first_place_today',
  },
  // ── 15 ────────────────────────────────────────────────────────────────────
  {
    key: 'khan_day',
    nameRu: 'Ханский день',
    nameKk: 'Хандық күн',
    nameEn: "Khan's Day",
    descRu: 'Выиграй 1000 шаныраков в играх с другими игроками',
    descKk: 'Басқа ойыншылармен ойындарда 1000 шаңырақ ұтып ал',
    descEn: 'Win 1000 shanyrak in games with other players',
    reward: { shanyrak: 300 },
    target: 1000,
    trackType: 'shanyrak_won_today',
  },
  // ── 16 ────────────────────────────────────────────────────────────────────
  {
    key: 'really_sure',
    nameRu: 'А точно ли?',
    nameKk: 'Шынымен бе?',
    nameEn: 'Are You Sure?',
    descRu: 'Стань дураком 1 раз',
    descKk: '1 рет ақымақ бол',
    descEn: 'Become the fool once',
    reward: { shanyrak: 100 },
    target: 1,
    trackType: 'became_durak',
  },
  // ── 17 ────────────────────────────────────────────────────────────────────
  {
    key: 'throw_king',
    nameRu: 'Король подкидывания',
    nameKk: 'Лақтырудың королі',
    nameEn: 'Throw King',
    descRu: 'Подкинь 50 карт другим игрокам за день',
    descKk: 'Күн ішінде басқа ойыншыларға 50 карта лақтыр',
    descEn: 'Throw 50 cards to other players today',
    reward: { shanyrak: 300 },
    target: 50,
    trackType: 'cards_thrown_total',
  },
  // ── 18 ────────────────────────────────────────────────────────────────────
  {
    key: 'perfect_defense_daily',
    nameRu: 'Идеальная защита',
    nameKk: 'Мінсіз қорғаныс',
    nameEn: 'Perfect Defense',
    descRu: 'Отбей все атаки в 1 партии, ни разу не взяв карты со стола себе в руку',
    descKk: 'Бір ойында барлық шабуылды тойтар, столдан бірде-бір карта алмай',
    descEn: 'Deflect all attacks in 1 game without picking up any cards',
    reward: { shanyrak: 400 },
    target: 1,
    trackType: 'perfect_defense_games',
  },
  // ── 19 ────────────────────────────────────────────────────────────────────
  {
    key: 'trump_rain',
    nameRu: 'Козырной дождь',
    nameKk: 'Козырь жаңбыры',
    nameEn: 'Trump Rain',
    descRu: 'Отбейся козырем 20 раз',
    descKk: 'Козырьмен 20 рет жауап бер',
    descEn: 'Defend with a trump card 20 times',
    reward: { shanyrak: 200 },
    target: 20,
    trackType: 'trump_defenses_total',
  },
  // ── 20 ────────────────────────────────────────────────────────────────────
  {
    key: 'iron_defense',
    nameRu: 'Железная оборона',
    nameKk: 'Темір қорғаныс',
    nameEn: 'Iron Defense',
    descRu: 'Отбей все атаки в 3-х партиях, ни разу не взяв карты со стола себе в руку',
    descKk: '3 ойында барлық шабуылды тойтар, столдан бірде-бір карта алмай',
    descEn: 'Deflect all attacks in 3 games without picking up any cards',
    reward: { shanyrak: 700 },
    target: 3,
    trackType: 'perfect_defense_games',
  },
  // ── 21 ────────────────────────────────────────────────────────────────────
  {
    key: 'last_hero',
    nameRu: 'Последний герой',
    nameKk: 'Соңғы батыр',
    nameEn: 'Last Hero',
    descRu: 'Выиграй партию, когда у противника осталась 1 карта',
    descKk: 'Қарсыласыңда 1 карта қалғанда ойынды жеңіп шық',
    descEn: 'Win a game when your opponent has only 1 card left',
    reward: { shanyrak: 300 },
    target: 1,
    trackType: 'win_when_opponent_has_1card',
  },
  // ── 22 ────────────────────────────────────────────────────────────────────
  {
    key: 'invincible_ace_spades',
    nameRu: 'Непобедимый Туз пики',
    nameKk: 'Жеңілмес пика тузы',
    nameEn: 'Invincible Ace of Spades',
    descRu: 'Побей короля пики тузом пики 5 раз',
    descKk: 'Пика королін пика тузымен 5 рет жеңіп шық',
    descEn: 'Beat the King of Spades with the Ace of Spades 5 times',
    reward: { shanyrak: 300 },
    target: 5,
    trackType: 'spade_king_beats_trump_ace',
  },
  // ── 23 ────────────────────────────────────────────────────────────────────
  {
    key: 'ace_spades_master',
    nameRu: 'Мастер Туза пик',
    nameKk: 'Пика тузының шебері',
    nameEn: 'Ace of Spades Master',
    descRu: 'Побей короля пики тузом пики 3 раза',
    descKk: 'Пика королін пика тузымен 3 рет жеңіп шық',
    descEn: 'Beat the King of Spades with the Ace of Spades 3 times',
    reward: { shanyrak: 150 },
    target: 3,
    trackType: 'spade_king_beats_trump_ace_3',
  },
  // ── 24 ────────────────────────────────────────────────────────────────────
  {
    key: 'spade_king_daily',
    nameRu: 'Король пики',
    nameKk: 'Пика королі',
    nameEn: 'King of Spades',
    descRu: 'Побей любую козырную карту королём пики 5 раз',
    descKk: 'Кез келген козырь картаны пика королімен 5 рет жеңіп шық',
    descEn: 'Beat any trump card with the King of Spades 5 times',
    reward: { shanyrak: 300 },
    target: 5,
    trackType: 'king_beats_trump_total',
  },
  // ── 25 ────────────────────────────────────────────────────────────────────
  {
    key: 'king_of_kings',
    nameRu: 'Король всех королей',
    nameKk: 'Барлық корольдердің королі',
    nameEn: 'King of All Kings',
    descRu: 'Побей любую козырную карту королём пики 10 раз',
    descKk: 'Кез келген козырь картаны пика королімен 10 рет жеңіп шық',
    descEn: 'Beat any trump card with the King of Spades 10 times',
    reward: { shanyrak: 700 },
    target: 10,
    trackType: 'king_beats_trump_total',
  },
  // ── 26 ────────────────────────────────────────────────────────────────────
  {
    key: 'trump_ace_master',
    nameRu: 'Козырной мастер',
    nameKk: 'Козырь шебері',
    nameEn: 'Trump Master',
    descRu: 'Используй козырного туза 6 раз',
    descKk: 'Козырь тузын 6 рет қолдан',
    descEn: 'Use the trump ace 6 times',
    reward: { shanyrak: 300 },
    target: 6,
    trackType: 'trump_ace_used_total',
  },
  // ── 27 ────────────────────────────────────────────────────────────────────
  {
    key: 'king_of_steppe',
    nameRu: 'Король Степи',
    nameKk: 'Дала Королі',
    nameEn: 'King of the Steppe',
    descRu: 'Выполни 3 любых ежедневных задания за день',
    descKk: 'Күн ішінде кез келген 3 күнделікті тапсырманы орында',
    descEn: 'Complete any 3 daily quests today',
    reward: { shanyrak: 500 },
    target: 3,
    trackType: 'meta_quests_completed',
    isMeta: true,
  },
  // ── 28 ────────────────────────────────────────────────────────────────────
  {
    key: 'first_transfer',
    nameRu: 'Первый перевод',
    nameKk: 'Алғашқы аудару',
    nameEn: 'First Transfer',
    descRu: 'Переведи атаку 5 раз за день',
    descKk: 'Күн ішінде шабуылды 5 рет аудар',
    descEn: 'Transfer the attack 5 times today',
    reward: { shanyrak: 150 },
    target: 5,
    trackType: 'attack_transfers_total',
  },
  // ── 29 ────────────────────────────────────────────────────────────────────
  {
    key: 'transfer_master',
    nameRu: 'Мастер перевода',
    nameKk: 'Аудару шебері',
    nameEn: 'Transfer Master',
    descRu: 'Переведи атаку 15 раз за день',
    descKk: 'Күн ішінде шабуылды 15 рет аудар',
    descEn: 'Transfer the attack 15 times today',
    reward: { shanyrak: 250 },
    target: 15,
    trackType: 'attack_transfers_total',
  },
  // ── 30 ────────────────────────────────────────────────────────────────────
  {
    key: 'trump_hunter',
    nameRu: 'Козырной охотник',
    nameKk: 'Козырь аңшысы',
    nameEn: 'Trump Hunter',
    descRu: 'Побей козырем 15 карт за одну партию',
    descKk: 'Бір ойында козырьмен 15 карта жеңіп шық',
    descEn: 'Beat 15 cards with trumps in one game',
    reward: { shanyrak: 200 },
    target: 15,
    trackType: 'trump_beats_in_one_game',
  },
  // ── 31 ────────────────────────────────────────────────────────────────────
  {
    key: 'serial_winner',
    nameRu: 'Серийный победитель',
    nameKk: 'Сериялы жеңімпаз',
    nameEn: 'Serial Winner',
    descRu: 'Выиграй 2 партии подряд',
    descKk: 'Қатарынан 2 ойын жеңіп шық',
    descEn: 'Win 2 games in a row',
    reward: { shanyrak: 250 },
    target: 2,
    trackType: 'wins_in_a_row',
  },
  // ── 32 ────────────────────────────────────────────────────────────────────
  {
    key: 'card_storm',
    nameRu: 'Карточный шторм',
    nameKk: 'Карта дауылы',
    nameEn: 'Card Storm',
    descRu: 'Подкинь 10 карт за один ход',
    descKk: 'Бір жүрісте 10 карта лақтыр',
    descEn: 'Throw 10 cards in one turn',
    reward: { shanyrak: 200 },
    target: 10,
    trackType: 'cards_thrown_in_one_turn',
  },
  // ── 33 ────────────────────────────────────────────────────────────────────
  {
    key: 'unstoppable',
    nameRu: 'Неудержимый',
    nameKk: 'Тоқтатылмайтын',
    nameEn: 'Unstoppable',
    descRu: 'Выиграй 5 партий за день',
    descKk: 'Күн ішінде 5 ойын жеңіп шық',
    descEn: 'Win 5 games today',
    reward: { shanyrak: 500 },
    target: 5,
    trackType: 'wins_today',
  },
  // ── 34 ────────────────────────────────────────────────────────────────────
  {
    key: 'bold_move',
    nameRu: 'Дерзкий ход',
    nameKk: 'Батыл жүріс',
    nameEn: 'Bold Move',
    descRu: 'Побей туза другим тузом 3 раза',
    descKk: 'Тузды басқа тузбен 3 рет жеңіп шық',
    descEn: 'Beat an ace with another ace 3 times',
    reward: { shanyrak: 300 },
    target: 3,
    trackType: 'trump_ace_used_total',
  },
  // ── 35 ────────────────────────────────────────────────────────────────────
  {
    key: 'attack_master',
    nameRu: 'Мастер атаки',
    nameKk: 'Шабуыл шебері',
    nameEn: 'Attack Master',
    descRu: 'Атакуй 20 раз за день',
    descKk: 'Күн ішінде 20 рет шабуыл жаса',
    descEn: 'Attack 20 times today',
    reward: { shanyrak: 200 },
    target: 20,
    trackType: 'attacks_total',
  },
  // ── 36 ────────────────────────────────────────────────────────────────────
  {
    key: 'trump_ace_game',
    nameRu: 'Козырной туз',
    nameKk: 'Козырь тузы',
    nameEn: 'Trump Ace',
    descRu: 'Используй козырного туза 3 раза за одну партию',
    descKk: 'Бір ойында козырь тузын 3 рет қолдан',
    descEn: 'Use the trump ace 3 times in one game',
    reward: { shanyrak: 250 },
    target: 3,
    trackType: 'trump_ace_in_one_game',
  },
  // ── 37 ────────────────────────────────────────────────────────────────────
  {
    key: 'lets_go',
    nameRu: 'Давай дальше',
    nameKk: 'Жүре бер',
    nameEn: "Let's Go",
    descRu: 'Покажи проездной 5 раз',
    descKk: 'Өткізгішті 5 рет көрсет',
    descEn: 'Show the pass card 5 times',
    reward: { shanyrak: 300 },
    target: 5,
    trackType: 'pass_card_shown',
  },
  // ── 38 ────────────────────────────────────────────────────────────────────
  {
    key: 'shall_we_ride',
    nameRu: 'Прокатимся?',
    nameKk: 'Жүрейік пе?',
    nameEn: 'Shall We Ride?',
    descRu: 'Покажи проездной 10 раз',
    descKk: 'Өткізгішті 10 рет көрсет',
    descEn: 'Show the pass card 10 times',
    reward: { shanyrak: 500 },
    target: 10,
    trackType: 'pass_card_shown',
  },
  // ── 39 ────────────────────────────────────────────────────────────────────
  {
    key: 'werewolf',
    nameRu: 'Оборотень',
    nameKk: 'Айналмалы',
    nameEn: 'Werewolf',
    descRu: 'Начни ход с 10-ки 3 раза',
    descKk: '10-шымен жүрісті 3 рет баста',
    descEn: 'Start a turn with a 10 card 3 times',
    reward: { shanyrak: 300 },
    target: 3,
    trackType: 'started_turn_with_10',
  },
  // ── 40 ────────────────────────────────────────────────────────────────────
  {
    key: 'flipper',
    nameRu: 'Перевертыш',
    nameKk: 'Аударғыш',
    nameEn: 'Flipper',
    descRu: 'Начни ход с 10-ки 5 раз',
    descKk: '10-шымен жүрісті 5 рет баста',
    descEn: 'Start a turn with a 10 card 5 times',
    reward: { shanyrak: 500 },
    target: 5,
    trackType: 'started_turn_with_10',
  },
  // ── 41 ────────────────────────────────────────────────────────────────────
  {
    key: 'in_suit',
    nameRu: 'В масть',
    nameKk: 'Мастьке сай',
    nameEn: 'In Suit',
    descRu: "Отбейся картой «777» 3 раза",
    descKk: '«777» картасымен 3 рет жауап бер',
    descEn: 'Defend with the 777 card 3 times',
    reward: { shanyrak: 500 },
    target: 3,
    trackType: 'defended_with_777',
  },
  // ── 42 ────────────────────────────────────────────────────────────────────
  {
    key: 'foundling',
    nameRu: 'Подкидыш',
    nameKk: 'Лақтырылған',
    nameEn: 'Foundling',
    descRu: 'Подкинь 6-ку игроку, когда не являешься его соседом',
    descKk: 'Көршің болмаған ойыншыға 6-шыны лақтыр',
    descEn: 'Throw a 6 to a player who is not your neighbor',
    reward: { shanyrak: 200 },
    target: 1,
    trackType: 'threw_6_to_non_neighbor',
  },
  // ── 43 ────────────────────────────────────────────────────────────────────
  {
    key: 'legendary_day',
    nameRu: 'Легендарный день',
    nameKk: 'Аңыздық күн',
    nameEn: 'Legendary Day',
    descRu: 'Побей карту картой с таким же индексом и мастью 15 раз',
    descKk: 'Картаны сол индекс пен мастьтегі картамен 15 рет жеңіп шық',
    descEn: 'Beat a card with a card of the same rank and suit 15 times',
    reward: { shanyrak: 200 },
    target: 15,
    trackType: 'beat_same_rank_suit_15',
  },
];

export const DAILY_QUEST_MAP: Record<string, DailyQuestDef> = Object.fromEntries(
  DAILY_QUESTS.map(q => [q.key, q])
);

/** Moscow timezone offset in hours */
export const MOSCOW_UTC_OFFSET = 3;

/**
 * Returns the start of the current "Moscow day" as a UTC timestamp (ms).
 * Resets at 00:00 Moscow time = 21:00 UTC previous day.
 */
export function getMoscowDayStart(now: Date = new Date()): number {
  const utcMs = now.getTime();
  const moscowMs = utcMs + MOSCOW_UTC_OFFSET * 3600 * 1000;
  const moscowDate = new Date(moscowMs);
  // Midnight Moscow = floor to day
  const dayStart = new Date(Date.UTC(
    moscowDate.getUTCFullYear(),
    moscowDate.getUTCMonth(),
    moscowDate.getUTCDate(),
    0, 0, 0, 0,
  ));
  // Convert back to UTC
  return dayStart.getTime() - MOSCOW_UTC_OFFSET * 3600 * 1000;
}

/** Number of quests assigned per player per day */
export const DAILY_QUEST_COUNT = 4;
