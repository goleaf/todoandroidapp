import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppSettings, ViewMode } from '../../types';

interface SettingsState extends AppSettings {
  viewMode: ViewMode;
  isFirstLaunch: boolean;
}

const initialState: SettingsState = {
  theme: 'auto',
  language: 'en',
  viewMode: 'list',
  isFirstLaunch: true,
  notifications: {
    enabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
    locationReminders: true,
    smartSuggestions: true,
  },
  privacy: {
    biometricAuth: false,
    pinAuth: false,
    autoLock: false,
    autoLockTimeout: 5,
  },
  sync: {
    enabled: false,
    autoSync: true,
    syncInterval: 15,
    cloudProvider: 'firebase',
  },
  ai: {
    enabled: true,
    naturalLanguageProcessing: true,
    smartCategorization: true,
    priorityPrediction: true,
    habitSuggestions: true,
    productivityInsights: true,
    voiceCommands: true,
  },
  accessibility: {
    highContrast: false,
    largeText: false,
    colorBlindMode: 'none',
    screenReader: false,
    reduceMotion: false,
    hapticFeedback: true,
  },
  productivity: {
    pomodoroEnabled: true,
    deepWorkMode: false,
    distractionBlocking: false,
    timeTracking: true,
    goalTracking: true,
    habitTracking: true,
    gamification: true,
  },
  collaboration: {
    enabled: false,
    allowInvitations: true,
    shareAnalytics: false,
    realTimeUpdates: true,
    commentNotifications: true,
    mentionNotifications: true,
  },
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload;
    },
    updateLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    updateViewMode: (state, action: PayloadAction<ViewMode>) => {
      state.viewMode = action.payload;
    },
    updateNotificationSettings: (state, action: PayloadAction<Partial<SettingsState['notifications']>>) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    updatePrivacySettings: (state, action: PayloadAction<Partial<SettingsState['privacy']>>) => {
      state.privacy = { ...state.privacy, ...action.payload };
    },
    updateSyncSettings: (state, action: PayloadAction<Partial<SettingsState['sync']>>) => {
      state.sync = { ...state.sync, ...action.payload };
    },
    updateAISettings: (state, action: PayloadAction<Partial<SettingsState['ai']>>) => {
      state.ai = { ...state.ai, ...action.payload };
    },
    updateAccessibilitySettings: (state, action: PayloadAction<Partial<SettingsState['accessibility']>>) => {
      state.accessibility = { ...state.accessibility, ...action.payload };
    },
    updateProductivitySettings: (state, action: PayloadAction<Partial<SettingsState['productivity']>>) => {
      state.productivity = { ...state.productivity, ...action.payload };
    },
    updateCollaborationSettings: (state, action: PayloadAction<Partial<SettingsState['collaboration']>>) => {
      state.collaboration = { ...state.collaboration, ...action.payload };
    },
    completeFirstLaunch: (state) => {
      state.isFirstLaunch = false;
    },
    resetSettings: () => initialState,
  },
});

export const {
  updateTheme,
  updateLanguage,
  updateViewMode,
  updateNotificationSettings,
  updatePrivacySettings,
  updateSyncSettings,
  updateAISettings,
  updateAccessibilitySettings,
  updateProductivitySettings,
  updateCollaborationSettings,
  completeFirstLaunch,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
