'use strict';

var gulp = require('gulp');
var jscs = require('gulp-jscs');
var colors = require('colors/safe');

module.exports = function(next) {
	var startTime = Date.now();
	var failed = false;
	gulp.src(['*.js', 'lib/**/*.{js,jsx}'])
		.pipe(jscs({
			configPath: __dirname + '/../../.jscsrc'
		}))
		.on('error', function(err) {
			var elapsed = (Date.now() - startTime);
			console.log(err.message);
			console.log(colors.red('[jscs] failed in', elapsed, 'ms'));
			failed = true;
		})
		.on('finish', function() {
			if (!failed) {
				var elapsed = (Date.now() - startTime);
				console.log(colors.green('[jscs] passed in', elapsed, 'ms'));
			}
			if (next instanceof Function) {
				next();
			}
		});
};
