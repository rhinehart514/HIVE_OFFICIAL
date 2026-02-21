'use client';

/**
 * Signup Gate Modal
 *
 * Conversion modal shown when unauthenticated users try to deploy tools.
 * Encourages campus signup with @buffalo.edu email.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { RocketLaunchIcon, AcademicCapIcon, UsersIcon, BoltIcon, EnvelopeIcon, LockClosedIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { durationSeconds, staggerPresets } from '@hive/tokens';

import { Button } from '../../design-system/primitives';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../design-system/components/Dialog';
import { Input } from '../../design-system/primitives';
import { Label } from '../../design-system/primitives/Label';


export interface SignupGateModalProps {
  /** Whether modal is open */
  isOpen: boolean;

  /** Close modal */
  onClose: () => void;

  /** Handle signup */
  onSignup?: (email: string, password: string) => Promise<void>;

  /** Redirect to signup page instead of inline form */
  redirectToSignup?: () => void;

  /** Tool name they're trying to deploy */
  toolName?: string;

  /** Custom heading */
  heading?: string;

  /** Custom description */
  description?: string;
}

/**
 * Signup Gate Modal - Convert users at deploy attempt
 */
export function SignupGateModal({
  isOpen,
  onClose,
  onSignup,
  redirectToSignup,
  toolName,
  heading,
  description
}: SignupGateModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate @buffalo.edu email
    if (!email.endsWith('@buffalo.edu')) {
      setError('Please use your @buffalo.edu email');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (onSignup) {
        await onSignup(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
      setIsLoading(false);
    }
  };

  const benefits = [
    {
      icon: RocketLaunchIcon,
      title: 'Deploy to your org',
      description: 'Share custom tools with your campus community'
    },
    {
      icon: UsersIcon,
      title: 'Join your campus',
      description: 'Connect with 10,000+ UB students on HIVE'
    },
    {
      icon: BoltIcon,
      title: 'Build unlimited tools',
      description: 'Create as many AI-powered tools as you need'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Left: Benefits */}
          <div className="bg-gradient-to-br from-muted/50 via-muted/20 to-background p-8 border-r border-border">
            <DialogHeader className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border w-fit">
                <AcademicCapIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Campus Tool Builder</span>
              </div>

              <DialogTitle className="text-2xl">
                {heading || `Deploy "${toolName || 'your tool'}" to your campus`}
              </DialogTitle>

              <DialogDescription className="text-base">
                {description || 'Sign up with your @buffalo.edu email to deploy tools to your campus community'}
              </DialogDescription>
            </DialogHeader>

            {/* Benefits list */}
            <div className="mt-8 space-y-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: staggerPresets.slow * index, duration: durationSeconds.standard }}
                  className="flex items-start gap-3"
                >
                  <div className="shrink-0 p-2 rounded-lg bg-background border border-border">
                    <benefit.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{benefit.title}</p>
                    <p className="text-xs text-muted-foreground">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Tool preview */}
            {toolName && (
              <div className="mt-6 p-4 rounded-lg border border-border bg-background/50">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Tool ready to deploy:</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground font-sans">
                  {toolName}
                </p>
              </div>
            )}
          </div>

          {/* Right: Signup form */}
          <div className="p-8">
            {redirectToSignup ? (
              /* Simple redirect option */
              <div className="h-full flex flex-col justify-center space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Create your account</h3>
                  <p className="text-sm text-muted-foreground">
                    Join your campus community on HIVE
                  </p>
                </div>

                <Button
                  onClick={redirectToSignup}
                  size="lg"
                  className="w-full bg-white text-black hover:bg-neutral-100"
                >
                  Sign up with @buffalo.edu
                </Button>

                <div className="text-center">
                  <button
                    onClick={onClose}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            ) : (
              /* Inline signup form */
              <form onSubmit={handleSubmit} className="h-full flex flex-col justify-center space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Create your account</h3>
                  <p className="text-sm text-muted-foreground">
                    Use your campus email to get started
                  </p>
                </div>

                {/* Email field */}
                <div className="space-y-2">
                  <Label htmlFor="email">Campus Email</Label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@buffalo.edu"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      disabled={isLoading}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a password (8+ characters)"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      disabled={isLoading}
                      className="pl-10"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-500"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit button */}
                <Button
                  type="submit"
                  size="lg"
                  disabled={isLoading}
                  className="w-full bg-white text-black hover:bg-neutral-100 disabled:bg-muted disabled:text-muted-foreground"
                >
                  {isLoading ? 'Creating account...' : 'Create account & deploy'}
                </Button>

                {/* Cancel */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    Maybe later
                  </button>
                </div>

                {/* Terms */}
                <p className="text-xs text-center text-muted-foreground">
                  By signing up, you agree to HIVE&apos;s Terms of Service and Privacy Policy
                </p>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
