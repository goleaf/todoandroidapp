import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { 
  Appbar, 
  Searchbar, 
  Menu, 
  Badge,
  useTheme,
  Portal,
  Modal,
  Card,
  Text,
  Button,
  Chip
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootState, AppDispatch } from '../../store';
import { TaskStatus, TaskPriority, RootStackParamList } from '../../types';

export interface HeaderAction {
  icon: string;
  onPress: () => void;
  badge?: number;
  disabled?: boolean;
}

export interface HeaderConfig {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (query: string) => void;
  actions?: HeaderAction[];
  showBackButton?: boolean;
  showProfileMenu?: boolean;
}

interface AppHeaderProps extends HeaderConfig {
  onFilterPress?: () => void;
  onSortPress?: () => void;
  onViewModePress?: () => void;
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showSearch = false,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  actions = [],
  showBackButton = false,
  showProfileMenu = true,
  onFilterPress,
  onSortPress,
  onViewModePress,
}) => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const dispatch = useDispatch<AppDispatch>();

  const { tasks } = useSelector((state: RootState) => state.tasks);
  const { categories } = useSelector((state: RootState) => state.categories);
  const settings = useSelector((state: RootState) => state.settings);

  const [searchVisible, setSearchVisible] = useState(false);
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [quickStatsVisible, setQuickStatsVisible] = useState(false);

  // Responsive behavior
  const screenWidth = Dimensions.get('window').width;
  const isTablet = screenWidth >= 768;
  const isSmallScreen = screenWidth < 360;

  // Calculate quick stats
  const getQuickStats = useCallback(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const pending = tasks.filter(t => t.status === TaskStatus.TODO || t.status === TaskStatus.IN_PROGRESS).length;
    const overdue = tasks.filter(t => 
      t.dueDate && 
      t.dueDate < new Date() && 
      t.status !== TaskStatus.COMPLETED
    ).length;
    const highPriority = tasks.filter(t => 
      t.priority === TaskPriority.HIGH && 
      t.status !== TaskStatus.COMPLETED
    ).length;

    return { total, completed, pending, overdue, highPriority };
  }, [tasks]);

  const stats = getQuickStats();

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleSearchToggle = () => {
    setSearchVisible(!searchVisible);
    if (searchVisible && onSearchChange) {
      onSearchChange('');
    }
  };

  const handleQuickAdd = () => {
    const currentScreen = route.name;
    if (currentScreen === 'Tasks') {
      navigation.navigate('AddTask', {});
    } else if (currentScreen === 'Categories') {
      navigation.navigate('AddCategory', {});
    }
  };

  const renderSearchBar = () => {
    if (!showSearch || !searchVisible) return null;

    return (
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={searchPlaceholder}
          value={searchValue}
          onChangeText={onSearchChange}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
          icon="search"
          clearIcon="close"
          onClearIconPress={() => onSearchChange?.('')}
        />
      </View>
    );
  };

  const renderQuickStats = () => (
    <Portal>
      <Modal
        visible={quickStatsVisible}
        onDismiss={() => setQuickStatsVisible(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Card>
          <Card.Content>
            <Text variant="titleLarge" style={styles.modalTitle}>
              Quick Stats
            </Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={[styles.statValue, { color: theme.colors.primary }]}>
                  {stats.total}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>Total Tasks</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={[styles.statValue, { color: theme.colors.secondary }]}>
                  {stats.completed}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>Completed</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={[styles.statValue, { color: theme.colors.tertiary }]}>
                  {stats.pending}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>Pending</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={[styles.statValue, { color: theme.colors.error }]}>
                  {stats.overdue}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>Overdue</Text>
              </View>
            </View>

            <View style={styles.categoryStats}>
              <Text variant="titleMedium" style={styles.categoryTitle}>
                Categories: {categories.length}
              </Text>
              <View style={styles.categoryChips}>
                {categories.slice(0, 3).map(category => (
                  <Chip
                    key={category.id}
                    style={[styles.categoryChip, { backgroundColor: category.color + '20' }]}
                    textStyle={{ color: category.color }}
                    compact
                  >
                    {category.name}
                  </Chip>
                ))}
                {categories.length > 3 && (
                  <Chip style={styles.moreChip} compact>
                    +{categories.length - 3} more
                  </Chip>
                )}
              </View>
            </View>

            <Button
              mode="contained"
              onPress={() => setQuickStatsVisible(false)}
              style={styles.closeButton}
            >
              Close
            </Button>
          </Card.Content>
        </Card>
      </Modal>
    </Portal>
  );

  const renderProfileMenu = () => (
    <Menu
      visible={profileMenuVisible}
      onDismiss={() => setProfileMenuVisible(false)}
      anchor={
        <Appbar.Action
          icon="account-circle"
          onPress={() => setProfileMenuVisible(true)}
        />
      }
    >
      <Menu.Item
        leadingIcon="dashboard"
        title="Quick Stats"
        onPress={() => {
          setProfileMenuVisible(false);
          setQuickStatsVisible(true);
        }}
        trailingIcon={() => (
          stats.overdue > 0 ? (
            <Badge size={16} style={styles.menuBadge}>
              {stats.overdue}
            </Badge>
          ) : null
        )}
      />
      <Menu.Item
        leadingIcon="settings"
        title="Settings"
        onPress={() => {
          setProfileMenuVisible(false);
          navigation.navigate('Settings' as any);
        }}
      />
      <Menu.Item
        leadingIcon="info"
        title="About"
        onPress={() => {
          setProfileMenuVisible(false);
          // TODO: Navigate to about screen
        }}
      />
    </Menu>
  );

  // Determine which actions to show based on screen size
  const getVisibleActions = () => {
    const allActions = [];

    // Always show back button if needed
    if (showBackButton) {
      allActions.push({ type: 'back', priority: 1 });
    }

    // Search action
    if (showSearch) {
      allActions.push({ type: 'search', priority: 2 });
    }

    // Filter action
    if (onFilterPress) {
      allActions.push({ type: 'filter', priority: 3 });
    }

    // Sort action (lower priority on small screens)
    if (onSortPress) {
      allActions.push({ type: 'sort', priority: isSmallScreen ? 6 : 4 });
    }

    // View mode (lower priority on small screens)
    if (onViewModePress) {
      allActions.push({ type: 'viewMode', priority: isSmallScreen ? 7 : 5 });
    }

    // Quick add (high priority)
    if (route.name === 'Tasks' || route.name === 'Categories') {
      allActions.push({ type: 'quickAdd', priority: 2 });
    }

    // High priority indicator (always show)
    if (stats.highPriority > 0) {
      allActions.push({ type: 'highPriority', priority: 1 });
    }

    // Custom actions
    actions.forEach((action, index) => {
      allActions.push({ type: 'custom', priority: 4, index, action });
    });

    // Profile menu (always show)
    if (showProfileMenu) {
      allActions.push({ type: 'profile', priority: 1 });
    }

    // Sort by priority and limit based on screen size
    const maxActions = isSmallScreen ? 4 : isTablet ? 8 : 6;
    return allActions.sort((a, b) => a.priority - b.priority).slice(0, maxActions);
  };

  const visibleActions = getVisibleActions();

  return (
    <View style={styles.container}>
      <Appbar.Header elevated style={[styles.header, isTablet && styles.tabletHeader]}>
        {showBackButton && (
          <Appbar.BackAction onPress={handleBackPress} />
        )}
        
        <Appbar.Content 
          title={title}
          subtitle={!isSmallScreen ? subtitle : undefined}
          titleStyle={[styles.title, isSmallScreen && styles.smallTitle]}
          subtitleStyle={styles.subtitle}
        />

        {/* Render visible actions */}
        {visibleActions.map((actionItem, index) => {
          switch (actionItem.type) {
            case 'search':
              return (
                <Appbar.Action
                  key="search"
                  icon={searchVisible ? "close" : "search"}
                  onPress={handleSearchToggle}
                />
              );
            
            case 'filter':
              return (
                <Appbar.Action
                  key="filter"
                  icon="filter-list"
                  onPress={onFilterPress}
                />
              );
            
            case 'sort':
              return (
                <Appbar.Action
                  key="sort"
                  icon="sort"
                  onPress={onSortPress}
                />
              );
            
            case 'viewMode':
              return (
                <Appbar.Action
                  key="viewMode"
                  icon="view-module"
                  onPress={onViewModePress}
                />
              );
            
            case 'quickAdd':
              return (
                <Appbar.Action
                  key="quickAdd"
                  icon="add"
                  onPress={handleQuickAdd}
                />
              );
            
            case 'highPriority':
              return (
                <View key="highPriority" style={styles.actionContainer}>
                  <Appbar.Action
                    icon="priority-high"
                    onPress={() => setQuickStatsVisible(true)}
                  />
                  <Badge size={16} style={[styles.actionBadge, { backgroundColor: theme.colors.error }]}>
                    {stats.highPriority}
                  </Badge>
                </View>
              );
            
            case 'custom':
              const action = actionItem.action!;
              return (
                <View key={`custom-${actionItem.index}`} style={styles.actionContainer}>
                  <Appbar.Action
                    icon={action.icon}
                    onPress={action.onPress}
                    disabled={action.disabled}
                  />
                  {action.badge && action.badge > 0 && (
                    <Badge size={16} style={styles.actionBadge}>
                      {action.badge > 99 ? '99+' : action.badge}
                    </Badge>
                  )}
                </View>
              );
            
            case 'profile':
              return renderProfileMenu();
            
            default:
              return null;
          }
        })}
      </Appbar.Header>

      {renderSearchBar()}
      {renderQuickStats()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
  },
  header: {
    elevation: 4,
  },
  tabletHeader: {
    paddingHorizontal: 24,
  },
  title: {
    fontWeight: 'bold',
  },
  smallTitle: {
    fontSize: 18,
  },
  subtitle: {
    opacity: 0.7,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchbar: {
    elevation: 2,
  },
  searchInput: {
    fontSize: 16,
  },
  actionContainer: {
    position: 'relative',
  },
  actionBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 1,
  },
  menuBadge: {
    marginLeft: 8,
  },
  modalContainer: {
    margin: 20,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontWeight: 'bold',
  },
  statLabel: {
    marginTop: 4,
    opacity: 0.7,
  },
  categoryStats: {
    marginBottom: 20,
  },
  categoryTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  categoryChip: {
    marginHorizontal: 2,
  },
  moreChip: {
    opacity: 0.7,
  },
  closeButton: {
    marginTop: 10,
  },
});

export default AppHeader;
