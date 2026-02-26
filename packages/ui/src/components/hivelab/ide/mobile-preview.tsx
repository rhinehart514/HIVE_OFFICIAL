'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Monitor } from 'lucide-react';
import { ELEMENT_RENDERERS } from '../elements/registry';
import type { CanvasElement } from './types';

interface MobilePreviewProps {
  toolName: string;
  toolDescription: string;
  elements: CanvasElement[];
  onBack: () => void;
}

/**
 * Mobile read-only preview for HiveLab tools.
 * Shows tool elements in a scrollable single-column layout.
 * No editing, no drag-drop — just viewing.
 */
export function MobilePreview({ toolName, toolDescription, elements, onBack }: MobilePreviewProps) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--hivelab-bg, #0A0A0A)' }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b"
        style={{
          backgroundColor: 'var(--hivelab-bg, #0A0A0A)',
          borderColor: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg transition-colors"
          style={{ color: 'var(--hivelab-text-secondary, #8A8A8A)' }}
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1
            className="text-base font-semibold truncate"
            style={{ color: 'var(--hivelab-text-primary, #FAF9F7)' }}
          >
            {toolName || 'Untitled Tool'}
          </h1>
          {toolDescription && (
            <p
              className="text-xs truncate mt-0.5"
              style={{ color: 'var(--hivelab-text-secondary, #8A8A8A)' }}
            >
              {toolDescription}
            </p>
          )}
        </div>
      </div>

      {/* Elements — single column, read-only */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {elements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: 'var(--hivelab-surface, #1A1A1A)' }}
            >
              <Monitor
                className="w-6 h-6"
                style={{ color: 'var(--life-gold, #D4AF37)' }}
              />
            </div>
            <p
              className="text-sm"
              style={{ color: 'var(--hivelab-text-secondary, #8A8A8A)' }}
            >
              This tool has no elements yet
            </p>
          </div>
        ) : (
          elements.map((element, index) => {
            const Renderer = ELEMENT_RENDERERS[element.elementId];
            return (
              <motion.div
                key={element.id || element.instanceId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.3 }}
                className="rounded-xl overflow-hidden border"
                style={{
                  backgroundColor: 'var(--hivelab-surface, #1A1A1A)',
                  borderColor: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
                }}
              >
                {Renderer ? (
                  <div className="p-3 pointer-events-none">
                    <Renderer
                      id={element.instanceId}
                      config={element.config || {}}
                    />
                  </div>
                ) : (
                  <div className="p-3">
                    <p
                      className="text-xs"
                      style={{ color: 'var(--hivelab-text-secondary, #8A8A8A)' }}
                    >
                      {element.elementId}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Bottom bar — desktop edit nudge */}
      <div
        className="sticky bottom-0 flex items-center justify-center gap-2 px-4 py-3 border-t"
        style={{
          backgroundColor: 'var(--hivelab-bg, #0A0A0A)',
          borderColor: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
        }}
      >
        <Monitor
          className="h-3.5 w-3.5"
          style={{ color: 'var(--hivelab-text-secondary, #8A8A8A)' }}
        />
        <span
          className="text-xs"
          style={{ color: 'var(--hivelab-text-secondary, #8A8A8A)' }}
        >
          Open on desktop to edit
        </span>
      </div>
    </div>
  );
}
