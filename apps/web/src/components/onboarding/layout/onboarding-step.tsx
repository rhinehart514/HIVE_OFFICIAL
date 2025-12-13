'use client';

import { motion } from 'framer-motion';
import { pageVariants, containerVariants, itemVariants } from '../shared/motion';

interface OnboardingStepProps {
  children: React.ReactNode;
  /** Unique key for AnimatePresence */
  stepKey: string;
  /** Center content (for celebration) vs left-align (default) */
  centered?: boolean;
  /** Maximum width class */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Custom className */
  className?: string;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

/**
 * Container for individual onboarding steps
 * Handles page transitions and stagger animations
 * YC/SF/OpenAI premium motion
 */
export function OnboardingStep({
  children,
  stepKey,
  centered = false,
  maxWidth = '2xl',
  className = '',
}: OnboardingStepProps) {
  return (
    <motion.div
      key={stepKey}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`min-h-screen flex flex-col ${centered ? 'items-center justify-center' : 'justify-center'} px-6 py-12 md:py-24`}
    >
      <div className={`w-full ${maxWidthClasses[maxWidth]} ${centered ? 'mx-auto text-center' : ''} ${className}`}>
        {children}
      </div>
    </motion.div>
  );
}

/**
 * Stagger container for child elements within a step
 */
export function StaggerContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Individual item that staggers in
 */
export function StaggerItem({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}
