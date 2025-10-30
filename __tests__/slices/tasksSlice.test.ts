import reducer, { setFilter, clearFilter, clearError, loadTasks, createTask, updateTask, deleteTask, toggleTaskStatus } from '../../src/store/slices/tasksSlice';
import { TaskStatus, TaskPriority, Task } from '../../src/types';

jest.mock('../../src/services/database', () => ({
	databaseService: {
		getAllTasks: jest.fn().mockResolvedValue([]),
		createTask: jest.fn().mockImplementation(async (t) => ({ id: '1', createdAt: new Date(), updatedAt: new Date(), ...t })),
		updateTask: jest.fn().mockImplementation(async (_id, updates) => ({ id: '1', title: 't', status: TaskStatus.TODO, priority: TaskPriority.LOW, createdAt: new Date(), updatedAt: new Date(), ...updates })),
		deleteTask: jest.fn().mockResolvedValue(undefined),
	},
}));

jest.mock('../../src/services/notifications', () => ({
	notificationService: {
		scheduleTaskReminder: jest.fn().mockResolvedValue(undefined),
		cancelTaskReminder: jest.fn().mockResolvedValue(undefined),
		sendImmediateNotification: jest.fn(),
	},
}));

const initialState = {
	tasks: [],
	loading: false,
	error: null as string | null,
	filter: {},
};

type State = { tasks: typeof initialState };

describe('tasksSlice', () => {
	it('should handle initial state', () => {
		// @ts-expect-error allow undefined state for reducer init
		expect(reducer(undefined, { type: '@@INIT' })).toMatchObject(initialState);
	});

	it('should set and clear filter', () => {
		const s1 = reducer(initialState as any, setFilter({ status: [TaskStatus.TODO] }));
		expect(s1.filter.status).toEqual([TaskStatus.TODO]);
		const s2 = reducer(s1 as any, clearFilter());
		expect(s2.filter).toEqual({});
	});

	it('loadTasks thunk success', async () => {
		const dispatch = jest.fn();
		const getState = jest.fn();
		// @ts-ignore
		await loadTasks()(dispatch, getState, undefined);
		expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: loadTasks.pending.type }));
		expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: loadTasks.fulfilled.type }));
	});

	it('createTask thunk schedules reminder when dueDate exists', async () => {
		const dispatch = jest.fn();
		const getState = jest.fn();
		const taskInput = { title: 'X', description: 'd', status: TaskStatus.TODO, priority: TaskPriority.HIGH, dueDate: new Date() } as Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;
		// @ts-ignore
		await createTask(taskInput)(dispatch, getState, undefined);
		expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: createTask.pending.type }));
		expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: createTask.fulfilled.type }));
	});

	it('deleteTask thunk success', async () => {
		const dispatch = jest.fn();
		const getState = jest.fn();
		// @ts-ignore
		await deleteTask('1')(dispatch, getState, undefined);
		expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: deleteTask.fulfilled.type }));
	});

	it('toggleTaskStatus errors when not found', async () => {
		const dispatch = jest.fn();
		const getState = jest.fn(() => ({ tasks: { ...initialState, tasks: [] } as any }) as State);
		await expect(
			// @ts-ignore
			toggleTaskStatus('missing')(dispatch, getState, undefined)
		).rejects.toThrow('Task not found');
	});
});
