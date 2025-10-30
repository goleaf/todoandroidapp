import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:universal_todo_app/core/network/api_client.dart';
import 'package:universal_todo_app/features/auth/data/auth_repository.dart';
import 'package:universal_todo_app/features/auth/domain/auth_models.dart';

/// Key used to persist the bearer token locally.
const _tokenKey = 'auth_token';

/// Key used to persist serialized user information locally.
const _userKey = 'auth_user';

/// Provider that exposes the [AuthNotifier] state manager.
final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref)..initialize();
});

/// State notifier responsible for handling authentication actions.
class AuthNotifier extends StateNotifier<AuthState> {
  /// Creates an [AuthNotifier] and stores a reference to the container [Ref].
  AuthNotifier(this._ref) : super(AuthState.loading());

  /// Reference to the Riverpod container for accessing other providers.
  final Ref _ref;

  /// Loads persisted credentials from storage so the app can auto-login users.
  Future<void> initialize() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(_tokenKey);
      final userJson = prefs.getString(_userKey);

      if (token != null && userJson != null) {
        final payload = AuthPayload(
          token: token,
          user: AuthUser.fromJson(jsonDecode(userJson) as Map<String, dynamic>),
        );
        state = AuthState.authenticated(payload);
      } else {
        state = AuthState.unauthenticated();
      }
    } catch (error) {
      state = AuthState(
        isLoading: false,
        errorMessage: 'Failed to load saved session: $error',
      );
    }
  }

  /// Performs the login flow using the repository and updates the state accordingly.
  Future<void> login({required String email, required String password}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final payload = await _ref.read(authRepositoryProvider).login(email: email, password: password);
      await _persistPayload(payload);
      state = AuthState.authenticated(payload);
    } catch (error) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: _friendlyError(error),
      );
    }
  }

  /// Registers a new account and signs the user in automatically.
  Future<void> register({required String email, required String password, required String name}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final payload = await _ref
          .read(authRepositoryProvider)
          .register(email: email, password: password, name: name);
      await _persistPayload(payload);
      state = AuthState.authenticated(payload);
    } catch (error) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: _friendlyError(error),
      );
    }
  }

  /// Clears stored credentials and returns to the unauthenticated state.
  Future<void> logout() async {
    state = state.copyWith(isLoading: true, clearError: true);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
    state = AuthState.unauthenticated();
  }

  /// Persists the authentication payload to shared preferences.
  Future<void> _persistPayload(AuthPayload payload) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, payload.token);
    await prefs.setString(_userKey, payload.user.toJsonString());
  }

  /// Extracts a human-friendly message from thrown errors.
  String _friendlyError(Object error) {
    if (error is ApiException) {
      return error.message;
    }
    return error.toString();
  }
}
