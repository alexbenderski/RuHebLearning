import { Timestamp } from 'firebase/firestore';

// ──────────────────────────────────────────────
// Firestore collection name constants
// All collections are prefixed with RuHeb_ to
// avoid collisions with pre-existing collections.
// ──────────────────────────────────────────────
export const COLLECTIONS = {
  USERS: 'RuHeb_users',
  MISTAKES_HISTORY: 'mistakes_history', // sub-collection of a user doc
  MODULE_PROGRESS: 'module_progress',
  PROGRESS_EVENTS: 'progress_events',
  SAVED_WORDS: 'saved_words',
} as const;

// ──────────────────────────────────────────────
// RuHeb_users/{uid}
// ──────────────────────────────────────────────
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  currentLevel: number;
  completedLevels: number[];
  totalPoints: number;
  streak: number;
  createdAt: Timestamp;
  lastActive: Timestamp;
}

// ──────────────────────────────────────────────
// RuHeb_users/{uid}/mistakes_history/{docId}
// ──────────────────────────────────────────────
export interface MistakeEntry {
  wordId: string;
  word: string;        // Hebrew word
  translation: string; // Russian translation
  failCount: number;
  lastFailed: Timestamp;
}

// ──────────────────────────────────────────────
// Alphabet module
// ──────────────────────────────────────────────
export interface HebrewLetter {
  letter: string;
  name: string;            // Russian name (e.g. "Алеф")
  transliteration: string; // How to read (e.g. "А / молчит")
  isFinal: boolean;
  finalOf?: string;        // The regular form this is a final variant of
}

// ──────────────────────────────────────────────
// Words module
// ──────────────────────────────────────────────
export interface VocabWord {
  id: string;
  hebrew: string;
  transliteration: string;
  translation: string;
  mnemonic: string; // Russian memory trick
  category: string;
  difficulty: WordDifficulty;
  sentenceRu?: string; // template with [target word] marked, e.g. "Скажи [привет] другу"
}

export type WordDifficulty = 'easy' | 'medium' | 'hard';

export interface ModuleProgress {
  moduleId: string;
  attempts: number;
  correct: number;
  lastStep: string;
  completedSteps: string[];
  updatedAt: Timestamp;
}

export interface ProgressEvent {
  moduleId: string;
  stepId: string;
  isCorrect?: boolean;
  payload?: Record<string, string | number | boolean>;
  createdAt: Timestamp;
}

export interface VocabCategory {
  id: string;
  name: string; // Russian display name
  icon: string;
  words: VocabWord[];
}

export interface SavedWord extends VocabWord {
  savedAt: Timestamp;
}
