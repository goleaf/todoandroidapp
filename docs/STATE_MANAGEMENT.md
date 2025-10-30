## State Management

- **Library**: Redux Toolkit with slices and async thunks.
- **Persistence**: redux-persist for offline retention.

### Slices
- `tasksSlice`: CRUD, status toggle, filters, async thunks for DB + notifications
- `categoriesSlice`: CRUD, list, byId, with task counts
- `settingsSlice`: App settings and notification toggles

### Conventions
- Keep reducers pure; handle side effects in thunks or services.
- Type all actions and state.
- Use `PayloadAction<T>` and `createAsyncThunk` for async flows.

### Testing
- Unit test reducers deterministically.
- Mock `databaseService` and `notificationService` in thunk tests.
