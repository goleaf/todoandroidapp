import 'package:universal_todo_app/features/todos/domain/models/todo.dart';
import 'package:universal_todo_app/features/todos/domain/models/priority.dart';
import 'package:universal_todo_app/features/todos/data/database/app_database.dart';

/// Maps between Drift database models and domain models
class TodoMapper {
  /// Convert Drift table row to domain model
  static Todo fromDb(TodosTable row) {
    return Todo(
      id: row.id.toString(),
      title: row.title,
      description: row.description,
      dueDate: row.dueDate != null 
          ? DateTime.fromMillisecondsSinceEpoch(row.dueDate!) 
          : null,
      priority: _priorityFromString(row.priority),
      completed: row.completed,
      createdAt: DateTime.fromMillisecondsSinceEpoch(row.createdAt),
      updatedAt: DateTime.fromMillisecondsSinceEpoch(row.updatedAt),
    );
  }

  /// Convert domain model to Drift insertable
  static TodosCompanion toDb(Todo todo) {
    return TodosCompanion(
      id: todo.id != null && int.tryParse(todo.id) != null
          ? Value(int.parse(todo.id))
          : const Value.absent(),
      title: Value(todo.title),
      description: Value(todo.description),
      dueDate: Value(todo.dueDate?.millisecondsSinceEpoch),
      priority: Value(todo.priority.name),
      completed: Value(todo.completed),
      createdAt: Value(todo.createdAt.millisecondsSinceEpoch),
      updatedAt: Value(todo.updatedAt.millisecondsSinceEpoch),
    );
  }

  /// Convert domain model to Drift updateable
  static TodosCompanion toDbUpdate(Todo todo) {
    return TodosCompanion(
      title: Value(todo.title),
      description: Value(todo.description),
      dueDate: Value(todo.dueDate?.millisecondsSinceEpoch),
      priority: Value(todo.priority.name),
      completed: Value(todo.completed),
      updatedAt: Value(DateTime.now().millisecondsSinceEpoch),
    );
  }

  static Priority _priorityFromString(String priority) {
    switch (priority) {
      case 'low':
        return Priority.low;
      case 'high':
        return Priority.high;
      case 'medium':
      default:
        return Priority.medium;
    }
  }
}

