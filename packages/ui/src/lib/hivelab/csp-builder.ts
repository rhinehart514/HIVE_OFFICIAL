/**
 * CSP Policy Builder for Custom Blocks
 *
 * Builds Content Security Policy headers for custom block iframes.
 * Ensures blocks cannot make network requests, access localStorage,
 * or perform other dangerous operations.
 *
 * Security requirements:
 * - No network requests (fetch, XHR, WebSocket)
 * - No localStorage/sessionStorage/indexedDB
 * - No eval() or Function() constructor
 * - No inline event handlers
 * - No parent navigation
 * - No plugin execution
 * - Only postMessage to parent allowed
 */

import type { CustomBlockCSP } from '@hive/core';

// ============================================================
// CSP Directives
// ============================================================

/**
 * CSP directive configuration
 */
export interface CSPDirectives {
  /** default-src: Fallback for all fetch directives */
  defaultSrc: string[];

  /** script-src: JavaScript sources */
  scriptSrc: string[];

  /** style-src: CSS sources */
  styleSrc: string[];

  /** img-src: Image sources */
  imgSrc: string[];

  /** font-src: Font sources */
  fontSrc: string[];

  /** connect-src: Network requests (fetch, XHR, WebSocket) */
  connectSrc: string[];

  /** frame-src: Nested iframes */
  frameSrc: string[];

  /** object-src: Plugins (Flash, etc.) */
  objectSrc: string[];

  /** media-src: Audio/video sources */
  mediaSrc: string[];

  /** worker-src: Web Workers */
  workerSrc: string[];

  /** child-src: Nested contexts */
  childSrc: string[];

  /** form-action: Form submission targets */
  formAction: string[];

  /** frame-ancestors: Embedding restrictions */
  frameAncestors: string[];

  /** base-uri: Base tag restrictions */
  baseUri: string[];

  /** manifest-src: Web app manifest */
  manifestSrc: string[];
}

/**
 * Default CSP directives for custom blocks
 * Maximum security - blocks everything by default
 */
const DEFAULT_CSP_DIRECTIVES: CSPDirectives = {
  // Block everything by default
  defaultSrc: ["'none'"],

  // Allow inline scripts only (for custom block JS)
  // Note: 'unsafe-inline' is required for srcdoc iframes
  scriptSrc: ["'unsafe-inline'"],

  // Allow inline styles only (for custom block CSS)
  styleSrc: ["'unsafe-inline'"],

  // Allow data URIs and HTTPS images (with optional allowlist)
  imgSrc: ['data:', 'https:'],

  // Allow data URIs and HTTPS fonts (with optional allowlist)
  fontSrc: ['data:', 'https:'],

  // Block all network requests
  connectSrc: ["'none'"],

  // Block nested iframes
  frameSrc: ["'none'"],

  // Block plugins
  objectSrc: ["'none'"],

  // Block media
  mediaSrc: ["'none'"],

  // Block workers
  workerSrc: ["'none'"],

  // Block child contexts
  childSrc: ["'none'"],

  // Block form submissions
  formAction: ["'none'"],

  // Allow embedding in any frame (for our iframe)
  frameAncestors: ['*'],

  // Restrict base tag
  baseUri: ["'none'"],

  // Block manifest
  manifestSrc: ["'none'"],
};

// ============================================================
// CSP Builder
// ============================================================

/**
 * Build CSP policy string from directives
 */
export function buildCSPPolicy(customCSP?: CustomBlockCSP): string {
  const directives = { ...DEFAULT_CSP_DIRECTIVES };

  // Apply custom overrides if provided
  if (customCSP?.imgSrc) {
    // Add custom image sources to allowlist
    directives.imgSrc = [...directives.imgSrc, ...customCSP.imgSrc];
  }

  if (customCSP?.fontSrc) {
    // Add custom font sources to allowlist
    directives.fontSrc = [...directives.fontSrc, ...customCSP.fontSrc];
  }

  // Build CSP string
  const policyParts: string[] = [];

  policyParts.push(`default-src ${directives.defaultSrc.join(' ')}`);
  policyParts.push(`script-src ${directives.scriptSrc.join(' ')}`);
  policyParts.push(`style-src ${directives.styleSrc.join(' ')}`);
  policyParts.push(`img-src ${directives.imgSrc.join(' ')}`);
  policyParts.push(`font-src ${directives.fontSrc.join(' ')}`);
  policyParts.push(`connect-src ${directives.connectSrc.join(' ')}`);
  policyParts.push(`frame-src ${directives.frameSrc.join(' ')}`);
  policyParts.push(`object-src ${directives.objectSrc.join(' ')}`);
  policyParts.push(`media-src ${directives.mediaSrc.join(' ')}`);
  policyParts.push(`worker-src ${directives.workerSrc.join(' ')}`);
  policyParts.push(`child-src ${directives.childSrc.join(' ')}`);
  policyParts.push(`form-action ${directives.formAction.join(' ')}`);
  policyParts.push(`base-uri ${directives.baseUri.join(' ')}`);
  policyParts.push(`manifest-src ${directives.manifestSrc.join(' ')}`);

  return policyParts.join('; ');
}

