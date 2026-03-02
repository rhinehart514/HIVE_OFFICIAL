/**
 * PWA Triggers — Lightweight event bus for value-moment triggers.
 *
 * After a user completes a high-value action (joins a space, creates an app,
 * etc.), we fire a custom event. The PWA layer listens and shows
 * contextual prompts (push permission, install prompt) at the right time.
 */

const VALUE_EVENT = 'hive:value-moment';

export type ValueMomentType = 'space-join' | 'tool-interaction' | 'first-post';

interface ValueMomentDetail {
  type: ValueMomentType;
  spaceId?: string;
  spaceName?: string;
}

/**
 * Fire after a value moment (space join, first tool use, etc.)
 * This enables the push prompt and install prompt to trigger at the right time.
 */
export function emitValueMoment(detail: ValueMomentDetail): void {
  if (typeof window === 'undefined') return;

  // Mark that user has had a value moment — enables push auto-request
  try {
    localStorage.setItem('hive:push-prompted', '1');
  } catch {
    // localStorage unavailable
  }

  window.dispatchEvent(new CustomEvent(VALUE_EVENT, { detail }));
}

/**
 * Subscribe to value moment events. Returns unsubscribe function.
 */
export function onValueMoment(
  callback: (detail: ValueMomentDetail) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const detail = (e as CustomEvent<ValueMomentDetail>).detail;
    callback(detail);
  };

  window.addEventListener(VALUE_EVENT, handler);
  return () => window.removeEventListener(VALUE_EVENT, handler);
}
