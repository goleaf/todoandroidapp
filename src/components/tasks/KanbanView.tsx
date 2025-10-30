import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card, useTheme, IconButton } from 'react-native-paper';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Task, TaskStatus, Category } from '../../types';
import TaskItem from './TaskItem';

interface KanbanViewProps {
  tasks: Task[];
  categories: Category[];
  onTaskPress: (taskId: string) => void;
  onTaskStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

interface DraggableTaskItemProps {
  task: Task;
  category?: Category;
  onPress: () => void;
  onStatusChange?: (newStatus: TaskStatus) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const COLUMN_WIDTH = 280;
const COLUMN_MARGIN = 12;

// Draggable Task Item Component
const DraggableTaskItem: React.FC<DraggableTaskItemProps> = ({ 
  task, 
  category, 
  onPress, 
  onStatusChange 
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const [isDragging, setIsDragging] = useState(false);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      scale.value = withSpring(1.05);
      runOnJS(setIsDragging)(true);
    },
    onActive: (event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    },
    onEnd: (event) => {
      // Determine which column the task was dropped in
      const dropX = event.absoluteX;
      const columnIndex = Math.floor(dropX / (COLUMN_WIDTH + COLUMN_MARGIN));
      
      const columns = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.CANCELLED];
      const newStatus = columns[Math.max(0, Math.min(columnIndex, columns.length - 1))];
      
      if (newStatus && newStatus !== task.status && onStatusChange) {
        runOnJS(onStatusChange)(newStatus);
      }
      
      // Reset position and scale
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      runOnJS(setIsDragging)(false);
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: isDragging ? 1000 : 1,
    elevation: isDragging ? 10 : 2,
  }));

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[animatedStyle, { opacity: isDragging ? 0.8 : 1 }]}>
        <TaskItem
          task={task}
          onPress={onPress}
          category={category}
        />
      </Animated.View>
    </PanGestureHandler>
  );
};

const KanbanView: React.FC<KanbanViewProps> = ({ 
  tasks, 
  categories, 
  onTaskPress, 
  onTaskStatusChange 
}) => {
  const theme = useTheme();

  const columns: Array<{ key: TaskStatus; title: string; color: string }> = [
    { key: TaskStatus.TODO, title: 'To Do', color: theme.colors.primary },
    { key: TaskStatus.IN_PROGRESS, title: 'In Progress', color: theme.colors.tertiary },
    { key: TaskStatus.COMPLETED, title: 'Completed', color: theme.colors.secondary },
    { key: TaskStatus.CANCELLED, title: 'Cancelled', color: theme.colors.error },
  ];

  const tasksByStatus = columns.reduce<Record<string, Task[]>>((acc, col) => {
    acc[col.key] = tasks.filter(t => t.status === col.key);
    return acc;
  }, {} as Record<string, Task[]>);

  const handleTaskStatusChange = (taskId: string, newStatus: TaskStatus) => {
    if (onTaskStatusChange) {
      onTaskStatusChange(taskId, newStatus);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text variant="titleMedium" style={styles.headerText}>
          Drag tasks between columns to change status
        </Text>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainer}>
        <View style={styles.columnsContainer}>
          {columns.map((col, index) => (
            <View key={col.key} style={styles.column}>
              <Card style={[styles.columnCard, { borderTopColor: col.color, borderTopWidth: 4 }]}>
                <Card.Content>
                  <View style={styles.columnHeader}>
                    <Text variant="titleMedium" style={[styles.columnTitle, { color: col.color }]}>
                      {col.title}
                    </Text>
                    <View style={[styles.taskCountBadge, { backgroundColor: col.color }]}>
                      <Text style={styles.taskCountText}>
                        {tasksByStatus[col.key].length}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.cardsContainer}>
                    {tasksByStatus[col.key].length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No tasks</Text>
                        <Text style={styles.emptySubtext}>
                          {col.key === TaskStatus.TODO && 'Drag tasks here to mark as To Do'}
                          {col.key === TaskStatus.IN_PROGRESS && 'Drag tasks here to mark as In Progress'}
                          {col.key === TaskStatus.COMPLETED && 'Drag tasks here to mark as Completed'}
                          {col.key === TaskStatus.CANCELLED && 'Drag tasks here to mark as Cancelled'}
                        </Text>
                      </View>
                    ) : (
                      tasksByStatus[col.key].map(task => (
                        <DraggableTaskItem
                          key={task.id}
                          task={task}
                          onPress={() => onTaskPress(task.id)}
                          category={categories.find(c => c.id === task.categoryId)}
                          onStatusChange={(newStatus) => handleTaskStatusChange(task.id, newStatus)}
                        />
                      ))
                    )}
                  </View>
                </Card.Content>
              </Card>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  headerText: {
    textAlign: 'center',
    opacity: 0.7,
    fontStyle: 'italic',
  },
  scrollContainer: {
    flex: 1,
  },
  columnsContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    minWidth: screenWidth,
  },
  column: {
    width: COLUMN_WIDTH,
    marginRight: COLUMN_MARGIN,
  },
  columnCard: {
    flex: 1,
    minHeight: 400,
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  columnTitle: {
    fontWeight: 'bold',
    flex: 1,
  },
  taskCountBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  taskCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardsContainer: {
    flex: 1,
    paddingBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    opacity: 0.5,
    fontSize: 12,
    fontStyle: 'italic',
    paddingHorizontal: 16,
  },
});

export default KanbanView;

