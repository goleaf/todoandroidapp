import SQLiteService from './SQLiteService';
import FirebaseService from './FirebaseService';
import SyncService from './SyncService';
import { Todo, Category, User, Project, Team, TaskTemplate, HabitTracker, SyncStatus } from '../../types';

export class DatabaseService {
  private static instance: DatabaseService;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Todo operations
  async createTodo(todo: Todo): Promise<Todo> {
    const created = await SQLiteService.create('todos', todo);
    SyncService.addToSyncQueue('todos', 'insert', created, created.id);
    return created;
  }

  async updateTodo(id: string, updates: Partial<Todo>): Promise<Todo | null> {
    const updated = await SQLiteService.update('todos', id, updates);
    if (updated) {
      SyncService.addToSyncQueue('todos', 'update', updated, id);
    }
    return updated;
  }

  async deleteTodo(id: string): Promise<boolean> {
    const deleted = await SQLiteService.delete('todos', id);
    if (deleted) {
      SyncService.addToSyncQueue('todos', 'delete', { id }, id);
    }
    return deleted;
  }

  async getTodo(id: string): Promise<Todo | null> {
    return SQLiteService.getById<Todo>('todos', id);
  }

  async getAllTodos(): Promise<Todo[]> {
    return SQLiteService.getAll<Todo>('todos');
  }

  async getTodosByCategory(categoryId: string): Promise<Todo[]> {
    return SQLiteService.getTodosByCategory(categoryId);
  }

  async searchTodos(searchTerm: string): Promise<Todo[]> {
    return SQLiteService.searchTodos(searchTerm);
  }

  async getTodayTodos(): Promise<Todo[]> {
    return SQLiteService.getTodayTodos();
  }

  async getOverdueTodos(): Promise<Todo[]> {
    return SQLiteService.getOverdueTodos();
  }

  // Category operations
  async createCategory(category: Category): Promise<Category> {
    const created = await SQLiteService.create('categories', category);
    SyncService.addToSyncQueue('categories', 'insert', created, created.id);
    return created;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    const updated = await SQLiteService.update('categories', id, updates);
    if (updated) {
      SyncService.addToSyncQueue('categories', 'update', updated, id);
    }
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const deleted = await SQLiteService.delete('categories', id);
    if (deleted) {
      SyncService.addToSyncQueue('categories', 'delete', { id }, id);
    }
    return deleted;
  }

  async getCategory(id: string): Promise<Category | null> {
    return SQLiteService.getById<Category>('categories', id);
  }

  async getAllCategories(): Promise<Category[]> {
    return SQLiteService.getAll<Category>('categories');
  }

  // Project operations
  async createProject(project: Project): Promise<Project> {
    const created = await SQLiteService.create('projects', project);
    SyncService.addToSyncQueue('projects', 'insert', created, created.id);
    return created;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    const updated = await SQLiteService.update('projects', id, updates);
    if (updated) {
      SyncService.addToSyncQueue('projects', 'update', updated, id);
    }
    return updated;
  }

  async deleteProject(id: string): Promise<boolean> {
    const deleted = await SQLiteService.delete('projects', id);
    if (deleted) {
      SyncService.addToSyncQueue('projects', 'delete', { id }, id);
    }
    return deleted;
  }

  async getProject(id: string): Promise<Project | null> {
    return SQLiteService.getById<Project>('projects', id);
  }

  async getAllProjects(): Promise<Project[]> {
    return SQLiteService.getAll<Project>('projects');
  }

  // User operations
  async createUser(user: User): Promise<User> {
    const created = await SQLiteService.create('users', user);
    SyncService.addToSyncQueue('users', 'insert', created, created.id);
    return created;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const updated = await SQLiteService.update('users', id, updates);
    if (updated) {
      SyncService.addToSyncQueue('users', 'update', updated, id);
    }
    return updated;
  }

  async getUser(id: string): Promise<User | null> {
    return SQLiteService.getById<User>('users', id);
  }

  // Task Template operations
  async createTaskTemplate(template: TaskTemplate): Promise<TaskTemplate> {
    const created = await SQLiteService.create('task_templates', template);
    SyncService.addToSyncQueue('task_templates', 'insert', created, created.id);
    return created;
  }

  async updateTaskTemplate(id: string, updates: Partial<TaskTemplate>): Promise<TaskTemplate | null> {
    const updated = await SQLiteService.update('task_templates', id, updates);
    if (updated) {
      SyncService.addToSyncQueue('task_templates', 'update', updated, id);
    }
    return updated;
  }

  async deleteTaskTemplate(id: string): Promise<boolean> {
    const deleted = await SQLiteService.delete('task_templates', id);
    if (deleted) {
      SyncService.addToSyncQueue('task_templates', 'delete', { id }, id);
    }
    return deleted;
  }

  async getTaskTemplate(id: string): Promise<TaskTemplate | null> {
    return SQLiteService.getById<TaskTemplate>('task_templates', id);
  }

  async getAllTaskTemplates(): Promise<TaskTemplate[]> {
    return SQLiteService.getAll<TaskTemplate>('task_templates');
  }

  // Habit Tracker operations
  async createHabitTracker(habit: HabitTracker): Promise<HabitTracker> {
    const created = await SQLiteService.create('habit_trackers', habit);
    SyncService.addToSyncQueue('habit_trackers', 'insert', created, created.id);
    return created;
  }

  async updateHabitTracker(id: string, updates: Partial<HabitTracker>): Promise<HabitTracker | null> {
    const updated = await SQLiteService.update('habit_trackers', id, updates);
    if (updated) {
      SyncService.addToSyncQueue('habit_trackers', 'update', updated, id);
    }
    return updated;
  }

  async deleteHabitTracker(id: string): Promise<boolean> {
    const deleted = await SQLiteService.delete('habit_trackers', id);
    if (deleted) {
      SyncService.addToSyncQueue('habit_trackers', 'delete', { id }, id);
    }
    return deleted;
  }

  async getHabitTracker(id: string): Promise<HabitTracker | null> {
    return SQLiteService.getById<HabitTracker>('habit_trackers', id);
  }

  async getAllHabitTrackers(): Promise<HabitTracker[]> {
    return SQLiteService.getAll<HabitTracker>('habit_trackers');
  }

  // Sync operations
  async syncToCloud(): Promise<void> {
    return SyncService.syncPendingChanges();
  }

  async syncFromCloud(): Promise<void> {
    return SyncService.syncFromCloud();
  }

  async performFullSync(): Promise<void> {
    return SyncService.performFullSync();
  }

  async getSyncStatus(): Promise<SyncStatus> {
    return SyncService.getSyncStatus();
  }

  // Real-time listeners
  setupTodoListener(callback: (todos: Todo[]) => void): () => void {
    return FirebaseService.setupRealtimeListener<Todo>('todos', callback);
  }

  setupCategoryListener(callback: (categories: Category[]) => void): () => void {
    return FirebaseService.setupRealtimeListener<Category>('categories', callback);
  }

  // Authentication
  getCurrentUserId(): string | null {
    return FirebaseService.getCurrentUserId();
  }

  isAuthenticated(): boolean {
    return FirebaseService.isAuthenticated();
  }

  isOnline(): boolean {
    return FirebaseService.isOnlineStatus();
  }

  async signOut(): Promise<void> {
    return FirebaseService.signOut();
  }

  // Utility methods
  async close(): Promise<void> {
    await SQLiteService.close();
  }
}

export default DatabaseService.getInstance();
