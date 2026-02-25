import type { Transition, Variants } from "framer-motion";

export const motionTiming = {
  fast: 0.16,
  normal: 0.2,
  slow: 0.24,
} as const;

export const motionEase = [0.22, 1, 0.36, 1] as const;

export const viewportOnce = { once: true, amount: 0.18 } as const;

export function fadeUp(_reduced: boolean, _distance = 16): Variants {
  return {
    hidden: { opacity: 0, y: 0 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: motionTiming.normal, ease: motionEase },
    },
  };
}

export function fadeIn(_reduced: boolean): Variants {
  return {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { duration: motionTiming.fast, ease: motionEase },
    },
  };
}

export function fadeX(_reduced: boolean, _distance = 16, _direction: 1 | -1 = 1): Variants {
  return {
    hidden: { opacity: 0, x: 0 },
    show: {
      opacity: 1,
      x: 0,
      transition: { duration: motionTiming.normal, ease: motionEase },
    },
  };
}

export const listStagger: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

export function dialogOverlayTransition(): Transition {
  return { duration: motionTiming.fast, ease: motionEase };
}

export function dialogContentTransition(): Transition {
  return { duration: motionTiming.fast, ease: motionEase };
}
