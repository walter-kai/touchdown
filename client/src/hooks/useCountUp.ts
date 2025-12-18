import { useEffect, useRef, useState } from 'react';

interface UseCountUpOptions {
  duration?: number; // Duration in milliseconds
  preserveValue?: boolean; // If true, maintains the value without resetting
}

export const useCountUp = (
  end: number,
  options: UseCountUpOptions = {}
): number => {
  const { duration = 1000, preserveValue = false } = options;
  const [count, setCount] = useState(0);
  const startValueRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number>();
  const prevEndRef = useRef<number | null>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    // If preserveValue is true and we've already animated once, and end hasn't changed, don't animate
    if (preserveValue && hasAnimatedRef.current && prevEndRef.current === end) {
      return;
    }

    // If end value changed, start animation from current count
    if (prevEndRef.current !== null && prevEndRef.current !== end) {
      startValueRef.current = count;
      prevEndRef.current = end;
      startTimeRef.current = null;
    } else if (prevEndRef.current === null) {
      // First render - animate from 0
      startValueRef.current = 0;
      prevEndRef.current = end;
      startTimeRef.current = null;
    }

    const startValue = startValueRef.current;

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic for smooth deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const currentCount = Math.floor(
        startValue + (end - startValue) * easeProgress
      );

      setCount(currentCount);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(end); // Ensure we end at exact value
        startValueRef.current = end;
        hasAnimatedRef.current = true;
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, duration, preserveValue, count]);

  return count;
};
