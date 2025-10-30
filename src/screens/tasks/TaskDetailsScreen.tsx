import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Appbar, 
  Card, 
  Text, 
  Chip, 
  Button,
  Divider,
  useTheme 
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootState, AppDispatch } from '../../store';
import { deleteTask, toggleTaskStatus } from '../../store/slices/tasksSlice';
import { TaskStatus, TaskPriority, RootStackParamList } from '../../types';

type TaskDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TaskDetails'>;
type TaskDetailsScreenRouteProp = RouteProp<RootStackParamList, 'TaskDetails'>;

const TaskDetailsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<TaskDetailsScreenNavigationProp>();
  const route = useRoute<TaskDetailsScreenRouteProp>();
  const dispatch = useDispatch<AppDispatch>();

  const { taskId } = route.params;
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const { categories } = useSelector((state: RootState) => state.categories);

  const task = tasks.find(t => t.id === taskId);
  const category = task?.categoryId ? categories.find(c => c.id === task.categoryId) : null;

  if (!task) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Task Not Found" />
        </Appbar.Header>
        <View style={styles.errorContainer}>
          <Text>Task not found</Text>
        </View>
      </View>
    );
  }

  const handleEdit = () => {
    navigation.navigate('EditTask', { taskId });
  };

  const handleDelete = () => {
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
              await dispatch(deleteTask(taskId)).unwrap();
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = () => {
    dispatch(toggleTaskStatus(taskId));
  };

  const getStatusColor = () => {
    switch (task.status) {
      case TaskStatus.TODO: return theme.colors.primary;
      case TaskStatus.IN_PROGRESS: return theme.colors.tertiary;
      case TaskStatus.COMPLETED: return theme.colors.secondary;
      case TaskStatus.CANCELLED: return theme.colors.error;
      default: return theme.colors.outline;
    }
  };

  const getPriorityColor = () => {
    switch (task.priority) {
      case TaskPriority.HIGH: return theme.colors.error;
      case TaskPriority.MEDIUM: return theme.colors.tertiary;
      case TaskPriority.LOW: return theme.colors.secondary;
      default: return theme.colors.outline;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isOverdue = task.dueDate && task.dueDate < new Date() && task.status !== TaskStatus.COMPLETED;

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Task Details" />
        <Appbar.Action icon="edit" onPress={handleEdit} />
        <Appbar.Action icon="delete" onPress={handleDelete} />
      </Appbar.Header>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.title}>
              {task.title}
            </Text>

            {task.description && (
              <>
                <Divider style={styles.divider} />
                <Text variant="bodyLarge" style={styles.description}>
                  {task.description}
                </Text>
              </>
            )}

            <Divider style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text variant="labelLarge">Status</Text>
                <Chip 
                  style={[styles.statusChip, { backgroundColor: getStatusColor() }]}
                  textStyle={{ color: 'white' }}
                >
                  {task.status.replace('_', ' ').toUpperCase()}
                </Chip>
              </View>

              <View style={styles.infoItem}>
                <Text variant="labelLarge">Priority</Text>
                <Chip 
                  style={[styles.priorityChip, { backgroundColor: getPriorityColor() }]}
                  textStyle={{ color: 'white' }}
                >
                  {task.priority.toUpperCase()}
                </Chip>
              </View>
            </View>

            {category && (
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text variant="labelLarge">Category</Text>
                  <Chip 
                    style={[styles.categoryChip, { backgroundColor: category.color }]}
                    textStyle={{ color: 'white' }}
                  >
                    {category.name}
                  </Chip>
                </View>
              </View>
            )}

            {task.dueDate && (
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text variant="labelLarge">Due Date</Text>
                  <View style={styles.dateContainer}>
                    <Icon 
                      name="schedule" 
                      size={16} 
                      color={isOverdue ? theme.colors.error : theme.colors.outline}
                    />
                    <Text 
                      style={[
                        styles.dateText,
                        isOverdue && { color: theme.colors.error }
                      ]}
                    >
                      {formatDate(task.dueDate)}
                    </Text>
                    {isOverdue && (
                      <Text style={[styles.overdueText, { color: theme.colors.error }]}>
                        (Overdue)
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            <Divider style={styles.divider} />

            <View style={styles.timestamps}>
              <Text variant="bodySmall" style={styles.timestampText}>
                Created: {formatDate(task.createdAt)}
              </Text>
              <Text variant="bodySmall" style={styles.timestampText}>
                Updated: {formatDate(task.updatedAt)}
              </Text>
              {task.completedAt && (
                <Text variant="bodySmall" style={styles.timestampText}>
                  Completed: {formatDate(task.completedAt)}
                </Text>
              )}
            </View>
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleToggleStatus}
            style={styles.button}
            icon={task.status === TaskStatus.COMPLETED ? 'undo' : 'check'}
          >
            {task.status === TaskStatus.COMPLETED ? 'Mark as Incomplete' : 'Mark as Complete'}
          </Button>

          <Button
            mode="outlined"
            onPress={handleEdit}
            style={styles.button}
            icon="edit"
          >
            Edit Task
          </Button>
        </View>
      </ScrollView>
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
  title: {
    marginBottom: 16,
  },
  description: {
    lineHeight: 24,
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    marginRight: 16,
  },
  statusChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  priorityChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  categoryChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dateText: {
    marginLeft: 4,
  },
  overdueText: {
    marginLeft: 4,
    fontWeight: 'bold',
  },
  timestamps: {
    marginTop: 8,
  },
  timestampText: {
    opacity: 0.7,
    marginBottom: 4,
  },
  buttonContainer: {
    paddingVertical: 16,
  },
  button: {
    marginBottom: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TaskDetailsScreen;
