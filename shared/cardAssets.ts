// Card image CDN URLs for all face cards, aces, specials
export const CARD_IMAGES: Record<string, string> = {
  'K-spades':   '/assets/cards/king_spades_batyr_78c9c564_1b2370cd.webp',
  'K-hearts':   '/assets/cards/king_hearts_batyr_v2_c3155002_42eedeb4.webp',
  'K-diamonds': '/assets/cards/king_diamonds_batyr_v2_58b932e2_570cad37.webp',
  'K-clubs':    '/assets/cards/king_clubs_batyr_v2_42b6c3f2_5f91c718.webp',
  'Q-spades':   '/assets/cards/queen_spades_batyr_v2_96732a86_a97adfb4.webp',
  'Q-hearts':   '/assets/cards/queen_hearts_batyr_v2_76f970ba_03c17fe4.webp',
  'Q-diamonds': '/assets/cards/queen_diamonds_batyr_v2_96b1337e_97ac9747.webp',
  'Q-clubs':    '/assets/cards/queen_clubs_batyr_v2_b3ca7ee9_7163be10.webp',
  'J-spades':   '/assets/cards/jack_spades_batyr_v2_87356e9c_1ee16b9d.webp',
  'J-hearts':   '/assets/cards/jack_hearts_batyr_v2_baf92fb7_41d21725.webp',
  'J-diamonds': '/assets/cards/jack_diamonds_batyr_v2_14f1a706_c2e61fb1.webp',
  'J-clubs':    '/assets/cards/jack_clubs_batyr_v2_bab9b3cf_e2813334.webp',
  'A-spades':   '/assets/cards/ace_spades_batyr_v2_79316376_fe1e9d17.webp',
  'A-hearts':   '/assets/cards/ace_hearts_batyr_v2_32b73b45_64a53aa4.webp',
  'A-diamonds': '/assets/cards/ace_diamonds_batyr_v2_8a564d82_f04aaf84.webp',
  'A-clubs':    '/assets/cards/ace_clubs_batyr_11b7c939_b43b3ca1.webp',
  '6-spades':   '/assets/cards/six_spades_batyr_71aa2b41_99c45dd8.webp',
  '6-hearts':   '/assets/cards/six_hearts_batyr_46cec60c_135623af.webp',
  '6-diamonds': '/assets/cards/six_diamonds_batyr_8a5da4e6_32cfebcf.webp',
  '6-clubs':    '/assets/cards/six_clubs_batyr_8b569939_bbefb79b.webp',
  '7-spades':   '/assets/cards/seven_spades_batyr_6482695f_35b5225d.webp',
  '7-hearts':   '/assets/cards/seven_hearts_batyr_abecf834_8a292a8b.webp',
  '7-diamonds': '/assets/cards/seven_diamonds_batyr_6e56edaa_a6977904.webp',
  '7-clubs':    '/assets/cards/seven_clubs_batyr_c02d8c46_add478b2.webp',
  '8-spades':   '/assets/cards/eight_spades_batyr_ca32183c_c04d8b02.webp',
  '8-hearts':   '/assets/cards/eight_hearts_batyr_dda206ca_197761d6.webp',
  '8-diamonds': '/assets/cards/eight_diamonds_batyr_12f2b438_5935b71f.webp',
  '8-clubs':    '/assets/cards/eight_clubs_batyr_d5cb78a9_0b42d929.webp',
  '9-spades':   '/assets/cards/nine_spades_batyr_d9836dea_32caf552.webp',
  '9-hearts':   '/assets/cards/nine_hearts_batyr_9497c114_f2d9e5bc.webp',
  '9-diamonds': '/assets/cards/nine_diamonds_batyr_2e9f5185_4f548b4e.webp',
  '9-clubs':    '/assets/cards/nine_clubs_batyr_aac27927_5bacbfd0.webp',
  '10-spades':  '/assets/cards/ten_spades_batyr_v4_056053c0_1ea65c1c.webp',
  '10-hearts':  '/assets/cards/ten_hearts_batyr_v6_e35bafe3_6580e7e0.webp',
  '10-diamonds':'/assets/cards/ten_diamonds_batyr_v6_8c90ef70_55b854ef.webp',
  '10-clubs':   '/assets/cards/ten_clubs_batyr_v5_8d520041_06f4a256.webp',
  '777':        '/assets/cards/joker_777_batyr_v2_2c59f1ad_a196b309.webp',
};

