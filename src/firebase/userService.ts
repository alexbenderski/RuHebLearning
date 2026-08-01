import {
  doc,
  deleteDoc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  arrayUnion,
  orderBy,
  limit,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from './config';
import type { UserProfile, MistakeEntry, ModuleProgress, ProgressEvent } from '../types';
import type { SavedWord, VocabWord } from '../types';
import { COLLECTIONS } from '../types';

export const createUserProfile = async (
  uid: string,
  email: string,
  displayName: string,
): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) return;

  await setDoc(userRef, {
    uid,
    email,
    displayName,
    currentLevel: 1,
    completedLevels: [],
    totalPoints: 0,
    streak: 0,
    createdAt: serverTimestamp(),
    lastActive: serverTimestamp(),
  });
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
};

export const updateUserPoints = async (uid: string, points: number): Promise<void> => {
  await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
    totalPoints: increment(points),
    lastActive: serverTimestamp(),
  });
};

export const completeLevel = async (
  uid: string,
  level: number,
  pointsEarned: number,
): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const data = snap.data() as UserProfile;
  const completedLevels = data.completedLevels.includes(level)
    ? data.completedLevels
    : [...data.completedLevels, level];

  await updateDoc(userRef, {
    completedLevels,
    currentLevel: Math.max(data.currentLevel, level + 1),
    totalPoints: increment(pointsEarned),
    lastActive: serverTimestamp(),
  });
};

/** Upserts a word mistake: creates entry or increments existing fail count. */
export const recordMistake = async (
  uid: string,
  mistake: Omit<MistakeEntry, 'failCount' | 'lastFailed'>,
): Promise<void> => {
  const mistakesRef = collection(db, COLLECTIONS.USERS, uid, COLLECTIONS.MISTAKES_HISTORY);
  const q = query(mistakesRef, where('wordId', '==', mistake.wordId));
  const snap = await getDocs(q);

  if (snap.empty) {
    await addDoc(mistakesRef, { ...mistake, failCount: 1, lastFailed: serverTimestamp() });
  } else {
    await updateDoc(snap.docs[0].ref, {
      failCount: increment(1),
      lastFailed: serverTimestamp(),
    });
  }
};

export const getMistakesHistory = async (uid: string): Promise<MistakeEntry[]> => {
  const snap = await getDocs(
    collection(db, COLLECTIONS.USERS, uid, COLLECTIONS.MISTAKES_HISTORY),
  );
  return snap.docs.map((d) => d.data() as MistakeEntry);
};

export const recordProgressEvent = async (
  uid: string,
  event: Omit<ProgressEvent, 'createdAt'>,
): Promise<void> => {
  const payload: Record<string, unknown> = {
    moduleId: event.moduleId,
    stepId: event.stepId,
    createdAt: serverTimestamp(),
  };
  if (typeof event.isCorrect === 'boolean') payload.isCorrect = event.isCorrect;
  if (event.payload && Object.keys(event.payload).length > 0) payload.payload = event.payload;
  await addDoc(collection(db, COLLECTIONS.USERS, uid, COLLECTIONS.PROGRESS_EVENTS), payload);
};

export const upsertModuleProgress = async (
  uid: string,
  moduleId: string,
  update: {
    attemptsDelta?: number;
    correctDelta?: number;
    stepId: string;
  },
): Promise<void> => {
  const progressRef = doc(db, COLLECTIONS.USERS, uid, COLLECTIONS.MODULE_PROGRESS, moduleId);
  const snap = await getDoc(progressRef);

  if (!snap.exists()) {
    await setDoc(progressRef, {
      moduleId,
      attempts: update.attemptsDelta ?? 0,
      correct: update.correctDelta ?? 0,
      lastStep: update.stepId,
      completedSteps: [update.stepId],
      updatedAt: serverTimestamp(),
    });
    return;
  }

  await updateDoc(progressRef, {
    attempts: increment(update.attemptsDelta ?? 0),
    correct: increment(update.correctDelta ?? 0),
    lastStep: update.stepId,
    completedSteps: arrayUnion(update.stepId),
    updatedAt: serverTimestamp(),
  });
};

export const getModuleProgressMap = async (uid: string): Promise<Record<string, ModuleProgress>> => {
  const snap = await getDocs(collection(db, COLLECTIONS.USERS, uid, COLLECTIONS.MODULE_PROGRESS));
  return snap.docs.reduce<Record<string, ModuleProgress>>((acc, d) => {
    const item = d.data() as ModuleProgress;
    acc[item.moduleId] = item;
    return acc;
  }, {});
};

export const getRecentProgressEvents = async (uid: string, max = 20): Promise<ProgressEvent[]> => {
  const q = query(
    collection(db, COLLECTIONS.USERS, uid, COLLECTIONS.PROGRESS_EVENTS),
    orderBy('createdAt', 'desc'),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as ProgressEvent);
};

export const saveWordToList = async (uid: string, word: VocabWord): Promise<void> => {
  const ref = doc(db, COLLECTIONS.USERS, uid, COLLECTIONS.SAVED_WORDS, word.id);
  await setDoc(ref, {
    ...word,
    savedAt: serverTimestamp(),
  });
};

export const updateSavedWordDifficulty = async (
  uid: string,
  wordId: string,
  difficulty: 'easy' | 'medium' | 'hard',
): Promise<void> => {
  const ref = doc(db, COLLECTIONS.USERS, uid, COLLECTIONS.SAVED_WORDS, wordId);
  await updateDoc(ref, {
    difficulty,
    savedAt: serverTimestamp(),
  });
};

export const removeWordFromList = async (uid: string, wordId: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTIONS.USERS, uid, COLLECTIONS.SAVED_WORDS, wordId));
};

export const getSavedWords = async (uid: string): Promise<SavedWord[]> => {
  const snap = await getDocs(collection(db, COLLECTIONS.USERS, uid, COLLECTIONS.SAVED_WORDS));
  return snap.docs.map((d) => d.data() as SavedWord);
};

export const getTrackedWordIds = async (uid: string): Promise<Set<string>> => {
  const tracked = new Set<string>();

  const saved = await getSavedWords(uid);
  saved.forEach((w) => tracked.add(w.id));

  const eventsSnap = await getDocs(collection(db, COLLECTIONS.USERS, uid, COLLECTIONS.PROGRESS_EVENTS));
  eventsSnap.docs.forEach((docSnap) => {
    const data = docSnap.data() as ProgressEvent;
    const step = data.stepId;
    if (step.startsWith('card:')) {
      tracked.add(step.slice('card:'.length));
    }
    if (step.startsWith('quiz:')) {
      const parts = step.split(':');
      const maybeWordId = parts[parts.length - 1];
      if (maybeWordId) tracked.add(maybeWordId);
    }
    if (step.startsWith('save:')) {
      tracked.add(step.slice('save:'.length));
    }
  });

  return tracked;
};
