/**
 * Setup Deploy API
 *
 * POST /api/setups/deploy - Deploy a setup to a space
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import {
  getServerSetupTemplateRepository,
  getServerSetupDeploymentRepository,
  SetupDeployment,
  toSetupDeploymentDetailDTO,
  dbAdmin,
} from '@hive/core/server';

// ============================================================================
// Request Validation
// ============================================================================

const DeploySetupSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  spaceId: z.string().min(1, 'Space ID is required'),
  config: z.record(z.unknown()).default({}),
});

// ============================================================================
// Response Helpers
// ============================================================================

function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// ============================================================================
// POST /api/setups/deploy
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Get session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return errorResponse('Not authenticated', 401);
    }

    // Parse session
    let session: { userId: string; campusId: string };
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return errorResponse('Invalid session', 401);
    }

    const { userId, campusId } = session;

    // Parse request body
    const body = await request.json();
    const parseResult = DeploySetupSchema.safeParse(body);

    if (!parseResult.success) {
      return errorResponse(parseResult.error.errors[0].message, 400);
    }

    const { templateId, spaceId, config } = parseResult.data;

    // Get repositories
    const templateRepo = getServerSetupTemplateRepository();
    const deploymentRepo = getServerSetupDeploymentRepository();

    // Get template
    const templateResult = await templateRepo.findById(templateId);
    if (templateResult.isFailure) {
      return errorResponse('Template not found', 404);
    }

    const template = templateResult.getValue();

    // Verify user has permission to deploy to this space
    const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
    if (!spaceDoc.exists) {
      return errorResponse('Space not found', 404);
    }

    const spaceData = spaceDoc.data();

    // Check if user is a leader (owner/admin/mod)
    const memberDoc = await dbAdmin
      .collection('spaces')
      .doc(spaceId)
      .collection('members')
      .doc(userId)
      .get();

    if (!memberDoc.exists) {
      return errorResponse('Not a member of this space', 403);
    }

    const memberData = memberDoc.data();
    const role = memberData?.role || 'member';

    if (!['owner', 'admin', 'moderator'].includes(role)) {
      return errorResponse('Only leaders can deploy Setups', 403);
    }

    // Generate deployment ID
    const deploymentId = `setup_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Deploy each tool in the Setup
    const deployedTools: Array<{ slotId: string; deploymentId: string }> = [];

    for (const toolSlot of template.tools) {
      // Create a tool deployment for each slot
      const toolDeploymentId = `tool_${deploymentId}_${toolSlot.slotId}`;

      // Create placed_tool document
      const placedToolRef = dbAdmin
        .collection('spaces')
        .doc(spaceId)
        .collection('placed_tools')
        .doc(toolDeploymentId);

      await placedToolRef.set({
        toolId: toolSlot.templateId || `inline_${toolSlot.slotId}`,
        name: toolSlot.name,
        description: toolSlot.description || '',
        icon: toolSlot.icon || 'Wrench',
        composition: toolSlot.composition,
        config: { ...toolSlot.defaultConfig, ...config },
        placement: toolSlot.placement,
        isActive: toolSlot.initiallyVisible,
        placedBy: userId,
        placedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: deployedTools.length,
        // Link to Setup
        setupDeploymentId: deploymentId,
        setupSlotId: toolSlot.slotId,
      });

      deployedTools.push({
        slotId: toolSlot.slotId,
        deploymentId: toolDeploymentId,
      });
    }

    // Create SetupDeployment
    const deploymentResult = SetupDeployment.createFromTemplate(
      deploymentId,
      {
        id: template.id,
        name: template.name,
        category: template.category,
        icon: template.icon,
        tools: template.tools,
        orchestration: template.orchestration,
        sharedDataSchema: template.sharedDataSchema,
        configFields: template.configFields,
      },
      spaceId,
      campusId,
      userId,
      config,
      deployedTools,
    );

    if (deploymentResult.isFailure) {
      // Cleanup deployed tools on failure
      for (const tool of deployedTools) {
        await dbAdmin
          .collection('spaces')
          .doc(spaceId)
          .collection('placed_tools')
          .doc(tool.deploymentId)
          .delete();
      }
      return errorResponse(deploymentResult.error ?? 'Unknown error', 500);
    }

    const deployment = deploymentResult.getValue();

    // Initialize shared data with config values
    const sharedData: Record<string, unknown> = { ...config };
    deployment.updateSharedData(sharedData);

    // Save deployment
    const saveResult = await deploymentRepo.save(deployment);

    if (saveResult.isFailure) {
      // Cleanup deployed tools on failure
      for (const tool of deployedTools) {
        await dbAdmin
          .collection('spaces')
          .doc(spaceId)
          .collection('placed_tools')
          .doc(tool.deploymentId)
          .delete();
      }
      return errorResponse(saveResult.error ?? 'Unknown error', 500);
    }

    // Increment template deployment count
    await templateRepo.incrementDeploymentCount(templateId);

    // Return deployment details
    const dto = toSetupDeploymentDetailDTO(deployment);

    return jsonResponse(
      {
        deployment: dto,
        deployedTools: deployedTools.map(t => ({
          slotId: t.slotId,
          deploymentId: t.deploymentId,
        })),
      },
      201,
    );
  } catch {
    return errorResponse('Failed to deploy setup', 500);
  }
}