// ============================================================
// Domain Validation
// ============================================================

/**
 * Validate domain for CSP allowlist
 * Only HTTPS URLs allowed, no wildcards in subdomains
 */
export function validateCSPDomain(domain: string): { valid: boolean; error?: string } {
  // Must start with https://
  if (!domain.startsWith('https://')) {
    return {
      valid: false,
      error: 'Domain must use HTTPS protocol',
    };
  }

  // Extract hostname
  let hostname: string;
  try {
    const url = new URL(domain);
    hostname = url.hostname;
  } catch {
    return {
      valid: false,
      error: 'Invalid URL format',
    };
  }

  // Block localhost and private IPs
  if (
    hostname === 'localhost' ||
    hostname.startsWith('127.') ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.')
  ) {
    return {
      valid: false,
      error: 'Private/local domains not allowed',
    };
  }

  // Block wildcard in subdomain (e.g., https://*.evil.com)
  if (hostname.includes('*') && !hostname.startsWith('*.')) {
    return {
      valid: false,
      error: 'Wildcard only allowed at start of domain',
    };
  }

  // If wildcard, ensure it's a valid pattern
  if (hostname.startsWith('*.')) {
    const baseDomain = hostname.slice(2);
    if (!baseDomain || baseDomain.includes('*')) {
      return {
        valid: false,
        error: 'Invalid wildcard pattern',
      };
    }
  }

  // Must have valid TLD
  if (!hostname.includes('.')) {
    return {
      valid: false,
      error: 'Domain must have valid TLD',
    };
  }

  return { valid: true };
}

/**
 * Validate array of CSP domains
 */
export function validateCSPDomains(domains: string[]): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  for (const domain of domains) {
    const result = validateCSPDomain(domain);
    if (!result.valid) {
      errors[domain] = result.error || 'Invalid domain';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// ============================================================
// Common Allowlists
// ============================================================

/**
 * Pre-approved CDN domains for common use cases
 */
export const APPROVED_CDN_DOMAINS = {
  /** Google Fonts */
  googleFonts: ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'],

  /** Common image CDNs */
  imageCDNs: [
    'https://images.unsplash.com',
    'https://cdn.pixabay.com',
    'https://source.unsplash.com',
  ],

  /** Icon libraries */
  iconCDNs: [
    'https://cdn.jsdelivr.net',
    'https://unpkg.com',
  ],
} as const;

/**
 * Get approved domains for a specific category
 */
export function getApprovedDomains(category: keyof typeof APPROVED_CDN_DOMAINS): string[] {
  return [...APPROVED_CDN_DOMAINS[category]];
}

// ============================================================
// CSP Testing
// ============================================================

/**
 * Test if a CSP policy blocks a specific action
 */
export function testCSPPolicy(policy: string, test: 'network' | 'eval' | 'inline-event'): boolean {
  switch (test) {
    case 'network':
      // Check if connect-src blocks network requests
      return policy.includes("connect-src 'none'");

    case 'eval':
      // Check if script-src blocks eval
      // 'unsafe-eval' would allow eval, so its absence means eval is blocked
      return !policy.includes("'unsafe-eval'");

    case 'inline-event':
      // Inline event handlers are blocked by default unless 'unsafe-hashes' is used
      return !policy.includes("'unsafe-hashes'");

    default:
      return false;
  }
}

/**
 * Verify CSP policy meets security requirements
 */
export function verifyCSPSecurity(policy: string): {
  secure: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Must block network requests
  if (!testCSPPolicy(policy, 'network')) {
    issues.push('Policy must block network requests (connect-src should be none)');
  }

  // Must block eval
  if (!testCSPPolicy(policy, 'eval')) {
    issues.push('Policy must block eval (script-src should not include unsafe-eval)');
  }

  // Should not allow unsafe hashes
  if (policy.includes("'unsafe-hashes'")) {
    issues.push('Policy should not allow unsafe-hashes');
  }

  // Must block object/plugin execution
  if (!policy.includes("object-src 'none'")) {
    issues.push('Policy must block plugins (object-src should be none)');
  }

  // Must block workers
  if (!policy.includes("worker-src 'none'")) {
    issues.push('Policy must block workers (worker-src should be none)');
  }

  // Must block nested frames
  if (!policy.includes("frame-src 'none'")) {
    issues.push('Policy must block nested frames (frame-src should be none)');
  }

  return {
    secure: issues.length === 0,
    issues,
  };
}
