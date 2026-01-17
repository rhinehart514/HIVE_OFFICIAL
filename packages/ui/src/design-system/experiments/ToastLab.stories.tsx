'use client';

/**
 * ToastLab - Lifecycle Experiments
 *
 * Building on: Apple Glass Dark cards, shadow focus, premium feel
 * Testing: Position, entrance/exit, duration, variants
 */

import type { Meta } from '@storybook/react';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const meta: Meta = {
  title: 'Experiments/Toast Lab',
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
};

export default meta;

// LOCKED: Apple Glass Dark surface (slightly more opaque for toast)
const toastSurface = {
  background: 'linear-gradient(135deg, rgba(32,32,32,0.98) 0%, rgba(22,22,22,0.96) 100%)',
  boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
};

// Trigger button
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
// POSITION & ENTRANCE
// ============================================
export const Position_Entrance = () => {
  const [toasts, setToasts] = useState<{ id: number; position: string }[]>([]);

  const showToast = (position: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, position }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const positions = {
    'top-center': { className: 'top-4 left-1/2 -translate-x-1/2', enter: { y: -20 }, exit: { y: -20 } },
    'top-right': { className: 'top-4 right-4', enter: { x: 20 }, exit: { x: 20 } },
    'bottom-center': { className: 'bottom-4 left-1/2 -translate-x-1/2', enter: { y: 20 }, exit: { y: 20 } },
    'bottom-right': { className: 'bottom-4 right-4', enter: { x: 20 }, exit: { x: 20 } },
  };

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold text-white">Position & Entrance</h2>
      <p className="text-sm text-white/50">Click to show toast in each position</p>

      <div className="flex flex-wrap gap-3">
        {Object.keys(positions).map((pos) => (
          <TriggerButton key={pos} onClick={() => showToast(pos)}>
            {pos}
          </TriggerButton>
        ))}
      </div>

      <AnimatePresence>
        {toasts.map((toast) => {
          const pos = positions[toast.position as keyof typeof positions];
          return (
            <motion.div
              key={toast.id}
              className={`fixed ${pos.className} z-50`}
              initial={{ opacity: 0, ...pos.enter }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, ...pos.exit }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className="px-4 py-3 rounded-xl backdrop-blur-xl flex items-center gap-3"
                style={toastSurface}
              >
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-white">Toast from {toast.position}</span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
Position_Entrance.storyName = '1. Position & Entrance';

// ============================================
// TOAST VARIANTS
// ============================================
export const Toast_Variants = () => {
  const [toasts, setToasts] = useState<{ id: number; variant: string }[]>([]);

  const showToast = (variant: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const variants = {
    success: {
      icon: '✓',
      iconBg: 'bg-green-500',
      message: 'Changes saved successfully',
    },
    error: {
      icon: '✕',
      iconBg: 'bg-red-500',
      message: 'Something went wrong',
      surface: {
        ...toastSurface,
        boxShadow: '0 0 0 1px rgba(239,68,68,0.2), 0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
      },
    },
    warning: {
      icon: '!',
      iconBg: 'bg-amber-500',
      message: 'Please review your input',
    },
    info: {
      icon: 'i',
      iconBg: 'bg-blue-500',
      message: 'New update available',
    },
    loading: {
      icon: '○',
      iconBg: 'bg-white/20',
      message: 'Processing...',
      animate: true,
    },
  };

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold text-white">Toast Variants</h2>

      <div className="flex flex-wrap gap-3">
        {Object.keys(variants).map((v) => (
          <TriggerButton key={v} onClick={() => showToast(v)}>
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </TriggerButton>
        ))}
      </div>

      <AnimatePresence>
        {toasts.map((toast, index) => {
          const v = variants[toast.variant as keyof typeof variants];
          return (
            <motion.div
              key={toast.id}
              className="fixed bottom-4 right-4 z-50"
              style={{ bottom: `${16 + index * 60}px` }}
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className="px-4 py-3 rounded-xl backdrop-blur-xl flex items-center gap-3"
                style={'surface' in v ? v.surface : toastSurface}
              >
                <div className={`w-5 h-5 rounded-full ${v.iconBg} flex items-center justify-center text-xs font-bold text-white ${'animate' in v ? 'animate-spin' : ''}`}>
                  {v.icon}
                </div>
                <span className="text-sm text-white">{v.message}</span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
Toast_Variants.storyName = '2. Toast Variants';

// ============================================
// ANIMATION STYLES
// ============================================
export const Animation_Styles = () => {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (style: string) => {
    setToast(style);
    setTimeout(() => setToast(null), 3000);
  };

  const animations = {
    slide: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.9 },
    },
    pop: {
      initial: { opacity: 0, scale: 0.8, y: 10 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.8, y: 10 },
      transition: { type: 'spring', damping: 20, stiffness: 300 },
    },
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
  };

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold text-white">Animation Styles</h2>

      <div className="flex flex-wrap gap-3">
        {Object.keys(animations).map((a) => (
          <TriggerButton key={a} onClick={() => showToast(a)}>
            {a.charAt(0).toUpperCase() + a.slice(1)}
          </TriggerButton>
        ))}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-4 right-4 z-50"
            {...animations[toast as keyof typeof animations]}
            transition={
              'transition' in animations[toast as keyof typeof animations]
                ? (animations[toast as keyof typeof animations] as { transition: object }).transition
                : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
            }
          >
            <div
              className="px-4 py-3 rounded-xl backdrop-blur-xl flex items-center gap-3"
              style={toastSurface}
            >
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-white">{toast} animation</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
Animation_Styles.storyName = '3. Animation Styles';

// ============================================
// TOAST WITH ACTION
// ============================================
export const Toast_With_Action = () => {
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold text-white">Toast with Action</h2>

      <div className="flex gap-3">
        <TriggerButton onClick={() => setToast('undo')}>Show Undo Toast</TriggerButton>
        <TriggerButton onClick={() => setToast('action')}>Show Action Toast</TriggerButton>
      </div>

      <AnimatePresence>
        {toast === 'undo' && (
          <motion.div
            className="fixed bottom-4 right-4 z-50"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="px-4 py-3 rounded-xl backdrop-blur-xl flex items-center gap-4"
              style={toastSurface}
            >
              <span className="text-sm text-white">Item deleted</span>
              <button
                onClick={() => setToast(null)}
                className="text-sm font-medium text-[#FFD700] hover:text-[#FFE44D] transition-colors"
              >
                Undo
              </button>
            </div>
          </motion.div>
        )}

        {toast === 'action' && (
          <motion.div
            className="fixed bottom-4 right-4 z-50"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="px-4 py-3 rounded-2xl backdrop-blur-xl"
              style={toastSurface}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500" />
                <div>
                  <p className="text-sm font-medium text-white">New message</p>
                  <p className="text-xs text-white/50">from @alex</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setToast(null)}
                  className="flex-1 h-8 rounded-lg text-xs font-medium text-white/60 hover:text-white transition-colors"
                  style={{
                    background: 'linear-gradient(180deg, rgba(48,48,48,1) 0%, rgba(38,38,38,1) 100%)',
                  }}
                >
                  Dismiss
                </button>
                <button
                  onClick={() => setToast(null)}
                  className="flex-1 h-8 rounded-lg text-xs font-medium text-black"
                  style={{
                    background: 'linear-gradient(180deg, #FFD700 0%, #E5C200 100%)',
                  }}
                >
                  View
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
Toast_With_Action.storyName = '4. Toast with Action';

// ============================================
// PROGRESS BAR
// ============================================
export const Progress_Bar = () => {
  const [toast, setToast] = useState<string | null>(null);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (toast) {
      setProgress(100);
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p <= 0) {
            clearInterval(interval);
            setToast(null);
            return 0;
          }
          return p - 2;
        });
      }, 60);
      return () => clearInterval(interval);
    }
  }, [toast]);

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold text-white">Progress Bar</h2>

      <div className="flex gap-3">
        <TriggerButton onClick={() => setToast('bottom')}>Bottom Progress</TriggerButton>
        <TriggerButton onClick={() => setToast('top')}>Top Progress</TriggerButton>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-4 right-4 z-50"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="rounded-xl backdrop-blur-xl overflow-hidden"
              style={toastSurface}
            >
              {toast === 'top' && (
                <div className="h-0.5 bg-white/10">
                  <motion.div
                    className="h-full bg-[#FFD700]"
                    initial={{ width: '100%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.05 }}
                  />
                </div>
              )}
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-white">Auto-dismissing in {Math.ceil(progress / 33)}s</span>
              </div>
              {toast === 'bottom' && (
                <div className="h-0.5 bg-white/10">
                  <motion.div
                    className="h-full bg-[#FFD700]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
Progress_Bar.storyName = '5. Progress Bar';

// ============================================
// FINAL CANDIDATES
// ============================================
export const Final_Candidates = () => {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (type: string) => {
    setToast(type);
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold text-white">Final Candidates</h2>

      <div className="flex flex-wrap gap-3">
        <TriggerButton onClick={() => showToast('minimal')}>A: Minimal (recommended)</TriggerButton>
        <TriggerButton onClick={() => showToast('rich')}>B: Rich</TriggerButton>
        <TriggerButton onClick={() => showToast('compact')}>C: Compact</TriggerButton>
      </div>

      <AnimatePresence>
        {toast === 'minimal' && (
          <motion.div
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="px-5 py-3 rounded-full backdrop-blur-xl flex items-center gap-3"
              style={{
                background: 'linear-gradient(135deg, rgba(32,32,32,0.98) 0%, rgba(22,22,22,0.96) 100%)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-sm text-white">Changes saved</span>
            </div>
          </motion.div>
        )}

        {toast === 'rich' && (
          <motion.div
            className="fixed bottom-4 right-4 z-50"
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="w-80 rounded-2xl backdrop-blur-xl overflow-hidden"
              style={toastSurface}
            >
              <div className="h-0.5 bg-white/10">
                <motion.div
                  className="h-full bg-[#FFD700]"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 4, ease: 'linear' }}
                />
              </div>
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5">✓</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Profile updated</p>
                    <p className="text-xs text-white/50 mt-0.5">Your changes have been saved successfully.</p>
                  </div>
                  <button
                    onClick={() => setToast(null)}
                    className="text-white/40 hover:text-white/60 transition-colors text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {toast === 'compact' && (
          <motion.div
            className="fixed top-4 right-4 z-50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="px-3 py-2 rounded-lg backdrop-blur-xl flex items-center gap-2"
              style={{
                background: 'rgba(32,32,32,0.95)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 4px 16px rgba(0,0,0,0.3)',
              }}
            >
              <div className="w-1 h-1 rounded-full bg-green-500" />
              <span className="text-xs text-white/80">Saved</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
Final_Candidates.storyName = '6. Final Candidates';
