'use strict';

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var colors = require('colors/safe');
var react = require('gulp-react');
var cache = require('gulp-cached');

var first = true;

module.exports = function(next) {
	var startTime = Date.now();
	var failed = false;
	gulp.src(['*.js', 'lib/**/*.{js,jsx}'])
		.pipe(cache('jshint'))
		.pipe(react())
		.pipe(jshint(__dirname + '/../../.jshintrc'))
		.pipe(jshint.reporter('jshint-stylish'))
		.pipe(jshint.reporter('fail'))
		.on('error', function(err) {
			failed = true;
			if (first) {
				throw(err);
			}
		})
		.on('finish', function() {
			first = false;
			var elapsed = (Date.now() - startTime);
			if (failed) {
				console.log(colors.red('[jshint] failed in', elapsed, 'ms'));
			} else {
				console.log(colors.green('[jshint] passed in', elapsed, 'ms'));
			}
			if (next instanceof Function) {
				next(failed);
			}
		});
};
