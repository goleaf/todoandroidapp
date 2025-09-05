export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  status: 'draft' | 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  categoryId?: string;
  parentId?: string; // For subtasks
  subtasks: string[]; // Array of subtask IDs
  dependencies: string[]; // Array of task IDs this task depends on
  tags: string[];
  attachments: Attachment[];
  location?: Location;
  estimatedTime?: number; // in minutes
  actualTime?: number; // in minutes
  recurring?: RecurringConfig;
  voiceMemo?: string; // file path
  customFields: Record<string, any>;
  templateId?: string; // If created from template
  assignedTo?: string[]; // User IDs for collaboration
  comments: Comment[];
  xpReward: number; // XP points for completing this task
  difficultyLevel: 1 | 2 | 3 | 4 | 5; // For XP calculation
  isArchived: boolean;
  completedBy?: string; // User ID who completed the task
  timeSpent: TimeEntry[]; // Time tracking entries
  aiSuggestions?: AISuggestion[];
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attachment {
  id: string;
  type: 'image' | 'document' | 'audio' | 'video';
  uri: string;
  name: string;
  size: number;
  createdAt: Date;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  radius?: number; // for location-based reminders
}

export interface RecurringConfig {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number;
  daysOfWeek?: number[]; // 0-6, Sunday = 0
  endDate?: Date;
  maxOccurrences?: number;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  targetDate: Date;
  progress: number; // 0-100
  todoIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Analytics {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  averageCompletionTime: number;
  productivityScore: number;
  streakDays: number;
  categoryStats: CategoryStats[];
  weeklyProgress: WeeklyProgress[];
}

export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  totalTasks: number;
  completedTasks: number;
  averageTime: number;
}

export interface WeeklyProgress {
  week: string;
  completed: number;
  created: number;
  productivity: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  sync: SyncSettings;
}

export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string; // HH:mm
  };
  locationReminders: boolean;
  smartSuggestions: boolean;
}

export interface PrivacySettings {
  biometricAuth: boolean;
  pinAuth: boolean;
  autoLock: boolean;
  autoLockTimeout: number; // in minutes
}

export interface SyncSettings {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number; // in minutes
  cloudProvider: 'firebase' | 'icloud' | 'google';
}

export type ViewMode = 'list' | 'kanban' | 'calendar' | 'timeline' | 'mindmap' | 'dashboard';

export type SortOption = 'dueDate' | 'priority' | 'created' | 'updated' | 'alphabetical' | 'completion';

export type FilterOption = {
  categories: string[];
  priorities: ('low' | 'medium' | 'high')[];
  statuses: ('draft' | 'not_started' | 'in_progress' | 'completed' | 'cancelled')[];
  dateRange: {
    start?: Date;
    end?: Date;
  };
  tags: string[];
  hasAttachments?: boolean;
  hasLocation?: boolean;
  assignedTo?: string[];
  difficultyLevels?: (1 | 2 | 3 | 4 | 5)[];
};

// New interfaces for advanced features
export interface Comment {
  id: string;
  todoId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  isEdited: boolean;
}

export interface TimeEntry {
  id: string;
  todoId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  description?: string;
  userId: string;
}

export interface AISuggestion {
  id: string;
  type: 'category' | 'priority' | 'due_date' | 'subtask' | 'dependency';
  suggestion: string;
  confidence: number; // 0-1
  applied: boolean;
  createdAt: Date;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  tasks: Partial<Todo>[];
  categoryId?: string;
  isPublic: boolean;
  createdBy: string;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  preferences: UserPreferences;
  stats: UserStats;
  createdAt: Date;
  lastActiveAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto' | 'amoled';
  language: string;
  timezone: string;
  defaultView: ViewMode;
  workingHours: {
    start: string; // HH:mm
    end: string; // HH:mm
    workDays: number[]; // 0-6, Sunday = 0
  };
  pomodoroSettings: PomodoroSettings;
  aiEnabled: boolean;
  collaborationEnabled: boolean;
}

export interface UserStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalTasksCompleted: number;
  currentStreak: number;
  longestStreak: number;
  badges: Badge[];
  achievements: Achievement[];
  totalTimeSpent: number; // in minutes
  averageTaskCompletionTime: number; // in minutes
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlockedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number; // 0-100
  maxProgress: number;
  unlockedAt?: Date;
  xpReward: number;
  type: 'streak' | 'completion' | 'time' | 'collaboration' | 'special';
}

export interface PomodoroSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  longBreakInterval: number; // after how many work sessions
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface PomodoroSession {
  id: string;
  todoId?: string;
  type: 'work' | 'short_break' | 'long_break';
  duration: number; // in minutes
  startTime: Date;
  endTime?: Date;
  completed: boolean;
  interrupted: boolean;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  projects: string[]; // Project IDs
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: Date;
  permissions: TeamPermissions;
}

export interface TeamPermissions {
  canCreateTasks: boolean;
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  canManageCategories: boolean;
  canInviteMembers: boolean;
  canManageRoles: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  teamId?: string;
  ownerId: string;
  members: string[]; // User IDs
  todoIds: string[];
  categoryIds: string[];
  startDate?: Date;
  endDate?: Date;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  progress: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
}

export interface SmartCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  query: SmartCategoryQuery;
  isSystem: boolean; // System categories like "Today", "Overdue"
  createdAt: Date;
  updatedAt: Date;
}

export interface SmartCategoryQuery {
  filters: FilterOption;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
  autoUpdate: boolean;
}

