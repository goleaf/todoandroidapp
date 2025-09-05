import Voice from '@react-native-voice/voice';
import * as Speech from 'expo-speech';
import { VoiceCommand } from '../types';
import AIService from './AIService';

export class VoiceService {
  private static instance: VoiceService;
  private isListening: boolean = false;
  private isRecognitionAvailable: boolean = false;

  private constructor() {
    this.initializeVoice();
  }

  public static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  private async initializeVoice() {
    try {
      // Check if voice recognition is available
      this.isRecognitionAvailable = await Voice.isAvailable();
      
      // Set up voice event listeners
      Voice.onSpeechStart = this.onSpeechStart.bind(this);
      Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
      Voice.onSpeechResults = this.onSpeechResults.bind(this);
      Voice.onSpeechError = this.onSpeechError.bind(this);
      Voice.onSpeechPartialResults = this.onSpeechPartialResults.bind(this);
      
      console.log('Voice service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize voice service:', error);
      this.isRecognitionAvailable = false;
    }
  }

  // Event handlers
  private onSpeechStart(event: any) {
    console.log('Speech recognition started');
    this.isListening = true;
  }

  private onSpeechEnd(event: any) {
    console.log('Speech recognition ended');
    this.isListening = false;
  }

  private onSpeechResults(event: any) {
    console.log('Speech results:', event.value);
    if (event.value && event.value.length > 0) {
      const transcript = event.value[0];
      this.processVoiceCommand(transcript);
    }
  }

  private onSpeechError(event: any) {
    console.error('Speech recognition error:', event.error);
    this.isListening = false;
  }

  private onSpeechPartialResults(event: any) {
    console.log('Partial results:', event.value);
    // Can be used for real-time feedback
  }

  // Start listening for voice commands
  async startListening(): Promise<boolean> {
    if (!this.isRecognitionAvailable) {
      console.log('Voice recognition not available');
      return false;
    }

    if (this.isListening) {
      console.log('Already listening');
      return true;
    }

    try {
      await Voice.start('en-US');
      return true;
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      return false;
    }
  }

  // Stop listening
  async stopListening(): Promise<void> {
    if (!this.isListening) return;

    try {
      await Voice.stop();
    } catch (error) {
      console.error('Failed to stop voice recognition:', error);
    }
  }

  // Cancel listening
  async cancelListening(): Promise<void> {
    if (!this.isListening) return;

    try {
      await Voice.cancel();
    } catch (error) {
      console.error('Failed to cancel voice recognition:', error);
    }
  }

  // Process voice command using AI service
  private async processVoiceCommand(transcript: string): Promise<VoiceCommand> {
    const command = AIService.processVoiceCommand(transcript);
    
    // Execute the command based on intent
    switch (command.intent) {
      case 'create_task':
        await this.handleCreateTaskCommand(command);
        break;
      case 'complete_task':
        await this.handleCompleteTaskCommand(command);
        break;
      case 'list_tasks':
        await this.handleListTasksCommand(command);
        break;
      case 'set_reminder':
        await this.handleSetReminderCommand(command);
        break;
      case 'start_timer':
        await this.handleStartTimerCommand(command);
        break;
      default:
        await this.speak('I didn\'t understand that command. Please try again.');
    }

    return command;
  }

  // Command handlers
  private async handleCreateTaskCommand(command: VoiceCommand): Promise<void> {
    try {
      // This would integrate with the todo creation logic
      const taskData = command.parameters;
      
      await this.speak(`Creating task: ${taskData.title}`);
      
      // TODO: Integrate with DatabaseService to create the task
      // await DatabaseService.createTodo(taskData);
      
      command.result = { success: true, message: 'Task created successfully' };
    } catch (error) {
      await this.speak('Sorry, I couldn\'t create that task. Please try again.');
      command.result = { success: false, error: error.message };
    }
  }

  private async handleCompleteTaskCommand(command: VoiceCommand): Promise<void> {
    try {
      const taskIdentifier = command.parameters.taskIdentifier;
      
      await this.speak(`Marking task as complete: ${taskIdentifier}`);
      
      // TODO: Integrate with DatabaseService to complete the task
      // const todos = await DatabaseService.searchTodos(taskIdentifier);
      // if (todos.length > 0) {
      //   await DatabaseService.updateTodo(todos[0].id, { completed: true });
      //   command.result = { success: true, message: 'Task completed' };
      // } else {
      //   await this.speak('I couldn\'t find that task.');
      //   command.result = { success: false, error: 'Task not found' };
      // }
      
      command.result = { success: true, message: 'Task completed' };
    } catch (error) {
      await this.speak('Sorry, I couldn\'t complete that task.');
      command.result = { success: false, error: error.message };
    }
  }

