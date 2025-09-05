import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  User,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User as AppUser } from '../types';

class AuthService {
  private currentUser: User | null = null;
  private authStateListeners: ((user: User | null) => void)[] = [];

  constructor() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      this.authStateListeners.forEach(listener => listener(user));
    });
  }

  // Email/Password Authentication
  async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await this.updateLastLogin(userCredential.user.uid);
      return userCredential.user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signUpWithEmail(email: string, password: string, displayName?: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }

      // Create user profile in Firestore
      await this.createUserProfile(userCredential.user);
      
      return userCredential.user;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  // Google Sign-In
  async signInWithGoogle(): Promise<User> {
    try {
      // This would require @react-native-google-signin/google-signin
      // For now, we'll implement a placeholder
      throw new Error('Google Sign-In not implemented yet');
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  }

  // Sign Out
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Password Reset
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  // User Profile Management
  private async createUserProfile(user: User): Promise<void> {
    const userRef = doc(db, 'users', user.uid);
    
    const userData: Partial<AppUser> = {
      id: user.uid,
      email: user.email!,
      displayName: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
      emailVerified: user.emailVerified,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      preferences: {
        defaultView: 'list',
        theme: 'auto',
        language: 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dateFormat: 'MM/dd/yyyy',
        timeFormat: '12h',
        firstDayOfWeek: 0,
        notifications: {
          enabled: true,
          soundEnabled: true,
          vibrationEnabled: true,
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
          },
          locationReminders: true,
          smartSuggestions: true
        },
        privacy: {
          biometricAuth: false,
          pinAuth: false,
          autoLock: false,
          autoLockTimeout: 5
        },
        sync: {
          enabled: true,
          autoSync: true,
          syncInterval: 5,
          cloudProvider: 'firebase'
        }
      }
    };

    await setDoc(userRef, userData);
  }

  async getUserProfile(userId: string): Promise<AppUser | null> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLoginAt: data.lastLoginAt?.toDate() || new Date()
        } as AppUser;
      }
      
      return null;
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<AppUser>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, updates);
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  }

  private async updateLastLogin(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        lastLoginAt: new Date()
      });
    } catch (error) {
      console.error('Update last login error:', error);
    }
  }

  // Auth State Management
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    this.authStateListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.authStateListeners = this.authStateListeners.filter(listener => listener !== callback);
    };
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  // Utility methods
  async refreshToken(): Promise<string | null> {
    if (this.currentUser) {
      try {
        return await this.currentUser.getIdToken(true);
      } catch (error) {
        console.error('Token refresh error:', error);
        return null;
      }
    }
    return null;
  }

  async deleteAccount(): Promise<void> {
    if (this.currentUser) {
      try {
        // Delete user data from Firestore
        const userRef = doc(db, 'users', this.currentUser.uid);
        // Note: In a real app, you'd want to delete all user data
        
        // Delete the user account
        await this.currentUser.delete();
      } catch (error) {
        console.error('Delete account error:', error);
        throw error;
      }
    }
  }
}

export const authService = new AuthService();
export default authService;
