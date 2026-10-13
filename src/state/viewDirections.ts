export const TURN_DIRECTIONS = ['left', 'right', 'back', 'up', 'down'] as const;
export type ViewDirection = 'forward' | typeof TURN_DIRECTIONS[number];

/** Classify a resting camera pose relative to its standing point. */
export function viewDirection(yaw: number, pitch: number, startingYaw: number): ViewDirection {
  if (pitch >= 0.25) return 'up';
  if (pitch <= -0.42) return 'down';
  const turn = Math.atan2(Math.sin(yaw - startingYaw), Math.cos(yaw - startingYaw));
  if (Math.abs(turn) < 0.2) return 'forward';
  if (Math.abs(turn) > 2.35) return 'back';
  return turn < 0 ? 'left' : 'right';
}
