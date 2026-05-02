import { 
  Home, 
  BookOpen, 
  Trophy, 
  BarChart3, 
  Bell, 
  User, 
  Settings,
  Users,
  Building2,
  Briefcase,
  GraduationCap,
  FileText,
  CreditCard,
  HelpCircle
} from "lucide-react";
import type { NavTab } from "@/components/mobile/BottomNavigation";

export const studentNavigationTabs: NavTab[] = [
  {
    id: "home",
    label: "Home",
    icon: <Home className="w-5 h-5" />,
  },
  {
    id: "exams",
    label: "Exams",
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    id: "results",
    label: "Results",
    icon: <Trophy className="w-5 h-5" />,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    id: "profile",
    label: "Profile",
    icon: <User className="w-5 h-5" />,
  },
];

export const schoolNavigationTabs: NavTab[] = [
  {
    id: "home",
    label: "Home",
    icon: <Home className="w-5 h-5" />,
  },
  {
    id: "students",
    label: "Students",
    icon: <Users className="w-5 h-5" />,
  },
  {
    id: "olympiads",
    label: "Olympiads",
    icon: <GraduationCap className="w-5 h-5" />,
  },
  {
    id: "reports",
    label: "Reports",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings className="w-5 h-5" />,
  },
];

export const groupNavigationTabs: NavTab[] = [
  {
    id: "home",
    label: "Home",
    icon: <Home className="w-5 h-5" />,
  },
  {
    id: "schools",
    label: "Schools",
    icon: <Building2 className="w-5 h-5" />,
  },
  {
    id: "olympiads",
    label: "Olympiads",
    icon: <GraduationCap className="w-5 h-5" />,
  },
  {
    id: "reports",
    label: "Reports",
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings className="w-5 h-5" />,
  },
];

export const partnerNavigationTabs: NavTab[] = [
  {
    id: "home",
    label: "Home",
    icon: <Home className="w-5 h-5" />,
  },
  {
    id: "groups",
    label: "Groups",
    icon: <Briefcase className="w-5 h-5" />,
  },
  {
    id: "earnings",
    label: "Earnings",
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    id: "support",
    label: "Support",
    icon: <HelpCircle className="w-5 h-5" />,
  },
  {
    id: "profile",
    label: "Profile",
    icon: <User className="w-5 h-5" />,
  },
];

export function getNavigationTabsForRole(role: string): NavTab[] {
  switch (role) {
    case "student":
      return studentNavigationTabs;
    case "school":
      return schoolNavigationTabs;
    case "group":
      return groupNavigationTabs;
    case "partner":
      return partnerNavigationTabs;
    default:
      return studentNavigationTabs;
  }
}
