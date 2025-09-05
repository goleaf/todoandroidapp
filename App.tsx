import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider, DefaultTheme, MD3DarkTheme } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from 'react-native';
import { store, persistor } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { useSelector } from 'react-redux';
import { RootState } from './src/store';
import * as Notifications from 'expo-notifications';
import { databaseService, notificationService, locationService } from './src/services';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

// Custom theme colors
const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2196F3',
    primaryContainer: '#e3f2fd',
    secondary: '#03DAC6',
    secondaryContainer: '#e0f7fa',
    surface: '#ffffff',
    surfaceVariant: '#f5f5f5',
    background: '#fafafa',
    error: '#f44336',
    errorContainer: '#ffebee',
    onPrimary: '#ffffff',
    onSecondary: '#000000',
    onSurface: '#000000',
    onBackground: '#000000',
    onError: '#ffffff',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#64b5f6',
    primaryContainer: '#1565c0',
    secondary: '#4dd0e1',
    secondaryContainer: '#00695c',
    surface: '#121212',
    surfaceVariant: '#1e1e1e',
    background: '#000000',
    error: '#ef5350',
    errorContainer: '#b71c1c',
  },
};

function AppContent() {
  const systemColorScheme = useColorScheme();
  const themePreference = useSelector((state: RootState) => state.settings.theme);
  
  const getTheme = () => {
    if (themePreference === 'auto') {
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return themePreference === 'dark' ? darkTheme : lightTheme;
  };

  useEffect(() => {
    // Initialize services
    const initializeServices = async () => {
      try {
        // Initialize database
        await databaseService.init();
        console.log('Database initialized');

        // Initialize notifications
        const notificationPermissions = await notificationService.initialize();
        if (notificationPermissions) {
          console.log('Notifications initialized');
        }

        // Initialize location services
        const locationPermissions = await locationService.initialize();
        if (locationPermissions) {
          console.log('Location services initialized');
        }
      } catch (error) {
        console.error('Service initialization error:', error);
      }
    };

    initializeServices();

    // Set up notification listeners
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      notificationService.handleNotificationResponse(response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  return (
    <PaperProvider theme={getTheme()}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style={getTheme() === darkTheme ? 'light' : 'dark'} />
        <AppNavigator />
      </GestureHandlerRootView>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <ReduxProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <AppContent />
        </QueryClientProvider>
      </PersistGate>
    </ReduxProvider>
  );
}