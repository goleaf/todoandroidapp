/**
 * Advanced Material Motion 3.0 System
 * Implements Google's Material Motion guidelines with shared element transitions,
 * hero animations, and sophisticated micro-interactions
 */

import { Animated, Easing, Dimensions, Platform } from 'react-native';
import { materialStyles } from '../theme/MaterialTheme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Material Motion 3.0 Easing Curves
export const MaterialEasing = {
  // Standard easing for most animations
  standard: Easing.bezier(0.2, 0.0, 0, 1.0),
  
  // Decelerate easing for elements entering the screen
  decelerate: Easing.bezier(0.0, 0.0, 0.2, 1.0),
  
  // Accelerate easing for elements exiting the screen
  accelerate: Easing.bezier(0.4, 0.0, 1.0, 1.0),
  
  // Emphasize easing for important state changes
  emphasize: Easing.bezier(0.2, 0.0, 0, 1.0),
  
  // Linear easing for continuous animations
  linear: Easing.linear,
  
  // Bounce easing for playful interactions
  bounce: Easing.bounce,
  
  // Elastic easing for spring-like animations
  elastic: Easing.elastic(1),
};

// Material Motion 3.0 Duration Tokens
export const MaterialDuration = {
  // Extra short for simple icon changes
  extraShort: 100,
  
  // Short for simple property changes
  short1: 150,
  short2: 200,
  short3: 250,
  short4: 300,
  
  // Medium for more complex animations
  medium1: 350,
  medium2: 400,
  medium3: 450,
  medium4: 500,
  
  // Long for complex scene transitions
  long1: 550,
  long2: 600,
  long3: 650,
  long4: 700,
  
  // Extra long for full screen transitions
  extraLong1: 750,
  extraLong2: 800,
  extraLong3: 850,
  extraLong4: 900,
};

/**
 * Shared Element Transition System
 */
export class SharedElementTransition {
  private static transitions = new Map<string, Animated.Value>();
  
  static create(id: string, initialValue = 0): Animated.Value {
    if (!this.transitions.has(id)) {
      this.transitions.set(id, new Animated.Value(initialValue));
    }
    return this.transitions.get(id)!;
  }
  
  static animate(
    id: string,
    toValue: number,
    duration = MaterialDuration.medium2,
    easing = MaterialEasing.standard
  ): Promise<void> {
    const animatedValue = this.create(id);
    
    return new Promise((resolve) => {
      Animated.timing(animatedValue, {
        toValue,
        duration,
        easing,
        useNativeDriver: true,
      }).start(() => resolve());
    });
  }
  
  static get(id: string): Animated.Value | undefined {
    return this.transitions.get(id);
  }
  
  static remove(id: string): void {
    this.transitions.delete(id);
  }
}

/**
 * Hero Animation System
 */
export class HeroAnimation {
  static createHeroTransition(
    fromBounds: { x: number; y: number; width: number; height: number },
    toBounds: { x: number; y: number; width: number; height: number },
    duration = MaterialDuration.long2
  ) {
    const scaleX = toBounds.width / fromBounds.width;
    const scaleY = toBounds.height / fromBounds.height;
    const translateX = toBounds.x - fromBounds.x;
    const translateY = toBounds.y - fromBounds.y;
    
    const animatedValue = new Animated.Value(0);
    
    return {
      animatedValue,
      style: {
        transform: [
          {
            translateX: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, translateX],
            }),
          },
          {
            translateY: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, translateY],
            }),
          },
          {
            scaleX: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [1, scaleX],
            }),
          },
          {
            scaleY: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [1, scaleY],
            }),
          },
        ],
      },
      animate: () => {
        return new Promise<void>((resolve) => {
          Animated.timing(animatedValue, {
            toValue: 1,
            duration,
            easing: MaterialEasing.emphasize,
            useNativeDriver: true,
          }).start(() => resolve());
        });
      },
    };
  }
}

/**
 * Micro-interaction Animations
 */
