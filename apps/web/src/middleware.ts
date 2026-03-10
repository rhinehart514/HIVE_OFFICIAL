/**
 * HIVE Global Middleware
 *
 * This middleware runs on every request at the edge.
 * It provides:
 * - Global rate limiting for API routes
 * - Route protection for authenticated pages
 * - Onboarding redirect for incomplete users
 * - Admin route protection
 *
 * Note: This is complementary to the route-level auth in lib/middleware.
 * Edge middleware uses a simpler approach suitable for edge runtime.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// NOTE: Per-instance on Vercel Edge — not globally enforced. Migrate to Upstash Redis for real rate limiting.
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const GLOBAL_RATE_LIMIT = {
  maxRequests: 300,      // Max requests per window
  windowMs: 60 * 1000,   // 1 minute window
};

// More restrictive limits for sensitive endpoints
const SENSITIVE_ENDPOINTS = [
  '/api/auth/',
  '/api/admin/',
  '/api/tools/generate',
  '/api/tools/execute',
];

const SENSITIVE_RATE_LIMIT = {
  maxRequests: 30,
  windowMs: 60 * 1000,
};

// Routes that are always public (no auth required)
// SECURITY: Keep this list minimal - everything else requires authentication
const PUBLIC_ROUTES = [
  '/',              // Landing page
  '/enter',         // Entry flow (creates session during verification)
  '/about',         // Marketing/info page
  '/legal',         // Legal pages (/legal/privacy, /legal/terms, etc.)
  '/t',             // Standalone tool pages (shareable links for published tools)
  '/verify',        // Public leadership record pages
];

// Admin-only routes
const ADMIN_ROUTES = ['/admin', '/design-system'];

// Route redirects (replacing deleted client-side redirect pages)
// These are PERMANENT (301) redirects per IA_INVARIANTS.md
// Auth/session redirects elsewhere use temporary (307) redirects
export const ROUTE_REDIRECTS: Record<string, string> = {
  // Alias routes (/spaces handled by catch-all middleware)
  '/browse': '/discover',
  '/explore': '/discover',
  // Dead route consolidation
  '/home': '/discover',
  '/feed': '/discover',
  '/calendar': '/discover?tab=events',
  '/elements': '/build',
  '/schools': '/enter',
  '/templates': '/build/templates',
  // Lab → Build migration
  '/lab': '/build',
  // Campus → Build/Browse migration
  '/campus': '/build/browse',
  // Settings — /settings is now a redirect page, these go to /me/settings sections
  '/settings/privacy': '/me/settings?section=privacy',
  '/settings/security': '/me/settings?section=account',
  '/settings/profile': '/me/settings?section=profile',
  '/settings/account': '/me/settings?section=account',
  '/settings/notifications': '/me/settings?section=notifications',
  // Legacy routes
  '/privacy': '/legal/privacy',
  '/terms': '/legal/terms',
  // IA Consolidation: Convert pages to modals
  // /spaces/* routes handled by catch-all middleware above
  '/people': '/discover?tab=people',
  '/leaders': '/discover',
  // Profile redirects — old /profile/* routes consolidated
  '/you': '/me',
  '/profile': '/me',
  '/profile/edit': '/me/edit',
  '/profile/settings': '/me/settings',
  '/profile/calendar': '/me',
  '/profile/connections': '/me',
  // Killed sub-routes under /me
  '/me/connections': '/me',
  '/me/calendar': '/me',
  '/me/reports': '/me/settings',
  // Killed standalone notifications route (in-app panel)
  '/notifications/settings': '/me/settings?section=notifications',
  // HiveLab → Build consolidation
  '/hivelab': '/build',
  // Dead lab routes — creation lives on /lab now (handled above with query param preservation)
  // '/lab/new' and '/lab/create' are redirected by the special handler above
};

function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown';

  // For authenticated users, we could use a session ID if available
  const sessionCookie = request.cookies.get('hive_session');
  if (sessionCookie?.value) {
    return `session:${sessionCookie.value.slice(0, 16)}`; // Use first 16 chars as identifier
  }

  return `ip:${ip}`;
}

function checkRateLimit(clientId: string, config: typeof GLOBAL_RATE_LIMIT): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const record = rateLimitStore.get(clientId);

  // Clean up expired records periodically (every 100 checks)
  if (Math.random() < 0.01) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }

  if (!record || now > record.resetTime) {
    // New window — cap map size to prevent unbounded growth in edge memory
    if (rateLimitStore.size > 10_000) {
      const toDelete = [...rateLimitStore.keys()].slice(0, 2_000);
      for (const k of toDelete) rateLimitStore.delete(k);
    }
    const resetTime = now + config.windowMs;
    rateLimitStore.set(clientId, { count: 1, resetTime });
    return { allowed: true, remaining: config.maxRequests - 1, resetTime };
  }

  if (record.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

function isSensitiveEndpoint(pathname: string): boolean {
  return SENSITIVE_ENDPOINTS.some(endpoint => pathname.startsWith(endpoint));
}

function isPublicRoute(pathname: string): boolean {
  // Only exact matches or prefix matches for explicitly public routes
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(route => pathname.startsWith(route));
}

interface SessionPayload {
  userId: string;
  email: string;
  campusId?: string; // Optional - users can sign up without campus
  isAdmin?: boolean;
  onboardingCompleted?: boolean;
}

/**
 * Verify session cookie at edge (lightweight check)
 * Full verification happens in API routes via lib/session.ts
 */
