import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppState } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Test connectivity on initial boot
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline / check connection');
    }
  }
}
testFirestoreConnection();

// Authentication helpers
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In failed:', error);
    throw error;
  }
}

export async function loginWithApple(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, appleProvider);
    return result.user;
  } catch (error) {
    console.error('Apple Sign-In failed:', error);
    throw error;
  }
}

export async function logoutFirebase(): Promise<void> {
  await fbSignOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Saves user financial profile to Firestore
 */
export async function saveProfileToFirestore(userId: string, state: AppState): Promise<void> {
  const path = `financial_profiles/${userId}`;
  try {
    const dataToSave = {
      userId,
      json: JSON.stringify(state),
      updatedAt: new Date().toISOString(),
      upd: state.upd || Date.now(),
      sueldo: state.sueldo || 0,
      start: state.start || '',
      end: state.end || '',
    };
    await setDoc(doc(db, 'financial_profiles', userId), dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Subscribes to real-time changes of the user profile in Firestore
 */
export function subscribeToFinancialProfile(
  userId: string,
  onData: (state: AppState) => void,
  onError?: (err: Error) => void
) {
  const path = `financial_profiles/${userId}`;
  return onSnapshot(
    doc(db, 'financial_profiles', userId),
    snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && data.json) {
          try {
            const parsed = JSON.parse(data.json);
            onData(parsed);
          } catch (e) {
            console.error('Failed to parse remote financial profile json:', e);
          }
        }
      }
    },
    error => {
      handleFirestoreError(error, OperationType.GET, path);
      if (onError) onError(error);
    }
  );
}

/**
 * Loads financial profile once
 */
export async function loadFinancialProfile(userId: string): Promise<AppState | null> {
  const path = `financial_profiles/${userId}`;
  try {
    const snapshot = await getDoc(doc(db, 'financial_profiles', userId));
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data && data.json) {
        return JSON.parse(data.json);
      }
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}
