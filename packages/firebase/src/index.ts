/**
 * Firebase Configuration and Initialization
 * Centralized Firebase setup with security enforcement
 *
 * Uses lazy initialization to avoid build-time errors during next build
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  connectAuthEmulator,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import {
  Firestore,
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
  initializeFirestore,
  getFirestore
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';
import { getAI, getGenerativeModel, GoogleAIBackend, Schema } from 'firebase/ai';

// Firebase configuration - IMPORTANT: Use direct references for Next.js build-time inlining
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '' // Optional
};

// Lazy initialization cache
let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;
let _analytics: Analytics | undefined = undefined;
let _ai: ReturnType<typeof getAI> | null = null;
let _initialized = false;
let _emulatorsConnected = false;

/**
 * Validate Firebase configuration - called lazily at runtime, not build time
 */
function validateFirebaseConfig(): void {
  // Only validate in production and when not in build phase
  const isProduction = process.env.NODE_ENV === 'production';
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

  if (isProduction && !isBuildPhase) {
    const requiredVars = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    const missing = requiredVars.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);
    if (missing.length > 0) {
      console.error(`Missing Firebase environment variables: ${missing.join(', ')}`);
      throw new Error(`Firebase configuration error: ${missing.join(', ')} required`);
    }

    // Security check - ensure we're not using dev config in production
    if (firebaseConfig.projectId?.includes('demo') ||
        firebaseConfig.projectId?.includes('test') ||
        firebaseConfig.authDomain?.includes('localhost')) {
      throw new Error('Development Firebase configuration detected in production!');
    }
  }
}

/**
 * Initialize Firebase App lazily
 */
function initApp(): FirebaseApp {
  if (_app) return _app;

  validateFirebaseConfig();

  if (!getApps().length) {
    _app = initializeApp(firebaseConfig);
  } else {
    _app = getApp();
  }

  return _app;
}

/**
 * Initialize Auth lazily
 */
function initAuth(): Auth {
  if (_auth) return _auth;

  const app = initApp();
  _auth = getAuth(app);

  // Set persistence for web
  if (typeof window !== 'undefined') {
    setPersistence(_auth, browserLocalPersistence).catch(() => {
      // Persistence setting failed - auth will still work with session persistence
    });
  }

  connectEmulators();
  return _auth;
}

/**
 * Initialize Firestore lazily
 */
function initDb(): Firestore {
  if (_db) return _db;

  const app = initApp();

  // Try to get existing Firestore instance first
  try {
    _db = getFirestore(app);
  } catch {
    // If no instance exists, initialize with settings
    _db = initializeFirestore(app, {
      experimentalForceLongPolling: false,
      cacheSizeBytes: 50 * 1024 * 1024, // 50MB cache
    });
  }

  // Enable offline persistence for web
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
    enableIndexedDbPersistence(_db, {
      forceOwnership: false
    }).catch(() => {
      // Persistence may fail due to multiple tabs or unsupported browser
    });
  }

  connectEmulators();
  return _db;
}

/**
 * Initialize Storage lazily
 */
function initStorage(): FirebaseStorage {
  if (_storage) return _storage;

  const app = initApp();
  _storage = getStorage(app);

  connectEmulators();
  return _storage;
}

/**
 * Initialize Analytics lazily (client-side only)
 */
async function initAnalytics(): Promise<Analytics | undefined> {
  if (_analytics) return _analytics;

  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    const supported = await isSupported();
    if (supported) {
      const app = initApp();
      _analytics = getAnalytics(app);
    }
  }

  return _analytics;
}

/**
 * Initialize Firebase AI lazily
 */
function initAI(): ReturnType<typeof getAI> {
  if (_ai) return _ai;

  const app = initApp();
  _ai = getAI(app, { backend: new GoogleAIBackend() });

  return _ai;
}

/**
 * Connect to emulators if enabled
 */
function connectEmulators(): void {
  if (_emulatorsConnected) return;
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR !== 'true') return;

  _emulatorsConnected = true;
  const EMULATOR_HOST = process.env.NEXT_PUBLIC_EMULATOR_HOST || 'localhost';

  // Connect Auth emulator
  if (_auth && !((_auth as unknown) as { emulatorConfig?: unknown }).emulatorConfig) {
    connectAuthEmulator(_auth, `http://${EMULATOR_HOST}:9099`, { disableWarnings: true });
  }

  // Connect Firestore emulator
  if (_db && !((_db as unknown) as { _settings?: { host?: string } })._settings?.host?.includes('localhost')) {
    connectFirestoreEmulator(_db, EMULATOR_HOST, 8080);
  }

  // Connect Storage emulator
  if (_storage && !((_storage as unknown) as { _host?: string })._host?.includes('localhost')) {
    connectStorageEmulator(_storage, EMULATOR_HOST, 9199);
  }
}

// Campus validation helper
export const validateCampusAccess = (userCampusId: string, requestedCampusId: string): boolean => {
  if (!userCampusId || !requestedCampusId) {
    return false;
  }
  return userCampusId === requestedCampusId;
};

// Rate limiting helper (in-memory for now, use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean => {
  const now = Date.now();
  const limit = rateLimitMap.get(identifier);

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }

  if (limit.count >= maxRequests) {
    return false;
  }

  limit.count++;
  return true;
};

// Clean up old rate limit entries periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, 60000); // Clean up every minute
}

// Lazy getters that maintain backward compatibility
// These will initialize on first access

/** Firebase App instance - initializes lazily on first access */
export const app: FirebaseApp = new Proxy({} as FirebaseApp, {
  get(_target, prop) {
    const realApp = initApp();
    return (realApp as unknown as Record<string | symbol, unknown>)[prop];
  }
});

/** Firebase Auth instance - initializes lazily on first access */
export const auth: Auth = new Proxy({} as Auth, {
  get(_target, prop) {
    const realAuth = initAuth();
    return (realAuth as unknown as Record<string | symbol, unknown>)[prop];
  }
});

/** Firestore instance - initializes lazily on first access */
export const db: Firestore = new Proxy({} as Firestore, {
  get(_target, prop) {
    const realDb = initDb();
    return (realDb as unknown as Record<string | symbol, unknown>)[prop];
  }
});

/** Firebase Storage instance - initializes lazily on first access */
export const storage: FirebaseStorage = new Proxy({} as FirebaseStorage, {
  get(_target, prop) {
    const realStorage = initStorage();
    return (realStorage as unknown as Record<string | symbol, unknown>)[prop];
  }
});

/** Analytics instance - may be undefined if not supported */
export { _analytics as analytics };

/** Firebase AI instance - initializes lazily on first access */
export const ai = new Proxy({} as ReturnType<typeof getAI>, {
  get(_target, prop) {
    const realAI = initAI();
    return (realAI as unknown as Record<string | symbol, unknown>)[prop];
  }
});

export { getGenerativeModel, Schema };

// Type exports
export type { FirebaseApp, Auth, Firestore, FirebaseStorage, Analytics };
export { GoogleAIBackend } from 'firebase/ai';

// Direct initialization functions for cases where Proxy doesn't work well
export function getFirebaseApp(): FirebaseApp {
  return initApp();
}

export function getFirebaseAuth(): Auth {
  return initAuth();
}

export function getFirebaseDb(): Firestore {
  return initDb();
}

export function getFirebaseStorage(): FirebaseStorage {
  return initStorage();
}

export function getFirebaseAI(): ReturnType<typeof getAI> {
  return initAI();
}
