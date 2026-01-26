#!/bin/bash
# Script to automatically close memory-intensive applications
# Usage: ./scripts/close-apps.sh [chrome|cursor|all]

set -e

APP="${1:-all}"

echo "🚀 Closing Applications to Free Memory"
echo "======================================"
echo ""

if [[ "$APP" == "chrome" || "$APP" == "all" ]]; then
  echo "🔴 Closing Google Chrome..."
  if osascript -e 'tell application "Google Chrome" to quit' 2>/dev/null; then
    echo "   ✅ Chrome closed"
    sleep 1
  else
    echo "   ⚠️  Chrome not running or already closed"
  fi
fi

if [[ "$APP" == "cursor" || "$APP" == "all" ]]; then
  echo "🔴 Closing Cursor (will keep current window)..."
  echo "   ⚠️  Cannot safely close Cursor automatically"
  echo "   💡 Please manually close unused Cursor windows/tabs"
fi

echo ""
echo "⏳ Waiting 3 seconds for memory to free up..."
sleep 3

echo ""
echo "📊 Checking memory status..."
./scripts/check-memory.sh
