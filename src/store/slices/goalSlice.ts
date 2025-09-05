import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Goal } from '../../types';

interface GoalState {
  goals: Goal[];
  selectedGoal: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: GoalState = {
  goals: [],
  selectedGoal: null,
  loading: false,
  error: null,
};

const goalSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {
    addGoal: (state, action: PayloadAction<Goal>) => {
      state.goals.push(action.payload);
    },
    updateGoal: (state, action: PayloadAction<Goal>) => {
      const index = state.goals.findIndex(goal => goal.id === action.payload.id);
      if (index !== -1) {
        state.goals[index] = action.payload;
      }
    },
    deleteGoal: (state, action: PayloadAction<string>) => {
      state.goals = state.goals.filter(goal => goal.id !== action.payload);
    },
    updateGoalProgress: (state, action: PayloadAction<{ goalId: string; progress: number }>) => {
      const goal = state.goals.find(goal => goal.id === action.payload.goalId);
      if (goal) {
        goal.progress = action.payload.progress;
        goal.updatedAt = new Date();
      }
    },
    addTodoToGoal: (state, action: PayloadAction<{ goalId: string; todoId: string }>) => {
      const goal = state.goals.find(goal => goal.id === action.payload.goalId);
      if (goal && !goal.todoIds.includes(action.payload.todoId)) {
        goal.todoIds.push(action.payload.todoId);
        goal.updatedAt = new Date();
      }
    },
    removeTodoFromGoal: (state, action: PayloadAction<{ goalId: string; todoId: string }>) => {
      const goal = state.goals.find(goal => goal.id === action.payload.goalId);
      if (goal) {
        goal.todoIds = goal.todoIds.filter(id => id !== action.payload.todoId);
        goal.updatedAt = new Date();
      }
    },
    setSelectedGoal: (state, action: PayloadAction<string | null>) => {
      state.selectedGoal = action.payload;
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
  addGoal,
  updateGoal,
  deleteGoal,
  updateGoalProgress,
  addTodoToGoal,
  removeTodoFromGoal,
  setSelectedGoal,
  setLoading,
  setError,
} = goalSlice.actions;

export default goalSlice.reducer;
