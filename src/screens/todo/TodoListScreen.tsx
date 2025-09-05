import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Searchbar, FAB, Card, Chip, IconButton } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { RootState } from '../../store';
import { 
  toggleTodo, 
  deleteTodo, 
  setSearchQuery, 
  setFilter,
  setSortBy,
  selectTodo,
  deselectTodo,
  clearSelection,
} from '../../store/slices/todoSlice';
import { Todo, SortOption } from '../../types';
import TodoItem from '../../components/todo/TodoItem';
import FilterModal from '../../components/todo/FilterModal';
import SortModal from '../../components/todo/SortModal';
import VoiceInput from '../../components/common/VoiceInput';

const { width } = Dimensions.get('window');

interface Props {
  navigation: any;
}

export default function TodoListScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const { 
    todos, 
    filter, 
    sortBy, 
    searchQuery, 
    selectedTodos 
  } = useSelector((state: RootState) => state.todos);
  const { categories } = useSelector((state: RootState) => state.categories);
  const { viewMode } = useSelector((state: RootState) => state.settings);
  
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);

  // Filter and sort todos
  const filteredTodos = todos.filter(todo => {
    // Search query filter
    if (searchQuery && !todo.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !todo.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Category filter
    if (filter.categories.length > 0 && (!todo.categoryId || !filter.categories.includes(todo.categoryId))) {
      return false;
    }

    // Priority filter
    if (filter.priorities.length > 0 && !filter.priorities.includes(todo.priority)) {
      return false;
    }

    // Status filter
    if (filter.statuses.length > 0 && !filter.statuses.includes(todo.status)) {
      return false;
    }

    // Date range filter
    if (filter.dateRange.start && todo.dueDate && new Date(todo.dueDate) < filter.dateRange.start) {
      return false;
    }
    if (filter.dateRange.end && todo.dueDate && new Date(todo.dueDate) > filter.dateRange.end) {
      return false;
    }

    // Tags filter
    if (filter.tags.length > 0 && !filter.tags.some(tag => todo.tags.includes(tag))) {
      return false;
    }

    return true;
  });

  // Sort todos
  const sortedTodos = [...filteredTodos].sort((a, b) => {
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
        return Number(a.completed) - Number(b.completed);
      default:
        return 0;
    }
  });

  const handleTodoPress = (todo: Todo) => {
    if (selectedTodos.length > 0) {
      // Selection mode
      if (selectedTodos.includes(todo.id)) {
        dispatch(deselectTodo(todo.id));
      } else {
        dispatch(selectTodo(todo.id));
      }
    } else {
      // Navigate to detail
      navigation.navigate('TodoDetail', { todoId: todo.id });
    }
  };

  const handleTodoLongPress = (todo: Todo) => {
    if (!selectedTodos.includes(todo.id)) {
      dispatch(selectTodo(todo.id));
    }
  };

  const handleToggleTodo = (todoId: string) => {
    dispatch(toggleTodo(todoId));
  };

  const handleDeleteTodo = (todoId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => dispatch(deleteTodo(todoId))
        },
      ]
    );
  };

  const handleVoiceInput = (text: string) => {
    // Simple voice-to-todo conversion
    navigation.navigate('AddTodo', { voiceInput: text });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filter.categories.length > 0) count++;
    if (filter.priorities.length > 0) count++;
    if (filter.statuses.length > 0) count++;
    if (filter.tags.length > 0) count++;
    if (filter.dateRange.start || filter.dateRange.end) count++;
    return count;
  };

  const renderTodoItem = ({ item }: { item: Todo }) => (
    <TodoItem
      todo={item}
      onPress={() => handleTodoPress(item)}
      onLongPress={() => handleTodoLongPress(item)}
      onToggle={() => handleToggleTodo(item.id)}
      onDelete={() => handleDeleteTodo(item.id)}
      isSelected={selectedTodos.includes(item.id)}
      categories={categories}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Searchbar
        placeholder="Search tasks..."
        onChangeText={(query) => dispatch(setSearchQuery(query))}
        value={searchQuery}
        style={styles.searchbar}
      />
      
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterButton, getActiveFiltersCount() > 0 && styles.activeFilter]}
          onPress={() => setShowFilterModal(true)}
        >
          <MaterialIcons name="filter-list" size={20} color="#666" />
          <Text style={styles.filterText}>Filter</Text>
          {getActiveFiltersCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowSortModal(true)}
        >
          <MaterialIcons name="sort" size={20} color="#666" />
          <Text style={styles.filterText}>Sort</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowVoiceInput(true)}
        >
          <MaterialIcons name="mic" size={20} color="#666" />
          <Text style={styles.filterText}>Voice</Text>
        </TouchableOpacity>
      </View>

      {selectedTodos.length > 0 && (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionText}>
            {selectedTodos.length} selected
          </Text>
          <View style={styles.selectionActions}>
            <IconButton
              icon="delete"
              size={24}
              onPress={() => {
                Alert.alert(
                  'Delete Tasks',
                  `Delete ${selectedTodos.length} selected tasks?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Delete', 
                      style: 'destructive',
                      onPress: () => {
                        selectedTodos.forEach(id => dispatch(deleteTodo(id)));
                        dispatch(clearSelection());
                      }
                    },
                  ]
                );
              }}
            />
            <IconButton
              icon="close"
              size={24}
              onPress={() => dispatch(clearSelection())}
            />
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedTodos}
        renderItem={renderTodoItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('AddTodo')}
      />

      <FilterModal
        visible={showFilterModal}
        onDismiss={() => setShowFilterModal(false)}
        filter={filter}
        onFilterChange={(newFilter) => dispatch(setFilter(newFilter))}
        categories={categories}
      />

      <SortModal
        visible={showSortModal}
        onDismiss={() => setShowSortModal(false)}
        sortBy={sortBy}
        onSortChange={(newSort) => dispatch(setSortBy(newSort))}
      />

      <VoiceInput
        visible={showVoiceInput}
        onDismiss={() => setShowVoiceInput(false)}
        onResult={handleVoiceInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    paddingBottom: 80,
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchbar: {
    marginBottom: 12,
    elevation: 0,
    backgroundColor: '#f5f5f5',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeFilter: {
    backgroundColor: '#e3f2fd',
  },
  filterText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  filterBadge: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
    borderRadius: 8,
  },
  selectionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1976d2',
  },
  selectionActions: {
    flexDirection: 'row',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
});
