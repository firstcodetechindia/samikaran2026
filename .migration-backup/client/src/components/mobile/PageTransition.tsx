import { ReactNode, useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PageTransitionProps {
  children: ReactNode;
  activeKey: string;
  direction?: "forward" | "back";
  type?: "slide" | "fade" | "scale";
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0
  })
};

const fadeVariants = {
  enter: { opacity: 0, scale: 0.98 },
  center: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 }
};

export function PageTransition({ 
  children, 
  activeKey,
  direction = "forward",
  type = "fade"
}: PageTransitionProps) {
  const [[page, directionNum], setPage] = useState([activeKey, 0]);
  const prevKey = useRef(activeKey);

  useEffect(() => {
    if (activeKey !== prevKey.current) {
      const newDirection = direction === "forward" ? 1 : -1;
      setPage([activeKey, newDirection]);
      prevKey.current = activeKey;
    }
  }, [activeKey, direction]);

  const variants = type === "slide" ? slideVariants : fadeVariants;

  return (
    <AnimatePresence mode="wait" custom={directionNum}>
      <motion.div
        key={page}
        custom={directionNum}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          x: { type: "spring", stiffness: 400, damping: 35 },
          opacity: { duration: 0.15 },
          scale: { duration: 0.15 }
        }}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl z-50 max-h-[90vh] overflow-hidden"
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
            </div>
            {title && (
              <div className="px-6 pb-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold">{title}</h3>
              </div>
            )}
            <div className="overflow-y-auto max-h-[calc(90vh-60px)] pb-safe-area-bottom">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface ModalTransitionProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function ModalTransition({ isOpen, onClose, children }: ModalTransitionProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-lg md:w-full bg-white dark:bg-gray-900 rounded-2xl z-50 overflow-hidden shadow-2xl"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default PageTransition;
