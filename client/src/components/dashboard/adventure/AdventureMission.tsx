import { Rocket, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdventureMissionProps {
  nextExamTitle?: string | null;
  nextExamDate?: string | null;
  xpReward?: number;
  onStartMission?: () => void;
}

export function AdventureMission({
  nextExamTitle,
  nextExamDate,
  xpReward = 100,
  onStartMission,
}: AdventureMissionProps) {
  const hasExam = !!nextExamTitle;

  return (
    <div className="adventure-card p-6 relative overflow-visible" data-testid="adventure-mission">
      <div className="absolute -top-3 left-6">
        <span className="bg-gradient-to-r from-orange-400 to-pink-400 text-white text-xs font-extrabold px-4 py-1.5 rounded-full shadow-lg">
          🎯 TODAY&apos;S MISSION
        </span>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-shrink-0 w-18 h-18 rounded-3xl bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center adventure-bounce shadow-lg p-4">
          <Rocket className="w-10 h-10 text-white" />
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-xl font-extrabold text-gray-800" data-testid="text-mission-title">
            {hasExam ? nextExamTitle : "Explore & Learn! 🌟"}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {hasExam
              ? `Scheduled: ${new Date(nextExamDate!).toLocaleDateString()}`
              : "Practice with TARA to earn bonus XP!"}
          </p>
          <div className="flex items-center gap-3 mt-3 justify-center sm:justify-start flex-wrap">
            <span className="flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" /> 3 Stars
            </span>
            <span className="flex items-center gap-1 text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              <Zap className="w-3.5 h-3.5" /> +{xpReward} XP
            </span>
          </div>
        </div>

        <Button
          onClick={onStartMission}
          className="bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-full px-8 py-6 shadow-lg text-base font-extrabold adventure-btn-bounce"
          data-testid="button-start-mission"
        >
          <Rocket className="w-5 h-5 mr-1.5" />
          {hasExam ? "Let's Go!" : "Play Now!"}
        </Button>
      </div>
    </div>
  );
}
