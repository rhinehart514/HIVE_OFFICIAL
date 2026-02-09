'use client'

import * as React from 'react'
import { motion } from 'framer-motion'

const easing = {
  default: [0.22, 1, 0.36, 1] as const,
}

const duration = {
  instant: 0.15,
  quick: 0.2,
  smooth: 0.3,
}

const transition = {
  default: { duration: duration.quick, ease: easing.default } as const,
  snap: { duration: duration.instant, ease: easing.default } as const,
  smooth: { duration: duration.smooth, ease: easing.default } as const,
}

const gestures = {
  none: {},
  button: {
    whileHover: { opacity: 0.92 },
    whileTap: { opacity: 0.86, transition: transition.snap },
  },
  card: {
    whileHover: { opacity: 0.97, transition: transition.default },
    whileTap: { opacity: 0.92, transition: transition.snap },
  },
} as const

/**
 * HoverLift - Lifts element on hover.
 */
interface HoverLiftProps {
  children: React.ReactNode
  lift?: number
  className?: string
}

export function HoverLift({
  children,
  lift = 2,
  className,
}: HoverLiftProps) {
  void lift
  return (
    <motion.div
      whileHover={{
        opacity: 0.96,
        transition: { duration: duration.quick, ease: easing.default },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * HoverScale - Scales element on hover.
 */
interface HoverScaleProps {
  children: React.ReactNode
  scale?: number
  className?: string
}

export function HoverScale({
  children,
  scale = 1.02,
  className,
}: HoverScaleProps) {
  void scale
  return (
    <motion.div
      whileHover={{
        opacity: 0.96,
        transition: { duration: duration.quick, ease: easing.default },
      }}
      whileTap={{
        opacity: 0.88,
        transition: { duration: duration.instant },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * TapScale - Press/tap feedback.
 */
interface TapScaleProps {
  children: React.ReactNode
  scale?: number
  className?: string
}

export function TapScale({
  children,
  scale = 0.98,
  className,
}: TapScaleProps) {
  void scale
  return (
    <motion.div
      whileTap={{
        opacity: 0.88,
        transition: { duration: duration.instant },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * ButtonMotion - Complete button interaction pattern.
 */
interface ButtonMotionProps {
  children: React.ReactNode
  disabled?: boolean
  className?: string
}

export function ButtonMotion({
  children,
  disabled,
  className,
}: ButtonMotionProps) {
  return (
    <motion.div
      {...(disabled ? gestures.none : gestures.button)}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * CardMotion - Card hover effect with lift.
 */
interface CardMotionProps {
  children: React.ReactNode
  className?: string
}

export function CardMotion({ children, className }: CardMotionProps) {
  return (
    <motion.div {...gestures.card} className={className}>
      {children}
    </motion.div>
  )
}

/**
 * FocusRing - Animated focus indicator.
 */
interface FocusRingProps {
  children: React.ReactNode
  isFocused: boolean
  className?: string
}

export function FocusRing({
  children,
  isFocused,
  className,
}: FocusRingProps) {
  return (
    <motion.div
      animate={{
        boxShadow: isFocused
          ? '0 0 0 2px var(--brand-primary)'
          : '0 0 0 0px transparent',
      }}
      transition={transition.snap}
      className={className}
      style={{ borderRadius: 'inherit' }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Pulse - Attention-grabbing pulse animation.
 */
interface PulseProps {
  children: React.ReactNode
  isActive?: boolean
  className?: string
}

export function Pulse({ children, isActive = true, className }: PulseProps) {
  return (
    <motion.div
      animate={
        isActive
          ? {
              scale: [1, 1.05, 1],
            }
          : {}
      }
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Shake - Error shake animation.
 */
interface ShakeProps {
  children: React.ReactNode
  isShaking: boolean
  className?: string
}

export function Shake({ children, isShaking, className }: ShakeProps) {
  return (
    <motion.div
      animate={
        isShaking
          ? {
              x: [0, -4, 4, -4, 4, 0],
            }
          : {}
      }
      transition={{
        duration: 0.4,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Rotate - Rotation animation.
 */
interface RotateProps {
  children: React.ReactNode
  isRotating: boolean
  degrees?: number
  className?: string
}

export function Rotate({
  children,
  isRotating,
  degrees = 180,
  className,
}: RotateProps) {
  return (
    <motion.div
      animate={{
        rotate: isRotating ? degrees : 0,
      }}
      transition={transition.default}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Spin - Continuous rotation (for loaders).
 */
interface SpinProps {
  children: React.ReactNode
  className?: string
}

export function Spin({ children, className }: SpinProps) {
  return (
    <motion.div
      animate={{
        rotate: 360,
      }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Glow - Gold glow effect for achievements.
 */
interface GlowProps {
  children: React.ReactNode
  isActive: boolean
  color?: string
  className?: string
}

export function Glow({
  children,
  isActive,
  color = 'var(--brand-primary)',
  className,
}: GlowProps) {
  return (
    <motion.div
      animate={{
        boxShadow: isActive
          ? `0 0 20px ${color}, 0 0 40px ${color}40`
          : '0 0 0px transparent',
      }}
      transition={transition.smooth}
      className={className}
    >
      {children}
    </motion.div>
  )
}
