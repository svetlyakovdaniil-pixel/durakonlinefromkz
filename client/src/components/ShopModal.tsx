import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { X, ShoppingCart, Check, AlertTriangle, Flame } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { CARD_BACK_CUSTOM_URL, CARD_IMAGES_CUSTOM, TABLE_STYLES, type TableStyle } from '@shared/cardAssets';
import { FireFrame } from './FireFrame';

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
    component: 'fire' as const,
  },
] as const;

interface ShopModalProps {
  open: boolean;
  onClose: () => void;
  currentTenge: number;
  onPurchased?: () => void;
}

type ShopTab = 'decks' | 'tables' | 'frames';

interface ConfirmPurchase {
  type: 'deck' | 'table' | 'frame';
  id: string;
  name: string;
  price: number;
}

export default function ShopModal({ open, onClose, currentTenge, onPurchased }: ShopModalProps) {
  const [purchasing, setPurchasing] = useState(false);
  const { t, locale } = useTranslation();
  const [activeTab, setActiveTab] = useState<ShopTab>('decks');
  const [confirmPurchase, setConfirmPurchase] = useState<ConfirmPurchase | null>(null);
  const { data: ownedDecks = [], refetch: refetchOwned } = trpc.shop.ownedDecks.useQuery(undefined, { enabled: open });
  const { data: ownedTables = [], refetch: refetchOwnedTables } = trpc.shop.ownedTables.useQuery(undefined, { enabled: open });
  const { data: ownedFrames = [], refetch: refetchOwnedFrames } = trpc.shop.ownedFrames.useQuery(undefined, { enabled: open });
  const purchaseMutation = trpc.shop.purchaseDeck.useMutation();
  const purchaseTableMutation = trpc.shop.purchaseTable.useMutation();
  const purchaseFrameMutation = trpc.shop.purchaseFrame.useMutation();

  const isCustomOwned = ownedDecks.includes('custom');
  const canAfford = currentTenge >= CUSTOM_DECK_PRICE;

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
          {(['decks', 'tables', 'frames'] as const).map(tab => (
            <button
              key={tab}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-amber-100 border-b-2 border-amber-400 bg-amber-900/10'
                  : 'text-amber-200/50 hover:text-amber-200/70'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'decks' ? t('shop.decks') : tab === 'tables' ? t('shop.tables') : (locale === 'kk' ? 'Жақтаулар' : 'Рамки')}
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
                        onClick={() => setConfirmPurchase({ type: 'deck', id: 'custom', name: t('shop.customDeck'), price: CUSTOM_DECK_PRICE })}
                        disabled={purchasing || !canAfford}>{purchasing ? '...' : t('shop.buy')}</Button>
                      <div className="flex items-center gap-1">
                        <span className="text-amber-100 font-bold text-base">{CUSTOM_DECK_PRICE}</span>
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
              {purchasableTables.map(([tableId, table]) => {
                const isOwned = ownedTables.includes(tableId);
                const canAffordTable = currentTenge >= table.price;
                return (
                  <div key={tableId} className="bg-[#0f2035]/80 border border-amber-700/20 rounded-xl p-4">
                    <div className="flex flex-col gap-3">
                      <div className="w-full h-36 rounded-lg overflow-hidden border border-amber-600/30 shadow-lg">
                        <img src={table.url} alt={table.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-amber-100 font-bold text-sm">{table.name}</h3>
                          <p className="text-amber-200/50 text-xs mt-0.5">{t('shop.darkTableDesc')}</p>
                        </div>
                        {isOwned ? (
                          <div className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
                            <Check className="w-4 h-4" /><span>{t('shop.purchased')}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Button className="bg-amber-600 hover:bg-amber-500 text-white text-sm h-9 px-4"
                              onClick={() => setConfirmPurchase({ type: 'table', id: tableId, name: table.name, price: table.price })}
                              disabled={purchasing || !canAffordTable}>{purchasing ? '...' : t('shop.buy')}</Button>
                            <div className="flex items-center gap-1">
                              <span className="text-amber-100 font-bold text-base">{table.price}</span>
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
              {AVATAR_FRAMES.map(frame => {
                const isOwned = ownedFrames.includes(frame.id);
                const canAffordFrame = currentTenge >= frame.price;
                return (
                  <div key={frame.id} className="bg-[#0f2035]/80 border border-amber-700/20 rounded-xl p-4">
                    <div className="flex items-center gap-4">
                      <div className="shrink-0">
                        <FireFrame size={64} active={true}>
                          <div className="w-[64px] h-[64px] rounded-full overflow-hidden border-2 border-amber-500/60">
                            <div className="w-full h-full bg-gradient-to-br from-amber-800 to-amber-950 flex items-center justify-center">
                              <Flame className="w-8 h-8 text-orange-400" />
                            </div>
                          </div>
                        </FireFrame>
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
                                price: frame.price,
                              })}
                              disabled={purchasing || !canAffordFrame}>{purchasing ? '...' : t('shop.buy')}</Button>
                            <div className="flex items-center gap-1">
                              <span className="text-amber-100 font-bold text-base">{frame.price}</span>
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
                <span className="text-amber-100 font-bold text-lg">{confirmPurchase.price}</span>
                <img src={TENGE_ICON} alt="T" className="w-5 h-5 rounded-full object-cover aspect-square" />
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
