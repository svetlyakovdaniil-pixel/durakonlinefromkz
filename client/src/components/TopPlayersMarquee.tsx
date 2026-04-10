import { trpc } from '@/lib/trpc';
import { Trophy, Medal, Award, Star, Swords, Skull } from 'lucide-react';
import { useTranslation } from '@/i18n';

const PLACE_CONFIG = [
  { icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30', label: '#1' },
  { icon: Medal, color: 'text-gray-300', bg: 'bg-gray-300/10', border: 'border-gray-300/30', label: '#2' },
  { icon: Award, color: 'text-amber-600', bg: 'bg-amber-600/10', border: 'border-amber-600/30', label: '#3' },
];

export default function TopPlayersMarquee() {
  const { t } = useTranslation();
  const { data: topPlayers } = trpc.stats.leaderboard.useQuery(
    { limit: 3 },
    { refetchInterval: 60000, staleTime: 30000 }
  );

  if (!topPlayers || topPlayers.length === 0) return null;

  const renderPlayer = (player: typeof topPlayers[number], index: number) => {
    const config = PLACE_CONFIG[index];
    if (!config) return null;
    const Icon = config.icon;
    const winRate = player.gamesPlayed > 0
      ? Math.round((player.wins / player.gamesPlayed) * 100)
      : 0;

    return (
      <span key={player.gameId} className="inline-flex items-center gap-3 mx-8 whitespace-nowrap">
        {/* Place badge */}
        <span className={`inline-flex items-center gap-1 ${config.color} font-bold text-sm`}>
          <Icon className="w-4 h-4" />
          {config.label}
        </span>
        {/* Player name */}
        <span className="text-amber-100 font-semibold text-sm">
          {player.displayName || `Player ${player.gameId}`}
        </span>
        {/* ID */}
        <span className="text-amber-400/50 text-xs font-mono">
          ID:{player.gameId}
        </span>
        {/* Win/Loss */}
        <span className="inline-flex items-center gap-1.5 text-xs">
          <span className="inline-flex items-center gap-0.5 text-emerald-400">
            <Swords className="w-3 h-3" />
            {player.wins}W
          </span>
          <span className="text-amber-400/30">/</span>
          <span className="inline-flex items-center gap-0.5 text-red-400">
            <Skull className="w-3 h-3" />
            {player.losses}L
          </span>
          <span className="text-amber-400/30">·</span>
          <span className="text-amber-200/70">{winRate}%</span>
        </span>
        {/* Rating */}
        <span className="inline-flex items-center gap-0.5 text-amber-300 text-xs font-medium">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          {player.rating}
        </span>
      </span>
    );
  };

  // Duplicate content for seamless loop
  const content = topPlayers.map((p: typeof topPlayers[number], i: number) => renderPlayer(p, i));

  return (
    <div className="w-full overflow-hidden bg-gradient-to-r from-amber-900/20 via-amber-800/15 to-amber-900/20 border-y border-amber-700/20 py-1.5 relative">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0a1628] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0a1628] to-transparent z-10 pointer-events-none" />
      
      <div className="marquee-track">
        <div className="marquee-content">
          {content}
          {content}
        </div>
      </div>
    </div>
  );
}
