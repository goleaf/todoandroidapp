import { useEffect, useCallback } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useHeader } from '../contexts/HeaderContext';
import { RootState } from '../store';
import { TaskStatus, TaskPriority } from '../types';

export interface ScreenHeaderConfig {
  enableSearch?: boolean;
  enableFilter?: boolean;
  enableSort?: boolean;
  enableViewMode?: boolean;
  enableQuickAdd?: boolean;
  customActions?: Array<{
    icon: string;
    onPress: () => void;
    badge?: number;
  }>;
}

export const useScreenHeader = (config: ScreenHeaderConfig = {}) => {
  const route = useRoute();
  const navigation = useNavigation();
  const { setHeaderConfig, updateTitle, updateSubtitle, addNotification } = useHeader();
  
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const { categories } = useSelector((state: RootState) => state.categories);

  // Screen-specific configurations
  const getScreenConfig = useCallback(() => {
    const screenName = route.name;
    
    switch (screenName) {
      case 'Tasks':
        return {
          title: 'Tasks',
          subtitle: `${tasks.length} tasks total`,
          showSearch: config.enableSearch !== false,
          searchPlaceholder: 'Search tasks...',
          showBackButton: false,
          showProfileMenu: true,
        };
        
      case 'Dashboard':
        const completedToday = tasks.filter(t => 
          t.status === TaskStatus.COMPLETED && 
          t.completedAt &&
          new Date(t.completedAt).toDateString() === new Date().toDateString()
        ).length;
        
        return {
          title: 'Dashboard',
          subtitle: `${completedToday} tasks completed today`,
          showSearch: false,
          showBackButton: false,
          showProfileMenu: true,
        };
        
      case 'Categories':
        return {
          title: 'Categories',
          subtitle: `${categories.length} categories`,
          showSearch: config.enableSearch !== false,
          searchPlaceholder: 'Search categories...',
          showBackButton: false,
          showProfileMenu: true,
        };
        
      case 'Settings':
        return {
          title: 'Settings',
          showSearch: false,
          showBackButton: false,
          showProfileMenu: true,
        };
        
      case 'AddTask':
        return {
          title: 'Add Task',
          showSearch: false,
          showBackButton: true,
          showProfileMenu: false,
        };
        
      case 'EditTask':
        return {
          title: 'Edit Task',
          showSearch: false,
          showBackButton: true,
          showProfileMenu: false,
        };
        
      case 'TaskDetails':
        return {
          title: 'Task Details',
          showSearch: false,
          showBackButton: true,
          showProfileMenu: false,
        };
        
      case 'AddCategory':
        return {
          title: 'Add Category',
          showSearch: false,
          showBackButton: true,
          showProfileMenu: false,
        };
        
      case 'EditCategory':
        return {
          title: 'Edit Category',
          showSearch: false,
          showBackButton: true,
          showProfileMenu: false,
        };
        
      default:
        return {
          title: 'Ultimate Todo',
          showSearch: false,
          showBackButton: false,
          showProfileMenu: true,
        };
    }
  }, [route.name, tasks, categories, config]);

  // Update header when screen changes or data updates
  useEffect(() => {
    const screenConfig = getScreenConfig();
    setHeaderConfig({
      ...screenConfig,
      actions: config.customActions || [],
    });
  }, [getScreenConfig, setHeaderConfig, config.customActions]);

  // Notification helpers for different screens
  const showTaskNotification = useCallback((type: 'created' | 'updated' | 'completed' | 'deleted', taskTitle: string) => {
    const messages = {
      created: `Task "${taskTitle}" created successfully`,
      updated: `Task "${taskTitle}" updated`,
      completed: `Task "${taskTitle}" completed! 🎉`,
      deleted: `Task "${taskTitle}" deleted`,
    };
    
    const types = {
      created: 'success' as const,
      updated: 'info' as const,
      completed: 'success' as const,
      deleted: 'info' as const,
    };
    
    addNotification({
      title: 'Task Update',
      message: messages[type],
      type: types[type],
    });
  }, [addNotification]);

  const showCategoryNotification = useCallback((type: 'created' | 'updated' | 'deleted', categoryName: string) => {
    const messages = {
      created: `Category "${categoryName}" created successfully`,
      updated: `Category "${categoryName}" updated`,
      deleted: `Category "${categoryName}" deleted`,
    };
    
    addNotification({
      title: 'Category Update',
      message: messages[type],
      type: 'success',
    });
  }, [addNotification]);

  const showOverdueTasksNotification = useCallback(() => {
    const overdueTasks = tasks.filter(t => 
      t.dueDate && 
      t.dueDate < new Date() && 
      t.status !== TaskStatus.COMPLETED
    );
    
    if (overdueTasks.length > 0) {
      addNotification({
        title: 'Overdue Tasks',
        message: `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`,
        type: 'warning',
        actionable: true,
        action: () => {
          // Navigate to tasks with overdue filter
          navigation.navigate('Tasks' as any);
        },
      });
    }
  }, [tasks, addNotification, navigation]);

  const showHighPriorityTasksNotification = useCallback(() => {
    const highPriorityTasks = tasks.filter(t => 
      t.priority === TaskPriority.HIGH && 
      t.status !== TaskStatus.COMPLETED
    );
    
    if (highPriorityTasks.length > 0) {
      addNotification({
        title: 'High Priority Tasks',
        message: `You have ${highPriorityTasks.length} high priority task${highPriorityTasks.length > 1 ? 's' : ''} pending`,
        type: 'info',
        actionable: true,
        action: () => {
          navigation.navigate('Tasks' as any);
        },
      });
    }
  }, [tasks, addNotification, navigation]);

  // Auto-check for notifications on certain screens
  useEffect(() => {
    if (route.name === 'Dashboard') {
      // Check for overdue tasks when viewing dashboard
      const timer = setTimeout(() => {
        showOverdueTasksNotification();
        showHighPriorityTasksNotification();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [route.name, showOverdueTasksNotification, showHighPriorityTasksNotification]);

  return {
    updateTitle,
    updateSubtitle,
    showTaskNotification,
    showCategoryNotification,
    showOverdueTasksNotification,
    showHighPriorityTasksNotification,
  };
};

export default useScreenHeader;
