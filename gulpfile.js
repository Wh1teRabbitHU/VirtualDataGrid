'use strict';

var gulp       = require('gulp'),
	gulpif     = require('gulp-if'),
	sourcemaps = require('gulp-sourcemaps'),
	stylus     = require('gulp-stylus'),
	concatCss  = require('gulp-concat-css'),
	cleanCss   = require('gulp-clean-css'),
	uglify     = require('gulp-uglify'),
	browserify = require('browserify'),
	source     = require('vinyl-source-stream'),
	buffer     = require('vinyl-buffer'),
	bsync      = require('browser-sync'),
	globify    = require('require-globify'),
	pconfig    = require('./package.json');

const APP_NAME = pconfig.name;
const VERSION = pconfig.version;

var SRV_ENV = 'development',
	TARGET_FOLDER = 'example',
	CSS_FILENAME = APP_NAME + '.min.css',
	JS_FILENAME = APP_NAME + '.min.js';

function isDevelopment() {
	return SRV_ENV === 'development';
}

function isProduction() {
	return SRV_ENV === 'production';
}

gulp.task('set-dev-enviroment', (done) => {
	SRV_ENV = 'development';
	TARGET_FOLDER = 'example';
	CSS_FILENAME = APP_NAME + '.css';
	JS_FILENAME = APP_NAME + '.js';

	done();
});

gulp.task('set-prod-enviroment', (done) => {
	SRV_ENV = 'production';
	TARGET_FOLDER = 'releases/' + VERSION;
	CSS_FILENAME = APP_NAME + '.min.css';
	JS_FILENAME = APP_NAME + '.min.js';

	done();
});

gulp.task('css', () => {
	return gulp.src('./app/css/main.styl')
		.pipe(gulpif(isDevelopment(), sourcemaps.init()))
		.pipe(stylus())
		.pipe(concatCss(CSS_FILENAME))
		.pipe(gulpif(isProduction(), cleanCss()))
		.pipe(gulpif(isDevelopment(), sourcemaps.write()))
		.pipe(gulp.dest('./' + TARGET_FOLDER + '/css'));
});

gulp.task('js', () => {
	return browserify('app/js/virtual-data-grid.js')
		.transform(globify)
		.bundle()
		.pipe(source(JS_FILENAME))
		.pipe(buffer())
		.pipe(gulpif(isDevelopment(), sourcemaps.init()))
		.pipe(gulpif(isProduction(), uglify()))
		.pipe(gulpif(isDevelopment(), sourcemaps.write()))
		.pipe(gulp.dest('./' + TARGET_FOLDER + '/js'));
});

gulp.task('start-server', (done) => {
	bsync.init({
		server: {
			baseDir: './example/'
		}
	});

	done();
});

gulp.task('reload-resources', (done) => {
	bsync.reload();

	done();
});

gulp.task('watch', (done) => {
	gulp.watch([ './index.js', './app/js/**/*' ], gulp.series('js', 'reload-resources'));
	gulp.watch('./app/css/**/*', gulp.series('css', 'reload-resources'));
	gulp.watch([
		'./example/index.html',
		'./example/js/main.js',
		'./example/css/main.css' ], gulp.series('reload-resources'));

	done();
});

gulp.task('compile', gulp.parallel('css', 'js'));

gulp.task('compile-development', gulp.series('set-dev-enviroment', 'compile'));
gulp.task('compile-production', gulp.series('set-prod-enviroment', 'compile'));

gulp.task('default', gulp.series('compile-development', 'start-server', 'watch'));