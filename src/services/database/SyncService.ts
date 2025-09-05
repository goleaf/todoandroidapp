import SQLiteService from './SQLiteService';
import FirebaseService from './FirebaseService';
import { SyncStatus } from '../../types';

export class SyncService {
  private static instance: SyncService;
  private syncQueue: Array<{ table: string; operation: 'insert' | 'update' | 'delete'; data: any; id: string }> = [];
  private isSyncing: boolean = false;

  private constructor() {}

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  // Add operation to sync queue
  addToSyncQueue(table: string, operation: 'insert' | 'update' | 'delete', data: any, id: string) {
    this.syncQueue.push({ table, operation, data, id });
    
    // Auto-sync if online
    if (FirebaseService.isOnlineStatus() && FirebaseService.isAuthenticated()) {
      this.syncPendingChanges();
    }
  }

  // Sync pending changes to Firebase
  async syncPendingChanges(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0 || !FirebaseService.isAuthenticated()) {
      return;
    }

    this.isSyncing = true;

    try {
      const operations = this.syncQueue.map(item => ({
        collection: item.table,
        operation: item.operation === 'insert' ? 'set' as const : 
                  item.operation === 'update' ? 'update' as const : 'delete' as const,
        id: item.id,
        data: item.operation !== 'delete' ? item.data : undefined
      }));

      await FirebaseService.batchWrite(operations);
      
      // Clear processed items from queue
      this.syncQueue = [];

      console.log(`Synced ${operations.length} items to Firebase`);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Sync from Firebase to local database
  async syncFromCloud(): Promise<void> {
    if (!FirebaseService.isAuthenticated()) return;

    try {
      const tables = [
        'todos', 'categories', 'projects', 'teams', 'task_templates',
        'habit_trackers', 'mind_maps', 'achievements', 'badges'
      ];

      for (const table of tables) {
        const cloudData = await FirebaseService.getAll(table);
        
        for (const item of cloudData) {
          const localItem = await SQLiteService.getById(table, item.id);
          
          // Only update if cloud version is newer or doesn't exist locally
          if (!localItem || new Date(item.updated_at) > new Date(localItem.updated_at)) {
            if (localItem) {
              await SQLiteService.update(table, item.id, item);
            } else {
              await SQLiteService.create(table, item);
            }
          }
        }
      }

      console.log('Cloud sync completed');
    } catch (error) {
      console.error('Cloud sync failed:', error);
    }
  }

  // Full bidirectional sync
  async performFullSync(): Promise<void> {
    if (!FirebaseService.isAuthenticated()) return;

    try {
      // First, sync local changes to cloud
      await this.syncPendingChanges();
      
      // Then, sync cloud changes to local
      await this.syncFromCloud();
      
      console.log('Full sync completed');
    } catch (error) {
      console.error('Full sync failed:', error);
    }
  }

  // Get sync status
  async getSyncStatus(): Promise<SyncStatus> {
    return {
      lastSyncAt: new Date(), // This should be stored and retrieved from local storage
      isOnline: FirebaseService.isOnlineStatus(),
      pendingChanges: this.syncQueue.length,
      conflictCount: 0, // TODO: Implement conflict detection
      syncInProgress: this.isSyncing,
      lastError: undefined // TODO: Store last error
    };
  }

  // Force sync
  async forcSync(): Promise<void> {
    await this.performFullSync();
  }

  // Clear sync queue
  clearSyncQueue(): void {
    this.syncQueue = [];
  }

  // Get pending changes count
  getPendingChangesCount(): number {
    return this.syncQueue.length;
  }
}

export default SyncService.getInstance();
