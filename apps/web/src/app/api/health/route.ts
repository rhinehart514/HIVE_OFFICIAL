/**
 * Enhanced Health Check API
 *
 * Returns detailed health status including:
 * - Firebase Firestore connectivity
 * - Firebase Auth status
 * - Environment configuration
 * - Service uptime
 *
 * @author HIVE Platform Team
 * @version 2.0.0
 */

import { NextResponse } from "next/server";
import { currentEnvironment, isFirebaseAdminConfigured } from "@/lib/env";
import { environmentInfo, dbAdmin, authAdmin } from "@/lib/firebase-admin";
import { getRedisRateLimiterHealth } from "@/lib/rate-limiter-redis";
import { redisCache } from "@/lib/cache/redis-client";

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  nodeVersion: string;
  checks: {
    firestore: CheckResult;
    auth: CheckResult;
    config: CheckResult;
    redis: CheckResult;
  };
  details?: {
    firebaseConfigured: boolean;
    environmentInfo: unknown;
    platform: string;
  };
}

interface CheckResult {
  status: 'pass' | 'fail' | 'warn';
  latency?: number;
  message?: string;
}

// Track server start time for uptime calculation
const startTime = Date.now();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const verbose = searchParams.get('verbose') === 'true';

  const timestamp = new Date().toISOString();
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  // Run health checks in parallel
  const [firestoreCheck, authCheck, redisCheck] = await Promise.all([
    checkFirestore(),
    checkAuth(),
    checkRedis(),
  ]);

  const configCheck = checkConfig();

  // Determine overall status
  const checks = { firestore: firestoreCheck, auth: authCheck, config: configCheck, redis: redisCheck };
  const allPassed = Object.values(checks).every(c => c.status === 'pass');
  const anyFailed = Object.values(checks).some(c => c.status === 'fail');

  const status: HealthStatus['status'] = allPassed
    ? 'healthy'
    : anyFailed
    ? 'unhealthy'
    : 'degraded';

  const response: HealthStatus = {
    status,
    timestamp,
    uptime,
    environment: currentEnvironment,
    version: process.env.npm_package_version || '1.0.0',
    nodeVersion: process.version,
    checks,
  };

  // Include detailed info in verbose mode
  if (verbose) {
    response.details = {
      firebaseConfigured: isFirebaseAdminConfigured,
      environmentInfo,
      platform: process.platform,
    };
  }

  // Return appropriate HTTP status
  const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;

  return NextResponse.json(response, { status: httpStatus });
}

/**
 * Check Firestore connectivity by reading a test document
 */
async function checkFirestore(): Promise<CheckResult> {
  if (!isFirebaseAdminConfigured) {
    return {
      status: 'fail',
      message: 'Firebase Admin not configured',
    };
  }

  const start = Date.now();

  try {
    // Try to read from featureFlags collection (always exists, lightweight)
    // This validates both connectivity and permissions
    const snapshot = await dbAdmin
      .collection('featureFlags')
      .limit(1)
      .get();

    const latency = Date.now() - start;

    // Warn if latency is high (>500ms)
    if (latency > 500) {
      return {
        status: 'warn',
        latency,
        message: `High latency: ${latency}ms`,
      };
    }

    return {
      status: 'pass',
      latency,
      message: `Connected, ${snapshot.size} doc(s) returned`,
    };
  } catch (error) {
    return {
      status: 'fail',
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check Firebase Auth service status
 */
async function checkAuth(): Promise<CheckResult> {
  if (!isFirebaseAdminConfigured) {
    return {
      status: 'fail',
      message: 'Firebase Admin not configured',
    };
  }

  const start = Date.now();

  try {
    // Try to list users (limit 1) to verify Auth connectivity
    // This validates the Auth service is reachable
    const listResult = await authAdmin.listUsers(1);

    const latency = Date.now() - start;

    return {
      status: 'pass',
      latency,
      message: `Auth service connected (${listResult.users.length} user sampled)`,
    };
  } catch (error) {
    const latency = Date.now() - start;

    // Some errors are expected (e.g., permission denied) but still indicate connectivity
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Permission errors mean Auth is reachable but we lack permissions
    if (errorMessage.includes('PERMISSION_DENIED')) {
      return {
        status: 'warn',
        latency,
        message: 'Auth service reachable but permission denied for user list',
      };
    }

    return {
      status: 'fail',
      latency,
      message: errorMessage,
    };
  }
}

/**
 * Check configuration completeness
 */
function checkConfig(): CheckResult {
  // Check for Firebase credentials - accept multiple formats
  const hasFirebasePrivateKey = !!(
    process.env.FIREBASE_PRIVATE_KEY ||
    process.env.FIREBASE_PRIVATE_KEY_BASE64 ||
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  );

  const basicRequired = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL'];
  const missingBasic = basicRequired.filter(v => !process.env[v]);

  if (missingBasic.length > 0 || !hasFirebasePrivateKey) {
    const missing = [...missingBasic];
    if (!hasFirebasePrivateKey) {
      missing.push('FIREBASE_PRIVATE_KEY (or FIREBASE_PRIVATE_KEY_BASE64 or FIREBASE_SERVICE_ACCOUNT_KEY)');
    }
    return {
      status: 'fail',
      message: `Missing env vars: ${missing.join(', ')}`,
    };
  }

  // Check for optional but recommended vars
  const recommendedVars = [
    'JWT_SECRET',
    'NEXT_PUBLIC_FIREBASE_API_KEY',
  ];

  const missingRecommended = recommendedVars.filter(v => !process.env[v]);

  if (missingRecommended.length > 0) {
    return {
      status: 'warn',
      message: `Missing recommended vars: ${missingRecommended.join(', ')}`,
    };
  }

  return {
    status: 'pass',
    message: 'All required configuration present',
  };
}

/**
 * Check Redis connectivity (rate limiting + caching)
 */
async function checkRedis(): Promise<CheckResult> {
  const start = Date.now();

  try {
    // Check rate limiter Redis health
    const rateLimiterHealth = await getRedisRateLimiterHealth();

    // Check cache Redis health
    await redisCache.waitForInit();
    const cacheType = redisCache.getConnectionType();
    const upstashConfigured = redisCache.isUpstashConfigured();

    const latency = Date.now() - start;

    // Determine status based on configuration and connectivity
    if (upstashConfigured || rateLimiterHealth.enabled) {
      // Upstash is configured - check if connected
      if (rateLimiterHealth.connected && cacheType === 'upstash') {
        return {
          status: 'pass',
          latency,
          message: `Upstash Redis connected (rate limiter: ${rateLimiterHealth.memoryEntries} fallback entries, cache: ${cacheType})`,
        };
      } else if (rateLimiterHealth.connected) {
        return {
          status: 'warn',
          latency,
          message: `Rate limiter using Upstash, cache using ${cacheType} (${rateLimiterHealth.memoryEntries} memory entries)`,
        };
      } else {
        return {
          status: 'warn',
          latency,
          message: `Upstash configured but using fallback (${rateLimiterHealth.memoryEntries}/${rateLimiterHealth.maxMemoryEntries} memory entries)`,
        };
      }
    }

    // Upstash not configured - using in-memory (acceptable for development)
    return {
      status: 'warn',
      latency,
      message: `Using in-memory rate limiting (Upstash not configured). Set UPSTASH_REDIS_REST_URL for distributed rate limiting.`,
    };
  } catch (error) {
    return {
      status: 'fail',
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : 'Redis health check failed',
    };
  }
}
