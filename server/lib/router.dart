import 'package:shelf/shelf.dart';
import 'package:shelf_router/shelf_router.dart';
import 'handlers/auth_handler.dart';
import 'handlers/todos_handler.dart';

final authHandler = AuthHandler();
final todosHandler = TodosHandler();

Router createRouter() {
  final router = Router();
  
  // Health check
  router.get('/', (Request request) {
    return Response.ok('Todo Server is running!');
  });
  
  // Auth routes
  router.post('/api/auth/register', authHandler.register);
  router.post('/api/auth/login', authHandler.login);
  router.post('/api/auth/forgot-password', authHandler.forgotPassword);
  
  // Todos routes (protected)
  router.get('/api/todos', authHandler.withAuth(todosHandler.getAllTodos));
  router.post('/api/todos', authHandler.withAuth(todosHandler.createTodo));
  router.put('/api/todos/<id>', authHandler.withAuth(todosHandler.updateTodo));
  router.delete('/api/todos/<id>', authHandler.withAuth(todosHandler.deleteTodo));
  
  // Handle 404
  router.all('/<path|.*>', (Request request) {
    return Response.notFound('Not Found');
  });
  
  return router;
}

