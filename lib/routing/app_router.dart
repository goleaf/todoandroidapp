import 'package:go_router/go_router.dart';
import 'package:universal_todo_app/features/settings/presentation/settings_page.dart';
import 'package:universal_todo_app/features/todos/presentation/pages/todo_details_page.dart';
import 'package:universal_todo_app/features/todos/presentation/pages/todos_page.dart';

final goRouter = GoRouter(
  routes: [
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
);

