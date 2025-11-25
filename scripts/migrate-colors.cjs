#!/usr/bin/env node
/**
 * Color Migration Script
 * Automatically replaces hard-coded color values with semantic tokens
 *
 * Usage:
 *   node scripts/migrate-colors.cjs <file-or-directory>
 *   node scripts/migrate-colors.cjs packages/ui/src/atomic/04-Profile
 *   node scripts/migrate-colors.cjs --dry-run packages/ui
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Color mapping patterns
const COLOR_PATTERNS = [
  // Pattern 1: color-mix with semantic tokens
  {
    pattern: /border-\[color-mix\(in_srgb,var\(--hive-border-default[^)]*\)\s*(\d+)%,transparent\)\]/g,
    replacement: (match, opacity) => `border-border-default/${opacity}`,
    name: 'border-default with opacity'
  },
  {
    pattern: /bg-\[color-mix\(in_srgb,var\(--hive-background-secondary[^)]*\)\s*(\d+)%,transparent\)\]/g,
    replacement: (match, opacity) => `bg-background-secondary/${opacity}`,
    name: 'background-secondary with opacity'
  },
  {
    pattern: /bg-\[color-mix\(in_srgb,var\(--hive-background-tertiary[^)]*\)\s*(\d+)%,transparent\)\]/g,
    replacement: (match, opacity) => `bg-background-tertiary/${opacity}`,
    name: 'background-tertiary with opacity'
  },
  {
    pattern: /bg-\[color-mix\(in_srgb,var\(--hive-brand-primary[^)]*\)\s*(\d+)%,transparent\)\]/g,
    replacement: (match, opacity) => `bg-brand-primary/${opacity}`,
    name: 'brand-primary background with opacity'
  },
  {
    pattern: /(via|to|from)-\[color-mix\(in_srgb,var\(--hive-brand-primary[^)]*\)\s*(\d+)%,transparent\)\]/g,
    replacement: (match, direction, opacity) => `${direction}-brand-primary/${opacity}`,
    name: 'brand-primary gradient with opacity'
  },
  {
    pattern: /text-\[color-mix\(in_srgb,var\(--hive-text-muted[^)]*\)\s*(\d+)%,transparent\)\]/g,
    replacement: (match, opacity) => `text-text-muted/${opacity}`,
    name: 'text-muted with opacity'
  },
  {
    pattern: /text-\[color-mix\(in_srgb,var\(--hive-text-secondary[^)]*\)\s*(\d+)%,transparent\)\]/g,
    replacement: (match, opacity) => `text-text-secondary/${opacity}`,
    name: 'text-secondary with opacity'
  },

  // Pattern 2: Direct CSS variable references
  {
    pattern: /text-\[var\(--hive-text-primary[^)]*\)\]/g,
    replacement: 'text-text-primary',
    name: 'text-primary'
  },
  {
    pattern: /text-\[var\(--hive-text-secondary[^)]*\)\]/g,
    replacement: 'text-text-secondary',
    name: 'text-secondary'
  },
  {
    pattern: /text-\[var\(--hive-text-muted[^)]*\)\]/g,
    replacement: 'text-text-muted',
    name: 'text-muted'
  },
  {
    pattern: /text-\[var\(--hive-text-tertiary[^)]*\)\]/g,
    replacement: 'text-text-tertiary',
    name: 'text-tertiary'
  },
  {
    pattern: /text-\[var\(--hive-brand-primary[^)]*\)\]/g,
    replacement: 'text-brand-primary',
    name: 'text brand-primary'
  },
  {
    pattern: /bg-\[var\(--hive-background-primary[^)]*\)\]/g,
    replacement: 'bg-background-primary',
    name: 'background-primary'
  },
  {
    pattern: /bg-\[var\(--hive-background-secondary[^)]*\)\]/g,
    replacement: 'bg-background-secondary',
    name: 'background-secondary'
  },
  {
    pattern: /bg-\[var\(--hive-background-tertiary[^)]*\)\]/g,
    replacement: 'bg-background-tertiary',
    name: 'background-tertiary'
  },
  {
    pattern: /border-\[var\(--hive-border-default[^)]*\)\]/g,
    replacement: 'border-border-default',
    name: 'border-default'
  },
  {
    pattern: /border-\[var\(--hive-border-hover[^)]*\)\]/g,
    replacement: 'border-border-hover',
    name: 'border-hover'
  },
  {
    pattern: /border-\[var\(--hive-border-focus[^)]*\)\]/g,
    replacement: 'border-border-focus',
    name: 'border-focus'
  },

  // Pattern 3: Hard-coded hex values (common ones)
  {
    pattern: /text-\[#[Ff]7[Ff]7[Ff][Ff]\]/g,
    replacement: 'text-text-primary',
    name: 'hardcoded white text'
  },
  {
    pattern: /text-\[#[Cc]0[Cc]2[Cc][Cc]\]/g,
    replacement: 'text-text-secondary',
    name: 'hardcoded gray text'
  },
  {
    pattern: /bg-\[#171717\]/g,
    replacement: 'bg-background-secondary',
    name: 'hardcoded background'
  },
  {
    pattern: /bg-\[#262626\]/g,
    replacement: 'bg-background-tertiary',
    name: 'hardcoded tertiary background'
  },
];

/**
 * Process a single file
 */
