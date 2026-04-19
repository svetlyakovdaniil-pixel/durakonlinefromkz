// Card image CDN URLs for all face cards, aces, specials
export const CARD_IMAGES: Record<string, string> = {
  'K-spades':   '/assets/static/king_spades_batyr_78c9c564.png',
  'K-hearts':   '/assets/static/king_hearts_batyr_v2_c3155002.png',
  'K-diamonds': '/assets/static/king_diamonds_batyr_v2_58b932e2.png',
  'K-clubs':    '/assets/static/king_clubs_batyr_v2_42b6c3f2.png',
  'Q-spades':   '/assets/static/queen_spades_batyr_v2_96732a86.png',
  'Q-hearts':   '/assets/static/queen_hearts_batyr_v2_76f970ba.png',
  'Q-diamonds': '/assets/static/queen_diamonds_batyr_v2_96b1337e.png',
  'Q-clubs':    '/assets/static/queen_clubs_batyr_v2_b3ca7ee9.png',
  'J-spades':   '/assets/static/jack_spades_batyr_v2_87356e9c.png',
  'J-hearts':   '/assets/static/jack_hearts_batyr_v2_baf92fb7.png',
  'J-diamonds': '/assets/static/jack_diamonds_batyr_v2_14f1a706.png',
  'J-clubs':    '/assets/static/jack_clubs_batyr_v2_bab9b3cf.png',
  'A-spades':   '/assets/static/ace_spades_batyr_v2_79316376.png',
  'A-hearts':   '/assets/static/ace_hearts_batyr_v2_32b73b45.png',
  'A-diamonds': '/assets/static/ace_diamonds_batyr_v2_8a564d82.png',
  'A-clubs':    '/assets/static/ace_clubs_batyr_11b7c939.png',
  '6-spades':   '/assets/static/six_spades_batyr_71aa2b41.png',
  '6-hearts':   '/assets/static/six_hearts_batyr_46cec60c.png',
  '6-diamonds': '/assets/static/six_diamonds_batyr_8a5da4e6.png',
  '6-clubs':    '/assets/static/six_clubs_batyr_8b569939.png',
  '7-spades':   '/assets/static/seven_spades_batyr_6482695f.png',
  '7-hearts':   '/assets/static/seven_hearts_batyr_abecf834.png',
  '7-diamonds': '/assets/static/seven_diamonds_batyr_6e56edaa.png',
  '7-clubs':    '/assets/static/seven_clubs_batyr_c02d8c46.png',
  '8-spades':   '/assets/static/eight_spades_batyr_ca32183c.png',
  '8-hearts':   '/assets/static/eight_hearts_batyr_dda206ca.png',
  '8-diamonds': '/assets/static/eight_diamonds_batyr_12f2b438.png',
  '8-clubs':    '/assets/static/eight_clubs_batyr_d5cb78a9.png',
  '9-spades':   '/assets/static/nine_spades_batyr_d9836dea.png',
  '9-hearts':   '/assets/static/nine_hearts_batyr_9497c114.png',
  '9-diamonds': '/assets/static/nine_diamonds_batyr_2e9f5185.png',
  '9-clubs':    '/assets/static/nine_clubs_batyr_aac27927.png',
  '10-spades':  '/assets/static/ten_spades_batyr_v4_056053c0.png',
  '10-hearts':  '/assets/static/ten_hearts_batyr_v6_e35bafe3.png',
  '10-diamonds':'/assets/static/ten_diamonds_batyr_v6_8c90ef70.png',
  '10-clubs':   '/assets/static/ten_clubs_batyr_v5_8d520041.png',
  '777':        '/assets/static/joker_777_batyr_v2_2c59f1ad.png',
};

// Deck 2 (custom) — "Товарищ Мырза" — all 36 cards have images
export const CARD_IMAGES_CUSTOM: Record<string, string> = {
  '6-diamonds': '/assets/static/6буби_ad2767e9.jpg',
  '6-clubs': '/assets/static/6крести_0ddfbd72.jpg',
  '6-spades': '/assets/static/6пики_a5e66aa5.jpg',
  '6-hearts': '/assets/static/6черви_c788e629.jpg',
  '7-diamonds': '/assets/static/7буби_bd386fe2.jpg',
  '7-clubs': '/assets/static/7крести_35ebf9d6.jpg',
  '7-spades': '/assets/static/7пики_8726d725.jpg',
  '7-hearts': '/assets/static/7черви_6eca967e.jpg',
  '8-diamonds': '/assets/static/8буби_06844441.jpg',
  '8-clubs': '/assets/static/8крести_697e7dd4.jpg',
  '8-spades': '/assets/static/8пики_369be7af.jpg',
  '8-hearts': '/assets/static/8черви_eca9d1b3.jpg',
  '9-diamonds': '/assets/static/9буби_4e6a4a6f.jpg',
  '9-clubs': '/assets/static/9крести_b6e7c97b.jpg',
  '9-spades': '/assets/static/9пики_79ac5272.jpg',
  '9-hearts': '/assets/static/9черви_76fc201c.jpg',
  '10-diamonds': '/assets/static/10буби_f2b92276.jpg',
  '10-clubs': '/assets/static/10крести_543e49e3.jpg',
  '10-spades': '/assets/static/10пики_fd8cb013.jpg',
  '10-hearts': '/assets/static/10черви_4788eaaa.jpg',
  'J-diamonds': '/assets/static/валетбуби_e3ef742d.jpg',
  'J-clubs': '/assets/static/валеткрести_a53d6bec.jpg',
  'J-spades': '/assets/static/валетпики_d06bd63c.jpg',
  'J-hearts': '/assets/static/валетчерви_b0836a37.jpg',
  'Q-diamonds': '/assets/static/дамабуби_fd98a66d.jpg',
  'Q-clubs': '/assets/static/дамакрести_cd155fb8.jpg',
  'Q-spades': '/assets/static/дамапики_db668c78.jpg',
  'Q-hearts': '/assets/static/дамачерви_077a6864.jpg',
  'K-diamonds': '/assets/static/корольбуби_a70fa103.jpg',
  'K-clubs': '/assets/static/королькрести_0b5476f9.jpg',
  'K-spades': '/assets/static/корольпики_5f451693.jpg',
  'K-hearts': '/assets/static/корольчерви_ed4da7ef.jpg',
  'A-diamonds': '/assets/static/тузбуби_a0ebe640.jpg',
  'A-clubs': '/assets/static/тузкрести_3a4828b5.jpg',
  'A-spades': '/assets/static/тузпики_c747bd96.jpg',
  'A-hearts': '/assets/static/тузчерви_dffa2bc3.jpg',
  '777': '/assets/static/777_66c2a698.jpg',
};

