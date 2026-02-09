'use client';

/**
 * Custom Block Element
 *
 * HiveLab element wrapper for custom blocks.
 * Integrates CustomBlockRenderer with the element system.
 */

import * as React from 'react';
import { CustomBlockRenderer } from '../../../../design-system/components/hivelab/CustomBlockRenderer';
import { createParentMessage } from '../../../../lib/hivelab/hive-sdk';
import type { ElementProps } from '../../../../lib/hivelab/element-system';
import type { CustomBlockConfig, IframeMessage } from '@hive/core';
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
        // TODO: Implement input data retrieval from tool runtime
        if (message.requestId) {
          sendResponse({
            type: 'input_response',
            requestId: message.requestId,
            data: null, // Placeholder
          });
        }
        break;

      case 'emit_output':
        // Output emission (for element connections)
        // Will be handled by tool runtime in Phase 6
        console.log('[CustomBlock] Output emitted:', message.outputId, message.data);
        break;

      case 'get_context':
        // Get user/space context
        // TODO: Get from tool runtime context
        if (message.requestId) {
          sendResponse({
            type: 'context_response',
            requestId: message.requestId,
            context: {
              userId: 'current-user', // Placeholder
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
        // Will be handled by tool runtime
        console.log('[CustomBlock] Notification:', message.message, message.notifyType);
        break;

      default:
        console.warn('[CustomBlock] Unknown message type:', (message as any).type);
    }
  }, [onAction, blockState]);

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
