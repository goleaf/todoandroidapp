import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:drift/web.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import 'package:flutter/foundation.dart' show kIsWeb;

part 'app_database.g.dart';

/// Drift table for todos
class Todos extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get title => text()();
  TextColumn get description => text().nullable()();
  IntColumn get dueDate => integer().nullable()();
  TextColumn get priority => text().withDefault(const Constant('medium'))();
  BoolColumn get completed => boolean().withDefault(const Constant(false))();
  IntColumn get createdAt => integer()();
  IntColumn get updatedAt => integer()();
}

@DriftDatabase(tables: [Todos])
class AppDatabase extends _$AppDatabase {
  AppDatabase([QueryExecutor? executor]) : super(executor ?? _openConnection());

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration {
    return MigrationStrategy(
      onCreate: (Migrator m) async {
        await m.createAll();
      },
      onUpgrade: (Migrator m, int from, int to) async {
        // Handle migrations when schema version changes
        if (from < 2) {
          // Example: add a new column
          // await m.addColumn(todos, todos.newColumn);
        }
      },
    );
  }

  /// Get all todos ordered by creation date
  Stream<List<TodosTable>> watchAllTodos() {
    return (select(todos)..orderBy([(t) => OrderingTerm.desc(t.createdAt)])).watch();
  }

  /// Get todos filtered by completion status
  Stream<List<TodosTable>> watchTodosFiltered(bool? completed) {
    if (completed == null) {
      return watchAllTodos();
    }
    final query = select(todos)..where((t) => t.completed.equals(completed));
    return query.watch();
  }

  /// Search todos by title or description
  Stream<List<TodosTable>> watchTodosSearching(String query) {
    final searchQuery = '%$query%';
    return (select(todos)
          ..where((t) =>
              t.title.like(searchQuery) | t.description.like(searchQuery)))
        .watch();
  }
}

QueryExecutor _openConnection() {
  if (kIsWeb) {
    // Web platform: use IndexedDB
    return WebDatabase('todos_db');
  }
  
  // Native platforms (iOS, Android, Desktop): use SQLite
  return LazyDatabase(() async {
    final dbFolder = await getApplicationDocumentsDirectory();
    final file = File(p.join(dbFolder.path, 'todos.db'));
    
    // Create database file if it doesn't exist
    if (!await file.exists()) {
      await file.create(recursive: true);
    }
    
    return NativeDatabase(
      file,
      // Log queries in debug mode
      logStatements: true,
    );
  });
}
