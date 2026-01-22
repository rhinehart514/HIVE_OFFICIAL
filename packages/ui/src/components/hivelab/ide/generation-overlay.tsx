'use client';

/**
 * GenerationOverlay — AI Generation Drama Sequence
 *
 * Per DRAMA plan:
 * Ghost → Materialize → Glow with status narration
 *
 * Per element (~800ms):
 * - 0ms: Ghost outline appears (dashed white/10 at target position)
 * - 100ms: Element starts materializing (scale 0.8, opacity 0)
 * - 400ms: Element at full size/opacity
 * - 500ms: Gold border draws on bottom (AnimatedLine)
 * - 700ms: Config text staggers in
 * - 800ms: Complete
 *
 * Between elements: 600-800ms stagger
 *
 * Status narration (WordReveal style):
 * - "Understanding your request..."
 * - "Designing your tool..."
 * - "Adding [Element Name]..."
 * - "Your tool is ready." (hold 1.5s)
 * - "Edit to refine." (persistent)
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MOTION } from '../../../tokens/motion';
import { GhostElement } from './ghost-element';

const EASE = MOTION.ease.premium;

// Colors
const COLORS = {
  gold: 'var(--life-gold, #D4AF37)',
  textPrimary: 'var(--hivelab-text-primary, #FAF9F7)',
  textSecondary: 'var(--hivelab-text-secondary, #8A8A8A)',
  textTertiary: 'var(--hivelab-text-tertiary, #5A5A5A)',
  surface: 'var(--hivelab-surface, #141414)',
};

// Generation phases
type GenerationPhase =
  | 'idle'
  | 'understanding'
  | 'designing'
  | 'adding'
  | 'completing'
  | 'complete';

// Status messages for each phase
const PHASE_MESSAGES: Record<GenerationPhase, string> = {
  idle: '',
  understanding: 'Understanding your request...',
  designing: 'Designing your tool...',
  adding: '', // Dynamic: "Adding [Element Name]..."
  completing: 'Your tool is ready.',
  complete: 'Edit to refine.',
};

interface GeneratingElement {
  id: string;
  elementId: string;
  name: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  phase: 'ghost' | 'materializing' | 'materialized' | 'glowing' | 'complete';
}

interface GenerationOverlayProps {
  /** Is generation currently active */
  isGenerating: boolean;
  /** Current status text from AI */
  statusText?: string;
  /** Elements being generated (from streaming) */
  generatingElements?: Array<{
    elementId: string;
    instanceId: string;
    name?: string;
    position?: { x: number; y: number };
    size?: { width: number; height: number };
  }>;
  /** Called when generation sequence completes */
  onComplete?: () => void;
}

/**
 * StatusNarration — Animated status text during generation
 */
function StatusNarration({ phase, elementName }: { phase: GenerationPhase; elementName?: string }) {
  const shouldReduceMotion = useReducedMotion();

  let message = PHASE_MESSAGES[phase];
  if (phase === 'adding' && elementName) {
    message = `Adding ${elementName}...`;
  }

  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        duration: shouldReduceMotion ? 0 : MOTION.duration.fast,
        ease: EASE,
      }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
    >
      <div
        className="flex items-center gap-3 px-4 py-2.5 rounded-full border shadow-lg"
        style={{
          backgroundColor: COLORS.surface,
          borderColor: `${COLORS.gold}30`,
        }}
      >
        {/* Animated dots */}
        {phase !== 'complete' && (
          <span className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: COLORS.gold }}
                animate={
                  shouldReduceMotion
                    ? {}
                    : {
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 1, 0.5],
                      }
                }
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </span>
        )}

        {/* Checkmark for complete */}
        {phase === 'complete' && (
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke={COLORS.gold}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        )}

        {/* Status text */}
        <span
          className="text-sm font-medium"
          style={{ color: phase === 'complete' ? COLORS.gold : COLORS.textPrimary }}
        >
          {message}
        </span>
      </div>
    </motion.div>
  );
}

/**
 * MaterializingElement — Element appearing with drama
 */
