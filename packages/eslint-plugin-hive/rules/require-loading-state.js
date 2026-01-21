/**
 * @fileoverview Require loading.tsx for app router pages
 * @author HIVE Team
 *
 * Ensures every app router page has a corresponding loading.tsx file.
 *
 * ❌ Bad:
 * app/spaces/page.tsx exists
 * app/spaces/loading.tsx MISSING
 *
 * ✅ Good:
 * app/spaces/page.tsx exists
 * app/spaces/loading.tsx exists
 */

const path = require('path');
const fs = require('fs');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require loading.tsx file for every app router page',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      missingLoadingState:
        'Missing loading.tsx in this directory. Every page.tsx should have a corresponding loading.tsx for the initial loading state.',
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
        const loadingFile = path.join(dir, 'loading.tsx');

        if (!fs.existsSync(loadingFile)) {
          context.report({
            node,
            messageId: 'missingLoadingState',
          });
        }
      },
    };
  },
};
