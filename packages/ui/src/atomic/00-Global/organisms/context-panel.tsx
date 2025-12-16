/**
 * Context Panel - Slide-in Panel from Right
 *
 * Design Direction:
 * - Position: fixed right
 * - Width: 320px (sm), 400px (md), 480px (lg)
 * - Animation: slide in from right (250ms, spring)
 * - Background: #141414
 * - Backdrop: subtle blur on main content
 *
 * Used for: Tools panel, Members panel, Events panel, Threads
 */
'use client';

import { cva, type VariantProps } from "class-variance-authority";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import * as React from "react";

import { contextPanelVariants as motionVariants } from "../../../lib/motion-variants";
import { cn } from "../../../lib/utils";

const panelVariants = cva(
  "fixed top-0 right-0 h-full z-50 bg-[#141414] border-l border-[#2A2A2A] shadow-[-8px_0_24px_rgba(0,0,0,0.4)] flex flex-col",
  {
    variants: {
      size: {
        sm: "w-80",        // 320px
        md: "w-[400px]",   // 400px
        lg: "w-[480px]",   // 480px
        xl: "w-[560px]",   // 560px
      },
    },
    defaultVariants: {
      size: "sm",
    },
  }
);

export interface ContextPanelProps extends VariantProps<typeof panelVariants> {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Called when panel should close */
  onClose: () => void;
  /** Panel title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Panel content */
  children: React.ReactNode;
  /** Optional header actions */
  headerActions?: React.ReactNode;
  /** Optional footer content */
  footer?: React.ReactNode;
  /** Show backdrop overlay */
  showBackdrop?: boolean;
  /** Additional class name for the panel */
  className?: string;
}

export function ContextPanel({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  headerActions,
  footer,
  size,
  showBackdrop = false,
  className,
}: ContextPanelProps) {
  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          {showBackdrop && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={onClose}
            />
          )}

          {/* Panel */}
          <motion.div
            variants={motionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(panelVariants({ size }), className)}
          >
            {/* Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-[#2A2A2A]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-[#FAFAFA] uppercase tracking-wide">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-xs text-[#818187] mt-0.5 truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {headerActions}
                  <button
                    onClick={onClose}
                    className={cn(
                      "w-7 h-7 rounded-lg",
                      "flex items-center justify-center",
                      "text-[#818187] hover:text-[#FAFAFA]",
                      "hover:bg-white/[0.06]",
                      "transition-colors duration-100",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                    )}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex-shrink-0 px-4 py-3 border-t border-[#2A2A2A]">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Convenience components for common panel sections

export interface ContextPanelSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function ContextPanelSection({ title, children, className }: ContextPanelSectionProps) {
  return (
    <div className={cn("px-4 py-3", className)}>
      {title && (
        <h3 className="text-xs font-medium text-[#818187] uppercase tracking-wide mb-2">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

export interface ContextPanelItemProps {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}

export function ContextPanelItem({
  icon,
  label,
  description,
  trailing,
  onClick,
  active,
  className,
}: ContextPanelItemProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg",
        "transition-colors duration-100",
        onClick && [
          "cursor-pointer",
          "hover:bg-white/[0.06]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
        ],
        active && "bg-white/[0.06]",
        className
      )}
    >
      {icon && (
        <span className="flex-shrink-0 text-[#818187]">
          {icon}
        </span>
      )}
      <div className="flex-1 min-w-0 text-left">
        <p className={cn(
          "text-sm font-medium truncate",
          active ? "text-[#FAFAFA]" : "text-[#A1A1A6]"
        )}>
          {label}
        </p>
        {description && (
          <p className="text-xs text-[#818187] truncate">
            {description}
          </p>
        )}
      </div>
      {trailing && (
        <span className="flex-shrink-0">
          {trailing}
        </span>
      )}
    </Component>
  );
}

export { panelVariants as contextPanelSizeVariants };
