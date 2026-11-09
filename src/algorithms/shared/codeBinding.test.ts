import { createCodeLineBinding } from '../../components/canvas/animation/types';
import { getBoundCodeLine } from './codeBinding';

describe('getBoundCodeLine', () => {
  const binding = createCodeLineBinding([3, 4], [5], [7, 8], [9]);

  it.each([
    ['java', 3, [3, 4]],
    ['python', 5, [5]],
    ['golang', 7, [7, 8]],
    ['javascript', 9, [9]],
  ] as const)('selects the %s line binding', (language, current, highlighted) => {
    expect(getBoundCodeLine(binding, language)).toEqual({ current, highlighted });
  });

  it('safely exposes missing bindings as no active line', () => {
    expect(getBoundCodeLine(undefined, 'java')).toEqual({ current: undefined, highlighted: [] });
  });
});
