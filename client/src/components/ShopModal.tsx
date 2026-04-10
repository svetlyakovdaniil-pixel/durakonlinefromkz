import { useState, useRef, useEffect, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { X, ShoppingCart, Check, AlertTriangle, Flame, Zap, Snowflake, Music, Play, Square } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useMusicContext } from '@/contexts/MusicContext';
import { CARD_BACK_CUSTOM_URL, CARD_IMAGES_CUSTOM, TABLE_STYLES, type TableStyle } from '@shared/cardAssets';
import { AVATAR_OPTIONS } from '@shared/avatars';
import { FireFrame } from './FireFrame';
import { NeonFrame } from './NeonFrame';
import { LightningFrame } from './LightningFrame';
import { IceFrame } from './IceFrame';

const CUSTOM_DECK_BACK = CARD_BACK_CUSTOM_URL;
const KING_SPADES = CARD_IMAGES_CUSTOM['K-spades'];
const TENGE_ICON = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/tenge_9aefd1b7.png';

const CUSTOM_DECK_PRICE = 60;

/** Available avatar frames for purchase */
export const AVATAR_FRAMES = [
  {
    id: 'fire',
    name: 'Огненная рамка',
    nameKk: 'Отты жақтау',
    description: 'Реалистичная анимация огня вокруг аватарки',
    descriptionKk: 'Аватар айналасындағы нақты от анимациясы',
    price: 500,
    icon: Flame,
    iconColor: 'text-orange-400',
    bgGradient: 'from-amber-800 to-amber-950',
  },
  {
    id: 'neon',
    name: 'Неоновая рамка',
    nameKk: 'Неон жақтау',
    description: 'Яркое неоновое свечение с переливами цветов',
    descriptionKk: 'Түстердің ауысуымен жарқын неон жарқылы',
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
    description: 'Электрические молнии и искры вокруг аватарки',
    descriptionKk: 'Аватар айналасындағы электр найзағайлары мен ұшқындар',
    price: 1200,
    icon: Zap,
    iconColor: 'text-blue-300',
    bgGradient: 'from-blue-900 to-indigo-950',
  },
  {
    id: 'ice',
    name: 'Ледяная рамка',
    nameKk: 'Мұз жақтау',
    description: 'Ледяные кристаллы и снежинки вокруг аватарки',
    descriptionKk: 'Аватар айналасындағы мұз кристалдары мен қар ұшқындары',
    price: 1000,
    icon: Snowflake,
    iconColor: 'text-sky-300',
    bgGradient: 'from-sky-900 to-blue-950',
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
    default:
      return <>{children}</>;
  }
}

