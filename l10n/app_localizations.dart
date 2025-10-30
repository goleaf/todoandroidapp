import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_ru.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('ru')
  ];

  /// Application title
  ///
  /// In en, this message translates to:
  /// **'Universal TODO App'**
  String get appTitle;

  /// Button to add a new task
  ///
  /// In en, this message translates to:
  /// **'Add Task'**
  String get addTask;

  /// Button to edit a task
  ///
  /// In en, this message translates to:
  /// **'Edit Task'**
  String get editTask;

  /// Button to delete a task
  ///
  /// In en, this message translates to:
  /// **'Delete Task'**
  String get deleteTask;

  /// Confirmation message for task deletion
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to delete this task?'**
  String get confirmDelete;

  /// Filter to show all tasks
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get filterAll;

  /// Filter to show active tasks
  ///
  /// In en, this message translates to:
  /// **'Active'**
  String get filterActive;

  /// Filter to show completed tasks
  ///
  /// In en, this message translates to:
  /// **'Completed'**
  String get filterCompleted;

  /// Low priority label
  ///
  /// In en, this message translates to:
  /// **'Low'**
  String get priorityLow;

  /// Medium priority label
  ///
  /// In en, this message translates to:
  /// **'Medium'**
  String get priorityMedium;

  /// High priority label
  ///
  /// In en, this message translates to:
  /// **'High'**
  String get priorityHigh;

  /// Light theme option
  ///
  /// In en, this message translates to:
  /// **'Light'**
  String get themeLight;

  /// Dark theme option
  ///
  /// In en, this message translates to:
  /// **'Dark'**
  String get themeDark;

  /// System theme option
  ///
  /// In en, this message translates to:
  /// **'System'**
  String get themeSystem;

  /// English language option
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get languageEnglish;

  /// Russian language option
  ///
  /// In en, this message translates to:
  /// **'Русский'**
  String get languageRussian;

  /// System language option
  ///
  /// In en, this message translates to:
  /// **'System'**
  String get languageSystem;

  /// Button to export tasks to clipboard
  ///
  /// In en, this message translates to:
  /// **'Export JSON'**
  String get export;

  /// Success message for export
  ///
  /// In en, this message translates to:
  /// **'Tasks exported to clipboard'**
  String get exportSuccess;

  /// Button to import tasks from clipboard
  ///
  /// In en, this message translates to:
  /// **'Import JSON'**
  String get import;

  /// Success message for import
  ///
  /// In en, this message translates to:
  /// **'Tasks imported successfully'**
  String get importSuccess;

  /// Confirmation message for import
  ///
  /// In en, this message translates to:
  /// **'This will replace all current tasks. Continue?'**
  String get importConfirm;

  /// Error message for import failure
  ///
  /// In en, this message translates to:
  /// **'Failed to import tasks. Please check the JSON format.'**
  String get importFailed;

  /// Settings page title
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settings;

  /// Task title field label
  ///
  /// In en, this message translates to:
  /// **'Title'**
  String get title;

  /// Task description field label
  ///
  /// In en, this message translates to:
  /// **'Description'**
  String get description;

  /// Due date field label
  ///
  /// In en, this message translates to:
  /// **'Due Date'**
  String get dueDate;

  /// Priority field label
  ///
  /// In en, this message translates to:
  /// **'Priority'**
  String get priority;

  /// Date picker button
  ///
  /// In en, this message translates to:
  /// **'Select Date'**
  String get selectDate;

  /// Save button
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get save;

  /// Cancel button
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// Empty state message
  ///
  /// In en, this message translates to:
  /// **'No tasks yet'**
  String get emptyTasks;

  /// Empty state description
  ///
  /// In en, this message translates to:
  /// **'Add a task to get started'**
  String get emptyTasksDescription;

  /// Empty filtered results message
  ///
  /// In en, this message translates to:
  /// **'No tasks match your filters'**
  String get emptyFiltered;

  /// Search placeholder
  ///
  /// In en, this message translates to:
  /// **'Search...'**
  String get search;

  /// Sort dropdown label
  ///
  /// In en, this message translates to:
  /// **'Sort By'**
  String get sortBy;

  /// Sort by due date
  ///
  /// In en, this message translates to:
  /// **'Due Date'**
  String get sortDueDate;

  /// Sort by priority
  ///
  /// In en, this message translates to:
  /// **'Priority'**
  String get sortPriority;

  /// Sort by created date
  ///
  /// In en, this message translates to:
  /// **'Created'**
  String get sortCreated;

  /// Validation error for empty title
  ///
  /// In en, this message translates to:
  /// **'Title is required'**
  String get titleRequired;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'ru'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'ru':
      return AppLocalizationsRu();
  }

  throw FlutterError(
      'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}
