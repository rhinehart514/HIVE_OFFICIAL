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

// Colors
const COLORS = {
  bg: 'var(--hivelab-bg, #0A0A0A)',
  panel: 'var(--hivelab-panel, #1A1A1A)',
  surface: 'var(--hivelab-surface, #141414)',
  border: 'var(--hivelab-border, rgba(255, 255, 255, 0.08))',
  textPrimary: 'var(--hivelab-text-primary, #FAF9F7)',
  textSecondary: 'var(--hivelab-text-secondary, #8A8A8A)',
  textTertiary: 'var(--hivelab-text-tertiary, #5A5A5A)',
  gold: 'var(--life-gold, #D4AF37)',
};

// Deployment phases
export type DeployPhase =
  | 'idle'
  | 'zooming-out'
  | 'target-selection'
  | 'flying'
  | 'success';

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
  /** Called when deployment is confirmed */
  onDeploy: (spaceId: string) => Promise<void>;
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
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [deployedSpace, setDeployedSpace] = useState<Space | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setPhase('zooming-out');
      setSelectedSpace(null);
      setDeployedSpace(null);
      setError(null);

      // Transition to target selection
      const timer = setTimeout(() => {
        setPhase('target-selection');
      }, shouldReduceMotion ? 0 : 600);

      return () => clearTimeout(timer);
    } else {
      setPhase('idle');
    }
  }, [isOpen, shouldReduceMotion]);

  // Handle space selection
  const handleSpaceSelect = useCallback((space: Space) => {
    setSelectedSpace(space);
    setError(null);
  }, []);

  // Handle deploy confirmation
  const handleDeploy = useCallback(async () => {
    if (!selectedSpace || isDeploying) return;

    setIsDeploying(true);
    setError(null);

    try {
      // Start flight animation
      setPhase('flying');

      // Wait for flight animation
      await new Promise((resolve) => setTimeout(resolve, shouldReduceMotion ? 100 : 800));

      // Actually deploy
      await onDeploy(selectedSpace.id);

      // Show success
      setDeployedSpace(selectedSpace);
      setPhase('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deployment failed');
      setPhase('target-selection');
    } finally {
      setIsDeploying(false);
    }
  }, [selectedSpace, isDeploying, onDeploy, shouldReduceMotion]);

  // Handle continue editing
  const handleContinueEditing = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle view in space
  const handleViewInSpace = useCallback(() => {
    if (deployedSpace) {
      onViewInSpace(deployedSpace.handle);
    }
  }, [deployedSpace, onViewInSpace]);

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

                    {/* Error message */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 px-4 py-2 rounded-lg text-sm text-center"
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                        }}
                      >
                        {error}
                      </motion.div>
                    )}

                    {/* Spaces List */}
                    <div className="space-y-2 max-h-[40vh] overflow-y-auto p-1">
                      {spacesLoading ? (
                        <div className="text-center py-8" style={{ color: COLORS.textTertiary }}>
                          Loading your spaces...
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
                            whileHover={{ scale: 1.01 }}
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
                        disabled={!selectedSpace || isDeploying}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: selectedSpace ? COLORS.gold : COLORS.surface,
                          color: selectedSpace ? '#000' : COLORS.textTertiary,
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
                            Deploy to {selectedSpace?.name || 'Space'}
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Phase 3: Flight Animation */}
              {phase === 'flying' && selectedSpace && (
                <FlightAnimation
                  key="flight"
                  toolName={tool.name}
                  targetSpace={selectedSpace}
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
