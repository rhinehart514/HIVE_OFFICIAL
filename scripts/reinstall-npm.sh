#!/bin/bash
# Reinstall Node.js and npm via NVM
# Usage: ./scripts/reinstall-npm.sh

set -e

echo "🔄 Reinstalling Node.js and npm"
echo "================================"
echo ""

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

CURRENT_VERSION=$(node --version)
CURRENT_NPM=$(npm --version)

echo "Current setup:"
echo "  Node.js: $CURRENT_VERSION"
echo "  npm: $CURRENT_NPM"
echo ""

# Get the current version number
VERSION_NUM=$(echo $CURRENT_VERSION | sed 's/v//')

echo "📦 Step 1: Uninstalling current Node.js version..."
nvm uninstall $VERSION_NUM 2>/dev/null || echo "  (Version already removed or doesn't exist)"
echo ""

echo "📦 Step 2: Reinstalling Node.js $VERSION_NUM..."
nvm install $VERSION_NUM
echo ""

echo "📦 Step 3: Setting as default..."
nvm alias default $VERSION_NUM
nvm use default
echo ""

echo "📦 Step 4: Updating npm to latest..."
npm install -g npm@latest
echo ""

echo "📦 Step 5: Configuring npm..."
# Set npm configuration
npm config set fund false
npm config set audit false
npm config set save-exact true
npm config set engine-strict false

# Set up npm cache location
npm config set cache "$HOME/.npm-cache" --global

echo "  ✅ npm configured"
echo ""

echo "📦 Step 6: Verifying installation..."
NEW_NODE=$(node --version)
NEW_NPM=$(npm --version)

echo ""
echo "✅ Installation complete!"
echo ""
echo "Before:"
echo "  Node.js: $CURRENT_VERSION"
echo "  npm: $CURRENT_NPM"
echo ""
echo "After:"
echo "  Node.js: $NEW_NODE"
echo "  npm: $NEW_NPM"
echo ""
echo "📋 Next steps:"
echo "  1. Open a new terminal window"
echo "  2. Verify: node --version && npm --version"
echo "  3. Run: pnpm install (if needed)"
