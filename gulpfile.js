'use strict';

var gulp = require('gulp');

// jscsrc and jshintrc are based on those used by AirBnb, with modifications

var lintTask = require('./tollanGulp').lint;

gulp.task('default', function(next) {
	lintTask(function() {
		//gulp.watch(['*.js', 'lib/**/*.{js,jsx}'], lintTask);
		next();
	});
});
