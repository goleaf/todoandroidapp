import 'dart:convert';

/// Representation of an authenticated user returned by the API.
class UserDto {
  /// Creates a user DTO with the provided fields.
  UserDto({required this.id, required this.email, required this.name});

  /// Unique identifier of the user.
  final String id;

  /// Email address used during registration.
  final String email;

  /// Display name chosen by the user.
  final String name;

  /// Serializes the DTO to a JSON map.
  Map<String, dynamic> toJson() => {'id': id, 'email': email, 'name': name};

  /// Serializes the DTO to a JSON string for persistence if needed.
  @override
  String toString() => jsonEncode(toJson());
}

/// Response body returned after successful authentication.
class AuthResponse {
  /// Creates an authentication response with the provided token and user.
  AuthResponse({required this.token, required this.user});

  /// Bearer token that the client should store for future requests.
  final String token;

  /// Public information about the authenticated user.
  final UserDto user;

  /// Serializes the response to JSON.
  Map<String, dynamic> toJson() => {'token': token, 'user': user.toJson()};
}
