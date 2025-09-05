import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  text?: string;
  color?: string;
  style?: any;
}

export default function LoadingSpinner({ 
  size = 'large', 
  text, 
  color, 
  style 
}: LoadingSpinnerProps) {
  const theme = useTheme();
  const spinnerColor = color || theme.colors.primary;

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator 
        size={size} 
        color={spinnerColor}
        style={styles.spinner}
      />
      {text && (
        <Text 
          variant="bodyMedium" 
          style={[styles.text, { color: theme.colors.onSurface }]}
        >
          {text}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  spinner: {
    marginBottom: 16,
  },
  text: {
    textAlign: 'center',
    opacity: 0.7,
  },
});
