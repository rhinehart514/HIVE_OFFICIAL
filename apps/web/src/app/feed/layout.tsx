import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isFeedEnabled, type UserFeatureContext } from "@/lib/feature-flags";
import { verifySession } from "@/lib/session";

/**
 * Feed Layout - Gates feed behind FEED_V1 feature flag
 *
 * When feed is disabled (default for soft launch), redirects to home.
 * When enabled, renders the feed page normally.
 */
export default async function FeedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Build user context from session
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

  // Check feature flag
  const feedEnabled = await isFeedEnabled(userContext);

  if (!feedEnabled) {
    // Feed is disabled - redirect to spaces browse as the main landing for authenticated users
    redirect("/spaces/browse");
  }

  return <>{children}</>;
}
