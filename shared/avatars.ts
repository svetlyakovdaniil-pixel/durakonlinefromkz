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
  /** Whether this is an animated avatar (GIF) */
  animated?: boolean;
  price?: number;
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
];

export const DEFAULT_AVATAR_ID = 'wolf';

// Bot-only avatar ID (players cannot select this)
export const BOT_AVATAR_ID = 'bot';

export function getAvatarUrl(avatarId: string | null | undefined): string {
  const found = AVATAR_OPTIONS.find(a => a.id === avatarId);
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
