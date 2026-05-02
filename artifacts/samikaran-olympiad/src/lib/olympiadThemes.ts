export interface OlympiadTheme {
  primary: string;
  secondary: string;
  gradient: string;
  gradientHover: string;
  lightBg: string;
  darkBg: string;
  accentText: string;
  borderColor: string;
  iconBg: string;
  buttonClass: string;
  badgeClass: string;
  heroGradient: string;
  cardAccent: string;
}

const themes: Record<string, OlympiadTheme> = {
  mathematics: {
    primary: "#3B82F6",
    secondary: "#1D4ED8",
    gradient: "from-blue-500 via-blue-600 to-indigo-700",
    gradientHover: "from-blue-600 via-blue-700 to-indigo-800",
    lightBg: "bg-blue-50",
    darkBg: "dark:bg-blue-950/30",
    accentText: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-800",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
    buttonClass: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25",
    badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    heroGradient: "from-blue-600 via-blue-700 to-indigo-800",
    cardAccent: "border-l-4 border-l-blue-500",
  },
  maths: {
    primary: "#3B82F6",
    secondary: "#1D4ED8",
    gradient: "from-blue-500 via-blue-600 to-indigo-700",
    gradientHover: "from-blue-600 via-blue-700 to-indigo-800",
    lightBg: "bg-blue-50",
    darkBg: "dark:bg-blue-950/30",
    accentText: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-800",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
    buttonClass: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25",
    badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    heroGradient: "from-blue-600 via-blue-700 to-indigo-800",
    cardAccent: "border-l-4 border-l-blue-500",
  },
  science: {
    primary: "#10B981",
    secondary: "#059669",
    gradient: "from-emerald-500 via-teal-600 to-cyan-700",
    gradientHover: "from-emerald-600 via-teal-700 to-cyan-800",
    lightBg: "bg-emerald-50",
    darkBg: "dark:bg-emerald-950/30",
    accentText: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
    buttonClass: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25",
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    heroGradient: "from-emerald-600 via-teal-700 to-cyan-800",
    cardAccent: "border-l-4 border-l-emerald-500",
  },
  english: {
    primary: "#8B5CF6",
    secondary: "#7C3AED",
    gradient: "from-violet-500 via-purple-600 to-fuchsia-700",
    gradientHover: "from-violet-600 via-purple-700 to-fuchsia-800",
    lightBg: "bg-violet-50",
    darkBg: "dark:bg-violet-950/30",
    accentText: "text-violet-600 dark:text-violet-400",
    borderColor: "border-violet-200 dark:border-violet-800",
    iconBg: "bg-violet-100 dark:bg-violet-900/50",
    buttonClass: "bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25",
    badgeClass: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
    heroGradient: "from-violet-600 via-purple-700 to-fuchsia-800",
    cardAccent: "border-l-4 border-l-violet-500",
  },
  gk: {
    primary: "#F59E0B",
    secondary: "#D97706",
    gradient: "from-amber-500 via-orange-600 to-red-600",
    gradientHover: "from-amber-600 via-orange-700 to-red-700",
    lightBg: "bg-amber-50",
    darkBg: "dark:bg-amber-950/30",
    accentText: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-200 dark:border-amber-800",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
    buttonClass: "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25",
    badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    heroGradient: "from-amber-600 via-orange-700 to-red-700",
    cardAccent: "border-l-4 border-l-amber-500",
  },
  "general knowledge": {
    primary: "#F59E0B",
    secondary: "#D97706",
    gradient: "from-amber-500 via-orange-600 to-red-600",
    gradientHover: "from-amber-600 via-orange-700 to-red-700",
    lightBg: "bg-amber-50",
    darkBg: "dark:bg-amber-950/30",
    accentText: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-200 dark:border-amber-800",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
    buttonClass: "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25",
    badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    heroGradient: "from-amber-600 via-orange-700 to-red-700",
    cardAccent: "border-l-4 border-l-amber-500",
  },
  reasoning: {
    primary: "#EF4444",
    secondary: "#DC2626",
    gradient: "from-red-500 via-rose-600 to-pink-700",
    gradientHover: "from-red-600 via-rose-700 to-pink-800",
    lightBg: "bg-red-50",
    darkBg: "dark:bg-red-950/30",
    accentText: "text-red-600 dark:text-red-400",
    borderColor: "border-red-200 dark:border-red-800",
    iconBg: "bg-red-100 dark:bg-red-900/50",
    buttonClass: "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25",
    badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
    heroGradient: "from-red-600 via-rose-700 to-pink-800",
    cardAccent: "border-l-4 border-l-red-500",
  },
  computers: {
    primary: "#06B6D4",
    secondary: "#0891B2",
    gradient: "from-cyan-500 via-sky-600 to-blue-700",
    gradientHover: "from-cyan-600 via-sky-700 to-blue-800",
    lightBg: "bg-cyan-50",
    darkBg: "dark:bg-cyan-950/30",
    accentText: "text-cyan-600 dark:text-cyan-400",
    borderColor: "border-cyan-200 dark:border-cyan-800",
    iconBg: "bg-cyan-100 dark:bg-cyan-900/50",
    buttonClass: "bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-lg shadow-cyan-500/25",
    badgeClass: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300",
    heroGradient: "from-cyan-600 via-sky-700 to-blue-800",
    cardAccent: "border-l-4 border-l-cyan-500",
  },
  computer: {
    primary: "#06B6D4",
    secondary: "#0891B2",
    gradient: "from-cyan-500 via-sky-600 to-blue-700",
    gradientHover: "from-cyan-600 via-sky-700 to-blue-800",
    lightBg: "bg-cyan-50",
    darkBg: "dark:bg-cyan-950/30",
    accentText: "text-cyan-600 dark:text-cyan-400",
    borderColor: "border-cyan-200 dark:border-cyan-800",
    iconBg: "bg-cyan-100 dark:bg-cyan-900/50",
    buttonClass: "bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-lg shadow-cyan-500/25",
    badgeClass: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300",
    heroGradient: "from-cyan-600 via-sky-700 to-blue-800",
    cardAccent: "border-l-4 border-l-cyan-500",
  },
  hindi: {
    primary: "#EC4899",
    secondary: "#DB2777",
    gradient: "from-pink-500 via-rose-600 to-red-600",
    gradientHover: "from-pink-600 via-rose-700 to-red-700",
    lightBg: "bg-pink-50",
    darkBg: "dark:bg-pink-950/30",
    accentText: "text-pink-600 dark:text-pink-400",
    borderColor: "border-pink-200 dark:border-pink-800",
    iconBg: "bg-pink-100 dark:bg-pink-900/50",
    buttonClass: "bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25",
    badgeClass: "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
    heroGradient: "from-pink-600 via-rose-700 to-red-700",
    cardAccent: "border-l-4 border-l-pink-500",
  },
};

