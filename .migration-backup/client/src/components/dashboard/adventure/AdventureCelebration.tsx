import { useEffect, useState } from "react";
import { Star, PartyPopper } from "lucide-react";

interface AdventureCelebrationProps {
  show: boolean;
  message?: string;
  onComplete?: () => void;
}

const CONFETTI_COLORS = [
  "#fb923c",
  "#f472b6",
  "#a78bfa",
  "#34d399",
  "#fbbf24",
  "#60a5fa",
  "#f87171",
];

export function AdventureCelebration({
  show,
  message = "Amazing Job!",
  onComplete,
}: AdventureCelebrationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      data-testid="adventure-celebration"
    >
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${60 + Math.random() * 40}%`,
              animation: `adventure-confetti ${1.5 + Math.random() * 1.5}s ease-out forwards`,
              animationDelay: `${Math.random() * 0.5}s`,
            }}
          >
            <div
              className="w-3 h-3 rounded-sm"
              style={{
                backgroundColor:
                  CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
              }}
            />
          </div>
        ))}
      </div>

      <div className="adventure-pop text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Star className="w-8 h-8 text-yellow-400 fill-yellow-400 adventure-star-spin" />
          <PartyPopper className="w-10 h-10 text-pink-400" />
          <Star className="w-8 h-8 text-yellow-400 fill-yellow-400 adventure-star-spin" />
        </div>
        <h2
          className="text-3xl font-extrabold bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent"
          data-testid="text-celebration-message"
        >
          {message}
        </h2>
      </div>
    </div>
  );
}
