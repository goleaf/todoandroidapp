import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  static String get apiBaseUrl => dotenv.env['API_BASE_URL'] ?? 'http://127.0.0.1:8080';
  
  static Future<void> load() async {
    await dotenv.load(fileName: '.env');
  }
}

