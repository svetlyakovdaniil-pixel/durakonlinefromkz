// Card image CDN URLs for all face cards, aces, specials
export const CARD_IMAGES: Record<string, string> = {
  'K-spades':   '/manus-storage/king_spades_batyr_78c9c564_1b2370cd.webp',
  'K-hearts':   '/manus-storage/king_hearts_batyr_v2_c3155002_42eedeb4.webp',
  'K-diamonds': '/manus-storage/king_diamonds_batyr_v2_58b932e2_570cad37.webp',
  'K-clubs':    '/manus-storage/king_clubs_batyr_v2_42b6c3f2_5f91c718.webp',
  'Q-spades':   '/manus-storage/queen_spades_batyr_v2_96732a86_a97adfb4.webp',
  'Q-hearts':   '/manus-storage/queen_hearts_batyr_v2_76f970ba_03c17fe4.webp',
  'Q-diamonds': '/manus-storage/queen_diamonds_batyr_v2_96b1337e_97ac9747.webp',
  'Q-clubs':    '/manus-storage/queen_clubs_batyr_v2_b3ca7ee9_7163be10.webp',
  'J-spades':   '/manus-storage/jack_spades_batyr_v2_87356e9c_1ee16b9d.webp',
  'J-hearts':   '/manus-storage/jack_hearts_batyr_v2_baf92fb7_41d21725.webp',
  'J-diamonds': '/manus-storage/jack_diamonds_batyr_v2_14f1a706_c2e61fb1.webp',
  'J-clubs':    '/manus-storage/jack_clubs_batyr_v2_bab9b3cf_e2813334.webp',
  'A-spades':   '/manus-storage/ace_spades_batyr_v2_79316376_fe1e9d17.webp',
  'A-hearts':   '/manus-storage/ace_hearts_batyr_v2_32b73b45_64a53aa4.webp',
  'A-diamonds': '/manus-storage/ace_diamonds_batyr_v2_8a564d82_f04aaf84.webp',
  'A-clubs':    '/manus-storage/ace_clubs_batyr_11b7c939_b43b3ca1.webp',
  '6-spades':   '/manus-storage/six_spades_batyr_71aa2b41_99c45dd8.webp',
  '6-hearts':   '/manus-storage/six_hearts_batyr_46cec60c_135623af.webp',
  '6-diamonds': '/manus-storage/six_diamonds_batyr_8a5da4e6_32cfebcf.webp',
  '6-clubs':    '/manus-storage/six_clubs_batyr_8b569939_bbefb79b.webp',
  '7-spades':   '/manus-storage/seven_spades_batyr_6482695f_35b5225d.webp',
  '7-hearts':   '/manus-storage/seven_hearts_batyr_abecf834_8a292a8b.webp',
  '7-diamonds': '/manus-storage/seven_diamonds_batyr_6e56edaa_a6977904.webp',
  '7-clubs':    '/manus-storage/seven_clubs_batyr_c02d8c46_add478b2.webp',
  '8-spades':   '/manus-storage/eight_spades_batyr_ca32183c_c04d8b02.webp',
  '8-hearts':   '/manus-storage/eight_hearts_batyr_dda206ca_197761d6.webp',
  '8-diamonds': '/manus-storage/eight_diamonds_batyr_12f2b438_5935b71f.webp',
  '8-clubs':    '/manus-storage/eight_clubs_batyr_d5cb78a9_0b42d929.webp',
  '9-spades':   '/manus-storage/nine_spades_batyr_d9836dea_32caf552.webp',
  '9-hearts':   '/manus-storage/nine_hearts_batyr_9497c114_f2d9e5bc.webp',
  '9-diamonds': '/manus-storage/nine_diamonds_batyr_2e9f5185_4f548b4e.webp',
  '9-clubs':    '/manus-storage/nine_clubs_batyr_aac27927_5bacbfd0.webp',
  '10-spades':  '/manus-storage/ten_spades_batyr_v4_056053c0_1ea65c1c.webp',
  '10-hearts':  '/manus-storage/ten_hearts_batyr_v6_e35bafe3_6580e7e0.webp',
  '10-diamonds':'/manus-storage/ten_diamonds_batyr_v6_8c90ef70_55b854ef.webp',
  '10-clubs':   '/manus-storage/ten_clubs_batyr_v5_8d520041_06f4a256.webp',
  '777':        '/manus-storage/joker_777_batyr_v2_2c59f1ad_a196b309.webp',
};

