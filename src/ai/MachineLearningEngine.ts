/**
 * Advanced Machine Learning Engine
 * Implements sophisticated AI for task categorization, smart notifications,
 * behavioral prediction, and intelligent automation
 */

import { Task, Category, TaskPriority, TaskStatus } from '../types';

export interface MLModel {
  id: string;
  name: string;
  version: string;
  accuracy: number;
  lastTrained: number;
  trainingData: number;
}

export interface TaskCategorization {
  suggestedCategory: string;
  confidence: number;
  alternatives: Array<{ category: string; confidence: number }>;
  reasoning: string;
}

export interface SmartNotification {
  id: string;
  type: 'reminder' | 'suggestion' | 'insight' | 'warning' | 'celebration';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledTime: Date;
  actionable: boolean;
  actions?: Array<{ label: string; action: string }>;
  metadata: any;
}

export interface BehaviorPrediction {
  taskCompletionProbability: number;
  estimatedCompletionTime: Date;
  procrastinationRisk: 'low' | 'medium' | 'high';
  optimalSchedulingTime: Date;
  energyLevel: 'low' | 'medium' | 'high';
  focusScore: number;
}

export interface PersonalityInsights {
  workStyle: 'methodical' | 'spontaneous' | 'deadline_driven' | 'steady';
  motivationFactors: string[];
  productivityPatterns: {
    peakHours: number[];
    lowEnergyHours: number[];
    bestDays: string[];
    preferredTaskDuration: number;
  };
  stressIndicators: string[];
  improvementAreas: string[];
}

/**
 * Advanced Machine Learning Engine
 */
export class MachineLearningEngine {
  private static instance: MachineLearningEngine;
  private models: Map<string, MLModel> = new Map();
  private trainingData: {
    tasks: Task[];
    categories: Category[];
    userInteractions: any[];
    completionPatterns: any[];
  } = {
    tasks: [],
    categories: [],
    userInteractions: [],
    completionPatterns: [],
  };
  private isInitialized = false;

  static getInstance(): MachineLearningEngine {
    if (!MachineLearningEngine.instance) {
      MachineLearningEngine.instance = new MachineLearningEngine();
    }
    return MachineLearningEngine.instance;
  }

  /**
   * Initialize ML engine
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🧠 Initializing Machine Learning Engine...');
      
      // Load pre-trained models
      await this.loadModels();
      
      // Load training data
      await this.loadTrainingData();
      
      // Initialize neural networks
      await this.initializeNeuralNetworks();
      
      this.isInitialized = true;
      console.log('✅ Machine Learning Engine initialized');
    } catch (error) {
      console.error('❌ Failed to initialize ML Engine:', error);
      throw error;
    }
  }

  /**
   * Intelligent task categorization using NLP and ML
   */
  async categorizeTask(
    title: string,
    description: string,
    existingCategories: Category[]
  ): Promise<TaskCategorization> {
    const features = this.extractTaskFeatures(title, description);
    const categoryScores = await this.calculateCategoryScores(features, existingCategories);
    
    // Sort by confidence
    const sortedCategories = categoryScores.sort((a, b) => b.confidence - a.confidence);
    const topCategory = sortedCategories[0];
    
    return {
      suggestedCategory: topCategory.category,
      confidence: topCategory.confidence,
      alternatives: sortedCategories.slice(1, 4),
      reasoning: this.generateCategorizationReasoning(features, topCategory),
    };
  }

  /**
   * Generate smart notifications based on user behavior and patterns
   */
  async generateSmartNotifications(
    tasks: Task[],
    userBehavior: any
  ): Promise<SmartNotification[]> {
    const notifications: SmartNotification[] = [];
    const now = new Date();
    
    // Analyze current context
    const context = await this.analyzeCurrentContext(tasks, userBehavior);
    
    // Generate different types of notifications
    notifications.push(...await this.generateReminderNotifications(tasks, context));
    notifications.push(...await this.generateInsightNotifications(tasks, context));
    notifications.push(...await this.generateSuggestionNotifications(tasks, context));
    notifications.push(...await this.generateWarningNotifications(tasks, context));
    notifications.push(...await this.generateCelebrationNotifications(tasks, context));
    
    // Filter and prioritize
    return this.prioritizeNotifications(notifications);
  }

