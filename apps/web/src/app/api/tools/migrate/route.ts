import { withAuthAndErrors, getUserId, type AuthenticatedRequest } from '@/lib/middleware';
import { dbAdmin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { logger } from '@/lib/logger';

/**
 * localStorage Migration Endpoint
 *
 * Migrates tools created anonymously (stored in localStorage) to Firestore
 * when user signs up. Called automatically by auth listener in root layout.
 *
 * POST /api/tools/migrate
 * Body: { tools: ToolComposition[] }
 * Returns: { migratedCount: number }
 */

const MigrationSchema = z.object({
  tools: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    elements: z.array(z.any()),
    connections: z.array(z.any()).optional(),
    layout: z.string().optional(),
  }))
});

export const POST = withAuthAndErrors(async (request, context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);

  if (!userId) {
    return respond.error(
      'User must be authenticated to migrate tools',
      'UNAUTHORIZED',
      { status: 401 }
    );
  }

  try {
    // Parse request body
    const body = await request.json();
    const validated = MigrationSchema.parse(body);

    if (validated.tools.length === 0) {
      return respond.success({ migratedCount: 0 });
    }

    // Batch write to Firestore (max 500 operations per batch)
    const batch = dbAdmin.batch();

    let migratedCount = 0;

    for (const tool of validated.tools) {
      // Create new tool document
      const toolRef = dbAdmin.collection('tools').doc(tool.id);

      batch.set(toolRef, {
        name: tool.name || 'Untitled Tool',
        description: tool.description || '',
        type: 'ai-generated',
        status: 'draft',
        createdBy: userId,
        campusId: 'ub-buffalo', // Campus isolation
        elements: tool.elements || [],
        connections: tool.connections || [],
        layout: tool.layout || 'grid',
        config: {
          composition: tool,
        },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        deployCount: 0,
        viewCount: 0,
        interactionCount: 0,
      });

      migratedCount++;

      // Firestore batch limit: 500 operations
      if (migratedCount % 500 === 0) {
        await batch.commit();
        // Start new batch for remaining tools
      }
    }

    // Commit final batch
    if (migratedCount % 500 !== 0) {
      await batch.commit();
    }

    return respond.success({
      migratedCount,
      message: `Successfully migrated ${migratedCount} tool${migratedCount !== 1 ? 's' : ''} to your account`
    });

  } catch (error) {
    logger.error('Tool migration failed', {}, error instanceof Error ? error : new Error(String(error)));

    if (error instanceof z.ZodError) {
      return respond.error(
        `Invalid request: ${error.errors.map(e => e.message).join(', ')}`,
        'INVALID_INPUT',
        { status: 400 }
      );
    }

    return respond.error(
      'Failed to migrate tools. Please try again.',
      'INTERNAL_ERROR',
      { status: 500 }
    );
  }
});
