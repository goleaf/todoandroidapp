/**
 * Advanced Swipeable Task Item with Material Design 3.0 Gestures
 * Implements sophisticated swipe actions with haptic feedback and animations
 */

import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import {
  PanGestureHandler,
  State,
} from 'react-native-gesture-handler';
import {
  Surface,
  Text,
  IconButton,
  useTheme,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PanGestureHandlerGestureEvent, PanGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';

import { Task, Category } from '../../types';
import TaskItem from '../tasks/TaskItem';
import { materialStyles, priorityColors, statusColors } from '../../theme/MaterialTheme';
import { MicroInteractions, MaterialDuration, MaterialEasing } from '../../animations/MaterialMotion';

const { width: screenWidth } = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.25;
const ACTION_WIDTH = 80;

interface SwipeAction {
  id: string;
  icon: string;
  color: string;
  backgroundColor: string;
  label: string;
  onPress: () => void;
}

interface SwipeableTaskItemProps {
  task: Task;
  category?: Category;
  onPress: () => void;
  onDelete: () => void;
  onComplete: () => void;
  onEdit: () => void;
  onArchive?: () => void;
  onDuplicate?: () => void;
  style?: any;
}

const SwipeableTaskItem: React.FC<SwipeableTaskItemProps> = ({
  task,
  category,
  onPress,
  onDelete,
  onComplete,
  onEdit,
  onArchive,
  onDuplicate,
  style,
}) => {
  const theme = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [actionTriggered, setActionTriggered] = useState<string | null>(null);

  // Haptic feedback (iOS only for now)
  const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (Platform.OS === 'ios') {
      import('react-native-haptic-feedback').then(({ default: HapticFeedback }) => {
        const hapticType = type === 'light' ? 'impactLight' : 
                          type === 'medium' ? 'impactMedium' : 'impactHeavy';
        HapticFeedback.trigger(hapticType);
      });
    }
  };

  // Define swipe actions
  const leftActions: SwipeAction[] = [
    {
      id: 'complete',
      icon: task.status === 'completed' ? 'undo' : 'check',
      color: theme.colors.onPrimary,
      backgroundColor: statusColors.completed.light,
      label: task.status === 'completed' ? 'Undo' : 'Complete',
      onPress: onComplete,
    },
    {
      id: 'edit',
      icon: 'pencil',
      color: theme.colors.onSecondary,
      backgroundColor: theme.colors.secondary,
      label: 'Edit',
      onPress: onEdit,
    },
  ];

  const rightActions: SwipeAction[] = [
    ...(onDuplicate ? [{
      id: 'duplicate',
      icon: 'content-copy',
      color: theme.colors.onTertiary,
      backgroundColor: theme.colors.tertiary,
      label: 'Duplicate',
      onPress: onDuplicate,
    }] : []),
    ...(onArchive ? [{
      id: 'archive',
      icon: 'archive',
      color: theme.colors.onSurfaceVariant,
      backgroundColor: theme.colors.surfaceVariant,
      label: 'Archive',
      onPress: onArchive,
    }] : []),
    {
      id: 'delete',
      icon: 'delete',
      color: theme.colors.onError,
      backgroundColor: theme.colors.error,
      label: 'Delete',
      onPress: onDelete,
    },
  ];

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    const { translationX } = event.nativeEvent;
    
    // Determine swipe direction and apply resistance
    let adjustedTranslation = translationX;
    
    if (translationX > 0) {
      // Swiping right (showing left actions)
      setSwipeDirection('right');
      const maxSwipe = leftActions.length * ACTION_WIDTH;
      if (translationX > maxSwipe) {
        adjustedTranslation = maxSwipe + (translationX - maxSwipe) * 0.1;
      }
    } else {
      // Swiping left (showing right actions)
      setSwipeDirection('left');
      const maxSwipe = rightActions.length * ACTION_WIDTH;
      if (Math.abs(translationX) > maxSwipe) {
        adjustedTranslation = -maxSwipe + (translationX + maxSwipe) * 0.1;
      }
    }
    
    translateX.setValue(adjustedTranslation);
    
    // Trigger haptic feedback at threshold
    if (!isSwipeActive && Math.abs(translationX) > SWIPE_THRESHOLD) {
      setIsSwipeActive(true);
      triggerHapticFeedback('medium');
    } else if (isSwipeActive && Math.abs(translationX) < SWIPE_THRESHOLD) {
      setIsSwipeActive(false);
    }
  };

  const onHandlerStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    const { state, translationX } = event.nativeEvent;
    
    if (state === State.END) {
      const absTranslation = Math.abs(translationX);
      
      if (absTranslation > SWIPE_THRESHOLD) {
        // Determine which action to trigger
        const actions = translationX > 0 ? leftActions : rightActions;
        const actionIndex = Math.min(
          Math.floor(absTranslation / ACTION_WIDTH),
          actions.length - 1
        );
        
        if (actions[actionIndex]) {
          setActionTriggered(actions[actionIndex].id);
          triggerHapticFeedback('heavy');
          
          // Animate to action position
          const targetPosition = translationX > 0 ? 
            (actionIndex + 1) * ACTION_WIDTH : 
            -(actionIndex + 1) * ACTION_WIDTH;
          
          Animated.timing(translateX, {
            toValue: targetPosition,
            duration: MaterialDuration.short2,
            easing: MaterialEasing.decelerate,
            useNativeDriver: true,
          }).start(() => {
            // Execute action after animation
            setTimeout(() => {
              actions[actionIndex].onPress();
              resetPosition();
            }, 100);
          });
        } else {
          resetPosition();
        }
      } else {
        resetPosition();
      }
      
      setIsSwipeActive(false);
      setSwipeDirection(null);
    }
  };

  const resetPosition = () => {
    setActionTriggered(null);
    Animated.spring(translateX, {
      toValue: 0,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const renderActions = (actions: SwipeAction[], side: 'left' | 'right') => {
    return actions.map((action, index) => {
      const isTriggered = actionTriggered === action.id;
      const scale = useRef(new Animated.Value(1)).current;
      
      if (isTriggered) {
        Animated.spring(scale, {
          toValue: 1.2,
          tension: 150,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
      
      return (
        <Animated.View
          key={action.id}
          style={[
            styles.actionContainer,
            {
              backgroundColor: action.backgroundColor,
              [side === 'left' ? 'left' : 'right']: index * ACTION_WIDTH,
              transform: [{ scale }],
            },
          ]}
        >
          <IconButton
            icon={action.icon}
            size={24}
            iconColor={action.color}
            onPress={action.onPress}
            style={styles.actionButton}
          />
          <Text
            variant="labelSmall"
            style={[styles.actionLabel, { color: action.color }]}
          >
            {action.label}
          </Text>
        </Animated.View>
      );
    });
  };

  return (
    <View style={[styles.container, style]}>
      {/* Left Actions */}
      <View style={styles.actionsContainer}>
        {renderActions(leftActions, 'left')}
      </View>
      
      {/* Right Actions */}
      <View style={styles.actionsContainer}>
        {renderActions(rightActions, 'right')}
      </View>
      
      {/* Main Task Item */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]}
        failOffsetY={[-20, 20]}
      >
        <Animated.View
          style={[
            styles.taskItemContainer,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          <Surface
            style={[
              styles.taskSurface,
              {
                backgroundColor: theme.colors.surface,
                elevation: isSwipeActive ? 4 : 2,
              },
            ]}
          >
            <TaskItem
              task={task}
              category={category}
              onPress={onPress}
              onDelete={onDelete}
            />
          </Surface>
        </Animated.View>
      </PanGestureHandler>
      
      {/* Swipe Indicator */}
      {isSwipeActive && (
        <Animated.View
          style={[
            styles.swipeIndicator,
            {
              backgroundColor: swipeDirection === 'right' 
                ? statusColors.completed.light + '20'
                : theme.colors.error + '20',
              opacity: translateX.interpolate({
                inputRange: [-screenWidth, -SWIPE_THRESHOLD, SWIPE_THRESHOLD, screenWidth],
                outputRange: [0.8, 0.3, 0.3, 0.8],
                extrapolate: 'clamp',
              }),
            },
          ]}
        >
          <Icon
            name={swipeDirection === 'right' ? 'chevron-right' : 'chevron-left'}
            size={32}
            color={swipeDirection === 'right' 
              ? statusColors.completed.light
              : theme.colors.error
            }
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: materialStyles.spacing.xs,
    overflow: 'hidden',
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  actionContainer: {
    width: ACTION_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  actionButton: {
    margin: 0,
  },
  actionLabel: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: -4,
  },
  taskItemContainer: {
    zIndex: 2,
  },
  taskSurface: {
    borderRadius: materialStyles.borderRadius.md,
    overflow: 'hidden',
  },
  swipeIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
    borderRadius: materialStyles.borderRadius.md,
  },
});

export default SwipeableTaskItem;
