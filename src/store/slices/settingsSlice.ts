import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppSettings } from '../../types';
import { notificationService } from '../../services/notifications';

const initialState: AppSettings = {
  theme: 'system',
  notificationsEnabled: true,
  defaultView: 'list',
  autoCompleteSubtasks: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateSettings: (state, action: PayloadAction<Partial<AppSettings>>) => {
      const newSettings = { ...state, ...action.payload };
      
      // Handle notification settings changes asynchronously
      if ('notificationsEnabled' in action.payload) {
        if (action.payload.notificationsEnabled) {
          notificationService.scheduleDailySummary().catch(console.error);
        } else {
          notificationService.cancelDailySummary().catch(console.error);
          notificationService.cancelAllNotifications().catch(console.error);
        }
      }
      
      return newSettings;
    },
    resetSettings: () => initialState,
  },
});

export const { updateSettings, resetSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
