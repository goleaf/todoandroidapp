import React from 'react';
import { StyleSheet } from 'react-native';
import { Chip, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CategoryChipProps {
  category: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
  size?: 'small' | 'medium';
  showIcon?: boolean;
  onPress?: () => void;
  onClose?: () => void;
  style?: any;
}

export default function CategoryChip({
  category,
  size = 'medium',
  showIcon = true,
  onPress,
  onClose,
  style
}: CategoryChipProps) {
  const theme = useTheme();
  const isSmall = size === 'small';

  // Generate lighter background color from category color
  const backgroundColor = category.color + '20'; // Add transparency
  const textColor = category.color;

  return (
    <Chip
      icon={showIcon ? category.icon : undefined}
      onPress={onPress}
      onClose={onClose}
      style={[
        styles.chip,
        {
          backgroundColor,
          height: isSmall ? 24 : 32,
        },
        style
      ]}
      textStyle={[
        styles.text,
        {
          color: textColor,
          fontSize: isSmall ? 11 : 13,
          fontWeight: '500',
        }
      ]}
      compact={isSmall}
    >
      {category.name}
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
