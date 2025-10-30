/**
 * Advanced MCP (Model Context Protocol) Service
 * Implements cutting-edge AI features including voice commands,
 * predictive text, smart scheduling, and behavioral analysis
 */

import { Task, Category, TaskPriority, TaskStatus } from '../../types';
import MCPService from './MCPService';

export interface VoiceCommand {
  command: string;
  confidence: number;
  intent: 'create_task' | 'complete_task' | 'search_tasks' | 'set_reminder' | 'show_stats';
  parameters: { [key: string]: any };
  timestamp: number;
}

export interface PredictiveText {
  suggestions: string[];
  confidence: number[];
  context: string;
  reasoning: string;
}

export interface SmartScheduleSlot {
  startTime: Date;
  endTime: Date;
  task: Task;
  confidence: number;
  reasoning: string;
}

export interface BehaviorPattern {
  pattern: string;
  frequency: number;
  confidence: number;
  recommendation: string;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface AIPersonality {
  name: string;
  traits: string[];
  communicationStyle: 'formal' | 'casual' | 'encouraging' | 'direct';
  suggestions: string[];
}

/**
 * Advanced MCP Service with AI capabilities
 */
class AdvancedMCPService extends MCPService {
  private static advancedInstance: AdvancedMCPService;
  private voiceCommandHistory: VoiceCommand[] = [];
  private behaviorPatterns: BehaviorPattern[] = [];
  private userPersonality: AIPersonality | null = null;
  private predictiveModel: Map<string, string[]> = new Map();

  static getInstance(): AdvancedMCPService {
    if (!AdvancedMCPService.advancedInstance) {
      AdvancedMCPService.advancedInstance = new AdvancedMCPService();
    }
    return AdvancedMCPService.advancedInstance;
  }

  async initialize(): Promise<void> {
    await super.initialize();
    console.log('🧠 Initializing Advanced MCP Service...');
    
    // Initialize AI models
    await this.loadPredictiveModel();
    await this.analyzeBehaviorPatterns([]);
    await this.generateUserPersonality([]);
    
    console.log('✅ Advanced MCP Service initialized');
  }

  /**
   * Voice Command Processing
   */
  async processVoiceCommand(audioText: string): Promise<VoiceCommand> {
    const command = audioText.toLowerCase().trim();
    const timestamp = Date.now();
    
    // Intent classification
    const intent = this.classifyIntent(command);
    const parameters = this.extractParameters(command, intent);
    const confidence = this.calculateConfidence(command, intent);
    
    const voiceCommand: VoiceCommand = {
      command: audioText,
      confidence,
      intent,
      parameters,
      timestamp,
    };
    
    // Store command history
    this.voiceCommandHistory.push(voiceCommand);
    if (this.voiceCommandHistory.length > 100) {
      this.voiceCommandHistory.shift();
    }
    
    return voiceCommand;
  }

  /**
   * Execute voice command
   */
  async executeVoiceCommand(
    voiceCommand: VoiceCommand,
    tasks: Task[],
    categories: Category[]
  ): Promise<{
    success: boolean;
    result?: any;
    message: string;
    followUpSuggestions: string[];
  }> {
    try {
      switch (voiceCommand.intent) {
        case 'create_task':
          return await this.handleCreateTaskCommand(voiceCommand, categories);
        
        case 'complete_task':
          return await this.handleCompleteTaskCommand(voiceCommand, tasks);
        
        case 'search_tasks':
          return await this.handleSearchTasksCommand(voiceCommand, tasks);
        
        case 'set_reminder':
          return await this.handleSetReminderCommand(voiceCommand, tasks);
        
        case 'show_stats':
          return await this.handleShowStatsCommand(voiceCommand, tasks);
        
        default:
          return {
            success: false,
            message: "I didn't understand that command. Try saying something like 'Create a task to buy groceries' or 'Show my completed tasks'.",
            followUpSuggestions: [
              'Create a task',
              'Complete a task',
              'Show my tasks',
              'Set a reminder',
              'Show statistics',
            ],
          };
      }
    } catch (error) {
      console.error('Voice command execution failed:', error);
      return {
        success: false,
        message: 'Sorry, I encountered an error processing your command. Please try again.',
        followUpSuggestions: ['Try rephrasing your command'],
      };
    }
  }

