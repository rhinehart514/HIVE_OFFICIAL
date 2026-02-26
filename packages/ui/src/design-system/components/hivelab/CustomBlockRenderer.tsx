'use client';

/**
 * Custom Block Renderer
 *
 * Phase 5: Sandboxed iframe renderer for AI-generated HTML/CSS/JS components
 *
 * Architecture:
 * - Renders custom blocks in isolated iframes with strict CSP
 * - No network access, no localStorage, no parent DOM access
 * - Communication via postMessage bridge only
 * - Auto-injects HIVE design tokens (CSS variables + utility classes)
 * - Handles loading, error, and ready states
 *
 * Security:
 * - sandbox="allow-scripts" only
 * - CSP prevents all network requests and dangerous APIs
 * - Code validated before rendering
 * - postMessage origin validation
 */

import * as React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { springPresets } from '@hive/tokens';
import type { CustomBlockConfig, BlockContext } from '@hive/core';
import {
  generateHiveSDK,
  validateIframeMessage,
  createParentMessage,
  extractIframePayload,
} from '../../../lib/hivelab/hive-sdk';
import { buildCSPPolicy } from '../../../lib/hivelab/csp-builder';

// ============================================================
// Types
// ============================================================

export interface CustomBlockRendererProps {
  /** Unique instance ID for this block */
  instanceId: string;

  /** Custom block configuration */
  config: CustomBlockConfig;

  /** Initial state for the block */
  initialState?: {
    personal: Record<string, unknown>;
    shared: Record<string, unknown>;
  };

  /** User and space context */
  context?: BlockContext;

  /** Callback when block is ready */
  onReady?: () => void;

  /** Callback for postMessage communication */
  onMessage?: (message: any) => void;

  /** Callback for errors */
  onError?: (error: Error) => void;

  /** Size constraints */
  width?: number;
  height?: number;

  /** Runtime mode */
  mode?: 'runtime' | 'preview';

  /** Ref to expose sendMessage method */
  messageRef?: React.MutableRefObject<((message: any) => void) | null>;
}

type LoadingState = 'loading' | 'ready' | 'error';

// ============================================================
// Custom Block Renderer Component
// ============================================================

