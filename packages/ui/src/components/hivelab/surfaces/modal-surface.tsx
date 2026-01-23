'use client';

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ToolCanvas, type ToolCanvasProps } from '../tool-canvas';
import { cn } from '../../../lib/utils';

/**
 * ModalSurface
 *
 * Sprint 5: Surface-Specific UI
 *
 * Full-featured modal wrapper for tool deployment:
 * - Backdrop click to close
 * - Escape key to close
 * - Accessible dialog semantics
 * - Smooth enter/exit animations
 * - Maximum width constraint with responsive sizing
 */

export interface ModalSurfaceProps extends Omit<ToolCanvasProps, 'className'> {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal description */
  description?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Whether clicking backdrop closes modal */
  closeOnBackdropClick?: boolean;
  /** Whether pressing Escape closes modal */
  closeOnEscape?: boolean;
  /** Additional CSS classes for the modal container */
  className?: string;
  /** Additional CSS classes for the content area */
  contentClassName?: string;
  /** Header content (replaces title/description) */
  header?: React.ReactNode;
  /** Footer content */
  footer?: React.ReactNode;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[90vw] max-h-[90vh]',
};

const glass = {
  backdrop: "bg-black/60 backdrop-blur-sm",
  surface: "bg-[#0D0D0D] border border-white/[0.08] shadow-2xl shadow-black/40",
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.15,
    },
  },
};

export function ModalSurface({
  isOpen,
  onClose,
  title,
  description,
  size = 'lg',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className,
  contentClassName,
  header,
  footer,
  // ToolCanvas props
  elements,
  state,
  layout,
  onElementChange,
  onElementAction,
  isLoading,
  error,
  context,
  sharedState,
  userState,
  theme,
}: ModalSurfaceProps) {
  const prefersReducedMotion = useReducedMotion();
  const modalRef = React.useRef<HTMLDivElement>(null);

  // Handle escape key
  React.useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Lock body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Focus trap and initial focus
  React.useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <motion.div
            className={cn("fixed inset-0", glass.backdrop)}
            variants={prefersReducedMotion ? {} : backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Modal container */}
          <div
            className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto"
            onClick={handleBackdropClick}
          >
            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? 'modal-title' : undefined}
              aria-describedby={description ? 'modal-description' : undefined}
              tabIndex={-1}
              variants={prefersReducedMotion ? {} : modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                "w-full rounded-xl",
                glass.surface,
                sizeClasses[size],
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-4 border-b border-white/[0.06]">
                {header ?? (
                  <div>
                    {title && (
                      <h2
                        id="modal-title"
                        className="text-lg font-semibold text-white"
                      >
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p
                        id="modal-description"
                        className="mt-1 text-sm text-gray-400"
                      >
                        {description}
                      </p>
                    )}
                  </div>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                  aria-label="Close modal"
                >
                  <XMarkIcon className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Content */}
              <div className={cn("p-4 overflow-y-auto max-h-[60vh]", contentClassName)}>
                <ToolCanvas
                  elements={elements}
                  state={state}
                  layout={layout}
                  onElementChange={onElementChange}
                  onElementAction={onElementAction}
                  isLoading={isLoading}
                  error={error}
                  context={context}
                  sharedState={sharedState}
                  userState={userState}
                  theme={theme}
                />
              </div>

              {/* Footer */}
              {footer && (
                <div className="p-4 border-t border-white/[0.06]">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ModalSurface;