function processFile(filePath, dryRun = false) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return { replacements: 0, patterns: [] };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  let newContent = content;
  let totalReplacements = 0;
  const appliedPatterns = [];

  for (const { pattern, replacement, name } of COLOR_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      const count = matches.length;
      totalReplacements += count;
      appliedPatterns.push({ name, count });

      if (typeof replacement === 'function') {
        newContent = newContent.replace(pattern, replacement);
      } else {
        newContent = newContent.replace(pattern, replacement);
      }
    }
  }

  if (totalReplacements > 0) {
    console.log(`\n📝 ${filePath}`);
    appliedPatterns.forEach(({ name, count }) => {
      console.log(`   ✅ ${count}x ${name}`);
    });

    if (!dryRun) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log(`   💾 Saved`);
    } else {
      console.log(`   🔍 Dry run - no changes made`);
    }
  }

  return { replacements: totalReplacements, patterns: appliedPatterns };
}

/**
 * Process directory recursively
 */
function processDirectory(dirPath, dryRun = false) {
  const pattern = path.join(dirPath, '**/*.{ts,tsx,js,jsx}');
  const files = glob.sync(pattern, { ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'] });

  console.log(`🔍 Found ${files.length} files in ${dirPath}`);

  let totalReplacements = 0;
  let filesModified = 0;

  for (const file of files) {
    const { replacements } = processFile(file, dryRun);
    if (replacements > 0) {
      totalReplacements += replacements;
      filesModified++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Files scanned: ${files.length}`);
  console.log(`   Files modified: ${filesModified}`);
  console.log(`   Total replacements: ${totalReplacements}`);

  if (dryRun) {
    console.log(`\n💡 Run without --dry-run to apply changes`);
  }
}

/**
 * Main
 */
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const targetPath = args.find(arg => !arg.startsWith('--'));

  if (!targetPath) {
    console.error('Usage: node migrate-colors.cjs [--dry-run] <file-or-directory>');
    process.exit(1);
  }

  const resolvedPath = path.resolve(targetPath);
  const stats = fs.statSync(resolvedPath);

  console.log(`🎨 HIVE Color Migration Tool`);
  console.log(`${dryRun ? '🔍 DRY RUN MODE' : '💾 WRITE MODE'}\n`);

  if (stats.isDirectory()) {
    processDirectory(resolvedPath, dryRun);
  } else if (stats.isFile()) {
    const result = processFile(resolvedPath, dryRun);
    if (result.replacements === 0) {
      console.log(`✅ No changes needed in ${resolvedPath}`);
    }
  } else {
    console.error(`❌ Invalid path: ${resolvedPath}`);
    process.exit(1);
  }

  console.log(`\n✨ Migration complete!`);
}

// Check for glob package
try {
  require.resolve('glob');
} catch (e) {
  console.error('❌ Missing dependency: glob');
  console.error('Run: pnpm add -D glob');
  process.exit(1);
}

main();
