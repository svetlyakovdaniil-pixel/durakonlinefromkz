import { useState, useRef, useEffect, useCallback } from 'react';
import { VipReferralAvatar } from './VipReferralAvatar';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { X, ShoppingCart, Check, AlertTriangle, Music, Play, Square, Eye, Crown } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useMusicContext } from '@/contexts/MusicContext';
import { CARD_BACK_URL, CARD_IMAGES, CARD_BACK_CUSTOM_URL, CARD_IMAGES_CUSTOM, TABLE_STYLES, type TableStyle } from '@shared/cardAssets';
import { EMOTION_PACKS, HAMSTER_PACK } from '@shared/emotionPacks';
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
import GalaxyTableOverlay from './GalaxyTableOverlay';

const CUSTOM_DECK_BACK = CARD_BACK_CUSTOM_URL;
const KING_SPADES = CARD_IMAGES_CUSTOM['K-spades'];
// Batyry deck (classic) assets for shop display
const CLASSIC_DECK_BACK = CARD_BACK_URL;
const CLASSIC_KING_SPADES = CARD_IMAGES['K-spades'];
const TENGE_ICON = '/assets/static/tenge_9aefd1b7.png';

const CLASSIC_DECK_PRICE = 25; // Батыры великой степи — платная колода

/** Available avatar frames for purchase */
export { AVATAR_FRAMES } from '@/lib/avatarFrames';
import { AVATAR_FRAMES } from '@/lib/avatarFrames';

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

type ShopTab = 'decks' | 'tables' | 'frames' | 'avatars' | 'music' | 'emotions';

interface ConfirmPurchase {
  type: 'deck' | 'table' | 'frame' | 'avatar' | 'playlist' | 'emotionpack';
  id: string;
  name: string;
  price: number;
}

