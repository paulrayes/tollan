'use strict';

var http = require('http');

var React = require('react');
var Router = require('react-router');

var Route = Router.Route;
var NotFoundRoute = Router.NotFoundRoute;
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var RouteHandler = Router.RouteHandler;

module.exports = function(config) {

	var routes = config.routes(React, Router);

	var headers = {
		'Content-Type': 'text/html',
		'Cache-Control': 'no-cache'
	}

	var server = http.createServer(function(req, res) {
			Router.run(routes, req.url, function(Handler, state) {
				var name = state.routes[state.routes.length-1].name;
				if (name === '404') {
					console.log('404: ' + req.url);
					res.writeHead(404, headers);
				} else {
					console.log('200: ' + req.url);
					res.writeHead(200, headers);
				}
				res.end('<!doctype html>' + React.renderToString(React.createElement(Handler)));
			});
	});

	return server;
};
