import { Todo, Category, Analytics, WeeklyProgress, CategoryStats } from '../types';
import { databaseService } from './database';

class AnalyticsService {
  // Generate comprehensive analytics
  async generateAnalytics(dateRange?: { start: Date; end: Date }): Promise<Analytics> {
    try {
      const todos = await databaseService.getTodos();
      const categories = await databaseService.getCategories();
      
      const now = new Date();
      const startDate = dateRange?.start || new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = dateRange?.end || now;

      // Filter todos by date range
      const filteredTodos = todos.filter(todo => 
        todo.createdAt >= startDate && todo.createdAt <= endDate
      );

      const completedTodos = filteredTodos.filter(todo => todo.completed);
      
      // Basic metrics
      const totalTasks = filteredTodos.length;
      const completedTasks = completedTodos.length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Calculate average completion time
      const completionTimes = completedTodos
        .filter(todo => todo.actualTime)
        .map(todo => todo.actualTime!);
      
      const averageCompletionTime = completionTimes.length > 0
        ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
        : 0;

      // Calculate productivity score
      const productivityScore = this.calculateProductivityScore(filteredTodos, completedTodos);

      // Calculate streak days
      const streakDays = this.calculateStreakDays(todos);

      // Generate category stats
      const categoryStats = this.generateCategoryStats(filteredTodos, categories);

      // Generate weekly progress
      const weeklyProgress = this.generateWeeklyProgress(todos, startDate, endDate);

      return {
        totalTasks,
        completedTasks,
        completionRate,
        averageCompletionTime,
        productivityScore,
        streakDays,
        categoryStats,
        weeklyProgress
      };
    } catch (error) {
      console.error('Generate analytics error:', error);
      throw error;
    }
  }

  // Calculate productivity score (0-100)
  private calculateProductivityScore(allTodos: Todo[], completedTodos: Todo[]): number {
    if (allTodos.length === 0) return 0;

    let score = 0;
    const weights = {
      completion: 40,
      timeliness: 30,
      priority: 20,
      consistency: 10
    };

    // Completion rate score
    const completionRate = (completedTodos.length / allTodos.length) * 100;
    score += (completionRate / 100) * weights.completion;

    // Timeliness score (completed before due date)
    const timelyCompletions = completedTodos.filter(todo => {
      if (!todo.dueDate) return true; // No due date = timely
      return todo.updatedAt <= todo.dueDate;
    });
    const timelinessRate = completedTodos.length > 0 
      ? (timelyCompletions.length / completedTodos.length) * 100 
      : 100;
    score += (timelinessRate / 100) * weights.timeliness;

    // Priority completion score (high priority tasks completed)
    const highPriorityTodos = allTodos.filter(todo => todo.priority === 'high');
    const completedHighPriority = completedTodos.filter(todo => todo.priority === 'high');
    const priorityRate = highPriorityTodos.length > 0
      ? (completedHighPriority.length / highPriorityTodos.length) * 100
      : 100;
    score += (priorityRate / 100) * weights.priority;

    // Consistency score (tasks completed regularly)
    const consistencyScore = this.calculateConsistencyScore(completedTodos);
    score += (consistencyScore / 100) * weights.consistency;

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  // Calculate consistency score based on regular completion patterns
  private calculateConsistencyScore(completedTodos: Todo[]): number {
    if (completedTodos.length < 7) return 50; // Not enough data

    // Group completions by day
    const completionsByDay: Record<string, number> = {};
    const last7Days = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toDateString();
      last7Days.push(dateKey);
      completionsByDay[dateKey] = 0;
    }

    // Count completions per day
    completedTodos.forEach(todo => {
      const dateKey = todo.updatedAt.toDateString();
      if (completionsByDay.hasOwnProperty(dateKey)) {
        completionsByDay[dateKey]++;
      }
    });

    // Calculate consistency (days with at least one completion)
    const activeDays = last7Days.filter(day => completionsByDay[day] > 0).length;
    return (activeDays / 7) * 100;
  }

  // Calculate current streak of days with completed tasks
  private calculateStreakDays(todos: Todo[]): number {
    const completedTodos = todos.filter(todo => todo.completed);
    if (completedTodos.length === 0) return 0;

    // Sort by completion date (most recent first)
    const sortedCompletions = completedTodos
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Check each day going backwards
    while (true) {
      const dayCompletions = sortedCompletions.filter(todo => {
        const completionDate = new Date(todo.updatedAt);
        completionDate.setHours(0, 0, 0, 0);
        return completionDate.getTime() === currentDate.getTime();
      });

      if (dayCompletions.length > 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        // If it's today and no completions, don't break streak yet
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (currentDate.getTime() === today.getTime()) {
          currentDate.setDate(currentDate.getDate() - 1);
          continue;
        }
        break;
      }

      // Prevent infinite loop
      if (streak > 365) break;
    }

    return streak;
  }

