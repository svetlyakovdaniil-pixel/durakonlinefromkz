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
    seasonRankRequired: 'winged_horse', // rank ID — Ruby rank in Season 7 (Neon Era)
  },
];

export const DEFAULT_AVATAR_ID = 'wolf';

// Bot-only avatar ID (players cannot select this)
export const BOT_AVATAR_ID = 'bot';

/** Animated avatar IDs that use SVG+CSS components instead of img tags */
export const ANIMATED_AVATAR_IDS = ['khan', 'golden_horde', 'diving_eagle', 'great_khan', 'neon_paw', 'neon_dino'] as const;
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
