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
  /** Season number this avatar belongs to (1–12). Used to hide future season avatars. */
  seasonNumber?: number;
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
    seasonNumber: 6,
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
    seasonNumber: 6,
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
    seasonNumber: 6,
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
    seasonNumber: 7,
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
    seasonNumber: 6,
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
    seasonNumber: 7,
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
    seasonNumber: 7,
  },
  {
    id: 'apocalypse_city',
    name: 'Апокалипсис',
    nameKk: 'Апокалипсис',
    nameEn: 'Apocalypse City',
    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/apocalypse_city_v2-PCAEbAXE4wSCa8FzWXjFSi.webp',
    seasonReward: true,
    seasonRankRequired: 'sky_eagle', // Циркон rank
    seasonNumber: 8,
  },
  {
    id: 'toxic_storm',
    name: 'Токсичная буря',
    nameKk: 'Уытты дауыл',
    nameEn: 'Toxic Storm',
    url: 'toxic_storm', // special: rendered by ToxicStormAvatar component
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/toxic_storm_avatar-cR6SmN4ZtMUEBVktcpwyo9.png',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'steppe_khan', // Ruby rank
    seasonNumber: 8,
  },
  {
    id: 'nuclear_mushroom',
    name: 'Ядерный гриб',
    nameKk: 'Ядролық саңырақ',
    nameEn: 'Nuclear Mushroom',
    url: 'nuclear_mushroom', // special: rendered by NuclearMushroomAvatar component
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/nuclear_mushroom_avatar-XqWr3xsdoLrkX3ZZrjUQTm.webp',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'great_khan', // Obsidian rank (key: great_khan)
    seasonNumber: 8,
  },
  {
    id: 'gasmask_amber',
    name: 'Выживший',
    nameKk: 'Тіршілік иесі',
    nameEn: 'Survivor',
    url: 'gasmask_amber', // special: rendered by GasMaskAvatar component
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/gasmask_avatar-nsq2WhNPXn8BwEayozZWdW.webp',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'golden_horde_warrior', // Amber rank
    seasonNumber: 8,
  },
  {
    id: 'samurai_amber',
    name: 'Самурай',
    nameKk: 'Самурай',
    nameEn: 'Samurai',
    url: 'samurai_amber',
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/samurai_amber_v2-m4pBvqrF6e84KqmZx6QZvq.webp',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'golden_horde_warrior', // Amber rank
    seasonNumber: 9,
  },
  {
    id: 'oni_mask_obsidian',
    name: 'Маска Они',
    nameKk: 'Они Маскасы',
    nameEn: 'Oni Mask',
    url: 'oni_mask_obsidian',
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/oni_mask_obsidian_v3-hJ3tDNhcH7vPq6s95Cuzo4.webp',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'great_khan', // Obsidian rank (key: great_khan)
    seasonNumber: 9,
  },
  {
    id: 'amaterasu_ruby',
    name: 'Аматэрасу',
    nameKk: 'Аматэрасу',
    nameEn: 'Amaterasu',
    url: 'amaterasu_ruby', // special: rendered by AmaterasuAvatar component
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/amaterasu_ruby-Uxg7HYRBpY2EuX7FcdsGRE.webp',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'steppe_khan', // Ruby rank
    seasonNumber: 9,
  },
  {
    id: 'japanese_motifs_zircon',
    name: 'Японский пейзаж',
    nameKk: 'Жапон пейзажы',
    nameEn: 'Japanese Landscape',
    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/japanese_motifs_zircon_v2-FV7CyG9fH7ddeJbNMZU2zQ.webp',
    seasonReward: true,
    seasonRankRequired: 'zircon', // Zircon rank
    seasonNumber: 9,
  },
  // Season 1 — Подводный мир (Zircon)
  {
    id: 'underwater_jellyfish',
    name: 'Медуза бездны',
    nameKk: 'Тереңдік медузасы',
    nameEn: 'Abyss Jellyfish',
    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/zircon_underwater_world-oCe3ChkQWpQrq9YoZjPDnd.webp',
    seasonReward: true,
    seasonRankRequired: 'sky_eagle', // Zircon rank
    seasonNumber: 1,
  },
  // Season 2 — Египетские боги (Zircon)
  {
    id: 'anubis_god',
    name: 'Анубис',
    nameKk: 'Анубис',
    nameEn: 'Anubis',
    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/zircon_egyptian_gods-QgX6A97reWsR5kYtv89KEo.webp',
    seasonReward: true,
    seasonRankRequired: 'sky_eagle', // Zircon rank
    seasonNumber: 2,
  },
  // Season 3 — Пиратские острова (Zircon)
  {
    id: 'pirate_captain',
    name: 'Пиратский капитан',
    nameKk: 'Пират капитаны',
    nameEn: 'Pirate Captain',
    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/zircon_pirate_islands-MazjDWUxFEetXNUmozCPXp.webp',
    seasonReward: true,
    seasonRankRequired: 'sky_eagle', // Zircon rank
    seasonNumber: 3,
  },
  // Season 4 — Скандинавские боги (Zircon)
  {
    id: 'norse_warrior',
    name: 'Скандинавский бог',
    nameKk: 'Скандинавия Құдайы',
    nameEn: 'Norse God',
    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/zircon_norse_gods-7mstNcbdxCWQHP2qZEqVws.webp',
    seasonReward: true,
    seasonRankRequired: 'sky_eagle', // Zircon rank
    seasonNumber: 4,
  },
  // Season 5 — Космическая одиссея (Zircon)
  {
    id: 'space_explorer',
    name: 'Космический странник',
    nameKk: 'Ғарыш саяхатшысы',
    nameEn: 'Space Explorer',
    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/zircon_space_odyssey-m9fwPZ82eoVAaZJjtkHisU.webp',
    seasonReward: true,
    seasonRankRequired: 'sky_eagle', // Zircon rank
    seasonNumber: 5,
  },
  // Season 10 — Киберпанк (Zircon)
  {
    id: 'cyberpunk_warrior',
    name: 'Киберпанк воин',
    nameKk: 'Киберпанк жауынгері',
    nameEn: 'Cyberpunk Warrior',
    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/zircon_cyberpunk-WoVy5sKCJ5JyjptcjACrCB.webp',
    seasonReward: true,
    seasonRankRequired: 'sky_eagle', // Zircon rank
    seasonNumber: 10,
  },
  // Season 11 — Хип-хоп 90-х (Zircon)
  {
    id: 'hiphop_legend',
    name: 'Легенда хип-хопа',
    nameKk: 'Хип-хоп легендасы',
    nameEn: 'Hip-Hop Legend',
    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/zircon_hiphop_90s-fpFrZPKBD9JDsSsTgumemU.webp',
    seasonReward: true,
    seasonRankRequired: 'sky_eagle', // Zircon rank
    seasonNumber: 11,
  },
  // Season 12 — Ангелы и Демоны (Zircon)
  {
    id: 'angel_demon',
    name: 'Ангел и демон',
    nameKk: 'Періште мен шайтан',
    nameEn: 'Angel & Demon',
    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/zircon_angels_demons-awXaXT9p65ykxqqS4S3xJH.webp',
    seasonReward: true,
    seasonRankRequired: 'sky_eagle', // Zircon rank
    seasonNumber: 12,
  },
  // Season 1 — Подводный мир (Ruby / steppe_khan)
  {
    id: 'ruby_underwater_world',
    name: 'Повелитель глубин',
    nameKk: 'Тереңдік билеушісі',
    nameEn: 'Ruler of the Deep',
    url: 'ruby_underwater_world',
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/ruby_underwater_world_83a8b445.png',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'steppe_khan', // Ruby rank
    seasonNumber: 1,
  },
  // Season 2 — Египетские боги (Ruby / steppe_khan)
  {
    id: 'ruby_egyptian_gods',
    name: 'Хранитель пирамид',
    nameKk: 'Пирамида сақшысы',
    nameEn: 'Guardian of Pyramids',
    url: 'ruby_egyptian_gods',
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/ruby_egyptian_gods_52ceb9b8.png',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'steppe_khan', // Ruby rank
    seasonNumber: 2,
  },
  // Season 3 — Пиратские острова (Ruby / steppe_khan)
  {
    id: 'ruby_pirate_islands',
    name: 'Грозный пират',
    nameKk: 'Қорқынышты пират',
    nameEn: 'Fearsome Pirate',
    url: 'ruby_pirate_islands',
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/ruby_pirate_islands_acbbbc77.png',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'steppe_khan', // Ruby rank
    seasonNumber: 3,
  },
  // Season 4 — Скандинавские боги (Ruby / steppe_khan)
  {
    id: 'ruby_norse_gods',
    name: 'Воин Одина',
    nameKk: 'Один жауынгері',
    nameEn: 'Odin\'s Warrior',
    url: 'ruby_norse_gods',
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/ruby_norse_gods_0fa3c331.png',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'steppe_khan', // Ruby rank
    seasonNumber: 4,
  },
  // Season 5 — Космическая одиссея (Ruby / steppe_khan)
  {
    id: 'ruby_space_odyssey',
    name: 'Звёздный страж',
    nameKk: 'Жұлдыз сақшысы',
    nameEn: 'Star Guardian',
    url: 'ruby_space_odyssey',
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/ruby_space_odyssey_f080fce1.png',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'steppe_khan', // Ruby rank
    seasonNumber: 5,
  },
  // Season 10 — Киберпанк (Ruby / steppe_khan)
  {
    id: 'ruby_cyberpunk',
    name: 'Кибер-хакер',
    nameKk: 'Кибер-хакер',
    nameEn: 'Cyber Hacker',
    url: 'ruby_cyberpunk',
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/ruby_cyberpunk_ee56c332.png',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'steppe_khan', // Ruby rank
    seasonNumber: 10,
  },
  // Season 11 — Хип-хоп 90-х (Ruby / steppe_khan)
  {
    id: 'ruby_hiphop_90s',
    name: 'Легенда улиц',
    nameKk: 'Көше легендасы',
    nameEn: 'Street Legend',
    url: 'ruby_hiphop_90s',
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/ruby_hiphop_90s_bde0fc3c.png',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'steppe_khan', // Ruby rank
    seasonNumber: 11,
  },
  // Season 12 — Ангелы и Демоны (Ruby / steppe_khan)
  {
    id: 'ruby_angels_demons',
    name: 'Страж двух миров',
    nameKk: 'Екі дүние сақшысы',
    nameEn: 'Guardian of Two Worlds',
    url: 'ruby_angels_demons',
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/ruby_angels_demons_dc4a2a91.png',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'steppe_khan', // Ruby rank
    seasonNumber: 12,
  },
  // Season 1 — Подводный мир (Amber / golden_horde_warrior)
  {
    id: 'amber_underwater_world',
    name: 'Морской владыка',
    nameKk: 'Теңіз иесі',
    nameEn: 'Sea Lord',
    url: 'amber_underwater_world',
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/amber_underwater_world_v2_0c6b5664.png',
    offsetX: -2.5,
    offsetY: -2.5,
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'golden_horde_warrior', // Amber rank
    seasonNumber: 1,
  },
  // Season 2 — Египетские боги (Amber / golden_horde_warrior)
  {
    id: 'amber_egyptian_gods',
    name: 'Фараон богов',
    nameKk: 'Құдайлар Перғауыны',
    nameEn: 'Pharaoh of Gods',
    url: 'amber_egyptian_gods',
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/amber_egyptian_gods_v2_43e04e99.png',
    offsetX: -2.5,
    offsetY: -2.5,
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'golden_horde_warrior', // Amber rank
    seasonNumber: 2,
  },
  // Season 3 — Пиратские острова (Amber / golden_horde_warrior)
  {
    id: 'amber_pirate_islands',
    name: 'Золотой капитан',
    nameKk: 'Алтын капитан',
    nameEn: 'Golden Captain',
    url: 'amber_pirate_islands',
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/amber_pirate_islands_v2_e0aa3599.png',
    offsetX: -2.5,
    offsetY: -2.5,
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'golden_horde_warrior', // Amber rank
    seasonNumber: 3,
  },
  // Season 4 — Скандинавские боги (Amber / golden_horde_warrior)
  {
    id: 'amber_norse_gods',
    name: 'Повелитель рун',
    nameKk: 'Рун иесі',
    nameEn: 'Rune Master',
    url: 'amber_norse_gods',
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/amber_norse_gods_v2_f21b55c1.png',
    offsetX: -2.5,
    offsetY: -2.5,
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'golden_horde_warrior', // Amber rank
    seasonNumber: 4,
  },
  // Season 5 — Космическая одиссея (Amber / golden_horde_warrior)
  {
    id: 'amber_space_odyssey',
    name: 'Космический командор',
    nameKk: 'Ғарыш командирі',
    nameEn: 'Space Commander',
    url: 'amber_space_odyssey',
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/amber_space_odyssey_v2_adde7dfd.png',
    offsetX: -2.5,
    offsetY: -2.5,
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'golden_horde_warrior', // Amber rank
    seasonNumber: 5,
  },
  // Season 10 — Киберпанк (Amber / golden_horde_warrior)
  {
    id: 'amber_cyberpunk',
    name: 'Кибер-элита',
    nameKk: 'Кибер-элита',
    nameEn: 'Cyber Elite',
    url: 'amber_cyberpunk',
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/amber_cyberpunk_v4-52jR9jKRMgjhsCZXjNstx8.webp',
    offsetX: -2.5,
    offsetY: -2.5,
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'golden_horde_warrior', // Amber rank
    seasonNumber: 10,
  },
  // Season 11 — Хип-хоп 90-х (Amber / golden_horde_warrior)
  {
    id: 'amber_hiphop_90s',
    name: 'Золотой MC',
    nameKk: 'Алтын MC',
    nameEn: 'Golden MC',
    url: 'amber_hiphop_90s',
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/amber_hiphop_90s_v2_5310991c.png',
    offsetX: -2.5,
    offsetY: -2.5,
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'golden_horde_warrior', // Amber rank
    seasonNumber: 11,
  },
  // Season 12 — Ангелы и Демоны (Amber / golden_horde_warrior)
  {
    id: 'amber_angels_demons',
    name: 'Хранитель баланса',
    nameKk: 'Тепе-теңдік сақшысы',
    nameEn: 'Balance Keeper',
    url: 'amber_angels_demons',
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/amber_angels_demons_v2_b882b3bd.png',
    offsetX: -2.5,
    offsetY: -2.5,
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'golden_horde_warrior', // Amber rank
    seasonNumber: 12,
  },

  // ── OBSIDIAN RANK (great_khan) ──────────────────────────────────────────────
  // Season 1 — Подводный мир (Obsidian / great_khan)
  {
    id: 'obsidian_underwater_world',
    name: 'Властелин бездны',
    nameKk: 'Тереңдік билеушісі',
    nameEn: 'Abyss Overlord',
    url: 'obsidian_underwater_world',
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/obsidian_underwater_world-CrTo39hHA3GNH6kCigzNr8.webp',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'great_khan',
    seasonNumber: 1,
    offsetX: -2.5,
    offsetY: -2.5,
  },
  // Season 2 — Египетские боги (Obsidian / great_khan)
  {
    id: 'obsidian_egyptian_gods',
    name: 'Анубис Тьмы',
    nameKk: 'Қараңғылық Анубисі',
    nameEn: 'Anubis of Darkness',
    url: 'obsidian_egyptian_gods',
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/obsidian_egyptian_gods-HwZuAJipid5wMPLwE9jfDN.webp',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'great_khan',
    seasonNumber: 2,
    offsetX: -2.5,
    offsetY: -2.5,
  },
  // Season 3 — Пиратские острова (Obsidian / great_khan)
  {
    id: 'obsidian_pirate_islands',
    name: 'Адмирал призраков',
    nameKk: 'Елестер адмиралы',
    nameEn: 'Ghost Admiral',
    url: 'obsidian_pirate_islands',
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/obsidian_pirate_islands-m7mqMLNNUB3WiggJMsPgQ7.webp',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'great_khan',
    seasonNumber: 3,
    offsetX: -2.5,
    offsetY: -2.5,
  },
  // Season 4 — Скандинавские боги (Obsidian / great_khan)
  {
    id: 'obsidian_norse_gods',
    name: 'Один Тьмы',
    nameKk: 'Қараңғылық Одині',
    nameEn: 'Odin of Darkness',
    url: 'obsidian_norse_gods',
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/obsidian_norse_gods-cZ2YKE5bVYuvdXd4WuLkfw.webp',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'great_khan',
    seasonNumber: 4,
    offsetX: -2.5,
    offsetY: -2.5,
  },
  // Season 5 — Космическая одиссея (Obsidian / great_khan)
  {
    id: 'obsidian_space_odyssey',
    name: 'Повелитель пустоты',
    nameKk: 'Бостықтың билеушісі',
    nameEn: 'Void Emperor',
    url: 'obsidian_space_odyssey',
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/obsidian_space_odyssey-7gENsHLXLmZaeUU6EcPbyv.webp',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'great_khan',
    seasonNumber: 5,
    offsetX: -2.5,
    offsetY: -2.5,
  },
  // Season 10 — Киберпанк (Obsidian / great_khan)
  {
    id: 'obsidian_cyberpunk',
    name: 'Повелитель пустоты сети',
    nameKk: 'Желі бостығының билеушісі',
    nameEn: 'Netrunner Overlord',
    url: 'obsidian_cyberpunk',
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/obsidian_cyberpunk-F42HmWbza98ZbqBggYVNNt.webp',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'great_khan',
    seasonNumber: 10,
    offsetX: -2.5,
    offsetY: -2.5,
  },
  // Season 11 — Хип-хоп 90-х (Obsidian / great_khan)
  {
    id: 'obsidian_hiphop_90s',
    name: 'Тёмный MC',
    nameKk: 'Қараңғы MC',
    nameEn: 'Shadow MC',
    url: 'obsidian_hiphop_90s',
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/obsidian_hiphop_90s-Rx5QAgMC5akbKfSPh2UYkY.webp',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'great_khan',
    seasonNumber: 11,
    offsetX: -2.5,
    offsetY: -2.5,
  },
  // Season 12 — Ангелы и Демоны (Obsidian / great_khan)
  {
    id: 'obsidian_angels_demons',
    name: 'Верховный арбитр',
    nameKk: 'Жоғарғы төреші',
    nameEn: 'Supreme Arbiter',
    url: 'obsidian_angels_demons',
    previewUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/obsidian_angels_demons-Jb4TqRyJ4bRGFfWdknwUSR.webp',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'great_khan',
    seasonNumber: 12,
    offsetX: -2.5,
    offsetY: -2.5,
  },

  // ── RUBY RANK (steppe_khan) — Seasons 6–9 ─────────────────────────────────
  // Season 6 — Казахский колорит (Ruby)
  {
    id: 'ruby_kazakh',
    name: 'Степной рубин',
    nameKk: 'Дала рубині',
    nameEn: 'Steppe Ruby',
    url: 'ruby_kazakh',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'steppe_khan',
    seasonNumber: 6,
    offsetX: -2.5,
    offsetY: -2.5,
  },
  // Season 7 — Неоновая эра (Ruby)
  {
    id: 'ruby_neon_era',
    name: 'Неоновый рубин',
    nameKk: 'Неон рубині',
    nameEn: 'Neon Ruby',
    url: 'ruby_neon_era',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'steppe_khan',
    seasonNumber: 7,
    offsetX: -2.5,
    offsetY: -2.5,
  },
  // Season 8 — Апокалипсис (Ruby)
  {
    id: 'ruby_apocalypse',
    name: 'Рубин апокалипсиса',
    nameKk: 'Апокалипсис рубині',
    nameEn: 'Apocalypse Ruby',
    url: 'ruby_apocalypse',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'steppe_khan',
    seasonNumber: 8,
    offsetX: -2.5,
    offsetY: -2.5,
  },
  // Season 9 — Японские мотивы (Ruby)
  {
    id: 'ruby_japanese',
    name: 'Рубин сакуры',
    nameKk: 'Сакура рубині',
    nameEn: 'Sakura Ruby',
    url: 'ruby_japanese',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'steppe_khan',
    seasonNumber: 9,
    offsetX: -2.5,
    offsetY: -2.5,
  },

  // ── AMBER RANK (golden_horde_warrior) — Seasons 6–9 ──────────────────────────
  // Season 6 — Казахский колорит (Amber)
  {
    id: 'amber_kazakh',
    name: 'Степной янтарь',
    nameKk: 'Дала янтары',
    nameEn: 'Steppe Amber',
    url: 'amber_kazakh',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'golden_horde_warrior',
    seasonNumber: 6,
    offsetX: -2.5,
    offsetY: -2.5,
  },
  // Season 7 — Неоновая эра (Amber)
  {
    id: 'amber_neon_era',
    name: 'Неоновый янтарь',
    nameKk: 'Неон янтары',
    nameEn: 'Neon Amber',
    url: 'amber_neon_era',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'golden_horde_warrior',
    seasonNumber: 7,
    offsetX: -2.5,
    offsetY: -2.5,
  },
  // Season 8 — Апокалипсис (Amber)
  {
    id: 'amber_apocalypse',
    name: 'Янтарь апокалипсиса',
    nameKk: 'Апокалипсис янтары',
    nameEn: 'Apocalypse Amber',
    url: 'amber_apocalypse',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'golden_horde_warrior',
    seasonNumber: 8,
    offsetX: -2.5,
    offsetY: -2.5,
  },
  // Season 9 — Японские мотивы (Amber)
  {
    id: 'amber_japanese',
    name: 'Янтарь сакуры',
    nameKk: 'Сакура янтары',
    nameEn: 'Sakura Amber',
    url: 'amber_japanese',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'golden_horde_warrior',
    seasonNumber: 9,
    offsetX: -2.5,
    offsetY: -2.5,
  },

  // ── OBSIDIAN RANK (great_khan) — Seasons 6–9 ─────────────────────────────────
  // Season 6 — Казахский колорит (Obsidian)
  {
    id: 'obsidian_kazakh',
    name: 'Степной обсидиан',
    nameKk: 'Дала обсидианы',
    nameEn: 'Steppe Obsidian',
    url: 'obsidian_kazakh',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'great_khan',
    seasonNumber: 6,
    offsetX: -2.5,
    offsetY: -2.5,
  },
  // Season 7 — Неоновая эра (Obsidian)
  {
    id: 'obsidian_neon_era',
    name: 'Неоновый обсидиан',
    nameKk: 'Неон обсидианы',
    nameEn: 'Neon Obsidian',
    url: 'obsidian_neon_era',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'great_khan',
    seasonNumber: 7,
    offsetX: -2.5,
    offsetY: -2.5,
  },
  // Season 8 — Апокалипсис (Obsidian)
  {
    id: 'obsidian_apocalypse',
    name: 'Обсидиан апокалипсиса',
    nameKk: 'Апокалипсис обсидианы',
    nameEn: 'Apocalypse Obsidian',
    url: 'obsidian_apocalypse',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'great_khan',
    seasonNumber: 8,
    offsetX: -2.5,
    offsetY: -2.5,
  },
  // Season 9 — Японские мотивы (Obsidian)
  {
    id: 'obsidian_japanese',
    name: 'Обсидиан сакуры',
    nameKk: 'Сакура обсидианы',
    nameEn: 'Sakura Obsidian',
    url: 'obsidian_japanese',
    animated: true,
    seasonReward: true,
    seasonRankRequired: 'great_khan',
    seasonNumber: 9,
    offsetX: -2.5,
    offsetY: -2.5,
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
    seasonNumber: 7,
    offsetX: -2.5,
    offsetY: -3,
    imgScale: 0.55,
  },
];

