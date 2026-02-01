/**
 * Import Boundary Tests
 *
 * Verifies routes don't import forbidden modules.
 * This enforces architectural boundaries from IA_INVARIANTS.md.
 *
 * Uses static analysis of import statements to detect violations.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { globSync } from 'glob';

const webRoot = process.cwd();
const appRoot = join(webRoot, 'src', 'app');

/**
 * Extract import paths from a TypeScript/TSX file
 */
function extractImports(filePath: string): string[] {
  const content = readFileSync(filePath, 'utf-8');
  const imports: string[] = [];

  // Match static imports: import ... from '...'
  const staticImportPattern = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  let match;

  while ((match = staticImportPattern.exec(content)) !== null) {
    imports.push(match[1]);
  }

  // Match dynamic imports: import('...')
  const dynamicImportPattern = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  while ((match = dynamicImportPattern.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

/**
 * Forbidden imports by route pattern.
 * Key: route glob pattern (e.g., '/me/*')
 * Value: array of import path substrings that are forbidden
 */
const FORBIDDEN_IMPORTS: Record<string, string[]> = {
  // /me/* owns private state, never social content
  '/me/*': [
    'components/social',
    'components/explore',
    'lib/fetchers/public-profile',
  ],

  // /u/* is public identity, no settings/mutations
  '/u/*': [
    'lib/mutations/settings',
    'lib/mutations/account',
    'components/settings',
  ],

  // /explore/* owns discovery, no mutations
  '/explore/*': [
    'lib/mutations/space',
    'lib/mutations/user',
    // Note: we allow lib/fetchers because explore needs to fetch data
  ],

  // /home/* aggregates attention, doesn't contain activity
  '/home/*': [
    'components/chat', // Chat lives in /s/[handle]
    'components/tool-editor', // Tool editing lives in /lab
  ],

  // /lab/* is builder tools, no social content
  '/lab/*': [
    'components/social',
    'components/feed',
    'lib/fetchers/social',
  ],
};

/**
 * Convert route pattern to filesystem glob
 */
function routePatternToGlob(pattern: string): string {
  return join(
    appRoot,
    pattern.replace(/\*/g, '**'),
    '*.{ts,tsx}'
  );
}

describe('Import Boundaries', () => {
  for (const [routePattern, forbidden] of Object.entries(FORBIDDEN_IMPORTS)) {
    const routeFiles = globSync(routePatternToGlob(routePattern));

    // Skip if no files match (route doesn't exist yet)
    if (routeFiles.length === 0) {
      it.skip(`${routePattern} - no files found`, () => {});
    } else {
      it(`${routePattern} does not import forbidden modules`, () => {
        const violations: string[] = [];

        for (const file of routeFiles) {
          const imports = extractImports(file);
          const relativePath = file.replace(webRoot + '/', '');

          for (const forbiddenPath of forbidden) {
            const violation = imports.find((i) => i.includes(forbiddenPath));
            if (violation) {
              violations.push(
                `${relativePath} imports forbidden "${violation}" (matches "${forbiddenPath}")`
              );
            }
          }
        }

        expect(
          violations,
          `Import boundary violations:\n${violations.join('\n')}`
        ).toEqual([]);
      });
    }
  }
});

describe('Cross-boundary imports', () => {
  it('/explore pages do not import mutation hooks', () => {
    const exploreFiles = globSync(
      join(appRoot, 'explore', '**', '*.{ts,tsx}')
    );

    const violations: string[] = [];
    const mutationPatterns = [
      'useMutation',
      'useCreateSpace',
      'useJoinSpace',
      'useUpdateProfile',
    ];

    for (const file of exploreFiles) {
      const content = readFileSync(file, 'utf-8');
      const relativePath = file.replace(webRoot + '/', '');

      for (const pattern of mutationPatterns) {
        if (content.includes(pattern)) {
          violations.push(`${relativePath} uses ${pattern}`);
        }
      }
    }

    // /explore owns discovery, not participation
    // Using mutation hooks suggests joining/creating from discovery surface
    expect(
      violations,
      `Explore pages using mutations (IA violation - explore owns discovery, not participation):\n${violations.join('\n')}`
    ).toEqual([]);
  });

  it('/u/[handle] pages do not import settings components', () => {
    const profileFiles = globSync(
      join(appRoot, 'u', '**', '*.{ts,tsx}')
    );

    const violations: string[] = [];
    const settingsPatterns = [
      'SettingsForm',
      'ProfileEditForm',
      'AccountSettings',
      'PrivacySettings',
    ];

    for (const file of profileFiles) {
      const content = readFileSync(file, 'utf-8');
      const relativePath = file.replace(webRoot + '/', '');

      for (const pattern of settingsPatterns) {
        if (content.includes(pattern)) {
          violations.push(`${relativePath} uses ${pattern}`);
        }
      }
    }

    // /u/[handle] is public identity, settings belong in /me/settings
    expect(
      violations,
      `Public profile pages using settings components (IA violation - /u/[handle] never contains settings):\n${violations.join('\n')}`
    ).toEqual([]);
  });

  it('/s/[handle] pages do not import account settings', () => {
    const spaceFiles = globSync(
      join(appRoot, 's', '**', '*.{ts,tsx}')
    );

    const violations: string[] = [];
    const accountPatterns = [
      'AccountSettings',
      'useDeleteAccount',
      'useChangePassword',
      'useChangeEmail',
    ];

    for (const file of spaceFiles) {
      const content = readFileSync(file, 'utf-8');
      const relativePath = file.replace(webRoot + '/', '');

      for (const pattern of accountPatterns) {
        if (content.includes(pattern)) {
          violations.push(`${relativePath} uses ${pattern}`);
        }
      }
    }

    // /s/[handle] owns space membership, not account settings
    expect(
      violations,
      `Space pages using account settings (IA violation - /s/[handle] never contains accountSettings):\n${violations.join('\n')}`
    ).toEqual([]);
  });
});
