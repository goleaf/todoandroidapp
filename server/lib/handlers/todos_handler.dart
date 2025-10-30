import 'dart:convert';
import 'package:shelf/shelf.dart';
import '../database/db.dart';
import 'auth_handler.dart';
import '../services/todos_service.dart';

class TodosHandler {
  // Get all todos for authenticated user
  static Future<Response> getAllTodos(Request request) async {
    try {
      final user = AuthHandler.getUserFromRequest(request);
      if (user == null) {
        return Response.unauthorized(
          jsonEncode({'success': false, 'message': 'Unauthorized'}),
        );
      }

      final todos = await TodosService.getAllTodos(user.id);
      return Response.ok(
        jsonEncode({'success': true, 'todos': todos}),
        headers: {'content-type': 'application/json'},
      );
    } catch (e) {
      return Response.internalServerError(
        body: jsonEncode({'success': false, 'message': e.toString()}),
        headers: {'content-type': 'application/json'},
      );
    }
  }

  // Create a new todo
  static Future<Response> createTodo(Request request) async {
    try {
      final user = AuthHandler.getUserFromRequest(request);
      if (user == null) {
        return Response.unauthorized(
          jsonEncode({'success': false, 'message': 'Unauthorized'}),
        );
      }

      final body = jsonDecode(await request.readAsString());
      final todo = await TodosService.createTodo(user.id, body);
      
      return Response.ok(
        jsonEncode({'success': true, 'todo': todo}),
        headers: {'content-type': 'application/json'},
      );
    } catch (e) {
      return Response.badRequest(
        body: jsonEncode({'success': false, 'message': e.toString()}),
        headers: {'content-type': 'application/json'},
      );
    }
  }

  // Update a todo
  static Future<Response> updateTodo(Request request, String id) async {
    try {
      final user = AuthHandler.getUserFromRequest(request);
      if (user == null) {
        return Response.unauthorized(
          jsonEncode({'success': false, 'message': 'Unauthorized'}),
        );
      }

      final body = jsonDecode(await request.readAsString());
      final todo = await TodosService.updateTodo(user.id, int.parse(id), body);
      
      if (todo == null) {
        return Response.notFound(
          jsonEncode({'success': false, 'message': 'Todo not found'}),
        );
      }
      
      return Response.ok(
        jsonEncode({'success': true, 'todo': todo}),
        headers: {'content-type': 'application/json'},
      );
    } catch (e) {
      return Response.badRequest(
        body: jsonEncode({'success': false, 'message': e.toString()}),
        headers: {'content-type': 'application/json'},
      );
    }
  }

  // Delete a todo
  static Future<Response> deleteTodo(Request request, String id) async {
    try {
      final user = AuthHandler.getUserFromRequest(request);
      if (user == null) {
        return Response.unauthorized(
          jsonEncode({'success': false, 'message': 'Unauthorized'}),
        );
      }

      final success = await TodosService.deleteTodo(user.id, int.parse(id));
      
      if (!success) {
        return Response.notFound(
          jsonEncode({'success': false, 'message': 'Todo not found'}),
        );
      }
      
      return Response.ok(
        jsonEncode({'success': true}),
        headers: {'content-type': 'application/json'},
      );
    } catch (e) {
      return Response.internalServerError(
        body: jsonEncode({'success': false, 'message': e.toString()}),
        headers: {'content-type': 'application/json'},
      );
    }
  }
}

