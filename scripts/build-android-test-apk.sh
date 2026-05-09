#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APK_PATH="$ROOT_DIR/android/app/build/outputs/apk/qa/app-qa.apk"

cd "$ROOT_DIR"

echo "==> Checking TypeScript"
npm run typecheck

echo "==> Building standalone QA APK with bundled JavaScript"
cd "$ROOT_DIR/android"
./gradlew assembleQa

echo "==> Standalone APK ready:"
echo "$APK_PATH"
