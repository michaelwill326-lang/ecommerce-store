import { useEffect, useRef, useState } from "react";

export default function usePullToRefresh(onRefresh) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(null);
  const threshold = 80;

  useEffect(() => {
    const onTouchStart = (e) => {
      if (window.scrollY === 0) startY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e) => {
      if (!startY.current) return;
      const dist = e.touches[0].clientY - startY.current;
      if (dist > 0 && window.scrollY === 0) {
        setPullDistance(Math.min(dist, threshold + 20));
        setPulling(dist > threshold);
      }
    };

    const onTouchEnd = () => {
      if (pulling) onRefresh();
      setPulling(false);
      setPullDistance(0);
      startY.current = null;
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd);
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [pulling, onRefresh]);

  return { pulling, pullDistance, threshold };
}
