import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { GamificationLevel, StudentStreak, RankChange } from "@/hooks/use-gamification";
import { Flame, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface AdventureHeroProps {
  studentName: string;
  level: GamificationLevel;
  streak: StudentStreak;
  rankChange: RankChange;
}

const tierEmojis: Record<string, string> = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  diamond: "💎",
  master: "👑",
};

const tierGradients: Record<string, string> = {
  bronze: "from-amber-400 to-orange-400",
  silver: "from-gray-300 to-slate-400",
  gold: "from-yellow-300 to-amber-400",
  diamond: "from-cyan-300 to-blue-400",
  master: "from-pink-400 to-purple-500",
};

export function AdventureHero({ studentName, level, streak, rankChange }: AdventureHeroProps) {
  const firstName = studentName?.split(" ")[0] || "Explorer";
  const initials = studentName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "EX";

  return (
    <div className="adventure-card p-6 relative overflow-hidden" data-testid="adventure-hero">
      <div className="absolute top-3 right-4 text-4xl opacity-20 adventure-star-spin">⭐</div>
      <div className="absolute bottom-2 left-4 text-2xl opacity-15 adventure-wiggle">🌈</div>

      <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10">
        <div className="relative adventure-bounce">
          <div className={`rounded-full p-1 bg-gradient-to-br ${tierGradients[level.tier] || tierGradients.bronze}`}>
            <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
              <AvatarFallback
                className={`bg-gradient-to-br ${tierGradients[level.tier] || tierGradients.bronze} text-white text-3xl font-bold`}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full px-2.5 py-1 text-xs font-bold text-orange-600 border-2 border-orange-300 shadow-md flex items-center gap-1"
            data-testid="text-adventure-level-badge"
          >
            <span>{tierEmojis[level.tier] || "🌟"}</span>
            Lv.{level.level}
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <p className="text-base font-bold text-orange-500 mb-0.5 flex items-center gap-1 justify-center sm:justify-start" data-testid="text-adventure-greeting">
            <span className="text-xl">👋</span> Hey {firstName}!
          </p>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-1" data-testid="text-adventure-title">
            {level.title}
          </h2>

          <div className="mt-3 max-w-xs mx-auto sm:mx-0">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5 font-medium">
              <span>✨ {level.currentXP} XP</span>
              <span>{level.xpForNextLevel} XP</span>
            </div>
            <div className="adventure-progress" data-testid="adventure-xp-bar">
              <div className="adventure-progress-bar" style={{ width: `${level.xpProgress}%` }} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap justify-center">
          {streak.currentStreak > 0 && (
            <div className="flex flex-col items-center gap-1 adventure-card-purple p-3 rounded-2xl" data-testid="text-adventure-streak">
              <Flame className="w-7 h-7 text-orange-500 adventure-wiggle" />
              <span className="text-2xl font-extrabold text-purple-600">
                {streak.currentStreak}
              </span>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Streak</span>
            </div>
          )}

          {rankChange.currentRank && (
            <div className="flex flex-col items-center gap-1 adventure-card-green p-3 rounded-2xl" data-testid="text-adventure-rank">
              {rankChange.direction === "up" ? (
                <TrendingUp className="w-6 h-6 text-green-500" />
              ) : rankChange.direction === "down" ? (
                <TrendingDown className="w-6 h-6 text-red-400" />
              ) : (
                <Minus className="w-6 h-6 text-gray-400" />
              )}
              <span className="text-2xl font-extrabold text-green-600">
                #{rankChange.currentRank}
              </span>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Rank</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
