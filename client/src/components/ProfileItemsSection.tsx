import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Package, RefreshCw, Trash2, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { AVATAR_FRAMES } from "@/components/ShopModal";
import { AVATAR_OPTIONS, getBaseAvatarId } from "@shared/avatars";

export function ProfileItemsSection({ profileId }: { profileId: number }) {
  const utils = trpc.useUtils();
  const [confirmRemove, setConfirmRemove] = useState<{ itemType: 'avatar' | 'frame'; itemId: string; label: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'avatars' | 'frames' | 'season'>('avatars');

  const { data: items, isLoading, refetch } = trpc.admin.getPlayerItems.useQuery({ profileId });

  const removeMutation = trpc.admin.removePlayerItem.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Предмет удалён из инвентаря игрока');
        refetch();
        utils.admin.playerDetail.invalidate({ profileId });
      } else {
        toast.error(`Ошибка: ${result.reason}`);
      }
      setConfirmRemove(null);
    },
    onError: (e) => {
      toast.error(e.message);
      setConfirmRemove(null);
    },
  });

  // Extract season suffix from a season-suffixed ID (e.g. 'obsidian_hiphop_90s_2026Q1' → '2026Q1')
  const extractSeasonSuffix = (id: string): string | null => {
    const match = id.match(/_?(\d{4}Q\d)$/);
    return match ? match[1] : null;
  };

  const getAvatarLabel = (id: string) => {
    const baseId = getBaseAvatarId(id);
    const found = AVATAR_OPTIONS.find(a => a.id === baseId) || AVATAR_OPTIONS.find(a => a.id === id);
    const name = found ? (found.name || baseId) : baseId;
    const season = extractSeasonSuffix(id);
    return season ? `${name} (${season})` : name;
  };

  const getFrameLabel = (id: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const found = AVATAR_FRAMES.find((f: any) => f.id === id) || AVATAR_FRAMES.find((f: any) => id.startsWith(f.id));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const name = found ? ((found as any).label || (found as any).name || id) : id;
    const season = extractSeasonSuffix(id);
    return season ? `${name} (${season})` : name;
  };

  const getRankLabel = (rankKey: string, avatarId?: string | null) => {
    const rankNames: Record<string, string> = {
      bronze: 'Бронза',
      silver: 'Серебро',
      gold: 'Золото',
      ruby: 'Рубин',
      amber: 'Янтарь',
      great_khan: 'Обсидиан',
      sky_eagle: 'Циркон',
      steppe_khan: 'Рубин',
      golden_horde_warrior: 'Янтарь',
      unknown: 'Сезонная',
    };
    if (rankKey === 'unknown' && avatarId) {
      const baseId = getBaseAvatarId(avatarId);
      const avatarDef = AVATAR_OPTIONS.find(a => a.id === baseId);
      if (avatarDef?.seasonRankRequired) {
        return rankNames[avatarDef.seasonRankRequired] || avatarDef.seasonRankRequired;
      }
    }
    return rankNames[rankKey] || rankKey;
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500 animate-pulse">Загрузка...</div>;
  }

  const avatars = items?.avatars ?? [];
  const frames = items?.frames ?? [];
  const equippedAvatar = items?.equippedAvatar;
  const equippedFrame = items?.equippedFrame;
  const pendingSeasonRewards = items?.pendingSeasonRewards ?? [];

  // Count season rewards that have items
  const seasonRewardsWithItems = pendingSeasonRewards.filter(r => r.avatarId || r.frameId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Инвентарь игрока (удаление без возврата средств)</span>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="border-gray-700 text-gray-300">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Sub-tabs: Avatars / Frames / Season */}
      <div className="flex gap-1 border-b border-gray-800">
        <button
          onClick={() => setActiveTab('avatars')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'avatars' ? 'border-amber-500 text-amber-100' : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          Аватарки ({avatars.length})
        </button>
        <button
          onClick={() => setActiveTab('frames')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'frames' ? 'border-amber-500 text-amber-100' : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          Рамки ({frames.length})
        </button>
        <button
          onClick={() => setActiveTab('season')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'season' ? 'border-amber-500 text-amber-100' : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          Сезонные ({seasonRewardsWithItems.length})
        </button>
      </div>

      {activeTab === 'avatars' && (
        <div className="space-y-2">
          {avatars.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Нет аватарок</p>
            </div>
          ) : (
            avatars.map((avatarId: string) => (
              <div key={avatarId} className="flex items-center justify-between bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">👤</span>
                  <div>
                    <p className="text-sm text-gray-200 font-medium">{getAvatarLabel(avatarId)}</p>
                    <p className="text-xs text-gray-500 font-mono">{avatarId}</p>
                  </div>
                  {equippedAvatar === avatarId && (
                    <span className="text-xs bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded">Надета</span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmRemove({ itemType: 'avatar', itemId: avatarId, label: getAvatarLabel(avatarId) })}
                  className="border-red-800 text-red-400 hover:bg-red-900/30 hover:text-red-300"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Удалить
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'frames' && (
        <div className="space-y-2">
          {frames.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Нет рамок</p>
            </div>
          ) : (
            frames.map((frameId: string) => (
              <div key={frameId} className="flex items-center justify-between bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🖼️</span>
                  <div>
                    <p className="text-sm text-gray-200 font-medium">{getFrameLabel(frameId)}</p>
                    <p className="text-xs text-gray-500 font-mono">{frameId}</p>
                  </div>
                  {equippedFrame === frameId && (
                    <span className="text-xs bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded">Надета</span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmRemove({ itemType: 'frame', itemId: frameId, label: getFrameLabel(frameId) })}
                  className="border-red-800 text-red-400 hover:bg-red-900/30 hover:text-red-300"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Удалить
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'season' && (
        <div className="space-y-2">
          {seasonRewardsWithItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Gift className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Нет сезонных предметов</p>
            </div>
          ) : (
            seasonRewardsWithItems.map((reward) => (
              <div key={`${reward.seasonKey}-${reward.rankKey}`} className="bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-amber-200">
                      {reward.seasonKey} — {getRankLabel(reward.rankKey, reward.avatarId)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      reward.claimed
                        ? 'bg-green-900/50 text-green-300'
                        : 'bg-yellow-900/50 text-yellow-300'
                    }`}>
                      {reward.claimed ? 'Забрано' : 'Не забрано'}
                    </span>
                  </div>
                </div>
                {reward.avatarId && (
                  <div className="flex items-center gap-2 ml-6">
                    <span className="text-gray-500 text-xs">Аватарка:</span>
                    <span className="text-xs text-gray-300 font-medium">{getAvatarLabel(reward.avatarId)}</span>
                    <span className="text-xs text-gray-600 font-mono">{reward.avatarId}</span>
                  </div>
                )}
                {reward.frameId && (
                  <div className="flex items-center gap-2 ml-6">
                    <span className="text-gray-500 text-xs">Рамка:</span>
                    <span className="text-xs text-gray-300 font-medium">{getFrameLabel(reward.frameId)}</span>
                    <span className="text-xs text-gray-600 font-mono">{reward.frameId}</span>
                  </div>
                )}
              </div>
            ))
          )}
          {pendingSeasonRewards.filter(r => !r.avatarId && !r.frameId).length > 0 && (
            <p className="text-xs text-gray-600 text-center pt-2">
              + {pendingSeasonRewards.filter(r => !r.avatarId && !r.frameId).length} наград без предметов (только шаныраки)
            </p>
          )}
        </div>
      )}

      {/* Confirm Remove Dialog */}
      <Dialog open={!!confirmRemove} onOpenChange={(open) => !open && setConfirmRemove(null)}>
        <DialogContent className="bg-gray-950 border-gray-800 text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-amber-100">Удалить предмет?</DialogTitle>
            <DialogDescription className="text-gray-400">
              Предмет <span className="text-amber-300 font-medium">"{confirmRemove?.label}"</span> будет удалён из инвентаря игрока без возврата средств. Это действие необратимо.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmRemove(null)} className="border-gray-700 text-gray-300">
              Отмена
            </Button>
            <Button
              onClick={() => confirmRemove && removeMutation.mutate({
                profileId,
                itemType: confirmRemove.itemType,
                itemId: confirmRemove.itemId,
              })}
              disabled={removeMutation.isPending}
              className="bg-red-700 hover:bg-red-800 text-white"
            >
              {removeMutation.isPending ? 'Удаление...' : 'Удалить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
