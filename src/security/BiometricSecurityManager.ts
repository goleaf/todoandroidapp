/**
 * Advanced Biometric Security Manager
 * Implements enterprise-grade security with biometric authentication,
 * encrypted storage, and secure task management
 */

import { Platform, Alert } from 'react-native';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import Keychain from 'react-native-keychain';
import CryptoJS from 'crypto-js';

export interface BiometricCapabilities {
  isSupported: boolean;
  biometryType: BiometryTypes | null;
  isEnrolled: boolean;
  availableTypes: BiometryTypes[];
}

export interface SecuritySettings {
  biometricEnabled: boolean;
  encryptionEnabled: boolean;
  autoLockTimeout: number; // minutes
  requireBiometricForSensitive: boolean;
  secureTaskStorage: boolean;
}

export interface SecureTaskData {
  id: string;
  encryptedContent: string;
  checksum: string;
  timestamp: number;
}

export interface AuthenticationResult {
  success: boolean;
  biometricUsed: boolean;
  fallbackUsed: boolean;
  error?: string;
}

/**
 * Biometric Security Manager
 */
export class BiometricSecurityManager {
  private static instance: BiometricSecurityManager;
  private rnBiometrics: ReactNativeBiometrics;
  private isInitialized = false;
  private capabilities: BiometricCapabilities | null = null;
  private securitySettings: SecuritySettings;
  private encryptionKey: string | null = null;
  private lastActivity: number = Date.now();
  private isLocked = false;

  static getInstance(): BiometricSecurityManager {
    if (!BiometricSecurityManager.instance) {
      BiometricSecurityManager.instance = new BiometricSecurityManager();
    }
    return BiometricSecurityManager.instance;
  }

  constructor() {
    this.rnBiometrics = new ReactNativeBiometrics({
      allowDeviceCredentials: true,
    });
    
    this.securitySettings = {
      biometricEnabled: false,
      encryptionEnabled: true,
      autoLockTimeout: 5, // 5 minutes
      requireBiometricForSensitive: true,
      secureTaskStorage: true,
    };
    
    this.setupActivityTracking();
  }

  /**
   * Initialize biometric security system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔐 Initializing Biometric Security Manager...');
      
      // Check biometric capabilities
      this.capabilities = await this.checkBiometricCapabilities();
      
      // Load security settings
      await this.loadSecuritySettings();
      
      // Initialize encryption key
      await this.initializeEncryption();
      
      this.isInitialized = true;
      console.log('✅ Biometric Security Manager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Biometric Security Manager:', error);
      throw error;
    }
  }

  /**
   * Check device biometric capabilities
   */
  async checkBiometricCapabilities(): Promise<BiometricCapabilities> {
    try {
      const { available, biometryType } = await this.rnBiometrics.isSensorAvailable();
      
      let isEnrolled = false;
      let availableTypes: BiometryTypes[] = [];
      
      if (available) {
        // Check if biometrics are enrolled
        if (Platform.OS === 'ios') {
          isEnrolled = biometryType !== null;
          if (biometryType) {
            availableTypes = [biometryType];
          }
        } else {
          // Android
          isEnrolled = available;
          availableTypes = [BiometryTypes.Biometrics];
        }
      }
      
      return {
        isSupported: available,
        biometryType,
        isEnrolled,
        availableTypes,
      };
    } catch (error) {
      console.error('Failed to check biometric capabilities:', error);
      return {
        isSupported: false,
        biometryType: null,
        isEnrolled: false,
        availableTypes: [],
      };
    }
  }

  /**
   * Enable biometric authentication
   */
  async enableBiometricAuth(): Promise<{ success: boolean; error?: string }> {
    if (!this.capabilities?.isSupported) {
      return {
        success: false,
        error: 'Biometric authentication is not supported on this device',
      };
    }

    if (!this.capabilities.isEnrolled) {
      return {
        success: false,
        error: 'No biometric credentials are enrolled on this device',
      };
    }

    try {
      // Test biometric authentication
      const result = await this.authenticateWithBiometrics('Enable biometric authentication for secure access');
      
      if (result.success) {
        this.securitySettings.biometricEnabled = true;
        await this.saveSecuritySettings();
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || 'Biometric authentication failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to enable biometric authentication: ${error}`,
      };
    }
  }

