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

/** Color theme for a season — used to style the Season page */
export interface SeasonTheme {
  /** Primary accent color (hex) */
  accent: string;
  /** Secondary accent color (hex) */
  accentSecondary: string;
  /** Background gradient start (CSS color) */
  bgFrom: string;
  /** Background gradient end (CSS color) */
  bgTo: string;
  /** Border color (CSS color with opacity) */
  border: string;
  /** Tab active indicator color */
  tabActive: string;
  /** Header icon color class (Tailwind) */
  iconClass: string;
  /** Emoji icon for the season */
  emoji: string;
}

/** Per-season override for a specific rank's reward */
export interface SeasonRankRewardOverride {
  rankKey: string;
  avatarId?: string | null;
  frameId?: string | null;
}

export interface SeasonInfo {
  /** 0-indexed season number within the 12-season cycle (0–11) */
  index: number;
  /** 1-indexed season number for display (1–12) */
  seasonNumber: number;
  /** Quarter number 1–4 */
  quarter: number;
  nameRu: string;
  nameKk: string;
  nameEn: string;
  /** Visual theme for the Season page */
  theme: SeasonTheme;
  /** Per-season overrides for rank rewards (avatar/frame). Overrides SEASON_REWARD_DEFS for this season only. */
  rankRewardOverrides?: SeasonRankRewardOverride[];
}

/**
 * 12 named seasons in order.
 * index 0 = Q1 Year 1, index 3 = Q4 Year 1, index 4 = Q1 Year 2, etc.
 */
