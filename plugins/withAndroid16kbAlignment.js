const { withGradleProperties } = require('@expo/config-plugins');

module.exports = function withAndroid16kbAlignment(config) {
  return withGradleProperties(config, (config) => {
    // Remove existing entry if present to avoid duplicates
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
};
