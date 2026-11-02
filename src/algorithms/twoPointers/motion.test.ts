import { MOTION, motionDuration } from './motion';

describe('motion timing', () => {
  it('keeps transitions below 45% of the playback dwell', () => {
    expect(motionDuration(MOTION.dwell, false)).toBe(225);
    expect(motionDuration(1000, false)).toBe(240);
  });

  it('disables transitions for reduced motion', () => {
    expect(motionDuration(500, true)).toBe(0);
  });
});
