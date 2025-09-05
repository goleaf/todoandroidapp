import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AIInsight, VoiceCommand } from '../../types';

interface AIState {
  insights: AIInsight[];
  voiceCommands: VoiceCommand[];
  isProcessingVoice: boolean;
  isGeneratingInsights: boolean;
  nlpEnabled: boolean;
  smartCategorizationEnabled: boolean;
  priorityPredictionEnabled: boolean;
  habitSuggestionsEnabled: boolean;
  productivityInsightsEnabled: boolean;
  voiceCommandsEnabled: boolean;
  lastInsightGeneration: Date | null;
  loading: boolean;
  error: string | null;
}

const initialState: AIState = {
  insights: [
    {
      id: 'productivity_tip_1',
      type: 'productivity_tip',
      title: 'Peak Productivity Hours',
      description: 'You complete most tasks between 9-11 AM. Consider scheduling important tasks during this time.',
      actionable: true,
      action: {
        type: 'schedule_suggestion',
        data: { timeSlot: '09:00-11:00', priority: 'high' }
      },
      confidence: 0.85,
      createdAt: new Date(),
    },
    {
      id: 'pattern_1',
      type: 'pattern_recognition',
      title: 'Category Pattern Detected',
      description: 'You often create work tasks on Sunday evenings. This might indicate planning ahead for the week.',
      actionable: false,
      confidence: 0.72,
      createdAt: new Date(),
    },
  ],
  voiceCommands: [],
  isProcessingVoice: false,
  isGeneratingInsights: false,
  nlpEnabled: true,
  smartCategorizationEnabled: true,
  priorityPredictionEnabled: true,
  habitSuggestionsEnabled: true,
  productivityInsightsEnabled: true,
  voiceCommandsEnabled: true,
  lastInsightGeneration: null,
  loading: false,
  error: null,
};

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    addInsight: (state, action: PayloadAction<AIInsight>) => {
      // Avoid duplicate insights
      const existingInsight = state.insights.find(insight => 
        insight.type === action.payload.type && insight.title === action.payload.title
      );
      if (!existingInsight) {
        state.insights.push(action.payload);
        // Keep only the latest 20 insights
        if (state.insights.length > 20) {
          state.insights = state.insights.slice(-20);
        }
      }
    },
    dismissInsight: (state, action: PayloadAction<string>) => {
      const insight = state.insights.find(i => i.id === action.payload);
      if (insight) {
        insight.dismissedAt = new Date();
      }
    },
    removeInsight: (state, action: PayloadAction<string>) => {
      state.insights = state.insights.filter(insight => insight.id !== action.payload);
    },
    addVoiceCommand: (state, action: PayloadAction<VoiceCommand>) => {
      state.voiceCommands.push(action.payload);
      // Keep only the latest 50 voice commands
      if (state.voiceCommands.length > 50) {
        state.voiceCommands = state.voiceCommands.slice(-50);
      }
    },
    setProcessingVoice: (state, action: PayloadAction<boolean>) => {
      state.isProcessingVoice = action.payload;
    },
    setGeneratingInsights: (state, action: PayloadAction<boolean>) => {
      state.isGeneratingInsights = action.payload;
    },
    updateAISettings: (state, action: PayloadAction<{
      nlpEnabled?: boolean;
      smartCategorizationEnabled?: boolean;
      priorityPredictionEnabled?: boolean;
      habitSuggestionsEnabled?: boolean;
      productivityInsightsEnabled?: boolean;
      voiceCommandsEnabled?: boolean;
    }>) => {
      Object.assign(state, action.payload);
    },
    generateProductivityInsights: (state, action: PayloadAction<{ todos: any[]; completedTasks: number; timeSpent: number }>) => {
      if (!state.productivityInsightsEnabled) return;
      
      const { todos, completedTasks, timeSpent } = action.payload;
      const now = new Date();
      
      // Generate completion rate insight
      if (todos.length > 0) {
        const completionRate = (completedTasks / todos.length) * 100;
        if (completionRate < 50) {
          const insight: AIInsight = {
            id: `completion_rate_${now.getTime()}`,
            type: 'productivity_tip',
            title: 'Low Completion Rate',
            description: `Your task completion rate is ${completionRate.toFixed(1)}%. Consider breaking down large tasks into smaller, manageable ones.`,
            actionable: true,
            action: {
              type: 'suggest_subtasks',
              data: { threshold: 3 }
            },
            confidence: 0.8,
            createdAt: now,
          };
          state.insights.push(insight);
        }
      }
      
      // Generate time management insight
      if (timeSpent > 0) {
        const avgTimePerTask = timeSpent / Math.max(completedTasks, 1);
        if (avgTimePerTask > 120) { // More than 2 hours per task
          const insight: AIInsight = {
            id: `time_management_${now.getTime()}`,
            type: 'time_optimization',
            title: 'Long Task Duration',
            description: `Your average task takes ${(avgTimePerTask / 60).toFixed(1)} hours. Consider using the Pomodoro technique to maintain focus.`,
            actionable: true,
            action: {
              type: 'enable_pomodoro',
              data: { duration: 25 }
            },
            confidence: 0.75,
            createdAt: now,
          };
          state.insights.push(insight);
        }
      }
      
      state.lastInsightGeneration = now;
    },
    processNaturalLanguage: (state, action: PayloadAction<{ text: string; result: any }>) => {
      if (!state.nlpEnabled) return;
      
      const voiceCommand: VoiceCommand = {
        id: Date.now().toString(),
        command: action.payload.text,
        intent: 'create_task', // This would be determined by NLP
        parameters: action.payload.result,
        confidence: 0.9, // This would come from NLP service
        processedAt: new Date(),
        result: action.payload.result,
      };
      
      state.voiceCommands.push(voiceCommand);
    },
    suggestCategory: (state, action: PayloadAction<{ taskTitle: string; description?: string }>) => {
      if (!state.smartCategorizationEnabled) return;
      
      const { taskTitle, description } = action.payload;
      const text = `${taskTitle} ${description || ''}`.toLowerCase();
      
      let suggestedCategory = 'personal';
      let confidence = 0.5;
      
      // Simple keyword-based categorization (in real app, this would use ML)
      if (text.includes('work') || text.includes('meeting') || text.includes('project') || text.includes('deadline')) {
        suggestedCategory = 'work';
        confidence = 0.8;
      } else if (text.includes('buy') || text.includes('shop') || text.includes('store') || text.includes('grocery')) {
        suggestedCategory = 'shopping';
        confidence = 0.85;
      } else if (text.includes('health') || text.includes('doctor') || text.includes('exercise') || text.includes('gym')) {
        suggestedCategory = 'health';
        confidence = 0.9;
      }
      
      // Add suggestion insight
      const insight: AIInsight = {
        id: `category_suggestion_${Date.now()}`,
        type: 'goal_suggestion',
        title: 'Category Suggestion',
        description: `This task seems to belong to "${suggestedCategory}" category.`,
        actionable: true,
        action: {
          type: 'apply_category',
          data: { category: suggestedCategory }
        },
        confidence,
        createdAt: new Date(),
      };
      
      state.insights.push(insight);
    },
    predictPriority: (state, action: PayloadAction<{ taskTitle: string; dueDate?: Date; description?: string }>) => {
      if (!state.priorityPredictionEnabled) return;
      
      const { taskTitle, dueDate, description } = action.payload;
      const text = `${taskTitle} ${description || ''}`.toLowerCase();
      
      let suggestedPriority: 'low' | 'medium' | 'high' = 'medium';
      let confidence = 0.6;
      
      // Priority prediction based on keywords and due date
      if (text.includes('urgent') || text.includes('asap') || text.includes('important') || text.includes('critical')) {
        suggestedPriority = 'high';
        confidence = 0.9;
      } else if (text.includes('when possible') || text.includes('someday') || text.includes('maybe')) {
        suggestedPriority = 'low';
        confidence = 0.8;
      }
      
      // Due date influence
      if (dueDate) {
        const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilDue <= 1) {
          suggestedPriority = 'high';
          confidence = Math.max(confidence, 0.85);
        } else if (daysUntilDue <= 3) {
          suggestedPriority = suggestedPriority === 'low' ? 'medium' : suggestedPriority;
          confidence = Math.max(confidence, 0.7);
        }
      }
      
      // Add suggestion insight
      const insight: AIInsight = {
        id: `priority_suggestion_${Date.now()}`,
        type: 'goal_suggestion',
        title: 'Priority Suggestion',
        description: `This task appears to have "${suggestedPriority}" priority.`,
        actionable: true,
        action: {
          type: 'apply_priority',
          data: { priority: suggestedPriority }
        },
        confidence,
        createdAt: new Date(),
      };
      
      state.insights.push(insight);
    },
    clearOldInsights: (state) => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      state.insights = state.insights.filter(insight => 
        !insight.dismissedAt || insight.dismissedAt > oneWeekAgo
      );
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  addInsight,
  dismissInsight,
  removeInsight,
  addVoiceCommand,
  setProcessingVoice,
  setGeneratingInsights,
  updateAISettings,
  generateProductivityInsights,
  processNaturalLanguage,
  suggestCategory,
  predictPriority,
  clearOldInsights,
  setLoading,
  setError,
} = aiSlice.actions;

export default aiSlice.reducer;
