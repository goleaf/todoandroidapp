import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Modal,
  Portal,
  Card,
  Button,
  Chip,
  Checkbox,
  Divider,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FilterOption, Category } from '../../types';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  filter: FilterOption;
  onFilterChange: (filter: Partial<FilterOption>) => void;
  categories: Category[];
}

export default function FilterModal({
  visible,
  onDismiss,
  filter,
  onFilterChange,
  categories,
}: Props) {
  const [localFilter, setLocalFilter] = useState<FilterOption>(filter);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const priorities = ['low', 'medium', 'high'] as const;
  const statuses = ['not_started', 'in_progress', 'completed', 'cancelled'] as const;

  const handleApplyFilter = () => {
    onFilterChange(localFilter);
    onDismiss();
  };

  const handleClearFilter = () => {
    const clearedFilter: FilterOption = {
      categories: [],
      priorities: [],
      statuses: [],
      dateRange: {},
      tags: [],
    };
    setLocalFilter(clearedFilter);
    onFilterChange(clearedFilter);
    onDismiss();
  };

  const toggleCategory = (categoryId: string) => {
    const categories = localFilter.categories.includes(categoryId)
      ? localFilter.categories.filter(id => id !== categoryId)
      : [...localFilter.categories, categoryId];
    setLocalFilter({ ...localFilter, categories });
  };

  const togglePriority = (priority: string) => {
    const priorities = localFilter.priorities.includes(priority as any)
      ? localFilter.priorities.filter(p => p !== priority)
      : [...localFilter.priorities, priority as any];
    setLocalFilter({ ...localFilter, priorities });
  };

  const toggleStatus = (status: string) => {
    const statuses = localFilter.statuses.includes(status as any)
      ? localFilter.statuses.filter(s => s !== status)
      : [...localFilter.statuses, status as any];
    setLocalFilter({ ...localFilter, statuses });
  };

  const formatStatusLabel = (status: string) => {
    switch (status) {
      case 'not_started': return 'Not Started';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
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
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <Card style={styles.card}>
          <Card.Title title="Filter Tasks" />
          <Card.Content>
            <ScrollView style={styles.content}>
              {/* Categories */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Categories</Text>
                <View style={styles.chipContainer}>
                  {categories.map(category => (
                    <Chip
                      key={category.id}
                      selected={localFilter.categories.includes(category.id)}
                      onPress={() => toggleCategory(category.id)}
                      style={[
                        styles.chip,
                        localFilter.categories.includes(category.id) && {
                          backgroundColor: category.color + '20',
                          borderColor: category.color,
                        }
                      ]}
                    >
                      {category.name}
                    </Chip>
                  ))}
                </View>
              </View>

              <Divider style={styles.divider} />

              {/* Priorities */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Priority</Text>
                <View style={styles.chipContainer}>
                  {priorities.map(priority => (
                    <Chip
                      key={priority}
                      selected={localFilter.priorities.includes(priority)}
                      onPress={() => togglePriority(priority)}
                      style={[
                        styles.chip,
                        localFilter.priorities.includes(priority) && {
                          backgroundColor: getPriorityColor(priority) + '20',
                          borderColor: getPriorityColor(priority),
                        }
                      ]}
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Chip>
                  ))}
                </View>
              </View>

              <Divider style={styles.divider} />

              {/* Status */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Status</Text>
                <View style={styles.chipContainer}>
                  {statuses.map(status => (
                    <Chip
                      key={status}
                      selected={localFilter.statuses.includes(status)}
                      onPress={() => toggleStatus(status)}
                      style={styles.chip}
                    >
                      {formatStatusLabel(status)}
                    </Chip>
                  ))}
                </View>
              </View>

              <Divider style={styles.divider} />

              {/* Date Range */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Due Date Range</Text>
                <View style={styles.dateRow}>
                  <Button
                    mode="outlined"
                    onPress={() => setShowStartDatePicker(true)}
                    style={styles.dateButton}
                  >
                    {localFilter.dateRange.start
                      ? localFilter.dateRange.start.toDateString()
                      : 'Start Date'
                    }
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => setShowEndDatePicker(true)}
                    style={styles.dateButton}
                  >
                    {localFilter.dateRange.end
                      ? localFilter.dateRange.end.toDateString()
                      : 'End Date'
                    }
                  </Button>
                </View>
                
                {(localFilter.dateRange.start || localFilter.dateRange.end) && (
                  <Button
                    mode="text"
                    onPress={() => setLocalFilter({
                      ...localFilter,
                      dateRange: {}
                    })}
                    style={styles.clearDateButton}
                  >
                    Clear Date Range
                  </Button>
                )}
              </View>

              {/* Additional Filters */}
              <Divider style={styles.divider} />
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Additional Filters</Text>
                <View style={styles.checkboxRow}>
                  <Checkbox
                    status={localFilter.hasAttachments ? 'checked' : 'unchecked'}
                    onPress={() => setLocalFilter({
                      ...localFilter,
                      hasAttachments: !localFilter.hasAttachments
                    })}
                  />
                  <Text style={styles.checkboxLabel}>Has Attachments</Text>
                </View>
                <View style={styles.checkboxRow}>
                  <Checkbox
                    status={localFilter.hasLocation ? 'checked' : 'unchecked'}
                    onPress={() => setLocalFilter({
                      ...localFilter,
                      hasLocation: !localFilter.hasLocation
                    })}
                  />
                  <Text style={styles.checkboxLabel}>Has Location</Text>
                </View>
              </View>
            </ScrollView>
          </Card.Content>

          <Card.Actions style={styles.actions}>
            <Button onPress={handleClearFilter}>Clear All</Button>
            <Button onPress={onDismiss}>Cancel</Button>
            <Button mode="contained" onPress={handleApplyFilter}>
              Apply
            </Button>
          </Card.Actions>
        </Card>

        {showStartDatePicker && (
          <DateTimePicker
            value={localFilter.dateRange.start || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowStartDatePicker(false);
              if (selectedDate) {
                setLocalFilter({
                  ...localFilter,
                  dateRange: { ...localFilter.dateRange, start: selectedDate }
                });
              }
            }}
          />
        )}

        {showEndDatePicker && (
          <DateTimePicker
            value={localFilter.dateRange.end || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowEndDatePicker(false);
              if (selectedDate) {
                setLocalFilter({
                  ...localFilter,
                  dateRange: { ...localFilter.dateRange, end: selectedDate }
                });
              }
            }}
          />
        )}
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 20,
  },
  card: {
    maxHeight: '80%',
  },
  content: {
    maxHeight: 400,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    color: '#333',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateButton: {
    flex: 0.48,
  },
  clearDateButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  actions: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
});
