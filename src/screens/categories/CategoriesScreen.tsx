import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import {
  FAB,
  Text,
  useTheme,
  Surface,
  Card,
  IconButton,
  Menu,
  Chip,
  Badge,
  Portal,
  Modal,
  Button,
  Searchbar,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { RootState } from '../../store';
import { loadCategories, deleteCategory } from '../../store/slices/categoriesSlice';
import { loadTasks } from '../../store/slices/tasksSlice';
import { Category, Task, RootStackParamList } from '../../types';
import { materialStyles } from '../../theme/MaterialTheme';
import MCPService from '../../services/mcp/MCPService';

const { width } = Dimensions.get('window');

type CategoriesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CategoriesList'>;

interface CategoryItemProps {
  category: Category;
  taskCount: number;
  completedCount: number;
  level: number;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddSubcategory: () => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  taskCount,
  completedCount,
  level,
  onPress,
  onEdit,
  onDelete,
  onAddSubcategory,
}) => {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  const completionRate = taskCount > 0 ? (completedCount / taskCount) * 100 : 0;
  const indentWidth = level * 20;

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, { marginLeft: indentWidth }]}>
      <Card
        mode="elevated"
        style={[
          styles.categoryCard,
          {
            backgroundColor: theme.colors.surface,
            borderLeftWidth: 4,
            borderLeftColor: category.color,
          },
        ]}
        onPress={handlePress}
      >
        <View style={styles.categoryContent}>
          <View style={styles.categoryHeader}>
            <View style={styles.categoryInfo}>
              <View style={styles.categoryTitleRow}>
                <View
                  style={[
                    styles.colorIndicator,
                    { backgroundColor: category.color },
                  ]}
                />
                <Text
                  variant="titleMedium"
                  style={[styles.categoryTitle, { color: theme.colors.onSurface }]}
                >
                  {category.name}
                </Text>
                {level > 0 && (
                  <Icon
                    name="subdirectory-arrow-right"
                    size={16}
                    color={theme.colors.onSurfaceVariant}
                  />
                )}
              </View>
              
              <View style={styles.categoryStats}>
                <Chip
                  mode="outlined"
                  compact
                  style={[styles.statChip, { borderColor: category.color }]}
                  textStyle={{ color: theme.colors.onSurface, fontSize: 12 }}
                >
                  {taskCount} task{taskCount !== 1 ? 's' : ''}
                </Chip>
                
                {taskCount > 0 && (
                  <Chip
                    mode="flat"
                    compact
                    style={[
                      styles.statChip,
                      {
                        backgroundColor: completionRate === 100 
                          ? theme.colors.primaryContainer 
                          : theme.colors.secondaryContainer,
                      },
                    ]}
                    textStyle={{
                      color: completionRate === 100 
                        ? theme.colors.onPrimaryContainer 
                        : theme.colors.onSecondaryContainer,
                      fontSize: 12,
                    }}
                  >
                    {Math.round(completionRate)}% done
                  </Chip>
                )}
              </View>
            </View>

            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  iconColor={theme.colors.onSurfaceVariant}
                  onPress={() => setMenuVisible(true)}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  onEdit();
                }}
                title="Edit"
                leadingIcon="pencil"
              />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  onAddSubcategory();
                }}
                title="Add Subcategory"
                leadingIcon="folder-plus"
              />
              <Divider />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  onDelete();
                }}
                title="Delete"
                leadingIcon="delete"
                titleStyle={{ color: theme.colors.error }}
              />
            </Menu>
          </View>

          {/* Progress Bar */}
          {taskCount > 0 && (
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressBar,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
              >
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: category.color,
                      width: `${completionRate}%`,
                    },
                  ]}
                />
              </View>
              <Text
                variant="labelSmall"
                style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}
              >
                {completedCount} of {taskCount} completed
              </Text>
            </View>
          )}
        </View>
      </Card>
    </Animated.View>
  );
};

const CategoriesScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<CategoriesScreenNavigationProp>();
  const dispatch = useDispatch();
  
  const { categories, loading } = useSelector((state: RootState) => state.categories || { categories: [], loading: false });
  const { tasks } = useSelector((state: RootState) => state.tasks || { tasks: [] });
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHierarchy, setShowHierarchy] = useState(true);
  const [analyticsVisible, setAnalyticsVisible] = useState(false);
  const [categoryAnalytics, setCategoryAnalytics] = useState<any[]>([]);
  const fadeAnim = new Animated.Value(0);

  const loadData = useCallback(async () => {
    try {
      await Promise.all([
        (dispatch as any)(loadCategories()).unwrap(),
        (dispatch as any)(loadTasks()).unwrap(),
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, [dispatch]);

  const loadAnalytics = useCallback(async () => {
    if (categories.length === 0) return;
    
    try {
      const analytics = await MCPService.optimizeCategories(tasks, categories);
      setCategoryAnalytics(analytics);
    } catch (error) {
      console.error('Failed to load category analytics:', error);
    }
  }, [categories, tasks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    await loadAnalytics();
    setRefreshing(false);
  }, [loadData, loadAnalytics]);

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

  useEffect(() => {
    if (categories.length > 0) {
      loadAnalytics();
    }
  }, [categories, tasks, loadAnalytics]);

  // Build hierarchical category structure
  const buildCategoryHierarchy = useCallback(() => {
    const categoryMap = new Map();
    const rootCategories: any[] = [];

    // Create category map with task counts
    categories.forEach((category: Category) => {
      const categoryTasks = tasks.filter((task: Task) => task.categoryId === category.id);
      const completedTasks = categoryTasks.filter((task: Task) => task.status === 'completed');
      
      categoryMap.set(category.id, {
        ...category,
        taskCount: categoryTasks.length,
        completedCount: completedTasks.length,
        children: [],
      });
    });

    // Build hierarchy
    categoryMap.forEach((category) => {
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });

    return rootCategories;
  }, [categories, tasks]);

  // Flatten hierarchy for display
  const flattenCategories = useCallback((categories: any[], level = 0): any[] => {
    let result: any[] = [];
    
    categories.forEach((category) => {
      result.push({ ...category, level });
      if (category.children && category.children.length > 0) {
        result = result.concat(flattenCategories(category.children, level + 1));
      }
    });
    
    return result;
  }, []);

  // Filter categories based on search
  const filteredCategories = useCallback(() => {
    const hierarchy = buildCategoryHierarchy();
    const flattened = showHierarchy ? flattenCategories(hierarchy) : hierarchy.map(cat => ({ ...cat, level: 0 }));
    
    if (!searchQuery) return flattened;
    
    return flattened.filter((category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [buildCategoryHierarchy, flattenCategories, showHierarchy, searchQuery]);

  const handleAddCategory = () => {
    navigation.navigate('AddCategory', {});
  };

  const handleEditCategory = (categoryId: string) => {
    navigation.navigate('EditCategory', { categoryId });
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    const categoryTasks = tasks.filter((task: Task) => task.categoryId === categoryId);
    
    if (categoryTasks.length > 0) {
      Alert.alert(
        'Cannot Delete Category',
        `The category "${categoryName}" contains ${categoryTasks.length} task${categoryTasks.length > 1 ? 's' : ''}. Please move or delete these tasks first.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${categoryName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await (dispatch as any)(deleteCategory(categoryId)).unwrap();
            } catch (error) {
              console.error('Failed to delete category:', error);
            }
          },
        },
      ]
    );
  };

  const handleAddSubcategory = (parentId: string) => {
    navigation.navigate('AddCategory', { parentId });
  };

  const renderHeader = () => (
    <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <View style={styles.headerContent}>
        <View style={styles.titleContainer}>
          <Text variant="headlineLarge" style={{ color: theme.colors.onSurface }}>
            Categories
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {filteredCategories().length} categor{filteredCategories().length !== 1 ? 'ies' : 'y'}
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          <IconButton
            icon={showHierarchy ? 'file-tree' : 'format-list-bulleted'}
            size={24}
            iconColor={theme.colors.onSurfaceVariant}
            onPress={() => setShowHierarchy(!showHierarchy)}
          />
          <IconButton
            icon="chart-bar"
            size={24}
            iconColor={theme.colors.onSurfaceVariant}
            onPress={() => setAnalyticsVisible(true)}
          />
        </View>
      </View>

      <Searchbar
        placeholder="Search categories..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
        inputStyle={{ color: theme.colors.onSurface }}
        iconColor={theme.colors.onSurfaceVariant}
        placeholderTextColor={theme.colors.onSurfaceVariant}
      />
    </Surface>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="folder-outline" size={64} color={theme.colors.onSurfaceVariant} />
      <Text variant="headlineSmall" style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
        {searchQuery ? 'No categories found' : 'No categories yet'}
      </Text>
      <Text variant="bodyMedium" style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
        {searchQuery 
          ? 'Try adjusting your search terms'
          : 'Create your first category to organize your tasks'
        }
      </Text>
    </View>
  );

  const renderAnalyticsModal = () => (
    <Portal>
      <Modal
        visible={analyticsVisible}
        onDismiss={() => setAnalyticsVisible(false)}
        contentContainerStyle={[styles.analyticsModal, { backgroundColor: theme.colors.surface }]}
      >
        <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
          Category Analytics
        </Text>
        
        {categoryAnalytics.length > 0 ? (
          <FlatList
            data={categoryAnalytics}
            keyExtractor={(item) => item.categoryId}
            renderItem={({ item }) => (
              <Card style={[styles.analyticsCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Card.Content>
                  <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                    {categories.find((c: Category) => c.id === item.categoryId)?.name}
                  </Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                    {item.reasoning}
                  </Text>
                  <View style={styles.analyticsStats}>
                    <Chip compact mode="outlined">
                      {item.taskDistribution} tasks
                    </Chip>
                  </View>
                </Card.Content>
              </Card>
            )}
            style={styles.analyticsList}
          />
        ) : (
          <View style={styles.analyticsEmpty}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginTop: 8 }}>
              Analyzing categories...
            </Text>
          </View>
        )}
        
        <Button
          mode="contained"
          onPress={() => setAnalyticsVisible(false)}
          style={styles.modalCloseButton}
        >
          Close
        </Button>
      </Modal>
    </Portal>
  );

  if (loading && categories.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyLarge" style={{ color: theme.colors.onBackground, marginTop: materialStyles.spacing.md }}>
          Loading categories...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderHeader()}
      
      <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
        {filteredCategories().length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredCategories()}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <CategoryItem
                category={item}
                taskCount={item.taskCount}
                completedCount={item.completedCount}
                level={item.level}
                onPress={() => {}}
                onEdit={() => handleEditCategory(item.id)}
                onDelete={() => handleDeleteCategory(item.id, item.name)}
                onAddSubcategory={() => handleAddSubcategory(item.id)}
              />
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
        )}
      </Animated.View>
      
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleAddCategory}
        label="Add Category"
        variant="extended"
      />

      {renderAnalyticsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: materialStyles.spacing.xl,
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
    ...materialStyles.elevation.level1,
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
  },
  listContent: {
    paddingHorizontal: materialStyles.spacing.md,
    paddingBottom: 100, // Space for FAB
  },
  categoryCard: {
    marginVertical: materialStyles.spacing.xs,
    ...materialStyles.elevation.level2,
  },
  categoryContent: {
    padding: materialStyles.spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: materialStyles.spacing.sm,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: materialStyles.spacing.sm,
  },
  categoryTitle: {
    flex: 1,
    fontWeight: '500',
  },
  categoryStats: {
    flexDirection: 'row',
    gap: materialStyles.spacing.xs,
  },
  statChip: {
    height: 28,
  },
  progressContainer: {
    marginTop: materialStyles.spacing.md,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    marginTop: materialStyles.spacing.xs,
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    margin: materialStyles.spacing.lg,
    right: 0,
    bottom: 0,
    ...materialStyles.elevation.level3,
  },
  analyticsModal: {
    margin: materialStyles.spacing.lg,
    padding: materialStyles.spacing.lg,
    borderRadius: materialStyles.borderRadius.lg,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: materialStyles.spacing.lg,
    textAlign: 'center',
  },
  analyticsList: {
    maxHeight: 400,
  },
  analyticsCard: {
    marginBottom: materialStyles.spacing.sm,
  },
  analyticsStats: {
    flexDirection: 'row',
    marginTop: materialStyles.spacing.sm,
  },
  analyticsEmpty: {
    alignItems: 'center',
    paddingVertical: materialStyles.spacing.xl,
  },
  modalCloseButton: {
    marginTop: materialStyles.spacing.lg,
  },
});

export default CategoriesScreen;