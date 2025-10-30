/**
 * Advanced Adaptive Layout System
 * Implements responsive layouts for phones, tablets, foldables, and desktop
 * Following Material Design 3.0 adaptive guidelines
 */

import React from 'react';
import { Dimensions, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

export interface DeviceMetrics {
  width: number;
  height: number;
  aspectRatio: number;
  density: number;
  fontScale: number;
  isTablet: boolean;
  isFoldable: boolean;
  isLandscape: boolean;
  deviceType: 'phone' | 'tablet' | 'foldable' | 'desktop';
  breakpoint: 'compact' | 'medium' | 'expanded';
}

export interface LayoutConfiguration {
  columns: number;
  margins: number;
  gutters: number;
  maxWidth?: number;
  navigationStyle: 'bottom' | 'rail' | 'drawer';
  fabPosition: 'bottom-right' | 'bottom-center' | 'side';
  cardLayout: 'single' | 'grid' | 'masonry';
  headerStyle: 'small' | 'medium' | 'large';
}

export interface ResponsiveBreakpoints {
  compact: number;    // 0-599dp (phones in portrait, small tablets)
  medium: number;     // 600-839dp (tablets in portrait, phones in landscape)
  expanded: number;   // 840dp+ (tablets in landscape, desktop)
}

/**
 * Material Design 3.0 Breakpoints
 */
export const BREAKPOINTS: ResponsiveBreakpoints = {
  compact: 600,
  medium: 840,
  expanded: 1200,
};

/**
 * Adaptive Layout Manager
 */
export class AdaptiveLayoutManager {
  private static instance: AdaptiveLayoutManager;
  private currentMetrics: DeviceMetrics;
  private listeners: ((metrics: DeviceMetrics) => void)[] = [];

  static getInstance(): AdaptiveLayoutManager {
    if (!AdaptiveLayoutManager.instance) {
      AdaptiveLayoutManager.instance = new AdaptiveLayoutManager();
    }
    return AdaptiveLayoutManager.instance;
  }

  constructor() {
    this.currentMetrics = this.calculateMetrics();
    this.setupDimensionListener();
  }

  /**
   * Get current device metrics
   */
  getDeviceMetrics(): DeviceMetrics {
    return this.currentMetrics;
  }

  /**
   * Get layout configuration for current device
   */
  getLayoutConfiguration(): LayoutConfiguration {
    const metrics = this.currentMetrics;
    
    switch (metrics.breakpoint) {
      case 'compact':
        return this.getCompactLayout(metrics);
      case 'medium':
        return this.getMediumLayout(metrics);
      case 'expanded':
        return this.getExpandedLayout(metrics);
      default:
        return this.getCompactLayout(metrics);
    }
  }

  /**
   * Subscribe to layout changes
   */
  subscribe(listener: (metrics: DeviceMetrics) => void): () => void {
    this.listeners.push(listener);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Check if device supports specific features
   */
  async getDeviceCapabilities(): Promise<{
    supportsFoldable: boolean;
    supportsMultiWindow: boolean;
    supportsPictureInPicture: boolean;
    supportsHapticFeedback: boolean;
    supportsBiometrics: boolean;
    supportsWidgets: boolean;
  }> {
    const [
      deviceType,
      systemVersion,
      hasNotch,
    ] = await Promise.all([
      DeviceInfo.getDeviceType(),
      DeviceInfo.getSystemVersion(),
      DeviceInfo.hasNotch(),
    ]);

    return {
      supportsFoldable: await this.checkFoldableSupport(),
      supportsMultiWindow: Platform.OS === 'android' && parseInt(systemVersion) >= 24,
      supportsPictureInPicture: Platform.OS === 'android' && parseInt(systemVersion) >= 26,
      supportsHapticFeedback: Platform.OS === 'ios' || (Platform.OS === 'android' && parseInt(systemVersion) >= 26),
      supportsBiometrics: true, // Will be checked by biometric service
      supportsWidgets: Platform.OS === 'android' && parseInt(systemVersion) >= 25,
    };
  }

  /**
   * Get responsive grid configuration
   */
  getGridConfiguration(): {
    columns: number;
    spacing: number;
    aspectRatio: number;
  } {
    const { breakpoint, isLandscape } = this.currentMetrics;
    
    if (breakpoint === 'compact') {
      return {
        columns: isLandscape ? 3 : 2,
        spacing: 8,
        aspectRatio: 1.2,
      };
    } else if (breakpoint === 'medium') {
      return {
        columns: isLandscape ? 4 : 3,
        spacing: 12,
        aspectRatio: 1.1,
      };
    } else {
      return {
        columns: isLandscape ? 6 : 4,
        spacing: 16,
        aspectRatio: 1.0,
      };
    }
  }

  /**
   * Get navigation configuration
   */
  getNavigationConfiguration(): {
    type: 'bottom' | 'rail' | 'drawer';
    showLabels: boolean;
    compact: boolean;
  } {
    const { breakpoint, isLandscape, deviceType } = this.currentMetrics;
    
    if (breakpoint === 'compact' && !isLandscape) {
      return {
        type: 'bottom',
        showLabels: true,
        compact: false,
      };
    } else if (breakpoint === 'medium' || (breakpoint === 'compact' && isLandscape)) {
      return {
        type: 'rail',
        showLabels: false,
        compact: true,
      };
    } else {
      return {
        type: 'drawer',
        showLabels: true,
        compact: false,
      };
    }
  }

  /**
   * Get content padding based on device
   */
  getContentPadding(): {
    horizontal: number;
    vertical: number;
    safe: boolean;
  } {
    const { breakpoint, width } = this.currentMetrics;
    
    if (breakpoint === 'compact') {
      return {
        horizontal: 16,
        vertical: 8,
        safe: true,
      };
    } else if (breakpoint === 'medium') {
      return {
        horizontal: 24,
        vertical: 16,
        safe: true,
      };
    } else {
      // For expanded layouts, center content with max width
      const maxContentWidth = 1200;
      const sidePadding = Math.max(24, (width - maxContentWidth) / 2);
      
      return {
        horizontal: sidePadding,
        vertical: 24,
        safe: false,
      };
    }
  }

  /**
   * Get typography scale based on device
   */
  getTypographyScale(): {
    scale: number;
    lineHeight: number;
  } {
    const { breakpoint, fontScale } = this.currentMetrics;
    
    let baseScale = 1.0;
    
    if (breakpoint === 'medium') {
      baseScale = 1.1;
    } else if (breakpoint === 'expanded') {
      baseScale = 1.2;
    }
    
    return {
      scale: baseScale * fontScale,
      lineHeight: 1.4 + (baseScale - 1) * 0.2,
    };
  }

  private calculateMetrics(): DeviceMetrics {
    const { width, height, scale, fontScale } = Dimensions.get('window');
    const isLandscape = width > height;
    const aspectRatio = width / height;
    
    // Determine device type
    const smallestWidth = Math.min(width, height);
    const isTablet = smallestWidth >= 600;
    
    // Determine breakpoint
    let breakpoint: 'compact' | 'medium' | 'expanded';
    if (width < BREAKPOINTS.compact) {
      breakpoint = 'compact';
    } else if (width < BREAKPOINTS.medium) {
      breakpoint = 'medium';
    } else {
      breakpoint = 'expanded';
    }
    
    // Determine device type
    let deviceType: DeviceMetrics['deviceType'];
    if (breakpoint === 'expanded') {
      deviceType = 'desktop';
    } else if (isTablet) {
      deviceType = 'tablet';
    } else {
      deviceType = 'phone';
    }
    
    return {
      width,
      height,
      aspectRatio,
      density: scale,
      fontScale,
      isTablet,
      isFoldable: false, // Will be determined by device detection
      isLandscape,
      deviceType,
      breakpoint,
    };
  }

  private setupDimensionListener(): void {
    Dimensions.addEventListener('change', ({ window }) => {
      this.currentMetrics = this.calculateMetrics();
      this.notifyListeners();
    });
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentMetrics));
  }

  private getCompactLayout(metrics: DeviceMetrics): LayoutConfiguration {
    return {
      columns: metrics.isLandscape ? 2 : 1,
      margins: 16,
      gutters: 8,
      navigationStyle: 'bottom',
      fabPosition: 'bottom-right',
      cardLayout: 'single',
      headerStyle: 'small',
    };
  }

  private getMediumLayout(metrics: DeviceMetrics): LayoutConfiguration {
    return {
      columns: metrics.isLandscape ? 3 : 2,
      margins: 24,
      gutters: 12,
      navigationStyle: 'rail',
      fabPosition: 'bottom-right',
      cardLayout: 'grid',
      headerStyle: 'medium',
    };
  }

  private getExpandedLayout(metrics: DeviceMetrics): LayoutConfiguration {
    return {
      columns: metrics.isLandscape ? 4 : 3,
      margins: 32,
      gutters: 16,
      maxWidth: 1200,
      navigationStyle: 'drawer',
      fabPosition: 'side',
      cardLayout: 'masonry',
      headerStyle: 'large',
    };
  }

  private async checkFoldableSupport(): Promise<boolean> {
    try {
      // Check for foldable device characteristics
      const deviceType = await DeviceInfo.getDeviceType();
      const model = await DeviceInfo.getModel();
      
      // Common foldable device indicators
      const foldableKeywords = ['fold', 'flip', 'duo', 'surface'];
      const isFoldableModel = foldableKeywords.some(keyword => 
        model.toLowerCase().includes(keyword)
      );
      
      return isFoldableModel || deviceType === 'Tablet'; // Simplified check
    } catch (error) {
      console.warn('Failed to detect foldable support:', error);
      return false;
    }
  }
}

