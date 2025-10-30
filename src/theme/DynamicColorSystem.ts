/**
 * Advanced Dynamic Color System - Material You Implementation
 * Extracts colors from wallpaper and creates harmonious color schemes
 * Implements Google's Material You dynamic theming system
 */

import { Platform, NativeModules } from 'react-native';
import { MD3Theme } from 'react-native-paper';
import { lightTheme, darkTheme } from './MaterialTheme';

interface ColorPalette {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  shadow: string;
  scrim: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
}

interface DynamicColorScheme {
  light: ColorPalette;
  dark: ColorPalette;
  source: string;
  timestamp: number;
}

/**
 * Color Harmony Generator
 * Creates harmonious color schemes based on Material Design 3.0 principles
 */
class ColorHarmonyGenerator {
  /**
   * Generate a complete color scheme from a source color
   */
  static generateScheme(sourceColor: string, isDark = false): ColorPalette {
    const hsl = this.hexToHsl(sourceColor);
    
    // Generate primary colors
    const primary = this.adjustColor(sourceColor, { lightness: isDark ? 0.8 : 0.4 });
    const onPrimary = isDark ? '#000000' : '#FFFFFF';
    const primaryContainer = this.adjustColor(sourceColor, { 
      lightness: isDark ? 0.2 : 0.9,
      saturation: 0.8 
    });
    const onPrimaryContainer = this.adjustColor(sourceColor, { 
      lightness: isDark ? 0.9 : 0.1 
    });
    
    // Generate secondary colors (analogous)
    const secondaryHue = (hsl.h + 30) % 360;
    const secondary = this.hslToHex({
      h: secondaryHue,
      s: hsl.s * 0.8,
      l: isDark ? 0.7 : 0.5
    });
    const onSecondary = isDark ? '#000000' : '#FFFFFF';
    const secondaryContainer = this.hslToHex({
      h: secondaryHue,
      s: hsl.s * 0.6,
      l: isDark ? 0.2 : 0.9
    });
    const onSecondaryContainer = this.hslToHex({
      h: secondaryHue,
      s: hsl.s,
      l: isDark ? 0.9 : 0.1
    });
    
    // Generate tertiary colors (triadic)
    const tertiaryHue = (hsl.h + 120) % 360;
    const tertiary = this.hslToHex({
      h: tertiaryHue,
      s: hsl.s * 0.7,
      l: isDark ? 0.6 : 0.6
    });
    const onTertiary = isDark ? '#000000' : '#FFFFFF';
    const tertiaryContainer = this.hslToHex({
      h: tertiaryHue,
      s: hsl.s * 0.5,
      l: isDark ? 0.2 : 0.9
    });
    const onTertiaryContainer = this.hslToHex({
      h: tertiaryHue,
      s: hsl.s,
      l: isDark ? 0.9 : 0.1
    });
    
    // Error colors (fixed for consistency)
    const error = isDark ? '#FFB4AB' : '#BA1A1A';
    const onError = isDark ? '#690005' : '#FFFFFF';
    const errorContainer = isDark ? '#93000A' : '#FFDAD6';
    const onErrorContainer = isDark ? '#FFDAD6' : '#410002';
    
    // Surface colors
    const background = isDark ? '#1C1B1F' : '#FFFBFE';
    const onBackground = isDark ? '#E6E1E5' : '#1C1B1F';
    const surface = isDark ? '#1C1B1F' : '#FFFBFE';
    const onSurface = isDark ? '#E6E1E5' : '#1C1B1F';
    const surfaceVariant = isDark ? '#49454F' : '#E7E0EC';
    const onSurfaceVariant = isDark ? '#CAC4D0' : '#49454F';
    
    // Outline colors
    const outline = isDark ? '#938F99' : '#79747E';
    const outlineVariant = isDark ? '#49454F' : '#CAC4D0';
    
    // Utility colors
    const shadow = '#000000';
    const scrim = '#000000';
    const inverseSurface = isDark ? '#E6E1E5' : '#313033';
    const inverseOnSurface = isDark ? '#313033' : '#F4EFF4';
    const inversePrimary = isDark ? primary : this.adjustColor(primary, { lightness: 0.8 });
    
    return {
      primary,
      onPrimary,
      primaryContainer,
      onPrimaryContainer,
      secondary,
      onSecondary,
      secondaryContainer,
      onSecondaryContainer,
      tertiary,
      onTertiary,
      tertiaryContainer,
      onTertiaryContainer,
      error,
      onError,
      errorContainer,
      onErrorContainer,
      background,
      onBackground,
      surface,
      onSurface,
      surfaceVariant,
      onSurfaceVariant,
      outline,
      outlineVariant,
      shadow,
      scrim,
      inverseSurface,
      inverseOnSurface,
      inversePrimary,
    };
  }
  
