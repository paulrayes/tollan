'use strict';

var React = require('react');
var Router = require('react-router');

/*var Route = Router.Route;
var NotFoundRoute = Router.NotFoundRoute;
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var RouteHandler = Router.RouteHandler;*/

var dispatcher = require('./dispatcher');

module.exports = {
	dispatcher: dispatcher,
	React: React,
	mount: function(config) {
		console.log('Tollan app is mounting');
		var routes = config.routes(React, Router);
		var appElement = document.getElementById('tollanApp');

		Router.run(routes, Router.HistoryLocation, function(Handler) {
			console.time('render');
			React.render(React.createElement(Handler), appElement, function() {
				console.timeEnd('render');

			});
		});
	}
};
