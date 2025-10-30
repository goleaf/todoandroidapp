import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:universal_todo_app/features/todos/data/database/app_database.dart';
import 'package:universal_todo_app/features/todos/data/repositories/drift_todo_repository.dart';
import 'package:universal_todo_app/features/todos/domain/models/todo.dart';
import 'package:universal_todo_app/features/todos/domain/models/todo_filter.dart';
import 'package:universal_todo_app/features/todos/domain/models/todo_sort.dart';
import 'package:universal_todo_app/features/todos/domain/repositories/todo_repository.dart';

/// Database provider
final appDatabaseProvider = Provider<AppDatabase>((ref) {
  final db = AppDatabase();
  ref.onDispose(() => db.close());
  return db;
});

/// Repository provider
final todoRepositoryProvider =
    Provider<TodoRepository>((ref) => DriftTodoRepository(ref.watch(appDatabaseProvider)));

/// Filter provider
final todoFilterProvider = StateProvider<TodoFilter>((ref) => TodoFilter.all);

/// Sort provider
final todoSortProvider = StateProvider<TodoSort>((ref) => TodoSort.createdAt);

/// Search query provider
final searchQueryProvider = StateProvider<String>((ref) => '');

/// Watch all todos stream
final todosStreamProvider = StreamProvider<List<Todo>>((ref) {
  final repository = ref.watch(todoRepositoryProvider);
  return repository.watchTodos();
});

/// Filtered todos provider
final filteredTodosProvider = Provider<AsyncValue<List<Todo>>>((ref) {
  final allTodos = ref.watch(todosStreamProvider);
  final filter = ref.watch(todoFilterProvider);

  return allTodos.whenData(
    (todos) => todos.where((todo) => filter.matches(todo.completed)).toList(),
  );
});

/// Searched and sorted todos provider
final displayedTodosProvider = Provider<AsyncValue<List<Todo>>>((ref) {
  final filtered = ref.watch(filteredTodosProvider);
  final query = ref.watch(searchQueryProvider);
  final sort = ref.watch(todoSortProvider);

  return filtered.whenData(
    (todos) {
      // Apply search filter
      var results = todos;
      if (query.isNotEmpty) {
        final lowerQuery = query.toLowerCase();
        results = results.where((todo) {
          return todo.title.toLowerCase().contains(lowerQuery) ||
              (todo.description?.toLowerCase().contains(lowerQuery) ?? false);
        }).toList();
      }

      // Apply sort
      results.sort((a, b) {
        switch (sort) {
          case TodoSort.createdAt:
            return b.createdAt.compareTo(a.createdAt);
          case TodoSort.dueDate:
            if (a.dueDate == null && b.dueDate == null) return 0;
            if (a.dueDate == null) return 1;
            if (b.dueDate == null) return -1;
            return a.dueDate!.compareTo(b.dueDate!);
          case TodoSort.priority:
            return b.priority.sortValue.compareTo(a.priority.sortValue);
        }
      });

      return results;
    },
  );
});

/// Todo actions provider
final todoActionsProvider = Provider<TodoActions>((ref) {
  final repository = ref.watch(todoRepositoryProvider);
  return TodoActions(repository);
});

/// Actions class for todo operations
class TodoActions {
  final TodoRepository _repository;

  TodoActions(this._repository);

  Future<void> addTodo(Todo todo) async {
    await _repository.createTodo(todo);
  }

  Future<void> updateTodo(Todo todo) async {
    await _repository.updateTodo(todo);
  }

  Future<void> deleteTodo(String id) async {
    await _repository.deleteTodo(id);
  }

  Future<void> toggleTodo(String id) async {
    await _repository.toggleTodo(id);
  }

  Future<void> deleteCompleted() async {
    await _repository.deleteCompleted();
  }

  Future<String> exportToJson() async {
    return await _repository.exportToJson();
  }

  Future<int> importFromJson(String json) async {
    return await _repository.importFromJson(json);
  }
}

