import 'dart:convert';
import 'dart:io';

import 'package:shelf/shelf.dart';
import 'package:shelf/shelf_io.dart';
import 'package:shelf_router/shelf_router.dart';

import 'package:universal_todo_server/src/auth_service.dart';
import 'package:universal_todo_server/src/models.dart';

/// Simple REST API server responsible for authentication flows.
Future<void> main(List<String> args) async {
  // Determine the port from arguments or default to 8080 for local development.
  final port = int.tryParse(Platform.environment['PORT'] ?? '') ?? 8080;

  final authService = AuthService();
  final router = Router();

  // Route that exposes a quick health-check for monitoring.
  router.get('/health', (Request request) async {
    return Response.ok(jsonEncode({'status': 'ok'}), headers: _jsonHeaders);
  });

  // Route responsible for user registration.
  router.post('/register', (Request request) async {
    try {
      final payload = await request.readAsString();
      final data = jsonDecode(payload) as Map<String, dynamic>;
      final email = (data['email'] as String?)?.trim() ?? '';
      final password = (data['password'] as String?)?.trim() ?? '';
      final name = (data['name'] as String?)?.trim() ?? '';

      if (email.isEmpty || password.isEmpty || name.isEmpty) {
        return Response(
          HttpStatus.badRequest,
          body: jsonEncode({'message': 'Email, password, and name are required.'}),
          headers: _jsonHeaders,
        );
      }

      final response = authService.register(email: email, password: password, name: name);
      return Response(HttpStatus.created, body: jsonEncode(response.toJson()), headers: _jsonHeaders);
    } catch (error) {
      return Response(
        HttpStatus.badRequest,
        body: jsonEncode({'message': error.toString()}),
        headers: _jsonHeaders,
      );
    }
  });

  // Route that performs the login handshake.
  router.post('/login', (Request request) async {
    try {
      final payload = await request.readAsString();
      final data = jsonDecode(payload) as Map<String, dynamic>;
      final email = (data['email'] as String?)?.trim() ?? '';
      final password = (data['password'] as String?)?.trim() ?? '';

      if (email.isEmpty || password.isEmpty) {
        return Response(
          HttpStatus.badRequest,
          body: jsonEncode({'message': 'Email and password are required.'}),
          headers: _jsonHeaders,
        );
      }

      final response = authService.login(email: email, password: password);
      return Response(HttpStatus.ok, body: jsonEncode(response.toJson()), headers: _jsonHeaders);
    } catch (error) {
      return Response(
        HttpStatus.unauthorized,
        body: jsonEncode({'message': error.toString()}),
        headers: _jsonHeaders,
      );
    }
  });

  final handler = const Pipeline()
      .addMiddleware(logRequests())
      .addMiddleware(_corsMiddleware())
      .addMiddleware(_jsonContentType())
      .addHandler(router.call);

  final server = await serve(handler, InternetAddress.anyIPv4, port);
  print('🚀 Auth server running on port ${server.port}');
}

/// Ensures that every response contains JSON headers by default.
Middleware _jsonContentType() {
  return (Handler innerHandler) {
    return (Request request) async {
      final response = await innerHandler(request);
      return response.change(headers: {...response.headers, ..._jsonHeaders});
    };
  };
}

/// Adds permissive CORS headers so that the Flutter web app can communicate with the API.
Middleware _corsMiddleware() {
  const allowOriginHeader = 'Access-Control-Allow-Origin';
  const allowMethodsHeader = 'Access-Control-Allow-Methods';
  const allowHeadersHeader = 'Access-Control-Allow-Headers';
  const allowedHeaders = 'Origin, Content-Type, Accept, Authorization';
  const allowedMethods = 'GET, POST, OPTIONS';

  return (Handler innerHandler) {
    return (Request request) async {
      if (request.method.toUpperCase() == 'OPTIONS') {
        return Response.ok(
          '',
          headers: {
            ..._jsonHeaders,
            allowOriginHeader: '*',
            allowMethodsHeader: allowedMethods,
            allowHeadersHeader: allowedHeaders,
          },
        );
      }

      final response = await innerHandler(request);
      return response.change(
        headers: {
          ...response.headers,
          allowOriginHeader: '*',
          allowMethodsHeader: allowedMethods,
          allowHeadersHeader: allowedHeaders,
        },
      );
    };
  };
}

/// Shared response headers used for JSON APIs.
const _jsonHeaders = {'content-type': 'application/json'};
