'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { CanvasElement, Connection, Page } from '../types';
import type { HiveLabComposition } from '../types';
import { toast } from 'sonner';

interface UseIDESaveOptions {
  toolId: string;
  toolName: string;
  toolDescription: string;
  elements: CanvasElement[];
  connections: Connection[];
  pages?: Page[];
  onSave: (composition: HiveLabComposition) => Promise<void>;
}

export function useIDESave({
  toolId,
  toolName,
  toolDescription,
  elements,
  connections,
  pages,
  onSave,
}: UseIDESaveOptions) {
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<number>(0);

  // Track unsaved changes (skip initial load to avoid false positive)
  const isInitialLoad = useRef(true);
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    if (elements.length > 0 || connections.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [elements, connections, toolName, toolDescription]);

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Build composition helper
  const buildComposition = useCallback((): HiveLabComposition => {
    const isMultiPage = pages && pages.length > 1;
    return {
      id: toolId,
      name: toolName || 'Untitled Tool',
      description: toolDescription,
      elements,
      connections,
      layout: 'flow',
      ...(isMultiPage ? { pages } : {}),
    };
  }, [toolId, toolName, toolDescription, elements, connections, pages]);

  // Auto-save every 30 seconds when there are unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges || saving) return;
    if (elements.length === 0) return;

    const AUTO_SAVE_INTERVAL = 30000;

    const timeoutId = setTimeout(async () => {
      if (!hasUnsavedChanges || saving) return;

      try {
        setSaving(true);
        await onSave(buildComposition());
        setHasUnsavedChanges(false);
        setLastAutoSave(Date.now());
      } catch (error) {
        console.error('Auto-save failed:', error);
        toast.warning('Auto-save failed', { description: 'Your changes are not saved. Please save manually.' });
      } finally {
        setSaving(false);
      }
    }, AUTO_SAVE_INTERVAL);

    return () => clearTimeout(timeoutId);
  }, [hasUnsavedChanges, saving, elements, connections, toolName, toolDescription, buildComposition, onSave]);

  // Manual save
  const save = useCallback(async () => {
    setSaving(true);
    try {
      await onSave(buildComposition());
      setHasUnsavedChanges(false);
      toast.success('Tool saved', { description: 'Your changes have been saved.' });
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save tool', {
        description: error instanceof Error ? error.message : 'Please try again.'
      });
    } finally {
      setSaving(false);
    }
  }, [buildComposition, onSave]);

  return {
    saving,
    setSaving,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    lastAutoSave,
    save,
    buildComposition,
  };
}
