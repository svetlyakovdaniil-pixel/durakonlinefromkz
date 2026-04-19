// Avatar frames data - extracted to separate file to avoid HMR issues
import { Flame, Zap, Snowflake, Crown } from 'lucide-react';

export const AVATAR_FRAMES = [
  {
    id: 'fire',
    name: 'Огненная рамка',
    nameKk: 'Отты жақтау',
    nameEn: 'Fire Frame',
    nameUk: 'Вогняна рамка',
    nameKa: 'ცეცხლის ჩარჩო',
    nameAz: 'Atəş Çərçivəsi',
    nameUz: 'Olov Ramkasi',
    namePl: 'Ramka Ogień',
    description: 'Реалистичная анимация огня вокруг аватарки',
    descriptionKk: 'Аватар айналасындағы нақты от анимациясы',
    descriptionEn: 'Realistic fire animation around your avatar',
    price: 500,
    icon: Flame,
    iconColor: 'text-orange-400',
    bgGradient: 'from-amber-800 to-amber-950',
  },
  {
    id: 'neon',
    name: 'Неоновая рамка',
    nameKk: 'Неон жақтау',
    nameEn: 'Neon Frame',
    nameUk: 'Неонова рамка',
    nameKa: 'ნეონური ჩარჩო',
    nameAz: 'Neon Çərçivəsi',
    nameUz: 'Neon Ramkasi',
    namePl: 'Ramka Neon',
    description: 'Яркое неоновое свечение с переливами цветов',
    descriptionKk: 'Түстердің ауысуымен жарқын неон жарқылы',
    descriptionEn: 'Bright neon glow with color transitions',
    price: 800,
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-cyan-400">
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
    iconColor: 'text-cyan-400',
    bgGradient: 'from-cyan-900 to-purple-950',
  },
  {
    id: 'lightning',
    name: 'Молния рамка',
    nameKk: 'Найзағай жақтау',
    nameEn: 'Lightning Frame',
    nameUk: 'Блискавична рамка',
    nameKa: 'ელვის ჩარჩო',
    nameAz: 'İldırım Çərçivəsi',
    nameUz: 'Chaqmoq Ramkasi',
    namePl: 'Ramka Błyskawica',
    description: 'Электрические молнии и искры вокруг аватарки',
    descriptionKk: 'Аватар айналасындағы электр найзағайлары мен ұшқындар',
    descriptionEn: 'Electric lightning bolts and sparks around your avatar',
    price: 1200,
    icon: Zap,
    iconColor: 'text-blue-300',
    bgGradient: 'from-blue-900 to-indigo-950',
  },
  {
    id: 'ice',
    name: 'Ледяная рамка',
    nameKk: 'Мұз жақтау',
    nameEn: 'Ice Frame',
    nameUk: 'Крижана рамка',
    nameKa: 'ყინულის ჩარჩო',
    nameAz: 'Buz Çərçivəsi',
    nameUz: 'Muz Ramkasi',
    namePl: 'Ramka Lód',
    description: 'Ледяные кристаллы и снежинки вокруг аватарки',
    descriptionKk: 'Аватар айналасындағы мұз кристалдары мен қар ұшқындары',
    descriptionEn: 'Ice crystals and snowflakes around your avatar',
    price: 1000,
    icon: Snowflake,
    iconColor: 'text-sky-300',
    bgGradient: 'from-sky-900 to-blue-950',
  },
  {
    id: 'premium',
    name: 'PREMIUM рамка',
    nameKk: 'PREMIUM жақтауы',
    nameEn: 'PREMIUM Frame',
    nameUk: 'ПРЕМІУМ рамка',
    nameKa: 'PREMIUM ჩარჩო',
    nameAz: 'PREMIUM Çərçivəsi',
    nameUz: 'PREMIUM Ramkasi',
    namePl: 'Ramka PREMIUM',
    description: 'Эксклюзивная анимированная рамка с золотыми монетами. Только для подписчиков Premium.',
    descriptionKk: 'Алтын тиындармен эксклюзивті анимациялық жақтау. Тек Premium жазылушылары үшін.',
    descriptionEn: 'Exclusive animated frame with gold coins. Premium subscribers only.',
    price: 0,
    icon: Crown,
    iconColor: 'text-yellow-400',
    bgGradient: 'from-yellow-900 to-amber-950',
    premiumOnly: true,
  },
  {
    id: 'great_khan',
    name: 'Обсидиан - Season 6',
    nameKk: 'Обсидиан - Season 6',
    nameEn: 'Obsidian - Season 6',
    nameUk: 'Обсидіан - Сезон 6',
    nameKa: 'ობსიდიანი - სეზონი 6',
    nameAz: 'Obsidian - Mövsüm 6',
    nameUz: 'Obsidian - Mavsum 6',
    namePl: 'Obsydian — Sezon 6',
    description: 'Награда за ранг Обсидиан в сезоне 6 «Казахский колорит».',
    descriptionKk: '6-маусымдағы Обсидиан дәрежесі үшін сыйлық.',
    descriptionEn: 'Reward for Obsidian rank in Season 6 «Kazakh Colorit».',
    price: 0,
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-yellow-400">
        <polygon points="12,2 15,9 22,9 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9 9,9" fill="rgba(218,165,32,0.3)" stroke="rgba(218,165,32,0.9)" />
        <circle cx="12" cy="12" r="2" fill="rgba(255,215,0,0.8)" />
      </svg>
    ),
    iconColor: 'text-yellow-400',
    bgGradient: 'from-yellow-900 to-amber-950',
    seasonOnly: true,
    seasonNumber: 6,
  },
  {
    id: 'obsidian_neon',
    name: 'Обсидиан - Season 7',
    nameKk: 'Обсидиан - Season 7',
    nameEn: 'Obsidian - Season 7',
    nameUk: 'Обсидіан - Сезон 7',
    nameKa: 'ობსიდიანი - სეზონი 7',
    nameAz: 'Obsidian - Mövsüm 7',
    nameUz: 'Obsidian - Mavsum 7',
    namePl: 'Obsydian — Sezon 7',
    description: 'Двойная орбита: два кольца вращаются в противоположные стороны. Награда за ранг Обсидиан в сезоне 7 «Неоновая эра».',
    descriptionKk: 'Қос орбита: екі сақина қарама-қарсы бағытта айналады. 7-маусымдағы Обсидиан дәрежесі үшін сыйлық.',
    descriptionEn: 'Dual orbit: two rings rotating in opposite directions. Reward for Obsidian rank in Season 7 «Neon Era».',
    price: 0,
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-cyan-400">
        <circle cx="12" cy="12" r="9" stroke="rgba(0,212,255,0.9)" />
        <circle cx="12" cy="12" r="6" stroke="rgba(0,80,255,0.85)" />
      </svg>
    ),
    iconColor: 'text-cyan-400',
    bgGradient: 'from-cyan-900 to-blue-950',
    seasonOnly: true,
    seasonNumber: 7,
  },
  {
    id: 'ruby_neon',
    name: 'Алый всплеск',
    nameKk: 'Қызыл жарқыл',
    nameEn: 'Crimson Flash',
    nameUk: 'Малиновий Спалах',
    nameKa: 'მეწამული ციმციმი',
    nameAz: 'Qırmızı Parıltı',
    nameUz: 'Qizil Chaqnash',
    namePl: 'Karmazynowy Błysk',
    description: 'Алая вспышка: кольцо заряжается от тёмно-красного до ярко-розового.',
    descriptionKk: 'Алқызыл жарқыл: сақина қою қызылдан ашық қызғылтқа дейін зарядталады.',
    descriptionEn: 'Crimson flash: ring charges from deep red to hot pink.',
    price: 1000,
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-red-400">
        <circle cx="12" cy="12" r="9" stroke="rgba(220,0,60,0.9)" />
        <circle cx="12" cy="12" r="6" stroke="rgba(255,80,160,0.75)" strokeDasharray="4 2" />
      </svg>
    ),
    iconColor: 'text-red-400',
    bgGradient: 'from-red-900 to-rose-950',
  },
  {
    id: 'amber_neon',
    name: 'Солнечная орбита',
    nameKk: 'Күн орбитасы',
    nameEn: 'Solar Orbit',
    nameUk: 'Сонячна Орбіта',
    nameKa: 'მზის ორბიტა',
    nameAz: 'Günəş Orbitası',
    nameUz: 'Quyosh Orbitasi',
    namePl: 'Słoneczna Orbita',
    description: 'Солнечная вспышка: два золотых кольца вращаются в одну сторону.',
    descriptionKk: 'Күн жарқылы: екі алтын сақина бір бағытта айналады.',
    descriptionEn: 'Solar flare: two golden rings rotating in the same direction.',
    price: 1000,
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-amber-400">
        <circle cx="12" cy="12" r="9" stroke="rgba(245,158,11,0.9)" />
        <circle cx="12" cy="12" r="6" stroke="rgba(251,146,60,0.8)" />
      </svg>
    ),
    iconColor: 'text-amber-400',
    bgGradient: 'from-amber-900 to-orange-950',
  },
  {
    id: 'zircon_neon',
    name: 'Хвост кометы',
    nameKk: 'Комета құйрығы',
    nameEn: 'Comet Trail',
    nameUk: 'Хвіст Комети',
    nameKa: 'კომეტის კვალი',
    nameAz: 'Kometa İzi',
    nameUz: 'Kometa Izi',
    namePl: 'Ślad Komety',
    description: 'Хвост кометы: оранжевое кольцо и фиолетовая дуга вращаются навстречу.',
    descriptionKk: 'Комета құйрығы: қызғылт сары сақина мен күлгін доға бір-біріне қарсы айналады.',
    descriptionEn: 'Comet trail: orange ring and purple arc rotating toward each other.',
    price: 1000,
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-orange-400">
        <circle cx="12" cy="12" r="9" stroke="rgba(249,115,22,0.9)" />
        <circle cx="12" cy="12" r="6" stroke="rgba(168,85,247,0.85)" />
      </svg>
    ),
    iconColor: 'text-orange-400',
    bgGradient: 'from-orange-900 to-purple-950',
  },
  {
    id: 'molten_lava',
    name: 'Обсидиан - Season 8',
    nameKk: 'Обсидиан - Season 8',
    nameEn: 'Obsidian - Season 8',
    nameUk: 'Обсидіан - Сезон 8',
    nameKa: 'ობსიდიანი - სეზონი 8',
    nameAz: 'Obsidian - Mövsüm 8',
    nameUz: 'Obsidian - Mavsum 8',
    namePl: 'Obsydian — Sezon 8',
    description: 'Расплавленная лава: трещины в обсидиане светятся расплавленным огнём. Награда за ранг Обсидиан в сезоне 8 «Апокалипсис».',
    descriptionKk: 'Балқыған лава: обсидиандағы жарықтар балқыған отпен жарық етеді. 8-маусымдағы Обсидиан дәрежесі үшін сыйлық.',
    descriptionEn: 'Molten lava: cracks in obsidian glow with liquid fire. Reward for Obsidian rank in Season 8 «Apocalypse».',
    price: 0,
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-orange-500">
        <circle cx="12" cy="12" r="9" stroke="rgba(30,10,5,0.9)" fill="rgba(10,5,5,0.8)" />
        <path d="M6 10 Q8 8 10 11 Q12 14 14 10 Q16 6 18 9" stroke="rgba(255,100,10,0.9)" strokeWidth="1.5" fill="none" />
        <path d="M5 14 Q7 12 9 15 Q11 18 13 14 Q15 10 17 13" stroke="rgba(255,60,0,0.7)" strokeWidth="1" fill="none" />
        <circle cx="12" cy="12" r="3" fill="rgba(255,80,0,0.3)" stroke="rgba(255,120,20,0.6)" strokeWidth="1" />
      </svg>
    ),
    iconColor: 'text-orange-500',
    bgGradient: 'from-red-950 to-orange-950',
    seasonOnly: true,
    seasonNumber: 8,
  },
  {
    id: 'oni_japanese',
    name: 'Обсидиан - Season 9',
    nameKk: 'Обсидиан - Season 9',
    nameEn: 'Obsidian - Season 9',
    nameUk: 'Обсидіан - Сезон 9',
    nameKa: 'ობსიდიანი - სეზონი 9',
    nameAz: 'Obsidian - Mövsüm 9',
    nameUz: 'Obsidian - Mavsum 9',
    namePl: 'Obsydian — Sezon 9',
    description: 'Японская рамка Они: красно-золотые узоры, пульсирующие рога демона. Награда за ранг Обсидиан в сезоне 9 «Японские мотивы».',
    descriptionKk: 'Жапондық Они жақтауы: қызыл-алтын өрнектер, демон мүйіздерінің пульсациясы. 9-маусымдағы Обсидиан дәрежесі үшін сыйлық.',
    descriptionEn: 'Japanese Oni frame: red-gold patterns, pulsing demon horns. Reward for Obsidian rank in Season 9 «Japanese Motifs».',
    price: 0,
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-red-400">
        <circle cx="12" cy="12" r="9" stroke="rgba(180,0,0,0.9)" fill="rgba(10,0,0,0.8)" />
        <path d="M9 7 L9 5 M15 7 L15 5" stroke="rgba(255,180,0,0.9)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="9" cy="12" r="1.5" fill="rgba(255,50,0,0.9)" />
        <circle cx="15" cy="12" r="1.5" fill="rgba(255,50,0,0.9)" />
        <path d="M9 16 Q12 18 15 16" stroke="rgba(255,180,0,0.8)" strokeWidth="1.5" fill="none" />
      </svg>
    ),
    iconColor: 'text-red-400',
    bgGradient: 'from-red-950 to-amber-950',
    seasonOnly: true,
    seasonNumber: 9,
  },
  {
    id: 'obsidian_underwater',
    name: 'Обсидиан - Season 1',
    nameKk: 'Обсидиан - Season 1',
    nameEn: 'Obsidian - Season 1',
    nameUk: 'Обсидіан - Сезон 1',
    nameKa: 'ობსიდიანი - სეზონი 1',
    nameAz: 'Obsidian - Mövsüm 1',
    nameUz: 'Obsidian - Mavsum 1',
    namePl: 'Obsydian — Sezon 1',
    description: 'Бездна океана: биолюминесцентные щупальца и тёмные воды. Награда за ранг Обсидиан в сезоне 1.',
    descriptionKk: 'Мұхит түбі: биолюминесцентті жыланбалықтар. 1-маусымдағы Обсидиан дәрежесі.',
    descriptionEn: 'Ocean abyss: bioluminescent tentacles. Reward for Obsidian rank in Season 1.',
    price: 0,
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-teal-400">
        <circle cx="12" cy="12" r="9" stroke="rgba(0,200,180,0.9)" strokeWidth="1.5" fill="rgba(0,20,30,0.8)" />
        <path d="M6 12 Q9 8 12 12 Q15 16 18 12" stroke="rgba(0,200,180,0.85)" strokeWidth="1.2" fill="none" />
        <circle cx="8" cy="10" r="1" fill="rgba(100,255,240,0.9)" />
        <circle cx="16" cy="14" r="1" fill="rgba(100,255,240,0.9)" />
      </svg>
    ),
    iconColor: 'text-teal-400',
    bgGradient: 'from-teal-950 to-cyan-950',
    seasonOnly: true,
    seasonNumber: 1,
  },
  {
    id: 'obsidian_egyptian',
    name: 'Обсидиан - Season 2',
    nameKk: 'Обсидиан - Season 2',
    nameEn: 'Obsidian - Season 2',
    nameUk: 'Обсидіан - Сезон 2',
    nameKa: 'ობსიდიანი - სეზონი 2',
    nameAz: 'Obsidian - Mövsüm 2',
    nameUz: 'Obsidian - Mavsum 2',
    namePl: 'Obsydian — Sezon 2',
    description: 'Тёмная магия фараонов: золотые иероглифы. Награда за ранг Обсидиан в сезоне 2.',
    descriptionKk: 'Фараондардың қара сиқыры. 2-маусымдағы Обсидиан дәрежесі.',
    descriptionEn: 'Dark pharaoh magic: golden hieroglyphs. Reward for Obsidian rank in Season 2.',
    price: 0,
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-amber-400">
        <circle cx="12" cy="12" r="9" stroke="rgba(200,160,0,0.9)" strokeWidth="1.5" fill="rgba(20,10,0,0.8)" />
        <ellipse cx="12" cy="10" rx="4" ry="2.5" fill="none" stroke="rgba(255,200,0,0.85)" strokeWidth="1" />
        <circle cx="12" cy="10" r="1.2" fill="rgba(255,180,0,0.95)" />
      </svg>
    ),
    iconColor: 'text-amber-400',
    bgGradient: 'from-amber-950 to-yellow-950',
    seasonOnly: true,
    seasonNumber: 2,
  },
  {
    id: 'obsidian_pirate',
    name: 'Обсидиан - Season 3',
    nameKk: 'Обсидиан - Season 3',
    nameEn: 'Obsidian - Season 3',
    nameUk: 'Обсидіан - Сезон 3',
    nameKa: 'ობსიდიანი - სეზონი 3',
    nameAz: 'Obsidian - Mövsüm 3',
    nameUz: 'Obsidian - Mavsum 3',
    namePl: 'Obsydian — Sezon 3',
    description: 'Призрачный шторм: молнии и череп. Награда за ранг Обсидиан в сезоне 3.',
    descriptionKk: 'Елес дауылы: найзағайлар мен бас сүйек. 3-маусымдағы Обсидиан дәрежесі.',
    descriptionEn: 'Ghost storm: lightning and skull. Reward for Obsidian rank in Season 3.',
    price: 0,
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-blue-300">
        <circle cx="12" cy="12" r="9" stroke="rgba(0,80,200,0.9)" strokeWidth="1.5" fill="rgba(0,5,20,0.8)" />
        <circle cx="12" cy="10" r="3" fill="none" stroke="rgba(180,220,255,0.85)" strokeWidth="1" />
        <circle cx="10" cy="9.5" r="0.8" fill="rgba(180,220,255,0.9)" />
        <circle cx="14" cy="9.5" r="0.8" fill="rgba(180,220,255,0.9)" />
      </svg>
    ),
    iconColor: 'text-blue-300',
    bgGradient: 'from-blue-950 to-indigo-950',
    seasonOnly: true,
    seasonNumber: 3,
  },
  {
    id: 'obsidian_norse',
    name: 'Обсидиан - Season 4',
    nameKk: 'Обсидиан - Season 4',
    nameEn: 'Obsidian - Season 4',
    nameUk: 'Обсидіан - Сезон 4',
    nameKa: 'ობსიდიანი - სეზონი 4',
    nameAz: 'Obsidian - Mövsüm 4',
    nameUz: 'Obsidian - Mavsum 4',
    namePl: 'Obsydian — Sezon 4',
    description: 'Руны Иггдрасиля: аврора и молот Тора. Награда за ранг Обсидиан в сезоне 4.',
    descriptionKk: 'Иггдрасиль рундары. 4-маусымдағы Обсидиан дәрежесі.',
    descriptionEn: 'Yggdrasil runes: aurora and Mjolnir. Reward for Obsidian rank in Season 4.',
    price: 0,
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-purple-400">
        <circle cx="12" cy="12" r="9" stroke="rgba(140,60,220,0.9)" strokeWidth="1.5" fill="rgba(10,0,20,0.8)" />
        <rect x="9" y="5" width="6" height="5" rx="1" fill="rgba(180,100,255,0.85)" />
        <rect x="11" y="10" width="2" height="7" rx="0.5" fill="rgba(140,80,220,0.8)" />
        <rect x="8" y="13" width="8" height="1.5" rx="0.5" fill="rgba(100,60,180,0.75)" />
      </svg>
    ),
    iconColor: 'text-purple-400',
    bgGradient: 'from-purple-950 to-violet-950',
    seasonOnly: true,
    seasonNumber: 4,
  },
  {
    id: 'obsidian_space',
    name: 'Обсидиан - Season 5',
    nameKk: 'Обсидиан - Season 5',
    nameEn: 'Obsidian - Season 5',
    nameUk: 'Обсидіан - Сезон 5',
    nameKa: 'ობსიდიანი - სეზონი 5',
    nameAz: 'Obsidian - Mövsüm 5',
    nameUz: 'Obsidian - Mavsum 5',
    namePl: 'Obsydian — Sezon 5',
    description: 'Чёрная дыра: галактическая спираль и сверхнова. Награда за ранг Обсидиан в сезоне 5.',
    descriptionKk: 'Қара тесік: галактикалық спираль. 5-маусымдағы Обсидиан дәрежесі.',
    descriptionEn: 'Black hole: galactic spiral and supernova. Reward for Obsidian rank in Season 5.',
    price: 0,
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-purple-300">
        <circle cx="12" cy="12" r="9" stroke="rgba(100,0,200,0.9)" strokeWidth="1.5" fill="rgba(5,0,15,0.8)" />
        <circle cx="12" cy="12" r="3" fill="rgba(60,0,120,0.9)" stroke="rgba(200,100,255,0.8)" strokeWidth="0.8" />
        <circle cx="7" cy="8" r="0.8" fill="rgba(200,150,255,0.9)" />
        <circle cx="17" cy="9" r="0.6" fill="rgba(150,200,255,0.9)" />
      </svg>
    ),
    iconColor: 'text-purple-300',
    bgGradient: 'from-purple-950 to-indigo-950',
    seasonOnly: true,
    seasonNumber: 5,
  },
  {
    id: 'obsidian_cyberpunk',
    name: 'Обсидиан - Season 10',
    nameKk: 'Обсидиан - Season 10',
    nameEn: 'Obsidian - Season 10',
    nameUk: 'Обсидіан - Сезон 10',
    nameKa: 'ობსიდიანი - სეზონი 10',
    nameAz: 'Obsidian - Mövsüm 10',
    nameUz: 'Obsidian - Mavsum 10',
    namePl: 'Obsydian — Sezon 10',
    description: 'Void circuit: неоновый глитч и матричный дождь. Награда за ранг Обсидиан в сезоне 10.',
    descriptionKk: 'Void circuit: неон глитч пен матрица. 10-маусымдағы Обсидиан дәрежесі.',
    descriptionEn: 'Void circuit: neon glitch and matrix rain. Reward for Obsidian rank in Season 10.',
    price: 0,
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-green-400">
        <circle cx="12" cy="12" r="9" stroke="rgba(0,255,180,0.9)" strokeWidth="1.5" fill="rgba(0,10,8,0.8)" />
        <rect x="8" y="8" width="8" height="8" rx="1" fill="none" stroke="rgba(0,255,180,0.7)" strokeWidth="0.8" />
        <rect x="10" y="10" width="4" height="4" rx="0.5" fill="rgba(255,0,180,0.6)" stroke="rgba(255,0,180,0.8)" strokeWidth="0.5" />
      </svg>
    ),
    iconColor: 'text-green-400',
    bgGradient: 'from-green-950 to-cyan-950',
    seasonOnly: true,
    seasonNumber: 10,
  },
  {
    id: 'obsidian_hiphop',
    name: 'Обсидиан - Season 11',
    nameKk: 'Обсидиан - Season 11',
    nameEn: 'Obsidian - Season 11',
    nameUk: 'Обсидіан - Сезон 11',
    nameKa: 'ობსიდიანი - სეზონი 11',
    nameAz: 'Obsidian - Mövsüm 11',
    nameUz: 'Obsidian - Mavsum 11',
    namePl: 'Obsydian — Sezon 11',
    description: 'Золотая цепь: винил и beat wave. Награда за ранг Обсидиан в сезоне 11.',
    descriptionKk: 'Алтын тізбек: винил ойықтары. 11-маусымдағы Обсидиан дәрежесі.',
    descriptionEn: 'Gold chain: vinyl grooves and beat wave. Reward for Obsidian rank in Season 11.',
    price: 0,
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-yellow-400">
        <circle cx="12" cy="12" r="9" stroke="rgba(200,150,0,0.9)" strokeWidth="1.5" fill="rgba(10,5,0,0.8)" />
        <circle cx="12" cy="12" r="4" fill="none" stroke="rgba(255,200,0,0.7)" strokeWidth="0.8" strokeDasharray="2 1" />
        <circle cx="12" cy="12" r="1.5" fill="rgba(255,220,0,0.9)" />
      </svg>
    ),
    iconColor: 'text-yellow-400',
    bgGradient: 'from-yellow-950 to-amber-950',
    seasonOnly: true,
    seasonNumber: 11,
  },
  {
    id: 'obsidian_angels_demons',
    name: 'Обсидиан - Season 12',
    nameKk: 'Обсидиан - Season 12',
    nameEn: 'Obsidian - Season 12',
    nameUk: 'Обсидіан - Сезон 12',
    nameKa: 'ობსიდიანი - სეზონი 12',
    nameAz: 'Obsidian - Mövsüm 12',
    nameUz: 'Obsidian - Mavsum 12',
    namePl: 'Obsydian — Sezon 12',
    description: 'Двойственность: крылья ангела и адский огонь. Награда за ранг Обсидиан в сезоне 12.',
    descriptionKk: 'Қосарлылық: періште қанаттары мен тозақ оты. 12-маусымдағы Обсидиан дәрежесі.',
    descriptionEn: 'Duality: angel wings and hellfire. Reward for Obsidian rank in Season 12.',
    price: 0,
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-purple-300">
        <circle cx="12" cy="12" r="9" stroke="rgba(180,120,255,0.9)" strokeWidth="1.5" fill="rgba(10,0,15,0.8)" />
        <path d="M12 4 Q8 7 6 12" stroke="rgba(255,220,100,0.8)" strokeWidth="1" fill="none" />
        <path d="M12 4 Q16 7 18 12" stroke="rgba(220,0,60,0.8)" strokeWidth="1" fill="none" />
        <ellipse cx="12" cy="4" rx="3" ry="1" fill="none" stroke="rgba(255,220,100,0.7)" strokeWidth="0.8" />
      </svg>
    ),
    iconColor: 'text-purple-300',
    bgGradient: 'from-purple-950 to-red-950',
    seasonOnly: true,
    seasonNumber: 12,
  },
] as const;
