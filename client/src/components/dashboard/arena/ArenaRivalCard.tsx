import { Swords, ChevronRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RankChange } from "@/hooks/use-gamification";

interface ArenaRivalCardProps {
  rankChange: RankChange;
  onBattle?: () => void;
}

export function ArenaRivalCard({ rankChange, onBattle }: ArenaRivalCardProps) {
  if (!rankChange.currentRank) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm" data-testid="arena-rival-card">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center">
            <Swords className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-slate-800 font-bold text-sm tracking-wide uppercase">Rival Zone</h3>
        </div>
        <p className="text-slate-500 text-sm">Complete exams to get ranked and find your rival.</p>
      </div>
    );
  }

  const pointGap = rankChange.change || null;
  const isImproving = rankChange.direction === "up";
  const isDropping = rankChange.direction === "down";

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm" data-testid="arena-rival-card">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center">
          <Swords className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-slate-800 font-bold text-sm tracking-wide uppercase">Rival Zone</h3>
      </div>

      <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">Your Rank</span>
          <span className="text-indigo-600 font-bold text-lg" data-testid="text-current-rank">#{rankChange.currentRank}</span>
        </div>

        {pointGap && pointGap > 0 && (
          <div className={`flex items-center gap-1.5 text-xs font-medium ${isImproving ? "text-emerald-600" : isDropping ? "text-rose-500" : "text-slate-500"}`}>
            <TrendingUp className={`w-3.5 h-3.5 ${isDropping ? "rotate-180" : ""}`} />
            {isImproving ? `Moved up ${pointGap} spot${pointGap > 1 ? "s" : ""}` : isDropping ? `Moved down ${pointGap} spot${pointGap > 1 ? "s" : ""}` : "Rank unchanged"}
          </div>
        )}

        {(!pointGap || pointGap === 0) && (
          <p className="text-slate-400 text-xs">Keep taking exams to climb the ranks</p>
        )}
      </div>

      <Button
        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg"
        onClick={onBattle}
        data-testid="button-battle-now"
      >
        <Swords className="w-4 h-4 mr-1.5" />
        Enter Battle
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}
