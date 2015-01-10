'use strict';

// Transparently support JSX
require('node-jsx').install({extension: '.jsx'});

var express = require('express');
var React = require('react');

var dispatcher = require('./dispatcher');

// Get our Express app instance
var app = express();

// The application should call this function when it is done figuring out its
// configuration and has set up any Express middleware desired. This will start
// the server listening for requests.
function start(config) {
	//require('./copyright')();
	require('./server')(app, config);

	var server = app.listen(config.port, function() {
		var port = server.address().port;

		console.log(
			'Tollan app listening on port %s in %s mode',
			port,
			process.env.NODE_ENV
		);
	});
}

// Public API we present to Tollan applications
module.exports = {
	dispatcher: dispatcher,
	React: React,
	app: app,
	start: start
};
