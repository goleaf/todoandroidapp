// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Russian (`ru`).
class AppLocalizationsRu extends AppLocalizations {
  AppLocalizationsRu([String locale = 'ru']) : super(locale);

  @override
  String get appTitle => 'Универсальное приложение TODO';

  @override
  String get addTask => 'Добавить задачу';

  @override
  String get editTask => 'Редактировать задачу';

  @override
  String get deleteTask => 'Удалить задачу';

  @override
  String get confirmDelete => 'Вы уверены, что хотите удалить эту задачу?';

  @override
  String get filterAll => 'Все';

  @override
  String get filterActive => 'Активные';

  @override
  String get filterCompleted => 'Выполненные';

  @override
  String get priorityLow => 'Низкий';

  @override
  String get priorityMedium => 'Средний';

  @override
  String get priorityHigh => 'Высокий';

  @override
  String get themeLight => 'Светлая';

  @override
  String get themeDark => 'Тёмная';

  @override
  String get themeSystem => 'Системная';

  @override
  String get languageEnglish => 'English';

  @override
  String get languageRussian => 'Русский';

  @override
  String get languageSystem => 'Системная';

  @override
  String get export => 'Экспорт JSON';

  @override
  String get exportSuccess => 'Задачи экспортированы в буфер обмена';

  @override
  String get import => 'Импорт JSON';

  @override
  String get importSuccess => 'Задачи успешно импортированы';

  @override
  String get importConfirm => 'Это заменит все текущие задачи. Продолжить?';

  @override
  String get importFailed =>
      'Не удалось импортировать задачи. Проверьте формат JSON.';

  @override
  String get settings => 'Настройки';

  @override
  String get title => 'Название';

  @override
  String get description => 'Описание';

  @override
  String get dueDate => 'Срок выполнения';

  @override
  String get priority => 'Приоритет';

  @override
  String get selectDate => 'Выбрать дату';

  @override
  String get save => 'Сохранить';

  @override
  String get cancel => 'Отмена';

  @override
  String get emptyTasks => 'Задач пока нет';

  @override
  String get emptyTasksDescription => 'Добавьте задачу, чтобы начать';

  @override
  String get emptyFiltered => 'Нет задач, соответствующих фильтрам';

  @override
  String get search => 'Поиск...';

  @override
  String get sortBy => 'Сортировать по';

  @override
  String get sortDueDate => 'Дате выполнения';

  @override
  String get sortPriority => 'Приоритету';

  @override
  String get sortCreated => 'Дате создания';

  @override
  String get titleRequired => 'Название обязательно';
}
