import { useState, useRef, useEffect, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { X, ShoppingCart, Check, AlertTriangle, Flame, Zap, Snowflake, Music, Play, Square, Eye, Crown } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useMusicContext } from '@/contexts/MusicContext';
import { CARD_BACK_URL, CARD_IMAGES, CARD_BACK_CUSTOM_URL, CARD_IMAGES_CUSTOM, TABLE_STYLES, type TableStyle } from '@shared/cardAssets';
import { getCurrentSeasonNumber } from '../../../shared/seasons';
import { AVATAR_OPTIONS, type AvatarOption } from '@shared/avatars';
import { FireFrame } from './FireFrame';
import { NeonFrame } from './NeonFrame';
import { LightningFrame } from './LightningFrame';
import { IceFrame } from './IceFrame';
import { PremiumFrame } from './PremiumFrame';
import { GreatKhanFrame } from './GreatKhanFrame';
import { ObsidianNeonFrame } from './ObsidianNeonFrame';
import { RubyNeonFrame } from './RubyNeonFrame';
import { AmberNeonFrame } from './AmberNeonFrame';
import { ZirconNeonFrame } from './ZirconNeonFrame';
import { MoltenLavaFrame } from './MoltenLavaFrame';
import { OniJapaneseFrame } from './OniJapaneseFrame';
import { ObsidianUnderwaterFrame } from './ObsidianUnderwaterFrame';
import { ObsidianEgyptianFrame } from './ObsidianEgyptianFrame';
import { ObsidianPirateFrame } from './ObsidianPirateFrame';
import { ObsidianNorseFrame } from './ObsidianNorseFrame';
import { ObsidianSpaceFrame } from './ObsidianSpaceFrame';
import { ObsidianCyberpunkFrame } from './ObsidianCyberpunkFrame';
import { ObsidianHiphopFrame } from './ObsidianHiphopFrame';
import { ObsidianAngelsDemonsFrame } from './ObsidianAngelsDemonsFrame';

const CUSTOM_DECK_BACK = CARD_BACK_CUSTOM_URL;
const KING_SPADES = CARD_IMAGES_CUSTOM['K-spades'];
// Batyry deck (classic) assets for shop display
const CLASSIC_DECK_BACK = CARD_BACK_URL;
const CLASSIC_KING_SPADES = CARD_IMAGES['K-spades'];
const TENGE_ICON = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/tenge_9aefd1b7.png';

const CLASSIC_DECK_PRICE = 25; // Батыры великой степи — платная колода

