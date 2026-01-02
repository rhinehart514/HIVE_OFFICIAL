import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isRitualsEnabled, type UserFeatureContext } from "@/lib/feature-flags";

/**
 * Rituals Layout - Gates rituals behind RITUALS_V1 feature flag
 *
 * When rituals are disabled (default for soft launch), redirects to home.
 * When enabled, renders the rituals pages normally.
 */
export default async function RitualsLayout({
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
  const ritualsEnabled = await isRitualsEnabled(userContext);

  if (!ritualsEnabled) {
    // Rituals are disabled - redirect to home
    redirect("/");
  }

  return <>{children}</>;
}
