import 'package:postgres/postgres.dart';
import '../database/db.dart';

class TodosService {
  // Get all todos for a user
  static Future<List<Map<String, dynamic>>> getAllTodos(int userId) async {
    final conn = await Database.connection;
    final result = await conn.query(
      '''
        SELECT id, title, description, due_date, priority, completed, created_at, updated_at
        FROM todos WHERE user_id = @userId ORDER BY created_at DESC
      ''',
      parameters: {'userId': userId},
    );

    return result.map((row) {
      final map = row.toColumnMap();
      return {
        'id': map['id'].toString(),
        'title': map['title'],
        'description': map['description'],
        'dueDate': map['due_date']?.toString(),
        'priority': map['priority'],
        'completed': map['completed'],
        'createdAt': map['created_at'].toString(),
        'updatedAt': map['updated_at'].toString(),
      };
    }).toList();
  }

  // Create a todo
  static Future<Map<String, dynamic>> createTodo(int userId, Map<String, dynamic> data) async {
    final conn = await Database.connection;
    final result = await conn.query(
      '''
        INSERT INTO todos (user_id, title, description, due_date, priority, completed)
        VALUES (@userId, @title, @description, @dueDate, @priority, @completed)
        RETURNING id, title, description, due_date, priority, completed, created_at, updated_at
      ''',
      parameters: {
        'userId': userId,
        'title': data['title'],
        'description': data['description'],
        'dueDate': data['dueDate'] != null ? DateTime.parse(data['dueDate']) : null,
        'priority': data['priority'] ?? 'medium',
        'completed': data['completed'] ?? false,
      },
    );

    final map = result.first.toColumnMap();
    return {
      'id': map['id'].toString(),
      'title': map['title'],
      'description': map['description'],
      'dueDate': map['due_date']?.toString(),
      'priority': map['priority'],
      'completed': map['completed'],
      'createdAt': map['created_at'].toString(),
      'updatedAt': map['updated_at'].toString(),
    };
  }

  // Update a todo
  static Future<Map<String, dynamic>?> updateTodo(int userId, int todoId, Map<String, dynamic> data) async {
    final conn = await Database.connection;
    
    // Verify ownership
    final ownerCheck = await conn.query(
      'SELECT id FROM todos WHERE id = @id AND user_id = @userId',
      parameters: {'id': todoId, 'userId': userId},
    );
    
    if (ownerCheck.isEmpty) {
      return null;
    }

    // Build update query dynamically
    final updates = <String>[];
    final params = <String, dynamic>{'id': todoId, 'userId': userId};
    
    if (data.containsKey('title')) {
      updates.add('title = @title');
      params['title'] = data['title'];
    }
    if (data.containsKey('description')) {
      updates.add('description = @description');
      params['description'] = data['description'];
    }
    if (data.containsKey('dueDate')) {
      updates.add('due_date = @dueDate');
      params['dueDate'] = data['dueDate'] != null ? DateTime.parse(data['dueDate']) : null;
    }
    if (data.containsKey('priority')) {
      updates.add('priority = @priority');
      params['priority'] = data['priority'];
    }
    if (data.containsKey('completed')) {
      updates.add('completed = @completed');
      params['completed'] = data['completed'];
    }
    
    if (updates.isEmpty) {
      return await getTodo(userId, todoId);
    }
    
    updates.add('updated_at = CURRENT_TIMESTAMP');
    
    await conn.query(
      'UPDATE todos SET ${updates.join(', ')} WHERE id = @id AND user_id = @userId',
      parameters: params,
    );
    
    return await getTodo(userId, todoId);
  }

  // Get a single todo
  static Future<Map<String, dynamic>?> getTodo(int userId, int todoId) async {
    final conn = await Database.connection;
    final result = await conn.query(
      'SELECT id, title, description, due_date, priority, completed, created_at, updated_at FROM todos WHERE id = @id AND user_id = @userId',
      parameters: {'id': todoId, 'userId': userId},
    );

    if (result.isEmpty) return null;

    final map = result.first.toColumnMap();
    return {
      'id': map['id'].toString(),
      'title': map['title'],
      'description': map['description'],
      'dueDate': map['due_date']?.toString(),
      'priority': map['priority'],
      'completed': map['completed'],
      'createdAt': map['created_at'].toString(),
      'updatedAt': map['updated_at'].toString(),
    };
  }

  // Delete a todo
  static Future<bool> deleteTodo(int userId, int todoId) async {
    final conn = await Database.connection;
    final result = await conn.query(
      'DELETE FROM todos WHERE id = @id AND user_id = @userId',
      parameters: {'id': todoId, 'userId': userId},
    );
    
    return result.affectedRowCount > 0;
  }
}

