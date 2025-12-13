'use client';

import { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button, HiveLogo } from '@hive/ui';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function OnboardingError({ error, reset }: ErrorProps) {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // Log error for monitoring
    console.error('Onboarding error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none opacity-[0.02]"
        style={{
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
        role="alert"
        aria-labelledby="error-title"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <HiveLogo size="default" variant="default" />
        </div>

        {/* Error Icon */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="flex justify-center mb-6"
        >
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-400" aria-hidden="true" />
          </div>
        </motion.div>

        {/* Error Message */}
        <div className="text-center mb-8">
          <h1 id="error-title" className="text-2xl font-semibold text-white mb-2">
            Something went wrong
          </h1>
          <p className="text-neutral-400 text-sm">
            We ran into an issue during onboarding. Don't worry, your progress is saved.
          </p>
          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-xs text-red-300 font-mono break-all">
                {error.message}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={reset}
            className="w-full bg-gold-500 hover:bg-gold-600 text-black font-medium"
            autoFocus
          >
            <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
            Try Again
          </Button>

          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="w-full border-neutral-700 text-neutral-300 hover:bg-white/5"
          >
            <Home className="w-4 h-4 mr-2" aria-hidden="true" />
            Go Home
          </Button>
        </div>

        {/* Help text */}
        <p className="text-xs text-neutral-500 text-center mt-6">
          If this keeps happening, try refreshing the page or contact support.
        </p>
      </motion.div>
    </div>
  );
}
