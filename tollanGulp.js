'use strict';

var path = require('path');

var gulp = require('gulp');
// Used to stream bundle for further handling
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var watchify = require('watchify');
var reactify = require('reactify');
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');
var streamify = require('gulp-streamify');
var less = require('gulp-less');
var cleancss = new (require('less-plugin-clean-css'))({advanced: true});
var plumber = require('gulp-plumber');
var nodemon = require('gulp-nodemon');

// External dependencies you do not want to rebundle while developing,
// but include in your application deployment
var dependencies = [
	'react',
	'react-router'
];
// Source files
var src = path.normalize(process.cwd() + '/lib/browser.js');
var css = './lib/styles/*.{less,css}';
var assets = './lib/assets/*.*';
// Destination folder
var dest = './build/';

var dev = (process.env.NODE_ENV === 'development');
var staging = (process.env.NODE_ENV === 'staging');
var prod = (process.env.NODE_ENV === 'production');
var sourceMapping = false;

var TASK_COUNT = 4;

var tasksCompleted = 0;

var initialStart = Date.now();

var gulpNext; // Next callback for Gulp to tell it we're done with the task

// Runs nodemon once all the tasks are completed
// It won't run right away as nodemon will just restart over and over until
// everything is built, and it won't work anyway as the files will be old
// or missing.
var nodemonTask = function() {
	if (tasksCompleted < TASK_COUNT) {
		tasksCompleted++;
	}
	if (tasksCompleted === TASK_COUNT) {
		console.log(
			'Completed', tasksCompleted, 'tasks in',
			(Date.now() - initialStart) + 'ms'
			);
		tasksCompleted++;
		if (dev || staging) {
			nodemon({
				ext: 'js,jsx,dot',
				watch: ['*.*', 'node_modules/tollan/']
			})
			.on('restart', function(file) {
				console.log(file);
			});
			if (gulpNext instanceof Function) {
				gulpNext();
			}
		}
	}
};

var shell = require('shelljs');

var browserifyTask = function() {
	var bundler = browserify({
		extensions: ['.jsx'],
		entries: [src], // Only need initial file, browserify finds the deps
		transform: [reactify],
		debug: sourceMapping, // Gives us sourcemapping
		cache: {}, packageCache: {}, fullPaths: staging || dev // Requirement of watchify
	});

	if (dev) {
		// Do not include external libraries
		dependencies.forEach(function(dep) {
			bundler.external(dep);
		});

		// Watchify doesn't work in dist because we turned off fullPaths
		bundler = watchify(bundler);
	}

	var rebundle = function() {
		var updateStart = Date.now();
		// Create new bundle that uses the cache for high performance
		bundler.bundle()
			.pipe(plumber()) // Fix error handling
			.pipe(source('main.js'))
			// Uglify in dist env
			.pipe(gulpif(!dev, streamify(uglify())))
			// Write the output
			.pipe(gulp.dest(dest))
			.on('end', function() {
				console.log('Updated main.js in ' + (Date.now() - updateStart) + 'ms');
				if (staging) {
					updateStart = Date.now();
					shell.exec('discify build/main.js > build/disc.html', function(code, output) {
						if (code === 0) {
							console.log('Updated disc.html in ' + (Date.now() - updateStart) + 'ms');
						} else {
							throw(output);
						}
					});
				}
				nodemonTask();
			});
	};

	bundler.on('update', rebundle);

	rebundle();
};

/**
 * Compiles listed dependencies into vendor.js
 * No watch as these will not typically change
 * This task takes a long time as there's a lot of code here
 * There's nothing we can do to speed it up, but at least it only runs once
 */
var vendorTask = function() {
	var bundler = browserify({
		debug: sourceMapping, // Gives us sourcemapping
		require: dependencies
	});

	var rebundle = function() {
		var updateStart = Date.now();
		// Create new bundle that uses the cache for high performance
		bundler.bundle()
			.pipe(plumber()) // Fix error handling
			.pipe(source('vendor.js'))
			// Write the output
			.pipe(gulp.dest(dest))
			.on('end', function() {
				var elapsed = (Date.now() - updateStart);
				console.log('Updated vendor.js in', elapsed, 'ms');
				nodemonTask();
			});
	};

	rebundle();
};

/**
 * Compiles all our CSS into main.css
 */
var lessTask = function() {

	var rebundle = function() {
		var updateStart = Date.now();
		if (dev) {
			gulp.src(css)
				.pipe(plumber()) // Fix error handling
				// No uglify in dev env
				.pipe(less({
				}))
				.pipe(gulp.dest(dest))
				.on('end', function() {
					var elapsed = (Date.now() - updateStart);
					console.log('Updated styles.css in', elapsed, 'ms');
					nodemonTask();
				});
		} else {
			gulp.src(css)
				.pipe(plumber()) // Fix error handling
				// Uglify in dist env
				.pipe(less({
					plugins: [cleancss]
				}))
				.pipe(gulp.dest(dest))
				.on('end', function() {
					var elapsed = (Date.now() - updateStart);
					console.log('Updated styles.css in', elapsed, 'ms');
					nodemonTask();
				});
		}
	};

	rebundle();

	if (dev) {
		gulp.watch(css, rebundle);
	}
};

/**
 * Compiles all our CSS into main.css
 */
var assetsTask = function() {

	var rebundle = function() {
		var updateStart = Date.now();
		gulp.src(assets)
			.pipe(gulp.dest(dest))
			.on('end', function() {
				var elapsed = (Date.now() - updateStart);
				console.log('Updated assets in', elapsed, 'ms');
				nodemonTask();
			});
	};

	rebundle();

	if (dev) {
		gulp.watch(assets, rebundle);
	}
};

// Finally create the gulp tasks

var task = function(next) {
	gulpNext = next;
	require('./lib/copyright')();
	console.log(
		'Building front-end files for',
		process.env.NODE_ENV,
		' environment.'
	);
	browserifyTask();
	if (dev) {
		vendorTask();
	} else  {
		tasksCompleted++;
	}
	lessTask();
	assetsTask();
};

var jscs = require('./lib/gulpTasks/jscs');
var jshint = require('./lib/gulpTasks/jshint');
var recess = require('./lib/gulpTasks/recess');

var lintTask = function(next) {
	var tasksCompleted = 0;
	var TASK_COUNT = 3;
	var anyFailed = false;

	var rebundleDone = function(failed) {
		tasksCompleted++;
		anyFailed = anyFailed === true || failed === true;
		if (tasksCompleted === TASK_COUNT && next instanceof Function) {
			next(anyFailed);
		}
	};

	var rebundle = function() {
		jscs(rebundleDone);
		jshint(rebundleDone);
		recess(rebundleDone);
	};

	gulp.watch(['*.js', 'lib/**/*.{js,jsx}'], rebundle);

	rebundle();
};

module.exports = {
	gulp: gulp,
	build: task,
	lint: lintTask
};