async function verifySessionAtEdge(sessionCookie: string): Promise<SessionPayload | null> {
  try {
    const rawSecret = process.env.SESSION_SECRET;
    if (!rawSecret) {
      // In development without SESSION_SECRET, allow through - API routes will handle auth
      return null;
    }

    const secret = new TextEncoder().encode(rawSecret);
    const { payload } = await jwtVerify(sessionCookie, secret);

    if (
      typeof payload.userId === 'string' &&
      typeof payload.email === 'string'
    ) {
      return {
        userId: payload.userId,
        email: payload.email,
        campusId: typeof payload.campusId === 'string' ? payload.campusId : undefined,
        isAdmin: payload.isAdmin === true,
        onboardingCompleted: payload.onboardingCompleted === true,
      };
    }
    return null;
  } catch {
    // Session invalid or expired
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // === API ROUTES: CORS + Rate limiting ===
  if (pathname.startsWith('/api/')) {
    // Skip health check endpoints
    if (pathname === '/api/health' || pathname === '/api/ping') {
      return NextResponse.next();
    }

    // CORS for admin API routes — allow admin dashboard cross-origin calls
    const ADMIN_CORS_ORIGINS = (process.env.ADMIN_ALLOWED_ORIGINS || 'https://admin.hive.college')
      .split(',')
      .map(o => o.trim());
    const requestOrigin = request.headers.get('origin');
    const isAdminApiRoute = pathname.startsWith('/api/admin/');
    const isAllowedAdminOrigin = requestOrigin && ADMIN_CORS_ORIGINS.includes(requestOrigin);

    // Handle CORS preflight for admin API routes
    if (isAdminApiRoute && request.method === 'OPTIONS' && isAllowedAdminOrigin) {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': requestOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const clientId = getClientIdentifier(request);
    const config = isSensitiveEndpoint(pathname) ? SENSITIVE_RATE_LIMIT : GLOBAL_RATE_LIMIT;
    const result = checkRateLimit(clientId, config);

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);

      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          meta: {
            retryAfter,
          },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(config.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(result.resetTime),
            'Retry-After': String(retryAfter),
          },
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(config.maxRequests));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(result.resetTime));

    // Add CORS headers for admin API responses
    if (isAdminApiRoute && isAllowedAdminOrigin) {
      response.headers.set('Access-Control-Allow-Origin', requestOrigin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return response;
  }

  // === PAGE ROUTES: Authentication & Authorization ===

  // Skip static assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // Files with extensions
  ) {
    return NextResponse.next();
  }

  // Handle route redirects (from deleted client-side redirect pages)
  // These are PERMANENT (301) per IA_INVARIANTS.md - canonical route changes

  // Handle /lab/new and /lab/create -> /build and preserve query params
  if (pathname === '/lab/new' || pathname === '/lab/create') {
    const target = new URL('/build', request.url);
    target.search = request.nextUrl.search;
    return NextResponse.redirect(target, 301);
  }

  // Handle /lab/[toolId] -> /build/[toolId]
  const labToolMatch = pathname.match(/^\/lab\/([^/]+)(\/.*)?$/);
  if (labToolMatch && labToolMatch[1] !== 'new' && labToolMatch[1] !== 'create' && labToolMatch[1] !== 'templates') {
    const rest = labToolMatch[2] || '';
    const target = new URL(`/build/${labToolMatch[1]}${rest}`, request.url);
    target.search = request.nextUrl.search;
    return NextResponse.redirect(target, 301);
  }

  // Handle /campus/[slug] -> /build/browse/[slug]
  const campusSlugMatch = pathname.match(/^\/campus\/([^/]+)$/);
  if (campusSlugMatch) {
    const target = new URL(`/build/browse/${campusSlugMatch[1]}`, request.url);
    target.search = request.nextUrl.search;
    return NextResponse.redirect(target, 301);
  }

  // Handle /explore -> /discover and preserve query params
  if (pathname === '/explore') {
    const target = new URL('/discover', request.url);
    target.search = request.nextUrl.search;
    return NextResponse.redirect(target, 301);
  }

  // All /spaces/* routes are dead — redirect to /discover
  if (pathname === '/spaces' || pathname.startsWith('/spaces/')) {
    return NextResponse.redirect(new URL('/discover', request.url), 301);
  }

  const redirectTarget = ROUTE_REDIRECTS[pathname];
  if (redirectTarget) {
    return NextResponse.redirect(new URL(redirectTarget, request.url), 301);
  }

  // Handle /profile/[id] → /u/[id] (old profile routes)
  const profileMatch = pathname.match(/^\/profile\/([^/]+)$/);
  if (profileMatch && profileMatch[1] !== 'edit' && profileMatch[1] !== 'settings' && profileMatch[1] !== 'calendar' && profileMatch[1] !== 'connections') {
    return NextResponse.redirect(new URL(`/u/${profileMatch[1]}`, request.url), 301);
  }

  // Handle /hivelab/* → /build
  if (pathname.startsWith('/hivelab')) {
    return NextResponse.redirect(new URL('/build', request.url), 301);
  }

  // Public routes - no auth required (but redirect completed users away from landing/enter)
  if (isPublicRoute(pathname)) {
    // Check if authenticated user is on landing or enter pages
    if (pathname === '/' || pathname === '/enter' || pathname.startsWith('/enter/')) {
      const sessionCookie = request.cookies.get('hive_session')?.value;
      const refreshCookie = request.cookies.get('hive_refresh')?.value;

      if (sessionCookie) {
        const session = await verifySessionAtEdge(sessionCookie);
        if (session?.onboardingCompleted) {
          // Completed user — send them to creation surface (agency-first, not consumption-first)
          const redirectParam = request.nextUrl.searchParams.get('redirect');
          const destination = redirectParam || '/build';
          return NextResponse.redirect(new URL(destination, request.url));
        }
      } else if (refreshCookie) {
        // Access token expired but refresh token exists — user is still "signed in"
        // Redirect to platform; client-side will auto-refresh the access token
        const refreshSession = await verifySessionAtEdge(refreshCookie);
        if (refreshSession?.onboardingCompleted) {
          const redirectParam = request.nextUrl.searchParams.get('redirect');
          const destination = redirectParam || '/build';
          return NextResponse.redirect(new URL(destination, request.url));
        }
      }
    }
    return NextResponse.next();
  }

  // Get session cookie
  const sessionCookie = request.cookies.get('hive_session')?.value;

  // === NO SESSION: Redirect to landing page ===
  if (!sessionCookie) {
    const enterUrl = new URL('/enter', request.url);
    enterUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(enterUrl);
  }

  // === HAS SESSION: Verify and check permissions ===
  const session = await verifySessionAtEdge(sessionCookie);

  // Invalid/expired session — check for refresh token before redirecting
  if (!session) {
    const refreshCookie = request.cookies.get('hive_refresh')?.value;
    if (refreshCookie) {
      // Refresh token exists — let the page load, client-side will auto-refresh
      const refreshSession = await verifySessionAtEdge(refreshCookie);
      if (refreshSession) {
        // Valid refresh token — allow through, client handles the access token refresh
        return NextResponse.next();
      }
    }

    // No valid refresh token either — redirect to enter
    const enterUrl = new URL('/enter', request.url);
    enterUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(enterUrl);
    // Clear invalid session cookie
    response.cookies.delete('hive_session');
    return response;
  }

  // Admin routes require admin flag
  if (isAdminRoute(pathname)) {
    if (!session.isAdmin) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // All other routes require completed onboarding
  if (!session.onboardingCompleted) {
    const enterUrl = new URL('/enter', request.url);
    enterUrl.searchParams.set('state', 'identity');
    enterUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(enterUrl);
  }

  // Legacy /onboarding redirect - PERMANENT (301) canonical route change
  if (pathname === '/onboarding') {
    return NextResponse.redirect(new URL('/build', request.url), 301);
  }

  return NextResponse.next();
}

// Configure which paths the middleware applies to
// SECURITY: Match ALL routes except static files
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
