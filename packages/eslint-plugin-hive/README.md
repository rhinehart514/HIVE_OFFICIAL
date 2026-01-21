# @hive/eslint-plugin-hive

Custom ESLint rules for HIVE design system enforcement and best practices.

## Purpose

Enforce infrastructure-grade frontend patterns:
- Design system compliance (no hardcoded spacing/colors)
- Standardized data fetching (useHiveQuery)
- Required state handling (loading.tsx, error.tsx)

## Installation

```bash
pnpm add -D @hive/eslint-plugin-hive
```

## Configuration

Add to your ESLint config:

```js
// eslint.config.js or .eslintrc.js
module.exports = {
  plugins: ['@hive/hive'],
  extends: ['plugin:@hive/hive/recommended'],

  // Or configure rules individually:
  rules: {
    '@hive/hive/no-hardcoded-spacing': 'error',
    '@hive/hive/no-hardcoded-colors': 'error',
    '@hive/hive/enforce-hive-query': 'warn',
    '@hive/hive/require-loading-state': 'warn',
    '@hive/hive/require-error-state': 'warn',
  },
};
```

## Rules

### `no-hardcoded-spacing`

Blocks hardcoded Tailwind spacing classes. Enforces use of SPACING tokens.

❌ **Bad:**
```tsx
<div className="py-24 px-8 gap-12">
```

✅ **Good:**
```tsx
import { SPACING } from '@hive/tokens';
<div style={{ paddingTop: SPACING.xl, paddingLeft: SPACING.lg, gap: SPACING.md }}>
```

**Severity:** `error` (blocks build)

---

### `no-hardcoded-colors`

Blocks hardcoded hex colors. Enforces use of color tokens from design system.

❌ **Bad:**
```tsx
<div style={{ color: '#0A0A0A', background: '#FFFFFF' }} />
<div className="bg-[#0A0A0A] text-[#FFFFFF]" />
```

✅ **Good:**
```tsx
import { MONOCHROME } from '@hive/tokens';
<div style={{ color: MONOCHROME.black, background: MONOCHROME.white }} />
```

**Severity:** `error` (blocks build)

---

### `enforce-hive-query`

Blocks legacy `useState` + `fetch` pattern. Enforces `useHiveQuery` for data fetching.

❌ **Bad:**
```tsx
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
useEffect(() => {
  fetch('/api/spaces').then(r => r.json()).then(setData);
}, []);
```

✅ **Good:**
```tsx
const { data, initial, error, refetch } = useHiveQuery({
  queryKey: ['spaces', { campusId }],
  queryFn: () => getSpaces(campusId),
  enableRealtime: true,
  staleTime: 30000,
});
```

**Severity:** `warn` (won't block build initially)

**Migration Guide:** See `docs/FRONTEND_MIGRATION.md`

---

### `require-loading-state`

Ensures every `page.tsx` has a corresponding `loading.tsx`.

❌ **Bad:**
```
app/spaces/
  └── page.tsx  (loading.tsx MISSING)
```

✅ **Good:**
```
app/spaces/
  ├── page.tsx
  └── loading.tsx
```

**Severity:** `warn` (won't block build initially)

---

### `require-error-state`

Ensures every `page.tsx` has a corresponding `error.tsx`.

❌ **Bad:**
```
app/spaces/
  └── page.tsx  (error.tsx MISSING)
```

✅ **Good:**
```
app/spaces/
  ├── page.tsx
  └── error.tsx
```

**Severity:** `warn` (won't block build initially)

---

## Rollout Strategy

**Phase 1: Audit (Weeks 1-2)**
- Install plugin
- Set all rules to `warn`
- Generate baseline violations report
- Fix highest-impact files first

**Phase 2: Gradual Enforcement (Weeks 3-8)**
- Migrate files one-by-one
- Once a directory is clean, set rules to `error` for that path
- Use ESLint overrides to enforce gradually

**Phase 3: Full Enforcement (Weeks 9+)**
- All rules set to `error` globally
- Pre-commit hooks block violations
- CI fails on any violations

## ESLint Override Example

Enforce rules only in migrated directories:

```js
module.exports = {
  plugins: ['@hive/hive'],

  // Warn globally
  rules: {
    '@hive/hive/no-hardcoded-spacing': 'warn',
    '@hive/hive/no-hardcoded-colors': 'warn',
  },

  // Error in migrated directories
  overrides: [
    {
      files: ['apps/web/src/app/feed/**/*.tsx'],
      rules: {
        '@hive/hive/no-hardcoded-spacing': 'error',
        '@hive/hive/no-hardcoded-colors': 'error',
      },
    },
  ],
};
```

## Development

### Adding a New Rule

1. Create rule file: `packages/eslint-plugin-hive/rules/your-rule.js`
2. Export rule in `index.js`
3. Add to recommended config
4. Document in this README
5. Add tests (TODO: set up test infrastructure)

### Testing Rules Locally

```bash
# Test on a specific file
npx eslint --plugin @hive/hive --rule '@hive/hive/no-hardcoded-spacing: error' path/to/file.tsx

# Test on entire app
cd apps/web
pnpm lint
```

## Resources

- **Design System Tokens:** `packages/tokens/src/`
- **useHiveQuery Hook:** `packages/hooks/src/use-hive-query.ts`
- **Migration Guide:** `docs/FRONTEND_MIGRATION.md`
- **Frontend Audit:** `FRONTEND_AUDIT.md`

## Roadmap

- [ ] Add autofixers for spacing/color rules
- [ ] Add tests for all rules
- [ ] Add `require-empty-state` rule
- [ ] Add `no-inline-styles` rule (enforce CSS-in-JS patterns)
- [ ] Add rule to enforce primitive usage over custom components

---

**Status:** ✅ Active
**Maintainer:** HIVE Core Team
**Version:** 1.0.0
