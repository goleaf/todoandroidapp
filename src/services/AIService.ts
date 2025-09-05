import * as natural from 'natural';
import * as compromise from 'compromise';
import { Todo, Category, AISuggestion, AIInsight, VoiceCommand } from '../types';

export class AIService {
  private static instance: AIService;
  private classifier: natural.LogisticRegressionClassifier;
  private priorityClassifier: natural.LogisticRegressionClassifier;

  private constructor() {
    this.initializeClassifiers();
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private initializeClassifiers() {
    // Initialize category classifier
    this.classifier = new natural.LogisticRegressionClassifier();
    
    // Train with sample data (in production, this would be trained with user data)
    this.trainCategoryClassifier();
    
    // Initialize priority classifier
    this.priorityClassifier = new natural.LogisticRegressionClassifier();
    this.trainPriorityClassifier();
  }

  private trainCategoryClassifier() {
    // Sample training data for categories
    const trainingData = [
      // Work category
      { text: 'meeting with client', category: 'work' },
      { text: 'finish project report', category: 'work' },
      { text: 'review code', category: 'work' },
      { text: 'send email to team', category: 'work' },
      { text: 'prepare presentation', category: 'work' },
      
      // Personal category
      { text: 'buy groceries', category: 'personal' },
      { text: 'call mom', category: 'personal' },
      { text: 'exercise at gym', category: 'personal' },
      { text: 'read book', category: 'personal' },
      { text: 'clean house', category: 'personal' },
      
      // Health category
      { text: 'doctor appointment', category: 'health' },
      { text: 'take medication', category: 'health' },
      { text: 'go for a run', category: 'health' },
      { text: 'drink water', category: 'health' },
      { text: 'meditation', category: 'health' },
      
      // Shopping category
      { text: 'buy milk', category: 'shopping' },
      { text: 'purchase new shoes', category: 'shopping' },
      { text: 'order online', category: 'shopping' },
      { text: 'grocery shopping', category: 'shopping' },
      
      // Learning category
      { text: 'study for exam', category: 'learning' },
      { text: 'watch tutorial', category: 'learning' },
      { text: 'practice coding', category: 'learning' },
      { text: 'read documentation', category: 'learning' }
    ];

    trainingData.forEach(({ text, category }) => {
      this.classifier.addDocument(text, category);
    });

    this.classifier.train();
  }

  private trainPriorityClassifier() {
    // Sample training data for priorities
    const trainingData = [
      // High priority
      { text: 'urgent meeting', priority: 'high' },
      { text: 'deadline tomorrow', priority: 'high' },
      { text: 'emergency fix', priority: 'high' },
      { text: 'critical bug', priority: 'high' },
      { text: 'asap', priority: 'high' },
      { text: 'important client', priority: 'high' },
      
      // Medium priority
      { text: 'weekly report', priority: 'medium' },
      { text: 'team meeting', priority: 'medium' },
      { text: 'review document', priority: 'medium' },
      { text: 'update website', priority: 'medium' },
      
      // Low priority
      { text: 'organize files', priority: 'low' },
      { text: 'clean desk', priority: 'low' },
      { text: 'read article', priority: 'low' },
      { text: 'backup data', priority: 'low' },
      { text: 'when free', priority: 'low' }
    ];

    trainingData.forEach(({ text, priority }) => {
      this.priorityClassifier.addDocument(text, priority);
    });

    this.priorityClassifier.train();
  }

  // Natural Language Processing for task creation
  parseNaturalLanguageTask(input: string): Partial<Todo> {
    const doc = compromise(input);
    const task: Partial<Todo> = {
      title: input,
      description: '',
      tags: [],
      priority: 'medium',
      status: 'not_started'
    };

    // Extract dates and times
    const dates = doc.dates().out('array');
    if (dates.length > 0) {
      task.dueDate = this.parseDate(dates[0]);
    }

    // Extract time references
    const timeWords = ['tomorrow', 'today', 'next week', 'next month'];
    timeWords.forEach(timeWord => {
      if (input.toLowerCase().includes(timeWord)) {
        task.dueDate = this.parseRelativeDate(timeWord);
      }
    });

    // Extract priority indicators
    const priorityWords = {
      high: ['urgent', 'asap', 'important', 'critical', 'emergency', 'deadline'],
      low: ['when free', 'sometime', 'eventually', 'later', 'optional']
    };

    Object.entries(priorityWords).forEach(([priority, words]) => {
      words.forEach(word => {
        if (input.toLowerCase().includes(word)) {
          task.priority = priority as 'high' | 'medium' | 'low';
        }
      });
    });

    // Extract location information
    const locations = doc.places().out('array');
    if (locations.length > 0) {
      task.location = {
        latitude: 0, // Would need geocoding service
        longitude: 0,
        address: locations[0]
      };
    }

    // Extract estimated time
    const timePattern = /(\d+)\s*(hour|hr|minute|min)s?/gi;
    const timeMatch = input.match(timePattern);
    if (timeMatch) {
      const time = timeMatch[0];
      const value = parseInt(time);
      const unit = time.toLowerCase().includes('hour') || time.toLowerCase().includes('hr') ? 'hours' : 'minutes';
      task.estimatedTime = unit === 'hours' ? value * 60 : value;
    }

    return task;
  }

  // Smart categorization
  suggestCategory(taskTitle: string, categories: Category[]): AISuggestion {
    const prediction = this.classifier.classify(taskTitle);
    const confidence = this.classifier.getClassifications(taskTitle)[0]?.value || 0;

    // Find matching category
    const matchingCategory = categories.find(cat => 
      cat.name.toLowerCase().includes(prediction.toLowerCase()) ||
      prediction.toLowerCase().includes(cat.name.toLowerCase())
    );

    return {
      id: `cat_${Date.now()}`,
      type: 'category',
      suggestion: matchingCategory?.id || prediction,
      confidence: confidence,
      applied: false,
      createdAt: new Date()
    };
  }

  // Smart priority prediction
  suggestPriority(taskTitle: string, dueDate?: Date): AISuggestion {
    let prediction = this.priorityClassifier.classify(taskTitle);
    let confidence = this.priorityClassifier.getClassifications(taskTitle)[0]?.value || 0;

    // Adjust priority based on due date
    if (dueDate) {
      const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue <= 1) {
        prediction = 'high';
        confidence = Math.max(confidence, 0.8);
      } else if (daysUntilDue <= 3) {
        prediction = prediction === 'low' ? 'medium' : prediction;
        confidence = Math.max(confidence, 0.6);
      }
    }

    return {
      id: `pri_${Date.now()}`,
      type: 'priority',
      suggestion: prediction,
      confidence: confidence,
      applied: false,
      createdAt: new Date()
    };
  }

