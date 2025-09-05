import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Card, Checkbox, Chip, IconButton } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Todo, Category } from '../../types';

interface Props {
  todo: Todo;
  onPress: () => void;
  onLongPress: () => void;
  onToggle: () => void;
  onDelete: () => void;
  isSelected: boolean;
  categories: Category[];
}

export default function TodoItem({
  todo,
  onPress,
  onLongPress,
  onToggle,
  onDelete,
  isSelected,
  categories,
}: Props) {
  const category = categories.find(cat => cat.id === todo.categoryId);
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'not_started': return 'radio-button-unchecked';
      case 'in_progress': return 'schedule';
      case 'completed': return 'check-circle';
      case 'cancelled': return 'cancel';
      default: return 'help';
    }
  };

  const formatDueDate = (date: Date) => {
    const now = new Date();
    const dueDate = new Date(date);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} days`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return dueDate.toLocaleDateString();
    }
  };

  const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed;

  return (
    <TouchableWithoutFeedback onPress={onPress} onLongPress={onLongPress}>
      <Card style={[
        styles.card,
        isSelected && styles.selectedCard,
        isOverdue && styles.overdueCard,
      ]}>
        <View style={styles.container}>
          {/* Left side - Checkbox and Priority */}
          <View style={styles.leftSection}>
            <Checkbox
              status={todo.completed ? 'checked' : 'unchecked'}
              onPress={onToggle}
              color="#2196F3"
            />
            <View style={[
              styles.priorityIndicator,
              { backgroundColor: getPriorityColor(todo.priority) }
            ]} />
          </View>

          {/* Main content */}
          <View style={styles.mainContent}>
            <View style={styles.titleRow}>
              <Text style={[
                styles.title,
                todo.completed && styles.completedTitle,
              ]}>
                {todo.title}
              </Text>
              <MaterialIcons
                name={getStatusIcon(todo.status)}
                size={16}
                color={getPriorityColor(todo.priority)}
                style={styles.statusIcon}
              />
            </View>

            {todo.description && (
              <Text style={styles.description} numberOfLines={2}>
                {todo.description}
              </Text>
            )}

            {/* Tags and Category */}
            <View style={styles.tagsRow}>
              {category && (
                <Chip
                  mode="outlined"
                  compact
                  style={[styles.categoryChip, { borderColor: category.color }]}
                  textStyle={{ color: category.color, fontSize: 10 }}
                >
                  {category.name}
                </Chip>
              )}
              {todo.tags.slice(0, 2).map((tag, index) => (
                <Chip
                  key={index}
                  mode="outlined"
                  compact
                  style={styles.tagChip}
                  textStyle={styles.tagText}
                >
                  {tag}
                </Chip>
              ))}
              {todo.tags.length > 2 && (
                <Text style={styles.moreTagsText}>
                  +{todo.tags.length - 2} more
                </Text>
              )}
            </View>

            {/* Due date and attachments */}
            <View style={styles.metaRow}>
              {todo.dueDate && (
                <View style={styles.dueDateContainer}>
                  <MaterialIcons
                    name="schedule"
                    size={14}
                    color={isOverdue ? '#f44336' : '#666'}
                  />
                  <Text style={[
                    styles.dueDate,
                    isOverdue && styles.overdueDueDate,
                  ]}>
                    {formatDueDate(todo.dueDate)}
                  </Text>
                </View>
              )}

              <View style={styles.attachmentIcons}>
                {todo.attachments.length > 0 && (
                  <View style={styles.attachmentContainer}>
                    <MaterialIcons name="attach-file" size={14} color="#666" />
                    <Text style={styles.attachmentCount}>
                      {todo.attachments.length}
                    </Text>
                  </View>
                )}
                {todo.voiceMemo && (
                  <MaterialIcons name="mic" size={14} color="#666" />
                )}
                {todo.location && (
                  <MaterialIcons name="location-on" size={14} color="#666" />
                )}
              </View>
            </View>

            {/* Subtasks indicator */}
            {todo.parentId && (
              <View style={styles.subtaskIndicator}>
                <MaterialIcons name="subdirectory-arrow-right" size={14} color="#666" />
                <Text style={styles.subtaskText}>Subtask</Text>
              </View>
            )}
          </View>

          {/* Right side - Actions */}
          <View style={styles.rightSection}>
            <IconButton
              icon="delete"
              size={20}
              onPress={onDelete}
              iconColor="#f44336"
            />
          </View>
        </View>
      </Card>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 4,
    elevation: 2,
  },
  selectedCard: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  overdueCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  container: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'flex-start',
  },
  leftSection: {
    alignItems: 'center',
    marginRight: 12,
  },
  priorityIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginTop: 4,
  },
  mainContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  statusIcon: {
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryChip: {
    height: 24,
    marginRight: 4,
    marginBottom: 4,
  },
  tagChip: {
    height: 24,
    marginRight: 4,
    marginBottom: 4,
    borderColor: '#e0e0e0',
  },
  tagText: {
    fontSize: 10,
    color: '#666',
  },
  moreTagsText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDate: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  overdueDueDate: {
    color: '#f44336',
    fontWeight: '500',
  },
  attachmentIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  attachmentCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  subtaskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  subtaskText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  rightSection: {
    alignItems: 'center',
  },
});
