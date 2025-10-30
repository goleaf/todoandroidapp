import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Keyboard,
  Animated,
} from 'react-native';
import {
  TextInput,
  Button,
  useTheme,
  Surface,
  Text,
  Chip,
  Menu,
  IconButton,
  Card,
  ProgressBar,
  Portal,
  Modal,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DatePicker from 'react-native-date-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { RootState } from '../../store';
import { createTask, updateTask } from '../../store/slices/tasksSlice';
import { loadCategories } from '../../store/slices/categoriesSlice';
import { Task, Category, TaskPriority, TaskStatus, RootStackParamList } from '../../types';
import { materialStyles, priorityColors, statusColors } from '../../theme/MaterialTheme';
import MCPService from '../../services/mcp/MCPService';
import type { MCPTaskSuggestion } from '../../services/mcp/MCPService';

type AddTaskScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddTask'>;
type AddTaskScreenRouteProp = RouteProp<RootStackParamList, 'AddTask'>;

const AddTaskScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<AddTaskScreenNavigationProp>();
  const route = useRoute<AddTaskScreenRouteProp>();
  const dispatch = useDispatch();
  
  const { categories } = useSelector((state: RootState) => state.categories || { categories: [] });
  const { tasks } = useSelector((state: RootState) => state.tasks || { tasks: [] });
  
  const isEditing = !!route.params?.taskId;
  const existingTask = isEditing ? tasks.find((t: Task) => t.id === route.params?.taskId) : null;

  // Form state
  const [title, setTitle] = useState(existingTask?.title || '');
  const [description, setDescription] = useState(existingTask?.description || '');
  const [priority, setPriority] = useState<TaskPriority>(existingTask?.priority || 'medium');
  const [status, setStatus] = useState<TaskStatus>(existingTask?.status || 'todo');
  const [categoryId, setCategoryId] = useState(existingTask?.categoryId || route.params?.categoryId || '');
  const [dueDate, setDueDate] = useState<Date | undefined>(
    existingTask?.dueDate ? new Date(existingTask.dueDate) : undefined
  );
  const [dueTime, setDueTime] = useState<Date | undefined>(
    existingTask?.dueDate ? new Date(existingTask.dueDate) : undefined
  );

  // UI state
  const [saving, setSaving] = useState(false);
  const [priorityMenuVisible, setPriorityMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [suggestions, setSuggestions] = useState<MCPTaskSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null);

  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    const loadData = async () => {
      try {
        await (dispatch as any)(loadCategories()).unwrap();
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    
    loadData();
    
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: materialStyles.animation.duration.medium2,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: materialStyles.animation.duration.medium2,
        useNativeDriver: true,
      }),
    ]).start();
  }, [dispatch]);

  // Load AI suggestions when title changes
  useEffect(() => {
    const loadSuggestions = async () => {
      if (title.length > 3 && !isEditing) {
        setLoadingSuggestions(true);
        try {
          const aiSuggestions = await MCPService.generateTaskSuggestions(tasks, categories, title);
          setSuggestions(aiSuggestions.slice(0, 3));
        } catch (error) {
          console.error('Failed to load suggestions:', error);
        } finally {
          setLoadingSuggestions(false);
        }
      }
    };

    const debounceTimer = setTimeout(loadSuggestions, 1000);
    return () => clearTimeout(debounceTimer);
  }, [title, tasks, categories, isEditing]);

  // Predict task duration
  useEffect(() => {
    const predictDuration = async () => {
      if (title && description && categoryId && priority) {
        try {
          const duration = await MCPService.predictTaskDuration(
            title,
            description,
            categoryId,
            priority,
            tasks
          );
          setEstimatedDuration(duration);
        } catch (error) {
          console.error('Failed to predict duration:', error);
        }
      }
    };

    const debounceTimer = setTimeout(predictDuration, 1500);
    return () => clearTimeout(debounceTimer);
  }, [title, description, categoryId, priority, tasks]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    setSaving(true);
    Keyboard.dismiss();

    try {
      let finalDueDate: Date | undefined;
      if (dueDate && dueTime) {
        finalDueDate = new Date(dueDate);
        finalDueDate.setHours(dueTime.getHours(), dueTime.getMinutes());
      } else if (dueDate) {
        finalDueDate = dueDate;
      }

      const taskData = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        categoryId: categoryId || undefined,
        dueDate: finalDueDate,
      };

      if (isEditing && existingTask) {
        await (dispatch as any)(updateTask({ 
          id: existingTask.id, 
          updates: taskData 
        })).unwrap();
      } else {
        await (dispatch as any)(createTask(taskData)).unwrap();
      }

      navigation.goBack();
    } catch (error) {
      console.error('Failed to save task:', error);
      Alert.alert('Error', 'Failed to save task. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const applySuggestion = (suggestion: MCPTaskSuggestion) => {
    setTitle(suggestion.title);
    setDescription(suggestion.description);
    setPriority(suggestion.priority);
    
    const suggestedCategory = categories.find((c: Category) => 
      c.name.toLowerCase() === suggestion.category.toLowerCase()
    );
    if (suggestedCategory) {
      setCategoryId(suggestedCategory.id);
    }
    
    setSuggestionsVisible(false);
  };

  const getPriorityColor = (p: TaskPriority) => {
    const colors = priorityColors[p];
    return theme.dark ? colors.dark : colors.light;
  };

  const getStatusColor = (s: TaskStatus) => {
    const colors = statusColors[s];
    return theme.dark ? colors.dark : colors.light;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const renderHeader = () => (
    <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <View style={styles.headerContent}>
        <IconButton
          icon="close"
          size={24}
          iconColor={theme.colors.onSurface}
          onPress={() => navigation.goBack()}
        />
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface, flex: 1, textAlign: 'center' }}>
          {isEditing ? 'Edit Task' : 'Add Task'}
        </Text>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={!title.trim() || saving}
          compact
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </View>
    </Surface>
  );

  const renderAISuggestions = () => (
    <Portal>
      <Modal
        visible={suggestionsVisible}
        onDismiss={() => setSuggestionsVisible(false)}
        contentContainerStyle={[styles.suggestionsModal, { backgroundColor: theme.colors.surface }]}
      >
        <View style={styles.modalHeader}>
          <Icon name="lightbulb-on" size={24} color={theme.colors.primary} />
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
            AI Suggestions
          </Text>
        </View>
        
        {loadingSuggestions ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginTop: 8 }}>
              Generating suggestions...
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.suggestionsList}>
            {suggestions.map((suggestion, index) => (
              <Card
                key={index}
                mode="outlined"
                style={styles.suggestionCard}
                onPress={() => applySuggestion(suggestion)}
              >
                <Card.Content>
                  <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                    {suggestion.title}
                  </Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                    {suggestion.description}
                  </Text>
                  <View style={styles.suggestionMeta}>
                    <Chip
                      compact
                      mode="outlined"
                      style={{ borderColor: getPriorityColor(suggestion.priority) }}
                      textStyle={{ color: getPriorityColor(suggestion.priority), fontSize: 12 }}
                    >
                      {suggestion.priority}
                    </Chip>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      ~{formatDuration(suggestion.estimatedDuration)}
                    </Text>
                  </View>
                  <Text variant="bodySmall" style={{ color: theme.colors.primary, marginTop: 8 }}>
                    💡 {suggestion.reasoning}
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </ScrollView>
        )}
        
        <Button
          mode="outlined"
          onPress={() => setSuggestionsVisible(false)}
          style={styles.modalCloseButton}
        >
          Close
        </Button>
      </Modal>
    </Portal>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderHeader()}
      
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title Input */}
          <Card mode="elevated" style={[styles.inputCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <TextInput
                label="Task Title *"
                value={title}
                onChangeText={setTitle}
                mode="outlined"
                style={styles.input}
                placeholder="What needs to be done?"
                maxLength={100}
                autoFocus={!isEditing}
              />
              {title.length > 3 && suggestions.length > 0 && (
                <Button
                  mode="text"
                  icon="lightbulb-on"
                  onPress={() => setSuggestionsVisible(true)}
                  style={styles.suggestionsButton}
                  textColor={theme.colors.primary}
                >
                  View AI Suggestions ({suggestions.length})
                </Button>
              )}
            </Card.Content>
          </Card>

          {/* Description Input */}
          <Card mode="elevated" style={[styles.inputCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <TextInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                mode="outlined"
                style={styles.input}
                placeholder="Add more details..."
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </Card.Content>
          </Card>

          {/* Priority & Status */}
          <Card mode="elevated" style={[styles.inputCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Priority & Status
              </Text>
              
              <View style={styles.chipRow}>
                <Menu
                  visible={priorityMenuVisible}
                  onDismiss={() => setPriorityMenuVisible(false)}
                  anchor={
                    <Chip
                      mode="outlined"
                      selected
                      onPress={() => setPriorityMenuVisible(true)}
                      style={[styles.selectionChip, { borderColor: getPriorityColor(priority) }]}
                      textStyle={{ color: getPriorityColor(priority) }}
                      icon="flag"
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
                    </Chip>
                  }
                >
                  {(['high', 'medium', 'low'] as TaskPriority[]).map((p) => (
                    <Menu.Item
                      key={p}
                      onPress={() => {
                        setPriority(p);
                        setPriorityMenuVisible(false);
                      }}
                      title={`${p.charAt(0).toUpperCase() + p.slice(1)} Priority`}
                      leadingIcon="flag"
                    />
                  ))}
                </Menu>

                {isEditing && (
                  <Menu
                    visible={statusMenuVisible}
                    onDismiss={() => setStatusMenuVisible(false)}
                    anchor={
                      <Chip
                        mode="outlined"
                        selected
                        onPress={() => setStatusMenuVisible(true)}
                        style={[styles.selectionChip, { borderColor: getStatusColor(status) }]}
                        textStyle={{ color: getStatusColor(status) }}
                        icon="checkbox-marked-circle"
                      >
                        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Chip>
                    }
                  >
                    {(['todo', 'in_progress', 'completed', 'cancelled'] as TaskStatus[]).map((s) => (
                      <Menu.Item
                        key={s}
                        onPress={() => {
                          setStatus(s);
                          setStatusMenuVisible(false);
                        }}
                        title={s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        leadingIcon="checkbox-marked-circle"
                      />
                    ))}
                  </Menu>
                )}
              </View>
            </Card.Content>
          </Card>

          {/* Category */}
          <Card mode="elevated" style={[styles.inputCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Category
              </Text>
              
              <Menu
                visible={categoryMenuVisible}
                onDismiss={() => setCategoryMenuVisible(false)}
                anchor={
                  <Chip
                    mode="outlined"
                    onPress={() => setCategoryMenuVisible(true)}
                    style={[
                      styles.selectionChip,
                      categoryId && {
                        borderColor: categories.find((c: Category) => c.id === categoryId)?.color,
                      },
                    ]}
                    textStyle={{
                      color: categoryId
                        ? categories.find((c: Category) => c.id === categoryId)?.color
                        : theme.colors.onSurfaceVariant,
                    }}
                    icon="folder"
                  >
                    {categoryId
                      ? categories.find((c: Category) => c.id === categoryId)?.name
                      : 'Select Category'
                    }
                  </Chip>
                }
              >
                <Menu.Item
                  onPress={() => {
                    setCategoryId('');
                    setCategoryMenuVisible(false);
                  }}
                  title="No Category"
                  leadingIcon="folder-remove"
                />
                <Divider />
                {categories.map((category: Category) => (
                  <Menu.Item
                    key={category.id}
                    onPress={() => {
                      setCategoryId(category.id);
                      setCategoryMenuVisible(false);
                    }}
                    title={category.name}
                    leadingIcon="folder"
                  />
                ))}
              </Menu>
            </Card.Content>
          </Card>

          {/* Due Date & Time */}
          <Card mode="elevated" style={[styles.inputCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Due Date & Time
              </Text>
              
              <View style={styles.chipRow}>
                <Chip
                  mode={dueDate ? 'flat' : 'outlined'}
                  onPress={() => setShowDatePicker(true)}
                  style={styles.selectionChip}
                  icon="calendar"
                >
                  {dueDate ? dueDate.toLocaleDateString() : 'Set Date'}
                </Chip>
                
                {dueDate && (
                  <Chip
                    mode={dueTime ? 'flat' : 'outlined'}
                    onPress={() => setShowTimePicker(true)}
                    style={styles.selectionChip}
                    icon="clock"
                  >
                    {dueTime ? dueTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Set Time'}
                  </Chip>
                )}
                
                {dueDate && (
                  <IconButton
                    icon="close"
                    size={20}
                    iconColor={theme.colors.error}
                    onPress={() => {
                      setDueDate(undefined);
                      setDueTime(undefined);
                    }}
                  />
                )}
              </View>
            </Card.Content>
          </Card>

          {/* AI Insights */}
          {estimatedDuration && (
            <Card mode="elevated" style={[styles.inputCard, { backgroundColor: theme.colors.primaryContainer }]}>
              <Card.Content>
                <View style={styles.aiInsightHeader}>
                  <Icon name="brain" size={20} color={theme.colors.onPrimaryContainer} />
                  <Text variant="titleSmall" style={{ color: theme.colors.onPrimaryContainer }}>
                    AI Prediction
                  </Text>
                </View>
                <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer }}>
                  Estimated duration: {formatDuration(estimatedDuration)}
                </Text>
              </Card.Content>
            </Card>
          )}
        </ScrollView>
      </Animated.View>

      {/* Date Picker */}
      <DatePicker
        modal
        open={showDatePicker}
        date={dueDate || new Date()}
        mode="date"
        onConfirm={(date) => {
          setShowDatePicker(false);
          setDueDate(date);
        }}
        onCancel={() => setShowDatePicker(false)}
      />

      {/* Time Picker */}
      <DatePicker
        modal
        open={showTimePicker}
        date={dueTime || new Date()}
        mode="time"
        onConfirm={(time) => {
          setShowTimePicker(false);
          setDueTime(time);
        }}
        onCancel={() => setShowTimePicker(false)}
      />

      {renderAISuggestions()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: materialStyles.spacing.sm,
    paddingHorizontal: materialStyles.spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: materialStyles.spacing.md,
    paddingBottom: materialStyles.spacing.xxl,
  },
  inputCard: {
    marginBottom: materialStyles.spacing.md,
    ...materialStyles.elevation.level2,
  },
  input: {
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    marginBottom: materialStyles.spacing.sm,
    fontWeight: '500',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: materialStyles.spacing.xs,
    alignItems: 'center',
  },
  selectionChip: {
    marginRight: materialStyles.spacing.xs,
    marginBottom: materialStyles.spacing.xs,
  },
  suggestionsButton: {
    marginTop: materialStyles.spacing.sm,
    alignSelf: 'flex-start',
  },
  aiInsightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: materialStyles.spacing.xs,
    marginBottom: materialStyles.spacing.xs,
  },
  suggestionsModal: {
    margin: materialStyles.spacing.lg,
    padding: materialStyles.spacing.lg,
    borderRadius: materialStyles.borderRadius.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: materialStyles.spacing.xs,
    marginBottom: materialStyles.spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: materialStyles.spacing.xl,
  },
  suggestionsList: {
    maxHeight: 400,
  },
  suggestionCard: {
    marginBottom: materialStyles.spacing.sm,
  },
  suggestionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: materialStyles.spacing.sm,
  },
  modalCloseButton: {
    marginTop: materialStyles.spacing.lg,
  },
});

export default AddTaskScreen;