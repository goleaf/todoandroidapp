import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:universal_todo_app/features/todos/domain/todo.dart';
import 'package:universal_todo_app/generated/l10n/app_localizations.dart';

class TaskEditor extends StatefulWidget {
  final Todo? initialTodo;
  final VoidCallback onCancel;
  final Function(Todo) onSave;

  const TaskEditor({
    super.key,
    this.initialTodo,
    required this.onCancel,
    required this.onSave,
  });

  @override
  State<TaskEditor> createState() => _TaskEditorState();
}

class _TaskEditorState extends State<TaskEditor> {
  late final TextEditingController _titleController;
  late final TextEditingController _descriptionController;
  late Priority _priority;
  DateTime? _dueDate;
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.initialTodo?.title ?? '');
    _descriptionController = TextEditingController(
      text: widget.initialTodo?.description ?? '',
    );
    _priority = widget.initialTodo?.priority ?? Priority.medium;
    _dueDate = widget.initialTodo?.dueDate;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _dueDate ?? DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    
    if (picked != null) {
      setState(() {
        _dueDate = picked;
      });
    }
  }

  void _save() {
    if (_formKey.currentState!.validate()) {
      final todo = Todo(
        id: widget.initialTodo?.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
        title: _titleController.text.trim(),
        description: _descriptionController.text.trim().isEmpty
            ? null
            : _descriptionController.text.trim(),
        dueDate: _dueDate,
        priority: _priority,
        completed: widget.initialTodo?.completed ?? false,
        createdAt: widget.initialTodo?.createdAt ?? DateTime.now(),
        updatedAt: DateTime.now(),
      );
      
      widget.onSave(todo);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextFormField(
            controller: _titleController,
            decoration: InputDecoration(
              labelText: l10n.title,
              prefixIcon: const Icon(Icons.title),
            ),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return l10n.titleRequired;
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _descriptionController,
            decoration: InputDecoration(
              labelText: l10n.description,
              prefixIcon: const Icon(Icons.description),
            ),
            maxLines: 3,
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<Priority>(
            value: _priority,
            decoration: InputDecoration(
              labelText: l10n.priority,
              prefixIcon: const Icon(Icons.flag),
            ),
            items: Priority.values.map((priority) {
              return DropdownMenuItem(
                value: priority,
                child: Text(priority.getDisplayName(l10n)),
              );
            }).toList(),
            onChanged: (value) {
              if (value != null) {
                setState(() {
                  _priority = value;
                });
              }
            },
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _selectDate,
            icon: const Icon(Icons.calendar_today),
            label: Text(
              _dueDate != null
                  ? DateFormat('MMM dd, yyyy').format(_dueDate!)
                  : l10n.selectDate,
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: _dueDate != null
                  ? null
                  : Theme.of(context).colorScheme.surfaceVariant,
            ),
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              OutlinedButton(
                onPressed: widget.onCancel,
                child: Text(l10n.cancel),
              ),
              const SizedBox(width: 16),
              ElevatedButton(
                onPressed: _save,
                child: Text(l10n.save),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

