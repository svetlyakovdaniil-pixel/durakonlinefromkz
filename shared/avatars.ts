// Preset avatar options for player profiles
export interface AvatarOption {
  id: string;
  name: string;
  /** Display name in Kazakh */
  nameKk?: string;
  /** Display name in English */
  nameEn?: string;
  url: string;
  /** Static preview image for shop display (used for animated avatars) */
  previewUrl?: string;
  premium?: boolean;
  /** Whether this is an animated avatar (GIF or Canvas) */
  animated?: boolean;
  price?: number;
  /** Season reward avatar — not for sale, unlocked by finishing season at required rank */
  seasonReward?: boolean;
  /** Minimum season rank ID required to unlock this avatar */
  seasonRankRequired?: string;
  /** Image position offset X in percent (-50 to 50), default 0 */
  offsetX?: number;
  /** Image position offset Y in percent (-50 to 50), default 0 */
  offsetY?: number;
  /** Image scale multiplier (0.5 to 2.0), default 1 */
  imgScale?: number;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: 'bot',
    name: 'Робот (Бот)',
    nameEn: 'Robot (Bot)',
    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/bot_avatar-bkCC7RwD3DYoJiFYZiby6m.webp',
  },
  {
    id: 'wolf',
    name: 'Волк',
    nameEn: 'Wolf',
    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/avatar-wolf-fJ9SNhipdz6heHu7Au5XVp.webp',
  },
  {
    id: 'eagle',
    name: 'Орёл',
    nameEn: 'Eagle',
    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/avatar-eagle-KxvbVg3oAviwrdXzEpvXdT.webp',
  },
  {
    id: 'bear',
    name: 'Медведь',
    nameEn: 'Bear',
    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/avatar-bear-ggTgCeFCLsPRpzpWmUe6og.webp',
  },
  {
    id: 'fox',
    name: 'Лиса',
    nameEn: 'Fox',
    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/avatar-fox-A7ZAaomsUx9cfjYNNWxFw7.webp',
  },
  {
    id: 'snow-leopard',
    name: 'Барс',
    nameEn: 'Snow Leopard',
    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/avatar-snow-leopard-UGXKzhokntwzXvBoUdi5Lq.webp',
  },
  {
    id: 'nexus_bunny',
    name: 'Nexus Bunny',
    nameEn: 'Nexus Bunny',
    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/nexus_bunny_avatar-JL5A5iF6tsP42JWaLwG3Uf.webp',
    premium: true,
    price: 250,
  },
  {
    id: 'goose_animated',
    name: 'Весёлый гусь',
    nameKk: 'Көңілді қаз',
    nameEn: 'Happy Goose',
    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/goose_new_8597b7f9.png',
    premium: true,
    price: 100,
  },
  {
    id: 'khan',
    name: 'Рубин',
    nameKk: 'Рубин',
    nameEn: 'Ruby',
    url: 'khan', // special: rendered by KhanAvatar component
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'steppe_khan', // rank ID from SEASON_RANKS
  },
  {
    id: 'golden_horde',
    name: 'Янтарь',
    nameKk: 'Янтар',
    nameEn: 'Amber',
    url: 'golden_horde', // special: rendered by GoldenHordeAvatar component
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'golden_horde_warrior', // rank ID from SEASON_RANKS
  },
  {
    id: 'diving_eagle',
    name: 'Циркон',
    nameKk: 'Циркон',
    nameEn: 'Zircon',
    url: 'diving_eagle', // special: rendered by DivingEagleAvatar component
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'sky_eagle', // rank ID from SEASON_RANKS
  },
  {
    id: 'neon_paw',
    name: 'Неоновая лапа',
    nameKk: 'Неон Табан',
    nameEn: 'Neon Paw',
    url: 'neon_paw', // special: rendered by NeonPawAvatar component
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/neon_paw_v2-J7ntbHJYh3mwfqGttW7nfX.webp',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'sky_eagle', // rank ID — Zircon rank in Season 7 (Neon Era)
  },
  {
    id: 'great_khan',
    name: 'Обсидиан',
    nameKk: 'Обсидиан',
    nameEn: 'Obsidian',
    url: 'great_khan', // special: rendered by GreatKhanAvatar component
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'great_khan', // rank ID from SEASON_RANKS
  },
  {
    id: 'neon_dino',
    name: 'Неоновый динозавр',
    nameKk: 'Неон Динозавр',
    nameEn: 'Neon Dino',
    url: 'neon_dino', // special: rendered by NeonDinoAvatar component
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/neon_dino_ruby-e5c5vvCmCmU37AgnHKyEXM.webp',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'steppe_khan', // rank ID — Ruby rank in Season 7 (Neon Era)
  },
  {
    id: 'neon_cat',
    name: 'Неоновый кот',
    nameKk: 'Неон Мысық',
    nameEn: 'Neon Cat',
    url: 'neon_cat', // special: rendered by NeonCatAvatar component
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/neon_cat_amber_v2-G4HW9sWsBNkEHaW35YPvxs.webp',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'golden_horde_warrior', // rank ID — Amber rank in Season 7 (Neon Era)
  },
  {
    id: 'apocalypse_city',
    name: 'Апокалипсис',
    nameKk: 'Апокалипсис',
    nameEn: 'Apocalypse City',
    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/apocalypse_city_avatar-Yo5n7ytzZLCNyJ8DJfaDt9.webp',
    seasonReward: true,
    seasonRankRequired: 'sky_eagle', // Циркон rank
  },
  {
    id: 'neon_crown',
    name: 'Неоновая корона',
    nameKk: 'Неон Таж',
    nameEn: 'Neon Crown',
    url: 'neon_crown',
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/neon_crown_obsidian-3s7gu4bnxW94srxC2sGYmd.webp',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'great_khan',
    offsetX: -2.5,
    offsetY: -3,
    imgScale: 0.55,
  },
];

