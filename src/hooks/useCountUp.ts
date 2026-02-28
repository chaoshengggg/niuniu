import { useEffect, useState } from 'react';

/**
 * Animates a number counting up from 1 to the target value.
 * Returns 0 instantly for target 0, otherwise counts 1 → 2 → ... → target.
 */
export function useCountUp(target: number, stepMs = 120): number {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (target <= 0) {
      setCurrent(0);
      return;
    }

    setCurrent(1);

    if (target <= 1) return;

    let step = 1;
    const id = setInterval(() => {
      step++;
      setCurrent(step);
      if (step >= target) clearInterval(id);
    }, stepMs);

    return () => clearInterval(id);
  }, [target, stepMs]);

  return current;
}
