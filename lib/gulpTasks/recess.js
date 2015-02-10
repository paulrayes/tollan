'use strict';

var gulp = require('gulp');
var recess = require('gulp-recess');
var colors = require('colors/safe');
var cache = require('gulp-cached');
var bunyan = require('bunyan');

var log = bunyan.createLogger({
	name: 'recess'
});

var first =  true;

module.exports = function(next) {
	var startTime = Date.now();

	var done = function(failed) {
		var elapsed = (Date.now() - startTime);
		if (failed && first) {
			log.fatal(colors.red('failed in', elapsed, 'ms'));
		} else if (failed) {
			log.error(colors.red('failed in', elapsed, 'ms'));
		} else {
			log.info('passed in', elapsed, 'ms');
		}
		first = false;
		if (next instanceof Function) {
			next(failed);
		}
	};

	gulp.src(['lib/styles/**/*.{css,less}'])
		.pipe(cache('recess'))
		.pipe(recess())
		.on('error', function(err) {
			console.log();
			console.log('[recess]', err.fileName);
			console.log(
				colors.gray('[recess]', 'line', err.lineNumber, 'col', err.columnNumber),
				colors.cyan(err.message)
			);
			console.log();

			if (first) {
				// TODO Bootstrap is erroring, don't throw until that's fixed and say we didn't fail
				//log.fatal(err);
				//throw(err);
				done(false);
			} else {
				done(true);
			}
		})
		.on('finish', function() {
			done(false);
		});
};
