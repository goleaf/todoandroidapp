import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  iconName: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, subtitle, iconName }) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Icon 
        name={iconName} 
        size={64} 
        color={theme.colors.outline}
        style={styles.icon}
      />
      <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
        {title}
      </Text>
      {subtitle && (
        <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.outline }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default EmptyState;
