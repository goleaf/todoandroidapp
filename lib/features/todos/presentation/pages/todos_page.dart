import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:universal_todo_app/core/utils/responsive.dart';
import 'package:universal_todo_app/generated/l10n/app_localizations.dart';
import 'package:universal_todo_app/features/todos/presentation/providers/todos_providers.dart';
import 'package:universal_todo_app/features/todos/presentation/widgets/empty_state.dart';
import 'package:universal_todo_app/features/todos/presentation/widgets/filters_bar.dart';
import 'package:universal_todo_app/features/todos/presentation/widgets/task_item.dart';
import 'package:universal_todo_app/features/todos/presentation/widgets/toolbar.dart';
import 'package:universal_todo_app/state/auth_provider.dart';

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
    final todosAsync = ref.watch(displayedTodosProvider);
    final authState = ref.watch(authStateProvider);
    final userInitials = authState.user != null && authState.user!.name.isNotEmpty
        ? authState.user!.name
            .trim()
            .split(' ')
            .where((part) => part.isNotEmpty)
            .map((part) => part[0].toUpperCase())
            .take(2)
            .join()
        : '';
    final isMobile = isMobile(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.appTitle),
        actions: [
          const Toolbar(),
          if (authState.user != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: PopupMenuButton<String>(
                tooltip: 'Account',
                onSelected: (value) {
                  if (value == 'logout') {
                    ref.read(authStateProvider.notifier).logout();
                  }
                },
                itemBuilder: (context) => [
                  PopupMenuItem<String>(
                    value: 'logout',
                    child: const Text('Sign out'),
                  ),
                ],
                child: CircleAvatar(
                  child: Text(userInitials.isEmpty ? authState.user!.name[0].toUpperCase() : userInitials),
                ),
              ),
            ),
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
            child: todosAsync.when(
              data: (todos) => todos.isEmpty
                  ? const EmptyState(isFiltered: true)
                  : ListView.builder(
                      itemCount: todos.length,
                      itemBuilder: (context, index) {
                        return TaskItem(todo: todos[index]);
                      },
                    ),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline, size: 48),
                    const SizedBox(height: 16),
                    Text('Error: $error'),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => ref.refresh(displayedTodosProvider),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
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

