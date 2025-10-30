import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:universal_todo_app/features/todos/data/database/app_database.dart';
import 'package:universal_todo_app/features/todos/data/repositories/drift_todo_repository.dart';
import 'package:universal_todo_app/features/todos/domain/models/todo.dart';
import 'package:universal_todo_app/features/todos/domain/models/priority.dart';
import 'package:universal_todo_app/features/todos/domain/models/todo_filter.dart';
import 'package:universal_todo_app/features/todos/domain/models/todo_sort.dart';
import 'package:universal_todo_app/features/todos/presentation/providers/todos_providers.dart';

void main() {
  group('TodosProviders', () {
    late AppDatabase database;

    setUp(() async {
      database = AppDatabase(createInMemoryDatabase());
    });

    tearDown(() async {
      await database.close();
    });

    test('todoFilterProvider starts with all filter', () {
      final container = ProviderContainer();
      final filter = container.read(todoFilterProvider);
      container.dispose();
      expect(filter, TodoFilter.all);
    });

    test('todoSortProvider starts with createdAt sort', () {
      final container = ProviderContainer();
      final sort = container.read(todoSortProvider);
      container.dispose();
      expect(sort, TodoSort.createdAt);
    });

    test('todoActionsProvider can add and retrieve todo', () async {
      final container = ProviderContainer(
        overrides: [
          appDatabaseProvider.overrideWithValue(database),
        ],
      );

      final actions = container.read(todoActionsProvider);
      final todo = Todo.create(
        title: 'Test Todo',
        priority: Priority.high,
      );

      await actions.addTodo(todo);

      final todosAsync = container.read(displayedTodosProvider);
      final todos = await todosAsync.value;

      expect(todos, isNotNull);
      expect(todos!.length, 1);
      expect(todos.first.title, 'Test Todo');
      expect(todos.first.priority, Priority.high);

      container.dispose();
    });

    test('todoActionsProvider can update todo', () async {
      final container = ProviderContainer(
        overrides: [
          appDatabaseProvider.overrideWithValue(database),
        ],
      );

      final actions = container.read(todoActionsProvider);
      final todo = Todo.create(title: 'Original');

      final id = await actions.addTodo(todo);
      final retrieved = await container.read(todoRepositoryProvider).getTodoById(id);

      expect(retrieved, isNotNull);

      final updated = retrieved!.copyWith(
        title: 'Updated',
        updatedAt: DateTime.now(),
      );
      await actions.updateTodo(updated);

      final todosAsync = container.read(displayedTodosProvider);
      final todos = await todosAsync.value;

      expect(todos, isNotNull);
      expect(todos!.length, 1);
      expect(todos.first.title, 'Updated');

      container.dispose();
    });

    test('todoActionsProvider can delete todo', () async {
      final container = ProviderContainer(
        overrides: [
          appDatabaseProvider.overrideWithValue(database),
        ],
      );

      final actions = container.read(todoActionsProvider);
      final todo1 = Todo.create(title: 'Todo 1');
      final todo2 = Todo.create(title: 'Todo 2');

      final id1 = await actions.addTodo(todo1);
      await actions.addTodo(todo2);
      await actions.deleteTodo(id1);

      final todosAsync = container.read(displayedTodosProvider);
      final todos = await todosAsync.value;

      expect(todos, isNotNull);
      expect(todos!.length, 1);
      expect(todos.first.title, 'Todo 2');

      container.dispose();
    });

    test('todoActionsProvider can toggle todo completion', () async {
      final container = ProviderContainer(
        overrides: [
          appDatabaseProvider.overrideWithValue(database),
        ],
      );

      final actions = container.read(todoActionsProvider);
      final todo = Todo.create(title: 'Test');

      final id = await actions.addTodo(todo);
      await actions.toggleTodo(id);

      final todosAsync = container.read(displayedTodosProvider);
      final todos = await todosAsync.value;

      expect(todos, isNotNull);
      expect(todos!.first.completed, true);

      container.dispose();
    });

    group('Filtering', () {
      late ProviderContainer container;

      setUp(() async {
        container = ProviderContainer(
          overrides: [
            appDatabaseProvider.overrideWithValue(database),
          ],
        );

        final actions = container.read(todoActionsProvider);
        await actions.addTodo(Todo.create(title: 'Active 1'));
        await actions.addTodo(Todo.create(title: 'Active 2'));
        
        final completed = Todo.create(title: 'Completed 1', completed: true);
        await actions.addTodo(completed);
        await actions.toggleTodo(completed.id);
      });

      tearDown(() {
        container.dispose();
      });

      test('should filter all todos', () async {
        container.read(todoFilterProvider.notifier).state = TodoFilter.all;
        final filtered = container.read(filteredTodosProvider);
        final todos = await filtered.value;
        
        expect(todos, isNotNull);
        expect(todos!.length, 3);
      });

      test('should filter active todos', () async {
        container.read(todoFilterProvider.notifier).state = TodoFilter.active;
        final filtered = container.read(filteredTodosProvider);
        final todos = await filtered.value;
        
        expect(todos, isNotNull);
        expect(todos!.length, 2);
        expect(todos!.every((t) => !t.completed), true);
      });

      test('should filter completed todos', () async {
        container.read(todoFilterProvider.notifier).state = TodoFilter.completed;
        final filtered = container.read(filteredTodosProvider);
        final todos = await filtered.value;
        
        expect(todos, isNotNull);
        expect(todos!.length, 1);
        expect(todos!.first.completed, true);
      });
    });

    group('Search', () {
      late ProviderContainer container;

      setUp(() async {
        container = ProviderContainer(
          overrides: [
            appDatabaseProvider.overrideWithValue(database),
          ],
        );

        final actions = container.read(todoActionsProvider);
        await actions.addTodo(Todo.create(
          title: 'Flutter is great',
          description: 'Mobile app framework',
        ));
        await actions.addTodo(Todo.create(
          title: 'React is nice',
          description: 'Web framework',
        ));
      });

      tearDown(() {
        container.dispose();
      });

      test('should search by title', () async {
        container.read(searchQueryProvider.notifier).state = 'Flutter';
        final results = container.read(displayedTodosProvider);
        final todos = await results.value;
        
        expect(todos, isNotNull);
        expect(todos!.length, 1);
        expect(todos!.first.title, 'Flutter is great');
      });

      test('should search by description', () async {
        container.read(searchQueryProvider.notifier).state = 'Mobile';
        final results = container.read(displayedTodosProvider);
        final todos = await results.value;
        
        expect(todos, isNotNull);
        expect(todos!.length, 1);
        expect(todos!.first.description, 'Mobile app framework');
      });
    });

    group('Sorting', () {
      late ProviderContainer container;

      setUp() async {
        container = ProviderContainer(
          overrides: [
            appDatabaseProvider.overrideWithValue(database),
          ],
        );

        final actions = container.read(todoActionsProvider);
        await actions.addTodo(Todo.create(
          title: 'Last',
          createdAt: DateTime.now().subtract(const Duration(days: 1)),
        ));
        await actions.addTodo(Todo.create(
          title: 'First',
        ));
        await actions.addTodo(Todo.create(
          title: 'Middle',
          priority: Priority.high,
          createdAt: DateTime.now().subtract(const Duration(hours: 1)),
        ));
      }

      tearDown() {
        container.dispose();
      }

      test('should sort by created date descending', () async {
        container.read(todoSortProvider.notifier).state = TodoSort.createdAt;
        final sorted = container.read(displayedTodosProvider);
        final todos = await sorted.value;
        
        expect(todos, isNotNull);
        expect(todos!.first.title, 'First');
        expect(todos!.last.title, 'Last');
      });

      test('should sort by priority', () async {
        container.read(todoSortProvider.notifier).state = TodoSort.priority;
        final sorted = container.read(displayedTodosProvider);
        final todos = await sorted.value;
        
        expect(todos, isNotNull);
        expect(todos!.first.title, 'Middle');
        expect(todos!.first.priority, Priority.high);
      });
    });
  });
}
