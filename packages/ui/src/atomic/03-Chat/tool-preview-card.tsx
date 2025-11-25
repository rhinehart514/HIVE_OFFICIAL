'use client';

/**
 * ToolPreviewCard - Live tool preview panel
 *
 * Features:
 * - Embeds StreamingCanvasView for live preview
 * - Shows tool as it's being built
 * - Clean, minimal frame
 * - Responsive (collapses to bottom sheet on mobile)
 * - Deploy/Edit CTAs when complete
 */

import { motion } from 'framer-motion';
import { Rocket, Edit3, Loader2, Smartphone, Tablet, Monitor, Code2 } from 'lucide-react';
import React, { useState } from 'react';
import { durationSeconds } from '@hive/tokens';

import { cn } from '../../lib/utils';
import { Button } from '../00-Global/atoms/button';

export interface ToolPreviewCardProps {
  /** Tool name */
  toolName?: string;

  /** Tool description */
  toolDescription?: string;

  /** Is tool currently being generated? */
  isGenerating?: boolean;

  /** Is tool complete and ready to deploy? */
  isComplete?: boolean;

  /** Canvas/preview content */
  children: React.ReactNode;

  /** Deploy callback */
  onDeploy?: () => void;

  /** Edit callback */
  onEdit?: () => void;

  /** Tool composition data (for code view) */
  composition?: any;

  /** Additional CSS classes */
  className?: string;
}

/**
 * ToolPreviewCard Component
 *
 * Right-panel preview for split-view chat interface:
 * - Shows tool building in real-time
 * - Clean, minimal frame
 * - CTAs appear when complete
 * - Mobile-responsive
 */
