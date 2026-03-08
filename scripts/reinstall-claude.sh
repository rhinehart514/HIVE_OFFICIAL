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
  
  # Try to update first (if update command exists)
  echo ""
  echo "📦 Step 0: Attempting to update Claude CLI..."
  if claude update 2>/dev/null; then
    echo "✅ Updated via 'claude update'"
    NEW_VERSION=$(claude --version 2>&1)
    echo "New version: $NEW_VERSION"
    exit 0
  else
    echo "  (Update command not available, proceeding with reinstall)"
  fi
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

echo "📦 Step 3: Installing latest Claude CLI..."
npm install -g @anthropic-ai/claude-code@latest 2>&1 | grep -v "Unknown project config" || true
echo ""

echo "📦 Step 4: Verifying installation..."
if command -v claude &> /dev/null; then
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
  echo ""
  echo "💡 To update in the future, you can run: claude update"
else
  echo "❌ Installation failed. Claude CLI not found in PATH."
  exit 1
fi
