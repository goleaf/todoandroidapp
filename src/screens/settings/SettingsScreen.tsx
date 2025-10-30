import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  List, 
  Switch,
  Card,
  Text,
  SegmentedButtons,
  useTheme,
  Button,
  Dialog,
  Portal,
  ActivityIndicator
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

import { RootState, AppDispatch } from '../../store';
import { updateSettings } from '../../store/slices/settingsSlice';
import { loadTasks, createTask } from '../../store/slices/tasksSlice';
import { loadCategories, createCategory } from '../../store/slices/categoriesSlice';
import { exportImportService } from '../../services/exportImport';
import useScreenHeader from '../../hooks/useScreenHeader';

const SettingsScreen = () => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();

  const settings = useSelector((state: RootState) => state.settings);
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const { categories } = useSelector((state: RootState) => state.categories);

  const [exportDialogVisible, setExportDialogVisible] = useState(false);
  const [importDialogVisible, setImportDialogVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Initialize header for this screen
  useScreenHeader();

  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];

  const viewOptions = [
    { value: 'list', label: 'List' },
    { value: 'kanban', label: 'Kanban' },
    { value: 'calendar', label: 'Calendar' },
  ];

  const handleExportJSON = async () => {
    setIsExporting(true);
    setExportDialogVisible(false);
    
    try {
      await exportImportService.exportToJSON(tasks, categories);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    setExportDialogVisible(false);
    
    try {
      await exportImportService.exportToCSV(tasks, categories);
    } catch (error) {
      console.error('CSV export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    setImportDialogVisible(false);
    
    try {
      const importData = await exportImportService.importFromJSON();
      
      if (importData) {
        // Show confirmation dialog
        Alert.alert(
          'Import Data',
          `This will import ${importData.tasks.length} tasks and ${importData.categories.length} categories. This action cannot be undone. Continue?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Import', 
              style: 'destructive',
              onPress: async () => {
                try {
                  // Import categories first
                  for (const category of importData.categories) {
                    await dispatch(createCategory({
                      name: category.name,
                      color: category.color,
                      icon: category.icon,
                      parentId: category.parentId,
                    })).unwrap();
                  }

                  // Then import tasks
                  for (const task of importData.tasks) {
                    await dispatch(createTask({
                      title: task.title,
                      description: task.description,
                      status: task.status,
                      priority: task.priority,
                      categoryId: task.categoryId,
                      dueDate: task.dueDate,
                    })).unwrap();
                  }

                  // Reload data
                  await dispatch(loadTasks()).unwrap();
                  await dispatch(loadCategories()).unwrap();

                  Alert.alert(
                    'Import Successful',
                    `Successfully imported ${importData.tasks.length} tasks and ${importData.categories.length} categories!`,
                    [{ text: 'OK' }]
                  );
                } catch (error) {
                  console.error('Import processing failed:', error);
                  Alert.alert(
                    'Import Failed',
                    'Failed to process imported data. Please try again.',
                    [{ text: 'OK' }]
                  );
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const exportStats = exportImportService.getExportStats(tasks, categories);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Appearance */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Appearance
            </Text>
            
            <Text variant="bodyMedium" style={styles.settingLabel}>
              Theme
            </Text>
            <SegmentedButtons
              value={settings.theme}
              onValueChange={(value) => dispatch(updateSettings({ theme: value as any }))}
              buttons={themeOptions}
              style={styles.segmentedButtons}
            />
          </Card.Content>
        </Card>

        {/* Default View */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Default View
            </Text>
            
            <Text variant="bodyMedium" style={styles.settingLabel}>
              Preferred task view
            </Text>
            <SegmentedButtons
              value={settings.defaultView}
              onValueChange={(value) => dispatch(updateSettings({ defaultView: value as any }))}
              buttons={viewOptions}
              style={styles.segmentedButtons}
            />
          </Card.Content>
        </Card>

        {/* Notifications */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Notifications
            </Text>
            
            <List.Item
              title="Enable Notifications"
              description="Receive reminders for due tasks"
              left={props => <List.Icon {...props} icon="notifications" />}
              right={() => (
                <Switch
                  value={settings.notificationsEnabled}
                  onValueChange={(value) => dispatch(updateSettings({ notificationsEnabled: value }))}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Task Behavior */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Task Behavior
            </Text>
            
            <List.Item
              title="Auto-complete Subtasks"
              description="Automatically mark parent task complete when all subtasks are done"
              left={props => <List.Icon {...props} icon="checklist" />}
              right={() => (
                <Switch
                  value={settings.autoCompleteSubtasks}
                  onValueChange={(value) => dispatch(updateSettings({ autoCompleteSubtasks: value }))}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Data Management */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Data Management
            </Text>
            
            <Text variant="bodySmall" style={styles.dataStats}>
              {exportStats.totalTasks} tasks • {exportStats.completedTasks} completed • {exportStats.totalCategories} categories
              {'\n'}Estimated backup size: {exportStats.estimatedFileSize}
            </Text>
            
            <List.Item
              title="Export Data"
              description="Backup your tasks and categories"
              left={props => <List.Icon {...props} icon="download" />}
              onPress={() => setExportDialogVisible(true)}
              disabled={isExporting}
            />
            
            <List.Item
              title="Import Data"
              description="Restore from a backup file"
              left={props => <List.Icon {...props} icon="upload" />}
              onPress={() => setImportDialogVisible(true)}
              disabled={isImporting}
            />

            {(isExporting || isImporting) && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" />
                <Text variant="bodySmall" style={styles.loadingText}>
                  {isExporting ? 'Exporting data...' : 'Importing data...'}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* App Info */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              About
            </Text>
            
            <List.Item
              title="Ultimate Todo App"
              description="Version 1.0.0"
              left={props => <List.Icon {...props} icon="info" />}
            />
            
            <List.Item
              title="Built with React Native"
              description="Cross-platform mobile development"
              left={props => <List.Icon {...props} icon="code" />}
            />
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Export Dialog */}
      <Portal>
        <Dialog visible={exportDialogVisible} onDismiss={() => setExportDialogVisible(false)}>
          <Dialog.Title>Export Data</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Choose the format for exporting your data:
            </Text>
            <Text variant="bodySmall" style={styles.exportInfo}>
              • JSON: Complete backup with all data{'\n'}
              • CSV: Spreadsheet format for tasks only
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setExportDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleExportCSV}>Export CSV</Button>
            <Button onPress={handleExportJSON} mode="contained">Export JSON</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Import Dialog */}
      <Portal>
        <Dialog visible={importDialogVisible} onDismiss={() => setImportDialogVisible(false)}>
          <Dialog.Title>Import Data</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Select a JSON backup file to restore your tasks and categories.
            </Text>
            <Text variant="bodySmall" style={styles.importWarning}>
              ⚠️ This will add imported data to your existing data. Duplicates may occur.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setImportDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleImport} mode="contained">Select File</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  settingLabel: {
    marginBottom: 8,
    opacity: 0.7,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  dataStats: {
    marginBottom: 16,
    opacity: 0.7,
    lineHeight: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    opacity: 0.7,
  },
  exportInfo: {
    marginTop: 12,
    opacity: 0.7,
    lineHeight: 18,
  },
  importWarning: {
    marginTop: 12,
    opacity: 0.8,
    color: '#ff6b35',
    lineHeight: 18,
  },
});

export default SettingsScreen;