  /**
   * Extract dominant color from image (simulated for demo)
   */
  static async extractDominantColor(imageUri?: string): Promise<string> {
    // In a real implementation, this would use native modules to extract colors
    // For now, we'll return a default color or use device accent color
    
    if (Platform.OS === 'android' && Platform.Version >= 31) {
      // Android 12+ dynamic color support
      try {
        // This would use native modules to get system accent color
        return '#6750A4'; // Fallback to Material Purple
      } catch (error) {
        console.warn('Failed to extract system color:', error);
      }
    }
    
    // Fallback colors based on time of day for dynamic feel
    const hour = new Date().getHours();
    const timeBasedColors = [
      '#1976D2', // Morning blue
      '#2E7D32', // Day green
      '#F57C00', // Evening orange
      '#7B1FA2', // Night purple
    ];
    
    const colorIndex = Math.floor(hour / 6);
    return timeBasedColors[colorIndex] || '#6750A4';
  }
  
  /**
   * Convert hex color to HSL
   */
  private static hexToHsl(hex: string): { h: number; s: number; l: number } {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    
    return { h: h * 360, s, l };
  }
  
  /**
   * Convert HSL to hex color
   */
  private static hslToHex(hsl: { h: number; s: number; l: number }): string {
    const { h, s, l } = hsl;
    const hNorm = h / 360;
    
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    let r: number, g: number, b: number;
    
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, hNorm + 1/3);
      g = hue2rgb(p, q, hNorm);
      b = hue2rgb(p, q, hNorm - 1/3);
    }
    
    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  
  /**
   * Adjust color properties
   */
  private static adjustColor(
    hex: string, 
    adjustments: { hue?: number; saturation?: number; lightness?: number }
  ): string {
    const hsl = this.hexToHsl(hex);
    
    return this.hslToHex({
      h: adjustments.hue !== undefined ? adjustments.hue : hsl.h,
      s: adjustments.saturation !== undefined ? adjustments.saturation : hsl.s,
      l: adjustments.lightness !== undefined ? adjustments.lightness : hsl.l,
    });
  }
}

/**
 * Dynamic Color Manager
 */
export class DynamicColorManager {
  private static instance: DynamicColorManager;
  private currentScheme: DynamicColorScheme | null = null;
  private listeners: ((scheme: DynamicColorScheme) => void)[] = [];
  
  static getInstance(): DynamicColorManager {
    if (!DynamicColorManager.instance) {
      DynamicColorManager.instance = new DynamicColorManager();
    }
    return DynamicColorManager.instance;
  }
  
  /**
   * Initialize dynamic color system
   */
  async initialize(): Promise<void> {
    try {
      console.log('🎨 Initializing Dynamic Color System...');
      
      // Extract dominant color from wallpaper or system
      const sourceColor = await ColorHarmonyGenerator.extractDominantColor();
      
      // Generate color schemes
      const lightPalette = ColorHarmonyGenerator.generateScheme(sourceColor, false);
      const darkPalette = ColorHarmonyGenerator.generateScheme(sourceColor, true);
      
      this.currentScheme = {
        light: lightPalette,
        dark: darkPalette,
        source: sourceColor,
        timestamp: Date.now(),
      };
      
      // Notify listeners
      this.notifyListeners();
      
      console.log('✅ Dynamic Color System initialized with source:', sourceColor);
    } catch (error) {
      console.error('❌ Failed to initialize Dynamic Color System:', error);
      // Fallback to default themes
      this.currentScheme = null;
    }
  }
  