export const DEFAULT_AVATAR_ID = 'wolf';

// Bot-only avatar ID (players cannot select this)
export const BOT_AVATAR_ID = 'bot';

/** Animated avatar IDs that use SVG+CSS components instead of img tags */
export const ANIMATED_AVATAR_IDS = ['khan', 'golden_horde', 'diving_eagle', 'great_khan', 'neon_paw', 'neon_dino', 'neon_cat', 'neon_crown', 'toxic_storm', 'gasmask_amber', 'nuclear_mushroom', 'amaterasu_ruby', 'samurai_amber', 'oni_mask_obsidian', 'ruby_kazakh', 'ruby_neon_era', 'ruby_apocalypse', 'ruby_japanese', 'amber_kazakh', 'amber_neon_era', 'amber_apocalypse', 'amber_japanese', 'obsidian_kazakh', 'obsidian_neon_era', 'obsidian_apocalypse', 'obsidian_japanese'] as const;
export type AnimatedAvatarId = typeof ANIMATED_AVATAR_IDS[number];

export function isCanvasAvatar(avatarId: string | null | undefined): boolean {
  return ANIMATED_AVATAR_IDS.includes(getBaseAvatarId(avatarId) as AnimatedAvatarId);
}

export function getAvatarUrl(avatarId: string | null | undefined): string {
  const baseId = getBaseAvatarId(avatarId);
  const found = AVATAR_OPTIONS.find(a => a.id === baseId);
  // Season reward avatars that use a special animated component (url is a component key, not a real URL)
  // return wolf as fallback. Static season reward avatars (url starts with http) return their real URL.
  if (found?.seasonReward && found.url && !found.url.startsWith('http')) {
    return AVATAR_OPTIONS.find(a => a.id === 'wolf')?.url || AVATAR_OPTIONS[0].url;
  }
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
    case 'toxic_storm':
      return { borderColor: '#39ff14', shadowColor: 'rgba(57,255,20,0.4)', bgClass: 'rgba(57,255,20,0.08)', borderClass: 'border-green-400/50', textClass: 'text-green-300', hoverClass: 'hover:bg-green-500/10' };
    case 'gasmask_amber':
      return { borderColor: '#f59e0b', shadowColor: 'rgba(245,158,11,0.5)', bgClass: 'rgba(245,158,11,0.10)', borderClass: 'border-amber-500/60', textClass: 'text-amber-300', hoverClass: 'hover:bg-amber-500/10' };
    case 'nuclear_mushroom':
      return { borderColor: '#ff4500', shadowColor: 'rgba(255,69,0,0.6)', bgClass: 'rgba(255,69,0,0.10)', borderClass: 'border-orange-600/60', textClass: 'text-orange-400', hoverClass: 'hover:bg-orange-600/10' };
    case 'samurai_amber':
      return { borderColor: '#CC0000', shadowColor: 'rgba(200,0,0,0.5)', bgClass: 'rgba(200,0,0,0.08)', borderClass: 'border-red-600/60', textClass: 'text-red-300', hoverClass: 'hover:bg-red-600/10' };
    case 'oni_mask_obsidian':
      return { borderColor: '#D4AF37', shadowColor: 'rgba(212,175,55,0.6)', bgClass: 'rgba(212,175,55,0.08)', borderClass: 'border-yellow-600/60', textClass: 'text-yellow-400', hoverClass: 'hover:bg-yellow-600/10' };
    case 'amaterasu_ruby':
      return { borderColor: '#FF6B00', shadowColor: 'rgba(255,107,0,0.5)', bgClass: 'rgba(255,107,0,0.08)', borderClass: 'border-orange-500/60', textClass: 'text-orange-300', hoverClass: 'hover:bg-orange-500/10' };
    case 'japanese_motifs_zircon':
      return { borderColor: '#cc0000', shadowColor: 'rgba(204,0,0,0.4)', bgClass: 'rgba(204,0,0,0.06)', borderClass: 'border-red-600/50', textClass: 'text-red-300', hoverClass: 'hover:bg-red-600/10' };
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
