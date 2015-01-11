'use strict';

var gulp = require('gulp');
var recess = require('gulp-recess');
var colors = require('colors/safe');
var cache = require('gulp-cached');

var first =  true;

module.exports = function(next) {
	var startTime = Date.now();
	var failed = false;
	gulp.src(['lib/styles/**/*.{css,less}'])
		.pipe(cache('recess'))
		.pipe(recess())
		.on('error', function(err) {
			console.log();
			console.log('[recess]', err.fileName);
			console.log(
				colors.gray('[recess] line ' + err.lineNumber + ' col ' + err.columnNumber),
				colors.cyan(err.message)
			);
			console.log();
			failed = true;
			if (first) {
				// TODO Bootstrap is erroring, don't throw until that's fixed
				//throw(err);
			}
		})
		.on('finish', function() {
			first = false;
			var elapsed = (Date.now() - startTime);
			if (failed) {
				console.log(colors.red('[recess] failed in', elapsed, 'ms'));
			} else {
				console.log(colors.green('[recess] passed in', elapsed, 'ms'));
			}
			if (next instanceof Function) {
				next(failed);
			}
		});
};
