import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:universal_todo_app/features/todos/domain/todo.dart';

class JsonClipboardService {
  static Future<void> exportToClipboard(List<Todo> todos) async {
    try {
      final jsonList = todos.map((todo) => todo.toJson()).toList();
      final jsonString = jsonEncode(jsonList);
      await Clipboard.setData(ClipboardData(text: jsonString));
    } catch (e) {
      throw Exception('Failed to export to clipboard: $e');
    }
  }

  static Future<List<Todo>?> importFromClipboard(String jsonString) async {
    try {
      if (jsonString.trim().isEmpty) {
        return null;
      }

      final dynamic decoded = jsonDecode(jsonString);
      
      if (decoded is! List) {
        return null;
      }

      final List<Todo> todos = decoded
          .map((json) => Todo.fromJson(json as Map<String, dynamic>))
          .toList();

      return todos;
    } catch (e) {
      throw Exception('Failed to import from clipboard: $e');
    }
  }
}

