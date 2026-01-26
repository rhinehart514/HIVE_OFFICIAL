#!/bin/bash
# Reinstall Claude CLI via npm
# Usage: ./scripts/reinstall-claude.sh

set -e

echo "🔄 Reinstalling Claude CLI"
echo "=========================="
echo ""

# Check current version
if command -v claude &> /dev/null; then
  CURRENT_VERSION=$(claude --version 2>&1 || echo "unknown")
  echo "Current version: $CURRENT_VERSION"
else
  echo "Claude CLI not found"
fi

echo ""
echo "📦 Step 1: Uninstalling Claude CLI..."
npm uninstall -g @anthropic-ai/claude-code 2>/dev/null || echo "  (Not installed or already removed)"
echo ""

echo "📦 Step 2: Cleaning npm cache..."
npm cache clean --force 2>&1 | grep -v "Unknown project config" || true
echo ""

echo "📦 Step 3: Installing Claude CLI..."
npm install -g @anthropic-ai/claude-code 2>&1 | grep -v "Unknown project config" || true
echo ""

echo "📦 Step 4: Verifying installation..."
NEW_VERSION=$(claude --version 2>&1)
CLAUDE_PATH=$(which claude)

echo ""
echo "✅ Installation complete!"
echo ""
echo "Version: $NEW_VERSION"
echo "Location: $CLAUDE_PATH"
echo ""
echo "💡 Remember: Your shell aliases (c, cc, ccc, ccr) are configured"
echo "   with 4GB heap size. Use them instead of 'claude' directly."
