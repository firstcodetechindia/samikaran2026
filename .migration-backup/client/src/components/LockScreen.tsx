import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Delete, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface LockScreenProps {
  isLocked: boolean;
  onUnlock: () => void;
  onLogout?: () => void;
  userPin?: string;
  userName: string;
  userAvatar?: string;
  children?: React.ReactNode;
}

export function LockScreen({ isLocked, onUnlock, onLogout, userPin = "1234", userName, userAvatar, children }: LockScreenProps) {
  const [enteredPin, setEnteredPin] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  
  // Use default PIN if not provided
  const pin = userPin || "1234";

  const handlePinEntry = useCallback((digit: string) => {
    if (enteredPin.length < 6) {
      const newPin = enteredPin + digit;
      setEnteredPin(newPin);
      setError(false);
      
      if (newPin.length === pin.length) {
        if (newPin === pin) {
          onUnlock();
          setEnteredPin("");
        } else {
          setError(true);
          setShake(true);
          setTimeout(() => {
            setEnteredPin("");
            setShake(false);
          }, 500);
        }
      }
    }
  }, [enteredPin, pin, onUnlock]);

  const handleDelete = useCallback(() => {
    setEnteredPin(prev => prev.slice(0, -1));
    setError(false);
  }, []);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (!isLocked) return;
      if (e.key >= "0" && e.key <= "9") {
        handlePinEntry(e.key);
      } else if (e.key === "Backspace") {
        handleDelete();
      }
    };
    
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [isLocked, handlePinEntry, handleDelete]);

  useEffect(() => {
    if (!isLocked) {
      setEnteredPin("");
      setError(false);
    }
  }, [isLocked]);

  const initials = userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const numpadButtons = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "del"]
  ];

  if (!isLocked) return <>{children}</>;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)"
        }}
      >
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/10"
              style={{
                width: Math.random() * 100 + 50,
                height: Math.random() * 100 + 50,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-4"
        >
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <Avatar className="w-24 h-24 border-4 border-primary/20">
                <AvatarImage src={userAvatar} alt={userName} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-purple-600 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            
            <h2 className="mt-4 text-xl font-semibold text-foreground">{userName}</h2>
            <p className="text-sm text-muted-foreground mt-1">Enter your PIN to unlock</p>
          </div>

          <motion.div 
            className="flex justify-center gap-3 mb-8"
            animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            {[...Array(pin.length)].map((_, i) => (
              <motion.div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-colors ${
                  i < enteredPin.length
                    ? error
                      ? "bg-destructive border-destructive"
                      : "bg-primary border-primary"
                    : "border-muted-foreground/30"
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05 }}
              />
            ))}
          </motion.div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-destructive text-sm text-center mb-4"
            >
              Incorrect PIN. Try again.
            </motion.p>
          )}

          <div className="grid grid-cols-3 gap-3">
            {numpadButtons.flat().map((btn, i) => {
              if (btn === "") {
                return <div key={i} className="aspect-square" />;
              }
              if (btn === "del") {
                return (
                  <Button
                    key={i}
                    variant="ghost"
                    className="aspect-square text-lg rounded-xl hover-elevate"
                    onClick={handleDelete}
                    data-testid="button-pin-delete"
                  >
                    <Delete className="w-5 h-5" />
                  </Button>
                );
              }
              return (
                <motion.div key={i} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    className="w-full aspect-square text-2xl font-medium rounded-xl hover-elevate"
                    onClick={() => handlePinEntry(btn)}
                    data-testid={`button-pin-${btn}`}
                  >
                    {btn}
                  </Button>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-center">
            <Button
              variant="ghost"
              className="text-sm text-muted-foreground gap-2"
              onClick={onLogout}
              data-testid="button-lock-logout"
            >
              <LogOut className="w-4 h-4" />
              Sign in as a Different User
            </Button>
          </div>
        </motion.div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Lock className="w-4 h-4" />
          <span className="text-sm">Screen locked for your security</span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const LOCK_STORAGE_PREFIX = "samikaran_lock_";

export function useLockScreen(userPin: string | null | undefined, lockEnabled: boolean, userId?: number | string) {
  const storageKey = userId ? `${LOCK_STORAGE_PREFIX}${userId}` : null;
  
  const [isLocked, setIsLocked] = useState(() => {
    if (typeof window !== "undefined" && lockEnabled && userPin && storageKey) {
      return localStorage.getItem(storageKey) === "true";
    }
    return false;
  });

  useEffect(() => {
    if (lockEnabled && userPin && storageKey) {
      localStorage.setItem(storageKey, isLocked ? "true" : "false");
    } else if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  }, [isLocked, lockEnabled, userPin, storageKey]);

  const lock = useCallback(() => {
    if (userPin && lockEnabled) {
      setIsLocked(true);
    }
  }, [userPin, lockEnabled]);

  const unlock = useCallback(() => {
    setIsLocked(false);
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "l" && userPin && lockEnabled) {
        e.preventDefault();
        lock();
      }
    };
    
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [lock, userPin, lockEnabled]);

  return { isLocked, lock, unlock };
}
