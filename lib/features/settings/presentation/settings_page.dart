import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import 'package:share_plus/share_plus.dart';
import 'package:universal_todo_app/generated/l10n/app_localizations.dart';
import 'package:universal_todo_app/features/todos/presentation/providers/todos_providers.dart';
import 'package:universal_todo_app/state/settings_provider.dart';

class SettingsPage extends ConsumerStatefulWidget {
  const SettingsPage({super.key});

  @override
  ConsumerState<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends ConsumerState<SettingsPage> {
  Future<void> _exportTasks() async {
    try {
      final todosAsync = ref.read(todosStreamProvider);
      await todosAsync.whenData((todos) async {
        final actions = ref.read(todoActionsProvider);
        final jsonString = await actions.exportToJson();
        
        await Share.share(jsonString, subject: 'Todos Export');
      });
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
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['json'],
      );

      if (result != null && result.files.single.path != null) {
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
                  child: const Text('Import'),
                ),
              ],
            );
          },
        );

        if (confirm == true) {
          // TODO: Read file and import
          _showMessage('Import functionality will be added');
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

          // Actions Section
          _SectionTitle(title: 'Actions'),
          ListTile(
            leading: const Icon(Icons.delete_outline),
            title: const Text('Clear Completed'),
            onTap: () async {
              await ref.read(todoActionsProvider).deleteCompleted();
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Completed tasks deleted')),
                );
              }
            },
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

