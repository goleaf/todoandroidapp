import { Todo, SmartSuggestion, Category } from '../types';

interface AIAnalysis {
  suggestedCategory?: string;
  suggestedPriority?: 'low' | 'medium' | 'high';
  suggestedDueDate?: Date;
  suggestedTags?: string[];
  confidence: number;
}

class AIService {
  // Natural Language Processing for task creation
  async analyzeTaskInput(input: string, existingTodos: Todo[], categories: Category[]): Promise<AIAnalysis> {
    const analysis: AIAnalysis = {
      confidence: 0
    };

    try {
      // Analyze priority keywords
      const priorityAnalysis = this.analyzePriority(input);
      if (priorityAnalysis.priority) {
        analysis.suggestedPriority = priorityAnalysis.priority;
        analysis.confidence += priorityAnalysis.confidence;
      }

      // Analyze category keywords
      const categoryAnalysis = this.analyzeCategory(input, categories);
      if (categoryAnalysis.category) {
        analysis.suggestedCategory = categoryAnalysis.category;
        analysis.confidence += categoryAnalysis.confidence;
      }

      // Analyze due date keywords
      const dueDateAnalysis = this.analyzeDueDate(input);
      if (dueDateAnalysis.date) {
        analysis.suggestedDueDate = dueDateAnalysis.date;
        analysis.confidence += dueDateAnalysis.confidence;
      }

      // Extract and suggest tags
      const tagAnalysis = this.extractTags(input, existingTodos);
      if (tagAnalysis.tags.length > 0) {
        analysis.suggestedTags = tagAnalysis.tags;
        analysis.confidence += tagAnalysis.confidence;
      }

      // Normalize confidence score
      analysis.confidence = Math.min(1, analysis.confidence / 4);

      return analysis;
    } catch (error) {
      console.error('AI analysis error:', error);
      return { confidence: 0 };
    }
  }

  // Priority analysis
  private analyzePriority(input: string): { priority?: 'low' | 'medium' | 'high'; confidence: number } {
    const text = input.toLowerCase();
    
    const highPriorityKeywords = [
      'urgent', 'asap', 'immediately', 'critical', 'important', 'emergency',
      'deadline', 'rush', 'priority', 'crucial', 'vital'
    ];
    
    const lowPriorityKeywords = [
      'when possible', 'eventually', 'someday', 'maybe', 'optional',
      'nice to have', 'if time permits', 'low priority'
    ];

    const highScore = highPriorityKeywords.reduce((score, keyword) => {
      return text.includes(keyword) ? score + 1 : score;
    }, 0);

    const lowScore = lowPriorityKeywords.reduce((score, keyword) => {
      return text.includes(keyword) ? score + 1 : score;
    }, 0);

    if (highScore > 0) {
      return { priority: 'high', confidence: Math.min(0.8, highScore * 0.3) };
    } else if (lowScore > 0) {
      return { priority: 'low', confidence: Math.min(0.6, lowScore * 0.3) };
    }

    return { confidence: 0 };
  }

