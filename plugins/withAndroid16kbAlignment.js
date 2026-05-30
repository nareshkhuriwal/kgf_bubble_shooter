const { withGradleProperties, withProjectBuildGradle, withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withAndroid16kbAlignment(config) {
  // 1. Inject 16KB alignment property into gradle.properties
  config = withGradleProperties(config, (config) => {
    config.modResults = config.modResults.filter(
      (item) => item.key !== 'android.experimental.useNativeLibraryAlignment16k'
    );
    config.modResults.push({
      type: 'property',
      key: 'android.experimental.useNativeLibraryAlignment16k',
      value: 'true',
    });
    return config;
  });

  // 2. Pin NDK 27 and targetSdk 35 in root build.gradle
  config = withProjectBuildGradle(config, (config) => {
    let contents = config.modResults.contents;
    contents = contents.replace(
      /ndkVersion = "26\.[\d.]+"/,
      'ndkVersion = "27.1.12297006"'
    );
    contents = contents.replace(
      /targetSdkVersion = Integer\.parseInt\(findProperty\('android\.targetSdkVersion'\) \?: '34'\)/,
      "targetSdkVersion = Integer.parseInt(findProperty('android.targetSdkVersion') ?: '35')"
    );
    config.modResults.contents = contents;
    return config;
  });

  // 3. Inject release signing config into app/build.gradle
  config = withAppBuildGradle(config, (config) => {
    const contents = config.modResults.contents;

    // Only patch if the release signingConfig block is missing
    if (contents.includes('signingConfig signingConfigs.release')) {
      return config;
    }

    config.modResults.contents = contents
      .replace(
        /signingConfigs \{(\s*)debug \{/,
        `signingConfigs {$1debug {`
      )
      .replace(
        /(signingConfigs \{[\s\S]*?debug \{[\s\S]*?\}\s*)\}/m,
        `$1    release {\n            def easKeystorePath = System.getenv("KEYSTORE_FILE")\n            if (easKeystorePath) {\n                storeFile file(easKeystorePath)\n                storePassword System.getenv("KEYSTORE_PASSWORD")\n                keyAlias System.getenv("KEY_ALIAS")\n                keyPassword System.getenv("KEY_PASSWORD")\n            } else if (project.hasProperty('BUBBLE_KINGDOM_UPLOAD_STORE_FILE')) {\n                storeFile file(BUBBLE_KINGDOM_UPLOAD_STORE_FILE)\n                storePassword BUBBLE_KINGDOM_UPLOAD_STORE_PASSWORD\n                keyAlias BUBBLE_KINGDOM_UPLOAD_KEY_ALIAS\n                keyPassword BUBBLE_KINGDOM_UPLOAD_KEY_PASSWORD\n            }\n        }\n    }`
      )
      .replace(
        /release \{[^}]*signingConfig signingConfigs\.debug/,
        'release {\n            signingConfig signingConfigs.release'
      );
    return config;
  });

  return config;
};
