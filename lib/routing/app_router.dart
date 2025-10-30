import 'package:go_router/go_router.dart';
import 'package:universal_todo_app/features/auth/presentation/pages/login_page.dart';
import 'package:universal_todo_app/features/auth/presentation/pages/register_page.dart';
import 'package:universal_todo_app/features/auth/presentation/pages/forgot_password_page.dart';
import 'package:universal_todo_app/features/settings/presentation/settings_page.dart';
import 'package:universal_todo_app/features/todos/presentation/pages/todo_details_page.dart';
import 'package:universal_todo_app/features/todos/presentation/pages/todos_page.dart';

final goRouter = GoRouter(
  routes: [
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginPage(),
    ),
    GoRoute(
      path: '/register',
      builder: (context, state) => const RegisterPage(),
    ),
    GoRoute(
      path: '/forgot-password',
      builder: (context, state) => const ForgotPasswordPage(),
    ),
    GoRoute(
      path: '/',
      builder: (context, state) => const TodosPage(),
    ),
    GoRoute(
      path: '/task/:id',
      builder: (context, state) {
        final id = state.pathParameters['id'] ?? '';
        return TodoDetailsPage(taskId: id);
      },
    ),
    GoRoute(
      path: '/settings',
      builder: (context, state) => const SettingsPage(),
    ),
  ],
  redirect: (context, state) {
    // Add auth redirection logic here if needed
    return null;
  },
);

