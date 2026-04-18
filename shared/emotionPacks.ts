// Emotion packs for the shop
export interface EmotionPackItem {
  id: string;
  label: string;
  labelKk?: string;
  labelEn?: string;
  url: string;
}

export interface EmotionPack {
  id: string;
  name: string;
  nameKk?: string;
  nameEn?: string;
  description?: string;
  descriptionKk?: string;
  descriptionEn?: string;
  price: number; // 0 = free
  emotions: EmotionPackItem[];
}

// Khan pack (default, always free)
export const KHAN_PACK: EmotionPack = {
  id: 'khan',
  name: 'Казахский Хан',
  nameKk: 'Қазақ Ханы',
  nameEn: 'Kazakh Khan',
  description: 'Эмоции с казахским ханом в калпаке',
  descriptionKk: 'Қалпақты қазақ ханымен эмоциялар',
  descriptionEn: 'Emotions with a Kazakh Khan in kalpak',
  price: 0, // free by default
  emotions: [
    { id: 'laugh',  label: 'Смех',    labelKk: 'Күлу',     labelEn: 'Laugh',   url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_khan_laugh_68ee4d40.png' },
    { id: 'cool',   label: 'Круто',   labelKk: 'Керемет',  labelEn: 'Cool',    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_khan_cool_7a4a8a8d.png' },
    { id: 'angry',  label: 'Злость',  labelKk: 'Ашу',      labelEn: 'Angry',   url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_khan_angry_8618af32.png' },
    { id: 'sad',    label: 'Грусть',  labelKk: 'Қайғы',    labelEn: 'Sad',     url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_khan_sad_27908e27.png' },
    { id: 'think',  label: 'Думаю',   labelKk: 'Ойлаймын', labelEn: 'Think',   url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_khan_think_33befc92.png' },
    { id: 'wow',    label: 'Вау',     labelKk: 'Уау',      labelEn: 'Wow',     url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_khan_wow_a86a7e15.png' },
    { id: 'heart',  label: 'Любовь',  labelKk: 'Сүйіспен', labelEn: 'Love',    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_khan_heart_e35ddda3.png' },
    { id: 'hurry',  label: 'Тороплю', labelKk: 'Асығам',   labelEn: 'Hurry',   url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_khan_hurry_618fde27.png' },
    { id: 'win',    label: 'Победа',  labelKk: 'Жеңіс',    labelEn: 'Win',     url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_khan_win_e091d556.png' },
    { id: 'sleep',  label: 'Скучно',  labelKk: 'Жалықтым', labelEn: 'Bored',   url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_khan_sleep_be20119f.png' },
  ],
};

// Hamster pack (purchasable, 150 tenge)
export const HAMSTER_PACK: EmotionPack = {
  id: 'hamster',
  name: 'Хомяк',
  nameKk: 'Хомяк',
  nameEn: 'Hamster',
  description: 'Оригинальные эмоции с хомяком',
  descriptionKk: 'Хомякпен түпнұсқа эмоциялар',
  descriptionEn: 'Original hamster emotions',
  price: 150, // 150 tenge
  emotions: [
    { id: 'laugh',  label: 'Смех',    labelKk: 'Күлу',     labelEn: 'Laugh',   url: '/assets/static/emotion_laugh.png' },
    { id: 'cool',   label: 'Круто',   labelKk: 'Керемет',  labelEn: 'Cool',    url: '/assets/static/emotion_cool.png' },
    { id: 'angry',  label: 'Злость',  labelKk: 'Ашу',      labelEn: 'Angry',   url: '/assets/static/emotion_angry.png' },
    { id: 'sad',    label: 'Грусть',  labelKk: 'Қайғы',    labelEn: 'Sad',     url: '/assets/static/emotion_sad.png' },
    { id: 'think',  label: 'Думаю',   labelKk: 'Ойлаймын', labelEn: 'Think',   url: '/assets/static/emotion_think.png' },
    { id: 'wow',    label: 'Вау',     labelKk: 'Уау',      labelEn: 'Wow',     url: '/assets/static/emotion_wow.png' },
    { id: 'heart',  label: 'Любовь',  labelKk: 'Сүйіспен', labelEn: 'Love',    url: '/assets/static/emotion_heart.png' },
    { id: 'hurry',  label: 'Тороплю', labelKk: 'Асығам',   labelEn: 'Hurry',   url: '/assets/static/emotion_hurry.png' },
    { id: 'win',    label: 'Победа',  labelKk: 'Жеңіс',    labelEn: 'Win',     url: '/assets/static/emotion_win.png' },
    { id: 'sleep',  label: 'Скучно',  labelKk: 'Жалықтым', labelEn: 'Bored',   url: '/assets/static/emotion_sleep.png' },
  ],
};

// Monkey pack (purchasable)
export const MONKEY_PACK: EmotionPack = {
  id: 'monkey',
  name: 'Обезьяна',
  nameKk: 'Маймыл',
  nameEn: 'Monkey',
  description: 'Те же эмоции, только с обезьяной!',
  descriptionKk: 'Сол эмоциялар, бірақ маймылмен!',
  descriptionEn: 'Same emotions, but with a monkey!',
  price: 150, // 150 tenge
  emotions: [
    { id: 'laugh',  label: 'Смех',    labelKk: 'Күлу',     labelEn: 'Laugh',  url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_monkey_laugh_9e3429b4.png' },
    { id: 'cool',   label: 'Круто',   labelKk: 'Керемет',  labelEn: 'Cool',   url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_monkey_cool_4b56eac0.png' },
    { id: 'angry',  label: 'Злость',  labelKk: 'Ашу',      labelEn: 'Angry',  url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_monkey_angry_9fb48b22.png' },
    { id: 'sad',    label: 'Грусть',  labelKk: 'Қайғы',    labelEn: 'Sad',    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_monkey_sad_a1b76315.png' },
    { id: 'think',  label: 'Думаю',   labelKk: 'Ойлаймын', labelEn: 'Think',  url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_monkey_think_979faf8d.png' },
    { id: 'wow',    label: 'Вау',     labelKk: 'Уау',      labelEn: 'Wow',    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_monkey_wow_4a569438.png' },
    { id: 'heart',  label: 'Любовь',  labelKk: 'Сүйіспен', labelEn: 'Love',   url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_monkey_heart_6fb9e4ca.png' },
    { id: 'hurry',  label: 'Тороплю', labelKk: 'Асығам',   labelEn: 'Hurry',  url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_monkey_hurry_33227715.png' },
    { id: 'win',    label: 'Победа',  labelKk: 'Жеңіс',    labelEn: 'Win',    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_monkey_win_cbae3999.png' },
    { id: 'sleep',  label: 'Скучно',  labelKk: 'Жалықтым', labelEn: 'Bored',  url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_monkey_sleep_0c454b9a.png' },
  ],
};

// Devil pack (purchasable)
export const DEVIL_PACK: EmotionPack = {
  id: 'devil',
  name: 'Чертик',
  nameKk: 'Шайтан',
  nameEn: 'Devil',
  description: 'Те же эмоции, только с чертиком!',
  descriptionKk: 'Сол эмоциялар, бірақ шайтанмен!',
  descriptionEn: 'Same emotions, but with a little devil!',
  price: 150, // 150 tenge
  emotions: [
    { id: 'laugh',  label: 'Смех',    labelKk: 'Күлу',     labelEn: 'Laugh',  url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_devil_laugh_810771e3.png' },
    { id: 'cool',   label: 'Круто',   labelKk: 'Керемет',  labelEn: 'Cool',   url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_devil_cool_e5b18242.png' },
    { id: 'angry',  label: 'Злость',  labelKk: 'Ашу',      labelEn: 'Angry',  url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_devil_angry_e4ff36c8.png' },
    { id: 'sad',    label: 'Грусть',  labelKk: 'Қайғы',    labelEn: 'Sad',    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_devil_sad_fc1ad763.png' },
    { id: 'think',  label: 'Думаю',   labelKk: 'Ойлаймын', labelEn: 'Think',  url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_devil_think_a32cf7f5.png' },
    { id: 'wow',    label: 'Вау',     labelKk: 'Уау',      labelEn: 'Wow',    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_devil_wow_6f7fcd2b.png' },
    { id: 'heart',  label: 'Любовь',  labelKk: 'Сүйіспен', labelEn: 'Love',   url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_devil_heart_4914bc75.png' },
    { id: 'hurry',  label: 'Тороплю', labelKk: 'Асығам',   labelEn: 'Hurry',  url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_devil_hurry_97527c35.png' },
    { id: 'win',    label: 'Победа',  labelKk: 'Жеңіс',    labelEn: 'Win',    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_devil_win_d390dde4.png' },
    { id: 'sleep',  label: 'Скучно',  labelKk: 'Жалықтым', labelEn: 'Bored',  url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_devil_sleep_5d68d751.png' },
  ],
};

// Khan is first (default), then paid packs
export const EMOTION_PACKS: EmotionPack[] = [KHAN_PACK, HAMSTER_PACK, MONKEY_PACK, DEVIL_PACK];

/** Default pack ID for new players */
export const DEFAULT_EMOTION_PACK_ID = 'khan';

/** Get an emotion pack by ID, falls back to khan */
export function getEmotionPack(packId: string): EmotionPack {
  return EMOTION_PACKS.find(p => p.id === packId) ?? KHAN_PACK;
}
