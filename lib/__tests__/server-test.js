'use strict';

//jest.autoMockOff();
jest.dontMock('../server');
//jest.mock('express');
//jest.dontMock('react');
//jest.dontMock('react-router');
//jest.mock('fs');
//jest.mock('dot');
//jest.mock('react-router');

//var app = require('express')();
var app = {
	all: jest.genMockFunction()
};

//var app = jest.genMockFunction();
var config = {
	apiPrefix: '/api',
	routes: jest.genMockFunction(),
	defaultPageTitle: 'Tollan Test',
	port: 3000
};

var path = require.requireActual('path');

describe('server', function() {

	// Create mock of fs with a dummy layout for us
	var filename = path.normalize(__dirname + '/../templates/layout.dot');
	var mockFiles = [];
	mockFiles[filename] = 'layout';
	require('fs').__setMockFiles(mockFiles);

	// Set up the server
	require('../server')(app, config);

	// Do all our tests to see if it set up correctly
	it('calls application config.routes with the correct params', function() {
		//console.log(config.routes.mock);
		//console.log(config.routes.mock.calls[0][0]);
		// config.routes should be called once, with two arguments
		// Don't know how to verify that the arguments are correct...
		expect(config.routes.mock.calls.length).toBe(1);
		expect(config.routes.mock.calls[0].length).toBe(2);
		//expect(config.routes.mock.calls[0][0]).toEqual(jasmine.any(React));
		//expect(config.routes.mock.calls[0][1]).toEqual(jasmine.any(Router));
		//expect(config.routes).toBeCalledWith(jasmine.any(Function), jasmine.any(Function));
	});
	
	it('creates express catch-all middleware', function() {
		// Should call app.all once
		expect(app.all.mock.calls.length).toBe(1);

		// Should be a catch-all with callback
		expect(app.all.mock.calls[0].length).toBe(2);
		expect(app.all.mock.calls[0][0]).toBe('*');
		expect(app.all.mock.calls[0][1]).toEqual(jasmine.any(Function));
	});
});