interface ShopModalProps {
  open: boolean;
  onClose: () => void;
  currentTenge: number;
  currentShanyrak?: number;
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

export default function ShopModal({ open, onClose, currentTenge, currentShanyrak = 0, onPurchased }: ShopModalProps) {
  const [purchasing, setPurchasing] = useState(false);
  const { t, locale } = useTranslation();
  const music = useMusicContext();
  const wasMusicPlayingRef = useRef(false);
  const [activeTab, setActiveTab] = useState<ShopTab>('decks');
  const [confirmPurchase, setConfirmPurchase] = useState<ConfirmPurchase | null>(null);
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

  /** Get effective price considering admin overrides */
  const getPrice = (itemType: string, itemId: string, defaultPrice: number): number => {
    const override = priceOverrides.find((o: any) => o.itemType === itemType && o.itemId === itemId);
    if (override && override.priceTenge !== null && override.priceTenge !== undefined) return override.priceTenge;
    return defaultPrice;
  };

  /** Check if item is available (not disabled by admin) */
  const isItemAvailable = (itemType: string, itemId: string): boolean => {
    const override = priceOverrides.find((o: any) => o.itemType === itemType && o.itemId === itemId);
    if (override) return override.isAvailable;
    return true;
  };

  const customDeckPrice = getPrice('deck', 'custom', CUSTOM_DECK_PRICE);
  const isCustomOwned = ownedDecks.includes('custom');
  const canAfford = currentTenge >= customDeckPrice;

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
      music.startMusic();
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

    // If no preview was active before, check if background music is playing and pause it
    if (previewPlaylistId === null) {
      // First time starting preview — save background music state
      wasMusicPlayingRef.current = music.enabled;
      if (music.enabled) {
        music.stopMusic();
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
        <div className="flex border-b border-amber-700/20">
          {(['decks', 'tables', 'frames', 'avatars', 'music'] as const).map(tab => (
            <button
              key={tab}
              className={`flex-1 py-2.5 text-[10px] sm:text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-amber-100 border-b-2 border-amber-400 bg-amber-900/10'
                  : 'text-amber-200/50 hover:text-amber-200/70'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'decks' ? t('shop.decks') : tab === 'tables' ? t('shop.tables') : tab === 'frames' ? (locale === 'kk' ? 'Жақтаулар' : 'Рамки') : tab === 'avatars' ? (locale === 'kk' ? 'Аватарлар' : 'Аватары') : (locale === 'kk' ? 'Музыка' : 'Музыка')}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 max-h-[50vh] overflow-y-auto">
          {activeTab === 'decks' && (
            <div className="bg-[#0f2035]/80 border border-amber-700/20 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-16 h-22 rounded-lg overflow-hidden border border-amber-600/30 shadow-lg">
                    <img src={CUSTOM_DECK_BACK} alt="Deck back" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-16 h-22 rounded-lg overflow-hidden border border-amber-600/30 shadow-lg">
                    <img src={KING_SPADES} alt="King" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-amber-100 font-bold text-sm mb-1">{t('shop.customDeck')}</h3>
                  <p className="text-amber-200/50 text-xs mb-3">{t('shop.customDeckDesc')}</p>
                  {isCustomOwned ? (
                    <div className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
                      <Check className="w-4 h-4" /><span>{t('shop.purchased')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Button className="bg-amber-600 hover:bg-amber-500 text-white text-sm h-9 px-4"
                        onClick={() => setConfirmPurchase({ type: 'deck', id: 'custom', name: t('shop.customDeck'), price: customDeckPrice })}
                        disabled={purchasing || !canAfford}>{purchasing ? '...' : t('shop.buy')}</Button>
                      <div className="flex items-center gap-1">
                        <span className="text-amber-100 font-bold text-base">{customDeckPrice}</span>
                        <img src={TENGE_ICON} alt="T" className="w-7 h-7 rounded-full object-cover aspect-square" />
                      </div>
                    </div>
                  )}
                  {!isCustomOwned && !canAfford && <p className="text-red-400/80 text-xs mt-2">{t('shop.notEnough')}</p>}
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
                          <h3 className="text-amber-100 font-bold text-sm">{table.name}</h3>
                        </div>
                        {isOwned ? (
                          <div className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
                            <Check className="w-4 h-4" /><span>{t('shop.purchased')}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Button className="bg-amber-600 hover:bg-amber-500 text-white text-sm h-9 px-4"
                              onClick={() => setConfirmPurchase({ type: 'table', id: tableId, name: table.name, price: effectivePrice })}
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
              {AVATAR_FRAMES.filter(frame => isItemAvailable('frame', frame.id)).map(frame => {
                const isOwned = ownedFrames.includes(frame.id);
                const effectivePrice = getPrice('frame', frame.id, frame.price);
                const canAffordFrame = currentTenge >= effectivePrice;
                const IconComp = frame.icon;
                return (
                  <div key={frame.id} className="bg-[#0f2035]/80 border border-amber-700/20 rounded-xl p-4">
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
                        <h3 className="text-amber-100 font-bold text-sm mb-1">
                          {locale === 'kk' ? frame.nameKk : frame.name}
                        </h3>
                        <p className="text-amber-200/50 text-xs mb-3">
                          {locale === 'kk' ? frame.descriptionKk : frame.description}
                        </p>
                        {isOwned ? (
                          <div className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
                            <Check className="w-4 h-4" /><span>{t('shop.purchased')}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Button className="bg-amber-600 hover:bg-amber-500 text-white text-sm h-9 px-4"
                              onClick={() => setConfirmPurchase({
                                type: 'frame', id: frame.id,
                                name: locale === 'kk' ? frame.nameKk : frame.name,
                                price: effectivePrice,
                              })}
                              disabled={purchasing || !canAffordFrame}>{purchasing ? '...' : t('shop.buy')}</Button>
                            <div className="flex items-center gap-1">
                              <span className="text-amber-100 font-bold text-base">{effectivePrice}</span>
                              <img src={TENGE_ICON} alt="T" className="w-7 h-7 rounded-full object-cover aspect-square" />
                            </div>
                          </div>
                        )}
                        {!isOwned && !canAffordFrame && <p className="text-red-400/80 text-xs mt-2">{t('shop.notEnough')}</p>}
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
                return (
                  <div key={avatar.id} className="bg-[#0f2035]/80 border border-amber-700/20 rounded-xl p-4">
                    <div className="flex items-center gap-4">
                      <div className="shrink-0 relative">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-cyan-500/60 shadow-lg shadow-cyan-500/20">
                          <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover animate-pulse-slow" />
                        </div>
                        <div className="absolute -top-1 -right-1 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          PRO
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-amber-100 font-bold text-sm mb-1">{avatar.name}</h3>
                        <p className="text-amber-200/50 text-xs mb-3">
                          {locale === 'kk' ? 'Премиум аватар' : 'Премиум аватар'}
                        </p>
                        {isOwned ? (
                          <div className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
                            <Check className="w-4 h-4" /><span>{t('shop.purchased')}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Button className="bg-amber-600 hover:bg-amber-500 text-white text-sm h-9 px-4"
                              onClick={() => setConfirmPurchase({
                                type: 'avatar', id: avatar.id,
                                name: avatar.name,
                                price: effectiveAvatarPrice,
                              })}
                              disabled={purchasing || !canAffordAvatar}>{purchasing ? '...' : t('shop.buy')}</Button>
                            <div className="flex items-center gap-1">
                              <span className="text-amber-100 font-bold text-base">{effectiveAvatarPrice}</span>
                              <img src={TENGE_ICON} alt="T" className="w-7 h-7 rounded-full object-cover aspect-square" />
                            </div>
                          </div>
                        )}
                        {!isOwned && !canAffordAvatar && <p className="text-red-400/80 text-xs mt-2">{t('shop.notEnough')}</p>}
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
                  {locale === 'kk' ? 'Фондық музыка' : 'Фоновая музыка'}
                </h3>
              </div>
              {allPlaylists.map((playlist: any) => {
                const isOwned = ownedPlaylistIds.includes(playlist.id);
                const isFree = playlist.isDefault || playlist.priceShanyrak === 0;
                const canAffordPlaylist = currentShanyrak >= playlist.priceShanyrak;
                const isPreviewPlaying = previewPlaylistId === playlist.id;
                const trackCount = playlist.tracks?.length || 0;
                const displayName = locale === 'kk' && playlist.nameKk ? playlist.nameKk : playlist.name;
                const displayDesc = locale === 'kk' && playlist.descriptionKk ? playlist.descriptionKk : (playlist.description || '');
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
                        <p className="text-amber-200/50 text-xs">{trackCount} {locale === 'kk' ? 'трек' : 'треков'}</p>
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
                            <><Square className="w-3 h-3" /> {locale === 'kk' ? 'Тоқтату' : 'Стоп'} ({previewTimer}{locale === 'kk' ? 'с' : 'с'})</>
                          ) : (
                            <><Play className="w-3 h-3" /> {locale === 'kk' ? 'Тыңдау' : 'Прослушать'}</>
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
                            {purchasing ? '...' : (locale === 'kk' ? 'Сатып алу' : 'Купить')}
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
                        {locale === 'kk' ? 'Шаңырақ жеткіліксіз' : 'Недостаточно шаныраков'}
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
