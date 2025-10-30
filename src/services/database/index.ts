import SQLite from 'react-native-sqlite-storage';
import { Task, Category, TaskStatus, TaskPriority, DatabaseTask, DatabaseCategory } from '../../types';

// Enable debugging
SQLite.DEBUG(true);
SQLite.enablePromise(true);

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabase({
        name: 'TodoApp.db',
        location: 'default',
      });

      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Create categories table
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        icon TEXT,
        parent_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (parent_id) REFERENCES categories (id)
      )
    `);

    // Create tasks table
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        priority TEXT NOT NULL,
        category_id TEXT,
        due_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        completed_at TEXT,
        FOREIGN KEY (category_id) REFERENCES categories (id)
      )
    `);

    // Create default categories
    await this.createDefaultCategories();
  }

  private async createDefaultCategories(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Avoid reseeding if categories already exist
    const result = await this.db.executeSql('SELECT COUNT(*) as count FROM categories');
    const count = result[0].rows.item(0).count as number;
    if (count > 0) return;

    const defaultCategories = [
      { name: 'Personal', color: '#2196F3', icon: 'person' },
      { name: 'Work', color: '#FF9800', icon: 'work' },
      { name: 'Shopping', color: '#4CAF50', icon: 'shopping-cart' },
      { name: 'Health', color: '#E91E63', icon: 'favorite' },
    ];

    for (const category of defaultCategories) {
      await this.createCategory({
        ...category,
      });
    }

    // Create sample tasks to demonstrate functionality
    await this.createSampleTasks();
  }

  private async createSampleTasks(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Check if sample tasks already exist
    const result = await this.db.executeSql('SELECT COUNT(*) as count FROM tasks');
    const count = result[0].rows.item(0).count as number;
    if (count > 0) return;

    // Get categories for sample tasks
    const categories = await this.getAllCategories();
    const personalCategory = categories.find(c => c.name === 'Personal');
    const workCategory = categories.find(c => c.name === 'Work');
    const shoppingCategory = categories.find(c => c.name === 'Shopping');
    const healthCategory = categories.find(c => c.name === 'Health');

    const sampleTasks = [
      {
        title: '🎉 Welcome to Ultimate Todo App!',
        description: 'This is your first task. Try marking it as complete!',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        categoryId: personalCategory?.id,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      },
      {
        title: '📝 Add your first real task',
        description: 'Tap the + button to create a new task with your own content',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        categoryId: workCategory?.id,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
      },
      {
        title: '🛒 Buy groceries',
        description: 'Milk, bread, eggs, and fruits',
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        categoryId: shoppingCategory?.id,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      },
      {
        title: '💪 Exercise 30 minutes',
        description: 'Go for a run or do some home workout',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        categoryId: healthCategory?.id,
        dueDate: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      },
      {
        title: '📚 Read documentation',
        description: 'Learn about the new features in the app',
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.LOW,
        categoryId: workCategory?.id,
        completedAt: new Date(),
      },
    ];

    for (const taskData of sampleTasks) {
      await this.createTask(taskData);
    }

    console.log('Sample tasks created successfully!');
  }

  // Task CRUD Operations
  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    if (!this.db) throw new Error('Database not initialized');

    const id = Date.now().toString();
    const now = new Date().toISOString();
    
    const newTask: Task = {
      id,
      ...task,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.db.executeSql(
      `INSERT INTO tasks (id, title, description, status, priority, category_id, due_date, created_at, updated_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newTask.id,
        newTask.title,
        newTask.description || null,
        newTask.status,
        newTask.priority,
        newTask.categoryId || null,
        newTask.dueDate?.toISOString() || null,
        now,
        now,
        newTask.completedAt?.toISOString() || null,
      ]
    );

    return newTask;
  }

  async getAllTasks(): Promise<Task[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.executeSql('SELECT * FROM tasks ORDER BY created_at DESC');
    const tasks: Task[] = [];

    for (let i = 0; i < results[0].rows.length; i++) {
      const row: DatabaseTask = results[0].rows.item(i);
      tasks.push(this.mapDatabaseTaskToTask(row));
    }

    return tasks;
  }

  async getTaskById(id: string): Promise<Task | null> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.executeSql('SELECT * FROM tasks WHERE id = ?', [id]);
    
    if (results[0].rows.length === 0) return null;

    const row: DatabaseTask = results[0].rows.item(0);
    return this.mapDatabaseTaskToTask(row);
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    if (!this.db) throw new Error('Database not initialized');

    const existingTask = await this.getTaskById(id);
    if (!existingTask) throw new Error('Task not found');

    const updatedTask: Task = {
      ...existingTask,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    await this.db.executeSql(
      `UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, 
       category_id = ?, due_date = ?, updated_at = ?, completed_at = ?
       WHERE id = ?`,
      [
        updatedTask.title,
        updatedTask.description || null,
        updatedTask.status,
        updatedTask.priority,
        updatedTask.categoryId || null,
        updatedTask.dueDate?.toISOString() || null,
        updatedTask.updatedAt.toISOString(),
        updatedTask.completedAt?.toISOString() || null,
        id,
      ]
    );

    return updatedTask;
  }

  async deleteTask(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql('DELETE FROM tasks WHERE id = ?', [id]);
  }

  // Category CRUD Operations
  async createCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    if (!this.db) throw new Error('Database not initialized');

    const id = Date.now().toString();
    const now = new Date().toISOString();
    
    const newCategory: Category = {
      id,
      ...category,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.db.executeSql(
      `INSERT OR REPLACE INTO categories (id, name, color, icon, parent_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        newCategory.id,
        newCategory.name,
        newCategory.color,
        newCategory.icon || null,
        newCategory.parentId || null,
        now,
        now,
      ]
    );

    return newCategory;
  }

  async getAllCategories(): Promise<Category[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.executeSql('SELECT * FROM categories ORDER BY name');
    const categories: Category[] = [];

    for (let i = 0; i < results[0].rows.length; i++) {
      const row: DatabaseCategory = results[0].rows.item(i);
      categories.push(this.mapDatabaseCategoryToCategory(row));
    }

    return categories;
  }

  async getCategoryById(id: string): Promise<Category | null> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.executeSql('SELECT * FROM categories WHERE id = ?', [id]);
    
    if (results[0].rows.length === 0) return null;

    const row: DatabaseCategory = results[0].rows.item(0);
    return this.mapDatabaseCategoryToCategory(row);
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    if (!this.db) throw new Error('Database not initialized');

    const existingCategory = await this.getCategoryById(id);
    if (!existingCategory) throw new Error('Category not found');

    const updatedCategory: Category = {
      ...existingCategory,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    await this.db.executeSql(
      `UPDATE categories SET name = ?, color = ?, icon = ?, parent_id = ?, updated_at = ?
       WHERE id = ?`,
      [
        updatedCategory.name,
        updatedCategory.color,
        updatedCategory.icon || null,
        updatedCategory.parentId || null,
        updatedCategory.updatedAt.toISOString(),
        id,
      ]
    );

    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // First, check if any tasks are using this category
    const tasksResult = await this.db.executeSql('SELECT COUNT(*) as count FROM tasks WHERE category_id = ?', [id]);
    const taskCount = tasksResult[0].rows.item(0).count;

    if (taskCount > 0) {
      // Option 1: Prevent deletion if tasks exist
      throw new Error(`Cannot delete category. ${taskCount} tasks are using this category.`);
      
      // Option 2: Alternatively, you could set tasks to null category:
      // await this.db.executeSql('UPDATE tasks SET category_id = NULL WHERE category_id = ?', [id]);
    }

    // Check for child categories
    const childrenResult = await this.db.executeSql('SELECT COUNT(*) as count FROM categories WHERE parent_id = ?', [id]);
    const childCount = childrenResult[0].rows.item(0).count;

    if (childCount > 0) {
      throw new Error(`Cannot delete category. It has ${childCount} subcategories.`);
    }

    await this.db.executeSql('DELETE FROM categories WHERE id = ?', [id]);
  }

  async getCategoriesWithTaskCount(): Promise<Array<Category & { taskCount: number }>> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.executeSql(`
      SELECT c.*, COUNT(t.id) as task_count
      FROM categories c
      LEFT JOIN tasks t ON c.id = t.category_id
      GROUP BY c.id
      ORDER BY c.name
    `);

    const categories: Array<Category & { taskCount: number }> = [];

    for (let i = 0; i < results[0].rows.length; i++) {
      const row = results[0].rows.item(i);
      const category = this.mapDatabaseCategoryToCategory(row);
      categories.push({
        ...category,
        taskCount: row.task_count || 0,
      });
    }

    return categories;
  }

  async getSubcategories(parentId: string): Promise<Category[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.executeSql('SELECT * FROM categories WHERE parent_id = ? ORDER BY name', [parentId]);
    const categories: Category[] = [];

    for (let i = 0; i < results[0].rows.length; i++) {
      const row: DatabaseCategory = results[0].rows.item(i);
      categories.push(this.mapDatabaseCategoryToCategory(row));
    }

    return categories;
  }

  async getRootCategories(): Promise<Category[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.executeSql('SELECT * FROM categories WHERE parent_id IS NULL ORDER BY name');
    const categories: Category[] = [];

    for (let i = 0; i < results[0].rows.length; i++) {
      const row: DatabaseCategory = results[0].rows.item(i);
      categories.push(this.mapDatabaseCategoryToCategory(row));
    }

    return categories;
  }

  // Helper methods
  private mapDatabaseTaskToTask(dbTask: DatabaseTask): Task {
    return {
      id: dbTask.id,
      title: dbTask.title,
      description: dbTask.description || undefined,
      status: dbTask.status as TaskStatus,
      priority: dbTask.priority as TaskPriority,
      categoryId: dbTask.category_id || undefined,
      dueDate: dbTask.due_date ? new Date(dbTask.due_date) : undefined,
      createdAt: new Date(dbTask.created_at),
      updatedAt: new Date(dbTask.updated_at),
      completedAt: dbTask.completed_at ? new Date(dbTask.completed_at) : undefined,
    };
  }

  private mapDatabaseCategoryToCategory(dbCategory: DatabaseCategory): Category {
    return {
      id: dbCategory.id,
      name: dbCategory.name,
      color: dbCategory.color,
      icon: dbCategory.icon || undefined,
      parentId: dbCategory.parent_id || undefined,
      createdAt: new Date(dbCategory.created_at),
      updatedAt: new Date(dbCategory.updated_at),
    };
  }

  async getTaskStats(): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const totalResult = await this.db.executeSql('SELECT COUNT(*) as count FROM tasks');
    const completedResult = await this.db.executeSql('SELECT COUNT(*) as count FROM tasks WHERE status = ?', [TaskStatus.COMPLETED]);
    const overdueResult = await this.db.executeSql(
      'SELECT COUNT(*) as count FROM tasks WHERE due_date < ? AND status != ?',
      [new Date().toISOString(), TaskStatus.COMPLETED]
    );

    const total = totalResult[0].rows.item(0).count;
    const completed = completedResult[0].rows.item(0).count;
    const overdue = overdueResult[0].rows.item(0).count;

    return {
      totalTasks: total,
      completedTasks: completed,
      pendingTasks: total - completed,
      overdueTasks: overdue,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }
}

export const databaseService = new DatabaseService();
export default databaseService;