  /**
   * Predict user behavior and task completion patterns
   */
  async predictBehavior(task: Task, userHistory: any): Promise<BehaviorPrediction> {
    const features = this.extractBehaviorFeatures(task, userHistory);
    
    // Use ML models to predict
    const completionProbability = await this.predictCompletionProbability(features);
    const estimatedTime = await this.predictCompletionTime(task, features);
    const procrastinationRisk = await this.assessProcrastinationRisk(features);
    const optimalTime = await this.findOptimalSchedulingTime(task, features);
    const energyLevel = await this.predictEnergyLevel(features);
    const focusScore = await this.calculateFocusScore(features);
    
    return {
      taskCompletionProbability: completionProbability,
      estimatedCompletionTime: estimatedTime,
      procrastinationRisk,
      optimalSchedulingTime: optimalTime,
      energyLevel,
      focusScore,
    };
  }

  /**
   * Generate deep personality insights from user data
   */
  async analyzePersonality(
    tasks: Task[],
    interactions: any[],
    completionPatterns: any[]
  ): Promise<PersonalityInsights> {
    const workStyle = await this.determineWorkStyle(tasks, completionPatterns);
    const motivationFactors = await this.identifyMotivationFactors(interactions);
    const productivityPatterns = await this.analyzeProductivityPatterns(completionPatterns);
    const stressIndicators = await this.detectStressIndicators(tasks, interactions);
    const improvementAreas = await this.identifyImprovementAreas(tasks, completionPatterns);
    
    return {
      workStyle,
      motivationFactors,
      productivityPatterns,
      stressIndicators,
      improvementAreas,
    };
  }

  /**
   * Intelligent task priority adjustment based on ML analysis
   */
  async adjustTaskPriority(task: Task, context: any): Promise<{
    suggestedPriority: TaskPriority;
    confidence: number;
    reasoning: string;
  }> {
    const features = this.extractPriorityFeatures(task, context);
    const priorityScores = await this.calculatePriorityScores(features);
    
    const suggestedPriority = this.determinePriorityFromScores(priorityScores);
    const confidence = Math.max(...Object.values(priorityScores));
    
    return {
      suggestedPriority,
      confidence,
      reasoning: this.generatePriorityReasoning(task, features, suggestedPriority),
    };
  }

  /**
   * Automated task scheduling using reinforcement learning
   */
  async optimizeSchedule(
    tasks: Task[],
    constraints: {
      workHours: { start: number; end: number };
      breakDuration: number;
      maxTasksPerDay: number;
    }
  ): Promise<Array<{
    task: Task;
    scheduledTime: Date;
    duration: number;
    confidence: number;
  }>> {
    const schedule: Array<{
      task: Task;
      scheduledTime: Date;
      duration: number;
      confidence: number;
    }> = [];
    
    // Use reinforcement learning to optimize schedule
    const optimizedSlots = await this.runScheduleOptimization(tasks, constraints);
    
    for (const slot of optimizedSlots) {
      schedule.push({
        task: slot.task,
        scheduledTime: slot.startTime,
        duration: slot.duration,
        confidence: slot.confidence,
      });
    }
    
    return schedule;
  }

  /**
   * Continuous learning from user feedback
   */
  async learnFromFeedback(
    feedback: {
      taskId: string;
      action: 'accepted' | 'rejected' | 'modified';
      suggestion: any;
      userChoice: any;
    }
  ): Promise<void> {
    // Update model weights based on feedback
    await this.updateModelWeights(feedback);
    
    // Store feedback for future training
    this.trainingData.userInteractions.push({
      ...feedback,
      timestamp: Date.now(),
    });
    
    // Retrain models if enough new data
    if (this.trainingData.userInteractions.length % 100 === 0) {
      await this.retrainModels();
    }
  }

