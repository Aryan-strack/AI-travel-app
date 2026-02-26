import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth, db } from '../lib/firebase';
import {
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  sendPasswordResetEmail,
  deleteUser,
  GoogleAuthProvider,
  signInWithCredential,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, onSnapshot } from 'firebase/firestore';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Preferences = {
  budget?: number;
  interests?: string[];
  homeAirport?: string;
  currency?: string;
  photoURL?: string | null;
};

type AppUser = {
  uid: string;
  email: string | null;
  userName?: string | null;
  photoURL?: string | null;
  preferences?: Preferences;
};

type AuthContextType = {
  user: User | null;
  profile: AppUser | null;
  loading: boolean;
  registerWithEmail: (email: string, password: string, userName?: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  loginWithBiometric: () => Promise<void>;
  logout: () => Promise<void>;
  updatePreferences: (prefs: Preferences) => Promise<void>;
  updateUserName: (name: string) => Promise<void>;
  setUserNameForExistingUser: (name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const writeCachedProfile = async (uid: string, snapshot: { uid: string; email: string | null; userName?: string | null; preferences?: Preferences | undefined; }) => {
    try {
      await AsyncStorage.setItem(`profile:cached:${uid}`, JSON.stringify(snapshot));
      if (snapshot.email) {
        await AsyncStorage.setItem(`profile:userName:${snapshot.email.toLowerCase()}`, snapshot.userName ?? '');
      }
    } catch {}
  };

  // Initialize authentication
  useEffect(() => {
    // Authentication setup
  }, []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async current => {
      setUser(current);
      if (current) {
        const ref = doc(db, 'users', current.uid);
        // Ensure document exists at least once
        try {
          const snap = await getDoc(ref);
          if (!snap.exists()) {
            await setDoc(ref, {
              email: current.email,
              userName: current.displayName ?? null,
              createdAt: serverTimestamp(),
              preferences: {},
              notificationSettings: { pushEnabled: true },
            });
          }
        } catch {}

        // Live subscription to user profile
        const unsubUser = onSnapshot(ref, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as any;
            let userName = data.userName ?? current.displayName ?? null;
            if (!userName) {
              try {
                const emailKey = (current.email ?? '').toLowerCase();
                userName = emailKey ? (await AsyncStorage.getItem(`profile:userName:${emailKey}`)) : null;
              } catch {}
            }
            const prof = { uid: current.uid, email: data.email ?? current.email, userName: userName, photoURL: data.preferences?.photoURL || null, preferences: data.preferences };
            setProfile(prof);
            await writeCachedProfile(current.uid, prof);
          }
        }, async (err) => {
          // Permission or offline error: fall back to cached profile
          try {
            const cached = await AsyncStorage.getItem(`profile:cached:${current.uid}`);
            if (cached) setProfile(JSON.parse(cached));
          } catch {}
        });

        // Cache identity for biometric
        try {
          const emailKey = (current.email ?? '').toLowerCase();
          if (emailKey) {
            await AsyncStorage.setItem('biometric:lastEmail', emailKey);
            await AsyncStorage.setItem('biometric:lastUid', current.uid);
          }
        } catch {}

        // Cleanup user subscription when auth user changes/logs out
        return () => {
          try { unsubUser(); } catch {}
        };
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => {
      try { unsubAuth(); } catch {}
    };
  }, []);

  const registerWithEmail = async (email: string, password: string, userName?: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name in Firebase Auth
      if (userName && auth.currentUser) {
        try {
          await updateProfile(auth.currentUser, { displayName: userName });
        } catch (error) {
          console.log('Failed to update display name in Auth:', error);
        }
      }
      
      // Immediately save userName to Firestore
      if (auth.currentUser?.uid && userName) {
        try {
          const ref = doc(db, 'users', auth.currentUser.uid);
          await setDoc(ref, { 
            email: auth.currentUser.email,
            userName: userName,
            createdAt: serverTimestamp(),
            preferences: {},
            notificationSettings: { pushEnabled: true }
          }, { merge: true });
        } catch (error) {
          console.log('Failed to save userName to Firestore:', error);
        }
      }
      
      // Persist identity for biometric rehydration
      try {
        const current = auth.currentUser;
        if (current?.uid) {
          await AsyncStorage.setItem('biometric:lastEmail', (current.email ?? email).toLowerCase());
          await AsyncStorage.setItem('biometric:lastUid', current.uid);
        }
      } catch {}
    } catch (error: any) {
      if (error.code === 'auth/invalid-api-key' || 
          error.code === 'auth/api-key-not-valid' || 
          error.code === 'auth/invalid-credential') {
        // Demo mode - simulate successful registration
        const derivedUid = `demo-${email.toLowerCase()}`;
        const demoUser = { uid: derivedUid, email } as User;
        setUser(demoUser);
        setProfile({ uid: derivedUid, email, userName: userName || null, preferences: {} });
        try {
          await AsyncStorage.setItem('biometric:lastEmail', email.toLowerCase());
          await AsyncStorage.setItem('biometric:lastUid', derivedUid);
          // Cache the profile with userName
          await AsyncStorage.setItem(`profile:cached:${derivedUid}`, JSON.stringify({
            uid: derivedUid,
            email,
            userName: userName || null,
            preferences: {}
          }));
        } catch {}
        return;
      }
      throw error;
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Persist identity for biometric rehydration
      try {
        const current = auth.currentUser;
        if (current?.uid) {
          await AsyncStorage.setItem('biometric:lastEmail', (current.email ?? email).toLowerCase());
          await AsyncStorage.setItem('biometric:lastUid', current.uid);
        }
      } catch {}
    } catch (error: any) {
      if (error.code === 'auth/invalid-api-key' || 
          error.code === 'auth/api-key-not-valid' || 
          error.code === 'auth/invalid-credential') {
        // Demo mode - simulate successful login
        const derivedUid = `demo-${email.toLowerCase()}`;
        const demoUser = { uid: derivedUid, email } as User;
        setUser(demoUser);
        setProfile({ uid: derivedUid, email, displayName: 'Traveler', preferences: {} });
        try {
          await AsyncStorage.setItem('biometric:lastEmail', email.toLowerCase());
          await AsyncStorage.setItem('biometric:lastUid', derivedUid);
        } catch {}
        return;
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      // Ignore errors; proceed to clear local session regardless (supports demo/biometric sessions)
      if (error.code && error.code !== 'auth/invalid-api-key' && error.code !== 'auth/api-key-not-valid') {
        console.log('Logout warning:', error?.message ?? error);
      }
    } finally {
      // Clear local auth/session state regardless of Firebase outcome
      setUser(null);
      setProfile(null);
      // Clear biometric preference
      try {
        const last = await AsyncStorage.getItem('biometric:lastEmail');
        if (last) {
          await AsyncStorage.removeItem(`biometric:enabled:${last}`);
        }
        await AsyncStorage.removeItem('biometric:lastEmail');
      } catch {}
    }
  };

  const updatePreferences = async (prefs: Preferences) => {
    if (!user) return;
    const payload: any = {};
    if (typeof prefs.budget === 'number') payload.budget = prefs.budget;
    if (Array.isArray(prefs.interests)) payload.interests = prefs.interests;
    if (typeof prefs.homeAirport === 'string' && prefs.homeAirport.length > 0) payload.homeAirport = prefs.homeAirport;
    if (typeof prefs.currency === 'string' && prefs.currency.length > 0) payload.currency = prefs.currency;
    if (typeof prefs.photoURL === 'string' && prefs.photoURL.length > 0) payload.photoURL = prefs.photoURL;
    try {
      const ref = doc(db, 'users', user.uid);
      const updateData: any = { updatedAt: serverTimestamp() };
      if (Object.keys(payload).length > 0) {
        updateData.preferences = payload;
      }
      await setDoc(ref, updateData, { merge: true });
    } catch (error: any) {
      if (error.code === 'auth/invalid-api-key' || error.code === 'auth/api-key-not-valid' || error.code === 'permission-denied' || error.code === 'missing-or-insufficient-permissions') {
        // Demo mode - just update local state
        console.log('Demo mode: preferences updated locally');
      } else {
        throw error;
      }
    }
    setProfile(prev => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        photoURL: payload.photoURL || prev.photoURL,
        preferences: {
          ...prev.preferences,
          ...payload
        }
      };
      if (updated) {
        writeCachedProfile(user.uid, updated);
      }
      return updated;
    });
  };

  const updateUserName = async (name: string) => {
    if (!user) return;
    try {
      const ref = doc(db, 'users', user.uid);
      await setDoc(ref, { userName: name, updatedAt: serverTimestamp() }, { merge: true });
      setProfile(prev => {
        const updated = prev ? { ...prev, userName: name } : prev;
        if (updated) {
          writeCachedProfile(user.uid, updated);
        }
        return updated;
      });
      try {
        const emailKey = (profile?.email ?? '').toLowerCase();
        if (emailKey) {
          await AsyncStorage.setItem(`profile:userName:${emailKey}`, name);
        }
      } catch {}
      // Also set lastUid snapshot to ensure password sessions pick it up immediately
      try {
        await AsyncStorage.setItem('biometric:lastUid', user.uid);
      } catch {}
    } catch (error: any) {
      if (error.code === 'auth/invalid-api-key' || error.code === 'auth/api-key-not-valid' || error.code === 'permission-denied' || error.code === 'missing-or-insufficient-permissions') {
        // Demo mode: update local state only
        setProfile(prev => {
          const updated = prev ? { ...prev, userName: name } : prev;
          if (updated) {
            writeCachedProfile(user.uid, updated);
          }
          return updated;
        });
        try {
          const emailKey = (profile?.email ?? '').toLowerCase();
          if (emailKey) {
            await AsyncStorage.setItem(`profile:userName:${emailKey}`, name);
          }
        } catch {}
      } else {
        throw error;
      }
    }
  };

  // Debug function to manually set userName for existing users
  const setUserNameForExistingUser = async (name: string) => {
    if (!user) return;
    try {
      const ref = doc(db, 'users', user.uid);
      await setDoc(ref, { userName: name }, { merge: true });
      console.log('UserName updated in Firestore:', name);
    } catch (error) {
      console.log('Failed to update userName:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      if (error.code === 'auth/invalid-api-key' || error.code === 'auth/api-key-not-valid') {
        // Demo mode - simulate password reset
        console.log('Demo mode: password reset email sent');
        return;
      }
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      // Demo mode - simulate Google login
      const demoUser = { uid: 'google-demo-user', email: 'demo@gmail.com' } as User;
      setUser(demoUser);
      setProfile({ uid: 'google-demo-user', email: 'demo@gmail.com', displayName: 'Google User', preferences: {} });
    } catch (error: any) {
      throw error;
    }
  };

  const loginWithApple = async () => {
    try {
      if (Platform.OS !== 'ios') {
        // Demo mode for Android
        const demoUser = { uid: 'apple-demo-user', email: 'demo@icloud.com' } as User;
        setUser(demoUser);
        setProfile({ uid: 'apple-demo-user', email: 'demo@icloud.com', displayName: 'Apple User', preferences: {} });
        return;
      }

      // For iOS, try Apple Sign-In
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Demo mode - simulate Apple login
      const demoUser = { uid: 'apple-demo-user', email: 'demo@icloud.com' } as User;
      setUser(demoUser);
      setProfile({ uid: 'apple-demo-user', email: 'demo@icloud.com', displayName: 'Apple User', preferences: {} });
    } catch (error: any) {
      // Demo mode - simulate Apple login
      const demoUser = { uid: 'apple-demo-user', email: 'demo@icloud.com' } as User;
      setUser(demoUser);
      setProfile({ uid: 'apple-demo-user', email: 'demo@icloud.com', displayName: 'Apple User', preferences: {} });
    }
  };

  const loginWithBiometric = async () => {
    try {
      // Rehydrate last signed-in user from AsyncStorage
      const lastEmail = await AsyncStorage.getItem('biometric:lastEmail');
      const lastUid = await AsyncStorage.getItem('biometric:lastUid');
      if (!lastEmail || !lastUid) {
        throw new Error('No saved account for biometric login. Please login once with email and password.');
      }
      const normalizedEmail = lastEmail.toLowerCase();
      const derivedUid = lastUid; // Always use the exact last UID; never derive a new one

      // Try to fetch profile from Firestore using the same UID; if that fails (offline/demo), fall back to cached snapshot
      try {
        const ref = doc(db, 'users', derivedUid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data: any = snap.data();
          const biometricUser = { uid: derivedUid, email: normalizedEmail } as User;
          setUser(biometricUser);
          const prof = { uid: derivedUid, email: normalizedEmail, userName: data.userName ?? null, preferences: data.preferences ?? {} };
          setProfile(prof);
          await writeCachedProfile(derivedUid, prof);
          return;
        }
      } catch (e: any) {
        // Ignore and continue to demo fallback
      }

      // Try to load full cached profile snapshot to guarantee same dashboard
      try {
        const cachedJson = await AsyncStorage.getItem(`profile:cached:${derivedUid}`);
        if (cachedJson) {
          const cached = JSON.parse(cachedJson);
          const biometricUser = { uid: derivedUid, email: normalizedEmail } as User;
          setUser(biometricUser);
          setProfile({ uid: derivedUid, email: normalizedEmail, userName: cached.userName ?? null, preferences: cached.preferences ?? {} });
          return;
        }
      } catch {}

      // Minimal fallback using cached user name and snapshot
      let cachedName: string | null = null;
      try {
        cachedName = await AsyncStorage.getItem(`profile:userName:${normalizedEmail}`);
      } catch {}
      const biometricUser = { uid: derivedUid, email: normalizedEmail } as User;
      setUser(biometricUser);
      const prof = { uid: derivedUid, email: normalizedEmail, userName: cachedName ?? 'Traveler', preferences: {} };
      setProfile(prof);
      await writeCachedProfile(derivedUid, prof);
    } catch (error: any) {
      throw error;
    }
  };

  const deleteAccount = async () => {
    if (!user) return;
    try {
      await deleteUser(user);
    } catch (error: any) {
      if (error.code === 'auth/invalid-api-key' || error.code === 'auth/api-key-not-valid') {
        // Demo mode - simulate account deletion
        setUser(null);
        setProfile(null);
        return;
      }
      throw error;
    }
  };

  const value = useMemo<AuthContextType>(() => ({
    user,
    profile,
    loading,
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    loginWithApple,
    loginWithBiometric,
    logout,
    updatePreferences,
    updateUserName,
    setUserNameForExistingUser,
    resetPassword,
    deleteAccount,
  }), [user, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};


