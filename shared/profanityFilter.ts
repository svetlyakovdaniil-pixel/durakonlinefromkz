/**
 * Profanity filter for player display names.
 * Covers Russian, Kazakh, and English obscene words.
 *
 * Strategy:
 *  1. Normalize the input: lowercase + strip spaces/dots/underscores/dashes/digits used as letter substitutes.
 *  2. Also apply leet-speak substitution (e→е, a→а, o→о, etc.) to catch mixed-script bypass attempts.
 *  3. Check whether any profanity token appears as a substring of the normalized string.
 *
 * The word list intentionally uses only root forms so that inflected variants are caught automatically.
 */

/** Normalize a string for profanity matching */
function normalize(input: string): string {
  let s = input.toLowerCase();

  // Strip separators commonly used to bypass filters
  s = s.replace(/[\s._\-*@$!?0-9]/g, '');

  // Leet-speak / mixed-script substitutions (Latin → Cyrillic look-alikes and vice-versa)
  s = s
    // Latin to Cyrillic phonetic equivalents
    .replace(/a/g, 'а')
    .replace(/e/g, 'е')
    .replace(/o/g, 'о')
    .replace(/p/g, 'р')
    .replace(/c/g, 'с')
    .replace(/x/g, 'х')
    .replace(/y/g, 'у')
    .replace(/k/g, 'к')
    .replace(/m/g, 'м')
    .replace(/t/g, 'т')
    .replace(/b/g, 'б')
    .replace(/h/g, 'н') // common bypass: "hуй"
    // Digit substitutions
    .replace(/3/g, 'з')
    .replace(/4/g, 'ч')
    .replace(/6/g, 'б');

  return s;
}

/**
 * Russian profanity roots (Cyrillic).
 * Only roots are listed — inflected forms are caught by substring matching.
 */
const RU_WORDS: string[] = [
  // Основная тройка
  'хуй', 'хую', 'хуя', 'хуе', 'хуи', 'хуёв', 'хуём', 'хуйн',
  'пизд', 'пизда', 'пизде', 'пизды', 'пиздёж', 'пиздат', 'пиздец', 'пиздит', 'пиздун',
  'ебат', 'ёбат', 'еблан', 'ёблан', 'ебан', 'ёбан', 'ебло', 'ёбло', 'еблет', 'ёбнут',
  'ёб', 'еб',
  'блядь', 'бляд', 'блять', 'блядск', 'блядун',
  'сука', 'суки', 'суке', 'сукой', 'сучка', 'сучар',
  'мудак', 'мудил', 'мудозвон',
  'залупа', 'залуп',
  'пиздюк', 'пиздёнок',
  'ёпт', 'ёптвою', 'ёпрст',
  'блин', // мягкое, но часто используется как замена
  'шлюха', 'шлюх',
  'ёбнутый', 'ёбнут',
  'пиздострадал',
  'хуесос', 'хуесос',
  'пиздабол', 'пиздабол',
  'ёбарь',
  'долбоёб', 'долбоеб',
  'мразь',
  'тварь',
  'жопа', 'жоп',
  'лох', 'лохи', 'лошара', 'лошар',
  'ублюдок', 'ублюд',
  'педик', 'педераст', 'пидор', 'пидар', 'пидр',
  'гандон',
  'залупа',
  'конч', // кончить (вульг.)
  'дрочить', 'дрочил', 'дроч',
  'манда',
  'ёбаный', 'ёбаная',
  'нахуй', 'нахер',
  'похуй', 'похер',
  'захуяр', 'захуяч',
  'выёбыват', 'выёбыв',
  'разъёб',
  'проёб',
  'отъёб',
  'поёб',
  'заёб',
  'ёбнуть',
  'ёбнул',
  'ёбнула',
  'ёбнутый',
  'ёбнутая',
  'пиздануть', 'пизданул',
  'хуйня', 'хуйн',
  'хуйло',
  'хуесос',
  'пиздострадание',
  'блядина',
  'блядство',
  'ёбство',
  'пиздёж',
];

/**
 * Kazakh profanity roots (Cyrillic Kazakh script).
 * Only include tokens that are >= 4 characters to avoid false positives
 * with common Kazakh names (Алмас, Асет, Дастан, etc.).
 */
const KZ_WORDS: string[] = [
  // Казахские маты — только длинные токены (≥4 символа) чтобы не блокировать имена
  'сікір',
  'қотыр', 'котыр',
  'жезөкше', 'жезокше',
  'шошқа', 'шошка',
  'итсоқыр', 'итсокыр',
  'арсыз',
  'нәпсі',
  'ақымақ',
  'тентек',
  'сасық',
  'шүберек',
  'тоңмойын',
  'қорқақ',
  'сатқын',
  'опасыз',
  'боқмұрын', 'боқмурын',
  'сикпе',
  'сикіш',
  'сикіс',
  'шешеңді',
  'анаңды',
  'атаңды',
  // Добавлено пользователем
  'котак',    // қотақ — казахский мат
  'қотақ',
  'котакбас', 'қотақбас',
  'котакпас', 'қотақпас',
  'щещен',    // сегін/щещен — казахские маты
  'сегін', 'сегин',
  'щщс',
];

/**
 * English profanity roots.
 */
const EN_WORDS: string[] = [
  'fuck', 'fuk', 'fck', 'fuq', 'fvck',
  'shit', 'sht', 'sh1t',
  'bitch', 'btch', 'b1tch',
  'cunt', 'cnt',
  'ass', 'arse',
  'cock', 'cok',
  'dick', 'dik',
  'pussy', 'puss',
  'whore', 'whor',
  'slut',
  'nigger', 'nigga', 'nigg',
  'faggot', 'fag',
  'bastard', 'bastrd',
  'motherfuck', 'mf',
  'asshole', 'arsehole',
  'dumbass',
  'jackass',
  'dipshit',
  'bullshit',
  'horseshit',
  'prick',
  'twat',
  'wank', 'wanker',
  'jerk',
  'douche',
  'retard',
  'spastic',
  'kike',
  'spic',
  'chink',
  'wetback',
  'cracker',
  'honkey',
  'tranny',
  'shemale',
];

/** All profanity tokens, pre-normalized */
const ALL_TOKENS: string[] = [
  ...RU_WORDS,
  ...KZ_WORDS,
  ...EN_WORDS,
].map(normalize);

/**
 * Returns true if the given name contains profanity in Russian, Kazakh, or English.
 * Checks are case-insensitive and bypass common obfuscation tricks.
 */
export function containsProfanity(name: string): boolean {
  const normalized = normalize(name);
  return ALL_TOKENS.some(token => normalized.includes(token));
}

/** Error message to return when profanity is detected */
export const PROFANITY_ERR_MSG = 'Имя содержит недопустимые слова';
