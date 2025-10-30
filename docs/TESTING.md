## Testing

### Tooling
- **Runner**: Jest (configured via `jest.config.js`)
- **Renderer**: react-test-renderer for smoke tests

### What to Test
- Reducers: slice logic for tasks, categories, settings
- Thunks: success/error paths with mocked services
- App: smoke render test

### Mocks
- Mock `src/services/*` to avoid native calls
- Mock RN gesture handler and vector icons if needed

### Run
```bash
npm test
```

### Notes
- Avoid importing RN native modules directly in tests; rely on mocks.
- Keep tests deterministic—no timers without fakes.