  // Generate category statistics
  private generateCategoryStats(todos: Todo[], categories: Category[]): CategoryStats[] {
    const stats: CategoryStats[] = [];

    categories.forEach(category => {
      const categoryTodos = todos.filter(todo => todo.categoryId === category.id);
      const completedCategoryTodos = categoryTodos.filter(todo => todo.completed);
      
      const totalTasks = categoryTodos.length;
      const completedTasks = completedCategoryTodos.length;
      
      // Calculate average time for completed tasks
      const timesWithActualTime = completedCategoryTodos
        .filter(todo => todo.actualTime)
        .map(todo => todo.actualTime!);
      
      const averageTime = timesWithActualTime.length > 0
        ? timesWithActualTime.reduce((sum, time) => sum + time, 0) / timesWithActualTime.length
        : 0;

      stats.push({
        categoryId: category.id,
        categoryName: category.name,
        totalTasks,
        completedTasks,
        averageTime
      });
    });

    // Add uncategorized tasks
    const uncategorizedTodos = todos.filter(todo => !todo.categoryId);
    const completedUncategorized = uncategorizedTodos.filter(todo => todo.completed);
    
    if (uncategorizedTodos.length > 0) {
      const timesWithActualTime = completedUncategorized
        .filter(todo => todo.actualTime)
        .map(todo => todo.actualTime!);
      
      const averageTime = timesWithActualTime.length > 0
        ? timesWithActualTime.reduce((sum, time) => sum + time, 0) / timesWithActualTime.length
        : 0;

      stats.push({
        categoryId: 'uncategorized',
        categoryName: 'Uncategorized',
        totalTasks: uncategorizedTodos.length,
        completedTasks: completedUncategorized.length,
        averageTime
      });
    }

    return stats.sort((a, b) => b.totalTasks - a.totalTasks);
  }

  // Generate weekly progress data
  private generateWeeklyProgress(todos: Todo[], startDate: Date, endDate: Date): WeeklyProgress[] {
    const progress: WeeklyProgress[] = [];
    const weeks: Record<string, { created: number; completed: number }> = {};

    // Initialize weeks
    let currentWeek = new Date(startDate);
    while (currentWeek <= endDate) {
      const weekKey = this.getWeekKey(currentWeek);
      weeks[weekKey] = { created: 0, completed: 0 };
      currentWeek.setDate(currentWeek.getDate() + 7);
    }

    // Count created and completed tasks per week
    todos.forEach(todo => {
      // Count created tasks
      if (todo.createdAt >= startDate && todo.createdAt <= endDate) {
        const createdWeek = this.getWeekKey(todo.createdAt);
        if (weeks[createdWeek]) {
          weeks[createdWeek].created++;
        }
      }

      // Count completed tasks
      if (todo.completed && todo.updatedAt >= startDate && todo.updatedAt <= endDate) {
        const completedWeek = this.getWeekKey(todo.updatedAt);
        if (weeks[completedWeek]) {
          weeks[completedWeek].completed++;
        }
      }
    });

    // Convert to progress array
    Object.entries(weeks).forEach(([week, data]) => {
      const productivity = data.created > 0 ? (data.completed / data.created) * 100 : 0;
      
      progress.push({
        week,
        created: data.created,
        completed: data.completed,
        productivity: Math.round(productivity)
      });
    });

    return progress.sort((a, b) => a.week.localeCompare(b.week));
  }

