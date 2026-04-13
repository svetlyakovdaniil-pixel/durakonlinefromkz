/**
 * Season system constants.
 * 12 seasons total (4 per year × 3 years), each lasting one calendar quarter.
 * Season key format: "YYYY-QN" (e.g. "2026-Q1" for Q1 of 2026)
 *
 * Quarter boundaries:
 *   Q1: Jan 1  – Mar 31
 *   Q2: Apr 1  – Jun 30
 *   Q3: Jul 1  – Sep 30
 *   Q4: Oct 1  – Dec 31
 *
 * The 12 named seasons cycle every 3 years starting from SEASON_BASE_YEAR.
 * Season index = ((year - SEASON_BASE_YEAR) * 4 + (quarter - 1)) % 12
 */

/** The first year of the 12-season cycle. */
export const SEASON_BASE_YEAR = 2025;

export interface SeasonInfo {
  /** 0-indexed season number within the 12-season cycle (0–11) */
  index: number;
  /** Quarter number 1–4 */
  quarter: number;
  nameRu: string;
  nameKk: string;
  nameEn: string;
}

/**
 * 12 named seasons in order.
 * index 0 = Q1 Year 1, index 3 = Q4 Year 1, index 4 = Q1 Year 2, etc.
 */
export const SEASONS: SeasonInfo[] = [
  {
    index: 0,
    quarter: 1,
    nameRu: 'Подводный мир',
    nameKk: 'Су Асты Әлемі',
    nameEn: 'Underwater World',
  },
  {
    index: 1,
    quarter: 2,
    nameRu: 'Египетские боги',
    nameKk: 'Мысыр Құдайлары',
    nameEn: 'Egyptian Gods',
  },
  {
    index: 2,
    quarter: 3,
    nameRu: 'Неоновая эра',
    nameKk: 'Неон Дәуірі',
    nameEn: 'Neon Era',
  },
  {
    index: 3,
    quarter: 4,
    nameRu: 'Скандинавские боги',
    nameKk: 'Скандинавия Құдайлары',
    nameEn: 'Norse Gods',
  },
  {
    index: 4,
    quarter: 1,
    nameRu: 'Космическая одиссея',
    nameKk: 'Ғарыштық Одиссея',
    nameEn: 'Space Odyssey',
  },
  {
    index: 5,
    quarter: 2,
    nameRu: 'Казахский колорит',
    nameKk: 'Қазақ Колориті',
    nameEn: 'Kazakh Colors',
  },
  {
    index: 6,
    quarter: 3,
    nameRu: 'Апокалипсис',
    nameKk: 'Апокалипсис',
    nameEn: 'Apocalypse',
  },
  {
    index: 7,
    quarter: 4,
    nameRu: 'Пиратские острова',
    nameKk: 'Пираттар Аралдары',
    nameEn: 'Pirate Islands',
  },
  {
    index: 8,
    quarter: 1,
    nameRu: 'Японские мотивы',
    nameKk: 'Жапон Мотивтері',
    nameEn: 'Japanese Motifs',
  },
  {
    index: 9,
    quarter: 2,
    nameRu: 'Киберпанк',
    nameKk: 'Киберпанк',
    nameEn: 'Cyberpunk',
  },
  {
    index: 10,
    quarter: 3,
    nameRu: 'Хип-хоп 90-х',
    nameKk: '90-шы жылдар хип-хопы',
    nameEn: '90s Hip-Hop',
  },
  {
    index: 11,
    quarter: 4,
    nameRu: 'Ангелы и Демоны',
    nameKk: 'Періштелер мен Шайтандар',
    nameEn: 'Angels and Demons',
  },
];

/**
 * Get the current season key in "YYYY-QN" format.
 * Example: "2026-Q1" for January–March 2026.
 */
export function getCurrentSeasonKey(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const quarter = Math.floor(now.getUTCMonth() / 3) + 1;
  return `${year}-Q${quarter}`;
}

/**
 * Parse a season key "YYYY-QN" into year and quarter.
 * Falls back to current season on invalid input.
 */
export function parseSeasonKey(seasonKey: string): { year: number; quarter: number } {
  const match = seasonKey.match(/^(\d{4})-Q([1-4])$/);
  if (match) {
    return { year: parseInt(match[1], 10), quarter: parseInt(match[2], 10) };
  }
  // Fallback: current season
  const now = new Date();
  return {
    year: now.getUTCFullYear(),
    quarter: Math.floor(now.getUTCMonth() / 3) + 1,
  };
}

/**
 * Get season info for a given key "YYYY-QN".
 * The season name cycles through the 12 named seasons based on
 * how many quarters have passed since SEASON_BASE_YEAR Q1.
 */
export function getSeasonInfo(seasonKey: string): SeasonInfo {
  const { year, quarter } = parseSeasonKey(seasonKey);
  const totalQuarters = (year - SEASON_BASE_YEAR) * 4 + (quarter - 1);
  const index = ((totalQuarters % 12) + 12) % 12; // always 0-11, handles negative years
  return SEASONS[index];
}

/**
 * Get season start/end timestamps (UTC) for a given key "YYYY-QN".
 * Q1: Jan 1 – Mar 31, Q2: Apr 1 – Jun 30, Q3: Jul 1 – Sep 30, Q4: Oct 1 – Dec 31
 */
export function getSeasonBounds(seasonKey: string): { start: Date; end: Date } {
  const { year, quarter } = parseSeasonKey(seasonKey);
  // Quarter start months (0-indexed): Q1=0, Q2=3, Q3=6, Q4=9
  const startMonth = (quarter - 1) * 3;
  const endMonth = startMonth + 2;
  const start = new Date(Date.UTC(year, startMonth, 1, 0, 0, 0, 0));
  // Last day of endMonth: day 0 of (endMonth+1) = last day of endMonth
  const end = new Date(Date.UTC(year, endMonth + 1, 0, 23, 59, 59, 999));
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
    color: '#b8860b', // dark gold
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
  { rankKey: 'sky_eagle',             shanyraks: 30000,  tenge: 0,   avatarId: 'diving_eagle', frameId: null },
  { rankKey: 'steppe_khan',           shanyraks: 50000,  tenge: 0,   avatarId: 'khan',        frameId: null },
  { rankKey: 'golden_horde_warrior',  shanyraks: 100000, tenge: 50,  avatarId: 'golden_horde', frameId: null },
  { rankKey: 'great_khan',            shanyraks: 500000, tenge: 100, avatarId: 'great_khan',  frameId: 'great_khan' },
];

export function getSeasonRewardDef(rankKey: string): SeasonRewardDef {
  return SEASON_REWARD_DEFS.find(r => r.rankKey === rankKey) ?? SEASON_REWARD_DEFS[0];
}
