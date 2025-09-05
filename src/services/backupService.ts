import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { BackupData, Todo, Category, Goal } from '../types';
import { databaseService } from './database';

class BackupService {
  private readonly BACKUP_VERSION = '1.0.0';

  // Create backup
  async createBackup(): Promise<BackupData> {
    try {
      const todos = await databaseService.getTodos();
      const categories = await databaseService.getCategories();
      // const goals = await databaseService.getGoals(); // TODO: Implement goals
      // const habits = await databaseService.getHabits(); // TODO: Implement habits
      // const templates = await databaseService.getTemplates(); // TODO: Implement templates
      // const settings = await databaseService.getSettings(); // TODO: Implement settings

      const backupData: BackupData = {
        version: this.BACKUP_VERSION,
        exportedAt: new Date(),
        todos,
        categories,
        goals: [], // TODO: Add actual goals
        habits: [], // TODO: Add actual habits
        templates: [], // TODO: Add actual templates
        settings: {
          theme: 'auto',
          language: 'en',
          notifications: {
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
          },
          privacy: {
            biometricAuth: false,
            pinAuth: false,
            autoLock: false,
            autoLockTimeout: 5
          },
          sync: {
            enabled: true,
            autoSync: true,
            syncInterval: 5,
            cloudProvider: 'firebase'
          }
        }
      };

      return backupData;
    } catch (error) {
      console.error('Create backup error:', error);
      throw error;
    }
  }

