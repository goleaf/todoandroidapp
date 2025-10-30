import 'package:universal_todo_app/features/todos/domain/models/priority.dart';

/// Todo model with immutable properties
class Todo {
  final String id;
  final String title;
  final String? description;
  final DateTime? dueDate;
  final Priority priority;
  final bool completed;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Todo({
    required this.id,
    required this.title,
    this.description,
    this.dueDate,
    this.priority = Priority.medium,
    this.completed = false,
    required this.createdAt,
    required this.updatedAt,
  });

  /// Create a Todo with current timestamp
  factory Todo.create({
    required String title,
    String? description,
    DateTime? dueDate,
    Priority priority = Priority.medium,
  }) {
    final now = DateTime.now();
    return Todo(
      id: now.millisecondsSinceEpoch.toString(),
      title: title,
      description: description,
      dueDate: dueDate,
      priority: priority,
      completed: false,
      createdAt: now,
      updatedAt: now,
    );
  }

  /// Create a copy with updated fields
  Todo copyWith({
    String? id,
    String? title,
    String? description,
    DateTime? dueDate,
    Priority? priority,
    bool? completed,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Todo(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      dueDate: dueDate ?? this.dueDate,
      priority: priority ?? this.priority,
      completed: completed ?? this.completed,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  /// Check if todo is overdue
  bool get isOverdue {
    if (dueDate == null || completed) return false;
    return DateTime.now().isAfter(dueDate!);
  }

  /// Get days until due date
  int? get daysUntilDue {
    if (dueDate == null) return null;
    return dueDate!.difference(DateTime.now()).inDays;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'dueDate': dueDate?.toIso8601String(),
      'priority': priority.name,
      'completed': completed,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  factory Todo.fromJson(Map<String, dynamic> json) {
    return Todo(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      dueDate: json['dueDate'] != null
          ? DateTime.parse(json['dueDate'] as String)
          : null,
      priority: Priority.values.firstWhere(
        (p) => p.name == json['priority'],
        orElse: () => Priority.medium,
      ),
      completed: json['completed'] as bool,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Todo &&
        other.id == id &&
        other.title == title &&
        other.description == description &&
        other.dueDate == dueDate &&
        other.priority == priority &&
        other.completed == completed &&
        other.createdAt == createdAt &&
        other.updatedAt == updatedAt;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        title.hashCode ^
        (description?.hashCode ?? 0) ^
        (dueDate?.hashCode ?? 0) ^
        priority.hashCode ^
        completed.hashCode ^
        createdAt.hashCode ^
        updatedAt.hashCode;
  }
}

