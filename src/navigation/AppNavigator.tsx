import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import TasksScreen from '../screens/tasks/TasksScreen';
import AddTaskScreen from '../screens/tasks/AddTaskScreen';
import TaskDetailsScreen from '../screens/tasks/TaskDetailsScreen';
import CategoriesScreen from '../screens/categories/CategoriesScreen';
import AddCategoryScreen from '../screens/categories/AddCategoryScreen';
import EditCategoryScreen from '../screens/categories/EditCategoryScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

// Import types
import { RootStackParamList } from '../types';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createMaterialBottomTabNavigator();

// Custom Header Component with "123"
const CustomHeader: React.FC<{ title: string }> = ({ title }) => {
  const theme = useTheme();
  
  return (
    <View style={[styles.headerContainer, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.headerNumber, { color: theme.colors.primary }]}>123</Text>
      <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '500',
  },
});

// Tasks Stack Navigator
const TasksStackNavigator: React.FC = () => {
  const theme = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          fontFamily: 'Roboto',
          fontSize: 22,
          fontWeight: '400',
        },
        cardStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen 
        name="TasksList" 
        component={TasksScreen}
        options={{
          header: () => <CustomHeader title="Tasks" />,
        }}
      />
      <Stack.Screen 
        name="AddTask" 
        component={AddTaskScreen}
        options={{
          title: 'Add Task',
          presentation: 'modal',
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
        }}
      />
      <Stack.Screen 
        name="TaskDetails" 
        component={TaskDetailsScreen}
        options={{
          title: 'Task Details',
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
};

// Categories Stack Navigator
const CategoriesStackNavigator: React.FC = () => {
  const theme = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          fontFamily: 'Roboto',
          fontSize: 22,
          fontWeight: '400',
        },
        cardStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen 
        name="CategoriesList" 
        component={CategoriesScreen}
        options={{
          header: () => <CustomHeader title="Categories" />,
        }}
      />
      <Stack.Screen 
        name="AddCategory" 
        component={AddCategoryScreen}
        options={{
          title: 'Add Category',
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="EditCategory" 
        component={EditCategoryScreen}
        options={{
          title: 'Edit Category',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};

// Dashboard Stack Navigator
const DashboardStackNavigator: React.FC = () => {
  const theme = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          fontFamily: 'Roboto',
          fontSize: 22,
          fontWeight: '400',
        },
        cardStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen 
        name="DashboardMain" 
        component={DashboardScreen}
        options={{
          header: () => <CustomHeader title="Dashboard" />,
        }}
      />
    </Stack.Navigator>
  );
};

// Settings Stack Navigator
const SettingsStackNavigator: React.FC = () => {
  const theme = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          fontFamily: 'Roboto',
          fontSize: 22,
          fontWeight: '400',
        },
        cardStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen 
        name="SettingsMain" 
        component={SettingsScreen}
        options={{
          header: () => <CustomHeader title="Settings" />,
        }}
      />
    </Stack.Navigator>
  );
};

// Main Tab Navigator with Material Design 3.0
const TabNavigator: React.FC = () => {
  const theme = useTheme();
  
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      activeColor={theme.colors.primary}
      inactiveColor={theme.colors.onSurfaceVariant}
      barStyle={{
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.outline,
      }}
      labeled={true}
      shifting={false}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStackNavigator}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Icon 
              name={focused ? 'view-dashboard' : 'view-dashboard-outline'} 
              color={color} 
              size={24} 
            />
          ),
          tabBarAccessibilityLabel: 'Dashboard Tab',
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksStackNavigator}
        options={{
          tabBarLabel: 'Tasks',
          tabBarIcon: ({ color, focused }) => (
            <Icon 
              name={focused ? 'checkbox-marked-circle' : 'checkbox-marked-circle-outline'} 
              color={color} 
              size={24} 
            />
          ),
          tabBarAccessibilityLabel: 'Tasks Tab',
        }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesStackNavigator}
        options={{
          tabBarLabel: 'Categories',
          tabBarIcon: ({ color, focused }) => (
            <Icon 
              name={focused ? 'folder' : 'folder-outline'} 
              color={color} 
              size={24} 
            />
          ),
          tabBarAccessibilityLabel: 'Categories Tab',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStackNavigator}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Icon 
              name={focused ? 'cog' : 'cog-outline'} 
              color={color} 
              size={24} 
            />
          ),
          tabBarAccessibilityLabel: 'Settings Tab',
        }}
      />
    </Tab.Navigator>
  );
};

// Root Navigator
const AppNavigator: React.FC = () => {
  const theme = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: {
          backgroundColor: theme.colors.background,
        },
        presentation: 'card',
        animationEnabled: true,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={TabNavigator}
      />
      
      {/* Modal screens */}
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen 
          name="AddTask" 
          component={AddTaskScreen}
          options={{
            headerShown: true,
            title: 'Add Task',
            headerStyle: {
              backgroundColor: theme.colors.surface,
            },
            headerTintColor: theme.colors.onSurface,
          }}
        />
        <Stack.Screen 
          name="TaskDetails" 
          component={TaskDetailsScreen}
          options={{
            headerShown: true,
            title: 'Task Details',
            headerStyle: {
              backgroundColor: theme.colors.surface,
            },
            headerTintColor: theme.colors.onSurface,
          }}
        />
        <Stack.Screen 
          name="AddCategory" 
          component={AddCategoryScreen}
          options={{
            headerShown: true,
            title: 'Add Category',
            headerStyle: {
              backgroundColor: theme.colors.surface,
            },
            headerTintColor: theme.colors.onSurface,
          }}
        />
        <Stack.Screen 
          name="EditCategory" 
          component={EditCategoryScreen}
          options={{
            headerShown: true,
            title: 'Edit Category',
            headerStyle: {
              backgroundColor: theme.colors.surface,
            },
            headerTintColor: theme.colors.onSurface,
          }}
        />
      </Stack.Group>
    </Stack.Navigator>
  );
};

export default AppNavigator;