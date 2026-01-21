/**
 * @fileoverview Block hardcoded Tailwind spacing classes
 * @author HIVE Team
 *
 * Enforces use of design system tokens instead of hardcoded Tailwind classes.
 *
 * ❌ Bad:
 * className="py-24 px-8 gap-12"
 *
 * ✅ Good:
 * import { SPACING } from '@hive/tokens';
 * style={{ paddingTop: SPACING.xl, paddingLeft: SPACING.lg, gap: SPACING.md }}
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Block hardcoded Tailwind spacing classes, enforce design system tokens',
      category: 'Design System',
      recommended: true,
    },
    messages: {
      hardcodedSpacing:
        'Hardcoded Tailwind spacing "{{class}}" detected. Use SPACING tokens from @hive/tokens instead.',
    },
    fixable: null,
    schema: [],
  },

  create(context) {
    const SPACING_PATTERNS = [
      /\bp-\d+/,   // padding: p-4, p-8, etc.
      /\bpx-\d+/,  // padding-x: px-4, px-8, etc.
      /\bpy-\d+/,  // padding-y: py-4, py-8, etc.
      /\bpt-\d+/,  // padding-top: pt-4, pt-8, etc.
      /\bpr-\d+/,  // padding-right
      /\bpb-\d+/,  // padding-bottom
      /\bpl-\d+/,  // padding-left
      /\bm-\d+/,   // margin: m-4, m-8, etc.
      /\bmx-\d+/,  // margin-x
      /\bmy-\d+/,  // margin-y
      /\bmt-\d+/,  // margin-top
      /\bmr-\d+/,  // margin-right
      /\bmb-\d+/,  // margin-bottom
      /\bml-\d+/,  // margin-left
      /\bgap-\d+/, // gap: gap-4, gap-8, etc.
      /\bspace-x-\d+/, // space-x
      /\bspace-y-\d+/, // space-y
    ];

    function checkStringLiteral(node) {
      const value = node.value;
      if (typeof value !== 'string') return;

      for (const pattern of SPACING_PATTERNS) {
        const match = value.match(pattern);
        if (match) {
          context.report({
            node,
            messageId: 'hardcodedSpacing',
            data: {
              class: match[0],
            },
          });
        }
      }
    }

    return {
      // Check JSX className attributes
      JSXAttribute(node) {
        if (node.name.name === 'className' && node.value) {
          if (node.value.type === 'Literal') {
            checkStringLiteral(node.value);
          } else if (node.value.type === 'JSXExpressionContainer') {
            // Handle template literals in className
            const expression = node.value.expression;
            if (expression.type === 'TemplateLiteral') {
              expression.quasis.forEach((quasi) => {
                SPACING_PATTERNS.forEach((pattern) => {
                  const match = quasi.value.raw.match(pattern);
                  if (match) {
                    context.report({
                      node: quasi,
                      messageId: 'hardcodedSpacing',
                      data: {
                        class: match[0],
                      },
                    });
                  }
                });
              });
            }
          }
        }
      },
    };
  },
};
