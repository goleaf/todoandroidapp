import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Chip, useTheme, IconButton } from 'react-native-paper';
import { Calendar, DateData } from 'react-native-calendars';
import { Task, Category, TaskStatus } from '../../types';
import TaskItem from './TaskItem';

interface CalendarViewProps {
  tasks: Task[];
  categories: Category[];
  onTaskPress: (taskId: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, categories, onTaskPress }) => {
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'calendar' | 'agenda'>('calendar');

  // Create marked dates for calendar
  const markedDates = useMemo(() => {
    const marked: { [key: string]: any } = {};
    
    tasks.forEach(task => {
      if (task.dueDate) {
        const dateKey = task.dueDate.toISOString().split('T')[0];
        
        if (!marked[dateKey]) {
          marked[dateKey] = {
            dots: [],
            selected: dateKey === selectedDate,
            selectedColor: theme.colors.primary,
          };
        }

        // Add colored dots based on task priority and status
        let dotColor = theme.colors.outline;
        if (task.status === TaskStatus.COMPLETED) {
          dotColor = theme.colors.secondary;
        } else if (task.status === TaskStatus.CANCELLED) {
          dotColor = theme.colors.error;
        } else {
          switch (task.priority) {
            case 'high':
              dotColor = theme.colors.error;
              break;
            case 'medium':
              dotColor = theme.colors.tertiary;
              break;
            case 'low':
              dotColor = theme.colors.secondary;
              break;
          }
        }

        marked[dateKey].dots.push({
          key: task.id,
          color: dotColor,
        });
      }
    });

    // Ensure selected date is marked even if no tasks
    if (!marked[selectedDate]) {
      marked[selectedDate] = {
        selected: true,
        selectedColor: theme.colors.primary,
        dots: [],
      };
    } else {
      marked[selectedDate].selected = true;
      marked[selectedDate].selectedColor = theme.colors.primary;
    }

    return marked;
  }, [tasks, selectedDate, theme]);

  // Get tasks for selected date
  const selectedDateTasks = useMemo(() => {
    const selected = new Date(selectedDate);
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getFullYear() === selected.getFullYear() &&
        taskDate.getMonth() === selected.getMonth() &&
        taskDate.getDate() === selected.getDate()
      );
    }).sort((a, b) => {
      // Sort by priority (high first), then by creation time
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }, [tasks, selectedDate]);

  // Group tasks by date for agenda view
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    const sorted = [...tasks].sort((a, b) => {
      const aTime = a.dueDate ? a.dueDate.getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.dueDate ? b.dueDate.getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });

    sorted.forEach(task => {
      const key = task.dueDate 
        ? task.dueDate.toISOString().split('T')[0]
        : 'no-date';
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });

    return groups;
  }, [tasks]);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const formatDateHeader = (dateString: string) => {
    if (dateString === 'no-date') return 'No Due Date';
    
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  if (viewMode === 'agenda') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.headerTitle}>Task Agenda</Text>
          <View style={styles.viewToggle}>
            <IconButton
              icon="calendar-month"
              mode="contained"
              onPress={() => setViewMode('calendar')}
            />
          </View>
        </View>
        
        <ScrollView style={styles.agendaContainer}>
          {Object.entries(groupedTasks).map(([dateKey, taskList]) => (
            <Card key={dateKey} style={styles.agendaCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.agendaDateTitle}>
                  {formatDateHeader(dateKey)}
                </Text>
                <Text variant="bodySmall" style={styles.taskCount}>
                  {taskList.length} task{taskList.length !== 1 ? 's' : ''}
                </Text>
                
                {taskList.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onPress={() => onTaskPress(task.id)}
                    category={categories.find(c => c.id === task.categoryId)}
                  />
                ))}
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.headerTitle}>Calendar</Text>
        <View style={styles.viewToggle}>
          <IconButton
            icon="format-list-bulleted"
            mode="contained"
            onPress={() => setViewMode('agenda')}
          />
        </View>
      </View>

      <Calendar
        current={selectedDate}
        onDayPress={handleDayPress}
        markingType="multi-dot"
        markedDates={markedDates}
        theme={{
          backgroundColor: theme.colors.surface,
          calendarBackground: theme.colors.surface,
          textSectionTitleColor: theme.colors.onSurface,
          selectedDayBackgroundColor: theme.colors.primary,
          selectedDayTextColor: theme.colors.onPrimary,
          todayTextColor: theme.colors.primary,
          dayTextColor: theme.colors.onSurface,
          textDisabledColor: theme.colors.outline,
          dotColor: theme.colors.primary,
          selectedDotColor: theme.colors.onPrimary,
          arrowColor: theme.colors.primary,
          monthTextColor: theme.colors.onSurface,
          indicatorColor: theme.colors.primary,
          textDayFontWeight: '500',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '600',
        }}
      />

      <View style={styles.legendContainer}>
        <Text variant="bodySmall" style={styles.legendTitle}>Legend:</Text>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.error }]} />
          <Text variant="bodySmall">High Priority</Text>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.tertiary }]} />
          <Text variant="bodySmall">Medium</Text>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.secondary }]} />
          <Text variant="bodySmall">Low/Completed</Text>
        </View>
      </View>

      <Card style={styles.selectedDateCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.selectedDateTitle}>
            {formatDateHeader(selectedDate)}
          </Text>
          
          {selectedDateTasks.length === 0 ? (
            <Text style={styles.noTasksText}>No tasks scheduled for this date</Text>
          ) : (
            <>
              <Text variant="bodySmall" style={styles.taskCount}>
                {selectedDateTasks.length} task{selectedDateTasks.length !== 1 ? 's' : ''}
              </Text>
              
              <ScrollView style={styles.tasksContainer} showsVerticalScrollIndicator={false}>
                {selectedDateTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onPress={() => onTaskPress(task.id)}
                    category={categories.find(c => c.id === task.categoryId)}
                  />
                ))}
              </ScrollView>
            </>
          )}
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  viewToggle: {
    flexDirection: 'row',
  },
  legendContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  legendTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
    marginLeft: 8,
  },
  selectedDateCard: {
    flex: 1,
    margin: 16,
    marginTop: 8,
  },
  selectedDateTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  taskCount: {
    opacity: 0.7,
    marginBottom: 8,
  },
  noTasksText: {
    textAlign: 'center',
    opacity: 0.7,
    fontStyle: 'italic',
    paddingVertical: 16,
  },
  tasksContainer: {
    maxHeight: 200,
  },
  agendaContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  agendaCard: {
    marginBottom: 12,
  },
  agendaDateTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
});

export default CalendarView;

