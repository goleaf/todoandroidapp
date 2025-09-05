import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { LocationReminder, Todo } from '../types';
import { notificationService } from './notificationService';

const LOCATION_TASK_NAME = 'background-location-task';

class LocationService {
  private isTracking = false;
  private locationReminders: LocationReminder[] = [];
  private watchPositionSubscription: Location.LocationSubscription | null = null;

  async initialize(): Promise<boolean> {
    try {
      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permissions not granted');
        return false;
      }

      // Define background task
      TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }: TaskManager.TaskManagerTaskBody<Location.LocationTaskOptions>) => {
        if (error) {
          console.error('Location task error:', error);
          return;
        }

        if (data) {
          const { locations } = data as { locations: Location.LocationObject[] };
          this.handleLocationUpdate(locations[0]);
        }
      });

      return true;
    } catch (error) {
      console.error('Location service initialization error:', error);
      return false;
    }
  }

  // Get current location
  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return location;
    } catch (error) {
      console.error('Get current location error:', error);
      return null;
    }
  }

  // Get address from coordinates
  async getAddressFromCoordinates(latitude: number, longitude: number): Promise<string | null> {
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses.length > 0) {
        const address = addresses[0];
        const parts = [
          address.streetNumber,
          address.street,
          address.city,
          address.region,
          address.postalCode,
          address.country
        ].filter(Boolean);

        return parts.join(', ');
      }

      return null;
    } catch (error) {
      console.error('Get address from coordinates error:', error);
      return null;
    }
  }

  // Get coordinates from address
  async getCoordinatesFromAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const locations = await Location.geocodeAsync(address);

      if (locations.length > 0) {
        const location = locations[0];
        return {
          latitude: location.latitude,
          longitude: location.longitude
        };
      }

      return null;
    } catch (error) {
      console.error('Get coordinates from address error:', error);
      return null;
    }
  }

  // Add location reminder
  async addLocationReminder(reminder: Omit<LocationReminder, 'id' | 'createdAt'>): Promise<string> {
    const locationReminder: LocationReminder = {
      ...reminder,
      id: Date.now().toString() + Math.random(),
      createdAt: new Date()
    };

    this.locationReminders.push(locationReminder);

    // Start location tracking if not already tracking
    if (!this.isTracking) {
      await this.startLocationTracking();
    }

    return locationReminder.id;
  }

  // Remove location reminder
  removeLocationReminder(reminderId: string): void {
    this.locationReminders = this.locationReminders.filter(
      reminder => reminder.id !== reminderId
    );

    // Stop tracking if no more reminders
    if (this.locationReminders.length === 0) {
      this.stopLocationTracking();
    }
  }

  // Get location reminders for a todo
  getLocationRemindersForTodo(todoId: string): LocationReminder[] {
    return this.locationReminders.filter(reminder => reminder.todoId === todoId);
  }

  // Start location tracking
  async startLocationTracking(): Promise<boolean> {
    try {
      if (this.isTracking) return true;

      // Request background permissions
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Background location permissions not granted');
        return false;
      }

      // Start background location updates
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 30000, // 30 seconds
        distanceInterval: 50, // 50 meters
        deferredUpdatesInterval: 60000, // 1 minute
        foregroundService: {
          notificationTitle: 'Todo App Location Tracking',
          notificationBody: 'Tracking location for reminders',
        },
      });

      // Also start foreground tracking for immediate updates
      this.watchPositionSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000, // 10 seconds
          distanceInterval: 20, // 20 meters
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );

      this.isTracking = true;
      console.log('Location tracking started');
      return true;
    } catch (error) {
      console.error('Start location tracking error:', error);
      return false;
    }
  }

  // Stop location tracking
  async stopLocationTracking(): Promise<void> {
    try {
      if (!this.isTracking) return;

      // Stop background location updates
      const isTaskDefined = await TaskManager.isTaskDefined(LOCATION_TASK_NAME);
      if (isTaskDefined) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }

      // Stop foreground tracking
      if (this.watchPositionSubscription) {
        this.watchPositionSubscription.remove();
        this.watchPositionSubscription = null;
      }

      this.isTracking = false;
      console.log('Location tracking stopped');
    } catch (error) {
      console.error('Stop location tracking error:', error);
    }
  }

  // Handle location updates
  private async handleLocationUpdate(location: Location.LocationObject): Promise<void> {
    const { latitude, longitude } = location.coords;

    // Check each location reminder
    for (const reminder of this.locationReminders) {
      if (!reminder.enabled) continue;

      const distance = this.calculateDistance(
        latitude,
        longitude,
        reminder.location.latitude,
        reminder.location.longitude
      );

      const radius = reminder.location.radius || 100; // Default 100 meters

      const isInside = distance <= radius;
      const shouldTrigger = 
        (reminder.triggerType === 'enter' && isInside) ||
        (reminder.triggerType === 'exit' && !isInside);

      if (shouldTrigger) {
        await this.triggerLocationReminder(reminder);
      }
    }
  }

  // Trigger location reminder
  private async triggerLocationReminder(reminder: LocationReminder): Promise<void> {
    try {
      // Get todo details (this would need to be implemented)
      // For now, we'll create a generic notification
      const title = reminder.triggerType === 'enter' 
        ? 'Arrived at location' 
        : 'Left location';
      
      const body = `Location reminder for task`;

      await notificationService.scheduleLocationReminder(reminder);

      // Disable the reminder after triggering (prevent spam)
      reminder.enabled = false;

      console.log(`Location reminder triggered: ${title}`);
    } catch (error) {
      console.error('Trigger location reminder error:', error);
    }
  }

  // Calculate distance between two coordinates (Haversine formula)
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  // Get nearby places (using a simple implementation)
  async getNearbyPlaces(
    latitude: number,
    longitude: number,
    radius: number = 1000
  ): Promise<{
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    distance: number;
  }[]> {
    try {
      // This is a simplified implementation
      // In a real app, you'd use Google Places API or similar
      const places = [
        { name: 'Home', latitude: latitude + 0.001, longitude: longitude + 0.001 },
        { name: 'Work', latitude: latitude - 0.002, longitude: longitude + 0.002 },
        { name: 'Grocery Store', latitude: latitude + 0.003, longitude: longitude - 0.001 },
        { name: 'Gym', latitude: latitude - 0.001, longitude: longitude - 0.003 },
      ];

      const nearbyPlaces = [];

      for (const place of places) {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          place.latitude,
          place.longitude
        );

        if (distance <= radius) {
          const address = await this.getAddressFromCoordinates(
            place.latitude,
            place.longitude
          );

          nearbyPlaces.push({
            name: place.name,
            address: address || 'Unknown address',
            latitude: place.latitude,
            longitude: place.longitude,
            distance: Math.round(distance)
          });
        }
      }

      return nearbyPlaces.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error('Get nearby places error:', error);
      return [];
    }
  }

  // Check if location services are enabled
  async isLocationEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      console.error('Check location enabled error:', error);
      return false;
    }
  }

  // Get location permissions status
  async getPermissionsStatus(): Promise<{
    foreground: Location.PermissionStatus;
    background: Location.PermissionStatus;
  }> {
    try {
      const foreground = await Location.getForegroundPermissionsAsync();
      const background = await Location.getBackgroundPermissionsAsync();

      return {
        foreground: foreground.status,
        background: background.status
      };
    } catch (error) {
      console.error('Get permissions status error:', error);
      return {
        foreground: Location.PermissionStatus.UNDETERMINED,
        background: Location.PermissionStatus.UNDETERMINED
      };
    }
  }

  // Request location permissions
  async requestPermissions(background: boolean = false): Promise<boolean> {
    try {
      const foregroundResult = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundResult.status !== 'granted') {
        return false;
      }

      if (background) {
        const backgroundResult = await Location.requestBackgroundPermissionsAsync();
        return backgroundResult.status === 'granted';
      }

      return true;
    } catch (error) {
      console.error('Request permissions error:', error);
      return false;
    }
  }

  // Get tracking status
  isLocationTracking(): boolean {
    return this.isTracking;
  }

  // Get active reminders count
  getActiveRemindersCount(): number {
    return this.locationReminders.filter(reminder => reminder.enabled).length;
  }

  // Update location reminder
  updateLocationReminder(
    reminderId: string,
    updates: Partial<LocationReminder>
  ): boolean {
    const reminderIndex = this.locationReminders.findIndex(
      reminder => reminder.id === reminderId
    );

    if (reminderIndex === -1) return false;

    this.locationReminders[reminderIndex] = {
      ...this.locationReminders[reminderIndex],
      ...updates
    };

    return true;
  }

  // Clear all location reminders
  clearAllReminders(): void {
    this.locationReminders = [];
    this.stopLocationTracking();
  }

  // Export location reminders
  exportLocationReminders(): LocationReminder[] {
    return [...this.locationReminders];
  }

  // Import location reminders
  importLocationReminders(reminders: LocationReminder[]): void {
    this.locationReminders = [...reminders];
    
    if (this.locationReminders.length > 0 && !this.isTracking) {
      this.startLocationTracking();
    }
  }
}

export const locationService = new LocationService();
export default locationService;
