import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Trophy, Swords, Banknote, Loader2, Flame } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { DiamondRankIcon } from '@/components/DiamondRankIcon';
import { getCurrentSeasonKey } from '../../../shared/seasons';

interface LeaderboardDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  myGameId?: number;
}

type Tab = 'rating' | 'wins' | 'shanyrak' | 'season';

export default function LeaderboardDrawer({ open, onOpenChange, myGameId }: LeaderboardDrawerProps) {
  const { t, locale } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('rating');

  const ratingQuery = trpc.stats.leaderboard.useQuery({ limit: 50 }, {
    staleTime: 15_000,
    refetchInterval: open ? 30_000 : false,
    enabled: open,
  });

  const winsQuery = trpc.stats.winsLeaderboard.useQuery({ limit: 50 }, {
    staleTime: 15_000,
    refetchInterval: open ? 30_000 : false,
    enabled: open,
  });

  const shanyraqQuery = trpc.stats.shanyraqLeaderboard.useQuery({ limit: 50 }, {
    staleTime: 15_000,
    refetchInterval: open ? 30_000 : false,
    enabled: open,
  });

  const seasonKey = getCurrentSeasonKey();
  const seasonQuery = trpc.season.leaderboard.useQuery({ seasonKey }, {
    staleTime: 15_000,
    refetchInterval: open && activeTab === 'season' ? 30_000 : false,
    enabled: open && activeTab === 'season',
  });

  const isLoading =
    (activeTab === 'rating' && ratingQuery.isLoading) ||
    (activeTab === 'wins' && winsQuery.isLoading) ||
    (activeTab === 'shanyrak' && shanyraqQuery.isLoading) ||
    (activeTab === 'season' && seasonQuery.isLoading);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'rating', label: t('lobby.leaderboardTabs.rating'), icon: <Trophy className="w-3.5 h-3.5 shrink-0" /> },
    { key: 'wins', label: t('lobby.leaderboardTabs.wins'), icon: <Swords className="w-3.5 h-3.5 shrink-0" /> },
    { key: 'shanyrak', label: t('lobby.leaderboardTabs.shanyrak'), icon: <Banknote className="w-3.5 h-3.5 shrink-0" /> },
    {
      key: 'season',
      label: locale === 'kk' ? 'Маусым' : locale === 'en' ? 'Season' : 'Сезон',
      icon: <Flame className="w-3.5 h-3.5 shrink-0" />,
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="bg-[#0f2035] border-amber-700/30 text-amber-100 w-[calc(100vw-2rem)] max-w-[480px] p-0 overflow-hidden flex flex-col"
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
                className={`flex-1 flex items-center justify-center gap-1 px-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-amber-600/80 text-amber-100 shadow-sm'
                    : 'text-amber-300/60 hover:text-amber-300/90 hover:bg-[#1a2d45]'
                }`}
              >
                {tab.icon}
                <span className="truncate">{tab.label}</span>
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
              {/* ── Rating tab ── */}
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
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-amber-200/50 text-[10px] hidden sm:inline">
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

              {/* ── Wins tab ── */}
              {activeTab === 'wins' && (
                <div className="mt-1">
                  {/* Column headers */}
                  <div className="grid grid-cols-[1.5rem_1fr_3.5rem_3.5rem_4rem] items-center px-3 py-1 mb-1 text-[10px] text-amber-200/40 font-medium uppercase tracking-wide gap-x-1">
                    <span />
                    <span>{t('profile.player')}</span>
                    <span className="text-center">{t('lobby.leaderboardWins.wins')}</span>
                    <span className="text-center">{t('lobby.leaderboardWins.losses')}</span>
                    <span className="text-center">{t('lobby.leaderboardWins.winrate')}</span>
                  </div>
                  <div className="space-y-1">
                    {(winsQuery.data ?? []).map((player, idx) => {
                      const isMe = player.gameId === myGameId;
                      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
                      return (
                        <div
                          key={player.gameId}
                          className={`grid grid-cols-[1.5rem_1fr_3.5rem_3.5rem_4rem] items-center px-3 py-2 rounded-lg gap-x-1 ${
                            isMe ? 'bg-amber-700/20 border border-amber-600/30' : 'bg-[#1a2d45]/40'
                          }`}
                        >
                          <span className="text-amber-200/50 text-xs text-right shrink-0">
                            {medal || `${idx + 1}.`}
                          </span>
                          <span className={`text-sm font-medium truncate ${isMe ? 'text-amber-300' : 'text-amber-100'}`}>
                            {player.displayName || t('profile.player')}
                          </span>
                          <span className="text-center text-xs text-green-400/80 font-medium">{player.wins}</span>
                          <span className="text-center text-xs text-red-400/70">{player.losses}</span>
                          <span className={`text-center text-xs font-semibold ${
                            player.winrate >= 60 ? 'text-green-400' :
                            player.winrate >= 40 ? 'text-amber-300' : 'text-red-400/80'
                          }`}>
                            {player.winrate}%
                          </span>
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

              {/* ── Shanyrak tab ── */}
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
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Banknote className="w-3.5 h-3.5 text-amber-400/60" />
                          <span className="text-amber-300 text-sm font-semibold">
                            {player.balanceShanyrak.toLocaleString()}
                          </span>
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

              {/* ── Season tab ── */}
              {activeTab === 'season' && (
                <div className="mt-1 space-y-1">
                  {(seasonQuery.data?.entries ?? []).map((entry, idx) => {
                    const isTop3 = idx < 3;
                    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
                    return (
                      <div
                        key={entry.profileId}
                        className="flex items-center justify-between px-3 py-2 rounded-lg"
                        style={{
                          background: isTop3 ? 'rgba(234,179,8,0.08)' : 'rgba(26,45,69,0.4)',
                          border: isTop3 ? '1px solid rgba(234,179,8,0.35)' : '1px solid transparent',
                          boxShadow: isTop3 ? '0 0 8px rgba(234,179,8,0.1)' : 'none',
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-amber-200/50 text-xs w-6 text-right shrink-0">
                            {medal || `${idx + 1}.`}
                          </span>
                          <DiamondRankIcon seasonRating={entry.seasonRating} size={13} showTooltip />
                          <span className={`text-sm font-medium truncate ${isTop3 ? 'text-amber-200' : 'text-amber-100/80'}`}>
                            {entry.displayName || t('profile.player')}
                          </span>
                          <span className="text-amber-200/30 text-[10px] shrink-0">#{entry.gameId}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-amber-300 text-sm font-bold">{entry.seasonRating}</span>
                          <span className="text-amber-200/40 text-[10px]">
                            {locale === 'kk' ? 'ұп' : locale === 'en' ? 'pt' : 'оч'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {(seasonQuery.data?.entries ?? []).length === 0 && (
                    <div className="text-center py-8 text-amber-200/30 text-sm">
                      {locale === 'kk' ? 'Ойыншылар жоқ' : locale === 'en' ? 'No players yet' : 'Пока нет игроков'}
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
