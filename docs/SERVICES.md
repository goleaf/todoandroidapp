## Services

### Database (`src/services/database`)
- SQLite-backed storage with tables: `tasks`, `categories`
- Provides CRUD for tasks and categories
- Seeds default categories and sample tasks on first run
- Exposes helpers: `getTaskStats`, `getRootCategories`, etc.

### Notifications (`src/services/notifications`)
- Initializes notification channels
- Schedules task reminders and daily summary
- Cancels reminders on completion

### MCP (`src/services/mcp`)
- Initializes Model Context Protocol integration used by the app
- Keep isolated from core app logic

### Testing Guidance
- Mock all service methods in unit tests
- Do not open a real database or schedule real notifications
