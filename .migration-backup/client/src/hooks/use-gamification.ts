import { useMemo } from "react";

interface ExamResult {
  id?: number;
  examId?: number;
  examTitle?: string | null;
  examSubject?: string | null;
  subject?: string;
  totalQuestions?: number;
  correctAnswers?: number;
  wrongAnswers?: number;
  finalObtainedMarks?: number;
  totalMaxMarks?: number;
  totalPossibleMarks?: number;
  percentage?: number | string;
  overallRank?: number | null;
  stateRank?: number | null;
  cityRank?: number | null;
  schoolRank?: number | null;
  classRank?: number | null;
  completedAt?: string | null;
  calculatedAt?: string | null;
  examStartTime?: string | null;
  performanceRemark?: string | null;
  timeTakenSeconds?: number | null;
}

interface Certificate {
  id?: number;
  type?: string;
  certificateType?: string;
  rank?: number | null;
  score?: number | null;
  issuedAt?: string | null;
}

interface ExamRegistration {
  id?: number;
  examId?: number;
  status?: string;
  attemptStatus?: string;
  registeredAt?: string | null;
  completedAt?: string | null;
  exam?: { endTime?: string } | null;
}

export interface GamificationLevel {
  level: number;
  title: string;
  currentXP: number;
  xpForNextLevel: number;
  xpProgress: number;
  tier: "bronze" | "silver" | "gold" | "diamond" | "master";
}

export interface StudentXP {
  totalXP: number;
  examXP: number;
  bonusXP: number;
  recentXPGains: { source: string; amount: number; date: string }[];
}

export interface StudentStreak {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  isActiveToday: boolean;
}

export interface RadarDataPoint {
  subject: string;
  score: number;
  fullMark: number;
}

export interface RankChange {
  currentRank: number | null;
  previousRank: number | null;
  change: number;
  direction: "up" | "down" | "same" | "new";
}

export interface WeeklyStar {
  day: string;
  stars: number;
  date: string;
}

const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 3800,
  4700, 5700, 6800, 8000, 9500, 11000, 13000, 15000, 17500, 20000
];

const LEVEL_TITLES_ARENA = [
  "Recruit", "Challenger", "Contender", "Warrior", "Gladiator",
  "Champion", "Elite", "Master", "Grandmaster", "Legend",
  "Mythic", "Immortal", "Titan", "Overlord", "Supreme",
  "Ascendant", "Celestial", "Cosmic", "Eternal", "Infinity"
];

const LEVEL_TITLES_ADVENTURE = [
  "Explorer", "Adventurer", "Discoverer", "Treasure Hunter", "Star Collector",
  "Puzzle Master", "Quiz Wizard", "Brain Champion", "Super Scholar", "Genius",
  "Mega Mind", "Ultra Brain", "Galaxy Explorer", "Universe Champ", "Cosmic Hero",
  "Legend", "Mythical", "Supreme Star", "Infinity Scholar", "Ultimate Champion"
];

function getTier(level: number): "bronze" | "silver" | "gold" | "diamond" | "master" {
  if (level <= 3) return "bronze";
  if (level <= 7) return "silver";
  if (level <= 12) return "gold";
  if (level <= 16) return "diamond";
  return "master";
}

function calculateXPFromResults(results: ExamResult[]): number {
  let totalXP = 0;
  for (const r of results) {
    const pct = typeof r.percentage === "string" ? parseFloat(r.percentage) : (r.percentage || 0);
    const baseXP = Math.round(pct * 1.5);
    let bonusXP = 0;
    if (pct >= 90) bonusXP = 50;
    else if (pct >= 75) bonusXP = 30;
    else if (pct >= 60) bonusXP = 15;
    else if (pct >= 40) bonusXP = 5;
    totalXP += baseXP + bonusXP;
  }
  return totalXP;
}

function calculateXPFromCertificates(certificates: Certificate[]): number {
  let xp = 0;
  for (const c of certificates) {
    const certType = c.type || c.certificateType;
    switch (certType) {
      case "merit_gold": xp += 100; break;
      case "merit_silver": xp += 75; break;
      case "merit_bronze": xp += 50; break;
      case "participation": xp += 25; break;
      default: xp += 10; break;
    }
  }
  return xp;
}

export function useStudentLevel(
  results: ExamResult[],
  certificates: Certificate[],
  isAdventure = false
): GamificationLevel {
  return useMemo(() => {
    const totalXP = calculateXPFromResults(results) + calculateXPFromCertificates(certificates);

    let level = 1;
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (totalXP >= LEVEL_THRESHOLDS[i]) {
        level = i + 1;
        break;
      }
    }
    level = Math.min(level, 20);

    const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
    const nextThreshold = LEVEL_THRESHOLDS[level] || currentThreshold + 500;
    const xpInLevel = totalXP - currentThreshold;
    const xpNeeded = nextThreshold - currentThreshold;
    const progress = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));

    const titles = isAdventure ? LEVEL_TITLES_ADVENTURE : LEVEL_TITLES_ARENA;

    return {
      level,
      title: titles[Math.min(level - 1, titles.length - 1)],
      currentXP: totalXP,
      xpForNextLevel: nextThreshold,
      xpProgress: progress,
      tier: getTier(level),
    };
  }, [results, certificates, isAdventure]);
}