  /**
   * Authenticate user with biometrics
   */
  async authenticateWithBiometrics(
    promptMessage = 'Authenticate to access your tasks'
  ): Promise<AuthenticationResult> {
    if (!this.capabilities?.isSupported || !this.securitySettings.biometricEnabled) {
      return {
        success: false,
        biometricUsed: false,
        fallbackUsed: false,
        error: 'Biometric authentication not available',
      };
    }

    try {
      const { success, error } = await this.rnBiometrics.simplePrompt({
        promptMessage,
        cancelButtonText: 'Cancel',
      });

      if (success) {
        this.updateActivity();
        this.isLocked = false;
        return {
          success: true,
          biometricUsed: true,
          fallbackUsed: false,
        };
      } else {
        return {
          success: false,
          biometricUsed: false,
          fallbackUsed: false,
          error: error || 'Biometric authentication cancelled',
        };
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return {
        success: false,
        biometricUsed: false,
        fallbackUsed: false,
        error: `Authentication failed: ${error}`,
      };
    }
  }

  /**
   * Encrypt sensitive task data
   */
  async encryptTaskData(taskData: any): Promise<SecureTaskData> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const dataString = JSON.stringify(taskData);
    const encryptedContent = CryptoJS.AES.encrypt(dataString, this.encryptionKey).toString();
    const checksum = CryptoJS.SHA256(dataString).toString();

    return {
      id: taskData.id,
      encryptedContent,
      checksum,
      timestamp: Date.now(),
    };
  }

  /**
   * Decrypt sensitive task data
   */
  async decryptTaskData(secureData: SecureTaskData): Promise<any> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    try {
      const decryptedBytes = CryptoJS.AES.decrypt(secureData.encryptedContent, this.encryptionKey);
      const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        throw new Error('Failed to decrypt data');
      }

      const taskData = JSON.parse(decryptedString);
      
      // Verify checksum
      const calculatedChecksum = CryptoJS.SHA256(decryptedString).toString();
      if (calculatedChecksum !== secureData.checksum) {
        throw new Error('Data integrity check failed');
      }

