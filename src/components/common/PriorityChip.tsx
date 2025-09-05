import React from 'react';
import { StyleSheet } from 'react-native';
import { Chip, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface PriorityChipProps {
  priority: 'low' | 'medium' | 'high';
  size?: 'small' | 'medium';
  showIcon?: boolean;
  onPress?: () => void;
  style?: any;
}

export default function PriorityChip({
  priority,
  size = 'medium',
  showIcon = true,
  onPress,
  style
}: PriorityChipProps) {
  const theme = useTheme();

  const getPriorityConfig = () => {
    switch (priority) {
      case 'high':
        return {
          label: 'High',
          icon: 'chevron-double-up',
          color: '#F44336',
          backgroundColor: '#FFEBEE',
          textColor: '#C62828',
        };
      case 'medium':
        return {
          label: 'Medium',
          icon: 'chevron-up',
          color: '#FF9800',
          backgroundColor: '#FFF3E0',
          textColor: '#E65100',
        };
      case 'low':
        return {
          label: 'Low',
          icon: 'chevron-down',
          color: '#4CAF50',
          backgroundColor: '#E8F5E8',
          textColor: '#2E7D32',
        };
    }
  };

  const config = getPriorityConfig();
  const isSmall = size === 'small';

  return (
    <Chip
      icon={showIcon ? config.icon : undefined}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: config.backgroundColor,
          height: isSmall ? 24 : 32,
        },
        style
      ]}
      textStyle={[
        styles.text,
        {
          color: config.textColor,
          fontSize: isSmall ? 11 : 13,
          fontWeight: '600',
        }
      ]}
      compact={isSmall}
    >
      {config.label}
    </Chip>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 16,
  },
  text: {
    fontWeight: '600',
  },
});
