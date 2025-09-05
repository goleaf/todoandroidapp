import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import {
  Modal,
  Portal,
  Card,
  Button,
  RadioButton,
  List,
} from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SortOption } from '../../types';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
}

const sortOptions: { value: SortOption; label: string; icon: string; description: string }[] = [
  {
    value: 'dueDate',
    label: 'Due Date',
    icon: 'schedule',
    description: 'Sort by due date (earliest first)',
  },
  {
    value: 'priority',
    label: 'Priority',
    icon: 'flag',
    description: 'Sort by priority (high to low)',
  },
  {
    value: 'created',
    label: 'Date Created',
    icon: 'add-circle',
    description: 'Sort by creation date (newest first)',
  },
  {
    value: 'updated',
    label: 'Last Updated',
    icon: 'update',
    description: 'Sort by last update (newest first)',
  },
  {
    value: 'alphabetical',
    label: 'Alphabetical',
    icon: 'sort-by-alpha',
    description: 'Sort alphabetically by title',
  },
  {
    value: 'completion',
    label: 'Completion Status',
    icon: 'check-circle',
    description: 'Show incomplete tasks first',
  },
];

export default function SortModal({
  visible,
  onDismiss,
  sortBy,
  onSortChange,
}: Props) {
  const handleSortChange = (newSortBy: SortOption) => {
    onSortChange(newSortBy);
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <Card style={styles.card}>
          <Card.Title 
            title="Sort Tasks" 
            subtitle="Choose how to sort your tasks"
          />
          <Card.Content>
            <RadioButton.Group
              onValueChange={(value) => handleSortChange(value as SortOption)}
              value={sortBy}
            >
              {sortOptions.map((option) => (
                <List.Item
                  key={option.value}
                  title={option.label}
                  description={option.description}
                  left={() => (
                    <View style={styles.leftContent}>
                      <MaterialIcons 
                        name={option.icon} 
                        size={24} 
                        color="#666" 
                        style={styles.icon}
                      />
                      <RadioButton value={option.value} />
                    </View>
                  )}
                  onPress={() => handleSortChange(option.value)}
                  style={[
                    styles.listItem,
                    sortBy === option.value && styles.selectedItem,
                  ]}
                />
              ))}
            </RadioButton.Group>
          </Card.Content>
          
          <Card.Actions style={styles.actions}>
            <Button onPress={onDismiss}>Cancel</Button>
          </Card.Actions>
        </Card>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 20,
  },
  card: {
    maxHeight: '70%',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  listItem: {
    paddingVertical: 8,
    borderRadius: 8,
    marginVertical: 2,
  },
  selectedItem: {
    backgroundColor: '#e3f2fd',
  },
  actions: {
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },
});