      return taskData;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt task data');
    }
  }

  /**
   * Store encrypted data securely
   */
  async storeSecureData(key: string, data: any): Promise<void> {
    try {
      const encryptedData = await this.encryptTaskData({ id: key, ...data });
      
      await Keychain.setInternetCredentials(
        key,
        key,
        JSON.stringify(encryptedData),
        {
          accessControl: this.securitySettings.biometricEnabled 
            ? Keychain.ACCESS_CONTROL.BIOMETRY_ANY 
            : Keychain.ACCESS_CONTROL.DEVICE_PASSCODE,
          authenticatePrompt: 'Authenticate to access secure data',
        }
      );
    } catch (error) {
      console.error('Failed to store secure data:', error);
      throw error;
    }
  }

  /**
   * Retrieve encrypted data securely
   */
  async retrieveSecureData(key: string): Promise<any> {
    try {
      const credentials = await Keychain.getInternetCredentials(key);
      
      if (credentials && credentials.password) {
        const secureData: SecureTaskData = JSON.parse(credentials.password);
        return await this.decryptTaskData(secureData);
      }
      
      return null;
    } catch (error) {
      console.error('Failed to retrieve secure data:', error);
      throw error;
    }
  }

  /**
   * Check if app should be locked
   */
  shouldLock(): boolean {
    if (!this.securitySettings.biometricEnabled) return false;
    
    const timeSinceActivity = Date.now() - this.lastActivity;
    const lockTimeout = this.securitySettings.autoLockTimeout * 60 * 1000; // Convert to milliseconds
    
    return timeSinceActivity > lockTimeout;
  }

  /**
   * Lock the application
   */
  lockApp(): void {
    this.isLocked = true;
  }

  /**
   * Check if app is currently locked
   */
  isAppLocked(): boolean {
    return this.isLocked || this.shouldLock();
  }

  /**
   * Unlock the application
   */
  async unlockApp(): Promise<AuthenticationResult> {
    if (!this.isAppLocked()) {
      return {
        success: true,
        biometricUsed: false,
        fallbackUsed: false,
      };
    }

    return await this.authenticateWithBiometrics('Unlock app to continue');
  }

  /**
   * Update security settings
   */
  async updateSecuritySettings(newSettings: Partial<SecuritySettings>): Promise<void> {
    this.securitySettings = {
      ...this.securitySettings,
      ...newSettings,
    };
    
    await this.saveSecuritySettings();
  }

  /**
   * Get current security settings
   */
  getSecuritySettings(): SecuritySettings {
    return { ...this.securitySettings };
  }

  /**
   * Get biometric capabilities
   */
  getBiometricCapabilities(): BiometricCapabilities | null {
    return this.capabilities;
  }

  /**
   * Generate secure random key
   */
  generateSecureKey(length = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Clear all secure data
   */
  async clearSecureData(): Promise<void> {
    try {
      await Keychain.resetInternetCredentials('security_settings');
      await Keychain.resetInternetCredentials('encryption_key');
      
      this.encryptionKey = null;
      this.securitySettings = {
        biometricEnabled: false,
        encryptionEnabled: true,
        autoLockTimeout: 5,
        requireBiometricForSensitive: true,
        secureTaskStorage: true,
      };
      
      console.log('✅ Secure data cleared');
    } catch (error) {
      console.error('Failed to clear secure data:', error);
      throw error;
    }
  }

  private async initializeEncryption(): Promise<void> {
    try {
      // Try to retrieve existing encryption key
      const existingKey = await this.retrieveEncryptionKey();
      
      if (existingKey) {
        this.encryptionKey = existingKey;
      } else {
        // Generate new encryption key
        this.encryptionKey = this.generateSecureKey(64);
        await this.storeEncryptionKey(this.encryptionKey);
      }
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      // Fallback to session-only encryption
      this.encryptionKey = this.generateSecureKey(64);
    }
  }

  private async storeEncryptionKey(key: string): Promise<void> {
    await Keychain.setInternetCredentials(
      'encryption_key',
      'encryption_key',
      key,
      {
        accessControl: Keychain.ACCESS_CONTROL.DEVICE_PASSCODE,
      }
    );
  }

  private async retrieveEncryptionKey(): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials('encryption_key');
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error('Failed to retrieve encryption key:', error);
      return null;
    }
  }

  private async loadSecuritySettings(): Promise<void> {
    try {
      const stored = await this.retrieveSecureData('security_settings');
      if (stored) {
        this.securitySettings = { ...this.securitySettings, ...stored };
      }
    } catch (error) {
      console.warn('Failed to load security settings, using defaults:', error);
    }
  }

  private async saveSecuritySettings(): Promise<void> {
    try {
      await this.storeSecureData('security_settings', this.securitySettings);
    } catch (error) {
      console.error('Failed to save security settings:', error);
    }
  }

  private setupActivityTracking(): void {
    // Track user activity for auto-lock
    this.updateActivity();
    
    // Set up periodic check for auto-lock
    setInterval(() => {
      if (this.shouldLock() && !this.isLocked) {
        this.lockApp();
      }
    }, 30000); // Check every 30 seconds
  }

  private updateActivity(): void {
    this.lastActivity = Date.now();
  }
}

/**
 * Secure Task Storage Manager
 */
export class SecureTaskStorage {
  private securityManager: BiometricSecurityManager;

  constructor() {
    this.securityManager = BiometricSecurityManager.getInstance();
  }

  /**
   * Store task securely
   */
  async storeTask(task: any): Promise<void> {
    const settings = this.securityManager.getSecuritySettings();
    
    if (settings.secureTaskStorage && this.isTaskSensitive(task)) {
      await this.securityManager.storeSecureData(`task_${task.id}`, task);
    } else {
      // Store normally (this would integrate with your existing storage)
      console.log('Storing task normally:', task.id);
    }
  }

  /**
   * Retrieve task securely
   */
  async retrieveTask(taskId: string): Promise<any> {
    const settings = this.securityManager.getSecuritySettings();
    
    if (settings.secureTaskStorage) {
      try {
        return await this.securityManager.retrieveSecureData(`task_${taskId}`);
      } catch (error) {
        console.warn('Failed to retrieve secure task, falling back to normal storage');
        return null;
      }
    } else {
      // Retrieve normally
      console.log('Retrieving task normally:', taskId);
      return null;
    }
  }

  /**
   * Check if task contains sensitive information
   */
  private isTaskSensitive(task: any): boolean {
    const sensitiveKeywords = [
      'password', 'pin', 'secret', 'confidential', 'private',
      'ssn', 'credit card', 'bank', 'account', 'login'
    ];
    
    const taskText = `${task.title} ${task.description || ''}`.toLowerCase();
    
    return sensitiveKeywords.some(keyword => taskText.includes(keyword));
  }
}

export default BiometricSecurityManager.getInstance();
