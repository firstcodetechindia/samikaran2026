import { Flame, Star, Sparkles } from "lucide-react";
import type { GamificationLevel, StudentStreak, WeeklyStar } from "@/hooks/use-gamification";

interface AdventureTopBarProps {
  level: GamificationLevel;
  streak: StudentStreak;
  weeklyStars: WeeklyStar[];
  studentName: string;
}

const tierEmojis: Record<string, string> = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  diamond: "💎",
  master: "👑",
};

export function AdventureTopBar({ level, streak, weeklyStars, studentName }: AdventureTopBarProps) {
  const totalStars = weeklyStars.reduce((sum, d) => sum + d.stars, 0);

  return (
    <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 w-full" data-testid="adventure-top-bar">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 border-2 border-orange-200 shadow-sm">
        <span className="text-sm">{tierEmojis[level.tier] || "🌟"}</span>
        <span className="text-orange-700 text-xs font-extrabold">{level.title}</span>
        <span className="text-orange-400 text-[10px] font-bold">Lv.{level.level}</span>
      </div>

      <div className="flex-1 flex items-center gap-2 min-w-0">
        <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0" />
        <div className="flex-1 min-w-0 max-w-[140px]">
          <div className="h-2.5 rounded-full bg-orange-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-pink-500 transition-all duration-700"
              style={{ width: `${level.xpProgress}%` }}
            />
          </div>
        </div>
      </div>

      {streak.currentStreak > 0 && (
        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-orange-50 border-2 border-orange-200">
          <Flame className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-orange-600 text-xs font-extrabold">{streak.currentStreak}🔥</span>
        </div>
      )}

      <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-yellow-50 border-2 border-yellow-200">
        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-400" />
        <span className="text-yellow-700 text-xs font-extrabold">{totalStars}</span>
      </div>

      <div className="hidden md:flex items-center gap-1 text-xs text-gray-500 font-bold truncate max-w-[100px]">
        {studentName} <span className="text-sm">🎉</span>
      </div>
    </div>
  );
}
