'use strict';

var React = require('react');
var Router = require('react-router');
var newforms = require('newforms');
var BootstrapForm = require('newforms-bootstrap');
var xhr = require('xhr');
var Promise = require('promise');

/*var Route = Router.Route;
var NotFoundRoute = Router.NotFoundRoute;
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var RouteHandler = Router.RouteHandler;*/

var dispatcher = require('./dispatcher');

function mount(config) {
	console.log('Tollan app is mounting');

	tollan.config = config;
	var appElement = document.getElementById('tollanApp');

	Router.run(config.routes, Router.HistoryLocation, function(Handler) {
		console.time('render');
		React.render(React.createElement(Handler), appElement, function() {
			console.timeEnd('render');

		});
	});
}

var api = {
	get: function(url) {
		return new Promise(function (resolve, reject) {
			xhr({
				uri: tollan.config.apiPrefix + '/' + url,
				//json: json,
				method: 'GET'
			}, function(err, resp, body) {
				if (err) {
					reject(err);
				} else {
					resolve(resp);
				}
			});
		});
	},
	getModel: function(url) {
		return new Promise(function (resolve, reject) {
			xhr({
				uri: tollan.config.apiPrefix + '/model/' + url,
				//json: json,
				method: 'GET'
			}, function(err, resp, body) {
				if (err) {
					reject(err);
				} else if (resp.statusCode >= 500) {
					reject(resp);
				} else if (resp.statusCode !== 200) {
					reject(resp);
				} else {
					resolve(JSON.parse(resp.body));
				}
			});
		});
	},
	post: function(url, json) {
		return new Promise(function (resolve, reject) {
			xhr({
				uri: tollan.config.apiPrefix + '/' + url,
				json: json,
				method: 'POST'
			}, function(err, resp, body) {
				if (err) {
					reject(err);
				} else {
					resolve(resp);
				}
			});
		});
	},
	postAction: function(url, json) {
		return new Promise(function (resolve, reject) {
			xhr({
				uri: tollan.config.apiPrefix + '/action/' + url,
				json: json,
				method: 'POST'
			}, function(err, resp, body) {
				if (err) {
					reject(err);
				} else if (resp.statusCode >= 500) {
					reject(resp);
				} else {
					resolve(resp);
				}
			});
		});
	}
};

var tollan = {
	dispatcher: dispatcher,
	React: React,
	Router: Router,
	newforms: newforms,
	BootstrapForm: BootstrapForm,
	mount: mount,
	api: api,
	SERVER: false
};

module.exports = tollan;
