import reducer, { updateSettings, resetSettings } from '../../src/store/slices/settingsSlice';

jest.mock('../../src/services/notifications', () => ({
	notificationService: {
		scheduleDailySummary: jest.fn().mockResolvedValue(undefined),
		cancelDailySummary: jest.fn().mockResolvedValue(undefined),
		cancelAllNotifications: jest.fn().mockResolvedValue(undefined),
	},
}));

describe('settingsSlice', () => {
	it('should reset to initial state', () => {
		// @ts-expect-error allow undefined state for reducer init
		const initial = reducer(undefined, { type: '@@INIT' });
		const changed = reducer(initial, updateSettings({ theme: 'dark', notificationsEnabled: false }));
		expect(changed.theme).toBe('dark');
		expect(changed.notificationsEnabled).toBe(false);
		const reset = reducer(changed, resetSettings());
		expect(reset).toEqual(initial);
	});
});
