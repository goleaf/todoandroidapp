import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:universal_todo_app/generated/l10n/app_localizations.dart';
import 'package:universal_todo_app/features/todos/presentation/providers/todos_providers.dart';
import 'package:universal_todo_app/features/todos/domain/models/todo_filter.dart';

class FiltersBar extends ConsumerWidget {
  const FiltersBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final currentFilter = ref.watch(todoFilterProvider);

    return SegmentedButton<TodoFilter>(
      segments: [
        ButtonSegment(
          value: TodoFilter.all,
          label: Text(l10n.filterAll),
        ),
        ButtonSegment(
          value: TodoFilter.active,
          label: Text(l10n.filterActive),
        ),
        ButtonSegment(
          value: TodoFilter.completed,
          label: Text(l10n.filterCompleted),
        ),
      ],
      selected: {currentFilter},
      onSelectionChanged: (Set<TodoFilter> selection) {
        ref.read(todoFilterProvider.notifier).state = selection.first;
      },
    );
  }
}

