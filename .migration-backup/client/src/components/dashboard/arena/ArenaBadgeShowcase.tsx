import { Award, Lock } from "lucide-react";
import type { StudentCertificate } from "@/hooks/use-dashboard-data";

interface ArenaBadgeShowcaseProps {
  certificates: StudentCertificate[];
}

const BADGE_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  merit_gold: { label: "Gold", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  merit_silver: { label: "Silver", bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
  merit_bronze: { label: "Bronze", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  participation: { label: "Participant", bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
};

export function ArenaBadgeShowcase({ certificates }: ArenaBadgeShowcaseProps) {
  const allBadgeTypes = ["merit_gold", "merit_silver", "merit_bronze", "participation"];
  const earnedTypes = new Set(certificates.map(c => c.type));
  const badgeCounts: Record<string, number> = {};
  certificates.forEach(c => { badgeCounts[c.type] = (badgeCounts[c.type] || 0) + 1; });

  const totalEarned = allBadgeTypes.filter(t => earnedTypes.has(t)).length;
  const progressPercent = Math.round((totalEarned / allBadgeTypes.length) * 100);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm" data-testid="arena-badge-showcase">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <Award className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-slate-800 font-bold text-sm tracking-wide uppercase">Achievements</h3>
        </div>
        <span className="text-slate-500 text-xs font-medium">{totalEarned}/{allBadgeTypes.length}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {allBadgeTypes.map(type => {
          const config = BADGE_CONFIG[type];
          const earned = earnedTypes.has(type);
          const count = badgeCounts[type] || 0;
          return (
            <div
              key={type}
              className={`relative p-3 rounded-lg text-center border ${
                earned ? `${config.bg} ${config.border}` : "bg-slate-50 border-slate-100 opacity-50"
              }`}
              data-testid={`badge-${type}`}
            >
              <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center bg-white shadow-sm">
                {earned
                  ? <Award className={`w-5 h-5 ${config.text}`} />
                  : <Lock className="w-4 h-4 text-slate-300" />
                }
              </div>
              <p className={`text-xs font-semibold ${earned ? config.text : "text-slate-400"}`}>{config.label}</p>
              {earned && count > 0 && (
                <p className="text-[10px] text-slate-500 mt-0.5">{count}x earned</p>
              )}
            </div>
          );
        })}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-slate-500 text-xs">Collection Progress</span>
          <span className="text-indigo-600 text-xs font-semibold">{progressPercent}%</span>
        </div>
        <div className="arena-progress" data-testid="progress-badges">
          <div className="arena-progress-bar" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
    </div>
  );
}