// Deck 2 (custom) — "Товарищ Мырза" — all 36 cards have images
export const CARD_IMAGES_CUSTOM: Record<string, string> = {
  '6-diamonds': '/assets/cards/6_diamonds_ad2767e9_b94edf04.webp',
  '6-clubs':    '/assets/cards/6_clubs_0ddfbd72_913618d9.webp',
  '6-spades':   '/assets/cards/6_spades_a5e66aa5_4ea5221b.webp',
  '6-hearts':   '/assets/cards/6_hearts_c788e629_f15d9128.webp',
  '7-diamonds': '/assets/cards/7_diamonds_bd386fe2_3e94167e.webp',
  '7-clubs':    '/assets/cards/7_clubs_35ebf9d6_6711405c.webp',
  '7-spades':   '/assets/cards/7_spades_8726d725_5630cb15.webp',
  '7-hearts':   '/assets/cards/7_hearts_6eca967e_9b509372.webp',
  '8-diamonds': '/assets/cards/8_diamonds_06844441_b0dc3f1b.webp',
  '8-clubs':    '/assets/cards/8_clubs_697e7dd4_3228b8f6.webp',
  '8-spades':   '/assets/cards/8_spades_369be7af_313bd7f1.webp',
  '8-hearts':   '/assets/cards/8_hearts_eca9d1b3_3f81c16c.webp',
  '9-diamonds': '/assets/cards/9_diamonds_4e6a4a6f_dcd35f4b.webp',
  '9-clubs':    '/assets/cards/9_clubs_b6e7c97b_9ae26de1.webp',
  '9-spades':   '/assets/cards/9_spades_79ac5272_f0e579c9.webp',
  '9-hearts':   '/assets/cards/9_hearts_76fc201c_f201b8a4.webp',
  '10-diamonds':'/assets/cards/10_diamonds_f2b92276_6dc7ae95.webp',
  '10-clubs':   '/assets/cards/10_clubs_543e49e3_6d100286.webp',
  '10-spades':  '/assets/cards/10_spades_fd8cb013_cb7c0c0a.webp',
  '10-hearts':  '/assets/cards/10_hearts_4788eaaa_46a0d538.webp',
  'J-diamonds': '/assets/cards/jack_diamonds_e3ef742d_46a3b61d.webp',
  'J-clubs':    '/assets/cards/jack_clubs_a53d6bec_76d69c9c.webp',
  'J-spades':   '/assets/cards/jack_spades_d06bd63c_5653fa50.webp',
  'J-hearts':   '/assets/cards/jack_hearts_b0836a37_e319a885.webp',
  'Q-diamonds': '/assets/cards/queen_diamonds_fd98a66d_c7f405b9.webp',
  'Q-clubs':    '/assets/cards/queen_clubs_cd155fb8_d51ea089.webp',
  'Q-spades':   '/assets/cards/queen_spades_db668c78_54a6b89f.webp',
  'Q-hearts':   '/assets/cards/queen_hearts_077a6864_f0f4c9e3.webp',
  'K-diamonds': '/assets/cards/king_diamonds_a70fa103_98e7075f.webp',
  'K-clubs':    '/assets/cards/king_clubs_0b5476f9_237e0086.webp',
  'K-spades':   '/assets/cards/king_spades_5f451693_c44e8430.webp',
  'K-hearts':   '/assets/cards/king_hearts_ed4da7ef_a7c91b8f.webp',
  'A-diamonds': '/assets/cards/ace_diamonds_a0ebe640_99417ad5.webp',
  'A-clubs':    '/assets/cards/ace_clubs_3a4828b5_bd4a80b6.webp',
  'A-spades':   '/assets/cards/ace_spades_c747bd96_0d796a7e.webp',
  'A-hearts':   '/assets/cards/ace_hearts_dffa2bc3_5d609c81.webp',
  '777':        '/assets/cards/777_66c2a698_5c911fbe.webp',
};

export const CARD_BACK_URL = '/assets/cards/card_back_classic_8ad2e43d.webp';
export const CARD_BACK_CUSTOM_URL = '/assets/cards/card_back_custom_987db1bc.webp';
export const GAME_TABLE_URL = '/assets/cards/game_table-9KeBRLr2mzuAL8uVYsQsVq_609274c2.webp';
export const GAME_TABLE_DARK_URL = '/assets/cards/khansky_oktogon_table_523470d5_4ddcf50d.webp';
export const GAME_TABLE_NEON_URL = '/assets/cards/neon_table-eY4ptBJDmBaDo69F5sQkTp_8807fcae.webp';
export const GAME_TABLE_APOCALYPSE_URL = '/assets/cards/table_apocalypse-H8YjUxzbwgWkFc5HnxrkhG_3d34531b.webp';
export const GAME_TABLE_GALAXY_URL = '/assets/cards/table-galaxy-fixed_b6059c99_010d3863.webp';
export const GAME_TABLE_SEA_DEPTHS_URL = '/assets/cards/table_sea_depths_8d949ab4_41a8569c.webp';
export const GAME_TABLE_STARGAZER_URL = '/assets/cards/table_stargazer_95bf3fd6_794bfd11.webp';
export const GAME_TABLE_BLACK_VELVET_URL = '/assets/cards/khan_black_velvet_table_v3-5FMgqXZn8wa4Eo6sPsUP8f_be451c88.webp';

