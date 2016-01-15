var express = require('express');
var glob = require('glob');
var http = require('http');

var favicon = require('serve-favicon');
var logger = require('morgan');
var logging = require('winston');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var compress = require('compression');
var methodOverride = require('method-override');
var expstate = require('express-state');
var browserify = require('browserify-middleware');

module.exports = function(app, config) {
  var env = process.env.NODE_ENV || 'development';
  app.locals.ENV = env;
  app.locals.ENV_DEVELOPMENT = env == 'development';

  app.set('views', config.root + '/app/views');
  app.set('view engine', 'jade');

  // app.use(favicon(config.root + '/public/img/favicon.ico'));
  app.use(logger('dev'));
  // cant use body parser otherwise the proxy can't work
  //app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
     extended: true
   }));
  app.use(cookieParser());
  app.use(compress());
  app.use(express.static(config.root + '/public'));
  app.use(methodOverride());

  expstate.extend(app);

  app.use('/js', browserify(config.root + '/app/client/'));

  var controllers = glob.sync(config.root + '/app/controllers/*/**.js');
  controllers.forEach(function (controller) {
    require(controller)(app);
  });

  app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  if(app.get('env') === 'development'){
    app.use(function (err, req, res, next) {
      logging.error(err);
      res.status(err.status || 500);
      res.render('error', {
        message: err.message,
        error: err,
        title: 'error'
      });
    });
  }

  app.use(function (err, req, res, next) {
    logging.error(err);
    res.status(err.status || 500);
      res.render('error', {
        message: err.message,
        error: {},
        title: 'error'
      });
  });


  // let's override listen to make sure we listen to 'upgrade' events
  app.listen = function listen() {
    var server = http.createServer(this);

    server.on('upgrade', function(req, socket, upgradeHead) {
      // avoid hanging onto upgradeHead as this will keep the entire
      // slab buffer used by node alive
      var head = new Buffer(upgradeHead.length);
      upgradeHead.copy(head);

      res = new http.ServerResponse(req);
      req.upgradeSocket = socket;

      app(req, res)
    });

    return server.listen.apply(server, arguments);
  };

};
