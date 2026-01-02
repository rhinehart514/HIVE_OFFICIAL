/**
 * Firebase Admin SDK for server-side operations (Admin Dashboard)
 *
 * This module initializes Firebase Admin with proper credentials
 * based on the environment (development, staging, production).
 */

import * as admin from "firebase-admin";

// Environment detection
function getCurrentEnvironment(): "development" | "staging" | "production" {
  const env = (process.env.NODE_ENV as string) || "development";
  const vercelEnv = process.env.VERCEL_ENV;

  if (vercelEnv === "production") return "production";
  if (vercelEnv === "preview") return "staging";
  if (env === "production") return "production";
  if (env === "staging") return "staging";

  return "development";
}

const currentEnvironment = getCurrentEnvironment();

let firebaseInitialized = false;
let dbAdmin: admin.firestore.Firestore;
let authAdmin: admin.auth.Auth;

try {
  if (!admin.apps.length) {
    let credential: admin.credential.Credential | undefined;

    // Try different credential formats
    if (process.env.FIREBASE_PRIVATE_KEY_BASE64 && process.env.FIREBASE_CLIENT_EMAIL) {
      // Format 1: Base64 encoded private key (Recommended for Vercel)
      try {
        const decodedKey = Buffer.from(
          process.env.FIREBASE_PRIVATE_KEY_BASE64,
          "base64"
        ).toString("utf-8");
        credential = admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID || "hive-dev-2025",
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: decodedKey,
        });
      } catch {
        console.error("Failed to decode base64 private key");
      }
    } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      // Format 2: Individual environment variables (raw key with \n escapes)
      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || "hive-dev-2025",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      });
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Format 3: Base64 encoded service account (existing pattern)
      try {
        const serviceAccountJson = JSON.parse(
          Buffer.from(
            process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
            "base64"
          ).toString("ascii")
        ) as admin.ServiceAccount;
        credential = admin.credential.cert(serviceAccountJson);
      } catch {
        console.warn("Failed to parse base64 service account");
      }
    } else {
      // Format 4: Application default credentials (development fallback)
      try {
        credential = admin.credential.applicationDefault();
      } catch {
        console.warn(
          `⚠️ No Firebase Admin credentials available for ${currentEnvironment}`
        );
      }
    }

    if (credential) {
      admin.initializeApp({
        credential: credential,
        projectId: process.env.FIREBASE_PROJECT_ID || "hive-dev-2025",
      });

      dbAdmin = admin.firestore();
      authAdmin = admin.auth();
      firebaseInitialized = true;
    } else {
      throw new Error("No valid Firebase credentials found");
    }
  } else {
    // App already initialized
    dbAdmin = admin.firestore();
    authAdmin = admin.auth();
    firebaseInitialized = true;
  }
} catch {
  // Create mock instances for development when credentials are missing
  dbAdmin = {} as admin.firestore.Firestore;
  authAdmin = {
    verifyIdToken: async () => {
      throw new Error(`Firebase Auth not configured for ${currentEnvironment}.`);
    },
  } as unknown as admin.auth.Auth;
}

export { dbAdmin, authAdmin };
export const db = dbAdmin;
export const auth = authAdmin;
export const isFirebaseConfigured = firebaseInitialized;