/**
 * Responsive Hook for React Components
 */
export const useResponsiveLayout = () => {
  const [metrics, setMetrics] = React.useState<DeviceMetrics>(
    AdaptiveLayoutManager.getInstance().getDeviceMetrics()
  );
  
  React.useEffect(() => {
    const unsubscribe = AdaptiveLayoutManager.getInstance().subscribe(setMetrics);
    return unsubscribe;
  }, []);
  
  const layoutConfig = React.useMemo(() => 
    AdaptiveLayoutManager.getInstance().getLayoutConfiguration(),
    [metrics]
  );
  
  const gridConfig = React.useMemo(() => 
    AdaptiveLayoutManager.getInstance().getGridConfiguration(),
    [metrics]
  );
  
  const navigationConfig = React.useMemo(() => 
    AdaptiveLayoutManager.getInstance().getNavigationConfiguration(),
    [metrics]
  );
  
  const contentPadding = React.useMemo(() => 
    AdaptiveLayoutManager.getInstance().getContentPadding(),
    [metrics]
  );
  
  const typographyScale = React.useMemo(() => 
    AdaptiveLayoutManager.getInstance().getTypographyScale(),
    [metrics]
  );
  
  return {
    metrics,
    layoutConfig,
    gridConfig,
    navigationConfig,
    contentPadding,
    typographyScale,
    isCompact: metrics.breakpoint === 'compact',
    isMedium: metrics.breakpoint === 'medium',
    isExpanded: metrics.breakpoint === 'expanded',
    isTablet: metrics.isTablet,
    isLandscape: metrics.isLandscape,
  };
};

