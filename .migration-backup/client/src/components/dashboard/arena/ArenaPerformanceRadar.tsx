import { Activity } from "lucide-react";
import type { RadarDataPoint } from "@/hooks/use-gamification";

interface ArenaPerformanceRadarProps {
  radarData: RadarDataPoint[];
}

export function ArenaPerformanceRadar({ radarData }: ArenaPerformanceRadarProps) {
  if (radarData.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm" data-testid="arena-performance-radar">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-slate-800 font-bold text-sm tracking-wide uppercase">Performance Radar</h3>
        </div>
        <p className="text-slate-400 text-sm text-center py-8">Complete exams to see your subject-wise performance.</p>
      </div>
    );
  }

  const size = 200;
  const center = size / 2;
  const maxRadius = 70;
  const levels = 4;
  const n = radarData.length;

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const r = (value / 100) * maxRadius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const gridLines = Array.from({ length: levels }, (_, i) => {
    const r = ((i + 1) / levels) * maxRadius;
    return Array.from({ length: n }, (_, j) => {
      const angle = (Math.PI * 2 * j) / n - Math.PI / 2;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    }).join(" ");
  });

  const dataPoints = radarData.map((d, i) => getPoint(i, d.score));
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm" data-testid="arena-performance-radar">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-slate-800 font-bold text-sm tracking-wide uppercase">Performance Radar</h3>
      </div>

      <div className="flex justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {gridLines.map((points, i) => (
            <polygon key={i} points={points} fill="none" stroke="#e2e8f0" strokeWidth="1" />
          ))}
          {Array.from({ length: n }, (_, i) => {
            const p = getPoint(i, 100);
            return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#e2e8f0" strokeWidth="1" />;
          })}
          <defs>
            <linearGradient id="radarGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.08" />
            </linearGradient>
          </defs>
          <polygon points={dataPolygon} fill="url(#radarGradientLight)" stroke="#6366f1" strokeWidth="1.5" strokeLinejoin="round" />
          {dataPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3" fill="#6366f1" />
          ))}
          {radarData.map((d, i) => {
            const labelPoint = getPoint(i, 120);
            return (
              <text key={i} x={labelPoint.x} y={labelPoint.y} fill="#64748b" fontSize="10" textAnchor="middle" dominantBaseline="middle">
                {d.subject.length > 8 ? d.subject.slice(0, 8) + ".." : d.subject}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        {radarData.map((d) => (
          <div key={d.subject} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-md bg-slate-50 border border-slate-100">
            <span className="text-slate-600 truncate mr-2">{d.subject}</span>
            <span className="text-indigo-600 font-bold" data-testid={`text-score-${d.subject}`}>{d.score}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
