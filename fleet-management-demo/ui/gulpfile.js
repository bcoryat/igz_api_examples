//
// ******* Configuration and loading third party components *******
//

var config = require('./build.config');
var gulp = require('gulp');
var path = require('path');
var less = require('gulp-less');
var lessImport = require('gulp-less-import');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var runSequence = require('run-sequence');
var eslint = require('gulp-eslint');
var gutil = require('gulp-util');
var preprocess = require('gulp-preprocess');
var minifyCss = require('gulp-cssnano');
var gulpIf = require('gulp-if');
var rev = require('gulp-rev');
var argv = require('yargs').argv;
var ngAnnotate = require('gulp-ng-annotate');
var minifyHtml = require('gulp-htmlmin');
var ngHtml2Js = require('gulp-ng-html2js');
var merge2 = require('merge2');
var uglify = require('gulp-uglify');
var revCollector = require('gulp-rev-collector');
var imagemin = require('gulp-imagemin');
var livereload = require('gulp-livereload');
var iRequire = require('./resources/installRequire');
var _ = require('lodash');
var del = require('del');
var vinylPaths = require('vinyl-paths');
var fs = require('fs');

var state = {
    isDebugMode: true,
    isProduction: false,
    isStaging: false
};

iRequire.setup(require('sync-exec'), gutil);
var previewServer = iRequire(config.resources.previewServer);
var mockBackendServer = iRequire(config.resources.mockBackendServer);
var errHandler = iRequire(config.resources.errHandler);

//
// ******* Tasks *******
//

/**
 * Clean build directory
 */
gulp.task('clean', function () {
    return gulp.src([config.build_dir])
        .pipe(vinylPaths(del));
});

/**
 * Build vendor.css (include all vendor css files)
 */
gulp.task('vendor.css', function () {
    var distFolder = config.assets_dir + '/css';
    var isProductionOrStaging = state.isProduction || state.isStaging;

    return merge2(
        gulp.src(config.vendor_files.less)
            .pipe(lessImport('bootstrap.less'))
            .pipe(less()),
        gulp.src([path.join(distFolder, 'bootstrap.css')].concat(config.vendor_files.css))
    )
        .pipe(concat(config.output_files.vendor.css))
        .pipe(gulpIf(isProductionOrStaging, minifyCss()))
        .pipe(gulpIf(isProductionOrStaging, rev()))
        .pipe(gulp.dest(distFolder))
        .pipe(gulpIf(isProductionOrStaging, rev.manifest(config.output_files.vendor.css_manifest)))
        .pipe(gulp.dest(distFolder));
});

/**
 * Build vendor.js (include all vendor js files)
 */
gulp.task('vendor.js', function () {
    var distFolder = config.assets_dir + '/js';
    var isProductionOrStaging = state.isProduction || state.isStaging;

    return gulp.src(config.vendor_files.js)
        .pipe(concat(config.output_files.vendor.js))
        .pipe(gulpIf(isProductionOrStaging, uglify()))
        .pipe(gulpIf(isProductionOrStaging, rev()))
        .pipe(gulp.dest(distFolder))
        .pipe(gulpIf(isProductionOrStaging, rev.manifest(config.output_files.vendor.js_manifest)))
        .pipe(gulp.dest(distFolder));
});

/**
 * Build app.css (include all project css files)
 */
gulp.task('app.css', function () {
    var distFolder = config.assets_dir + '/css';
    var isProductionOrStaging = state.isProduction || state.isStaging;

    return gulp
        .src(config.app_files.less_files)
        .pipe(lessImport('app.less'))
        .pipe(less({
            paths: [path.join(__dirname, 'less', 'includes')],
            compress: !state.isDebugMode || isProductionOrStaging
        }))
        .pipe(rename(config.output_files.app.css))
        .pipe(gulpIf(isProductionOrStaging, rev()))
        .pipe(gulp.dest(distFolder))
        .pipe(gulpIf(isProductionOrStaging, rev.manifest(config.output_files.app.css_manifest)))
        .pipe(gulp.dest(distFolder))
        .pipe(livereload());
});

/**
 * Build app.js (include all project js files and templates)
 */
