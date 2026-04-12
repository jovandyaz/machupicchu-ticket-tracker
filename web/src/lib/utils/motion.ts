import { useReducedMotion } from "motion/react";

interface FadeProps {
  initial?: { opacity: number; y: number };
  animate?: { opacity: number; y: number };
  transition?: { duration: number; delay: number };
}

/**
 * Returns a helper that produces motion props for a staggered fade-in. When
 * the user prefers reduced motion, the helper returns an empty object so the
 * element mounts at its final state.
 */
export function useFadeIn(): (delay?: number) => FadeProps {
  const reduce = useReducedMotion() ?? false;
  return (delay = 0) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, delay },
        };
}
