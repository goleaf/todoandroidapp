import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

/// Provider that exposes a single [ApiClient] for the entire application.
final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient();
});

/// Lightweight HTTP client that wraps the `http` package and injects sensible defaults.
class ApiClient {
  /// Constructs a new API client with an optional custom [http.Client].
  ApiClient({http.Client? client}) : _client = client ?? http.Client();

  /// Shared HTTP client instance used for requests.
  final http.Client _client;

  /// Sends a POST request to the provided [path] with the supplied [body].
  Future<Map<String, dynamic>> post(
    String path, {
    Map<String, dynamic>? body,
    Map<String, String>? headers,
  }) async {
    final uri = Uri.parse(_resolveBaseUrl() + path);
    final response = await _client.post(
      uri,
      headers: {
        'Content-Type': 'application/json',
        if (headers != null) ...headers,
      },
      body: jsonEncode(body ?? <String, dynamic>{}),
    );

    final decoded = response.body.isNotEmpty
        ? jsonDecode(response.body) as Map<String, dynamic>
        : <String, dynamic>{};

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return decoded;
    }

    throw ApiException(
      statusCode: response.statusCode,
      message: decoded['message']?.toString() ?? 'Request failed with status ${response.statusCode}',
    );
  }

  /// Resolves the base URL used for HTTP requests depending on the platform.
  String _resolveBaseUrl() {
    const configuredUrl = String.fromEnvironment('API_BASE_URL');
    if (configuredUrl.isNotEmpty) {
      return configuredUrl;
    }

    if (kIsWeb) {
      return 'http://localhost:8080';
    }

    // Android and iOS emulators require special loopback addresses.
    return 'http://10.0.2.2:8080';
  }
}

/// Custom exception thrown for HTTP errors.
class ApiException implements Exception {
  /// Creates a new [ApiException] with the given message and status code.
  ApiException({required this.message, required this.statusCode});

  /// Description of the failure returned by the server.
  final String message;

  /// HTTP status code returned by the backend.
  final int statusCode;

  @override
  String toString() => 'ApiException($statusCode): $message';
}