export const SEASONS: SeasonInfo[] = [
  {
    index: 0,
    seasonNumber: 1,
    quarter: 1,
    nameRu: 'Подводный мир',
    nameKk: 'Су Асты Әлемі',
    nameEn: 'Underwater World',
    theme: {
      accent: '#06b6d4',
      accentSecondary: '#0891b2',
      bgFrom: '#031a2e',
      bgTo: '#042a3e',
      border: 'rgba(6,182,212,0.25)',
      tabActive: '#06b6d4',
      iconClass: 'text-cyan-400',
      emoji: '🌊',
    },
  },
  {
    index: 1,
    seasonNumber: 2,
    quarter: 2,
    nameRu: 'Египетские боги',
    nameKk: 'Мысыр Құдайлары',
    nameEn: 'Egyptian Gods',
    theme: {
      accent: '#f59e0b',
      accentSecondary: '#d97706',
      bgFrom: '#1c1200',
      bgTo: '#2a1a00',
      border: 'rgba(245,158,11,0.25)',
      tabActive: '#f59e0b',
      iconClass: 'text-amber-400',
      emoji: '⚱️',
    },
  },
  {
    index: 2,
    seasonNumber: 3,
    quarter: 3,
    nameRu: 'Пиратские острова',
    nameKk: 'Пираттар Аралдары',
    nameEn: 'Pirate Islands',
    theme: {
      accent: '#78716c',
      accentSecondary: '#0ea5e9',
      bgFrom: '#0a0e12',
      bgTo: '#0f1a20',
      border: 'rgba(120,113,108,0.25)',
      tabActive: '#78716c',
      iconClass: 'text-stone-400',
      emoji: '🏴‍☠️',
    },
  },
  {
    index: 3,
    seasonNumber: 4,
    quarter: 4,
    nameRu: 'Скандинавские боги',
    nameKk: 'Скандинавия Құдайлары',
    nameEn: 'Norse Gods',
    theme: {
      accent: '#94a3b8',
      accentSecondary: '#64748b',
      bgFrom: '#0a1020',
      bgTo: '#111827',
      border: 'rgba(148,163,184,0.25)',
      tabActive: '#94a3b8',
      iconClass: 'text-slate-300',
      emoji: '⚡',
    },
  },
  {
    index: 4,
    seasonNumber: 5,
    quarter: 1,
    nameRu: 'Космическая одиссея',
    nameKk: 'Ғарыштық Одиссея',
    nameEn: 'Space Odyssey',
    theme: {
      accent: '#6366f1',
      accentSecondary: '#4f46e5',
      bgFrom: '#020010',
      bgTo: '#0a0020',
      border: 'rgba(99,102,241,0.25)',
      tabActive: '#6366f1',
      iconClass: 'text-indigo-400',
      emoji: '🚀',
    },
  },
  {
    index: 5,
    seasonNumber: 6,
    quarter: 2,
    nameRu: 'Казахский колорит',
    nameKk: 'Қазақ Колоріті',
    nameEn: 'Kazakh Colors',
    theme: {
      accent: '#f59e0b',
      accentSecondary: '#dc2626',
      bgFrom: '#1a0e00',
      bgTo: '#200800',
      border: 'rgba(245,158,11,0.30)',
      tabActive: '#f59e0b',
      iconClass: 'text-amber-400',
      emoji: '🏇',
    },
    // Season 6 unique rewards: Zircon rank gets the Diving Eagle animated avatar
    rankRewardOverrides: [
      { rankKey: 'sky_eagle', avatarId: 'diving_eagle' },
    ],
  },
  {
    index: 6,
    seasonNumber: 7,
    quarter: 3,
    nameRu: 'Неоновая эра',
    nameKk: 'Неон Дәуірі',
    nameEn: 'Neon Era',
    theme: {
      accent: '#a855f7',
      accentSecondary: '#ec4899',
      bgFrom: '#0d0020',
      bgTo: '#1a0030',
      border: 'rgba(168,85,247,0.25)',
      tabActive: '#a855f7',
      iconClass: 'text-purple-400',
      emoji: '💜',
    },
    // Season 7 unique rewards:
    // Zircon (sky_eagle) → Neon Paw animated avatar
    // Ruby (steppe_khan) → Neon Dino animated avatar
    // Amber (golden_horde_warrior) → Neon Cat animated avatar
    rankRewardOverrides: [
      { rankKey: 'sky_eagle', avatarId: 'neon_paw' },
      { rankKey: 'steppe_khan', avatarId: 'neon_dino' },
      { rankKey: 'golden_horde_warrior', avatarId: 'neon_cat' },
      { rankKey: 'great_khan', avatarId: 'neon_crown', frameId: 'obsidian_neon' },
    ],
  },
  {
    index: 7,
    seasonNumber: 8,
    quarter: 4,
    nameRu: 'Апокалипсис',
    nameKk: 'Апокалипсис',
    nameEn: 'Apocalypse',
    rankRewardOverrides: [
      { rankKey: 'sky_eagle', avatarId: 'apocalypse_city' },
      { rankKey: 'steppe_khan', avatarId: 'toxic_storm' },
      { rankKey: 'golden_horde_warrior', avatarId: 'gasmask_amber' },
      { rankKey: 'great_khan', avatarId: 'nuclear_mushroom', frameId: 'molten_lava' },
    ],
    theme: {
      accent: '#ef4444',
      accentSecondary: '#f97316',
      bgFrom: '#1a0000',
      bgTo: '#200500',
      border: 'rgba(239,68,68,0.25)',
      tabActive: '#ef4444',
      iconClass: 'text-red-400',
      emoji: '🔥',
    },
  },
  {
    index: 8,
    seasonNumber: 9,
    quarter: 1,
    nameRu: 'Японские мотивы',
    nameKk: 'Жапон Мотивтері',
    nameEn: 'Japanese Motifs',
    rankRewardOverrides: [
      { rankKey: 'steppe_khan', avatarId: 'amaterasu_ruby' },
      { rankKey: 'golden_horde_warrior', avatarId: 'samurai_amber' },
      { rankKey: 'great_khan', avatarId: 'oni_mask_obsidian' },
      { rankKey: 'sky_eagle', avatarId: 'japanese_motifs_zircon' },
    ],
    theme: {
      accent: '#f472b6',
      accentSecondary: '#ec4899',
      bgFrom: '#1a0010',
      bgTo: '#200018',
      border: 'rgba(244,114,182,0.25)',
      tabActive: '#f472b6',
      iconClass: 'text-pink-400',
      emoji: '🌸',
    },
  },
  {
    index: 9,
    seasonNumber: 10,
    quarter: 2,
    nameRu: 'Киберпанк',
    nameKk: 'Киберпанк',
    nameEn: 'Cyberpunk',
    theme: {
      accent: '#22c55e',
      accentSecondary: '#84cc16',
      bgFrom: '#001a08',
      bgTo: '#002010',
      border: 'rgba(34,197,94,0.25)',
      tabActive: '#22c55e',
      iconClass: 'text-green-400',
      emoji: '🤖',
    },
  },
  {
    index: 10,
    seasonNumber: 11,
    quarter: 3,
    nameRu: 'Хип-хоп 90-х',
    nameKk: '90-шы жылдар хип-хопы',
    nameEn: '90s Hip-Hop',
    theme: {
      accent: '#fb923c',
      accentSecondary: '#facc15',
      bgFrom: '#1a0800',
      bgTo: '#200e00',
      border: 'rgba(251,146,60,0.25)',
      tabActive: '#fb923c',
      iconClass: 'text-orange-400',
      emoji: '🎤',
    },
  },
  {
    index: 11,
    seasonNumber: 12,
    quarter: 4,
    nameRu: 'Ангелы и Демоны',
    nameKk: 'Періштелер мен Шайтандар',
    nameEn: 'Angels and Demons',
    theme: {
      accent: '#e2e8f0',
      accentSecondary: '#7c3aed',
      bgFrom: '#080808',
      bgTo: '#100010',
      border: 'rgba(226,232,240,0.20)',
      tabActive: '#e2e8f0',
      iconClass: 'text-slate-200',
      emoji: '😇',
    },
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
    nameRu: 'Лунный камень',
    nameKk: 'Ай Тасы',
    nameEn: 'Moonstone',
    minRating: 0,
    maxRating: 200,
    color: '#9ca3af', // gray-400
    animated: false,
  },
  {
    key: 'mountain_ram',
    nameRu: 'Изумруд',
    nameKk: 'Зумруд',
    nameEn: 'Emerald',
    minRating: 201,
    maxRating: 500,
    color: '#22c55e', // green-500
    animated: false,
  },
  {
    key: 'golden_falcon',
    nameRu: 'Сапфир',
    nameKk: 'Сапфир',
    nameEn: 'Sapphire',
    minRating: 501,
    maxRating: 800,
    color: '#3b82f6', // blue-500
    animated: false,
  },
  {
    key: 'winged_horse',
    nameRu: 'Аметист',
    nameKk: 'Аметист',
    nameEn: 'Amethyst',
    minRating: 801,
    maxRating: 1200,
    color: '#a855f7', // purple-500
    animated: false,
  },
  {
    key: 'sky_eagle',
    nameRu: 'Циркон',
    nameKk: 'Циркон',
    nameEn: 'Zircon',
    minRating: 1201,
    maxRating: 2000,
    color: '#f97316', // orange-500
    animated: false,
  },
  {
    key: 'steppe_khan',
    nameRu: 'Рубин',
    nameKk: 'Рубин',
    nameEn: 'Ruby',
    minRating: 2001,
    maxRating: 4000,
    color: '#ef4444', // red-500
    animated: false,
  },
  {
    key: 'golden_horde_warrior',
    nameRu: 'Янтарь',
    nameKk: 'Янтар',
    nameEn: 'Amber',
    minRating: 4001,
    maxRating: 10000,
    color: '#eab308', // yellow-500 (gold)
    animated: false,
  },
  {
    key: 'great_khan',
    nameRu: 'Обсидиан',
    nameKk: 'Обсидиан',
    nameEn: 'Obsidian',
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

/**
 * Get the reward definition for a specific rank in a specific season.
 * Applies per-season overrides (rankRewardOverrides) on top of SEASON_REWARD_DEFS.
 */
export function getSeasonRewardDefForSeason(rankKey: string, seasonInfo: SeasonInfo): SeasonRewardDef {
  const base = getSeasonRewardDef(rankKey);
  const override = seasonInfo.rankRewardOverrides?.find(o => o.rankKey === rankKey);
  if (!override) return base;
  return {
    ...base,
    ...(override.avatarId !== undefined ? { avatarId: override.avatarId } : {}),
    ...(override.frameId !== undefined ? { frameId: override.frameId } : {}),
  };
}
