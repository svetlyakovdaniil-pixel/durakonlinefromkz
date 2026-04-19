// Card image CDN URLs for all face cards, aces, specials
export const CARD_IMAGES: Record<string, string> = {
  'K-spades':   '/manus-storage/king_spades_batyr_78c9c564_fff3b909.png',
  'K-hearts':   '/manus-storage/king_hearts_batyr_v2_c3155002_23b172f1.png',
  'K-diamonds': '/manus-storage/king_diamonds_batyr_v2_58b932e2_733b1fa4.png',
  'K-clubs':    '/manus-storage/king_clubs_batyr_v2_42b6c3f2_7679f01f.png',
  'Q-spades':   '/manus-storage/queen_spades_batyr_v2_96732a86_9c3ca2e4.png',
  'Q-hearts':   '/manus-storage/queen_hearts_batyr_v2_76f970ba_b83f31f8.png',
  'Q-diamonds': '/manus-storage/queen_diamonds_batyr_v2_96b1337e_5bcbf343.png',
  'Q-clubs':    '/manus-storage/queen_clubs_batyr_v2_b3ca7ee9_3cc61486.png',
  'J-spades':   '/manus-storage/jack_spades_batyr_v2_87356e9c_971c108b.png',
  'J-hearts':   '/manus-storage/jack_hearts_batyr_v2_baf92fb7_ebaf3571.png',
  'J-diamonds': '/manus-storage/jack_diamonds_batyr_v2_14f1a706_6b06be91.png',
  'J-clubs':    '/manus-storage/jack_clubs_batyr_v2_bab9b3cf_2ea4bcf4.png',
  'A-spades':   '/manus-storage/ace_spades_batyr_v2_79316376_3999bef6.png',
  'A-hearts':   '/manus-storage/ace_hearts_batyr_v2_32b73b45_3b29931b.png',
  'A-diamonds': '/manus-storage/ace_diamonds_batyr_v2_8a564d82_38e97424.png',
  'A-clubs':    '/manus-storage/ace_clubs_batyr_11b7c939_5c23a20e.png',
  '6-spades':   '/manus-storage/six_spades_batyr_71aa2b41_95ded933.png',
  '6-hearts':   '/manus-storage/six_hearts_batyr_46cec60c_ef12fcd2.png',
  '6-diamonds': '/manus-storage/six_diamonds_batyr_8a5da4e6_9eb1b680.png',
  '6-clubs':    '/manus-storage/six_clubs_batyr_8b569939_ea55fba4.png',
  '7-spades':   '/manus-storage/seven_spades_batyr_6482695f_98756540.png',
  '7-hearts':   '/manus-storage/seven_hearts_batyr_abecf834_7b3db4ae.png',
  '7-diamonds': '/manus-storage/seven_diamonds_batyr_6e56edaa_39237a8c.png',
  '7-clubs':    '/manus-storage/seven_clubs_batyr_c02d8c46_ba187b49.png',
  '8-spades':   '/manus-storage/eight_spades_batyr_ca32183c_f3b53c4e.png',
  '8-hearts':   '/manus-storage/eight_hearts_batyr_dda206ca_6d90305e.png',
  '8-diamonds': '/manus-storage/eight_diamonds_batyr_12f2b438_4c1cdf24.png',
  '8-clubs':    '/manus-storage/eight_clubs_batyr_d5cb78a9_d55d1526.png',
  '9-spades':   '/manus-storage/nine_spades_batyr_d9836dea_dfbfb014.png',
  '9-hearts':   '/manus-storage/nine_hearts_batyr_9497c114_5a1b5130.png',
  '9-diamonds': '/manus-storage/nine_diamonds_batyr_2e9f5185_3c41c1cc.png',
  '9-clubs':    '/manus-storage/nine_clubs_batyr_aac27927_7d57c7d6.png',
  '10-spades':  '/manus-storage/ten_spades_batyr_v4_056053c0_d8d2ac62.png',
  '10-hearts':  '/manus-storage/ten_hearts_batyr_v6_e35bafe3_040cc1aa.png',
  '10-diamonds':'/manus-storage/ten_diamonds_batyr_v6_8c90ef70_52bae331.png',
  '10-clubs':   '/manus-storage/ten_clubs_batyr_v5_8d520041_e5d48e50.png',
  '777':        '/manus-storage/joker_777_batyr_v2_2c59f1ad_5482b7dc.png',
};

