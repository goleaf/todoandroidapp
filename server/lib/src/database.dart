import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:sqlite3/sqlite3.dart';

/// Provides access to the on-disk SQLite database that stores user data.
class DatabaseProvider {
  /// Lazily created singleton instance of the database provider.
  static final DatabaseProvider _instance = DatabaseProvider._internal();

  /// Location of the SQLite database file.
  final String _databasePath = p.join(
    Directory.current.path,
    'server',
    'data',
    'todo_server.db',
  );

  /// Internal cached database connection.
  Database? _database;

  DatabaseProvider._internal();

  /// Exposes the singleton instance to the rest of the server.
  factory DatabaseProvider() => _instance;

  /// Opens the SQLite database and ensures that tables exist.
  Database get database {
    _database ??= _openAndMigrate();
    return _database!;
  }

  /// Closes the database connection when the server shuts down.
  void close() {
    _database?.dispose();
    _database = null;
  }

  /// Opens the database file and creates missing tables.
  Database _openAndMigrate() {
    final dbDirectory = Directory(p.dirname(_databasePath));
    if (!dbDirectory.existsSync()) {
      dbDirectory.createSync(recursive: true);
    }

    final db = sqlite3.open(_databasePath);

    // Create the `users` table for registered accounts.
    db.execute(
      'CREATE TABLE IF NOT EXISTS users ('
      ' id TEXT PRIMARY KEY,'
      ' email TEXT UNIQUE NOT NULL,'
      ' name TEXT NOT NULL,'
      ' password_hash TEXT NOT NULL,'
      ' salt TEXT NOT NULL,'
      ' created_at TEXT NOT NULL'
      ')',
    );

    // Create the `tokens` table used to keep login sessions.
    db.execute(
      'CREATE TABLE IF NOT EXISTS tokens ('
      ' token TEXT PRIMARY KEY,'
      ' user_id TEXT NOT NULL,'
      ' created_at TEXT NOT NULL,'
      ' FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE'
      ')',
    );

    return db;
  }
}
