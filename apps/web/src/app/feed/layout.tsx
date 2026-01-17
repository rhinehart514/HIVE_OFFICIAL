import { cookies } from "next/headers";
import { isFeedEnabled, type UserFeatureContext } from "@/lib/feature-flags";
import { verifySession } from "@/lib/session";
import FeedComingSoon from "./coming-soon";

/**
 * Feed Layout - Gates feed behind FEED_V1 feature flag
 *
 * Feed can be enabled via:
 * 1. NEXT_PUBLIC_FEED_ENABLED=true env var
 * 2. Development mode (NODE_ENV=development)
 * 3. Firestore feature flag (feed_v1)
 *
 * When disabled, shows Coming Soon page with explanation.
 */
export default async function FeedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check env override first - allows quick enable without Firestore
  const envEnabled = process.env.NEXT_PUBLIC_FEED_ENABLED === 'true';
  const isDevelopment = process.env.NODE_ENV === 'development';

  // If explicitly enabled via env or in development, skip Firestore check
  if (envEnabled || isDevelopment) {
    return <>{children}</>;
  }

  // Build user context from session for Firestore flag check
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("hive_session");

  let userContext: UserFeatureContext = {
    userId: "anonymous",
    userRole: "guest",
  };

  if (sessionCookie?.value) {
    try {
      // The session cookie is a JWT, not JSON - verify it properly
      const session = await verifySession(sessionCookie.value);
      if (session) {
        userContext = {
          userId: session.userId || "anonymous",
          userRole: session.isAdmin ? "admin" : "member",
          schoolId: session.campusId || "ub-buffalo",
        };
      }
    } catch {
      // Keep default anonymous context
    }
  }

  // Check Firestore feature flag
  const feedEnabled = await isFeedEnabled(userContext);

  if (!feedEnabled) {
    // Feed is disabled - show Coming Soon page with explanation
    return <FeedComingSoon />;
  }

  return <>{children}</>;
}