/**
 * Responsive Styles Generator
 */
export const createResponsiveStyles = (
  styles: {
    compact?: any;
    medium?: any;
    expanded?: any;
    default?: any;
  }
) => {
  const metrics = AdaptiveLayoutManager.getInstance().getDeviceMetrics();
  
  const baseStyles = styles.default || {};
  const breakpointStyles = styles[metrics.breakpoint] || {};
  
  return {
    ...baseStyles,
    ...breakpointStyles,
  };
};

/**
 * Responsive Value Selector
 */
export const selectResponsiveValue = <T>(values: {
  compact?: T;
  medium?: T;
  expanded?: T;
  default: T;
}): T => {
  const metrics = AdaptiveLayoutManager.getInstance().getDeviceMetrics();
  return values[metrics.breakpoint] || values.default;
};

/**
 * Foldable Device Support
 */
export class FoldableDeviceManager {
  private static instance: FoldableDeviceManager;
  private isFolded = false;
  private listeners: ((folded: boolean) => void)[] = [];

  static getInstance(): FoldableDeviceManager {
    if (!FoldableDeviceManager.instance) {
      FoldableDeviceManager.instance = new FoldableDeviceManager();
    }
    return FoldableDeviceManager.instance;
  }

  /**
   * Check if device is currently folded
   */
  isFoldedState(): boolean {
    return this.isFolded;
  }

  /**
   * Subscribe to fold state changes
   */
  subscribe(listener: (folded: boolean) => void): () => void {
    this.listeners.push(listener);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get layout configuration for foldable devices
   */
  getFoldableLayout(): {
    primaryScreen: LayoutConfiguration;
    secondaryScreen?: LayoutConfiguration;
    continuityMode: boolean;
  } {
    const layoutManager = AdaptiveLayoutManager.getInstance();
    const baseConfig = layoutManager.getLayoutConfiguration();
    
    if (this.isFolded) {
      // Single screen mode
      return {
        primaryScreen: {
          ...baseConfig,
          columns: 1,
          cardLayout: 'single',
        },
        continuityMode: false,
      };
    } else {
      // Dual screen mode
      return {
        primaryScreen: {
          ...baseConfig,
          columns: 2,
          cardLayout: 'grid',
        },
        secondaryScreen: {
          ...baseConfig,
          columns: 1,
          cardLayout: 'single',
          navigationStyle: 'rail',
        },
        continuityMode: true,
      };
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.isFolded));
  }
}

export default AdaptiveLayoutManager.getInstance();
