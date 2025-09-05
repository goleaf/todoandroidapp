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
  ProgressBar,
  Badge,
  List,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { addTodo, addAISuggestion } from '../../store/slices/todoSlice';
import { suggestCategory, predictPriority, processNaturalLanguage } from '../../store/slices/aiSlice';
import { addXP } from '../../store/slices/userSlice';
import { Todo, Category, Attachment, RecurringConfig, AISuggestion } from '../../types';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface Props {
  navigation: any;
  route: any;
}

export default function EnhancedAddTodoScreen({ navigation, route }: Props) {
  const dispatch = useDispatch();
  const { categories } = useSelector((state: RootState) => state.categories);
  const { templates, aiSuggestions } = useSelector((state: RootState) => state.todos);
  const { currentUser } = useSelector((state: RootState) => state.user);
  const { nlpEnabled, smartCategorizationEnabled, priorityPredictionEnabled } = useSelector((state: RootState) => state.ai);
  
  const voiceInput = route.params?.voiceInput || '';
  const templateId = route.params?.templateId;

  // Enhanced todo fields
  const [title, setTitle] = useState(voiceInput);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [status, setStatus] = useState<'draft' | 'not_started' | 'in_progress' | 'completed' | 'cancelled'>('draft');
  const [categoryId, setCategoryId] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [xpReward, setXpReward] = useState(10);

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

  // Collaboration
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState<string[]>([]);

  // Recurring settings
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringConfig, setRecurringConfig] = useState<RecurringConfig>({
    type: 'daily',
    interval: 1,
  });

  // AI suggestions
  const [currentSuggestions, setCurrentSuggestions] = useState<AISuggestion[]>([]);
  const [showAISuggestions, setShowAISuggestions] = useState(true);

  // UI state
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showDifficultyMenu, setShowDifficultyMenu] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  useEffect(() => {
    // Parse voice input for smart suggestions
    if (voiceInput && nlpEnabled) {
      parseVoiceInput(voiceInput);
    }
    
    // Load from template if provided
    if (templateId) {
      loadFromTemplate(templateId);
    }
  }, [voiceInput, templateId, nlpEnabled]);

  useEffect(() => {
    // Generate AI suggestions when title or description changes
    if ((title || description) && (smartCategorizationEnabled || priorityPredictionEnabled)) {
      generateAISuggestions();
    }
  }, [title, description, smartCategorizationEnabled, priorityPredictionEnabled]);

  useEffect(() => {
    // Calculate XP reward based on difficulty and estimated time
    const baseXP = 10;
    const difficultyMultiplier = difficultyLevel * 2;
    const timeBonus = estimatedTime ? Math.floor(parseInt(estimatedTime) / 30) * 5 : 0;
    setXpReward(baseXP + difficultyMultiplier + timeBonus);
  }, [difficultyLevel, estimatedTime]);

  const parseVoiceInput = (input: string) => {
    dispatch(processNaturalLanguage({ text: input, result: {} }));
    
    const lowerInput = input.toLowerCase();
    
    // Extract priority
    if (lowerInput.includes('urgent') || lowerInput.includes('important') || lowerInput.includes('high priority')) {
      setPriority('high');
      setDifficultyLevel(4);
    } else if (lowerInput.includes('low priority') || lowerInput.includes('when i have time')) {
      setPriority('low');
      setDifficultyLevel(2);
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

    // Extract tags
    const tagMatches = input.match(/#(\w+)/g);
    if (tagMatches) {
      const extractedTags = tagMatches.map(tag => tag.substring(1));
      setTags(extractedTags);
    }
  };

  const generateAISuggestions = () => {
    if (smartCategorizationEnabled) {
      dispatch(suggestCategory({ taskTitle: title, description }));
    }
    
    if (priorityPredictionEnabled) {
      dispatch(predictPriority({ taskTitle: title, dueDate, description }));
    }
    
    // Filter suggestions for this task
    const taskSuggestions = aiSuggestions.filter(suggestion => 
      !suggestion.applied && 
      suggestion.createdAt > new Date(Date.now() - 60000) // Last minute
    );
    setCurrentSuggestions(taskSuggestions);
  };

  const applySuggestion = (suggestion: AISuggestion) => {
    switch (suggestion.action?.type) {
      case 'apply_category':
        setCategoryId(suggestion.action.data.category);
        break;
      case 'apply_priority':
        setPriority(suggestion.action.data.priority);
        break;
    }
    
    // Mark suggestion as applied
    dispatch(addAISuggestion({ ...suggestion, applied: true }));
    setCurrentSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const loadFromTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template && template.tasks.length > 0) {
      const templateTask = template.tasks[0];
      if (templateTask.title) setTitle(templateTask.title);
      if (templateTask.description) setDescription(templateTask.description);
      if (templateTask.priority) setPriority(templateTask.priority);
      if (templateTask.categoryId) setCategoryId(templateTask.categoryId);
      if (templateTask.tags) setTags(templateTask.tags);
      if (templateTask.estimatedTime) setEstimatedTime(templateTask.estimatedTime.toString());
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
      completed: status === 'completed',
      priority,
      status,
      dueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
      categoryId: categoryId || undefined,
      subtasks,
      dependencies,
      tags,
      attachments,
      location,
      estimatedTime: estimatedTime ? parseInt(estimatedTime) : undefined,
      voiceMemo,
      recurring: isRecurring ? recurringConfig : undefined,
      customFields: {},
      templateId: templateId || undefined,
      assignedTo,
      comments: [],
      xpReward,
      difficultyLevel,
      isArchived: false,
      timeSpent: [],
      aiSuggestions: currentSuggestions,
    };

    dispatch(addTodo(newTodo));
    
    // Award XP for creating a task
    if (currentUser) {
      dispatch(addXP(5)); // 5 XP for creating a task
    }
    
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

  const getDifficultyColor = (level: number) => {
    const colors = ['#4CAF50', '#8BC34A', '#FFC107', '#FF9800', '#F44336'];
    return colors[level - 1];
  };

  const getDifficultyLabel = (level: number) => {
    const labels = ['Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'];
    return labels[level - 1];
  };

  return (
    <ScrollView style={styles.container}>
      {/* AI Suggestions */}
      {showAISuggestions && currentSuggestions.length > 0 && (
        <Card style={styles.suggestionsCard}>
          <Card.Title 
            title="AI Suggestions" 
            subtitle={`${currentSuggestions.length} suggestions available`}
            left={(props) => <MaterialIcons name="auto-awesome" size={24} color="#2196F3" />}
            right={(props) => (
              <IconButton
                icon="close"
                size={20}
                onPress={() => setShowAISuggestions(false)}
              />
            )}
          />
          <Card.Content>
            {currentSuggestions.map((suggestion, index) => (
              <View key={suggestion.id} style={styles.suggestionItem}>
                <View style={styles.suggestionContent}>
                  <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                  <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
                  <View style={styles.confidenceRow}>
                    <Text style={styles.confidenceLabel}>Confidence:</Text>
                    <ProgressBar 
                      progress={suggestion.confidence} 
                      color="#4CAF50" 
                      style={styles.confidenceBar}
                    />
                    <Text style={styles.confidenceText}>
                      {Math.round(suggestion.confidence * 100)}%
                    </Text>
                  </View>
                </View>
                {suggestion.actionable && (
                  <Button
                    mode="contained"
                    compact
                    onPress={() => applySuggestion(suggestion)}
                    style={styles.applyButton}
                  >
                    Apply
                  </Button>
                )}
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Content>
          {/* Title with AI enhancement indicator */}
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
              onPress={() => Speech.speak(title)}
              disabled={!title}
            />
            {nlpEnabled && (
              <Badge size={16} style={styles.aiBadge}>AI</Badge>
            )}
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

          {/* Priority, Status, and Difficulty */}
          <View style={styles.row}>
            <Menu
              visible={showPriorityMenu}
              onDismiss={() => setShowPriorityMenu(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setShowPriorityMenu(true)}
                  style={styles.thirdButton}
                  icon="flag"
                >
                  {priority}
                </Button>
              }
            >
              <Menu.Item onPress={() => { setPriority('low'); setShowPriorityMenu(false); }} title="Low Priority" />
              <Menu.Item onPress={() => { setPriority('medium'); setShowPriorityMenu(false); }} title="Medium Priority" />
              <Menu.Item onPress={() => { setPriority('high'); setShowPriorityMenu(false); }} title="High Priority" />
            </Menu>

            <Menu
              visible={showStatusMenu}
              onDismiss={() => setShowStatusMenu(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setShowStatusMenu(true)}
                  style={styles.thirdButton}
                  icon="circle-outline"
                >
                  {status.replace('_', ' ')}
                </Button>
              }
            >
              <Menu.Item onPress={() => { setStatus('draft'); setShowStatusMenu(false); }} title="Draft" />
              <Menu.Item onPress={() => { setStatus('not_started'); setShowStatusMenu(false); }} title="Not Started" />
              <Menu.Item onPress={() => { setStatus('in_progress'); setShowStatusMenu(false); }} title="In Progress" />
              <Menu.Item onPress={() => { setStatus('completed'); setShowStatusMenu(false); }} title="Completed" />
            </Menu>

            <Menu
              visible={showDifficultyMenu}
              onDismiss={() => setShowDifficultyMenu(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setShowDifficultyMenu(true)}
                  style={styles.thirdButton}
                  icon="trending-up"
                  buttonColor={getDifficultyColor(difficultyLevel)}
                >
                  {difficultyLevel}⭐
                </Button>
              }
            >
              {[1, 2, 3, 4, 5].map(level => (
                <Menu.Item
                  key={level}
                  onPress={() => { setDifficultyLevel(level as any); setShowDifficultyMenu(false); }}
                  title={`${level}⭐ - ${getDifficultyLabel(level)}`}
                />
              ))}
            </Menu>
          </View>

          {/* XP Reward Display */}
          <View style={styles.xpRow}>
            <MaterialIcons name="stars" size={20} color="#FFD700" />
            <Text style={styles.xpText}>Reward: {xpReward} XP</Text>
            <Text style={styles.xpDescription}>
              (Base: 10 + Difficulty: {difficultyLevel * 2} + Time: {estimatedTime ? Math.floor(parseInt(estimatedTime) / 30) * 5 : 0})
            </Text>
          </View>

          {/* Category and Template */}
          <View style={styles.row}>
            <Menu
              visible={showCategoryMenu}
              onDismiss={() => setShowCategoryMenu(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setShowCategoryMenu(true)}
                  style={styles.halfButton}
                  icon="folder"
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

            <Menu
              visible={showTemplateMenu}
              onDismiss={() => setShowTemplateMenu(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setShowTemplateMenu(true)}
                  style={styles.halfButton}
                  icon="content-copy"
                >
                  Template
                </Button>
              }
            >
              <Menu.Item onPress={() => setShowTemplateMenu(false)} title="None" />
              {templates.map(template => (
                <Menu.Item
                  key={template.id}
                  onPress={() => { loadFromTemplate(template.id); setShowTemplateMenu(false); }}
                  title={template.name}
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
              icon="calendar"
            >
              {dueDate ? dueDate.toDateString() : 'Due Date'}
            </Button>
            <Button
              mode="outlined"
              onPress={() => setShowTimePicker(true)}
              style={styles.halfButton}
              disabled={!dueDate}
              icon="schedule"
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
            right={<TextInput.Icon icon="timer" />}
          />

          {/* Recurring Task */}
          <View style={styles.recurringSection}>
            <View style={styles.switchRow}>
              <Text style={styles.sectionTitle}>Recurring Task</Text>
              <Switch
                value={isRecurring}
                onValueChange={setIsRecurring}
              />
            </View>
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
          icon="check"
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
  suggestionsCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#e3f2fd',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  suggestionDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 10,
    color: '#666',
    marginRight: 8,
  },
  confidenceBar: {
    flex: 1,
    height: 4,
    marginRight: 8,
  },
  confidenceText: {
    fontSize: 10,
    color: '#666',
  },
  applyButton: {
    marginLeft: 8,
  },
  card: {
    margin: 16,
    marginTop: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleInput: {
    flex: 1,
  },
  aiBadge: {
    backgroundColor: '#4CAF50',
    marginLeft: 8,
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
  thirdButton: {
    flex: 0.31,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
  },
  xpText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
    marginLeft: 8,
  },
  xpDescription: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
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
  recurringSection: {
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
