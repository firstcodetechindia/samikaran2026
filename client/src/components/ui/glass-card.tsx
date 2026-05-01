import { cn } from "@/lib/utils";
import { forwardRef, HTMLAttributes, ReactNode } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "stat" | "panel";
  glow?: boolean;
  animate?: boolean;
  delay?: 1 | 2 | 3 | 4 | 5 | 6;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", glow = false, animate = true, delay, children, ...props }, ref) => {
    const variants = {
      default: "glass-panel p-6",
      stat: "glass-stat-card",
      panel: "glass-panel p-8",
    };

    return (
      <div
        ref={ref}
        className={cn(
          variants[variant],
          glow && "glow-subtle",
          animate && "animate-slide-up opacity-0",
          delay && `stagger-${delay}`,
          className
        )}
        style={animate ? { animationFillMode: 'forwards' } : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassCard.displayName = "GlassCard";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  iconGradient?: "purple" | "pink" | "blue" | "green" | "amber" | "cyan";
  trend?: { value: number; positive: boolean };
  delay?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  iconGradient = "purple", 
  trend,
  delay,
  className 
}: StatCardProps) {
  const gradientClasses = {
    purple: "icon-gradient-purple",
    pink: "icon-gradient-pink",
    blue: "icon-gradient-blue",
    green: "icon-gradient-green",
    amber: "icon-gradient-amber",
    cyan: "icon-gradient-cyan",
  };

  return (
    <GlassCard 
      variant="stat" 
      delay={delay}
      className={className}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-foreground tracking-tight animate-count-up">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-xs font-medium",
              trend.positive ? "text-emerald-600" : "text-red-500"
            )}>
              <span>{trend.positive ? "↑" : "↓"}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          )}
        </div>
        <div className={cn(
          "p-3 rounded-xl text-white shadow-lg",
          gradientClasses[iconGradient]
        )}>
          {icon}
        </div>
      </div>
    </GlassCard>
  );
}

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  children?: ReactNode;
  className?: string;
}

function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  color = "#8A2BE2",
  bgColor = "rgba(138, 43, 226, 0.1)",
  children,
  className
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("progress-ring", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

interface SkeletonCardProps {
  className?: string;
  lines?: number;
}

function SkeletonCard({ className, lines = 3 }: SkeletonCardProps) {
  return (
    <GlassCard variant="stat" animate={false} className={className}>
      <div className="space-y-3">
        <div className="h-4 w-24 rounded skeleton-pulse" />
        <div className="h-8 w-32 rounded skeleton-pulse" />
        {Array.from({ length: lines - 2 }).map((_, i) => (
          <div key={i} className="h-3 w-full rounded skeleton-pulse" />
        ))}
      </div>
    </GlassCard>
  );
}

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  avatar?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

function DashboardHeader({ title, subtitle, avatar, actions, className }: DashboardHeaderProps) {
  return (
    <div className={cn(
      "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in",
      className
    )}>
      <div className="flex items-center gap-4">
        {avatar}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center py-12 px-6",
      className
    )}>
      <div className="p-4 rounded-full bg-muted/50 mb-4 text-muted-foreground">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      {action}
    </div>
  );
}

export { 
  GlassCard, 
  StatCard, 
  ProgressRing, 
  SkeletonCard, 
  DashboardHeader,
  SectionHeader,
  EmptyState 
};
