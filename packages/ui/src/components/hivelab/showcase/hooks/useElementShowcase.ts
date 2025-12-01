"use client";

/**
 * useElementShowcase Hook
 *
 * State management for the element showcase system.
 * Handles selection, expansion, and prompt suggestion flow.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  ELEMENT_BUNDLES,
  ELEMENT_SHOWCASE_DATA,
  getBundleElements,
  getRandomPrompt,
  type ElementShowcaseMetadata,
} from '../element-showcase-data';

// ============================================================================
// Types
// ============================================================================

export interface ShowcaseState {
  /** Currently expanded bundle ID */
  expandedBundle: string | null;
  /** Currently selected element ID */
  selectedElement: string | null;
  /** Current prompt suggestion */
  promptSuggestion: string;
  /** Whether sidebar is collapsed */
  sidebarCollapsed: boolean;
  /** Recent element selections (for quick access) */
  recentElements: string[];
}

export interface UseElementShowcaseOptions {
  /** Initial expanded bundle */
  defaultExpandedBundle?: string | null;
  /** Initial prompt text */
  defaultPrompt?: string;
  /** Maximum recent elements to track */
  maxRecentElements?: number;
  /** Callback when prompt changes */
  onPromptChange?: (prompt: string) => void;
  /** Callback when element is selected */
  onElementSelect?: (elementId: string, metadata: ElementShowcaseMetadata) => void;
}

export interface UseElementShowcaseReturn {
  /** Current state */
  state: ShowcaseState;
  /** Actions */
  actions: {
    /** Expand a bundle */
    expandBundle: (bundleId: string | null) => void;
    /** Toggle bundle expansion */
    toggleBundle: (bundleId: string) => void;
    /** Select an element */
    selectElement: (elementId: string) => void;
    /** Set prompt suggestion */
    setPromptSuggestion: (prompt: string) => void;
    /** Apply element's default prompt */
    applyElementPrompt: (elementId: string) => void;
    /** Apply bundle's prompt suggestion */
    applyBundlePrompt: (bundleId: string) => void;
    /** Toggle sidebar collapsed state */
    toggleSidebar: () => void;
    /** Set sidebar collapsed state */
    setSidebarCollapsed: (collapsed: boolean) => void;
    /** Clear selection */
    clearSelection: () => void;
    /** Reset to initial state */
    reset: () => void;
  };
  /** Computed values */
  computed: {
    /** Elements in the currently expanded bundle */
    expandedBundleElements: ElementShowcaseMetadata[];
    /** Selected element metadata */
    selectedElementMetadata: ElementShowcaseMetadata | null;
    /** Selected element's bundle */
    selectedElementBundle: typeof ELEMENT_BUNDLES[string] | null;
    /** Has any selection */
    hasSelection: boolean;
    /** Is any bundle expanded */
    isExpanded: boolean;
  };
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_MAX_RECENT = 5;
const DEFAULT_PROMPT = '';

// ============================================================================
// Hook Implementation
// ============================================================================

export function useElementShowcase(
  options: UseElementShowcaseOptions = {}
): UseElementShowcaseReturn {
  const {
    defaultExpandedBundle = null,
    defaultPrompt = DEFAULT_PROMPT,
    maxRecentElements = DEFAULT_MAX_RECENT,
    onPromptChange,
    onElementSelect,
  } = options;

  // State
  const [expandedBundle, setExpandedBundle] = useState<string | null>(defaultExpandedBundle);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [promptSuggestion, setPromptSuggestion] = useState<string>(defaultPrompt);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [recentElements, setRecentElements] = useState<string[]>([]);

  // ============================================================================
  // Actions
  // ============================================================================

  const expandBundle = useCallback((bundleId: string | null) => {
    setExpandedBundle(bundleId);
  }, []);

  const toggleBundle = useCallback((bundleId: string) => {
    setExpandedBundle(prev => (prev === bundleId ? null : bundleId));
  }, []);

  const selectElement = useCallback(
    (elementId: string) => {
      setSelectedElement(elementId);

      // Track in recent elements
      setRecentElements(prev => {
        const filtered = prev.filter(id => id !== elementId);
        return [elementId, ...filtered].slice(0, maxRecentElements);
      });

      // Notify callback
      const metadata = ELEMENT_SHOWCASE_DATA[elementId];
      if (metadata && onElementSelect) {
        onElementSelect(elementId, metadata);
      }
    },
    [maxRecentElements, onElementSelect]
  );

  const updatePrompt = useCallback(
    (prompt: string) => {
      setPromptSuggestion(prompt);
      onPromptChange?.(prompt);
    },
    [onPromptChange]
  );

  const applyElementPrompt = useCallback(
    (elementId: string) => {
      const prompt = getRandomPrompt(elementId);
      if (prompt) {
        updatePrompt(prompt);
        selectElement(elementId);
      }
    },
    [updatePrompt, selectElement]
  );

  const applyBundlePrompt = useCallback(
    (bundleId: string) => {
      const bundle = ELEMENT_BUNDLES[bundleId];
      if (bundle) {
        updatePrompt(bundle.promptSuggestion);
        expandBundle(bundleId);
      }
    },
    [updatePrompt, expandBundle]
  );

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedElement(null);
  }, []);

  const reset = useCallback(() => {
    setExpandedBundle(defaultExpandedBundle);
    setSelectedElement(null);
    setPromptSuggestion(defaultPrompt);
    setSidebarCollapsed(false);
  }, [defaultExpandedBundle, defaultPrompt]);

  // ============================================================================
  // Computed Values
  // ============================================================================

  const expandedBundleElements = useMemo(() => {
    if (!expandedBundle) return [];
    return getBundleElements(expandedBundle);
  }, [expandedBundle]);

  const selectedElementMetadata = useMemo(() => {
    if (!selectedElement) return null;
    return ELEMENT_SHOWCASE_DATA[selectedElement] || null;
  }, [selectedElement]);

  const selectedElementBundle = useMemo(() => {
    if (!selectedElementMetadata) return null;
    return ELEMENT_BUNDLES[selectedElementMetadata.bundle] || null;
  }, [selectedElementMetadata]);

  const hasSelection = selectedElement !== null;
  const isExpanded = expandedBundle !== null;

  // ============================================================================
  // Return Value
  // ============================================================================

  return {
    state: {
      expandedBundle,
      selectedElement,
      promptSuggestion,
      sidebarCollapsed,
      recentElements,
    },
    actions: {
      expandBundle,
      toggleBundle,
      selectElement,
      setPromptSuggestion: updatePrompt,
      applyElementPrompt,
      applyBundlePrompt,
      toggleSidebar,
      setSidebarCollapsed,
      clearSelection,
      reset,
    },
    computed: {
      expandedBundleElements,
      selectedElementMetadata,
      selectedElementBundle,
      hasSelection,
      isExpanded,
    },
  };
}

export default useElementShowcase;
