import { trpc } from '@/lib/trpc';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Trophy, Loader2 } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface LeaderboardDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  myGameId?: number;
}

export default function LeaderboardDrawer({ open, onOpenChange, myGameId }: LeaderboardDrawerProps) {
  const { t } = useTranslation();
  const leaderboardQuery = trpc.stats.leaderboard.useQuery({ limit: 50 }, {
    staleTime: 30_000,
    enabled: open,
  });

  const data = leaderboardQuery.data ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="bg-[#0f2035] border-amber-700/30 text-amber-100 w-[calc(100vw-2rem)] max-w-[400px] p-0 overflow-hidden flex flex-col"
      >
        <SheetHeader className="px-4 pt-4 pb-2 shrink-0">
          <SheetTitle className="text-amber-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            {t('lobby.leaderboard')}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {leaderboardQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            </div>
          ) : (
            <div className="mt-3 space-y-1">
              {data.map((player, idx) => {
                const isMe = player.gameId === myGameId;
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
                return (
                  <div
                    key={player.gameId}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                      isMe ? 'bg-amber-700/20 border border-amber-600/30' : 'bg-[#1a2d45]/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-amber-200/50 text-xs w-6 text-right">
                        {medal || `${idx + 1}.`}
                      </span>
                      <span className={`text-sm font-medium ${isMe ? 'text-amber-300' : 'text-amber-100'}`}>
                        {player.displayName || t('profile.player')}
                      </span>
                      <span className="text-amber-200/30 text-[10px]">#{player.gameId}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-amber-200/50 text-[10px]">
                        {player.wins}{t('profile.wins').charAt(0)}/{player.losses}{t('profile.losses').charAt(0)}
                      </span>
                      <Badge variant="outline" className="border-amber-700/20 text-amber-300 text-xs px-1.5">
                        {player.rating}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {data.length === 0 && (
                <div className="text-center py-8 text-amber-200/30 text-sm">
                  {t('profile.noLeaderboard')}
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
