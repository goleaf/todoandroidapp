import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where, orderBy, onSnapshot, writeBatch } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export class FirebaseService {
  private static instance: FirebaseService;
  private userId: string | null = null;
  private isOnline: boolean = false;

  private constructor() {
    this.setupAuth();
  }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  private setupAuth() {
    onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        this.userId = user.uid;
        this.isOnline = true;
        console.log('Firebase user authenticated:', user.uid);
      } else {
        // Sign in anonymously if no user
        signInAnonymously(auth).catch(console.error);
      }
    });
  }

  async create<T extends { id: string }>(collection: string, data: T): Promise<T> {
    if (!this.userId) throw new Error('User not authenticated');

    const docRef = doc(db, `users/${this.userId}/${collection}`, data.id);
    const item = {
      ...data,
      sync_status: 'synced',
      last_synced_at: new Date().toISOString()
    };

    await setDoc(docRef, item);
    return item;
  }

  async update<T extends { id: string }>(collection: string, id: string, updates: Partial<T>): Promise<T | null> {
    if (!this.userId) throw new Error('User not authenticated');

    const docRef = doc(db, `users/${this.userId}/${collection}`, id);
    const updateData = {
      ...updates,
      sync_status: 'synced',
      last_synced_at: new Date().toISOString()
    };

    await setDoc(docRef, updateData, { merge: true });
    
    // Return updated document
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as T : null;
  }

  async delete(collection: string, id: string): Promise<boolean> {
    if (!this.userId) throw new Error('User not authenticated');

    const docRef = doc(db, `users/${this.userId}/${collection}`, id);
    await deleteDoc(docRef);
    return true;
  }

  async getById<T>(collection: string, id: string): Promise<T | null> {
    if (!this.userId) throw new Error('User not authenticated');

    const docRef = doc(db, `users/${this.userId}/${collection}`, id);
    const docSnap = await getDoc(docRef);
    
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as T : null;
  }

  async getAll<T>(collection: string): Promise<T[]> {
    if (!this.userId) throw new Error('User not authenticated');

    const collectionRef = collection(db, `users/${this.userId}/${collection}`);
    const q = query(collectionRef, orderBy('updated_at', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[];
  }

  async query<T>(collection: string, conditions: Record<string, any>): Promise<T[]> {
    if (!this.userId) throw new Error('User not authenticated');

    const collectionRef = collection(db, `users/${this.userId}/${collection}`);
    let q = query(collectionRef);

    // Add where conditions
    Object.entries(conditions).forEach(([field, value]) => {
      q = query(q, where(field, '==', value));
    });

    q = query(q, orderBy('updated_at', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[];
  }

  // Batch operations
  async batchWrite(operations: Array<{ collection: string; operation: 'set' | 'update' | 'delete'; id: string; data?: any }>): Promise<void> {
    if (!this.userId) throw new Error('User not authenticated');

    const batch = writeBatch(db);

    operations.forEach(({ collection, operation, id, data }) => {
      const docRef = doc(db, `users/${this.userId}/${collection}`, id);
      
      switch (operation) {
        case 'set':
          batch.set(docRef, {
            ...data,
            sync_status: 'synced',
            last_synced_at: new Date().toISOString()
          });
          break;
        case 'update':
          batch.update(docRef, {
            ...data,
            sync_status: 'synced',
            last_synced_at: new Date().toISOString()
          });
          break;
        case 'delete':
          batch.delete(docRef);
          break;
      }
    });

    await batch.commit();
  }

  // Real-time listeners
  setupRealtimeListener<T>(collection: string, callback: (data: T[]) => void): () => void {
    if (!this.userId) return () => {};

    const collectionRef = collection(db, `users/${this.userId}/${collection}`);
    const q = query(collectionRef, orderBy('updated_at', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[];
      callback(data);
    });
  }

  // User management
  getCurrentUserId(): string | null {
    return this.userId;
  }

  isAuthenticated(): boolean {
    return !!this.userId;
  }

  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  async signOut(): Promise<void> {
    await auth.signOut();
    this.userId = null;
    this.isOnline = false;
  }
}

export default FirebaseService.getInstance();
