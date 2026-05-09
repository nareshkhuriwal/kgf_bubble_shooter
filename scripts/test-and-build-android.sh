#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_DIR="$ROOT_DIR/android"
AAB_PATH="$ANDROID_DIR/app/build/outputs/bundle/release/app-release.aab"

cd "$ROOT_DIR"

echo "==> Checking TypeScript"
npm run typecheck

echo "==> Verifying Android release signing properties"
if ! grep -q '^KGF_ORBITO_UPLOAD_STORE_FILE=' "$ANDROID_DIR/gradle.properties"; then
  cat <<'EOF'

Missing Play Store release signing properties in android/gradle.properties.

Add these lines, using your own upload keystore values:

KGF_ORBITO_UPLOAD_STORE_FILE=kgf-orbito-upload-key.jks
KGF_ORBITO_UPLOAD_KEY_ALIAS=kgf-orbito
KGF_ORBITO_UPLOAD_STORE_PASSWORD=your_store_password
KGF_ORBITO_UPLOAD_KEY_PASSWORD=your_key_password

Put the .jks file at android/app/kgf-orbito-upload-key.jks.
Do not commit the keystore or passwords.

EOF
  exit 1
fi

echo "==> Cleaning Android build"
cd "$ANDROID_DIR"
./gradlew clean

echo "==> Building Play Store AAB"
./gradlew bundleRelease

echo "==> Android App Bundle ready:"
echo "$AAB_PATH"
