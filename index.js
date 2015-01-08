'use strict';

// Transparently support JSX
require('node-jsx').install({extension: '.jsx'});

var express = require('express');
var React = require('react');

var app = express();

var dispatcher = require('./lib/dispatcher');

module.exports = {
	dispatcher: dispatcher,
	React: React,
	app: app,
	start: function(config) {
		require('./lib/copyright')();
		require('./lib/server')(app, config);

		var server = app.listen(3000, function() {
			var host = server.address().address;
			var port = server.address().port;

			console.log('Tollan app listening at http://%s:%s', host, port);
		});
	}
};
