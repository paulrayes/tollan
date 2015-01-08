'use strict';

var React = require('react');
var Router = require('react-router');

var Route = Router.Route;
var NotFoundRoute = Router.NotFoundRoute;
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var RouteHandler = Router.RouteHandler;

module.exports = function(app, config) {

	var routes = config.routes(React, Router);

	app.all('*', function(req, res, next) {
		Router.run(routes, req.url, function(Handler, state) {
			var name = state.routes[state.routes.length-1].name;
			if (name === '404') {
				console.log('404: ' + req.url);
				res.status(404);
			} else {
				console.log('200: ' + req.url);
			}
			res.send('<!doctype html><html>' +
				'<head>' +
				'	<meta charSet="utf-8" />' +
				'	<title>Tollan Example</title>' +
				'	<meta httpEquiv="X-UA-Compatible" content="IE=edge" />' +
				'	<meta name="viewport" content="width=device-width, initial-scale=1" />' +
				'</head>' +
				'<body><div id="tollanApp">' +
				React.renderToString(React.createElement(Handler)) +
				'</div>' +
				'<script src="vendor.js"></script>' +
				'<script src="main.js"></script>' +
				'</body>' +
				'</html>');
		});
	});
};
