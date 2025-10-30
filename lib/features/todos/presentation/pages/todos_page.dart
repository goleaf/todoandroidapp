import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:universal_todo_app/core/utils/responsive.dart';
import 'package:universal_todo_app/generated/l10n/app_localizations.dart';
import 'package:universal_todo_app/state/todos_provider.dart';
import 'package:universal_todo_app/features/todos/presentation/widgets/empty_state.dart';
import 'package:universal_todo_app/features/todos/presentation/widgets/filters_bar.dart';
import 'package:universal_todo_app/features/todos/presentation/widgets/task_item.dart';
import 'package:universal_todo_app/features/todos/presentation/widgets/toolbar.dart';

import '../../domain/todo.dart';

class TodosPage extends ConsumerStatefulWidget {
  const TodosPage({super.key});

  @override
  ConsumerState<TodosPage> createState() => _TodosPageState();
}

class _TodosPageState extends ConsumerState<TodosPage> {
  void _addTask() {
    context.push('/task/new');
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final todos = ref.watch(searchedAndSortedTodosProvider);
    final isMobile = isMobile(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.appTitle),
        actions: [
          const Toolbar(),
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () => context.push('/settings'),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: FiltersBar(),
          ),
          Expanded(
            child: todos.isEmpty
                ? const EmptyState(isFiltered: true)
                : ListView.builder(
                    itemCount: todos.length,
                    itemBuilder: (context, index) {
                      return TaskItem(todo: todos[index]);
                    },
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _addTask,
        icon: const Icon(Icons.add),
        label: Text(l10n.addTask),
      ),
    );
  }
}

