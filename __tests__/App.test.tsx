import React from 'react';
import renderer from 'react-test-renderer';

jest.mock('../src/services/database', () => ({
	databaseService: { initialize: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock('../src/services/notifications', () => ({
	notificationService: { initialize: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock('../src/services/mcp/MCPService', () => ({
	__esModule: true,
	default: { initialize: jest.fn().mockResolvedValue(undefined) },
}));

describe('App', () => {
	it('renders without crashing', () => {
		const App = require('../App').default;
		const tree = renderer.create(<App />).toJSON();
		expect(tree).toBeTruthy();
	});
});