export interface Widget {
  id: string;
  type: 'quick_add' | 'today_tasks' | 'progress' | 'stats' | 'calendar';
  size: 'small' | 'medium' | 'large';
  configuration: WidgetConfiguration;
  position: { x: number; y: number };
  isEnabled: boolean;
}

export interface WidgetConfiguration {
  showCompleted?: boolean;
  maxItems?: number;
  categoryFilter?: string[];
  priorityFilter?: ('low' | 'medium' | 'high')[];
  theme?: 'light' | 'dark' | 'auto';
  refreshInterval?: number; // in minutes
}

export interface LocationReminder {
  id: string;
  todoId: string;
  location: Location;
  triggerType: 'enter' | 'exit';
  isActive: boolean;
  triggeredAt?: Date;
  createdAt: Date;
}

export interface VoiceCommand {
  id: string;
  command: string;
  intent: 'create_task' | 'complete_task' | 'list_tasks' | 'set_reminder' | 'start_timer';
  parameters: Record<string, any>;
  confidence: number;
  processedAt: Date;
  result?: any;
}

export interface SyncStatus {
  lastSyncAt?: Date;
  isOnline: boolean;
  pendingChanges: number;
  conflictCount: number;
  syncInProgress: boolean;
  lastError?: string;
}

export interface BackupInfo {
  id: string;
  createdAt: Date;
  size: number; // in bytes
  itemCount: number;
  type: 'manual' | 'automatic';
  cloudProvider: 'firebase' | 'icloud' | 'google' | 'local';
  status: 'creating' | 'completed' | 'failed';
}

export interface HabitTracker {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  targetCount: number;
  currentStreak: number;
  longestStreak: number;
  completedDates: Date[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  parentId?: string;
  todoId?: string;
  connections: string[]; // Connected node IDs
  isCollapsed: boolean;
  level: number;
}

export interface MindMap {
  id: string;
  name: string;
  nodes: MindMapNode[];
  centerNodeId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIInsight {
  id: string;
  type: 'productivity_tip' | 'pattern_recognition' | 'goal_suggestion' | 'time_optimization';
  title: string;
  description: string;
  actionable: boolean;
  action?: {
    type: string;
    data: any;
  };
  confidence: number;
  createdAt: Date;
  dismissedAt?: Date;
}

export interface FocusSession {
  id: string;
  type: 'deep_work' | 'pomodoro' | 'time_block';
  todoIds: string[];
  duration: number; // in minutes
  startTime: Date;
  endTime?: Date;
  distractions: Distraction[];
  productivity: number; // 0-100
  completed: boolean;
}

export interface Distraction {
  id: string;
  type: 'notification' | 'app_switch' | 'manual';
  timestamp: Date;
  duration: number; // in seconds
  source?: string;
}

export interface CalendarIntegration {
  id: string;
  provider: 'google' | 'outlook' | 'apple' | 'caldav';
  accountId: string;
  calendarId: string;
  syncEnabled: boolean;
  syncDirection: 'import' | 'export' | 'bidirectional';
  lastSyncAt?: Date;
  settings: CalendarSyncSettings;
}

export interface CalendarSyncSettings {
  syncCompletedTasks: boolean;
  defaultCalendar: string;
  reminderOffset: number; // in minutes
  includeDescription: boolean;
  categoryMapping: Record<string, string>; // Todo category ID -> Calendar ID
}

// Enhanced existing interfaces
export interface Analytics {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  averageCompletionTime: number;
  productivityScore: number;
  streakDays: number;
  categoryStats: CategoryStats[];
  weeklyProgress: WeeklyProgress[];
  monthlyProgress: MonthlyProgress[];
  timeDistribution: TimeDistribution[];
  focusTimeTotal: number;
  distractionCount: number;
  xpEarned: number;
  level: number;
  achievements: Achievement[];
  habits: HabitStats[];
}

export interface MonthlyProgress {
  month: string;
  completed: number;
  created: number;
  productivity: number;
  xpEarned: number;
  streakDays: number;
}

export interface TimeDistribution {
  categoryId: string;
  categoryName: string;
  timeSpent: number; // in minutes
  percentage: number;
}

export interface HabitStats {
  habitId: string;
  habitName: string;
  currentStreak: number;
  completionRate: number; // 0-100
  totalCompletions: number;
}

// Enhanced settings
export interface AppSettings {
  theme: 'light' | 'dark' | 'auto' | 'amoled';
  language: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  sync: SyncSettings;
  ai: AISettings;
  accessibility: AccessibilitySettings;
  productivity: ProductivitySettings;
  collaboration: CollaborationSettings;
}

export interface AISettings {
  enabled: boolean;
  naturalLanguageProcessing: boolean;
  smartCategorization: boolean;
  priorityPrediction: boolean;
  habitSuggestions: boolean;
  productivityInsights: boolean;
  voiceCommands: boolean;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  screenReader: boolean;
  reduceMotion: boolean;
  hapticFeedback: boolean;
}

export interface ProductivitySettings {
  pomodoroEnabled: boolean;
  deepWorkMode: boolean;
  distractionBlocking: boolean;
  timeTracking: boolean;
  goalTracking: boolean;
  habitTracking: boolean;
  gamification: boolean;
}

export interface CollaborationSettings {
  enabled: boolean;
  allowInvitations: boolean;
  shareAnalytics: boolean;
  realTimeUpdates: boolean;
  commentNotifications: boolean;
  mentionNotifications: boolean;
}
