import 'package:json_annotation/json_annotation.dart';

/// Priority levels for todos
enum Priority {
  @JsonValue('low')
  low,
  @JsonValue('medium')
  medium,
  @JsonValue('high')
  high,
}

extension PriorityExtensions on Priority {
  /// Get numeric value for sorting (higher = more urgent)
  int get sortValue {
    switch (this) {
      case Priority.low:
        return 0;
      case Priority.medium:
        return 1;
      case Priority.high:
        return 2;
    }
  }

  /// Get display name for the priority
  String get displayName {
    switch (this) {
      case Priority.low:
        return 'Low';
      case Priority.medium:
        return 'Medium';
      case Priority.high:
        return 'High';
    }
  }
}

