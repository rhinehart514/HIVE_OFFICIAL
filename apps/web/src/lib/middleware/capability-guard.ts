/**
 * Capability Guard Middleware
 *
 * Server-side capability enforcement for HiveLab tool operations.
 * Validates that a deployment has the required capabilities before
 * allowing an operation to proceed.
 *
 * @version P0 - Capability Enforcement
 */

import { dbAdmin } from "@/lib/firebase-admin";
import {
  hasCapability,
  hasObjectCapability,
  type ToolCapabilities,
} from "@hive/core";

// ============================================================================
// Types
// ============================================================================

export interface CapabilityCheck {
  /** The capability to check */
  capability: keyof ToolCapabilities;
  /** For object capabilities: the specific object type ID */
  resourceType?: string;
}

export interface CapabilityCheckResult {
  /** Whether all capability checks passed */
  allowed: boolean;
  /** List of checks that failed */
  denied: CapabilityCheck[];
  /** The deployment's granted capabilities */
  capabilities: ToolCapabilities;
  /** Deployment governance status */
  status: string;
}

// ============================================================================
// Core Enforcement Function
// ============================================================================

/**
 * Enforce capability checks for a deployment.
 *
 * @param deploymentId - The deployment to check
 * @param checks - Array of capability checks to perform
 * @returns Result indicating if all checks passed
 */
export async function enforceCapabilities(
  deploymentId: string,
  checks: CapabilityCheck[]
): Promise<CapabilityCheckResult> {
  // Load deployment
  const deploymentDoc = await dbAdmin
    .collection("deployedTools")
    .doc(deploymentId)
    .get();

  if (!deploymentDoc.exists) {
    return {
      allowed: false,
      denied: checks,
      capabilities: {} as ToolCapabilities,
      status: "not_found",
    };
  }

  const deployment = deploymentDoc.data()!;
  const capabilities = (deployment.capabilities || {}) as ToolCapabilities;
  const status = deployment.status || "unknown";

  // Check governance status first
  if (!["active", "experimental"].includes(status)) {
    return {
      allowed: false,
      denied: checks,
      capabilities,
      status,
    };
  }

  const denied: CapabilityCheck[] = [];

  for (const check of checks) {
    // Handle object capabilities with type specificity
    if (
      check.capability === "objects_read" ||
      check.capability === "objects_write" ||
      check.capability === "objects_delete"
    ) {
      const action = check.capability.replace("objects_", "") as
        | "read"
        | "write"
        | "delete";
      const objectTypeId = check.resourceType || "";

      if (!hasObjectCapability(capabilities, action, objectTypeId)) {
        denied.push(check);
      }
      continue;
    }

    // Standard capability check
    if (!hasCapability(capabilities, check.capability)) {
      denied.push(check);
    }
  }

  return {
    allowed: denied.length === 0,
    denied,
    capabilities,
    status,
  };
}

// ============================================================================
// Budget Enforcement
// ============================================================================

interface BudgetCheck {
  /** Budget type to check */
  budgetType: "notifications" | "posts" | "automations" | "executions";
  /** Number of units being consumed */
  units?: number;
}

interface BudgetCheckResult {
  /** Whether budget allows the operation */
  allowed: boolean;
  /** Current usage */
  currentUsage: number;
  /** Maximum allowed */
  limit: number;
  /** Remaining budget */
  remaining: number;
}

/**
 * Check if a deployment has budget remaining for an operation.
 *
 * @param deploymentId - The deployment to check
 * @param check - The budget check to perform
 * @returns Whether the budget allows the operation
 */
export async function checkBudgetAvailable(
  deploymentId: string,
  check: BudgetCheck
): Promise<BudgetCheckResult> {
  const units = check.units || 1;

  // Load deployment
  const deploymentDoc = await dbAdmin
    .collection("deployedTools")
    .doc(deploymentId)
    .get();

  if (!deploymentDoc.exists) {
    return {
      allowed: false,
      currentUsage: 0,
      limit: 0,
      remaining: 0,
    };
  }

  const deployment = deploymentDoc.data()!;
  const budgets = deployment.budgets || {};

  // Map budget type to field names
  const budgetFieldMap: Record<string, { limit: string; usage: string }> = {
    notifications: {
      limit: "notificationsPerDay",
      usage: "notificationsUsedToday",
    },
    posts: { limit: "postsPerDay", usage: "postsUsedToday" },
    automations: { limit: "automationsPerDay", usage: "automationsUsedToday" },
    executions: {
      limit: "executionsPerUserPerHour",
      usage: "executionsUsedThisHour",
    },
  };

  const fields = budgetFieldMap[check.budgetType];
  if (!fields) {
    return {
      allowed: true,
      currentUsage: 0,
      limit: Infinity,
      remaining: Infinity,
    };
  }

  const limit = budgets[fields.limit] || 0;
  const currentUsage = deployment[fields.usage] || 0;
  const remaining = Math.max(0, limit - currentUsage);

  return {
    allowed: remaining >= units,
    currentUsage,
    limit,
    remaining,
  };
}