  /**
   * Predictive Text Generation
   */
  async generatePredictiveText(
    context: string,
    currentInput: string,
    tasks: Task[],
    categories: Category[]
  ): Promise<PredictiveText> {
    const contextKey = context.toLowerCase();
    const input = currentInput.toLowerCase();
    
    // Analyze user's task history for patterns
    const taskTitles = tasks.map(t => t.title.toLowerCase());
    const taskDescriptions = tasks.map(t => t.description?.toLowerCase() || '');
    const categoryNames = categories.map(c => c.name.toLowerCase());
    
    const suggestions: string[] = [];
    const confidence: number[] = [];
    
    // Context-based suggestions
    if (contextKey.includes('title') || contextKey.includes('task')) {
      // Suggest based on common task patterns
      const commonPatterns = this.extractCommonPatterns(taskTitles);
      const matchingSuggestions = this.findMatchingSuggestions(input, commonPatterns);
      suggestions.push(...matchingSuggestions.slice(0, 3));
      confidence.push(...matchingSuggestions.map(() => 0.8));
      
      // Add AI-generated suggestions
      const aiSuggestions = await this.generateAITaskSuggestions(input, tasks);
      suggestions.push(...aiSuggestions.slice(0, 2));
      confidence.push(...aiSuggestions.map(() => 0.7));
    }
    
    if (contextKey.includes('description')) {
      // Suggest based on task descriptions
      const descriptionPatterns = this.extractCommonPatterns(taskDescriptions);
      const matchingSuggestions = this.findMatchingSuggestions(input, descriptionPatterns);
      suggestions.push(...matchingSuggestions.slice(0, 3));
      confidence.push(...matchingSuggestions.map(() => 0.75));
    }
    
    if (contextKey.includes('category')) {
      // Suggest categories
      const matchingCategories = categoryNames.filter(name => 
        name.includes(input) || input.includes(name)
      );
      suggestions.push(...matchingCategories.slice(0, 3));
      confidence.push(...matchingCategories.map(() => 0.9));
    }
    
    // Fallback to general suggestions
    if (suggestions.length === 0) {
      const generalSuggestions = this.getGeneralSuggestions(contextKey, input);
      suggestions.push(...generalSuggestions);
      confidence.push(...generalSuggestions.map(() => 0.6));
    }
    
    return {
      suggestions: suggestions.slice(0, 5),
      confidence: confidence.slice(0, 5),
      context,
      reasoning: `Generated based on your task history and common patterns`,
    };
  }

  /**
   * Smart Scheduling
   */
  async generateSmartSchedule(
    tasks: Task[],
    preferences: {
      workHours: { start: number; end: number };
      breakDuration: number;
      maxTasksPerDay: number;
      preferredTaskDuration: number;
    }
  ): Promise<SmartScheduleSlot[]> {
    const pendingTasks = tasks.filter(t => t.status !== 'completed');
    const schedule: SmartScheduleSlot[] = [];
    
    // Sort tasks by priority and due date
    const sortedTasks = pendingTasks.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityWeight[a.priority];
      const bPriority = priorityWeight[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      
      return 0;
    });
    
    // Generate schedule slots
    const now = new Date();
    let currentDate = new Date(now);
    currentDate.setHours(preferences.workHours.start, 0, 0, 0);
    
    for (const task of sortedTasks.slice(0, preferences.maxTasksPerDay * 7)) {
      // Predict task duration
      const estimatedDuration = await this.predictTaskDuration(
        task.title,
        task.description || '',
        task.categoryId || '',
        task.priority,
        tasks
      );
      
      // Find optimal time slot
      const optimalSlot = this.findOptimalTimeSlot(
        currentDate,
        estimatedDuration,
        preferences,
        schedule
      );
      
      if (optimalSlot) {
        schedule.push({
          startTime: optimalSlot.start,
          endTime: optimalSlot.end,
          task,
          confidence: optimalSlot.confidence,
          reasoning: optimalSlot.reasoning,
        });
        
        currentDate = new Date(optimalSlot.end.getTime() + preferences.breakDuration * 60000);
      }
    }
    
