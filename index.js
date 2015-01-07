'use strict';

// Transparently support JSX
require('node-jsx').install({extension: '.jsx'});


var http = require('http');
var React = require('react');

var dispatcher = require('./lib/dispatcher');

module.exports = {
	dispatcher: dispatcher,
	React: React,
	start: function(config) {
		console.log(config);

		var server = require('./lib/server')(config);

		server.listen(3000);
	}
};
