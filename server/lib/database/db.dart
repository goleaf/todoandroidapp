import 'package:postgres/postgres.dart';
import 'package:dotenv/dotenv.dart';

class Database {
  static PostgreSQLConnection? _connection;
  static final DotEnv _env = DotEnv(includePlatformEnvironment: true);

  static Future<PostgreSQLConnection> get connection async {
    if (_connection != null) return _connection!;
    
    _connection = PostgreSQLConnection(
      _env['DB_HOST'] ?? '127.0.0.1',
      int.parse(_env['DB_PORT'] ?? '5432'),
      _env['DB_NAME'] ?? 'todo_db',
      username: _env['DB_USER'] ?? 'todo_user',
      password: _env['DB_PASSWORD'] ?? 'todo_password',
    );
    
    await _connection!.open();
    await _initDatabase();
    
    return _connection!;
  }

  static Future<void> _initDatabase() async {
    // Create users table
    await _connection!.execute('''
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    ''');

    // Create todos table
    await _connection!.execute('''
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        due_date TIMESTAMP,
        priority VARCHAR(20) DEFAULT 'medium',
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    ''');

    print('✅ Database initialized');
  }

  static Future<void> close() async {
    await _connection?.close();
    _connection = null;
  }
}

