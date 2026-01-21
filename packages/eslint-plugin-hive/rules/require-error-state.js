/**
 * @fileoverview Require error.tsx for app router pages
 * @author HIVE Team
 *
 * Ensures every app router page has a corresponding error.tsx file.
 *
 * ❌ Bad:
 * app/spaces/page.tsx exists
 * app/spaces/error.tsx MISSING
 *
 * ✅ Good:
 * app/spaces/page.tsx exists
 * app/spaces/error.tsx exists
 */

const path = require('path');
const fs = require('fs');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require error.tsx file for every app router page',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      missingErrorState:
        'Missing error.tsx in this directory. Every page.tsx should have a corresponding error.tsx for error boundaries.',
    },
    fixable: null,
    schema: [],
  },

  create(context) {
    const filename = context.getFilename();

    // Only check page.tsx files in app directory
    if (!filename.includes('/app/') || !filename.endsWith('/page.tsx')) {
      return {};
    }

    return {
      Program(node) {
        const dir = path.dirname(filename);
        const errorFile = path.join(dir, 'error.tsx');

        if (!fs.existsSync(errorFile)) {
          context.report({
            node,
            messageId: 'missingErrorState',
          });
        }
      },
    };
  },
};
