/** @type {import('jest').Config} */
module.exports = {
	preset: 'react-native',
	testEnvironment: 'jsdom',
	transform: {
		'^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
	},
	setupFiles: [
		'./jest.setup.js',
	],
	transformIgnorePatterns: [
		'node_modules/(?!(react-native' +
		'|@react-native' +
		'|react-native-vector-icons' +
		'|@react-navigation' +
		'))',
	],
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
	moduleNameMapper: {
		'^react-native-vector-icons/(.*)$': '<rootDir>/__mocks__/react-native-vector-icons.js',
		'^react-native/Libraries/Animated/NativeAnimatedHelper$': '<rootDir>/__mocks__/NativeAnimatedHelper.js',
	},
	collectCoverageFrom: [
		'src/**/*.{ts,tsx}',
		'!src/services/**',
	],
};
