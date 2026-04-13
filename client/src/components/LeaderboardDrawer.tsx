import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Trophy, Swords, Coins, Loader2 } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface LeaderboardDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  myGameId?: number;
}

type Tab = 'rating' | 'wins' | 'shanyrak';

export default function LeaderboardDrawer({ open, onOpenChange, myGameId }: LeaderboardDrawerProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('rating');

  const ratingQuery = trpc.stats.leaderboard.useQuery({ limit: 50 }, {
    staleTime: 30_000,
    enabled: open && activeTab === 'rating',
  });

  const winsQuery = trpc.stats.winsLeaderboard.useQuery({ limit: 50 }, {
    staleTime: 30_000,
    enabled: open && activeTab === 'wins',
  });

  const shanyraqQuery = trpc.stats.shanyraqLeaderboard.useQuery({ limit: 50 }, {
    staleTime: 30_000,
    enabled: open && activeTab === 'shanyrak',
  });

  const isLoading =
    (activeTab === 'rating' && ratingQuery.isLoading) ||
    (activeTab === 'wins' && winsQuery.isLoading) ||
    (activeTab === 'shanyrak' && shanyraqQuery.isLoading);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'rating', label: t('lobby.leaderboardTabs.rating'), icon: <Trophy className="w-3.5 h-3.5" /> },
    { key: 'wins', label: t('lobby.leaderboardTabs.wins'), icon: <Swords className="w-3.5 h-3.5" /> },
    { key: 'shanyrak', label: t('lobby.leaderboardTabs.shanyrak'), icon: <Coins className="w-3.5 h-3.5" /> },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="bg-[#0f2035] border-amber-700/30 text-amber-100 w-[calc(100vw-2rem)] max-w-[420px] p-0 overflow-hidden flex flex-col"
      >
        <SheetHeader className="px-4 pt-4 pb-2 shrink-0">
          <SheetTitle className="text-amber-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            {t('lobby.leaderboard')}
          </SheetTitle>
        </SheetHeader>

        {/* Tab buttons */}
        <div className="px-4 pb-2 shrink-0">
          <div className="flex gap-1 bg-[#1a2d45]/60 rounded-lg p-1">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-amber-600/80 text-amber-100 shadow-sm'
                    : 'text-amber-300/60 hover:text-amber-300/90 hover:bg-[#1a2d45]'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            </div>
          ) : (
            <>
              {/* Rating tab */}
              {activeTab === 'rating' && (
                <div className="mt-1 space-y-1">
                  {(ratingQuery.data ?? []).map((player, idx) => {
                    const isMe = player.gameId === myGameId;
                    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
                    return (
                      <div
                        key={player.gameId}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                          isMe ? 'bg-amber-700/20 border border-amber-600/30' : 'bg-[#1a2d45]/40'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-amber-200/50 text-xs w-6 text-right shrink-0">
                            {medal || `${idx + 1}.`}
                          </span>
                          <span className={`text-sm font-medium truncate ${isMe ? 'text-amber-300' : 'text-amber-100'}`}>
                            {player.displayName || t('profile.player')}
                          </span>
                          <span className="text-amber-200/30 text-[10px] shrink-0">#{player.gameId}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-amber-200/50 text-[10px]">
                            {player.wins}W/{player.losses}L
                          </span>
                          <Badge variant="outline" className="border-amber-700/20 text-amber-300 text-xs px-1.5">
                            {player.rating}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                  {(ratingQuery.data ?? []).length === 0 && (
                    <div className="text-center py-8 text-amber-200/30 text-sm">
                      {t('profile.noLeaderboard')}
                    </div>
                  )}
                </div>
              )}

              {/* Wins tab */}
              {activeTab === 'wins' && (
                <div className="mt-1">
                  {/* Header row */}
                  <div className="flex items-center px-3 py-1.5 mb-1 text-[10px] text-amber-200/40 font-medium uppercase tracking-wide">
                    <span className="w-6 shrink-0" />
                    <span className="flex-1">{t('profile.player')}</span>
                    <div className="flex items-center gap-3 shrink-0 text-right">
                      <span className="w-10">{t('lobby.leaderboardWins.matches')}</span>
                      <span className="w-8">{t('lobby.leaderboardWins.wins')}</span>
                      <span className="w-8">{t('lobby.leaderboardWins.losses')}</span>
                      <span className="w-10">{t('lobby.leaderboardWins.winrate')}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {(winsQuery.data ?? []).map((player, idx) => {
                      const isMe = player.gameId === myGameId;
                      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
                      return (
                        <div
                          key={player.gameId}
                          className={`flex items-center px-3 py-2 rounded-lg ${
                            isMe ? 'bg-amber-700/20 border border-amber-600/30' : 'bg-[#1a2d45]/40'
                          }`}
                        >
                          <span className="text-amber-200/50 text-xs w-6 text-right shrink-0">
                            {medal || `${idx + 1}.`}
                          </span>
                          <span className={`flex-1 text-sm font-medium truncate ml-2 ${isMe ? 'text-amber-300' : 'text-amber-100'}`}>
                            {player.displayName || t('profile.player')}
                          </span>
                          <div className="flex items-center gap-3 shrink-0 text-xs text-right">
                            <span className="w-10 text-amber-200/50">{player.gamesPlayed}</span>
                            <span className="w-8 text-green-400/80 font-medium">{player.wins}</span>
                            <span className="w-8 text-red-400/70">{player.losses}</span>
                            <Badge
                              variant="outline"
                              className={`w-10 justify-center border-amber-700/20 text-xs px-1 ${
                                player.winrate >= 60 ? 'text-green-400' :
                                player.winrate >= 40 ? 'text-amber-300' : 'text-red-400/80'
                              }`}
                            >
                              {player.winrate}%
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                    {(winsQuery.data ?? []).length === 0 && (
                      <div className="text-center py-8 text-amber-200/30 text-sm">
                        {t('profile.noLeaderboard')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Shanyrak tab */}
              {activeTab === 'shanyrak' && (
                <div className="mt-1 space-y-1">
                  {(shanyraqQuery.data ?? []).map((player, idx) => {
                    const isMe = player.gameId === myGameId;
                    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
                    return (
                      <div
                        key={player.gameId}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                          isMe ? 'bg-amber-700/20 border border-amber-600/30' : 'bg-[#1a2d45]/40'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-amber-200/50 text-xs w-6 text-right shrink-0">
                            {medal || `${idx + 1}.`}
                          </span>
                          <span className={`text-sm font-medium truncate ${isMe ? 'text-amber-300' : 'text-amber-100'}`}>
                            {player.displayName || t('profile.player')}
                          </span>
                          <span className="text-amber-200/30 text-[10px] shrink-0">#{player.gameId}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-amber-200/50 text-[10px]">
                            {t('lobby.leaderboardShanyrak.balance')}
                          </span>
                          <Badge variant="outline" className="border-amber-500/30 text-amber-300 text-xs px-1.5 font-semibold">
                            ◈ {player.balanceShanyrak.toLocaleString()}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                  {(shanyraqQuery.data ?? []).length === 0 && (
                    <div className="text-center py-8 text-amber-200/30 text-sm">
                      {t('profile.noLeaderboard')}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
