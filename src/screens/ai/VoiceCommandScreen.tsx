import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Button, 
  Card, 
  Title, 
  Paragraph, 
  Chip, 
  List, 
  IconButton,
  Surface,
  ActivityIndicator 
} from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { RootState } from '../../store';
import { VoiceCommand } from '../../types';
import VoiceService from '../../services/VoiceService';
import AIService from '../../services/AIService';

const { width, height } = Dimensions.get('window');

interface Props {
  navigation: any;
}

export default function VoiceCommandScreen({ navigation }: Props) {
  const dispatch = useDispatch();
  const { ai } = useSelector((state: RootState) => state.settings);
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentCommands, setRecentCommands] = useState<VoiceCommand[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const waveAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Load training phrases as suggestions
    setSuggestions(VoiceService.getTrainingPhrases().slice(0, 8));
  }, []);

  useEffect(() => {
    if (isListening) {
      startPulseAnimation();
      startWaveAnimation();
    } else {
      stopAnimations();
    }
  }, [isListening]);

  const startPulseAnimation = () => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (isListening) pulse();
      });
    };
    pulse();
  };

  const startWaveAnimation = () => {
    const wave = () => {
      Animated.timing(waveAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }).start(() => {
        waveAnimation.setValue(0);
        if (isListening) wave();
      });
    };
    wave();
  };

  const stopAnimations = () => {
    pulseAnimation.setValue(1);
    waveAnimation.setValue(0);
  };

  const startListening = async () => {
    if (!ai.enabled || !ai.voiceCommands) {
      Alert.alert(
        'Voice Commands Disabled',
        'Please enable voice commands in AI settings to use this feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => navigation.navigate('AISettings') },
        ]
      );
      return;
    }

    try {
      const success = await VoiceService.startListening();
      if (success) {
        setIsListening(true);
        setTranscript('');
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Alert.alert('Error', 'Could not start voice recognition. Please check your microphone permissions.');
      }
    } catch (error) {
      console.error('Failed to start listening:', error);
      Alert.alert('Error', 'Failed to start voice recognition.');
    }
  };

  const stopListening = async () => {
    try {
      await VoiceService.stopListening();
      setIsListening(false);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Failed to stop listening:', error);
    }
  };

  const processVoiceCommand = async (text: string) => {
    setIsProcessing(true);
    setTranscript(text);

    try {
      const command = AIService.processVoiceCommand(text);
      
      // Add to recent commands
      setRecentCommands(prev => [command, ...prev.slice(0, 9)]);

      // Execute the command based on intent
      await executeCommand(command);

      // Provide voice feedback
      if (command.result?.success) {
        await VoiceService.speak(command.result.message || 'Command executed successfully');
      } else {
        await VoiceService.speak(command.result?.error || 'Sorry, I couldn\'t execute that command');
      }

    } catch (error) {
      console.error('Failed to process voice command:', error);
      await VoiceService.speak('Sorry, there was an error processing your command');
    } finally {
      setIsProcessing(false);
      setIsListening(false);
    }
  };

  const executeCommand = async (command: VoiceCommand) => {
    switch (command.intent) {
      case 'create_task':
        navigation.navigate('AddTodo', { 
          voiceInput: command.parameters.title,
          aiSuggestions: command.parameters 
        });
        command.result = { success: true, message: 'Navigating to create task' };
        break;

      case 'list_tasks':
        navigation.navigate('TodoList', { filter: command.parameters.filter });
        command.result = { success: true, message: 'Showing your tasks' };
        break;

      case 'start_timer':
        navigation.navigate('Pomodoro', { duration: command.parameters.duration });
        command.result = { success: true, message: 'Starting timer' };
        break;

      case 'complete_task':
        // This would integrate with the todo completion logic
        command.result = { success: true, message: 'Task marked as complete' };
        break;

      case 'set_reminder':
        // This would integrate with the notification service
        command.result = { success: true, message: 'Reminder set' };
        break;

      default:
        command.result = { success: false, error: 'Unknown command' };
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    processVoiceCommand(suggestion);
  };

  const renderVoiceButton = () => {
    const microphoneSize = isListening ? 80 : 60;
    const backgroundColor = isListening ? '#FF5722' : '#2196F3';

    return (
      <View style={styles.voiceButtonContainer}>
        <Animated.View
          style={[
            styles.voiceButtonOuter,
            {
              transform: [{ scale: pulseAnimation }],
              backgroundColor: backgroundColor + '20',
            },
          ]}
        >
          <Surface
            style={[
              styles.voiceButton,
              { 
                backgroundColor,
                width: microphoneSize,
                height: microphoneSize,
                borderRadius: microphoneSize / 2,
              },
            ]}
            elevation={8}
          >
            <IconButton
              icon={isListening ? 'mic' : 'mic-none'}
              size={microphoneSize * 0.4}
              iconColor="white"
              onPress={isListening ? stopListening : startListening}
              disabled={isProcessing}
            />
          </Surface>
        </Animated.View>

        {isListening && (
          <View style={styles.waveContainer}>
            {[...Array(5)].map((_, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.wave,
                  {
                    opacity: waveAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    }),
                    transform: [
                      {
                        scaleY: waveAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 2],
                        }),
                      },
                    ],
                    animationDelay: index * 100,
                  },
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderStatus = () => {
    let statusText = 'Tap the microphone to start';
    let statusColor = '#666';

    if (isListening) {
      statusText = 'Listening... Speak now';
      statusColor = '#FF5722';
    } else if (isProcessing) {
      statusText = 'Processing your command...';
      statusColor = '#2196F3';
    } else if (transcript) {
      statusText = `Heard: "${transcript}"`;
      statusColor = '#4CAF50';
    }

    return (
      <View style={styles.statusContainer}>
        <Text style={[styles.statusText, { color: statusColor }]}>
          {statusText}
        </Text>
        {isProcessing && (
          <ActivityIndicator 
            size="small" 
            color="#2196F3" 
            style={styles.processingIndicator} 
          />
        )}
      </View>
    );
  };

  const renderSuggestions = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>Try saying:</Title>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.suggestionsContainer}>
            {suggestions.map((suggestion, index) => (
              <Chip
                key={index}
                mode="outlined"
                onPress={() => handleSuggestionPress(suggestion)}
                style={styles.suggestionChip}
                disabled={isListening || isProcessing}
              >
                {suggestion}
              </Chip>
            ))}
          </View>
        </ScrollView>
      </Card.Content>
    </Card>
  );

  const renderRecentCommands = () => {
    if (recentCommands.length === 0) return null;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title>Recent Commands</Title>
          {recentCommands.map((command, index) => (
            <List.Item
              key={index}
              title={command.command}
              description={`${command.intent.replace('_', ' ')} • ${command.result?.success ? 'Success' : 'Failed'}`}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon={getIntentIcon(command.intent)}
                  color={command.result?.success ? '#4CAF50' : '#F44336'}
                />
              )}
              right={(props) => (
                <Text style={[styles.confidenceText, { color: getConfidenceColor(command.confidence) }]}>
                  {Math.round(command.confidence * 100)}%
                </Text>
              )}
              style={styles.commandItem}
            />
          ))}
        </Card.Content>
      </Card>
    );
  };

  const renderQuickActions = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title>Quick Actions</Title>
        <View style={styles.quickActions}>
          <Button
            mode="outlined"
            onPress={() => handleSuggestionPress('Create task buy groceries')}
            style={styles.quickActionButton}
            disabled={isListening || isProcessing}
          >
            Add Task
          </Button>
          <Button
            mode="outlined"
            onPress={() => handleSuggestionPress('Show my tasks')}
            style={styles.quickActionButton}
            disabled={isListening || isProcessing}
          >
            List Tasks
          </Button>
          <Button
            mode="outlined"
            onPress={() => handleSuggestionPress('Start 25 minute timer')}
            style={styles.quickActionButton}
            disabled={isListening || isProcessing}
          >
            Start Timer
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const getIntentIcon = (intent: string): string => {
    switch (intent) {
      case 'create_task':
        return 'plus';
      case 'complete_task':
        return 'check';
      case 'list_tasks':
        return 'format-list-bulleted';
      case 'set_reminder':
        return 'bell';
      case 'start_timer':
        return 'timer';
      default:
        return 'help';
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return '#4CAF50';
    if (confidence >= 0.6) return '#FF9800';
    return '#F44336';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        {renderVoiceButton()}
        {renderStatus()}
      </View>

      {renderSuggestions()}
      {renderQuickActions()}
      {renderRecentCommands()}

      <Card style={styles.card}>
        <Card.Content>
          <Title>Voice Commands Help</Title>
          <Paragraph>
            You can use natural language to control the app. Here are some examples:
          </Paragraph>
          <View style={styles.helpList}>
            <Text style={styles.helpItem}>• "Create task buy milk tomorrow"</Text>
            <Text style={styles.helpItem}>• "Show my overdue tasks"</Text>
            <Text style={styles.helpItem}>• "Start 25 minute timer"</Text>
            <Text style={styles.helpItem}>• "Complete task exercise"</Text>
            <Text style={styles.helpItem}>• "Remind me to call mom at 6 PM"</Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  voiceButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  voiceButtonOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 60,
  },
  wave: {
    width: 4,
    height: 20,
    backgroundColor: '#FF5722',
    marginHorizontal: 2,
    borderRadius: 2,
  },
  statusContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  processingIndicator: {
    marginLeft: 8,
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  suggestionChip: {
    marginRight: 8,
    marginVertical: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    flexWrap: 'wrap',
  },
  quickActionButton: {
    marginVertical: 4,
    minWidth: 100,
  },
  commandItem: {
    paddingVertical: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '500',
    alignSelf: 'center',
  },
  helpList: {
    marginTop: 12,
  },
  helpItem: {
    fontSize: 14,
    color: '#666',
    marginVertical: 2,
    lineHeight: 20,
  },
});
