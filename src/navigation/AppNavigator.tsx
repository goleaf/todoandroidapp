import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

// Screens
import TodoListScreen from '../screens/todo/TodoListScreen';
import TodoDetailScreen from '../screens/todo/TodoDetailScreen';
import AddTodoScreen from '../screens/todo/AddTodoScreen';
import KanbanScreen from '../screens/todo/KanbanScreen';
import CalendarScreen from '../screens/todo/CalendarScreen';
import TimelineScreen from '../screens/todo/TimelineScreen';
import MindMapScreen from '../screens/todo/MindMapScreen';
import DashboardScreen from '../screens/todo/DashboardScreen';
import FocusModeScreen from '../screens/todo/FocusModeScreen';
import PomodoroScreen from '../screens/todo/PomodoroScreen';
import TemplatesScreen from '../screens/todo/TemplatesScreen';
import CategoryListScreen from '../screens/category/CategoryListScreen';
import CategoryDetailScreen from '../screens/category/CategoryDetailScreen';
import SmartCategoriesScreen from '../screens/category/SmartCategoriesScreen';
import AnalyticsScreen from '../screens/analytics/AnalyticsScreen';
import GoalsScreen from '../screens/analytics/GoalsScreen';
import HabitsScreen from '../screens/habits/HabitsScreen';
import ProductivityScreen from '../screens/analytics/ProductivityScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import ProfileScreen from '../screens/settings/ProfileScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import PrivacySettingsScreen from '../screens/settings/PrivacySettingsScreen';
import SyncSettingsScreen from '../screens/settings/SyncSettingsScreen';
import AISettingsScreen from '../screens/settings/AISettingsScreen';
import AccessibilitySettingsScreen from '../screens/settings/AccessibilitySettingsScreen';
import CollaborationScreen from '../screens/collaboration/CollaborationScreen';
import TeamScreen from '../screens/collaboration/TeamScreen';
import ProjectScreen from '../screens/collaboration/ProjectScreen';
import InvitationsScreen from '../screens/collaboration/InvitationsScreen';
import VoiceCommandScreen from '../screens/ai/VoiceCommandScreen';
import AIInsightsScreen from '../screens/ai/AIInsightsScreen';
import AuthScreen from '../screens/auth/AuthScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// Todo Stack Navigator
function TodoStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="TodoList" 
        component={TodoListScreen} 
        options={{ title: 'My Tasks' }}
      />
      <Stack.Screen 
        name="TodoDetail" 
        component={TodoDetailScreen} 
        options={{ title: 'Task Details' }}
      />
      <Stack.Screen 
        name="AddTodo" 
        component={AddTodoScreen} 
        options={{ title: 'Add Task' }}
      />
      <Stack.Screen 
        name="Kanban" 
        component={KanbanScreen} 
        options={{ title: 'Kanban Board' }}
      />
      <Stack.Screen 
        name="Calendar" 
        component={CalendarScreen} 
        options={{ title: 'Calendar View' }}
      />
      <Stack.Screen 
        name="Timeline" 
        component={TimelineScreen} 
        options={{ title: 'Timeline' }}
      />
      <Stack.Screen 
        name="MindMap" 
        component={MindMapScreen} 
        options={{ title: 'Mind Map' }}
      />
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ title: 'Dashboard' }}
      />
      <Stack.Screen 
        name="FocusMode" 
        component={FocusModeScreen} 
        options={{ title: 'Focus Mode' }}
      />
      <Stack.Screen 
        name="Pomodoro" 
        component={PomodoroScreen} 
        options={{ title: 'Pomodoro Timer' }}
      />
      <Stack.Screen 
        name="Templates" 
        component={TemplatesScreen} 
        options={{ title: 'Task Templates' }}
      />
    </Stack.Navigator>
  );
}

// Category Stack Navigator
function CategoryStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="CategoryList" 
        component={CategoryListScreen} 
        options={{ title: 'Categories' }}
      />
      <Stack.Screen 
        name="CategoryDetail" 
        component={CategoryDetailScreen} 
        options={{ title: 'Category Details' }}
      />
      <Stack.Screen 
        name="SmartCategories" 
        component={SmartCategoriesScreen} 
        options={{ title: 'Smart Categories' }}
      />
    </Stack.Navigator>
  );
}

