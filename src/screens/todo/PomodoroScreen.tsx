import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
  Vibration,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Card, Title, Paragraph, Chip, IconButton, ProgressBar } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { RootState } from '../../store';
import { 
  startPomodoroSession, 
  updatePomodoroSession, 
  completePomodoroSession, 
  interruptPomodoroSession,
  addXP 
} from '../../store/slices/userSlice';
import { PomodoroSession, Todo } from '../../types';
import NotificationService from '../../services/NotificationService';

const { width, height } = Dimensions.get('window');

interface Props {
  navigation: any;
  route?: {
    params?: {
      todoId?: string;
    };
  };
}

export default function PomodoroScreen({ navigation, route }: Props) {
  const dispatch = useDispatch();
  const { currentPomodoroSession } = useSelector((state: RootState) => state.user);
  const { todos } = useSelector((state: RootState) => state.todos);
  const { productivity } = useSelector((state: RootState) => state.settings);
  
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState<'work' | 'short_break' | 'long_break'>('work');
  const [completedSessions, setCompletedSessions] = useState(0);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  const todoId = route?.params?.todoId;

  useEffect(() => {
    if (todoId) {
      const todo = todos.find(t => t.id === todoId);
      setSelectedTodo(todo || null);
    }
  }, [todoId, todos]);

  useEffect(() => {
    if (currentPomodoroSession) {
      setIsRunning(true);
      setSessionType(currentPomodoroSession.type);
      const elapsed = Math.floor((Date.now() - currentPomodoroSession.startTime.getTime()) / 1000);
      setTimeLeft(Math.max(0, currentPomodoroSession.duration * 60 - elapsed));
    }
  }, [currentPomodoroSession]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  // Animate progress circle
  useEffect(() => {
    const totalTime = getDurationForType(sessionType) * 60;
    const progress = 1 - (timeLeft / totalTime);
    
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [timeLeft, sessionType]);

  // Pulse animation when running
  useEffect(() => {
    if (isRunning) {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (isRunning) pulse();
        });
      };
      pulse();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [isRunning]);

  const getDurationForType = (type: 'work' | 'short_break' | 'long_break'): number => {
    switch (type) {
      case 'work':
        return 25; // 25 minutes
      case 'short_break':
        return 5; // 5 minutes
      case 'long_break':
        return 15; // 15 minutes
      default:
        return 25;
    }
  };

  const getNextSessionType = (): 'work' | 'short_break' | 'long_break' => {
    if (sessionType === 'work') {
      return completedSessions > 0 && (completedSessions + 1) % 4 === 0 ? 'long_break' : 'short_break';
    }
    return 'work';
  };

  const startSession = async () => {
    const duration = getDurationForType(sessionType);
    const session: PomodoroSession = {
      id: `pomodoro_${Date.now()}`,
      todoId: selectedTodo?.id,
      type: sessionType,
      duration,
      startTime: new Date(),
      completed: false,
      interrupted: false,
    };

    dispatch(startPomodoroSession(session));
    setTimeLeft(duration * 60);
    setIsRunning(true);

    // Schedule notification
    await NotificationService.schedulePomodoroNotification(
      sessionType === 'work' ? 'work_end' : 'break_end',
      duration
    );

    // Haptic feedback
    if (productivity.hapticFeedback) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const pauseSession = () => {
    setIsRunning(false);
    if (currentPomodoroSession) {
      dispatch(updatePomodoroSession({ interrupted: true }));
    }
  };

  const resumeSession = () => {
    setIsRunning(true);
    if (currentPomodoroSession) {
      dispatch(updatePomodoroSession({ interrupted: false }));
    }
  };

  const stopSession = () => {
    Alert.alert(
      'Stop Session',
      'Are you sure you want to stop the current session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: () => {
            setIsRunning(false);
            setTimeLeft(getDurationForType(sessionType) * 60);
            if (currentPomodoroSession) {
              dispatch(interruptPomodoroSession());
            }
          },
        },
      ]
    );
  };

  const handleSessionComplete = async () => {
    setIsRunning(false);
    
    if (currentPomodoroSession) {
      dispatch(completePomodoroSession());
    }

    // Add XP for completed session
    const xpReward = sessionType === 'work' ? 10 : 5;
    dispatch(addXP(xpReward));

    // Vibration and haptic feedback
    Vibration.vibrate([500, 200, 500]);
    if (productivity.hapticFeedback) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Show completion alert
    const nextType = getNextSessionType();
    Alert.alert(
      `${sessionType === 'work' ? 'Work' : 'Break'} Session Complete!`,
      `Great job! ${sessionType === 'work' ? `You earned ${xpReward} XP!` : 'Time to get back to work!'}\n\nNext: ${nextType.replace('_', ' ')} session`,
      [
        { text: 'Skip', onPress: () => setSessionType(nextType) },
        {
          text: 'Start Next',
          onPress: () => {
            setSessionType(nextType);
            setTimeLeft(getDurationForType(nextType) * 60);
            if (sessionType === 'work') {
              setCompletedSessions(prev => prev + 1);
            }
          },
        },
      ]
    );
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionColor = () => {
    switch (sessionType) {
      case 'work':
        return '#FF5722';
      case 'short_break':
        return '#4CAF50';
      case 'long_break':
        return '#2196F3';
      default:
        return '#FF5722';
    }
  };

  const getSessionIcon = () => {
    switch (sessionType) {
      case 'work':
        return 'work';
      case 'short_break':
        return 'coffee';
      case 'long_break':
        return 'spa';
      default:
        return 'work';
    }
  };

  const renderTimer = () => {
    const radius = 120;
    const strokeWidth = 8;
    const circumference = 2 * Math.PI * radius;
    const totalTime = getDurationForType(sessionType) * 60;
    const progress = 1 - (timeLeft / totalTime);

    return (
      <View style={styles.timerContainer}>
        <Animated.View
          style={[
            styles.timerCircle,
            {
              transform: [{ scale: pulseAnimation }],
              borderColor: getSessionColor(),
            },
          ]}
        >
          <Text style={[styles.timerText, { color: getSessionColor() }]}>
            {formatTime(timeLeft)}
          </Text>
          <Text style={styles.sessionTypeText}>
            {sessionType.replace('_', ' ').toUpperCase()}
          </Text>
        </Animated.View>
        
        <ProgressBar
          progress={progress}
          color={getSessionColor()}
          style={styles.progressBar}
        />
      </View>
    );
  };

  const renderControls = () => (
    <View style={styles.controls}>
      {!isRunning ? (
        <Button
          mode="contained"
          onPress={startSession}
          style={[styles.controlButton, { backgroundColor: getSessionColor() }]}
          contentStyle={styles.controlButtonContent}
          labelStyle={styles.controlButtonLabel}
        >
          Start {sessionType.replace('_', ' ')}
        </Button>
      ) : (
        <View style={styles.runningControls}>
          <IconButton
            icon="pause"
            size={32}
            onPress={pauseSession}
            style={[styles.iconButton, { backgroundColor: getSessionColor() }]}
            iconColor="white"
          />
          <IconButton
            icon="stop"
            size={32}
            onPress={stopSession}
            style={[styles.iconButton, { backgroundColor: '#666' }]}
            iconColor="white"
          />
        </View>
      )}
    </View>
  );

  const renderSessionSelector = () => (
    <View style={styles.sessionSelector}>
      {(['work', 'short_break', 'long_break'] as const).map((type) => (
        <Chip
          key={type}
          selected={sessionType === type}
          onPress={() => {
            if (!isRunning) {
              setSessionType(type);
              setTimeLeft(getDurationForType(type) * 60);
            }
          }}
          style={[
            styles.sessionChip,
            sessionType === type && { backgroundColor: getSessionColor() },
          ]}
          textStyle={[
            styles.sessionChipText,
            sessionType === type && { color: 'white' },
          ]}
          disabled={isRunning}
        >
          {type.replace('_', ' ')}
        </Chip>
      ))}
    </View>
  );

  const renderTaskInfo = () => {
    if (!selectedTodo) return null;

    return (
      <Card style={styles.taskCard}>
        <Card.Content>
          <View style={styles.taskHeader}>
            <MaterialIcons name="task" size={20} color={getSessionColor()} />
            <Text style={styles.taskTitle}>Working on:</Text>
          </View>
          <Text style={styles.taskName}>{selectedTodo.title}</Text>
          {selectedTodo.description && (
            <Text style={styles.taskDescription}>{selectedTodo.description}</Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderStats = () => (
    <Card style={styles.statsCard}>
      <Card.Content>
        <Title>Session Stats</Title>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedSessions}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.floor(completedSessions * 25 / 60)}</Text>
            <Text style={styles.statLabel}>Hours</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedSessions * 10}</Text>
            <Text style={styles.statLabel}>XP Earned</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      {renderTaskInfo()}
      {renderTimer()}
      {renderSessionSelector()}
      {renderControls()}
      {renderStats()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    justifyContent: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  timerCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  sessionTypeText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontWeight: '500',
  },
  progressBar: {
    width: 200,
    height: 6,
    marginTop: 20,
    borderRadius: 3,
  },
  sessionSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    flexWrap: 'wrap',
  },
  sessionChip: {
    margin: 4,
    backgroundColor: 'white',
  },
  sessionChipText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  controls: {
    alignItems: 'center',
    marginBottom: 30,
  },
  controlButton: {
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  controlButtonContent: {
    paddingVertical: 8,
  },
  controlButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  runningControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  iconButton: {
    margin: 0,
  },
  taskCard: {
    marginBottom: 20,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  taskName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statsCard: {
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
