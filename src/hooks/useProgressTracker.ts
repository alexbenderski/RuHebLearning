import { useCallback } from 'react';
import { recordProgressEvent, upsertModuleProgress } from '../firebase/userService';

interface TrackStepInput {
  moduleId: string;
  stepId: string;
  isCorrect?: boolean;
  payload?: Record<string, string | number | boolean>;
}

export const useProgressTracker = (userId: string | null | undefined) => {
  const trackStep = useCallback(async ({ moduleId, stepId, isCorrect, payload }: TrackStepInput) => {
    if (!userId) return;

    const attemptsDelta = typeof isCorrect === 'boolean' ? 1 : 0;
    const correctDelta = isCorrect ? 1 : 0;

    await Promise.all([
      upsertModuleProgress(userId, moduleId, { attemptsDelta, correctDelta, stepId }),
      recordProgressEvent(userId, { moduleId, stepId, isCorrect, payload }),
    ]);
  }, [userId]);

  return { trackStep };
};
