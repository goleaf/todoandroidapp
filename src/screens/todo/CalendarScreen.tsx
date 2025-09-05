import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Card, List } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

export default function CalendarScreen() {
  const todos = useSelector((state: RootState) => state.todos.todos);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Group todos by date
  const todosByDate = todos.reduce((acc, todo) => {
    if (todo.dueDate) {
      const date = new Date(todo.dueDate).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(todo);
    }
    return acc;
  }, {} as Record<string, typeof todos>);

  // Create marked dates for calendar
  const markedDates = Object.keys(todosByDate).reduce((acc, date) => {
    acc[date] = {
      marked: true,
      dotColor: '#2196F3',
      selectedColor: date === selectedDate ? '#2196F3' : undefined,
    };
    return acc;
  }, {} as any);

  if (selectedDate && !markedDates[selectedDate]) {
    markedDates[selectedDate] = { selected: true, selectedColor: '#2196F3' };
  }

  const selectedDateTodos = todosByDate[selectedDate] || [];

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        theme={{
          selectedDayBackgroundColor: '#2196F3',
          todayTextColor: '#2196F3',
          arrowColor: '#2196F3',
        }}
      />
      
      <View style={styles.todosContainer}>
        <Text style={styles.dateTitle}>
          Tasks for {new Date(selectedDate).toLocaleDateString()}
        </Text>
        
        {selectedDateTodos.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>No tasks for this date</Text>
            </Card.Content>
          </Card>
        ) : (
          <ScrollView>
            {selectedDateTodos.map(todo => (
              <Card key={todo.id} style={styles.todoCard}>
                <List.Item
                  title={todo.title}
                  description={todo.description}
                  left={() => (
                    <List.Icon 
                      icon={todo.completed ? 'check-circle' : 'circle-outline'} 
                      color={todo.completed ? '#4caf50' : '#666'}
                    />
                  )}
                />
              </Card>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  todosContainer: {
    flex: 1,
    padding: 16,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  todoCard: {
    marginBottom: 8,
  },
  emptyCard: {
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
});
