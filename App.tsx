import React, { useEffect, useState } from 'react';
import { Alert, StatusBar, useColorScheme, View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { Provider as ReduxProvider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider as PaperProvider, ActivityIndicator, Portal, Text } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { store, persistor, RootState } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { databaseService } from './src/services/database';
import { notificationService } from './src/services/notifications';
import MCPService from './src/services/mcp/MCPService';
import { lightTheme, darkTheme, getTheme, materialStyles } from './src/theme/MaterialTheme';

// Material Design 3.0 Navigation Theme
const materialLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6750A4',
    background: '#FFFBFE',
    card: '#FFFBFE',
    text: '#1C1B1F',
    border: '#CAC4D0',
    notification: '#D32F2F',
  },
};

const materialDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#D0BCFF',
    background: '#1C1B1F',
    card: '#1C1B1F',
    text: '#E6E1E5',
    border: '#49454F',
    notification: '#FFB4AB',
  },
};

interface LoadingScreenProps {
  theme: any;
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ theme, message = 'Loading...' }) => (
  <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
    <ActivityIndicator size="large" color={theme.colors.primary} />
    <Text 
      variant="bodyLarge" 
      style={[styles.loadingText, { color: theme.colors.onBackground }]}
    >
      {message}
    </Text>
  </View>
);

const ErrorScreen: React.FC<{ theme: any; error: string; onRetry: () => void }> = ({ 
  theme, 
  error, 
  onRetry 
}) => (
  <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
    <Text 
      variant="headlineSmall" 
      style={[styles.errorTitle, { color: theme.colors.error }]}
    >
      Oops! Something went wrong
    </Text>
    <Text 
      variant="bodyMedium" 
      style={[styles.errorMessage, { color: theme.colors.onBackground }]}
    >
      {error}
    </Text>
    <Text 
      variant="labelLarge" 
      style={[styles.retryButton, { color: theme.colors.primary }]}
      onPress={onRetry}
    >
      Tap to retry
    </Text>
  </View>
);

const ThemedApp: React.FC = () => {
  const settings = useSelector((state: RootState) => state.settings || { theme: 'system' });
  const systemColorScheme = useColorScheme();
  
  const [isReady, setIsReady] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [initializationStep, setInitializationStep] = useState('Starting...');
  
  // Determine theme based on settings
  const isDarkMode = settings.theme === 'system' 
    ? systemColorScheme === 'dark' 
    : settings.theme === 'dark';
  
  const theme = getTheme(isDarkMode);
  const navigationTheme = isDarkMode ? materialDarkTheme : materialLightTheme;

  const initializeApp = async () => {
    try {
      setInitializationError(null);
      setIsReady(false);
      
      console.log('🚀 Initializing Ultimate Todo App with Material Design 3.0...');
      
      // Initialize database service
      setInitializationStep('Initializing database...');
      await databaseService.initialize();
      console.log('✅ Database service initialized');
      
      // Initialize notification service
      setInitializationStep('Setting up notifications...');
      await notificationService.initialize();
      console.log('✅ Notification service initialized');
      
      // Initialize MCP (Model Context Protocol) service
      setInitializationStep('Loading AI services...');
      await MCPService.initialize();
      console.log('✅ MCP service initialized');
      
      setInitializationStep('Finalizing setup...');
      
      // Small delay for smooth UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('🎉 All services initialized successfully');
      setIsReady(true);
    } catch (error) {
      console.error('❌ Failed to initialize app services:', error);
      setInitializationError('Failed to initialize app services. Please check your connection and try again.');
      
      // Show user-friendly error alert
      Alert.alert(
        'Initialization Error',
        'The app failed to start properly. This might be due to a temporary issue.',
        [
          {
            text: 'Retry',
            onPress: () => initializeApp(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  useEffect(() => {
    initializeApp();
  }, []);

  if (initializationError) {
    return (
      <ErrorScreen 
        theme={theme} 
        error={initializationError} 
        onRetry={initializeApp}
      />
    );
  }

  if (!isReady) {
    return (
      <LoadingScreen 
        theme={theme} 
        message={initializationStep}
      />
    );
  }

  return (
    <Portal.Host>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.surface}
        translucent={false}
      />
      <NavigationContainer theme={navigationTheme}>
        <AppNavigator />
      </NavigationContainer>
    </Portal.Host>
  );
};

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ReduxProvider store={store}>
          <PersistGate 
            loading={
              <LoadingScreen 
                theme={lightTheme} 
                message="Restoring your data..."
              />
            } 
            persistor={persistor}
          >
            <PaperProvider theme={lightTheme}>
              <ThemedApp />
            </PaperProvider>
          </PersistGate>
        </ReduxProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: materialStyles.spacing.xl,
  },
  loadingText: {
    marginTop: materialStyles.spacing.md,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: materialStyles.spacing.xl,
  },
  errorTitle: {
    textAlign: 'center',
    marginBottom: materialStyles.spacing.md,
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: materialStyles.spacing.lg,
  },
  retryButton: {
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});

export default App;