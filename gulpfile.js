'use strict';

var gulp       = require('gulp'),
	gulpif     = require('gulp-if'),
	sourcemaps = require('gulp-sourcemaps'),
	stylus     = require('gulp-stylus'),
	concatCss  = require('gulp-concat-css'),
	cleanCss   = require('gulp-clean-css'),
	uglify     = require('gulp-uglify'),
	rename     = require('gulp-rename'),
	del        = require('del'),
	browserify = require('browserify'),
	source     = require('vinyl-source-stream'),
	buffer     = require('vinyl-buffer'),
	bsync      = require('browser-sync'),
	globify    = require('require-globify'),
	pconfig    = require('./package.json');

const APP_NAME = pconfig.name;

var SRV_ENV, TARGET_FOLDER;

var CSS_FILENAME = APP_NAME + '.min.css',
	JS_FILENAME = APP_NAME + '.min.js';

function isDevelopment() {
	return SRV_ENV === 'development';
}

gulp.task('set-dev-enviroment', (done) => {
	SRV_ENV = 'development';
	TARGET_FOLDER = './example/assets/';

	done();
});

gulp.task('set-prod-enviroment', (done) => {
	SRV_ENV = 'production';
	TARGET_FOLDER = './release/';

	done();
});

gulp.task('clean', () => {
	return del('./example/**/*');
});

gulp.task('example-static', () => {
	return gulp.src('./app/example/index.html')
		.pipe(gulp.dest('./example'));
});

gulp.task('example-fonts', () => {
	return gulp.src('./app/example/fonts/**/*')
		.pipe(gulp.dest(TARGET_FOLDER));
});

gulp.task('example-css', () => {
	return gulp.src('./app/example/style/main.styl')
		.pipe(sourcemaps.init())
		.pipe(stylus())
		.pipe(concatCss('example.min.css'))
		.pipe(cleanCss())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(TARGET_FOLDER));
});

gulp.task('example-css-vendor', () => {
	return gulp.src('./app/example/style/font-awesome.css')
		.pipe(sourcemaps.init())
		.pipe(concatCss('example-vendor.min.css'))
		.pipe(cleanCss())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(TARGET_FOLDER));
});

gulp.task('project-css', () => {
	return gulp.src('./app/style/main.styl')
		.pipe(gulpif(isDevelopment(), sourcemaps.init()))
		.pipe(stylus())
		.pipe(concatCss(CSS_FILENAME))
		.pipe(cleanCss())
		.pipe(gulpif(isDevelopment(), sourcemaps.write()))
		.pipe(gulp.dest(TARGET_FOLDER));
});

gulp.task('example-js', () => {
	return gulp.src('./app/example/script/main.js')
		.pipe(sourcemaps.init())
		.pipe(uglify())
		.pipe(sourcemaps.write())
		.pipe(rename('example.min.js'))
		.pipe(gulp.dest(TARGET_FOLDER));
});

gulp.task('project-js', () => {
	return browserify('app/browser.js')
		.transform(globify)
		.bundle()
		.pipe(source(JS_FILENAME))
		.pipe(buffer())
		.pipe(gulpif(isDevelopment(), sourcemaps.init()))
		.pipe(uglify())
		.pipe(gulpif(isDevelopment(), sourcemaps.write()))
		.pipe(gulp.dest(TARGET_FOLDER));
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

gulp.task('js', gulp.parallel('example-js', 'project-js'));
gulp.task('css', gulp.parallel('example-css', 'example-css-vendor', 'project-css'));

gulp.task('watch', (done) => {
	gulp.watch([ './index.js', './app/**/*.js' ], gulp.series('js', 'reload-resources'));
	gulp.watch([ './app/style/**/*', './app/example/style/**/*' ], gulp.series('css', 'reload-resources'));
	gulp.watch([ './app/example/index.html' ], gulp.series('example-static', 'reload-resources'));

	done();
});

gulp.task('compile-project', gulp.parallel('project-css', 'project-js'));
gulp.task('compile-example', gulp.parallel('example-static', 'example-fonts', 'example-css', 'example-css-vendor', 'example-js'));

gulp.task('compile-development', gulp.series('set-dev-enviroment', 'clean', gulp.parallel('compile-example', 'compile-project')));
gulp.task('compile-production', gulp.series('set-prod-enviroment', 'compile-project'));

gulp.task('default', gulp.series('compile-development', 'start-server', 'watch'));