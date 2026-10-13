export interface MotionPolicy {
  systemReducedMotion: boolean;
  paused: boolean;
}

export function shouldAnimate(policy: MotionPolicy): boolean {
  return !policy.systemReducedMotion && !policy.paused;
}
