import * as SQLite from 'expo-sqlite';
import { Todo, Category, Goal, Analytics } from '../types';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('todoapp.db');
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const createTables = `
      -- Categories table
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        icon TEXT NOT NULL,
        parent_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (parent_id) REFERENCES categories (id)
      );

      -- Todos table
      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        completed INTEGER NOT NULL DEFAULT 0,
        priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
        status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'cancelled')),
        due_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        category_id TEXT,
        parent_id TEXT,
        estimated_time INTEGER,
        actual_time INTEGER,
        voice_memo TEXT,
        custom_fields TEXT,
        FOREIGN KEY (category_id) REFERENCES categories (id),
        FOREIGN KEY (parent_id) REFERENCES todos (id)
      );

      -- Tags table
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        color TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      -- Todo tags junction table
      CREATE TABLE IF NOT EXISTS todo_tags (
        todo_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        PRIMARY KEY (todo_id, tag_id),
        FOREIGN KEY (todo_id) REFERENCES todos (id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
      );

      -- Attachments table
      CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY,
        todo_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('image', 'document', 'audio', 'video')),
        uri TEXT NOT NULL,
        name TEXT NOT NULL,
        size INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (todo_id) REFERENCES todos (id) ON DELETE CASCADE
      );

      -- Locations table
      CREATE TABLE IF NOT EXISTS locations (
        id TEXT PRIMARY KEY,
        todo_id TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        address TEXT,
        radius REAL,
        FOREIGN KEY (todo_id) REFERENCES todos (id) ON DELETE CASCADE
      );

      -- Recurring configs table
      CREATE TABLE IF NOT EXISTS recurring_configs (
        id TEXT PRIMARY KEY,
        todo_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly', 'yearly', 'custom')),
        interval_value INTEGER NOT NULL,
        days_of_week TEXT,
        end_date TEXT,
        max_occurrences INTEGER,
        FOREIGN KEY (todo_id) REFERENCES todos (id) ON DELETE CASCADE
      );

      -- Goals table
      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        target_date TEXT NOT NULL,
        progress REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      -- Goal todos junction table
      CREATE TABLE IF NOT EXISTS goal_todos (
        goal_id TEXT NOT NULL,
        todo_id TEXT NOT NULL,
        PRIMARY KEY (goal_id, todo_id),
        FOREIGN KEY (goal_id) REFERENCES goals (id) ON DELETE CASCADE,
        FOREIGN KEY (todo_id) REFERENCES todos (id) ON DELETE CASCADE
      );

      -- Analytics table
      CREATE TABLE IF NOT EXISTS analytics (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        total_tasks INTEGER NOT NULL DEFAULT 0,
        completed_tasks INTEGER NOT NULL DEFAULT 0,
        completion_rate REAL NOT NULL DEFAULT 0,
        average_completion_time REAL NOT NULL DEFAULT 0,
        productivity_score REAL NOT NULL DEFAULT 0,
        streak_days INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      -- User settings table
      CREATE TABLE IF NOT EXISTS user_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      -- Sync metadata table
      CREATE TABLE IF NOT EXISTS sync_metadata (
        table_name TEXT PRIMARY KEY,
        last_sync TEXT NOT NULL,
        sync_token TEXT
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_todos_category_id ON todos (category_id);
      CREATE INDEX IF NOT EXISTS idx_todos_parent_id ON todos (parent_id);
      CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos (due_date);
      CREATE INDEX IF NOT EXISTS idx_todos_status ON todos (status);
      CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos (priority);
      CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos (completed);
      CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories (parent_id);
      CREATE INDEX IF NOT EXISTS idx_attachments_todo_id ON attachments (todo_id);
      CREATE INDEX IF NOT EXISTS idx_locations_todo_id ON locations (todo_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics (date);
    `;

    await this.db.execAsync(createTables);
  }

  // Category CRUD operations
  async createCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = this.generateId();
    const now = new Date().toISOString();

    await this.db.runAsync(
      `INSERT INTO categories (id, name, color, icon, parent_id, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, category.name, category.color, category.icon, category.parentId || null, now, now]
    );

    return id;
  }

  async getCategories(): Promise<Category[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(`
      SELECT * FROM categories ORDER BY name ASC
    `);

    return result.map(this.mapRowToCategory);
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const fields = [];
    const values = [];

    if (updates.name) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.color) {
      fields.push('color = ?');
      values.push(updates.color);
    }
    if (updates.icon) {
      fields.push('icon = ?');
      values.push(updates.icon);
    }
    if (updates.parentId !== undefined) {
      fields.push('parent_id = ?');
      values.push(updates.parentId);
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    await this.db.runAsync(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async deleteCategory(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // First, update todos to remove category reference
    await this.db.runAsync('UPDATE todos SET category_id = NULL WHERE category_id = ?', [id]);
    
    // Then delete the category
    await this.db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
  }

  // Todo CRUD operations
  async createTodo(todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = this.generateId();
    const now = new Date().toISOString();

    await this.db.runAsync(
      `INSERT INTO todos (
        id, title, description, completed, priority, status, due_date,
        created_at, updated_at, category_id, parent_id, estimated_time,
        actual_time, voice_memo, custom_fields
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, todo.title, todo.description || null, todo.completed ? 1 : 0,
        todo.priority, todo.status, todo.dueDate?.toISOString() || null,
        now, now, todo.categoryId || null, todo.parentId || null,
        todo.estimatedTime || null, todo.actualTime || null,
        todo.voiceMemo || null, JSON.stringify(todo.customFields || {})
      ]
    );

    // Handle tags
    if (todo.tags && todo.tags.length > 0) {
      await this.addTagsToTodo(id, todo.tags);
    }

    // Handle attachments
    if (todo.attachments && todo.attachments.length > 0) {
      for (const attachment of todo.attachments) {
        await this.addAttachmentToTodo(id, attachment);
      }
    }

    // Handle location
    if (todo.location) {
      await this.addLocationToTodo(id, todo.location);
    }

    // Handle recurring config
    if (todo.recurring) {
      await this.addRecurringConfigToTodo(id, todo.recurring);
    }

    return id;
  }

  async getTodos(filters?: {
    categoryId?: string;
    status?: string;
    priority?: string;
    completed?: boolean;
    parentId?: string;
  }): Promise<Todo[]> {
    if (!this.db) throw new Error('Database not initialized');

    let query = `
      SELECT t.*, c.name as category_name, c.color as category_color
      FROM todos t
      LEFT JOIN categories c ON t.category_id = c.id
    `;

    const conditions = [];
    const values = [];

    if (filters) {
      if (filters.categoryId) {
        conditions.push('t.category_id = ?');
        values.push(filters.categoryId);
      }
      if (filters.status) {
        conditions.push('t.status = ?');
        values.push(filters.status);
      }
      if (filters.priority) {
        conditions.push('t.priority = ?');
        values.push(filters.priority);
      }
      if (filters.completed !== undefined) {
        conditions.push('t.completed = ?');
        values.push(filters.completed ? 1 : 0);
      }
      if (filters.parentId !== undefined) {
        if (filters.parentId === null) {
          conditions.push('t.parent_id IS NULL');
        } else {
          conditions.push('t.parent_id = ?');
          values.push(filters.parentId);
        }
      }
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY t.created_at DESC';

    const result = await this.db.getAllAsync(query, values);
    const todos = [];

    for (const row of result) {
      const todo = await this.mapRowToTodo(row);
      todos.push(todo);
    }

    return todos;
  }

  async updateTodo(id: string, updates: Partial<Todo>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const fields = [];
    const values = [];

    if (updates.title) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.completed !== undefined) {
      fields.push('completed = ?');
      values.push(updates.completed ? 1 : 0);
    }
    if (updates.priority) {
      fields.push('priority = ?');
      values.push(updates.priority);
    }
    if (updates.status) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.dueDate !== undefined) {
      fields.push('due_date = ?');
      values.push(updates.dueDate?.toISOString() || null);
    }
    if (updates.categoryId !== undefined) {
      fields.push('category_id = ?');
      values.push(updates.categoryId);
    }
    if (updates.estimatedTime !== undefined) {
      fields.push('estimated_time = ?');
      values.push(updates.estimatedTime);
    }
    if (updates.actualTime !== undefined) {
      fields.push('actual_time = ?');
      values.push(updates.actualTime);
    }
    if (updates.customFields) {
      fields.push('custom_fields = ?');
      values.push(JSON.stringify(updates.customFields));
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    await this.db.runAsync(
      `UPDATE todos SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async deleteTodo(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Delete related data first (cascading deletes should handle this, but being explicit)
    await this.db.runAsync('DELETE FROM todo_tags WHERE todo_id = ?', [id]);
    await this.db.runAsync('DELETE FROM attachments WHERE todo_id = ?', [id]);
    await this.db.runAsync('DELETE FROM locations WHERE todo_id = ?', [id]);
    await this.db.runAsync('DELETE FROM recurring_configs WHERE todo_id = ?', [id]);
    await this.db.runAsync('DELETE FROM goal_todos WHERE todo_id = ?', [id]);
    
    // Delete the todo
    await this.db.runAsync('DELETE FROM todos WHERE id = ?', [id]);
  }

  // Helper methods
  private async addTagsToTodo(todoId: string, tags: string[]): Promise<void> {
    if (!this.db) return;

    for (const tagName of tags) {
      // Create tag if it doesn't exist
      const tagId = await this.createOrGetTag(tagName);
      
      // Link tag to todo
      await this.db.runAsync(
        'INSERT OR IGNORE INTO todo_tags (todo_id, tag_id) VALUES (?, ?)',
        [todoId, tagId]
      );
    }
  }

  private async createOrGetTag(name: string): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    // Check if tag exists
    const existing = await this.db.getFirstAsync(
      'SELECT id FROM tags WHERE name = ?',
      [name]
    );

    if (existing) {
      return (existing as any).id;
    }

    // Create new tag
    const id = this.generateId();
    const now = new Date().toISOString();
    
    await this.db.runAsync(
      'INSERT INTO tags (id, name, color, created_at) VALUES (?, ?, ?, ?)',
      [id, name, this.getRandomColor(), now]
    );

    return id;
  }

  private async addAttachmentToTodo(todoId: string, attachment: any): Promise<void> {
    if (!this.db) return;

    const id = this.generateId();
    const now = new Date().toISOString();

    await this.db.runAsync(
      'INSERT INTO attachments (id, todo_id, type, uri, name, size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, todoId, attachment.type, attachment.uri, attachment.name, attachment.size, now]
    );
  }

  private async addLocationToTodo(todoId: string, location: any): Promise<void> {
    if (!this.db) return;

    const id = this.generateId();

    await this.db.runAsync(
      'INSERT INTO locations (id, todo_id, latitude, longitude, address, radius) VALUES (?, ?, ?, ?, ?, ?)',
      [id, todoId, location.latitude, location.longitude, location.address || null, location.radius || null]
    );
  }

  private async addRecurringConfigToTodo(todoId: string, recurring: any): Promise<void> {
    if (!this.db) return;

    const id = this.generateId();

    await this.db.runAsync(
      `INSERT INTO recurring_configs (id, todo_id, type, interval_value, days_of_week, end_date, max_occurrences) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id, todoId, recurring.type, recurring.interval,
        recurring.daysOfWeek ? JSON.stringify(recurring.daysOfWeek) : null,
        recurring.endDate?.toISOString() || null,
        recurring.maxOccurrences || null
      ]
    );
  }

  private async mapRowToTodo(row: any): Promise<Todo> {
    if (!this.db) throw new Error('Database not initialized');

    // Get tags
    const tagRows = await this.db.getAllAsync(`
      SELECT t.name FROM tags t
      JOIN todo_tags tt ON t.id = tt.tag_id
      WHERE tt.todo_id = ?
    `, [row.id]);
    const tags = tagRows.map((t: any) => t.name);

    // Get attachments
    const attachmentRows = await this.db.getAllAsync(
      'SELECT * FROM attachments WHERE todo_id = ?',
      [row.id]
    );
    const attachments = attachmentRows.map((a: any) => ({
      id: a.id,
      type: a.type,
      uri: a.uri,
      name: a.name,
      size: a.size,
      createdAt: new Date(a.created_at)
    }));

    // Get location
    const locationRow = await this.db.getFirstAsync(
      'SELECT * FROM locations WHERE todo_id = ?',
      [row.id]
    );
    const location = locationRow ? {
      latitude: (locationRow as any).latitude,
      longitude: (locationRow as any).longitude,
      address: (locationRow as any).address,
      radius: (locationRow as any).radius
    } : undefined;

    // Get recurring config
    const recurringRow = await this.db.getFirstAsync(
      'SELECT * FROM recurring_configs WHERE todo_id = ?',
      [row.id]
    );
    const recurring = recurringRow ? {
      type: (recurringRow as any).type,
      interval: (recurringRow as any).interval_value,
      daysOfWeek: (recurringRow as any).days_of_week ? JSON.parse((recurringRow as any).days_of_week) : undefined,
      endDate: (recurringRow as any).end_date ? new Date((recurringRow as any).end_date) : undefined,
      maxOccurrences: (recurringRow as any).max_occurrences
    } : undefined;

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      completed: Boolean(row.completed),
      priority: row.priority,
      status: row.status,
      dueDate: row.due_date ? new Date(row.due_date) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      categoryId: row.category_id,
      parentId: row.parent_id,
      tags,
      attachments,
      location,
      estimatedTime: row.estimated_time,
      actualTime: row.actual_time,
      recurring,
      voiceMemo: row.voice_memo,
      customFields: row.custom_fields ? JSON.parse(row.custom_fields) : {}
    };
  }

  private mapRowToCategory(row: any): Category {
    return {
      id: row.id,
      name: row.name,
      color: row.color,
      icon: row.icon,
      parentId: row.parent_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getRandomColor(): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Analytics methods
  async getAnalytics(dateRange?: { start: Date; end: Date }): Promise<Analytics> {
    if (!this.db) throw new Error('Database not initialized');

    const today = new Date();
    const startDate = dateRange?.start || new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = dateRange?.end || today;

    // Get basic stats
    const totalTasks = await this.db.getFirstAsync(
      'SELECT COUNT(*) as count FROM todos WHERE created_at BETWEEN ? AND ?',
      [startDate.toISOString(), endDate.toISOString()]
    );

    const completedTasks = await this.db.getFirstAsync(
      'SELECT COUNT(*) as count FROM todos WHERE completed = 1 AND created_at BETWEEN ? AND ?',
      [startDate.toISOString(), endDate.toISOString()]
    );

    const totalCount = (totalTasks as any)?.count || 0;
    const completedCount = (completedTasks as any)?.count || 0;
    const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    // Calculate average completion time
    const avgTimeResult = await this.db.getFirstAsync(
      'SELECT AVG(actual_time) as avg_time FROM todos WHERE completed = 1 AND actual_time IS NOT NULL'
    );
    const averageCompletionTime = (avgTimeResult as any)?.avg_time || 0;

    // Calculate productivity score (simplified)
    const productivityScore = Math.min(100, completionRate + (averageCompletionTime > 0 ? 20 : 0));

    // Get category stats
    const categoryStatsRows = await this.db.getAllAsync(`
      SELECT 
        c.id as categoryId,
        c.name as categoryName,
        COUNT(t.id) as totalTasks,
        COUNT(CASE WHEN t.completed = 1 THEN 1 END) as completedTasks,
        AVG(CASE WHEN t.completed = 1 THEN t.actual_time END) as averageTime
      FROM categories c
      LEFT JOIN todos t ON c.id = t.category_id
      WHERE t.created_at BETWEEN ? AND ?
      GROUP BY c.id, c.name
    `, [startDate.toISOString(), endDate.toISOString()]);

    const categoryStats = categoryStatsRows.map((row: any) => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      totalTasks: row.totalTasks || 0,
      completedTasks: row.completedTasks || 0,
      averageTime: row.averageTime || 0
    }));

    return {
      totalTasks: totalCount,
      completedTasks: completedCount,
      completionRate,
      averageCompletionTime,
      productivityScore,
      streakDays: 0, // TODO: Implement streak calculation
      categoryStats,
      weeklyProgress: [] // TODO: Implement weekly progress
    };
  }

  // Close database connection
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

export const databaseService = new DatabaseService();
export default databaseService;