export const CARD_BACK_URL = '/assets/static/хорошаяобложка_1d8ecf26.jpg';
export const CARD_BACK_CUSTOM_URL = '/assets/static/ТоварищМырза_61b514ca.png';
export const GAME_TABLE_URL = '/assets/static/game_table-9KeBRLr2mzuAL8uVYsQsVq.webp';
export const GAME_TABLE_DARK_URL = '/assets/static/khansky_oktogon_table_523470d5.webp';
export const GAME_TABLE_NEON_URL = '/assets/static/neon_table-eY4ptBJDmBaDo69F5sQkTp.webp';
export const GAME_TABLE_APOCALYPSE_URL = '/assets/static/table_apocalypse-H8YjUxzbwgWkFc5HnxrkhG.webp';
export const GAME_TABLE_GALAXY_URL = '/assets/static/table-galaxy-fixed_b6059c99.webp';
export const GAME_TABLE_SEA_DEPTHS_URL = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/table_sea_depths_8d949ab4.png';
export const GAME_TABLE_STARGAZER_URL = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/table_stargazer_95bf3fd6.png';
export const GAME_TABLE_BLACK_VELVET_URL = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/khan_black_velvet_table_v3-5FMgqXZn8wa4Eo6sPsUP8f.webp';

export type TableStyle = 'classic' | 'dark_kazakh' | 'neon' | 'apocalypse' | 'galaxy' | 'sea_depths' | 'stargazer' | 'black_velvet';

export const TABLE_STYLES: Record<TableStyle, { url: string; name: string; nameKk: string; nameEn: string; nameUk?: string; nameKa?: string; price: number }> = {
  classic: { url: GAME_TABLE_URL, name: 'Классический', nameKk: 'Классикалық', nameEn: 'Classic', nameUk: 'Класичний', nameKa: 'კლასიკური', price: 0 },
  dark_kazakh: { url: GAME_TABLE_DARK_URL, name: 'Ханский Октогон', nameKk: 'Хандық Октогон', nameEn: "Khan's Octagon", nameUk: 'Ханський Октагон', nameKa: 'ხანის ოქტაგონი', price: 500 },
  neon: { url: GAME_TABLE_NEON_URL, name: 'Неоновый Нексус', nameKk: 'Неон Нексус', nameEn: 'Neon Nexus', nameUk: 'Неоновий Нексус', nameKa: 'ნეონური ნექსუსი', price: 350 },
  apocalypse: { url: GAME_TABLE_APOCALYPSE_URL, name: 'Апокалипсис', nameKk: 'Апокалипсис', nameEn: 'Apocalypse', nameUk: 'Апокаліпсис', nameKa: 'აპოკალიფსი', price: 600 },
  galaxy: { url: GAME_TABLE_GALAXY_URL, name: 'Галактика', nameKk: 'Галактика', nameEn: 'Galaxy', nameUk: 'Галактика', nameKa: 'გალაქტიკა', price: 550 },
  sea_depths: { url: GAME_TABLE_SEA_DEPTHS_URL, name: 'Морские глубины', nameKk: 'Теңіз тереңдігі', nameEn: 'Sea Depths', nameUk: 'Морські глибини', nameKa: 'ზღვის სიღრმეები', price: 350 },
  stargazer: { url: GAME_TABLE_STARGAZER_URL, name: 'Звездочёт', nameKk: 'Жұлдызшы', nameEn: 'Stargazer', nameUk: 'Зіркогляд', nameKa: 'ვარსკვლავთმჭვრეტელი', price: 350 },
  black_velvet: { url: GAME_TABLE_BLACK_VELVET_URL, name: 'Чёрный Бархат', nameKk: 'Қара Барқыт', nameEn: 'Black Velvet', nameUk: 'Чорний Оксамит', nameKa: 'შავი ხავერდი', price: 350 },
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
