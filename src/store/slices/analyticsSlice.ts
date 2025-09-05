import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Analytics, CategoryStats, WeeklyProgress } from '../../types';

interface AnalyticsState extends Analytics {
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const initialState: AnalyticsState = {
  totalTasks: 0,
  completedTasks: 0,
  completionRate: 0,
  averageCompletionTime: 0,
  productivityScore: 0,
  streakDays: 0,
  categoryStats: [],
  weeklyProgress: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    updateAnalytics: (state, action: PayloadAction<Partial<Analytics>>) => {
      Object.assign(state, action.payload);
      state.lastUpdated = new Date();
    },
    updateCategoryStats: (state, action: PayloadAction<CategoryStats[]>) => {
      state.categoryStats = action.payload;
    },
    updateWeeklyProgress: (state, action: PayloadAction<WeeklyProgress[]>) => {
      state.weeklyProgress = action.payload;
    },
    incrementStreak: (state) => {
      state.streakDays += 1;
    },
    resetStreak: (state) => {
      state.streakDays = 0;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    calculateProductivityScore: (state) => {
      // Simple productivity score calculation
      const completionRate = state.totalTasks > 0 ? (state.completedTasks / state.totalTasks) * 100 : 0;
      const streakBonus = Math.min(state.streakDays * 2, 20); // Max 20 bonus points
      const timeEfficiency = state.averageCompletionTime > 0 ? Math.max(100 - state.averageCompletionTime / 60, 0) : 50;
      
      state.productivityScore = Math.round((completionRate * 0.5) + (streakBonus * 0.3) + (timeEfficiency * 0.2));
    },
  },
});

export const {
  updateAnalytics,
  updateCategoryStats,
  updateWeeklyProgress,
  incrementStreak,
  resetStreak,
  setLoading,
  setError,
  calculateProductivityScore,
} = analyticsSlice.actions;

export default analyticsSlice.reducer;
