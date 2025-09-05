import * as SQLite from 'expo-sqlite';
import { Todo, Category, User, Project, Team, TaskTemplate, HabitTracker } from '../../types';

let database: SQLite.SQLiteDatabase | null = null;

export class SQLiteService {
  private static instance: SQLiteService;

  private constructor() {
    this.initializeDatabase();
  }

  public static getInstance(): SQLiteService {
    if (!SQLiteService.instance) {
      SQLiteService.instance = new SQLiteService();
    }
    return SQLiteService.instance;
  }

  private async initializeDatabase() {
    try {
      database = await SQLite.openDatabaseAsync('todoapp.db');
      await this.createTables();
      console.log('SQLite database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
    }
  }

  private async createTables() {
    if (!database) return;

    const tables = [
      // Todos table
      `CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        completed INTEGER DEFAULT 0,
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'not_started',
        due_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        category_id TEXT,
        parent_id TEXT,
        subtasks TEXT DEFAULT '[]',
        dependencies TEXT DEFAULT '[]',
        tags TEXT DEFAULT '[]',
        attachments TEXT DEFAULT '[]',
        location TEXT,
        estimated_time INTEGER,
        actual_time INTEGER,
        recurring TEXT,
        voice_memo TEXT,
        custom_fields TEXT DEFAULT '{}',
        template_id TEXT,
        assigned_to TEXT DEFAULT '[]',
        comments TEXT DEFAULT '[]',
        xp_reward INTEGER DEFAULT 10,
        difficulty_level INTEGER DEFAULT 1,
        is_archived INTEGER DEFAULT 0,
        completed_by TEXT,
        time_spent TEXT DEFAULT '[]',
        ai_suggestions TEXT DEFAULT '[]',
        sync_status TEXT DEFAULT 'pending'
      )`,

      // Categories table
      `CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        icon TEXT NOT NULL,
        parent_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        sync_status TEXT DEFAULT 'pending'
      )`,

      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT,
        display_name TEXT,
        avatar TEXT,
        preferences TEXT DEFAULT '{}',
        stats TEXT DEFAULT '{}',
        created_at TEXT NOT NULL,
        last_active_at TEXT NOT NULL,
        sync_status TEXT DEFAULT 'pending'
      )`,

      // Projects table
      `CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT NOT NULL,
        icon TEXT NOT NULL,
        team_id TEXT,
        owner_id TEXT NOT NULL,
        members TEXT DEFAULT '[]',
        todo_ids TEXT DEFAULT '[]',
        category_ids TEXT DEFAULT '[]',
        start_date TEXT,
        end_date TEXT,
        status TEXT DEFAULT 'planning',
        progress INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        sync_status TEXT DEFAULT 'pending'
      )`
    ];

    for (const tableSQL of tables) {
      await database.execAsync(tableSQL);
    }

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_todos_category_id ON todos(category_id)',
      'CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date)',
      'CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status)',
      'CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority)',
      'CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed)',
      'CREATE INDEX IF NOT EXISTS idx_todos_parent_id ON todos(parent_id)',
      'CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id)'
    ];

    for (const indexSQL of indexes) {
      await database.execAsync(indexSQL);
    }
  }

  // Generic CRUD operations
  async create<T extends { id: string }>(table: string, data: T): Promise<T> {
    if (!database) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const item = {
      ...data,
      created_at: now,
      updated_at: now,
      sync_status: 'pending'
    };

    // Convert objects to JSON strings for SQLite storage
    const columns = Object.keys(item);
    const values = Object.values(item).map(value => 
      typeof value === 'object' && value !== null ? JSON.stringify(value) : value
    );
    const placeholders = columns.map(() => '?').join(', ');

    await database.runAsync(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
      values
    );

    return item;
  }

  async update<T extends { id: string }>(table: string, id: string, updates: Partial<T>): Promise<T | null> {
    if (!database) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const updateData = {
      ...updates,
      updated_at: now,
      sync_status: 'pending'
    };

    const columns = Object.keys(updateData);
    const values = Object.values(updateData).map(value => 
      typeof value === 'object' && value !== null ? JSON.stringify(value) : value
    );
    const setClause = columns.map(col => `${col} = ?`).join(', ');

    await database.runAsync(
      `UPDATE ${table} SET ${setClause} WHERE id = ?`,
      [...values, id]
    );

    return this.getById(table, id);
  }

  async delete(table: string, id: string): Promise<boolean> {
    if (!database) throw new Error('Database not initialized');

    const result = await database.runAsync(`DELETE FROM ${table} WHERE id = ?`, [id]);
    return result.changes > 0;
  }

  async getById<T>(table: string, id: string): Promise<T | null> {
    if (!database) throw new Error('Database not initialized');

    const result = await database.getFirstAsync(`SELECT * FROM ${table} WHERE id = ?`, [id]);
    
    if (!result) return null;

    return this.parseResult(result) as T;
  }

  async getAll<T>(table: string, orderBy: string = 'created_at DESC'): Promise<T[]> {
    if (!database) throw new Error('Database not initialized');

    const results = await database.getAllAsync(`SELECT * FROM ${table} ORDER BY ${orderBy}`);
    
    return results.map(result => this.parseResult(result)) as T[];
  }

  async query<T>(table: string, conditions: Record<string, any>, orderBy: string = 'created_at DESC'): Promise<T[]> {
    if (!database) throw new Error('Database not initialized');

    const whereClause = Object.keys(conditions).map(key => `${key} = ?`).join(' AND ');
    const values = Object.values(conditions);

    const sql = `SELECT * FROM ${table}${whereClause ? ` WHERE ${whereClause}` : ''} ORDER BY ${orderBy}`;
    const results = await database.getAllAsync(sql, values);
    
    return results.map(result => this.parseResult(result)) as T[];
  }

  private parseResult(result: any): any {
    const parsed = { ...result };
    
    // Parse JSON fields
    const jsonFields = [
      'subtasks', 'dependencies', 'tags', 'attachments', 'custom_fields',
      'assigned_to', 'comments', 'time_spent', 'ai_suggestions',
      'preferences', 'stats', 'members', 'todo_ids', 'category_ids'
    ];

    jsonFields.forEach(field => {
      if (parsed[field] && typeof parsed[field] === 'string') {
        try {
          parsed[field] = JSON.parse(parsed[field]);
        } catch (e) {
          console.warn(`Failed to parse JSON field ${field}:`, e);
        }
      }
    });

    // Convert integer booleans back to booleans
    const booleanFields = [
      'completed', 'is_archived', 'is_active'
    ];

    booleanFields.forEach(field => {
      if (parsed[field] !== undefined) {
        parsed[field] = Boolean(parsed[field]);
      }
    });

    return parsed;
  }

  async searchTodos(searchTerm: string): Promise<Todo[]> {
    if (!database) throw new Error('Database not initialized');

    const results = await database.getAllAsync(
      `SELECT * FROM todos 
       WHERE title LIKE ? OR description LIKE ? 
       ORDER BY updated_at DESC`,
      [`%${searchTerm}%`, `%${searchTerm}%`]
    );

    return results.map(result => this.parseResult(result)) as Todo[];
  }

  async getTodosByCategory(categoryId: string): Promise<Todo[]> {
    return this.query<Todo>('todos', { category_id: categoryId });
  }

  async getOverdueTodos(): Promise<Todo[]> {
    if (!database) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const results = await database.getAllAsync(
      `SELECT * FROM todos 
       WHERE due_date < ? AND completed = 0 
       ORDER BY due_date ASC`,
      [now]
    );

    return results.map(result => this.parseResult(result)) as Todo[];
  }

  async getTodayTodos(): Promise<Todo[]> {
    if (!database) throw new Error('Database not initialized');

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    const results = await database.getAllAsync(
      `SELECT * FROM todos 
       WHERE due_date >= ? AND due_date < ? 
       ORDER BY due_date ASC`,
      [startOfDay, endOfDay]
    );

    return results.map(result => this.parseResult(result)) as Todo[];
  }

  async close(): Promise<void> {
    if (database) {
      await database.closeAsync();
      database = null;
    }
  }
}

export default SQLiteService.getInstance();
