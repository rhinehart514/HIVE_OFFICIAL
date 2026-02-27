/**
 * HIVE SDK - Client Runtime
 *
 * JavaScript SDK injected into custom block iframes.
 * Provides secure postMessage bridge to parent window.
 *
 * Available as window.HIVE in custom block context.
 */

import type {
  BlockState,
  BlockContext,
  ActionResult,
  IframeMessage,
  ParentMessage,
} from '@hive/core';
import type { HiveRuntimeContext } from '@hive/core';

/**
 * Generate HIVE SDK code to inject into iframe
 * This returns a string of JavaScript that creates window.HIVE
 *
 * @param instanceId - Unique ID for this iframe instance
 * @param runtimeContext - Optional HiveRuntimeContext to preload (avoids async round-trip)
 */
export function generateHiveSDK(instanceId: string, runtimeContext?: HiveRuntimeContext | null): string {
  const contextJson = runtimeContext ? JSON.stringify(runtimeContext) : 'null';

  return `
(function() {
  'use strict';

  // ============================================================
  // HIVE SDK Implementation
  // ============================================================

  const instanceId = '${instanceId}';
  let requestIdCounter = 0;
  const pendingRequests = new Map();
  const stateChangeCallbacks = new Set();
  let currentState = null;
  let currentContext = ${contextJson};

  /**
   * Generate unique request ID
   */
  function generateRequestId() {
    return instanceId + '_' + (++requestIdCounter) + '_' + Date.now();
  }

  /**
   * Send message to parent and optionally wait for response
   */
  function sendMessage(message, waitForResponse = false) {
    return new Promise((resolve, reject) => {
      const requestId = waitForResponse ? generateRequestId() : null;

      if (waitForResponse) {
        // Set timeout for request
        const timeout = setTimeout(() => {
          pendingRequests.delete(requestId);
          reject(new Error('Request timeout'));
        }, 5000);

        pendingRequests.set(requestId, { resolve, reject, timeout });
        message.requestId = requestId;
      }

      try {
        window.parent.postMessage(
          {
            source: 'hive-iframe',
            instanceId: instanceId,
            timestamp: Date.now(),
            payload: message
          },
          window.location.origin || '*'
        );

        if (!waitForResponse) {
          resolve();
        }
      } catch (error) {
        if (waitForResponse && requestId) {
          const request = pendingRequests.get(requestId);
          if (request) {
            clearTimeout(request.timeout);
            pendingRequests.delete(requestId);
          }
        }
        reject(error);
      }
    });
  }

  /**
   * Handle messages from parent
   */
  function handleParentMessage(event) {
    // Basic validation
    if (!event.data || event.data.source !== 'hive-parent') {
      return;
    }

    const { payload } = event.data;
    if (!payload) return;

    switch (payload.type) {
      case 'state_update':
        // Update cached state and notify callbacks
        if (payload.state) {
          currentState = payload.state;
          stateChangeCallbacks.forEach(callback => {
            try {
              callback(currentState);
            } catch (error) {
              console.error('[HIVE SDK] Error in state change callback:', error);
            }
          });
        }
        break;

      case 'context_update':
        // Update cached context
        if (payload.context) {
          currentContext = payload.context;
        }
        break;

      case 'action_result':
      case 'state_response':
      case 'input_response':
      case 'context_response':
      case 'create_post_response':
      case 'get_members_response':
        // Handle async request response
        if (payload.requestId) {
          const request = pendingRequests.get(payload.requestId);
          if (request) {
            clearTimeout(request.timeout);
            pendingRequests.delete(payload.requestId);

            if (payload.error) {
              request.reject(new Error(payload.error));
            } else {
              request.resolve(payload.result || payload.state || payload.data || payload.context);
            }
          }
        }
        break;

      default:
        console.warn('[HIVE SDK] Unknown message type:', payload.type);
    }
  }

  // Listen for messages from parent
  window.addEventListener('message', handleParentMessage);

  // ============================================================
  // Public HIVE SDK API
  // ============================================================

  window.HIVE = {
    /**
     * SDK version
     */
    version: '1.0.0',

    /**
     * Instance ID of this custom block
     */
    instanceId: instanceId,

    /**
     * Ready state
     */
    ready: false,

    /**
     * Get current state for this block
     */
    getState: function() {
      if (currentState) {
        return Promise.resolve(currentState);
      }
      return sendMessage({ type: 'get_state' }, true);
    },

    /**
     * Update state
     * @param updates - Partial state updates
     */
    setState: function(updates) {
      // Optimistically update local cache
      if (currentState) {
        currentState = {
          personal: { ...currentState.personal, ...updates.personal },
          shared: { ...currentState.shared, ...updates.shared }
        };
      }

      return sendMessage({
        type: 'set_state',
        updates: updates
      }, true);
    },

    /**
     * Execute an action
     * @param actionId - Action identifier from manifest
     * @param payload - Action payload
     */
    executeAction: function(actionId, payload) {
      return sendMessage({
        type: 'execute_action',
        actionId: actionId,
        payload: payload
      }, true);
    },

    /**
     * Subscribe to state changes
     * @param callback - Called when state changes
     * @returns Unsubscribe function
     */
    onStateChange: function(callback) {
      stateChangeCallbacks.add(callback);

      // Immediately call with current state if available
      if (currentState) {
        try {
          callback(currentState);
        } catch (error) {
          console.error('[HIVE SDK] Error in initial state callback:', error);
        }
      }

      // Return unsubscribe function
      return function unsubscribe() {
        stateChangeCallbacks.delete(callback);
      };
    },

    /**
     * Get input data from connected element
     * @param inputId - Input port identifier
     */
    getInput: function(inputId) {
      return sendMessage({
        type: 'get_input',
        inputId: inputId
      }, true);
    },

    /**
     * Emit output data to connected elements
     * @param outputId - Output port identifier
     * @param data - Data to emit
     */
    emitOutput: function(outputId, data) {
      return sendMessage({
        type: 'emit_output',
        outputId: outputId,
        data: data
      }, false);
    },

    /**
     * Get current user and space context
     */
    getContext: function() {
      if (currentContext) {
        return Promise.resolve(currentContext);
      }
      return sendMessage({ type: 'get_context' }, true);
    },

    /**
     * Show a toast notification
     * @param message - Notification message
     * @param type - Notification type
     */
    notify: function(message, type) {
      return sendMessage({
        type: 'notify',
        message: message,
        notifyType: type || 'info'
      }, false);
    },

    /**
     * Log to parent console (for debugging)
     */
    log: function(...args) {
      sendMessage({
        type: 'log',
        args: args
      }, false);
      // Also log locally
      console.log('[Custom Block]', ...args);
    },

    /**
     * Error logging
     */
    error: function(...args) {
      sendMessage({
        type: 'log',
        level: 'error',
        args: args
      }, false);
      console.error('[Custom Block]', ...args);
    },

    /**
     * Create a post in the space feed
     * @param options - { content: string, postType?: 'text' | 'tool_output' }
     */
    createPost: function(options) {
      if (!options || typeof options.content !== 'string' || !options.content.trim()) {
        return Promise.reject(new Error('content is required'));
      }
      if (options.content.length > 2000) {
        return Promise.reject(new Error('content must be under 2000 characters'));
      }
      return sendMessage({
        type: 'create_post',
        content: options.content.trim(),
        postType: options.postType || 'tool_output'
      }, true);
    },

    /**
     * Get members of the current space
     * @param options - { limit?: number, cursor?: string }
     */
    getMembers: function(options) {
      var opts = options || {};
      var limit = Math.min(Math.max(opts.limit || 20, 1), 50);
      return sendMessage({
        type: 'get_members',
        limit: limit,
        cursor: opts.cursor || null
      }, true);
    }
  };

  // ============================================================
  // Runtime Context (preloaded, no async round-trip needed)
  // ============================================================

  window.HIVE_RUNTIME = currentContext;

  // ============================================================
  // Initialization
  // ============================================================

  // Signal ready after DOM loaded
  function signalReady() {
    window.HIVE.ready = true;
    sendMessage({ type: 'ready' }, false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', signalReady);
  } else {
    signalReady();
  }

  // Cleanup on unload
  window.addEventListener('beforeunload', function() {
    window.removeEventListener('message', handleParentMessage);
    stateChangeCallbacks.clear();
    pendingRequests.forEach(request => {
      clearTimeout(request.timeout);
      request.reject(new Error('Window unloading'));
    });
    pendingRequests.clear();
  });

})();
`.trim();
}

