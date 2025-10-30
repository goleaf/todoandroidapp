/// Filter options for todos list
enum TodoFilter {
  all,
  active,
  completed,
}

extension TodoFilterExtensions on TodoFilter {
  /// Check if a todo matches this filter
  bool matches(bool completed) {
    switch (this) {
      case TodoFilter.all:
        return true;
      case TodoFilter.active:
        return !completed;
      case TodoFilter.completed:
        return completed;
    }
  }
  
  /// Get display name for the filter
  String get displayName {
    switch (this) {
      case TodoFilter.all:
        return 'All';
      case TodoFilter.active:
        return 'Active';
      case TodoFilter.completed:
        return 'Completed';
    }
  }
}

