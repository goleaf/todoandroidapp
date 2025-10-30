import 'dart:convert';
import 'package:shelf/shelf.dart';
import '../services/auth_service.dart';
import '../models/user.dart';

class AuthHandler {
  // Register endpoint
  static Future<Response> register(Request request) async {
    try {
      final body = jsonDecode(await request.readAsString());
      final email = body['email'] as String?;
      final password = body['password'] as String?;

      if (email == null || password == null || email.isEmpty || password.isEmpty) {
        return Response.badRequest(
          body: jsonEncode({'success': false, 'message': 'Email and password are required'}),
          headers: {'content-type': 'application/json'},
        );
      }

      final result = await AuthService.register(email, password);
      return Response.ok(
        jsonEncode(result),
        headers: {'content-type': 'application/json'},
      );
    } catch (e) {
      return Response.badRequest(
        body: jsonEncode({'success': false, 'message': e.toString()}),
        headers: {'content-type': 'application/json'},
      );
    }
  }

  // Login endpoint
  static Future<Response> login(Request request) async {
    try {
      final body = jsonDecode(await request.readAsString());
      final email = body['email'] as String?;
      final password = body['password'] as String?;

      if (email == null || password == null) {
        return Response.badRequest(
          body: jsonEncode({'success': false, 'message': 'Email and password are required'}),
          headers: {'content-type': 'application/json'},
        );
      }

      final result = await AuthService.login(email, password);
      return Response.ok(
        jsonEncode(result),
        headers: {'content-type': 'application/json'},
      );
    } catch (e) {
      return Response.badRequest(
        body: jsonEncode({'success': false, 'message': e.toString()}),
        headers: {'content-type': 'application/json'},
      );
    }
  }

  // Forgot password endpoint
  static Future<Response> forgotPassword(Request request) async {
    try {
      final body = jsonDecode(await request.readAsString());
      final email = body['email'] as String?;

      if (email == null || email.isEmpty) {
        return Response.badRequest(
          body: jsonEncode({'success': false, 'message': 'Email is required'}),
          headers: {'content-type': 'application/json'},
        );
      }

      final result = await AuthService.forgotPassword(email);
      return Response.ok(
        jsonEncode(result),
        headers: {'content-type': 'application/json'},
      );
    } catch (e) {
      return Response.badRequest(
        body: jsonEncode({'success': false, 'message': e.toString()}),
        headers: {'content-type': 'application/json'},
      );
    }
  }

  // Auth middleware
  static Handler Function(Handler) withAuth(Handler handler) {
    return (Handler innerHandler) {
      return (Request request) async {
        final token = request.headers['authorization']?.replaceFirst('Bearer ', '');
        
        if (token == null || token.isEmpty) {
          return Response.unauthorized(
            jsonEncode({'success': false, 'message': 'Authentication required'}),
            headers: {'content-type': 'application/json'},
          );
        }

        final user = await AuthService.verifyToken(token);
        if (user == null) {
          return Response.unauthorized(
            jsonEncode({'success': false, 'message': 'Invalid token'}),
            headers: {'content-type': 'application/json'},
          );
        }

        // Add user to request context
        final modifiedRequest = request.change(context: {'user': user});
        return innerHandler(modifiedRequest);
      };
    };
  }

  static User? getUserFromRequest(Request request) {
    return request.context['user'] as User?;
  }
}