export const DEFAULT_AVATAR_ID = 'wolf';

// Bot-only avatar ID (players cannot select this)
export const BOT_AVATAR_ID = 'bot';

/** Animated avatar IDs that use SVG+CSS components instead of img tags */
export const ANIMATED_AVATAR_IDS = ['khan', 'golden_horde', 'diving_eagle', 'great_khan', 'neon_paw', 'neon_dino', 'neon_cat', 'neon_crown'] as const;
export type AnimatedAvatarId = typeof ANIMATED_AVATAR_IDS[number];

export function isCanvasAvatar(avatarId: string | null | undefined): boolean {
  return ANIMATED_AVATAR_IDS.includes(getBaseAvatarId(avatarId) as AnimatedAvatarId);
}

export function getAvatarUrl(avatarId: string | null | undefined): string {
  const baseId = getBaseAvatarId(avatarId);
  const found = AVATAR_OPTIONS.find(a => a.id === baseId);
  // Season reward avatars use a special component, not a URL
  if (found?.seasonReward) return AVATAR_OPTIONS.find(a => a.id === 'wolf')?.url || AVATAR_OPTIONS[0].url;
  return found?.url || AVATAR_OPTIONS[0].url;
}

/** Check if an avatar ID corresponds to an animated avatar */
export function isAnimatedAvatar(avatarId: string | null | undefined): boolean {
  const baseId = getBaseAvatarId(avatarId);
  const found = AVATAR_OPTIONS.find(a => a.id === baseId);
  return found?.animated === true;
}

/** Get the avatar option object by ID (supports season-suffixed IDs) */
export function getAvatarOption(avatarId: string | null | undefined): AvatarOption | undefined {
  if (!avatarId) return undefined;
  // Try exact match first (base ID)
  const exact = AVATAR_OPTIONS.find(a => a.id === avatarId);
  if (exact) return exact;
  // Try base ID (strip season suffix)
  const baseId = getBaseAvatarId(avatarId);
  return AVATAR_OPTIONS.find(a => a.id === baseId);
}

// ─── Per-season avatar ID utilities ──────────────────────────────────────────

/**
 * Season suffix separator. Season key "2026-Q2" → suffix "2026Q2" (no dash).
 * Full avatar ID example: "diving_eagle_2026Q2", "neon_paw_2026Q3"
 */
const SEASON_SUFFIX_SEP = '_';

/**
 * Convert a season key "YYYY-QN" to a compact suffix "YYYYQN".
 * Example: "2026-Q2" → "2026Q2"
 */
export function seasonKeyToSuffix(seasonKey: string): string {
  return seasonKey.replace('-', '');
}

/**
 * Build a per-season avatar ID from a base avatar ID and a season key.
 * Example: getSeasonAvatarId('diving_eagle', '2026-Q2') → 'diving_eagle_2026Q2'
 * Example: getSeasonAvatarId('neon_paw', '2026-Q3') → 'neon_paw_2026Q3'
 */
export function getSeasonAvatarId(baseAvatarId: string, seasonKey: string): string {
  return `${baseAvatarId}${SEASON_SUFFIX_SEP}${seasonKeyToSuffix(seasonKey)}`;
}

/**
 * Extract the base avatar ID from a potentially season-suffixed ID.
 * Strips the season suffix (e.g. "_2026Q2") if present.
 * Example: getBaseAvatarId('diving_eagle_2026Q2') → 'diving_eagle'
 * Example: getBaseAvatarId('neon_paw_2026Q3') → 'neon_paw'
 * Example: getBaseAvatarId('wolf') → 'wolf' (no suffix)
 * Example: getBaseAvatarId(null) → 'wolf' (default)
 */
export function getBaseAvatarId(avatarId: string | null | undefined): string {
  if (!avatarId) return DEFAULT_AVATAR_ID;
  // Season suffix pattern: _YYYYQN (e.g. _2026Q2, _2025Q1)
  const match = avatarId.match(/^(.+)_(\d{4}Q[1-4])$/);
  if (match) return match[1];
  return avatarId;
}

