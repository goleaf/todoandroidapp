import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Task, TaskStatus, TaskPriority } from '../../types';
import { databaseService } from '../../services/database';
import { notificationService } from '../../services/notifications';

interface TasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  filter: {
    status?: TaskStatus[];
    priority?: TaskPriority[];
    categoryId?: string;
    searchQuery?: string;
  };
}

const initialState: TasksState = {
  tasks: [],
  loading: false,
  error: null,
  filter: {},
};

// Async thunks
export const loadTasks = createAsyncThunk('tasks/loadTasks', async () => {
  return await databaseService.getAllTasks();
});

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const task = await databaseService.createTask(taskData);
    
    // Schedule notification if task has due date
    if (task.dueDate && task.status !== TaskStatus.COMPLETED) {
      await notificationService.scheduleTaskReminder(task);
    }
    
    return task;
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
    const task = await databaseService.updateTask(id, updates);
    
    // Cancel existing notifications
    await notificationService.cancelTaskReminder(id);
    
    // Schedule new notification if task has due date and is not completed
    if (task.dueDate && task.status !== TaskStatus.COMPLETED) {
      await notificationService.scheduleTaskReminder(task);
    }
    
    return task;
  }
);

export const deleteTask = createAsyncThunk('tasks/deleteTask', async (id: string) => {
  await databaseService.deleteTask(id);
  
  // Cancel any scheduled notifications for this task
  await notificationService.cancelTaskReminder(id);
  
  return id;
});

export const toggleTaskStatus = createAsyncThunk(
  'tasks/toggleTaskStatus',
  async (id: string, { getState }) => {
    const state = getState() as { tasks: TasksState };
    const task = state.tasks.tasks.find(t => t.id === id);
    
    if (!task) throw new Error('Task not found');

    const newStatus = task.status === TaskStatus.COMPLETED 
      ? TaskStatus.TODO 
      : TaskStatus.COMPLETED;
    
    const updates: Partial<Task> = {
      status: newStatus,
      completedAt: newStatus === TaskStatus.COMPLETED ? new Date() : undefined,
    };

    const updatedTask = await databaseService.updateTask(id, updates);
    
    // Handle notifications based on status change
    if (newStatus === TaskStatus.COMPLETED) {
      // Cancel notifications when task is completed
      await notificationService.cancelTaskReminder(id);
      
      // Send completion notification
      notificationService.sendImmediateNotification(
        'Task Completed! 🎉',
        `"${task.title}" has been marked as complete`
      );
    } else if (updatedTask.dueDate) {
      // Reschedule notifications when task is reopened
      await notificationService.scheduleTaskReminder(updatedTask);
    }

    return updatedTask;
  }
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<Partial<TasksState['filter']>>) => {
      state.filter = { ...state.filter, ...action.payload };
    },
    clearFilter: (state) => {
      state.filter = {};
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Load tasks
    builder
      .addCase(loadTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(loadTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load tasks';
      });

    // Create task
    builder
      .addCase(createTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks.unshift(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create task';
      });

    // Update task
    builder
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update task';
      });

    // Delete task
    builder
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(task => task.id !== action.payload);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete task';
      });

    // Toggle task status
    builder
      .addCase(toggleTaskStatus.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(toggleTaskStatus.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to toggle task status';
      });
  },
});

export const { setFilter, clearFilter, clearError } = tasksSlice.actions;
export default tasksSlice.reducer;