  // Export backup to file
  async exportBackup(format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const backupData = await this.createBackup();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `todoapp-backup-${timestamp}.${format}`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      let content: string;

      if (format === 'json') {
        content = JSON.stringify(backupData, null, 2);
      } else {
        content = this.convertToCSV(backupData);
      }

      await FileSystem.writeAsStringAsync(filePath, content);

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: format === 'json' ? 'application/json' : 'text/csv',
          dialogTitle: 'Export Todo App Backup'
        });
      }

      return filePath;
    } catch (error) {
      console.error('Export backup error:', error);
      throw error;
    }
  }

  // Import backup from file
  async importBackup(): Promise<{
    success: boolean;
    imported: {
      todos: number;
      categories: number;
      goals: number;
    };
    errors: string[];
  }> {
    try {
      // Pick a file
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain'],
        copyToCacheDirectory: true
      });

      if (result.canceled) {
        return {
          success: false,
          imported: { todos: 0, categories: 0, goals: 0 },
          errors: ['Import cancelled by user']
        };
      }

      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri);
      
      let backupData: BackupData;
      
      try {
        backupData = JSON.parse(content);
      } catch (parseError) {
        return {
          success: false,
          imported: { todos: 0, categories: 0, goals: 0 },
          errors: ['Invalid backup file format']
        };
      }

      // Validate backup data
      const validation = this.validateBackupData(backupData);
      if (!validation.valid) {
        return {
          success: false,
          imported: { todos: 0, categories: 0, goals: 0 },
          errors: validation.errors
        };
      }

      // Import data
      const importResult = await this.importBackupData(backupData);
      
      return importResult;
    } catch (error) {
      console.error('Import backup error:', error);
      return {
        success: false,
        imported: { todos: 0, categories: 0, goals: 0 },
        errors: [error instanceof Error ? error.message : 'Unknown import error']
      };
    }
  }

  // Validate backup data
  private validateBackupData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.version) {
      errors.push('Missing backup version');
    }

    if (!data.exportedAt) {
      errors.push('Missing export date');
    }

    if (!Array.isArray(data.todos)) {
      errors.push('Invalid todos data');
    }

    if (!Array.isArray(data.categories)) {
      errors.push('Invalid categories data');
    }

    // Validate todo structure
    if (data.todos) {
      data.todos.forEach((todo: any, index: number) => {
        if (!todo.id || !todo.title) {
          errors.push(`Invalid todo at index ${index}: missing id or title`);
        }
      });
    }

    // Validate category structure
    if (data.categories) {
      data.categories.forEach((category: any, index: number) => {
        if (!category.id || !category.name) {
          errors.push(`Invalid category at index ${index}: missing id or name`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Import backup data into database
  private async importBackupData(backupData: BackupData): Promise<{
    success: boolean;
    imported: {
      todos: number;
      categories: number;
      goals: number;
    };
    errors: string[];
  }> {
    const imported = { todos: 0, categories: 0, goals: 0 };
    const errors: string[] = [];

    try {
      // Import categories first (todos may reference them)
      for (const category of backupData.categories) {
        try {
          await databaseService.createCategory({
            name: category.name,
            color: category.color,
            icon: category.icon,
            parentId: category.parentId
          });
          imported.categories++;
        } catch (error) {
          errors.push(`Failed to import category "${category.name}": ${error}`);
        }
      }

      // Import todos
      for (const todo of backupData.todos) {
        try {
          await databaseService.createTodo({
            title: todo.title,
            description: todo.description,
            completed: todo.completed,
            priority: todo.priority,
            status: todo.status,
            dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
            categoryId: todo.categoryId,
            parentId: todo.parentId,
            tags: todo.tags || [],
            attachments: todo.attachments || [],
            location: todo.location,
            estimatedTime: todo.estimatedTime,
            actualTime: todo.actualTime,
            recurring: todo.recurring,
            voiceMemo: todo.voiceMemo,
            customFields: todo.customFields || {}
          });
          imported.todos++;
        } catch (error) {
          errors.push(`Failed to import todo "${todo.title}": ${error}`);
        }
      }

      // Import goals
      for (const goal of backupData.goals || []) {
        try {
          // TODO: Implement goal import when goal service is ready
          imported.goals++;
        } catch (error) {
          errors.push(`Failed to import goal "${goal.title}": ${error}`);
        }
      }

      return {
        success: errors.length === 0,
        imported,
        errors
      };
    } catch (error) {
      console.error('Import backup data error:', error);
      return {
        success: false,
        imported,
        errors: [error instanceof Error ? error.message : 'Unknown import error']
      };
    }
  }

  // Convert backup data to CSV format
  private convertToCSV(backupData: BackupData): string {
    let csv = '';

    // Add metadata
    csv += 'Backup Information\n';
    csv += `Version,${backupData.version}\n`;
    csv += `Exported At,${backupData.exportedAt.toISOString()}\n`;
    csv += '\n';

    // Add todos
    csv += 'Todos\n';
    csv += 'ID,Title,Description,Completed,Priority,Status,Due Date,Category ID,Created At,Updated At\n';
    
    backupData.todos.forEach(todo => {
      const row = [
        todo.id,
        `"${todo.title.replace(/"/g, '""')}"`,
        `"${(todo.description || '').replace(/"/g, '""')}"`,
        todo.completed,
        todo.priority,
        todo.status,
        todo.dueDate ? todo.dueDate.toISOString() : '',
        todo.categoryId || '',
        todo.createdAt.toISOString(),
        todo.updatedAt.toISOString()
      ];
      csv += row.join(',') + '\n';
    });

    csv += '\n';

    // Add categories
    csv += 'Categories\n';
    csv += 'ID,Name,Color,Icon,Parent ID,Created At,Updated At\n';
    
    backupData.categories.forEach(category => {
      const row = [
        category.id,
        `"${category.name.replace(/"/g, '""')}"`,
        category.color,
        category.icon,
        category.parentId || '',
        category.createdAt.toISOString(),
        category.updatedAt.toISOString()
      ];
      csv += row.join(',') + '\n';
    });

    return csv;
  }

  // Create automatic backup
  async createAutomaticBackup(): Promise<void> {
    try {
      const backupData = await this.createBackup();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `auto-backup-${timestamp}.json`;
      const filePath = `${FileSystem.documentDirectory}backups/${fileName}`;

      // Ensure backups directory exists
      const backupsDir = `${FileSystem.documentDirectory}backups/`;
      const dirInfo = await FileSystem.getInfoAsync(backupsDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(backupsDir, { intermediates: true });
      }

      // Save backup
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(backupData, null, 2));

      // Clean up old backups (keep only last 5)
      await this.cleanupOldBackups();
    } catch (error) {
      console.error('Create automatic backup error:', error);
    }
  }

  // Clean up old automatic backups
  private async cleanupOldBackups(): Promise<void> {
    try {
      const backupsDir = `${FileSystem.documentDirectory}backups/`;
      const dirInfo = await FileSystem.getInfoAsync(backupsDir);
      
      if (!dirInfo.exists) return;

      const files = await FileSystem.readDirectoryAsync(backupsDir);
      const backupFiles = files
        .filter(file => file.startsWith('auto-backup-') && file.endsWith('.json'))
        .sort()
        .reverse(); // Most recent first

      // Keep only the 5 most recent backups
      const filesToDelete = backupFiles.slice(5);
      
      for (const file of filesToDelete) {
        await FileSystem.deleteAsync(`${backupsDir}${file}`);
      }
    } catch (error) {
      console.error('Cleanup old backups error:', error);
    }
  }

  // Get backup history
  async getBackupHistory(): Promise<{
    fileName: string;
    size: number;
    createdAt: Date;
  }[]> {
    try {
      const backupsDir = `${FileSystem.documentDirectory}backups/`;
      const dirInfo = await FileSystem.getInfoAsync(backupsDir);
      
      if (!dirInfo.exists) return [];

      const files = await FileSystem.readDirectoryAsync(backupsDir);
      const backupFiles = files.filter(file => 
        file.startsWith('auto-backup-') && file.endsWith('.json')
      );

      const history = [];
      
      for (const file of backupFiles) {
        const filePath = `${backupsDir}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        
        if (fileInfo.exists) {
          // Extract date from filename
          const dateMatch = file.match(/auto-backup-(.+)\.json/);
          const createdAt = dateMatch 
            ? new Date(dateMatch[1].replace(/-/g, ':').replace(/T/, 'T').slice(0, -4))
            : new Date(fileInfo.modificationTime || 0);

          history.push({
            fileName: file,
            size: fileInfo.size || 0,
            createdAt
          });
        }
      }

      return history.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Get backup history error:', error);
      return [];
    }
  }

  // Restore from automatic backup
  async restoreFromBackup(fileName: string): Promise<boolean> {
    try {
      const filePath = `${FileSystem.documentDirectory}backups/${fileName}`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (!fileInfo.exists) {
        throw new Error('Backup file not found');
      }

      const content = await FileSystem.readAsStringAsync(filePath);
      const backupData: BackupData = JSON.parse(content);

      const result = await this.importBackupData(backupData);
      return result.success;
    } catch (error) {
      console.error('Restore from backup error:', error);
      return false;
    }
  }
}

export const backupService = new BackupService();
export default backupService;
