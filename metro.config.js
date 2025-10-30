const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  projectRoot: __dirname,
  watchFolders: [
    path.resolve(__dirname, 'src'),
    path.resolve(__dirname, 'mobile'),
  ],
  resolver: {
    platforms: ['native', 'android'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
