'use client'

import * as React from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { transition, easing, duration, stagger } from './presets'

/**
 * StaggerList - Animates list items with staggered timing.
 */
interface StaggerListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  keyExtractor: (item: T, index: number) => string
  staggerDelay?: number
  className?: string
}

export function StaggerList<T>({
  items,
  renderItem,
  keyExtractor,
  staggerDelay = 0.05,
  className,
}: StaggerListProps<T>) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: transition.default,
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {items.map((item, index) => (
        <motion.div key={keyExtractor(item, index)} variants={itemVariants}>
          {renderItem(item, index)}
        </motion.div>
      ))}
    </motion.div>
  )
}

/**
 * SequentialReveal - Reveals children one after another.
 */
interface SequentialRevealProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

export function SequentialReveal({
  children,
  delay = 0.1,
  className,
}: SequentialRevealProps) {
  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: delay,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: transition.smooth,
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}

/**
 * PageTransition - Full page transition wrapper.
 */
interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: duration.smooth,
        ease: easing.silk,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * ModalTransition - Modal entrance/exit animation.
 */
interface ModalTransitionProps {
  isOpen: boolean
  children: React.ReactNode
  className?: string
}

export function ModalTransition({
  isOpen,
  children,
  className,
}: ModalTransitionProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.quick }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{
              duration: duration.standard,
              ease: easing.default,
            }}
            className={className}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/**
 * SheetTransition - Slide-up sheet animation.
 */
interface SheetTransitionProps {
  isOpen: boolean
  children: React.ReactNode
  className?: string
}

export function SheetTransition({
  isOpen,
  children,
  className,
}: SheetTransitionProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            className={className}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/**
 * ToastTransition - Toast notification animation.
 */
interface ToastTransitionProps {
  isVisible: boolean
  children: React.ReactNode
  position?: 'top' | 'bottom'
  className?: string
}

export function ToastTransition({
  isVisible,
  children,
  position = 'bottom',
  className,
}: ToastTransitionProps) {
  const yOffset = position === 'top' ? -20 : 20

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: yOffset, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: yOffset, scale: 0.95 }}
          transition={transition.spring}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * DropdownTransition - Dropdown menu animation.
 */
interface DropdownTransitionProps {
  isOpen: boolean
  children: React.ReactNode
  className?: string
}

export function DropdownTransition({
  isOpen,
  children,
  className,
}: DropdownTransitionProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -8 }}
          transition={{
            duration: duration.quick,
            ease: easing.default,
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * AccordionTransition - Expand/collapse with height animation.
 */
interface AccordionTransitionProps {
  isExpanded: boolean
  children: React.ReactNode
  className?: string
}

export function AccordionTransition({
  isExpanded,
  children,
  className,
}: AccordionTransitionProps) {
  return (
    <AnimatePresence initial={false}>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{
            height: {
              duration: duration.standard,
              ease: easing.default,
            },
            opacity: {
              duration: duration.quick,
            },
          }}
          className={className}
          style={{ overflow: 'hidden' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * AchievementCelebration - Gold glow celebration animation.
 */
interface AchievementCelebrationProps {
  isActive: boolean
  children: React.ReactNode
  className?: string
}

export function AchievementCelebration({
  isActive,
  children,
  className,
}: AchievementCelebrationProps) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: 1,
            scale: 1,
            boxShadow: [
              '0 0 0px var(--brand-primary)',
              '0 0 40px var(--brand-primary)',
              '0 0 20px var(--brand-primary)',
            ],
          }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{
            duration: duration.dramatic,
            ease: easing.dramatic,
            boxShadow: {
              duration: 1.5,
              repeat: 2,
            },
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * CountUp - Animated number counter.
 */
interface CountUpProps {
  value: number
  duration?: number
  className?: string
}

export function CountUp({
  value,
  duration: customDuration = 1,
  className,
}: CountUpProps) {
  const [displayValue, setDisplayValue] = React.useState(0)

  React.useEffect(() => {
    const startTime = performance.now()
    const startValue = displayValue

    const animate = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / 1000
      const progress = Math.min(elapsed / customDuration, 1)

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startValue + (value - startValue) * eased)

      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, customDuration])

  return <span className={className}>{displayValue.toLocaleString()}</span>
}