  // Get week key (YYYY-WW format)
  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${year}-${week.toString().padStart(2, '0')}`;
  }

  // Get productivity trends
  async getProductivityTrends(days: number = 30): Promise<{
    trend: 'up' | 'down' | 'stable';
    percentage: number;
    data: { date: string; productivity: number }[];
  }> {
    try {
      const todos = await databaseService.getTodos();
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const dailyData: { date: string; productivity: number }[] = [];

      // Calculate daily productivity
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];

        const dayTodos = todos.filter(todo => {
          const todoDate = todo.createdAt.toISOString().split('T')[0];
          return todoDate === dateKey;
        });

        const completedDayTodos = dayTodos.filter(todo => todo.completed);
        const productivity = dayTodos.length > 0 ? (completedDayTodos.length / dayTodos.length) * 100 : 0;

        dailyData.push({
          date: dateKey,
          productivity: Math.round(productivity)
        });
      }

      // Calculate trend
      const firstHalf = dailyData.slice(0, Math.floor(days / 2));
      const secondHalf = dailyData.slice(Math.floor(days / 2));

      const firstHalfAvg = firstHalf.reduce((sum, day) => sum + day.productivity, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, day) => sum + day.productivity, 0) / secondHalf.length;

      const difference = secondHalfAvg - firstHalfAvg;
      const percentage = Math.abs(difference);

      let trend: 'up' | 'down' | 'stable';
      if (Math.abs(difference) < 5) {
        trend = 'stable';
      } else if (difference > 0) {
        trend = 'up';
      } else {
        trend = 'down';
      }

      return {
        trend,
        percentage: Math.round(percentage),
        data: dailyData
      };
    } catch (error) {
      console.error('Get productivity trends error:', error);
      return {
        trend: 'stable',
        percentage: 0,
        data: []
      };
    }
  }

  // Get time distribution analysis
  async getTimeDistribution(): Promise<{
    byCategory: { name: string; time: number; percentage: number }[];
    byPriority: { priority: string; time: number; percentage: number }[];
    byDayOfWeek: { day: string; time: number; percentage: number }[];
  }> {
    try {
      const todos = await databaseService.getTodos();
      const categories = await databaseService.getCategories();
      const completedTodos = todos.filter(todo => todo.completed && todo.actualTime);

      const totalTime = completedTodos.reduce((sum, todo) => sum + (todo.actualTime || 0), 0);

      // Time by category
      const categoryTime: Record<string, number> = {};
      completedTodos.forEach(todo => {
        const categoryName = todo.categoryId 
          ? categories.find(c => c.id === todo.categoryId)?.name || 'Unknown'
          : 'Uncategorized';
        
        categoryTime[categoryName] = (categoryTime[categoryName] || 0) + (todo.actualTime || 0);
      });

      const byCategory = Object.entries(categoryTime).map(([name, time]) => ({
        name,
        time,
        percentage: totalTime > 0 ? Math.round((time / totalTime) * 100) : 0
      })).sort((a, b) => b.time - a.time);

      // Time by priority
      const priorityTime: Record<string, number> = {};
      completedTodos.forEach(todo => {
        priorityTime[todo.priority] = (priorityTime[todo.priority] || 0) + (todo.actualTime || 0);
      });

      const byPriority = Object.entries(priorityTime).map(([priority, time]) => ({
        priority,
        time,
        percentage: totalTime > 0 ? Math.round((time / totalTime) * 100) : 0
      })).sort((a, b) => b.time - a.time);

      // Time by day of week
      const dayTime: Record<string, number> = {};
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      completedTodos.forEach(todo => {
        const dayName = dayNames[todo.updatedAt.getDay()];
        dayTime[dayName] = (dayTime[dayName] || 0) + (todo.actualTime || 0);
      });

      const byDayOfWeek = dayNames.map(day => ({
        day,
        time: dayTime[day] || 0,
        percentage: totalTime > 0 ? Math.round(((dayTime[day] || 0) / totalTime) * 100) : 0
      }));

      return {
        byCategory,
        byPriority,
        byDayOfWeek
      };
    } catch (error) {
      console.error('Get time distribution error:', error);
      return {
        byCategory: [],
        byPriority: [],
        byDayOfWeek: []
      };
    }
  }

  // Export analytics data
  async exportAnalyticsData(format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const analytics = await this.generateAnalytics();
      const trends = await this.getProductivityTrends();
      const timeDistribution = await this.getTimeDistribution();

      const exportData = {
        generatedAt: new Date().toISOString(),
        analytics,
        trends,
        timeDistribution
      };

      if (format === 'json') {
        return JSON.stringify(exportData, null, 2);
      } else {
        // Convert to CSV format
        let csv = 'Metric,Value\n';
        csv += `Total Tasks,${analytics.totalTasks}\n`;
        csv += `Completed Tasks,${analytics.completedTasks}\n`;
        csv += `Completion Rate,${analytics.completionRate}%\n`;
        csv += `Average Completion Time,${analytics.averageCompletionTime} minutes\n`;
        csv += `Productivity Score,${analytics.productivityScore}\n`;
        csv += `Streak Days,${analytics.streakDays}\n`;
        
        return csv;
      }
    } catch (error) {
      console.error('Export analytics data error:', error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
