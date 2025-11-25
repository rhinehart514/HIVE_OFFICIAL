/**
 * Keyboard Shortcuts Hook - react-hotkeys-hook
 *
 * Provides keyboard shortcuts for HIVE platform.
 * Uses react-hotkeys-hook for better performance and DX.
 *
 * Features:
 * - Feed navigation (j/k)
 * - Quick actions (l for like, c for comment)
 * - Command palette (cmd+k / ctrl+k)
 * - Scope management (different shortcuts per page)
 *
 * Usage:
 * ```tsx
 * import { useFeedShortcuts } from '@/hooks/use-keyboard-shortcuts';
 *
 * function FeedPage() {
 *   useFeedShortcuts({
 *     onNextPost: () => navigate('next'),
 *     onPrevPost: () => navigate('prev'),
 *     onLike: () => likePost(),
 *     onComment: () => focusComment(),
 *   });
 * }
 * ```
 */

import { useHotkeys, type Options } from 'react-hotkeys-hook';

// Default options for all shortcuts
const defaultOptions: Options = {
  enableOnFormTags: false, // Disable in forms by default
  preventDefault: true,
};

/**
 * Feed keyboard shortcuts
 *
 * Shortcuts:
 * - j: Next post
 * - k: Previous post
 * - l: Like current post
 * - c: Focus comment input
 * - r: Refresh feed
 */
export interface FeedShortcutsOptions {
  onNextPost?: () => void;
  onPrevPost?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onRefresh?: () => void;
  enabled?: boolean;
}

export function useFeedShortcuts({
  onNextPost,
  onPrevPost,
  onLike,
  onComment,
  onRefresh,
  enabled = true,
}: FeedShortcutsOptions = {}) {
  // j - Next post
  useHotkeys(
    'j',
    () => onNextPost?.(),
    { ...defaultOptions, enabled: enabled && !!onNextPost },
    [onNextPost]
  );

  // k - Previous post
  useHotkeys(
    'k',
    () => onPrevPost?.(),
    { ...defaultOptions, enabled: enabled && !!onPrevPost },
    [onPrevPost]
  );

  // l - Like post
  useHotkeys(
    'l',
    () => onLike?.(),
    { ...defaultOptions, enabled: enabled && !!onLike },
    [onLike]
  );

  // c - Comment
  useHotkeys(
    'c',
    () => onComment?.(),
    { ...defaultOptions, enabled: enabled && !!onComment },
    [onComment]
  );

  // r - Refresh
  useHotkeys(
    'r',
    () => onRefresh?.(),
    { ...defaultOptions, enabled: enabled && !!onRefresh },
    [onRefresh]
  );
}

/**
 * Global keyboard shortcuts
 *
 * Shortcuts:
 * - cmd+k / ctrl+k: Open command palette
 * - /: Focus search
 * - g+h: Go to home/feed
 * - g+s: Go to spaces
 * - g+p: Go to profile
 * - g+l: Go to HiveLab
 * - ?: Show keyboard shortcuts help
 */
export interface GlobalShortcutsOptions {
  onCommandPalette?: () => void;
  onSearch?: () => void;
  onGoHome?: () => void;
  onGoSpaces?: () => void;
  onGoProfile?: () => void;
  onGoHiveLab?: () => void;
  onShowHelp?: () => void;
  enabled?: boolean;
}

export function useGlobalShortcuts({
  onCommandPalette,
  onSearch,
  onGoHome,
  onGoSpaces,
  onGoProfile,
  onGoHiveLab,
  onShowHelp,
  enabled = true,
}: GlobalShortcutsOptions = {}) {
  // cmd+k / ctrl+k - Command palette
  useHotkeys(
    'mod+k',
    (e) => {
      e.preventDefault();
      onCommandPalette?.();
    },
    { enabled: enabled && !!onCommandPalette, enableOnFormTags: true },
    [onCommandPalette]
  );

  // / - Focus search
  useHotkeys(
    '/',
    () => onSearch?.(),
    { ...defaultOptions, enabled: enabled && !!onSearch },
    [onSearch]
  );

  // g+h - Go to home
  useHotkeys(
    'g+h',
    () => onGoHome?.(),
    { ...defaultOptions, enabled: enabled && !!onGoHome },
    [onGoHome]
  );

  // g+s - Go to spaces
  useHotkeys(
    'g+s',
    () => onGoSpaces?.(),
    { ...defaultOptions, enabled: enabled && !!onGoSpaces },
    [onGoSpaces]
  );

  // g+p - Go to profile
  useHotkeys(
    'g+p',
    () => onGoProfile?.(),
    { ...defaultOptions, enabled: enabled && !!onGoProfile },
    [onGoProfile]
  );

  // g+l - Go to HiveLab
  useHotkeys(
    'g+l',
    () => onGoHiveLab?.(),
    { ...defaultOptions, enabled: enabled && !!onGoHiveLab },
    [onGoHiveLab]
  );

  // ? - Show help
  useHotkeys(
    'shift+/',
    () => onShowHelp?.(),
    { ...defaultOptions, enabled: enabled && !!onShowHelp },
    [onShowHelp]
  );
}

