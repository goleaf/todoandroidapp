import 'package:flutter/material.dart';
import 'package:universal_todo_app/generated/l10n/app_localizations.dart';

class EmptyState extends StatelessWidget {
  final bool isFiltered;

  const EmptyState({
    super.key,
    this.isFiltered = false,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            isFiltered ? Icons.filter_alt_outlined : Icons.check_circle_outline,
            size: 64,
            color: Theme.of(context).colorScheme.primary.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            isFiltered ? l10n.emptyFiltered : l10n.emptyTasks,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          if (!isFiltered)
            Text(
              l10n.emptyTasksDescription,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                  ),
            ),
        ],
      ),
    );
  }
}

