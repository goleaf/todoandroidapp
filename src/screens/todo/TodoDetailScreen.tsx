import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Button,
  Chip,
  IconButton,
  Divider,
} from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { updateTodo, deleteTodo } from '../../store/slices/todoSlice';

interface Props {
  navigation: any;
  route: any;
}

export default function TodoDetailScreen({ navigation, route }: Props) {
  const { todoId } = route.params;
  const dispatch = useDispatch();
  const todo = useSelector((state: RootState) => 
    state.todos.todos.find(t => t.id === todoId)
  );
  const categories = useSelector((state: RootState) => state.categories.categories);

  if (!todo) {
    return (
      <View style={styles.container}>
        <Text>Todo not found</Text>
      </View>
    );
  }

  const category = categories.find(cat => cat.id === todo.categoryId);

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            dispatch(deleteTodo(todo.id));
            navigation.goBack();
          }
        },
      ]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text style={styles.title}>{todo.title}</Text>
            <IconButton
              icon="edit"
              size={24}
              onPress={() => navigation.navigate('AddTodo', { todoId: todo.id })}
            />
          </View>

          {todo.description && (
            <Text style={styles.description}>{todo.description}</Text>
          )}

          <View style={styles.metaRow}>
            <Chip
              mode="outlined"
              style={[styles.priorityChip, { borderColor: getPriorityColor(todo.priority) }]}
              textStyle={{ color: getPriorityColor(todo.priority) }}
            >
              {todo.priority.toUpperCase()} PRIORITY
            </Chip>
            
            <Chip
              mode="outlined"
              style={styles.statusChip}
            >
              {todo.status.replace('_', ' ').toUpperCase()}
            </Chip>
          </View>

          {category && (
            <View style={styles.categoryRow}>
              <MaterialIcons name="folder" size={20} color={category.color} />
              <Text style={[styles.categoryText, { color: category.color }]}>
                {category.name}
              </Text>
            </View>
          )}

          {todo.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {todo.tags.map((tag, index) => (
                  <Chip key={index} style={styles.tag}>
                    {tag}
                  </Chip>
                ))}
              </View>
            </View>
          )}

          {todo.dueDate && (
            <View style={styles.dueDateSection}>
              <MaterialIcons name="schedule" size={20} color="#666" />
              <Text style={styles.dueDateText}>
                Due: {new Date(todo.dueDate).toLocaleString()}
              </Text>
            </View>
          )}

          {todo.attachments.length > 0 && (
            <View style={styles.attachmentsSection}>
              <Text style={styles.sectionTitle}>Attachments</Text>
              {todo.attachments.map((attachment, index) => (
                <View key={index} style={styles.attachmentItem}>
                  <MaterialIcons 
                    name={attachment.type === 'image' ? 'image' : 'attach-file'} 
                    size={20} 
                    color="#666" 
                  />
                  <Text style={styles.attachmentName}>{attachment.name}</Text>
                </View>
              ))}
            </View>
          )}

          {todo.location && (
            <View style={styles.locationSection}>
              <MaterialIcons name="location-on" size={20} color="#666" />
              <Text style={styles.locationText}>{todo.location.address}</Text>
            </View>
          )}

          <Divider style={styles.divider} />

          <View style={styles.timestampSection}>
            <Text style={styles.timestampText}>
              Created: {new Date(todo.createdAt).toLocaleString()}
            </Text>
            <Text style={styles.timestampText}>
              Updated: {new Date(todo.updatedAt).toLocaleString()}
            </Text>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.actions}>
        <Button
          mode="outlined"
          icon="delete"
          onPress={handleDelete}
          style={styles.deleteButton}
          buttonColor="#ffebee"
          textColor="#f44336"
        >
          Delete Task
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  priorityChip: {
    marginRight: 8,
  },
  statusChip: {
    marginRight: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  tagsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    marginRight: 8,
    marginBottom: 4,
  },
  dueDateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dueDateText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  attachmentsSection: {
    marginBottom: 16,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  attachmentName: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  divider: {
    marginVertical: 16,
  },
  timestampSection: {
    marginBottom: 8,
  },
  timestampText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  actions: {
    padding: 16,
  },
  deleteButton: {
    borderColor: '#f44336',
  },
});
