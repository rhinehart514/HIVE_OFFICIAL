// Firebase client utilities
import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirebaseConfig } from "./env";

// Get the Firebase configuration for the current environment
const firebaseConfig = getFirebaseConfig();

// Initialize Firebase app (only once)
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Campus access validation
export const validateCampusAccess = (userCampusId: string, requestedCampusId: string): boolean => {
  if (!userCampusId || !requestedCampusId) {
    return false;
  }
  if (process.env.NODE_ENV === 'production') {
    return userCampusId === requestedCampusId;
  }
  return userCampusId === requestedCampusId;
};

// Initialize Analytics (only in browser and if supported)
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// Connect to emulators only if explicitly enabled
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' && typeof window !== "undefined") {
  const EMULATOR_HOST = process.env.NEXT_PUBLIC_EMULATOR_HOST || 'localhost';
  try {
    // Only connect to emulators if not already connected
    const authConfig = (auth as any).config;
    const dbConfig = (db as any)._delegate?._databaseId;

    if (!authConfig?.emulator) {
      connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`, {
        disableWarnings: true,
      });
    }
    if (dbConfig && !dbConfig.projectId.includes("localhost")) {
      connectFirestoreEmulator(db, EMULATOR_HOST, 8080);
    }
  } catch (error) {
    // Emulators might not be running, that's ok
  }
}

export { app };
export default app;
