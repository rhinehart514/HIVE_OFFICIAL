'use client';

import { motion } from 'framer-motion';
import { AtSign } from 'lucide-react';
import { Button, Input, type InputStatus } from '@hive/ui';
import {
  staggerContainer,
  staggerItem,
  transitionSilk,
  transitionSpring,
} from '@/lib/motion-primitives';
import type { OnboardingData, HandleStatus } from '../shared/types';

interface IdentityStepProps {
  data: OnboardingData;
  handleStatus: HandleStatus;
  handleSuggestions: string[];
  onUpdate: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  error: string | null;
  setError: (error: string | null) => void;
  isSubmitting: boolean;
}

export function IdentityStep({
  data,
  handleStatus,
  handleSuggestions,
  onUpdate,
  onNext,
  error,
  setError,
}: IdentityStepProps) {
  const { handle, name } = data;

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Enter your name');
      return;
    }

    if (!handle.trim()) {
      setError('Choose a handle');
      return;
    }

    if (handleStatus === 'invalid') {
      setError('Handle must be 3-20 characters (letters, numbers, . _ -)');
      return;
    }

    if (handleStatus === 'taken') {
      setError('That handle is taken');
      return;
    }

    if (handleStatus !== 'available') {
      setError('Checking handle availability...');
      return;
    }

    setError(null);
    onNext();
  };

  // Map handleStatus to InputStatus for Input
  const getInputStatus = (): InputStatus => {
    switch (handleStatus) {
      case 'checking':
        return 'loading';
      case 'available':
        return 'success';
      case 'taken':
      case 'invalid':
        return 'error';
      default:
        return 'idle';
    }
  };

  const getHandleMessage = () => {
    switch (handleStatus) {
      case 'checking':
        return undefined; // Loading state shows spinner
      case 'available':
        return 'Available!';
      case 'taken':
        return 'Already taken';
      case 'invalid':
        return '3-20 chars: letters, numbers, . _ -';
      default:
        return undefined;
    }
  };

  const canContinue =
    name.trim().length > 0 &&
    handle.trim().length > 0 &&
    handleStatus === 'available';

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Full name input */}
      <motion.div variants={staggerItem} transition={transitionSilk}>
        <Input
          label="Your name"
          type="text"
          autoComplete="name"
          autoFocus
          value={name}
          onChange={(e) => {
            onUpdate({ name: e.target.value });
            setError(null);
          }}
          placeholder="First Last"
          error={error && !name.trim() ? error : undefined}
        />
      </motion.div>

      {/* Handle input */}
      <motion.div variants={staggerItem} transition={transitionSilk}>
        <Input
          label="Choose your handle"
          type="text"
          autoComplete="username"
          value={handle}
          onChange={(e) => {
            onUpdate({ handle: e.target.value.toLowerCase() });
            setError(null);
          }}
          placeholder="yourhandle"
          prefixIcon={<AtSign className="h-4 w-4" />}
          status={getInputStatus()}
          hint={handleStatus === 'idle' ? 'hive.so/your-handle' : undefined}
          success={handleStatus === 'available' ? getHandleMessage() : undefined}
          error={
            handleStatus === 'taken' || handleStatus === 'invalid'
              ? getHandleMessage()
              : undefined
          }
        />
      </motion.div>

      {/* Handle suggestions when taken */}
      {handleStatus === 'taken' && handleSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={transitionSilk}
          className="space-y-3"
        >
          <p className="text-xs text-neutral-500">Try one of these:</p>
          <motion.div
            className="flex flex-wrap gap-2"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {handleSuggestions.map((suggestion, index) => (
              <motion.button
                key={suggestion}
                type="button"
                onClick={() => onUpdate({ handle: suggestion })}
                variants={staggerItem}
                transition={{ ...transitionSpring, delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-1.5 text-xs rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-gold-500/50 hover:bg-neutral-800 transition-colors"
              >
                @{suggestion}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* General error */}
      {error && name.trim() && handle.trim() && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-medium text-red-400"
        >
          {error}
        </motion.p>
      )}

      {/* Continue button */}
      <motion.div variants={staggerItem} transition={transitionSilk}>
        <Button
          onClick={handleSubmit}
          disabled={!canContinue}
          showArrow
          fullWidth
          size="lg"
        >
          Continue
        </Button>
      </motion.div>
    </motion.div>
  );
}
