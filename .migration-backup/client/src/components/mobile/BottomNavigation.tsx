import { cn } from "@/lib/utils";
import { memo, useCallback, ReactNode } from "react";

export interface NavTab {
  id: string;
  label: string;
  icon: ReactNode;
  activeIcon?: ReactNode;
}

interface BottomNavigationProps {
  tabs: NavTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  hidden?: boolean;
}

// Memoized tab button for performance
const TabButton = memo(function TabButton({ 
  tab, 
  isActive, 
  onClick 
}: { 
  tab: NavTab; 
  isActive: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center flex-1 h-full",
        "transition-colors duration-150",
        "tap-highlight-none",
        "focus:outline-none active:opacity-70"
      )}
      aria-label={tab.label}
      aria-current={isActive ? "page" : undefined}
      data-testid={`nav-tab-${tab.id}`}
    >
      {isActive && (
        <div className="absolute inset-x-2 top-1 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
      )}
      <div className={cn(
        "transition-colors duration-150",
        isActive 
          ? "text-purple-600 dark:text-purple-400" 
          : "text-gray-500 dark:text-gray-400"
      )}>
        {isActive && tab.activeIcon ? tab.activeIcon : tab.icon}
      </div>
      <span className={cn(
        "text-[10px] mt-1 font-medium",
        isActive 
          ? "text-purple-600 dark:text-purple-400" 
          : "text-gray-500 dark:text-gray-400"
      )}>
        {tab.label}
      </span>
    </button>
  );
});

export const BottomNavigation = memo(function BottomNavigation({ 
  tabs, 
  activeTab, 
  onTabChange, 
  className,
  hidden = false
}: BottomNavigationProps) {
  const handleTabChange = useCallback((tabId: string) => {
    onTabChange(tabId);
  }, [onTabChange]);

  if (hidden) return null;

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg",
        "border-t border-gray-200/50 dark:border-gray-800/50",
        "pb-safe-area-bottom",
        "md:hidden",
        // GPU acceleration for smooth fixed positioning
        "transform-gpu will-change-transform",
        className
      )}
      style={{ transform: 'translateZ(0)' }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onClick={() => handleTabChange(tab.id)}
          />
        ))}
      </div>
    </nav>
  );
});

export default BottomNavigation;
