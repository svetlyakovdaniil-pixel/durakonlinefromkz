import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { X, Lock, ShoppingCart, Check } from 'lucide-react';
import { CARD_BACK_CUSTOM_URL, CARD_IMAGES_CUSTOM, TABLE_STYLES, type TableStyle } from '@shared/cardAssets';

const CUSTOM_DECK_BACK = CARD_BACK_CUSTOM_URL;
const KING_SPADES = CARD_IMAGES_CUSTOM['K-spades'];
const TENGE_ICON = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/tenge_9aefd1b7.png';

const CUSTOM_DECK_PRICE = 60;

interface ShopModalProps {
  open: boolean;
  onClose: () => void;
  currentTenge: number;
  onPurchased?: () => void;
}

type ShopTab = 'decks' | 'tables';

export default function ShopModal({ open, onClose, currentTenge, onPurchased }: ShopModalProps) {
  const [purchasing, setPurchasing] = useState(false);
  const [activeTab, setActiveTab] = useState<ShopTab>('decks');
  const { data: ownedDecks = [], refetch: refetchOwned } = trpc.shop.ownedDecks.useQuery(undefined, { enabled: open });
  const { data: ownedTables = [], refetch: refetchOwnedTables } = trpc.shop.ownedTables.useQuery(undefined, { enabled: open });
  const purchaseMutation = trpc.shop.purchaseDeck.useMutation();
  const purchaseTableMutation = trpc.shop.purchaseTable.useMutation();

  const isCustomOwned = ownedDecks.includes('custom');
  const canAfford = currentTenge >= CUSTOM_DECK_PRICE;

  const handlePurchase = async () => {
    if (isCustomOwned) return;
    if (!canAfford) {
      toast.error('Недостаточно тенге!');
      return;
    }
    setPurchasing(true);
    try {
      const result = await purchaseMutation.mutateAsync({ deckId: 'custom', tengeCost: CUSTOM_DECK_PRICE });
      if (result.success) {
        toast.success('Колода куплена!');
        refetchOwned();
        onPurchased?.();
      } else if (result.reason === 'already_owned') {
        toast.info('Эта колода уже куплена');
        refetchOwned();
      } else if (result.reason === 'insufficient_tenge') {
        toast.error('Недостаточно тенге!');
      } else {
        toast.error('Ошибка покупки');
      }
    } catch {
      toast.error('Ошибка покупки');
    } finally {
      setPurchasing(false);
    }
  };

  const handlePurchaseTable = async (tableId: string, price: number) => {
    if (ownedTables.includes(tableId)) return;
    if (currentTenge < price) {
      toast.error('Недостаточно тенге!');
      return;
    }
    setPurchasing(true);
    try {
      const result = await purchaseTableMutation.mutateAsync({ tableId, tengeCost: price });
      if (result.success) {
        toast.success('Стол куплен!');
        refetchOwnedTables();
        onPurchased?.();
      } else if (result.reason === 'already_owned') {
        toast.info('Этот стол уже куплен');
        refetchOwnedTables();
      } else if (result.reason === 'insufficient_tenge') {
        toast.error('Недостаточно тенге!');
      } else {
        toast.error('Ошибка покупки');
      }
    } catch {
      toast.error('Ошибка покупки');
    } finally {
      setPurchasing(false);
    }
  };

  if (!open) return null;

  // Get purchasable tables (exclude classic which is free/default)
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
            <h2 className="text-lg font-bold text-amber-100">Магазин</h2>
          </div>
          <button className="text-amber-200/50 hover:text-amber-100 p-1" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance */}
        <div className="px-5 py-3 bg-amber-900/10 border-b border-amber-700/10">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-amber-200/60">Ваш баланс:</span>
            <span className="text-amber-100 font-bold">{currentTenge}</span>
            <img src={TENGE_ICON} alt="₸" className="w-6 h-6 rounded-full object-cover aspect-square" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-amber-700/20">
          <button
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'decks'
                ? 'text-amber-100 border-b-2 border-amber-400 bg-amber-900/10'
                : 'text-amber-200/50 hover:text-amber-200/70'
            }`}
            onClick={() => setActiveTab('decks')}
          >
            Колоды карт
          </button>
          <button
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'tables'
                ? 'text-amber-100 border-b-2 border-amber-400 bg-amber-900/10'
                : 'text-amber-200/50 hover:text-amber-200/70'
            }`}
            onClick={() => setActiveTab('tables')}
          >
            Игровой стол
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[50vh] overflow-y-auto">
          {activeTab === 'decks' && (
            <div className="bg-[#0f2035]/80 border border-amber-700/20 rounded-xl p-4">
              <div className="flex items-center gap-4">
                {/* Card images */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-16 h-22 rounded-lg overflow-hidden border border-amber-600/30 shadow-lg">
                    <img
                      src={CUSTOM_DECK_BACK}
                      alt="Рубашка колоды"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-16 h-22 rounded-lg overflow-hidden border border-amber-600/30 shadow-lg">
                    <img
                      src={KING_SPADES}
                      alt="Король пик"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Info + Buy */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-amber-100 font-bold text-sm mb-1">Кастомная колода</h3>
                  <p className="text-amber-200/50 text-xs mb-3">Уникальный дизайн карт для вашей игры</p>

                  {isCustomOwned ? (
                    <div className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
                      <Check className="w-4 h-4" />
                      <span>Куплено</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Button
                        className="bg-amber-600 hover:bg-amber-500 text-white text-sm h-9 px-4"
                        onClick={handlePurchase}
                        disabled={purchasing || !canAfford}
                      >
                        {purchasing ? 'Покупка...' : 'Купить'}
                      </Button>
                      <div className="flex items-center gap-1">
                        <span className="text-amber-100 font-bold text-base">{CUSTOM_DECK_PRICE}</span>
                        <img src={TENGE_ICON} alt="₸" className="w-7 h-7 rounded-full object-cover aspect-square" />
                      </div>
                    </div>
                  )}

                  {!isCustomOwned && !canAfford && (
                    <p className="text-red-400/80 text-xs mt-2">Недостаточно тенге для покупки</p>
                  )}
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
                      {/* Table preview */}
                      <div className="w-full h-36 rounded-lg overflow-hidden border border-amber-600/30 shadow-lg">
                        <img
                          src={table.url}
                          alt={table.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info + Buy */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-amber-100 font-bold text-sm">{table.name}</h3>
                          <p className="text-amber-200/50 text-xs mt-0.5">Чёрный, тёмно-синий и золотой</p>
                        </div>

                        {isOwned ? (
                          <div className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
                            <Check className="w-4 h-4" />
                            <span>Куплено</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Button
                              className="bg-amber-600 hover:bg-amber-500 text-white text-sm h-9 px-4"
                              onClick={() => handlePurchaseTable(tableId, table.price)}
                              disabled={purchasing || !canAffordTable}
                            >
                              {purchasing ? '...' : 'Купить'}
                            </Button>
                            <div className="flex items-center gap-1">
                              <span className="text-amber-100 font-bold text-base">{table.price}</span>
                              <img src={TENGE_ICON} alt="₸" className="w-7 h-7 rounded-full object-cover aspect-square" />
                            </div>
                          </div>
                        )}
                      </div>

                      {!isOwned && !canAffordTable && (
                        <p className="text-red-400/80 text-xs">Недостаточно тенге для покупки</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-5 pb-4 text-center">
          <p className="text-amber-200/30 text-xs">Больше предметов скоро появится в магазине</p>
        </div>
      </div>
    </div>
  );
}
