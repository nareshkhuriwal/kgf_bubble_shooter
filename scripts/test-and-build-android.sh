#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_DIR="$ROOT_DIR/android"
AAB_PATH="$ANDROID_DIR/app/build/outputs/bundle/release/app-release.aab"

cd "$ROOT_DIR"

echo "==> Checking TypeScript"
npm run typecheck

echo "==> Verifying Android release signing properties"
if ! grep -q '^BUBBLE_KINGDOM_UPLOAD_STORE_FILE=' "$ANDROID_DIR/gradle.properties"; then
  cat <<'EOF'

Missing Play Store release signing properties in android/gradle.properties.

Add these lines, using your own upload keystore values:

BUBBLE_KINGDOM_UPLOAD_STORE_FILE=bubble-kingdom-release.keystore
BUBBLE_KINGDOM_UPLOAD_KEY_ALIAS=bubble-kingdom
BUBBLE_KINGDOM_UPLOAD_STORE_PASSWORD=your_store_password
BUBBLE_KINGDOM_UPLOAD_KEY_PASSWORD=your_key_password

Put the keystore file at android/app/bubble-kingdom-release.keystore.
Do not commit the keystore or passwords.

EOF
  exit 1
fi

if [ ! -f "$ANDROID_DIR/app/bubble-kingdom-release.keystore" ]; then
  echo "Missing keystore file at $ANDROID_DIR/app/bubble-kingdom-release.keystore"
  exit 1
fi

echo "==> Cleaning Android build"
cd "$ANDROID_DIR"
./gradlew clean

echo "==> Building Play Store AAB"
./gradlew bundleRelease

echo "==> Android App Bundle ready:"
echo "$AAB_PATH"
