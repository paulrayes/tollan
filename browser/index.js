'use strict';

var React = require('react');
var Router = require('react-router');

var Route = Router.Route;
var NotFoundRoute = Router.NotFoundRoute;
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var RouteHandler = Router.RouteHandler;

var dispatcher = require('../lib/dispatcher');

module.exports = {
	dispatcher: dispatcher,
	React: React,
	mount: function(config) {
		console.log('Tollan SPA app is mounting');
		var routes = config.routes(React, Router);
		Router.run(routes, Router.HistoryLocation, function(Handler) {
			console.time('route');
			React.render(React.createElement(Handler), document.getElementById('tollanApp'), function() {
				console.timeEnd('route');
			});
		});
	}
};
