/**
 * MCP (Model Context Protocol) Service
 * Provides AI-powered features and intelligent task management
 */

import { Task, Category, TaskPriority, TaskStatus } from '../../types';

export interface MCPAnalytics {
  productivity: number;
  completionRate: number;
  averageTaskDuration: number;
  mostProductiveTime: string;
  suggestions: string[];
  insights: string[];
}

export interface MCPTaskSuggestion {
  title: string;
  description: string;
  priority: TaskPriority;
  estimatedDuration: number;
  category: string;
  reasoning: string;
}

export interface MCPCategoryOptimization {
  categoryId: string;
  suggestedName: string;
  suggestedColor: string;
  reasoning: string;
  taskDistribution: number;
}

class MCPService {
  private static instance: MCPService;
  private isInitialized = false;

  static getInstance(): MCPService {
    if (!MCPService.instance) {
      MCPService.instance = new MCPService();
    }
    return MCPService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🤖 Initializing MCP Service...');
      // Initialize AI models and context
      await this.loadModels();
      this.isInitialized = true;
      console.log('✅ MCP Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize MCP Service:', error);
      throw error;
    }
  }

  private async loadModels(): Promise<void> {
    // Simulate loading AI models
    return new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }

  /**
   * Analyze user productivity and provide insights
   */
  async analyzeProductivity(tasks: Task[], categories: Category[]): Promise<MCPAnalytics> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const completedTasks = tasks.filter(task => task.status === 'completed');
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

    // Calculate average task duration
    const tasksWithDuration = completedTasks.filter(task => 
      task.createdAt && task.updatedAt && task.status === 'completed'
    );
    
    const averageTaskDuration = tasksWithDuration.length > 0 
      ? tasksWithDuration.reduce((acc, task) => {
          const duration = new Date(task.updatedAt!).getTime() - new Date(task.createdAt).getTime();
          return acc + duration;
        }, 0) / tasksWithDuration.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    // Analyze most productive time
    const mostProductiveTime = this.analyzeMostProductiveTime(completedTasks);

    // Generate AI-powered suggestions
    const suggestions = await this.generateProductivitySuggestions(tasks, categories);
    const insights = await this.generateInsights(tasks, categories);

    return {
      productivity: Math.min(100, completionRate + (averageTaskDuration > 0 ? 10 : 0)),
      completionRate,
      averageTaskDuration,
      mostProductiveTime,
      suggestions,
      insights,
    };
  }

  /**
   * Generate intelligent task suggestions based on user patterns
   */
  async generateTaskSuggestions(
    existingTasks: Task[],
    categories: Category[],
    context?: string
  ): Promise<MCPTaskSuggestion[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Analyze user patterns
    const userPatterns = this.analyzeUserPatterns(existingTasks);
    const suggestions: MCPTaskSuggestion[] = [];

    // Generate contextual suggestions
    if (context?.toLowerCase().includes('work') || userPatterns.workTasks > userPatterns.personalTasks) {
      suggestions.push({
        title: 'Review weekly goals',
        description: 'Take 15 minutes to review and adjust your weekly objectives',
        priority: 'medium',
        estimatedDuration: 15,
        category: 'Work',
        reasoning: 'Regular goal review improves productivity by 23%',
      });

      suggestions.push({
        title: 'Team sync preparation',
        description: 'Prepare agenda and updates for upcoming team meetings',
        priority: 'high',
        estimatedDuration: 30,
        category: 'Work',
        reasoning: 'Prepared meetings are 40% more effective',
      });
    }

    if (context?.toLowerCase().includes('personal') || userPatterns.personalTasks > userPatterns.workTasks) {
      suggestions.push({
        title: 'Daily reflection',
        description: 'Spend 10 minutes reflecting on today\'s accomplishments',
        priority: 'low',
        estimatedDuration: 10,
        category: 'Personal',
        reasoning: 'Daily reflection improves self-awareness and goal achievement',
      });

      suggestions.push({
        title: 'Plan weekend activities',
        description: 'Schedule relaxing and enjoyable activities for the weekend',
        priority: 'medium',
        estimatedDuration: 20,
        category: 'Personal',
        reasoning: 'Planned leisure time reduces stress and improves work-life balance',
      });
    }

    // Add health and wellness suggestions
    suggestions.push({
      title: 'Take a 10-minute walk',
      description: 'Step outside for fresh air and light exercise',
      priority: 'low',
      estimatedDuration: 10,
      category: 'Health',
      reasoning: 'Short walks boost creativity and reduce stress by 12%',
    });

    return suggestions.slice(0, 5); // Return top 5 suggestions
  }

  /**
   * Optimize category structure based on usage patterns
   */
  async optimizeCategories(
    tasks: Task[],
    categories: Category[]
  ): Promise<MCPCategoryOptimization[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const optimizations: MCPCategoryOptimization[] = [];

    for (const category of categories) {
      const categoryTasks = tasks.filter(task => task.categoryId === category.id);
      const taskDistribution = categoryTasks.length;

      // Suggest optimizations based on usage patterns
      if (taskDistribution === 0) {
        optimizations.push({
          categoryId: category.id,
          suggestedName: category.name,
          suggestedColor: '#9E9E9E',
          reasoning: 'Consider removing this unused category to reduce clutter',
          taskDistribution,
        });
      } else if (taskDistribution > 20) {
        optimizations.push({
          categoryId: category.id,
          suggestedName: category.name,
          suggestedColor: '#2196F3',
          reasoning: 'High-usage category - consider creating subcategories for better organization',
          taskDistribution,
        });
      }
    }

    return optimizations;
  }

  /**
   * Predict task completion time based on historical data
   */
  async predictTaskDuration(
    taskTitle: string,
    taskDescription: string,
    category: string,
    priority: TaskPriority,
    historicalTasks: Task[]
  ): Promise<number> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Analyze similar tasks
    const similarTasks = historicalTasks.filter(task => 
      task.status === 'completed' &&
      task.categoryId === category &&
      task.priority === priority
    );

    if (similarTasks.length === 0) {
      // Default estimates based on priority
      const defaultDurations = {
        high: 120, // 2 hours
        medium: 60, // 1 hour
        low: 30, // 30 minutes
      };
      return defaultDurations[priority];
    }

    // Calculate average duration of similar tasks
    const totalDuration = similarTasks.reduce((acc, task) => {
      if (task.createdAt && task.updatedAt) {
        const duration = new Date(task.updatedAt).getTime() - new Date(task.createdAt).getTime();
        return acc + duration;
      }
      return acc;
    }, 0);

    const averageDuration = totalDuration / similarTasks.length / (1000 * 60); // Convert to minutes
    return Math.round(averageDuration);
  }

  /**
   * Generate smart reminders based on user behavior
   */
  async generateSmartReminders(tasks: Task[]): Promise<string[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const reminders: string[] = [];
    const now = new Date();

    // Check for overdue tasks
    const overdueTasks = tasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate) < now && 
      task.status !== 'completed'
    );

    if (overdueTasks.length > 0) {
      reminders.push(`You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}. Consider reviewing priorities.`);
    }

    // Check for tasks due today
    const todayTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate.toDateString() === now.toDateString() && task.status !== 'completed';
    });

    if (todayTasks.length > 0) {
      reminders.push(`${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} due today. Stay focused!`);
    }

    // Check for long-running tasks
    const longRunningTasks = tasks.filter(task => {
      if (!task.createdAt || task.status === 'completed') return false;
      const daysSinceCreated = (now.getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreated > 7;
    });

    if (longRunningTasks.length > 0) {
      reminders.push(`${longRunningTasks.length} task${longRunningTasks.length > 1 ? 's have' : ' has'} been pending for over a week. Consider breaking them down.`);
    }

    return reminders;
  }

  /**
   * Advanced AI features for enhanced productivity
   */
  async generateWorkflowOptimizations(tasks: Task[], categories: Category[]): Promise<{
    timeBlocking: string[];
    energyOptimization: string[];
    contextSwitching: string[];
    batchingOpportunities: string[];
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Analyze task patterns for workflow optimization
    const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'completed');
    const categoryGroups = this.groupTasksByCategory(tasks, categories);
    
    return {
      timeBlocking: [
        'Block 2-3 hours in the morning for high-priority tasks when your energy is highest',
        'Schedule similar tasks together to maintain focus and reduce context switching',
        'Reserve afternoons for administrative and low-priority tasks',
      ],
      energyOptimization: [
        `You have ${highPriorityTasks.length} high-priority tasks - tackle these during your peak energy hours`,
        'Take breaks every 90 minutes to maintain cognitive performance',
        'Consider your natural energy rhythms when scheduling demanding tasks',
      ],
      contextSwitching: [
        'Group similar tasks by category to reduce mental overhead',
        'Complete all tasks in one category before moving to another',
        'Use transition rituals between different types of work',
      ],
      batchingOpportunities: this.identifyBatchingOpportunities(categoryGroups),
    };
  }

  /**
   * Smart scheduling suggestions based on task analysis
   */
  async generateSmartSchedule(tasks: Task[], timePreferences?: {
    workStartTime: number;
    workEndTime: number;
    breakDuration: number;
    focusSessionLength: number;
  }): Promise<{
    morningTasks: Task[];
    afternoonTasks: Task[];
    eveningTasks: Task[];
    schedulingTips: string[];
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const pendingTasks = tasks.filter(t => t.status !== 'completed');
    const highPriorityTasks = pendingTasks.filter(t => t.priority === 'high');
    const mediumPriorityTasks = pendingTasks.filter(t => t.priority === 'medium');
    const lowPriorityTasks = pendingTasks.filter(t => t.priority === 'low');

    return {
      morningTasks: [...highPriorityTasks.slice(0, 3), ...mediumPriorityTasks.slice(0, 2)],
      afternoonTasks: [...mediumPriorityTasks.slice(2), ...lowPriorityTasks.slice(0, 3)],
      eveningTasks: [...lowPriorityTasks.slice(3)],
      schedulingTips: [
        'Start with your most important task (eat the frog)',
        'Schedule demanding tasks when your energy is highest',
        'Leave buffer time between tasks for unexpected delays',
        'Group similar tasks to maintain momentum',
      ],
    };
  }

  /**
   * Analyze task completion patterns for insights
   */
  async analyzeCompletionPatterns(tasks: Task[]): Promise<{
    bestCompletionDays: string[];
    averageCompletionTime: { [priority: string]: number };
    procrastinationPatterns: string[];
    motivationTriggers: string[];
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const completedTasks = tasks.filter(t => t.status === 'completed' && t.completedAt);
    
    // Analyze completion days
    const dayCompletions: { [day: string]: number } = {};
    completedTasks.forEach(task => {
      if (task.completedAt) {
        const day = new Date(task.completedAt).toLocaleDateString('en-US', { weekday: 'long' });
        dayCompletions[day] = (dayCompletions[day] || 0) + 1;
      }
    });

    const bestDays = Object.entries(dayCompletions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([day]) => day);

    // Analyze completion times by priority
    const completionTimes: { [priority: string]: number[] } = {
      high: [],
      medium: [],
      low: [],
    };

    completedTasks.forEach(task => {
      if (task.completedAt && task.createdAt) {
        const duration = new Date(task.completedAt).getTime() - new Date(task.createdAt).getTime();
        const hours = duration / (1000 * 60 * 60);
        completionTimes[task.priority].push(hours);
      }
    });

    const averageCompletionTime: { [priority: string]: number } = {};
    Object.entries(completionTimes).forEach(([priority, times]) => {
      if (times.length > 0) {
        averageCompletionTime[priority] = times.reduce((a, b) => a + b, 0) / times.length;
      }
    });

    return {
      bestCompletionDays: bestDays,
      averageCompletionTime,
      procrastinationPatterns: this.identifyProcrastinationPatterns(tasks),
      motivationTriggers: this.identifyMotivationTriggers(tasks),
    };
  }

  private groupTasksByCategory(tasks: Task[], categories: Category[]): { [categoryId: string]: Task[] } {
    const groups: { [categoryId: string]: Task[] } = {};
    
    tasks.forEach(task => {
      const categoryId = task.categoryId || 'uncategorized';
      if (!groups[categoryId]) {
        groups[categoryId] = [];
      }
      groups[categoryId].push(task);
    });

    return groups;
  }

  private identifyBatchingOpportunities(categoryGroups: { [categoryId: string]: Task[] }): string[] {
    const opportunities: string[] = [];
    
    Object.entries(categoryGroups).forEach(([categoryId, tasks]) => {
      if (tasks.length >= 3) {
        opportunities.push(`Batch ${tasks.length} tasks in the same category for efficiency`);
      }
    });

    if (opportunities.length === 0) {
      opportunities.push('Consider grouping similar tasks together when you have more tasks');
    }

    return opportunities;
  }

  private identifyProcrastinationPatterns(tasks: Task[]): string[] {
    const patterns: string[] = [];
    const now = new Date();
    
    // Find tasks that took much longer than expected
    const delayedTasks = tasks.filter(task => {
      if (!task.dueDate || !task.completedAt) return false;
      const dueDate = new Date(task.dueDate);
      const completedDate = new Date(task.completedAt);
      return completedDate > dueDate;
    });

    if (delayedTasks.length > 0) {
      patterns.push(`${delayedTasks.length} tasks were completed after their due date`);
    }

    // Find tasks that have been pending for a long time
    const staleTasks = tasks.filter(task => {
      if (task.status === 'completed' || !task.createdAt) return false;
      const daysSinceCreated = (now.getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreated > 14;
    });

    if (staleTasks.length > 0) {
      patterns.push(`${staleTasks.length} tasks have been pending for over 2 weeks`);
    }

    return patterns;
  }

  private identifyMotivationTriggers(tasks: Task[]): string[] {
    const triggers: string[] = [];
    
    // Analyze what leads to task completion
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const highPriorityCompleted = completedTasks.filter(t => t.priority === 'high').length;
    const totalHighPriority = tasks.filter(t => t.priority === 'high').length;
    
    if (totalHighPriority > 0) {
      const highPriorityRate = (highPriorityCompleted / totalHighPriority) * 100;
      if (highPriorityRate > 70) {
        triggers.push('You respond well to high-priority deadlines');
      }
    }

    // Default motivational triggers
    triggers.push('Break large tasks into smaller, manageable steps');
    triggers.push('Set specific deadlines to create urgency');
    triggers.push('Reward yourself after completing important tasks');

    return triggers;
  }

  private analyzeMostProductiveTime(completedTasks: Task[]): string {
    const hourCounts: { [hour: number]: number } = {};

    completedTasks.forEach(task => {
      if (task.updatedAt) {
        const hour = new Date(task.updatedAt).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    const mostProductiveHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    if (!mostProductiveHour) return 'Not enough data';

    const hour = parseInt(mostProductiveHour);
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
  }

  private analyzeUserPatterns(tasks: Task[]): {
    workTasks: number;
    personalTasks: number;
    averageCompletionTime: number;
    preferredPriority: TaskPriority;
  } {
    const workKeywords = ['work', 'meeting', 'project', 'deadline', 'client', 'team'];
    const personalKeywords = ['personal', 'home', 'family', 'hobby', 'health'];

    let workTasks = 0;
    let personalTasks = 0;
    const priorityCounts: { [key in TaskPriority]: number } = { high: 0, medium: 0, low: 0 };

    tasks.forEach(task => {
      const text = `${task.title} ${task.description}`.toLowerCase();
      
      if (workKeywords.some(keyword => text.includes(keyword))) {
        workTasks++;
      } else if (personalKeywords.some(keyword => text.includes(keyword))) {
        personalTasks++;
      }

      priorityCounts[task.priority]++;
    });

    const preferredPriority = Object.entries(priorityCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] as TaskPriority || 'medium';

    return {
      workTasks,
      personalTasks,
      averageCompletionTime: 0, // Calculate if needed
      preferredPriority,
    };
  }

  private async generateProductivitySuggestions(tasks: Task[], categories: Category[]): Promise<string[]> {
    const suggestions: string[] = [];

    // Analyze completion patterns
    const completionRate = tasks.filter(t => t.status === 'completed').length / tasks.length;
    
    if (completionRate < 0.5) {
      suggestions.push('Consider breaking large tasks into smaller, manageable subtasks');
      suggestions.push('Set specific time blocks for focused work sessions');
    }

    if (completionRate > 0.8) {
      suggestions.push('Great job! Consider taking on more challenging tasks');
      suggestions.push('Share your productivity strategies with others');
    }

    // Analyze category distribution
    const categoryUsage = categories.map(cat => ({
      category: cat,
      taskCount: tasks.filter(t => t.categoryId === cat.id).length,
    }));

    const mostUsedCategory = categoryUsage.sort((a, b) => b.taskCount - a.taskCount)[0];
    if (mostUsedCategory && mostUsedCategory.taskCount > tasks.length * 0.6) {
      suggestions.push(`Consider creating subcategories within "${mostUsedCategory.category.name}" for better organization`);
    }

    return suggestions;
  }

  private async generateInsights(tasks: Task[], categories: Category[]): Promise<string[]> {
    const insights: string[] = [];

    // Time-based insights
    const now = new Date();
    const thisWeekTasks = tasks.filter(task => {
      if (!task.createdAt) return false;
      const taskDate = new Date(task.createdAt);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return taskDate >= weekAgo;
    });

    insights.push(`You created ${thisWeekTasks.length} tasks this week`);

    // Priority insights
    const highPriorityTasks = tasks.filter(t => t.priority === 'high');
    const completedHighPriority = highPriorityTasks.filter(t => t.status === 'completed');
    
    if (highPriorityTasks.length > 0) {
      const highPriorityCompletionRate = (completedHighPriority.length / highPriorityTasks.length) * 100;
      insights.push(`${highPriorityCompletionRate.toFixed(0)}% of your high-priority tasks are completed`);
    }

    // Category insights
    if (categories.length > 0) {
      const activeCategoriesCount = categories.filter(cat => 
        tasks.some(task => task.categoryId === cat.id)
      ).length;
      insights.push(`You're actively using ${activeCategoriesCount} out of ${categories.length} categories`);
    }

    return insights;
  }
}

export default MCPService.getInstance();