const defaultTheme: OlympiadTheme = {
  primary: "#8B5CF6",
  secondary: "#7C3AED",
  gradient: "from-violet-500 via-purple-600 to-fuchsia-700",
  gradientHover: "from-violet-600 via-purple-700 to-fuchsia-800",
  lightBg: "bg-violet-50",
  darkBg: "dark:bg-violet-950/30",
  accentText: "text-violet-600 dark:text-violet-400",
  borderColor: "border-violet-200 dark:border-violet-800",
  iconBg: "bg-violet-100 dark:bg-violet-900/50",
  buttonClass: "bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25",
  badgeClass: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
  heroGradient: "from-violet-600 via-purple-700 to-fuchsia-800",
  cardAccent: "border-l-4 border-l-violet-500",
};

export function getOlympiadTheme(subject: string): OlympiadTheme {
  const normalizedSubject = subject?.toLowerCase().trim() || "";
  
  if (normalizedSubject.includes("math")) return themes.mathematics;
  if (normalizedSubject.includes("science") || normalizedSubject.includes("physics") || normalizedSubject.includes("chemistry") || normalizedSubject.includes("biology")) return themes.science;
  if (normalizedSubject.includes("english") || normalizedSubject.includes("language")) return themes.english;
  if (normalizedSubject.includes("gk") || normalizedSubject.includes("general") || normalizedSubject.includes("knowledge") || normalizedSubject.includes("social")) return themes.gk;
  if (normalizedSubject.includes("reasoning") || normalizedSubject.includes("logic") || normalizedSubject.includes("mental")) return themes.reasoning;
  if (normalizedSubject.includes("computer") || normalizedSubject.includes("cyber") || normalizedSubject.includes("coding") || normalizedSubject.includes("programming")) return themes.computers;
  if (normalizedSubject.includes("hindi") || normalizedSubject.includes("sanskrit")) return themes.hindi;
  
  return themes[normalizedSubject] || defaultTheme;
}

export function getSubjectIcon(subject: string): string {
  const normalizedSubject = subject?.toLowerCase().trim() || "";
  
  if (normalizedSubject.includes("math")) return "calculator";
  if (normalizedSubject.includes("science") || normalizedSubject.includes("physics") || normalizedSubject.includes("chemistry") || normalizedSubject.includes("biology")) return "atom";
  if (normalizedSubject.includes("english") || normalizedSubject.includes("language")) return "book-open";
  if (normalizedSubject.includes("gk") || normalizedSubject.includes("general") || normalizedSubject.includes("knowledge") || normalizedSubject.includes("social")) return "globe";
  if (normalizedSubject.includes("reasoning") || normalizedSubject.includes("logic") || normalizedSubject.includes("mental")) return "brain";
  if (normalizedSubject.includes("computer") || normalizedSubject.includes("cyber") || normalizedSubject.includes("coding")) return "laptop";
  if (normalizedSubject.includes("hindi") || normalizedSubject.includes("sanskrit")) return "languages";
  
  return "book";
}
