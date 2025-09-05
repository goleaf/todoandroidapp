import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Chip,
  Switch,
  IconButton,
  Menu,
  Divider,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { addTodo } from '../../store/slices/todoSlice';
import { Todo, Category, Attachment, RecurringConfig } from '../../types';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

interface Props {
  navigation: any;
  route: any;
}

export default function AddTodoScreen({ navigation, route }: Props) {
  const dispatch = useDispatch();
  const { categories } = useSelector((state: RootState) => state.categories);
  const voiceInput = route.params?.voiceInput || '';

  // Basic todo fields
  const [title, setTitle] = useState(voiceInput);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [categoryId, setCategoryId] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // Date and time
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Advanced features
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [location, setLocation] = useState<any>(null);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [voiceMemo, setVoiceMemo] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  // Recurring settings
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringConfig, setRecurringConfig] = useState<RecurringConfig>({
    type: 'daily',
    interval: 1,
  });

  // UI state
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);

  useEffect(() => {
    // Parse voice input for smart suggestions
    if (voiceInput) {
      parseVoiceInput(voiceInput);
    }
  }, [voiceInput]);

  const parseVoiceInput = (input: string) => {
    const lowerInput = input.toLowerCase();
    
    // Extract priority
    if (lowerInput.includes('urgent') || lowerInput.includes('important') || lowerInput.includes('high priority')) {
      setPriority('high');
    } else if (lowerInput.includes('low priority') || lowerInput.includes('when i have time')) {
      setPriority('low');
    }

    // Extract due date
    const tomorrow = lowerInput.includes('tomorrow');
    const today = lowerInput.includes('today');
    const nextWeek = lowerInput.includes('next week');
    
    if (tomorrow) {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      setDueDate(date);
    } else if (today) {
      setDueDate(new Date());
    } else if (nextWeek) {
      const date = new Date();
      date.setDate(date.getDate() + 7);
      setDueDate(date);
    }

    // Extract time
    const timeMatch = input.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
    if (timeMatch && dueDate) {
      const hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2] || '0');
      const isPM = timeMatch[3].toLowerCase() === 'pm';
      
      const newDate = new Date(dueDate);
      newDate.setHours(isPM && hours !== 12 ? hours + 12 : hours);
      newDate.setMinutes(minutes);
      setDueDate(newDate);
    }

    // Extract category
    const workKeywords = ['work', 'office', 'meeting', 'project', 'deadline'];
    const personalKeywords = ['personal', 'home', 'family', 'health'];
    const shoppingKeywords = ['buy', 'shop', 'purchase', 'store'];

    if (workKeywords.some(keyword => lowerInput.includes(keyword))) {
      setCategoryId('work');
    } else if (personalKeywords.some(keyword => lowerInput.includes(keyword))) {
      setCategoryId('personal');
    } else if (shoppingKeywords.some(keyword => lowerInput.includes(keyword))) {
      setCategoryId('shopping');
    }
  };

  const handleSaveTodo = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    const newTodo: Todo = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      completed: false,
      priority,
      status: 'not_started',
      dueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
      categoryId: categoryId || undefined,
      tags,
      attachments,
      location,
      estimatedTime: estimatedTime ? parseInt(estimatedTime) : undefined,
      voiceMemo,
      recurring: isRecurring ? recurringConfig : undefined,
      customFields: {},
    };

    dispatch(addTodo(newTodo));
    navigation.goBack();
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const attachment: Attachment = {
          id: Date.now().toString(),
          type: 'document',
          uri: asset.uri,
          name: asset.name,
          size: asset.size || 0,
          createdAt: new Date(),
        };
        setAttachments([...attachments, attachment]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const attachment: Attachment = {
          id: Date.now().toString(),
          type: 'image',
          uri: asset.uri,
          name: `image_${Date.now()}.jpg`,
          size: 0,
          createdAt: new Date(),
        };
        setAttachments([...attachments, attachment]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleGetLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        address: address[0] ? `${address[0].street}, ${address[0].city}` : 'Current location',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Audio recording permission is required');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) {
        setVoiceMemo(uri);
      }
      setRecording(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const speakTitle = () => {
    if (title) {
      Speech.speak(title);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          {/* Title */}
          <View style={styles.titleRow}>
            <TextInput
              label="Task Title *"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={styles.titleInput}
            />
            <IconButton
              icon="volume-high"
              size={24}
              onPress={speakTitle}
              disabled={!title}
            />
          </View>

          {/* Description */}
          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          {/* Priority and Category */}
          <View style={styles.row}>
            <Menu
              visible={showPriorityMenu}
              onDismiss={() => setShowPriorityMenu(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setShowPriorityMenu(true)}
                  style={styles.halfButton}
                >
                  Priority: {priority}
                </Button>
              }
            >
              <Menu.Item onPress={() => { setPriority('low'); setShowPriorityMenu(false); }} title="Low" />
              <Menu.Item onPress={() => { setPriority('medium'); setShowPriorityMenu(false); }} title="Medium" />
              <Menu.Item onPress={() => { setPriority('high'); setShowPriorityMenu(false); }} title="High" />
            </Menu>

            <Menu
              visible={showCategoryMenu}
              onDismiss={() => setShowCategoryMenu(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setShowCategoryMenu(true)}
                  style={styles.halfButton}
                >
                  {categoryId ? categories.find(c => c.id === categoryId)?.name : 'Category'}
                </Button>
              }
            >
              <Menu.Item onPress={() => { setCategoryId(''); setShowCategoryMenu(false); }} title="None" />
              {categories.map(category => (
                <Menu.Item
                  key={category.id}
                  onPress={() => { setCategoryId(category.id); setShowCategoryMenu(false); }}
                  title={category.name}
                />
              ))}
            </Menu>
          </View>

          {/* Due Date */}
          <View style={styles.row}>
            <Button
              mode="outlined"
              onPress={() => setShowDatePicker(true)}
              style={styles.halfButton}
            >
              {dueDate ? dueDate.toDateString() : 'Due Date'}
            </Button>
            <Button
              mode="outlined"
              onPress={() => setShowTimePicker(true)}
              style={styles.halfButton}
              disabled={!dueDate}
            >
              {dueDate ? dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Time'}
            </Button>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={dueDate || new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDueDate(selectedDate);
                }
              }}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={dueDate || new Date()}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime && dueDate) {
                  const newDate = new Date(dueDate);
                  newDate.setHours(selectedTime.getHours());
                  newDate.setMinutes(selectedTime.getMinutes());
                  setDueDate(newDate);
                }
              }}
            />
          )}

          {/* Tags */}
          <View style={styles.tagsSection}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <Chip
                  key={index}
                  onClose={() => handleRemoveTag(tag)}
                  style={styles.tag}
                >
                  {tag}
                </Chip>
              ))}
            </View>
            <View style={styles.addTagRow}>
              <TextInput
                label="Add tag"
                value={newTag}
                onChangeText={setNewTag}
                mode="outlined"
                style={styles.tagInput}
                onSubmitEditing={handleAddTag}
              />
              <IconButton
                icon="plus"
                size={24}
                onPress={handleAddTag}
              />
            </View>
          </View>

          {/* Estimated Time */}
          <TextInput
            label="Estimated time (minutes)"
            value={estimatedTime}
            onChangeText={setEstimatedTime}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />

          {/* Attachments */}
          <View style={styles.attachmentsSection}>
            <Text style={styles.sectionTitle}>Attachments</Text>
            <View style={styles.attachmentButtons}>
              <Button
                mode="outlined"
                icon="camera"
                onPress={handlePickImage}
                style={styles.attachmentButton}
              >
                Photo
              </Button>
              <Button
                mode="outlined"
                icon="file-document"
                onPress={handlePickDocument}
                style={styles.attachmentButton}
              >
                Document
              </Button>
              <Button
                mode="outlined"
                icon={isRecording ? "stop" : "microphone"}
                onPress={isRecording ? stopRecording : startRecording}
                style={styles.attachmentButton}
              >
                {isRecording ? 'Stop' : 'Voice'}
              </Button>
            </View>
            
            {attachments.length > 0 && (
              <View style={styles.attachmentsList}>
                {attachments.map((attachment, index) => (
                  <Chip
                    key={index}
                    onClose={() => setAttachments(attachments.filter((_, i) => i !== index))}
                    style={styles.attachmentChip}
                  >
                    {attachment.name}
                  </Chip>
                ))}
              </View>
            )}

            {voiceMemo && (
              <Chip
                onClose={() => setVoiceMemo('')}
                style={styles.attachmentChip}
              >
                Voice memo recorded
              </Chip>
            )}
          </View>

          {/* Location */}
          <View style={styles.locationSection}>
            <View style={styles.locationRow}>
              <Text style={styles.sectionTitle}>Location</Text>
              <Button
                mode="outlined"
                icon="map-marker"
                onPress={handleGetLocation}
                compact
              >
                Get Current
              </Button>
            </View>
            {location && (
              <Chip
                onClose={() => setLocation(null)}
                style={styles.locationChip}
              >
                {location.address}
              </Chip>
            )}
          </View>

          {/* Recurring */}
          <View style={styles.recurringSection}>
            <View style={styles.switchRow}>
              <Text style={styles.sectionTitle}>Recurring Task</Text>
              <Switch
                value={isRecurring}
                onValueChange={setIsRecurring}
              />
            </View>
            
            {isRecurring && (
              <View style={styles.recurringOptions}>
                <Menu
                  visible={false}
                  onDismiss={() => {}}
                  anchor={
                    <Button mode="outlined">
                      {recurringConfig.type}
                    </Button>
                  }
                >
                  {/* Recurring options would go here */}
                </Menu>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleSaveTodo}
          style={styles.saveButton}
        >
          Save Task
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleInput: {
    flex: 1,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  halfButton: {
    flex: 0.48,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  tagsSection: {
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    marginRight: 8,
    marginBottom: 4,
  },
  addTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
  },
  attachmentsSection: {
    marginBottom: 16,
  },
  attachmentButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  attachmentButton: {
    flex: 0.3,
  },
  attachmentsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  attachmentChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  locationSection: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationChip: {
    alignSelf: 'flex-start',
  },
  recurringSection: {
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recurringOptions: {
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  cancelButton: {
    flex: 0.45,
  },
  saveButton: {
    flex: 0.45,
  },
});
