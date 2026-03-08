#!/bin/bash
# Update Claude CLI to latest version
# Usage: ./scripts/update-claude.sh

set -e

echo "🔄 Updating Claude CLI"
echo "======================"
echo ""

# Check if Claude is installed
if ! command -v claude &> /dev/null; then
  echo "❌ Claude CLI not found. Install it first with:"
  echo "   ./scripts/reinstall-claude.sh"
  exit 1
fi

CURRENT_VERSION=$(claude --version 2>&1 || echo "unknown")
echo "Current version: $CURRENT_VERSION"
echo ""

# Try the built-in update command first
echo "📦 Attempting to update via 'claude update'..."
if claude update 2>/dev/null; then
  echo ""
  echo "✅ Update successful!"
  NEW_VERSION=$(claude --version 2>&1)
  echo "New version: $NEW_VERSION"
  exit 0
fi

echo "  (Update command not available, trying npm update)"
echo ""

# Fallback to npm update
echo "📦 Updating via npm..."
if npm update -g @anthropic-ai/claude-code 2>&1 | grep -v "Unknown project config"; then
  echo ""
  echo "✅ Update complete!"
  NEW_VERSION=$(claude --version 2>&1)
  echo "New version: $NEW_VERSION"
else
  echo ""
  echo "⚠️  npm update didn't work. Try reinstalling:"
  echo "   ./scripts/reinstall-claude.sh"
  exit 1
fi
