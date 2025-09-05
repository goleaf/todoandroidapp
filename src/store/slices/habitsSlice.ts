import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HabitTracker } from '../../types';

interface HabitsState {
  habits: HabitTracker[];
  selectedHabit: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: HabitsState = {
  habits: [
    {
      id: 'drink_water',
      name: 'Drink Water',
      description: 'Drink 8 glasses of water daily',
      color: '#2196F3',
      icon: 'local-drink',
      frequency: 'daily',
      targetCount: 8,
      currentStreak: 0,
      longestStreak: 0,
      completedDates: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'exercise',
      name: 'Exercise',
      description: 'Daily workout routine',
      color: '#FF5722',
      icon: 'fitness-center',
      frequency: 'daily',
      targetCount: 1,
      currentStreak: 0,
      longestStreak: 0,
      completedDates: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'read_book',
      name: 'Read Book',
      description: 'Read for 30 minutes',
      color: '#4CAF50',
      icon: 'book',
      frequency: 'daily',
      targetCount: 1,
      currentStreak: 0,
      longestStreak: 0,
      completedDates: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  selectedHabit: null,
  loading: false,
  error: null,
};

const habitsSlice = createSlice({
  name: 'habits',
  initialState,
  reducers: {
    addHabit: (state, action: PayloadAction<HabitTracker>) => {
      state.habits.push(action.payload);
    },
    updateHabit: (state, action: PayloadAction<HabitTracker>) => {
      const index = state.habits.findIndex(habit => habit.id === action.payload.id);
      if (index !== -1) {
        state.habits[index] = action.payload;
      }
    },
    deleteHabit: (state, action: PayloadAction<string>) => {
      state.habits = state.habits.filter(habit => habit.id !== action.payload);
    },
    completeHabit: (state, action: PayloadAction<{ habitId: string; date: Date; count?: number }>) => {
      const habit = state.habits.find(h => h.id === action.payload.habitId);
      if (habit) {
        const dateStr = action.payload.date.toDateString();
        const existingDate = habit.completedDates.find(d => d.toDateString() === dateStr);
        
        if (!existingDate) {
          habit.completedDates.push(action.payload.date);
          habit.completedDates.sort((a, b) => b.getTime() - a.getTime());
          
          // Update streak
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          if (action.payload.date.toDateString() === today.toDateString()) {
            habit.currentStreak += 1;
          } else if (action.payload.date.toDateString() === yesterday.toDateString()) {
            // Check if there's a gap in the streak
            const sortedDates = [...habit.completedDates].sort((a, b) => b.getTime() - a.getTime());
            let streak = 1;
            for (let i = 1; i < sortedDates.length; i++) {
              const current = new Date(sortedDates[i]);
              const previous = new Date(sortedDates[i - 1]);
              const dayDiff = Math.floor((previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
              
              if (dayDiff === 1) {
                streak++;
              } else {
                break;
              }
            }
            habit.currentStreak = streak;
          }
          
          if (habit.currentStreak > habit.longestStreak) {
            habit.longestStreak = habit.currentStreak;
          }
          
          habit.updatedAt = new Date();
        }
      }
    },
    uncompleteHabit: (state, action: PayloadAction<{ habitId: string; date: Date }>) => {
      const habit = state.habits.find(h => h.id === action.payload.habitId);
      if (habit) {
        const dateStr = action.payload.date.toDateString();
        habit.completedDates = habit.completedDates.filter(d => d.toDateString() !== dateStr);
        
        // Recalculate streak
        const today = new Date();
        const sortedDates = [...habit.completedDates].sort((a, b) => b.getTime() - a.getTime());
        
        let streak = 0;
        for (let i = 0; i < sortedDates.length; i++) {
          const current = new Date(sortedDates[i]);
          const expectedDate = new Date(today);
          expectedDate.setDate(expectedDate.getDate() - i);
          
          if (current.toDateString() === expectedDate.toDateString()) {
            streak++;
          } else {
            break;
          }
        }
        
        habit.currentStreak = streak;
        habit.updatedAt = new Date();
      }
    },
    toggleHabitActive: (state, action: PayloadAction<string>) => {
      const habit = state.habits.find(h => h.id === action.payload);
      if (habit) {
        habit.isActive = !habit.isActive;
        habit.updatedAt = new Date();
      }
    },
    setSelectedHabit: (state, action: PayloadAction<string | null>) => {
      state.selectedHabit = action.payload;
    },
    calculateStreaks: (state) => {
      // Recalculate all streaks for all habits
      state.habits.forEach(habit => {
        if (habit.completedDates.length === 0) {
          habit.currentStreak = 0;
          return;
        }
        
        const today = new Date();
        const sortedDates = [...habit.completedDates].sort((a, b) => b.getTime() - a.getTime());
        
        let streak = 0;
        for (let i = 0; i < sortedDates.length; i++) {
          const current = new Date(sortedDates[i]);
          const expectedDate = new Date(today);
          expectedDate.setDate(expectedDate.getDate() - i);
          
          if (current.toDateString() === expectedDate.toDateString()) {
            streak++;
          } else {
            break;
          }
        }
        
        habit.currentStreak = streak;
      });
    },
    resetHabitStreak: (state, action: PayloadAction<string>) => {
      const habit = state.habits.find(h => h.id === action.payload);
      if (habit) {
        habit.currentStreak = 0;
        habit.updatedAt = new Date();
      }
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
  addHabit,
  updateHabit,
  deleteHabit,
  completeHabit,
  uncompleteHabit,
  toggleHabitActive,
  setSelectedHabit,
  calculateStreaks,
  resetHabitStreak,
  setLoading,
  setError,
} = habitsSlice.actions;

export default habitsSlice.reducer;