const SHANYRAK_ICON = '/assets/static/shanyrak_96e91a49.png';

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
  const { data: ownedEmotionPacks = [], refetch: refetchOwnedEmotionPacks } = trpc.shop.ownedEmotionPacks.useQuery(undefined, { enabled: open });
  const { data: activeEmotionPack = 'khan', refetch: refetchActiveEmotionPack } = trpc.shop.activeEmotionPack.useQuery(undefined, { enabled: open });
  const purchasePlaylistMutation = trpc.playlists.purchase.useMutation();
  const purchaseMutation = trpc.shop.purchaseDeck.useMutation();
  const purchaseTableMutation = trpc.shop.purchaseTable.useMutation();
  const purchaseFrameMutation = trpc.shop.purchaseFrame.useMutation();
  const purchaseAvatarMutation = trpc.shop.purchaseAvatar.useMutation();
  const purchaseEmotionPackMutation = trpc.shop.purchaseEmotionPack.useMutation();
  const setActiveEmotionPackMutation = trpc.shop.setActiveEmotionPack.useMutation();

  /** Get effective price considering admin overrides and premium discount */
  const getPrice = (itemType: string, itemId: string, defaultPrice: number): number => {
    const override = priceOverrides.find((o: any) => o.itemType === itemType && o.itemId === itemId);
    const base = (override && override.priceTenge !== null && override.priceTenge !== undefined) ? override.priceTenge : defaultPrice;
    // 5% discount for premium subscribers
    if (isPremium && base > 0) return Math.floor(base * 0.95);
    return base;
  };

  /** Get active discount info for a shop item (playlist uses shanyrak, others use tenge) */
  const getDiscount = (itemType: string, itemId: string): { percent: number; expiresAt: Date | null } | null => {
    const override = priceOverrides.find((o: any) => o.itemType === itemType && o.itemId === itemId);
    if (!override || !override.discountPercent || override.discountPercent <= 0) return null;
    const expiresAt = override.discountExpiresAt ? new Date(override.discountExpiresAt) : null;
    if (expiresAt && expiresAt < new Date()) return null; // expired
    return { percent: override.discountPercent, expiresAt };
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
          toast.error(t('shop.notEnoughShanyrak'));
        } else {
          toast.error(t('common.error'));
        }
      } else if (item.type === 'emotionpack') {
        const result = await purchaseEmotionPackMutation.mutateAsync({ packId: item.id });
        if (result.success) {
          toast.success(t('toast.purchaseSuccess'));
          refetchOwnedEmotionPacks();
          refetchActiveEmotionPack();
          onPurchased?.();
        } else if (result.reason === 'already_owned') {
          toast.info(t('shop.owned'));
          refetchOwnedEmotionPacks();
        } else if (result.reason === 'insufficient_tenge') {
          toast.error(t('shop.notEnough'));
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
          {(['decks', 'tables', 'frames', 'avatars', 'music', 'emotions'] as const).map(tab => (
            <button
              key={tab}
              className={`flex-1 py-2.5 px-1 text-[10px] sm:text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-amber-100 border-b-2 border-amber-400 bg-amber-900/10'
                  : 'text-amber-200/50 hover:text-amber-200/70'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'decks' ? t('shop.decks') : tab === 'tables' ? t('shop.tables') : tab === 'frames' ? t('shop.frames') : tab === 'avatars' ? t('shop.avatars') : tab === 'music' ? t('shop.music') : t('shop.emotions')}
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
                      <div className="w-full h-36 rounded-lg overflow-hidden border border-amber-600/30 shadow-lg relative">
                        <img src={table.url} alt={table.name} className="w-full h-full object-cover" />
                        {tableId === 'galaxy' && (
                          <div className="absolute inset-0 pointer-events-none">
                            <GalaxyTableOverlay enabled={true} />
                          </div>
                        )}
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
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">{t('shop.seasonBadgeLabel')}</span>
                          )}
                        </div>
                        <p className="text-amber-200/50 text-xs mb-3">
                          {locale === 'kk' ? frame.descriptionKk : locale === 'en' ? (frame as any).descriptionEn || frame.description : frame.description}
                        </p>
                        {isSeasonFrame ? (
                          isOwned ? (
                            <div className="flex items-center gap-1.5 text-yellow-400 text-sm font-medium">
                              <Check className="w-4 h-4" />
                              <span>{t('shop.frameEarned')}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-amber-200/50 text-xs">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-yellow-600/60">
                                <polygon points="12,2 15,9 22,9 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9 9,9" fill="rgba(218,165,32,0.2)" stroke="rgba(218,165,32,0.6)" />
                              </svg>
                              <span>{t('shop.frameEarnObsidian')}</span>
                            </div>
                          )
                        ) : isPremiumFrame ? (
                          isOwned ? (
                            <div className="flex items-center gap-1.5 text-yellow-400 text-sm font-medium">
                              <Crown className="w-4 h-4" />
                              <span>{t('shop.frameActiveWithPremium')}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-amber-200/50 text-xs">
                              <Crown className="w-4 h-4 text-yellow-600/60" />
                              <span>{t('shop.requiresPremiumSub')}</span>
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
                              🎁 {t('shop.invite50Friends')}
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
                const discount = getDiscount('playlist', String(playlist.id));
                // Use admin override price if set (stored as priceTenge, but used as shanyrak for playlists)
                const playlistOverride = priceOverrides.find((o: any) => o.itemType === 'playlist' && o.itemId === String(playlist.id));
                const basePrice = (playlistOverride && playlistOverride.priceTenge !== null && playlistOverride.priceTenge !== undefined)
                  ? playlistOverride.priceTenge
                  : playlist.priceShanyrak;
                const effectivePrice = discount ? Math.floor(basePrice * (1 - discount.percent / 100)) : basePrice;
                const canAffordPlaylist = currentShanyrak >= effectivePrice;
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
                        <p className="text-amber-200/50 text-xs">{trackCount} {t('shop.tracksUnit')}</p>
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
                              price: effectivePrice,
                            })}
                            disabled={purchasing || !canAffordPlaylist}
                          >
                            {purchasing ? '...' : t('shop.buy')}
                          </Button>
                          <div className="flex flex-col items-end">
                            {discount && (
                              <span className="text-gray-400 line-through text-xs">{basePrice.toLocaleString()} 🏠</span>
                            )}
                            <div className="flex items-center gap-1">
                              <span className={`font-bold text-sm ${discount ? 'text-pink-300' : 'text-amber-100'}`}>{effectivePrice.toLocaleString()}</span>
                              <img src={SHANYRAK_ICON} alt="" className="w-5 h-5" />
                            </div>
                            {discount && (
                              <span className="text-pink-400 text-[10px]">−{discount.percent}%</span>
                            )}
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
          {activeTab === 'emotions' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">😊</span>
                <h3 className="text-amber-100 font-bold text-sm">{t('shop.emotions')}</h3>
              </div>
              {EMOTION_PACKS.map(pack => {
                const effectivePrice = getPrice('emotionpack', pack.id, pack.price);
                const isOwned = pack.price === 0 || ownedEmotionPacks.includes(pack.id);
                const isActive = activeEmotionPack === pack.id;
                const packName = locale === 'kk' && pack.nameKk ? pack.nameKk : locale === 'en' && pack.nameEn ? pack.nameEn : pack.name;
                const packDesc = locale === 'kk' && pack.descriptionKk ? pack.descriptionKk : locale === 'en' && pack.descriptionEn ? pack.descriptionEn : (pack.description || '');
                const canAffordPack = currentTenge >= effectivePrice;
                return (
                  <div key={pack.id} className="bg-[#0f2035]/80 border border-amber-700/20 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-amber-900/30 flex items-center justify-center">
                        <img src={pack.emotions[0].url} alt={packName} className="w-10 h-10 object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-amber-100 font-bold text-sm">{packName}</h4>
                        {packDesc && <p className="text-amber-200/50 text-xs mt-0.5">{packDesc}</p>}
                      </div>
                    </div>
                    {/* Emotion preview grid */}
                    <div className="grid grid-cols-5 gap-1.5 mb-3">
                      {pack.emotions.map(em => (
                        <div key={em.id} className="flex flex-col items-center gap-0.5">
                          <img src={em.url} alt={em.label} className="w-10 h-10 object-contain" />
                          <span className="text-[9px] text-amber-200/40 leading-none">{locale === 'kk' && em.labelKk ? em.labelKk : locale === 'en' && em.labelEn ? em.labelEn : em.label}</span>
                        </div>
                      ))}
                    </div>
                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {isOwned ? (
                        isActive ? (
                          <div className="flex items-center gap-1.5 text-amber-400 text-sm font-medium">
                            <Check className="w-4 h-4" />
                            <span>{t('shop.equipped')}</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
                              <Check className="w-4 h-4" />
                              <span>{pack.price === 0 ? t('shop.free') : t('shop.purchased')}</span>
                            </div>
                            <Button
                              className="ml-auto bg-amber-700/40 hover:bg-amber-600/60 text-amber-100 text-xs h-8 px-3"
                              onClick={async () => {
                                await setActiveEmotionPackMutation.mutateAsync({ packId: pack.id });
                                refetchActiveEmotionPack();
                                toast.success(t('shop.activated'));
                              }}
                            >
                              {t('shop.activateBtn')}
                            </Button>
                          </>
                        )
                      ) : (
                        <>
                          <div className="flex-1" />
                          <Button
                            className="bg-amber-600 hover:bg-amber-500 text-white text-xs h-8 px-3"
                            onClick={() => setConfirmPurchase({
                              type: 'emotionpack',
                              id: pack.id,
                              name: packName,
                              price: effectivePrice,
                            })}
                            disabled={purchasing || !canAffordPack}
                          >
                            {purchasing ? '...' : t('shop.buy')}
                          </Button>
                          <div className="flex items-center gap-1">
                            <span className="text-amber-100 font-bold text-sm">{effectivePrice}</span>
                            <img src={TENGE_ICON} alt="T" className="w-5 h-5 rounded-full object-cover" />
                          </div>
                          {!canAffordPack && <p className="text-red-400/80 text-xs w-full mt-1">{t('shop.notEnough')}</p>}
                        </>
                      )}
                    </div>
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
                {previewAvatar.id === 'vip_referral' ? (
                  <div className="relative" style={{ width: 192, height: 192 }}>
                    <VipReferralAvatar size={192} />
                  </div>
                ) : (
                  <div className="w-48 h-48 rounded-2xl overflow-hidden border-2 border-cyan-500/40 shadow-xl shadow-cyan-500/10">
                    <img src={previewAvatar.url} alt={locale === 'kk' && previewAvatar.nameKk ? previewAvatar.nameKk : locale === 'en' && previewAvatar.nameEn ? previewAvatar.nameEn : previewAvatar.name} className="w-full h-full object-cover" />
                  </div>
                )}
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
                    {t('shop.invite50Friends')}
                  </p>
                  <p className="text-amber-200/40 text-xs text-center">
                    {t('shop.notForSale')}
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
