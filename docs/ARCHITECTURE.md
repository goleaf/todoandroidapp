## Architecture Overview

- **Platform**: React Native 0.72, TypeScript
- **State**: Redux Toolkit + redux-persist (`src/store`)
- **Navigation**: React Navigation (`src/navigation/AppNavigator.tsx`)
- **UI**: React Native Paper + custom styles
- **Services**: Database and Notifications under `src/services`
- **Entry**: `index.js` -> `App.tsx`

### Data Flow
- Screens dispatch actions to Redux slices.
- Async thunks call `databaseService` and `notificationService`.
- Reducers update state; components subscribe via `react-redux`.

### Directories
- `src/screens/*`: Feature screens (tasks, categories, settings)
- `src/components/*`: Reusable UI
- `src/store/*`: Redux store and slices
- `src/services/*`: Side-effects (DB, notifications, MCP)
- `src/navigation/*`: Navigators
- `src/theme/*`: Theming utilities

### Initialization
- `App.tsx` initializes database, notifications, and MCP services before mounting navigation.