  // Suggest subtasks
  suggestSubtasks(taskTitle: string): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    
    // Common task patterns and their subtasks
    const taskPatterns = {
      'meeting': ['Prepare agenda', 'Send calendar invite', 'Book meeting room', 'Follow up with action items'],
      'presentation': ['Create outline', 'Design slides', 'Practice delivery', 'Prepare Q&A'],
      'project': ['Define requirements', 'Create timeline', 'Assign tasks', 'Set milestones'],
      'report': ['Gather data', 'Analyze results', 'Write draft', 'Review and edit'],
      'shopping': ['Make shopping list', 'Check prices', 'Go to store', 'Put items away'],
      'exercise': ['Warm up', 'Main workout', 'Cool down', 'Track progress'],
      'study': ['Review materials', 'Take notes', 'Practice problems', 'Test knowledge']
    };

    Object.entries(taskPatterns).forEach(([pattern, subtasks]) => {
      if (taskTitle.toLowerCase().includes(pattern)) {
        subtasks.forEach((subtask, index) => {
          suggestions.push({
            id: `sub_${Date.now()}_${index}`,
            type: 'subtask',
            suggestion: subtask,
            confidence: 0.7,
            applied: false,
            createdAt: new Date()
          });
        });
      }
    });

    return suggestions;
  }

  // Voice command processing
  processVoiceCommand(transcript: string): VoiceCommand {
    const doc = compromise(transcript);
    const command: VoiceCommand = {
      id: `voice_${Date.now()}`,
      command: transcript,
      intent: 'create_task',
      parameters: {},
      confidence: 0.8,
      processedAt: new Date()
    };

    // Intent classification
    if (transcript.toLowerCase().includes('create') || transcript.toLowerCase().includes('add')) {
      command.intent = 'create_task';
      command.parameters = this.parseNaturalLanguageTask(transcript);
    } else if (transcript.toLowerCase().includes('complete') || transcript.toLowerCase().includes('done')) {
      command.intent = 'complete_task';
      // Extract task identifier
      const taskWords = doc.nouns().out('array');
      command.parameters = { taskIdentifier: taskWords.join(' ') };
    } else if (transcript.toLowerCase().includes('list') || transcript.toLowerCase().includes('show')) {
      command.intent = 'list_tasks';
      // Extract filter criteria
      if (transcript.toLowerCase().includes('today')) {
        command.parameters = { filter: 'today' };
      } else if (transcript.toLowerCase().includes('overdue')) {
        command.parameters = { filter: 'overdue' };
      }
    } else if (transcript.toLowerCase().includes('remind') || transcript.toLowerCase().includes('reminder')) {
      command.intent = 'set_reminder';
      command.parameters = this.parseNaturalLanguageTask(transcript);
    } else if (transcript.toLowerCase().includes('timer') || transcript.toLowerCase().includes('pomodoro')) {
      command.intent = 'start_timer';
      const timeMatch = transcript.match(/(\d+)\s*(minute|min|hour|hr)s?/i);
      if (timeMatch) {
        const value = parseInt(timeMatch[1]);
        const unit = timeMatch[2].toLowerCase().includes('hour') ? 'hours' : 'minutes';
        command.parameters = { duration: unit === 'hours' ? value * 60 : value };
      }
    }

    return command;
  }

  // Generate productivity insights
  generateInsights(todos: Todo[], completionHistory: any[]): AIInsight[] {
    const insights: AIInsight[] = [];

    // Analyze completion patterns
    const completedTodos = todos.filter(todo => todo.completed);
    const totalTodos = todos.length;
    const completionRate = totalTodos > 0 ? (completedTodos.length / totalTodos) * 100 : 0;

    if (completionRate < 50) {
      insights.push({
        id: `insight_${Date.now()}_1`,
        type: 'productivity_tip',
        title: 'Low Completion Rate',
        description: `Your task completion rate is ${completionRate.toFixed(1)}%. Consider breaking down large tasks into smaller, manageable subtasks.`,
        actionable: true,
        action: {
          type: 'suggest_subtasks',
          data: { threshold: 5 }
        },
        confidence: 0.8,
        createdAt: new Date()
      });
    }

    // Analyze overdue tasks
    const overdueTodos = todos.filter(todo => 
      todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed
    );

    if (overdueTodos.length > 3) {
      insights.push({
        id: `insight_${Date.now()}_2`,
        type: 'time_optimization',
        title: 'Multiple Overdue Tasks',
        description: `You have ${overdueTodos.length} overdue tasks. Consider rescheduling or reprioritizing them.`,
        actionable: true,
        action: {
          type: 'reschedule_overdue',
          data: { taskIds: overdueTodos.map(t => t.id) }
        },
        confidence: 0.9,
        createdAt: new Date()
      });
    }

    // Analyze time patterns
    const highPriorityTodos = todos.filter(todo => todo.priority === 'high');
    const completedHighPriority = highPriorityTodos.filter(todo => todo.completed);
    
    if (highPriorityTodos.length > 0 && completedHighPriority.length / highPriorityTodos.length < 0.7) {
      insights.push({
        id: `insight_${Date.now()}_3`,
        type: 'pattern_recognition',
        title: 'High Priority Task Challenge',
        description: 'You\'re struggling with high priority tasks. Try time-blocking or the Pomodoro technique.',
        actionable: true,
        action: {
          type: 'enable_pomodoro',
          data: {}
        },
        confidence: 0.7,
        createdAt: new Date()
      });
    }

    return insights;
  }

  // Habit suggestions based on task patterns
  suggestHabits(todos: Todo[]): AIInsight[] {
    const insights: AIInsight[] = [];
    
    // Analyze recurring patterns
    const taskTitles = todos.map(todo => todo.title.toLowerCase());
    const commonWords = this.findCommonWords(taskTitles);
    
    commonWords.forEach(word => {
      if (['exercise', 'workout', 'gym', 'run'].includes(word)) {
        insights.push({
          id: `habit_${Date.now()}_${word}`,
          type: 'goal_suggestion',
          title: 'Exercise Habit',
          description: 'You frequently create exercise-related tasks. Consider setting up a daily exercise habit tracker.',
          actionable: true,
          action: {
            type: 'create_habit',
            data: { name: 'Daily Exercise', frequency: 'daily' }
          },
          confidence: 0.8,
          createdAt: new Date()
        });
      }
    });

    return insights;
  }

  // Helper methods
  private parseDate(dateString: string): Date {
    // Simple date parsing - in production, use a more robust library
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date() : date;
  }

  private parseRelativeDate(timeWord: string): Date {
    const now = new Date();
    
    switch (timeWord.toLowerCase()) {
      case 'today':
        return now;
      case 'tomorrow':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'next week':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'next month':
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      default:
        return now;
    }
  }

  private findCommonWords(texts: string[]): string[] {
    const wordCount: Record<string, number> = {};
    
    texts.forEach(text => {
      const words = text.split(' ').filter(word => word.length > 3);
      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });
    });

    return Object.entries(wordCount)
      .filter(([_, count]) => count >= 3)
      .map(([word, _]) => word);
  }

  // Smart scheduling
  suggestOptimalTime(taskTitle: string, estimatedTime?: number): Date {
    const now = new Date();
    
    // Simple heuristic - suggest based on task type
    if (taskTitle.toLowerCase().includes('meeting') || taskTitle.toLowerCase().includes('call')) {
      // Suggest business hours
      const suggestedTime = new Date(now);
      suggestedTime.setHours(10, 0, 0, 0); // 10 AM
      if (suggestedTime < now) {
        suggestedTime.setDate(suggestedTime.getDate() + 1);
      }
      return suggestedTime;
    }
    
    if (taskTitle.toLowerCase().includes('exercise') || taskTitle.toLowerCase().includes('workout')) {
      // Suggest morning or evening
      const suggestedTime = new Date(now);
      suggestedTime.setHours(7, 0, 0, 0); // 7 AM
      if (suggestedTime < now) {
        suggestedTime.setHours(18, 0, 0, 0); // 6 PM
        if (suggestedTime < now) {
          suggestedTime.setDate(suggestedTime.getDate() + 1);
          suggestedTime.setHours(7, 0, 0, 0);
        }
      }
      return suggestedTime;
    }

    // Default: suggest next available time slot
    const suggestedTime = new Date(now.getTime() + (estimatedTime || 30) * 60 * 1000);
    return suggestedTime;
  }
}

export default AIService.getInstance();
