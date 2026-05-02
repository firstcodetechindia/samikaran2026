import { useState, useCallback, useRef } from "react";

interface SwipeBackOptions {
  enabled?: boolean;
  threshold?: number;
  onSwipeBack?: () => void;
}

interface SwipeState {
  startX: number;
  startY: number;
  currentX: number;
  isSwiping: boolean;
}

export function useSwipeBack({ 
  enabled = true, 
  threshold = 100,
  onSwipeBack 
}: SwipeBackOptions = {}) {
  const [swipeState, setSwipeState] = useState<SwipeState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    isSwiping: false
  });
  
  const swipeRef = useRef<SwipeState>(swipeState);
  swipeRef.current = swipeState;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;
    
    const touch = e.touches[0];
    if (touch.clientX > 30) return;
    
    setSwipeState({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      isSwiping: true
    });
  }, [enabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled || !swipeRef.current.isSwiping) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeRef.current.startX;
    const deltaY = Math.abs(touch.clientY - swipeRef.current.startY);
    
    if (deltaY > 50) {
      setSwipeState(prev => ({ ...prev, isSwiping: false }));
      return;
    }
    
    if (deltaX > 0) {
      setSwipeState(prev => ({ ...prev, currentX: touch.clientX }));
    }
  }, [enabled]);

  const handleTouchEnd = useCallback(() => {
    if (!enabled || !swipeRef.current.isSwiping) return;
    
    const deltaX = swipeRef.current.currentX - swipeRef.current.startX;
    
    if (deltaX > threshold && onSwipeBack) {
      onSwipeBack();
    }
    
    setSwipeState({
      startX: 0,
      startY: 0,
      currentX: 0,
      isSwiping: false
    });
  }, [enabled, threshold, onSwipeBack]);

  const swipeProgress = swipeState.isSwiping 
    ? Math.min((swipeState.currentX - swipeState.startX) / threshold, 1)
    : 0;

  return {
    swipeHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    },
    swipeProgress,
    isSwiping: swipeState.isSwiping
  };
}

interface PullToRefreshOptions {
  enabled?: boolean;
  threshold?: number;
  onRefresh?: () => Promise<void>;
}

export function usePullToRefresh({
  enabled = true,
  threshold = 80,
  onRefresh
}: PullToRefreshOptions = {}) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled || isRefreshing) return;
    
    const scrollTop = (e.currentTarget as HTMLElement).scrollTop || 0;
    if (scrollTop > 0) return;
    
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  }, [enabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled || !isPulling || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);
    setPullDistance(Math.min(distance, threshold * 1.5));
  }, [enabled, isPulling, isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!enabled || !isPulling || isRefreshing) return;
    
    if (pullDistance >= threshold && onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setIsPulling(false);
    setPullDistance(0);
  }, [enabled, isPulling, isRefreshing, pullDistance, threshold, onRefresh]);

  return {
    pullHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    },
    pullDistance,
    isPulling,
    isRefreshing,
    pullProgress: Math.min(pullDistance / threshold, 1)
  };
}

export default useSwipeBack;
