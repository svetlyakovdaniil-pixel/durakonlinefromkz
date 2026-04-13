/**
 * Season system constants.
 * 12 seasons per year, each lasting exactly one calendar month.
 * Season key format: "YYYY-MM"
 */

export interface SeasonInfo {
  /** 0-indexed month (0 = January, 11 = December) */
  month: number;
  nameRu: string;
  nameKk: string;
  nameEn: string;
}

export const SEASONS: SeasonInfo[] = [
  { month: 0,  nameRu: 'Сезон Золотого Барана',     nameKk: 'Алтын Қошқар Маусымы',     nameEn: 'Season of the Golden Ram' },
  { month: 1,  nameRu: 'Сезон Крылатого Коня',      nameKk: 'Қанатты Ат Маусымы',        nameEn: 'Season of the Winged Horse' },
  { month: 2,  nameRu: 'Сезон Небесного Орла',      nameKk: 'Аспан Бүркіті Маусымы',     nameEn: 'Season of the Sky Eagle' },
  { month: 3,  nameRu: 'Сезон Горного Воина',       nameKk: 'Тау Жауынгері Маусымы',     nameEn: 'Season of the Mountain Warrior' },
  { month: 4,  nameRu: 'Сезон Хана Степи',          nameKk: 'Дала Ханы Маусымы',         nameEn: 'Season of the Steppe Khan' },
  { month: 5,  nameRu: 'Сезон Мифической Птицы',    nameKk: 'Аңыз Құс Маусымы',         nameEn: 'Season of the Mythical Bird' },
  { month: 6,  nameRu: 'Сезон Семи Соколов',        nameKk: 'Жеті Сұңқар Маусымы',      nameEn: 'Season of the Seven Falcons' },
  { month: 7,  nameRu: 'Сезон Золотой Орды',        nameKk: 'Алтын Орда Маусымы',        nameEn: 'Season of the Golden Horde' },
  { month: 8,  nameRu: 'Сезон Стального Воина',     nameKk: 'Болат Жауынгер Маусымы',    nameEn: 'Season of the Steel Warrior' },
  { month: 9,  nameRu: 'Сезон Пламенного Коня',     nameKk: 'Жалынды Ат Маусымы',        nameEn: 'Season of the Flame Horse' },
  { month: 10, nameRu: 'Сезон Легендарного Орла',   nameKk: 'Аңыз Бүркіт Маусымы',      nameEn: 'Season of the Legendary Eagle' },
  { month: 11, nameRu: 'Сезон Владыки Степи',       nameKk: 'Дала Билеушісі Маусымы',    nameEn: 'Season of the Steppe Ruler' },
];