    return schedule;
  }

  /**
   * Behavior Pattern Analysis
   */
  async analyzeBehaviorPatterns(tasks: Task[]): Promise<BehaviorPattern[]> {
    const patterns: BehaviorPattern[] = [];
    
    if (tasks.length === 0) {
      return patterns;
    }
    
    // Analyze completion patterns
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const completionTimes = completedTasks.map(t => {
      if (t.completedAt) {
        return new Date(t.completedAt).getHours();
      }
      return null;
    }).filter(Boolean) as number[];
    
    if (completionTimes.length > 0) {
      const mostProductiveHour = this.getMostFrequent(completionTimes);
      patterns.push({
        pattern: `Most productive at ${mostProductiveHour}:00`,
        frequency: completionTimes.filter(h => h === mostProductiveHour).length,
        confidence: 0.8,
        recommendation: `Schedule important tasks around ${mostProductiveHour}:00`,
        impact: 'positive',
      });
    }
    
    // Analyze procrastination patterns
    const delayedTasks = tasks.filter(t => {
      if (!t.dueDate || !t.completedAt) return false;
      return new Date(t.completedAt) > new Date(t.dueDate);
    });
    
    if (delayedTasks.length > tasks.length * 0.3) {
      patterns.push({
        pattern: 'Tendency to delay tasks',
        frequency: delayedTasks.length,
        confidence: 0.7,
        recommendation: 'Set earlier personal deadlines and break large tasks into smaller ones',
        impact: 'negative',
      });
    }
    
    // Analyze category preferences
    const categoryFrequency = new Map<string, number>();
    tasks.forEach(t => {
      if (t.categoryId) {
        categoryFrequency.set(t.categoryId, (categoryFrequency.get(t.categoryId) || 0) + 1);
      }
    });
    
    const mostUsedCategory = Array.from(categoryFrequency.entries())
      .sort(([, a], [, b]) => b - a)[0];
    
    if (mostUsedCategory) {
      patterns.push({
        pattern: `Focuses heavily on one category`,
        frequency: mostUsedCategory[1],
        confidence: 0.6,
        recommendation: 'Consider diversifying tasks across different categories for better balance',
        impact: 'neutral',
      });
    }
    
    this.behaviorPatterns = patterns;
    return patterns;
  }

  /**
   * Generate User Personality Profile
   */
  async generateUserPersonality(tasks: Task[]): Promise<AIPersonality> {
    const traits: string[] = [];
    let communicationStyle: AIPersonality['communicationStyle'] = 'casual';
    
    if (tasks.length === 0) {
      this.userPersonality = {
        name: 'Getting Started',
        traits: ['organized', 'goal-oriented'],
        communicationStyle: 'encouraging',
        suggestions: [
          'Start by creating your first task',
          'Organize tasks into categories',
          'Set realistic deadlines',
        ],
      };
      return this.userPersonality;
    }
    
    // Analyze task completion rate
    const completionRate = tasks.filter(t => t.status === 'completed').length / tasks.length;
    
    if (completionRate > 0.8) {
      traits.push('highly productive', 'goal-oriented', 'disciplined');
      communicationStyle = 'direct';
    } else if (completionRate > 0.5) {
      traits.push('balanced', 'steady progress', 'reliable');
      communicationStyle = 'encouraging';
    } else {
      traits.push('creative', 'flexible', 'needs support');
      communicationStyle = 'encouraging';
    }
    
    // Analyze priority usage
    const highPriorityTasks = tasks.filter(t => t.priority === 'high').length;
    const totalTasks = tasks.length;
    
    if (highPriorityTasks / totalTasks > 0.5) {
      traits.push('urgency-driven', 'high-achiever');
    } else {
      traits.push('balanced prioritization', 'thoughtful planner');
    }
    
    // Analyze task complexity (based on description length)
    const avgDescriptionLength = tasks.reduce((acc, t) => 
      acc + (t.description?.length || 0), 0) / tasks.length;
    
    if (avgDescriptionLength > 100) {
      traits.push('detail-oriented', 'thorough planner');
    } else {
      traits.push('concise', 'action-oriented');
    }
    
    const personality: AIPersonality = {
      name: this.generatePersonalityName(traits),
      traits,
      communicationStyle,
      suggestions: this.generatePersonalizedSuggestions(traits, completionRate),
    };
    
    this.userPersonality = personality;
    return personality;
  }

