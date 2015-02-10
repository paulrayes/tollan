'use strict';

// Not using the auto mock for react-router, it takes over a second to create
// All we need mocked is the run function anyway

var mock = {
	run: jest.genMockFunction()
};

module.exports = mock;