/** Get the current season key "YYYY-MM" */
export function getCurrentSeasonKey(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/** Get season info for a given key "YYYY-MM" */
export function getSeasonInfo(seasonKey: string): SeasonInfo {
  const month = parseInt(seasonKey.split('-')[1], 10) - 1;
  return SEASONS[month] ?? SEASONS[0];
}

/** Get season start/end timestamps (UTC) for a given key "YYYY-MM" */
export function getSeasonBounds(seasonKey: string): { start: Date; end: Date } {
  const [year, month] = seasonKey.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  // Last day of month: day 0 of next month = last day of current month
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
}

// ─── RANKS ────────────────────────────────────────────────────────────────────

export interface SeasonRank {
  key: string;
  nameRu: string;
  nameKk: string;
  nameEn: string;
  minRating: number;
  maxRating: number; // Infinity for the last rank
  /** CSS color for the diamond icon */
  color: string;
  /** Whether this rank has a special animation */
  animated: boolean;
}

export const SEASON_RANKS: SeasonRank[] = [
  {
    key: 'steppe_hare',
    nameRu: 'Степной заяц',
    nameKk: 'Дала Қояны',
    nameEn: 'Steppe Hare',
    minRating: 0,
    maxRating: 200,
    color: '#9ca3af', // gray-400
    animated: false,
  },
  {
    key: 'mountain_ram',
    nameRu: 'Горный баран',
    nameKk: 'Тау Қошқары',
    nameEn: 'Mountain Ram',
    minRating: 201,
    maxRating: 500,
    color: '#22c55e', // green-500
    animated: false,
  },
  {
    key: 'golden_falcon',
    nameRu: 'Золотой сокол',
    nameKk: 'Алтын Сұңқар',
    nameEn: 'Golden Falcon',
    minRating: 501,
    maxRating: 800,
    color: '#3b82f6', // blue-500
    animated: false,
  },
  {
    key: 'winged_horse',
    nameRu: 'Крылатый конь',
    nameKk: 'Қанатты Ат',
    nameEn: 'Winged Horse',
    minRating: 801,
    maxRating: 1200,
    color: '#a855f7', // purple-500
    animated: false,
  },
  {
    key: 'sky_eagle',
    nameRu: 'Небесный орел',
    nameKk: 'Аспан Бүркіті',
    nameEn: 'Sky Eagle',
    minRating: 1201,
    maxRating: 2000,
    color: '#f97316', // orange-500
    animated: false,
  },
  {
    key: 'steppe_khan',
    nameRu: 'Хан степи',
    nameKk: 'Дала Ханы',
    nameEn: 'Steppe Khan',
    minRating: 2001,
    maxRating: 4000,
    color: '#ef4444', // red-500
    animated: false,
  },
  {
    key: 'golden_horde_warrior',
    nameRu: 'Воин золотой орды',
    nameKk: 'Алтын Орда Жауынгері',
    nameEn: 'Golden Horde Warrior',
    minRating: 4001,
    maxRating: 10000,
    color: '#eab308', // yellow-500 (gold)
    animated: false,
  },
  {
    key: 'great_khan',
    nameRu: 'Великий хан',
    nameKk: 'Ұлы Хан',
    nameEn: 'Great Khan',
    minRating: 10001,
    maxRating: Infinity,
    color: '#111827', // near-black with gold shimmer
    animated: true,
  },
];

/** Get the rank for a given season rating */
export function getSeasonRank(rating: number): SeasonRank {
  for (let i = SEASON_RANKS.length - 1; i >= 0; i--) {
    if (rating >= SEASON_RANKS[i].minRating) {
      return SEASON_RANKS[i];
    }
  }
  return SEASON_RANKS[0];
}

// ─── REWARDS ──────────────────────────────────────────────────────────────────

export interface SeasonRewardDef {
  rankKey: string;
  shanyraks: number;
  tenge: number;
  /** Avatar ID to unlock (null = none for now) */
  avatarId: string | null;
  /** Frame ID to unlock (null = none for now) */
  frameId: string | null;
}

export const SEASON_REWARD_DEFS: SeasonRewardDef[] = [
  { rankKey: 'steppe_hare',           shanyraks: 2000,   tenge: 0,   avatarId: null,          frameId: null },
  { rankKey: 'mountain_ram',          shanyraks: 5000,   tenge: 0,   avatarId: null,          frameId: null },
  { rankKey: 'golden_falcon',         shanyraks: 7000,   tenge: 0,   avatarId: null,          frameId: null },
  { rankKey: 'winged_horse',          shanyraks: 10000,  tenge: 0,   avatarId: null,          frameId: null },
  { rankKey: 'sky_eagle',             shanyraks: 30000,  tenge: 0,   avatarId: 'sky_eagle',   frameId: null },
  { rankKey: 'steppe_khan',           shanyraks: 50000,  tenge: 0,   avatarId: 'khan',        frameId: null },
  { rankKey: 'golden_horde_warrior',  shanyraks: 100000, tenge: 50,  avatarId: 'golden_horde', frameId: null },
  { rankKey: 'great_khan',            shanyraks: 500000, tenge: 100, avatarId: 'great_khan',  frameId: 'great_khan' },
];

export function getSeasonRewardDef(rankKey: string): SeasonRewardDef {
  return SEASON_REWARD_DEFS.find(r => r.rankKey === rankKey) ?? SEASON_REWARD_DEFS[0];
}
