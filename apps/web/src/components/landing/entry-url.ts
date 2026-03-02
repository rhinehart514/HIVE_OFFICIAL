export const ENTER_URL = '/enter';

/**
 * Build an entry URL while preserving explicit redirect intent.
 * If no redirect is present, falls back to the provided path.
 */
export function buildEnterUrl(
  redirectParam: string | null,
  fallbackRedirect?: string
): string {
  const redirect = redirectParam ?? fallbackRedirect;

  if (!redirect) {
    return ENTER_URL;
  }

  return `${ENTER_URL}?redirect=${encodeURIComponent(redirect)}`;
}
