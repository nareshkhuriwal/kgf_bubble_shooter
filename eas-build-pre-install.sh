#!/bin/bash
set -e

echo "Setting up Android signing..."

# Decode keystore from EAS secret
echo "$BUBBLE_KINGDOM_KEYSTORE_BASE64" | base64 -d > "$EAS_BUILD_WORKINGDIR/android/app/bubble-kingdom-release.keystore"
echo "Keystore written."

# Append signing config to gradle.properties
cat >> "$EAS_BUILD_WORKINGDIR/android/gradle.properties" << EOF

BUBBLE_KINGDOM_UPLOAD_STORE_FILE=bubble-kingdom-release.keystore
BUBBLE_KINGDOM_UPLOAD_STORE_PASSWORD=$BUBBLE_KINGDOM_UPLOAD_STORE_PASSWORD
BUBBLE_KINGDOM_UPLOAD_KEY_ALIAS=$BUBBLE_KINGDOM_UPLOAD_KEY_ALIAS
BUBBLE_KINGDOM_UPLOAD_KEY_PASSWORD=$BUBBLE_KINGDOM_UPLOAD_KEY_PASSWORD
EOF

echo "Signing config written to gradle.properties."
