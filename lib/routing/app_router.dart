import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:universal_todo_app/features/auth/presentation/pages/auth_loading_page.dart';
import 'package:universal_todo_app/features/auth/presentation/pages/login_page.dart';
import 'package:universal_todo_app/features/auth/presentation/pages/register_page.dart';
import 'package:universal_todo_app/features/settings/presentation/settings_page.dart';
import 'package:universal_todo_app/features/todos/presentation/pages/todo_details_page.dart';
import 'package:universal_todo_app/features/todos/presentation/pages/todos_page.dart';
import 'package:universal_todo_app/state/auth_provider.dart';

/// Provides a configured [GoRouter] that reacts to authentication changes.
final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/loading',
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
        path: '/loading',
        builder: (context, state) => const AuthLoadingPage(),
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
      final isLoading = authState.isLoading;
      final isAuthenticated = authState.isAuthenticated;
      final isAuthRoute = state.matchedLocation == '/login' || state.matchedLocation == '/register';

      if (isLoading) {
        return state.matchedLocation == '/loading' ? null : '/loading';
      }

      if (!isAuthenticated) {
        return isAuthRoute ? null : '/login';
      }

      if (isAuthenticated && (isAuthRoute || state.matchedLocation == '/loading')) {
        return '/';
      }

      return null;
    },
  );
});
