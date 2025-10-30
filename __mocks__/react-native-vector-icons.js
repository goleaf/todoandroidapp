const React = require('react');

module.exports = new Proxy({}, {
	get: (target, name) => {
		return ({ name: _n, size: _s, color: _c }) => React.createElement('Icon', { name, size: _s, color: _c });
	},
});
