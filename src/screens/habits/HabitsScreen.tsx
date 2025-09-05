import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  Card,
  FAB,
  IconButton,
  Chip,
  ProgressBar,
  Button,
  Portal,
  Modal,
  TextInput,
  Menu,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { 
  completeHabit, 
  uncompleteHabit, 
  addHabit, 
  toggleHabitActive,
  calculateStreaks,
} from '../../store/slices/habitsSlice';
import { addXP } from '../../store/slices/userSlice';
import { HabitTracker } from '../../types';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Calendar } from 'react-native-calendars';

const { width } = Dimensions.get('window');

export default function HabitsScreen() {
  const dispatch = useDispatch();
  const { habits } = useSelector((state: RootState) => state.habits);
  const { currentUser } = useSelector((state: RootState) => state.user);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<HabitTracker | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // New habit form
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitDescription, setNewHabitDescription] = useState('');
  const [newHabitColor, setNewHabitColor] = useState('#2196F3');
  const [newHabitIcon, setNewHabitIcon] = useState('check-circle');
  const [newHabitFrequency, setNewHabitFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [newHabitTarget, setNewHabitTarget] = useState('1');
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showIconMenu, setShowIconMenu] = useState(false);

  const colors = [
    '#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0',
    '#00BCD4', '#8BC34A', '#FFC107', '#E91E63', '#3F51B5'
  ];

  const icons = [
    'check-circle', 'fitness-center', 'local-drink', 'book', 'music-note',
    'directions-run', 'restaurant', 'bedtime', 'work', 'school'
  ];

  const handleCompleteHabit = (habitId: string, date: Date = new Date()) => {
    dispatch(completeHabit({ habitId, date }));
    
    // Award XP for completing habit
    if (currentUser) {
      dispatch(addXP(15)); // 15 XP for completing a habit
    }
  };

  const handleUncompleteHabit = (habitId: string, date: Date = new Date()) => {
    dispatch(uncompleteHabit({ habitId, date }));
  };

  const handleAddHabit = () => {
    if (!newHabitName.trim()) return;

    const newHabit: HabitTracker = {
      id: Date.now().toString(),
      name: newHabitName.trim(),
      description: newHabitDescription.trim(),
      color: newHabitColor,
      icon: newHabitIcon,
      frequency: newHabitFrequency,
      targetCount: parseInt(newHabitTarget) || 1,
      currentStreak: 0,
      longestStreak: 0,
      completedDates: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dispatch(addHabit(newHabit));
    
    // Reset form
    setNewHabitName('');
    setNewHabitDescription('');
    setNewHabitColor('#2196F3');
    setNewHabitIcon('check-circle');
    setNewHabitFrequency('daily');
    setNewHabitTarget('1');
    setShowAddModal(false);
  };

  const isHabitCompletedToday = (habit: HabitTracker) => {
    const today = new Date().toDateString();
    return habit.completedDates.some(date => date.toDateString() === today);
  };

  const getHabitCompletionRate = (habit: HabitTracker) => {
    if (habit.completedDates.length === 0) return 0;
    
    const daysSinceCreation = Math.ceil(
      (new Date().getTime() - habit.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return Math.min((habit.completedDates.length / daysSinceCreation) * 100, 100);
  };

  const getCalendarMarkedDates = (habit: HabitTracker) => {
    const markedDates: any = {};
    
    habit.completedDates.forEach(date => {
      const dateString = date.toISOString().split('T')[0];
      markedDates[dateString] = {
        selected: true,
        selectedColor: habit.color,
        marked: true,
        dotColor: habit.color,
      };
    });

    return markedDates;
  };

  const activeHabits = habits.filter(habit => habit.isActive);
  const totalCompletionRate = activeHabits.length > 0 
    ? activeHabits.reduce((sum, habit) => sum + getHabitCompletionRate(habit), 0) / activeHabits.length 
    : 0;

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Overview Card */}
        <Card style={styles.overviewCard}>
          <Card.Title 
            title="Habits Overview" 
            subtitle={`${activeHabits.length} active habits`}
            left={() => <MaterialIcons name="trending-up" size={24} color="#4CAF50" />}
          />
          <Card.Content>
            <View style={styles.overviewStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{activeHabits.length}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {activeHabits.filter(h => isHabitCompletedToday(h)).length}
                </Text>
                <Text style={styles.statLabel}>Completed Today</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {Math.max(...activeHabits.map(h => h.currentStreak), 0)}
                </Text>
                <Text style={styles.statLabel}>Best Streak</Text>
              </View>
            </View>
            
            <View style={styles.progressSection}>
              <Text style={styles.progressLabel}>Overall Progress</Text>
              <ProgressBar 
                progress={totalCompletionRate / 100} 
                color="#4CAF50" 
                style={styles.progressBar}
              />
              <Text style={styles.progressText}>
                {Math.round(totalCompletionRate)}% completion rate
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Habits List */}
        {activeHabits.map(habit => (
          <Card key={habit.id} style={styles.habitCard}>
            <Card.Content>
              <View style={styles.habitHeader}>
                <View style={styles.habitInfo}>
                  <View style={styles.habitTitleRow}>
                    <MaterialIcons 
                      name={habit.icon as any} 
                      size={24} 
                      color={habit.color} 
                    />
                    <Text style={styles.habitName}>{habit.name}</Text>
                    <Chip
                      mode="outlined"
                      compact
                      style={[styles.streakChip, { borderColor: habit.color }]}
                      textStyle={{ color: habit.color }}
                    >
                      {habit.currentStreak} day streak
                    </Chip>
                  </View>
                  
                  {habit.description && (
                    <Text style={styles.habitDescription}>{habit.description}</Text>
                  )}
                </View>

                <View style={styles.habitActions}>
                  <IconButton
                    icon={isHabitCompletedToday(habit) ? "check-circle" : "radio-button-unchecked"}
                    size={32}
                    iconColor={isHabitCompletedToday(habit) ? habit.color : '#ccc'}
                    onPress={() => {
                      if (isHabitCompletedToday(habit)) {
                        handleUncompleteHabit(habit.id);
                      } else {
                        handleCompleteHabit(habit.id);
                      }
                    }}
                  />
                  <IconButton
                    icon="calendar-today"
                    size={20}
                    onPress={() => {
                      setSelectedHabit(habit);
                      setShowCalendar(true);
                    }}
                  />
                </View>
              </View>

              <View style={styles.habitStats}>
                <View style={styles.habitStat}>
                  <Text style={styles.habitStatLabel}>Frequency</Text>
                  <Text style={styles.habitStatValue}>
                    {habit.frequency} ({habit.targetCount}x)
                  </Text>
                </View>
                <View style={styles.habitStat}>
                  <Text style={styles.habitStatLabel}>Completion Rate</Text>
                  <Text style={styles.habitStatValue}>
                    {Math.round(getHabitCompletionRate(habit))}%
                  </Text>
                </View>
                <View style={styles.habitStat}>
                  <Text style={styles.habitStatLabel}>Longest Streak</Text>
                  <Text style={styles.habitStatValue}>
                    {habit.longestStreak} days
                  </Text>
                </View>
              </View>

              <ProgressBar 
                progress={getHabitCompletionRate(habit) / 100} 
                color={habit.color} 
                style={styles.habitProgress}
              />
            </Card.Content>
          </Card>
        ))}

        {activeHabits.length === 0 && (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialIcons name="psychology" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>No Habits Yet</Text>
              <Text style={styles.emptyDescription}>
                Start building positive habits to improve your daily routine
              </Text>
              <Button
                mode="contained"
                onPress={() => setShowAddModal(true)}
                style={styles.emptyButton}
              >
                Add Your First Habit
              </Button>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Add Habit FAB */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setShowAddModal(true)}
      />

      {/* Add Habit Modal */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Card>
            <Card.Title title="Add New Habit" />
            <Card.Content>
              <TextInput
                label="Habit Name *"
                value={newHabitName}
                onChangeText={setNewHabitName}
                mode="outlined"
                style={styles.input}
              />
              
              <TextInput
                label="Description"
                value={newHabitDescription}
                onChangeText={setNewHabitDescription}
                mode="outlined"
                multiline
                numberOfLines={2}
                style={styles.input}
              />

              <View style={styles.row}>
                <Menu
                  visible={showColorMenu}
                  onDismiss={() => setShowColorMenu(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setShowColorMenu(true)}
                      style={styles.halfButton}
                      icon={() => (
                        <View style={[styles.colorPreview, { backgroundColor: newHabitColor }]} />
                      )}
                    >
                      Color
                    </Button>
                  }
                >
                  {colors.map(color => (
                    <Menu.Item
                      key={color}
                      onPress={() => {
                        setNewHabitColor(color);
                        setShowColorMenu(false);
                      }}
                      title=""
                      leadingIcon={() => (
                        <View style={[styles.colorOption, { backgroundColor: color }]} />
                      )}
                    />
                  ))}
                </Menu>

                <Menu
                  visible={showIconMenu}
                  onDismiss={() => setShowIconMenu(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setShowIconMenu(true)}
                      style={styles.halfButton}
                      icon={newHabitIcon}
                    >
                      Icon
                    </Button>
                  }
                >
                  {icons.map(icon => (
                    <Menu.Item
                      key={icon}
                      onPress={() => {
                        setNewHabitIcon(icon);
                        setShowIconMenu(false);
                      }}
                      title=""
                      leadingIcon={icon}
                    />
                  ))}
                </Menu>
              </View>

              <View style={styles.row}>
                <TextInput
                  label="Target Count"
                  value={newHabitTarget}
                  onChangeText={setNewHabitTarget}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.halfInput}
                />
                
                <View style={styles.frequencyButtons}>
                  {(['daily', 'weekly', 'monthly'] as const).map(freq => (
                    <Chip
                      key={freq}
                      selected={newHabitFrequency === freq}
                      onPress={() => setNewHabitFrequency(freq)}
                      style={styles.frequencyChip}
                    >
                      {freq}
                    </Chip>
                  ))}
                </View>
              </View>
            </Card.Content>
            
            <Card.Actions>
              <Button onPress={() => setShowAddModal(false)}>Cancel</Button>
              <Button mode="contained" onPress={handleAddHabit}>
                Add Habit
              </Button>
            </Card.Actions>
          </Card>
        </Modal>
      </Portal>

      {/* Calendar Modal */}
      <Portal>
        <Modal
          visible={showCalendar}
          onDismiss={() => setShowCalendar(false)}
          contentContainerStyle={styles.modal}
        >
          <Card>
            <Card.Title 
              title={selectedHabit?.name || 'Habit Calendar'}
              subtitle="Track your progress over time"
            />
            <Card.Content>
              {selectedHabit && (
                <Calendar
                  markedDates={getCalendarMarkedDates(selectedHabit)}
                  theme={{
                    selectedDayBackgroundColor: selectedHabit.color,
                    todayTextColor: selectedHabit.color,
                    arrowColor: selectedHabit.color,
                  }}
                  onDayPress={(day) => {
                    const date = new Date(day.dateString);
                    const isCompleted = selectedHabit.completedDates.some(
                      d => d.toDateString() === date.toDateString()
                    );
                    
                    if (isCompleted) {
                      handleUncompleteHabit(selectedHabit.id, date);
                    } else {
                      handleCompleteHabit(selectedHabit.id, date);
                    }
                  }}
                />
              )}
            </Card.Content>
            
            <Card.Actions>
              <Button onPress={() => setShowCalendar(false)}>Close</Button>
            </Card.Actions>
          </Card>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  overviewCard: {
    margin: 16,
    marginBottom: 8,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  progressSection: {
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  habitCard: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  habitInfo: {
    flex: 1,
  },
  habitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  streakChip: {
    height: 24,
  },
  habitDescription: {
    fontSize: 14,
    color: '#666',
    marginLeft: 32,
  },
  habitActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  habitStat: {
    alignItems: 'center',
  },
  habitStatLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  habitStatValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  habitProgress: {
    height: 4,
    borderRadius: 2,
  },
  emptyCard: {
    margin: 16,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 24,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modal: {
    margin: 20,
  },
  input: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  halfButton: {
    flex: 0.48,
  },
  halfInput: {
    flex: 0.48,
  },
  colorPreview: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  colorOption: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  frequencyButtons: {
    flex: 0.48,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  frequencyChip: {
    flex: 0.3,
  },
});
