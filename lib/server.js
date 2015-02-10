'use strict';

var fs = require('fs');
var extend = require('util')._extend;

var React = require('react');
var Router = require('react-router');
var dot = require('dot');
var bodyParser = require('body-parser');
var querystring = require('querystring');
//var morgan = require('morgan');

//var Route = Router.Route;
//var NotFoundRoute = Router.NotFoundRoute;
//var DefaultRoute = Router.DefaultRoute;
//var Link = Router.Link;
//var RouteHandler = Router.RouteHandler;

// Where we expect client files to exist
var URLS = {
	criticalCss: '/critical.css',
	mainCss: '/main.css',
	js: '/main.js',
	vendorJs: '/vendor.js'
};

global.SERVER = true;

module.exports = function(tollan) {
	var app = tollan.app;
	var config = tollan.config;

	var debug = (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined);

	// Get the routes from the application
	var routes = config.routes;

	// Process our main page layout from the application
	// doT will convert the template into a function for cacheability
	dot.templateSettings.strip = !debug;
	var layout = dot.template(fs.readFileSync(__dirname + '/templates/layout.dot'));
	var applicationHead = false;
	var applicationBody = false;
	if (fs.existsSync('lib/templates/head.dot')) {
		applicationHead = dot.template(fs.readFileSync('lib/templates/head.dot'));
	}
	if (fs.existsSync('lib/templates/body.dot')) {
		applicationBody = dot.template(fs.readFileSync('lib/templates/body.dot'));
	}

	// Get the critical CSS from its file
	var criticalCss = fs.readFileSync('build' + URLS.criticalCss);

	// Determine whether to defer loading client assets
	// By default, it defers everything, unless one of the following is met:
	//  - NODE_ENV is development
	//  - Our application set defer* to false in its config
	var defer = {
		js: config.deferJs !== false && !debug,
		css: config.deferCss !== false && !debug,
		fonts: config.deferFonts !== false && !debug
	};

	var genericLayoutParams = {
		env: process.env.NODE_ENV,
		criticalCss: criticalCss,
		deferJs: defer.js,
		deferCss: defer.css,
		deferFonts: defer.fonts,
		criticalCssUrl: URLS.criticalCss,
		mainCssUrl: URLS.mainCss,
		jsUrl: URLS.js,
		haveVendorJs: debug,
		vendorJsUrl: URLS.vendorJs,
		defaultPageTitle: config.defaultPageTitle,
		applicationHead: '',
		applicationBody: ''
	};

	if (applicationHead) {
		genericLayoutParams.applicationHead = applicationHead(genericLayoutParams);
	}
	if (applicationBody) {
		genericLayoutParams.applicationBody = applicationBody(genericLayoutParams);
	}

	// Listen to requests
	// The application might have some middleware before this, for example to
	// serve static files; this will occur after those.
	app.all('*', function(req, res, next) {
		var profile = tollan.profile(req.log);
		var url = req.url;
		if (req.method === 'POST') {
			url += '?method=' + req.method + '&' + querystring.stringify(req.body);
		}

		// Attempt to match the requested URL to a route
		Router.run(routes, url, function(Handler, state) {
			profile('route');
			// Get the name of the found route. If it's equal to 404 then it's
			// the default not-found route, and we should return a 404 status.
			// Otherwise, the default 200 status is fine.
			var name = state.routes[state.routes.length - 1].name;
			if (name === '404') {
				res.status(404);
			}

			// Render the React component for this route to a string
			var reactElement = React.renderToString(React.createElement(Handler, {
				method: req.method,
				body: req.body
			}));
			profile('React.renderToString');

			var layoutParams = extend(
				{element: reactElement},
				genericLayoutParams
			);

			// Finally render our layout template and send that off
			var response = layout(layoutParams);
			profile('doT');
			res.send(response);
		});
	});
};
