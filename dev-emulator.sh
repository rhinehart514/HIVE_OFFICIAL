#!/bin/bash
# ============================================================
# HIVE Local Dev with Firebase Emulators
# ============================================================
# Usage: ./dev-emulator.sh
# This script:
#   1. Starts Firebase emulators (Auth, Firestore, Storage, RTDB)
#   2. Waits for emulators to be ready
#   3. Seeds emulator with test data (spaces, events, tools, users)
#   4. Starts Next.js dev server pointing at emulators

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB="$ROOT/apps/web"
FIREBASE="/usr/local/bin/firebase"

echo ""
echo "🔥 HIVE Dev Environment with Firebase Emulators"
echo "================================================"
echo ""

# Kill anything already on these ports
echo "→ Clearing ports..."
lsof -ti:8080,9099,9199,9000,4000,3000 | xargs kill -9 2>/dev/null || true
sleep 1

# Start emulators in background
echo "→ Starting Firebase emulators..."
cd "$ROOT"
FIREBASE_CLI_EXPERIMENTS=webframeworks "$FIREBASE" emulators:start \
  --only auth,firestore,storage,database,ui \
  --project demo-hive \
  --export-on-exit /tmp/hive-emulator-data \
  --import /tmp/hive-emulator-data 2>/dev/null &
EMULATOR_PID=$!
echo "  Emulators starting (PID $EMULATOR_PID)..."

# Wait for Firestore emulator
echo "→ Waiting for Firestore emulator (port 8080)..."
for i in {1..30}; do
  if curl -s http://127.0.0.1:8080 > /dev/null 2>&1; then
    echo "  ✅ Firestore ready"
    break
  fi
  sleep 1
  if [ $i -eq 30 ]; then
    echo "  ❌ Firestore emulator timeout"
    kill $EMULATOR_PID 2>/dev/null
    exit 1
  fi
done

# Wait for Auth emulator
echo "→ Waiting for Auth emulator (port 9099)..."
for i in {1..15}; do
  if curl -s http://127.0.0.1:9099 > /dev/null 2>&1; then
    echo "  ✅ Auth ready"
    break
  fi
  sleep 1
done

# Seed test data
echo "→ Seeding emulator with test data..."
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
GCLOUD_PROJECT=demo-hive \
FIREBASE_PROJECT_ID=demo-hive \
  node "$ROOT/scripts/seed-emulator.mjs" && echo "  ✅ Seed complete" || echo "  ⚠️  Seed failed (continuing anyway)"

# Start Next.js dev server with emulator env
echo ""
echo "→ Starting Next.js dev server..."
echo ""
cd "$WEB"

# Merge env files — emulator vars override .env.local
# Use set -a to export all vars from sourced files
set -a
# Load base env (production creds — emulator vars below will override Firebase ones)
[ -f .env.local ] && source .env.local
# Load emulator overrides (these take precedence)
[ -f .env.emulator ] && source .env.emulator
set +a

pnpm dev

# Cleanup on exit
cleanup() {
  echo ""
  echo "→ Shutting down emulators..."
  kill $EMULATOR_PID 2>/dev/null
}
trap cleanup EXIT
