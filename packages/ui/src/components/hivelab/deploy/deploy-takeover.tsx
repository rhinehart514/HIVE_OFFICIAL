'use client';

/**
 * DeployTakeover — Full-Screen Deployment Experience
 *
 * Per DRAMA plan:
 * Phase 1: Canvas Zoom-Out (0-600ms)
 * Phase 2: Target Selection (user interaction)
 * Phase 3: Flight Animation (800ms)
 * Phase 4: Success Recap (full screen)
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MOTION } from '../../../tokens/motion';
import { ToolCard } from './tool-card';
import { FlightAnimation } from './flight-animation';
import { SuccessRecap } from './success-recap';

const EASE = MOTION.ease.premium;

// Colors - tokens are wired in globals.css
const COLORS = {
  bg: 'var(--hivelab-bg)',
  panel: 'var(--hivelab-panel)',
  surface: 'var(--hivelab-surface)',
  border: 'var(--hivelab-border)',
  textPrimary: 'var(--hivelab-text-primary)',
  textSecondary: 'var(--hivelab-text-secondary)',
  textTertiary: 'var(--hivelab-text-tertiary)',
  gold: 'var(--life-gold)',
};

// Deployment phases
export type DeployPhase =
  | 'idle'
  | 'zooming-out'
  | 'target-selection'
  | 'flying'
  | 'success';

type DeployTarget = 'space' | 'campus';

const CAMPUS_CATEGORIES = [
  { id: 'exchange', label: 'Exchange', description: 'Buy, sell, trade, share' },
  { id: 'social', label: 'Social', description: 'Matching, connecting, competing' },
  { id: 'academic', label: 'Academic', description: 'Study groups, resources, reviews' },
  { id: 'org-tools', label: 'Org Tools', description: 'Elections, budgets, coordination' },
  { id: 'campus-life', label: 'Campus Life', description: 'Events, food, transportation' },
  { id: 'utility', label: 'Utility', description: 'Anything else useful' },
];

interface Space {
  id: string;
  name: string;
  handle: string;
  memberCount: number;
  avatarUrl?: string;
}

interface DeployTakeoverProps {
  /** Whether the takeover is open */
  isOpen: boolean;
  /** Tool being deployed */
  tool: {
    id: string;
    name: string;
    description?: string;
    elementCount: number;
  };
  /** Available spaces to deploy to */
  spaces: Space[];
  /** Loading state for spaces */
  spacesLoading?: boolean;
  /** Called when deployment is confirmed — spaceId for space, 'campus' for campus */
  onDeploy: (targetId: string, options?: { targetType?: DeployTarget; slug?: string; category?: string }) => Promise<void>;
  /** Called when takeover is closed */
  onClose: () => void;
  /** Called when user wants to view in space */
  onViewInSpace: (spaceHandle: string) => void;
}

