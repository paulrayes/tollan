'use strict';

// Transparently support JSX
require('node-jsx').install({extension: '.jsx'});

var express = require('express');
var bodyParser = require('body-parser');
var colors = require('colors/safe');
var React = require('react');
var Router = require('react-router');
var newforms = require('newforms');
var BootstrapForm = require('newforms-bootstrap');
var bunyan = require('bunyan');

var dispatcher = require('./dispatcher');
var zen = require('./zen');

// Get our Express app instance
var app = express();

var log = bunyan.createLogger({
	name: 'tollan'
});

//app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// The application should call this function when it is done figuring out its
// configuration and has set up any Express middleware desired. This will start
// the server listening for requests.
function start(config) {
	//require('./copyright')();
	tollan.config = config;

	require('./server')(tollan);

	var server = app.listen(config.port, function() {
		var port = server.address().port;

		log.info(
			'Tollan app listening on port %s in %s mode',
			port,
			process.env.NODE_ENV
		);
		log.info(colors.blue(zen()));
	});
}

function profile(log) {
	var startTime = Date.now();
	log.info('[profile] ============ ');
	var pad = '  ';
	return function(text) {
		var time = '' + (Date.now() - startTime);
		time = pad.substring(0, pad.length - time.length) + time;
		log.info('[profile]', time, 'ms:', text);
		startTime = Date.now();
	}
}

// Public API we present to Tollan applications
var tollan = {
	dispatcher: dispatcher,
	React: React,
	Router: Router,
	newforms: newforms,
	BootstrapForm: BootstrapForm,
	express: express,
	app: app,
	start: start,
	SERVER: true,
	log: log,
	profile: profile
};

module.exports = tollan;
