import type { Transition, Variants } from "framer-motion";

export const motionTiming = {
  fast: 0.16,
  normal: 0.2,
  slow: 0.24,
} as const;

export const motionEase = [0.22, 1, 0.36, 1] as const;

export const viewportOnce = { once: true, amount: 0.18 } as const;

export function fadeUp(reduced: boolean, distance = 16): Variants {
  return {
    hidden: { opacity: 0, y: reduced ? 0 : distance },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: motionTiming.normal, ease: motionEase },
    },
  };
}

export function fadeOnly(reduced: boolean): Variants {
  return {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { duration: reduced ? motionTiming.fast : motionTiming.normal, ease: motionEase },
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
