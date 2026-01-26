'use client';

/**
 * WidgetPicker - Panel for showing/adding hidden widgets
 *
 * Shows a bottom sheet with all hidden widgets that can be toggled on.
 * Apple-style glass panel with widget previews.
 *
 * @version 1.0.0
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WidgetConfig } from '@hive/core';
import { EASE_PREMIUM } from '@hive/ui';
import { WIDGET_METADATA } from '../hooks/use-bento-grid';

// LOCKED: Premium easing
const EASE = EASE_PREMIUM;

interface WidgetPickerProps {
  isOpen: boolean;
  hiddenWidgets: WidgetConfig[];
  onToggleWidget: (widgetId: string) => void;
  onClose: () => void;
}

export function WidgetPicker({
  isOpen,
  hiddenWidgets,
  onToggleWidget,
  onClose,
}: WidgetPickerProps) {
  // Close on escape
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter to only show main widget types (not legacy)
  const mainWidgetTypes = ['identity', 'heatmap', 'spaces', 'tools', 'connections', 'interests', 'stats', 'featuredTool'];
  const filteredWidgets = hiddenWidgets.filter((w) => mainWidgetTypes.includes(w.type));

  if (filteredWidgets.length === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 p-6 pb-8"
            style={{
              backgroundColor: 'rgba(18, 18, 18, 0.98)',
              backdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px 24px 0 0',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3
                  className="text-lg font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Hidden Widgets
                </h3>
                <p
                  className="text-sm mt-0.5"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Tap to add to your profile
                </p>
              </div>

              <motion.button
                onClick={onClose}
                className="p-2 rounded-full"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                }}
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                whileTap={{ opacity: 0.8 }}
                aria-label="Close"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </motion.button>
            </div>

            {/* Widget grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredWidgets.map((widget) => {
                const metadata = WIDGET_METADATA[widget.type];

                return (
                  <motion.button
                    key={widget.id}
                    onClick={() => onToggleWidget(widget.id)}
                    className="flex flex-col items-start p-4 rounded-2xl text-left"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                    whileHover={{
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      borderColor: 'rgba(255, 255, 255, 0.12)',
                    }}
                    whileTap={{ opacity: 0.8 }}
                  >
                    {/* Widget preview icon */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      {widget.type === 'identity' && <span className="text-xl">👤</span>}
                      {widget.type === 'heatmap' && <span className="text-xl">📊</span>}
                      {widget.type === 'spaces' && <span className="text-xl">🏠</span>}
                      {widget.type === 'tools' && <span className="text-xl">🛠️</span>}
                      {widget.type === 'connections' && <span className="text-xl">👥</span>}
                      {widget.type === 'interests' && <span className="text-xl">💡</span>}
                      {widget.type === 'stats' && <span className="text-xl">📈</span>}
                      {widget.type === 'featuredTool' && <span className="text-xl">⭐</span>}
                    </div>

                    <span
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {metadata?.label || widget.type}
                    </span>
                    <span
                      className="text-xs mt-0.5 line-clamp-2"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {metadata?.description}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default WidgetPicker;