// ============================================================================
// Middleware Wrapper
// ============================================================================

type ResponseHelper = {
  error: (
    message: string,
    code: string,
    options?: { status: number }
  ) => Response;
  success: (data: unknown) => Response;
};

type RouteHandler = (
  req: Request,
  ctx: { params?: Record<string, string>; capabilities?: ToolCapabilities },
  respond: ResponseHelper
) => Promise<Response>;

/**
 * Middleware wrapper for capability-gated routes.
 *
 * Automatically extracts deploymentId and validates capabilities
 * before allowing the handler to execute.
 *
 * @param checks - Capability checks to perform
 * @param handler - The route handler to wrap
 */
export function withCapabilityCheck(
  checks: CapabilityCheck[],
  handler: RouteHandler
): RouteHandler {
  return async (req, ctx, respond) => {
    // Extract deployment ID from body or params
    let deploymentId: string | undefined;

    try {
      const body = await req.clone().json();
      deploymentId = body.deploymentId;
    } catch {
      // Body parsing failed, try params
    }

    if (!deploymentId && ctx.params?.deploymentId) {
      deploymentId = ctx.params.deploymentId;
    }

    if (!deploymentId) {
      return respond.error("Deployment ID required", "INVALID_INPUT", {
        status: 400,
      });
    }

    // Perform capability checks
    const result = await enforceCapabilities(deploymentId, checks);

    // Handle governance status issues
    if (result.status === "not_found") {
      return respond.error("Deployment not found", "NOT_FOUND", { status: 404 });
    }

    if (!["active", "experimental"].includes(result.status)) {
      return respond.error(
        `Deployment is ${result.status}`,
        "FORBIDDEN",
        { status: 403 }
      );
    }

    // Handle capability denials
    if (!result.allowed) {
      const deniedCaps = result.denied.map((d) => {
        if (d.resourceType) {
          return `${d.capability}:${d.resourceType}`;
        }
        return d.capability;
      });

      return respond.error(
        `Missing required capabilities: ${deniedCaps.join(", ")}`,
        "FORBIDDEN",
        { status: 403 }
      );
    }

    // Inject capabilities into context for handler use
    ctx.capabilities = result.capabilities;

    return handler(req, ctx, respond);
  };
}

// ============================================================================
// Kill Switch
// ============================================================================

/**
 * Disable a deployment immediately (kill switch).
 *
 * @param deploymentId - The deployment to disable
 * @param reason - Reason for disabling
 * @param disabledBy - User ID who triggered the kill switch
 */
export async function killDeployment(
  deploymentId: string,
  reason: string,
  disabledBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await dbAdmin
      .collection("deployedTools")
      .doc(deploymentId)
      .update({
        status: "disabled",
        disabledAt: new Date().toISOString(),
        disabledBy,
        disabledReason: reason,
      });

    // Log the action
    await dbAdmin.collection("audit_logs").add({
      action: "deployment_killed",
      deploymentId,
      reason,
      triggeredBy: disabledBy,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Quarantine a deployment (suspends but allows investigation).
 *
 * @param deploymentId - The deployment to quarantine
 * @param reason - Reason for quarantining
 * @param quarantinedBy - User ID who triggered the quarantine
 */
export async function quarantineDeployment(
  deploymentId: string,
  reason: string,
  quarantinedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await dbAdmin
      .collection("deployedTools")
      .doc(deploymentId)
      .update({
        status: "quarantined",
        quarantinedAt: new Date().toISOString(),
        quarantinedBy,
        quarantinedReason: reason,
      });

    // Log the action
    await dbAdmin.collection("audit_logs").add({
      action: "deployment_quarantined",
      deploymentId,
      reason,
      triggeredBy: quarantinedBy,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
