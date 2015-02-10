'use strict';

var path = require('path');

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var colors = require('colors/safe');
var react = require('gulp-react');
var cache = require('gulp-cached');
var bunyan = require('bunyan');

var log = bunyan.createLogger({
	name: 'jshint'
});

var first = true;

var js = [
	path.normalize(process.cwd() + '/lib/**/*.{js,jsx}'),
	path.normalize(process.cwd() + '/*.{js,jsx}')
];

module.exports = function(next) {
	var startTime = Date.now();
	var failed = false;
	gulp.src(js)
		.pipe(cache('jshint'))
		.pipe(react())
		.pipe(jshint(__dirname + '/../../.jshintrc'))
		.pipe(jshint.reporter('jshint-stylish'))
		.pipe(jshint.reporter('fail'))
		.on('error', function(err) {
			failed = true;
			if (first) {
				log.fatal(err);
				throw(err);
			}
		})
		.on('finish', function() {
			first = false;
			var elapsed = (Date.now() - startTime);
			if (failed) {
				log.error(colors.red('failed in', elapsed, 'ms'));
			} else {
				log.info('passed in', elapsed, 'ms');
			}
			if (next instanceof Function) {
				next(failed);
			}
		});
};
