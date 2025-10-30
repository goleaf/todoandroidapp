import 'dart:io';
import 'package:shelf/shelf.dart';
import 'package:shelf/shelf_io.dart' as io;
import 'package:shelf_cors_headers/shelf_cors_headers.dart';
import 'package:dotenv/dotenv.dart';
import 'router.dart';

void main(List<String> args) async {
  // Load environment variables
  final env = DotEnv(includePlatformEnvironment: true)..load(['.env']);
  
  final handler = Pipeline()
      .addMiddleware(corsHeaders())
      .addMiddleware(logRequests())
      .addHandler(createRouter());

  final host = env['SERVER_HOST'] ?? '127.0.0.1';
  final port = int.parse(env['SERVER_PORT'] ?? '8080');

  print('🚀 Starting server at http://$host:$port');
  
  final server = await io.serve(handler, host, port);
  
  print('✅ Server running at http://${server.address.host}:${server.port}');
  
  // Graceful shutdown
  ProcessSignal.sigint.watch().listen((signal) {
    print('\n🛑 Shutting down server...');
    server.close();
    exit(0);
  });
}

