import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

// Material Design 3.0 Color Tokens
const lightColors = {
  primary: '#6750A4',
  onPrimary: '#FFFFFF',
  primaryContainer: '#EADDFF',
  onPrimaryContainer: '#21005D',
  secondary: '#625B71',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#E8DEF8',
  onSecondaryContainer: '#1D192B',
  tertiary: '#7D5260',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FFD8E4',
  onTertiaryContainer: '#31111D',
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',
  background: '#FFFBFE',
  onBackground: '#1C1B1F',
  surface: '#FFFBFE',
  onSurface: '#1C1B1F',
  surfaceVariant: '#E7E0EC',
  onSurfaceVariant: '#49454F',
  outline: '#79747E',
  outlineVariant: '#CAC4D0',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#313033',
  inverseOnSurface: '#F4EFF4',
  inversePrimary: '#D0BCFF',
  elevation: {
    level0: 'transparent',
    level1: '#F7F2FA',
    level2: '#F1ECF4',
    level3: '#ECE6F0',
    level4: '#EAE7F0',
    level5: '#E6E0E9',
  },
  surfaceDisabled: '#1C1B1F1F',
  onSurfaceDisabled: '#1C1B1F61',
  backdrop: '#00000040',
};

const darkColors = {
  primary: '#D0BCFF',
  onPrimary: '#381E72',
  primaryContainer: '#4F378B',
  onPrimaryContainer: '#EADDFF',
  secondary: '#CCC2DC',
  onSecondary: '#332D41',
  secondaryContainer: '#4A4458',
  onSecondaryContainer: '#E8DEF8',
  tertiary: '#EFB8C8',
  onTertiary: '#492532',
  tertiaryContainer: '#633B48',
  onTertiaryContainer: '#FFD8E4',
  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',
  background: '#1C1B1F',
  onBackground: '#E6E1E5',
  surface: '#1C1B1F',
  onSurface: '#E6E1E5',
  surfaceVariant: '#49454F',
  onSurfaceVariant: '#CAC4D0',
  outline: '#938F99',
  outlineVariant: '#49454F',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#E6E1E5',
  inverseOnSurface: '#313033',
  inversePrimary: '#6750A4',
  elevation: {
    level0: 'transparent',
    level1: '#22212126',
    level2: '#28272D',
    level3: '#2E2D35',
    level4: '#2F2E36',
    level5: '#33323A',
  },
  surfaceDisabled: '#E6E1E51F',
  onSurfaceDisabled: '#E6E1E561',
  backdrop: '#00000040',
};

// Typography configuration
const fontConfig = {
  displayLarge: {
    fontFamily: 'Roboto',
    fontSize: 57,
    fontWeight: '400' as const,
    lineHeight: 64,
    letterSpacing: -0.25,
  },
  displayMedium: {
    fontFamily: 'Roboto',
    fontSize: 45,
    fontWeight: '400' as const,
    lineHeight: 52,
    letterSpacing: 0,
  },
  displaySmall: {
    fontFamily: 'Roboto',
    fontSize: 36,
    fontWeight: '400' as const,
    lineHeight: 44,
    letterSpacing: 0,
  },
  headlineLarge: {
    fontFamily: 'Roboto',
    fontSize: 32,
    fontWeight: '400' as const,
    lineHeight: 40,
    letterSpacing: 0,
  },
  headlineMedium: {
    fontFamily: 'Roboto',
    fontSize: 28,
    fontWeight: '400' as const,
    lineHeight: 36,
    letterSpacing: 0,
  },
  headlineSmall: {
    fontFamily: 'Roboto',
    fontSize: 24,
    fontWeight: '400' as const,
    lineHeight: 32,
    letterSpacing: 0,
  },
  titleLarge: {
    fontFamily: 'Roboto',
    fontSize: 22,
    fontWeight: '400' as const,
    lineHeight: 28,
    letterSpacing: 0,
  },
  titleMedium: {
    fontFamily: 'Roboto',
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontFamily: 'Roboto',
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelLarge: {
    fontFamily: 'Roboto',
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily: 'Roboto',
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontFamily: 'Roboto',
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  bodyLarge: {
    fontFamily: 'Roboto',
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  bodyMedium: {
    fontFamily: 'Roboto',
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontFamily: 'Roboto',
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
};

// Create Material Design 3.0 themes
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: lightColors,
  fonts: configureFonts({ config: fontConfig }),
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: darkColors,
  fonts: configureFonts({ config: fontConfig }),
};

// Theme utilities
export const getTheme = (isDark: boolean): MD3Theme => {
  return isDark ? darkTheme : lightTheme;
};

// Custom component styles that follow Material Design 3.0
export const materialStyles = {
  elevation: {
    level0: { elevation: 0, shadowOpacity: 0 },
    level1: { elevation: 1, shadowOpacity: 0.05 },
    level2: { elevation: 3, shadowOpacity: 0.08 },
    level3: { elevation: 6, shadowOpacity: 0.11 },
    level4: { elevation: 8, shadowOpacity: 0.12 },
    level5: { elevation: 12, shadowOpacity: 0.14 },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  borderRadius: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 28,
    full: 1000,
  },
  animation: {
    duration: {
      short1: 50,
      short2: 100,
      short3: 150,
      short4: 200,
      medium1: 250,
      medium2: 300,
      medium3: 350,
      medium4: 400,
      long1: 450,
      long2: 500,
      long3: 550,
      long4: 600,
    },
    easing: {
      standard: 'cubic-bezier(0.2, 0.0, 0, 1.0)',
      decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1.0)',
      accelerate: 'cubic-bezier(0.4, 0.0, 1.0, 1.0)',
      emphasize: 'cubic-bezier(0.2, 0.0, 0, 1.0)',
    },
  },
};

// Priority colors for tasks
export const priorityColors = {
  high: {
    light: '#D32F2F',
    dark: '#F44336',
    container: '#FFEBEE',
    onContainer: '#B71C1C',
  },
  medium: {
    light: '#F57C00',
    dark: '#FF9800',
    container: '#FFF3E0',
    onContainer: '#E65100',
  },
  low: {
    light: '#388E3C',
    dark: '#4CAF50',
    container: '#E8F5E8',
    onContainer: '#1B5E20',
  },
};

// Status colors for tasks
export const statusColors = {
  todo: {
    light: '#1976D2',
    dark: '#2196F3',
    container: '#E3F2FD',
    onContainer: '#0D47A1',
  },
  inProgress: {
    light: '#F57C00',
    dark: '#FF9800',
    container: '#FFF3E0',
    onContainer: '#E65100',
  },
  completed: {
    light: '#388E3C',
    dark: '#4CAF50',
    container: '#E8F5E8',
    onContainer: '#1B5E20',
  },
  cancelled: {
    light: '#616161',
    dark: '#9E9E9E',
    container: '#F5F5F5',
    onContainer: '#212121',
  },
};

