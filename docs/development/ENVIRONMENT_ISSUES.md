# Environment Issues & Root Cause Analysis

## Critical Issue: Disk Space at 96% Capacity

**Date**: December 2024  
**Status**: ⚠️ **CRITICAL** - Requires immediate attention

### Problem Summary

During library updates (`pnpm update --latest --recursive`), multiple `package.json` files became corrupted/emptied due to **insufficient disk space**.

### Root Cause

**Disk Space**: 96% capacity (8.9GB free out of 228GB)
- **Location**: `/System/Volumes/Data`
- **Impact**: When disk space is this low, file write operations can fail mid-write, causing:
  - Empty/corrupted files
  - Incomplete writes
  - Git index corruption
  - Package installation failures

### Files Affected

The following `package.json` files were corrupted during the update:
- ✅ `infrastructure/docker/websocket-server/package.json` - **RESTORED**
- ✅ `infrastructure/firebase/package.json` - **RESTORED**
- ✅ `packages/ui/package.json` - **RESTORED**
- ✅ `apps/web/package.json` - **RESTORED**
- ✅ Root `package.json` - **RESTORED**

### Why This Happened

1. **`pnpm update --latest --recursive`** attempted to update all packages
2. Major version updates (React 18→19, Next.js 15→16, Storybook 8→10) triggered massive dependency resolution
3. Low disk space caused write failures during package.json updates
4. Files were left in corrupted/empty state

### Immediate Actions Required

#### 1. Free Up Disk Space (CRITICAL)

```bash
# Check current disk usage
df -h

# Clean up common space hogs:
# - Old node_modules (can be regenerated)
# - Build artifacts (.next, dist, .turbo)
# - pnpm store cache
# - Docker images/containers (if applicable)
# - System caches
# - Old backups

# Clean HIVE-specific build artifacts
cd /Users/laneyfraass/Desktop/HIVE
rm -rf node_modules .pnpm-store
rm -rf apps/*/node_modules packages/*/node_modules
rm -rf apps/*/.next packages/*/dist
rm -rf .turbo

# Clean pnpm store (be careful - this removes all cached packages)
pnpm store prune

# Reinstall after cleanup
pnpm install
```

#### 2. Monitor Disk Space

```bash
# Add to your shell profile (.zshrc or .bashrc)
alias diskcheck='df -h . && echo "---" && du -sh node_modules .pnpm-store .next 2>/dev/null | sort -hr'

# Run before major operations
diskcheck
```

#### 3. Safe Update Strategy

Instead of `pnpm update --latest --recursive`, use a safer approach:

```bash
# 1. Check disk space first
df -h .

# 2. Update packages one workspace at a time
pnpm --filter @hive/ui update --latest
pnpm --filter @hive/web update --latest

# 3. Or update specific packages
pnpm update lucide-react --latest
pnpm update next --latest

# 4. Always verify after updates
pnpm install
pnpm typecheck
```

### Prevention Checklist

Before running any major operations:

- [ ] **Check disk space** - Ensure >15GB free (10% of 228GB)
- [ ] **Backup critical files** - Commit to git before updates
- [ ] **Update incrementally** - One package/workspace at a time
- [ ] **Verify after updates** - Run `pnpm install && pnpm typecheck`
- [ ] **Monitor for corruption** - Check file sizes and git status

### Recommended Disk Space Thresholds

- **Critical**: <10GB free (4% of 228GB) - **STOP ALL OPERATIONS**
- **Warning**: <20GB free (9% of 228GB) - **CLEAN UP BEFORE CONTINUING**
- **Safe**: >30GB free (13% of 228GB) - **OK TO PROCEED**

### Current Status

✅ **All corrupted files have been restored**  
⚠️ **Disk space still critical - immediate cleanup required**  
✅ **Library updates completed (with React 18 constraint maintained)**

### Next Steps

1. **IMMEDIATE**: Free up at least 20GB of disk space
2. **VERIFY**: Run `pnpm install` to ensure all packages resolve correctly
3. **TEST**: Run `pnpm typecheck` and `pnpm build` to verify integrity
4. **MONITOR**: Set up disk space alerts/monitoring

---

## Additional Notes

### Why React 19 Was Rejected

The project maintains React 18 via `pnpm.overrides` in root `package.json`:
- Many dependencies still require React 18
- Next.js 15.x supports React 18 (Next.js 16 requires React 19)
- Storybook 10 supports React 18
- Migration to React 19 should be planned separately

### Library Update Summary

**Updated Successfully**:
- Storybook: 8.4.7 → 10.0.7
- lucide-react: 0.411.0 → 0.553.0
- tailwind-merge: 2.6.0 → 3.4.0
- i18next: 24.2.3 → 25.6.2
- react-i18next: 15.7.4 → 16.3.3
- Various dev dependencies

**Kept at Current Versions** (due to React 18 constraint):
- React: 18.3.1 (not upgraded to 19.2.0)
- Next.js: 15.5.6 (not upgraded to 16.0.3)
- framer-motion: 11.11.17 (compatible with React 18)












