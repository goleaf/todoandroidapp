import * as Speech from 'expo-speech';
import Voice from 'react-native-voice';
import { Todo, VoiceCommand } from '../types';

class VoiceService {
  private isListening = false;
  private speechResults: string[] = [];
  private onSpeechResultsCallback?: (results: string[]) => void;
  private onSpeechEndCallback?: () => void;

  constructor() {
    this.initializeVoice();
  }

  private initializeVoice(): void {
    Voice.onSpeechStart = this.onSpeechStart.bind(this);
    Voice.onSpeechRecognized = this.onSpeechRecognized.bind(this);
    Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
    Voice.onSpeechError = this.onSpeechError.bind(this);
    Voice.onSpeechResults = this.onSpeechResults.bind(this);
    Voice.onSpeechPartialResults = this.onSpeechPartialResults.bind(this);
    Voice.onSpeechVolumeChanged = this.onSpeechVolumeChanged.bind(this);
  }

  // Speech Recognition
  async startListening(
    onResults?: (results: string[]) => void,
    onEnd?: () => void
  ): Promise<boolean> {
    try {
      if (this.isListening) {
        await this.stopListening();
      }

      this.onSpeechResultsCallback = onResults;
      this.onSpeechEndCallback = onEnd;
      this.speechResults = [];

      await Voice.start('en-US');
      this.isListening = true;
      return true;
    } catch (error) {
      console.error('Start listening error:', error);
      return false;
    }
  }

  async stopListening(): Promise<void> {
    try {
      await Voice.stop();
      this.isListening = false;
    } catch (error) {
      console.error('Stop listening error:', error);
    }
  }

  async cancelListening(): Promise<void> {
    try {
      await Voice.cancel();
      this.isListening = false;
    } catch (error) {
      console.error('Cancel listening error:', error);
    }
  }

  // Voice Recognition Event Handlers
  private onSpeechStart(): void {
    console.log('Speech recognition started');
  }

  private onSpeechRecognized(): void {
    console.log('Speech recognized');
  }

  private onSpeechEnd(): void {
    console.log('Speech recognition ended');
    this.isListening = false;
    if (this.onSpeechEndCallback) {
      this.onSpeechEndCallback();
    }
  }

  private onSpeechError(error: any): void {
    console.error('Speech recognition error:', error);
    this.isListening = false;
  }

  private onSpeechResults(event: any): void {
    const results = event.value || [];
    this.speechResults = results;
    console.log('Speech results:', results);
    
    if (this.onSpeechResultsCallback) {
      this.onSpeechResultsCallback(results);
    }
  }

  private onSpeechPartialResults(event: any): void {
    const partialResults = event.value || [];
    console.log('Partial speech results:', partialResults);
  }

  private onSpeechVolumeChanged(event: any): void {
    // Handle volume changes if needed
  }

  // Text-to-Speech
  async speak(text: string, options?: {
    language?: string;
    pitch?: number;
    rate?: number;
    voice?: string;
  }): Promise<void> {
    try {
      const speechOptions = {
        language: options?.language || 'en-US',
        pitch: options?.pitch || 1.0,
        rate: options?.rate || 1.0,
        voice: options?.voice,
      };

      await Speech.speak(text, speechOptions);
    } catch (error) {
      console.error('Text-to-speech error:', error);
    }
  }

  async stopSpeaking(): Promise<void> {
    try {
      await Speech.stop();
    } catch (error) {
      console.error('Stop speaking error:', error);
    }
  }

  // Voice Command Processing
  parseVoiceCommand(speechText: string): VoiceCommand | null {
    const text = speechText.toLowerCase().trim();
    
    // Create todo commands
    if (text.includes('create') || text.includes('add') || text.includes('new')) {
      if (text.includes('task') || text.includes('todo')) {
        const title = this.extractTaskTitle(text);
        if (title) {
          return {
            id: Date.now().toString(),
            command: speechText,
            action: 'create_todo',
            parameters: { title },
            confidence: 0.8,
            processedAt: new Date()
          };
        }
      }
    }

    // Complete todo commands
    if (text.includes('complete') || text.includes('done') || text.includes('finish')) {
      const taskReference = this.extractTaskReference(text);
      if (taskReference) {
        return {
          id: Date.now().toString(),
          command: speechText,
          action: 'complete_todo',
          parameters: { taskReference },
          confidence: 0.7,
          processedAt: new Date()
        };
      }
    }

    // Set priority commands
    if (text.includes('priority') || text.includes('important') || text.includes('urgent')) {
      const priority = this.extractPriority(text);
      const taskReference = this.extractTaskReference(text);
      
      if (priority && taskReference) {
        return {
          id: Date.now().toString(),
          command: speechText,
          action: 'set_priority',
          parameters: { taskReference, priority },
          confidence: 0.6,
          processedAt: new Date()
        };
      }
    }

    // Set due date commands
    if (text.includes('due') || text.includes('deadline') || text.includes('by')) {
      const dueDate = this.extractDueDate(text);
      const taskReference = this.extractTaskReference(text);
      
      if (dueDate && taskReference) {
        return {
          id: Date.now().toString(),
          command: speechText,
          action: 'set_due_date',
          parameters: { taskReference, dueDate },
          confidence: 0.6,
          processedAt: new Date()
        };
      }
    }

    // Search commands
    if (text.includes('find') || text.includes('search') || text.includes('show')) {
      const searchQuery = this.extractSearchQuery(text);
      if (searchQuery) {
        return {
          id: Date.now().toString(),
          command: speechText,
          action: 'search',
          parameters: { query: searchQuery },
          confidence: 0.7,
          processedAt: new Date()
        };
      }
    }

    return null;
  }

