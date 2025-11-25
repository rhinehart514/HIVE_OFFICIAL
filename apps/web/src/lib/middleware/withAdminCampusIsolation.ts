import type { DecodedIdToken } from "firebase-admin/auth";
import type { NextRequest, NextResponse } from "next/server";
import { withSecureAuth } from "@/lib/api-auth-secure";
import { CURRENT_CAMPUS_ID } from "@/lib/secure-firebase-queries";

type AdminHandler<TArgs extends unknown[]> = (
  request: NextRequest,
  token: DecodedIdToken,
  ...args: TArgs
) => Promise<NextResponse>;

interface WithAdminCampusIsolationOptions {
  allowAnonymous?: boolean;
}

/**
 * Compose secure auth, admin verification, and campus isolation for admin APIs.
 * Guarantees:
 * - Admin session required
 * - Requests stay scoped to CURRENT_CAMPUS_ID
 * - Admin API rate limiting applied
 */
export function withAdminCampusIsolation<TArgs extends unknown[]>(
  handler: AdminHandler<TArgs>,
  options: WithAdminCampusIsolationOptions = {},
) {
  return withSecureAuth(handler, {
    requireAdmin: true,
    campusId: CURRENT_CAMPUS_ID,
    allowAnonymous: options.allowAnonymous ?? false,
    rateLimit: { type: "adminApi" },
  });
}