export function CustomBlockRenderer({
  instanceId,
  config,
  initialState,
  context,
  onReady,
  onMessage,
  onError,
  width,
  height,
  mode = 'runtime',
  messageRef,
}: CustomBlockRendererProps) {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [loadingState, setLoadingState] = React.useState<LoadingState>('loading');
  const [error, setError] = React.useState<string | null>(null);

  // Method to send messages to iframe
  const sendToIframe = React.useCallback((message: any) => {
    if (iframeRef.current?.contentWindow && loadingState === 'ready') {
      const wrappedMessage = createParentMessage(message);
      iframeRef.current.contentWindow.postMessage(wrappedMessage, '*');
    }
  }, [loadingState]);

  // Expose sendToIframe via ref
  React.useEffect(() => {
    if (messageRef) {
      messageRef.current = sendToIframe;
    }
  }, [messageRef, sendToIframe]);

  // Build iframe source document
  const iframeDocument = React.useMemo(() => {
    return buildIframeDocument(config, instanceId);
  }, [config, instanceId]);

  // Handle messages from iframe
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin (same origin for srcdoc)
      if (event.source !== iframeRef.current?.contentWindow) {
        return;
      }

      // Validate message structure
      if (!validateIframeMessage(event)) {
        console.warn('[CustomBlockRenderer] Invalid message from iframe:', event.data);
        return;
      }

      // Extract payload
      const payload = extractIframePayload(event);
      if (!payload) return;

      // Verify instance ID matches
      if (event.data.instanceId !== instanceId) {
        console.warn('[CustomBlockRenderer] Instance ID mismatch:', event.data.instanceId, 'expected:', instanceId);
        return;
      }

      // Handle ready message
      if (payload.type === 'ready') {
        setLoadingState('ready');
        onReady?.();
        return;
      }

      // Handle error message (from raw iframe postMessage, not typed in IframeMessage union)
      if ((payload as { type: string }).type === 'error') {
        setLoadingState('error');
        const errorMsg = (payload as any).error || 'Unknown error in custom block';
        setError(errorMsg);
        onError?.(new Error(errorMsg));
        return;
      }

      // Forward all other messages to parent with validated payload
      onMessage?.(payload);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [instanceId, onReady, onMessage, onError]);

  // Send initial state when iframe is ready
  React.useEffect(() => {
    if (loadingState === 'ready' && initialState && iframeRef.current?.contentWindow) {
      sendToIframe({
        type: 'state_update',
        state: initialState,
      });
    }
  }, [loadingState, initialState, sendToIframe]);

  // Send context when iframe is ready
  React.useEffect(() => {
    if (loadingState === 'ready' && context && iframeRef.current?.contentWindow) {
      sendToIframe({
        type: 'context_update',
        context: context,
      });
    }
  }, [loadingState, context, sendToIframe]);

  // Handle iframe load errors
  const handleIframeError = () => {
    setLoadingState('error');
    setError('Failed to load custom block');
    onError?.(new Error('Failed to load custom block'));
  };

  return (
    <div
      className="relative rounded-lg overflow-hidden bg-surface"
      style={{
        width: width || '100%',
        height: height || 300,
      }}
    >
      {/* Loading overlay */}
      <AnimatePresence>
        {loadingState === 'loading' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-surface/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={springPresets.gentle}
              className="text-center"
            >
              <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading custom block...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error overlay */}
      <AnimatePresence>
        {loadingState === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={springPresets.snappy}
            className="absolute inset-0 z-10 flex items-center justify-center bg-surface p-4"
          >
            <div className="text-center max-w-sm">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, ...springPresets.bouncy }}
                className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3"
              >
                <AlertCircle className="h-6 w-6 text-destructive" />
              </motion.div>
              <p className="font-medium text-foreground mb-1">Custom block error</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sandboxed iframe */}
      <iframe
        ref={iframeRef}
        sandbox="allow-scripts"
        srcDoc={iframeDocument}
        onError={handleIframeError}
        className="w-full h-full border-0"
        title={`Custom block: ${config.metadata.name}`}
        style={{
          colorScheme: 'light dark',
        }}
      />
    </div>
  );
}

// ============================================================
// Iframe Document Builder
// ============================================================

/**
 * Generate HIVE design tokens as CSS custom properties
 * Injects all core tokens from @hive/tokens for use in custom blocks
 *
 * Available tokens:
 * - Colors: --hive-color-*, --hive-gray-*, --hive-bg-*, --hive-text-*, --hive-border-*
 * - Spacing: --hive-spacing-{1,2,3,4,5,6,8,10,12,16,20,24}
 * - Radius: --hive-radius-{sm,md,lg,xl,2xl,full}
 * - Typography: --hive-font-size-*, --hive-font-weight-*, --hive-line-height-*
 * - Shadows: --hive-shadow-{sm,md,lg,gold-glow}
 * - Motion: --hive-duration-*, --hive-ease-*
 *
 * Utility classes:
 * - .hive-btn, .hive-btn-primary, .hive-btn-secondary
 * - .hive-card
 * - .hive-input
 * - .hive-text-{primary,secondary,tertiary}
 */