  // Private helper methods
  private classifyIntent(command: string): VoiceCommand['intent'] {
    const createKeywords = ['create', 'add', 'new', 'make', 'task'];
    const completeKeywords = ['complete', 'done', 'finish', 'mark'];
    const searchKeywords = ['show', 'find', 'search', 'list'];
    const reminderKeywords = ['remind', 'reminder', 'alert', 'notify'];
    const statsKeywords = ['stats', 'statistics', 'progress', 'summary'];
    
    if (createKeywords.some(keyword => command.includes(keyword))) {
      return 'create_task';
    }
    if (completeKeywords.some(keyword => command.includes(keyword))) {
      return 'complete_task';
    }
    if (searchKeywords.some(keyword => command.includes(keyword))) {
      return 'search_tasks';
    }
    if (reminderKeywords.some(keyword => command.includes(keyword))) {
      return 'set_reminder';
    }
    if (statsKeywords.some(keyword => command.includes(keyword))) {
      return 'show_stats';
    }
    
    return 'create_task'; // Default fallback
  }

  private extractParameters(command: string, intent: VoiceCommand['intent']): { [key: string]: any } {
    const parameters: { [key: string]: any } = {};
    
    switch (intent) {
      case 'create_task':
        // Extract task title (everything after create/add/new)
        const titleMatch = command.match(/(?:create|add|new|make)\s+(?:task\s+)?(.+)/i);
        if (titleMatch) {
          parameters.title = titleMatch[1].trim();
        }
        
        // Extract priority
        if (command.includes('high priority') || command.includes('urgent')) {
          parameters.priority = 'high';
        } else if (command.includes('low priority')) {
          parameters.priority = 'low';
        } else {
          parameters.priority = 'medium';
        }
        break;
      
      case 'complete_task':
        // Extract task identifier
        const completeMatch = command.match(/(?:complete|done|finish)\s+(.+)/i);
        if (completeMatch) {
          parameters.taskQuery = completeMatch[1].trim();
        }
        break;
      
      case 'search_tasks':
        // Extract search query
        const searchMatch = command.match(/(?:show|find|search|list)\s+(.+)/i);
        if (searchMatch) {
          parameters.query = searchMatch[1].trim();
        }
        break;
    }
    
    return parameters;
  }

  private calculateConfidence(command: string, intent: VoiceCommand['intent']): number {
    // Simple confidence calculation based on keyword matches and command clarity
    let confidence = 0.5; // Base confidence
    
    const words = command.split(' ');
    if (words.length > 2) confidence += 0.2;
    if (words.length > 5) confidence += 0.1;
    
    // Intent-specific confidence boosts
    const intentKeywords = {
      create_task: ['create', 'add', 'new', 'task'],
      complete_task: ['complete', 'done', 'finish'],
      search_tasks: ['show', 'find', 'search'],
      set_reminder: ['remind', 'reminder'],
      show_stats: ['stats', 'statistics', 'progress'],
    };
    
    const keywords = intentKeywords[intent] || [];
    const matchCount = keywords.filter(keyword => command.includes(keyword)).length;
    confidence += (matchCount / keywords.length) * 0.3;
    
    return Math.min(confidence, 1.0);
  }

  private async handleCreateTaskCommand(
    command: VoiceCommand,
    categories: Category[]
  ): Promise<any> {
    const { title, priority } = command.parameters;
    
    if (!title) {
      return {
        success: false,
        message: "I couldn't understand what task you want to create. Please try again.",
        followUpSuggestions: ['Try saying "Create a task to..."'],
      };
    }
    
    return {
      success: true,
      result: {
        title,
        priority: priority || 'medium',
        description: '',
        status: 'todo' as TaskStatus,
      },
      message: `I'll create a ${priority || 'medium'} priority task: "${title}"`,
      followUpSuggestions: [
        'Add a description',
        'Set a due date',
        'Assign to a category',
      ],
    };
  }