  /**
   * Get current dynamic theme
   */
  getDynamicTheme(isDark: boolean): MD3Theme {
    if (!this.currentScheme) {
      return isDark ? darkTheme : lightTheme;
    }
    
    const palette = isDark ? this.currentScheme.dark : this.currentScheme.light;
    const baseTheme = isDark ? darkTheme : lightTheme;
    
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        ...palette,
        elevation: {
          level0: 'transparent',
          level1: this.blendColors(palette.surface, palette.primary, 0.05),
          level2: this.blendColors(palette.surface, palette.primary, 0.08),
          level3: this.blendColors(palette.surface, palette.primary, 0.11),
          level4: this.blendColors(palette.surface, palette.primary, 0.12),
          level5: this.blendColors(palette.surface, palette.primary, 0.14),
        },
      },
    };
  }
  
  /**
   * Update color scheme with new source color
   */
  async updateColorScheme(sourceColor: string): Promise<void> {
    try {
      const lightPalette = ColorHarmonyGenerator.generateScheme(sourceColor, false);
      const darkPalette = ColorHarmonyGenerator.generateScheme(sourceColor, true);
      
      this.currentScheme = {
        light: lightPalette,
        dark: darkPalette,
        source: sourceColor,
        timestamp: Date.now(),
      };
      
      this.notifyListeners();
      console.log('🎨 Color scheme updated with source:', sourceColor);
    } catch (error) {
      console.error('❌ Failed to update color scheme:', error);
    }
  }
  
  /**
   * Get available color presets
   */
  getColorPresets(): { name: string; color: string; preview: ColorPalette }[] {
    const presets = [
      { name: 'Material Purple', color: '#6750A4' },
      { name: 'Ocean Blue', color: '#0077BE' },
      { name: 'Forest Green', color: '#2E7D32' },
      { name: 'Sunset Orange', color: '#F57C00' },
      { name: 'Cherry Red', color: '#D32F2F' },
      { name: 'Lavender', color: '#9C27B0' },
      { name: 'Teal', color: '#00796B' },
      { name: 'Amber', color: '#FFC107' },
    ];
    
    return presets.map(preset => ({
      ...preset,
      preview: ColorHarmonyGenerator.generateScheme(preset.color, false),
    }));
  }
  
  /**
   * Subscribe to color scheme changes
   */
  subscribe(listener: (scheme: DynamicColorScheme) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  /**
   * Get current color scheme
   */
  getCurrentScheme(): DynamicColorScheme | null {
    return this.currentScheme;
  }
  
  /**
   * Check if dynamic colors are supported
   */
  isDynamicColorSupported(): boolean {
    return Platform.OS === 'android' && Platform.Version >= 31;
  }
  
  private notifyListeners(): void {
    if (this.currentScheme) {
      this.listeners.forEach(listener => listener(this.currentScheme!));
    }
  }
  
  private blendColors(color1: string, color2: string, ratio: number): string {
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substring(0, 2), 16);
    const g1 = parseInt(hex1.substring(2, 4), 16);
    const b1 = parseInt(hex1.substring(4, 6), 16);
    
    const r2 = parseInt(hex2.substring(0, 2), 16);
    const g2 = parseInt(hex2.substring(2, 4), 16);
    const b2 = parseInt(hex2.substring(4, 6), 16);
    
    const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
    const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
    const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}

/**
 * Color Accessibility Checker
 */
export class ColorAccessibilityChecker {
  /**
   * Check if color combination meets accessibility standards
   */
  static checkAccessibility(foreground: string, background: string): {
    contrastRatio: number;
    wcagAA: boolean;
    wcagAAA: boolean;
    recommendation: string;
  } {
    const ratio = this.getContrastRatio(foreground, background);
    
    return {
      contrastRatio: ratio,
      wcagAA: ratio >= 4.5,
      wcagAAA: ratio >= 7,
      recommendation: ratio < 4.5 
        ? 'Increase contrast for better accessibility'
        : ratio < 7
        ? 'Good contrast, consider increasing for AAA compliance'
        : 'Excellent contrast ratio',
    };
  }
  
  private static getContrastRatio(color1: string, color2: string): number {
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }
  
  private static getLuminance(hex: string): number {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }
}

export default DynamicColorManager.getInstance();



