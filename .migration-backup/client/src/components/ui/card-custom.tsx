import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function PremiumCard({ 
  children, 
  className, 
  onClick 
}: { 
  children: ReactNode; 
  className?: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={onClick ? { y: -4, transition: { duration: 0.2 } } : {}}
      onClick={onClick}
      className={cn(
        "bg-white rounded-2xl p-6 shadow-sm border border-border/50",
        "hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export function StatCard({ 
  label, 
  value, 
  icon: Icon,
  trend 
}: { 
  label: string; 
  value: string | number; 
  icon: React.ElementType;
  trend?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-border/50 shadow-sm flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <h3 className="text-2xl font-bold text-foreground font-display">{value}</h3>
        {trend && <p className="text-xs text-green-600 font-medium mt-0.5">{trend}</p>}
      </div>
    </div>
  );
}
