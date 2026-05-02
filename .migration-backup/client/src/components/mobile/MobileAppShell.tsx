import { ReactNode, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { BottomNavigation, NavTab } from "./BottomNavigation";
import { PageTransition } from "./PageTransition";
import { useSwipeBack } from "@/hooks/use-swipe-gesture";

interface MobileAppShellProps {
  children: ReactNode;
  tabs: NavTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  hideBottomNav?: boolean;
  enableSwipeBack?: boolean;
  onSwipeBack?: () => void;
  className?: string;
  headerContent?: ReactNode;
}

export function MobileAppShell({
  children,
  tabs,
  activeTab,
  onTabChange,
  hideBottomNav = false,
  enableSwipeBack = true,
  onSwipeBack,
  className,
  headerContent
}: MobileAppShellProps) {
  const [isIOS, setIsIOS] = useState(false);
  
  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
  }, []);

  const { swipeHandlers } = useSwipeBack({
    enabled: enableSwipeBack,
    onSwipeBack
  });

  return (
    <div 
      className={cn(
        "mobile-app-shell min-h-screen bg-background",
        "flex flex-col",
        isIOS && "ios-safe-area",
        className
      )}
      {...swipeHandlers}
    >
      {headerContent && (
        <header className="flex-shrink-0 sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50">
          {headerContent}
        </header>
      )}
      
      <main className={cn(
        "flex-1 overflow-y-auto overflow-x-hidden",
        "pb-20 md:pb-0",
        !hideBottomNav && "mobile-content-with-bottom-nav"
      )}>
        <PageTransition activeKey={activeTab}>
          {children}
        </PageTransition>
      </main>
      
      <BottomNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        hidden={hideBottomNav}
      />
    </div>
  );
}

export default MobileAppShell;
