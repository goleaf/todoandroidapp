import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:universal_todo_app/generated/l10n/app_localizations.dart';
import 'package:universal_todo_app/state/todos_provider.dart';

import '../../domain/todo.dart';

class TaskItem extends ConsumerWidget {
  final Todo todo;

  const TaskItem({
    super.key,
    required this.todo,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: InkWell(
        onTap: () => context.push('/task/${todo.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Checkbox(
                value: todo.completed,
                onChanged: (_) {
                  ref.read(todosProvider.notifier).toggleTodo(todo.id);
                },
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      todo.title,
                      style: TextStyle(
                        decoration: todo.completed
                            ? TextDecoration.lineThrough
                            : null,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    if (todo.description != null && todo.description!.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          todo.description!,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: Theme.of(context)
                                    .colorScheme
                                    .onSurface
                                    .withOpacity(0.7),
                              ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: [
                        _PriorityChip(priority: todo.priority, l10n: l10n),
                        if (todo.dueDate != null) _DueDateChip(dueDate: todo.dueDate!),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PriorityChip extends StatelessWidget {
  final Priority priority;
  final AppLocalizations l10n;

  const _PriorityChip({
    required this.priority,
    required this.l10n,
  });

  Color get _color {
    switch (priority) {
      case Priority.low:
        return Colors.green;
      case Priority.medium:
        return Colors.orange;
      case Priority.high:
        return Colors.red;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Chip(
      label: Text(
        priority.getDisplayName(l10n),
        style: const TextStyle(fontSize: 12),
      ),
      backgroundColor: _color.withOpacity(0.1),
      labelStyle: TextStyle(color: _color),
      padding: EdgeInsets.zero,
      visualDensity: VisualDensity.compact,
    );
  }
}

class _DueDateChip extends StatelessWidget {
  final DateTime dueDate;

  const _DueDateChip({
    required this.dueDate,
  });

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final isOverdue = dueDate.isBefore(now) && dueDate.day < now.day;
    
    return Chip(
      label: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.calendar_today,
            size: 14,
            color: isOverdue ? Colors.red : null,
          ),
          const SizedBox(width: 4),
          Text(
            DateFormat('MMM dd, yyyy').format(dueDate),
            style: TextStyle(
              fontSize: 12,
              color: isOverdue ? Colors.red : null,
            ),
          ),
        ],
      ),
      backgroundColor: isOverdue
          ? Colors.red.withOpacity(0.1)
          : Theme.of(context).colorScheme.surfaceVariant,
      padding: EdgeInsets.zero,
      visualDensity: VisualDensity.compact,
    );
  }
}

