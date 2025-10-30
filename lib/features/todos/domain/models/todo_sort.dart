import 'package:universal_todo_app/features/todos/domain/models/priority.dart';

/// Sort options for todos list
enum TodoSort {
  createdAt,
  dueDate,
  priority,
}

extension TodoSortExtensions on TodoSort {
  /// Get display name for the sort option
  String get displayName {
    switch (this) {
      case TodoSort.createdAt:
        return 'Created';
      case TodoSort.dueDate:
        return 'Due Date';
      case TodoSort.priority:
        return 'Priority';
    }
  }
}

