// Core Types for Todo App

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  categoryId?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  categoryId?: string;
  searchQuery?: string;
  dueDateRange?: {
    start: Date;
    end: Date;
  };
}

export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  defaultView: 'list' | 'kanban' | 'calendar';
  autoCompleteSubtasks: boolean;
}

// Navigation Types
export type RootStackParamList = {
  MainTabs: undefined;
  Home: undefined;
  TasksList: undefined;
  TaskDetails: { taskId: string };
  AddTask: { categoryId?: string; taskId?: string };
  EditTask: { taskId: string };
  Categories: undefined;
  CategoriesList: undefined;
  AddCategory: { parentId?: string };
  EditCategory: { categoryId: string };
  Settings: undefined;
  SettingsMain: undefined;
  Dashboard: undefined;
  DashboardMain: undefined;
};

export type BottomTabParamList = {
  Tasks: undefined;
  Dashboard: undefined;
  Categories: undefined;
  Settings: undefined;
};

// Database Types
export interface DatabaseTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface DatabaseCategory {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}
