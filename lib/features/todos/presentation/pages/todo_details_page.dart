import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:universal_todo_app/generated/l10n/app_localizations.dart';
import 'package:universal_todo_app/state/todos_provider.dart';
import 'package:universal_todo_app/features/todos/presentation/widgets/task_editor.dart';

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
  void _saveTodo(Todo todo) {
    if (widget.taskId == 'new') {
      ref.read(todosProvider.notifier).addTodo(todo);
    } else {
      ref.read(todosProvider.notifier).updateTodo(todo);
    }
    if (mounted) {
      context.pop();
    }
  }

  void _deleteTodo(String id) {
    ref.read(todosProvider.notifier).deleteTodo(id);
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
    final todos = ref.watch(todosProvider);
    final isNew = widget.taskId == 'new';
    
    Todo? initialTodo;
    if (!isNew) {
      try {
        initialTodo = todos.firstWhere((t) => t.id == widget.taskId);
      } catch (e) {
        // Task not found, navigate back
        WidgetsBinding.instance.addPostFrameCallback((_) {
          context.pop();
        });
      }
    }

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
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: TaskEditor(
          initialTodo: initialTodo,
          onCancel: () => context.pop(),
          onSave: _saveTodo,
        ),
      ),
    );
  }
}