  private async handleCompleteTaskCommand(
    command: VoiceCommand,
    tasks: Task[]
  ): Promise<any> {
    const { taskQuery } = command.parameters;
    
    if (!taskQuery) {
      return {
        success: false,
        message: "Which task would you like to complete?",
        followUpSuggestions: tasks.slice(0, 3).map(t => `Complete "${t.title}"`),
      };
    }
    
    // Find matching tasks
    const matchingTasks = tasks.filter(t => 
      t.title.toLowerCase().includes(taskQuery.toLowerCase()) &&
      t.status !== 'completed'
    );
    
    if (matchingTasks.length === 0) {
      return {
        success: false,
        message: `I couldn't find any incomplete tasks matching "${taskQuery}".`,
        followUpSuggestions: ['Try a different task name'],
      };
    }
    
    if (matchingTasks.length === 1) {
      return {
        success: true,
        result: { taskId: matchingTasks[0].id },
        message: `Great! I'll mark "${matchingTasks[0].title}" as completed.`,
        followUpSuggestions: ['Create another task', 'Show my progress'],
      };
    }
    
    return {
      success: false,
      message: `I found ${matchingTasks.length} tasks matching "${taskQuery}". Please be more specific.`,
      followUpSuggestions: matchingTasks.slice(0, 3).map(t => `Complete "${t.title}"`),
    };
  }

  private async handleSearchTasksCommand(
    command: VoiceCommand,
    tasks: Task[]
  ): Promise<any> {
    const { query } = command.parameters;
    
    let filteredTasks = tasks;
    let message = 'Here are your tasks:';
    
    if (query) {
      if (query.includes('completed')) {
        filteredTasks = tasks.filter(t => t.status === 'completed');
        message = 'Here are your completed tasks:';
      } else if (query.includes('pending') || query.includes('incomplete')) {
        filteredTasks = tasks.filter(t => t.status !== 'completed');
        message = 'Here are your pending tasks:';
      } else if (query.includes('high priority')) {
        filteredTasks = tasks.filter(t => t.priority === 'high');
        message = 'Here are your high priority tasks:';
      } else {
        filteredTasks = tasks.filter(t => 
          t.title.toLowerCase().includes(query.toLowerCase()) ||
          (t.description && t.description.toLowerCase().includes(query.toLowerCase()))
        );
        message = `Here are tasks matching "${query}":`;
      }
    }
    
    return {
      success: true,
      result: { tasks: filteredTasks },
      message,
      followUpSuggestions: [
        'Show completed tasks',
        'Show high priority tasks',
        'Create a new task',
      ],
    };
  }

  private async handleSetReminderCommand(
    command: VoiceCommand,
    tasks: Task[]
  ): Promise<any> {
    return {
      success: true,
      message: 'Reminder functionality is coming soon!',
      followUpSuggestions: ['Set due dates for tasks', 'Enable notifications'],
    };
  }

  private async handleShowStatsCommand(
    command: VoiceCommand,
    tasks: Task[]
  ): Promise<any> {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return {
      success: true,
      result: {
        totalTasks,
        completedTasks,
        completionRate,
      },
      message: `You have ${totalTasks} total tasks with ${completedTasks} completed (${completionRate}% completion rate).`,
      followUpSuggestions: [
        'Show detailed analytics',
        'View productivity trends',
        'Create more tasks',
      ],
    };
  }

  private async loadPredictiveModel(): Promise<void> {
    // Initialize predictive model with common task patterns
    this.predictiveModel.set('work', [
      'Review project requirements',
      'Attend team meeting',
      'Update documentation',
      'Code review',
      'Deploy to production',
    ]);
    
    this.predictiveModel.set('personal', [
      'Buy groceries',
      'Exercise for 30 minutes',
      'Call family',
      'Read a book',
      'Plan weekend activities',
    ]);
    
    this.predictiveModel.set('health', [
      'Take vitamins',
      'Drink 8 glasses of water',
      'Go for a walk',
      'Prepare healthy meal',
      'Get 8 hours of sleep',
    ]);
  }

