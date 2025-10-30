import 'dart:async';
import 'dart:convert';
import 'package:drift/drift.dart';
import 'package:universal_todo_app/features/todos/domain/repositories/todo_repository.dart';
import 'package:universal_todo_app/features/todos/data/database/app_database.dart';

/// Drift implementation of TodoRepository
class DriftTodoRepository implements TodoRepository {
  final AppDatabase _db;

  DriftTodoRepository(this._db);

  @override
  Stream<List<Todo>> watchTodos() {
    return _db.watchAllTodos();
  }

  @override
  Future<List<Todo>> getAllTodos() async {
    return await _db.watchAllTodos().first;
  }

  @override
  Future<Todo?> getTodoById(int id) async {
    final row = await (_db.select(_db.todos)..where((t) => t.id.equals(id)))
        .getSingleOrNull();
    return row;
  }

  @override
  Future<int> createTodo(Todo todo) async {
    final companion = TodosCompanion.insert(
      title: todo.title,
      description: Value(todo.description),
      dueDate: Value(todo.dueDate),
      priority: todo.priority,
      completed: todo.completed,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
    );
    return await _db.into(_db.todos).insert(companion);
  }

  @override
  Future<void> updateTodo(Todo todo) async {
    final companion = TodosCompanion(
      title: Value(todo.title),
      description: Value(todo.description),
      dueDate: Value(todo.dueDate),
      priority: Value(todo.priority),
      completed: Value(todo.completed),
      updatedAt: Value(todo.updatedAt),
    );
    await (_db.update(_db.todos)..where((t) => t.id.equals(todo.id))).write(companion);
  }

  @override
  Future<void> deleteTodo(int id) async {
    await (_db.delete(_db.todos)..where((t) => t.id.equals(id))).go();
  }

  @override
  Future<void> toggleTodo(int id) async {
    final todo = await getTodoById(id);
    if (todo == null) return;

    final now = DateTime.now().millisecondsSinceEpoch;
    final updated = todo.copyWith(
      completed: !todo.completed,
      updatedAt: now,
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
      
      final version = json['version'] as String?;
      if (version != '1.0') {
        throw Exception('Unsupported schema version: $version');
      }

      final todosList = json['todos'] as List;
      int imported = 0;

      await _db.transaction(() async {
        for (final todoJson in todosList) {
          try {
            final todo = Todo.fromJson(todoJson as Map<String, dynamic>);
            await createTodo(todo);
            imported++;
          } catch (e) {
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
