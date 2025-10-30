# Tasks (Priority)

1) Project analysis and inventory
- Verify RN/TS stack, dependencies, and entrypoints
- Map screens, navigation, state, and services

2) Documentation for Cursor and contributors
- Create docs/ARCHITECTURE.md, STATE_MANAGEMENT.md, SERVICES.md
- Add docs/ROUTES_AND_SCREENS.md and TESTING.md
- Add .cursor/rules to guide Cursor context

3) Testing setup and coverage
- Configure Jest for RN TypeScript
- Unit tests for slices (tasks, categories, settings)
- App smoke test with react-test-renderer

4) Continuous improvement
- Extend tests to services with mocks
- Add component tests as feasible

Notes
- No blades/Laravel present; this is a React Native project.
- Avoid native calls in unit tests; mock services.
