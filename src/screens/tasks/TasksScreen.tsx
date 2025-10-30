import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import {
  FAB,
  Searchbar,
  Text,
  useTheme,
  Surface,
  Chip,
  Menu,
  IconButton,
  Portal,
  Modal,
  Button,
  SegmentedButtons,
  Card,
  ActivityIndicator,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { RootState } from '../../store';
import { loadTasks, deleteTask } from '../../store/slices/tasksSlice';
import { loadCategories } from '../../store/slices/categoriesSlice';
import TaskItem from '../../components/tasks/TaskItem';
import KanbanView from '../../components/tasks/KanbanView';
import CalendarView from '../../components/tasks/CalendarView';
import { Task, Category, TaskStatus, TaskPriority, RootStackParamList } from '../../types';
import { materialStyles, priorityColors, statusColors } from '../../theme/MaterialTheme';

const { width } = Dimensions.get('window');

type TasksScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TasksList'>;

interface FilterState {
  searchQuery: string;
  selectedStatus: TaskStatus | 'all';
  selectedPriority: TaskPriority | 'all';
  selectedCategory: string | 'all';
}

const TasksScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<TasksScreenNavigationProp>();
  const dispatch = useDispatch();
  
  const { tasks, loading } = useSelector((state: RootState) => state.tasks || { tasks: [], loading: false });
  const { categories } = useSelector((state: RootState) => state.categories || { categories: [] });
  
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar'>('list');
  const [refreshing, setRefreshing] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedStatus: 'all',
    selectedPriority: 'all',
    selectedCategory: 'all',
  });
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'created' | 'updated'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fadeAnim = new Animated.Value(0);

  const loadData = useCallback(async () => {
    try {
      await Promise.all([
        (dispatch as any)(loadTasks()).unwrap(),
        (dispatch as any)(loadCategories()).unwrap(),
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: materialStyles.animation.duration.medium2,
        useNativeDriver: true,
      }).start();
    }, [loadData])
  );

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter((task: Task) => {
      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (!task.title.toLowerCase().includes(query) && 
            !task.description?.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Status filter
      if (filters.selectedStatus !== 'all' && task.status !== filters.selectedStatus) {
        return false;
      }

      // Priority filter
      if (filters.selectedPriority !== 'all' && task.priority !== filters.selectedPriority) {
        return false;
      }

      // Category filter
      if (filters.selectedCategory !== 'all' && task.categoryId !== filters.selectedCategory) {
        return false;
      }

      return true;
    });

    // Sort tasks
    filtered.sort((a: Task, b: Task) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'dueDate':
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          comparison = aDate - bDate;
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
          break;
        case 'created':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case 'updated':
          comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [tasks, filters, sortBy, sortOrder]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      await (dispatch as any)(deleteTask(taskId)).unwrap();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  }, [dispatch]);

  const handleAddTask = () => {
    navigation.navigate('AddTask', {});
  };

  const handleTaskPress = (task: Task) => {
    navigation.navigate('TaskDetails', { taskId: task.id });
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      selectedStatus: 'all',
      selectedPriority: 'all',
      selectedCategory: 'all',
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.selectedStatus !== 'all') count++;
    if (filters.selectedPriority !== 'all') count++;
    if (filters.selectedCategory !== 'all') count++;
    return count;
  };

  const renderHeader = () => (
    <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <View style={styles.headerContent}>
        <View style={styles.titleContainer}>
          <Text variant="headlineLarge" style={{ color: theme.colors.onSurface }}>
            Tasks
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {filteredAndSortedTasks.length} task{filteredAndSortedTasks.length !== 1 ? 's' : ''}
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          <IconButton
            icon="filter-variant"
            size={24}
            iconColor={getActiveFilterCount() > 0 ? theme.colors.primary : theme.colors.onSurfaceVariant}
            onPress={() => setFilterVisible(true)}
          />
          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={
              <IconButton
                icon="sort"
                size={24}
                iconColor={theme.colors.onSurfaceVariant}
                onPress={() => setSortMenuVisible(true)}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                setSortBy('created');
                setSortMenuVisible(false);
              }}
              title="Sort by Created"
              leadingIcon="clock-plus-outline"
            />
            <Menu.Item
              onPress={() => {
                setSortBy('updated');
                setSortMenuVisible(false);
              }}
              title="Sort by Updated"
              leadingIcon="clock-edit-outline"
            />
            <Menu.Item
              onPress={() => {
                setSortBy('dueDate');
                setSortMenuVisible(false);
              }}
              title="Sort by Due Date"
              leadingIcon="calendar-clock"
            />
            <Menu.Item
              onPress={() => {
                setSortBy('priority');
                setSortMenuVisible(false);
              }}
              title="Sort by Priority"
              leadingIcon="flag-variant"
            />
          </Menu>
        </View>
      </View>

      <Searchbar
        placeholder="Search tasks..."
        onChangeText={(query) => setFilters(prev => ({ ...prev, searchQuery: query }))}
        value={filters.searchQuery}
        style={styles.searchbar}
        inputStyle={{ color: theme.colors.onSurface }}
        iconColor={theme.colors.onSurfaceVariant}
        placeholderTextColor={theme.colors.onSurfaceVariant}
      />

      <SegmentedButtons
        value={viewMode}
        onValueChange={(value) => setViewMode(value as 'list' | 'kanban' | 'calendar')}
        buttons={[
          {
            value: 'list',
            label: 'List',
            icon: 'format-list-bulleted',
          },
          {
            value: 'kanban',
            label: 'Kanban',
            icon: 'view-column',
          },
          {
            value: 'calendar',
            label: 'Calendar',
            icon: 'calendar-month',
          },
        ]}
        style={styles.viewModeSelector}
      />

      {getActiveFilterCount() > 0 && (
        <View style={styles.activeFilters}>
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Active filters ({getActiveFilterCount()}):
          </Text>
          <View style={styles.filterChips}>
            {filters.selectedStatus !== 'all' && (
              <Chip
                mode="outlined"
                onClose={() => setFilters(prev => ({ ...prev, selectedStatus: 'all' }))}
                style={styles.filterChip}
              >
                Status: {filters.selectedStatus}
              </Chip>
            )}
            {filters.selectedPriority !== 'all' && (
              <Chip
                mode="outlined"
                onClose={() => setFilters(prev => ({ ...prev, selectedPriority: 'all' }))}
                style={styles.filterChip}
              >
                Priority: {filters.selectedPriority}
              </Chip>
            )}
            {filters.selectedCategory !== 'all' && (
              <Chip
                mode="outlined"
                onClose={() => setFilters(prev => ({ ...prev, selectedCategory: 'all' }))}
                style={styles.filterChip}
              >
                Category: {categories.find((c: Category) => c.id === filters.selectedCategory)?.name}
              </Chip>
            )}
            <Button
              mode="text"
              onPress={clearFilters}
              compact
              textColor={theme.colors.primary}
            >
              Clear all
            </Button>
          </View>
        </View>
      )}
    </Surface>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="clipboard-text-outline" size={64} color={theme.colors.onSurfaceVariant} />
      <Text variant="headlineSmall" style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
        {getActiveFilterCount() > 0 ? 'No tasks match your filters' : 'No tasks yet'}
      </Text>
      <Text variant="bodyMedium" style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
        {getActiveFilterCount() > 0 
          ? 'Try adjusting your filters or create a new task'
          : 'Create your first task to get started'
        }
      </Text>
      {getActiveFilterCount() > 0 && (
        <Button
          mode="outlined"
          onPress={clearFilters}
          style={styles.clearFiltersButton}
        >
          Clear filters
        </Button>
      )}
    </View>
  );

  const renderContent = () => {
    if (loading && tasks.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyLarge" style={{ color: theme.colors.onBackground, marginTop: materialStyles.spacing.md }}>
            Loading tasks...
          </Text>
        </View>
      );
    }

    if (filteredAndSortedTasks.length === 0) {
      return renderEmptyState();
    }

    switch (viewMode) {
      case 'kanban':
        return (
          <KanbanView
            tasks={filteredAndSortedTasks}
            categories={categories}
            onTaskPress={handleTaskPress}
            onDeleteTask={handleDeleteTask}
          />
        );
      case 'calendar':
        return (
          <CalendarView
            tasks={filteredAndSortedTasks}
            categories={categories}
            onTaskPress={handleTaskPress}
            onDeleteTask={handleDeleteTask}
          />
        );
      default:
        return (
          <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
            <FlatList
              data={filteredAndSortedTasks}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <Animated.View
                  style={{
                    opacity: fadeAnim,
                    transform: [{
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }),
                    }],
                  }}
                >
                  <TaskItem
                    task={item}
                    category={categories.find((c: Category) => c.id === item.categoryId)}
                    onPress={() => handleTaskPress(item)}
                    onDelete={() => handleDeleteTask(item.id)}
                    style={[
                      styles.taskItem,
                      index === filteredAndSortedTasks.length - 1 && styles.lastTaskItem
                    ]}
                  />
                </Animated.View>
              )}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[theme.colors.primary]}
                  progressBackgroundColor={theme.colors.surface}
                />
              }
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          </Animated.View>
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderHeader()}
      {renderContent()}
      
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleAddTask}
        label="Add Task"
        variant="extended"
      />

      {/* Filter Modal */}
      <Portal>
        <Modal
          visible={filterVisible}
          onDismiss={() => setFilterVisible(false)}
          contentContainerStyle={[styles.filterModal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="headlineSmall" style={[styles.filterTitle, { color: theme.colors.onSurface }]}>
            Filter Tasks
          </Text>
          
          {/* Status Filter */}
          <Text variant="titleMedium" style={[styles.filterSectionTitle, { color: theme.colors.onSurface }]}>
            Status
          </Text>
          <View style={styles.filterOptions}>
            {['all', 'todo', 'in_progress', 'completed', 'cancelled'].map((status) => (
              <Chip
                key={status}
                mode={filters.selectedStatus === status ? 'flat' : 'outlined'}
                selected={filters.selectedStatus === status}
                onPress={() => setFilters(prev => ({ ...prev, selectedStatus: status as TaskStatus | 'all' }))}
                style={styles.filterChip}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Chip>
            ))}
          </View>

          {/* Priority Filter */}
          <Text variant="titleMedium" style={[styles.filterSectionTitle, { color: theme.colors.onSurface }]}>
            Priority
          </Text>
          <View style={styles.filterOptions}>
            {['all', 'high', 'medium', 'low'].map((priority) => (
              <Chip
                key={priority}
                mode={filters.selectedPriority === priority ? 'flat' : 'outlined'}
                selected={filters.selectedPriority === priority}
                onPress={() => setFilters(prev => ({ ...prev, selectedPriority: priority as TaskPriority | 'all' }))}
                style={styles.filterChip}
              >
                {priority === 'all' ? 'All' : priority.charAt(0).toUpperCase() + priority.slice(1)}
              </Chip>
            ))}
          </View>

          {/* Category Filter */}
          {categories.length > 0 && (
            <>
              <Text variant="titleMedium" style={[styles.filterSectionTitle, { color: theme.colors.onSurface }]}>
                Category
              </Text>
              <View style={styles.filterOptions}>
                <Chip
                  mode={filters.selectedCategory === 'all' ? 'flat' : 'outlined'}
                  selected={filters.selectedCategory === 'all'}
                  onPress={() => setFilters(prev => ({ ...prev, selectedCategory: 'all' }))}
                  style={styles.filterChip}
                >
                  All
                </Chip>
                {categories.map((category: Category) => (
                  <Chip
                    key={category.id}
                    mode={filters.selectedCategory === category.id ? 'flat' : 'outlined'}
                    selected={filters.selectedCategory === category.id}
                    onPress={() => setFilters(prev => ({ ...prev, selectedCategory: category.id }))}
                    style={[styles.filterChip, { borderColor: category.color }]}
                  >
                    {category.name}
                  </Chip>
                ))}
              </View>
            </>
          )}

          <View style={styles.filterActions}>
            <Button
              mode="outlined"
              onPress={clearFilters}
              style={styles.filterActionButton}
            >
              Clear All
            </Button>
            <Button
              mode="contained"
              onPress={() => setFilterVisible(false)}
              style={styles.filterActionButton}
            >
              Apply
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: materialStyles.spacing.md,
    paddingBottom: materialStyles.spacing.md,
    paddingHorizontal: materialStyles.spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: materialStyles.spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchbar: {
    marginBottom: materialStyles.spacing.md,
    ...materialStyles.elevation.level1,
  },
  viewModeSelector: {
    marginBottom: materialStyles.spacing.md,
  },
  activeFilters: {
    marginTop: materialStyles.spacing.sm,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: materialStyles.spacing.xs,
    gap: materialStyles.spacing.xs,
  },
  filterChip: {
    marginRight: materialStyles.spacing.xs,
    marginBottom: materialStyles.spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: materialStyles.spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: materialStyles.spacing.xl,
  },
  emptyTitle: {
    marginTop: materialStyles.spacing.lg,
    marginBottom: materialStyles.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: materialStyles.spacing.lg,
  },
  clearFiltersButton: {
    marginTop: materialStyles.spacing.md,
  },
  listContent: {
    paddingHorizontal: materialStyles.spacing.md,
    paddingBottom: 100, // Space for FAB
  },
  taskItem: {
    marginBottom: materialStyles.spacing.sm,
  },
  lastTaskItem: {
    marginBottom: materialStyles.spacing.xl,
  },
  fab: {
    position: 'absolute',
    margin: materialStyles.spacing.lg,
    right: 0,
    bottom: 0,
    ...materialStyles.elevation.level3,
  },
  filterModal: {
    margin: materialStyles.spacing.lg,
    padding: materialStyles.spacing.lg,
    borderRadius: materialStyles.borderRadius.lg,
    maxHeight: '80%',
  },
  filterTitle: {
    marginBottom: materialStyles.spacing.lg,
    textAlign: 'center',
  },
  filterSectionTitle: {
    marginTop: materialStyles.spacing.md,
    marginBottom: materialStyles.spacing.sm,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: materialStyles.spacing.xs,
    marginBottom: materialStyles.spacing.md,
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: materialStyles.spacing.lg,
    gap: materialStyles.spacing.md,
  },
  filterActionButton: {
    flex: 1,
  },
});

export default TasksScreen;