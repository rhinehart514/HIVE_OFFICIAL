# HIVE Disk Space Cleanup Guide

**Last Updated**: January 2025  
**Status**: ✅ Active maintenance

## Quick Start

### Interactive Cleanup (Recommended)
```bash
pnpm cleanup:disk
```

This launches an interactive menu with safe cleanup options.

### Quick Cleanup Commands
```bash
# Safe: Remove build artifacts and caches (recommended)
pnpm cleanup:all

# Safe: Remove only caches
node tooling/scripts/clear-caches.cjs

# Safe: Remove only build artifacts
pnpm clean:build

# Remove log files
pnpm cleanup:logs

# Remove backup files
pnpm cleanup:backups
```

## Current Disk Usage

**Check your disk space:**
```bash
df -h .
```

**Check HIVE project sizes:**
```bash
du -sh node_modules .turbo apps/*/.next packages/*/dist 2>/dev/null | sort -hr
```

## Cleanup Options Explained

### 1. Safe Cleanup (Recommended)

**What it removes:**
- `.turbo/` - Turborepo cache (regenerated on next build)
- `apps/*/.next/` - Next.js build cache (regenerated on next build)
- `packages/*/dist/` - Package build outputs (regenerated on build)
- `packages/*/storybook-static/` - Storybook static builds (regenerated)
- `node_modules/.cache/` - Various tool caches
- `node_modules/.vite/` - Vite cache

**When to use:** Before committing, after builds, weekly maintenance

**Command:**
```bash
pnpm cleanup:all
```

**Space saved:** Typically 500MB - 2GB

---

### 2. Log File Cleanup

**What it removes:**
- `*.log` files
- `*output*.txt` files
- `*lint*.txt` files
- `*typecheck*.txt` files

**When to use:** After debugging, before commits

**Command:**
```bash
pnpm cleanup:logs
```

**Space saved:** Typically 10MB - 100MB

---

### 3. Backup File Cleanup

**What it removes:**
- `*.bak`, `*.bak2`, `*.backup` files

**When to use:** After confirming backups aren't needed

**Command:**
```bash
pnpm cleanup:backups
```

**Space saved:** Typically 5MB - 50MB

---

### 4. Aggressive Cleanup (Requires Reinstall)

**What it removes:**
- All of the above PLUS
- `node_modules/` - All dependencies (requires `pnpm install`)

**When to use:** 
- Disk space critically low (<10GB free)
- Before major dependency updates
- Troubleshooting dependency issues

**Command:**
```bash
pnpm clean:node
# This automatically runs pnpm install after
```

**Space saved:** Typically 500MB - 2GB (but requires reinstall)

**⚠️ Warning:** This will require running `pnpm install` which takes 2-5 minutes.

---

### 5. pnpm Store Cleanup

**What it removes:**
- Global pnpm store cache (affects all projects using pnpm)

**When to use:**
- Disk space critically low
- pnpm store corrupted
- Want to free up maximum space

**Command:**
```bash
pnpm store prune
```

**Space saved:** Can be 5GB - 20GB+ (depends on how many projects use pnpm)

**⚠️ Warning:** This will slow down future `pnpm install` operations as packages need to be re-downloaded.

---

## Disk Space Monitoring

### Recommended Thresholds

| Status | Free Space | Action |
|--------|-----------|--------|
| 🟢 **Safe** | >30GB (13%) | No action needed |
| 🟡 **Warning** | 20-30GB (9-13%) | Run safe cleanup |
| 🟠 **Caution** | 10-20GB (4-9%) | Run aggressive cleanup |
| 🔴 **Critical** | <10GB (<4%) | **STOP ALL OPERATIONS** - Clean up immediately |

### Quick Check Script

Add to your `~/.zshrc` or `~/.bashrc`:
```bash
alias diskcheck='df -h . && echo "---" && du -sh node_modules .turbo apps/*/.next 2>/dev/null | sort -hr'
```

Then run:
```bash
diskcheck
```

## Common Space Hogs

### HIVE Project Specific

1. **`.turbo/`** - Turborepo cache (safe to delete)
2. **`apps/*/.next/`** - Next.js build cache (safe to delete)
3. **`packages/*/dist/`** - Package builds (safe to delete)
4. **`node_modules/`** - Dependencies (safe to delete, requires reinstall)
5. **`packages/*/storybook-static/`** - Storybook builds (safe to delete)

### System-Wide (macOS)

1. **Xcode DerivedData** (~10-50GB)
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData/*
   ```

2. **Docker images/containers** (if using Docker)
   ```bash
   docker system prune -a --volumes
   ```

3. **Homebrew cache**
   ```bash
   brew cleanup --prune=all
   ```

4. **System caches**
   ```bash
   # User caches
   rm -rf ~/Library/Caches/*
   
   # System logs (requires sudo)
   sudo rm -rf /private/var/log/*
   ```

5. **Time Machine local snapshots** (if enabled)
   ```bash
   tmutil listlocalsnapshots /
   tmutil deletelocalsnapshots <snapshot-date>
   ```

## Maintenance Schedule

### Daily
- Run `pnpm cleanup:logs` before committing

### Weekly
- Run `pnpm cleanup:all` to clear build artifacts
- Check disk space with `df -h .`

### Monthly
- Run `pnpm store prune` if disk space is tight
- Clean system caches (Xcode, Docker, etc.)

### Before Major Operations
- **Before `pnpm update`**: Ensure >20GB free
- **Before large builds**: Run `pnpm cleanup:all`
- **Before git operations**: Run `pnpm cleanup:logs`

## Troubleshooting

### "Disk space too low" errors

1. **Immediate action:**
   ```bash
   # Run nuclear cleanup (requires reinstall)
   pnpm cleanup:disk
   # Select option 6 (NUCLEAR)
   ```

2. **After cleanup:**
   ```bash
   pnpm install
   pnpm typecheck
   ```

### Build failures due to disk space

1. Clean build artifacts:
   ```bash
   pnpm clean:build
   ```

2. Retry build:
   ```bash
   pnpm build
   ```

### pnpm install failures

1. Clean pnpm store:
   ```bash
   pnpm store prune
   ```

2. Remove node_modules:
   ```bash
   rm -rf node_modules apps/*/node_modules packages/*/node_modules
   ```

3. Reinstall:
   ```bash
   pnpm install
   ```

## Best Practices

1. **Monitor regularly**: Check disk space weekly
2. **Clean before commits**: Remove logs and build artifacts
3. **Clean after builds**: Remove `.next` and `dist` folders
4. **Keep 20GB+ free**: Prevents write failures
5. **Use safe cleanup first**: Only use aggressive cleanup when necessary

## Related Documentation

- [Environment Issues](./ENVIRONMENT_ISSUES.md) - Previous disk space crisis
- [CLAUDE.md](../../CLAUDE.md) - Development environment setup
- [HIVE Monorepo Architecture](../../architecture/HIVE_MONOREPO_ARCHITECTURE.md) - Project structure

---

**Remember**: When in doubt, use the interactive cleanup script:
```bash
pnpm cleanup:disk
```











