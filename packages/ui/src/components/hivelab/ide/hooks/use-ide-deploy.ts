'use client';

import { useState, useCallback, useMemo } from 'react';
import type { HiveLabComposition } from '../types';
import { toast } from 'sonner';

interface UseIDEDeployOptions {
  buildComposition: () => HiveLabComposition;
  onSave: (composition: HiveLabComposition) => Promise<void>;
  onDeploy?: (composition: HiveLabComposition) => Promise<void>;
  setSaving: (saving: boolean) => void;
  setHasUnsavedChanges: (value: boolean) => void;
}

export function useIDEDeploy({
  buildComposition,
  onSave,
  onDeploy,
  setSaving,
  setHasUnsavedChanges,
}: UseIDEDeployOptions) {
  const [deploying, setDeploying] = useState(false);
  const [showDeploySuccess, setShowDeploySuccess] = useState(false);

  // Memoized confetti particles for deploy celebration
  const confettiParticles = useMemo(() => {
    if (!showDeploySuccess) return [];
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      targetX: 50 + (Math.random() - 0.5) * 80,
      targetY: 50 + (Math.random() - 0.5) * 80,
      rotation: Math.random() * 360,
      delay: Math.random() * 0.3,
      size: Math.random() * 8 + 4,
      color: ['#FFD700', '#FFA500', '#FFDF00', '#DAA520'][Math.floor(Math.random() * 4)],
      isCircle: Math.random() > 0.5,
    }));
  }, [showDeploySuccess]);

  const deploy = useCallback(async () => {
    if (!onDeploy) return;
    setSaving(true);
    setDeploying(true);
    try {
      const composition = buildComposition();
      await onSave(composition);
      await onDeploy(composition);
      setHasUnsavedChanges(false);
      setShowDeploySuccess(true);
    } catch (error) {
      console.error('Deploy failed:', error);
      toast.error('Failed to deploy tool', {
        description: error instanceof Error ? error.message : 'Please try again.'
      });
    } finally {
      setSaving(false);
      setDeploying(false);
    }
  }, [buildComposition, onSave, onDeploy, setSaving, setHasUnsavedChanges]);

  return {
    deploying,
    showDeploySuccess,
    setShowDeploySuccess,
    confettiParticles,
    deploy,
  };
}
