// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'Universal TODO App';

  @override
  String get addTask => 'Add Task';

  @override
  String get editTask => 'Edit Task';

  @override
  String get deleteTask => 'Delete Task';

  @override
  String get confirmDelete => 'Are you sure you want to delete this task?';

  @override
  String get filterAll => 'All';

  @override
  String get filterActive => 'Active';

  @override
  String get filterCompleted => 'Completed';

  @override
  String get priorityLow => 'Low';

  @override
  String get priorityMedium => 'Medium';

  @override
  String get priorityHigh => 'High';

  @override
  String get themeLight => 'Light';

  @override
  String get themeDark => 'Dark';

  @override
  String get themeSystem => 'System';

  @override
  String get languageEnglish => 'English';

  @override
  String get languageRussian => 'Русский';

  @override
  String get languageSystem => 'System';

  @override
  String get export => 'Export JSON';

  @override
  String get exportSuccess => 'Tasks exported to clipboard';

  @override
  String get import => 'Import JSON';

  @override
  String get importSuccess => 'Tasks imported successfully';

  @override
  String get importConfirm => 'This will replace all current tasks. Continue?';

  @override
  String get importFailed =>
      'Failed to import tasks. Please check the JSON format.';

  @override
  String get settings => 'Settings';

  @override
  String get title => 'Title';

  @override
  String get description => 'Description';

  @override
  String get dueDate => 'Due Date';

  @override
  String get priority => 'Priority';

  @override
  String get selectDate => 'Select Date';

  @override
  String get save => 'Save';

  @override
  String get cancel => 'Cancel';

  @override
  String get emptyTasks => 'No tasks yet';

  @override
  String get emptyTasksDescription => 'Add a task to get started';

  @override
  String get emptyFiltered => 'No tasks match your filters';

  @override
  String get search => 'Search...';

  @override
  String get sortBy => 'Sort By';

  @override
  String get sortDueDate => 'Due Date';

  @override
  String get sortPriority => 'Priority';

  @override
  String get sortCreated => 'Created';

  @override
  String get titleRequired => 'Title is required';
}
