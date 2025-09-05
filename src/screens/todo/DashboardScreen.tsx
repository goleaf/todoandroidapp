import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Title, Paragraph, ProgressBar, Chip, Avatar, Button } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { RootState } from '../../store';
import { Todo, Analytics, UserStats } from '../../types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from 'date-fns';

const { width } = Dimensions.get('window');

interface Props {
  navigation: any;
}

export default function DashboardScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const { todos } = useSelector((state: RootState) => state.todos);
  const { categories } = useSelector((state: RootState) => state.categories);
  const { currentUser, stats } = useSelector((state: RootState) => state.user);
  const { habits } = useSelector((state: RootState) => state.user);

  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  // Calculate dashboard metrics
  const calculateMetrics = () => {
    const now = new Date();
    const todayTodos = todos.filter(todo => 
      todo.dueDate && isToday(new Date(todo.dueDate))
    );
    const overdueTodos = todos.filter(todo => 
      todo.dueDate && new Date(todo.dueDate) < now && !todo.completed
    );
    const completedToday = todos.filter(todo => 
      todo.completed && isToday(new Date(todo.updatedAt))
    );

    const totalTasks = todos.length;
    const completedTasks = todos.filter(todo => todo.completed).length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Category distribution
    const categoryStats = categories.map(category => {
      const categoryTodos = todos.filter(todo => todo.categoryId === category.id);
      const completedInCategory = categoryTodos.filter(todo => todo.completed).length;
      return {
        name: category.name,
        total: categoryTodos.length,
        completed: completedInCategory,
        color: category.color,
        percentage: categoryTodos.length > 0 ? (completedInCategory / categoryTodos.length) * 100 : 0,
      };
    });

    // Priority distribution
    const priorityStats = {
      high: todos.filter(todo => todo.priority === 'high').length,
      medium: todos.filter(todo => todo.priority === 'medium').length,
      low: todos.filter(todo => todo.priority === 'low').length,
    };

    return {
      todayTodos: todayTodos.length,
      overdueTodos: overdueTodos.length,
      completedToday: completedToday.length,
      totalTasks,
      completedTasks,
      completionRate,
      categoryStats,
      priorityStats,
    };
  };

  const metrics = calculateMetrics();

  // Generate weekly progress data
  const getWeeklyProgressData = () => {
    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const data = weekDays.map(day => {
      const dayTodos = todos.filter(todo => 
        todo.dueDate && format(new Date(todo.dueDate), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      );
      const completed = dayTodos.filter(todo => todo.completed).length;
      return {
        day: format(day, 'EEE'),
        completed,
        total: dayTodos.length,
      };
    });

    return {
      labels: data.map(d => d.day),
      datasets: [{
        data: data.map(d => d.completed),
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        strokeWidth: 2,
      }]
    };
  };

  // Generate category pie chart data
  const getCategoryPieData = () => {
    return metrics.categoryStats
      .filter(stat => stat.total > 0)
      .map((stat, index) => ({
        name: stat.name,
        population: stat.total,
        color: stat.color || `hsl(${index * 60}, 70%, 50%)`,
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      }));
  };

  // Generate priority bar chart data
  const getPriorityBarData = () => {
    return {
      labels: ['High', 'Medium', 'Low'],
      datasets: [{
        data: [
          metrics.priorityStats.high,
          metrics.priorityStats.medium,
          metrics.priorityStats.low,
        ],
      }]
    };
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#2196F3',
    },
  };

  const renderStatsCard = (title: string, value: number, icon: string, color: string, subtitle?: string) => (
    <Card style={[styles.statsCard, { borderLeftColor: color }]}>
      <Card.Content style={styles.statsContent}>
        <View style={styles.statsHeader}>
          <MaterialIcons name={icon} size={24} color={color} />
          <Text style={styles.statsValue}>{value}</Text>
        </View>
        <Text style={styles.statsTitle}>{title}</Text>
        {subtitle && <Text style={styles.statsSubtitle}>{subtitle}</Text>}
      </Card.Content>
    </Card>
  );

  const renderQuickActions = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>Quick Actions</Title>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('AddTodo')}
          >
            <MaterialIcons name="add-task" size={32} color="#2196F3" />
            <Text style={styles.quickActionText}>Add Task</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('Pomodoro')}
          >
            <MaterialIcons name="timer" size={32} color="#FF5722" />
            <Text style={styles.quickActionText}>Pomodoro</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('FocusMode')}
          >
            <MaterialIcons name="center-focus-strong" size={32} color="#9C27B0" />
            <Text style={styles.quickActionText}>Focus Mode</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('Analytics')}
          >
            <MaterialIcons name="analytics" size={32} color="#4CAF50" />
            <Text style={styles.quickActionText}>Analytics</Text>
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  );

  const renderRecentActivity = () => {
    const recentTodos = todos
      .filter(todo => todo.completed)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>Recent Activity</Title>
          {recentTodos.length === 0 ? (
            <Paragraph>No recent activity</Paragraph>
          ) : (
            recentTodos.map(todo => (
              <View key={todo.id} style={styles.activityItem}>
                <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{todo.title}</Text>
                  <Text style={styles.activityTime}>
                    {format(new Date(todo.updatedAt), 'MMM dd, HH:mm')}
                  </Text>
                </View>
                <Chip
                  mode="outlined"
                  compact
                  style={styles.priorityChip}
                  textStyle={{ fontSize: 10 }}
                >
                  {todo.priority}
                </Chip>
              </View>
            ))
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderUpcomingTasks = () => {
    const upcomingTodos = todos
      .filter(todo => !todo.completed && todo.dueDate)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 5);

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>Upcoming Tasks</Title>
          {upcomingTodos.length === 0 ? (
            <Paragraph>No upcoming tasks</Paragraph>
          ) : (
            upcomingTodos.map(todo => (
              <TouchableOpacity
                key={todo.id}
                style={styles.upcomingItem}
                onPress={() => navigation.navigate('TodoDetail', { todoId: todo.id })}
              >
                <View style={styles.upcomingContent}>
                  <Text style={styles.upcomingTitle}>{todo.title}</Text>
                  <Text style={styles.upcomingDate}>
                    Due: {format(new Date(todo.dueDate!), 'MMM dd, yyyy')}
                  </Text>
                </View>
                <View style={styles.upcomingMeta}>
                  <Chip
                    mode="outlined"
                    compact
                    style={[styles.priorityChip, { 
                      backgroundColor: todo.priority === 'high' ? '#ffebee' : 
                                     todo.priority === 'medium' ? '#fff3e0' : '#f3e5f5' 
                    }]}
                    textStyle={{ fontSize: 10 }}
                  >
                    {todo.priority}
                  </Chip>
                </View>
              </TouchableOpacity>
            ))
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderUserProfile = () => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.profileHeader}>
          <Avatar.Text 
            size={60} 
            label={currentUser?.displayName?.charAt(0) || 'U'} 
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Title>{currentUser?.displayName || 'User'}</Title>
            <View style={styles.levelInfo}>
              <Text style={styles.levelText}>Level {stats.level}</Text>
              <ProgressBar 
                progress={stats.xp / stats.xpToNextLevel} 
                color="#2196F3"
                style={styles.xpBar}
              />
              <Text style={styles.xpText}>{stats.xp}/{stats.xpToNextLevel} XP</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalTasksCompleted}</Text>
            <Text style={styles.statLabel}>Tasks Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.floor(stats.totalTimeSpent / 60)}</Text>
            <Text style={styles.statLabel}>Hours Focused</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* User Profile Card */}
      {renderUserProfile()}

      {/* Stats Overview */}
      <View style={styles.statsGrid}>
        {renderStatsCard('Today\'s Tasks', metrics.todayTodos, 'today', '#2196F3')}
        {renderStatsCard('Completed Today', metrics.completedToday, 'check-circle', '#4CAF50')}
        {renderStatsCard('Overdue', metrics.overdueTodos, 'warning', '#FF5722')}
        {renderStatsCard('Completion Rate', Math.round(metrics.completionRate), 'trending-up', '#9C27B0', '%')}
      </View>

      {/* Quick Actions */}
      {renderQuickActions()}

      {/* Weekly Progress Chart */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Weekly Progress</Title>
          <LineChart
            data={getWeeklyProgressData()}
            width={width - 64}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* Category Distribution */}
      {getCategoryPieData().length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Tasks by Category</Title>
            <PieChart
              data={getCategoryPieData()}
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

      {/* Priority Distribution */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Tasks by Priority</Title>
          <BarChart
            data={getPriorityBarData()}
            width={width - 64}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* Recent Activity */}
      {renderRecentActivity()}

      {/* Upcoming Tasks */}
      {renderUpcomingTasks()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statsCard: {
    width: (width - 48) / 2,
    marginBottom: 8,
    borderLeftWidth: 4,
    elevation: 2,
  },
  statsContent: {
    paddingVertical: 12,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statsTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statsSubtitle: {
    fontSize: 10,
    color: '#999',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  quickAction: {
    alignItems: 'center',
    padding: 12,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  priorityChip: {
    height: 24,
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  upcomingContent: {
    flex: 1,
  },
  upcomingTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  upcomingDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  upcomingMeta: {
    alignItems: 'flex-end',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    backgroundColor: '#2196F3',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  levelInfo: {
    marginTop: 8,
  },
  levelText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  xpBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  xpText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
});