export function DeployTakeover({
  isOpen,
  tool,
  spaces,
  spacesLoading,
  onDeploy,
  onClose,
  onViewInSpace,
}: DeployTakeoverProps) {
  const shouldReduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<DeployPhase>('idle');
  const [deployTarget, setDeployTarget] = useState<DeployTarget>('space');
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [deployedSpace, setDeployedSpace] = useState<Space | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Campus-specific fields
  const [campusSlug, setCampusSlug] = useState('');
  const [campusCategory, setCampusCategory] = useState('utility');

  // Auto-generate slug from tool name
  useEffect(() => {
    if (tool.name && !campusSlug) {
      setCampusSlug(
        tool.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 50)
      );
    }
  }, [tool.name, campusSlug]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setPhase('zooming-out');
      setSelectedSpace(null);
      setDeployedSpace(null);
      setDeployTarget('space');
      setCampusSlug(
        tool.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 50)
      );
      setCampusCategory('utility');
      setError(null);

      const timer = setTimeout(() => {
        setPhase('target-selection');
      }, shouldReduceMotion ? 0 : 600);

      return () => clearTimeout(timer);
    } else {
      setPhase('idle');
    }
  }, [isOpen, shouldReduceMotion, tool.name]);

  // Handle space selection
  const handleSpaceSelect = useCallback((space: Space) => {
    setSelectedSpace(space);
    setError(null);
  }, []);

  // Check if deploy is ready
  const canDeploy = deployTarget === 'space'
    ? !!selectedSpace
    : campusSlug.length >= 3 && /^[a-z0-9-]+$/.test(campusSlug);

  // Handle deploy confirmation
  const handleDeploy = useCallback(async () => {
    if (!canDeploy || isDeploying) return;

    setIsDeploying(true);
    setError(null);

    try {
      setPhase('flying');
      await new Promise((resolve) => setTimeout(resolve, shouldReduceMotion ? 100 : 800));

      if (deployTarget === 'campus') {
        await onDeploy('campus', { targetType: 'campus', slug: campusSlug, category: campusCategory });
        setDeployedSpace({ id: 'campus', name: 'Campus', handle: campusSlug, memberCount: 0 });
      } else {
        await onDeploy(selectedSpace!.id, { targetType: 'space' });
        setDeployedSpace(selectedSpace);
      }

      setPhase('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deployment failed');
      setPhase('target-selection');
    } finally {
      setIsDeploying(false);
    }
  }, [canDeploy, isDeploying, onDeploy, shouldReduceMotion, deployTarget, selectedSpace, campusSlug, campusCategory]);

  // Handle continue editing
  const handleContinueEditing = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle view in space
  const handleViewInSpace = useCallback(() => {
    if (deployedSpace) {
      if (deployTarget === 'campus') {
        onViewInSpace(`/campus/${deployedSpace.handle}`);
      } else {
        onViewInSpace(deployedSpace.handle);
      }
    }
  }, [deployedSpace, deployTarget, onViewInSpace]);

  // Confetti particles for success
  const confettiParticles = useMemo(() => {
    if (phase !== 'success') return [];
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      targetX: 50 + (Math.random() - 0.5) * 80,
      targetY: 50 + (Math.random() - 0.5) * 80,
      rotation: Math.random() * 360,
      delay: Math.random() * 0.3,
      size: Math.random() * 8 + 4,
      color: ['#FFD700', '#FFA500', '#FFDF00', '#DAA520'][Math.floor(Math.random() * 4)],
      isCircle: Math.random() > 0.5,
    }));
  }, [phase]);

  if (!isOpen && phase === 'idle') return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
          className="fixed inset-0 z-[100]"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
        >
          {/* Backdrop blur */}
          <div className="absolute inset-0 backdrop-blur-sm" />

          {/* Content */}
          <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
            <AnimatePresence mode="wait">
              {/* Phase 1 & 2: Zooming Out + Target Selection */}
              {(phase === 'zooming-out' || phase === 'target-selection') && (
                <motion.div
                  key="selection"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : MOTION.duration.fast,
                    ease: EASE,
                  }}
                  className="w-full max-w-lg"
                >
                  {/* Tool Card (floating in center) */}
                  <motion.div
                    initial={{ scale: shouldReduceMotion ? 1 : 0.3, y: shouldReduceMotion ? 0 : -50 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 25,
                      delay: shouldReduceMotion ? 0 : 0.2,
                    }}
                    className="mb-8"
                  >
                    <ToolCard
                      name={tool.name}
                      description={tool.description}
                      elementCount={tool.elementCount}
                    />
                  </motion.div>

                  {/* Target Selection */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: shouldReduceMotion ? 0 : MOTION.duration.fast,
                      delay: shouldReduceMotion ? 0 : 0.4,
                      ease: EASE,
                    }}
                  >
                    <h2
                      className="text-center text-lg font-semibold mb-4"
                      style={{ color: COLORS.textPrimary }}
                    >
                      Where do you want to deploy?
                    </h2>

                    {/* Deploy Target Tabs */}
                    <div className="flex gap-2 mb-4">
                      {(['space', 'campus'] as const).map((target) => (
                        <button
                          key={target}
                          type="button"
                          onClick={() => { setDeployTarget(target); setError(null); }}
                          className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 border"
                          style={{
                            backgroundColor: deployTarget === target
                              ? target === 'campus' ? `${COLORS.gold}15` : COLORS.surface
                              : 'transparent',
                            borderColor: deployTarget === target
                              ? target === 'campus' ? `${COLORS.gold}40` : 'rgba(255,255,255,0.12)'
                              : COLORS.border,
                            color: deployTarget === target ? COLORS.textPrimary : COLORS.textTertiary,
                          }}
                        >
                          {target === 'space' ? 'Space' : 'Campus'}
                          {target === 'campus' && (
                            <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${COLORS.gold}20`, color: COLORS.gold }}>
                              NEW
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Error message */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 px-4 py-2 rounded-lg text-sm text-center"
                        style={{
                          backgroundColor: 'var(--hivelab-status-error-muted)',
                          color: 'var(--hivelab-status-error)',
                          border: '1px solid var(--hivelab-status-error-muted)',
                        }}
                      >
                        {error}
                      </motion.div>
                    )}

                    {/* Campus Deploy Form */}
                    {deployTarget === 'campus' && (
                      <div className="space-y-4 p-1">
                        <div className="text-xs mb-2" style={{ color: COLORS.textTertiary }}>
                          Deploy campus-wide so any student can use it. Requires admin review.
                        </div>

                        {/* Slug */}
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>
                            Campus URL
                          </label>
                          <div className="flex items-center rounded-xl border overflow-hidden" style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface }}>
                            <span className="pl-3 text-xs shrink-0" style={{ color: COLORS.textTertiary }}>/campus/</span>
                            <input
                              type="text"
                              value={campusSlug}
                              onChange={(e) => setCampusSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 50))}
                              className="flex-1 bg-transparent text-sm py-2.5 pr-3 outline-none"
                              style={{ color: COLORS.textPrimary }}
                              placeholder="my-tool"
                            />
                          </div>
                          {campusSlug && campusSlug.length < 3 && (
                            <div className="text-[10px] mt-1" style={{ color: 'var(--hivelab-status-error, #ef4444)' }}>At least 3 characters</div>
                          )}
                        </div>

                        {/* Category */}
                        <div>
                          <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.textSecondary }}>
                            Category
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {CAMPUS_CATEGORIES.map((cat) => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => setCampusCategory(cat.id)}
                                className="px-3 py-1.5 rounded-lg text-xs transition-all duration-150 border"
                                style={{
                                  backgroundColor: campusCategory === cat.id ? `${COLORS.gold}15` : 'transparent',
                                  borderColor: campusCategory === cat.id ? `${COLORS.gold}40` : COLORS.border,
                                  color: campusCategory === cat.id ? COLORS.gold : COLORS.textTertiary,
                                }}
                              >
                                {cat.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Badge info */}
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: COLORS.textTertiary }}>
                            community
                          </span>
                          <span className="text-[11px]" style={{ color: COLORS.textTertiary }}>
                            Student-built tools start as community. Admins can promote to official.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Spaces List (for space target) */}
                    {deployTarget === 'space' && (
                    <div className="space-y-2 max-h-[40vh] overflow-y-auto p-1">
                      {spacesLoading ? (
                        <div className="space-y-2">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl border animate-pulse"
                              style={{
                                backgroundColor: COLORS.surface,
                                borderColor: COLORS.border,
                                animationDelay: `${i * 100}ms`,
                              }}
                            >
                              <div
                                className="w-10 h-10 rounded-lg"
                                style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                              />
                              <div className="flex-1 space-y-2">
                                <div
                                  className="h-4 w-24 rounded"
                                  style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                                />
                                <div
                                  className="h-3 w-16 rounded"
                                  style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : spaces.length === 0 ? (
                        <div className="text-center py-8" style={{ color: COLORS.textTertiary }}>
                          No spaces available. Create a space first.
                        </div>
                      ) : (
                        spaces.map((space) => (
                          <motion.button
                            key={space.id}
                            type="button"
                            onClick={() => handleSpaceSelect(space)}
                            whileHover={{ opacity: 0.97 }}
                            whileTap={{ scale: 0.99 }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200"
                            style={{
                              backgroundColor:
                                selectedSpace?.id === space.id
                                  ? `${COLORS.gold}15`
                                  : COLORS.surface,
                              borderColor:
                                selectedSpace?.id === space.id
                                  ? `${COLORS.gold}40`
                                  : COLORS.border,
                            }}
                          >
                            {/* Space Avatar */}
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium"
                              style={{
                                backgroundColor: `${COLORS.gold}20`,
                                color: COLORS.gold,
                              }}
                            >
                              {space.name.charAt(0).toUpperCase()}
                            </div>

                            {/* Space Info */}
                            <div className="flex-1 text-left">
                              <div
                                className="font-medium text-sm"
                                style={{ color: COLORS.textPrimary }}
                              >
                                {space.name}
                              </div>
                              <div className="text-xs" style={{ color: COLORS.textTertiary }}>
                                {space.memberCount} members
                              </div>
                            </div>

                            {/* Selection indicator */}
                            {selectedSpace?.id === space.id && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-5 h-5 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: COLORS.gold }}
                              >
                                <svg
                                  className="w-3 h-3 text-black"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={3}
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </motion.div>
                            )}
                          </motion.button>
                        ))
                      )}
                    </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderColor: COLORS.border }}>
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm transition-colors"
                        style={{ color: COLORS.textSecondary }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = COLORS.textPrimary;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = COLORS.textSecondary;
                        }}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={handleDeploy}
                        disabled={!canDeploy || isDeploying}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: canDeploy ? COLORS.gold : COLORS.surface,
                          color: canDeploy ? '#000' : COLORS.textTertiary,
                        }}
                      >
                        {isDeploying ? (
                          <>
                            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            Deploying...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                            </svg>
                            {deployTarget === 'campus'
                              ? `Deploy to Campus`
                              : `Deploy to ${selectedSpace?.name || 'Space'}`}
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Phase 3: Flight Animation */}
              {phase === 'flying' && (deployTarget === 'campus' || selectedSpace) && (
                <FlightAnimation
                  key="flight"
                  toolName={tool.name}
                  targetSpace={deployTarget === 'campus'
                    ? { id: 'campus', name: 'Campus', handle: campusSlug, memberCount: 0 }
                    : selectedSpace!}
                />
              )}

              {/* Phase 4: Success Recap */}
              {phase === 'success' && deployedSpace && (
                <SuccessRecap
                  key="success"
                  toolName={tool.name}
                  spaceName={deployedSpace.name}
                  memberCount={deployedSpace.memberCount}
                  confettiParticles={confettiParticles}
                  onViewInSpace={handleViewInSpace}
                  onContinueEditing={handleContinueEditing}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
