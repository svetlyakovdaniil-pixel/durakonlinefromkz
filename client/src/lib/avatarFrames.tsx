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
    descriptionUk: 'Реалістична анімація вогню навколо аватарки',
    descriptionKa: 'რეალური ცეცხლის ანიმაცია ავატარის გარშემო',
    descriptionAz: 'Avatar ətrafında realıstık od animasiyası',
    descriptionUz: 'Avatar atrofida realistik olov animatsiyasi',
    descriptionPl: 'Realistyczna animacja ognia wokół awatara',
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
    descriptionUk: 'Яскраве неонове свічіння з переливами кольорів',
    descriptionKa: 'ნათელი ნეონური განათება ფერის გადასვლებით',
    descriptionAz: 'Rəng keçidləri ilə parıltılı neon işığı',
    descriptionUz: 'Rang o\'tishlari bilan yorqin neon yog\'dusi',
    descriptionPl: 'Jasna poświata neonowa z przejściami kolorów',
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
    descriptionUk: 'Електричні блискавки та іскри навколо аватарки',
    descriptionKa: 'ელექტროული მეხითერი და ნაპიალები ავატარის გარშემო',
    descriptionAz: 'Avatar ətrafında elektrik ildirimi və qığılcımlar',
    descriptionUz: 'Avatar atrofida elektr chaqmoqlari va uchqunlar',
    descriptionPl: 'Elektryczne błyskawice i iskry wokół awatara',
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
    descriptionUk: 'Крижані кристали та сніжинки навколо аватарки',
    descriptionKa: 'ყინულის კრისტალები და სნეგის ფარჩები ავატარის გარშემო',
    descriptionAz: 'Avatar ətrafında buz kristalları və qar lopaları',
    descriptionUz: 'Avatar atrofida muz kristallari va qor parchalar',
    descriptionPl: 'Krysztaly lodu i płatki śniegu wokół awatara',
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
    descriptionUk: 'Ексклюзивна анімована рамка з золотими монетами. Тільки для підписників Premium.',
    descriptionKa: 'ექსკლუზიური ანიმირებული ჩარჩო ოქროს მონეტებით. მხოლოდ Premium გამოწერებისთვის.',
    descriptionAz: 'Qızıl sikklərlə eksklüziv animasiyali çərçivə. Yalnız Premium abunəçiləri üçün.',
    descriptionUz: 'Oltin tangalar bilan eksklyuziv animatsiyali ramka. Faqat Premium obunachilari uchun.',
    descriptionPl: 'Ekskluzywna animowana ramka ze złotymi monetami. Tylko dla subskrybentów Premium.',
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
    descriptionUk: 'Нагорода за ранг Обсидіан у сезоні 6 «Казахський колорит».',
    descriptionKa: 'ჯილდო ობსიდიანის რანგისთვის სეზონ 6-ში «ყაზახური კოლორიტი».',
    descriptionAz: 'Mövsüm 6 «Qazax Rəngləri»ndə Obsidian rütbəsi üçün mükafat.',
    descriptionUz: 'Mavsum 6 «Qozoq Ranglari»da Obsidian darajasi uchun mukofot.',
    descriptionPl: 'Nagroda za rangę Obsydian w sezonie 6 «Kazachskie barwy».',
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
    descriptionUk: 'Подвійна орбіта: два кільця обертаються в протилежні боки. Нагорода за ранг Обсидіан у сезоні 7 «Неонова ера».',
    descriptionKa: 'ალმასისფერი ციმციმი: რგოლი მუქი წითლიდან ვარდისფრამდე იტენება.',
    descriptionAz: 'Qırmızı parıltı: halqa tünd qırmızıdan parlaq çəhrayıya şarj olunur.',
    descriptionUz: 'Qizil chaqnash: halqa to\'q qizildan yorqin pushtigacha zaryadlanadi.',
    descriptionPl: 'Karmazynowy puls: pierścień ładuje się od głębokiej czerwieni do gorącego różu.',
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
    descriptionUk: 'Алий спалах: кільце заряджається від темно-червоного до яскраво-рожевого.',
    descriptionKa: 'მზის ციმციმი: ორი ოქროს რგოლი ერთი მიმართულებით ბრუნავს.',
    descriptionAz: 'Günəş parıltısı: iki qızıl halqa eyni istiqamətdə fırlanır.',
    descriptionUz: 'Quyosh alovi: ikki oltin halqa bir yo\'nalishda aylanadi.',
    descriptionPl: 'Rozbłysk słoneczny: dwa złote pierścienie obracają się w tym samym kierunku.',
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
    descriptionUk: 'Сонячний спалах: два золоті кільця обертаються в один бік.',
    descriptionKa: 'კომეტის კვალი: ნარინჯისფერი რგოლი და მეწამული რკალი ერთმანეთისკენ ბრუნავს.',
    descriptionAz: 'Kometa izi: narıncı halqa və bənövşəyi qövs bir-birinə doğru fırlanır.',
    descriptionUz: 'Kometa izi: to\'q sariq halqa va binafsha yoy bir-biriga qarab aylanadi.',
    descriptionPl: 'Ślad komety: pomarańczowy pierścień i fioletowy łuk obracają się ku sobie.',
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
    descriptionUk: 'Хвіст комети: помаранчеве кільце і фіолетова дуга обертаються назустріч.',
    descriptionKa: 'ცირკონის ნეონი: ლურჯ-მწვანე ნაპიალები ავატარის გარშემო.',
    descriptionAz: 'Sirkon neon: mavi-yaşıl qığılcımlar avatarın ətrafında.',
    descriptionUz: 'Sirkon neon: ko\'k-yashil uchqunlar avatar atrofida.',
    descriptionPl: 'Cyrkon neon: niebiesko-zielone iskry wokół awatara.',
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
    descriptionUk: 'Розплавлена лава: тріщини в обсидіані світяться розплавленим вогнем. Нагорода за ранг Обсидіан у сезоні 8 «Апокаліпсис».',
    descriptionKa: 'გამდნარი ლავა: ობსიდიანის ბზარები გამდნარი ცეცხლით ანათებს. ჯილდო ობსიდიანის რანგისთვის სეზონ 8-ში «აპოკალიფსი».',
    descriptionAz: 'Ərimiş lava: obsidiandakı çatlar ərimiş odla parıldayır. Mövsüm 8 «Apokalipsis»də Obsidian rütbəsi üçün mükafat.',
    descriptionUz: 'Eritilgan lava: obsidiandagi yoriqlar eritilgan olov bilan yonadi. Mavsum 8 «Apokalipsis»da Obsidian darajasi uchun mukofot.',
    descriptionPl: 'Stopiona lawa: pęknięcia w obsydianie świecą stopionym ogniem. Nagroda za rangę Obsydian w sezonie 8 «Apokalipsa».',
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
    descriptionUk: 'Японська рамка Оні: червоно-золоті візерунки, пульсуючі роги демона. Нагорода за ранг Обсидіан у сезоні 9 «Японські мотиви».',
    descriptionKa: 'იაპონური ონი ჩარჩო: წითელ-ოქროს ნახატები, დემონის რქების პულსაცია. ჯილდო ობსიდიანის რანგისთვის სეზონ 9-ში «იაპონური მოტივები».',
    descriptionAz: 'Yapon Oni çərçivəsi: qırmızı-qızıl naxışlar, demon buynuzlarının döyüntüsü. Mövsüm 9 «Yapon Motivləri»ndə Obsidian rütbəsi üçün mükafat.',
    descriptionUz: 'Yapon Oni ramkasi: qizil-oltin naqshlar, jin shoxlarining pulsatsiyasi. Mavsum 9 «Yapon Motivlari»da Obsidian darajasi uchun mukofot.',
    descriptionPl: 'Japońska ramka Oni: czerwono-złote wzory, pulsujące rogi demona. Nagroda za rangę Obsydian w sezonie 9 «Japońskie motywy».',
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
    descriptionUk: 'Безодня океану: біолюмінесцентні щупальця і темні води. Нагорода за ранг Обсидіан у сезоні 1.',
    descriptionKa: 'ოკეანის უფსკრული: ბიოლუმინესცენტური მაცივრები. ჯილდო ობსიდიანის რანგისთვის სეზონ 1-ში.',
    descriptionAz: 'Okean dibi: biolüminesent çadırlar. Mövsüm 1-də Obsidian rütbəsi üçün mükafat.',
    descriptionUz: 'Okean tubsizligi: biolüminesent tentakulalar. Mavsum 1-da Obsidian darajasi uchun mukofot.',
    descriptionPl: 'Otchłań oceanu: bioluminescencyjne macki. Nagroda za rangę Obsydian w sezonie 1.',
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
    descriptionUk: 'Темна магія фараонів: золоті ієрогліфи. Нагорода за ранг Обсидіан у сезоні 2.',
    descriptionKa: 'ფარაონების შავი მაგია: ოქროს იეროგლიფები. ჯილდო ობსიდიანის რანგისთვის სეზონ 2-ში.',
    descriptionAz: 'Fironların qaranlıq sehri: qızıl heroqliflər. Mövsüm 2-də Obsidian rütbəsi üçün mükafat.',
    descriptionUz: 'Fir\'avnlarning qora sehri: oltin iyerogliflar. Mavsum 2-da Obsidian darajasi uchun mukofot.',
    descriptionPl: 'Czarna magia faraonów: złote hieroglify. Nagroda za rangę Obsydian w sezonie 2.',
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
    descriptionUk: 'Примарний шторм: блискавки і череп. Нагорода за ранг Обсидіан у сезоні 3.',
    descriptionKa: 'მოჩვენების ქარიშხალი: ელვები და თავის ქალა. ჯილდო ობსიდიანის რანგისთვის სეზონ 3-ში.',
    descriptionAz: 'Xəyal fırtınası: ildırımlar və kəllə. Mövsüm 3-də Obsidian rütbəsi üçün mükafat.',
    descriptionUz: 'Arvoh bo\'roni: chaqmoqlar va bosh suyak. Mavsum 3-da Obsidian darajasi uchun mukofot.',
    descriptionPl: 'Widmowa burza: pioruny i czaszka. Nagroda za rangę Obsydian w sezonie 3.',
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
    descriptionUk: 'Руни Іґґдрасіля: аврора і молот Тора. Нагорода за ранг Обсидіан у сезоні 4.',
    descriptionKa: 'იგდრასილის რუნები: ავრორა და თორის ჩაქუჩი. ჯილდო ობსიდიანის რანგისთვის სეზონ 4-ში.',
    descriptionAz: 'Yggdrasil runları: aurora və Tor çəkici. Mövsüm 4-də Obsidian rütbəsi üçün mükafat.',
    descriptionUz: 'Yggdrasil runaları: aurora va Tor bolg\'isi. Mavsum 4-da Obsidian darajasi uchun mukofot.',
    descriptionPl: 'Runy Yggdrasilu: zorza i Mjolnir. Nagroda za rangę Obsydian w sezonie 4.',
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
    descriptionUk: 'Чорна діра: галактична спіраль і наднова. Нагорода за ранг Обсидіан у сезоні 5.',
    descriptionKa: 'შავი ხვრელი: გალაქტიკური სპირალი და სუპერნოვა. ჯილდო ობსიდიანის რანგისთვის სეზონ 5-ში.',
    descriptionAz: 'Qara dəlik: qalaktik spiral və supernova. Mövsüm 5-də Obsidian rütbəsi üçün mükafat.',
    descriptionUz: 'Qora tuynuk: galaktik spiral va supernova. Mavsum 5-da Obsidian darajasi uchun mukofot.',
    descriptionPl: 'Czarna dziura: galaktyczna spirala i supernowa. Nagroda za rangę Obsydian w sezonie 5.',
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
    descriptionUk: 'Void circuit: неоновий ґліч і матричний дощ. Нагорода за ранг Обсидіан у сезоні 10.',
    descriptionKa: 'Void circuit: ნეონური გლიჩი და მატრიქსის წვიმა. ჯილდო ობსიდიანის რანგისთვის სეზონ 10-ში.',
    descriptionAz: 'Void circuit: neon glitch və matris yağışı. Mövsüm 10-da Obsidian rütbəsi üçün mükafat.',
    descriptionUz: 'Void circuit: neon glitch va matritsa yomg\'iri. Mavsum 10-da Obsidian darajasi uchun mukofot.',
    descriptionPl: 'Void circuit: neonowy glitch i deszcz matrycy. Nagroda za rangę Obsydian w sezonie 10.',
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
    descriptionUk: 'Золотий ланцюг: вінілові борозни і beat wave. Нагорода за ранг Обсидіан у сезоні 11.',
    descriptionKa: 'ოქროს ჯაჭვი: ვინილის ღარები. ჯილდო ობსიდიანის რანგისთვის სეზონ 11-ში.',
    descriptionAz: 'Qızıl zəncir: vinil yivləri. Mövsüm 11-də Obsidian rütbəsi üçün mükafat.',
    descriptionUz: 'Oltin zanjir: vinil izlari. Mavsum 11-da Obsidian darajasi uchun mukofot.',
    descriptionPl: 'Złoty łańcuch: rowki winylowe. Nagroda za rangę Obsydian w sezonie 11.',
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
    descriptionUk: 'Двоїстість: крила янгола і пекельний вогонь. Нагорода за ранг Обсидіан у сезоні 12.',
    descriptionKa: 'ორმაგობა: ანგელოზის ფრთები და ჯოჯოხეთის ცეცხლი. ჯილდო ობსიდიანის რანგისთვის სეზონ 12-ში.',
    descriptionAz: 'İkililik: mələk qanadları və cəhənnəm odu. Mövsüm 12-də Obsidian rütbəsi üçün mükafat.',
    descriptionUz: 'Ikkilik: farishta qanotlari va do\'zax olovi. Mavsum 12-da Obsidian darajasi uchun mukofot.',
    descriptionPl: 'Dualność: skrzydła anioła i ogień piekielny. Nagroda za rangę Obsydian w sezonie 12.',
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
