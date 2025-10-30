import 'package:universal_todo_app/features/todos/data/database/app_database.dart';

/// Repository interface for todo operations
/// Implementations should provide:
/// - Reactive streams for real-time updates
/// - CRUD operations
/// - Import/export capabilities
abstract class TodoRepository {
  /// Watch all todos as a stream
  Stream<List<Todo>> watchTodos();

  /// Get all todos (synchronous)
  Future<List<Todo>> getAllTodos();

  /// Get a single todo by ID
  Future<Todo?> getTodoById(int id);

  /// Create a new todo
  Future<int> createTodo(Todo todo);

  /// Update an existing todo
  Future<void> updateTodo(Todo todo);

  /// Delete a todo
  Future<void> deleteTodo(int id);

  /// Toggle completion status
  Future<void> toggleTodo(int id);

  /// Delete completed todos
  Future<int> deleteCompleted();

  /// Export todos as JSON string
  Future<String> exportToJson();

  /// Import todos from JSON string
  /// Returns number of imported todos
  Future<int> importFromJson(String json);
}
