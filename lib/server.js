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

module.exports = function(app, config) {

	// Get the routes from the application
	var routes = config.routes(React, Router);

	// Process our main page layout from the application
	var layout = dot.template(fs.readFileSync('lib/layout.dot'));

	// Listen to requests
	app.all('*', function(req, res, next) {
		Router.run(routes, req.url, function(Handler, state) {
			var name = state.routes[state.routes.length-1].name;
			if (name === '404') {
				console.log('404: ' + req.url);
				res.status(404);
			} else {
				console.log('200: ' + req.url);
			}
			res.send(layout({
				element: React.renderToString(React.createElement(Handler))
			}));
		});
	});
};