// Analytics Stack Navigator
function AnalyticsStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Analytics" 
        component={AnalyticsScreen} 
        options={{ title: 'Analytics' }}
      />
      <Stack.Screen 
        name="Goals" 
        component={GoalsScreen} 
        options={{ title: 'Goals' }}
      />
      <Stack.Screen 
        name="Habits" 
        component={HabitsScreen} 
        options={{ title: 'Habit Tracker' }}
      />
      <Stack.Screen 
        name="Productivity" 
        component={ProductivityScreen} 
        options={{ title: 'Productivity' }}
      />
    </Stack.Navigator>
  );
}

// Settings Stack Navigator
function SettingsStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Profile' }}
      />
      <Stack.Screen 
        name="NotificationSettings" 
        component={NotificationSettingsScreen} 
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen 
        name="PrivacySettings" 
        component={PrivacySettingsScreen} 
        options={{ title: 'Privacy & Security' }}
      />
      <Stack.Screen 
        name="SyncSettings" 
        component={SyncSettingsScreen} 
        options={{ title: 'Sync & Backup' }}
      />
      <Stack.Screen 
        name="AISettings" 
        component={AISettingsScreen} 
        options={{ title: 'AI & Smart Features' }}
      />
      <Stack.Screen 
        name="AccessibilitySettings" 
        component={AccessibilitySettingsScreen} 
        options={{ title: 'Accessibility' }}
      />
    </Stack.Navigator>
  );
}

// Collaboration Stack Navigator
function CollaborationStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Collaboration" 
        component={CollaborationScreen} 
        options={{ title: 'Collaboration' }}
      />
      <Stack.Screen 
        name="Team" 
        component={TeamScreen} 
        options={{ title: 'Team Details' }}
      />
      <Stack.Screen 
        name="Project" 
        component={ProjectScreen} 
        options={{ title: 'Project Details' }}
      />
      <Stack.Screen 
        name="Invitations" 
        component={InvitationsScreen} 
        options={{ title: 'Invitations' }}
      />
    </Stack.Navigator>
  );
}

// AI Stack Navigator
function AIStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="VoiceCommand" 
        component={VoiceCommandScreen} 
        options={{ title: 'Voice Commands' }}
      />
      <Stack.Screen 
        name="AIInsights" 
        component={AIInsightsScreen} 
        options={{ title: 'AI Insights' }}
      />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function MainTabNavigator() {
  const theme = useSelector((state: RootState) => state.settings.theme);
  const collaborationEnabled = useSelector((state: RootState) => state.settings.collaboration.enabled);
  const aiEnabled = useSelector((state: RootState) => state.settings.ai.enabled);
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'TodoStack':
              iconName = 'list';
              break;
            case 'CategoryStack':
              iconName = 'folder';
              break;
            case 'AnalyticsStack':
              iconName = 'analytics';
              break;
            case 'CollaborationStack':
              iconName = 'group';
              break;
            case 'AIStack':
              iconName = 'psychology';
              break;
            case 'SettingsStack':
              iconName = 'settings';
              break;
            default:
              iconName = 'help';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="TodoStack" 
        component={TodoStackNavigator} 
        options={{ title: 'Tasks' }}
      />
      <Tab.Screen 
        name="CategoryStack" 
        component={CategoryStackNavigator} 
        options={{ title: 'Categories' }}
      />
      <Tab.Screen 
        name="AnalyticsStack" 
        component={AnalyticsStackNavigator} 
        options={{ title: 'Analytics' }}
      />
      {collaborationEnabled && (
        <Tab.Screen 
          name="CollaborationStack" 
          component={CollaborationStackNavigator} 
          options={{ title: 'Teams' }}
        />
      )}
      {aiEnabled && (
        <Tab.Screen 
          name="AIStack" 
          component={AIStackNavigator} 
          options={{ title: 'AI' }}
        />
      )}
      <Tab.Screen 
        name="SettingsStack" 
        component={SettingsStackNavigator} 
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

// Root Stack Navigator (includes auth and onboarding)
function RootStackNavigator() {
  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);
  const isFirstLaunch = useSelector((state: RootState) => state.settings.isFirstLaunch);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          {isFirstLaunch && (
            <Stack.Screen 
              name="Onboarding" 
              component={OnboardingScreen} 
            />
          )}
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen} 
          />
        </>
      ) : (
        <Stack.Screen 
          name="Main" 
          component={MainTabNavigator} 
        />
      )}
    </Stack.Navigator>
  );
}

// Main App Navigator
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <RootStackNavigator />
    </NavigationContainer>
  );
}
