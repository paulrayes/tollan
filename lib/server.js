'use strict';

var React = require('react');
var director = require('director');

module.exports = function(config) {

	var routes = {};

	config.routes.forEach(function(route) {
		routes[route.path] = {
			get: function() {
				console.log('200: ' + route.path);
				var view = route.view(React);
				this.res.writeHead(200, {
					'Content-Type': 'text/html',
					'Cache-Control': 'no-cache'
				});
				this.res.end(React.renderToString(React.createElement(view)));
			}
		};
	});

	var router = new director.http.Router(routes);

	var server = http.createServer(function (req, res) {
		router.dispatch(req, res, function (err) {
			if (err) {
				console.log(err.status + ': ' + err.message);
				var view = config.notFoundView(React);
				res.writeHead(404, {
					'Content-Type': 'text/html',
					'Cache-Control': 'no-cache'
				});
				this.res.end(React.renderToString(React.createElement(view, err)));
			}
		});
	});

	return server;
};
