import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:universal_todo_app/core/config/app_config.dart';
import '../models/auth_models.dart';

class AuthApi {
  static const String _basePath = '/api/auth';

  static Future<AuthResponse> register(String email, String password) async {
    final uri = Uri.parse('${AppConfig.apiBaseUrl}$_basePath/register');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(RegisterRequest(email: email, password: password).toJson()),
    );

    return AuthResponse.fromJson(jsonDecode(response.body));
  }

  static Future<AuthResponse> login(String email, String password) async {
    final uri = Uri.parse('${AppConfig.apiBaseUrl}$_basePath/login');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(LoginRequest(email: email, password: password).toJson()),
    );

    return AuthResponse.fromJson(jsonDecode(response.body));
  }

  static Future<AuthResponse> forgotPassword(String email) async {
    final uri = Uri.parse('${AppConfig.apiBaseUrl}$_basePath/forgot-password');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(ForgotPasswordRequest(email: email).toJson()),
    );

    return AuthResponse.fromJson(jsonDecode(response.body));
  }
}

