import { Button } from "@/components/ui/button";
import { HelpCircle, BookOpen } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HelpGuideButtonProps {
  role: "student" | "school" | "partner" | "group";
  variant?: "default" | "floating" | "compact";
}

const guideConfig = {
  student: {
    label: "Student Guide",
    path: "/guides/student-guide.html",
    color: "from-violet-500 to-fuchsia-500",
  },
  school: {
    label: "School Admin Guide",
    path: "/guides/school-guide.html",
    color: "from-emerald-500 to-teal-500",
  },
  partner: {
    label: "Partner Guide",
    path: "/guides/partner-guide.html",
    color: "from-purple-500 to-pink-500",
  },
  group: {
    label: "Group Admin Guide",
    path: "/guides/group-guide.html",
    color: "from-blue-500 to-cyan-500",
  },
  supervisor: {
    label: "Supervisor Guide",
    path: "/guides/supervisor-guide.html",
    color: "from-indigo-500 to-purple-500",
  },
  admin: {
    label: "Admin Guide",
    path: "/guides/admin-guide.html",
    color: "from-slate-600 to-gray-700",
  },
};

export function HelpGuideButton({ role, variant = "default" }: HelpGuideButtonProps) {
  const config = guideConfig[role];

  const openGuide = () => {
    window.open(config.path, "_blank");
  };

  if (variant === "floating") {
    return (
      <button
        onClick={openGuide}
        className={`fixed bottom-24 right-6 z-40 w-12 h-12 rounded-full bg-gradient-to-r ${config.color} text-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform duration-200`}
        title={config.label}
        data-testid="button-help-guide-floating"
      >
        <BookOpen className="w-5 h-5" />
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={openGuide}
        title={config.label}
        data-testid="button-help-guide-compact"
      >
        <HelpCircle className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2"
          data-testid="button-help-guide-dropdown"
        >
          <HelpCircle className="w-4 h-4" />
          Help
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={openGuide} className="gap-2 cursor-pointer">
          <BookOpen className="w-4 h-4" />
          <div>
            <div className="font-medium">{config.label}</div>
            <div className="text-xs text-muted-foreground">Learn how to use the platform</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function HelpGuideFAB({ role }: { role: "student" | "school" | "partner" | "group" | "supervisor" | "admin" }) {
  const config = guideConfig[role as keyof typeof guideConfig] || guideConfig.student;
  const openGuide = () => {
    window.open(config.path, "_blank");
  };
  return (
    <button
      onClick={openGuide}
      className={`fixed bottom-6 right-6 z-40 h-10 rounded-full bg-gradient-to-r ${config.color} text-white shadow-lg flex items-center gap-2 px-4 hover:scale-105 transition-transform duration-200`}
      title={config.label}
      data-testid="button-help-guide-floating"
    >
      <BookOpen className="w-4 h-4" />
      <span className="text-sm font-medium">Profile Guide</span>
    </button>
  );
}
