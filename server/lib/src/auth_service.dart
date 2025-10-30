import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:sqlite3/sqlite3.dart';
import 'package:uuid/uuid.dart';

import 'database.dart';
import 'models.dart';

/// Service that encapsulates authentication operations over SQLite.
class AuthService {
  /// Shared instance of the SQLite database used by the server.
  final Database _db = DatabaseProvider().database;

  /// Helper for generating secure random values.
  final Random _random = Random.secure();

  /// Registers a new user account and returns the associated auth response.
  AuthResponse register({required String email, required String password, required String name}) {
    final existing = _db.select('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.isNotEmpty) {
      throw ArgumentError('Email is already registered.');
    }

    final userId = const Uuid().v4();
    final salt = _generateSalt();
    final passwordHash = _hashPassword(password: password, salt: salt);
    final now = DateTime.now().toUtc().toIso8601String();

    _db.execute(
      'INSERT INTO users (id, email, name, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, email, name, passwordHash, salt, now],
    );

    final token = _createTokenForUser(userId);
    final user = UserDto(id: userId, email: email, name: name);
    return AuthResponse(token: token, user: user);
  }

  /// Authenticates an existing user by validating the password hash.
  AuthResponse login({required String email, required String password}) {
    final result = _db.select('SELECT id, password_hash, salt, name FROM users WHERE email = ?', [email]);
    if (result.isEmpty) {
      throw ArgumentError('Invalid email or password.');
    }

    final row = result.first;
    final expectedHash = row['password_hash'] as String;
    final salt = row['salt'] as String;
    final providedHash = _hashPassword(password: password, salt: salt);

    if (providedHash != expectedHash) {
      throw ArgumentError('Invalid email or password.');
    }

    final userId = row['id'] as String;
    final name = row['name'] as String;
    final token = _createTokenForUser(userId);
    final user = UserDto(id: userId, email: email, name: name);
    return AuthResponse(token: token, user: user);
  }

  /// Creates a persistent token for the given user.
  String _createTokenForUser(String userId) {
    final bytes = List<int>.generate(32, (_) => _random.nextInt(256));
    final token = base64UrlEncode(bytes);
    final now = DateTime.now().toUtc().toIso8601String();

    _db.execute('INSERT INTO tokens (token, user_id, created_at) VALUES (?, ?, ?)', [token, userId, now]);
    return token;
  }

  /// Generates a cryptographically secure random salt.
  String _generateSalt() {
    final saltBytes = List<int>.generate(16, (_) => _random.nextInt(256));
    return base64UrlEncode(saltBytes);
  }

  /// Hashes the password with the provided salt using SHA-256.
  String _hashPassword({required String password, required String salt}) {
    final bytes = utf8.encode('$salt$password');
    final digest = sha256.convert(bytes);
    return digest.toString();
  }
}
