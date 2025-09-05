import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Text, Checkbox, IconButton, useTheme, Card, Menu, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Todo, Category } from '../../types';
import PriorityChip from '../common/PriorityChip';
import StatusChip from '../common/StatusChip';
import CategoryChip from '../common/CategoryChip';

interface EnhancedTodoItemProps {
  todo: Todo;
  category?: Category;
  onToggle: (id: string) => void;
  onPress: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onShare?: (id: string) => void;
  onStartTimer?: (id: string) => void;
  onStopTimer?: (id: string) => void;
  showCategory?: boolean;
  showPriority?: boolean;
  showStatus?: boolean;
  isTimerActive?: boolean;
  isSelected?: boolean;
  onLongPress?: (id: string) => void;
  style?: any;
}

export default function EnhancedTodoItem({ 
  todo, 
  category,
  onToggle, 
  onPress, 
  onDelete,
  onEdit,
  onDuplicate,
  onShare,
  onStartTimer,
  onStopTimer,
  showCategory = true,
  showPriority = true,
  showStatus = false,
  isTimerActive = false,
  isSelected = false,
  onLongPress,
  style
}: EnhancedTodoItemProps) {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [scaleValue] = useState(new Animated.Value(1));

  const formatDueDate = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays <= 7) return `${diffDays} days`;
    
    return date.toLocaleDateString();
  };

  const formatEstimatedTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress(todo.id);
      // Add haptic feedback
      Animated.sequence([
        Animated.timing(scaleValue, { toValue: 0.95, duration: 100, useNativeDriver: true }),
        Animated.timing(scaleValue, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
    }
  };

  const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed;
  const isDueToday = todo.dueDate && new Date(todo.dueDate).toDateString() === new Date().toDateString();

  return (
    <Animated.View style={[{ transform: [{ scale: scaleValue }] }, style]}>
      <Card 
        style={[
          styles.card, 
          { 
            backgroundColor: theme.colors.surface,
            borderLeftWidth: isSelected ? 4 : 0,
            borderLeftColor: theme.colors.primary,
          },
          isOverdue && styles.overdueCard,
          isDueToday && styles.dueTodayCard,
        ]}
      >
        <TouchableOpacity 
          onPress={() => onPress(todo.id)}
          onLongPress={handleLongPress}
          style={styles.container}
          activeOpacity={0.7}
        >
          <View style={styles.leftSection}>
            <Checkbox
              status={todo.completed ? 'checked' : 'unchecked'}
              onPress={() => onToggle(todo.id)}
              color={theme.colors.primary}
            />
            
            <View style={styles.content}>
              <View style={styles.titleRow}>
                <Text 
                  variant="bodyLarge" 
                  style={[
                    styles.title,
                    todo.completed && styles.completedTitle,
                    { color: theme.colors.onSurface }
                  ]}
                  numberOfLines={2}
                >
                  {todo.title}
                </Text>
                
                {/* XP Reward */}
                {todo.xpReward > 0 && (
                  <View style={styles.xpBadge}>
                    <MaterialCommunityIcons 
                      name="star" 
                      size={12} 
                      color="#FFD700" 
                    />
                    <Text style={styles.xpText}>{todo.xpReward}</Text>
                  </View>
                )}
              </View>
              
              {todo.description && (
                <Text 
                  variant="bodySmall" 
                  style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
                  numberOfLines={2}
                >
                  {todo.description}
                </Text>
              )}
              
              {/* Chips Row */}
              <View style={styles.chipsRow}>
                {showPriority && (
                  <PriorityChip priority={todo.priority} size="small" />
                )}
                
                {showStatus && (
                  <StatusChip status={todo.status} size="small" />
                )}
                
                {showCategory && category && (
                  <CategoryChip category={category} size="small" />
                )}
              </View>
              
              <View style={styles.metadata}>
                {/* Due date */}
                {todo.dueDate && (
                  <View style={styles.metadataItem}>
                    <MaterialCommunityIcons 
                      name="calendar-clock" 
                      size={12} 
                      color={isOverdue ? '#F44336' : theme.colors.onSurfaceVariant} 
                    />
                    <Text 
                      variant="labelSmall" 
                      style={[
                        styles.metadataText,
                        { color: isOverdue ? '#F44336' : theme.colors.onSurfaceVariant },
                        isOverdue && styles.overdueText
                      ]}
                    >
                      {formatDueDate(new Date(todo.dueDate))}
                    </Text>
                  </View>
                )}
                
                {/* Estimated time */}
                {todo.estimatedTime && (
                  <View style={styles.metadataItem}>
                    <MaterialCommunityIcons 
                      name="clock-outline" 
                      size={12} 
                      color={theme.colors.onSurfaceVariant} 
                    />
                    <Text 
                      variant="labelSmall" 
                      style={[styles.metadataText, { color: theme.colors.onSurfaceVariant }]}
                    >
                      {formatEstimatedTime(todo.estimatedTime)}
                    </Text>
                  </View>
                )}
                
                {/* Location */}
                {todo.location && (
                  <View style={styles.metadataItem}>
                    <MaterialCommunityIcons 
                      name="map-marker-outline" 
                      size={12} 
                      color={theme.colors.onSurfaceVariant} 
                    />
                    <Text 
                      variant="labelSmall" 
                      style={[styles.metadataText, { color: theme.colors.onSurfaceVariant }]}
                    >
                      Location
                    </Text>
                  </View>
                )}
                
                {/* Recurring indicator */}
                {todo.recurring && (
                  <View style={styles.metadataItem}>
                    <MaterialCommunityIcons 
                      name="repeat" 
                      size={12} 
                      color={theme.colors.primary} 
                    />
                    <Text 
                      variant="labelSmall" 
                      style={[styles.metadataText, { color: theme.colors.primary }]}
                    >
                      {todo.recurring.type}
                    </Text>
                  </View>
                )}
              </View>
              
              {/* Tags */}
              {todo.tags && todo.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {todo.tags.slice(0, 3).map((tag, index) => (
                    <View key={index} style={[styles.tag, { backgroundColor: theme.colors.primaryContainer }]}>
                      <Text 
                        variant="labelSmall" 
                        style={[styles.tagText, { color: theme.colors.onPrimaryContainer }]}
                      >
                        {tag}
                      </Text>
                    </View>
                  ))}
                  {todo.tags.length > 3 && (
                    <Text 
                      variant="labelSmall" 
                      style={[styles.moreTagsText, { color: theme.colors.onSurfaceVariant }]}
                    >
                      +{todo.tags.length - 3}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.rightSection}>
            {/* Timer indicator */}
            {isTimerActive && (
              <View style={styles.timerIndicator}>
                <MaterialCommunityIcons 
                  name="timer" 
                  size={16} 
                  color="#4CAF50" 
                />
              </View>
            )}
            
            {/* Attachments indicator */}
            {todo.attachments && todo.attachments.length > 0 && (
              <View style={styles.attachmentIndicator}>
                <MaterialCommunityIcons 
                  name="attachment" 
                  size={14} 
                  color={theme.colors.onSurfaceVariant}
                />
                <Text 
                  variant="labelSmall" 
                  style={[styles.indicatorText, { color: theme.colors.onSurfaceVariant }]}
                >
                  {todo.attachments.length}
                </Text>
              </View>
            )}
            
            {/* Subtasks indicator */}
            {todo.subtasks && todo.subtasks.length > 0 && (
              <View style={styles.subtaskIndicator}>
                <MaterialCommunityIcons 
                  name="format-list-bulleted" 
                  size={14} 
                  color={theme.colors.onSurfaceVariant} 
                />
                <Text 
                  variant="labelSmall" 
                  style={[styles.indicatorText, { color: theme.colors.onSurfaceVariant }]}
                >
                  {todo.subtasks.length}
                </Text>
              </View>
            )}
            
            {/* Comments indicator */}
            {todo.comments && todo.comments.length > 0 && (
              <View style={styles.commentIndicator}>
                <MaterialCommunityIcons 
                  name="comment-outline" 
                  size={14} 
                  color={theme.colors.onSurfaceVariant} 
                />
                <Text 
                  variant="labelSmall" 
                  style={[styles.indicatorText, { color: theme.colors.onSurfaceVariant }]}
                >
                  {todo.comments.length}
                </Text>
              </View>
            )}
            
            {/* Menu */}
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => setMenuVisible(true)}
                  iconColor={theme.colors.onSurfaceVariant}
                />
              }
            >
              {onEdit && (
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(false);
                    onEdit(todo.id);
                  }}
                  title="Edit"
                  leadingIcon="pencil"
                />
              )}
              
              {onDuplicate && (
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(false);
                    onDuplicate(todo.id);
                  }}
                  title="Duplicate"
                  leadingIcon="content-copy"
                />
              )}
              
              {onStartTimer && !isTimerActive && (
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(false);
                    onStartTimer(todo.id);
                  }}
                  title="Start Timer"
                  leadingIcon="play"
                />
              )}
              
              {onStopTimer && isTimerActive && (
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(false);
                    onStopTimer(todo.id);
                  }}
                  title="Stop Timer"
                  leadingIcon="stop"
                />
              )}
              
              {onShare && (
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(false);
                    onShare(todo.id);
                  }}
                  title="Share"
                  leadingIcon="share"
                />
              )}
              
              <Divider />
              
              {onDelete && (
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(false);
                    onDelete(todo.id);
                  }}
                  title="Delete"
                  leadingIcon="delete"
                  titleStyle={{ color: theme.colors.error }}
                />
              )}
            </Menu>
          </View>
        </TouchableOpacity>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 4,
    elevation: 2,
    borderRadius: 12,
  },
  overdueCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  dueTodayCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  xpText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#E65100',
  },
  description: {
    marginBottom: 8,
    opacity: 0.8,
    lineHeight: 18,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 11,
  },
  overdueText: {
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  rightSection: {
    alignItems: 'center',
    gap: 4,
  },
  timerIndicator: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#E8F5E8',
  },
  attachmentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  subtaskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  commentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  indicatorText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
