// Emotion packs for the shop
export interface EmotionPackItem {
  id: string;
  label: string;
  labelKk?: string;
  labelEn?: string;
  labelUk?: string;
  labelKa?: string;
  url: string;
}

export interface EmotionPack {
  id: string;
  name: string;
  nameKk?: string;
  nameEn?: string;
  nameUk?: string;
  nameKa?: string;
  description?: string;
  descriptionKk?: string;
  descriptionEn?: string;
  descriptionUk?: string;
  descriptionKa?: string;
  price: number; // 0 = free
  emotions: EmotionPackItem[];
}

// Khan pack (default, always free)
export const KHAN_PACK: EmotionPack = {
  id: 'khan',
  name: 'Казахский Хан',
  nameKk: 'Қазақ Ханы',
  nameEn: 'Kazakh Khan',
  nameUk: 'Казахський Хан',
  nameKa: 'ყაზახური ხანი',
  description: 'Эмоции с казахским ханом в калпаке',
  descriptionKk: 'Қалпақты қазақ ханымен эмоциялар',
  descriptionEn: 'Emotions with a Kazakh Khan in kalpak',
  descriptionUk: 'Емоції з казахським ханом у калпаку',
  descriptionKa: 'ემოციები ყაზახური ხანით ყალპაყში',
  price: 0, // free by default
  emotions: [
    { id: 'laugh',  label: 'Смех',    labelKk: 'Күлу',     labelEn: 'Laugh',  labelUk: 'Сміх',   labelKa: 'სიცილი',   url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_khan_laugh_68ee4d40.png' },
    { id: 'cool',   label: 'Круто',   labelKk: 'Керемет',  labelEn: 'Cool',   labelUk: 'Круто',    labelKa: 'მაგარია',    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_khan_cool_7a4a8a8d.png' },
    { id: 'angry',  label: 'Злость',  labelKk: 'Ашу',      labelEn: 'Angry',  labelUk: 'Злість',   labelKa: 'ბრაზი',   url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_khan_angry_8618af32.png' },
    { id: 'sad',    label: 'Грусть',  labelKk: 'Қайғы',    labelEn: 'Sad',    labelUk: 'Сум',     labelKa: 'სევდა',     url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_khan_sad_27908e27.png' },
    { id: 'think',  label: 'Думаю',   labelKk: 'Ойлаймын', labelEn: 'Think',  labelUk: 'Думаю',   labelKa: 'ვფიქრობ',   url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_khan_think_33befc92.png' },
    { id: 'wow',    label: 'Вау',     labelKk: 'Уау',      labelEn: 'Wow',    labelUk: 'Вау',     url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_khan_wow_a86a7e15.png' },
    { id: 'heart',  label: 'Любовь',  labelKk: 'Сүйіспен', labelEn: 'Love',   labelUk: 'Любов',    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_khan_heart_e35ddda3.png' },
    { id: 'hurry',  label: 'Тороплю', labelKk: 'Асығам',   labelEn: 'Hurry',  labelUk: 'Поспішаю',   url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_khan_hurry_618fde27.png' },
    { id: 'win',    label: 'Победа',  labelKk: 'Жеңіс',    labelEn: 'Win',    labelUk: 'Перемога',     url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_khan_win_e091d556.png' },
    { id: 'sleep',  label: 'Скучно',  labelKk: 'Жалықтым', labelEn: 'Bored',  labelUk: 'Нудно',   url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_khan_sleep_be20119f.png' },
  ],
};

// Hamster pack (purchasable, 150 tenge)
export const HAMSTER_PACK: EmotionPack = {
  id: 'hamster',
  name: 'Хомяк',
  nameKk: 'Хомяк',
  nameEn: 'Hamster',
  nameUk: 'Хомяк',
  description: 'Оригинальные эмоции с хомяком',
  descriptionKk: 'Хомякпен түпнұсқа эмоциялар',
  descriptionEn: 'Original hamster emotions',
  descriptionUk: 'Оригінальні емоції з хомяком',
  price: 150, // 150 tenge
  emotions: [
    { id: 'laugh',  label: 'Смех',    labelKk: 'Күлу',     labelEn: 'Laugh',  labelUk: 'Сміх',   labelKa: 'სიცილი',   url: '/assets/static/emotion_laugh.png' },
    { id: 'cool',   label: 'Круто',   labelKk: 'Керемет',  labelEn: 'Cool',   labelUk: 'Круто',    labelKa: 'მაგარია',    url: '/assets/static/emotion_cool.png' },
    { id: 'angry',  label: 'Злость',  labelKk: 'Ашу',      labelEn: 'Angry',  labelUk: 'Злість',   labelKa: 'ბრაზი',   url: '/assets/static/emotion_angry.png' },
    { id: 'sad',    label: 'Грусть',  labelKk: 'Қайғы',    labelEn: 'Sad',    labelUk: 'Сум',     labelKa: 'სევდა',     url: '/assets/static/emotion_sad.png' },
    { id: 'think',  label: 'Думаю',   labelKk: 'Ойлаймын', labelEn: 'Think',  labelUk: 'Думаю',   labelKa: 'ვფიქრობ',   url: '/assets/static/emotion_think.png' },
    { id: 'wow',    label: 'Вау',     labelKk: 'Уау',      labelEn: 'Wow',    labelUk: 'Вау',     url: '/assets/static/emotion_wow.png' },
    { id: 'heart',  label: 'Любовь',  labelKk: 'Сүйіспен', labelEn: 'Love',   labelUk: 'Любов',    url: '/assets/static/emotion_heart.png' },
    { id: 'hurry',  label: 'Тороплю', labelKk: 'Асығам',   labelEn: 'Hurry',  labelUk: 'Поспішаю',   url: '/assets/static/emotion_hurry.png' },
    { id: 'win',    label: 'Победа',  labelKk: 'Жеңіс',    labelEn: 'Win',    labelUk: 'Перемога',     url: '/assets/static/emotion_win.png' },
    { id: 'sleep',  label: 'Скучно',  labelKk: 'Жалықтым', labelEn: 'Bored',  labelUk: 'Нудно',   url: '/assets/static/emotion_sleep.png' },
  ],
};

// Monkey pack (purchasable)
export const MONKEY_PACK: EmotionPack = {
  id: 'monkey',
  name: 'Обезьяна',
  nameKk: 'Маймыл',
  nameEn: 'Monkey',
  nameUk: 'Мавпа',
  description: 'Те же эмоции, только с обезьяной!',
  descriptionKk: 'Сол эмоциялар, бірақ маймылмен!',
  descriptionEn: 'Same emotions, but with a monkey!',
  descriptionUk: 'Ті ж емоції, тільки з мавпою!',
  price: 150, // 150 tenge
  emotions: [
    { id: 'laugh',  label: 'Смех',    labelKk: 'Күлу',     labelEn: 'Laugh',  labelUk: 'Сміх',   labelKa: 'სიცილი',  url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_monkey_laugh_9e3429b4.png' },
    { id: 'cool',   label: 'Круто',   labelKk: 'Керемет',  labelEn: 'Cool',   labelUk: 'Круто',    labelKa: 'მაგარია',   url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_monkey_cool_4b56eac0.png' },
    { id: 'angry',  label: 'Злость',  labelKk: 'Ашу',      labelEn: 'Angry',  labelUk: 'Злість',   labelKa: 'ბრაზი',  url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_monkey_angry_9fb48b22.png' },
    { id: 'sad',    label: 'Грусть',  labelKk: 'Қайғы',    labelEn: 'Sad',    labelUk: 'Сум',     labelKa: 'სევდა',    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_monkey_sad_a1b76315.png' },
    { id: 'think',  label: 'Думаю',   labelKk: 'Ойлаймын', labelEn: 'Think',  labelUk: 'Думаю',   labelKa: 'ვფიქრობ',  url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_monkey_think_979faf8d.png' },
    { id: 'wow',    label: 'Вау',     labelKk: 'Уау',      labelEn: 'Wow',    labelUk: 'Вау',    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_monkey_wow_4a569438.png' },
    { id: 'heart',  label: 'Любовь',  labelKk: 'Сүйіспен', labelEn: 'Love',   labelUk: 'Любов',   url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_monkey_heart_6fb9e4ca.png' },
    { id: 'hurry',  label: 'Тороплю', labelKk: 'Асығам',   labelEn: 'Hurry',  labelUk: 'Поспішаю',  url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_monkey_hurry_33227715.png' },
    { id: 'win',    label: 'Победа',  labelKk: 'Жеңіс',    labelEn: 'Win',    labelUk: 'Перемога',    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_monkey_win_cbae3999.png' },
    { id: 'sleep',  label: 'Скучно',  labelKk: 'Жалықтым', labelEn: 'Bored',  labelUk: 'Нудно',  url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_monkey_sleep_0c454b9a.png' },
  ],
};

// Devil pack (purchasable)
export const DEVIL_PACK: EmotionPack = {
  id: 'devil',
  name: 'Чертик',
  nameKk: 'Шайтан',
  nameEn: 'Devil',
  nameUk: 'Чортеня',
  description: 'Те же эмоции, только с чертиком!',
  descriptionKk: 'Сол эмоциялар, бірақ шайтанмен!',
  descriptionEn: 'Same emotions, but with a little devil!',
  price: 150, // 150 tenge
  emotions: [
    { id: 'laugh',  label: 'Смех',    labelKk: 'Күлу',     labelEn: 'Laugh',  labelUk: 'Сміх',   labelKa: 'სიცილი',  url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_devil_laugh_810771e3.png' },
    { id: 'cool',   label: 'Круто',   labelKk: 'Керемет',  labelEn: 'Cool',   labelUk: 'Круто',    labelKa: 'მაგარია',   url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_devil_cool_e5b18242.png' },
    { id: 'angry',  label: 'Злость',  labelKk: 'Ашу',      labelEn: 'Angry',  labelUk: 'Злість',   labelKa: 'ბრაზი',  url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_devil_angry_e4ff36c8.png' },
    { id: 'sad',    label: 'Грусть',  labelKk: 'Қайғы',    labelEn: 'Sad',    labelUk: 'Сум',     labelKa: 'სევდა',    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_devil_sad_fc1ad763.png' },
    { id: 'think',  label: 'Думаю',   labelKk: 'Ойлаймын', labelEn: 'Think',  labelUk: 'Думаю',   labelKa: 'ვფიქრობ',  url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_devil_think_a32cf7f5.png' },
    { id: 'wow',    label: 'Вау',     labelKk: 'Уау',      labelEn: 'Wow',    labelUk: 'Вау',    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_devil_wow_6f7fcd2b.png' },
    { id: 'heart',  label: 'Любовь',  labelKk: 'Сүйіспен', labelEn: 'Love',   labelUk: 'Любов',   url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_devil_heart_4914bc75.png' },
    { id: 'hurry',  label: 'Тороплю', labelKk: 'Асығам',   labelEn: 'Hurry',  labelUk: 'Поспішаю',  url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_devil_hurry_97527c35.png' },
    { id: 'win',    label: 'Победа',  labelKk: 'Жеңіс',    labelEn: 'Win',    labelUk: 'Перемога',    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_devil_win_d390dde4.png' },
    { id: 'sleep',  label: 'Скучно',  labelKk: 'Жалықтым', labelEn: 'Bored',  labelUk: 'Нудно',  url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_devil_sleep_5d68d751.png' },
  ],
};

// Raccoon pack (purchasable)
export const RACCOON_PACK: EmotionPack = {
  id: 'raccoon',
  name: 'Енот',
  nameKk: 'Жанат',
  nameEn: 'Raccoon',
  nameUk: 'Єнот',
  description: 'Те же эмоции, только с енотом!',
  descriptionKk: 'Сол эмоциялар, бірақ енотпен!',
  descriptionEn: 'Same emotions, but with a raccoon!',
  descriptionUk: 'Ті ж емоції, тільки з єнотом!',
  price: 150,
  emotions: [
    { id: 'laugh',  label: 'Смех',    labelKk: 'Күлу',     labelEn: 'Laugh',  labelUk: 'Сміх',   labelKa: 'სიცილი',   url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_raccoon_ref_laugh_abe704af.png' },
    { id: 'cool',   label: 'Круто',   labelKk: 'Керемет',  labelEn: 'Cool',   labelUk: 'Круто',    labelKa: 'მაგარია',    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_raccoon_cool-6rKk5ui5mySEY6uXKComWK.png' },
    { id: 'angry',  label: 'Злость',  labelKk: 'Ашу',      labelEn: 'Angry',  labelUk: 'Злість',   labelKa: 'ბრაზი',   url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_raccoon_angry-6uVHKrrqCwQBznY5aEh5nC.png' },
    { id: 'sad',    label: 'Грусть',  labelKk: 'Қайғы',    labelEn: 'Sad',    labelUk: 'Сум',     labelKa: 'სევდა',     url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_raccoon_sad-FbNZWtaWSm6Fb4ausscNNE.png' },
    { id: 'think',  label: 'Думаю',   labelKk: 'Ойлаймын', labelEn: 'Think',  labelUk: 'Думаю',   labelKa: 'ვფიქრობ',   url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_raccoon_think-mo3SbXpKKwTTsM6y8SaNUQ.png' },
    { id: 'wow',    label: 'Вау',     labelKk: 'Уау',      labelEn: 'Wow',    labelUk: 'Вау',     url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_raccoon_wow-4QRjVrmn7WYaBBZsWLL8Ej.png' },
    { id: 'heart',  label: 'Любовь',  labelKk: 'Сүйіспен', labelEn: 'Love',   labelUk: 'Любов',    url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_raccoon_heart_v2-TyneVuyMKoLBPNQZyanUc2.png' },
    { id: 'hurry',  label: 'Тороплю', labelKk: 'Асығам',   labelEn: 'Hurry',  labelUk: 'Поспішаю',   url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_raccoon_hurry_v2-agQoZychkNzdjxPYvtLDTE.png' },
    { id: 'win',    label: 'Победа',  labelKk: 'Жеңіс',    labelEn: 'Win',    labelUk: 'Перемога',     url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_raccoon_win-PHHWAUiVmxmYgk2AimmfrD.png' },
    { id: 'sleep',  label: 'Скучно',  labelKk: 'Жалықтым', labelEn: 'Bored',  labelUk: 'Нудно',   url: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/emotion_raccoon_sleep-JPQYVFAzJtFXuS2m8Ko3Ax.png' },
  ],
};

// Khan is first (default), then paid packs
export const EMOTION_PACKS: EmotionPack[] = [KHAN_PACK, HAMSTER_PACK, MONKEY_PACK, DEVIL_PACK, RACCOON_PACK];

/** Default pack ID for new players */
export const DEFAULT_EMOTION_PACK_ID = 'khan';

/** Get an emotion pack by ID, falls back to khan */
export function getEmotionPack(packId: string): EmotionPack {
  return EMOTION_PACKS.find(p => p.id === packId) ?? KHAN_PACK;
}
