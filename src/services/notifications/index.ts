import { PermissionsAndroid, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, TaskStatus } from '../../types';

interface ScheduledNotification {
  id: string;
  taskId: string;
  title: string;
  message: string;
  scheduledTime: Date;
  type: 'task_reminder' | 'daily_summary' | 'overdue_alert';
}

class NotificationService {
  private initialized = false;
  private scheduledNotifications: ScheduledNotification[] = [];
  private notificationId = 1;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Request permissions for Android
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notification Permission',
            message: 'Ultimate Todo App needs notification permission to remind you about your tasks.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Notification permission denied');
          return;
        }
      } catch (err) {
        console.warn('Permission request error:', err);
        return;
      }
    }

    // Load scheduled notifications from storage
    await this.loadScheduledNotifications();

    // Set up periodic checks for due notifications
    this.startNotificationChecker();

    console.log('Notification service initialized');
    this.initialized = true;
  }

  private async loadScheduledNotifications(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('scheduledNotifications');
      if (stored) {
        this.scheduledNotifications = JSON.parse(stored).map((n: any) => ({
          ...n,
          scheduledTime: new Date(n.scheduledTime)
        }));
      }
    } catch (error) {
      console.error('Failed to load scheduled notifications:', error);
    }
  }

  private async saveScheduledNotifications(): Promise<void> {
    try {
      await AsyncStorage.setItem('scheduledNotifications', JSON.stringify(this.scheduledNotifications));
    } catch (error) {
      console.error('Failed to save scheduled notifications:', error);
    }
  }

  private startNotificationChecker(): void {
    // Check for due notifications every minute
    setInterval(() => {
      this.checkDueNotifications();
    }, 60000);
  }

  private async checkDueNotifications(): Promise<void> {
    const now = new Date();
    const dueNotifications = this.scheduledNotifications.filter(
      notification => notification.scheduledTime <= now
    );

    for (const notification of dueNotifications) {
      this.showNotification(notification);
      // Remove from scheduled list
      this.scheduledNotifications = this.scheduledNotifications.filter(
        n => n.id !== notification.id
      );
    }

    if (dueNotifications.length > 0) {
      await this.saveScheduledNotifications();
    }
  }

  private showNotification(notification: ScheduledNotification): void {
    // For now, show as alert. In production, use proper push notifications
    Alert.alert(
      notification.title,
      notification.message,
      [{ text: 'OK', style: 'default' }]
    );
  }

  async scheduleTaskReminder(task: Task): Promise<void> {
    if (!this.initialized || !task.dueDate || task.status === TaskStatus.COMPLETED) {
      return;
    }

    // Cancel existing reminder for this task
    await this.cancelTaskReminder(task.id);

    // Schedule reminder 1 hour before due date
    const reminderTime = new Date(task.dueDate.getTime() - 60 * 60 * 1000);
    
    // Only schedule if reminder time is in the future
    if (reminderTime > new Date()) {
      const notification: ScheduledNotification = {
        id: `task_${task.id}_${this.notificationId++}`,
        taskId: task.id,
        title: 'Task Reminder',
        message: `"${task.title}" is due in 1 hour`,
        scheduledTime: reminderTime,
        type: 'task_reminder'
      };

      this.scheduledNotifications.push(notification);
      await this.saveScheduledNotifications();
      
      console.log(`Scheduled reminder for task: ${task.title} at ${reminderTime.toLocaleString()}`);
    }

    // Schedule overdue alert for tasks past due date
    const overdueTime = new Date(task.dueDate.getTime() + 60 * 60 * 1000); // 1 hour after due
    if (overdueTime > new Date()) {
      const overdueNotification: ScheduledNotification = {
        id: `overdue_${task.id}_${this.notificationId++}`,
        taskId: task.id,
        title: 'Task Overdue!',
        message: `"${task.title}" is now overdue`,
        scheduledTime: overdueTime,
        type: 'overdue_alert'
      };

      this.scheduledNotifications.push(overdueNotification);
      await this.saveScheduledNotifications();
    }
  }

  async cancelTaskReminder(taskId: string): Promise<void> {
    if (!this.initialized) return;

    const initialLength = this.scheduledNotifications.length;
    this.scheduledNotifications = this.scheduledNotifications.filter(
      notification => notification.taskId !== taskId
    );

    if (this.scheduledNotifications.length !== initialLength) {
      await this.saveScheduledNotifications();
      console.log(`Cancelled reminders for task: ${taskId}`);
    }
  }

  async scheduleDailySummary(): Promise<void> {
    if (!this.initialized) return;

    // Cancel existing daily summary
    await this.cancelDailySummary();

    // Schedule daily summary at 8 AM every day
    const now = new Date();
    const tomorrow8AM = new Date();
    tomorrow8AM.setDate(now.getDate() + 1);
    tomorrow8AM.setHours(8, 0, 0, 0);

    const notification: ScheduledNotification = {
      id: `daily_summary_${this.notificationId++}`,
      taskId: 'daily_summary',
      title: 'Daily Task Summary',
      message: 'Check your tasks for today',
      scheduledTime: tomorrow8AM,
      type: 'daily_summary'
    };

    this.scheduledNotifications.push(notification);
    await this.saveScheduledNotifications();
    
    console.log('Scheduled daily summary notifications');
  }

  async cancelDailySummary(): Promise<void> {
    if (!this.initialized) return;
    
    const initialLength = this.scheduledNotifications.length;
    this.scheduledNotifications = this.scheduledNotifications.filter(
      notification => notification.type !== 'daily_summary'
    );

    if (this.scheduledNotifications.length !== initialLength) {
      await this.saveScheduledNotifications();
      console.log('Cancelled daily summary notifications');
    }
  }

  sendImmediateNotification(title: string, message: string): void {
    if (!this.initialized) return;

    // Show a simple alert instead of push notification for demo
    Alert.alert(title, message);
  }

  async cancelAllNotifications(): Promise<void> {
    if (!this.initialized) return;
    
    this.scheduledNotifications = [];
    await this.saveScheduledNotifications();
    console.log('Cancelled all notifications');
  }

  getScheduledNotifications(): Promise<ScheduledNotification[]> {
    return Promise.resolve([...this.scheduledNotifications]);
  }
}

export const notificationService = new NotificationService();
export default notificationService;