/**
 * Space board keyboard shortcuts
 *
 * Shortcuts:
 * - n: New post
 * - j/k: Navigate posts
 */
export interface SpaceShortcutsOptions {
  onNewPost?: () => void;
  onNextPost?: () => void;
  onPrevPost?: () => void;
  enabled?: boolean;
}

export function useSpaceShortcuts({
  onNewPost,
  onNextPost,
  onPrevPost,
  enabled = true,
}: SpaceShortcutsOptions = {}) {
  // n - New post
  useHotkeys(
    'n',
    () => onNewPost?.(),
    { ...defaultOptions, enabled: enabled && !!onNewPost },
    [onNewPost]
  );

  // j/k - Navigate posts
  useFeedShortcuts({
    onNextPost,
    onPrevPost,
    enabled,
  });
}

/**
 * HiveLab keyboard shortcuts
 *
 * Shortcuts:
 * - n: New tool
 * - cmd+s / ctrl+s: Save tool
 * - cmd+enter: Run tool
 */
export interface HiveLabShortcutsOptions {
  onNewTool?: () => void;
  onSave?: () => void;
  onRun?: () => void;
  enabled?: boolean;
}

export function useHiveLabShortcuts({
  onNewTool,
  onSave,
  onRun,
  enabled = true,
}: HiveLabShortcutsOptions = {}) {
  // n - New tool
  useHotkeys(
    'n',
    () => onNewTool?.(),
    { ...defaultOptions, enabled: enabled && !!onNewTool },
    [onNewTool]
  );

  // cmd+s / ctrl+s - Save
  useHotkeys(
    'mod+s',
    (e) => {
      e.preventDefault();
      onSave?.();
    },
    { enabled: enabled && !!onSave, enableOnFormTags: true },
    [onSave]
  );

  // cmd+enter - Run
  useHotkeys(
    'mod+enter',
    () => onRun?.(),
    { ...defaultOptions, enabled: enabled && !!onRun },
    [onRun]
  );
}

/**
 * Modal keyboard shortcuts
 *
 * Shortcuts:
 * - escape: Close modal
 * - cmd+enter: Submit (for forms in modals)
 */
export interface ModalShortcutsOptions {
  onClose?: () => void;
  onSubmit?: () => void;
  enabled?: boolean;
}

export function useModalShortcuts({
  onClose,
  onSubmit,
  enabled = true,
}: ModalShortcutsOptions = {}) {
  // escape - Close
  useHotkeys(
    'escape',
    () => onClose?.(),
    { ...defaultOptions, enabled: enabled && !!onClose, enableOnFormTags: true },
    [onClose]
  );

  // cmd+enter - Submit
  useHotkeys(
    'mod+enter',
    () => onSubmit?.(),
    { ...defaultOptions, enabled: enabled && !!onSubmit, enableOnFormTags: true },
    [onSubmit]
  );
}

/**
 * Keyboard shortcuts reference
 *
 * Returns a structured list of all available shortcuts.
 * Use this to display a keyboard shortcuts help modal.
 */
export interface KeyboardShortcut {
  key: string;
  description: string;
  category: 'Navigation' | 'Feed' | 'Spaces' | 'HiveLab' | 'Global';
}

export function getKeyboardShortcuts(): KeyboardShortcut[] {
  return [
    // Global
    { key: 'cmd+k', description: 'Open command palette', category: 'Global' },
    { key: '/', description: 'Focus search', category: 'Global' },
    { key: '?', description: 'Show keyboard shortcuts', category: 'Global' },

    // Navigation
    { key: 'g+h', description: 'Go to home/feed', category: 'Navigation' },
    { key: 'g+s', description: 'Go to spaces', category: 'Navigation' },
    { key: 'g+p', description: 'Go to profile', category: 'Navigation' },
    { key: 'g+l', description: 'Go to HiveLab', category: 'Navigation' },

    // Feed
    { key: 'j', description: 'Next post', category: 'Feed' },
    { key: 'k', description: 'Previous post', category: 'Feed' },
    { key: 'l', description: 'Like post', category: 'Feed' },
    { key: 'c', description: 'Comment on post', category: 'Feed' },
    { key: 'r', description: 'Refresh feed', category: 'Feed' },

    // Spaces
    { key: 'n', description: 'New post', category: 'Spaces' },

    // HiveLab
    { key: 'n', description: 'New tool', category: 'HiveLab' },
    { key: 'cmd+s', description: 'Save tool', category: 'HiveLab' },
    { key: 'cmd+enter', description: 'Run tool', category: 'HiveLab' },
  ];
}