/**
 * Get accent colors for an avatar (for UI theming in Season page, etc.).
 * Returns border color, shadow color, and Tailwind accent classes.
 */
export function getAvatarAccentColors(avatarId: string | null | undefined): {
  borderColor: string;
  shadowColor: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  hoverClass: string;
} {
  const baseId = getBaseAvatarId(avatarId);
  switch (baseId) {
    case 'khan':
      return { borderColor: '#f97316', shadowColor: 'rgba(249,115,22,0.3)', bgClass: 'rgba(251,146,60,0.06)', borderClass: 'border-orange-500/50', textClass: 'text-orange-300', hoverClass: 'hover:bg-orange-500/10' };
    case 'golden_horde':
      return { borderColor: '#eab308', shadowColor: 'rgba(234,179,8,0.3)', bgClass: 'rgba(234,179,8,0.06)', borderClass: 'border-yellow-500/50', textClass: 'text-yellow-300', hoverClass: 'hover:bg-yellow-500/10' };
    case 'great_khan':
      return { borderColor: '#b8860b', shadowColor: 'rgba(184,134,11,0.4)', bgClass: 'rgba(184,134,11,0.08)', borderClass: 'border-yellow-600/60', textClass: 'text-yellow-300', hoverClass: 'hover:bg-yellow-900/20' };
    case 'neon_paw':
      return { borderColor: '#a855f7', shadowColor: 'rgba(168,85,247,0.4)', bgClass: 'rgba(168,85,247,0.08)', borderClass: 'border-purple-500/50', textClass: 'text-purple-300', hoverClass: 'hover:bg-purple-500/10' };
    case 'neon_dino':
      return { borderColor: '#ff00c8', shadowColor: 'rgba(255,0,200,0.4)', bgClass: 'rgba(255,0,200,0.08)', borderClass: 'border-pink-500/50', textClass: 'text-pink-300', hoverClass: 'hover:bg-pink-500/10' };
    case 'neon_cat':
      return { borderColor: '#ff6600', shadowColor: 'rgba(255,120,0,0.4)', bgClass: 'rgba(255,120,0,0.08)', borderClass: 'border-orange-500/50', textClass: 'text-orange-300', hoverClass: 'hover:bg-orange-500/10' };
    case 'neon_crown':
      return { borderColor: '#00dcff', shadowColor: 'rgba(0,220,255,0.4)', bgClass: 'rgba(0,220,255,0.08)', borderClass: 'border-cyan-400/50', textClass: 'text-cyan-300', hoverClass: 'hover:bg-cyan-500/10' };
    case 'apocalypse_city':
      return { borderColor: '#ef4444', shadowColor: 'rgba(239,68,68,0.4)', bgClass: 'rgba(239,68,68,0.08)', borderClass: 'border-red-500/50', textClass: 'text-red-300', hoverClass: 'hover:bg-red-500/10' };
    case 'diving_eagle':
    case 'sky_eagle':
      return { borderColor: '#f97316', shadowColor: 'rgba(249,115,22,0.3)', bgClass: 'rgba(249,115,22,0.06)', borderClass: 'border-orange-500/50', textClass: 'text-orange-300', hoverClass: 'hover:bg-orange-500/10' };
    default:
      return { borderColor: '#f59e0b', shadowColor: 'rgba(245,158,11,0.3)', bgClass: 'rgba(251,191,36,0.06)', borderClass: 'border-amber-500/50', textClass: 'text-amber-300', hoverClass: 'hover:bg-amber-500/10' };
  }
}

/**
 * Check if an avatar ID is a per-season variant (has season suffix).
 * Example: isSeasonSuffixedAvatar('diving_eagle_2026Q2') → true
 * Example: isSeasonSuffixedAvatar('wolf') → false
 */
export function isSeasonSuffixedAvatar(avatarId: string | null | undefined): boolean {
  if (!avatarId) return false;
  return /^.+_\d{4}Q[1-4]$/.test(avatarId);
}

/**
 * Get a human-readable display name for an avatar, including season suffix if present.
 * Example: getAvatarDisplayName('neon_paw_2026Q3', 'ru') → 'Неоновая лапа Season 7'
 * Requires seasonInfo to be passed for the season number.
 */
export function getAvatarDisplayName(
  avatarId: string | null | undefined,
  locale: 'ru' | 'kk' | 'en',
  seasonNumber?: number,
): string {
  if (!avatarId) return '';
  const baseId = getBaseAvatarId(avatarId);
  const opt = AVATAR_OPTIONS.find(a => a.id === baseId);
  let name = '';
  if (opt) {
    name = locale === 'kk' ? (opt.nameKk ?? opt.name) : locale === 'en' ? (opt.nameEn ?? opt.name) : opt.name;
  } else {
    name = baseId;
  }
  if (isSeasonSuffixedAvatar(avatarId) && seasonNumber !== undefined) {
    name += ` Season ${seasonNumber}`;
  }
  return name;
}
