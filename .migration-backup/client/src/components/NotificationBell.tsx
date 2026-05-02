import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotificationBellProps {
  hasNewNotifications?: boolean;
  notificationCount?: number;
  onClick?: () => void;
}

export function NotificationBell({ 
  hasNewNotifications = false, 
  notificationCount = 0,
  onClick 
}: NotificationBellProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (hasNewNotifications) {
      setIsAnimating(true);
      const interval = setInterval(() => {
        setIsAnimating(prev => !prev);
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setIsAnimating(false);
    }
  }, [hasNewNotifications]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="relative"
      data-testid="button-notifications"
    >
      <motion.div
        animate={hasNewNotifications ? {
          rotate: [0, -15, 15, -10, 10, -5, 5, 0],
          scale: [1, 1.1, 1.1, 1.1, 1.1, 1.05, 1.05, 1],
        } : {}}
        transition={{
          duration: 0.6,
          repeat: hasNewNotifications ? Infinity : 0,
          repeatDelay: 3,
        }}
      >
        <Bell 
          className={`w-5 h-5 transition-colors duration-300 ${
            hasNewNotifications ? "text-green-500" : "text-muted-foreground"
          }`} 
        />
      </motion.div>
      
      <AnimatePresence>
        {hasNewNotifications && notificationCount > 0 && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
          >
            {notificationCount > 9 ? "9+" : notificationCount}
          </motion.span>
        )}
      </AnimatePresence>
      
      {hasNewNotifications && (
        <motion.span
          className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.7, 0, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
      )}
    </Button>
  );
}