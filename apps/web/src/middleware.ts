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

// Simple in-memory rate limiting for edge runtime
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

// Routes that require authentication (page routes)
const PROTECTED_ROUTES = [
  '/feed',
  '/profile',
  '/spaces',
  '/tools',
  '/events',
  '/settings',
  '/connections',
  '/claim',
  '/create',
  '/calendar',
  '/notifications',
];

// Routes that are always public
const PUBLIC_ROUTES = [
  '/',
  '/enter',         // New unified entry flow
  '/schools',
  '/about',
  '/legal',         // Legal pages (/legal/privacy, /legal/terms, etc.)
  '/s',             // Short space URLs
  '/u',             // Short profile URLs
  '/spaces/browse', // Guest-accessible discovery
  '/tools',         // HiveLab landing (view-only for guests)
];

// Admin-only routes
const ADMIN_ROUTES = ['/admin'];

// Route redirects (replacing deleted client-side redirect pages)
const ROUTE_REDIRECTS: Record<string, string> = {
  // Alias routes
  '/browse': '/spaces/browse',
  '/build': '/tools/create',
  // Settings section shortcuts
  '/settings/privacy': '/settings?section=privacy',
  '/settings/security': '/settings?section=account',
  '/settings/profile': '/settings?section=profile',
  '/settings/account': '/settings?section=account',
  '/settings/notifications': '/settings?section=notifications',
  // Legacy routes
  '/privacy': '/legal/privacy',
  '/terms': '/legal/terms',
};

// Routes that require completed onboarding
const ONBOARDING_REQUIRED_ROUTES = [
  '/feed',
  '/profile',
  '/spaces',
  '/tools',
  '/events',
];

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
    // New window
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

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(route => pathname.startsWith(route));
}

function requiresOnboarding(pathname: string): boolean {
  return ONBOARDING_REQUIRED_ROUTES.some(route => pathname.startsWith(route));
}

interface SessionPayload {
  userId: string;
  email: string;
  campusId: string;
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
      typeof payload.email === 'string' &&
      typeof payload.campusId === 'string'
    ) {
      return {
        userId: payload.userId,
        email: payload.email,
        campusId: payload.campusId,
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

  // === API ROUTES: Rate limiting only ===
  if (pathname.startsWith('/api/')) {
    // Skip health check endpoints
    if (pathname === '/api/health' || pathname === '/api/ping') {
      return NextResponse.next();
    }

    const clientId = getClientIdentifier(request);
    const config = isSensitiveEndpoint(pathname) ? SENSITIVE_RATE_LIMIT : GLOBAL_RATE_LIMIT;
    const result = checkRateLimit(clientId, config);

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);

      return new NextResponse(
        JSON.stringify({
          success: false,
          error: {
            message: 'Too many requests. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
          },
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
  const redirectTarget = ROUTE_REDIRECTS[pathname];
  if (redirectTarget) {
    return NextResponse.redirect(new URL(redirectTarget, request.url));
  }

  // Public routes - no auth required
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Get session cookie
  const sessionCookie = request.cookies.get('hive_session')?.value;

  // Protected route without session - redirect to entry flow
  if (isProtectedRoute(pathname) && !sessionCookie) {
    const enterUrl = new URL('/enter', request.url);
    enterUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(enterUrl);
  }

  // If we have a session, verify it for admin and onboarding routes
  if (sessionCookie) {
    const session = await verifySessionAtEdge(sessionCookie);

    // Admin routes require admin flag
    if (isAdminRoute(pathname)) {
      if (!session || !session.isAdmin) {
        // Not admin - redirect to home
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    // Check onboarding status for protected routes
    if (session && requiresOnboarding(pathname) && !session.onboardingCompleted) {
      // User hasn't completed entry - redirect to /enter?state=identity
      const enterUrl = new URL('/enter', request.url);
      enterUrl.searchParams.set('state', 'identity');
      enterUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(enterUrl);
    }

    // Reverse guard: if user visits /enter with identity state but already completed, redirect to spaces
    if (session && pathname === '/enter' && session.onboardingCompleted) {
      const stateParam = request.nextUrl.searchParams.get('state');
      if (stateParam === 'identity') {
        return NextResponse.redirect(new URL('/spaces/browse', request.url));
      }
    }

    // Legacy /onboarding redirect (in case URL redirect didn't catch it)
    if (session && pathname === '/onboarding' && session.onboardingCompleted) {
      return NextResponse.redirect(new URL('/spaces/browse', request.url));
    }
  }

  return NextResponse.next();
}

// Configure which paths the middleware applies to
export const config = {
  matcher: [
    // API routes - rate limiting
    '/api/:path*',
    // Page routes - auth protection
    '/feed/:path*',
    '/profile/:path*',
    '/spaces/:path*',
    '/tools/:path*',
    '/events/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/connections/:path*',
    '/claim/:path*',
    '/create/:path*',
    '/calendar/:path*',
    '/notifications/:path*',
    // Entry flow - unified auth
    '/enter',
    '/enter/:path*',
    // Redirects (handled by middleware)
    '/browse',
    '/build',
    '/privacy',
    '/terms',
    // Campus routes
    '/campus',
    '/campus/:path*',
  ],
};
