/**
 * Admin System Health API
 *
 * GET: Fetch system health metrics and status
 *
 * Monitors Firebase, API endpoints, and background processes.
 */

import { logger } from '@/lib/structured-logger';
import { withAdminAuthAndErrors, getCampusId, type AuthenticatedRequest } from '@/lib/middleware';
import { HttpStatus } from '@/lib/api-response-types';
import { dbAdmin } from '@/lib/firebase-admin';
import { withCache } from '../../../../../lib/cache-headers';

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  lastChecked: string;
  message?: string;
}

interface SystemMetrics {
  apiRequests24h: number;
  errorRate: number;
  avgLatency: number;
  activeConnections: number;
}

interface HealthData {
  overallStatus: 'healthy' | 'degraded' | 'down';
  services: ServiceHealth[];
  metrics: SystemMetrics;
  uptime: number;
  lastIncident?: {
    type: string;
    message: string;
    timestamp: string;
    resolved: boolean;
  };
}

async function checkFirestore(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    await dbAdmin.collection('profiles').limit(1).get();
    return {
      name: 'Firestore',
      status: 'healthy',
      latency: Date.now() - start,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'Firestore',
      status: 'down',
      latency: Date.now() - start,
      lastChecked: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

async function checkFirestoreWrite(campusId: string): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const testRef = dbAdmin.collection('_healthCheck').doc('test');
    await testRef.set({ timestamp: new Date(), campus: campusId });
    await testRef.delete();
    return {
      name: 'Firestore Write',
      status: 'healthy',
      latency: Date.now() - start,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'Firestore Write',
      status: 'down',
      latency: Date.now() - start,
      lastChecked: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Write failed',
    };
  }
}

async function checkAuthService(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    // Check by verifying we can list users
    const { getAuth } = await import('firebase-admin/auth');
    await getAuth().listUsers(1);
    return {
      name: 'Firebase Auth',
      status: 'healthy',
      latency: Date.now() - start,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'Firebase Auth',
      status: 'degraded',
      latency: Date.now() - start,
      lastChecked: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Auth check failed',
    };
  }
}

async function checkStorageService(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const { getStorage } = await import('firebase-admin/storage');
    const bucket = getStorage().bucket();
    await bucket.getMetadata();
    return {
      name: 'Cloud Storage',
      status: 'healthy',
      latency: Date.now() - start,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'Cloud Storage',
      status: 'degraded',
      latency: Date.now() - start,
      lastChecked: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Storage check failed',
    };
  }
}

async function getSystemMetrics(): Promise<SystemMetrics> {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // Check admin activity logs for request count
    const activitySnapshot = await dbAdmin
      .collection('adminActivityLogs')
      .where('timestamp', '>=', oneDayAgo)
      .count()
      .get();

    const apiRequests24h = activitySnapshot.data().count || 0;

    // Mock metrics (would come from real monitoring in production)
    return {
      apiRequests24h,
      errorRate: 0.12, // 0.12%
      avgLatency: 145, // ms
      activeConnections: Math.floor(Math.random() * 50) + 10,
    };
  } catch {
    return {
      apiRequests24h: 0,
      errorRate: 0,
      avgLatency: 0,
      activeConnections: 0,
    };
  }
}

/**
 * GET /api/admin/system/health
 * Fetch system health status
 */
const _GET = withAdminAuthAndErrors(async (request, _context, respond) => {
  const campusId = getCampusId(request as AuthenticatedRequest);

  try {
    // Run all health checks in parallel
    const [firestore, firestoreWrite, auth, storage, metrics] = await Promise.all([
      checkFirestore(),
      checkFirestoreWrite(campusId),
      checkAuthService(),
      checkStorageService(),
      getSystemMetrics(),
    ]);

    const services = [firestore, firestoreWrite, auth, storage];

    // Determine overall status
    const downServices = services.filter(s => s.status === 'down').length;
    const degradedServices = services.filter(s => s.status === 'degraded').length;

    let overallStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
    if (downServices > 0) {
      overallStatus = 'down';
    } else if (degradedServices > 0) {
      overallStatus = 'degraded';
    }

    // Calculate uptime (mock - would track actual process uptime)
    const uptime = process.uptime();

    const healthData: HealthData = {
      overallStatus,
      services,
      metrics,
      uptime: Math.floor(uptime),
    };

    logger.info('System health checked', {
      overallStatus,
      servicesChecked: services.length,
    });

    return respond.success({ health: healthData });
  } catch (error) {
    logger.error('Failed to check system health', {
      error: error instanceof Error ? error.message : String(error),
    });
    return respond.error('Failed to check system health', 'INTERNAL_ERROR', {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
});

export const GET = withCache(_GET, 'PRIVATE');
