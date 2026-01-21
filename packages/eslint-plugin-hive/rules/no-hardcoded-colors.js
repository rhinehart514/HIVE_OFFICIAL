/**
 * @fileoverview Block hardcoded hex colors
 * @author HIVE Team
 *
 * Enforces use of design system color tokens instead of hardcoded hex values.
 *
 * ❌ Bad:
 * style={{ color: '#0A0A0A', background: '#FFFFFF' }}
 * className="bg-[#0A0A0A] text-[#FFFFFF]"
 *
 * ✅ Good:
 * import { MONOCHROME } from '@hive/tokens';
 * style={{ color: MONOCHROME.black, background: MONOCHROME.white }}
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Block hardcoded hex colors, enforce design system color tokens',
      category: 'Design System',
      recommended: true,
    },
    messages: {
      hardcodedColor:
        'Hardcoded color "{{color}}" detected. Use MONOCHROME, GOLD, or atmosphere tokens from @hive/tokens instead.',
    },
    fixable: null,
    schema: [],
  },

  create(context) {
    // Match #XXX or #XXXXXX (hex colors)
    const HEX_COLOR_PATTERN = /#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b/g;

    function checkForHexColors(text, node) {
      const matches = text.matchAll(HEX_COLOR_PATTERN);
      for (const match of matches) {
        context.report({
          node,
          messageId: 'hardcodedColor',
          data: {
            color: match[0],
          },
        });
      }
    }

    return {
      // Check JSX className attributes
      JSXAttribute(node) {
        if (node.name.name === 'className' && node.value) {
          if (node.value.type === 'Literal') {
            checkForHexColors(node.value.value, node.value);
          } else if (node.value.type === 'JSXExpressionContainer') {
            const expression = node.value.expression;
            if (expression.type === 'TemplateLiteral') {
              expression.quasis.forEach((quasi) => {
                checkForHexColors(quasi.value.raw, quasi);
              });
            }
          }
        }

        // Check style prop
        if (node.name.name === 'style' && node.value) {
          if (node.value.type === 'JSXExpressionContainer') {
            const expression = node.value.expression;
            // Check object literal properties
            if (expression.type === 'ObjectExpression') {
              expression.properties.forEach((prop) => {
                if (prop.value && prop.value.type === 'Literal') {
                  const value = prop.value.value;
                  if (typeof value === 'string') {
                    checkForHexColors(value, prop.value);
                  }
                }
              });
            }
          }
        }
      },

      // Check Literal nodes (catch style={{ color: '#0A0A0A' }})
      Literal(node) {
        if (typeof node.value === 'string') {
          checkForHexColors(node.value, node);
        }
      },

      // Check TemplateLiteral nodes (catch `#0A0A0A`)
      TemplateLiteral(node) {
        node.quasis.forEach((quasi) => {
          checkForHexColors(quasi.value.raw, quasi);
        });
      },
    };
  },
};
