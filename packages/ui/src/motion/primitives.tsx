'use client'

import * as React from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { transition, variants, easing, duration } from './presets'

/**
 * FadeIn - Simple opacity animation.
 */
interface FadeInProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
}

export function FadeIn({
  children,
  delay = 0,
  duration: customDuration,
  className,
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: customDuration ?? transition.default.duration,
        delay,
        ease: easing.default,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * SlideUp - Slide and fade from below.
 */
interface SlideUpProps {
  children: React.ReactNode
  delay?: number
  offset?: number
  className?: string
}

export function SlideUp({
  children,
  delay = 0,
  offset = 20,
  className,
}: SlideUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: offset }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: offset }}
      transition={{
        ...transition.default,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * SlideIn - Slide from specified direction.
 */
interface SlideInProps {
  children: React.ReactNode
  direction?: 'left' | 'right' | 'up' | 'down'
  delay?: number
  offset?: number
  className?: string
}

export function SlideIn({
  children,
  direction = 'up',
  delay = 0,
  offset = 20,
  className,
}: SlideInProps) {
  const directionMap = {
    left: { x: -offset, y: 0 },
    right: { x: offset, y: 0 },
    up: { x: 0, y: offset },
    down: { x: 0, y: -offset },
  }

  const initial = { opacity: 0, ...directionMap[direction] }

  return (
    <motion.div
      initial={initial}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={initial}
      transition={{
        ...transition.default,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * ScaleIn - Scale and fade animation.
 */
interface ScaleInProps {
  children: React.ReactNode
  delay?: number
  initialScale?: number
  className?: string
}

export function ScaleIn({
  children,
  delay = 0,
  initialScale = 0.95,
  className,
}: ScaleInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: initialScale }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: initialScale }}
      transition={{
        ...transition.default,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Pop - Bouncy pop-in animation for badges, toasts.
 */
interface PopProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

export function Pop({ children, delay = 0, className }: PopProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{
        ...transition.spring,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Stagger - Container that staggers children animations.
 */
interface StaggerProps {
  children: React.ReactNode
  staggerDelay?: number
  className?: string
}

export function Stagger({
  children,
  staggerDelay = 0.05,
  className,
}: StaggerProps) {
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
      {React.Children.map(children, (child) => (
        <motion.div variants={itemVariants}>{child}</motion.div>
      ))}
    </motion.div>
  )
}

/**
 * Presence - AnimatePresence wrapper with exit animations.
 */
interface PresenceProps {
  children: React.ReactNode
  mode?: 'sync' | 'wait' | 'popLayout'
}

export function Presence({ children, mode = 'sync' }: PresenceProps) {
  return <AnimatePresence mode={mode}>{children}</AnimatePresence>
}

/**
 * MotionDiv - Base motion div with common props.
 */
interface MotionDivProps {
  children: React.ReactNode
  preset?: keyof typeof variants
  delay?: number
  className?: string
}

export function MotionDiv({
  children,
  preset = 'fade',
  delay = 0,
  className,
}: MotionDivProps) {
  const selectedVariant = variants[preset]

  return (
    <motion.div
      initial={selectedVariant.initial}
      animate={selectedVariant.animate}
      exit={selectedVariant.exit}
      transition={{
        ...transition.default,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Collapse - Animate height from 0.
 */
interface CollapseProps {
  isOpen: boolean
  children: React.ReactNode
  className?: string
}

export function Collapse({ isOpen, children, className }: CollapseProps) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{
            height: { duration: duration.standard, ease: easing.default },
            opacity: { duration: duration.quick },
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
 * LayoutGroup - Shared layout animations.
 */
export { LayoutGroup } from 'framer-motion'
