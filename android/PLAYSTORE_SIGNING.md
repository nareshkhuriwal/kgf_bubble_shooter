# KGF Orbito Android Release Signing

For Google Play, build and upload an Android App Bundle (`.aab`) signed with a private upload key.

## 1. Generate Upload Keystore

Run this from the project root:

```bash
keytool -genkeypair \
  -v \
  -storetype JKS \
  -keystore android/app/kgf-orbito-upload-key.jks \
  -alias kgf-orbito \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Keep the password somewhere private. If you lose this keystore, you will need to reset the upload key in Play Console.

## 2. Add Local Gradle Properties

Add these lines to `android/gradle.properties` on your machine:

```properties
KGF_ORBITO_UPLOAD_STORE_FILE=kgf-orbito-upload-key.jks
KGF_ORBITO_UPLOAD_KEY_ALIAS=kgf-orbito
KGF_ORBITO_UPLOAD_STORE_PASSWORD=your_store_password
KGF_ORBITO_UPLOAD_KEY_PASSWORD=your_key_password
```

Do not commit the keystore or passwords.

## 3. Build

```bash
npm run android:bundle
```

The Play Store bundle is generated at:

```text
android/app/build/outputs/bundle/release/app-release.aab
```
