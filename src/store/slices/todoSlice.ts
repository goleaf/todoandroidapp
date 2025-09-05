import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Todo, FilterOption, SortOption, Comment, TimeEntry, AISuggestion, TaskTemplate } from '../../types';

interface TodoState {
  todos: Todo[];
  templates: TaskTemplate[];
  comments: Comment[];
  timeEntries: TimeEntry[];
  aiSuggestions: AISuggestion[];
  filter: FilterOption;
  sortBy: SortOption;
  searchQuery: string;
  selectedTodos: string[];
  activeTimer: string | null; // Currently running timer for a todo
  focusMode: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: TodoState = {
  todos: [],
  templates: [],
  comments: [],
  timeEntries: [],
  aiSuggestions: [],
  filter: {
    categories: [],
    priorities: [],
    statuses: [],
    dateRange: {},
    tags: [],
    assignedTo: [],
    difficultyLevels: [],
  },
  sortBy: 'dueDate',
  searchQuery: '',
  selectedTodos: [],
  activeTimer: null,
  focusMode: false,
  loading: false,
  error: null,
};

const todoSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    addTodo: (state, action: PayloadAction<Todo>) => {
      state.todos.push(action.payload);
    },
    updateTodo: (state, action: PayloadAction<Todo>) => {
      const index = state.todos.findIndex(todo => todo.id === action.payload.id);
      if (index !== -1) {
        state.todos[index] = action.payload;
      }
    },
    deleteTodo: (state, action: PayloadAction<string>) => {
      state.todos = state.todos.filter(todo => todo.id !== action.payload);
      // Also remove any subtasks
      state.todos = state.todos.filter(todo => todo.parentId !== action.payload);
    },
    toggleTodo: (state, action: PayloadAction<string>) => {
      const todo = state.todos.find(todo => todo.id === action.payload);
      if (todo) {
        todo.completed = !todo.completed;
        todo.status = todo.completed ? 'completed' : 'in_progress';
        todo.updatedAt = new Date();
      }
    },
    setFilter: (state, action: PayloadAction<Partial<FilterOption>>) => {
      state.filter = { ...state.filter, ...action.payload };
    },
    setSortBy: (state, action: PayloadAction<SortOption>) => {
      state.sortBy = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    selectTodo: (state, action: PayloadAction<string>) => {
      if (!state.selectedTodos.includes(action.payload)) {
        state.selectedTodos.push(action.payload);
      }
    },
    deselectTodo: (state, action: PayloadAction<string>) => {
      state.selectedTodos = state.selectedTodos.filter(id => id !== action.payload);
    },
    clearSelection: (state) => {
      state.selectedTodos = [];
    },
    bulkUpdateTodos: (state, action: PayloadAction<{ ids: string[]; updates: Partial<Todo> }>) => {
      const { ids, updates } = action.payload;
      state.todos.forEach(todo => {
        if (ids.includes(todo.id)) {
          Object.assign(todo, updates, { updatedAt: new Date() });
        }
      });
    },
    bulkDeleteTodos: (state, action: PayloadAction<string[]>) => {
      state.todos = state.todos.filter(todo => !action.payload.includes(todo.id));
    },
    addSubtask: (state, action: PayloadAction<{ parentId: string; subtask: Todo }>) => {
      const { parentId, subtask } = action.payload;
      subtask.parentId = parentId;
      state.todos.push(subtask);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    importTodos: (state, action: PayloadAction<Todo[]>) => {
      // Merge imported todos, avoiding duplicates
      const existingIds = new Set(state.todos.map(todo => todo.id));
      const newTodos = action.payload.filter(todo => !existingIds.has(todo.id));
      state.todos.push(...newTodos);
    },
    // Enhanced features
    addComment: (state, action: PayloadAction<Comment>) => {
      state.comments.push(action.payload);
    },
    updateComment: (state, action: PayloadAction<Comment>) => {
      const index = state.comments.findIndex(comment => comment.id === action.payload.id);
      if (index !== -1) {
        state.comments[index] = action.payload;
      }
    },
    deleteComment: (state, action: PayloadAction<string>) => {
      state.comments = state.comments.filter(comment => comment.id !== action.payload);
    },
    startTimer: (state, action: PayloadAction<{ todoId: string; timeEntry: TimeEntry }>) => {
      state.activeTimer = action.payload.todoId;
      state.timeEntries.push(action.payload.timeEntry);
    },
    stopTimer: (state, action: PayloadAction<{ todoId: string; endTime: Date }>) => {
      state.activeTimer = null;
      const timeEntry = state.timeEntries.find(entry => 
        entry.todoId === action.payload.todoId && !entry.endTime
      );
      if (timeEntry) {
        timeEntry.endTime = action.payload.endTime;
        timeEntry.duration = Math.floor(
          (action.payload.endTime.getTime() - timeEntry.startTime.getTime()) / 60000
        );
      }
    },
    addTimeEntry: (state, action: PayloadAction<TimeEntry>) => {
      state.timeEntries.push(action.payload);
    },
    updateTimeEntry: (state, action: PayloadAction<TimeEntry>) => {
      const index = state.timeEntries.findIndex(entry => entry.id === action.payload.id);
      if (index !== -1) {
        state.timeEntries[index] = action.payload;
      }
    },
    deleteTimeEntry: (state, action: PayloadAction<string>) => {
      state.timeEntries = state.timeEntries.filter(entry => entry.id !== action.payload);
    },
    addAISuggestion: (state, action: PayloadAction<AISuggestion>) => {
      state.aiSuggestions.push(action.payload);
    },
    applyAISuggestion: (state, action: PayloadAction<string>) => {
      const suggestion = state.aiSuggestions.find(s => s.id === action.payload);
      if (suggestion) {
        suggestion.applied = true;
      }
    },
    dismissAISuggestion: (state, action: PayloadAction<string>) => {
      state.aiSuggestions = state.aiSuggestions.filter(s => s.id !== action.payload);
    },
    addTemplate: (state, action: PayloadAction<TaskTemplate>) => {
      state.templates.push(action.payload);
    },
    updateTemplate: (state, action: PayloadAction<TaskTemplate>) => {
      const index = state.templates.findIndex(template => template.id === action.payload.id);
      if (index !== -1) {
        state.templates[index] = action.payload;
      }
    },
    deleteTemplate: (state, action: PayloadAction<string>) => {
      state.templates = state.templates.filter(template => template.id !== action.payload);
    },
    createFromTemplate: (state, action: PayloadAction<{ templateId: string; customizations?: Partial<Todo> }>) => {
      const template = state.templates.find(t => t.id === action.payload.templateId);
      if (template) {
        template.usageCount += 1;
        // Template usage logic would create new todos from template
      }
    },
    assignTodo: (state, action: PayloadAction<{ todoId: string; userIds: string[] }>) => {
      const todo = state.todos.find(t => t.id === action.payload.todoId);
      if (todo) {
        todo.assignedTo = action.payload.userIds;
        todo.updatedAt = new Date();
      }
    },
    updateXP: (state, action: PayloadAction<{ todoId: string; xp: number }>) => {
      const todo = state.todos.find(t => t.id === action.payload.todoId);
      if (todo) {
        todo.xpReward = action.payload.xp;
      }
    },
    archiveTodo: (state, action: PayloadAction<string>) => {
      const todo = state.todos.find(t => t.id === action.payload);
      if (todo) {
        todo.isArchived = true;
        todo.updatedAt = new Date();
      }
    },
    unarchiveTodo: (state, action: PayloadAction<string>) => {
      const todo = state.todos.find(t => t.id === action.payload);
      if (todo) {
        todo.isArchived = false;
        todo.updatedAt = new Date();
      }
    },
    addDependency: (state, action: PayloadAction<{ todoId: string; dependsOn: string }>) => {
      const todo = state.todos.find(t => t.id === action.payload.todoId);
      if (todo && !todo.dependencies.includes(action.payload.dependsOn)) {
        todo.dependencies.push(action.payload.dependsOn);
        todo.updatedAt = new Date();
      }
    },
    removeDependency: (state, action: PayloadAction<{ todoId: string; dependsOn: string }>) => {
      const todo = state.todos.find(t => t.id === action.payload.todoId);
      if (todo) {
        todo.dependencies = todo.dependencies.filter(dep => dep !== action.payload.dependsOn);
        todo.updatedAt = new Date();
      }
    },
    toggleFocusMode: (state) => {
      state.focusMode = !state.focusMode;
    },
    setFocusMode: (state, action: PayloadAction<boolean>) => {
      state.focusMode = action.payload;
    },
  },
});

export const {
  addTodo,
  updateTodo,
  deleteTodo,
  toggleTodo,
  setFilter,
  setSortBy,
  setSearchQuery,
  selectTodo,
  deselectTodo,
  clearSelection,
  bulkUpdateTodos,
  bulkDeleteTodos,
  addSubtask,
  setLoading,
  setError,
  importTodos,
  // Enhanced features
  addComment,
  updateComment,
  deleteComment,
  startTimer,
  stopTimer,
  addTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  addAISuggestion,
  applyAISuggestion,
  dismissAISuggestion,
  addTemplate,
  updateTemplate,
  deleteTemplate,
  createFromTemplate,
  assignTodo,
  updateXP,
  archiveTodo,
  unarchiveTodo,
  addDependency,
  removeDependency,
  toggleFocusMode,
  setFocusMode,
} = todoSlice.actions;

export default todoSlice.reducer;
