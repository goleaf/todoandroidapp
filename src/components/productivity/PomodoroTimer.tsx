import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Vibration,
} from 'react-native';
import {
  Card,
  Button,
  IconButton,
  ProgressBar,
  Chip,
  Menu,
  Portal,
  Modal,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { 
  startPomodoroSession, 
  completePomodoroSession, 
  interruptPomodoroSession 
} from '../../store/slices/userSlice';
import { startTimer, stopTimer } from '../../store/slices/todoSlice';
import { PomodoroSession, PomodoroSettings, TimeEntry } from '../../types';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as Notifications from 'expo-notifications';

interface Props {
  todoId?: string;
  onSessionComplete?: (session: PomodoroSession) => void;
  visible: boolean;
  onDismiss: () => void;
}

export default function PomodoroTimer({ todoId, onSessionComplete, visible, onDismiss }: Props) {
  const dispatch = useDispatch();
  const { currentUser, currentPomodoroSession } = useSelector((state: RootState) => state.user);
  const { activeTimer } = useSelector((state: RootState) => state.todos);
  
  const pomodoroSettings: PomodoroSettings = currentUser?.preferences.pomodoroSettings || {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartWork: false,
    soundEnabled: true,
    vibrationEnabled: true,
  };

  const [sessionType, setSessionType] = useState<'work' | 'short_break' | 'long_break'>('work');
  const [timeRemaining, setTimeRemaining] = useState(pomodoroSettings.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, isPaused]);

  useEffect(() => {
    // Update progress animation
    const totalDuration = getDurationForType(sessionType) * 60;
    const progress = 1 - (timeRemaining / totalDuration);
    
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [timeRemaining, sessionType]);

  useEffect(() => {
    // Pulse animation when running
    if (isRunning && !isPaused) {
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }
  }, [isRunning, isPaused]);

  const getDurationForType = (type: 'work' | 'short_break' | 'long_break') => {
    switch (type) {
      case 'work':
        return pomodoroSettings.workDuration;
      case 'short_break':
        return pomodoroSettings.shortBreakDuration;
      case 'long_break':
        return pomodoroSettings.longBreakDuration;
      default:
        return pomodoroSettings.workDuration;
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const handleStart = () => {
    if (!isRunning) {
      // Start new session
      const session: PomodoroSession = {
        id: Date.now().toString(),
        todoId,
        type: sessionType,
        duration: getDurationForType(sessionType),
        startTime: new Date(),
        completed: false,
        interrupted: false,
      };
      
      dispatch(startPomodoroSession(session));
      
      // Start timer for todo if provided
      if (todoId && sessionType === 'work') {
        const timeEntry: TimeEntry = {
          id: Date.now().toString(),
          todoId,
          startTime: new Date(),
          duration: 0,
          userId: currentUser?.id || 'anonymous',
        };
        dispatch(startTimer({ todoId, timeEntry }));
      }
    }
    
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeRemaining(getDurationForType(sessionType) * 60);
    
    if (currentPomodoroSession) {
      dispatch(interruptPomodoroSession(currentPomodoroSession.id));
    }
    
    // Stop timer for todo if running
    if (todoId && activeTimer === todoId) {
      dispatch(stopTimer({ todoId, endTime: new Date() }));
    }
  };

  const handleSessionComplete = () => {
    setIsRunning(false);
    setIsPaused(false);
    
    // Notifications and feedback
    if (pomodoroSettings.vibrationEnabled) {
      Vibration.vibrate([0, 500, 200, 500]);
    }
    
    // Send notification
    Notifications.scheduleNotificationAsync({
      content: {
        title: 'Pomodoro Complete!',
        body: sessionType === 'work' 
          ? 'Great work! Time for a break.' 
          : 'Break time is over. Ready to focus?',
        sound: pomodoroSettings.soundEnabled,
      },
      trigger: null,
    });
    
    if (currentPomodoroSession) {
      dispatch(completePomodoroSession({
        sessionId: currentPomodoroSession.id,
        endTime: new Date(),
      }));
    }
    
    // Stop timer for todo if running
    if (todoId && activeTimer === todoId) {
      dispatch(stopTimer({ todoId, endTime: new Date() }));
    }
    
    // Handle session completion
    if (sessionType === 'work') {
      setCompletedSessions(prev => prev + 1);
      
      // Determine next session type
      const nextSessionType = (completedSessions + 1) % pomodoroSettings.longBreakInterval === 0
        ? 'long_break'
        : 'short_break';
      
      setSessionType(nextSessionType);
      setTimeRemaining(getDurationForType(nextSessionType) * 60);
      
      // Auto-start break if enabled
      if (pomodoroSettings.autoStartBreaks) {
        setTimeout(() => handleStart(), 2000);
      }
    } else {
      // Break completed
      setSessionType('work');
      setTimeRemaining(getDurationForType('work') * 60);
      
      // Auto-start work if enabled
      if (pomodoroSettings.autoStartWork) {
        setTimeout(() => handleStart(), 2000);
      }
    }
    
    if (onSessionComplete && currentPomodoroSession) {
      onSessionComplete(currentPomodoroSession);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionColor = () => {
    switch (sessionType) {
      case 'work':
        return '#f44336';
      case 'short_break':
        return '#4caf50';
      case 'long_break':
        return '#2196f3';
      default:
        return '#f44336';
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

  const totalDuration = getDurationForType(sessionType) * 60;
  const progress = 1 - (timeRemaining / totalDuration);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <Card style={styles.card}>
          <Card.Title
            title="Pomodoro Timer"
            subtitle={`Session ${completedSessions + 1}`}
            left={() => (
              <MaterialIcons 
                name={getSessionIcon()} 
                size={24} 
                color={getSessionColor()} 
              />
            )}
            right={() => (
              <IconButton
                icon="settings"
                size={20}
                onPress={() => setShowSettings(true)}
              />
            )}
          />
          
          <Card.Content>
            {/* Session Type Indicator */}
            <View style={styles.sessionTypeRow}>
              <Chip
                mode="outlined"
                style={[styles.sessionChip, { borderColor: getSessionColor() }]}
                textStyle={{ color: getSessionColor() }}
              >
                {sessionType.replace('_', ' ').toUpperCase()}
              </Chip>
              <Text style={styles.sessionCount}>
                Completed: {completedSessions}
              </Text>
            </View>

            {/* Timer Display */}
            <View style={styles.timerContainer}>
              <Animated.View 
                style={[
                  styles.timerCircle,
                  { 
                    transform: [{ scale: pulseAnim }],
                    borderColor: getSessionColor(),
                  }
                ]}
              >
                <Text style={[styles.timerText, { color: getSessionColor() }]}>
                  {formatTime(timeRemaining)}
                </Text>
              </Animated.View>
            </View>

            {/* Progress Bar */}
            <ProgressBar
              progress={progress}
              color={getSessionColor()}
              style={styles.progressBar}
            />
            <Text style={styles.progressText}>
              {Math.round(progress * 100)}% Complete
            </Text>

            {/* Controls */}
            <View style={styles.controls}>
              {!isRunning ? (
                <Button
                  mode="contained"
                  onPress={handleStart}
                  style={[styles.controlButton, { backgroundColor: getSessionColor() }]}
                  icon="play-arrow"
                >
                  Start
                </Button>
              ) : (
                <>
                  {!isPaused ? (
                    <Button
                      mode="contained"
                      onPress={handlePause}
                      style={[styles.controlButton, { backgroundColor: '#ff9800' }]}
                      icon="pause"
                    >
                      Pause
                    </Button>
                  ) : (
                    <Button
                      mode="contained"
                      onPress={handleResume}
                      style={[styles.controlButton, { backgroundColor: getSessionColor() }]}
                      icon="play-arrow"
                    >
                      Resume
                    </Button>
                  )}
                  <Button
                    mode="outlined"
                    onPress={handleStop}
                    style={styles.controlButton}
                    icon="stop"
                  >
                    Stop
                  </Button>
                </>
              )}
            </View>

            {/* Session Info */}
            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <MaterialIcons name="schedule" size={16} color="#666" />
                <Text style={styles.infoText}>
                  Work: {pomodoroSettings.workDuration}min
                </Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialIcons name="coffee" size={16} color="#666" />
                <Text style={styles.infoText}>
                  Break: {pomodoroSettings.shortBreakDuration}min
                </Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialIcons name="spa" size={16} color="#666" />
                <Text style={styles.infoText}>
                  Long: {pomodoroSettings.longBreakDuration}min
                </Text>
              </View>
            </View>
          </Card.Content>

          <Card.Actions>
            <Button onPress={onDismiss}>Close</Button>
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
    maxHeight: '80%',
  },
  sessionTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sessionChip: {
    borderWidth: 2,
  },
  sessionCount: {
    fontSize: 14,
    color: '#666',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  timerText: {
    fontSize: 36,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    marginBottom: 24,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  controlButton: {
    minWidth: 100,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
});