function generateDesignTokensCSS(): string {
  return `
    :root {
      /* Colors - Foundation */
      --hive-color-black: #000000;
      --hive-color-white: #FFFFFF;
      --hive-color-gold: #FFD700;
      --hive-color-gold-hover: #FFE44D;
      --hive-color-gold-active: #E6C200;

      /* Colors - Grayscale */
      --hive-gray-50: #FAFAFA;
      --hive-gray-100: #F5F5F5;
      --hive-gray-200: #E5E5E5;
      --hive-gray-300: #D4D4D4;
      --hive-gray-400: #A3A3A3;
      --hive-gray-500: #737373;
      --hive-gray-600: #525252;
      --hive-gray-700: #404040;
      --hive-gray-800: #262626;
      --hive-gray-900: #171717;
      --hive-gray-950: #0A0A0A;

      /* Semantic - Backgrounds */
      --hive-bg-ground: #000000;
      --hive-bg-surface: rgba(255, 255, 255, 0.04);
      --hive-bg-surface-hover: rgba(255, 255, 255, 0.06);
      --hive-bg-surface-active: rgba(255, 255, 255, 0.08);

      /* Semantic - Text */
      --hive-text-primary: #FFFFFF;
      --hive-text-secondary: rgba(255, 255, 255, 0.7);
      --hive-text-tertiary: rgba(255, 255, 255, 0.5);
      --hive-text-disabled: rgba(255, 255, 255, 0.3);

      /* Semantic - Borders */
      --hive-border-default: rgba(255, 255, 255, 0.06);
      --hive-border-subtle: rgba(255, 255, 255, 0.04);
      --hive-border-hover: rgba(255, 255, 255, 0.12);
      --hive-border-focus: rgba(255, 215, 0, 0.4);

      /* Spacing */
      --hive-spacing-1: 0.25rem;
      --hive-spacing-2: 0.5rem;
      --hive-spacing-3: 0.75rem;
      --hive-spacing-4: 1rem;
      --hive-spacing-5: 1.25rem;
      --hive-spacing-6: 1.5rem;
      --hive-spacing-8: 2rem;
      --hive-spacing-10: 2.5rem;
      --hive-spacing-12: 3rem;
      --hive-spacing-16: 4rem;
      --hive-spacing-20: 5rem;
      --hive-spacing-24: 6rem;

      /* Border Radius */
      --hive-radius-sm: 0.375rem;
      --hive-radius-md: 0.5rem;
      --hive-radius-lg: 0.75rem;
      --hive-radius-xl: 1rem;
      --hive-radius-2xl: 1.5rem;
      --hive-radius-full: 9999px;

      /* Typography */
      --hive-font-size-xs: 0.75rem;
      --hive-font-size-sm: 0.875rem;
      --hive-font-size-base: 1rem;
      --hive-font-size-lg: 1.125rem;
      --hive-font-size-xl: 1.25rem;
      --hive-font-size-2xl: 1.5rem;
      --hive-font-size-3xl: 1.875rem;
      --hive-font-size-4xl: 2.25rem;

      --hive-font-weight-normal: 400;
      --hive-font-weight-medium: 500;
      --hive-font-weight-semibold: 600;
      --hive-font-weight-bold: 700;

      --hive-line-height-tight: 1.25;
      --hive-line-height-normal: 1.5;
      --hive-line-height-relaxed: 1.75;

      /* Shadows */
      --hive-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
      --hive-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
      --hive-shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
      --hive-shadow-gold-glow: 0 0 20px rgba(255, 215, 0, 0.15);

      /* Motion */
      --hive-duration-fast: 150ms;
      --hive-duration-base: 250ms;
      --hive-duration-slow: 350ms;

      --hive-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
      --hive-ease-out: cubic-bezier(0, 0, 0.2, 1);
      --hive-ease-in: cubic-bezier(0.4, 0, 1, 1);
    }

    /* Utility Classes */
    .hive-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: var(--hive-spacing-2) var(--hive-spacing-4);
      font-size: var(--hive-font-size-sm);
      font-weight: var(--hive-font-weight-medium);
      border-radius: var(--hive-radius-lg);
      border: 1px solid transparent;
      transition: all var(--hive-duration-base) var(--hive-ease-in-out);
      cursor: pointer;
      user-select: none;
    }

    .hive-btn-primary {
      background: var(--hive-color-gold);
      color: var(--hive-color-black);
    }

    .hive-btn-primary:hover {
      background: var(--hive-color-gold-hover);
      box-shadow: var(--hive-shadow-gold-glow);
    }

    .hive-btn-secondary {
      background: var(--hive-bg-surface);
      color: var(--hive-text-primary);
      border-color: var(--hive-border-default);
    }

    .hive-btn-secondary:hover {
      background: var(--hive-bg-surface-hover);
      border-color: var(--hive-border-hover);
    }

    .hive-card {
      background: var(--hive-bg-surface);
      border: 1px solid var(--hive-border-default);
      border-radius: var(--hive-radius-2xl);
      padding: var(--hive-spacing-4);
    }

    .hive-input {
      width: 100%;
      padding: var(--hive-spacing-3) var(--hive-spacing-4);
      background: var(--hive-bg-surface);
      border: 1px solid var(--hive-border-default);
      border-radius: var(--hive-radius-lg);
      color: var(--hive-text-primary);
      font-size: var(--hive-font-size-base);
      transition: all var(--hive-duration-base) var(--hive-ease-in-out);
    }

    .hive-input:hover {
      border-color: var(--hive-border-hover);
    }

    .hive-input:focus {
      outline: none;
      border-color: var(--hive-border-focus);
      box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.1);
    }

    .hive-text-primary {
      color: var(--hive-text-primary);
    }

    .hive-text-secondary {
      color: var(--hive-text-secondary);
    }

    .hive-text-tertiary {
      color: var(--hive-text-tertiary);
    }
  `.trim();
}