/** Available avatar frames for purchase */
export const AVATAR_FRAMES = [
  {
    id: 'fire',
    name: 'Огненная рамка',
    nameKk: 'Отты жақтау',
    nameEn: 'Fire Frame',
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

/** Renders the correct frame component for a given frame id */
function FramePreview({ frameId, size, children }: { frameId: string; size: number; children: React.ReactNode }) {
  switch (frameId) {
    case 'fire':
      return <FireFrame size={size} active={true}>{children}</FireFrame>;
    case 'neon':
      return <NeonFrame size={size} active={true}>{children}</NeonFrame>;
    case 'lightning':
      return <LightningFrame size={size} active={true}>{children}</LightningFrame>;
    case 'ice':
      return <IceFrame size={size} active={true}>{children}</IceFrame>;
    case 'premium':
      return <PremiumFrame size={size} active={true}>{children}</PremiumFrame>;
    case 'great_khan':
      return <GreatKhanFrame size={size} active={true}>{children}</GreatKhanFrame>;
    case 'obsidian_neon':
      return <ObsidianNeonFrame size={size} active={true}>{children}</ObsidianNeonFrame>;
    case 'ruby_neon':
      return <RubyNeonFrame size={size} active={true}>{children}</RubyNeonFrame>;
    case 'amber_neon':
      return <AmberNeonFrame size={size} active={true}>{children}</AmberNeonFrame>;
    case 'zircon_neon':
      return <ZirconNeonFrame size={size} active={true}>{children}</ZirconNeonFrame>;
    case 'molten_lava':
      return <MoltenLavaFrame size={size} active={true}>{children}</MoltenLavaFrame>;
    case 'oni_japanese':
      return <OniJapaneseFrame size={size} active={true}>{children}</OniJapaneseFrame>;
    case 'obsidian_underwater':
      return <ObsidianUnderwaterFrame size={size} active={true}>{children}</ObsidianUnderwaterFrame>;
    case 'obsidian_egyptian':
      return <ObsidianEgyptianFrame size={size} active={true}>{children}</ObsidianEgyptianFrame>;
    case 'obsidian_pirate':
      return <ObsidianPirateFrame size={size} active={true}>{children}</ObsidianPirateFrame>;
    case 'obsidian_norse':
      return <ObsidianNorseFrame size={size} active={true}>{children}</ObsidianNorseFrame>;
    case 'obsidian_space':
      return <ObsidianSpaceFrame size={size} active={true}>{children}</ObsidianSpaceFrame>;
    case 'obsidian_cyberpunk':
      return <ObsidianCyberpunkFrame size={size} active={true}>{children}</ObsidianCyberpunkFrame>;
    case 'obsidian_hiphop':
      return <ObsidianHiphopFrame size={size} active={true}>{children}</ObsidianHiphopFrame>;
    case 'obsidian_angels_demons':
      return <ObsidianAngelsDemonsFrame size={size} active={true}>{children}</ObsidianAngelsDemonsFrame>;
    default:
      return <>{children}</>;
  }
}

interface ShopModalProps {
  open: boolean;
  onClose: () => void;
  currentTenge: number;
  currentShanyrak?: number;
  isPremium?: boolean;
  onPurchased?: () => void;
}

type ShopTab = 'decks' | 'tables' | 'frames' | 'avatars' | 'music';

interface ConfirmPurchase {
  type: 'deck' | 'table' | 'frame' | 'avatar' | 'playlist';
  id: string;
  name: string;
  price: number;
}

const SHANYRAK_ICON = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/shanyrak_96e91a49.png';

export default function ShopModal({ open, onClose, currentTenge, currentShanyrak = 0, isPremium = false, onPurchased }: ShopModalProps) {
  const [purchasing, setPurchasing] = useState(false);
  const { t, locale } = useTranslation();
  const music = useMusicContext();
  const wasMusicPlayingRef = useRef(false);
  const [activeTab, setActiveTab] = useState<ShopTab>('decks');
  const [confirmPurchase, setConfirmPurchase] = useState<ConfirmPurchase | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<AvatarOption | null>(null);
  // Preview audio state
  const [previewPlaylistId, setPreviewPlaylistId] = useState<number | null>(null);
  const [previewTimer, setPreviewTimer] = useState(0);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { data: ownedDecks = [], refetch: refetchOwned } = trpc.shop.ownedDecks.useQuery(undefined, { enabled: open });
  const { data: ownedTables = [], refetch: refetchOwnedTables } = trpc.shop.ownedTables.useQuery(undefined, { enabled: open });
  const { data: ownedFrames = [], refetch: refetchOwnedFrames } = trpc.shop.ownedFrames.useQuery(undefined, { enabled: open });
  const { data: ownedAvatars = [], refetch: refetchOwnedAvatars } = trpc.shop.ownedAvatars.useQuery(undefined, { enabled: open });
  const { data: priceOverrides = [] } = trpc.shopPrices.overrides.useQuery(undefined, { enabled: open });
  const { data: allPlaylists = [], refetch: refetchPlaylists } = trpc.playlists.list.useQuery(undefined, { enabled: open });
  const { data: ownedPlaylistIds = [], refetch: refetchOwnedPlaylists } = trpc.playlists.owned.useQuery(undefined, { enabled: open });
  const purchasePlaylistMutation = trpc.playlists.purchase.useMutation();
  const purchaseMutation = trpc.shop.purchaseDeck.useMutation();
  const purchaseTableMutation = trpc.shop.purchaseTable.useMutation();
  const purchaseFrameMutation = trpc.shop.purchaseFrame.useMutation();
  const purchaseAvatarMutation = trpc.shop.purchaseAvatar.useMutation();

  /** Get effective price considering admin overrides and premium discount */
  const getPrice = (itemType: string, itemId: string, defaultPrice: number): number => {
    const override = priceOverrides.find((o: any) => o.itemType === itemType && o.itemId === itemId);
    const base = (override && override.priceTenge !== null && override.priceTenge !== undefined) ? override.priceTenge : defaultPrice;
    // 5% discount for premium subscribers
    if (isPremium && base > 0) return Math.floor(base * 0.95);
    return base;
  };

  /** Check if item is available (not disabled by admin) */
  const isItemAvailable = (itemType: string, itemId: string): boolean => {
    const override = priceOverrides.find((o: any) => o.itemType === itemType && o.itemId === itemId);
    if (override) return override.isAvailable;
    return true;
  };

  const classicDeckPrice = getPrice('deck', 'classic', CLASSIC_DECK_PRICE);
  const isClassicOwned = ownedDecks.includes('classic');
  const canAffordClassic = currentTenge >= classicDeckPrice;

  // Preview audio functions
  const stopPreview = useCallback(() => {
    // Stop preview audio
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.removeEventListener('ended', stopPreview as any);
      previewAudioRef.current = null;
    }
    // Clear countdown timer
    if (previewIntervalRef.current) {
      clearInterval(previewIntervalRef.current);
      previewIntervalRef.current = null;
    }
    setPreviewPlaylistId(null);
    setPreviewTimer(0);
    // Resume background music if it was playing before preview started
    if (wasMusicPlayingRef.current) {
      wasMusicPlayingRef.current = false;
      music.resumeMusic();
    }
  }, [music]);

  const togglePreview = useCallback((playlistId: number, firstTrackUrl: string) => {
    // If this playlist is already previewing, stop it
    if (previewPlaylistId === playlistId) {
      stopPreview();
      return;
    }
    // If another playlist is previewing, stop it first (but keep wasMusicPlayingRef)
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.removeEventListener('ended', stopPreview as any);
      previewAudioRef.current = null;
    }
    if (previewIntervalRef.current) {
      clearInterval(previewIntervalRef.current);
      previewIntervalRef.current = null;
    }

    // If no preview was active before, check if background music is actually playing and pause it
    if (previewPlaylistId === null) {
      // First time starting preview — check if music is actually playing (not just enabled)
      wasMusicPlayingRef.current = music.isPlaying();
      if (wasMusicPlayingRef.current) {
        music.pauseMusic();
      }
    }
    // (If switching between previews, wasMusicPlayingRef is already set correctly)

    // Create and play preview audio
    const audio = new Audio(firstTrackUrl);
    audio.volume = 0.5;
    previewAudioRef.current = audio;
    setPreviewPlaylistId(playlistId);
    setPreviewTimer(30);
    audio.play().catch(() => {});

    // Auto-stop after 30 seconds
    let remaining = 30;
    previewIntervalRef.current = setInterval(() => {
      remaining--;
      setPreviewTimer(remaining);
      if (remaining <= 0) {
        stopPreview();
      }
    }, 1000);

    // Also stop when audio ends naturally (if track < 30s)
    audio.addEventListener('ended', () => stopPreview());
  }, [stopPreview, music, previewPlaylistId]);

  // Cleanup preview on unmount or close
  useEffect(() => {
    if (!open) stopPreview();
    return () => stopPreview();
  }, [open, stopPreview]);

  const executePurchase = async (item: ConfirmPurchase) => {
    setPurchasing(true);
    setConfirmPurchase(null);
    try {
      if (item.type === 'deck') {
        const result = await purchaseMutation.mutateAsync({ deckId: item.id, tengeCost: item.price });
        if (result.success) {
          toast.success(t('toast.purchaseSuccess'));
          refetchOwned();
          onPurchased?.();
        } else if (result.reason === 'already_owned') {
          toast.info(t('shop.owned'));
          refetchOwned();
        } else if (result.reason === 'insufficient_tenge') {
          toast.error(t('shop.notEnough'));
        } else {
          toast.error(t('common.error'));
        }
      } else if (item.type === 'table') {
        const result = await purchaseTableMutation.mutateAsync({ tableId: item.id, tengeCost: item.price });
        if (result.success) {
          toast.success(t('toast.purchaseSuccess'));
          refetchOwnedTables();
          onPurchased?.();
        } else if (result.reason === 'already_owned') {
          toast.info(t('shop.owned'));
          refetchOwnedTables();
        } else if (result.reason === 'insufficient_tenge') {
          toast.error(t('shop.notEnough'));
        } else {
          toast.error(t('common.error'));
        }
      } else if (item.type === 'frame') {
        const result = await purchaseFrameMutation.mutateAsync({ frameId: item.id, tengeCost: item.price });
        if (result.success) {
          toast.success(t('toast.purchaseSuccess'));
          refetchOwnedFrames();
          onPurchased?.();
        } else if (result.reason === 'already_owned') {
          toast.info(t('shop.owned'));
          refetchOwnedFrames();
        } else if (result.reason === 'insufficient_tenge') {
          toast.error(t('shop.notEnough'));
        } else {
          toast.error(t('common.error'));
        }
      } else if (item.type === 'avatar') {
        const result = await purchaseAvatarMutation.mutateAsync({ avatarId: item.id, tengeCost: item.price });
        if (result.success) {
          toast.success(t('toast.purchaseSuccess'));
          refetchOwnedAvatars();
          onPurchased?.();
        } else if (result.reason === 'already_owned') {
          toast.info(t('shop.owned'));
          refetchOwnedAvatars();
        } else if (result.reason === 'insufficient_tenge') {
          toast.error(t('shop.notEnough'));
        } else {
          toast.error(t('common.error'));
        }
      } else if (item.type === 'playlist') {
        const result = await purchasePlaylistMutation.mutateAsync({ playlistId: parseInt(item.id) });
        if (result.success) {
          toast.success(t('toast.purchaseSuccess'));
          refetchOwnedPlaylists();
          refetchPlaylists();
          onPurchased?.();
        } else if (result.reason === 'already_owned') {
          toast.info(t('shop.owned'));
          refetchOwnedPlaylists();
        } else if (result.reason === 'insufficient_shanyrak') {
          toast.error(locale === 'kk' ? 'Шаңырақ жеткіліксіз' : 'Недостаточно шаныраков');
        } else {
          toast.error(t('common.error'));
        }
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setPurchasing(false);
    }
  };

  if (!open) return null;

  const purchasableTables = (Object.entries(TABLE_STYLES) as [TableStyle, typeof TABLE_STYLES[TableStyle]][])
    .filter(([id]) => id !== 'classic');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-gradient-to-b from-[#1a2d45] to-[#0f1923] border border-amber-700/40 rounded-2xl shadow-2xl w-[calc(100vw-2rem)] max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-amber-700/20">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-amber-100">{t('shop.title')}</h2>
          </div>
          <button className="text-amber-200/50 hover:text-amber-100 p-1" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance */}
        <div className="px-5 py-3 bg-amber-900/10 border-b border-amber-700/10">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-amber-200/60">{t('shop.balance')}:</span>
            <span className="text-amber-100 font-bold">{currentTenge}</span>
            <img src={TENGE_ICON} alt="T" className="w-6 h-6 rounded-full object-cover aspect-square" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 sm:gap-0 border-b border-amber-700/20">
          {(['decks', 'tables', 'frames', 'avatars', 'music'] as const).map(tab => (
            <button
              key={tab}
              className={`flex-1 py-2.5 px-1 text-[10px] sm:text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-amber-100 border-b-2 border-amber-400 bg-amber-900/10'
                  : 'text-amber-200/50 hover:text-amber-200/70'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'decks' ? t('shop.decks') : tab === 'tables' ? t('shop.tables') : tab === 'frames' ? t('shop.frames') : tab === 'avatars' ? t('shop.avatars') : t('shop.music')}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 max-h-[50vh] overflow-y-auto">
          {activeTab === 'decks' && (
            <div className="space-y-4">
              {/* Товарищ Мырза — бесплатная колода */}
              <div className="bg-[#0f2035]/80 border border-amber-700/20 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-16 h-22 rounded-lg overflow-hidden border border-amber-600/30 shadow-lg">
                      <img src={CUSTOM_DECK_BACK} alt="Deck back" className="w-full h-full object-cover" />
                    </div>
                    <div className="w-16 h-22 rounded-lg overflow-hidden border border-amber-600/30 shadow-lg">
                      <img src={KING_SPADES} alt="King of Spades" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-amber-100 font-bold text-sm mb-1">{t('shop.customDeck')}</h3>
                    <p className="text-amber-200/50 text-xs mb-3">{t('shop.customDeckDesc')}</p>
                    <div className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
                      <Check className="w-4 h-4" /><span>{t('shop.free')}</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Батыры великой степи — платная колода */}
              <div className="bg-[#0f2035]/80 border border-amber-700/20 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-16 h-22 rounded-lg overflow-hidden border border-amber-600/30 shadow-lg">
                      <img src={CLASSIC_DECK_BACK} alt="Deck back" className="w-full h-full object-cover" />
                    </div>
                    <div className="w-16 h-22 rounded-lg overflow-hidden border border-amber-600/30 shadow-lg">
                      <img src={CLASSIC_KING_SPADES} alt="King of Spades" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-amber-100 font-bold text-sm mb-1">{t('shop.default')}</h3>
                    <p className="text-amber-200/50 text-xs mb-3">{t('shop.batyrDeckDesc')}</p>
                    {isClassicOwned ? (
                      <div className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
                        <Check className="w-4 h-4" /><span>{t('shop.purchased')}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Button
                          className="bg-amber-600 hover:bg-amber-500 text-white text-sm h-9 px-4"
                          onClick={() => setConfirmPurchase({ type: 'deck', id: 'classic', name: t('shop.default'), price: classicDeckPrice })}
                          disabled={purchasing || !canAffordClassic}
                        >
                          {purchasing ? '...' : t('shop.buy')}
                        </Button>
                        <div className="flex items-center gap-1">
                          <span className="text-amber-100 font-bold text-base">{classicDeckPrice}</span>
                          <img src={TENGE_ICON} alt="T" className="w-7 h-7 rounded-full object-cover aspect-square" />
                        </div>
                      </div>
                    )}
                    {!isClassicOwned && !canAffordClassic && <p className="text-red-400/80 text-xs mt-2">{t('shop.notEnough')}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tables' && (
            <div className="space-y-4">
              {purchasableTables.filter(([tableId]) => isItemAvailable('table', tableId)).map(([tableId, table]) => {
                const isOwned = ownedTables.includes(tableId);
                const effectivePrice = getPrice('table', tableId, table.price);
                const canAffordTable = currentTenge >= effectivePrice;
                return (
                  <div key={tableId} className="bg-[#0f2035]/80 border border-amber-700/20 rounded-xl p-4">
                    <div className="flex flex-col gap-3">
                      <div className="w-full h-36 rounded-lg overflow-hidden border border-amber-600/30 shadow-lg">
                        <img src={table.url} alt={table.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-amber-100 font-bold text-sm">{locale === 'kk' ? table.nameKk : locale === 'en' ? table.nameEn : table.name}</h3>
                        </div>
                        {isOwned ? (
                          <div className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
                            <Check className="w-4 h-4" /><span>{t('shop.purchased')}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Button className="bg-amber-600 hover:bg-amber-500 text-white text-sm h-9 px-4"
                              onClick={() => setConfirmPurchase({ type: 'table', id: tableId, name: locale === 'kk' ? table.nameKk : locale === 'en' ? table.nameEn : table.name, price: effectivePrice })}
                              disabled={purchasing || !canAffordTable}>{purchasing ? '...' : t('shop.buy')}</Button>
                            <div className="flex items-center gap-1">
                              <span className="text-amber-100 font-bold text-base">{effectivePrice}</span>
                              <img src={TENGE_ICON} alt="T" className="w-7 h-7 rounded-full object-cover aspect-square" />
                            </div>
                          </div>
                        )}
                      </div>
                      {!isOwned && !canAffordTable && <p className="text-red-400/80 text-xs">{t('shop.notEnough')}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'frames' && (
            <div className="space-y-4">
              {AVATAR_FRAMES.filter(frame => {
                const currentSeason = getCurrentSeasonNumber();
                // Season-only frames: only show if it's the CURRENT active season
                // (not past seasons, not future seasons)
                if ((frame as any).seasonOnly && (frame as any).seasonNumber) {
                  return (frame as any).seasonNumber === currentSeason;
                }
                return isItemAvailable('frame', frame.id);
              }).filter(frame => isItemAvailable('frame', frame.id)).map(frame => {
                const isPremiumFrame = (frame as any).premiumOnly === true;
                const isSeasonFrame = (frame as any).seasonOnly === true;
                const isOwned = ownedFrames.includes(frame.id) || (isPremiumFrame && isPremium);
                const effectivePrice = getPrice('frame', frame.id, frame.price);
                const canAffordFrame = currentTenge >= effectivePrice;
                const IconComp = frame.icon;
                return (
                  <div key={frame.id} className={`bg-[#0f2035]/80 border rounded-xl p-4 ${
                    isSeasonFrame ? 'border-yellow-500/50' : isPremiumFrame ? 'border-yellow-600/40' : 'border-amber-700/20'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className="shrink-0">
                        <FramePreview frameId={frame.id} size={64}>
                          <div className="w-[64px] h-[64px] rounded-full overflow-hidden border-2 border-amber-500/60">
                            <div className={`w-full h-full bg-gradient-to-br ${frame.bgGradient} flex items-center justify-center`}>
                              <IconComp className={`w-8 h-8 ${frame.iconColor}`} />
                            </div>
                          </div>
                        </FramePreview>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-amber-100 font-bold text-sm">
                            {locale === 'kk' ? frame.nameKk : locale === 'en' ? (frame as any).nameEn || frame.name : frame.name}
                          </h3>
                          {isPremiumFrame && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">PREMIUM</span>
                          )}
                          {isSeasonFrame && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">{locale === 'kk' ? 'МАУСЫМ' : locale === 'en' ? 'SEASON' : 'СЕЗОН'}</span>
                          )}
                        </div>
                        <p className="text-amber-200/50 text-xs mb-3">
                          {locale === 'kk' ? frame.descriptionKk : locale === 'en' ? (frame as any).descriptionEn || frame.description : frame.description}
                        </p>
                        {isSeasonFrame ? (
                          isOwned ? (
                            <div className="flex items-center gap-1.5 text-yellow-400 text-sm font-medium">
                              <Check className="w-4 h-4" />
                              <span>{locale === 'kk' ? 'Алынды' : locale === 'en' ? 'Earned' : 'Получена'}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-amber-200/50 text-xs">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-yellow-600/60">
                                <polygon points="12,2 15,9 22,9 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9 9,9" fill="rgba(218,165,32,0.2)" stroke="rgba(218,165,32,0.6)" />
                              </svg>
                              <span>{locale === 'kk' ? 'Маусымда Обсидиан дәрежесін алу қажет' : locale === 'en' ? 'Earn Obsidian rank at season end' : 'Получите ранг Обсидиан в конце сезона'}</span>
                            </div>
                          )
                        ) : isPremiumFrame ? (
                          isOwned ? (
                            <div className="flex items-center gap-1.5 text-yellow-400 text-sm font-medium">
                              <Crown className="w-4 h-4" />
                              <span>{locale === 'kk' ? 'Белсенді' : locale === 'en' ? 'Active with Premium' : 'Активна с Premium'}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-amber-200/50 text-xs">
                              <Crown className="w-4 h-4 text-yellow-600/60" />
                              <span>{locale === 'kk' ? 'Premium жазылымы қажет' : locale === 'en' ? 'Requires Premium subscription' : 'Требуется подписка Premium'}</span>
                            </div>
                          )
                        ) : isOwned ? (
                          <div className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
                            <Check className="w-4 h-4" /><span>{t('shop.purchased')}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Button className="bg-amber-600 hover:bg-amber-500 text-white text-sm h-9 px-4"
                              onClick={() => setConfirmPurchase({
                                type: 'frame', id: frame.id,
                                name: locale === 'kk' ? frame.nameKk : locale === 'en' ? (frame as any).nameEn || frame.name : frame.name,
                                price: effectivePrice,
                              })}
                              disabled={purchasing || !canAffordFrame}>{purchasing ? '...' : t('shop.buy')}</Button>
                            <div className="flex items-center gap-1">
                              <span className="text-amber-100 font-bold text-base">{effectivePrice}</span>
                              <img src={TENGE_ICON} alt="T" className="w-7 h-7 rounded-full object-cover aspect-square" />
                            </div>
                          </div>
                        )}
                        {!isPremiumFrame && !isOwned && !canAffordFrame && <p className="text-red-400/80 text-xs mt-2">{t('shop.notEnough')}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'avatars' && (
            <div className="space-y-4">
              {AVATAR_OPTIONS.filter(a => a.premium).filter(a => isItemAvailable('avatar', a.id)).map(avatar => {
                const isOwned = ownedAvatars.includes(avatar.id);
                const effectiveAvatarPrice = getPrice('avatar', avatar.id, avatar.price || 0);
                const canAffordAvatar = currentTenge >= effectiveAvatarPrice;
                const displayName = locale === 'kk' && avatar.nameKk ? avatar.nameKk : locale === 'en' && avatar.nameEn ? avatar.nameEn : avatar.name;
                return (
                  <div key={avatar.id} className="bg-[#0f2035]/80 border rounded-xl p-4 border-amber-700/20">
                    <div className="flex items-center gap-4">
                      <div className="shrink-0 relative group cursor-pointer" onClick={() => setPreviewAvatar(avatar)}>
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 shadow-lg border-cyan-500/60 shadow-cyan-500/20 transition-transform group-hover:scale-105">
                          <img src={avatar.url} alt={displayName} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute inset-0 w-20 h-20 rounded-full bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                        </div>
                        <div className="absolute -top-1 -right-1 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            PRO
                          </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-amber-100 font-bold text-sm mb-1">{displayName}</h3>
                        <p className="text-amber-200/50 text-xs mb-3">
                          {t('shop.premiumAvatar')}
                        </p>
                        {isOwned ? (
                          <div className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
                            <Check className="w-4 h-4" /><span>{t('shop.purchased')}</span>
                          </div>
                        ) : avatar.price === undefined ? (
                          // No price — referral reward only
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-amber-400/80 font-medium">
                              🎁 {locale === 'kk' ? '50 достық шақыру арқылы алыңыз' : locale === 'en' ? 'Invite 50 friends to unlock' : 'Награда за 50 приглашений'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Button className="bg-amber-600 hover:bg-amber-500 text-white text-sm h-9 px-4"
                              onClick={() => setConfirmPurchase({
                                type: 'avatar', id: avatar.id,
                                name: displayName,
                                price: effectiveAvatarPrice,
                              })}
                              disabled={purchasing || !canAffordAvatar}>{purchasing ? '...' : t('shop.buy')}</Button>
                            <div className="flex items-center gap-1">
                              <span className="text-amber-100 font-bold text-base">{effectiveAvatarPrice}</span>
                              <img src={TENGE_ICON} alt="T" className="w-7 h-7 rounded-full object-cover aspect-square" />
                            </div>
                          </div>
                        )}
                        {!isOwned && avatar.price !== undefined && !canAffordAvatar && <p className="text-red-400/80 text-xs mt-2">{t('shop.notEnough')}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'music' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <Music className="w-5 h-5 text-amber-400" />
                  <h3 className="text-amber-100 font-bold text-sm">
                  {t('shop.music')}
                </h3>
              </div>
              {allPlaylists.map((playlist: any) => {
                const isOwned = ownedPlaylistIds.includes(playlist.id);
                const isFree = playlist.isDefault || playlist.priceShanyrak === 0;
                const canAffordPlaylist = currentShanyrak >= playlist.priceShanyrak;
                const isPreviewPlaying = previewPlaylistId === playlist.id;
                const trackCount = playlist.tracks?.length || 0;
                const displayName = locale === 'kk' && playlist.nameKk ? playlist.nameKk : locale === 'en' && playlist.nameEn ? playlist.nameEn : playlist.name;
                const displayDesc = locale === 'kk' && playlist.descriptionKk ? playlist.descriptionKk : locale === 'en' && playlist.descriptionEn ? playlist.descriptionEn : (playlist.description || '');
                return (
                  <div key={playlist.id} className="bg-[#0f2035]/80 border border-amber-700/20 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                        playlist.isDefault
                          ? 'bg-gradient-to-br from-amber-600 to-amber-800'
                          : 'bg-gradient-to-br from-purple-600 to-pink-800'
                      }`}>
                        <Music className="w-6 h-6 text-amber-100" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-amber-100 font-bold text-sm">{displayName}</h4>
                        <p className="text-amber-200/50 text-xs">{trackCount} {locale === 'kk' ? 'трек' : locale === 'en' ? 'tracks' : 'треков'}</p>
                        {displayDesc && <p className="text-amber-200/40 text-[10px] mt-0.5">{displayDesc}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {/* Preview button */}
                      {trackCount > 0 && (
                        <button
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isPreviewPlaying
                              ? 'bg-red-600/80 text-white hover:bg-red-500'
                              : 'bg-amber-700/30 text-amber-200 hover:bg-amber-700/50'
                          }`}
                          onClick={() => togglePreview(playlist.id, playlist.tracks[0])}
                        >
                          {isPreviewPlaying ? (
                            <><Square className="w-3 h-3" /> {t('shop.stopBtn')} ({previewTimer}s)</>
                          ) : (
                            <><Play className="w-3 h-3" /> {t('shop.listenBtn')}</>
                          )}
                        </button>
                      )}
                      <div className="flex-1" />
                      {/* Purchase / Owned status */}
                      {isFree || isOwned ? (
                        <div className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
                          <Check className="w-4 h-4" />
                          <span>{isFree ? t('shop.free') : t('shop.purchased')}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            className="bg-amber-600 hover:bg-amber-500 text-white text-xs h-8 px-3"
                            onClick={() => setConfirmPurchase({
                              type: 'playlist',
                              id: String(playlist.id),
                              name: displayName,
                              price: playlist.priceShanyrak,
                            })}
                            disabled={purchasing || !canAffordPlaylist}
                          >
                            {purchasing ? '...' : t('shop.buy')}
                          </Button>
                          <div className="flex items-center gap-1">
                            <span className="text-amber-100 font-bold text-sm">{playlist.priceShanyrak.toLocaleString()}</span>
                            <img src={SHANYRAK_ICON} alt="" className="w-5 h-5" />
                          </div>
                        </div>
                      )}
                    </div>
                    {!isFree && !isOwned && !canAffordPlaylist && (
                      <p className="text-red-400/80 text-xs mt-2">
                        {t('shop.notEnoughShanyrak')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-5 pb-4 text-center">
          <p className="text-amber-200/30 text-xs">{t('shop.comingSoon')}</p>
        </div>

        {/* Avatar preview overlay */}
        {previewAvatar && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-2xl" onClick={() => setPreviewAvatar(null)}>
            <div className="bg-gradient-to-b from-[#1a2d45] to-[#0f1923] border border-amber-700/40 rounded-xl shadow-2xl p-6 mx-6 max-w-xs w-full" onClick={e => e.stopPropagation()}>
              {/* Close button */}
              <button className="absolute top-3 right-3 text-amber-200/50 hover:text-amber-100 transition-colors" onClick={() => setPreviewAvatar(null)}>
                <X className="w-5 h-5" />
              </button>

              {/* Large avatar image */}
              <div className="flex justify-center mb-4">
                <div className="w-48 h-48 rounded-2xl overflow-hidden border-2 border-cyan-500/40 shadow-xl shadow-cyan-500/10">
                  <img src={previewAvatar.url} alt={locale === 'kk' && previewAvatar.nameKk ? previewAvatar.nameKk : locale === 'en' && previewAvatar.nameEn ? previewAvatar.nameEn : previewAvatar.name} className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Avatar name */}
              <h3 className="text-amber-100 font-bold text-lg text-center mb-1">
                {locale === 'kk' && previewAvatar.nameKk ? previewAvatar.nameKk : locale === 'en' && previewAvatar.nameEn ? previewAvatar.nameEn : previewAvatar.name}
              </h3>
              <p className="text-amber-200/50 text-xs text-center mb-4">
                {t('shop.premiumAvatar')}
              </p>

              {/* Status & action */}
              {ownedAvatars.includes(previewAvatar.id) ? (
                <div className="flex items-center justify-center gap-1.5 text-green-400 text-sm font-medium py-2">
                  <Check className="w-5 h-5" />
                  <span>{t('shop.purchased')}</span>
                </div>
              ) : previewAvatar.price === undefined ? (
                // No price — referral reward only
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="text-amber-400 text-2xl">🎁</div>
                  <p className="text-amber-300/80 text-sm font-medium text-center">
                    {locale === 'kk' ? '50 достық шақыру арқылы алыңыз' : locale === 'en' ? 'Invite 50 friends to unlock' : 'Награда за 50 приглашений'}
                  </p>
                  <p className="text-amber-200/40 text-xs text-center">
                    {locale === 'kk' ? 'Сатып алуға болмайды' : locale === 'en' ? 'Not available for purchase' : 'Недоступно для покупки'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-100 font-bold text-xl">{getPrice('avatar', previewAvatar.id, previewAvatar.price || 0)}</span>
                    <img src={TENGE_ICON} alt="T" className="w-7 h-7 rounded-full object-cover aspect-square" />
                  </div>
                  <Button
                    className="bg-amber-600 hover:bg-amber-500 text-white text-sm h-10 px-8 font-semibold w-full"
                    onClick={() => {
                      setPreviewAvatar(null);
                      setConfirmPurchase({
                        type: 'avatar',
                        id: previewAvatar.id,
                        name: locale === 'kk' && previewAvatar.nameKk ? previewAvatar.nameKk : locale === 'en' && previewAvatar.nameEn ? previewAvatar.nameEn : previewAvatar.name,
                        price: getPrice('avatar', previewAvatar.id, previewAvatar.price || 0),
                      });
                    }}
                    disabled={purchasing || currentTenge < getPrice('avatar', previewAvatar.id, previewAvatar.price || 0)}
                  >
                    {purchasing ? '...' : t('shop.buy')}
                  </Button>
                  {currentTenge < getPrice('avatar', previewAvatar.id, previewAvatar.price || 0) && (
                    <p className="text-red-400/80 text-xs">{t('shop.notEnough')}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Purchase confirmation overlay */}
        {confirmPurchase && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-2xl">
            <div className="bg-gradient-to-b from-[#1a2d45] to-[#0f1923] border border-amber-700/40 rounded-xl shadow-2xl p-6 mx-6 max-w-sm w-full">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-amber-100 font-bold text-base">{t('shop.confirmTitle')}</h3>
              </div>
              <p className="text-amber-200/70 text-sm mb-2">
                {t('shop.confirmText').replace('{name}', confirmPurchase.name).replace('{price}', String(confirmPurchase.price))}
              </p>
              <div className="flex items-center gap-1.5 mb-5">
                <span className="text-amber-200/60 text-sm">{t('shop.price')}:</span>
                <span className="text-amber-100 font-bold text-lg">{confirmPurchase.type === 'playlist' ? confirmPurchase.price.toLocaleString() : confirmPurchase.price}</span>
                <img src={confirmPurchase.type === 'playlist' ? SHANYRAK_ICON : TENGE_ICON} alt="" className="w-5 h-5 rounded-full object-cover aspect-square" />
              </div>
              <div className="flex items-center gap-3">
                <Button className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-sm h-10 font-semibold"
                  onClick={() => executePurchase(confirmPurchase)} disabled={purchasing}>
                  {purchasing ? '...' : t('shop.confirmBuy')}
                </Button>
                <Button variant="outline"
                  className="flex-1 border-amber-700/40 text-amber-200 bg-transparent hover:bg-amber-900/20 text-sm h-10 font-semibold"
                  onClick={() => setConfirmPurchase(null)} disabled={purchasing}>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
