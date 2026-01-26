#!/bin/bash
# Script to free up memory by killing unnecessary processes
# Usage: ./scripts/free-memory.sh

set -e

echo "🔧 Freeing Up Memory"
echo "===================="
echo ""

# Kill orphaned Node.js processes (not Cursor-related)
echo "🔍 Checking for unnecessary Node.js processes..."

# Find Node.js processes that aren't part of Cursor or essential services
orphaned_pids=$(ps aux | grep -E "node|tsx|ts-node" | grep -v grep | grep -v "Cursor\|claude\|mcp\|context7" | awk '{print $2}' | head -10)

if [ -z "$orphaned_pids" ]; then
  echo "   ✅ No orphaned Node.js processes found"
else
  echo "   Found processes to terminate:"
  ps aux | grep -E "node|tsx|ts-node" | grep -v grep | grep -v "Cursor\|claude\|mcp\|context7" | head -5
  echo ""
  read -p "   Kill these processes? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    for pid in $orphaned_pids; do
      echo "   🗑️  Killing PID $pid..."
      kill -9 $pid 2>/dev/null || true
    done
    echo "   ✅ Processes terminated"
  else
    echo "   ⏭️  Skipped"
  fi
fi

echo ""
echo "📋 Manual Steps to Free More Memory:"
echo "====================================="
echo ""
echo "1. Close Chrome tabs/windows:"
echo "   - Open Chrome"
echo "   - Close unused tabs"
echo "   - Or quit Chrome entirely (Cmd+Q)"
echo "   💾 Frees ~700 MB"
echo ""
echo "2. Close unused Cursor windows:"
echo "   - Close any extra Cursor windows"
echo "   - Close unused editor tabs"
echo "   💾 Frees ~200-300 MB"
echo ""
echo "3. Restart your Mac (most effective):"
echo "   - Apple Menu > Restart"
echo "   💾 Frees ~2-3 GB"
echo ""
echo "4. Check current memory:"
echo "   pnpm memory:check"
echo ""
