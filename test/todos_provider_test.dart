import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:universal_todo_app/features/todos/data/todo_repository.dart';
import 'package:universal_todo_app/features/todos/domain/todo.dart';
import 'package:universal_todo_app/state/todos_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  group('TodosProvider', () {
    late ProviderContainer container;

    setUp(() {
      SharedPreferences.setMockInitialValues({});
      container = ProviderContainer();
    });

    tearDown(() {
      container.dispose();
    });

    test('should start with empty todos', () {
      final todos = container.read(todosProvider);
      expect(todos, isEmpty);
    });

    test('should add todo', () async {
      final notifier = container.read(todosProvider.notifier);
      final todo = Todo(
        id: '1',
        title: 'Test',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await notifier.addTodo(todo);

      final todos = container.read(todosProvider);
      expect(todos.length, 1);
      expect(todos.first.title, 'Test');
    });

    test('should update todo', () async {
      final notifier = container.read(todosProvider.notifier);
      final todo = Todo(
        id: '1',
        title: 'Original',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await notifier.addTodo(todo);
      
      final updated = todo.copyWith(title: 'Updated');
      await notifier.updateTodo(updated);

      final todos = container.read(todosProvider);
      expect(todos.first.title, 'Updated');
    });

    test('should delete todo', () async {
      final notifier = container.read(todosProvider.notifier);
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

      await notifier.addTodo(todo1);
      await notifier.addTodo(todo2);
      await notifier.deleteTodo('1');

      final todos = container.read(todosProvider);
      expect(todos.length, 1);
      expect(todos.first.id, '2');
    });

    test('should toggle todo completion', () async {
      final notifier = container.read(todosProvider.notifier);
      final todo = Todo(
        id: '1',
        title: 'Test',
        completed: false,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await notifier.addTodo(todo);
      await notifier.toggleTodo('1');

      final todos = container.read(todosProvider);
      expect(todos.first.completed, true);
    });

    group('Filtering', () {
      setUp(() async {
        final notifier = container.read(todosProvider.notifier);
        await notifier.addTodo(Todo(
          id: '1',
          title: 'Active 1',
          completed: false,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ));
        await notifier.addTodo(Todo(
          id: '2',
          title: 'Active 2',
          completed: false,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ));
        await notifier.addTodo(Todo(
          id: '3',
          title: 'Completed 1',
          completed: true,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ));
      });

      test('should filter all todos', () {
        container.read(todoFilterProvider.notifier).state = TodoFilter.all;
        final filtered = container.read(filteredTodosProvider);
        expect(filtered.length, 3);
      });

      test('should filter active todos', () {
        container.read(todoFilterProvider.notifier).state = TodoFilter.active;
        final filtered = container.read(filteredTodosProvider);
        expect(filtered.length, 2);
        expect(filtered.every((t) => !t.completed), true);
      });

      test('should filter completed todos', () {
        container.read(todoFilterProvider.notifier).state = TodoFilter.completed;
        final filtered = container.read(filteredTodosProvider);
        expect(filtered.length, 1);
        expect(filtered.first.completed, true);
      });
    });

    group('Search', () {
      setUp(() async {
        final notifier = container.read(todosProvider.notifier);
        await notifier.addTodo(Todo(
          id: '1',
          title: 'Flutter is great',
          description: 'Mobile app framework',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ));
        await notifier.addTodo(Todo(
          id: '2',
          title: 'React is nice',
          description: 'Web framework',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ));
      });

      test('should search by title', () {
        container.read(searchQueryProvider.notifier).state = 'Flutter';
        final results = container.read(searchedAndSortedTodosProvider);
        expect(results.length, 1);
        expect(results.first.title, 'Flutter is great');
      });

      test('should search by description', () {
        container.read(searchQueryProvider.notifier).state = 'Mobile';
        final results = container.read(searchedAndSortedTodosProvider);
        expect(results.length, 1);
        expect(results.first.description, 'Mobile app framework');
      });
    });

    group('Sorting', () {
      setUp() async {
        final notifier = container.read(todosProvider.notifier);
        await notifier.addTodo(Todo(
          id: '3',
          title: 'Last',
          createdAt: DateTime.now().subtract(const Duration(days: 1)),
          updatedAt: DateTime.now(),
        ));
        await notifier.addTodo(Todo(
          id: '1',
          title: 'First',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ));
        await notifier.addTodo(Todo(
          id: '2',
          title: 'Middle',
          priority: Priority.high,
          createdAt: DateTime.now().subtract(const Duration(hours: 1)),
          updatedAt: DateTime.now(),
        ));
      });

      test('should sort by created date descending', () {
        container.read(sortModeProvider.notifier).state = SortMode.createdAt;
        final sorted = container.read(searchedAndSortedTodosProvider);
        expect(sorted.first.id, '1');
        expect(sorted.last.id, '3');
      });

      test('should sort by priority', () {
        container.read(sortModeProvider.notifier).state = SortMode.priority;
        final sorted = container.read(searchedAndSortedTodosProvider);
        expect(sorted.first.id, '2');
        expect(sorted.first.priority, Priority.high);
      });
    });
  });
}