gulp.task('app.js', function () {
    var distFolder = config.assets_dir + '/js';
    var isProductionOrStaging = state.isProduction || state.isStaging;
    var customConfig = buildConfigFromArgs();
    var configFile;

    try {
        configFile = JSON.stringify(JSON.parse(fs.readFileSync('./config.json', 'utf8')));
    }
    catch (error) {
        gutil.log(gutil.colors.yellow('Config file not found, app\'s hard-coded default config is used'));
    }

    var js = gulp.src(config.app_files.js)
        .pipe(preprocess({context: {IGZ_CUSTOM_CONFIG: customConfig || configFile || ''}}))
        .pipe(ngAnnotate());

    var templates = gulp.src(config.app_files.templates)
        .pipe(minifyHtml({
            removeComments: true,
            collapseWhitespace: true,
            collapseInlineTagWhitespace: true
        }))
        .pipe(ngHtml2Js({
            moduleName: config.app_files.templates_module_name
        }));

    return merge2(js, templates)
        .pipe(concat(config.output_files.app.js))
        .pipe(gulpIf(!state.isDebugMode || isProductionOrStaging, uglify()))
        .pipe(gulpIf(isProductionOrStaging, rev()))
        .pipe(gulp.dest(distFolder))
        .pipe(gulpIf(isProductionOrStaging, rev.manifest(config.output_files.app.js_manifest)))
        .pipe(gulp.dest(distFolder))
        .pipe(livereload());
});

/**
 * Copy all fonts to the build directory
 */
gulp.task('fonts', function () {
    var distFolder = config.assets_dir + '/fonts';

    return gulp.src(config.source_dir + '/fonts/**/*')
        .pipe(gulp.dest(distFolder));
});

/**
 * Optimize all images and copy them to the build directory
 */
gulp.task('images', function () {
    var distFolder = config.assets_dir + '/images';
    var isProductionOrStaging = state.isProduction || state.isStaging;

    return gulp.src(config.source_dir + '/images/**/*')
        .pipe(gulpIf(isProductionOrStaging, imagemin({
            optimizationLevel: 3,
            progressive: true,
            interlaced: true
        })))
        .pipe(gulp.dest(distFolder));
});

/**
 * Build index.html for ordinary use
 */
gulp.task('index.html', function () {
    return buildIndexHtml(false);
});

/**
 * Lint source code
 */
gulp.task('lint', function () {
    return gulp.src(config.app_files.js)
        .pipe(eslint())
        .pipe(eslint.format('compact'))
        .pipe(eslint.failAfterError());
});

/**
 * Serves the backend API
 */
gulp.task('serve-api', function () {
    mockBackendServer(gutil.log, argv);
});

/**
 * Serve static files
 */
gulp.task('serve-static', function () {
    previewServer.start(gutil.log, config.build_dir);
});

gulp.task('stop-server', function (next) {

    previewServer.stop();
    next();
});

/**
 * Watch for changes and build needed sources
 */
gulp.task('watcher', function () {
    errHandler.resist();
    livereload.listen();

    gulp.watch(config.app_files.less_files, function () {
        return runSequence('app.css');
    });
    gutil.log('Watching', gutil.colors.yellow('LESS'), 'files');

    var appFiles = config.app_files.js
        .concat(config.app_files.templates);
    gulp.watch(appFiles, function () {
        return runSequence('app.js');
    });
    gutil.log('Watching', gutil.colors.yellow('JavaScript'), 'files');

    gulp.watch(config.app_files.html, function () {
        return runSequence('index.html');
    });
    gutil.log('Watching', gutil.colors.yellow('HTML'), 'files');
});

//
// ******* Common parts *******
//

/**
 * Build index.html
 */
function buildIndexHtml(isVersionForTests) {
    var isProductionOrStaging = state.isProduction || state.isStaging;

    return gulp.src([config.app_files.html, config.assets_dir + '/**/*.manifest.json'])
        .pipe(gulpIf(isProductionOrStaging, revCollector()))
        .pipe(gulpIf(isVersionForTests, preprocess({context: {IGZ_TEST_E2E: true}}), preprocess()))
        .pipe(gulpIf(!state.isDebugMode || isProductionOrStaging, minifyHtml({
            removeComments: true,
            collapseWhitespace: true,
            collapseInlineTagWhitespace: true
        })))
        .pipe(gulp.dest(config.build_dir))
        .pipe(livereload());
}

function buildConfigFromArgs() {
    var config = {};

    if (argv['api-url']) {
        _.set(config, 'url.api.baseUrl', argv['api-url']);
    }

    if (argv['push-url']) {
        _.set(config, 'url.push.baseUrl', argv['push-url']);
    }

    // if at least one URL was set, create the config
    return _.isEmpty(config) ? null : JSON.stringify(config);
}

//
// ******* Task chains *******
//

/**
 * Base build task
 */
gulp.task('build', function (next) {
    runSequence('lint', 'clean', ['vendor.css', 'vendor.js'], ['app.css', 'app.js', 'fonts', 'images'], 'index.html', next);
});

/**
 * Default task
 */
gulp.task('default', function (next) {
    var mocks = ['serve-static'];

    // if (argv['serve-api'] !== false) {
    //     mocks.push('serve-api');
    // }

    runSequence('build', mocks, next);
});

/**
 * Build project, watch for changes and build needed sources
 */
gulp.task('watch', function (next) {
    runSequence('default', 'watcher', next);
});
