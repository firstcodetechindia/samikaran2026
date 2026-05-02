import { Flame, Zap, Shield, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { GamificationLevel, StudentXP, StudentStreak, RankChange } from "@/hooks/use-gamification";

interface ArenaTopBarProps {
  level: GamificationLevel;
  xp: StudentXP;
  streak: StudentStreak;
  rankChange: RankChange;
  studentName: string;
}

const TIER_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  bronze: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  silver: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
  gold: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  diamond: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
  master: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
};

export function ArenaTopBar({ level, xp, streak, rankChange, studentName }: ArenaTopBarProps) {
  const tier = TIER_STYLES[level.tier] || TIER_STYLES.bronze;

  return (
    <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 w-full" data-testid="arena-top-bar">
      <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${tier.bg} ${tier.border}`}>
        <Shield className={`w-3.5 h-3.5 ${tier.text}`} />
        <span className={`text-[11px] font-bold uppercase tracking-wider ${tier.text}`}>{level.tier}</span>
        <span className="text-slate-400 text-[11px]">Lv.{level.level}</span>
      </div>

      <div className="flex-1 flex items-center gap-2 min-w-0">
        <Zap className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
        <div className="flex-1 min-w-0 max-w-[140px]">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] text-slate-500 font-medium">{xp.totalXP} XP</span>
          </div>
          <div className="h-1.5 rounded-full bg-indigo-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
              style={{ width: `${level.xpProgress}%` }}
            />
          </div>
        </div>
      </div>

      {rankChange.currentRank && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 border border-slate-200">
          <span className="text-slate-700 text-[11px] font-bold">#{rankChange.currentRank}</span>
          {rankChange.direction === "up" && <TrendingUp className="w-3 h-3 text-emerald-500" />}
          {rankChange.direction === "down" && <TrendingDown className="w-3 h-3 text-rose-500" />}
          {(rankChange.direction === "same" || rankChange.direction === "new") && (
            <Minus className="w-3 h-3 text-slate-400" />
          )}
        </div>
      )}

      {streak.currentStreak > 0 && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 border border-slate-200">
          <Flame className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-slate-700 text-[11px] font-bold">{streak.currentStreak}</span>
        </div>
      )}

      <div className="hidden md:block text-[11px] text-slate-500 font-medium truncate max-w-[100px]">
        {studentName}
      </div>
    </div>
  );
}
