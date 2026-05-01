import { Crown, Medal, Trophy } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { RankChange } from "@/hooks/use-gamification";

interface ArenaRankWallProps {
  rankChange: RankChange;
  profile: any;
  results: any[];
}

export function ArenaRankWall({ rankChange, profile, results }: ArenaRankWallProps) {
  const currentRank = rankChange.currentRank;
  const initials = `${(profile?.firstName || "S")[0]}${(profile?.lastName || "")[0] || ""}`.toUpperCase();
  const totalExamsTaken = results.length;

  if (!currentRank) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm" data-testid="arena-rank-wall">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
            <Crown className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-slate-800 font-bold text-sm tracking-wide uppercase">Rankings</h3>
        </div>
        <div className="text-center py-8">
          <Trophy className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 text-sm font-medium">Complete exams to get ranked</p>
          <p className="text-slate-400 text-xs mt-1">Your rank will appear here</p>
        </div>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-4 h-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-slate-400" />;
    if (rank === 3) return <Medal className="w-4 h-4 text-amber-600" />;
    return <span className="text-slate-400 text-xs font-mono">{rank}</span>;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm" data-testid="arena-rank-wall">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
          <Crown className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-slate-800 font-bold text-sm tracking-wide uppercase">Rankings</h3>
      </div>

      <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 px-4 py-3 rounded-lg mb-4" data-testid="rank-entry-current">
        <div className="w-6 flex justify-center">{getRankIcon(currentRank)}</div>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-indigo-700 text-sm font-semibold truncate">
            {profile?.firstName} {profile?.lastName}
            <span className="text-slate-400 text-[10px] ml-1">(You)</span>
          </p>
          <p className="text-slate-400 text-xs">{totalExamsTaken} exam{totalExamsTaken !== 1 ? "s" : ""} completed</p>
        </div>
        <span className="text-indigo-700 font-bold text-sm">#{currentRank}</span>
      </div>

      {rankChange.direction === "up" && rankChange.change > 0 && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 text-center">
          <p className="text-emerald-700 text-xs font-semibold">
            Moved up {rankChange.change} spot{rankChange.change > 1 ? "s" : ""} — keep pushing!
          </p>
        </div>
      )}
      {rankChange.direction === "down" && rankChange.change > 0 && (
        <div className="bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 text-center">
          <p className="text-rose-600 text-xs font-semibold">
            Dropped {rankChange.change} spot{rankChange.change > 1 ? "s" : ""} — time to compete harder
          </p>
        </div>
      )}
      {rankChange.direction === "same" && (
        <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-center">
          <p className="text-slate-500 text-xs">Take more exams to improve your rank</p>
        </div>
      )}
    </div>
  );
}
