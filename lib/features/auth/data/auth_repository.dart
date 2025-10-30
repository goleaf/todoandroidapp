import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:universal_todo_app/core/network/api_client.dart';
import 'package:universal_todo_app/features/auth/domain/auth_models.dart';

/// Riverpod provider that exposes the [AuthRepository].
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.watch(apiClientProvider));
});

/// Repository responsible for communicating with the authentication API.
class AuthRepository {
  /// Creates a repository with the provided [ApiClient].
  AuthRepository(this._client);

  /// Shared API client used to talk to the backend.
  final ApiClient _client;

  /// Calls the `/login` endpoint and transforms the response to [AuthPayload].
  Future<AuthPayload> login({required String email, required String password}) async {
    final json = await _client.post(
      '/login',
      body: {'email': email, 'password': password},
    );
    return AuthPayload.fromJson(json);
  }

  /// Calls the `/register` endpoint to create a new account.
  Future<AuthPayload> register({
    required String email,
    required String password,
    required String name,
  }) async {
    final json = await _client.post(
      '/register',
      body: {
        'email': email,
        'password': password,
        'name': name,
      },
    );
    return AuthPayload.fromJson(json);
  }
}
