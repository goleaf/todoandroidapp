import 'dart:convert';

/// Immutable representation of the authenticated user.
class AuthUser {
  /// Creates a new [AuthUser] instance.
  const AuthUser({required this.id, required this.email, required this.name});

  /// Identifier returned by the server.
  final String id;

  /// Email address used for login.
  final String email;

  /// Friendly display name for the UI.
  final String name;

  /// Builds a user instance from a JSON payload.
  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String,
    );
  }

  /// Converts the user instance back to JSON for persistence.
  Map<String, dynamic> toJson() => {'id': id, 'email': email, 'name': name};

  /// Encodes the user as a JSON string for storage in shared preferences.
  String toJsonString() => jsonEncode(toJson());
}

/// Aggregates authentication data returned by the backend.
class AuthPayload {
  /// Creates a new [AuthPayload] with the supplied user and token.
  const AuthPayload({required this.user, required this.token});

  /// Bearer token provided by the backend.
  final String token;

  /// Authenticated user profile.
  final AuthUser user;

  /// Builds the payload from JSON returned by the API.
  factory AuthPayload.fromJson(Map<String, dynamic> json) {
    return AuthPayload(
      token: json['token'] as String,
      user: AuthUser.fromJson(json['user'] as Map<String, dynamic>),
    );
  }
}

/// Value object describing the current authentication status.
class AuthState {
  /// Creates a new state with optional data.
  const AuthState({
    required this.isLoading,
    this.user,
    this.token,
    this.errorMessage,
  });

  /// Indicates whether an auth-related operation is currently running.
  final bool isLoading;

  /// Persisted token for authorized requests.
  final String? token;

  /// Authenticated user profile when available.
  final AuthUser? user;

  /// Localized error message for the UI.
  final String? errorMessage;

  /// Convenience getter that tells whether the user is authenticated.
  bool get isAuthenticated => token != null && user != null;

  /// Base unauthenticated state.
  factory AuthState.unauthenticated() => const AuthState(isLoading: false);

  /// Loading state used while operations are pending.
  factory AuthState.loading() => const AuthState(isLoading: true);

  /// Authenticated state constructed from a payload.
  factory AuthState.authenticated(AuthPayload payload) => AuthState(
        isLoading: false,
        user: payload.user,
        token: payload.token,
      );

  /// Copies the current state while overriding provided values.
  AuthState copyWith({
    bool? isLoading,
    String? token,
    AuthUser? user,
    String? errorMessage,
    bool clearError = false,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      token: token ?? this.token,
      user: user ?? this.user,
      errorMessage: clearError ? null : errorMessage ?? this.errorMessage,
    );
  }
}
