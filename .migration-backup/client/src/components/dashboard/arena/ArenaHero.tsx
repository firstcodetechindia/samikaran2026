import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrendingUp, TrendingDown, Minus, Flame, Shield, Zap } from "lucide-react";
import type { GamificationLevel, StudentXP, StudentStreak, RankChange } from "@/hooks/use-gamification";

interface ArenaHeroProps {
  profile: any;
  level: GamificationLevel;
  xp: StudentXP;
  streak: StudentStreak;
  rankChange: RankChange;
  studentRegion?: any;
}

const TIER_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  bronze: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  silver: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
  gold: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  diamond: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
  master: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
};

export function ArenaHero({ profile, level, xp, streak, rankChange, studentRegion }: ArenaHeroProps) {
  const badge = TIER_BADGES[level.tier] || TIER_BADGES.bronze;
  const initials = `${(profile?.firstName || "S")[0]}${(profile?.lastName || "")[0] || ""}`.toUpperCase();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6" data-testid="arena-hero">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="relative">
          <div className="rounded-full p-[2px] bg-gradient-to-br from-indigo-500 to-violet-500">
            <Avatar className="h-16 w-16 border-2 border-white">
              <AvatarImage src={profile?.avatarUrl} alt={profile?.firstName} />
              <AvatarFallback className="bg-indigo-50 text-indigo-700 text-lg font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className={`absolute -bottom-1 -right-1 ${badge.bg} ${badge.text} border ${badge.border} text-[10px] font-bold px-1.5 py-0.5 rounded-md`}>
            {level.tier.toUpperCase()}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight" data-testid="text-player-name">
              {profile?.firstName} {profile?.lastName}
            </h2>
            <span className="text-indigo-600 text-xs font-semibold flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
              <Shield className="w-3 h-3" />
              Level {level.level}
            </span>
          </div>

          <p className="text-slate-500 text-sm font-medium mb-3" data-testid="text-level-title">
            {level.title}
          </p>

          <div className="mb-3 max-w-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-500 text-xs flex items-center gap-1">
                <Zap className="w-3 h-3 text-indigo-400" />
                {xp.totalXP} XP
              </span>
              <span className="text-slate-400 text-xs">{level.xpForNextLevel} XP next</span>
            </div>
            <div className="arena-progress" data-testid="progress-xp">
              <div className="arena-progress-bar" style={{ width: `${level.xpProgress}%` }} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {streak.currentStreak > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200" data-testid="text-streak">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-slate-700 text-xs font-semibold">{streak.currentStreak} day streak</span>
              </div>
            )}

            {rankChange.currentRank && (
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200" data-testid="text-rank">
                <span className="text-slate-700 text-xs font-bold">#{rankChange.currentRank}</span>
                {rankChange.direction === "up" && (
                  <span className="flex items-center gap-0.5 text-emerald-600 text-xs font-medium">
                    <TrendingUp className="w-3 h-3" />+{rankChange.change}
                  </span>
                )}
                {rankChange.direction === "down" && (
                  <span className="flex items-center gap-0.5 text-rose-500 text-xs font-medium">
                    <TrendingDown className="w-3 h-3" />-{rankChange.change}
                  </span>
                )}
                {rankChange.direction === "same" && <Minus className="w-3 h-3 text-slate-400" />}
              </div>
            )}

            {studentRegion?.stateName && (
              <span className="text-slate-400 text-xs">
                {studentRegion.cityName || studentRegion.stateName}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
