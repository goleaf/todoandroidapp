import 'package:flutter_test/flutter_test.dart';
import 'package:universal_todo_app/features/todos/data/database/app_database.dart';
import 'package:universal_todo_app/features/todos/data/repositories/drift_todo_repository.dart';
import 'package:universal_todo_app/features/todos/domain/models/todo.dart';
import 'package:universal_todo_app/features/todos/domain/models/priority.dart';

void main() {
  group('DriftTodoRepository', () {
    late AppDatabase database;
    late DriftTodoRepository repository;

    setUp(() async {
      database = AppDatabase(createInMemoryDatabase());
      repository = DriftTodoRepository(database);
    });

    tearDown(() async {
      await database.close();
    });

    test('should start with empty list', () async {
      final todos = await repository.getAllTodos();
      expect(todos, isEmpty);
    });

    test('should create and retrieve todo', () async {
      final todo = Todo.create(
        title: 'Test Todo',
        description: 'Test Description',
        dueDate: DateTime.now(),
        priority: Priority.high,
      );

      final id = await repository.createTodo(todo);
      final todos = await repository.getAllTodos();

      expect(todos.length, 1);
      expect(todos.first.title, 'Test Todo');
      expect(todos.first.id, id);
    });

    test('should update existing todo', () async {
      final todo = Todo.create(
        title: 'Original Title',
        priority: Priority.low,
      );

      final id = await repository.createTodo(todo);
      final retrieved = await repository.getTodoById(id);
      expect(retrieved, isNotNull);

      final updated = retrieved!.copyWith(
        title: 'Updated Title',
        priority: Priority.high,
        updatedAt: DateTime.now(),
      );
      await repository.updateTodo(updated);

      final todos = await repository.getAllTodos();
      expect(todos.length, 1);
      expect(todos.first.title, 'Updated Title');
      expect(todos.first.priority, Priority.high);
    });

    test('should delete todo', () async {
      final todo1 = Todo.create(title: 'Todo 1');
      final todo2 = Todo.create(title: 'Todo 2');

      final id1 = await repository.createTodo(todo1);
      final id2 = await repository.createTodo(todo2);
      await repository.deleteTodo(id1);

      final todos = await repository.getAllTodos();
      expect(todos.length, 1);
      expect(todos.first.id, id2);
    });

    test('should toggle todo completion', () async {
      final todo = Todo.create(title: 'Test');
      expect(todo.completed, false);

      final id = await repository.createTodo(todo);
      await repository.toggleTodo(id);

      final retrieved = await repository.getTodoById(id);
      expect(retrieved?.completed, true);

      await repository.toggleTodo(id);
      final again = await repository.getTodoById(id);
      expect(again?.completed, false);
    });

    test('should delete all completed todos', () async {
      final todo1 = Todo.create(title: 'Todo 1');
      final todo2 = Todo.create(title: 'Todo 2');

      final id1 = await repository.createTodo(todo1);
      await repository.createTodo(todo2);

      await repository.toggleTodo(id1);
      await repository.deleteCompleted();

      final todos = await repository.getAllTodos();
      expect(todos.length, 1);
      expect(todos.first.title, 'Todo 2');
    });

    test('should handle JSON export', () async {
      final todo1 = Todo.create(title: 'Todo 1');
      final todo2 = Todo.create(title: 'Todo 2');

      await repository.createTodo(todo1);
      await repository.createTodo(todo2);

      final json = await repository.exportToJson();
      expect(json, isNotEmpty);
      expect(json, contains('todos'));
      expect(json, contains('version'));
    });

    test('should handle JSON import', () async {
      final json = '''
{
  "version": "1.0",
  "todos": [
    {
      "id": "test-1",
      "title": "Imported Todo 1",
      "description": "Description",
      "dueDate": "2024-01-01T00:00:00.000Z",
      "priority": "high",
      "completed": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
''';

      final count = await repository.importFromJson(json);
      expect(count, 1);

      final todos = await repository.getAllTodos();
      expect(todos.length, 1);
      expect(todos.first.title, 'Imported Todo 1');
    });

    test('should watch todos stream', () async {
      final stream = repository.watchTodos();
      expect(stream, isNotNull);

      // Initial empty state
      final initialTodos = await stream.first;
      expect(initialTodos, isEmpty);

      // Add todo
      final todo = Todo.create(title: 'Stream Test');
      await repository.createTodo(todo);

      // Check updated state
      final updatedTodos = await stream.first;
      expect(updatedTodos.length, 1);
      expect(updatedTodos.first.title, 'Stream Test');
    });
  });
}
