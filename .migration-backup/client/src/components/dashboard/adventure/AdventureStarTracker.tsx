import { Star } from "lucide-react";
import type { WeeklyStar } from "@/hooks/use-gamification";

interface AdventureStarTrackerProps {
  weeklyStars: WeeklyStar[];
}

export function AdventureStarTracker({ weeklyStars }: AdventureStarTrackerProps) {
  const totalStars = weeklyStars.reduce((sum, d) => sum + d.stars, 0);

  return (
    <div className="adventure-card p-5" data-testid="adventure-star-tracker">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h3 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
          <span className="text-xl">⭐</span> Weekly Stars
        </h3>
        <span className="text-sm font-bold text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200" data-testid="text-total-stars">
          {totalStars} / 35 🌟
        </span>
      </div>

      <div className="flex items-end justify-between gap-1">
        {weeklyStars.map((day, idx) => {
          const isToday = idx === weeklyStars.length - 1;
          return (
            <div
              key={day.date}
              className="flex flex-col items-center gap-1 flex-1"
              data-testid={`star-day-${day.day}`}
            >
              <div className="flex flex-col items-center gap-0.5">
                {[...Array(5)].map((_, starIdx) => (
                  <Star
                    key={starIdx}
                    className={`w-4 h-4 transition-all ${
                      starIdx < day.stars
                        ? "text-yellow-400 fill-yellow-400 drop-shadow-sm"
                        : "text-gray-200"
                    }`}
                  />
                ))}
              </div>
              <span
                className={`text-[10px] font-bold mt-1 ${
                  isToday ? "text-orange-500 bg-orange-100 px-1.5 py-0.5 rounded-full" : "text-gray-400"
                }`}
              >
                {day.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
