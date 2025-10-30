import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { HeaderConfig } from '../components/common/AppHeader';

export interface HeaderState {
  config: HeaderConfig;
  searchQuery: string;
  isSearchActive: boolean;
  notifications: Notification[];
  unreadCount: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  read: boolean;
  actionable?: boolean;
  action?: () => void;
}

type HeaderAction = 
  | { type: 'SET_CONFIG'; payload: HeaderConfig }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'TOGGLE_SEARCH'; payload?: boolean }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'UPDATE_TITLE'; payload: string }
  | { type: 'UPDATE_SUBTITLE'; payload: string }
  | { type: 'RESET_HEADER' };

const initialState: HeaderState = {
  config: {
    title: 'Ultimate Todo',
    showSearch: false,
    showBackButton: false,
    showProfileMenu: true,
    actions: [],
  },
  searchQuery: '',
  isSearchActive: false,
  notifications: [],
  unreadCount: 0,
};

const headerReducer = (state: HeaderState, action: HeaderAction): HeaderState => {
  switch (action.type) {
    case 'SET_CONFIG':
      return {
        ...state,
        config: action.payload,
      };

    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload,
      };

    case 'TOGGLE_SEARCH':
      const isSearchActive = action.payload !== undefined ? action.payload : !state.isSearchActive;
      return {
        ...state,
        isSearchActive,
        searchQuery: isSearchActive ? state.searchQuery : '',
      };

    case 'ADD_NOTIFICATION':
      const newNotifications = [action.payload, ...state.notifications];
      return {
        ...state,
        notifications: newNotifications,
        unreadCount: newNotifications.filter(n => !n.read).length,
      };

    case 'MARK_NOTIFICATION_READ':
      const updatedNotifications = state.notifications.map(n =>
        n.id === action.payload ? { ...n, read: true } : n
      );
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => !n.read).length,
      };

    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      };

    case 'REMOVE_NOTIFICATION':
      const filteredNotifications = state.notifications.filter(n => n.id !== action.payload);
      return {
        ...state,
        notifications: filteredNotifications,
        unreadCount: filteredNotifications.filter(n => !n.read).length,
      };

    case 'UPDATE_TITLE':
      return {
        ...state,
        config: {
          ...state.config,
          title: action.payload,
        },
      };

    case 'UPDATE_SUBTITLE':
      return {
        ...state,
        config: {
          ...state.config,
          subtitle: action.payload,
        },
      };

    case 'RESET_HEADER':
      return initialState;

    default:
      return state;
  }
};

interface HeaderContextType {
  state: HeaderState;
  dispatch: React.Dispatch<HeaderAction>;
  // Convenience methods
  setHeaderConfig: (config: HeaderConfig) => void;
  updateTitle: (title: string) => void;
  updateSubtitle: (subtitle: string) => void;
  setSearchQuery: (query: string) => void;
  toggleSearch: (active?: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  removeNotification: (id: string) => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const useHeader = (): HeaderContextType => {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
};

interface HeaderProviderProps {
  children: ReactNode;
}

export const HeaderProvider: React.FC<HeaderProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(headerReducer, initialState);

  const setHeaderConfig = (config: HeaderConfig) => {
    dispatch({ type: 'SET_CONFIG', payload: config });
  };

  const updateTitle = (title: string) => {
    dispatch({ type: 'UPDATE_TITLE', payload: title });
  };

  const updateSubtitle = (subtitle: string) => {
    dispatch({ type: 'UPDATE_SUBTITLE', payload: subtitle });
  };

  const setSearchQuery = (query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  };

  const toggleSearch = (active?: boolean) => {
    dispatch({ type: 'TOGGLE_SEARCH', payload: active });
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const fullNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: fullNotification });
  };

  const markNotificationRead = (id: string) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id });
  };

  const clearNotifications = () => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
  };

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  const contextValue: HeaderContextType = {
    state,
    dispatch,
    setHeaderConfig,
    updateTitle,
    updateSubtitle,
    setSearchQuery,
    toggleSearch,
    addNotification,
    markNotificationRead,
    clearNotifications,
    removeNotification,
  };

  return (
    <HeaderContext.Provider value={contextValue}>
      {children}
    </HeaderContext.Provider>
  );
};

export default HeaderContext;
