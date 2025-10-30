import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:universal_todo_app/generated/l10n/app_localizations.dart';
import 'package:universal_todo_app/features/todos/presentation/providers/todos_providers.dart';
import 'package:universal_todo_app/features/todos/presentation/widgets/task_editor.dart';
import 'package:universal_todo_app/features/todos/domain/models/todo.dart';

class TodoDetailsPage extends ConsumerStatefulWidget {
  final String taskId;

  const TodoDetailsPage({
    super.key,
    required this.taskId,
  });

  @override
  ConsumerState<TodoDetailsPage> createState() => _TodoDetailsPageState();
}

class _TodoDetailsPageState extends ConsumerState<TodoDetailsPage> {
  Future<void> _saveTodo(Todo todo) async {
    final actions = ref.read(todoActionsProvider);
    if (widget.taskId == 'new') {
      await actions.addTodo(todo);
    } else {
      await actions.updateTodo(todo);
    }
    if (mounted) {
      context.pop();
    }
  }

  Future<void> _deleteTodo(String id) async {
    await ref.read(todoActionsProvider).deleteTodo(id);
    if (mounted) {
      context.pop();
    }
  }

  Future<void> _confirmDelete(String id, AppLocalizations l10n) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.deleteTask),
        content: Text(l10n.confirmDelete),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text(l10n.cancel),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(
              foregroundColor: Theme.of(context).colorScheme.error,
            ),
            child: Text(l10n.deleteTask),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      _deleteTodo(id);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final todosAsync = ref.watch(todosStreamProvider);
    final isNew = widget.taskId == 'new';

    return Scaffold(
      appBar: AppBar(
        title: Text(isNew ? l10n.addTask : l10n.editTask),
        actions: !isNew
            ? [
                IconButton(
                  icon: const Icon(Icons.delete),
                  onPressed: () => _confirmDelete(widget.taskId, l10n),
                  tooltip: l10n.deleteTask,
                ),
              ]
            : null,
      ),
      body: todosAsync.when(
        data: (todos) {
          Todo? initialTodo;
          if (!isNew) {
            try {
              initialTodo = todos.firstWhere((t) => t.id == widget.taskId);
            } catch (e) {
              // Task not found, navigate back
              WidgetsBinding.instance.addPostFrameCallback((_) {
                context.pop();
              });
              return const Center(child: CircularProgressIndicator());
            }
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: TaskEditor(
              initialTodo: initialTodo,
              onCancel: () => context.pop(),
              onSave: _saveTodo,
            ),
          );
        },
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
                onPressed: () => context.pop(),
                child: const Text('Back'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