  // Natural Language Processing Helpers
  private extractTaskTitle(text: string): string | null {
    // Remove command words and extract the task title
    const patterns = [
      /(?:create|add|new)\s+(?:task|todo)\s+(.+)/i,
      /(?:create|add|new)\s+(.+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  private extractTaskReference(text: string): string | null {
    // Extract task reference (could be title, ID, or description)
    const patterns = [
      /(?:task|todo)\s+(.+?)(?:\s+(?:to|as|with)|\s*$)/i,
      /(?:complete|done|finish)\s+(.+?)(?:\s+(?:to|as|with)|\s*$)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  private extractPriority(text: string): 'low' | 'medium' | 'high' | null {
    if (text.includes('high') || text.includes('urgent') || text.includes('important')) {
      return 'high';
    }
    if (text.includes('low') || text.includes('minor')) {
      return 'low';
    }
    if (text.includes('medium') || text.includes('normal')) {
      return 'medium';
    }
    return null;
  }

  private extractDueDate(text: string): Date | null {
    const now = new Date();
    
    // Today
    if (text.includes('today')) {
      return now;
    }
    
    // Tomorrow
    if (text.includes('tomorrow')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
    
    // Next week
    if (text.includes('next week')) {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek;
    }
    
    // Specific days
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < days.length; i++) {
      if (text.includes(days[i])) {
        const targetDay = new Date(now);
        const currentDay = now.getDay();
        const daysUntilTarget = (i - currentDay + 7) % 7;
        targetDay.setDate(targetDay.getDate() + (daysUntilTarget || 7));
        return targetDay;
      }
    }
    
    // Try to extract specific dates (basic implementation)
    const datePatterns = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // MM/DD/YYYY
      /(\d{1,2})-(\d{1,2})-(\d{4})/,   // MM-DD-YYYY
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        const [, month, day, year] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
    }
    
    return null;
  }

  private extractSearchQuery(text: string): string | null {
    const patterns = [
      /(?:find|search|show)\s+(.+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  // Voice Command Execution
  async executeVoiceCommand(command: VoiceCommand, todos: Todo[]): Promise<any> {
    switch (command.action) {
      case 'create_todo':
        return {
          type: 'CREATE_TODO',
          payload: {
            title: command.parameters.title,
            priority: 'medium',
            status: 'not_started',
            completed: false,
            tags: [],
            attachments: [],
            customFields: {},
            createdAt: new Date(),
            updatedAt: new Date()
          }
        };

      case 'complete_todo':
        const todoToComplete = this.findTodoByReference(command.parameters.taskReference, todos);
        if (todoToComplete) {
          return {
            type: 'UPDATE_TODO',
            payload: {
              id: todoToComplete.id,
              completed: true,
              status: 'completed',
              updatedAt: new Date()
            }
          };
        }
        break;

      case 'set_priority':
        const todoForPriority = this.findTodoByReference(command.parameters.taskReference, todos);
        if (todoForPriority) {
          return {
            type: 'UPDATE_TODO',
            payload: {
              id: todoForPriority.id,
              priority: command.parameters.priority,
              updatedAt: new Date()
            }
          };
        }
        break;

      case 'set_due_date':
        const todoForDueDate = this.findTodoByReference(command.parameters.taskReference, todos);
        if (todoForDueDate) {
          return {
            type: 'UPDATE_TODO',
            payload: {
              id: todoForDueDate.id,
              dueDate: command.parameters.dueDate,
              updatedAt: new Date()
            }
          };
        }
        break;

      case 'search':
        return {
          type: 'SET_SEARCH_QUERY',
          payload: command.parameters.query
        };

      default:
        console.log('Unknown voice command:', command.action);
        return null;
    }

    return null;
  }

  private findTodoByReference(reference: string, todos: Todo[]): Todo | null {
    const lowerReference = reference.toLowerCase();
    
    // First, try exact title match
    let found = todos.find(todo => 
      todo.title.toLowerCase() === lowerReference
    );
    
    if (found) return found;
    
    // Then try partial title match
    found = todos.find(todo => 
      todo.title.toLowerCase().includes(lowerReference)
    );
    
    if (found) return found;
    
    // Finally, try description match
    found = todos.find(todo => 
      todo.description?.toLowerCase().includes(lowerReference)
    );
    
    return found || null;
  }

  // Utility methods
  isListeningActive(): boolean {
    return this.isListening;
  }

  getLastResults(): string[] {
    return [...this.speechResults];
  }

  async isAvailable(): Promise<boolean> {
    try {
      return await Voice.isAvailable();
    } catch (error) {
      console.error('Voice availability check error:', error);
      return false;
    }
  }

  async getSupportedLanguages(): Promise<string[]> {
    try {
      const languages = await Voice.getSupportedLanguages();
      return languages || [];
    } catch (error) {
      console.error('Get supported languages error:', error);
      return [];
    }
  }

  // Cleanup
  destroy(): void {
    Voice.destroy().then(Voice.removeAllListeners);
  }
}

export const voiceService = new VoiceService();
export default voiceService;
