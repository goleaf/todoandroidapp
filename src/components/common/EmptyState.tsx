import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  style?: any;
}

export default function EmptyState({
  icon = 'inbox-outline',
  title,
  description,
  actionText,
  onAction,
  style
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      <MaterialCommunityIcons
        name={icon as any}
        size={80}
        color={theme.colors.outline}
        style={styles.icon}
      />
      
      <Text 
        variant="headlineSmall" 
        style={[styles.title, { color: theme.colors.onSurface }]}
      >
        {title}
      </Text>
      
      {description && (
        <Text 
          variant="bodyLarge" 
          style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
        >
          {description}
        </Text>
      )}
      
      {actionText && onAction && (
        <Button
          mode="contained"
          onPress={onAction}
          style={styles.button}
        >
          {actionText}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  icon: {
    marginBottom: 24,
    opacity: 0.6,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  description: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    minWidth: 160,
  },
});