  private extractCommonPatterns(texts: string[]): string[] {
    const wordFreq = new Map<string, number>();
    
    texts.forEach(text => {
      const words = text.split(' ').filter(word => word.length > 2);
      words.forEach(word => {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      });
    });
    
    return Array.from(wordFreq.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  private findMatchingSuggestions(input: string, patterns: string[]): string[] {
    return patterns.filter(pattern => 
      pattern.toLowerCase().includes(input) || 
      input.split(' ').some(word => pattern.toLowerCase().includes(word))
    );
  }

  private async generateAITaskSuggestions(input: string, tasks: Task[]): Promise<string[]> {
    // Simple AI suggestion based on input and task history
    const suggestions: string[] = [];
    
    if (input.includes('buy') || input.includes('shop')) {
      suggestions.push('Buy groceries', 'Buy birthday gift', 'Buy office supplies');
    } else if (input.includes('call') || input.includes('contact')) {
      suggestions.push('Call doctor', 'Call insurance company', 'Call family');
    } else if (input.includes('review') || input.includes('check')) {
      suggestions.push('Review monthly budget', 'Review project status', 'Review emails');
    } else {
      suggestions.push('Complete daily tasks', 'Plan next week', 'Organize workspace');
    }
    
    return suggestions;
  }

  private getGeneralSuggestions(context: string, input: string): string[] {
    const generalSuggestions = [
      'Complete daily tasks',
      'Review weekly goals',
      'Plan tomorrow',
      'Organize workspace',
      'Take a break',
    ];
    
    return generalSuggestions.filter(s => 
      s.toLowerCase().includes(input) || input.length < 2
    );
  }

  private findOptimalTimeSlot(
    startDate: Date,
    duration: number,
    preferences: any,
    existingSlots: SmartScheduleSlot[]
  ): { start: Date; end: Date; confidence: number; reasoning: string } | null {
    const start = new Date(startDate);
    const end = new Date(start.getTime() + duration * 60000);
    
    // Check if slot conflicts with existing slots
    const hasConflict = existingSlots.some(slot => 
      (start >= slot.startTime && start < slot.endTime) ||
      (end > slot.startTime && end <= slot.endTime)
    );
    
    if (hasConflict) {
      return null;
    }
    
    // Check if within work hours
    const withinWorkHours = start.getHours() >= preferences.workHours.start &&
                           end.getHours() <= preferences.workHours.end;
    
    return {
      start,
      end,
      confidence: withinWorkHours ? 0.9 : 0.6,
      reasoning: withinWorkHours ? 'Optimal work hours' : 'Outside preferred work hours',
    };
  }

  private getMostFrequent<T>(array: T[]): T {
    const frequency = new Map<T, number>();
    array.forEach(item => {
      frequency.set(item, (frequency.get(item) || 0) + 1);
    });
    
    return Array.from(frequency.entries())
      .sort(([, a], [, b]) => b - a)[0][0];
  }

  private generatePersonalityName(traits: string[]): string {
    if (traits.includes('highly productive')) return 'The Achiever';
    if (traits.includes('detail-oriented')) return 'The Planner';
    if (traits.includes('creative')) return 'The Innovator';
    if (traits.includes('balanced')) return 'The Steady';
    return 'The Organizer';
  }

  private generatePersonalizedSuggestions(traits: string[], completionRate: number): string[] {
    const suggestions: string[] = [];
    
    if (completionRate > 0.8) {
      suggestions.push(
        'You\'re doing great! Consider taking on more challenging tasks',
        'Share your productivity tips with others',
        'Set stretch goals to push your limits'
      );
    } else if (completionRate > 0.5) {
      suggestions.push(
        'You\'re making steady progress! Keep up the good work',
        'Try breaking large tasks into smaller steps',
        'Set specific deadlines to maintain momentum'
      );
    } else {
      suggestions.push(
        'Start with small, achievable tasks to build momentum',
        'Focus on completing one task at a time',
        'Celebrate small wins to stay motivated'
      );
    }
    
    if (traits.includes('detail-oriented')) {
      suggestions.push('Use your planning skills to create detailed task breakdowns');
    }
    
    if (traits.includes('creative')) {
      suggestions.push('Try different approaches to task management');
    }
    
    return suggestions;
  }
}

export default AdvancedMCPService.getInstance();

