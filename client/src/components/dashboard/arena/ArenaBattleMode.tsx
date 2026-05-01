import { Trophy, Users, Crown } from "lucide-react";
import type { GamificationLevel } from "@/hooks/use-gamification";

interface ArenaBattleModeProps {
  level: GamificationLevel;
  totalExams: number;
}

export function ArenaBattleMode({ level, totalExams }: ArenaBattleModeProps) {
  const leagues = [
    { name: "Bronze League", minLevel: 1, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: Trophy },
    { name: "Silver League", minLevel: 4, bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", icon: Trophy },
    { name: "Gold League", minLevel: 8, bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", icon: Crown },
    { name: "Diamond League", minLevel: 13, bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", icon: Crown },
    { name: "Master League", minLevel: 17, bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", icon: Crown },
  ];

  const currentLeague = [...leagues].reverse().find(l => level.level >= l.minLevel) || leagues[0];
  const nextLeague = leagues.find(l => l.minLevel > level.level);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm" data-testid="arena-battle-mode">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center">
          <Users className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-slate-800 font-bold text-sm tracking-wide uppercase">Battle Mode</h3>
      </div>

      <div className={`flex items-center gap-3 mb-4 p-3 rounded-lg ${currentLeague.bg} border ${currentLeague.border}`}>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white shadow-sm">
          <currentLeague.icon className={`w-5 h-5 ${currentLeague.text}`} />
        </div>
        <div className="flex-1">
          <p className={`font-semibold text-sm ${currentLeague.text}`} data-testid="text-league-name">
            {currentLeague.name}
          </p>
          <p className="text-slate-500 text-xs">{totalExams} battles completed</p>
        </div>
      </div>

      {nextLeague && (
        <p className="text-xs text-slate-500 mb-4">
          Next: <span className={`font-semibold ${nextLeague.text}`}>{nextLeague.name}</span> at Level {nextLeague.minLevel}
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {leagues.slice(0, 3).map((league) => (
          <div
            key={league.name}
            className={`text-center p-2 rounded-lg border ${
              level.level >= league.minLevel
                ? `${league.bg} ${league.border}`
                : "bg-slate-50 border-slate-100 opacity-40"
            }`}
            data-testid={`badge-league-${league.name.split(" ")[0].toLowerCase()}`}
          >
            <league.icon className={`w-4 h-4 mx-auto mb-1 ${level.level >= league.minLevel ? league.text : "text-slate-300"}`} />
            <p className={`text-[10px] font-medium ${level.level >= league.minLevel ? league.text : "text-slate-400"}`}>
              {league.name.split(" ")[0]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
