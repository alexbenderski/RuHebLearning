import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../firebase/config';
import { createUserProfile, getUserProfile } from '../firebase/userService';
import type { UserProfile } from '../types';

export interface UseUserReturn {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

export const useUser = (): UseUserReturn => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await createUserProfile(user.uid, user.email ?? '', user.displayName ?? 'Игрок');
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        // No auth yet — create a guest placeholder so the UI renders
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const refreshProfile = async () => {
    if (!firebaseUser) return;
    const profile = await getUserProfile(firebaseUser.uid);
    setUserProfile(profile);
  };

  return { firebaseUser, userProfile, loading, refreshProfile };
};
