/**
 * AI Generator - Ambiguous Creation System
 *
 * ARCHITECTURE PRINCIPLES:
 * 1. Like ChatGPT: user describes intent, we compose elements to achieve it
 * 2. No prescribed templates - dynamically compose based on detected INTENT
 * 3. Don't assume use case - the tool exists, user decides what to do with it
 * 4. Respect tier access - only compose with elements user can access
 *
 * The magic: turn ambiguous descriptions into functional compositions.
 */

import type { UserContext } from '@hive/ui';

// Re-export all types and functions from submodules
export * from './intent-detection';
export * from './refinement';
export * from './element-composition';
export * from './tool-naming';

// Import for internal use
import { detectIntent, type Intent, type DetectedIntent } from './intent-detection';
import { isIterationRequest, detectRefinement } from './refinement';
import { composeElements, type ElementSpec, type Connection } from './element-composition';
import { generateToolName } from './tool-naming';

export interface StreamingChunk {
  type: 'thinking' | 'element' | 'connection' | 'complete' | 'error';
  data: Record<string, unknown>;
}

export interface SpaceContext {
  spaceId: string;
  spaceName: string;
  spaceType?: string;
  category?: string;
  memberCount?: number;
  description?: string;
}

export interface GenerateToolRequest {
  prompt: string;
  templateId?: string;
  constraints?: {
    maxElements?: number;
    allowedCategories?: string[];
  };
  spaceContext?: SpaceContext;
  userContext?: UserContext;
  existingComposition?: {
    elements: ElementSpec[];
    name?: string;
  };
  isIteration?: boolean;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main streaming generator - takes a description, emits a composition
 */
export async function* mockGenerateToolStreaming(
  request: GenerateToolRequest
): AsyncGenerator<StreamingChunk> {
  const isIteration = request.isIteration || isIterationRequest(request.prompt);
  const existingElements = request.existingComposition?.elements || [];

  // Step 1: Detect intent and refinement action from prompt
  yield {
    type: 'thinking',
    data: {
      message: isIteration
        ? `Updating your tool: "${request.prompt.substring(0, 40)}..."`
        : `Understanding: "${request.prompt.substring(0, 50)}..."`
    },
  };
  await delay(300);

  const intent = detectIntent(request.prompt);
  const refinement = isIteration ? detectRefinement(request.prompt, existingElements) : null;

  // For delete/modify actions, emit refinement chunk instead of new elements
  if (refinement && (refinement.action === 'delete' || refinement.action === 'modify')) {
    yield {
      type: 'thinking',
      data: {
        message: refinement.action === 'delete'
          ? `Removing ${refinement.targetKeyword || 'element'}...`
          : `Modifying ${refinement.targetKeyword || 'element'}...`,
        action: refinement.action,
        confidence: refinement.confidence,
      },
    };
    await delay(200);

    // Emit refinement action for client to handle
    yield {
      type: 'element' as const,
      data: {
        refinementAction: refinement.action,
        targetKeyword: refinement.targetKeyword,
        targetElementId: refinement.targetElementId,
        change: refinement.change,
        newValue: refinement.newValue,
        confidence: refinement.confidence,
        // For modify, include size delta if applicable
        sizeDelta: refinement.change === 'size' ? (
          refinement.newValue === 'increase' ? { width: 2, height: 1 } :
          refinement.newValue === 'decrease' ? { width: -2, height: -1 } :
          refinement.newValue === 'increase-height' ? { height: 2 } :
          refinement.newValue === 'decrease-height' ? { height: -1 } :
          refinement.newValue === 'increase-width' ? { width: 2 } :
          undefined
        ) : undefined,
      },
    };
    await delay(100);

    // Complete with refinement flag
    yield {
      type: 'complete',
      data: {
        toolId: `tool-${Date.now()}`,
        name: request.existingComposition?.name || 'Updated Tool',
        description: `${refinement.action === 'delete' ? 'Removed' : 'Modified'}: ${request.prompt}`,
        elementCount: refinement.action === 'delete' ? existingElements.length - 1 : existingElements.length,
        connectionCount: 0,
        intent: intent.primary,
        confidence: refinement.confidence,
        isIteration: true,
        refinementAction: refinement.action,
        targetElementId: refinement.targetElementId,
      },
    };
    return;
  }

  yield {
    type: 'thinking',
    data: {
      message: isIteration
        ? `Adding ${intent.primary} capability...`
        : `Detected intent: ${intent.primary} (${Math.round(intent.confidence * 100)}% confident)`,
      keywords: intent.keywords,
    },
  };
  await delay(300);

  // Step 2: Compose elements (new ones only for iteration)
  yield {
    type: 'thinking',
    data: {
      message: isIteration
        ? 'Adding new elements to your tool...'
        : 'Composing elements to achieve this...'
    },
  };
  await delay(200);

  const { elements: newElements, connections: newConnections } = composeElements(intent, request.userContext);

  // For iteration: only emit the NEW elements (not existing ones)
  // For new creation: emit all elements
  const elementsToEmit = isIteration
    ? newElements.map(el => ({
        ...el,
        // Offset position to avoid overlap with existing elements
        position: {
          x: el.position.x,
          y: el.position.y + (existingElements.length * 5), // Stack below existing
        },
      }))
    : newElements;

  // Step 3: Emit elements one by one
  // Transform to match the format expected by use-streaming-generation.ts
  // (matches Firebase generator output format: id/type instead of instanceId/elementId)
  for (const element of elementsToEmit) {
    yield {
      type: 'element',
      data: {
        id: element.instanceId,
        type: element.elementId,
        name: element.elementId,
        config: element.config,
        position: element.position,
        size: element.size,
      },
    };
    await delay(150);
  }

  // Step 4: Emit connections
  for (const connection of newConnections) {
    yield {
      type: 'connection',
      data: connection as unknown as Record<string, unknown>,
    };
    await delay(100);
  }

  // Step 5: Complete
  // For iteration, keep the existing name
  const toolName = isIteration && request.existingComposition?.name
    ? request.existingComposition.name
    : generateToolName(request.prompt, intent);

  // Combine existing + new elements for total count
  const totalElements = isIteration
    ? existingElements.length + elementsToEmit.length
    : elementsToEmit.length;

  yield {
    type: 'complete',
    data: {
      toolId: `tool-${Date.now()}`,
      name: toolName,
      description: isIteration
        ? `Updated: ${request.prompt}`
        : `Composed from your description: "${request.prompt}"`,
      elementCount: totalElements,
      connectionCount: newConnections.length,
      intent: intent.primary,
      confidence: intent.confidence,
      isIteration,
      // CRITICAL: The system doesn't assume what you'll do with this
      suggestedActions: [
        'Save to My Creations',
        'Share via link',
        'Iterate on design',
        ...(request.userContext?.isSpaceLeader ? ['Deploy to space'] : []),
      ],
    },
  };
}
