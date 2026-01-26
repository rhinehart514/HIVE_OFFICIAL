#!/bin/bash
# Memory check utility for HIVE development
# Usage: ./scripts/check-memory.sh

set -e

echo "🔍 HIVE Memory Check"
echo "===================="
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS memory check
  total_bytes=$(sysctl -n hw.memsize)
  total_gb=$((total_bytes / 1024 / 1024 / 1024))
  
  free_pages_str=$(vm_stat | grep 'Pages free' | awk '{print $3}' | sed 's/\.//')
  free_pages=$((10#$free_pages_str))
  free_mb=$((free_pages * 16384 / 1024 / 1024))
  
  used_mb=$((total_gb * 1024 - free_mb))
  used_percent=$((used_mb * 100 / (total_gb * 1024)))
  
  compressed_line=$(vm_stat | grep 'Pages occupied by compressor' || echo "")
  if [ -n "$compressed_line" ]; then
    compressed_pages_str=$(echo "$compressed_line" | awk '{print $5}' | sed 's/\.//')
    if [[ "$compressed_pages_str" =~ ^[0-9]+$ ]]; then
      compressed_pages=$((10#$compressed_pages_str))
      compressed_mb=$((compressed_pages * 16384 / 1024 / 1024))
    else
      compressed_mb=0
    fi
  else
    compressed_mb=0
  fi
  
  echo "Total RAM: ${total_gb} GB"
  echo "Used: ${used_mb} MB (${used_percent}%)"
  echo "Free: ${free_mb} MB"
  echo "Compressed: ${compressed_mb} MB"
  echo ""
  
  # Check Node.js processes
  node_memory=$(ps aux | grep -E "(node|tsx|ts-node)" | grep -v grep | awk '{sum+=$6} END {if (sum) print int(sum/1024); else print 0}')
  echo "Node.js processes: ${node_memory} MB"
  echo ""
  
  # Recommendations
  if [ "$free_mb" -lt 500 ]; then
    echo "⚠️  WARNING: Low memory! Consider:"
    echo "   - Closing unused applications"
    echo "   - Restarting your computer"
    echo "   - Using the claude-wrapper.sh script"
  elif [ "$free_mb" -lt 1000 ]; then
    echo "⚠️  CAUTION: Memory getting low. Monitor usage."
  else
    echo "✅ Memory looks good"
  fi
else
  echo "Memory check not implemented for this OS"
fi
