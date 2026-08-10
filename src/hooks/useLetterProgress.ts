import { useCallback } from 'react';
import { recordProgressEvent, upsertModuleProgress } from '../firebase/userService';

// ─────────────────────────────────────────────────────────────
// Per-letter progress tracking for the Alphabet module.
// Logs each letter attempt/play as a progress event so we can
// later show "which letters you have played/learned" stats.
// ─────────────────────────────────────────────────────────────
export type LetterProgressPayload = {
  letter: string;        // Hebrew letter char (e.g. "א" or "אָ")
  isCorrect?: boolean;
  game: string;          // e.g. 'quiz' | 'memory' | 'nikud'
  detail?: string;       // e.g. 'match', 'name-pick', 'mark-pick'
};

interface TrackLetterInput extends LetterProgressPayload {
  moduleId?: string;
}

export const useLetterProgress = (userId: string | null | undefined) => {
  const trackLetter = useCallback(
    async ({ letter, isCorrect, game, detail, moduleId = 'alphabet' }: TrackLetterInput) => {
      if (!userId || !letter) return;

      const stepId = `letter:${letter}:${game}${detail ? `:${detail}` : ''}`;
      const attemptsDelta = typeof isCorrect === 'boolean' ? 1 : 0;
      const correctDelta = isCorrect ? 1 : 0;

      await Promise.all([
        upsertModuleProgress(userId, moduleId, { attemptsDelta, correctDelta, stepId }),
        recordProgressEvent(userId, {
          moduleId,
          stepId,
          isCorrect,
          payload: { letter, game, detail: detail ?? '' },
        }),
      ]);
    },
    [userId],
  );

  return { trackLetter };
};