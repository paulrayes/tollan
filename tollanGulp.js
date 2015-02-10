'use strict';

var path = require('path');
var spawn = require('child_process').spawn;

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
var shell = require('shelljs');
var bunyan = require('bunyan');

var jscs = require('./lib/gulpTasks/jscs');
var jshint = require('./lib/gulpTasks/jshint');
var recess = require('./lib/gulpTasks/recess');

var log = bunyan.createLogger({
	name: 'gulp'
});

// External dependencies you do not want to rebundle while developing,
// but include in your application deployment
var dependencies = [
	'tollan'
	//'react',
	//'react-router',
	//'newforms',
	//'newforms-bootstrap'
];
// Source files
var src = path.normalize(process.cwd() + '/lib/browser.js');
var js = [
	path.normalize(process.cwd() + '/lib/**/*.{js,jsx}'),
	path.normalize(process.cwd() + '/node_modules/tollan*/lib/**/*.{js,jsx}'),
	path.normalize(process.cwd() + '/*.{js,jsx}')
];
var css = './lib/styles/{main,critical}.less';
var assets = './lib/assets/*.*';
// Destination folder
var dest = './build/';

if (process.env.NODE_ENV === undefined) {
	process.env.NODE_ENV = 'development';
}

var dev = !(process.env.NODE_ENV !== 'development');
var staging = (process.env.NODE_ENV === 'staging');
var prod = (process.env.NODE_ENV === 'production');
var sourceMapping = false;

var TASK_COUNT = 4;

var tasksCompleted = 0;

var gulpNext; // Next callback for Gulp to tell it we're done with the task

var node; // Keeps track of the node process

// Restarts node process
// Won't start/restart it if we haven't completed at least TASK_COUNT tasks
// so that we don't start it prematurely
// TODO use nice callbacks like in the LINT tasks instead of this atrocity
var restart = function() {
	tasksCompleted++;
	if (tasksCompleted === TASK_COUNT) {
		log.info('[gulp] Completed all tasks');
	}
	if (tasksCompleted >= TASK_COUNT) {
		if (dev || staging) {
			if (node) {
				node.kill();
			}
			node = spawn('node', ['lib/index.js'], {stdio: 'inherit'});
			node.on('close', function(code) {
				if (code === 8) {
					log.info('Error detected, waiting for changes...');
				}
			});
		}
	}
	if (tasksCompleted === TASK_COUNT) {
		if (gulpNext instanceof Function) {
			gulpNext();
		}
	}
};

var browserifyTask = function() {
	var bundler = browserify({
		extensions: ['.jsx'],
		entries: [src], // Only need initial file, browserify finds the deps
		//transform: [reactify],
		debug: sourceMapping, // Gives us sourcemapping
		cache: {}, // Requirement of watchify
		packageCache: {}, // Requirement of watchify
		fullPaths: staging || dev // Requirement of watchify and discify
	});

	// Applying reactify globally so it includes things in node_modules
	bundler.transform({global: true}, reactify);

	if (dev) {
		// Do not include external libraries
		dependencies.forEach(function(dep) {
			bundler.external(dep);
		});

		// Watchify doesn't work in dist because we turned off fullPaths
		bundler = watchify(bundler);
	}

	var rebundle = function() {
		var tasksCompleted = 0;
		var TASK_COUNT = 1;//2;
		var anyFailed = false;

		/*var lintDone = function(failed) {
			tasksCompleted++;
			anyFailed = anyFailed === true || failed === true;
			if (tasksCompleted === TASK_COUNT) {
				if (anyFailed) {
					return;
				}*/
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
						log.info('[browserify] Updated main.js in ' + (Date.now() - updateStart) + 'ms');
						if (staging) {
							updateStart = Date.now();
							shell.exec('discify build/main.js > build/disc.html', function(code, output) {
								if (code === 0) {
									log.info('[discify] Updated disc.html in ' + (Date.now() - updateStart) + 'ms');
								} else {
									throw(output);
								}
							});
						}
						restart();
					});
			/*}
		}*/

		//jscs(lintDone);
		//jshint(lintDone);
	};

	gulp.watch(js, function() {
		rebundle();
		restart();
	});

	rebundle();
};

/**
 * Compiles listed dependencies into vendor.js
 * No watch as these will not typically change
 * This task takes a long time as there's a lot of code here
 * There's nothing we can do to speed it up, but at least it only runs once
 */
var vendorTask = function() {
	if (!dev) {
		restart();
		return;
	}

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
				log.info('[browserify] Updated vendor.js in', elapsed, 'ms');
				restart();
			});
	};

	rebundle();
};

/**
 * Compiles all our CSS into main.css
 */
var lessTask = function() {

	var rebundle = function() {
		recess(function(failed) {
			if (failed) {
				return;
			}
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
						log.info('[less] Updated styles in', elapsed, 'ms');
						restart();
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
						log.info('[less] Updated styles in', elapsed, 'ms');
						restart();
					});
			}
		});
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
				log.info('[gulp] Updated assets in', elapsed, 'ms');
				restart();
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
	log.info(
		'[gulp] Building front-end files for',
		process.env.NODE_ENV.toUpperCase(),
		'environment.'
	);
	browserifyTask();
	vendorTask();
	lessTask();
	assetsTask();
};

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

	gulp.watch(js, rebundle);

	rebundle();
};

module.exports = {
	gulp: gulp,
	build: task,
	lint: lintTask,
	dest: dest
};
