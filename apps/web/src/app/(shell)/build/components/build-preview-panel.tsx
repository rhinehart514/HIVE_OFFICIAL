'use client';

import { Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { MOTION } from '@hive/tokens';
import { BrandSpinner } from '@hive/ui';

import type { BuildState } from '@/hooks/use-build-machine';
import { isNativeFormat } from '@/lib/shells';
import type { ShellFormat } from '@/lib/shells/types';
import { PreviewErrorBoundary } from './preview-error-boundary';
import { CodePreview } from './code-preview';
import { IdleInspiration } from './idle-inspiration';

const ShellRenderer = lazy(() => import('@/components/shells/ShellRenderer'));
const EASE = MOTION.ease.premium;

export function BuildPreviewPanel({
  state,
  showPreview,
  onReset,
}: {
  state: BuildState;
  showPreview: boolean;
  onReset: () => void;
}) {
  const shellFormat = state.classification?.format;
  const isShellFormat = shellFormat && isNativeFormat(shellFormat);
  const isShellMatched = state.phase === 'shell-matched' && isShellFormat;

  return (
    <div className="flex-1 flex flex-col min-h-[50vh] lg:min-h-0 bg-white/[0.03]">
      <AnimatePresence mode="wait">
        {!showPreview ? (
          <IdleInspiration key="inspiration" />
        ) : isShellMatched || (isShellFormat && state.phase === 'complete') ? (
          <ShellPreview shellFormat={shellFormat!} shellConfig={state.shellConfig} />
        ) : (state.phase === 'generating' || state.phase === 'complete') ? (
          <motion.div
            key="code-preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col rounded-2xl overflow-hidden m-3 lg:m-4
              border border-white/[0.06] bg-[#0a0a0a]"
          >
            <CodePreview
              status={state.phase === 'generating' ? state.streamingStatus : ''}
              codeOutput={state.codeOutput}
            />
          </motion.div>
        ) : state.phase === 'classifying' ? (
          <motion.div
            key="classifying"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="text-center">
              <BrandSpinner size="md" variant="gold" />
              <p className="text-xs text-white/30 mt-4">Understanding your idea...</p>
            </div>
          </motion.div>
        ) : state.phase === 'error' ? (
          <ErrorPanel onReset={onReset} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ShellPreview({
  shellFormat,
  shellConfig,
}: {
  shellFormat: ShellFormat;
  shellConfig: BuildState['shellConfig'];
}) {
  return (
    <motion.div
      key="shell-preview"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25, ease: EASE }}
      className="flex-1 flex items-start justify-center px-6 pt-12 lg:pt-16"
    >
      <div className="w-full max-w-md">
        <PreviewErrorBoundary>
          <Suspense fallback={<div className="h-48 rounded-2xl bg-white/[0.03] animate-pulse" />}>
            <ShellRenderer
              format={shellFormat}
              shellId="preview"
              config={shellConfig}
              state={null}
              currentUserId="preview-user"
              creatorId="preview-user"
              isCreator={true}
              onAction={() => {}}
              compact={false}
            />
          </Suspense>
        </PreviewErrorBoundary>
      </div>
    </motion.div>
  );
}

function ErrorPanel({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      key="error"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex items-center justify-center px-8"
    >
      <div className="text-center max-w-xs">
        <div className="w-12 h-12 rounded-full bg-red-400/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-red-400 text-lg">!</span>
        </div>
        <p className="text-sm text-white/50 mb-2">Something went wrong</p>
        <p className="text-xs text-white/30 mb-4">
          Try a simpler prompt, or try again in a moment.
        </p>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-sm font-medium text-white hover:bg-white/[0.04] transition-colors duration-100"
        >
          <RotateCcw className="w-4 h-4" />
          Try again
        </button>
      </div>
    </motion.div>
  );
}
