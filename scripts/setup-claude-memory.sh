#!/bin/bash
# Setup script to configure Claude CLI with increased memory
# This updates your shell aliases automatically

set -e

ZSHRC="$HOME/.zshrc"
BACKUP="$HOME/.zshrc.backup.$(date +%Y%m%d_%H%M%S)"

echo "🔧 Setting up Claude CLI Memory Configuration"
echo "============================================="
echo ""

# Backup .zshrc
if [ -f "$ZSHRC" ]; then
  cp "$ZSHRC" "$BACKUP"
  echo "✅ Backed up .zshrc to $BACKUP"
fi

# Check if aliases exist
if grep -q "alias c=\"claude" "$ZSHRC"; then
  echo "📝 Updating existing Claude aliases..."
  
  # Update aliases with NODE_OPTIONS
  sed -i '' 's/alias c="claude --dangerously-skip-permissions"/alias c="NODE_OPTIONS=\"--max-old-space-size=4096 --expose-gc\" claude --dangerously-skip-permissions"/' "$ZSHRC"
  sed -i '' 's/alias cc="claude"/alias cc="NODE_OPTIONS=\"--max-old-space-size=4096 --expose-gc\" claude"/' "$ZSHRC"
  sed -i '' 's/alias ccc="claude --continue"/alias ccc="NODE_OPTIONS=\"--max-old-space-size=4096 --expose-gc\" claude --continue"/' "$ZSHRC"
  sed -i '' 's/alias ccr="claude --resume"/alias ccr="NODE_OPTIONS=\"--max-old-space-size=4096 --expose-gc\" claude --resume"/' "$ZSHRC"
  
  echo "✅ Updated aliases: c, cc, ccc, ccr"
else
  echo "📝 Adding Claude aliases with memory configuration..."
  cat >> "$ZSHRC" << 'EOF'

# Claude Code shortcuts with increased memory
alias c="NODE_OPTIONS=\"--max-old-space-size=4096 --expose-gc\" claude --dangerously-skip-permissions"
alias cc="NODE_OPTIONS=\"--max-old-space-size=4096 --expose-gc\" claude"
alias ccc="NODE_OPTIONS=\"--max-old-space-size=4096 --expose-gc\" claude --continue"
alias ccr="NODE_OPTIONS=\"--max-old-space-size=4096 --expose-gc\" claude --resume"
EOF
  echo "✅ Added new aliases"
fi

echo ""
echo "✅ Configuration complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Reload your shell: source ~/.zshrc"
echo "   2. Or open a new terminal window"
echo "   3. Use your aliases (c, cc, ccc, ccr) as normal"
echo ""
echo "💡 Your aliases now automatically use 4GB heap size"
