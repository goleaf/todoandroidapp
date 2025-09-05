import React from 'react';
import { StyleSheet } from 'react-native';
import { Chip, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface StatusChipProps {
  status: 'draft' | 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  size?: 'small' | 'medium';
  showIcon?: boolean;
  onPress?: () => void;
  style?: any;
}

export default function StatusChip({
  status,
  size = 'medium',
  showIcon = true,
  onPress,
  style
}: StatusChipProps) {
  const theme = useTheme();

  const getStatusConfig = () => {
    switch (status) {
      case 'draft':
        return {
          label: 'Draft',
          icon: 'file-document-outline',
          color: '#9E9E9E',
          backgroundColor: '#F5F5F5',
          textColor: '#616161',
        };
      case 'not_started':
        return {
          label: 'Not Started',
          icon: 'clock-outline',
          color: '#607D8B',
          backgroundColor: '#ECEFF1',
          textColor: '#455A64',
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          icon: 'play-circle-outline',
          color: '#2196F3',
          backgroundColor: '#E3F2FD',
          textColor: '#1565C0',
        };
      case 'completed':
        return {
          label: 'Completed',
          icon: 'check-circle-outline',
          color: '#4CAF50',
          backgroundColor: '#E8F5E8',
          textColor: '#2E7D32',
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          icon: 'close-circle-outline',
          color: '#F44336',
          backgroundColor: '#FFEBEE',
          textColor: '#C62828',
        };
    }
  };

  const config = getStatusConfig();
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
          fontWeight: '500',
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
    fontWeight: '500',
  },
});
