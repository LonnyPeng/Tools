var gulp = require('gulp');
var del = require('del');
var path = require('path');
var plumber = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');

var sassInheritance = require('gulp-sass-inheritance');
var sass = require('gulp-sass');
var cssnano = require('gulp-cssnano');
var autoprefixer = require('gulp-autoprefixer');
var cached = require('gulp-cached');

var changed = require('gulp-changed');
var gulpif = require('gulp-if');
var clean = require('gulp-clean');

var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');

var imagemin = require('gulp-imagemin');
var notify = require('gulp-notify');

var livereload = require('gulp-livereload');

var lec = require('gulp-line-ending-corrector');
// options
var sassOptions = {
    outputStyle: 'nested', // compressed
    errLogToConsole: true
};
var autoprefixerOptions = {
    browsers: ['> 1%', 'last 2 version', 'IE 8', 'IE 9']
};
var uglifyOptions = {
	mangle: false,
	compress: true
};
var imageminOptions = {
	progressive: true,
	svgoPlugins: [{removeViewBox: false}]
};
var plumberOptions = {
    errorHandler: notify.onError("Error: <%= error.message %>")
};
var isPartial = function (file) {
    return /_/.test(file.relative);
};

var cssInput = 'src/css/**/*.scss';
var cssOutput = 'dist/css';
var jsInput = 'src/js/**/*.js';
var jsOutput = 'dist/js';
var imgInput = 'src/**/*.*(jpg|png|gif|svg)';
var imgOutput = 'dist/';
var fontInput = 'src/css/fonts/**/*.*';
var fontOutput = 'dist/css/fonts';
var copyInput = 'src/**/*.*(mp3|swf)';
var copyOutput = 'dist/';


var errorCallback = function (error) {
    console.log(error.toString());
    this.emit('end');
};
var changeCallback = function(event) {
    console.log(event.path + ' was ' + event.type);
    if (event.type === 'deleted') {
        var filePathFromSrc = path.relative(path.resolve('src'), event.path);
        var destFilePath = path.resolve('dist', filePathFromSrc);
        del.sync(destFilePath);
    }
};

gulp.task('sass', function () {
  return gulp.src(cssInput)
    .pipe(plumber(plumberOptions))
    .pipe(cached('sass'))
    .pipe(gulpif(isPartial, sassInheritance({dir: 'src/css/'})))
    .pipe(sourcemaps.init())
    .pipe(sass(sassOptions).on('error', sass.logError))
    .pipe(cssnano({zindex: false}))
    .pipe(autoprefixer(autoprefixerOptions))
    .pipe(sourcemaps.write("../maps/css"))
    .pipe(lec({verbose:true, eolc: 'CRLF', encoding:'utf8'}))
    .pipe(gulp.dest(cssOutput))
    .pipe(livereload());
});

gulp.task('js', function() {
    gulp.src(jsInput)
        .pipe(plumber(plumberOptions))
        .pipe(sourcemaps.init())
        .pipe(changed(jsOutput))
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(uglify(uglifyOptions))
        .pipe(sourcemaps.write("../maps/js"))
        .pipe(lec({verbose:true, eolc: 'CRLF', encoding:'utf8'}))
        .pipe(gulp.dest(jsOutput));
});

gulp.task('imagemin', function() {
    return gulp.src(imgInput)
        .pipe(plumber(plumberOptions))
        .pipe(changed(imgOutput))
        .pipe(imagemin(imageminOptions))
        .pipe(gulp.dest(imgOutput));
});

gulp.task('font', function() {
    return gulp.src(fontInput)
        .pipe(plumber(plumberOptions))
        .pipe(changed(fontOutput))
        .pipe(gulp.dest(fontOutput));
});

gulp.task('copy-files', function() {
    return gulp.src(copyInput)
        .pipe(plumber(plumberOptions))
        .pipe(changed(copyOutput))
        .pipe(gulp.dest(copyOutput));
});

gulp.task('watch', function() {
    gulp.watch(cssInput, ['sass'])
        .on('change', function(event) {
            if (event.type === 'deleted') {
                var filePathFromSrc = path.relative(path.resolve('src'), event.path);
                filePathFromSrc = filePathFromSrc.replace('scss', 'css');
                var destFilePath = path.resolve('dist', filePathFromSrc);
                del.sync(destFilePath);
            }
            console.log('CSS file ' + event.path + ' was ' + event.type + ', running tasks...');
			livereload.listen();
        })
        .on('error', errorCallback);

    gulp.watch(jsInput, ['js']).on('change', changeCallback);
    gulp.watch(imgInput, ['imagemin']).on('change', changeCallback);
    gulp.watch(fontInput, ['font']).on('change', changeCallback);
	gulp.watch(copyInput, ['copy-files']).on('change', changeCallback);

});

gulp.task('default', ['sass', 'js', 'imagemin', 'font', 'copy-files', 'watch']);