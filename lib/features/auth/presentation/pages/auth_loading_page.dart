import 'package:flutter/material.dart';

/// Minimal loading screen shown while the app restores persisted sessions.
class AuthLoadingPage extends StatelessWidget {
  /// Creates a new loading page widget.
  const AuthLoadingPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: CircularProgressIndicator(),
      ),
    );
  }
}
