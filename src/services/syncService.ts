import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth, storage } from './firebase';
import { databaseService } from './database';
import { Todo, Category, Goal } from '../types';

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingChanges: number;
  syncInProgress: boolean;
}

class SyncService {
  private user: User | null = null;
  private unsubscribers: (() => void)[] = [];
  private syncStatus: SyncStatus = {
    isOnline: false,
    lastSync: null,
    pendingChanges: 0,
    syncInProgress: false
  };

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth() {
    onAuthStateChanged(auth, (user) => {
      this.user = user;
      this.syncStatus.isOnline = !!user;
      
      if (user) {
        this.setupRealtimeListeners();
        this.performInitialSync();
      } else {
        this.cleanup();
      }
    });
  }

  private async performInitialSync() {
    if (!this.user || this.syncStatus.syncInProgress) return;

    this.syncStatus.syncInProgress = true;
    
    try {
      await Promise.all([
        this.syncCategories(),
        this.syncTodos(),
        this.syncGoals()
      ]);
      
      this.syncStatus.lastSync = new Date();
      console.log('Initial sync completed successfully');
    } catch (error) {
      console.error('Initial sync failed:', error);
    } finally {
      this.syncStatus.syncInProgress = false;
    }
  }

  private setupRealtimeListeners() {
    if (!this.user) return;

    const userId = this.user.uid;

    // Listen to categories changes
    const categoriesQuery = query(
      collection(db, 'users', userId, 'categories'),
      orderBy('updatedAt', 'desc')
    );
    
    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const data = change.doc.data();
        const category = this.mapFirestoreToCategory(change.doc.id, data);
        
        if (change.type === 'added' || change.type === 'modified') {
          await this.updateLocalCategory(category);
        } else if (change.type === 'removed') {
          await databaseService.deleteCategory(change.doc.id);
        }
      });
    });

    // Listen to todos changes
    const todosQuery = query(
      collection(db, 'users', userId, 'todos'),
      orderBy('updatedAt', 'desc')
    );
    
    const unsubscribeTodos = onSnapshot(todosQuery, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const data = change.doc.data();
        const todo = this.mapFirestoreToTodo(change.doc.id, data);
        
        if (change.type === 'added' || change.type === 'modified') {
          await this.updateLocalTodo(todo);
        } else if (change.type === 'removed') {
          await databaseService.deleteTodo(change.doc.id);
        }
      });
    });

    this.unsubscribers.push(unsubscribeCategories, unsubscribeTodos);
  }

  private cleanup() {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [];
  }

  // Sync Categories
  private async syncCategories() {
    if (!this.user) return;

    const userId = this.user.uid;
    const categoriesRef = collection(db, 'users', userId, 'categories');
    
    // Get remote categories
    const remoteSnapshot = await getDocs(categoriesRef);
    const remoteCategories = remoteSnapshot.docs.map(doc => 
      this.mapFirestoreToCategory(doc.id, doc.data())
    );

    // Get local categories
    const localCategories = await databaseService.getCategories();

    // Sync logic: merge remote and local changes
    for (const remoteCategory of remoteCategories) {
      const localCategory = localCategories.find(c => c.id === remoteCategory.id);
      
      if (!localCategory) {
        // New remote category, add to local
        await this.updateLocalCategory(remoteCategory);
      } else if (remoteCategory.updatedAt > localCategory.updatedAt) {
        // Remote is newer, update local
        await this.updateLocalCategory(remoteCategory);
      }
    }

    // Upload local categories that don't exist remotely or are newer
    for (const localCategory of localCategories) {
      const remoteCategory = remoteCategories.find(c => c.id === localCategory.id);
      
      if (!remoteCategory || localCategory.updatedAt > remoteCategory.updatedAt) {
        await this.uploadCategory(localCategory);
      }
    }
  }

  // Sync Todos
  private async syncTodos() {
    if (!this.user) return;

    const userId = this.user.uid;
    const todosRef = collection(db, 'users', userId, 'todos');
    
    // Get remote todos
    const remoteSnapshot = await getDocs(todosRef);
    const remoteTodos = remoteSnapshot.docs.map(doc => 
      this.mapFirestoreToTodo(doc.id, doc.data())
    );

    // Get local todos
    const localTodos = await databaseService.getTodos();

    // Sync logic: merge remote and local changes
    for (const remoteTodo of remoteTodos) {
      const localTodo = localTodos.find(t => t.id === remoteTodo.id);
      
      if (!localTodo) {
        // New remote todo, add to local
        await this.updateLocalTodo(remoteTodo);
      } else if (remoteTodo.updatedAt > localTodo.updatedAt) {
        // Remote is newer, update local
        await this.updateLocalTodo(remoteTodo);
      }
    }

    // Upload local todos that don't exist remotely or are newer
    for (const localTodo of localTodos) {
      const remoteTodo = remoteTodos.find(t => t.id === localTodo.id);
      
      if (!remoteTodo || localTodo.updatedAt > remoteTodo.updatedAt) {
        await this.uploadTodo(localTodo);
      }
    }
  }

  // Sync Goals
  private async syncGoals() {
    if (!this.user) return;
    // Similar implementation for goals
    // TODO: Implement goal sync logic
  }

  // Upload methods
  async uploadCategory(category: Category): Promise<void> {
    if (!this.user) return;

    const userId = this.user.uid;
    const categoryRef = doc(db, 'users', userId, 'categories', category.id);
    
    const data = {
      name: category.name,
      color: category.color,
      icon: category.icon,
      parentId: category.parentId || null,
      createdAt: Timestamp.fromDate(category.createdAt),
      updatedAt: serverTimestamp()
    };

    await setDoc(categoryRef, data, { merge: true });
  }

  async uploadTodo(todo: Todo): Promise<void> {
    if (!this.user) return;

    const userId = this.user.uid;
    const todoRef = doc(db, 'users', userId, 'todos', todo.id);
    
    // Upload attachments first
    const uploadedAttachments = [];
    for (const attachment of todo.attachments) {
      if (attachment.uri.startsWith('file://') || attachment.uri.startsWith('content://')) {
        const downloadURL = await this.uploadAttachment(todo.id, attachment);
        uploadedAttachments.push({
          ...attachment,
          uri: downloadURL
        });
      } else {
        uploadedAttachments.push(attachment);
      }
    }

    const data = {
      title: todo.title,
      description: todo.description || null,
      completed: todo.completed,
      priority: todo.priority,
      status: todo.status,
      dueDate: todo.dueDate ? Timestamp.fromDate(todo.dueDate) : null,
      categoryId: todo.categoryId || null,
      parentId: todo.parentId || null,
      tags: todo.tags,
      attachments: uploadedAttachments,
      location: todo.location || null,
      estimatedTime: todo.estimatedTime || null,
      actualTime: todo.actualTime || null,
      recurring: todo.recurring || null,
      voiceMemo: todo.voiceMemo || null,
      customFields: todo.customFields,
      createdAt: Timestamp.fromDate(todo.createdAt),
      updatedAt: serverTimestamp()
    };

    await setDoc(todoRef, data, { merge: true });
  }

  private async uploadAttachment(todoId: string, attachment: any): Promise<string> {
    if (!this.user) throw new Error('User not authenticated');

    const userId = this.user.uid;
    const fileName = `${todoId}/${attachment.id}_${attachment.name}`;
    const storageRef = ref(storage, `users/${userId}/attachments/${fileName}`);

    // Convert URI to blob
    const response = await fetch(attachment.uri);
    const blob = await response.blob();

    // Upload to Firebase Storage
    await uploadBytes(storageRef, blob);
    
    // Get download URL
    return await getDownloadURL(storageRef);
  }

  // Update local data
  private async updateLocalCategory(category: Category): Promise<void> {
    try {
      // Check if category exists locally
      const localCategories = await databaseService.getCategories();
      const existingCategory = localCategories.find(c => c.id === category.id);

      if (existingCategory) {
        await databaseService.updateCategory(category.id, category);
      } else {
        await databaseService.createCategory({
          name: category.name,
          color: category.color,
          icon: category.icon,
          parentId: category.parentId
        });
      }
    } catch (error) {
      console.error('Error updating local category:', error);
    }
  }

  private async updateLocalTodo(todo: Todo): Promise<void> {
    try {
      // Check if todo exists locally
      const localTodos = await databaseService.getTodos();
      const existingTodo = localTodos.find(t => t.id === todo.id);

      if (existingTodo) {
        await databaseService.updateTodo(todo.id, todo);
      } else {
        await databaseService.createTodo({
          title: todo.title,
          description: todo.description,
          completed: todo.completed,
          priority: todo.priority,
          status: todo.status,
          dueDate: todo.dueDate,
          categoryId: todo.categoryId,
          parentId: todo.parentId,
          tags: todo.tags,
          attachments: todo.attachments,
          location: todo.location,
          estimatedTime: todo.estimatedTime,
          actualTime: todo.actualTime,
          recurring: todo.recurring,
          voiceMemo: todo.voiceMemo,
          customFields: todo.customFields
        });
      }
    } catch (error) {
      console.error('Error updating local todo:', error);
    }
  }

  // Mapping functions
  private mapFirestoreToCategory(id: string, data: any): Category {
    return {
      id,
      name: data.name,
      color: data.color,
      icon: data.icon,
      parentId: data.parentId,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  }

  private mapFirestoreToTodo(id: string, data: any): Todo {
    return {
      id,
      title: data.title,
      description: data.description,
      completed: data.completed,
      priority: data.priority,
      status: data.status,
      dueDate: data.dueDate?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      categoryId: data.categoryId,
      parentId: data.parentId,
      tags: data.tags || [],
      attachments: data.attachments || [],
      location: data.location,
      estimatedTime: data.estimatedTime,
      actualTime: data.actualTime,
      recurring: data.recurring,
      voiceMemo: data.voiceMemo,
      customFields: data.customFields || {}
    };
  }

  // Public methods
  async forceSyncAll(): Promise<void> {
    if (!this.user) {
      throw new Error('User not authenticated');
    }

    await this.performInitialSync();
  }

  async deleteRemoteTodo(todoId: string): Promise<void> {
    if (!this.user) return;

    const userId = this.user.uid;
    const todoRef = doc(db, 'users', userId, 'todos', todoId);
    
    // Delete attachments from storage
    try {
      const todoDoc = await getDoc(todoRef);
      if (todoDoc.exists()) {
        const todoData = todoDoc.data();
        if (todoData.attachments) {
          for (const attachment of todoData.attachments) {
            if (attachment.uri.includes('firebase')) {
              const attachmentRef = ref(storage, attachment.uri);
              await deleteObject(attachmentRef);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error deleting attachments:', error);
    }

    await deleteDoc(todoRef);
  }

  async deleteRemoteCategory(categoryId: string): Promise<void> {
    if (!this.user) return;

    const userId = this.user.uid;
    const categoryRef = doc(db, 'users', userId, 'categories', categoryId);
    await deleteDoc(categoryRef);
  }

  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  isOnline(): boolean {
    return this.syncStatus.isOnline;
  }
}

export const syncService = new SyncService();
export default syncService;
