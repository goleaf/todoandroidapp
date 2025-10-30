import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Animated,
} from 'react-native';
import {
  Card,
  Text,
  useTheme,
  Surface,
  ProgressBar,
  Chip,
  FAB,
  Portal,
  Snackbar,
  ActivityIndicator,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { RootState } from '../../store';
import { loadTasks } from '../../store/slices/tasksSlice';
import { loadCategories } from '../../store/slices/categoriesSlice';
import { Task, Category } from '../../types';
import MCPService from '../../services/mcp/MCPService';
import { materialStyles, priorityColors, statusColors } from '../../theme/MaterialTheme';
import type { MCPAnalytics, MCPTaskSuggestion } from '../../services/mcp/MCPService';

const { width } = Dimensions.get('window');
const CARD_MARGIN = materialStyles.spacing.md;
const CARD_WIDTH = (width - (CARD_MARGIN * 3)) / 2;

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color: string;
  onPress?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color, 
  onPress 
}) => {
  const theme = useTheme();
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: materialStyles.animation.duration.medium2,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.statCard,
        {
          opacity: animatedValue,
          transform: [{
            translateY: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          }],
        },
      ]}
    >
      <Card
        mode="elevated"
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        onPress={onPress}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Icon name={icon} size={24} color={color} />
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {title}
            </Text>
          </View>
          <Text variant="headlineMedium" style={[styles.statValue, { color: theme.colors.onSurface }]}>
            {value}
          </Text>
          {subtitle && (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {subtitle}
            </Text>
          )}
        </Card.Content>
      </Card>
    </Animated.View>
  );
};

interface ProgressCardProps {
  title: string;
  progress: number;
  color: string;
  icon: string;
  details?: string;
}

