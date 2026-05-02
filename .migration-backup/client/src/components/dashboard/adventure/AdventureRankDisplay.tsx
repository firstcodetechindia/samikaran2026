import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { RankChange } from "@/hooks/use-gamification";

interface AdventureRankDisplayProps {
  rankChange: RankChange;
  cityName?: string | null;
  stateName?: string | null;
  schoolName?: string | null;
  cityRank?: number | null;
  stateRank?: number | null;
  schoolRank?: number | null;
}

const rankEmojis = ["🏅", "🏫", "🏙️", "🗺️"];

export function AdventureRankDisplay({
  rankChange,
  cityName,
  stateName,
  schoolName,
  cityRank,
  stateRank,
  schoolRank,
}: AdventureRankDisplayProps) {
  const ranks = [
    { label: "Overall", value: rankChange.currentRank, color: "text-orange-500", bg: "bg-gradient-to-br from-orange-50 to-amber-50", border: "border-orange-200" },
    ...(schoolRank ? [{ label: schoolName || "School", value: schoolRank, color: "text-green-500", bg: "bg-gradient-to-br from-green-50 to-emerald-50", border: "border-green-200" }] : []),
    ...(cityRank ? [{ label: cityName || "City", value: cityRank, color: "text-blue-500", bg: "bg-gradient-to-br from-blue-50 to-sky-50", border: "border-blue-200" }] : []),
    ...(stateRank ? [{ label: stateName || "State", value: stateRank, color: "text-purple-500", bg: "bg-gradient-to-br from-purple-50 to-violet-50", border: "border-purple-200" }] : []),
  ];

  if (!rankChange.currentRank && !schoolRank && !cityRank && !stateRank) {
    return null;
  }

  return (
    <div className="adventure-card p-5" data-testid="adventure-rank-display">
      <h3 className="text-lg font-extrabold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-xl">🗺️</span> My Rankings
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {ranks.map((rank, idx) =>
          rank.value ? (
            <div
              key={rank.label}
              className={`${rank.bg} rounded-2xl p-3 text-center border ${rank.border}`}
              data-testid={`rank-${rank.label.toLowerCase()}`}
            >
              <span className="text-lg">{rankEmojis[idx] || "🏅"}</span>
              <p className={`text-2xl font-extrabold ${rank.color} mt-1`}>#{rank.value}</p>
              <p className="text-[10px] text-gray-500 font-bold mt-0.5 truncate uppercase tracking-wide">
                {rank.label}
              </p>
            </div>
          ) : null
        )}
      </div>

      {rankChange.direction !== "new" && rankChange.change > 0 && (
        <div className="mt-3 flex items-center justify-center gap-1.5 text-sm">
          {rankChange.direction === "up" ? (
            <>
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-green-600 font-bold">
                Up {rankChange.change} places! 🎉
              </span>
            </>
          ) : rankChange.direction === "down" ? (
            <>
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-red-500 font-bold">
                Down {rankChange.change} — keep trying! 💪
              </span>
            </>
          ) : (
            <>
              <Minus className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500 font-medium">Same rank — keep going!</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
