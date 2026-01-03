'use client';

import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEY_EXPANDED, STORAGE_KEY_SPACES_OPEN } from './sidebar.constants';

/**
 * Hook for managing sidebar expanded/collapsed state with localStorage persistence
 */
export function useSidebarState(defaultExpanded = true) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_EXPANDED);
      if (stored !== null) {
        setIsExpanded(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors
    }
    setIsHydrated(true);
  }, []);

  // Persist to localStorage when changed
  const setExpanded = useCallback((value: boolean) => {
    setIsExpanded(value);
    try {
      localStorage.setItem(STORAGE_KEY_EXPANDED, JSON.stringify(value));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const toggle = useCallback(() => {
    setExpanded(!isExpanded);
  }, [isExpanded, setExpanded]);

  const expand = useCallback(() => setExpanded(true), [setExpanded]);
  const collapse = useCallback(() => setExpanded(false), [setExpanded]);

  return {
    isExpanded,
    isHydrated,
    setExpanded,
    toggle,
    expand,
    collapse,
  };
}

/**
 * Hook for managing spaces dropdown open state with localStorage persistence
 */
export function useSpacesDropdownState(defaultOpen = true) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SPACES_OPEN);
      if (stored !== null) {
        setIsOpen(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Persist to localStorage when changed
  const setOpen = useCallback((value: boolean) => {
    setIsOpen(value);
    try {
      localStorage.setItem(STORAGE_KEY_SPACES_OPEN, JSON.stringify(value));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const toggle = useCallback(() => {
    setOpen(!isOpen);
  }, [isOpen, setOpen]);

  return {
    isOpen,
    setOpen,
    toggle,
  };
}
