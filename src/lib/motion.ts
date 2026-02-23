type MotionStyle = { opacity: number; y?: number; x?: number };

export function fadeUp(reduceMotion: boolean, distance = 20) {
  return {
    initial: reduceMotion ? ({ opacity: 0 } as MotionStyle) : ({ opacity: 0, y: distance } as MotionStyle),
    animate: ({ opacity: 1, y: 0 } as MotionStyle),
    whileInView: ({ opacity: 1, y: 0 } as MotionStyle),
  };
}

export function fadeDown(reduceMotion: boolean, distance = 10) {
  return {
    initial: reduceMotion ? ({ opacity: 0 } as MotionStyle) : ({ opacity: 0, y: -distance } as MotionStyle),
    animate: ({ opacity: 1, y: 0 } as MotionStyle),
  };
}

export function fadeLeft(reduceMotion: boolean, distance = 20) {
  return {
    initial: reduceMotion ? ({ opacity: 0 } as MotionStyle) : ({ opacity: 0, x: -distance } as MotionStyle),
    animate: ({ opacity: 1, x: 0 } as MotionStyle),
  };
}

export const motionTiming = {
  fast: { duration: 0.2 },
  normal: { duration: 0.35 },
  slow: { duration: 0.4 },
} as const;

