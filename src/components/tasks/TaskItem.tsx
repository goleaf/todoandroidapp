import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import {
  Card,
  Text,
  Chip,
  IconButton,
  useTheme,
  Menu,
  Surface,
  Badge,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch } from 'react-redux';

import { Task, Category } from '../../types';
import { toggleTaskStatus } from '../../store/slices/tasksSlice';
import { materialStyles, priorityColors, statusColors } from '../../theme/MaterialTheme';

interface TaskItemProps {
  task: Task;
  category?: Category;
  onPress: () => void;
  onDelete: () => void;
  style?: any;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  category,
  onPress,
  onDelete,
  style,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [menuVisible, setMenuVisible] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  const handleToggleStatus = async () => {
    // Animate the press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      await (dispatch as any)(toggleTaskStatus(task.id)).unwrap();
    } catch (error) {
      console.error('Failed to toggle task status:', error);
    }
  };

  const getPriorityColor = () => {
    const colors = priorityColors[task.priority];
    return theme.dark ? colors.dark : colors.light;
  };

  const getStatusColor = () => {
    const colors = statusColors[task.status];
    return theme.dark ? colors.dark : colors.light;
  };

  const getStatusIcon = () => {
    switch (task.status) {
      case 'completed':
        return 'check-circle';
      case 'in_progress':
        return 'clock-outline';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'circle-outline';
    }
  };

  const getPriorityIcon = () => {
    switch (task.priority) {
      case 'high':
        return 'flag';
      case 'medium':
        return 'flag-outline';
      case 'low':
        return 'flag-variant-outline';
      default:
        return 'flag-outline';
    }
  };

  const isOverdue = () => {
    if (!task.dueDate || task.status === 'completed') return false;
    return new Date(task.dueDate) < new Date();
  };

  const formatDueDate = () => {
    if (!task.dueDate) return null;
    
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const taskDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

    if (taskDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (taskDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else if (taskDate < today) {
      const daysDiff = Math.floor((today.getTime() - taskDate.getTime()) / (24 * 60 * 60 * 1000));
      return `${daysDiff} day${daysDiff > 1 ? 's' : ''} overdue`;
    } else {
      return dueDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: dueDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const dueDateText = formatDueDate();
  const overdue = isOverdue();

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Card
        mode="elevated"
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderLeftWidth: 4,
            borderLeftColor: category?.color || theme.colors.primary,
          },
          task.status === 'completed' && styles.completedCard,
        ]}
        elevation={task.status === 'completed' ? 1 : 2}
      >
        <Pressable onPress={onPress} style={styles.cardContent}>
          <View style={styles.header}>
            <View style={styles.statusContainer}>
              <Pressable onPress={handleToggleStatus} style={styles.statusButton}>
                <Icon
                  name={getStatusIcon()}
                  size={24}
                  color={getStatusColor()}
                />
              </Pressable>
              <View style={styles.titleContainer}>
                <Text
                  variant="titleMedium"
                  style={[
                    styles.title,
                    { color: theme.colors.onSurface },
                    task.status === 'completed' && styles.completedText,
                  ]}
                  numberOfLines={2}
                >
                  {task.title}
                </Text>
                {task.description && (
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.description,
                      { color: theme.colors.onSurfaceVariant },
                      task.status === 'completed' && styles.completedText,
                    ]}
                    numberOfLines={2}
                  >
                    {task.description}
                  </Text>
                )}
              </View>
            </View>

            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  iconColor={theme.colors.onSurfaceVariant}
                  onPress={() => setMenuVisible(true)}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  onPress();
                }}
                title="Edit"
                leadingIcon="pencil"
              />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  handleToggleStatus();
                }}
                title={task.status === 'completed' ? 'Mark Incomplete' : 'Mark Complete'}
                leadingIcon={task.status === 'completed' ? 'undo' : 'check'}
              />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  onDelete();
                }}
                title="Delete"
                leadingIcon="delete"
                titleStyle={{ color: theme.colors.error }}
              />
            </Menu>
          </View>

          <View style={styles.metadata}>
            <View style={styles.chips}>
              {/* Priority Chip */}
              <Chip
                mode="outlined"
                compact
                icon={getPriorityIcon()}
                style={[
                  styles.chip,
                  { borderColor: getPriorityColor() }
                ]}
                textStyle={{ color: getPriorityColor(), fontSize: 12 }}
              >
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </Chip>

              {/* Status Chip */}
              <Chip
                mode="flat"
                compact
                style={[
                  styles.chip,
                  { backgroundColor: getStatusColor() + '20' }
                ]}
                textStyle={{ color: getStatusColor(), fontSize: 12 }}
              >
                {task.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Chip>

              {/* Category Chip */}
              {category && (
                <Chip
                  mode="outlined"
                  compact
                  style={[
                    styles.chip,
                    { borderColor: category.color }
                  ]}
                  textStyle={{ color: theme.colors.onSurface, fontSize: 12 }}
                >
                  {category.name}
                </Chip>
              )}
            </View>

            {/* Due Date */}
            {dueDateText && (
              <View style={styles.dueDateContainer}>
                <Icon
                  name="calendar-clock"
                  size={16}
                  color={overdue ? theme.colors.error : theme.colors.onSurfaceVariant}
                />
                <Text
                  variant="labelMedium"
                  style={[
                    styles.dueDate,
                    {
                      color: overdue ? theme.colors.error : theme.colors.onSurfaceVariant,
                    },
                  ]}
                >
                  {dueDateText}
                </Text>
                {overdue && (
                  <Badge
                    size={8}
                    style={{ backgroundColor: theme.colors.error }}
                  />
                )}
              </View>
            )}
          </View>

          {/* Progress indicator for completed tasks */}
          {task.status === 'completed' && (
            <Surface
              style={[
                styles.completedIndicator,
                { backgroundColor: statusColors.completed.light + '20' }
              ]}
              elevation={0}
            >
              <Icon
                name="check-circle"
                size={16}
                color={statusColors.completed.light}
              />
              <Text
                variant="labelSmall"
                style={{ color: statusColors.completed.light }}
              >
                Completed {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : ''}
              </Text>
            </Surface>
          )}
        </Pressable>
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: materialStyles.spacing.xs,
    ...materialStyles.elevation.level2,
  },
  completedCard: {
    opacity: 0.8,
  },
  cardContent: {
    padding: materialStyles.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: materialStyles.spacing.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  statusButton: {
    marginRight: materialStyles.spacing.sm,
    marginTop: 2,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '500',
    lineHeight: 22,
  },
  description: {
    marginTop: materialStyles.spacing.xs,
    lineHeight: 20,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: materialStyles.spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: materialStyles.spacing.xs,
    flex: 1,
  },
  chip: {
    height: 28,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: materialStyles.spacing.xs,
  },
  dueDate: {
    fontSize: 12,
  },
  completedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: materialStyles.spacing.xs,
    marginTop: materialStyles.spacing.sm,
    padding: materialStyles.spacing.xs,
    borderRadius: materialStyles.borderRadius.sm,
  },
});

export default TaskItem;