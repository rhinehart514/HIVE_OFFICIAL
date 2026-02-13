'use client';

/**
 * Custom Block Element
 *
 * HiveLab element wrapper for custom blocks.
 * Integrates CustomBlockRenderer with the element system.
 */

import * as React from 'react';
import { toast } from 'sonner';
import { CustomBlockRenderer } from '../../../../design-system/components/hivelab/CustomBlockRenderer';
import type { ElementProps } from '../../../../lib/hivelab/element-system';
import { extractOutputValue } from '@hive/core';
import type { BlockContext, CustomBlockConfig, IframeMessage } from '@hive/core';
import type { ElementMode } from '../core';

// ============================================================
// Types
// ============================================================

interface CustomBlockElementProps extends ElementProps {
  config: CustomBlockConfig;
  mode?: ElementMode;
}

// ============================================================
// Custom Block Element
// ============================================================

export function CustomBlockElement({
  id,
  config,
  sharedState,
  userState,
  context,
  connections,
  allElementStates,
  elementDefinitions,
  onOutput,
  onAction,
  mode = 'runtime',
}: CustomBlockElementProps) {
  const [isReady, setIsReady] = React.useState(false);
  const messageRef = React.useRef<((message: any) => void) | null>(null);

  // Extract block state from element state
  const blockState = React.useMemo(() => {
    // Map element state structure to block state structure
    return {
      personal: userState || {},
      shared: sharedState || {},
    };
  }, [userState, sharedState]);

  const blockContextBase = React.useMemo(() => {
    const runtimeRole = context?.member?.role;
    const mappedRole: BlockContext['userRole'] =
      context?.userRole ||
      (runtimeRole === 'owner'
        ? 'admin'
        : runtimeRole === 'admin' || runtimeRole === 'moderator' || runtimeRole === 'member' || runtimeRole === 'guest'
          ? runtimeRole
          : context?.isSpaceLeader
            ? 'admin'
            : undefined);

    const resolvedUserId = context?.userId || context?.member?.userId || 'anonymous';
    const resolvedSpaceId = context?.spaceId || context?.space?.spaceId;
    const resolvedSpaceName = context?.spaceName || context?.space?.spaceName;
    const resolvedDisplayName = context?.userDisplayName || context?.member?.displayName;

    return {
      userId: resolvedUserId,
      userDisplayName: resolvedDisplayName,
      userRole: mappedRole,
      spaceId: resolvedSpaceId,
      spaceName: resolvedSpaceName,
    };
  }, [context]);

  const resolveConnectedInput = React.useCallback((inputId: string) => {
    if (!connections || connections.length === 0 || !allElementStates) {
      return null;
    }

    const incoming = connections.filter((connection) => {
      if (!connection?.to || connection.to.instanceId !== id) {
        return false;
      }
      const targetInput = connection.to.input || connection.to.port;
      return targetInput === inputId;
    });

    for (const connection of incoming) {
      const sourceInstanceId = connection.from.instanceId;
      const sourceOutputId = connection.from.output || connection.from.port || 'data';
      const sourceState = allElementStates[sourceInstanceId];

      if (sourceState === undefined) {
        continue;
      }

      const normalizedState =
        sourceState && typeof sourceState === 'object' && !Array.isArray(sourceState)
          ? (sourceState as Record<string, unknown>)
          : { value: sourceState, data: sourceState };

      const sourceElementId = elementDefinitions?.find(
        (element) => element.instanceId === sourceInstanceId
      )?.elementId;

      const extracted = extractOutputValue(
        normalizedState,
        sourceOutputId,
        sourceElementId
      );

      if (extracted !== undefined) {
        return extracted;
      }
    }

    return null;
  }, [connections, allElementStates, id, elementDefinitions]);

  // Handle messages from iframe
  const handleMessage = React.useCallback((message: IframeMessage) => {
    const sendResponse = (response: any) => {
      if (messageRef.current) {
        messageRef.current(response);
      }
    };

    // Route messages to appropriate handlers based on type
    switch (message.type) {
      case 'get_state':
        // Respond with current state
        sendResponse({
          type: 'state_response',
          requestId: message.requestId,
          state: blockState,
        });
        break;

      case 'set_state':
        // State updates handled via onAction
        if (onAction && message.updates) {
          onAction('update_state', message.updates);
        }
        // Send acknowledgment
        if (message.requestId) {
          sendResponse({
            type: 'state_response',
            requestId: message.requestId,
            result: { success: true },
          });
        }
        break;

      case 'execute_action':
        // Action execution
        if (onAction && message.actionId) {
          onAction(message.actionId, message.payload);
          // Send result if requestId provided
          if (message.requestId) {
            sendResponse({
              type: 'action_result',
              requestId: message.requestId,
              result: { success: true },
            });
          }
        }
        break;

      case 'get_input':
        // Get input data (for element connections)
        if (message.requestId) {
          sendResponse({
            type: 'input_response',
            requestId: message.requestId,
            data: resolveConnectedInput(message.inputId),
          });
        }
        break;

      case 'emit_output':
        // Output emission (for element connections)
        if (onOutput) {
          onOutput(message.outputId, message.data);
        } else if (onAction) {
          onAction('emit_output', {
            outputId: message.outputId,
            data: message.data,
          });
        }
        break;

      case 'get_context':
        // Get user/space context
        if (message.requestId) {
          sendResponse({
            type: 'context_response',
            requestId: message.requestId,
            context: {
              ...blockContextBase,
              timestamp: new Date().toISOString(),
            },
          });
        }
        break;

      case 'log':
        // Debug logging from custom block
        const level = (message as any).level || 'log';
        if (level === 'error') {
          console.error('[CustomBlock]', ...message.args);
        } else {
          console.log('[CustomBlock]', ...message.args);
        }
        break;

      case 'notify':
        // Toast notifications
        if (message.notifyType === 'success') {
          toast.success(message.message);
        } else if (message.notifyType === 'error') {
          toast.error(message.message);
        } else {
          toast.info(message.message);
        }
        break;

      default:
        console.warn('[CustomBlock] Unknown message type:', (message as any).type);
    }
  }, [onAction, onOutput, blockState, resolveConnectedInput, blockContextBase]);

  // Handle block ready
  const handleReady = React.useCallback(() => {
    setIsReady(true);
  }, []);

  // Handle block errors
  const handleError = React.useCallback((error: Error) => {
    console.error('[CustomBlock] Error:', error);
  }, []);

  // Determine size from element config or use defaults
  const width = (config as CustomBlockConfig & { size?: { width?: number; height?: number } }).size?.width;
  const height = (config as CustomBlockConfig & { size?: { width?: number; height?: number } }).size?.height;

  return (
    <div className="w-full">
      <CustomBlockRenderer
        instanceId={id}
        config={config}
        initialState={blockState}
        context={{
          ...blockContextBase,
          timestamp: new Date().toISOString(),
        }}
        onReady={handleReady}
        onMessage={handleMessage}
        onError={handleError}
        width={width}
        height={height}
        mode={mode === 'edit' ? 'preview' : mode}
        messageRef={messageRef}
      />

      {/* Optional debug info in preview mode */}
      {mode === 'preview' && (
        <div className="mt-2 p-2 text-xs text-muted-foreground bg-surface/50 rounded border border-border">
          <div className="flex items-center gap-2">
            <span className={isReady ? 'text-success' : 'text-warning'}>
              {isReady ? '✓' : '○'}
            </span>
            <span>{config.metadata.name}</span>
            <span className="opacity-50">v{config.version}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomBlockElement;
