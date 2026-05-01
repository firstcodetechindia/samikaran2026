import { useRef, useState, useEffect } from "react";

interface LazySectionProps {
  children: React.ReactNode;
  rootMargin?: string;
  className?: string;
  minHeight?: string;
}

export function LazySection({
  children,
  rootMargin = "200px",
  className,
  minHeight,
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div
      ref={ref}
      className={className}
      style={!visible && minHeight ? { minHeight } : undefined}
    >
      {visible ? children : null}
    </div>
  );
}
