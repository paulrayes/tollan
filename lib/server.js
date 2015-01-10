'use strict';

var fs = require('fs');

var React = require('react');
var Router = require('react-router');
var dot = require('dot');

var Route = Router.Route;
var NotFoundRoute = Router.NotFoundRoute;
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var RouteHandler = Router.RouteHandler;

// Where we expect client files to exist
var URLS = {
	criticalCss: 'critical.css',
	mainCss: 'main.css',
	js: 'main.js',
	vendorJs: 'vendor.js'
};

module.exports = function(app, config) {

	var debug = process.env.NODE_ENV === 'development';

	// Get the routes from the application
	var routes = config.routes(React, Router);

	// Process our main page layout from the application
	// doT will convert the template into a function for cacheability
	dot.templateSettings.strip = !debug;
	var layout = dot.template(fs.readFileSync(__dirname + '/layouts/layout.dot'));
	var applicationHead = false;
	var applicationBody = false;
	if (fs.existsSync('lib/layouts/head.dot')) {
		applicationHead = dot.template(fs.readFileSync('lib/layouts/head.dot'));
	}
	if (fs.existsSync('lib/layouts/body.dot')) {
		applicationBody = dot.template(fs.readFileSync('lib/layouts/body.dot'));
	}

	// Determine whether to defer loading client assets
	// By default, it defers everything, unless one of the following is met:
	//  - NODE_ENV is development
	//  - Our application set defer* to false in its config
	var defer = {
		js: config.deferJs !== false && !debug,
		css: config.deferCss !== false && !debug,
		fonts: config.deferFonts !== false && !debug
	};

	// Listen to requests
	// The application might have some middleware before this, for example to
	// serve static files; this will occur after those.
	app.all('*', function(req, res, next) {

		// Get the critical CSS from its file
		var criticalCss = fs.readFileSync('build/' + URLS.criticalCss);

		// Attempt to match the requested URL to a route
		Router.run(routes, req.url, function(Handler, state) {

			// Get the name of the found route. If it's equal to 404 then it's
			// the default not-found route, and we should return a 404 status.
			// Otherwise, the default 200 status is fine.
			var name = state.routes[state.routes.length-1].name;
			if (name === '404') {
				console.log('404: ' + req.url);
				res.status(404);
			} else {
				console.log('200: ' + req.url);
			}

			// Render the React component for this route to a string
			var reactElement = React.renderToString(React.createElement(Handler));

			var layoutParams = {
				element: reactElement,
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
				layoutParams.applicationHead = applicationHead(layoutParams);
			}
			if (applicationBody) {
				layoutParams.applicationBody = applicationBody(layoutParams);
			}

			// Finally render our layout template and send that off
			res.send(layout(layoutParams));
		});
	});
};
