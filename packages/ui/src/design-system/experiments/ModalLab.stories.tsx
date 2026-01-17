'use client';

/**
 * ModalLab - Choreography Experiments
 *
 * Building on: Apple Glass Dark cards, shadow focus, premium feel
 * Testing: Entrance/exit animations, backdrop, sizing
 */

import type { Meta } from '@storybook/react';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const meta: Meta = {
  title: 'Experiments/Modal Lab',
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
};

export default meta;

// LOCKED: Apple Glass Dark surface
const modalSurface = {
  background: 'linear-gradient(135deg, rgba(28,28,28,0.98) 0%, rgba(18,18,18,0.95) 100%)',
  boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 24px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.12)',
};

// Trigger button (uses Button locked style)
const TriggerButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className="h-10 px-5 rounded-full font-medium text-sm text-black transition-all duration-150"
    style={{
      background: 'linear-gradient(180deg, #FFD700 0%, #E5C200 100%)',
      boxShadow: '0 2px 8px rgba(255,215,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
    }}
  >
    {children}
  </button>
);

// ============================================
// ENTRANCE ANIMATIONS
// ============================================
export const Entrance_Animations = () => {
  const [open, setOpen] = useState<string | null>(null);

  const entranceVariants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.2 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
      transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
    },
    scaleUp: {
      initial: { opacity: 0, scale: 0.9, y: 20 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.9, y: 20 },
      transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
    },
    slideUp: {
      initial: { opacity: 0, y: 40 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 40 },
      transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
    },
    spring: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.8 },
      transition: { type: 'spring', damping: 25, stiffness: 300 },
    },
    drop: {
      initial: { opacity: 0, y: -30, scale: 0.95 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: -30, scale: 0.95 },
      transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold text-white">Entrance Animations</h2>
      <p className="text-sm text-white/50">Click to preview each animation style</p>

      <div className="flex flex-wrap gap-3">
        {Object.keys(entranceVariants).map((key) => (
          <TriggerButton key={key} onClick={() => setOpen(key)}>
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </TriggerButton>
        ))}
      </div>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(null)}
            />
            {/* Modal */}
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              onClick={() => setOpen(null)}
            >
              <motion.div
                className="w-full max-w-md rounded-3xl p-6 backdrop-blur-xl"
                style={modalSurface}
                onClick={(e) => e.stopPropagation()}
                {...entranceVariants[open as keyof typeof entranceVariants]}
              >
                <h3 className="text-lg font-semibold text-white mb-2">
                  {open.charAt(0).toUpperCase() + open.slice(1)} Animation
                </h3>
                <p className="text-sm text-white/60 mb-6">
                  This modal uses the {open} entrance animation.
                </p>
                <button
                  onClick={() => setOpen(null)}
                  className="w-full h-11 rounded-xl text-sm font-medium text-white/80 hover:text-white transition-colors"
                  style={{
                    background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
                  }}
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
Entrance_Animations.storyName = '1. Entrance Animations';