// Deck 2 (custom) — "Товарищ Мырза" — all 36 cards have images
export const CARD_IMAGES_CUSTOM: Record<string, string> = {
  '6-diamonds': '/manus-storage/6буби_ad2767e9_e7334a85.jpg',
  '6-clubs': '/manus-storage/6крести_0ddfbd72_c0df3d9c.jpg',
  '6-spades': '/manus-storage/6пики_a5e66aa5_14f1b8e0.jpg',
  '6-hearts': '/manus-storage/6черви_c788e629_d8f61a15.jpg',
  '7-diamonds': '/manus-storage/7буби_bd386fe2_67e3eef9.jpg',
  '7-clubs': '/manus-storage/7крести_35ebf9d6_8109cbf3.jpg',
  '7-spades': '/manus-storage/7пики_8726d725_ae87faa6.jpg',
  '7-hearts': '/manus-storage/7черви_6eca967e_fdff33cb.jpg',
  '8-diamonds': '/manus-storage/8буби_06844441_5cdc6a83.jpg',
  '8-clubs': '/manus-storage/8крести_697e7dd4_d01565e9.jpg',
  '8-spades': '/manus-storage/8пики_369be7af_bfc06294.jpg',
  '8-hearts': '/manus-storage/8черви_eca9d1b3_5ed379c1.jpg',
  '9-diamonds': '/manus-storage/9буби_4e6a4a6f_f29b8e07.jpg',
  '9-clubs': '/manus-storage/9крести_b6e7c97b_5e64bd9c.jpg',
  '9-spades': '/manus-storage/9пики_79ac5272_ee094081.jpg',
  '9-hearts': '/manus-storage/9черви_76fc201c_d872b6b7.jpg',
  '10-diamonds': '/manus-storage/10буби_f2b92276_5366e62b.jpg',
  '10-clubs': '/manus-storage/10крести_543e49e3_30c2b9d8.jpg',
  '10-spades': '/manus-storage/10пики_fd8cb013_c5e28a61.jpg',
  '10-hearts': '/manus-storage/10черви_4788eaaa_d2cea0a5.jpg',
  'J-diamonds': '/manus-storage/валетбуби_e3ef742d_e05199bb.jpg',
  'J-clubs': '/manus-storage/валеткрести_a53d6bec_888d4c4c.jpg',
  'J-spades': '/manus-storage/валетпики_d06bd63c_1301c4e1.jpg',
  'J-hearts': '/manus-storage/валетчерви_b0836a37_89053f44.jpg',
  'Q-diamonds': '/manus-storage/дамабуби_fd98a66d_9e8691a1.jpg',
  'Q-clubs': '/manus-storage/дамакрести_cd155fb8_ae505100.jpg',
  'Q-spades': '/manus-storage/дамапики_db668c78_33950f47.jpg',
  'Q-hearts': '/manus-storage/дамачерви_077a6864_e990b3b9.jpg',
  'K-diamonds': '/manus-storage/корольбуби_a70fa103_16131f05.jpg',
  'K-clubs': '/manus-storage/королькрести_0b5476f9_598e4cec.jpg',
  'K-spades': '/manus-storage/корольпики_5f451693_013c9db5.jpg',
  'K-hearts': '/manus-storage/корольчерви_ed4da7ef_3ee22c23.jpg',
  'A-diamonds': '/manus-storage/тузбуби_a0ebe640_18fcb92c.jpg',
  'A-clubs': '/manus-storage/тузкрести_3a4828b5_a99e65ae.jpg',
  'A-spades': '/manus-storage/тузпики_c747bd96_537eae67.jpg',
  'A-hearts': '/manus-storage/тузчерви_dffa2bc3_435abd3b.jpg',
  '777': '/manus-storage/777_66c2a698_00863983.jpg',
};

export const CARD_BACK_URL = '/manus-storage/хорошаяобложка_1d8ecf26_9166a4e1.jpg';
export const CARD_BACK_CUSTOM_URL = '/manus-storage/ТоварищМырза_61b514ca_10f9a743.png';
export const GAME_TABLE_URL = '/manus-storage/game_table-9KeBRLr2mzuAL8uVYsQsVq_1f2b0e6d.webp';
export const GAME_TABLE_DARK_URL = '/manus-storage/khansky_oktogon_table_523470d5_a182782b.webp';
export const GAME_TABLE_NEON_URL = '/manus-storage/neon_table-eY4ptBJDmBaDo69F5sQkTp_6c366e44.webp';
export const GAME_TABLE_APOCALYPSE_URL = '/manus-storage/table_apocalypse-H8YjUxzbwgWkFc5HnxrkhG_4aaf4d7b.webp';
export const GAME_TABLE_GALAXY_URL = '/manus-storage/table-galaxy-fixed_b6059c99_16b61124.webp';
export const GAME_TABLE_SEA_DEPTHS_URL = '/manus-storage/table_sea_depths_8d949ab4_8a1cf275.png';
export const GAME_TABLE_STARGAZER_URL = '/manus-storage/table_stargazer_95bf3fd6_9f2146f7.png';
export const GAME_TABLE_BLACK_VELVET_URL = '/manus-storage/khan_black_velvet_table_v3-5FMgqXZn8wa4Eo6sPsUP8f_f83f2fbc.webp';

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