export function ToolPreviewCard({
  toolName,
  toolDescription,
  isGenerating = false,
  isComplete = false,
  children,
  onDeploy,
  onEdit,
  composition,
  className
}: ToolPreviewCardProps) {
  const hasToolInfo = toolName || toolDescription;
  const [deviceWidth, setDeviceWidth] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [showCode, setShowCode] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: durationSeconds.standard, delay: durationSeconds.micro }}
      className={cn(
        'flex flex-col h-full',
        'border-l border-white/[0.08]',
        'bg-black',
        className
      )}
    >
      {/* Header */}
      {hasToolInfo && (
        <div className="shrink-0 px-6 py-4 border-b border-white/[0.08]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {toolName && (
                <h3 className="text-base font-medium text-white tracking-tight truncate">
                  {toolName}
                </h3>
              )}
              {toolDescription && (
                <p className="text-[15px] text-white/50 mt-0.5 line-clamp-2 leading-relaxed">
                  {toolDescription}
                </p>
              )}
            </div>

            {isGenerating && (
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Building...</span>
              </div>
            )}
          </div>

          {/* Actions (shown when complete) */}
          {isComplete && (
            <div className="flex gap-2 mt-4">
              <Button
                onClick={onDeploy}
                size="sm"
                className="gap-2 bg-[var(--hive-gold-cta)] hover:brightness-110 text-black"
              >
                <Rocket className="h-3.5 w-3.5" />
                Deploy to your org
              </Button>
              <Button
                onClick={onEdit}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Preview Controls */}
      {hasToolInfo && (
        <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-3 border-b border-white/[0.08] bg-white/[0.01]">
          {/* Device Width Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.08]">
            <button
              onClick={() => setDeviceWidth('mobile')}
              className={cn(
                'p-2 rounded transition-all duration-200',
                'hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-white/20',
                deviceWidth === 'mobile'
                  ? 'bg-white/[0.12] text-white'
                  : 'text-white/40 hover:text-white/70'
              )}
              aria-label="Mobile view (375px)"
              title="Mobile (375px)"
            >
              <Smartphone className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeviceWidth('tablet')}
              className={cn(
                'p-2 rounded transition-all duration-200',
                'hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-white/20',
                deviceWidth === 'tablet'
                  ? 'bg-white/[0.12] text-white'
                  : 'text-white/40 hover:text-white/70'
              )}
              aria-label="Tablet view (768px)"
              title="Tablet (768px)"
            >
              <Tablet className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeviceWidth('desktop')}
              className={cn(
                'p-2 rounded transition-all duration-200',
                'hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-white/20',
                deviceWidth === 'desktop'
                  ? 'bg-white/[0.12] text-white'
                  : 'text-white/40 hover:text-white/70'
              )}
              aria-label="Desktop view (full width)"
              title="Desktop (full width)"
            >
              <Monitor className="h-4 w-4" />
            </button>
          </div>

          {/* Width Label */}
          <div className="text-xs text-white/30 font-mono">
            {deviceWidth === 'mobile' && '375px'}
            {deviceWidth === 'tablet' && '768px'}
            {deviceWidth === 'desktop' && 'Full width'}
          </div>

          {/* View Code Toggle */}
          <button
            onClick={() => setShowCode(!showCode)}
            className={cn(
              'ml-auto p-2 rounded-lg transition-all duration-200',
              'border border-white/[0.08] hover:border-white/[0.15]',
              'focus:outline-none focus:ring-2 focus:ring-white/20',
              showCode
                ? 'bg-[var(--hive-gold-cta)]/10 text-[var(--hive-gold-cta)] border-[var(--hive-gold-cta)]/30'
                : 'bg-white/[0.03] text-white/40 hover:text-white/70 hover:bg-white/[0.06]'
            )}
            aria-label={showCode ? 'Hide code' : 'View code'}
            title={showCode ? 'Hide code' : 'View code'}
          >
            <Code2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Preview Content */}
      <div className="flex-1 overflow-auto">
        {showCode ? (
          /* Code View */
          <div className="h-full p-6">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-medium text-white/60">Tool Composition</h4>
              <span className="text-xs text-white/30 font-mono">JSON</span>
            </div>
            <pre className="text-[13px] leading-relaxed text-white/70 font-mono bg-white/[0.02] rounded-lg p-4 overflow-auto border border-white/[0.08] max-h-[calc(100vh-300px)]">
              <code>
                {JSON.stringify(
                  composition || {
                    name: toolName,
                    description: toolDescription,
                    status: isGenerating ? 'generating' : isComplete ? 'complete' : 'idle',
                    elements: [],
                    connections: []
                  },
                  null,
                  2
                )}
              </code>
            </pre>
          </div>
        ) : (
          /* Canvas Preview with Device Width Constraints */
          <div className="h-full flex items-start justify-center p-6">
            <div
              className={cn(
                'w-full transition-all duration-300',
                deviceWidth === 'mobile' && 'max-w-[375px]',
                deviceWidth === 'tablet' && 'max-w-[768px]',
                deviceWidth === 'desktop' && 'max-w-full'
              )}
              style={{
                margin: deviceWidth !== 'desktop' ? '0 auto' : undefined
              }}
            >
              {children}
            </div>
          </div>
        )}
      </div>

      {/* Empty state */}
      {!hasToolInfo && !isGenerating && (
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="text-center max-w-sm space-y-4">
            <div className="mx-auto w-16 h-16 rounded-xl bg-gradient-to-br from-[var(--hive-gold-cta)]/20 to-transparent flex items-center justify-center mb-2">
              <svg className="w-8 h-8 text-[var(--hive-gold-cta)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white tracking-tight">
              Watch your tool build in real-time
            </h3>
            <p className="text-sm text-white/50 leading-relaxed">
              Send a message or pick a prompt to see AI build your tool live
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

/**
 * MobilePreviewSheet - Collapsible bottom sheet for mobile
 *
 * On mobile, the preview appears as an expandable sheet at the bottom
 */
export interface MobilePreviewSheetProps {
  /** Is sheet expanded? */
  isExpanded?: boolean;

  /** Toggle expansion */
  onToggle?: () => void;

  /** Preview content */
  children: React.ReactNode;

  /** Tool name for header */
  toolName?: string;

  /** Additional CSS classes */
  className?: string;
}

export function MobilePreviewSheet({
  isExpanded = false,
  onToggle,
  children,
  toolName,
  className
}: MobilePreviewSheetProps) {
  return (
    <motion.div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'bg-black border-t border-white/[0.08]',
        'lg:hidden',
        className
      )}
      initial={false}
      animate={{
        height: isExpanded ? '60vh' : '64px'
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Handle */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-4 flex items-center justify-between"
      >
        <span className="text-sm font-medium text-white/80">
          {toolName || 'Preview'}
        </span>
        <div className={cn(
          'w-8 h-1 rounded-full bg-white/20 transition-transform',
          isExpanded && 'rotate-180'
        )} />
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="h-[calc(60vh-64px)] overflow-auto">
          {children}
        </div>
      )}
    </motion.div>
  );
}