export class MicroInteractions {
  /**
   * Button press animation with haptic feedback
   */
  static buttonPress(animatedValue: Animated.Value, withHaptic = true): Promise<void> {
    if (withHaptic && Platform.OS === 'ios') {
      // Import haptic feedback dynamically to avoid Android issues
      import('react-native-haptic-feedback').then(({ default: HapticFeedback }) => {
        HapticFeedback.trigger('impactLight');
      });
    }
    
    return new Promise((resolve) => {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 0.95,
          duration: MaterialDuration.extraShort,
          easing: MaterialEasing.accelerate,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: MaterialDuration.short1,
          easing: MaterialEasing.decelerate,
          useNativeDriver: true,
        }),
      ]).start(() => resolve());
    });
  }
  
  /**
   * Card elevation animation on press
   */
  static cardPress(elevationValue: Animated.Value): Promise<void> {
    return new Promise((resolve) => {
      Animated.sequence([
        Animated.timing(elevationValue, {
          toValue: 8,
          duration: MaterialDuration.short1,
          easing: MaterialEasing.decelerate,
          useNativeDriver: false, // Elevation doesn't support native driver
        }),
        Animated.timing(elevationValue, {
          toValue: 2,
          duration: MaterialDuration.short2,
          easing: MaterialEasing.standard,
          useNativeDriver: false,
        }),
      ]).start(() => resolve());
    });
  }
  
  /**
   * Ripple effect animation
   */
  static ripple(
    animatedValue: Animated.Value,
    centerX: number,
    centerY: number,
    maxRadius: number
  ): Promise<void> {
    return new Promise((resolve) => {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: MaterialDuration.medium2,
        easing: MaterialEasing.decelerate,
        useNativeDriver: true,
      }).start(() => resolve());
    });
  }
  
  /**
   * Floating Action Button animation
   */
  static fabAnimation(
    scaleValue: Animated.Value,
    rotationValue: Animated.Value,
    extended = false
  ): Promise<void> {
    return new Promise((resolve) => {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: extended ? 1.1 : 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(rotationValue, {
          toValue: extended ? 1 : 0,
          duration: MaterialDuration.medium2,
          easing: MaterialEasing.standard,
          useNativeDriver: true,
        }),
      ]).start(() => resolve());
    });
  }
}

/**
 * Page Transition Animations
 */
export class PageTransitions {
  /**
   * Slide transition for navigation
   */
  static slideTransition(
    animatedValue: Animated.Value,
    direction: 'left' | 'right' | 'up' | 'down' = 'right'
  ) {
    const getTranslateValue = () => {
      switch (direction) {
        case 'left':
          return [-screenWidth, 0];
        case 'right':
          return [screenWidth, 0];
        case 'up':
          return [0, -screenHeight];
        case 'down':
          return [0, screenHeight];
      }
    };
    
    const [fromValue, toValue] = getTranslateValue();
    const isHorizontal = direction === 'left' || direction === 'right';
    
    return {
      transform: [
        {
          [isHorizontal ? 'translateX' : 'translateY']: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [fromValue, toValue],
          }),
        },
      ],
    };
  }
  
  /**
   * Fade transition
   */
  static fadeTransition(animatedValue: Animated.Value) {
    return {
      opacity: animatedValue,
    };
  }
  
  /**
   * Scale transition
   */
  static scaleTransition(animatedValue: Animated.Value) {
    return {
      transform: [
        {
          scale: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
          }),
        },
      ],
    };
  }
  
  /**
   * Combined transition with fade and scale
   */
  static modalTransition(animatedValue: Animated.Value) {
    return {
      opacity: animatedValue,
      transform: [
        {
          scale: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.9, 1],
          }),
        },
        {
          translateY: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [50, 0],
          }),
        },
      ],
    };
  }
}

/**
 * List Animations
 */
export class ListAnimations {
  /**
   * Staggered list item animation
   */
  static staggeredFadeIn(
    items: Animated.Value[],
    delay = MaterialDuration.extraShort
  ): Promise<void[]> {
    return Promise.all(
      items.map((item, index) => {
        return new Promise<void>((resolve) => {
          Animated.timing(item, {
            toValue: 1,
            duration: MaterialDuration.medium2,
            delay: index * delay,
            easing: MaterialEasing.decelerate,
            useNativeDriver: true,
          }).start(() => resolve());
        });
      })
    );
  }
  