// Deck 2 (custom) — "Товарищ Мырза" — all 36 cards have images
export const CARD_IMAGES_CUSTOM: Record<string, string> = {
  '6-diamonds': '/manus-storage/6буби_ad2767e9_45d081b5.webp',
  '6-clubs': '/manus-storage/6крести_0ddfbd72_bff5eef4.webp',
  '6-spades': '/manus-storage/6пики_a5e66aa5_90a3b932.webp',
  '6-hearts': '/manus-storage/6черви_c788e629_c3276126.webp',
  '7-diamonds': '/manus-storage/7буби_bd386fe2_7ba67230.webp',
  '7-clubs': '/manus-storage/7крести_35ebf9d6_b779482d.webp',
  '7-spades': '/manus-storage/7пики_8726d725_6bc86b90.webp',
  '7-hearts': '/manus-storage/7черви_6eca967e_6c99e290.webp',
  '8-diamonds': '/manus-storage/8буби_06844441_f09236b3.webp',
  '8-clubs': '/manus-storage/8крести_697e7dd4_690ed9f5.webp',
  '8-spades': '/manus-storage/8пики_369be7af_9213d13b.webp',
  '8-hearts': '/manus-storage/8черви_eca9d1b3_4da828f2.webp',
  '9-diamonds': '/manus-storage/9буби_4e6a4a6f_b465dfa9.webp',
  '9-clubs': '/manus-storage/9крести_b6e7c97b_39105445.webp',
  '9-spades': '/manus-storage/9пики_79ac5272_a31df0eb.webp',
  '9-hearts': '/manus-storage/9черви_76fc201c_1b190901.webp',
  '10-diamonds': '/manus-storage/10буби_f2b92276_cd1fc60e.webp',
  '10-clubs': '/manus-storage/10крести_543e49e3_01ed6329.webp',
  '10-spades': '/manus-storage/10пики_fd8cb013_13f7632f.webp',
  '10-hearts': '/manus-storage/10черви_4788eaaa_d2215154.webp',
  'J-diamonds': '/manus-storage/валетбуби_e3ef742d_cc59235d.webp',
  'J-clubs': '/manus-storage/валеткрести_a53d6bec_d40054b8.webp',
  'J-spades': '/manus-storage/валетпики_d06bd63c_c1d97305.webp',
  'J-hearts': '/manus-storage/валетчерви_b0836a37_80202347.webp',
  'Q-diamonds': '/manus-storage/дамабуби_fd98a66d_e1eec8a2.webp',
  'Q-clubs': '/manus-storage/дамакрести_cd155fb8_a3874216.webp',
  'Q-spades': '/manus-storage/дамапики_db668c78_685b4843.webp',
  'Q-hearts': '/manus-storage/дамачерви_077a6864_ed25c21f.webp',
  'K-diamonds': '/manus-storage/корольбуби_a70fa103_bc0af6e7.webp',
  'K-clubs': '/manus-storage/королькрести_0b5476f9_4ee0cc89.webp',
  'K-spades': '/manus-storage/корольпики_5f451693_a25b2ab0.webp',
  'K-hearts': '/manus-storage/корольчерви_ed4da7ef_8efe3c0c.webp',
  'A-diamonds': '/manus-storage/тузбуби_a0ebe640_e298da91.webp',
  'A-clubs': '/manus-storage/тузкрести_3a4828b5_87522a76.webp',
  'A-spades': '/manus-storage/тузпики_c747bd96_e05dd676.webp',
  'A-hearts': '/manus-storage/тузчерви_dffa2bc3_01ed7da2.webp',
  '777': '/manus-storage/777_66c2a698_5c911fbe.webp',
};

export const CARD_BACK_URL = '/manus-storage/хорошаяобложка_1d8ecf26_8aa99c5c.webp';
export const CARD_BACK_CUSTOM_URL = '/manus-storage/ТоварищМырза_61b514ca_3207a0ef.webp';
export const GAME_TABLE_URL = '/manus-storage/game_table-9KeBRLr2mzuAL8uVYsQsVq_609274c2.webp';
export const GAME_TABLE_DARK_URL = '/manus-storage/khansky_oktogon_table_523470d5_4ddcf50d.webp';
export const GAME_TABLE_NEON_URL = '/manus-storage/neon_table-eY4ptBJDmBaDo69F5sQkTp_8807fcae.webp';
export const GAME_TABLE_APOCALYPSE_URL = '/manus-storage/table_apocalypse-H8YjUxzbwgWkFc5HnxrkhG_3d34531b.webp';
export const GAME_TABLE_GALAXY_URL = '/manus-storage/table-galaxy-fixed_b6059c99_010d3863.webp';
export const GAME_TABLE_SEA_DEPTHS_URL = '/manus-storage/table_sea_depths_8d949ab4_41a8569c.webp';
export const GAME_TABLE_STARGAZER_URL = '/manus-storage/table_stargazer_95bf3fd6_794bfd11.webp';
export const GAME_TABLE_BLACK_VELVET_URL = '/manus-storage/khan_black_velvet_table_v3-5FMgqXZn8wa4Eo6sPsUP8f_be451c88.webp';

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
