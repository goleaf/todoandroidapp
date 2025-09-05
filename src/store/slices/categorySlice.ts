import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Category } from '../../types';

interface CategoryState {
  categories: Category[];
  selectedCategory: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: CategoryState = {
  categories: [
    {
      id: 'personal',
      name: 'Personal',
      color: '#2196F3',
      icon: 'person',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'work',
      name: 'Work',
      color: '#FF9800',
      icon: 'work',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'shopping',
      name: 'Shopping',
      color: '#4CAF50',
      icon: 'shopping-cart',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  selectedCategory: null,
  loading: false,
  error: null,
};

const categorySlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    addCategory: (state, action: PayloadAction<Category>) => {
      state.categories.push(action.payload);
    },
    updateCategory: (state, action: PayloadAction<Category>) => {
      const index = state.categories.findIndex(cat => cat.id === action.payload.id);
      if (index !== -1) {
        state.categories[index] = action.payload;
      }
    },
    deleteCategory: (state, action: PayloadAction<string>) => {
      state.categories = state.categories.filter(cat => cat.id !== action.payload);
      // Also remove any subcategories
      state.categories = state.categories.filter(cat => cat.parentId !== action.payload);
    },
    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
    },
    addSubcategory: (state, action: PayloadAction<{ parentId: string; subcategory: Category }>) => {
      const { parentId, subcategory } = action.payload;
      subcategory.parentId = parentId;
      state.categories.push(subcategory);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  addCategory,
  updateCategory,
  deleteCategory,
  setSelectedCategory,
  addSubcategory,
  setLoading,
  setError,
} = categorySlice.actions;

export default categorySlice.reducer;
