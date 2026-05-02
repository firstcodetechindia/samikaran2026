import { BookOpen, FlaskConical, Calculator, Globe, Palette, Music } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExamTopic {
  id: number;
  title: string;
  subject?: string | null;
  startTime?: string | null;
}

interface AdventureGameCardsProps {
  exams: ExamTopic[];
  onPlay?: (examId: number) => void;
}

const subjectConfig: Record<string, { icon: typeof BookOpen; gradient: string; bg: string; emoji: string }> = {
  Mathematics: { icon: Calculator, gradient: "from-blue-400 to-indigo-500", bg: "bg-blue-50", emoji: "🔢" },
  Science: { icon: FlaskConical, gradient: "from-green-400 to-emerald-500", bg: "bg-green-50", emoji: "🔬" },
  English: { icon: BookOpen, gradient: "from-orange-400 to-red-400", bg: "bg-orange-50", emoji: "📖" },
  "Social Studies": { icon: Globe, gradient: "from-purple-400 to-pink-500", bg: "bg-purple-50", emoji: "🌍" },
  Art: { icon: Palette, gradient: "from-pink-400 to-rose-500", bg: "bg-pink-50", emoji: "🎨" },
  Music: { icon: Music, gradient: "from-cyan-400 to-teal-500", bg: "bg-cyan-50", emoji: "🎵" },
};

const fallbackConfigs = [
  { icon: BookOpen, gradient: "from-amber-400 to-orange-500", bg: "bg-amber-50", emoji: "📝" },
  { icon: FlaskConical, gradient: "from-violet-400 to-purple-500", bg: "bg-violet-50", emoji: "✨" },
  { icon: Calculator, gradient: "from-teal-400 to-cyan-500", bg: "bg-teal-50", emoji: "🧩" },
  { icon: Globe, gradient: "from-rose-400 to-pink-500", bg: "bg-rose-50", emoji: "🌟" },
];

export function AdventureGameCards({ exams, onPlay }: AdventureGameCardsProps) {
  if (!exams || exams.length === 0) {
    return (
      <div className="adventure-card p-8 text-center" data-testid="adventure-game-cards-empty">
        <div className="text-5xl mb-3">📚</div>
        <p className="text-gray-600 font-bold text-lg">No quizzes right now!</p>
        <p className="text-sm text-gray-400 mt-1">Check back soon for new adventures! 🎉</p>
      </div>
    );
  }

  return (
    <div data-testid="adventure-game-cards" className="relative z-10">
      <h3 className="text-xl font-extrabold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-2xl">🎮</span> Play & Learn
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {exams.slice(0, 6).map((exam, idx) => {
          const subject = exam.subject || "General";
          const config =
            subjectConfig[subject] || fallbackConfigs[idx % fallbackConfigs.length];

          return (
            <div
              key={exam.id}
              className="adventure-card p-4 flex items-center gap-3 adventure-pop"
              style={{ animationDelay: `${idx * 0.1}s` }}
              data-testid={`card-game-${exam.id}`}
            >
              <div className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-md`}>
                <span className="text-2xl">{config.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm truncate">
                  {exam.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">{subject}</p>
              </div>
              <Button
                size="sm"
                onClick={() => onPlay?.(exam.id)}
                className={`rounded-full bg-gradient-to-r ${config.gradient} text-white text-xs font-bold px-4 adventure-btn-bounce`}
                data-testid={`button-play-${exam.id}`}
              >
                Play! 🚀
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
