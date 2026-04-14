import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Package, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { AVATAR_FRAMES } from "@/components/ShopModal";
import { AVATAR_OPTIONS } from "@shared/avatars";

export function ProfileItemsSection({ profileId }: { profileId: number }) {
  const utils = trpc.useUtils();
  const [confirmRemove, setConfirmRemove] = useState<{ itemType: 'avatar' | 'frame'; itemId: string; label: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'avatars' | 'frames'>('avatars');

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

  const getAvatarLabel = (id: string) => {
    const found = AVATAR_OPTIONS.find(a => a.id === id);
    return found ? (found.name || id) : id;
  };

  const getFrameLabel = (id: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const found = AVATAR_FRAMES.find((f: any) => f.id === id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return found ? ((found as any).label || (found as any).name || id) : id;
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500 animate-pulse">Загрузка...</div>;
  }

  const avatars = items?.avatars ?? [];
  const frames = items?.frames ?? [];
  const equippedAvatar = items?.equippedAvatar;
  const equippedFrame = items?.equippedFrame;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Инвентарь игрока (удаление без возврата средств)</span>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="border-gray-700 text-gray-300">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Sub-tabs: Avatars / Frames */}
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
