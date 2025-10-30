/**
 * Advanced Material Design 3.0 Widget System
 * Implements sophisticated home screen widgets with dynamic content,
 * interactive elements, and intelligent updates
 */

import { Platform, Dimensions } from 'react-native';
import { Task, Category } from '../types';

export interface WidgetConfiguration {
  id: string;
  type: 'task_list' | 'progress_ring' | 'quick_add' | 'analytics' | 'calendar';
  size: 'small' | 'medium' | 'large' | 'extra_large';
  theme: 'light' | 'dark' | 'auto';
  refreshInterval: number; // minutes
  showCompleted: boolean;
  maxItems: number;
  categoryFilter?: string;
  priorityFilter?: 'high' | 'medium' | 'low';
}

export interface WidgetData {
  id: string;
  title: string;
  content: any;
  lastUpdated: number;
  nextUpdate: number;
}

export interface WidgetLayout {
  width: number;
  height: number;
  columns: number;
  rows: number;
  padding: number;
  cornerRadius: number;
}

/**
 * Material Design 3.0 Widget Manager
 */
export class MaterialWidgetManager {
  private static instance: MaterialWidgetManager;
  private widgets: Map<string, WidgetConfiguration> = new Map();
  private widgetData: Map<string, WidgetData> = new Map();
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): MaterialWidgetManager {
    if (!MaterialWidgetManager.instance) {
      MaterialWidgetManager.instance = new MaterialWidgetManager();
    }
    return MaterialWidgetManager.instance;
  }

  /**
   * Initialize widget system
   */
  async initialize(): Promise<void> {
    console.log('🎛️ Initializing Material Widget System...');
    
    // Check widget support
    if (!this.isWidgetSupported()) {
      console.warn('⚠️ Widgets not supported on this platform');
      return;
    }
    
    // Load existing widget configurations
    await this.loadWidgetConfigurations();
    
    // Setup automatic updates
    this.setupAutomaticUpdates();
    
    console.log('✅ Material Widget System initialized');
  }

  /**
   * Create a new widget
   */
  async createWidget(config: WidgetConfiguration): Promise<string> {
    const widgetId = this.generateWidgetId();
    const fullConfig = {
      ...config,
      id: widgetId,
    };
    
    this.widgets.set(widgetId, fullConfig);
    
    // Generate initial widget data
    const initialData = await this.generateWidgetData(fullConfig);
    this.widgetData.set(widgetId, initialData);
    
    // Setup update interval
    this.setupWidgetUpdates(widgetId, fullConfig.refreshInterval);
    
    // Register with system (Android)
    if (Platform.OS === 'android') {
      await this.registerAndroidWidget(fullConfig);
    }
    
    console.log(`🎛️ Created ${config.type} widget:`, widgetId);
    return widgetId;
  }

  /**
   * Update widget configuration
   */
  async updateWidget(widgetId: string, updates: Partial<WidgetConfiguration>): Promise<void> {
    const existing = this.widgets.get(widgetId);
    if (!existing) {
      throw new Error(`Widget ${widgetId} not found`);
    }
    
    const updated = { ...existing, ...updates };
    this.widgets.set(widgetId, updated);
    
    // Regenerate widget data
    const newData = await this.generateWidgetData(updated);
    this.widgetData.set(widgetId, newData);
    
    // Update system widget
    await this.updateSystemWidget(widgetId, newData);
    
    console.log(`🔄 Updated widget:`, widgetId);
  }

  /**
   * Delete widget
   */
  async deleteWidget(widgetId: string): Promise<void> {
    // Clear update interval
    const interval = this.updateIntervals.get(widgetId);
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(widgetId);
    }
    
    // Remove from maps
    this.widgets.delete(widgetId);
    this.widgetData.delete(widgetId);
    
    // Unregister from system
    if (Platform.OS === 'android') {
      await this.unregisterAndroidWidget(widgetId);
    }
    
    console.log(`🗑️ Deleted widget:`, widgetId);
  }

  /**
   * Get widget layout for size
   */
  getWidgetLayout(size: WidgetConfiguration['size']): WidgetLayout {
    const { width: screenWidth } = Dimensions.get('screen');
    const baseWidth = screenWidth / 4; // Assuming 4-column grid
    
    switch (size) {
      case 'small':
        return {
          width: baseWidth,
          height: baseWidth,
          columns: 1,
          rows: 1,
          padding: 16,
          cornerRadius: 16,
        };
      case 'medium':
        return {
          width: baseWidth * 2,
          height: baseWidth,
          columns: 2,
          rows: 1,
          padding: 16,
          cornerRadius: 20,
        };
      case 'large':
        return {
          width: baseWidth * 2,
          height: baseWidth * 2,
          columns: 2,
          rows: 2,
          padding: 20,
          cornerRadius: 24,
        };
      case 'extra_large':
        return {
          width: baseWidth * 4,
          height: baseWidth * 2,
          columns: 4,
          rows: 2,
          padding: 24,
          cornerRadius: 28,
        };
    }
  }

  /**
   * Generate widget data based on configuration
   */
  async generateWidgetData(config: WidgetConfiguration): Promise<WidgetData> {
    const now = Date.now();
    
    switch (config.type) {
      case 'task_list':
        return await this.generateTaskListData(config);
      case 'progress_ring':
        return await this.generateProgressRingData(config);
      case 'quick_add':
        return await this.generateQuickAddData(config);
      case 'analytics':
        return await this.generateAnalyticsData(config);
      case 'calendar':
        return await this.generateCalendarData(config);
      default:
        throw new Error(`Unknown widget type: ${config.type}`);
    }
  }

  /**
   * Get all widgets
   */
  getAllWidgets(): WidgetConfiguration[] {
    return Array.from(this.widgets.values());
  }

  /**
   * Get widget data
   */
  getWidgetData(widgetId: string): WidgetData | null {
    return this.widgetData.get(widgetId) || null;
  }

  /**
   * Force update all widgets
   */
  async updateAllWidgets(): Promise<void> {
    console.log('🔄 Updating all widgets...');
    
    for (const [widgetId, config] of this.widgets) {
      try {
        const newData = await this.generateWidgetData(config);
        this.widgetData.set(widgetId, newData);
        await this.updateSystemWidget(widgetId, newData);
      } catch (error) {
        console.error(`Failed to update widget ${widgetId}:`, error);
      }
    }
    
    console.log('✅ All widgets updated');
  }

  private async generateTaskListData(config: WidgetConfiguration): Promise<WidgetData> {
    // Simulate getting tasks from storage
    const tasks = await this.getTasksForWidget(config);
    
    return {
      id: config.id,
      title: 'My Tasks',
      content: {
        tasks: tasks.slice(0, config.maxItems),
        totalCount: tasks.length,
        completedToday: tasks.filter(t => this.isCompletedToday(t)).length,
      },
      lastUpdated: Date.now(),
      nextUpdate: Date.now() + (config.refreshInterval * 60 * 1000),
    };
  }

  private async generateProgressRingData(config: WidgetConfiguration): Promise<WidgetData> {
    const tasks = await this.getTasksForWidget(config);
    const completed = tasks.filter(t => t.status === 'completed').length;
    const total = tasks.length;
    const progress = total > 0 ? completed / total : 0;
    
    return {
      id: config.id,
      title: 'Progress',
      content: {
        progress,
        completed,
        total,
        percentage: Math.round(progress * 100),
        streak: await this.calculateStreak(),
      },
      lastUpdated: Date.now(),
      nextUpdate: Date.now() + (config.refreshInterval * 60 * 1000),
    };
  }

  private async generateQuickAddData(config: WidgetConfiguration): Promise<WidgetData> {
    return {
      id: config.id,
      title: 'Quick Add',
      content: {
        suggestions: [
          'Buy groceries',
          'Call dentist',
          'Review project',
          'Exercise',
          'Read book',
        ],
        recentCategories: await this.getRecentCategories(),
      },
      lastUpdated: Date.now(),
      nextUpdate: Date.now() + (config.refreshInterval * 60 * 1000),
    };
  }

  private async generateAnalyticsData(config: WidgetConfiguration): Promise<WidgetData> {
    const tasks = await this.getTasksForWidget(config);
    const thisWeek = this.getThisWeekTasks(tasks);
    const lastWeek = this.getLastWeekTasks(tasks);
    
    return {
      id: config.id,
      title: 'Analytics',
      content: {
        thisWeekCompleted: thisWeek.filter(t => t.status === 'completed').length,
        lastWeekCompleted: lastWeek.filter(t => t.status === 'completed').length,
        trend: this.calculateTrend(thisWeek, lastWeek),
        mostProductiveDay: await this.getMostProductiveDay(),
        averageCompletionTime: await this.getAverageCompletionTime(),
      },
      lastUpdated: Date.now(),
      nextUpdate: Date.now() + (config.refreshInterval * 60 * 1000),
    };
  }

  private async generateCalendarData(config: WidgetConfiguration): Promise<WidgetData> {
    const tasks = await this.getTasksForWidget(config);
    const today = new Date();
    const upcomingTasks = tasks.filter(t => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate >= today && dueDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    });
    
    return {
      id: config.id,
      title: 'Calendar',
      content: {
        today: tasks.filter(t => this.isDueToday(t)),
        tomorrow: tasks.filter(t => this.isDueTomorrow(t)),
        thisWeek: upcomingTasks,
        overdue: tasks.filter(t => this.isOverdue(t)),
      },
      lastUpdated: Date.now(),
      nextUpdate: Date.now() + (config.refreshInterval * 60 * 1000),
    };
  }

  private async getTasksForWidget(config: WidgetConfiguration): Promise<Task[]> {
    // In a real implementation, this would fetch from your data store
    // For now, return mock data
    return [
      {
        id: '1',
        title: 'Complete project proposal',
        description: 'Finish the Q4 project proposal',
        status: 'in_progress' as const,
        priority: 'high' as const,
        categoryId: 'work',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        id: '2',
        title: 'Buy groceries',
        description: 'Weekly grocery shopping',
        status: 'todo' as const,
        priority: 'medium' as const,
        categoryId: 'personal',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        id: '3',
        title: 'Exercise',
        description: '30 minutes cardio',
        status: 'completed' as const,
        priority: 'low' as const,
        categoryId: 'health',
        dueDate: new Date(),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        completedAt: new Date(),
      },
    ];
  }

  private isWidgetSupported(): boolean {
    return Platform.OS === 'android' && Platform.Version >= 25;
  }

  private generateWidgetId(): string {
    return `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupWidgetUpdates(widgetId: string, intervalMinutes: number): void {
    const interval = setInterval(async () => {
      const config = this.widgets.get(widgetId);
      if (config) {
        try {
          const newData = await this.generateWidgetData(config);
          this.widgetData.set(widgetId, newData);
          await this.updateSystemWidget(widgetId, newData);
        } catch (error) {
          console.error(`Failed to update widget ${widgetId}:`, error);
        }
      }
    }, intervalMinutes * 60 * 1000);
    
    this.updateIntervals.set(widgetId, interval);
  }

  private setupAutomaticUpdates(): void {
    // Update all widgets every hour
    setInterval(() => {
      this.updateAllWidgets();
    }, 60 * 60 * 1000);
  }

  private async registerAndroidWidget(config: WidgetConfiguration): Promise<void> {
    // In a real implementation, this would use native modules to register the widget
    console.log(`📱 Registering Android widget: ${config.type}`);
  }

  private async unregisterAndroidWidget(widgetId: string): Promise<void> {
    // In a real implementation, this would use native modules to unregister the widget
    console.log(`📱 Unregistering Android widget: ${widgetId}`);
  }

  private async updateSystemWidget(widgetId: string, data: WidgetData): Promise<void> {
    // In a real implementation, this would update the actual system widget
    console.log(`🔄 Updating system widget ${widgetId} with data:`, data.title);
  }

  private async loadWidgetConfigurations(): Promise<void> {
    // In a real implementation, this would load from persistent storage
    console.log('📂 Loading widget configurations...');
  }

  private isCompletedToday(task: Task): boolean {
    if (!task.completedAt) return false;
    const today = new Date();
    const completed = new Date(task.completedAt);
    return completed.toDateString() === today.toDateString();
  }

  private isDueToday(task: Task): boolean {
    if (!task.dueDate) return false;
    const today = new Date();
    const due = new Date(task.dueDate);
    return due.toDateString() === today.toDateString();
  }

  private isDueTomorrow(task: Task): boolean {
    if (!task.dueDate) return false;
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const due = new Date(task.dueDate);
    return due.toDateString() === tomorrow.toDateString();
  }

  private isOverdue(task: Task): boolean {
    if (!task.dueDate || task.status === 'completed') return false;
    return new Date(task.dueDate) < new Date();
  }

  private async calculateStreak(): Promise<number> {
    // Calculate consecutive days with completed tasks
    return 5; // Mock value
  }

  private async getRecentCategories(): Promise<string[]> {
    return ['Work', 'Personal', 'Health', 'Shopping'];
  }

  private getThisWeekTasks(tasks: Task[]): Task[] {
    const now = new Date();
    const weekStart = new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000));
    return tasks.filter(t => new Date(t.createdAt) >= weekStart);
  }

  private getLastWeekTasks(tasks: Task[]): Task[] {
    const now = new Date();
    const lastWeekStart = new Date(now.getTime() - ((now.getDay() + 7) * 24 * 60 * 60 * 1000));
    const lastWeekEnd = new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000));
    return tasks.filter(t => {
      const created = new Date(t.createdAt);
      return created >= lastWeekStart && created < lastWeekEnd;
    });
  }

  private calculateTrend(thisWeek: Task[], lastWeek: Task[]): 'up' | 'down' | 'stable' {
    const thisWeekCompleted = thisWeek.filter(t => t.status === 'completed').length;
    const lastWeekCompleted = lastWeek.filter(t => t.status === 'completed').length;
    
    if (thisWeekCompleted > lastWeekCompleted) return 'up';
    if (thisWeekCompleted < lastWeekCompleted) return 'down';
    return 'stable';
  }

  private async getMostProductiveDay(): Promise<string> {
    return 'Tuesday'; // Mock value
  }

  private async getAverageCompletionTime(): Promise<number> {
    return 2.5; // Mock value in hours
  }
}

/**
 * Widget Theme Generator
 */
export class WidgetThemeGenerator {
  /**
   * Generate Material Design 3.0 widget theme
   */
  static generateWidgetTheme(
    baseTheme: 'light' | 'dark',
    accentColor: string
  ): {
    background: string;
    surface: string;
    primary: string;
    onPrimary: string;
    secondary: string;
    onSecondary: string;
    text: string;
    textSecondary: string;
    border: string;
    shadow: string;
  } {
    if (baseTheme === 'dark') {
      return {
        background: '#1C1B1F',
        surface: '#2B2930',
        primary: accentColor,
        onPrimary: '#FFFFFF',
        secondary: '#CCC2DC',
        onSecondary: '#332D41',
        text: '#E6E1E5',
        textSecondary: '#CAC4D0',
        border: '#49454F',
        shadow: '#000000',
      };
    } else {
      return {
        background: '#FFFBFE',
        surface: '#F7F2FA',
        primary: accentColor,
        onPrimary: '#FFFFFF',
        secondary: '#625B71',
        onSecondary: '#FFFFFF',
        text: '#1C1B1F',
        textSecondary: '#49454F',
        border: '#CAC4D0',
        shadow: '#000000',
      };
    }
  }

  /**
   * Generate widget-specific styling
   */
  static generateWidgetStyles(
    type: WidgetConfiguration['type'],
    size: WidgetConfiguration['size'],
    theme: ReturnType<typeof WidgetThemeGenerator.generateWidgetTheme>
  ): any {
    const layout = MaterialWidgetManager.getInstance().getWidgetLayout(size);
    
    const baseStyles = {
      container: {
        width: layout.width,
        height: layout.height,
        backgroundColor: theme.surface,
        borderRadius: layout.cornerRadius,
        padding: layout.padding,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      },
      title: {
        fontSize: size === 'small' ? 14 : size === 'medium' ? 16 : 18,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 8,
      },
      content: {
        flex: 1,
      },
    };

    // Type-specific styles
    switch (type) {
      case 'task_list':
        return {
          ...baseStyles,
          taskItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 4,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          },
          taskText: {
            flex: 1,
            fontSize: 12,
            color: theme.text,
          },
          taskCheckbox: {
            width: 16,
            height: 16,
            borderRadius: 8,
            borderWidth: 2,
            borderColor: theme.primary,
            marginRight: 8,
          },
        };
      
      case 'progress_ring':
        return {
          ...baseStyles,
          progressContainer: {
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
          },
          progressText: {
            fontSize: size === 'small' ? 20 : 24,
            fontWeight: 'bold',
            color: theme.primary,
          },
          progressSubtext: {
            fontSize: 12,
            color: theme.textSecondary,
          },
        };
      
      default:
        return baseStyles;
    }
  }
}

export default MaterialWidgetManager.getInstance();
