import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Modal, Portal, Button, Card } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as Speech from 'expo-speech';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onResult: (text: string) => void;
}

export default function VoiceInput({ visible, onDismiss, onResult }: Props) {
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (isListening) {
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }
  }, [isListening]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const startListening = () => {
    setIsListening(true);
    setTranscription('');
    
    // Simulate voice recognition (in a real app, you'd use a speech-to-text service)
    setTimeout(() => {
      const sampleTexts = [
        "Buy groceries tomorrow at 3pm",
        "Call mom this evening",
        "Finish project report by Friday",
        "Schedule dentist appointment",
        "Pay electricity bill",
      ];
      const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
      setTranscription(randomText);
      setIsListening(false);
    }, 3000);
  };

  const stopListening = () => {
    setIsListening(false);
  };

  const handleConfirm = () => {
    if (transcription) {
      onResult(transcription);
      onDismiss();
      setTranscription('');
    }
  };

  const handleCancel = () => {
    setIsListening(false);
    setTranscription('');
    onDismiss();
  };

  const speakInstructions = () => {
    Speech.speak("Tap the microphone and speak your task. For example, say 'Buy groceries tomorrow at 3pm' or 'Call mom this evening'");
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleCancel}
        contentContainerStyle={styles.modal}
      >
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <Text style={styles.title}>Voice Input</Text>
              <TouchableOpacity onPress={speakInstructions}>
                <MaterialIcons name="help-outline" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.instruction}>
              Tap the microphone and speak your task
            </Text>

            <View style={styles.microphoneContainer}>
              <TouchableOpacity
                style={[
                  styles.microphoneButton,
                  isListening && styles.listeningButton,
                ]}
                onPress={isListening ? stopListening : startListening}
                disabled={!!transcription}
              >
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <MaterialIcons
                    name={isListening ? "mic" : "mic-none"}
                    size={48}
                    color={isListening ? "#f44336" : "#2196F3"}
                  />
                </Animated.View>
              </TouchableOpacity>
            </View>

            {isListening && (
              <View style={styles.listeningContainer}>
                <Text style={styles.listeningText}>Listening...</Text>
                <View style={styles.waveform}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Animated.View
                      key={i}
                      style={[
                        styles.waveBar,
                        {
                          height: Math.random() * 30 + 10,
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
            )}

            {transcription && (
              <View style={styles.transcriptionContainer}>
                <Text style={styles.transcriptionLabel}>Transcription:</Text>
                <Text style={styles.transcriptionText}>{transcription}</Text>
              </View>
            )}

            <View style={styles.examples}>
              <Text style={styles.examplesTitle}>Example commands:</Text>
              <Text style={styles.exampleText}>• "Buy groceries tomorrow at 3pm"</Text>
              <Text style={styles.exampleText}>• "Call mom this evening"</Text>
              <Text style={styles.exampleText}>• "High priority: finish report by Friday"</Text>
              <Text style={styles.exampleText}>• "Remind me to take medicine daily"</Text>
            </View>

            <View style={styles.actions}>
              <Button
                mode="outlined"
                onPress={handleCancel}
                style={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleConfirm}
                disabled={!transcription}
                style={styles.confirmButton}
              >
                Use This
              </Button>
            </View>
          </Card.Content>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  instruction: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  microphoneContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  microphoneButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  listeningButton: {
    backgroundColor: '#ffebee',
  },
  listeningContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  listeningText: {
    fontSize: 18,
    color: '#f44336',
    fontWeight: '500',
    marginBottom: 12,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'end',
    height: 40,
  },
  waveBar: {
    width: 4,
    backgroundColor: '#f44336',
    marginHorizontal: 2,
    borderRadius: 2,
  },
  transcriptionContainer: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  transcriptionLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  transcriptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  examples: {
    marginBottom: 24,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    paddingLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 0.45,
  },
  confirmButton: {
    flex: 0.45,
  },
});
