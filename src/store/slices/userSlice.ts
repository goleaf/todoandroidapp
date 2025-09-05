import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, UserStats, Achievement, Badge, PomodoroSession, FocusSession, HabitTracker } from '../../types';

interface UserState {
  currentUser: User | null;
  stats: UserStats;
  achievements: Achievement[];
  badges: Badge[];
  pomodoroSessions: PomodoroSession[];
  focusSessions: FocusSession[];
  habits: HabitTracker[];
  currentPomodoroSession: PomodoroSession | null;
  currentFocusSession: FocusSession | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialStats: UserStats = {
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  totalTasksCompleted: 0,
  currentStreak: 0,
  longestStreak: 0,
  badges: [],
  achievements: [],
  totalTimeSpent: 0,
  averageTaskCompletionTime: 0,
};

const initialState: UserState = {
  currentUser: null,
  stats: initialStats,
  achievements: [],
  badges: [],
  pomodoroSessions: [],
  focusSessions: [],
  habits: [],
  currentPomodoroSession: null,
  currentFocusSession: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
      state.isAuthenticated = true;
    },
    updateUserProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload };
      }
    },
    updateUserStats: (state, action: PayloadAction<Partial<UserStats>>) => {
      state.stats = { ...state.stats, ...action.payload };
    },
    addXP: (state, action: PayloadAction<number>) => {
      state.stats.xp += action.payload;
      
      // Check for level up
      while (state.stats.xp >= state.stats.xpToNextLevel) {
        state.stats.xp -= state.stats.xpToNextLevel;
        state.stats.level += 1;
        state.stats.xpToNextLevel = Math.floor(state.stats.xpToNextLevel * 1.2); // Increase XP requirement
      }
    },
    incrementTasksCompleted: (state) => {
      state.stats.totalTasksCompleted += 1;
    },
    updateStreak: (state, action: PayloadAction<number>) => {
      state.stats.currentStreak = action.payload;
      if (action.payload > state.stats.longestStreak) {
        state.stats.longestStreak = action.payload;
      }
    },
    addTimeSpent: (state, action: PayloadAction<number>) => {
      state.stats.totalTimeSpent += action.payload;
      
      // Recalculate average
      if (state.stats.totalTasksCompleted > 0) {
        state.stats.averageTaskCompletionTime = state.stats.totalTimeSpent / state.stats.totalTasksCompleted;
      }
    },
    unlockAchievement: (state, action: PayloadAction<Achievement>) => {
      const existing = state.achievements.find(a => a.id === action.payload.id);
      if (!existing) {
        state.achievements.push({
          ...action.payload,
          unlockedAt: new Date(),
        });
        // Add XP reward
        state.stats.xp += action.payload.xpReward;
      }
    },
    updateAchievementProgress: (state, action: PayloadAction<{ id: string; progress: number }>) => {
      const achievement = state.achievements.find(a => a.id === action.payload.id);
      if (achievement) {
        achievement.progress = Math.min(action.payload.progress, achievement.maxProgress);
        
        // Check if achievement is completed
        if (achievement.progress >= achievement.maxProgress && !achievement.unlockedAt) {
          achievement.unlockedAt = new Date();
          state.stats.xp += achievement.xpReward;
        }
      }
    },
    unlockBadge: (state, action: PayloadAction<Badge>) => {
      const existing = state.badges.find(b => b.id === action.payload.id);
      if (!existing) {
        state.badges.push(action.payload);
      }
    },
    // Pomodoro session management
    startPomodoroSession: (state, action: PayloadAction<PomodoroSession>) => {
      state.currentPomodoroSession = action.payload;
      state.pomodoroSessions.push(action.payload);
    },
    updatePomodoroSession: (state, action: PayloadAction<Partial<PomodoroSession>>) => {
      if (state.currentPomodoroSession) {
        state.currentPomodoroSession = { ...state.currentPomodoroSession, ...action.payload };
        
        // Update in sessions array
        const index = state.pomodoroSessions.findIndex(s => s.id === state.currentPomodoroSession!.id);
        if (index !== -1) {
          state.pomodoroSessions[index] = state.currentPomodoroSession;
        }
      }
    },
    completePomodoroSession: (state) => {
      if (state.currentPomodoroSession) {
        state.currentPomodoroSession.completed = true;
        state.currentPomodoroSession.endTime = new Date();
        
        // Update in sessions array
        const index = state.pomodoroSessions.findIndex(s => s.id === state.currentPomodoroSession!.id);
        if (index !== -1) {
          state.pomodoroSessions[index] = state.currentPomodoroSession;
        }
        
        // Add XP for completed session
        if (state.currentPomodoroSession.type === 'work') {
          state.stats.xp += 5;
        }
        
        state.currentPomodoroSession = null;
      }
    },
    interruptPomodoroSession: (state) => {
      if (state.currentPomodoroSession) {
        state.currentPomodoroSession.interrupted = true;
        state.currentPomodoroSession.endTime = new Date();
        
        // Update in sessions array
        const index = state.pomodoroSessions.findIndex(s => s.id === state.currentPomodoroSession!.id);
        if (index !== -1) {
          state.pomodoroSessions[index] = state.currentPomodoroSession;
        }
        
        state.currentPomodoroSession = null;
      }
    },
    // Focus session management
    startFocusSession: (state, action: PayloadAction<FocusSession>) => {
      state.currentFocusSession = action.payload;
      state.focusSessions.push(action.payload);
    },
    updateFocusSession: (state, action: PayloadAction<Partial<FocusSession>>) => {
      if (state.currentFocusSession) {
        state.currentFocusSession = { ...state.currentFocusSession, ...action.payload };
        
        // Update in sessions array
        const index = state.focusSessions.findIndex(s => s.id === state.currentFocusSession!.id);
        if (index !== -1) {
          state.focusSessions[index] = state.currentFocusSession;
        }
      }
    },
    completeFocusSession: (state, action: PayloadAction<{ productivity: number }>) => {
      if (state.currentFocusSession) {
        state.currentFocusSession.completed = true;
        state.currentFocusSession.endTime = new Date();
        state.currentFocusSession.productivity = action.payload.productivity;
        
        // Update in sessions array
        const index = state.focusSessions.findIndex(s => s.id === state.currentFocusSession!.id);
        if (index !== -1) {
          state.focusSessions[index] = state.currentFocusSession;
        }
        
        // Add XP based on productivity
        const xpReward = Math.floor(action.payload.productivity / 10);
        state.stats.xp += xpReward;
        
        state.currentFocusSession = null;
      }
    },
    // Habit tracking
    addHabit: (state, action: PayloadAction<HabitTracker>) => {
      state.habits.push(action.payload);
    },
    updateHabit: (state, action: PayloadAction<HabitTracker>) => {
      const index = state.habits.findIndex(h => h.id === action.payload.id);
      if (index !== -1) {
        state.habits[index] = action.payload;
      }
    },
    deleteHabit: (state, action: PayloadAction<string>) => {
      state.habits = state.habits.filter(h => h.id !== action.payload);
    },
    completeHabit: (state, action: PayloadAction<{ habitId: string; date: Date }>) => {
      const habit = state.habits.find(h => h.id === action.payload.habitId);
      if (habit) {
        const dateStr = action.payload.date.toDateString();
        if (!habit.completedDates.some(d => new Date(d).toDateString() === dateStr)) {
          habit.completedDates.push(action.payload.date);
          
          // Update streak
          const today = new Date().toDateString();
          const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
          
          if (dateStr === today) {
            if (habit.completedDates.some(d => new Date(d).toDateString() === yesterday)) {
              habit.currentStreak += 1;
            } else {
              habit.currentStreak = 1;
            }
            
            if (habit.currentStreak > habit.longestStreak) {
              habit.longestStreak = habit.currentStreak;
            }
          }
          
          habit.updatedAt = new Date();
          
          // Add XP for habit completion
          state.stats.xp += 3;
        }
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    signOut: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      state.currentPomodoroSession = null;
      state.currentFocusSession = null;
    },
    resetUserData: () => initialState,
  },
});

export const {
  setCurrentUser,
  updateUserProfile,
  updateUserStats,
  addXP,
  incrementTasksCompleted,
  updateStreak,
  addTimeSpent,
  unlockAchievement,
  updateAchievementProgress,
  unlockBadge,
  startPomodoroSession,
  updatePomodoroSession,
  completePomodoroSession,
  interruptPomodoroSession,
  startFocusSession,
  updateFocusSession,
  completeFocusSession,
  addHabit,
  updateHabit,
  deleteHabit,
  completeHabit,
  setLoading,
  setError,
  signOut,
  resetUserData,
} = userSlice.actions;

export default userSlice.reducer;