/**
 * TypeScript type definitions for HIVE SDK
 * Used for documentation and type checking
 */
export interface HIVESDKInterface {
  version: string;
  instanceId: string;
  ready: boolean;
  getState(): Promise<BlockState>;
  setState(updates: Partial<BlockState>): Promise<void>;
  executeAction(actionId: string, payload?: unknown): Promise<ActionResult>;
  onStateChange(callback: (state: BlockState) => void): () => void;
  getInput(inputId: string): Promise<unknown>;
  emitOutput(outputId: string, data: unknown): Promise<void>;
  getContext(): Promise<BlockContext>;
  notify(message: string, type?: 'success' | 'error' | 'info'): void;
  log(...args: unknown[]): void;
  error(...args: unknown[]): void;
  createPost(options: { content: string; postType?: 'text' | 'tool_output' }): Promise<{ postId: string }>;
  getMembers(options?: { limit?: number; cursor?: string }): Promise<{ members: Array<{ id: string; name: string; avatar: string | null; role: string; isOnline: boolean }>; hasMore: boolean }>;
}

/**
 * Validate message from iframe
 */
export function validateIframeMessage(event: MessageEvent): boolean {
  // Must have data
  if (!event.data) return false;

  // Must be from our iframe
  if (event.data.source !== 'hive-iframe') return false;

  // Must have instance ID
  if (!event.data.instanceId) return false;

  // Must have payload
  if (!event.data.payload) return false;

  return true;
}

/**
 * Validate message from parent
 */
export function validateParentMessage(event: MessageEvent): boolean {
  // Must have data
  if (!event.data) return false;

  // Must be from parent
  if (event.data.source !== 'hive-parent') return false;

  // Must have payload
  if (!event.data.payload) return false;

  return true;
}

/**
 * Create message envelope for parent → iframe
 */
export function createParentMessage(payload: ParentMessage) {
  return {
    source: 'hive-parent' as const,
    timestamp: Date.now(),
    payload,
  };
}

/**
 * Extract payload from iframe message
 */
export function extractIframePayload(event: MessageEvent): IframeMessage | null {
  if (!validateIframeMessage(event)) return null;
  return event.data.payload as IframeMessage;
}