export type TableStyle = 'classic' | 'dark_kazakh' | 'neon' | 'apocalypse' | 'galaxy' | 'sea_depths' | 'stargazer' | 'black_velvet';

export const TABLE_STYLES: Record<TableStyle, { url: string; name: string; nameKk: string; nameEn: string; nameUk?: string; nameKa?: string; nameAz?: string; nameUz?: string; namePl?: string; price: number }> = {
  classic: { url: GAME_TABLE_URL, name: 'Классический', nameKk: 'Классикалық', nameEn: 'Classic', nameUk: 'Класичний', nameKa: 'კლასიკური', nameAz: 'Klassik', nameUz: 'Klassik', namePl: 'Klasyczny', price: 0 },
  dark_kazakh: { url: GAME_TABLE_DARK_URL, name: 'Ханский Октогон', nameKk: 'Хандық Октогон', nameEn: "Khan's Octagon", nameUk: 'Ханський Октагон', nameKa: 'ხანის ოქტაგონი', nameAz: 'Xanın Oktoqonu', nameUz: 'Xonning Oktagoni', namePl: 'Oktagon Chana', price: 500 },
  neon: { url: GAME_TABLE_NEON_URL, name: 'Неоновый Нексус', nameKk: 'Неон Нексус', nameEn: 'Neon Nexus', nameUk: 'Неоновий Нексус', nameKa: 'ნეონური ნექსუსი', nameAz: 'Neon Nexus', nameUz: 'Neon Nexus', namePl: 'Neonowy Nexus', price: 350 },
  apocalypse: { url: GAME_TABLE_APOCALYPSE_URL, name: 'Апокалипсис', nameKk: 'Апокалипсис', nameEn: 'Apocalypse', nameUk: 'Апокаліпсис', nameKa: 'აპოკალიფსი', nameAz: 'Apokalipsis', nameUz: 'Apokalipsis', namePl: 'Apokalipsa', price: 600 },
  galaxy: { url: GAME_TABLE_GALAXY_URL, name: 'Галактика', nameKk: 'Галактика', nameEn: 'Galaxy', nameUk: 'Галактика', nameKa: 'გალაქტიკა', nameAz: 'Qalaktika', nameUz: 'Galaktika', namePl: 'Galaktyka', price: 550 },
  sea_depths: { url: GAME_TABLE_SEA_DEPTHS_URL, name: 'Морские глубины', nameKk: 'Теңіз тереңдігі', nameEn: 'Sea Depths', nameUk: 'Морські глибини', nameKa: 'ზღვის სიღრმეები', nameAz: 'Dəniz Dərinlikləri', nameUz: 'Dengiz Chuqurliklari', namePl: 'Głębiny Morskie', price: 350 },
  stargazer: { url: GAME_TABLE_STARGAZER_URL, name: 'Звездочёт', nameKk: 'Жұлдызшы', nameEn: 'Stargazer', nameUk: 'Зіркогмяд', nameKa: 'ვარსკვლავთმჭვრეტელი', nameAz: 'Ulduzbaxan', nameUz: 'Yulduzchi', namePl: 'Astronom', price: 350 },
  black_velvet: { url: GAME_TABLE_BLACK_VELVET_URL, name: 'Чёрный Бархат', nameKk: 'Қара Барқыт', nameEn: 'Black Velvet', nameUk: 'Чорний Оксамит', nameKa: 'შავი ხავერდი', nameAz: 'Qara Məxmər', nameUz: 'Qora Baxmal', namePl: 'Czarny Aksamit', price: 350 },
};

export const SUIT_SYMBOLS: Record<string, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

export const SUIT_COLORS: Record<string, string> = {
  spades: '#1a1a2e',
  hearts: '#c41e3a',
  diamonds: '#c41e3a',
  clubs: '#1a1a2e',
};

export function getCardImageKey(rank: string, suit: string | null): string | null {
  if (rank === '777') return '777';
  if (suit) return `${rank}-${suit}`;
  return null;
}

// For custom deck, ALL cards have images (not just face cards)
export function getCustomCardImageKey(rank: string, suit: string | null): string | null {
  if (rank === '777') return '777';
  if (suit) return `${rank}-${suit}`;
  return null;
}
