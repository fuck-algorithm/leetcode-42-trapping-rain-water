export const MOTION = {
  enter: 220,
  update: 240,
  exit: 180,
  dwell: 500,
} as const;

export function motionDuration(speed: number, reducedMotion: boolean): number {
  if (reducedMotion) return 0;
  return Math.min(MOTION.update, Math.round(speed * 0.45));
}