export function useStudentXP(results: ExamResult[], certificates: Certificate[]): StudentXP {
  return useMemo(() => {
    const examXP = calculateXPFromResults(results);
    const bonusXP = calculateXPFromCertificates(certificates);

    const getDate = (r: ExamResult) => r.completedAt || r.calculatedAt || r.examStartTime;
    const recentXPGains = results
      .filter(r => getDate(r))
      .sort((a, b) => new Date(getDate(b)!).getTime() - new Date(getDate(a)!).getTime())
      .slice(0, 5)
      .map(r => {
        const pct = typeof r.percentage === "string" ? parseFloat(r.percentage) : (r.percentage || 0);
        const xp = Math.round(pct * 1.5) + (pct >= 90 ? 50 : pct >= 75 ? 30 : pct >= 60 ? 15 : pct >= 40 ? 5 : 0);
        return {
          source: r.examTitle || "Exam",
          amount: xp,
          date: getDate(r)!,
        };
      });

    return {
      totalXP: examXP + bonusXP,
      examXP,
      bonusXP,
      recentXPGains,
    };
  }, [results, certificates]);
}

export function useStudentStreak(registrations: ExamRegistration[]): StudentStreak {
  return useMemo(() => {
    const completedDates = registrations
      .filter(r => {
        const hasDate = r.completedAt || (r.exam?.endTime && new Date(r.exam.endTime) < new Date());
        const isComplete = r.status === "completed" || (r as any).attemptStatus === "submitted" || (r as any).attemptStatus === "completed";
        return hasDate && isComplete;
      })
      .map(r => {
        const dateStr = r.completedAt || r.exam?.endTime;
        const d = new Date(dateStr!);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      })
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => b - a);

    if (completedDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastActivityDate: null, isActiveToday: false };
    }

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const DAY = 86400000;

    const isActiveToday = completedDates[0] === todayStart;
    const startFrom = isActiveToday ? todayStart : completedDates[0];

    let currentStreak = 1;
    let tempDate = startFrom;
    for (let i = 1; i < completedDates.length; i++) {
      if (tempDate - completedDates[i] === DAY) {
        currentStreak++;
        tempDate = completedDates[i];
      } else {
        break;
      }
    }

    if (!isActiveToday && (todayStart - completedDates[0]) > DAY) {
      currentStreak = 0;
    }

    let longestStreak = 1;
    let tempStreak = 1;
    for (let i = 1; i < completedDates.length; i++) {
      if (completedDates[i - 1] - completedDates[i] === DAY) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      lastActivityDate: new Date(completedDates[0]).toISOString(),
      isActiveToday,
    };
  }, [registrations]);
}

export function usePerformanceRadar(results: ExamResult[]): RadarDataPoint[] {
  return useMemo(() => {
    const subjectMap: Record<string, { total: number; count: number }> = {};

    for (const r of results) {
      const subject = r.examSubject || r.subject || "General";
      if (!subjectMap[subject]) subjectMap[subject] = { total: 0, count: 0 };
      const pct = typeof r.percentage === "string" ? parseFloat(r.percentage) : (r.percentage || 0);
      subjectMap[subject].total += pct;
      subjectMap[subject].count += 1;
    }

    return Object.entries(subjectMap).map(([subject, data]) => ({
      subject,
      score: Math.round(data.total / data.count),
      fullMark: 100,
    }));
  }, [results]);
}

export function useRankChange(results: ExamResult[]): RankChange {
  return useMemo(() => {
    const getDate = (r: ExamResult) => r.completedAt || r.calculatedAt || r.examStartTime;
    const sorted = [...results]
      .filter(r => r.overallRank && getDate(r))
      .sort((a, b) => new Date(getDate(b)!).getTime() - new Date(getDate(a)!).getTime());

    if (sorted.length === 0) {
      return { currentRank: null, previousRank: null, change: 0, direction: "new" };
    }

    const currentRank = sorted[0].overallRank!;
    if (sorted.length === 1) {
      return { currentRank, previousRank: null, change: 0, direction: "new" };
    }

    const previousRank = sorted[1].overallRank!;
    const change = previousRank - currentRank;
    const direction = change > 0 ? "up" : change < 0 ? "down" : "same";

    return { currentRank, previousRank, change: Math.abs(change), direction };
  }, [results]);
}

export function useWeeklyStars(results: ExamResult[]): WeeklyStar[] {
  return useMemo(() => {
    const today = new Date();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const week: WeeklyStar[] = [];
    const getDate = (r: ExamResult) => r.completedAt || r.calculatedAt || r.examStartTime;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];

      const dayResults = results.filter(r => {
        const rd = getDate(r);
        if (!rd) return false;
        return new Date(rd).toISOString().split("T")[0] === dateStr;
      });

      let stars = 0;
      for (const r of dayResults) {
        const pct = typeof r.percentage === "string" ? parseFloat(r.percentage) : (r.percentage || 0);
        if (pct >= 90) stars += 3;
        else if (pct >= 70) stars += 2;
        else if (pct >= 40) stars += 1;
      }

      week.push({
        day: dayNames[d.getDay()],
        stars: Math.min(stars, 5),
        date: dateStr,
      });
    }

    return week;
  }, [results]);
}
