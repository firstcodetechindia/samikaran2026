import { Lock } from "lucide-react";
import type { StudentCertificate } from "@/hooks/use-dashboard-data";

interface AdventureBadgeWallProps {
  certificates: StudentCertificate[];
}

const badgeConfig: Record<string, { label: string; emoji: string; gradient: string; borderColor: string }> = {
  merit_gold: {
    label: "Gold Champion",
    emoji: "🏆",
    gradient: "from-yellow-300 to-amber-400",
    borderColor: "border-yellow-300",
  },
  merit_silver: {
    label: "Silver Star",
    emoji: "🥈",
    gradient: "from-gray-300 to-slate-400",
    borderColor: "border-gray-300",
  },
  merit_bronze: {
    label: "Bronze Hero",
    emoji: "🥉",
    gradient: "from-amber-500 to-orange-600",
    borderColor: "border-amber-400",
  },
  participation: {
    label: "Brave Explorer",
    emoji: "🌟",
    gradient: "from-purple-300 to-pink-400",
    borderColor: "border-purple-300",
  },
};

const ALL_BADGE_TYPES = ["merit_gold", "merit_silver", "merit_bronze", "participation"];

export function AdventureBadgeWall({ certificates }: AdventureBadgeWallProps) {
  const earnedTypes = new Set(certificates.map((c) => c.type));

  return (
    <div data-testid="adventure-badge-wall" className="relative z-10">
      <h3 className="text-xl font-extrabold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-2xl">🏅</span> My Badges
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {ALL_BADGE_TYPES.map((type) => {
          const config = badgeConfig[type];
          const isUnlocked = earnedTypes.has(type);
          const count = certificates.filter((c) => c.type === type).length;

          return (
            <div
              key={type}
              className={`adventure-card p-5 flex flex-col items-center gap-2 text-center ${
                !isUnlocked ? "opacity-40 grayscale" : ""
              }`}
              data-testid={`badge-${type}`}
            >
              <div
                className={`w-16 h-16 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg border-4 ${config.borderColor} relative`}
              >
                {isUnlocked ? (
                  <span className="text-2xl">{config.emoji}</span>
                ) : (
                  <Lock className="w-6 h-6 text-white/60" />
                )}
                {isUnlocked && count > 1 && (
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                    {count}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-gray-700">
                {config.label}
              </span>
              <span className="text-[10px] text-gray-400 font-medium">
                {isUnlocked ? `${count} earned ✨` : "Locked 🔒"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