// ============================================
// BACKDROP STYLES
// ============================================
export const Backdrop_Styles = () => {
  const [open, setOpen] = useState<string | null>(null);

  const backdropStyles = {
    blur: 'bg-black/50 backdrop-blur-md',
    dark: 'bg-black/70',
    subtle: 'bg-black/40 backdrop-blur-sm',
    tinted: 'bg-black/60 backdrop-blur-sm',
    heavy: 'bg-black/80 backdrop-blur-lg',
  };

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold text-white">Backdrop Styles</h2>
      <p className="text-sm text-white/50">Different overlay treatments</p>

      <div className="flex flex-wrap gap-3">
        {Object.keys(backdropStyles).map((key) => (
          <TriggerButton key={key} onClick={() => setOpen(key)}>
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </TriggerButton>
        ))}
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className={`fixed inset-0 z-40 ${backdropStyles[open as keyof typeof backdropStyles]}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(null)}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              onClick={() => setOpen(null)}
            >
              <motion.div
                className="w-full max-w-md rounded-3xl p-6 backdrop-blur-xl"
                style={modalSurface}
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <h3 className="text-lg font-semibold text-white mb-2">
                  {open.charAt(0).toUpperCase() + open.slice(1)} Backdrop
                </h3>
                <p className="text-sm text-white/60 mb-6">
                  Backdrop: {backdropStyles[open as keyof typeof backdropStyles]}
                </p>
                <button
                  onClick={() => setOpen(null)}
                  className="w-full h-11 rounded-xl text-sm font-medium text-white/80 hover:text-white transition-colors"
                  style={{
                    background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
                  }}
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
Backdrop_Styles.storyName = '2. Backdrop Styles';

// ============================================
// MODAL SIZES
// ============================================
export const Modal_Sizes = () => {
  const [open, setOpen] = useState<string | null>(null);

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-2xl',
  };

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold text-white">Modal Sizes</h2>

      <div className="flex flex-wrap gap-3">
        {Object.keys(sizes).map((key) => (
          <TriggerButton key={key} onClick={() => setOpen(key)}>
            {key.toUpperCase()}
          </TriggerButton>
        ))}
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(null)}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              onClick={() => setOpen(null)}
            >
              <motion.div
                className={`w-full ${sizes[open as keyof typeof sizes]} rounded-3xl p-6 backdrop-blur-xl`}
                style={modalSurface}
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <h3 className="text-lg font-semibold text-white mb-2">
                  {open.toUpperCase()} Modal
                </h3>
                <p className="text-sm text-white/60 mb-6">
                  Size class: {sizes[open as keyof typeof sizes]}
                </p>
                <button
                  onClick={() => setOpen(null)}
                  className="w-full h-11 rounded-xl text-sm font-medium text-white/80 hover:text-white transition-colors"
                  style={{
                    background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
                  }}
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
Modal_Sizes.storyName = '3. Modal Sizes';

// ============================================
// CONTENT CHOREOGRAPHY
// ============================================
export const Content_Choreography = () => {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold text-white">Content Choreography</h2>
      <p className="text-sm text-white/50">Staggered content animations inside modal</p>

      <div className="flex gap-3">
        <TriggerButton onClick={() => setOpen('stagger')}>Stagger In</TriggerButton>
        <TriggerButton onClick={() => setOpen('none')}>No Stagger</TriggerButton>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(null)}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              onClick={() => setOpen(null)}
            >
              <motion.div
                className="w-full max-w-md rounded-3xl p-6 backdrop-blur-xl"
                style={modalSurface}
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                {open === 'stagger' ? (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: {},
                      visible: { transition: { staggerChildren: 0.05 } },
                    }}
                  >
                    {['Confirm Action', 'Are you sure you want to continue? This action cannot be undone.', 'input', 'buttons'].map((item, i) => (
                      <motion.div
                        key={i}
                        variants={{
                          hidden: { opacity: 0, y: 10 },
                          visible: { opacity: 1, y: 0 },
                        }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      >
                        {i === 0 && <h3 className="text-lg font-semibold text-white mb-2">{item}</h3>}
                        {i === 1 && <p className="text-sm text-white/60 mb-4">{item}</p>}
                        {i === 2 && (
                          <input
                            className="w-full h-11 px-4 text-sm text-white placeholder:text-white/30 rounded-xl outline-none mb-4"
                            style={{
                              background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
                              boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
                            }}
                            placeholder="Type to confirm..."
                          />
                        )}
                        {i === 3 && (
                          <div className="flex gap-3">
                            <button
                              onClick={() => setOpen(null)}
                              className="flex-1 h-11 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-colors"
                              style={{
                                background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => setOpen(null)}
                              className="flex-1 h-11 rounded-xl text-sm font-medium text-black"
                              style={{
                                background: 'linear-gradient(180deg, #FFD700 0%, #E5C200 100%)',
                                boxShadow: '0 2px 8px rgba(255,215,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
                              }}
                            >
                              Confirm
                            </button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-white mb-2">Confirm Action</h3>
                    <p className="text-sm text-white/60 mb-4">
                      Are you sure you want to continue? This action cannot be undone.
                    </p>
                    <input
                      className="w-full h-11 px-4 text-sm text-white placeholder:text-white/30 rounded-xl outline-none mb-4"
                      style={{
                        background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
                      }}
                      placeholder="Type to confirm..."
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => setOpen(null)}
                        className="flex-1 h-11 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-colors"
                        style={{
                          background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setOpen(null)}
                        className="flex-1 h-11 rounded-xl text-sm font-medium text-black"
                        style={{
                          background: 'linear-gradient(180deg, #FFD700 0%, #E5C200 100%)',
                          boxShadow: '0 2px 8px rgba(255,215,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
                        }}
                      >
                        Confirm
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
Content_Choreography.storyName = '4. Content Choreography';

// ============================================
// FINAL CANDIDATES
// ============================================
export const Final_Candidates = () => {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold text-white">Final Candidates</h2>

      <div className="flex flex-wrap gap-3">
        <TriggerButton onClick={() => setOpen('minimal')}>A: Minimal (recommended)</TriggerButton>
        <TriggerButton onClick={() => setOpen('smooth')}>B: Smooth Scale</TriggerButton>
        <TriggerButton onClick={() => setOpen('slide')}>C: Slide Up</TriggerButton>
      </div>

      <AnimatePresence>
        {open === 'minimal' && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setOpen(null)}
            />
            <motion.div className="fixed inset-0 flex items-center justify-center z-50 p-4" onClick={() => setOpen(null)}>
              <motion.div
                className="w-full max-w-md rounded-3xl p-6 backdrop-blur-xl"
                style={modalSurface}
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              >
                <h3 className="text-lg font-semibold text-white mb-2">Minimal Animation</h3>
                <p className="text-sm text-white/60 mb-6">
                  Fast, subtle scale. 150ms duration. Apple-like restraint.
                </p>
                <button
                  onClick={() => setOpen(null)}
                  className="w-full h-11 rounded-full text-sm font-medium text-black"
                  style={{
                    background: 'linear-gradient(180deg, #FFD700 0%, #E5C200 100%)',
                    boxShadow: '0 2px 8px rgba(255,215,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
                  }}
                >
                  Got it
                </button>
              </motion.div>
            </motion.div>
          </>
        )}

        {open === 'smooth' && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(null)}
            />
            <motion.div className="fixed inset-0 flex items-center justify-center z-50 p-4" onClick={() => setOpen(null)}>
              <motion.div
                className="w-full max-w-md rounded-3xl p-6 backdrop-blur-xl"
                style={modalSurface}
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <h3 className="text-lg font-semibold text-white mb-2">Smooth Scale</h3>
                <p className="text-sm text-white/60 mb-6">
                  Larger scale range with slight Y movement. 250ms. More presence.
                </p>
                <button
                  onClick={() => setOpen(null)}
                  className="w-full h-11 rounded-full text-sm font-medium text-black"
                  style={{
                    background: 'linear-gradient(180deg, #FFD700 0%, #E5C200 100%)',
                    boxShadow: '0 2px 8px rgba(255,215,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
                  }}
                >
                  Got it
                </button>
              </motion.div>
            </motion.div>
          </>
        )}

        {open === 'slide' && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(null)}
            />
            <motion.div className="fixed inset-0 flex items-center justify-center z-50 p-4" onClick={() => setOpen(null)}>
              <motion.div
                className="w-full max-w-md rounded-3xl p-6 backdrop-blur-xl"
                style={modalSurface}
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <h3 className="text-lg font-semibold text-white mb-2">Slide Up</h3>
                <p className="text-sm text-white/60 mb-6">
                  Vertical slide with no scale. 300ms. Mobile sheet feel.
                </p>
                <button
                  onClick={() => setOpen(null)}
                  className="w-full h-11 rounded-full text-sm font-medium text-black"
                  style={{
                    background: 'linear-gradient(180deg, #FFD700 0%, #E5C200 100%)',
                    boxShadow: '0 2px 8px rgba(255,215,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
                  }}
                >
                  Got it
                </button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
Final_Candidates.storyName = '5. Final Candidates';
