/**
 * @fileoverview Enforce useHiveQuery for data fetching
 * @author HIVE Team
 *
 * Blocks the legacy useState + fetch pattern, enforces useHiveQuery.
 *
 * ❌ Bad:
 * const [data, setData] = useState(null);
 * useEffect(() => { fetch('/api/spaces').then(r => r.json()).then(setData); }, []);
 *
 * ✅ Good:
 * const { data, initial, error, refetch } = useHiveQuery({
 *   queryKey: ['spaces', { campusId }],
 *   queryFn: () => getSpaces(campusId)
 * });
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce useHiveQuery instead of useState + fetch pattern',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      useLegacyFetch:
        'Use useHiveQuery from @hive/hooks instead of useState + fetch. See docs/FRONTEND_MIGRATION.md for migration guide.',
    },
    fixable: null,
    schema: [],
  },

  create(context) {
    // Track useState calls in each component
    const componentState = new Map();

    function getCurrentComponent(node) {
      let current = node;
      while (current) {
        // Check if this is a function component or hook
        if (
          (current.type === 'FunctionDeclaration' || current.type === 'ArrowFunctionExpression') &&
          current.id &&
          /^[A-Z]/.test(current.id.name)
        ) {
          return current;
        }
        if (
          current.type === 'VariableDeclarator' &&
          current.id &&
          /^[A-Z]/.test(current.id.name)
        ) {
          return current;
        }
        current = current.parent;
      }
      return null;
    }

    return {
      // Track useState calls
      CallExpression(node) {
        const callee = node.callee;

        // Check for useState
        if (callee.type === 'Identifier' && callee.name === 'useState') {
          const component = getCurrentComponent(node);
          if (component) {
            if (!componentState.has(component)) {
              componentState.set(component, { hasUseState: false, hasFetch: false });
            }
            componentState.get(component).hasUseState = true;
          }
        }

        // Check for fetch calls
        if (
          (callee.type === 'Identifier' && callee.name === 'fetch') ||
          (callee.type === 'MemberExpression' &&
            callee.object.name === 'window' &&
            callee.property.name === 'fetch')
        ) {
          const component = getCurrentComponent(node);
          if (component) {
            if (!componentState.has(component)) {
              componentState.set(component, { hasUseState: false, hasFetch: false });
            }
            componentState.get(component).hasFetch = true;
          }
        }
      },

      // Check at program exit if any component has both useState and fetch
      'Program:exit'() {
        for (const [component, state] of componentState.entries()) {
          if (state.hasUseState && state.hasFetch) {
            context.report({
              node: component,
              messageId: 'useLegacyFetch',
            });
          }
        }
      },
    };
  },
};
