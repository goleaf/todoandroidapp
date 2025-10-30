import 'dart:async';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:universal_todo_app/features/todos/domain/todo.dart';

abstract class TodoRepository {
  Future<List<Todo>> getAllTodos();
  Future<Todo?> getTodoById(String id);
  Future<void> saveTodo(Todo todo);
  Future<void> deleteTodo(String id);
  Future<void> clearAllTodos();
}

class SharedPreferencesTodosRepository implements TodoRepository {
  static const String _key = 'todos_list';
  static Timer? _saveTimer;

  @override
  Future<List<Todo>> getAllTodos() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonString = prefs.getString(_key);
      
      if (jsonString == null || jsonString.isEmpty) {
        return [];
      }
      
      final List<dynamic> jsonList = List<dynamic>.from(
        jsonString.split('\n').where((line) => line.isNotEmpty)
      );
      
      if (jsonList.isEmpty) {
        return [];
      }
      
      final parsedList = jsonList.map((json) {
        if (json is String) {
          return Todo.fromJson(Map<String, dynamic>.from(_parseJsonString(json)));
        }
        return Todo.fromJson(json as Map<String, dynamic>);
      }).toList();
      
      return parsedList;
    } catch (e) {
      print('Error loading todos: $e');
      return [];
    }
  }

  @override
  Future<Todo?> getTodoById(String id) async {
    final todos = await getAllTodos();
    try {
      return todos.firstWhere((todo) => todo.id == id);
    } catch (e) {
      return null;
    }
  }

  @override
  Future<void> saveTodo(Todo todo) async {
    final todos = await getAllTodos();
    final index = todos.indexWhere((t) => t.id == todo.id);
    
    if (index >= 0) {
      todos[index] = todo;
    } else {
      todos.add(todo);
    }
    
    await _saveTodosDebounced(todos);
  }

  @override
  Future<void> deleteTodo(String id) async {
    final todos = await getAllTodos();
    todos.removeWhere((todo) => todo.id == id);
    await _saveTodosDebounced(todos);
  }

  @override
  Future<void> clearAllTodos() async {
    await _saveTodosDebounced([]);
  }

  Future<void> _saveTodosDebounced(List<Todo> todos) async {
    _saveTimer?.cancel();
    _saveTimer = Timer(const Duration(milliseconds: 300), () async {
      await _saveTodos(todos);
    });
  }

  Future<void> _saveTodos(List<Todo> todos) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonString = todos
          .map((todo) => todo.toJson().toString())
          .join('\n');
      await prefs.setString(_key, jsonString);
    } catch (e) {
      print('Error saving todos: $e');
    }
  }

  Map<String, dynamic> _parseJsonString(String jsonString) {
    try {
      final cleanJson = jsonString.trim();
      if (cleanJson.startsWith('{') && cleanJson.endsWith('}')) {
        final entries = <String, dynamic>{};
        final contents = cleanJson.substring(1, cleanJson.length - 1);
        final parts = contents.split(',');
        
        for (final part in parts) {
          final colonIndex = part.indexOf(':');
          if (colonIndex > 0) {
            var key = part.substring(0, colonIndex).trim();
            var value = part.substring(colonIndex + 1).trim();
            
            if (key.startsWith("'") && key.endsWith("'")) {
              key = key.substring(1, key.length - 1);
            }
            
            if (value.startsWith("'") && value.endsWith("'")) {
              value = value.substring(1, value.length - 1);
            }
            
            entries[key] = value;
          }
        }
        return entries;
      }
      return {};
    } catch (e) {
      print('Error parsing JSON string: $e');
      return {};
    }
  }
}

