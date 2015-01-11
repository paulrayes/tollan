'use strict';

var gulp = require('gulp');
var jscs = require('gulp-jscs');
var colors = require('colors/safe');
var cache = require('gulp-cached');

var first = true;

module.exports = function(next) {
	var startTime = Date.now();
	var failed = false;
	gulp.src(['*.js', 'lib/**/*.{js,jsx}'])
		.pipe(cache('jscs'))
		.pipe(jscs({
			configPath: __dirname + '/../../.jscsrc'
		}))
		.on('error', function(err) {
			console.log(err.message);
			failed = true;
			if (first) {
				throw(err);
			}
		})
		.on('finish', function() {
			first = false;
			var elapsed = (Date.now() - startTime);
			if (failed) {
				console.log(colors.red('[jscs] failed in', elapsed, 'ms'));
			} else {
				console.log(colors.green('[jscs] passed in', elapsed, 'ms'));
			}
			if (next instanceof Function) {
				next(failed);
			}
		});
};
