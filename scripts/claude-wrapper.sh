#!/bin/bash
# Wrapper script for Claude CLI with increased heap size and memory checks
# Usage: ./scripts/claude-wrapper.sh [claude arguments...]

set -e

# Check available memory
check_memory() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    local free_mb=$(vm_stat | grep 'Pages free' | awk '{print $3}' | sed 's/\.//' | awk '{print int($1*16384/1024/1024)}')
    if [ "$free_mb" -lt 500 ]; then
      echo "⚠️  Warning: Only ${free_mb}MB free memory. Consider closing other applications." >&2
    fi
  fi
}

# Set Node.js memory options
export NODE_OPTIONS="--max-old-space-size=4096 --expose-gc"

# Check memory before running
check_memory

# Run Claude CLI
exec claude "$@"
