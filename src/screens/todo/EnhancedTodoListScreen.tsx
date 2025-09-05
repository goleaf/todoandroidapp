import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { FAB, Snackbar, Portal, Modal, useTheme, Text, Button } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { RootState, AppDispatch } from '../../store';
import { Todo, Category, FilterOption, SortOption, ViewMode } from '../../types';
import EnhancedTodoItem from '../../components/todo/EnhancedTodoItem';
import SearchBar from '../../components/common/SearchBar';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { databaseService, voiceService, aiService, syncService } from '../../services';
import { 
  addTodo, 
  updateTodo, 
  deleteTodo, 
  toggleTodo, 
  setFilter, 
  setSortBy, 
  setSearchQuery,
  selectTodo,
  deselectTodo,
  clearSelection,
  bulkUpdateTodos,
  bulkDeleteTodos,
  startTimer,
  stopTimer,
  setLoading,
  setError
} from '../../store/slices/todoSlice';

interface EnhancedTodoListScreenProps {
  navigation: any;
  route: any;
}

export default function EnhancedTodoListScreen({ navigation, route }: EnhancedTodoListScreenProps) {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const { 
    todos, 
    filter, 
    sortBy, 
    searchQuery, 
    selectedTodos, 
    activeTimer, 
    focusMode, 
    loading, 
    error 
  } = useSelector((state: RootState) => state.todos);
  
  const { categories } = useSelector((state: RootState) => state.categories);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceResults, setVoiceResults] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Load todos on screen focus
  useFocusEffect(
    useCallback(() => {
      loadTodos();
    }, [])
  );

  // Load todos from database
  const loadTodos = async () => {
    try {
      dispatch(setLoading(true));
      const todosFromDb = await databaseService.getTodos();
      
      // Convert to Redux actions
      todosFromDb.forEach(todo => {
        dispatch(addTodo(todo));
      });
    } catch (error) {
      console.error('Load todos error:', error);
      dispatch(setError('Failed to load todos'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Refresh todos
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadTodos();
      
      // Sync with cloud if online
      if (syncService.isOnline()) {
        await syncService.forceSyncAll();
        showSnackbar('Synced with cloud');
      }
    } catch (error) {
      console.error('Refresh error:', error);
      showSnackbar('Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  // Filter and sort todos
  const getFilteredAndSortedTodos = (): Todo[] => {
    let filteredTodos = todos;

    // Apply search filter
    if (searchQuery) {
      filteredTodos = filteredTodos.filter(todo =>
        todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        todo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        todo.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply filters
    if (filter.categories.length > 0) {
      filteredTodos = filteredTodos.filter(todo =>
        todo.categoryId && filter.categories.includes(todo.categoryId)
      );
    }

    if (filter.priorities.length > 0) {
      filteredTodos = filteredTodos.filter(todo =>
        filter.priorities.includes(todo.priority)
      );
    }

    if (filter.statuses.length > 0) {
      filteredTodos = filteredTodos.filter(todo =>
        filter.statuses.includes(todo.status)
      );
    }

    if (filter.tags.length > 0) {
      filteredTodos = filteredTodos.filter(todo =>
        filter.tags.some(tag => todo.tags.includes(tag))
      );
    }

    if (filter.hasAttachments !== undefined) {
      filteredTodos = filteredTodos.filter(todo =>
        filter.hasAttachments ? todo.attachments.length > 0 : todo.attachments.length === 0
      );
    }

    if (filter.hasLocation !== undefined) {
      filteredTodos = filteredTodos.filter(todo =>
        filter.hasLocation ? !!todo.location : !todo.location
      );
    }

    // Apply date range filter
    if (filter.dateRange.start || filter.dateRange.end) {
      filteredTodos = filteredTodos.filter(todo => {
        if (!todo.dueDate) return false;
        const dueDate = new Date(todo.dueDate);
        
        if (filter.dateRange.start && dueDate < filter.dateRange.start) return false;
        if (filter.dateRange.end && dueDate > filter.dateRange.end) return false;
        
        return true;
      });
    }

    // Apply sorting
    filteredTodos.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        
        case 'completion':
          if (a.completed === b.completed) return 0;
          return a.completed ? 1 : -1;
        
        default:
          return 0;
      }
    });

    return filteredTodos;
  };

  // Handle todo actions
  const handleToggleTodo = async (todoId: string) => {
    try {
      const todo = todos.find(t => t.id === todoId);
      if (!todo) return;

      const updatedTodo = { ...todo, completed: !todo.completed };
      await databaseService.updateTodo(todoId, updatedTodo);
      dispatch(toggleTodo(todoId));
      
      showSnackbar(updatedTodo.completed ? 'Task completed!' : 'Task reopened');
    } catch (error) {
      console.error('Toggle todo error:', error);
      showSnackbar('Failed to update task');
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteTodo(todoId);
              dispatch(deleteTodo(todoId));
              showSnackbar('Task deleted');
            } catch (error) {
              console.error('Delete todo error:', error);
              showSnackbar('Failed to delete task');
            }
          }
        }
      ]
    );
  };

  const handleEditTodo = (todoId: string) => {
    navigation.navigate('EditTodo', { todoId });
  };

  const handleDuplicateTodo = async (todoId: string) => {
    try {
      const todo = todos.find(t => t.id === todoId);
      if (!todo) return;

      const duplicatedTodo = {
        ...todo,
        id: undefined,
        title: `${todo.title} (Copy)`,
        completed: false,
        createdAt: undefined,
        updatedAt: undefined
      };

      const newTodoId = await databaseService.createTodo(duplicatedTodo);
      const newTodo = { ...duplicatedTodo, id: newTodoId, createdAt: new Date(), updatedAt: new Date() };
      dispatch(addTodo(newTodo));
      
      showSnackbar('Task duplicated');
    } catch (error) {
      console.error('Duplicate todo error:', error);
      showSnackbar('Failed to duplicate task');
    }
  };

  const handleStartTimer = (todoId: string) => {
    const timeEntry = {
      id: Date.now().toString(),
      todoId,
      startTime: new Date(),
      description: 'Timer started',
      createdAt: new Date()
    };
    
    dispatch(startTimer({ todoId, timeEntry }));
    showSnackbar('Timer started');
  };

  const handleStopTimer = (todoId: string) => {
    dispatch(stopTimer({ todoId, endTime: new Date() }));
    showSnackbar('Timer stopped');
  };

  // Voice input handling
  const handleVoiceSearch = async () => {
    setVoiceModalVisible(true);
    setIsListening(true);
    
    try {
      const success = await voiceService.startListening(
        (results) => {
          setVoiceResults(results);
        },
        () => {
          setIsListening(false);
        }
      );
      
      if (!success) {
        showSnackbar('Voice recognition not available');
        setVoiceModalVisible(false);
      }
    } catch (error) {
      console.error('Voice search error:', error);
      showSnackbar('Voice search failed');
      setVoiceModalVisible(false);
    }
  };

  const handleVoiceCommand = async (speechText: string) => {
    try {
      const command = voiceService.parseVoiceCommand(speechText);
      
      if (command) {
        const action = await voiceService.executeVoiceCommand(command, todos);
        
        if (action) {
          switch (action.type) {
            case 'CREATE_TODO':
              const newTodoId = await databaseService.createTodo(action.payload);
              const newTodo = { ...action.payload, id: newTodoId };
              dispatch(addTodo(newTodo));
              showSnackbar(`Created task: ${action.payload.title}`);
              break;
            
            case 'UPDATE_TODO':
              await databaseService.updateTodo(action.payload.id, action.payload);
              dispatch(updateTodo(action.payload));
              showSnackbar('Task updated');
              break;
            
            case 'SET_SEARCH_QUERY':
              dispatch(setSearchQuery(action.payload));
              showSnackbar(`Searching for: ${action.payload}`);
              break;
          }
        }
      } else {
        showSnackbar('Voice command not recognized');
      }
    } catch (error) {
      console.error('Voice command error:', error);
      showSnackbar('Failed to process voice command');
    }
    
    setVoiceModalVisible(false);
  };

  // Utility functions
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const getCategoryForTodo = (todo: Todo): Category | undefined => {
    return categories.find(cat => cat.id === todo.categoryId);
  };

  // Render todo item
  const renderTodoItem = ({ item }: { item: Todo }) => (
    <EnhancedTodoItem
      todo={item}
      category={getCategoryForTodo(item)}
      onToggle={handleToggleTodo}
      onPress={() => navigation.navigate('TodoDetail', { todoId: item.id })}
      onDelete={handleDeleteTodo}
      onEdit={handleEditTodo}
      onDuplicate={handleDuplicateTodo}
      onStartTimer={handleStartTimer}
      onStopTimer={handleStopTimer}
      isTimerActive={activeTimer === item.id}
      isSelected={selectedTodos.includes(item.id)}
      onLongPress={(id) => dispatch(selectTodo(id))}
      showCategory={true}
      showPriority={true}
      showStatus={false}
    />
  );

  const filteredTodos = getFilteredAndSortedTodos();

  if (loading) {
    return <LoadingSpinner text="Loading tasks..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={(text) => dispatch(setSearchQuery(text))}
        onVoiceSearch={handleVoiceSearch}
        onFilterPress={() => setFilterModalVisible(true)}
        showVoiceButton={true}
        showFilterButton={true}
      />

      {/* Todo List */}
      <FlatList
        data={filteredTodos}
        renderItem={renderTodoItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="clipboard-text-outline"
            title="No tasks found"
            description={searchQuery ? "Try adjusting your search or filters" : "Create your first task to get started"}
            actionText={searchQuery ? "Clear Search" : "Add Task"}
            onAction={searchQuery ? () => dispatch(setSearchQuery('')) : () => navigation.navigate('AddTodo')}
          />
        }
        contentContainerStyle={filteredTodos.length === 0 ? styles.emptyContainer : undefined}
      />

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('AddTodo')}
        label="Add Task"
      />

      {/* Voice Modal */}
      <Portal>
        <Modal
          visible={voiceModalVisible}
          onDismiss={() => setVoiceModalVisible(false)}
          contentContainerStyle={[styles.voiceModal, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.voiceContent}>
            <Text variant="headlineSmall" style={styles.voiceTitle}>
              {isListening ? 'Listening...' : 'Voice Command'}
            </Text>
            
            {isListening && (
              <View style={styles.listeningIndicator}>
                <Text variant="bodyLarge">🎤 Speak now</Text>
              </View>
            )}
            
            {voiceResults.length > 0 && (
              <View style={styles.voiceResults}>
                <Text variant="bodyMedium">You said:</Text>
                {voiceResults.map((result, index) => (
                  <Button
                    key={index}
                    mode="outlined"
                    onPress={() => handleVoiceCommand(result)}
                    style={styles.voiceResultButton}
                  >
                    {result}
                  </Button>
                ))}
              </View>
            )}
            
            <Button
              mode="contained"
              onPress={() => setVoiceModalVisible(false)}
              style={styles.voiceCloseButton}
            >
              Close
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  voiceModal: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  voiceContent: {
    alignItems: 'center',
  },
  voiceTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  listeningIndicator: {
    padding: 20,
    alignItems: 'center',
  },
  voiceResults: {
    width: '100%',
    marginVertical: 20,
  },
  voiceResultButton: {
    marginVertical: 4,
  },
  voiceCloseButton: {
    marginTop: 20,
    minWidth: 120,
  },
});