/**
 * Build the complete iframe HTML document
 */
function buildIframeDocument(config: CustomBlockConfig, instanceId: string): string {
  const { code, csp } = config;

  // Build CSP header
  const cspPolicy = buildCSPPolicy(csp);

  // Inject HIVE design tokens
  const designTokensCSS = generateDesignTokensCSS();

  // Escape HTML/CSS/JS for safe injection
  const escapedHTML = escapeHTML(code.html);
  const escapedCSS = code.css;
  const escapedJS = code.js;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="${cspPolicy}">
  <title>${escapeHTML(config.metadata.name)}</title>

  <!-- HIVE Design Tokens -->
  <style id="hive-tokens">
    ${designTokensCSS}
  </style>

  <!-- Custom Block Styles -->
  <style id="block-styles">
    /* Reset */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: system-ui, -apple-system, sans-serif;
      overflow: auto;
    }

    /* Custom styles */
    ${escapedCSS}
  </style>
</head>
<body>
  <!-- Custom Block HTML -->
  <div id="hive-custom-block" data-instance-id="${instanceId}">
    ${escapedHTML}
  </div>

  <!-- HIVE SDK -->
  <script id="hive-sdk">
    ${generateHiveSDK(instanceId)}
  </script>

  <!-- Custom Block JavaScript -->
  <script id="block-script">
    (function() {
      'use strict';

      try {
        ${escapedJS}
      } catch (error) {
        window.parent.postMessage({
          type: 'error',
          instanceId: '${instanceId}',
          error: error.message,
          stack: error.stack
        }, '*');
      }
    })();
  </script>
</body>
</html>`;
}

// ============================================================
// Helper Functions
// ============================================================

// CSP policy builder moved to ../../lib/hivelab/csp-builder.ts

/**
 * Sanitize HTML to prevent XSS attacks in custom blocks.
 * Allows structural/styling HTML but strips scripts, event handlers, and dangerous elements.
 */
import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'a', 'b', 'i', 'em', 'strong', 'code', 'pre', 'br', 'hr',
  'img', 'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon',
  'section', 'article', 'header', 'footer', 'nav', 'main', 'aside',
  'details', 'summary', 'figure', 'figcaption', 'blockquote', 'label',
  'input', 'select', 'option', 'textarea', 'button',
];

const ALLOWED_ATTR = [
  'class', 'style', 'id', 'data-*',
  'href', 'target', 'rel',
  'src', 'alt', 'width', 'height', 'loading',
  'viewBox', 'fill', 'stroke', 'stroke-width', 'd', 'cx', 'cy', 'r', 'x', 'y',
  'type', 'value', 'placeholder', 'disabled', 'checked', 'name', 'for',
  'role', 'aria-label', 'aria-hidden', 'tabindex',
];

function escapeHTML(html: string): string {
  if (typeof window === 'undefined') {
    // SSR fallback: strip all tags
    return html.replace(/<[^>]*>/g, '');
  }
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'meta', 'link', 'base'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onsubmit', 'onchange', 'oninput', 'onkeydown', 'onkeyup', 'onkeypress'],
    ALLOW_DATA_ATTR: true,
  });
}

export default CustomBlockRenderer;
