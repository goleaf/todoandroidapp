import 'package:flutter_test/flutter_test.dart';
import 'package:universal_todo_app/features/todos/data/todo_repository.dart';
import 'package:universal_todo_app/features/todos/domain/todo.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  group('TodoRepository', () {
    late SharedPreferencesTodosRepository repository;

    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      repository = SharedPreferencesTodosRepository();
    });

    test('should start with empty list', () async {
      final todos = await repository.getAllTodos();
      expect(todos, isEmpty);
    });

    test('should save and retrieve todos', () async {
      final todo = Todo(
        id: '1',
        title: 'Test Todo',
        description: 'Test Description',
        dueDate: DateTime.now(),
        priority: Priority.high,
        completed: false,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await repository.saveTodo(todo);
      final todos = await repository.getAllTodos();

      expect(todos.length, 1);
      expect(todos.first.title, 'Test Todo');
      expect(todos.first.id, '1');
    });

    test('should update existing todo', () async {
      final todo = Todo(
        id: '1',
        title: 'Original Title',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await repository.saveTodo(todo);
      final updated = todo.copyWith(title: 'Updated Title');
      await repository.saveTodo(updated);

      final todos = await repository.getAllTodos();
      expect(todos.length, 1);
      expect(todos.first.title, 'Updated Title');
    });

    test('should delete todo', () async {
      final todo1 = Todo(
        id: '1',
        title: 'Todo 1',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final todo2 = Todo(
        id: '2',
        title: 'Todo 2',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await repository.saveTodo(todo1);
      await repository.saveTodo(todo2);
      await repository.deleteTodo('1');

      final todos = await repository.getAllTodos();
      expect(todos.length, 1);
      expect(todos.first.id, '2');
    });

    test('should handle JSON serialization round-trip', () async {
      final original = Todo(
        id: 'test-id',
        title: 'Test',
        description: 'Description',
        dueDate: DateTime(2024, 1, 1),
        priority: Priority.medium,
        completed: true,
        createdAt: DateTime(2024, 1, 1),
        updatedAt: DateTime(2024, 1, 2),
      );

      final json = original.toJson();
      final restored = Todo.fromJson(json);

      expect(restored.id, original.id);
      expect(restored.title, original.title);
      expect(restored.description, original.description);
      expect(restored.dueDate, original.dueDate);
      expect(restored.priority, original.priority);
      expect(restored.completed, original.completed);
      expect(restored.createdAt, original.createdAt);
      expect(restored.updatedAt, original.updatedAt);
    });

    test('should clear all todos', () async {
      final todo1 = Todo(
        id: '1',
        title: 'Todo 1',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final todo2 = Todo(
        id: '2',
        title: 'Todo 2',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await repository.saveTodo(todo1);
      await repository.saveTodo(todo2);
      await repository.clearAllTodos();

      final todos = await repository.getAllTodos();
      expect(todos, isEmpty);
    });
  });
}

