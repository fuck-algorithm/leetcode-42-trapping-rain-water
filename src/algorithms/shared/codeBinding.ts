import { CodeLineBinding } from '../../components/canvas/animation/types';

export type CodeLanguageKey = keyof CodeLineBinding;

export interface BoundCodeLine {
  current?: number;
  highlighted: number[];
}

export function getBoundCodeLine(binding: CodeLineBinding | undefined, language: CodeLanguageKey): BoundCodeLine {
  const lines = binding?.[language] ?? [];
  return { current: lines[0], highlighted: lines };
}
