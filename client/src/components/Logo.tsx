import { Star } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark";
  showIcon?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: {
    icon: "w-8 h-8",
    iconInner: "w-5 h-5",
    samikaran: "text-sm",
    olympiad: "text-xs",
    gap: "gap-2",
    rounded: "rounded-lg",
  },
  md: {
    icon: "w-10 h-10",
    iconInner: "w-6 h-6",
    samikaran: "text-xl",
    olympiad: "text-base",
    gap: "gap-3",
    rounded: "rounded-xl",
  },
  lg: {
    icon: "w-14 h-14",
    iconInner: "w-8 h-8",
    samikaran: "text-3xl md:text-4xl",
    olympiad: "text-2xl md:text-3xl",
    gap: "gap-4",
    rounded: "rounded-2xl",
  },
  xl: {
    icon: "w-16 h-16",
    iconInner: "w-9 h-9",
    samikaran: "text-4xl md:text-5xl",
    olympiad: "text-3xl md:text-4xl",
    gap: "gap-4",
    rounded: "rounded-2xl",
  },
};

export function Logo({ size = "md", variant = "dark", showIcon = true, className = "" }: LogoProps) {
  const config = sizeConfig[size];
  
  const textColor = variant === "dark" ? "text-white" : "text-foreground";
  const subtextColor = variant === "dark" ? "text-white/80" : "text-foreground/80";
  const dotColor = variant === "dark" ? "text-fuchsia-400" : "brand-accent";
  
  return (
    <div className={`inline-flex items-center ${config.gap} ${className}`}>
      {showIcon && (
        <div className={`${config.icon} ${config.rounded} brand-gradient flex items-center justify-center shadow-lg`}>
          <Star className={`text-white ${config.iconInner}`} fill="rgba(255,255,255,0.3)" />
        </div>
      )}
      <div className="flex flex-col items-start">
        <span className={`${config.samikaran} font-bold tracking-tight leading-none ${textColor}`}>
          SAMIKARAN<span className={dotColor}>.</span>
        </span>
        <span className={`${config.olympiad} font-bold uppercase ${subtextColor}`}>
          OLYMPIAD
        </span>
      </div>
    </div>
  );
}

export default Logo;
