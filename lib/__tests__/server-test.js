'use strict';

jest.dontMock('../server');

var app = jest.genMockFunction();
var config = jest.genMockFunction();

describe('server', function() {
	it('calls application config.routes with the correct params', function() {
		require('../server')(app, config);
		console.log(config.mock);
	});
});
