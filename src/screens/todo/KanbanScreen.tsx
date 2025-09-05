import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Chip } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

export default function KanbanScreen() {
  const todos = useSelector((state: RootState) => state.todos.todos);
  
  const todosByStatus = {
    not_started: todos.filter(todo => todo.status === 'not_started'),
    in_progress: todos.filter(todo => todo.status === 'in_progress'),
    completed: todos.filter(todo => todo.status === 'completed'),
  };

  const renderColumn = (status: string, title: string, color: string) => (
    <View style={styles.column} key={status}>
      <View style={[styles.columnHeader, { backgroundColor: color }]}>
        <Text style={styles.columnTitle}>{title}</Text>
        <Chip style={styles.countChip}>
          {todosByStatus[status as keyof typeof todosByStatus].length}
        </Chip>
      </View>
      <ScrollView style={styles.columnContent}>
        {todosByStatus[status as keyof typeof todosByStatus].map(todo => (
          <Card key={todo.id} style={styles.todoCard}>
            <Card.Content>
              <Text style={styles.todoTitle}>{todo.title}</Text>
              {todo.description && (
                <Text style={styles.todoDescription} numberOfLines={2}>
                  {todo.description}
                </Text>
              )}
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.board}>
          {renderColumn('not_started', 'To Do', '#f44336')}
          {renderColumn('in_progress', 'In Progress', '#ff9800')}
          {renderColumn('completed', 'Done', '#4caf50')}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  board: {
    flexDirection: 'row',
    padding: 16,
  },
  column: {
    width: 280,
    marginRight: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 2,
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  columnTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  countChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  columnContent: {
    padding: 8,
    maxHeight: 500,
  },
  todoCard: {
    marginBottom: 8,
  },
  todoTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  todoDescription: {
    fontSize: 12,
    color: '#666',
  },
});
