const UB_ENTER_BASE = '/enter?schoolId=ub-buffalo&domain=buffalo.edu';

/**
 * Build a UB entry URL while preserving explicit redirect intent.
 * If no redirect is present, falls back to the provided path.
 */
export function buildUbEnterUrl(
  redirectParam: string | null,
  fallbackRedirect?: string
): string {
  const redirect = redirectParam ?? fallbackRedirect;

  if (!redirect) {
    return UB_ENTER_BASE;
  }

  return `${UB_ENTER_BASE}&redirect=${encodeURIComponent(redirect)}`;
}