function MaterializingElement({
  element,
  onComplete,
}: {
  element: GeneratingElement;
  onComplete?: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [localPhase, setLocalPhase] = useState(element.phase);

  // Animate through phases
  useEffect(() => {
    if (shouldReduceMotion) {
      setLocalPhase('complete');
      onComplete?.();
      return;
    }

    const timers: NodeJS.Timeout[] = [];

    // 100ms: Start materializing
    timers.push(setTimeout(() => setLocalPhase('materializing'), 100));
    // 400ms: Fully materialized
    timers.push(setTimeout(() => setLocalPhase('materialized'), 400));
    // 500ms: Gold glow
    timers.push(setTimeout(() => setLocalPhase('glowing'), 500));
    // 800ms: Complete
    timers.push(setTimeout(() => {
      setLocalPhase('complete');
      onComplete?.();
    }, 800));

    return () => timers.forEach(clearTimeout);
  }, [shouldReduceMotion, onComplete]);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: element.position.x,
        top: element.position.y,
        width: element.size.width,
        height: element.size.height,
      }}
    >
      {/* Ghost phase */}
      <AnimatePresence>
        {localPhase === 'ghost' && (
          <GhostElement
            position={{ x: 0, y: 0 }}
            size={element.size}
            label={element.name}
          />
        )}
      </AnimatePresence>

      {/* Materializing element */}
      <AnimatePresence>
        {localPhase !== 'ghost' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: localPhase === 'materializing' ? 0.6 : 1,
              scale: localPhase === 'materializing' ? 0.95 : 1,
            }}
            transition={{
              duration: MOTION.duration.fast,
              ease: EASE,
            }}
            className="absolute inset-0 rounded-xl overflow-hidden"
            style={{
              backgroundColor: COLORS.surface,
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Element label - staggers in at 700ms per DRAMA plan */}
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.2 }}
              className="p-3"
            >
              <div
                className="text-sm font-medium"
                style={{ color: COLORS.textPrimary }}
              >
                {element.name || element.elementId}
              </div>
              <div
                className="text-xs mt-1"
                style={{ color: COLORS.textTertiary }}
              >
                Element
              </div>
            </motion.div>

            {/* Gold border draw animation */}
            <AnimatePresence>
              {(localPhase === 'glowing' || localPhase === 'complete') && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    duration: MOTION.duration.base,
                    ease: EASE,
                  }}
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{
                    backgroundColor: COLORS.gold,
                    transformOrigin: 'left',
                  }}
                />
              )}
            </AnimatePresence>

            {/* Glow pulse */}
            <AnimatePresence>
              {localPhase === 'glowing' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 pointer-events-none rounded-xl"
                  style={{
                    boxShadow: `0 0 20px ${COLORS.gold}30, inset 0 0 10px ${COLORS.gold}10`,
                  }}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function GenerationOverlay({
  isGenerating,
  statusText,
  generatingElements = [],
  onComplete,
}: GenerationOverlayProps) {
  const shouldReduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<GenerationPhase>('idle');
  const [elements, setElements] = useState<GeneratingElement[]>([]);
  const [currentElementName, setCurrentElementName] = useState<string>();
  const [completedCount, setCompletedCount] = useState(0);

  // Update phase based on generation state
  useEffect(() => {
    if (!isGenerating) {
      if (elements.length > 0 && completedCount >= elements.length) {
        setPhase('completing');
        const timer = setTimeout(() => {
          setPhase('complete');
          // Hold complete message for 1.5s
          setTimeout(() => {
            onComplete?.();
          }, 1500);
        }, 500);
        return () => clearTimeout(timer);
      }
      return;
    }

    // Generation started
    if (elements.length === 0) {
      setPhase('understanding');
      const timer = setTimeout(() => {
        setPhase('designing');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isGenerating, elements.length, completedCount, onComplete]);

  // Convert streaming elements to internal format
  useEffect(() => {
    if (generatingElements.length === 0) return;

    const newElements: GeneratingElement[] = generatingElements.map((el, idx) => ({
      id: el.instanceId,
      elementId: el.elementId,
      name: el.name || el.elementId.replace(/-/g, ' '),
      position: el.position || { x: 100 + (idx % 3) * 280, y: 100 + Math.floor(idx / 3) * 160 },
      size: el.size || { width: 260, height: 140 },
      phase: 'ghost' as const,
    }));

    // Stagger element additions with randomized delay (600-800ms per DRAMA plan)
    newElements.forEach((el, idx) => {
      // Randomize stagger between 600-800ms for organic feel
      const randomStagger = 600 + Math.random() * 200;
      const totalDelay = idx === 0 ? 0 : idx * randomStagger;
      setTimeout(() => {
        setElements((prev) => {
          if (prev.find((e) => e.id === el.id)) return prev;
          setPhase('adding');
          setCurrentElementName(el.name);
          return [...prev, el];
        });
      }, totalDelay);
    });
  }, [generatingElements]);

  // Handle element completion
  const handleElementComplete = useCallback(() => {
    setCompletedCount((prev) => prev + 1);
  }, []);

  // Reset on new generation
  useEffect(() => {
    if (isGenerating && elements.length === 0) {
      setCompletedCount(0);
      setPhase('understanding');
    }
  }, [isGenerating, elements.length]);

  if (!isGenerating && phase === 'idle') return null;

  return (
    <>
      {/* Status narration */}
      <AnimatePresence mode="wait">
        {phase !== 'idle' && (
          <StatusNarration
            key={phase}
            phase={phase}
            elementName={currentElementName}
          />
        )}
      </AnimatePresence>

      {/* Generating elements */}
      <AnimatePresence>
        {elements.map((element) => (
          <MaterializingElement
            key={element.id}
            element={element}
            onComplete={handleElementComplete}
          />
        ))}
      </AnimatePresence>
    </>
  );
}

// Export types
export type { GeneratingElement, GenerationPhase };
