import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { 
  Card, 
  ProgressBar, 
  Chip, 
  Button, 
  IconButton,
  Divider,
  List,
  Badge,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { updateAnalytics, calculateProductivityScore } from '../../store/slices/analyticsSlice';
import { generateProductivityInsights } from '../../store/slices/aiSlice';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const dispatch = useDispatch();
  const todos = useSelector((state: RootState) => state.todos.todos);
  const timeEntries = useSelector((state: RootState) => state.todos.timeEntries);
  const categories = useSelector((state: RootState) => state.categories.categories);
  const habits = useSelector((state: RootState) => state.habits.habits);
  const { stats, pomodoroSessions, focusSessions } = useSelector((state: RootState) => state.user);
  const { insights } = useSelector((state: RootState) => state.ai);
  
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [selectedMetric, setSelectedMetric] = useState<'completion' | 'time' | 'productivity'>('completion');

  useEffect(() => {
    calculateAnalytics();
  }, [todos, timeEntries, selectedPeriod]);

  const calculateAnalytics = () => {
    const now = new Date();
    const periodStart = new Date();
    
    switch (selectedPeriod) {
      case 'week':
        periodStart.setDate(now.getDate() - 7);
        break;
      case 'month':
        periodStart.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        periodStart.setFullYear(now.getFullYear() - 1);
        break;
    }

    const periodTodos = todos.filter(todo => 
      new Date(todo.createdAt) >= periodStart
    );
    
    const completedTodos = periodTodos.filter(todo => todo.completed);
    const totalTimeSpent = timeEntries
      .filter(entry => entry.endTime && new Date(entry.startTime) >= periodStart)
      .reduce((sum, entry) => sum + entry.duration, 0);

    // Generate AI insights
    dispatch(generateProductivityInsights({
      todos: periodTodos,
      completedTasks: completedTodos.length,
      timeSpent: totalTimeSpent,
    }));

    // Update analytics
    dispatch(updateAnalytics({
      totalTasks: periodTodos.length,
      completedTasks: completedTodos.length,
      completionRate: periodTodos.length > 0 ? (completedTodos.length / periodTodos.length) * 100 : 0,
      averageCompletionTime: completedTodos.length > 0 ? totalTimeSpent / completedTodos.length : 0,
      streakDays: stats.currentStreak,
      xpEarned: stats.xp,
      level: stats.level,
    }));

    dispatch(calculateProductivityScore());
  };

  const getCompletionData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    return {
      labels: last7Days.map(date => date.toLocaleDateString('en', { weekday: 'short' })),
      datasets: [{
        data: last7Days.map(date => {
          const dayTodos = todos.filter(todo => {
            const todoDate = new Date(todo.updatedAt);
            return todoDate.toDateString() === date.toDateString() && todo.completed;
          });
          return dayTodos.length;
        }),
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  };

  const getCategoryData = () => {
    const categoryStats = categories.map(category => {
      const categoryTodos = todos.filter(todo => todo.categoryId === category.id);
      const completedCategoryTodos = categoryTodos.filter(todo => todo.completed);
      
      return {
        name: category.name,
        population: categoryTodos.length,
        color: category.color,
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      };
    }).filter(stat => stat.population > 0);

    return categoryStats;
  };

  const getTimeDistributionData = () => {
    const categoryTimeData = categories.map(category => {
      const categoryTime = timeEntries
        .filter(entry => {
          const todo = todos.find(t => t.id === entry.todoId);
          return todo?.categoryId === category.id;
        })
        .reduce((sum, entry) => sum + entry.duration, 0);
      
      return {
        category: category.name,
        time: Math.round(categoryTime / 60), // Convert to hours
        color: category.color,
      };
    }).filter(data => data.time > 0);

    return {
      labels: categoryTimeData.map(data => data.category),
      datasets: [{
        data: categoryTimeData.map(data => data.time),
        colors: categoryTimeData.map(data => () => data.color),
      }],
    };
  };

  const totalTasks = todos.length;
  const completedTasks = todos.filter(todo => todo.completed).length;
  const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;
  const overdueTasks = todos.filter(todo => 
    todo.dueDate && 
    new Date(todo.dueDate) < new Date() && 
    !todo.completed
  ).length;

  const totalTimeSpent = timeEntries.reduce((sum, entry) => sum + entry.duration, 0);
  const avgTaskTime = completedTasks > 0 ? totalTimeSpent / completedTasks : 0;
  
  const activeHabits = habits.filter(habit => habit.isActive);
  const habitCompletionRate = activeHabits.length > 0 
    ? activeHabits.reduce((sum, habit) => sum + (habit.currentStreak > 0 ? 1 : 0), 0) / activeHabits.length 
    : 0;

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  return (
    <ScrollView style={styles.container}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {['week', 'month', 'year'].map(period => (
          <Chip
            key={period}
            selected={selectedPeriod === period}
            onPress={() => setSelectedPeriod(period as any)}
            style={styles.periodChip}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Chip>
        ))}
      </View>

      {/* Overview Cards */}
      <View style={styles.overviewGrid}>
        <Card style={styles.overviewCard}>
          <Card.Content style={styles.overviewContent}>
            <MaterialIcons name="assignment" size={24} color="#2196F3" />
            <Text style={styles.overviewValue}>{totalTasks}</Text>
            <Text style={styles.overviewLabel}>Total Tasks</Text>
          </Card.Content>
        </Card>

        <Card style={styles.overviewCard}>
          <Card.Content style={styles.overviewContent}>
            <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
            <Text style={styles.overviewValue}>{completedTasks}</Text>
            <Text style={styles.overviewLabel}>Completed</Text>
          </Card.Content>
        </Card>

        <Card style={styles.overviewCard}>
          <Card.Content style={styles.overviewContent}>
            <MaterialIcons name="schedule" size={24} color="#FF9800" />
            <Text style={styles.overviewValue}>{overdueTasks}</Text>
            <Text style={styles.overviewLabel}>Overdue</Text>
          </Card.Content>
        </Card>

        <Card style={styles.overviewCard}>
          <Card.Content style={styles.overviewContent}>
            <MaterialIcons name="trending-up" size={24} color="#9C27B0" />
            <Text style={styles.overviewValue}>{Math.round(completionRate * 100)}%</Text>
            <Text style={styles.overviewLabel}>Completion</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Gamification Stats */}
      <Card style={styles.card}>
        <Card.Title 
          title="Your Progress" 
          left={() => <MaterialIcons name="stars" size={24} color="#FFD700" />}
        />
        <Card.Content>
          <View style={styles.gamificationRow}>
            <View style={styles.gamificationItem}>
              <Text style={styles.gamificationLabel}>Level</Text>
              <Text style={styles.gamificationValue}>{stats.level}</Text>
            </View>
            <View style={styles.gamificationItem}>
              <Text style={styles.gamificationLabel}>XP</Text>
              <Text style={styles.gamificationValue}>{stats.xp}</Text>
            </View>
            <View style={styles.gamificationItem}>
              <Text style={styles.gamificationLabel}>Streak</Text>
              <Text style={styles.gamificationValue}>{stats.currentStreak} days</Text>
            </View>
            <View style={styles.gamificationItem}>
              <Text style={styles.gamificationLabel}>Badges</Text>
              <Text style={styles.gamificationValue}>{stats.badges.length}</Text>
            </View>
          </View>
          
          <View style={styles.xpProgress}>
            <Text style={styles.xpProgressLabel}>
              Progress to Level {stats.level + 1}
            </Text>
            <ProgressBar 
              progress={stats.xp / stats.xpToNextLevel} 
              color="#FFD700" 
              style={styles.xpProgressBar}
            />
            <Text style={styles.xpProgressText}>
              {stats.xp} / {stats.xpToNextLevel} XP
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Completion Trend Chart */}
      <Card style={styles.card}>
        <Card.Title title="Completion Trend (Last 7 Days)" />
        <Card.Content>
          <LineChart
            data={getCompletionData()}
            width={width - 64}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* Category Distribution */}
      {getCategoryData().length > 0 && (
        <Card style={styles.card}>
          <Card.Title title="Tasks by Category" />
          <Card.Content>
            <PieChart
              data={getCategoryData()}
              width={width - 64}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          </Card.Content>
        </Card>
      )}

      {/* Time Distribution */}
      {getTimeDistributionData().labels.length > 0 && (
        <Card style={styles.card}>
          <Card.Title title="Time Spent by Category (Hours)" />
          <Card.Content>
            <BarChart
              data={getTimeDistributionData()}
              width={width - 64}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
            />
          </Card.Content>
        </Card>
      )}

      {/* Habits Overview */}
      <Card style={styles.card}>
        <Card.Title 
          title="Habits Overview" 
          subtitle={`${activeHabits.length} active habits`}
        />
        <Card.Content>
          <View style={styles.habitsGrid}>
            {activeHabits.slice(0, 4).map(habit => (
              <View key={habit.id} style={styles.habitItem}>
                <MaterialIcons 
                  name={habit.icon as any} 
                  size={20} 
                  color={habit.color} 
                />
                <Text style={styles.habitName}>{habit.name}</Text>
                <Text style={styles.habitStreak}>{habit.currentStreak} days</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.habitsSummary}>
            <Text style={styles.habitsLabel}>Overall Habit Completion</Text>
            <ProgressBar 
              progress={habitCompletionRate} 
              color="#4CAF50" 
              style={styles.habitsProgress}
            />
            <Text style={styles.habitsPercentage}>
              {Math.round(habitCompletionRate * 100)}%
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* AI Insights */}
      {insights.length > 0 && (
        <Card style={styles.card}>
          <Card.Title 
            title="AI Insights" 
            subtitle={`${insights.filter(i => !i.dismissedAt).length} active insights`}
            left={() => <MaterialIcons name="auto-awesome" size={24} color="#9C27B0" />}
          />
          <Card.Content>
            {insights
              .filter(insight => !insight.dismissedAt)
              .slice(0, 3)
              .map(insight => (
                <List.Item
                  key={insight.id}
                  title={insight.title}
                  description={insight.description}
                  left={() => (
                    <MaterialIcons 
                      name={insight.type === 'productivity_tip' ? 'lightbulb' : 'insights'} 
                      size={20} 
                      color="#9C27B0" 
                    />
                  )}
                  right={() => (
                    <Badge size={16}>
                      {Math.round(insight.confidence * 100)}%
                    </Badge>
                  )}
                />
              ))}
          </Card.Content>
        </Card>
      )}

      {/* Productivity Sessions */}
      <Card style={styles.card}>
        <Card.Title title="Focus Sessions" />
        <Card.Content>
          <View style={styles.sessionsRow}>
            <View style={styles.sessionItem}>
              <MaterialIcons name="timer" size={20} color="#F44336" />
              <Text style={styles.sessionLabel}>Pomodoros</Text>
              <Text style={styles.sessionValue}>{pomodoroSessions.length}</Text>
            </View>
            <View style={styles.sessionItem}>
              <MaterialIcons name="psychology" size={20} color="#2196F3" />
              <Text style={styles.sessionLabel}>Focus Sessions</Text>
              <Text style={styles.sessionValue}>{focusSessions.length}</Text>
            </View>
            <View style={styles.sessionItem}>
              <MaterialIcons name="schedule" size={20} color="#4CAF50" />
              <Text style={styles.sessionLabel}>Total Time</Text>
              <Text style={styles.sessionValue}>
                {Math.round(totalTimeSpent / 60)}h
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  periodChip: {
    marginHorizontal: 4,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  overviewCard: {
    width: '48%',
    margin: '1%',
    elevation: 2,
  },
  overviewContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 8,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    margin: 16,
  },
  gamificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  gamificationItem: {
    alignItems: 'center',
  },
  gamificationLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  gamificationValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  xpProgress: {
    marginTop: 16,
  },
  xpProgressLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  xpProgressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  xpProgressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  habitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  habitItem: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  habitName: {
    fontSize: 12,
    color: '#333',
    marginTop: 4,
    textAlign: 'center',
  },
  habitStreak: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  habitsSummary: {
    alignItems: 'center',
  },
  habitsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  habitsProgress: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  habitsPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  sessionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sessionItem: {
    alignItems: 'center',
  },
  sessionLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sessionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
});
