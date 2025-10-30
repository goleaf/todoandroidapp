import 'package:mailer/mailer.dart';
import 'package:mailer/smtp_server.dart';
import 'package:dotenv/dotenv.dart';

class EmailService {
  static final DotEnv _env = DotEnv(includePlatformEnvironment: true);

  static Future<void> sendPasswordReset(String to, String newPassword) async {
    final smtpHost = _env['SMTP_HOST'] ?? 'smtp.gmail.com';
    final smtpPort = int.parse(_env['SMTP_PORT'] ?? '587');
    final smtpUser = _env['SMTP_USER'] ?? '';
    final smtpPassword = _env['SMTP_PASSWORD'] ?? '';
    final fromName = _env['SMTP_FROM_NAME'] ?? 'Todo App';

    // If email is not configured, just print to console
    if (smtpUser.isEmpty || smtpPassword.isEmpty) {
      print('⚠️  Email not configured. New password: $newPassword');
      return;
    }

    try {
      final smtpServer = SmtpServer(
        smtpHost,
        port: smtpPort,
        username: smtpUser,
        password: smtpPassword,
      );

      final message = Message()
        ..from = Address(smtpUser, fromName)
        ..recipients.add(to)
        ..subject = 'Password Reset - Todo App'
        ..html = '''
          <h2>Password Reset</h2>
          <p>Your new password is: <strong>$newPassword</strong></p>
          <p>Please login with this password and change it to something more memorable.</p>
          <p>Best regards,<br>Todo App Team</p>
        ''';

      await send(message, smtpServer);
      print('✅ Password reset email sent to $to');
    } catch (e) {
      print('⚠️  Failed to send email: $e');
      print('⚠️  New password: $newPassword');
    }
  }
}

