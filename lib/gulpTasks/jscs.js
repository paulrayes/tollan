'use strict';

var path = require('path');

var gulp = require('gulp');
var jscs = require('gulp-jscs');
var colors = require('colors/safe');
var cache = require('gulp-cached');
var bunyan = require('bunyan');

var log = bunyan.createLogger({
	name: 'jscs'
});

var first = true;

var js = [
	path.normalize(process.cwd() + '/lib/**/*.{js,jsx}'),
	path.normalize(process.cwd() + '/*.{js,jsx}')
];
console.log(js);

module.exports = function(next) {
	var startTime = Date.now();
	var failed = false;
	gulp.src(js)
		.pipe(cache('jscs'))
		.pipe(jscs({
			configPath: __dirname + '/../../.jscsrc'
		}))
		.on('error', function(err) {
			failed = true;
			if (first) {
				log.fatal(err.message);
				throw(err);
			}
		})
		.on('finish', function() {
			first = false;
			var elapsed = (Date.now() - startTime);
			if (failed) {
				log.warn(colors.red('ailed in', elapsed, 'ms'));
			} else {
				log.info('passed in', elapsed, 'ms');
			}
			if (next instanceof Function) {
				next(failed);
			}
		});
};
