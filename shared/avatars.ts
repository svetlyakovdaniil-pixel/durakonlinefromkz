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
    name: 'Хан Степи',
    nameKk: 'Дала Ханы',
    nameEn: 'Steppe Khan',
    url: 'khan', // special: rendered by KhanAvatar component
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'steppe_khan', // rank ID from SEASON_RANKS
  },
  {
    id: 'golden_horde',
    name: 'Золотая Орда',
    nameKk: 'Алтын Орда',
    nameEn: 'Golden Horde',
    url: 'golden_horde', // special: rendered by GoldenHordeAvatar component
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'golden_horde_warrior', // rank ID from SEASON_RANKS
  },
  {
    id: 'diving_eagle',
    name: 'Небесный Орёл',
    nameKk: 'Аспан Бүркіт',
    nameEn: 'Sky Eagle',
    url: 'diving_eagle', // special: rendered by DivingEagleAvatar component
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'sky_eagle', // rank ID from SEASON_RANKS
  },
  {
    id: 'great_khan',
    name: 'Великий Хан',
    nameKk: 'Ұлы Хан',
    nameEn: 'Great Khan',
    url: 'great_khan', // special: rendered by GreatKhanAvatar component
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'great_khan', // rank ID from SEASON_RANKS
  },
];

export const DEFAULT_AVATAR_ID = 'wolf';

// Bot-only avatar ID (players cannot select this)
export const BOT_AVATAR_ID = 'bot';

/** Animated avatar IDs that use SVG+CSS components instead of img tags */
export const ANIMATED_AVATAR_IDS = ['khan', 'golden_horde', 'diving_eagle', 'great_khan'] as const;
export type AnimatedAvatarId = typeof ANIMATED_AVATAR_IDS[number];

export function isCanvasAvatar(avatarId: string | null | undefined): boolean {
  return ANIMATED_AVATAR_IDS.includes(avatarId as AnimatedAvatarId);
}

export function getAvatarUrl(avatarId: string | null | undefined): string {
  const found = AVATAR_OPTIONS.find(a => a.id === avatarId);
  // Season reward avatars use a special component, not a URL
  if (found?.seasonReward) return AVATAR_OPTIONS.find(a => a.id === 'wolf')?.url || AVATAR_OPTIONS[0].url;
  return found?.url || AVATAR_OPTIONS[0].url;
}

/** Check if an avatar ID corresponds to an animated avatar */
export function isAnimatedAvatar(avatarId: string | null | undefined): boolean {
  const found = AVATAR_OPTIONS.find(a => a.id === avatarId);
  return found?.animated === true;
}

/** Get the avatar option object by ID */
export function getAvatarOption(avatarId: string | null | undefined): AvatarOption | undefined {
  return AVATAR_OPTIONS.find(a => a.id === avatarId);
}
