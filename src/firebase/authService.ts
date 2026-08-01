import {
  signInWithPopup,
  signInWithRedirect,
  signOut,
  getRedirectResult,
} from 'firebase/auth';
import { auth, googleProvider } from './config';

export async function signInWithGoogle(): Promise<void> {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch {
    await signInWithRedirect(auth, googleProvider);
  }
}

export async function completeRedirectSignIn(): Promise<void> {
  await getRedirectResult(auth);
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}
