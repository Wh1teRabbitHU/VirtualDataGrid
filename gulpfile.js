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
	watchify   = require('watchify'),
	through    = require('through2'),
	source     = require('vinyl-source-stream'),
	buffer     = require('vinyl-buffer'),
	bsync      = require('browser-sync'),
	globify    = require('require-globify'),
	pconfig    = require('./package.json');

const APP_NAME = pconfig.name;

var SRV_ENV = 'development',
	TARGET_FOLDER = './example/assets/';

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

gulp.task('example-fonts-vendor', () => {
	return gulp.src('./app/example/vendor/fonts/**/*')
		.pipe(gulp.dest(TARGET_FOLDER));
});

gulp.task('example-css', () => {
	return gulp.src('./app/example/style/main.styl')
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(stylus())
		.pipe(concatCss('example.min.css'))
		.pipe(cleanCss())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(TARGET_FOLDER));
});

gulp.task('example-css-vendor', () => {
	return gulp.src('./app/example/vendor/css/*.css')
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(concatCss('example-vendor.min.css'))
		.pipe(cleanCss())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(TARGET_FOLDER));
});

gulp.task('project-css', () => {
	return gulp.src('./app/style/main.styl')
		.pipe(gulpif(isDevelopment(), sourcemaps.init({ loadMaps: true })))
		.pipe(stylus())
		.pipe(concatCss(CSS_FILENAME))
		.pipe(cleanCss())
		.pipe(gulpif(isDevelopment(), sourcemaps.write()))
		.pipe(gulp.dest(TARGET_FOLDER));
});

gulp.task('example-js', () => {
	return gulp.src('./app/example/script/main.js')
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(uglify())
		.pipe(sourcemaps.write())
		.pipe(rename('example.min.js'))
		.pipe(gulp.dest(TARGET_FOLDER));
});

gulp.task('example-js-vendor', () => {
	return gulp.src('./app/example/vendor/js/*.js')
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(uglify())
		.pipe(sourcemaps.write())
		.pipe(rename('example-vendor.min.js'))
		.pipe(gulp.dest(TARGET_FOLDER));
});

gulp.task('project-js', () => {
	let bundle = browserify('app/browser.js', { debug: isDevelopment() })
		.transform(globify);

	if (isDevelopment()) {
		bundle.plugin(watchify); // enable watchify
	}

	return bundle
		.bundle()
		.pipe(source(JS_FILENAME))
		.pipe(buffer())
		.pipe(gulpif(isDevelopment(), sourcemaps.init({ loadMaps: true })))
		.pipe(gulpif(!isDevelopment(), uglify()))
		.pipe(gulpif(isDevelopment(), sourcemaps.write()))
		.pipe(gulp.dest(TARGET_FOLDER))
		.pipe(bsync === null ? through.obj() : bsync.stream({ once: true }));
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

gulp.task('js', gulp.parallel('example-js', 'example-js-vendor', 'project-js'));
gulp.task('css', gulp.parallel('example-css', 'example-css-vendor', 'project-css'));

gulp.task('watch', (done) => {
	gulp.watch([ './index.js', './app/**/*.js' ], gulp.series('js', 'reload-resources'));
	gulp.watch([ './app/style/**/*', './app/example/style/**/*' ], gulp.series('css', 'reload-resources'));
	gulp.watch([ './app/example/index.html' ], gulp.series('example-static', 'reload-resources'));

	done();
});

gulp.task('compile-project', gulp.parallel('project-css', 'project-js'));
gulp.task('compile-example', gulp.parallel('example-static', 'example-fonts', 'example-fonts-vendor', 'example-css', 'example-css-vendor', 'example-js', 'example-js-vendor'));

gulp.task('compile-development', gulp.series('set-dev-enviroment', 'clean', gulp.parallel('compile-example', 'compile-project')));
gulp.task('compile-production', gulp.series('set-prod-enviroment', 'compile-project'));

gulp.task('default', gulp.series('compile-development', 'start-server', 'watch'));