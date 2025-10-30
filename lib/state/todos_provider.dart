import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:universal_todo_app/features/todos/data/todo_repository.dart';
import 'package:universal_todo_app/features/todos/domain/todo.dart';

final todosRepositoryProvider = Provider<TodoRepository>((ref) {
  return SharedPreferencesTodosRepository();
});

enum TodoFilter {
  all,
  active,
  completed;

  bool shouldInclude(Todo todo) {
    switch (this) {
      case TodoFilter.all:
        return true;
      case TodoFilter.active:
        return !todo.completed;
      case TodoFilter.completed:
        return todo.completed;
    }
  }
}

enum SortMode {
  dueDate,
  priority,
  createdAt;
}

class TodosNotifier extends StateNotifier<List<Todo>> {
  TodosNotifier(this.repository) : super([]) {
    _loadTodos();
  }

  final TodoRepository repository;

  Future<void> _loadTodos() async {
    state = await repository.getAllTodos();
  }

  Future<void> addTodo(Todo todo) async {
    await repository.saveTodo(todo);
    state = await repository.getAllTodos();
  }

  Future<void> updateTodo(Todo todo) async {
    await repository.saveTodo(todo);
    state = await repository.getAllTodos();
  }

  Future<void> deleteTodo(String id) async {
    await repository.deleteTodo(id);
    state = await repository.getAllTodos();
  }

  Future<void> toggleTodo(String id) async {
    final todo = state.firstWhere((t) => t.id == id);
    final updated = todo.copyWith(completed: !todo.completed);
    await updateTodo(updated);
  }

  Future<void> clearAll() async {
    await repository.clearAllTodos();
    state = [];
  }
}

final todosProvider = StateNotifierProvider<TodosNotifier, List<Todo>>((ref) {
  final repository = ref.watch(todosRepositoryProvider);
  return TodosNotifier(repository);
});

final todoFilterProvider = StateProvider<TodoFilter>((ref) => TodoFilter.all);

final searchQueryProvider = StateProvider<String>((ref) => '');

final sortModeProvider = StateProvider<SortMode>((ref) => SortMode.createdAt);

final filteredTodosProvider = Provider<List<Todo>>((ref) {
  final todos = ref.watch(todosProvider);
  final filter = ref.watch(todoFilterProvider);
  
  return todos.where((todo) => filter.shouldInclude(todo)).toList();
});

final searchedAndSortedTodosProvider = Provider<List<Todo>>((ref) {
  final filteredTodos = ref.watch(filteredTodosProvider);
  final searchQuery = ref.watch(searchQueryProvider);
  final sortMode = ref.watch(sortModeProvider);

  var result = filteredTodos;

  // Apply search
  if (searchQuery.isNotEmpty) {
    final query = searchQuery.toLowerCase();
    result = result.where((todo) {
      return todo.title.toLowerCase().contains(query) ||
          (todo.description?.toLowerCase().contains(query) ?? false);
    }).toList();
  }

  // Apply sorting
  result.sort((a, b) {
    switch (sortMode) {
      case SortMode.dueDate:
        if (a.dueDate == null && b.dueDate == null) return 0;
        if (a.dueDate == null) return 1;
        if (b.dueDate == null) return -1;
        return a.dueDate!.compareTo(b.dueDate!);
      case SortMode.priority:
        final priorityOrder = {
          Priority.high: 0,
          Priority.medium: 1,
          Priority.low: 2,
        };
        return priorityOrder[a.priority]!.compareTo(priorityOrder[b.priority]!);
      case SortMode.createdAt:
        return b.createdAt.compareTo(a.createdAt);
    }
  });

  return result;
});

