import { useState } from 'react';
import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

import { Badge } from '@/components/ui/badge';
import { Trophy, Swords, Banknote, Loader2, Flame, X } from 'lucide-react';
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
  const { isAuthenticated } = useAuth();
  const checkLeaderboardAchievements = trpc.stats.checkLeaderboardAchievements.useMutation();

  // Check leaderboard achievements when drawer opens
  useEffect(() => {
    if (open && isAuthenticated) {
      checkLeaderboardAchievements.mutate();
    }
  }, [open, isAuthenticated]);

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

  // Use active test season key if available, otherwise current real season
  const { data: activeTestKeyData } = trpc.season.activeTestKey.useQuery(undefined, { refetchInterval: 30000 });
  const seasonKey = activeTestKeyData?.testSeasonKey ?? getCurrentSeasonKey();
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
      label: t('lobby.season'),
      icon: <Flame className="w-3.5 h-3.5 shrink-0" />,
    },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => onOpenChange(false)} />

      {/* Panel */}
      <div
        className="relative w-full sm:max-w-[480px] flex flex-col bg-[#0f2035] border border-amber-700/30 sm:rounded-2xl overflow-hidden"
        style={{
          height: '100dvh',
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-amber-700/20 shrink-0">
          <span className="text-amber-100 font-semibold text-base flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            {t('lobby.leaderboard')}
          </span>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-amber-200/70 hover:text-amber-100 hover:bg-black/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab buttons */}
        <div className="px-4 py-2 shrink-0">
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
                  {(ratingQuery.data ?? []).map((player: NonNullable<typeof ratingQuery.data>[number], idx: number) => {
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
                  <div className="grid grid-cols-[1.5rem_1fr_4rem_4rem_4.5rem] items-center px-3 py-1 mb-1 text-[10px] text-amber-200/40 font-medium uppercase tracking-wide gap-x-2">
                    <span />
                    <span>{t('profile.player')}</span>
                    <span className="text-center">W</span>
                    <span className="text-center">L</span>
                    <span className="text-center">WR%</span>
                  </div>
                  <div className="space-y-1">
                    {(winsQuery.data ?? []).map((player: NonNullable<typeof winsQuery.data>[number], idx: number) => {
                      const isMe = player.gameId === myGameId;
                      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
                      return (
                        <div
                          key={player.gameId}
                          className={`grid grid-cols-[1.5rem_1fr_4rem_4rem_4.5rem] items-center px-3 py-2 rounded-lg gap-x-2 ${
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
                  {(shanyraqQuery.data ?? []).map((player: NonNullable<typeof shanyraqQuery.data>[number], idx: number) => {
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
                  {(seasonQuery.data?.entries ?? []).map((entry: NonNullable<typeof seasonQuery.data>['entries'][number], idx: number) => {
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
                            {t('lobby.leaderboardPointsAbbr')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {(seasonQuery.data?.entries ?? []).length === 0 && (
                    <div className="text-center py-8 text-amber-200/30 text-sm">
                      {t('lobby.leaderboardNoPlayers')}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Close button at bottom */}
        <div
          className="shrink-0 px-4 pt-3 border-t border-amber-700/20"
          style={{ paddingBottom: 'max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))' }}
        >
          <button
            onClick={() => onOpenChange(false)}
            className="w-full py-3 rounded-xl font-semibold text-sm"
            style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}
          >
            {t('season.closeButton')}
          </button>
        </div>
      </div>
    </div>
  );
}
