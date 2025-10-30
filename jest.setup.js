// Gesture Handler
import 'react-native-gesture-handler/jestSetup';

// Silence react-native-reanimated warning
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock RN Paper dependency on fonts
jest.mock('react-native-paper', () => {
	const real = jest.requireActual('react-native-paper');
	return {
		...real,
		DefaultTheme: { ...real.DefaultTheme },
		Provider: real.Provider,
	};
});
