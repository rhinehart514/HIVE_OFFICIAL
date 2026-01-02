'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { easingArrays } from '@hive/tokens';
import { HiveLogo } from '../atomic/00-Global/atoms/hive-logo';

/**
 * VoidShell - The Void Experience
 *
 * Confident emptiness with optional gold accent
 * For: Auth, onboarding, verification
 * Feel: You are the focus. Nothing else matters.
 */

interface VoidShellProps {
  children: React.ReactNode;
  /** Maximum width of content container */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg';
  /** Show breathing ambient orb */
  showOrb?: boolean;
  /** Orb color variant */
  orbColor?: 'white' | 'gold';
  /** Show HIVE logo in header */
  showLogo?: boolean;
  /** Make logo a link */
  logoLink?: boolean;
  /** Show footer with campus branding */
  showFooter?: boolean;
  /** Custom footer text */
  footerText?: string;
  /** Center content vertically */
  centerContent?: boolean;
}

const maxWidthClasses = {
  xs: 'max-w-[360px]',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export function VoidShell({
  children,
  maxWidth = 'sm',
  showOrb = true,
  orbColor = 'gold',
  showLogo = true,
  logoLink = true,
  showFooter = true,
  footerText = 'University at Buffalo',
  centerContent = true,
}: VoidShellProps) {
  const orbColorClass = orbColor === 'gold' ? 'bg-[#FFD700]' : 'bg-white';

  const LogoContent = () => (
    <HiveLogo size="default" variant="default" showIcon showText />
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Breathing ambient orb */}
      {showOrb && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.03, 0.05, 0.03],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`
            absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-[400px] md:w-[600px] h-[300px] md:h-[400px]
            ${orbColorClass}
            rounded-full
            blur-[120px]
            pointer-events-none
          `}
        />
      )}

      {/* Secondary subtle glow */}
      {showOrb && (
        <div
          className={`
            absolute top-1/3 right-1/4
            w-[200px] md:w-[300px] h-[150px] md:h-[200px]
            ${orbColorClass}
            opacity-[0.02] blur-[100px] rounded-full pointer-events-none
          `}
        />
      )}

      {/* Content container */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Minimal header */}
        {showLogo && (
          <header className="p-6">
            {logoLink ? (
              <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
                <LogoContent />
              </Link>
            ) : (
              <LogoContent />
            )}
          </header>
        )}

        {/* Centered floating content */}
        <main className={`flex-1 flex ${centerContent ? 'items-center' : 'items-start pt-8 md:pt-16'} justify-center px-6 py-8`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              ease: easingArrays.default,
            }}
            className={`w-full ${maxWidthClasses[maxWidth]}`}
          >
            {children}
          </motion.div>
        </main>

        {/* Footer */}
        {showFooter && (
          <footer className="p-6 text-center">
            <p className="text-xs text-neutral-500">
              {footerText}
            </p>
          </footer>
        )}
      </div>
    </div>
  );
}

export default VoidShell;
