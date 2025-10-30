import 'dart:async';
import 'dart:convert';
import 'package:drift/drift.dart';
import 'package:universal_todo_app/features/todos/domain/models/todo.dart';
import 'package:universal_todo_app/features/todos/domain/repositories/todo_repository.dart';
import 'package:universal_todo_app/features/todos/data/database/app_database.dart';
import 'package:universal_todo_app/features/todos/data/mappers/todo_mapper.dart';

/// Drift implementation of TodoRepository
class DriftTodoRepository implements TodoRepository {
  final AppDatabase _db;

  DriftTodoRepository(this._db);

  @override
  Stream<List<Todo>> watchTodos() {
    return _db.watchAllTodos().map(
      (rows) => rows.map((row) => TodoMapper.fromDb(row)).toList(),
    );
  }

  @override
  Future<List<Todo>> getAllTodos() async {
    final rows = await (_db.select(_db.todos)
          ..orderBy([(t) => OrderingTerm.desc(t.createdAt)]))
        .get();
    return rows.map((row) => TodoMapper.fromDb(row)).toList();
  }

  @override
  Future<Todo?> getTodoById(String id) async {
    final dbId = int.tryParse(id);
    if (dbId == null) return null;

    final row = await (_db.select(_db.todos)..where((t) => t.id.equals(dbId)))
        .getSingleOrNull();
    return row != null ? TodoMapper.fromDb(row) : null;
  }

  @override
  Future<String> createTodo(Todo todo) async {
    final companion = TodoMapper.toDb(todo);
    final insertedRow = await _db.into(_db.todos).insert(companion);
    return insertedRow.toString();
  }

  @override
  Future<void> updateTodo(Todo todo) async {
    final dbId = int.tryParse(todo.id);
    if (dbId == null) throw Exception('Invalid todo ID: ${todo.id}');

    final companion = TodoMapper.toDbUpdate(todo);
    await (_db.update(_db.todos)..where((t) => t.id.equals(dbId))).write(companion);
  }

  @override
  Future<void> deleteTodo(String id) async {
    final dbId = int.tryParse(id);
    if (dbId == null) return;

    await (_db.delete(_db.todos)..where((t) => t.id.equals(dbId))).go();
  }

  @override
  Future<void> toggleTodo(String id) async {
    final todo = await getTodoById(id);
    if (todo == null) return;

    final updated = todo.copyWith(
      completed: !todo.completed,
      updatedAt: DateTime.now(),
    );
    await updateTodo(updated);
  }

  @override
  Future<int> deleteCompleted() async {
    final deleted = await (_db.delete(_db.todos)
          ..where((t) => t.completed.equals(true)))
        .go();
    return deleted;
  }

  @override
  Future<String> exportToJson() async {
    final todos = await getAllTodos();
    final jsonList = todos.map((todo) => todo.toJson()).toList();
    return jsonEncode({
      'version': '1.0',
      'todos': jsonList,
    });
  }

  @override
  Future<int> importFromJson(String jsonString) async {
    try {
      final json = jsonDecode(jsonString) as Map<String, dynamic>;
      
      // Validate schema version
      final version = json['version'] as String?;
      if (version != '1.0') {
        throw Exception('Unsupported schema version: $version');
      }

      final todosList = json['todos'] as List;
      int imported = 0;

      // Use transaction for atomic import
      await _db.transaction(() async {
        for (final todoJson in todosList) {
          try {
            final todo = Todo.fromJson(todoJson as Map<String, dynamic>);
            await createTodo(todo);
            imported++;
          } catch (e) {
            // Skip invalid todos but continue importing
            print('Error importing todo: $e');
          }
        }
      });

      return imported;
    } catch (e) {
      throw Exception('Failed to import JSON: $e');
    }
  }
}

