import reducer, { clearError, loadCategories, createCategory, updateCategory, deleteCategory } from '../../src/store/slices/categoriesSlice';
import { Category } from '../../src/types';

jest.mock('../../src/services/database', () => ({
	databaseService: {
		getAllCategories: jest.fn().mockResolvedValue([]),
		createCategory: jest.fn().mockImplementation(async (c) => ({ id: 'c1', createdAt: new Date(), updatedAt: new Date(), ...c })),
		updateCategory: jest.fn().mockImplementation(async (_id, updates) => ({ id: 'c1', name: 'Name', color: '#000', createdAt: new Date(), updatedAt: new Date(), ...updates })),
		deleteCategory: jest.fn().mockResolvedValue(undefined),
	},
}));

const initialState = {
	categories: [],
	loading: false,
	error: null as string | null,
};

describe('categoriesSlice', () => {
	it('should handle initial state', () => {
		// @ts-expect-error allow undefined state for reducer init
		expect(reducer(undefined, { type: '@@INIT' })).toMatchObject(initialState);
	});

	it('clearError should reset error', () => {
		const s1 = reducer({ ...initialState, error: 'x' } as any, clearError());
		expect(s1.error).toBeNull();
	});

	it('loadCategories thunk success', async () => {
		const dispatch = jest.fn();
		const getState = jest.fn();
		// @ts-ignore
		await loadCategories()(dispatch, getState, undefined);
		expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: loadCategories.pending.type }));
		expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: loadCategories.fulfilled.type }));
	});

	it('createCategory thunk success', async () => {
		const dispatch = jest.fn();
		const getState = jest.fn();
		const input = { name: 'New', color: '#fff' } as Omit<Category, 'id' | 'createdAt' | 'updatedAt'>;
		// @ts-ignore
		await createCategory(input)(dispatch, getState, undefined);
		expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: createCategory.fulfilled.type }));
	});

	it('deleteCategory thunk success', async () => {
		const dispatch = jest.fn();
		const getState = jest.fn();
		// @ts-ignore
		await deleteCategory('c1')(dispatch, getState, undefined);
		expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: deleteCategory.fulfilled.type }));
	});
});