  /**
   * List item slide in animation
   */
  static slideInFromRight(animatedValue: Animated.Value, delay = 0): Promise<void> {
    return new Promise((resolve) => {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: MaterialDuration.medium2,
        delay,
        easing: MaterialEasing.decelerate,
        useNativeDriver: true,
      }).start(() => resolve());
    });
  }
  
  /**
   * Swipe to dismiss animation
   */
  static swipeToDismiss(
    animatedValue: Animated.Value,
    direction: 'left' | 'right' = 'right'
  ): Promise<void> {
    const toValue = direction === 'right' ? screenWidth : -screenWidth;
    
    return new Promise((resolve) => {
      Animated.timing(animatedValue, {
        toValue,
        duration: MaterialDuration.medium1,
        easing: MaterialEasing.accelerate,
        useNativeDriver: true,
      }).start(() => resolve());
    });
  }
}

/**
 * Loading Animations
 */
export class LoadingAnimations {
  /**
   * Skeleton loading animation
   */
  static skeleton(animatedValue: Animated.Value): void {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: MaterialDuration.long1,
          easing: MaterialEasing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: MaterialDuration.long1,
          easing: MaterialEasing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }
  
  /**
   * Pulse animation for loading states
   */
  static pulse(animatedValue: Animated.Value): void {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1.1,
          duration: MaterialDuration.medium2,
          easing: MaterialEasing.standard,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: MaterialDuration.medium2,
          easing: MaterialEasing.standard,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }
  
  /**
   * Spinning animation for loading indicators
   */
  static spin(animatedValue: Animated.Value): void {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: MaterialDuration.long2,
        easing: MaterialEasing.linear,
        useNativeDriver: true,
      })
    ).start();
  }
}

/**
 * Gesture Animations
 */
export class GestureAnimations {
  /**
   * Pull to refresh animation
   */
  static pullToRefresh(
    animatedValue: Animated.Value,
    threshold = 100
  ) {
    return {
      transform: [
        {
          translateY: animatedValue.interpolate({
            inputRange: [0, threshold],
            outputRange: [0, threshold],
            extrapolate: 'clamp',
          }),
        },
        {
          rotate: animatedValue.interpolate({
            inputRange: [0, threshold],
            outputRange: ['0deg', '180deg'],
            extrapolate: 'clamp',
          }),
        },
      ],
    };
  }
  
  /**
   * Swipe gesture animation
   */
  static swipeGesture(
    animatedValue: Animated.Value,
    direction: 'horizontal' | 'vertical' = 'horizontal'
  ) {
    return {
      transform: [
        {
          [direction === 'horizontal' ? 'translateX' : 'translateY']: animatedValue,
        },
      ],
    };
  }
}

/**
 * Animation Utilities
 */
export class AnimationUtils {
  /**
   * Create a spring animation with Material Motion parameters
   */
  static createSpring(
    animatedValue: Animated.Value,
    toValue: number,
    tension = 100,
    friction = 8
  ): Animated.CompositeAnimation {
    return Animated.spring(animatedValue, {
      toValue,
      tension,
      friction,
      useNativeDriver: true,
    });
  }
  
  /**
   * Create a timing animation with Material Motion parameters
   */
  static createTiming(
    animatedValue: Animated.Value,
    toValue: number,
    duration = MaterialDuration.medium2,
    easing = MaterialEasing.standard
  ): Animated.CompositeAnimation {
    return Animated.timing(animatedValue, {
      toValue,
      duration,
      easing,
      useNativeDriver: true,
    });
  }
  
  /**
   * Create a sequence of animations
   */
  static createSequence(
    animations: Animated.CompositeAnimation[]
  ): Animated.CompositeAnimation {
    return Animated.sequence(animations);
  }
  
  /**
   * Create parallel animations
   */
  static createParallel(
    animations: Animated.CompositeAnimation[]
  ): Animated.CompositeAnimation {
    return Animated.parallel(animations);
  }
  
  /**
   * Create a stagger animation
   */
  static createStagger(
    delay: number,
    animations: Animated.CompositeAnimation[]
  ): Animated.CompositeAnimation {
    return Animated.stagger(delay, animations);
  }
}

export default {
  MaterialEasing,
  MaterialDuration,
  SharedElementTransition,
  HeroAnimation,
  MicroInteractions,
  PageTransitions,
  ListAnimations,
  LoadingAnimations,
  GestureAnimations,
  AnimationUtils,
};



