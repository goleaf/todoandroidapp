import 'dart:convert';
import 'package:bcrypt/bcrypt.dart';
import 'package:postgres/postgres.dart';
import '../database/db.dart';
import '../models/user.dart';
import '../services/email_service.dart';

class AuthService {
  // Register new user
  static Future<Map<String, dynamic>> register(String email, String password) async {
    final conn = await Database.connection;
    
    // Check if user exists
    final existingUser = await conn.query(
      'SELECT id FROM users WHERE email = @email',
      parameters: {'email': email},
    );
    
    if (existingUser.isNotEmpty) {
      throw Exception('User with this email already exists');
    }
    
    // Hash password
    final hashedPassword = BCrypt.hashpw(password, BCrypt.gensalt());
    
    // Insert user
    final result = await conn.query(
      'INSERT INTO users (email, password_hash) VALUES (@email, @password) RETURNING id, email, created_at',
      parameters: {'email': email, 'password': hashedPassword},
    );
    
    final userData = result.first.toColumnMap();
    
    return {
      'success': true,
      'user': {
        'id': userData['id'],
        'email': userData['email'],
        'createdAt': userData['created_at'].toString(),
      },
    };
  }

  // Login user
  static Future<Map<String, dynamic>> login(String email, String password) async {
    final conn = await Database.connection;
    
    // Find user
    final result = await conn.query(
      'SELECT id, email, password_hash, created_at FROM users WHERE email = @email',
      parameters: {'email': email},
    );
    
    if (result.isEmpty) {
      throw Exception('Invalid email or password');
    }
    
    final userData = result.first.toColumnMap();
    
    // Verify password
    if (!BCrypt.checkpw(password, userData['password_hash'] as String)) {
      throw Exception('Invalid email or password');
    }
    
    return {
      'success': true,
      'user': {
        'id': userData['id'],
        'email': userData['email'],
        'createdAt': userData['created_at'].toString(),
      },
      'token': _generateToken(userData['id'] as int),
    };
  }

  // Forgot password - sends new password via email
  static Future<Map<String, dynamic>> forgotPassword(String email) async {
    final conn = await Database.connection;
    
    // Find user
    final result = await conn.query(
      'SELECT id, email FROM users WHERE email = @email',
      parameters: {'email': email},
    );
    
    if (result.isEmpty) {
      throw Exception('User not found');
    }
    
    // Generate new password
    final newPassword = _generateRandomPassword();
    final hashedPassword = BCrypt.hashpw(newPassword, BCrypt.gensalt());
    
    // Update password
    await conn.query(
      'UPDATE users SET password_hash = @password WHERE email = @email',
      parameters: {'password': hashedPassword, 'email': email},
    );
    
    // Send email
    await EmailService.sendPasswordReset(email, newPassword);
    
    return {
      'success': true,
      'message': 'New password sent to your email',
    };
  }

  // Verify user from token
  static Future<User?> verifyToken(String token) async {
    try {
      final userId = int.parse(token); // Simple token, in production use JWT
      final conn = await Database.connection;
      
      final result = await conn.query(
        'SELECT id, email, created_at FROM users WHERE id = @id',
        parameters: {'id': userId},
      );
      
      if (result.isEmpty) return null;
      
      final userData = result.first.toColumnMap();
      return User.fromMap(userData);
    } catch (e) {
      return null;
    }
  }

  // Generate simple token (user ID as string)
  static String _generateToken(int userId) {
    return userId.toString();
  }

  // Generate random password
  static String _generateRandomPassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#\$%^&*';
    final random = DateTime.now().millisecondsSinceEpoch;
    String password = '';
    for (int i = 0; i < 12; i++) {
      password += chars[(random + i) % chars.length];
    }
    return password;
  }
}

