import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Todo, LocationReminder } from '../types';

const LOCATION_TASK_NAME = 'background-location-task';

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {
    this.setupNotificationHandler();
    this.setupLocationTask();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private setupNotificationHandler() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }

  private setupLocationTask() {
    TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
      if (error) {
        console.error('Location task error:', error);
        return;
      }

      if (data) {
        const { locations } = data as any;
        console.log('Received new locations', locations);
        // Handle location-based reminders here
        this.checkLocationReminders(locations[0]);
      }
    });
  }

  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }

  // Schedule a notification for a todo
  async scheduleTodoNotification(todo: Todo): Promise<string | null> {
    if (!todo.dueDate) return null;

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    const trigger = new Date(todo.dueDate);
    
    // Schedule 15 minutes before due date
    trigger.setMinutes(trigger.getMinutes() - 15);

    if (trigger <= new Date()) return null; // Don't schedule past notifications

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Task Reminder',
        body: `"${todo.title}" is due in 15 minutes`,
        data: { todoId: todo.id, type: 'todo_reminder' },
        sound: true,
      },
      trigger,
    });

    return notificationId;
  }

  // Schedule recurring notifications for habits
  async scheduleHabitNotification(habitId: string, habitName: string, time: Date): Promise<string | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Habit Reminder',
        body: `Time for your daily habit: ${habitName}`,
        data: { habitId, type: 'habit_reminder' },
        sound: true,
      },
      trigger: {
        hour: time.getHours(),
        minute: time.getMinutes(),
        repeats: true,
      },
    });

    return notificationId;
  }

  // Schedule pomodoro notifications
  async schedulePomodoroNotification(type: 'work_end' | 'break_end', duration: number): Promise<string | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    const content = type === 'work_end' 
      ? { title: 'Work Session Complete!', body: 'Time for a break!' }
      : { title: 'Break Time Over!', body: 'Ready to get back to work?' };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        ...content,
        data: { type: 'pomodoro', pomodoroType: type },
        sound: true,
      },
      trigger: { seconds: duration * 60 },
    });

    return notificationId;
  }

  // Cancel a scheduled notification
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  // Cancel all notifications for a todo
  async cancelTodoNotifications(todoId: string): Promise<void> {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    for (const notification of scheduledNotifications) {
      if (notification.content.data?.todoId === todoId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  }

  // Setup location-based reminders
  async setupLocationReminders(): Promise<void> {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      console.log('Foreground location permission not granted');
      return;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.log('Background location permission not granted');
      return;
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 30000, // 30 seconds
      distanceInterval: 100, // 100 meters
    });
  }

  // Check location reminders
  private async checkLocationReminders(currentLocation: Location.LocationObject): Promise<void> {
    // This would typically fetch location reminders from the database
    // and check if the user is within the specified radius
    
    // Example implementation:
    // const reminders = await DatabaseService.getLocationReminders();
    // 
    // for (const reminder of reminders) {
    //   const distance = this.calculateDistance(
    //     currentLocation.coords,
    //     reminder.location
    //   );
    //   
    //   if (distance <= (reminder.location.radius || 100)) {
    //     await this.triggerLocationReminder(reminder);
    //   }
    // }
  }

  // Calculate distance between two coordinates
  private calculateDistance(
    coords1: { latitude: number; longitude: number },
    coords2: { latitude: number; longitude: number }
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = coords1.latitude * Math.PI / 180;
    const φ2 = coords2.latitude * Math.PI / 180;
    const Δφ = (coords2.latitude - coords1.latitude) * Math.PI / 180;
    const Δλ = (coords2.longitude - coords1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  // Trigger location-based reminder
  private async triggerLocationReminder(reminder: LocationReminder): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Location Reminder',
        body: `You're near your reminder location!`,
        data: { 
          reminderId: reminder.id,
          todoId: reminder.todoId,
          type: 'location_reminder' 
        },
        sound: true,
      },
      trigger: null, // Immediate notification
    });
  }

  // Send achievement notification
  async sendAchievementNotification(achievementName: string, xpReward: number): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏆 Achievement Unlocked!',
        body: `${achievementName} (+${xpReward} XP)`,
        data: { type: 'achievement' },
        sound: true,
      },
      trigger: null,
    });
  }

  // Send level up notification
  async sendLevelUpNotification(newLevel: number): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Level Up!',
        body: `Congratulations! You've reached level ${newLevel}!`,
        data: { type: 'level_up', level: newLevel },
        sound: true,
      },
      trigger: null,
    });
  }

  // Send streak notification
  async sendStreakNotification(streakDays: number): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    const milestones = [7, 30, 100, 365];
    if (milestones.includes(streakDays)) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔥 Streak Milestone!',
          body: `Amazing! You've maintained a ${streakDays}-day streak!`,
          data: { type: 'streak_milestone', days: streakDays },
          sound: true,
        },
        trigger: null,
      });
    }
  }

  // Send daily summary notification
  async sendDailySummaryNotification(completedTasks: number, totalTasks: number): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📊 Daily Summary',
        body: `You completed ${completedTasks}/${totalTasks} tasks today (${completionRate}%)`,
        data: { type: 'daily_summary' },
        sound: false,
      },
      trigger: null,
    });
  }

  // Get all scheduled notifications
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Stop location updates
  async stopLocationUpdates(): Promise<void> {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
  }
}

export default NotificationService.getInstance();
