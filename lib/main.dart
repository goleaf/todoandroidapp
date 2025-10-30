import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:universal_todo_app/app.dart';
import 'package:universal_todo_app/core/config/app_config.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await AppConfig.load();
  runApp(
    const ProviderScope(
      child: App(),
    ),
  );
}