  // Category analysis
  private analyzeCategory(input: string, categories: Category[]): { category?: string; confidence: number } {
    const text = input.toLowerCase();
    
    // Define category keywords
    const categoryKeywords: Record<string, string[]> = {
      'work': ['work', 'office', 'meeting', 'project', 'client', 'business', 'professional'],
      'personal': ['personal', 'home', 'family', 'self', 'private'],
      'health': ['health', 'doctor', 'exercise', 'gym', 'medical', 'fitness', 'wellness'],
      'shopping': ['buy', 'purchase', 'shop', 'store', 'market', 'grocery'],
      'finance': ['pay', 'bill', 'bank', 'money', 'budget', 'finance', 'tax'],
      'education': ['study', 'learn', 'course', 'school', 'university', 'education'],
      'travel': ['travel', 'trip', 'vacation', 'flight', 'hotel', 'booking'],
      'maintenance': ['fix', 'repair', 'maintain', 'clean', 'organize']
    };

    let bestMatch = '';
    let bestScore = 0;

    // Check against predefined keywords
    for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
      const score = keywords.reduce((acc, keyword) => {
        return text.includes(keyword) ? acc + 1 : acc;
      }, 0);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = categoryName;
      }
    }

    // Check against existing categories
    for (const category of categories) {
      const categoryName = category.name.toLowerCase();
      if (text.includes(categoryName)) {
        return { category: category.id, confidence: 0.9 };
      }
    }

    if (bestMatch && bestScore > 0) {
      // Find matching category ID
      const matchingCategory = categories.find(cat => 
        cat.name.toLowerCase().includes(bestMatch)
      );
      
      return {
        category: matchingCategory?.id || bestMatch,
        confidence: Math.min(0.7, bestScore * 0.2)
      };
    }

    return { confidence: 0 };
  }

  // Due date analysis
  private analyzeDueDate(input: string): { date?: Date; confidence: number } {
    const text = input.toLowerCase();
    const now = new Date();

    // Time-based keywords
    const timePatterns = [
      { pattern: /today/i, days: 0, confidence: 0.9 },
      { pattern: /tomorrow/i, days: 1, confidence: 0.9 },
      { pattern: /next week/i, days: 7, confidence: 0.8 },
      { pattern: /this week/i, days: 3, confidence: 0.7 },
      { pattern: /next month/i, days: 30, confidence: 0.7 },
      { pattern: /in (\d+) days?/i, days: 0, confidence: 0.8 }, // Will be calculated
      { pattern: /in (\d+) weeks?/i, days: 0, confidence: 0.8 }, // Will be calculated
    ];

    for (const timePattern of timePatterns) {
      const match = text.match(timePattern.pattern);
      if (match) {
        let days = timePattern.days;
        
        if (match[1]) { // Extract number from pattern
          const number = parseInt(match[1]);
          if (timePattern.pattern.source.includes('weeks')) {
            days = number * 7;
          } else {
            days = number;
          }
        }

        const dueDate = new Date(now);
        dueDate.setDate(dueDate.getDate() + days);
        
        return { date: dueDate, confidence: timePattern.confidence };
      }
    }

    // Day of week patterns
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < days.length; i++) {
      if (text.includes(days[i])) {
        const targetDay = new Date(now);
        const currentDay = now.getDay();
        const daysUntilTarget = (i - currentDay + 7) % 7;
        targetDay.setDate(targetDay.getDate() + (daysUntilTarget || 7));
        
        return { date: targetDay, confidence: 0.8 };
      }
    }

    return { confidence: 0 };
  }

  // Tag extraction
  private extractTags(input: string, existingTodos: Todo[]): { tags: string[]; confidence: number } {
    const text = input.toLowerCase();
    const extractedTags: string[] = [];

    // Extract hashtags
    const hashtagMatches = text.match(/#\w+/g);
    if (hashtagMatches) {
      extractedTags.push(...hashtagMatches.map(tag => tag.substring(1)));
    }

    // Extract common action words as tags
    const actionWords = [
      'call', 'email', 'write', 'read', 'review', 'plan', 'organize',
      'create', 'design', 'develop', 'test', 'deploy', 'research'
    ];

    for (const action of actionWords) {
      if (text.includes(action)) {
        extractedTags.push(action);
      }
    }

    // Learn from existing todos - find commonly used tags
    const allExistingTags = existingTodos.flatMap(todo => todo.tags);
    const tagFrequency = allExistingTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Suggest frequent tags that might be relevant
    for (const [tag, frequency] of Object.entries(tagFrequency)) {
      if (frequency > 2 && text.includes(tag.toLowerCase())) {
        extractedTags.push(tag);
      }
    }

    const uniqueTags = [...new Set(extractedTags)];
    const confidence = uniqueTags.length > 0 ? Math.min(0.8, uniqueTags.length * 0.2) : 0;

    return { tags: uniqueTags, confidence };
  }

  // Smart suggestions based on patterns
  async generateSmartSuggestions(todos: Todo[], categories: Category[]): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];

    try {
      // Suggest recurring tasks
      const recurringsuggestions = this.suggestRecurringTasks(todos);
      suggestions.push(...recurringSuggestions);

      // Suggest overdue task actions
      const overdueActions = this.suggestOverdueActions(todos);
      suggestions.push(...overdueActions);

      // Suggest category organization
      const categoryOrganization = this.suggestCategoryOrganization(todos, categories);
      suggestions.push(...categoryOrganization);

      // Suggest priority adjustments
      const priorityAdjustments = this.suggestPriorityAdjustments(todos);
      suggestions.push(...priorityAdjustments);

      return suggestions;
    } catch (error) {
      console.error('Generate smart suggestions error:', error);
      return [];
    }
  }

  private suggestRecurringTasks(todos: Todo[]): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    
    // Find tasks that appear to be recurring based on similar titles
    const titleGroups: Record<string, Todo[]> = {};
    
    todos.forEach(todo => {
      const normalizedTitle = todo.title.toLowerCase()
        .replace(/\d+/g, '') // Remove numbers
        .replace(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/g, '') // Remove day references
        .trim();
      
      if (!titleGroups[normalizedTitle]) {
        titleGroups[normalizedTitle] = [];
      }
      titleGroups[normalizedTitle].push(todo);
    });

    Object.entries(titleGroups).forEach(([title, groupTodos]) => {
      if (groupTodos.length >= 3) { // If similar task appears 3+ times
        suggestions.push({
          id: Date.now().toString() + Math.random(),
          type: 'recurring',
          suggestion: {
            title: `Make "${groupTodos[0].title}" recurring`,
            description: 'This task appears frequently. Consider making it recurring.',
            todoId: groupTodos[0].id,
            recurringConfig: {
              type: 'weekly',
              interval: 1
            }
          },
          confidence: 0.7,
          context: { similarTasks: groupTodos.length },
          createdAt: new Date()
        });
      }
    });

    return suggestions;
  }

  private suggestOverdueActions(todos: Todo[]): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    const now = new Date();

    const overdueTodos = todos.filter(todo => 
      todo.dueDate && 
      todo.dueDate < now && 
      !todo.completed
    );

    if (overdueTodos.length > 0) {
      suggestions.push({
        id: Date.now().toString() + Math.random(),
        type: 'due_date',
        suggestion: {
          title: `${overdueTodos.length} overdue tasks`,
          description: 'You have overdue tasks. Consider rescheduling or completing them.',
          action: 'review_overdue',
          todoIds: overdueTodos.map(t => t.id)
        },
        confidence: 0.9,
        context: { overdueCount: overdueTodos.length },
        createdAt: new Date()
      });
    }

    return suggestions;
  }

  private suggestCategoryOrganization(todos: Todo[], categories: Category[]): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    // Find uncategorized todos
    const uncategorizedTodos = todos.filter(todo => !todo.categoryId);
    
    if (uncategorizedTodos.length > 5) {
      suggestions.push({
        id: Date.now().toString() + Math.random(),
        type: 'category',
        suggestion: {
          title: 'Organize uncategorized tasks',
          description: `${uncategorizedTodos.length} tasks need categories for better organization.`,
          action: 'categorize_tasks',
          todoIds: uncategorizedTodos.map(t => t.id)
        },
        confidence: 0.6,
        context: { uncategorizedCount: uncategorizedTodos.length },
        createdAt: new Date()
      });
    }

    return suggestions;
  }

  private suggestPriorityAdjustments(todos: Todo[]): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    const now = new Date();

    // Find high priority tasks that are overdue
    const overdueHighPriority = todos.filter(todo =>
      todo.priority === 'high' &&
      todo.dueDate &&
      todo.dueDate < now &&
      !todo.completed
    );

    if (overdueHighPriority.length > 0) {
      suggestions.push({
        id: Date.now().toString() + Math.random(),
        type: 'priority',
        suggestion: {
          title: 'Review high priority overdue tasks',
          description: 'Some high priority tasks are overdue. Consider immediate action.',
          action: 'review_high_priority',
          todoIds: overdueHighPriority.map(t => t.id)
        },
        confidence: 0.8,
        context: { overdueHighPriorityCount: overdueHighPriority.length },
        createdAt: new Date()
      });
    }

    return suggestions;
  }

  // Productivity insights
  async generateProductivityInsights(todos: Todo[]): Promise<{
    completionRate: number;
    averageTasksPerDay: number;
    mostProductiveTimeOfDay: string;
    suggestions: string[];
  }> {
    const completedTodos = todos.filter(todo => todo.completed);
    const totalTodos = todos.length;
    const completionRate = totalTodos > 0 ? (completedTodos.length / totalTodos) * 100 : 0;

    // Calculate average tasks per day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTodos = todos.filter(todo => todo.createdAt >= thirtyDaysAgo);
    const averageTasksPerDay = recentTodos.length / 30;

    // Analyze completion times to find most productive time
    const completionHours = completedTodos
      .filter(todo => todo.updatedAt)
      .map(todo => todo.updatedAt.getHours());

    const hourCounts = completionHours.reduce((acc, hour) => {
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const mostProductiveHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    const mostProductiveTimeOfDay = mostProductiveHour 
      ? this.formatHourToTimeOfDay(parseInt(mostProductiveHour))
      : 'Unknown';

    // Generate suggestions
    const suggestions: string[] = [];
    
    if (completionRate < 50) {
      suggestions.push('Consider breaking down large tasks into smaller, manageable subtasks.');
    }
    
    if (averageTasksPerDay > 10) {
      suggestions.push('You might be overcommitting. Try focusing on fewer, high-impact tasks.');
    }
    
    if (mostProductiveHour) {
      suggestions.push(`Schedule important tasks around ${mostProductiveTimeOfDay} when you're most productive.`);
    }

    return {
      completionRate,
      averageTasksPerDay,
      mostProductiveTimeOfDay,
      suggestions
    };
  }

  private formatHourToTimeOfDay(hour: number): string {
    if (hour >= 6 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 21) return 'Evening';
    return 'Night';
  }

  // Task complexity analysis
  analyzeTaskComplexity(todo: Todo): {
    complexity: 1 | 2 | 3 | 4 | 5;
    factors: string[];
    estimatedTime: number; // in minutes
  } {
    let complexity: 1 | 2 | 3 | 4 | 5 = 1;
    const factors: string[] = [];
    let estimatedTime = 30; // Default 30 minutes

    // Analyze title length and complexity
    if (todo.title.length > 50) {
      complexity = Math.min(5, complexity + 1) as 1 | 2 | 3 | 4 | 5;
      factors.push('Long title suggests complex task');
      estimatedTime += 30;
    }

    // Analyze description
    if (todo.description && todo.description.length > 200) {
      complexity = Math.min(5, complexity + 1) as 1 | 2 | 3 | 4 | 5;
      factors.push('Detailed description indicates complexity');
      estimatedTime += 60;
    }

    // Analyze subtasks
    if (todo.subtasks && todo.subtasks.length > 0) {
      complexity = Math.min(5, complexity + Math.ceil(todo.subtasks.length / 3)) as 1 | 2 | 3 | 4 | 5;
      factors.push(`Has ${todo.subtasks.length} subtasks`);
      estimatedTime += todo.subtasks.length * 20;
    }

    // Analyze dependencies
    if (todo.dependencies && todo.dependencies.length > 0) {
      complexity = Math.min(5, complexity + 1) as 1 | 2 | 3 | 4 | 5;
      factors.push('Has dependencies on other tasks');
      estimatedTime += 30;
    }

    // Analyze attachments
    if (todo.attachments && todo.attachments.length > 0) {
      complexity = Math.min(5, complexity + 1) as 1 | 2 | 3 | 4 | 5;
      factors.push('Has attachments requiring review');
      estimatedTime += todo.attachments.length * 15;
    }

    // Analyze keywords for complexity
    const complexityKeywords = [
      'research', 'analyze', 'design', 'develop', 'implement', 'create',
      'plan', 'strategy', 'review', 'evaluate', 'coordinate', 'manage'
    ];

    const text = (todo.title + ' ' + (todo.description || '')).toLowerCase();
    const keywordMatches = complexityKeywords.filter(keyword => text.includes(keyword));
    
    if (keywordMatches.length > 0) {
      complexity = Math.min(5, complexity + keywordMatches.length) as 1 | 2 | 3 | 4 | 5;
      factors.push(`Contains complex action words: ${keywordMatches.join(', ')}`);
      estimatedTime += keywordMatches.length * 45;
    }

    return {
      complexity,
      factors,
      estimatedTime: Math.min(480, estimatedTime) // Cap at 8 hours
    };
  }
}

export const aiService = new AIService();
export default aiService;
