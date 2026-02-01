/**
 * Firebase Admin SDK for server-side operations
 *
 * This module initializes Firebase Admin with proper credentials
 * based on the environment (development, staging, production).
 */

import * as admin from "firebase-admin";
import { logger } from "./logger";

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
        logger.info("Firebase Admin initialized with base64 private key", {
          component: "firebase-admin",
          metadata: { environment: currentEnvironment },
        });
      } catch (error) {
        logger.error("Failed to decode base64 private key", { component: "firebase-admin" }, error as Error);
      }
    } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      // Format 2: Individual environment variables (raw key with \n escapes)
      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || "hive-dev-2025",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      });
      logger.info("Firebase Admin initialized with individual env vars", {
        component: "firebase-admin",
        metadata: { environment: currentEnvironment },
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
        logger.info("Firebase Admin initialized with base64 service account", {
          component: "firebase-admin",
          metadata: { environment: currentEnvironment },
        });
      } catch (error) {
        logger.warn("Failed to parse base64 service account", {
          component: "firebase-admin",
          metadata: { error: String(error) },
        });
      }
    } else {
      // Format 4: Application default credentials (development fallback)
      try {
        credential = admin.credential.applicationDefault();
        logger.info("Firebase Admin initialized with application default credentials", {
          component: "firebase-admin",
          metadata: { environment: currentEnvironment },
        });
      } catch (credError) {
        logger.warn("No Firebase Admin credentials available", {
          component: "firebase-admin",
          metadata: { environment: currentEnvironment },
        });
        throw credError;
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

      logger.info("Firebase Admin initialized successfully", {
        component: "firebase-admin",
        metadata: { environment: currentEnvironment },
      });
    } else {
      throw new Error("No valid Firebase credentials found");
    }
  } else {
    // App already initialized
    dbAdmin = admin.firestore();
    authAdmin = admin.auth();
    firebaseInitialized = true;
    logger.info("Firebase Admin using existing app", {
      component: "firebase-admin",
      metadata: { environment: currentEnvironment },
    });
  }
} catch (error) {
  logger.warn("Firebase Admin initialization failed", {
    component: "firebase-admin",
    metadata: { environment: currentEnvironment, error: String(error) },
  });

  // Create mock instances for development - throws on use to surface missing config
  dbAdmin = {
    collection: (path: string) => ({
      get: async () => {
        throw new Error(
          `Firebase Admin not configured for ${currentEnvironment}. Add credentials to environment variables.`
        );
      },
      add: async () => {
        throw new Error(
          `Firebase Admin not configured for ${currentEnvironment}.`
        );
      },
      doc: (id: string) => ({
        get: async () => {
          throw new Error(
            `Firebase Admin not configured for ${currentEnvironment}.`
          );
        },
        set: async () => {
          throw new Error(
            `Firebase Admin not configured for ${currentEnvironment}.`
          );
        },
        update: async () => {
          throw new Error(
            `Firebase Admin not configured for ${currentEnvironment}.`
          );
        },
        delete: async () => {
          throw new Error(
            `Firebase Admin not configured for ${currentEnvironment}.`
          );
        },
      }),
      where: () => ({
        get: async () => {
          throw new Error(
            `Firebase Admin not configured for ${currentEnvironment}.`
          );
        },
        limit: () => ({
          get: async () => {
            throw new Error(
              `Firebase Admin not configured for ${currentEnvironment}.`
            );
          },
        }),
      }),
    }),
  } as unknown as admin.firestore.Firestore;

  authAdmin = {
    verifyIdToken: async () => {
      throw new Error(
        `Firebase Auth not configured for ${currentEnvironment}.`
      );
    },
    createCustomToken: async () => {
      throw new Error(
        `Firebase Auth not configured for ${currentEnvironment}.`
      );
    },
    getUser: async () => {
      throw new Error(
        `Firebase Auth not configured for ${currentEnvironment}.`
      );
    },
  } as unknown as admin.auth.Auth;
}

export { dbAdmin, authAdmin };

// Re-export for compatibility
export const db: admin.firestore.Firestore = dbAdmin;
export const auth: admin.auth.Auth = authAdmin;
export const isFirebaseConfigured = firebaseInitialized;

// Function exports for compatibility
export const getFirestoreAdmin = (): admin.firestore.Firestore => dbAdmin;
export const getAuthAdmin = (): admin.auth.Auth => authAdmin;

// Environment info for debugging
export const environmentInfo = {
  environment: currentEnvironment,
  firebaseConfigured: firebaseInitialized,
  projectId: process.env.FIREBASE_PROJECT_ID || "hive-dev-2025",
  credentialSource: firebaseInitialized
    ? process.env.FIREBASE_PRIVATE_KEY
      ? "individual_vars"
      : process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? "base64_key"
        : "application_default"
    : "none",
};
