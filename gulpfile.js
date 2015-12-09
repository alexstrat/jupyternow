var gulp = require('gulp'),
  nodemon = require('gulp-nodemon'),
  plumber = require('gulp-plumber'),
  livereload = require('gulp-livereload'),
  less = require('gulp-less'),
  start = require('gulp-start-process'),
  gutil = require('gulp-util'),
  notifierReporter = require('mocha-notifier-reporter'),
  mocha = require('gulp-mocha');

gulp.task('less', function () {
  gulp.src('./public/css/*.less')
    .pipe(plumber())
    .pipe(less())
    .pipe(gulp.dest('./public/css'))
    .pipe(livereload());
});

gulp.task('watch', function() {
  gulp.watch('./public/css/*.less', ['less']);
});

gulp.task('develop', function () {
  livereload.listen();
  nodemon({
    script: 'app.js',
    ext: 'js coffee jade',
    nodeArgs: ['--debug'],
    stdout: false
  }).on('readable', function () {
    this.stdout.on('data', function (chunk) {
      if(/^Express server listening on port/.test(chunk)){
        livereload.changed(__dirname);
      }
    });
    this.stdout.pipe(process.stdout);
    this.stderr.pipe(process.stderr);
  });
});

gulp.task('repl', function (cb) {
  return start('nesh -e app_repl_init.js', cb);
});


function handleError(err) {
  gutil.log(err);
  this.emit('end');
}

var TEST_FILES_GLOB = './test/**/*.js';
gulp.task('test', function(){
  process.env.NODE_ENV='test';
  return gulp.src(TEST_FILES_GLOB, {read: false})
        .pipe(mocha({reporter: 'dot'}))
        .on('error', handleError);
});

gulp.task('test-watch', function() {
    gulp.watch(['./test/**/*.js', './app/**/*.js'], ['test-notify-only']);
});
// stand-alone usage
gulp.task('test-notify-only', function() {
    process.env.NODE_ENV='test';
    gulp.src(TEST_FILES_GLOB, {read: false})
        .pipe(mocha({reporter: notifierReporter.decorate('dot')}))
        .on('error', handleError);
});

gulp.task('default', [
  'less',
  'develop',
  'watch'
]);
