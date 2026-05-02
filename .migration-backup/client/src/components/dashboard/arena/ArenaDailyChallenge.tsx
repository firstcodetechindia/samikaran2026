import { Target, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ArenaDailyChallengeProps {
  nextExam?: any;
  onStartExam?: (examId: number) => void;
  onOpenTara?: () => void;
}

export function ArenaDailyChallenge({ nextExam, onStartExam, onOpenTara }: ArenaDailyChallengeProps) {
  const hasExam = nextExam && nextExam.exam;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm" data-testid="arena-daily-challenge">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
          <Target className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-slate-800 font-bold text-sm tracking-wide uppercase">Today's Mission</h3>
      </div>

      {hasExam ? (
        <div>
          <p className="text-indigo-600 text-xs font-medium mb-1 uppercase tracking-wide">{nextExam.exam.subject || "Olympiad"}</p>
          <p className="text-slate-800 font-semibold mb-3" data-testid="text-mission-title">
            {nextExam.exam.title}
          </p>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {nextExam.exam.duration && (
              <span className="text-xs text-slate-600 font-medium bg-slate-100 px-2 py-1 rounded-md">
                {nextExam.exam.duration} min
              </span>
            )}
            {nextExam.exam.totalQuestions && (
              <span className="text-xs text-slate-600 font-medium bg-slate-100 px-2 py-1 rounded-md">
                {nextExam.exam.totalQuestions} Questions
              </span>
            )}
          </div>
          <Button
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg"
            onClick={() => onStartExam?.(nextExam.exam.id)}
            data-testid="button-start-mission"
          >
            Launch Mission
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      ) : (
        <div>
          <p className="text-slate-500 text-sm mb-3">No active missions. Train with AI Coach to sharpen your skills.</p>
          <Button
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg"
            onClick={onOpenTara}
            data-testid="button-train-tara"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Train with AI Coach
          </Button>
        </div>
      )}
    </div>
  );
}