  private async handleListTasksCommand(command: VoiceCommand): Promise<void> {
    try {
      const filter = command.parameters.filter;
      
      // TODO: Integrate with DatabaseService to get tasks
      // let todos = [];
      // switch (filter) {
      //   case 'today':
      //     todos = await DatabaseService.getTodayTodos();
      //     break;
      //   case 'overdue':
      //     todos = await DatabaseService.getOverdueTodos();
      //     break;
      //   default:
      //     todos = await DatabaseService.getAllTodos();
      // }
      
      // Mock response for now
      const todos = [];
      
      if (todos.length === 0) {
        await this.speak('You have no tasks.');
      } else {
        const taskList = todos.slice(0, 5).map(todo => todo.title).join(', ');
        await this.speak(`You have ${todos.length} tasks. Here are the first few: ${taskList}`);
      }
      
      command.result = { success: true, tasks: todos };
    } catch (error) {
      await this.speak('Sorry, I couldn\'t retrieve your tasks.');
      command.result = { success: false, error: error.message };
    }
  }

  private async handleSetReminderCommand(command: VoiceCommand): Promise<void> {
    try {
      const taskData = command.parameters;
      
      await this.speak(`Setting reminder for: ${taskData.title}`);
      
      // TODO: Integrate with NotificationService
      // await NotificationService.scheduleTodoNotification(taskData);
      
      command.result = { success: true, message: 'Reminder set' };
    } catch (error) {
      await this.speak('Sorry, I couldn\'t set that reminder.');
      command.result = { success: false, error: error.message };
    }
  }

  private async handleStartTimerCommand(command: VoiceCommand): Promise<void> {
    try {
      const duration = command.parameters.duration || 25; // Default 25 minutes
      
      await this.speak(`Starting ${duration} minute timer`);
      
      // TODO: Integrate with Pomodoro timer
      // await PomodoroService.startSession(duration);
      
      command.result = { success: true, message: 'Timer started', duration };
    } catch (error) {
      await this.speak('Sorry, I couldn\'t start the timer.');
      command.result = { success: false, error: error.message };
    }
  }

  // Text-to-speech
  async speak(text: string, options?: Speech.SpeechOptions): Promise<void> {
    try {
      const defaultOptions: Speech.SpeechOptions = {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
        ...options
      };

      await Speech.speak(text, defaultOptions);
    } catch (error) {
      console.error('Text-to-speech error:', error);
    }
  }

  // Stop speaking
  async stopSpeaking(): Promise<void> {
    try {
      await Speech.stop();
    } catch (error) {
      console.error('Failed to stop speaking:', error);
    }
  }

  // Check if currently speaking
  isSpeaking(): Promise<boolean> {
    return Speech.isSpeakingAsync();
  }

  // Get available voices
  async getAvailableVoices(): Promise<Speech.Voice[]> {
    try {
      return await Speech.getAvailableVoicesAsync();
    } catch (error) {
      console.error('Failed to get available voices:', error);
      return [];
    }
  }

  // Voice command shortcuts
  async quickAddTask(title: string): Promise<void> {
    const command = `Create task ${title}`;
    await this.processVoiceCommand(command);
  }

  async quickCompleteTask(taskName: string): Promise<void> {
    const command = `Complete task ${taskName}`;
    await this.processVoiceCommand(command);
  }

  async quickStartPomodoro(): Promise<void> {
    const command = 'Start 25 minute timer';
    await this.processVoiceCommand(command);
  }

  // Cleanup
  async destroy(): Promise<void> {
    try {
      await this.stopListening();
      await this.stopSpeaking();
      await Voice.destroy();
    } catch (error) {
      console.error('Failed to destroy voice service:', error);
    }
  }

  // Getters
  getIsListening(): boolean {
    return this.isListening;
  }

  getIsRecognitionAvailable(): boolean {
    return this.isRecognitionAvailable;
  }

  // Voice training phrases for better recognition
  getTrainingPhrases(): string[] {
    return [
      // Task creation
      'Create task buy groceries',
      'Add task call mom tomorrow',
      'New task finish project by Friday',
      'Make task exercise for 30 minutes',
      
      // Task completion
      'Complete task buy groceries',
      'Mark done call mom',
      'Finish task exercise',
      'Done with project',
      
      // Task listing
      'Show my tasks',
      'List today\'s tasks',
      'What tasks do I have',
      'Show overdue tasks',
      
      // Reminders
      'Remind me to buy milk at 6 PM',
      'Set reminder for meeting tomorrow',
      'Remind me when I get home',
      
      // Timer
      'Start 25 minute timer',
      'Begin pomodoro session',
      'Start focus timer for 45 minutes',
      'Set timer for 10 minutes'
    ];
  }
}

export default VoiceService.getInstance();
