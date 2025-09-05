import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { Todo, LocationReminder, NotificationSettings } from '../types';

const BACKGROUND_NOTIFICATION_TASK = 'background-notification-task';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  private settings: NotificationSettings = {
    enabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    locationReminders: true,
    smartSuggestions: true
  };

  async initialize(): Promise<boolean> {
    try {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      // Configure notification categories
      await this.setupNotificationCategories();

      // Set up background task for location-based notifications
      if (Platform.OS !== 'web') {
        await this.setupBackgroundTask();
      }

      return true;
    } catch (error) {
      console.error('Notification initialization error:', error);
      return false;
    }
  }

  private async setupNotificationCategories(): Promise<void> {
    await Notifications.setNotificationCategoryAsync('todo-reminder', [
      {
        identifier: 'complete',
        buttonTitle: 'Mark Complete',
        options: { opensAppToForeground: false }
      },
      {
        identifier: 'snooze',
        buttonTitle: 'Snooze 15min',
        options: { opensAppToForeground: false }
      },
      {
        identifier: 'view',
        buttonTitle: 'View',
        options: { opensAppToForeground: true }
      }
    ]);

    await Notifications.setNotificationCategoryAsync('location-reminder', [
      {
        identifier: 'complete',
        buttonTitle: 'Mark Complete',
        options: { opensAppToForeground: false }
      },
      {
        identifier: 'view',
        buttonTitle: 'View Task',
        options: { opensAppToForeground: true }
      }
    ]);
  }

  private async setupBackgroundTask(): Promise<void> {
    TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, ({ data, error }) => {
      if (error) {
        console.error('Background notification task error:', error);
        return;
      }

      if (data) {
        // Handle background location updates for location-based reminders
        console.log('Background location update:', data);
      }
    });
  }

  // Schedule todo reminder
  async scheduleTodoReminder(todo: Todo, reminderTime?: Date): Promise<string | null> {
    if (!this.settings.enabled) return null;

    try {
      const trigger = reminderTime || todo.dueDate;
      if (!trigger) return null;

      // Check if we're in quiet hours
      if (this.isQuietHours(trigger)) {
        // Reschedule for after quiet hours
        const nextAvailableTime = this.getNextAvailableTime(trigger);
        if (nextAvailableTime) {
          trigger.setTime(nextAvailableTime.getTime());
        }
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Task Reminder',
          body: todo.title,
          data: {
            todoId: todo.id,
            type: 'reminder'
          },
          categoryIdentifier: 'todo-reminder',
          sound: this.settings.soundEnabled ? 'default' : undefined,
        },
        trigger: {
          date: trigger,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Schedule notification error:', error);
      return null;
    }
  }

  // Schedule recurring reminders
  async scheduleRecurringReminder(todo: Todo): Promise<string[]> {
    if (!todo.recurring || !this.settings.enabled) return [];

    const notificationIds: string[] = [];

    try {
      const { type, interval, daysOfWeek, endDate, maxOccurrences } = todo.recurring;
      let currentDate = new Date();
      let occurrenceCount = 0;

      while (
        (!endDate || currentDate <= endDate) &&
        (!maxOccurrences || occurrenceCount < maxOccurrences)
      ) {
        let nextDate: Date;

        switch (type) {
          case 'daily':
            nextDate = new Date(currentDate.getTime() + (interval * 24 * 60 * 60 * 1000));
            break;
          case 'weekly':
            nextDate = new Date(currentDate.getTime() + (interval * 7 * 24 * 60 * 60 * 1000));
            break;
          case 'monthly':
            nextDate = new Date(currentDate);
            nextDate.setMonth(nextDate.getMonth() + interval);
            break;
          case 'yearly':
            nextDate = new Date(currentDate);
            nextDate.setFullYear(nextDate.getFullYear() + interval);
            break;
          default:
            return notificationIds;
        }

        // For weekly recurring with specific days
        if (type === 'weekly' && daysOfWeek && daysOfWeek.length > 0) {
          for (const dayOfWeek of daysOfWeek) {
            const dayDate = new Date(currentDate);
            const daysUntilTarget = (dayOfWeek - dayDate.getDay() + 7) % 7;
            dayDate.setDate(dayDate.getDate() + daysUntilTarget);

            if (dayDate > new Date()) {
              const notificationId = await this.scheduleTodoReminder(todo, dayDate);
              if (notificationId) {
                notificationIds.push(notificationId);
              }
            }
          }
        } else {
          const notificationId = await this.scheduleTodoReminder(todo, nextDate);
          if (notificationId) {
            notificationIds.push(notificationId);
          }
        }

        currentDate = nextDate;
        occurrenceCount++;

        // Prevent infinite loops
        if (occurrenceCount > 100) break;
      }
    } catch (error) {
      console.error('Schedule recurring reminder error:', error);
    }

    return notificationIds;
  }

  // Location-based reminders
  async scheduleLocationReminder(locationReminder: LocationReminder): Promise<boolean> {
    if (!this.settings.locationReminders) return false;

    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permissions not granted');
        return false;
      }

      // Start location tracking for this reminder
      await Location.startLocationUpdatesAsync(BACKGROUND_NOTIFICATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 30000, // Check every 30 seconds
        distanceInterval: 50, // Check every 50 meters
      });

      return true;
    } catch (error) {
      console.error('Schedule location reminder error:', error);
      return false;
    }
  }

  // Smart suggestions
  async sendSmartSuggestion(title: string, body: string, data?: any): Promise<string | null> {
    if (!this.settings.smartSuggestions) return null;

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'smart_suggestion',
            ...data
          },
        },
        trigger: null, // Send immediately
      });

      return notificationId;
    } catch (error) {
      console.error('Send smart suggestion error:', error);
      return null;
    }
  }

  // Cancel notifications
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Cancel notification error:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Cancel all notifications error:', error);
    }
  }

  async cancelTodoNotifications(todoId: string): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of scheduledNotifications) {
        if (notification.content.data?.todoId === todoId) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    } catch (error) {
      console.error('Cancel todo notifications error:', error);
    }
  }

  // Notification handling
  async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<void> {
    const { notification, actionIdentifier } = response;
    const { todoId, type } = notification.request.content.data || {};

    switch (actionIdentifier) {
      case 'complete':
        if (todoId) {
          // Dispatch action to mark todo as complete
          // This would be handled by the calling component
          console.log('Mark todo complete:', todoId);
        }
        break;
      case 'snooze':
        if (todoId) {
          // Reschedule notification for 15 minutes later
          const snoozeTime = new Date(Date.now() + 15 * 60 * 1000);
          // Would need todo data to reschedule
          console.log('Snooze todo:', todoId, snoozeTime);
        }
        break;
      case 'view':
        // Navigate to todo detail
        console.log('View todo:', todoId);
        break;
    }
  }

  // Settings management
  updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  // Utility methods
  private isQuietHours(date: Date): boolean {
    if (!this.settings.quietHours.enabled) return false;

    const time = date.getHours() * 100 + date.getMinutes();
    const start = this.parseTime(this.settings.quietHours.start);
    const end = this.parseTime(this.settings.quietHours.end);

    if (start <= end) {
      return time >= start && time <= end;
    } else {
      // Quiet hours span midnight
      return time >= start || time <= end;
    }
  }

  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 100 + minutes;
  }

  private getNextAvailableTime(date: Date): Date | null {
    if (!this.settings.quietHours.enabled) return null;

    const nextDay = new Date(date);
    const endTime = this.settings.quietHours.end;
    const [hours, minutes] = endTime.split(':').map(Number);
    
    nextDay.setHours(hours, minutes, 0, 0);
    
    // If end time is earlier in the day, it means quiet hours end the next day
    if (this.parseTime(this.settings.quietHours.end) < this.parseTime(this.settings.quietHours.start)) {
      nextDay.setDate(nextDay.getDate() + 1);
    }

    return nextDay;
  }

  // Badge management
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Set badge count error:', error);
    }
  }

  async clearBadge(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Clear badge error:', error);
    }
  }

  // Get scheduled notifications
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Get scheduled notifications error:', error);
      return [];
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
