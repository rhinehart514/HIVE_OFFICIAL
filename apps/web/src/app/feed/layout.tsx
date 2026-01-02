import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isFeedEnabled, type UserFeatureContext } from "@/lib/feature-flags";

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
      const session = JSON.parse(sessionCookie.value);
      userContext = {
        userId: session.userId || "anonymous",
        userRole: session.role || "member",
        schoolId: session.campusId || "ub-buffalo",
      };
    } catch {
      // Keep default anonymous context
    }
  }

  // Check feature flag
  const feedEnabled = await isFeedEnabled(userContext);

  if (!feedEnabled) {
    // Feed is disabled - redirect to home
    redirect("/");
  }

  return <>{children}</>;
}