const ProgressCard: React.FC<ProgressCardProps> = ({ 
  title, 
  progress, 
  color, 
  icon, 
  details 
}) => {
  const theme = useTheme();

  return (
    <Card mode="elevated" style={[styles.progressCard, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.progressHeader}>
          <View style={styles.progressTitleContainer}>
            <Icon name={icon} size={20} color={color} />
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              {title}
            </Text>
          </View>
          <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
        <ProgressBar
          progress={progress}
          color={color}
          style={styles.progressBar}
        />
        {details && (
          <Text variant="bodySmall" style={[styles.progressDetails, { color: theme.colors.onSurfaceVariant }]}>
            {details}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
};

interface InsightCardProps {
  insights: string[];
  suggestions: string[];
}

const InsightCard: React.FC<InsightCardProps> = ({ insights, suggestions }) => {
  const theme = useTheme();

  return (
    <Card mode="elevated" style={[styles.insightCard, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.insightHeader}>
          <Icon name="lightbulb-on" size={24} color={theme.colors.primary} />
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
            AI Insights
          </Text>
        </View>

        {insights.length > 0 && (
          <View style={styles.insightSection}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Your Progress
            </Text>
            {insights.map((insight, index) => (
              <View key={index} style={styles.insightItem}>
                <Icon name="chart-line" size={16} color={theme.colors.primary} />
                <Text variant="bodyMedium" style={[styles.insightText, { color: theme.colors.onSurface }]}>
                  {insight}
                </Text>
              </View>
            ))}
          </View>
        )}

        {suggestions.length > 0 && (
          <View style={styles.insightSection}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Suggestions
            </Text>
            {suggestions.map((suggestion, index) => (
              <View key={index} style={styles.insightItem}>
                <Icon name="lightbulb-outline" size={16} color={theme.colors.secondary} />
                <Text variant="bodyMedium" style={[styles.insightText, { color: theme.colors.onSurface }]}>
                  {suggestion}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const DashboardScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  
  const { tasks, loading: tasksLoading } = useSelector((state: RootState) => state.tasks || { tasks: [], loading: false });
  const { categories } = useSelector((state: RootState) => state.categories || { categories: [] });
  
  const [analytics, setAnalytics] = useState<MCPAnalytics | null>(null);
  const [suggestions, setSuggestions] = useState<MCPTaskSuggestion[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      await Promise.all([
        (dispatch as any)(loadTasks()).unwrap(),
        (dispatch as any)(loadCategories()).unwrap(),
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
      setSnackbarMessage('Failed to load data');
      setSnackbarVisible(true);
    }
  }, [dispatch]);

  const loadAnalytics = useCallback(async () => {
    if (tasks.length === 0) return;
    
    setAnalyticsLoading(true);
    try {
      const [analyticsData, suggestionsData] = await Promise.all([
        MCPService.analyzeProductivity(tasks, categories),
        MCPService.generateTaskSuggestions(tasks, categories),
      ]);
      
      setAnalytics(analyticsData);
      setSuggestions(suggestionsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setSnackbarMessage('Failed to load AI insights');
      setSnackbarVisible(true);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [tasks, categories]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    await loadAnalytics();
    setRefreshing(false);
  }, [loadData, loadAnalytics]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    if (tasks.length > 0) {
      loadAnalytics();
    }
  }, [tasks, categories, loadAnalytics]);

  // Calculate statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task: Task) => task.status === 'completed').length;
  const pendingTasks = tasks.filter((task: Task) => task.status !== 'completed').length;
  const highPriorityTasks = tasks.filter((task: Task) => task.priority === 'high' && task.status !== 'completed').length;
  
  const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;
  
  // Today's tasks
  const today = new Date();
  const todayTasks = tasks.filter((task: Task) => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate.toDateString() === today.toDateString();
  });

  // Overdue tasks
  const overdueTasks = tasks.filter((task: Task) => {
    if (!task.dueDate || task.status === 'completed') return false;
    return new Date(task.dueDate) < today;
  });

  if (tasksLoading && tasks.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyLarge" style={{ color: theme.colors.onBackground, marginTop: materialStyles.spacing.md }}>
          Loading your dashboard...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="headlineLarge" style={{ color: theme.colors.onSurface }}>
            Dashboard
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </Surface>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Total Tasks"
            value={totalTasks}
            subtitle={`${completedTasks} completed`}
            icon="format-list-checks"
            color={theme.colors.primary}
          />
          <StatCard
            title="Pending"
            value={pendingTasks}
            subtitle={`${highPriorityTasks} high priority`}
            icon="clock-outline"
            color={statusColors.todo.light}
          />
          <StatCard
            title="Due Today"
            value={todayTasks.length}
            subtitle={todayTasks.filter(t => t.status !== 'completed').length + ' remaining'}
            icon="calendar-today"
            color={priorityColors.medium.light}
          />
          <StatCard
            title="Overdue"
            value={overdueTasks.length}
            subtitle="Need attention"
            icon="alert-circle-outline"
            color={priorityColors.high.light}
          />
        </View>

        {/* Progress Cards */}
        <View style={styles.progressContainer}>
          <ProgressCard
            title="Overall Progress"
            progress={completionRate}
            color={theme.colors.primary}
            icon="chart-line"
            details={`${completedTasks} of ${totalTasks} tasks completed`}
          />
          
          {analytics && (
            <ProgressCard
              title="Productivity Score"
              progress={analytics.productivity / 100}
              color={priorityColors.medium.light}
              icon="trending-up"
              details={`Most productive: ${analytics.mostProductiveTime}`}
            />
          )}
        </View>

        {/* Categories Overview */}
        {categories.length > 0 && (
          <Card mode="elevated" style={[styles.categoriesCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <View style={styles.cardTitleContainer}>
                <Icon name="folder-multiple" size={24} color={theme.colors.primary} />
                <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
                  Categories
                </Text>
              </View>
              <View style={styles.categoriesContainer}>
                {categories.slice(0, 6).map((category: Category) => {
                  const categoryTasks = tasks.filter((task: Task) => task.categoryId === category.id);
                  return (
                    <Chip
                      key={category.id}
                      mode="outlined"
                      style={[styles.categoryChip, { borderColor: category.color }]}
                      textStyle={{ color: theme.colors.onSurface }}
                    >
                      {category.name} ({categoryTasks.length})
                    </Chip>
                  );
                })}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* AI Insights */}
        {(analyticsLoading || (analytics && (analytics.insights.length > 0 || analytics.suggestions.length > 0))) && (
          <View style={styles.insightContainer}>
            {analyticsLoading ? (
              <Card mode="elevated" style={[styles.insightCard, { backgroundColor: theme.colors.surface }]}>
                <Card.Content style={styles.loadingInsights}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                    Analyzing your productivity...
                  </Text>
                </Card.Content>
              </Card>
            ) : analytics && (
              <InsightCard 
                insights={analytics.insights} 
                suggestions={analytics.suggestions} 
              />
            )}
          </View>
        )}

        {/* Empty State */}
        {totalTasks === 0 && (
          <Card mode="elevated" style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.emptyContent}>
              <Icon name="clipboard-text-outline" size={64} color={theme.colors.onSurfaceVariant} />
              <Text variant="headlineSmall" style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
                Welcome to Your Dashboard
              </Text>
              <Text variant="bodyMedium" style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
                Start by creating your first task to see your productivity insights here.
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <Portal>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          style={{ backgroundColor: theme.colors.errorContainer }}
        >
          <Text style={{ color: theme.colors.onErrorContainer }}>{snackbarMessage}</Text>
        </Snackbar>
      </Portal>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: materialStyles.spacing.xxl,
  },
  header: {
    padding: materialStyles.spacing.lg,
    marginBottom: materialStyles.spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: materialStyles.spacing.md,
    marginBottom: materialStyles.spacing.md,
  },
  statCard: {
    width: CARD_WIDTH,
    marginBottom: materialStyles.spacing.md,
    marginHorizontal: materialStyles.spacing.xs,
  },
  card: {
    ...materialStyles.elevation.level2,
  },
  cardContent: {
    padding: materialStyles.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: materialStyles.spacing.sm,
    gap: materialStyles.spacing.xs,
  },
  statValue: {
    fontWeight: '600',
    marginBottom: materialStyles.spacing.xs,
  },
  progressContainer: {
    paddingHorizontal: materialStyles.spacing.md,
    marginBottom: materialStyles.spacing.md,
  },
  progressCard: {
    marginBottom: materialStyles.spacing.md,
    ...materialStyles.elevation.level2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: materialStyles.spacing.sm,
  },
  progressTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: materialStyles.spacing.xs,
  },
  progressBar: {
    height: 8,
    borderRadius: materialStyles.borderRadius.sm,
    marginBottom: materialStyles.spacing.xs,
  },
  progressDetails: {
    marginTop: materialStyles.spacing.xs,
  },
  categoriesCard: {
    marginHorizontal: materialStyles.spacing.md,
    marginBottom: materialStyles.spacing.md,
    ...materialStyles.elevation.level2,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: materialStyles.spacing.xs,
    marginBottom: materialStyles.spacing.md,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: materialStyles.spacing.xs,
  },
  categoryChip: {
    marginBottom: materialStyles.spacing.xs,
  },
  insightContainer: {
    paddingHorizontal: materialStyles.spacing.md,
    marginBottom: materialStyles.spacing.md,
  },
  insightCard: {
    ...materialStyles.elevation.level2,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: materialStyles.spacing.xs,
    marginBottom: materialStyles.spacing.md,
  },
  insightSection: {
    marginBottom: materialStyles.spacing.md,
  },
  sectionTitle: {
    marginBottom: materialStyles.spacing.sm,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: materialStyles.spacing.xs,
    marginBottom: materialStyles.spacing.sm,
  },
  insightText: {
    flex: 1,
    lineHeight: 20,
  },
  loadingInsights: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: materialStyles.spacing.md,
    justifyContent: 'center',
    paddingVertical: materialStyles.spacing.lg,
  },
  emptyCard: {
    marginHorizontal: materialStyles.spacing.md,
    ...materialStyles.elevation.level2,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: materialStyles.spacing.xxl,
  },
  emptyTitle: {
    marginTop: materialStyles.spacing.lg,
    marginBottom: materialStyles.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    paddingHorizontal: materialStyles.spacing.lg,
  },
});

export default DashboardScreen;