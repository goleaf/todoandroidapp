import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';

import todoSlice from './slices/todoSlice';
import categorySlice from './slices/categorySlice';
import settingsSlice from './slices/settingsSlice';
import analyticsSlice from './slices/analyticsSlice';
import goalSlice from './slices/goalSlice';
import userSlice from './slices/userSlice';
import collaborationSlice from './slices/collaborationSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['todos', 'categories', 'settings', 'goals', 'user'], // Only persist these reducers
};

const rootReducer = combineReducers({
  todos: todoSlice,
  categories: categorySlice,
  settings: settingsSlice,
  analytics: analyticsSlice,
  goals: goalSlice,
  user: userSlice,
  collaboration: collaborationSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
