import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:universal_todo_app/generated/l10n/app_localizations.dart';
import 'package:universal_todo_app/services/clipboard/json_clipboard.dart';
import 'package:universal_todo_app/state/auth_provider.dart';
import 'package:universal_todo_app/state/settings_provider.dart';
import 'package:universal_todo_app/state/todos_provider.dart';

class SettingsPage extends ConsumerStatefulWidget {
  const SettingsPage({super.key});

  @override
  ConsumerState<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends ConsumerState<SettingsPage> {
  Future<void> _exportTasks() async {
    try {
      final todos = ref.read(todosProvider);
      await JsonClipboardService.exportToClipboard(todos);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Tasks exported to clipboard')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Export failed: $e')),
        );
      }
    }
  }

  Future<void> _importTasks() async {
    try {
      final clipboardData = await Clipboard.getData('text/plain');
      if (clipboardData?.text == null || clipboardData!.text!.isEmpty) {
        _showMessage('Clipboard is empty');
        return;
      }

      final confirm = await showDialog<bool>(
        context: context,
        builder: (context) {
          final l10n = AppLocalizations.of(context);
          return AlertDialog(
            title: const Text('Import JSON'),
            content: Text(l10n.importConfirm),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: Text(l10n.cancel),
              ),
              TextButton(
                onPressed: () => Navigator.of(context).pop(true),
                child: Text('Import'),
              ),
            ],
          );
        },
      );

      if (confirm == true) {
        final todos = await JsonClipboardService.importFromClipboard(clipboardData.text!);
        
        if (todos != null && todos.isNotEmpty) {
          // Clear and add new todos
          ref.read(todosProvider.notifier).clearAll();
          for (final todo in todos) {
            await ref.read(todosProvider.notifier).addTodo(todo);
          }
          
          if (mounted) {
            _showMessage('Tasks imported successfully');
          }
        } else {
          _showMessage('Failed to import tasks');
        }
      }
    } catch (e) {
      _showMessage('Import failed: $e');
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  Future<void> _logout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Logout'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await ref.read(authProvider.notifier).logout();
      if (mounted) {
        context.go('/login');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final themeMode = ref.watch(themeProvider);
    final locale = ref.watch(localeProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.settings),
      ),
      body: ListView(
        children: [
          // Theme Section
          _SectionTitle(title: 'Theme'),
          RadioListTile<ThemeMode>(
            title: Text(l10n.themeLight),
            value: ThemeMode.light,
            groupValue: themeMode,
            onChanged: (value) {
              if (value != null) {
                ref.read(themeProvider.notifier).setThemeMode(value);
              }
            },
          ),
          RadioListTile<ThemeMode>(
            title: Text(l10n.themeDark),
            value: ThemeMode.dark,
            groupValue: themeMode,
            onChanged: (value) {
              if (value != null) {
                ref.read(themeProvider.notifier).setThemeMode(value);
              }
            },
          ),
          RadioListTile<ThemeMode>(
            title: Text(l10n.themeSystem),
            value: ThemeMode.system,
            groupValue: themeMode,
            onChanged: (value) {
              if (value != null) {
                ref.read(themeProvider.notifier).setThemeMode(value);
              }
            },
          ),

          const Divider(),

          // Language Section
          _SectionTitle(title: 'Language'),
          RadioListTile<Locale?>(
            title: Text(l10n.languageEnglish),
            value: const Locale('en'),
            groupValue: locale,
            onChanged: (value) {
              ref.read(localeProvider.notifier).setLocale(value);
            },
          ),
          RadioListTile<Locale?>(
            title: Text(l10n.languageRussian),
            value: const Locale('ru'),
            groupValue: locale,
            onChanged: (value) {
              ref.read(localeProvider.notifier).setLocale(value);
            },
          ),
          RadioListTile<Locale?>(
            title: Text(l10n.languageSystem),
            value: null,
            groupValue: locale,
            onChanged: (value) {
              ref.read(localeProvider.notifier).setLocale(value);
            },
          ),

          const Divider(),

          // Import/Export Section
          _SectionTitle(title: 'Data'),
          ListTile(
            leading: const Icon(Icons.upload),
            title: Text(l10n.export),
            onTap: _exportTasks,
          ),
          ListTile(
            leading: const Icon(Icons.download),
            title: Text(l10n.import),
            onTap: _importTasks,
          ),

          const Divider(),

          // Account Section
          _SectionTitle(title: 'Account'),
          ListTile(
            leading: const Icon(Icons.logout),
            title: const Text('Logout'),
            onTap: _logout,
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;

  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
      ),
    );
  }
}

