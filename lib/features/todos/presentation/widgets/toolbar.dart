import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:universal_todo_app/generated/l10n/app_localizations.dart';
import 'package:universal_todo_app/state/todos_provider.dart';

class Toolbar extends ConsumerStatefulWidget {
  const Toolbar({super.key});

  @override
  ConsumerState<Toolbar> createState() => _ToolbarState();
}

class _ToolbarState extends ConsumerState<Toolbar> {
  bool _isSearchVisible = false;
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final sortMode = ref.watch(sortModeProvider);

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _isSearchVisible
                  ? TextField(
                      controller: _searchController,
                      decoration: InputDecoration(
                        hintText: l10n.search,
                        prefixIcon: const Icon(Icons.search),
                        suffixIcon: IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () {
                            setState(() {
                              _isSearchVisible = false;
                              _searchController.clear();
                            });
                            ref.read(searchQueryProvider.notifier).state = '';
                          },
                        ),
                      ),
                      onChanged: (value) {
                        ref.read(searchQueryProvider.notifier).state = value;
                      },
                      autofocus: true,
                    )
                  : Container(),
            ),
            IconButton(
              icon: Icon(_isSearchVisible ? Icons.search : Icons.search),
              onPressed: () {
                setState(() {
                  _isSearchVisible = !_isSearchVisible;
                  if (!_isSearchVisible) {
                    _searchController.clear();
                    ref.read(searchQueryProvider.notifier).state = '';
                  }
                });
              },
            ),
            PopupMenuButton<String>(
              icon: const Icon(Icons.sort),
              onSelected: (value) {
                switch (value) {
                  case 'dueDate':
                    ref.read(sortModeProvider.notifier).state = SortMode.dueDate;
                    break;
                  case 'priority':
                    ref.read(sortModeProvider.notifier).state = SortMode.priority;
                    break;
                  case 'created':
                    ref.read(sortModeProvider.notifier).state = SortMode.createdAt;
                    break;
                }
              },
              itemBuilder: (context) => [
                PopupMenuItem(
                  value: 'dueDate',
                  child: Row(
                    children: [
                      if (sortMode == SortMode.dueDate)
                        const Icon(Icons.check, size: 20),
                      if (sortMode == SortMode.dueDate) const SizedBox(width: 8),
                      Text(l10n.sortDueDate),
                    ],
                  ),
                ),
                PopupMenuItem(
                  value: 'priority',
                  child: Row(
                    children: [
                      if (sortMode == SortMode.priority)
                        const Icon(Icons.check, size: 20),
                      if (sortMode == SortMode.priority) const SizedBox(width: 8),
                      Text(l10n.sortPriority),
                    ],
                  ),
                ),
                PopupMenuItem(
                  value: 'created',
                  child: Row(
                    children: [
                      if (sortMode == SortMode.createdAt)
                        const Icon(Icons.check, size: 20),
                      if (sortMode == SortMode.createdAt) const SizedBox(width: 8),
                      Text(l10n.sortCreated),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }
}

