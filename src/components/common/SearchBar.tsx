import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Searchbar, IconButton, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  onVoiceSearch?: () => void;
  showVoiceButton?: boolean;
  showFilterButton?: boolean;
  onFilterPress?: () => void;
  style?: any;
}

export default function SearchBar({
  placeholder = 'Search tasks...',
  value,
  onChangeText,
  onClear,
  onVoiceSearch,
  showVoiceButton = true,
  showFilterButton = true,
  onFilterPress,
  style
}: SearchBarProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onChangeText('');
    if (onClear) {
      onClear();
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.searchbar,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderColor: isFocused ? theme.colors.primary : 'transparent',
            }
          ]}
          inputStyle={styles.searchInput}
          iconColor={theme.colors.onSurfaceVariant}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          right={() => (
            <View style={styles.rightActions}>
              {value.length > 0 && (
                <IconButton
                  icon="close"
                  size={20}
                  onPress={handleClear}
                  iconColor={theme.colors.onSurfaceVariant}
                />
              )}
              {showVoiceButton && (
                <IconButton
                  icon="microphone"
                  size={20}
                  onPress={onVoiceSearch}
                  iconColor={theme.colors.primary}
                />
              )}
            </View>
          )}
        />
      </View>
      
      {showFilterButton && (
        <IconButton
          icon="filter-variant"
          size={24}
          onPress={onFilterPress}
          iconColor={theme.colors.primary}
          style={styles.filterButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchContainer: {
    flex: 1,
    marginRight: 8,
  },
  searchbar: {
    elevation: 0,
    borderWidth: 1,
    borderRadius: 12,
  },
  searchInput: {
    fontSize: 16,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    margin: 0,
  },
});
