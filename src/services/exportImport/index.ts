import RNFS from 'react-native-fs';
import DocumentPicker from 'react-native-document-picker';
import Share from 'react-native-share';
import { Alert, Platform } from 'react-native';
import { Task, Category } from '../../types';

export interface ExportData {
  tasks: Task[];
  categories: Category[];
  exportDate: string;
  appVersion: string;
}

class ExportImportService {
  
  // Export tasks and categories to JSON
  async exportToJSON(tasks: Task[], categories: Category[]): Promise<void> {
    try {
      const exportData: ExportData = {
        tasks,
        categories,
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0',
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const fileName = `todo_backup_${new Date().toISOString().split('T')[0]}.json`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

      await RNFS.writeFile(filePath, jsonString, 'utf8');

      // Share the file
      await Share.open({
        url: `file://${filePath}`,
        type: 'application/json',
        title: 'Export Todo Data',
        message: 'Your todo data has been exported successfully!',
      });

      Alert.alert(
        'Export Successful',
        `Your data has been exported to ${fileName}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert(
        'Export Failed',
        'Failed to export your data. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }

  // Export tasks to CSV format
  async exportToCSV(tasks: Task[], categories: Category[]): Promise<void> {
    try {
      // Create category lookup
      const categoryLookup = categories.reduce((acc, cat) => {
        acc[cat.id] = cat.name;
        return acc;
      }, {} as Record<string, string>);

      // CSV headers
      const headers = [
        'Title',
        'Description',
        'Status',
        'Priority',
        'Category',
        'Due Date',
        'Created At',
        'Updated At',
        'Completed At'
      ];

      // Convert tasks to CSV rows
      const csvRows = tasks.map(task => [
        `"${task.title.replace(/"/g, '""')}"`, // Escape quotes
        `"${(task.description || '').replace(/"/g, '""')}"`,
        task.status,
        task.priority,
        task.categoryId ? categoryLookup[task.categoryId] || 'Unknown' : 'No Category',
        task.dueDate ? task.dueDate.toISOString() : '',
        task.createdAt.toISOString(),
        task.updatedAt.toISOString(),
        task.completedAt ? task.completedAt.toISOString() : ''
      ]);

      // Combine headers and rows
      const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
      
      const fileName = `todo_export_${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

      await RNFS.writeFile(filePath, csvContent, 'utf8');

      // Share the file
      await Share.open({
        url: `file://${filePath}`,
        type: 'text/csv',
        title: 'Export Todo Data (CSV)',
        message: 'Your todo data has been exported to CSV format!',
      });

      Alert.alert(
        'Export Successful',
        `Your data has been exported to ${fileName}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('CSV export failed:', error);
      Alert.alert(
        'Export Failed',
        'Failed to export your data to CSV. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }

  // Import data from JSON file
  async importFromJSON(): Promise<ExportData | null> {
    try {
      const result = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.json],
        copyTo: 'documentDirectory',
      });

      if (!result.fileCopyUri) {
        throw new Error('Failed to copy file');
      }

      const fileContent = await RNFS.readFile(result.fileCopyUri, 'utf8');
      const importData: ExportData = JSON.parse(fileContent);

      // Validate the imported data structure
      if (!this.validateImportData(importData)) {
        throw new Error('Invalid file format');
      }

      // Convert date strings back to Date objects
      const processedData: ExportData = {
        ...importData,
        tasks: importData.tasks.map(task => ({
          ...task,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        })),
        categories: importData.categories.map(category => ({
          ...category,
          createdAt: new Date(category.createdAt),
          updatedAt: new Date(category.updatedAt),
        })),
      };

      return processedData;
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        // User cancelled the picker
        return null;
      }

      console.error('Import failed:', error);
      Alert.alert(
        'Import Failed',
        'Failed to import data. Please make sure you selected a valid backup file.',
        [{ text: 'OK' }]
      );
      return null;
    }
  }

  // Validate imported data structure
  private validateImportData(data: any): data is ExportData {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check required fields
    if (!Array.isArray(data.tasks) || !Array.isArray(data.categories)) {
      return false;
    }

    // Validate task structure
    for (const task of data.tasks) {
      if (!task.id || !task.title || !task.status || !task.priority) {
        return false;
      }
    }

    // Validate category structure
    for (const category of data.categories) {
      if (!category.id || !category.name || !category.color) {
        return false;
      }
    }

    return true;
  }

  // Get export statistics
  getExportStats(tasks: Task[], categories: Category[]): {
    totalTasks: number;
    completedTasks: number;
    totalCategories: number;
    estimatedFileSize: string;
  } {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalCategories = categories.length;
    
    // Rough estimate of JSON file size
    const jsonString = JSON.stringify({ tasks, categories });
    const sizeInBytes = new Blob([jsonString]).size;
    const sizeInKB = Math.round(sizeInBytes / 1024);
    
    return {
      totalTasks,
      completedTasks,
      totalCategories,
      estimatedFileSize: sizeInKB > 1024 
        ? `${Math.round(sizeInKB / 1024 * 10) / 10} MB`
        : `${sizeInKB} KB`,
    };
  }

  // Clean up temporary files
  async cleanupTempFiles(): Promise<void> {
    try {
      const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
      const tempFiles = files.filter(file => 
        file.name.startsWith('todo_backup_') || 
        file.name.startsWith('todo_export_')
      );

      // Keep only the 5 most recent files
      const sortedFiles = tempFiles
        .sort((a, b) => b.mtime!.getTime() - a.mtime!.getTime())
        .slice(5);

      for (const file of sortedFiles) {
        await RNFS.unlink(file.path);
      }
    } catch (error) {
      console.error('Failed to cleanup temp files:', error);
    }
  }
}

export const exportImportService = new ExportImportService();
export default exportImportService;
