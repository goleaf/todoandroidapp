import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:universal_todo_app/features/auth/models/auth_models.dart';
import 'package:universal_todo_app/features/auth/services/auth_api.dart';

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState()) {
    _loadAuth();
  }

  Future<void> _loadAuth() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    final email = prefs.getString('user_email');
    
    if (token != null && email != null) {
      state = state.copyWith(
        isAuthenticated: true,
        user: User(
          id: prefs.getString('user_id') ?? '',
          email: email,
          createdAt: '',
        ),
      );
    }
  }

  Future<AuthResponse> login(String email, String password) async {
    final response = await AuthApi.login(email, password);
    
    if (response.success && response.token != null) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', response.token!);
      await prefs.setString('user_email', response.user!.email);
      await prefs.setString('user_id', response.user!.id);
      
      state = state.copyWith(
        isAuthenticated: true,
        user: response.user,
      );
    }
    
    return response;
  }

  Future<AuthResponse> register(String email, String password) async {
    final response = await AuthApi.register(email, password);
    
    if (response.success) {
      // After registration, log in the user
      return await login(email, password);
    }
    
    return response;
  }

  Future<AuthResponse> forgotPassword(String email) async {
    return await AuthApi.forgotPassword(email);
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_email');
    await prefs.remove('user_id');
    
    state = const AuthState();
  }

  String? get token {
    // Token is stored in SharedPreferences, we'll fetch it when needed
    return null;
  }
}

class AuthState {
  final bool isAuthenticated;
  final User? user;

  const AuthState({
    this.isAuthenticated = false,
    this.user,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    User? user,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      user: user ?? this.user,
    );
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});

