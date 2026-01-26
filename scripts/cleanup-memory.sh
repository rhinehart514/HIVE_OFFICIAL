#!/bin/bash
# Cleanup script to free up disk space and memory
# Usage: ./scripts/cleanup-memory.sh [--aggressive]

set -e

AGGRESSIVE=false
if [[ "$1" == "--aggressive" ]]; then
  AGGRESSIVE=true
fi

echo "🧹 HIVE Memory & Disk Cleanup"
echo "=============================="
echo ""

# Calculate space before
before=$(du -sh . 2>/dev/null | awk '{print $1}')

# Clean Turbo cache (safe - can be regenerated)
if [ -d ".turbo" ]; then
  turbo_size=$(du -sh .turbo 2>/dev/null | awk '{print $1}')
  echo "🗑️  Removing Turbo cache (${turbo_size})..."
  rm -rf .turbo
  echo "   ✅ Turbo cache cleared"
fi

# Clean TypeScript build info files
echo "🗑️  Removing TypeScript build info files..."
find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true
echo "   ✅ TypeScript build info cleared"

# Clean Next.js build artifacts (safe - can be regenerated)
if [ -d "apps/web/.next" ]; then
  next_size=$(du -sh apps/web/.next 2>/dev/null | awk '{print $1}' || echo "unknown")
  echo "🗑️  Removing Next.js build cache (${next_size})..."
  rm -rf apps/web/.next
  echo "   ✅ Next.js cache cleared"
fi

if [ -d "apps/admin/.next" ]; then
  admin_next_size=$(du -sh apps/admin/.next 2>/dev/null | awk '{print $1}' || echo "unknown")
  echo "🗑️  Removing Admin Next.js build cache (${admin_next_size})..."
  rm -rf apps/admin/.next
  echo "   ✅ Admin Next.js cache cleared"
fi

# Clean backup directories
if [ -d "apps/web/.next.bak" ]; then
  bak_size=$(du -sh apps/web/.next.bak 2>/dev/null | awk '{print $1}' || echo "unknown")
  echo "🗑️  Removing Next.js backup (${bak_size})..."
  rm -rf apps/web/.next.bak
  echo "   ✅ Backup directory cleared"
fi

# Clean dist directories
echo "🗑️  Removing dist directories..."
find . -type d -name "dist" -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null || true
echo "   ✅ Dist directories cleared"

# Aggressive cleanup (removes node_modules - requires reinstall)
if [ "$AGGRESSIVE" = true ]; then
  echo ""
  echo "⚠️  AGGRESSIVE MODE: Removing node_modules..."
  echo "   (You'll need to run 'pnpm install' after this)"
  read -p "   Continue? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf node_modules
    find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
    echo "   ✅ node_modules removed"
  else
    echo "   ⏭️  Skipped"
  fi
fi

# Calculate space after
after=$(du -sh . 2>/dev/null | awk '{print $1}')

echo ""
echo "✅ Cleanup complete!"
echo "   Before: ${before}"
echo "   After:  ${after}"
echo ""
echo "💡 Tip: Run 'pnpm install' if you removed node_modules"