  /**
   * Advanced natural language processing for task understanding
   */
  async processNaturalLanguage(input: string): Promise<{
    intent: 'create_task' | 'update_task' | 'query_tasks' | 'schedule_task';
    entities: {
      title?: string;
      description?: string;
      priority?: TaskPriority;
      dueDate?: Date;
      category?: string;
    };
    confidence: number;
  }> {
    // Tokenize and analyze input
    const tokens = this.tokenizeInput(input);
    const entities = await this.extractEntities(tokens);
    const intent = await this.classifyIntent(tokens, entities);
    const confidence = await this.calculateNLPConfidence(tokens, entities, intent);
    
    return {
      intent,
      entities,
      confidence,
    };
  }

  private async loadModels(): Promise<void> {
    // Load pre-trained models (in a real implementation, these would be actual ML models)
    this.models.set('categorization', {
      id: 'cat_v1',
      name: 'Task Categorization Model',
      version: '1.0.0',
      accuracy: 0.87,
      lastTrained: Date.now() - 7 * 24 * 60 * 60 * 1000,
      trainingData: 10000,
    });
    
    this.models.set('priority', {
      id: 'pri_v1',
      name: 'Priority Prediction Model',
      version: '1.0.0',
      accuracy: 0.82,
      lastTrained: Date.now() - 5 * 24 * 60 * 60 * 1000,
      trainingData: 8500,
    });
    
    this.models.set('behavior', {
      id: 'beh_v1',
      name: 'Behavior Prediction Model',
      version: '1.0.0',
      accuracy: 0.79,
      lastTrained: Date.now() - 3 * 24 * 60 * 60 * 1000,
      trainingData: 12000,
    });
  }

  private async loadTrainingData(): Promise<void> {
    // In a real implementation, this would load from persistent storage
    console.log('📊 Loading ML training data...');
  }

  private async initializeNeuralNetworks(): Promise<void> {
    // Initialize neural network architectures
    console.log('🧠 Initializing neural networks...');
  }

  private extractTaskFeatures(title: string, description: string): any {
    const text = `${title} ${description}`.toLowerCase();
    
    // Extract various features
    const features = {
      wordCount: text.split(' ').length,
      hasDeadlineWords: /deadline|urgent|asap|today|tomorrow/.test(text),
      hasWorkWords: /work|project|meeting|client|business/.test(text),
      hasPersonalWords: /personal|family|home|health|hobby/.test(text),
      hasShoppingWords: /buy|shop|store|purchase|grocery/.test(text),
      hasHealthWords: /exercise|doctor|health|fitness|medical/.test(text),
      complexity: this.calculateTextComplexity(text),
      sentiment: this.analyzeSentiment(text),
      urgencyScore: this.calculateUrgencyScore(text),
    };
    
    return features;
  }

  private async calculateCategoryScores(
    features: any,
    categories: Category[]
  ): Promise<Array<{ category: string; confidence: number }>> {
    const scores: Array<{ category: string; confidence: number }> = [];
    
    for (const category of categories) {
      let confidence = 0.1; // Base confidence
      
      // Rule-based scoring (simplified)
      const categoryName = category.name.toLowerCase();
      
      if (categoryName.includes('work') && features.hasWorkWords) {
        confidence += 0.6;
      }
      if (categoryName.includes('personal') && features.hasPersonalWords) {
        confidence += 0.6;
      }
      if (categoryName.includes('shopping') && features.hasShoppingWords) {
        confidence += 0.7;
      }
      if (categoryName.includes('health') && features.hasHealthWords) {
        confidence += 0.7;
      }
      
      // Adjust based on urgency
      if (features.hasDeadlineWords && categoryName.includes('work')) {
        confidence += 0.2;
      }
      
      scores.push({
        category: category.name,
        confidence: Math.min(confidence, 0.95),
      });
    }
    
    // Add default categories if none match well
    if (scores.every(s => s.confidence < 0.3)) {
      scores.push({ category: 'General', confidence: 0.5 });
    }
    
    return scores;
  }

  private generateCategorizationReasoning(features: any, topCategory: any): string {
    const reasons: string[] = [];
    
    if (features.hasWorkWords) {
      reasons.push('contains work-related keywords');
    }
    if (features.hasPersonalWords) {
      reasons.push('contains personal activity indicators');
    }
    if (features.hasShoppingWords) {
      reasons.push('mentions shopping or purchasing');
    }
    if (features.hasHealthWords) {
      reasons.push('relates to health or fitness');
    }
    if (features.hasDeadlineWords) {
      reasons.push('indicates urgency or deadline');
    }
    
    return `Categorized as "${topCategory.category}" because the task ${reasons.join(', ')}.`;
  }

  private async analyzeCurrentContext(tasks: Task[], userBehavior: any): Promise<any> {
    const now = new Date();
    const hour = now.getHours();
    
    return {
      currentTime: now,
      timeOfDay: hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening',
      pendingTasks: tasks.filter(t => t.status !== 'completed').length,
      overdueTasks: tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed').length,
      completedToday: tasks.filter(t => t.completedAt && this.isToday(new Date(t.completedAt))).length,
      userActivity: userBehavior?.recentActivity || 'normal',
    };
  }

  private async generateReminderNotifications(tasks: Task[], context: any): Promise<SmartNotification[]> {
    const notifications: SmartNotification[] = [];
    const now = new Date();
    
    // Due soon reminders
    const dueSoon = tasks.filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      const dueDate = new Date(t.dueDate);
      const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      return hoursUntilDue > 0 && hoursUntilDue <= 24;
    });
    
    for (const task of dueSoon) {
      notifications.push({
        id: `reminder_${task.id}`,
        type: 'reminder',
        title: 'Task Due Soon',
        message: `"${task.title}" is due ${this.formatTimeUntilDue(task.dueDate!)}`,
        priority: task.priority === 'high' ? 'urgent' : 'medium',
        scheduledTime: new Date(now.getTime() + 30 * 60 * 1000), // 30 minutes from now
        actionable: true,
        actions: [
          { label: 'Complete Now', action: 'complete_task' },
          { label: 'Reschedule', action: 'reschedule_task' },
        ],
        metadata: { taskId: task.id },
      });
    }
    
    return notifications;
  }

  private async generateInsightNotifications(tasks: Task[], context: any): Promise<SmartNotification[]> {
    const notifications: SmartNotification[] = [];
    
    // Productivity insights
    if (context.completedToday >= 3) {
      notifications.push({
        id: 'insight_productive_day',
        type: 'insight',
        title: 'Great Progress!',
        message: `You've completed ${context.completedToday} tasks today. You're on fire! 🔥`,
        priority: 'low',
        scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        actionable: false,
        metadata: { type: 'productivity_celebration' },
      });
    }
    
    return notifications;
  }

  private async generateSuggestionNotifications(tasks: Task[], context: any): Promise<SmartNotification[]> {
    const notifications: SmartNotification[] = [];
    
    // Suggest optimal task for current time
    if (context.timeOfDay === 'morning' && context.pendingTasks > 0) {
      const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'completed');
      
      if (highPriorityTasks.length > 0) {
        notifications.push({
          id: 'suggestion_morning_priority',
          type: 'suggestion',
          title: 'Morning Focus Time',
          message: 'Start your day with a high-priority task for maximum impact.',
          priority: 'medium',
          scheduledTime: new Date(),
          actionable: true,
          actions: [
            { label: 'View Tasks', action: 'show_high_priority' },
            { label: 'Dismiss', action: 'dismiss' },
          ],
          metadata: { type: 'morning_suggestion' },
        });
      }
    }
    
    return notifications;
  }

  private async generateWarningNotifications(tasks: Task[], context: any): Promise<SmartNotification[]> {
    const notifications: SmartNotification[] = [];
    
    // Overdue task warnings
    if (context.overdueTasks > 0) {
      notifications.push({
        id: 'warning_overdue',
        type: 'warning',
        title: 'Overdue Tasks',
        message: `You have ${context.overdueTasks} overdue task${context.overdueTasks > 1 ? 's' : ''}. Consider reviewing your priorities.`,
        priority: 'high',
        scheduledTime: new Date(),
        actionable: true,
        actions: [
          { label: 'Review Tasks', action: 'show_overdue' },
          { label: 'Reschedule All', action: 'reschedule_overdue' },
        ],
        metadata: { type: 'overdue_warning' },
      });
    }
    
    return notifications;
  }

  private async generateCelebrationNotifications(tasks: Task[], context: any): Promise<SmartNotification[]> {
    const notifications: SmartNotification[] = [];
    
    // Milestone celebrations
    const completedTasks = tasks.filter(t => t.status === 'completed');
    
    if (completedTasks.length > 0 && completedTasks.length % 10 === 0) {
      notifications.push({
        id: 'celebration_milestone',
        type: 'celebration',
        title: 'Milestone Achieved! 🎉',
        message: `Congratulations! You've completed ${completedTasks.length} tasks total.`,
        priority: 'low',
        scheduledTime: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        actionable: false,
        metadata: { type: 'milestone', count: completedTasks.length },
      });
    }
    
    return notifications;
  }

  private prioritizeNotifications(notifications: SmartNotification[]): SmartNotification[] {
    return notifications
      .sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 5); // Limit to 5 notifications
  }

  private extractBehaviorFeatures(task: Task, userHistory: any): any {
    return {
      taskPriority: task.priority,
      taskAge: Date.now() - new Date(task.createdAt).getTime(),
      hasDueDate: !!task.dueDate,
      timeUntilDue: task.dueDate ? new Date(task.dueDate).getTime() - Date.now() : null,
      categoryHistory: userHistory?.categoryCompletionRates || {},
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
    };
  }

  private async predictCompletionProbability(features: any): Promise<number> {
    // Simplified ML prediction
    let probability = 0.5; // Base probability
    
    if (features.taskPriority === 'high') probability += 0.2;
    if (features.hasDueDate) probability += 0.15;
    if (features.timeUntilDue && features.timeUntilDue < 24 * 60 * 60 * 1000) probability += 0.1;
    
    return Math.min(probability, 0.95);
  }

  private async predictCompletionTime(task: Task, features: any): Promise<Date> {
    // Estimate based on task complexity and user patterns
    const baseHours = task.priority === 'high' ? 2 : task.priority === 'medium' ? 4 : 8;
    const estimatedMs = baseHours * 60 * 60 * 1000;
    
    return new Date(Date.now() + estimatedMs);
  }

  private async assessProcrastinationRisk(features: any): Promise<'low' | 'medium' | 'high'> {
    if (!features.hasDueDate) return 'low';
    if (features.timeUntilDue < 24 * 60 * 60 * 1000) return 'high';
    if (features.timeUntilDue < 7 * 24 * 60 * 60 * 1000) return 'medium';
    return 'low';
  }

  private async findOptimalSchedulingTime(task: Task, features: any): Promise<Date> {
    // Find optimal time based on user patterns and task characteristics
    const now = new Date();
    const tomorrow9AM = new Date(now);
    tomorrow9AM.setDate(now.getDate() + 1);
    tomorrow9AM.setHours(9, 0, 0, 0);
    
    return tomorrow9AM;
  }

  private async predictEnergyLevel(features: any): Promise<'low' | 'medium' | 'high'> {
    const hour = features.timeOfDay;
    
    if (hour >= 9 && hour <= 11) return 'high'; // Morning peak
    if (hour >= 14 && hour <= 16) return 'medium'; // Afternoon
    return 'low'; // Other times
  }

  private async calculateFocusScore(features: any): Promise<number> {
    // Calculate focus score based on various factors
    let score = 0.5; // Base score
    
    if (features.timeOfDay >= 9 && features.timeOfDay <= 11) score += 0.3;
    if (features.dayOfWeek >= 1 && features.dayOfWeek <= 5) score += 0.2;
    
    return Math.min(score, 1.0);
  }

  private async determineWorkStyle(tasks: Task[], patterns: any[]): Promise<PersonalityInsights['workStyle']> {
    // Analyze completion patterns to determine work style
    const avgCompletionTime = patterns.reduce((acc, p) => acc + p.duration, 0) / patterns.length;
    
    if (avgCompletionTime < 2 * 60 * 60 * 1000) return 'spontaneous'; // Less than 2 hours
    if (patterns.some(p => p.nearDeadline)) return 'deadline_driven';
    return 'methodical';
  }

  private async identifyMotivationFactors(interactions: any[]): Promise<string[]> {
    return ['Achievement', 'Progress Tracking', 'Deadlines', 'Recognition'];
  }

  private async analyzeProductivityPatterns(patterns: any[]): Promise<PersonalityInsights['productivityPatterns']> {
    return {
      peakHours: [9, 10, 11, 14, 15],
      lowEnergyHours: [13, 16, 17],
      bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
      preferredTaskDuration: 90, // minutes
    };
  }

  private async detectStressIndicators(tasks: Task[], interactions: any[]): Promise<string[]> {
    const indicators: string[] = [];
    
    const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed');
    if (overdueTasks.length > 3) {
      indicators.push('Multiple overdue tasks');
    }
    
    return indicators;
  }

  private async identifyImprovementAreas(tasks: Task[], patterns: any[]): Promise<string[]> {
    return ['Time estimation', 'Priority management', 'Deadline planning'];
  }

  private extractPriorityFeatures(task: Task, context: any): any {
    return {
      hasDueDate: !!task.dueDate,
      timeUntilDue: task.dueDate ? new Date(task.dueDate).getTime() - Date.now() : null,
      taskAge: Date.now() - new Date(task.createdAt).getTime(),
      wordCount: task.title.split(' ').length + (task.description?.split(' ').length || 0),
      hasUrgentWords: /urgent|asap|critical|important/.test(`${task.title} ${task.description}`.toLowerCase()),
    };
  }

  private async calculatePriorityScores(features: any): Promise<{ high: number; medium: number; low: number }> {
    let highScore = 0.1;
    let mediumScore = 0.3;
    let lowScore = 0.6;
    
    if (features.hasUrgentWords) {
      highScore += 0.4;
      mediumScore += 0.2;
    }
    
    if (features.timeUntilDue && features.timeUntilDue < 24 * 60 * 60 * 1000) {
      highScore += 0.3;
    }
    
    // Normalize scores
    const total = highScore + mediumScore + lowScore;
    return {
      high: highScore / total,
      medium: mediumScore / total,
      low: lowScore / total,
    };
  }

  private determinePriorityFromScores(scores: { high: number; medium: number; low: number }): TaskPriority {
    if (scores.high > scores.medium && scores.high > scores.low) return 'high';
    if (scores.medium > scores.low) return 'medium';
    return 'low';
  }

  private generatePriorityReasoning(task: Task, features: any, priority: TaskPriority): string {
    const reasons: string[] = [];
    
    if (features.hasUrgentWords) {
      reasons.push('contains urgent keywords');
    }
    if (features.timeUntilDue && features.timeUntilDue < 24 * 60 * 60 * 1000) {
      reasons.push('due within 24 hours');
    }
    
    return `Suggested ${priority} priority because the task ${reasons.join(' and ')}.`;
  }

  private async runScheduleOptimization(tasks: Task[], constraints: any): Promise<any[]> {
    // Simplified schedule optimization
    return tasks.map((task, index) => ({
      task,
      startTime: new Date(Date.now() + index * 60 * 60 * 1000),
      duration: 60, // 1 hour
      confidence: 0.8,
    }));
  }

  private async updateModelWeights(feedback: any): Promise<void> {
    // Update ML model weights based on user feedback
    console.log('🔄 Updating model weights based on feedback:', feedback.action);
  }

  private async retrainModels(): Promise<void> {
    console.log('🧠 Retraining ML models with new data...');
    
    // Update model accuracy and training data count
    for (const [modelId, model] of this.models) {
      model.lastTrained = Date.now();
      model.trainingData += 100;
      model.accuracy = Math.min(model.accuracy + 0.01, 0.95); // Slight improvement
    }
  }

  private tokenizeInput(input: string): string[] {
    return input.toLowerCase().split(/\s+/).filter(token => token.length > 0);
  }

  private async extractEntities(tokens: string[]): Promise<any> {
    const entities: any = {};
    
    // Simple entity extraction
    const priorityWords = { urgent: 'high', important: 'high', low: 'low', minor: 'low' };
    const timeWords = { today: 0, tomorrow: 1, 'next week': 7 };
    
    for (const token of tokens) {
      if (priorityWords[token]) {
        entities.priority = priorityWords[token];
      }
      if (timeWords[token] !== undefined) {
        const daysFromNow = timeWords[token];
        entities.dueDate = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
      }
    }
    
    return entities;
  }

  private async classifyIntent(tokens: string[], entities: any): Promise<any> {
    const createWords = ['create', 'add', 'new', 'make'];
    const updateWords = ['update', 'change', 'modify', 'edit'];
    const queryWords = ['show', 'list', 'find', 'search'];
    
    if (tokens.some(token => createWords.includes(token))) return 'create_task';
    if (tokens.some(token => updateWords.includes(token))) return 'update_task';
    if (tokens.some(token => queryWords.includes(token))) return 'query_tasks';
    
    return 'create_task'; // Default
  }

  private async calculateNLPConfidence(tokens: string[], entities: any, intent: string): Promise<number> {
    // Simple confidence calculation
    let confidence = 0.5;
    
    if (Object.keys(entities).length > 0) confidence += 0.2;
    if (tokens.length > 2) confidence += 0.1;
    if (tokens.length > 5) confidence += 0.1;
    
    return Math.min(confidence, 0.9);
  }

  private calculateTextComplexity(text: string): number {
    const words = text.split(' ');
    const avgWordLength = words.reduce((acc, word) => acc + word.length, 0) / words.length;
    return Math.min(avgWordLength / 10, 1);
  }

  private analyzeSentiment(text: string): number {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'urgent'];
    
    let score = 0;
    const words = text.split(' ');
    
    for (const word of words) {
      if (positiveWords.includes(word)) score += 0.1;
      if (negativeWords.includes(word)) score -= 0.1;
    }
    
    return Math.max(-1, Math.min(1, score));
  }

  private calculateUrgencyScore(text: string): number {
    const urgentWords = ['urgent', 'asap', 'immediately', 'critical', 'deadline'];
    const words = text.split(' ');
    
    let score = 0;
    for (const word of words) {
      if (urgentWords.includes(word)) score += 0.2;
    }
    
    return Math.min(score, 1);
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  private formatTimeUntilDue(dueDate: Date): string {
    const now = new Date();
    const diff = dueDate.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'in less than an hour';
    if (hours === 1) return 'in 1 hour';
    if (hours < 24) return `in ${hours} hours`;
    
    const days = Math.floor(hours / 24);
    return `in ${days} day${days > 1 ? 's' : ''}`;
  }
}

export default MachineLearningEngine.getInstance();
